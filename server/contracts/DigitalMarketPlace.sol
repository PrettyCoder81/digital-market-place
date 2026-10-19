// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DigitalMarketPlace
 * @dev Decentralized marketplace for digital products using TonysCoin (TC) as payment
 * @notice Deployed on Ethereum Sepolia at 0x89bE3eeB9873407e46001848ea7dDE28e45c6c50
 * 
 * KEY BEHAVIORS:
 * 1. listingFee: Defaults to 10 * 10^18 (10 TC). Users MUST call `approve` on the 
 *    TonysCoin contract for the Marketplace address before calling `createProduct`.
 * 2. buyProduct: Buyers MUST call `approve` on the TonysCoin contract for the 
 *    Marketplace address for the FULL product price. The contract then does TWO 
 *    safeTransferFrom calls:
 *    - (price - fee) → seller
 *    - fee → marketplace (platform fee)
 * 3. transferProductOwnership: Transfers ownership to a new address without any 
 *    token payment (but still requires a blockchain transaction and gas).
 *    Also sets listed=false automatically.
 * 4. withdrawPlatformFees: Only callable by the contract owner. Takes (recipient, amount).
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract DigitalMarketPlace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable paymentToken;

    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant MAX_FEE_BPS = 10_000; // 100%
    uint256 public platformFeeBps = 500; // 5%
    
    uint256 public listingFee = 10 * 10**18; // Default 10 Tokens

    uint256 public nextProductId = 1;
    uint256 public accruedPlatformFees;

    struct Product {
        uint256 id;
        string name;
        string description;
        uint256 price;
        string imageURI;
        address owner;
        bool listed;
        uint256 createdAt;
    }

    mapping(uint256 => Product) private products;

    event ProductCreated(uint256 indexed productId, address indexed owner, uint256 price);
    event ProductUpdated(uint256 indexed productId);
    event ProductListingChanged(uint256 indexed productId, bool listed);
    event ProductPurchased(uint256 indexed productId, address indexed buyer, address indexed seller, uint256 price, uint256 fee);
    event ProductOwnershipTransferred(uint256 indexed productId, address indexed previousOwner, address indexed newOwner);
    event PlatformFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event ListingFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformFeesWithdrawn(address indexed recipient, uint256 amount);

    constructor(address tokenAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Invalid token address");
        paymentToken = IERC20(tokenAddress);
    }

    function createProduct(string calldata name, string calldata description, uint256 price, string calldata imageURI) external returns (uint256 productId) {
        require(bytes(name).length > 0, "Name required");
        require(price > 0, "Price must be positive");
        require(bytes(imageURI).length > 0, "Image URI required");

        // Deduct listing fee from creator
        paymentToken.safeTransferFrom(msg.sender, address(this), listingFee);

        productId = nextProductId++;
        products[productId] = Product({
            id: productId,
            name: name,
            description: description,
            price: price,
            imageURI: imageURI,
            owner: msg.sender,
            listed: true,
            createdAt: block.timestamp
        });

        emit ProductCreated(productId, msg.sender, price);
    }

    function getProduct(uint256 productId) external view returns (Product memory) {
        require(products[productId].id != 0, "Product not found");
        return products[productId];
    }

    function getAllProducts() external view returns (Product[] memory) {
        Product[] memory allProducts = new Product[](nextProductId - 1);
        for (uint256 i = 1; i < nextProductId; i++) {
            if (products[i].id != 0) {
                allProducts[i - 1] = products[i];
            }
        }
        return allProducts;
    }

    function updateProduct(uint256 productId, string calldata name, string calldata description, uint256 price, string calldata imageURI) external {
        Product storage p = products[productId];
        require(p.id != 0, "Product not found");
        require(p.owner == msg.sender, "Not product owner");
        require(bytes(name).length > 0, "Name required");
        require(price > 0, "Price must be positive");
        require(bytes(imageURI).length > 0, "Image URI required");

        p.name = name;
        p.description = description;
        p.price = price;
        p.imageURI = imageURI;
        emit ProductUpdated(productId);
    }

    function setListing(uint256 productId, bool isListed) external {
        Product storage p = products[productId];
        require(p.id != 0, "Product not found");
        require(p.owner == msg.sender, "Not product owner");
        p.listed = isListed;
        emit ProductListingChanged(productId, isListed);
    }

    function buyProduct(uint256 productId) external nonReentrant {
        Product storage p = products[productId];
        require(p.id != 0, "Product not found");
        require(p.listed, "Product not listed");
        require(p.owner != msg.sender, "Cannot buy own product");

        address seller = p.owner;
        uint256 price = p.price;
        uint256 fee = (price * platformFeeBps) / FEE_DENOMINATOR;
        uint256 sellerAmount = price - fee;

        p.listed = false;
        p.owner = msg.sender;

        // Two transfers: seller gets (price - fee), platform gets fee
        paymentToken.safeTransferFrom(msg.sender, seller, sellerAmount);
        paymentToken.safeTransferFrom(msg.sender, address(this), fee);
        accruedPlatformFees += fee;

        emit ProductPurchased(productId, msg.sender, seller, price, fee);
    }

    function transferProductOwnership(uint256 productId, address newOwner) external {
        Product storage p = products[productId];
        require(p.id != 0, "Product not found");
        require(p.owner == msg.sender, "Not product owner");
        require(newOwner != address(0), "Invalid recipient");
        require(newOwner != msg.sender, "Already owner");

        address previousOwner = p.owner;
        p.owner = newOwner;
        p.listed = false; // Auto-delist on transfer

        emit ProductOwnershipTransferred(productId, previousOwner, newOwner);
        emit ProductListingChanged(productId, false);
    }

    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee exceeds maximum");
        uint256 oldFeeBps = platformFeeBps;
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(oldFeeBps, newFeeBps);
    }

    function setListingFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = listingFee;
        listingFee = newFee;
        emit ListingFeeUpdated(oldFee, newFee);
    }

    function withdrawPlatformFees(address recipient, uint256 amount) external onlyOwner nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        require(amount <= accruedPlatformFees, "Insufficient fee balance");

        accruedPlatformFees -= amount;
        paymentToken.safeTransfer(recipient, amount);
        emit PlatformFeesWithdrawn(recipient, amount);
    }
}
