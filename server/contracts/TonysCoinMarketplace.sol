// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TonysCoinMarketplace
 * @dev Decentralized marketplace for digital products using TonysCoin (TC) as payment
 * @notice Deployed on Ethereum Sepolia at 0x89bE3eeB9873407e46001848ea7dDE28e45c6c50
 * 
 * KEY BEHAVIORS:
 * 1. listingFee: Defaults to 10 * 10^18 (10 TC). Users MUST call `approve` on the 
 *    TonysCoin contract for the Marketplace address before calling `createProduct`.
 * 2. buyProduct: Buyers MUST call `approve` on the TonysCoin contract for the 
 *    Marketplace address before buying. The contract automatically deducts the 
 *    `platformFeeBps` (default 5%) and sends the rest to the seller.
 * 3. transferProductOwnership: Transfers ownership to a new address without any 
 *    token payment (but still requires a blockchain transaction and gas).
 * 4. withdrawPlatformFees: Only callable by the contract owner to withdraw 
 *    accrued TC fees.
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TonysCoinMarketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // TonysCoin (TC) ERC-20 token
    IERC20 public tonysCoin;

    // Listing fee in TC (default: 10 TC)
    uint256 public listingFee = 10 * 10**18;

    // Platform fee in basis points (default: 500 = 5%)
    uint256 public platformFeeBps = 500;

    // Max basis points (100%)
    uint256 public constant MAX_BPS = 10000;

    // Product counter
    uint256 public productCount;

    // Accrued platform fees
    uint256 public accruedFees;

    struct Product {
        uint256 id;
        string name;
        string description;
        uint256 price;
        address owner;
        bool isListed;
    }

    // Mapping from product ID to Product
    mapping(uint256 => Product) public products;

    // Events
    event ProductCreated(uint256 indexed productId, string name, uint256 price, address indexed seller);
    event ProductPurchased(uint256 indexed productId, address indexed buyer, uint256 price);
    event OwnershipTransferred(uint256 indexed productId, address indexed from, address indexed to);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed owner, uint256 amount);
    event ListingFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor(address _tonysCoin) Ownable(msg.sender) {
        tonysCoin = IERC20(_tonysCoin);
    }

    /**
     * @dev Create a new product listing
     * @param name Product name
     * @param description Product description
     * @param price Price in TC (wei denomination)
     * 
     * PREREQUISITE: Caller must approve `listingFee` amount of TC for this contract
     */
    function createProduct(
        string memory name,
        string memory description,
        uint256 price
    ) external nonReentrant {
        require(bytes(name).length > 0, "Name required");
        require(price > 0, "Price must be > 0");

        // Transfer listing fee from seller to contract
        tonysCoin.safeTransferFrom(msg.sender, address(this), listingFee);
        accruedFees += listingFee;

        productCount++;
        products[productCount] = Product({
            id: productCount,
            name: name,
            description: description,
            price: price,
            owner: msg.sender,
            isListed: true
        });

        emit ProductCreated(productCount, name, price, msg.sender);
    }

    /**
     * @dev Buy a listed product
     * @param productId The ID of the product to purchase
     * 
     * PREREQUISITE: Caller must approve `price` amount of TC for this contract
     * The contract deducts platformFeeBps and sends the rest to the seller
     */
    function buyProduct(uint256 productId) external nonReentrant {
        Product storage product = products[productId];
        require(product.isListed, "Product not listed");
        require(product.owner != msg.sender, "Cannot buy own product");

        // Calculate fees
        uint256 platformFee = (product.price * platformFeeBps) / MAX_BPS;
        uint256 sellerAmount = product.price - platformFee;

        // Transfer tokens from buyer
        tonysCoin.safeTransferFrom(msg.sender, address(this), product.price);

        // Track accrued fees
        accruedFees += platformFee;

        // Pay seller
        tonysCoin.safeTransfer(product.owner, sellerAmount);

        // Update product state
        product.isListed = false;

        emit ProductPurchased(productId, msg.sender, product.price);
    }

    /**
     * @dev Transfer product ownership (no payment required)
     * @param productId The product ID
     * @param newOwner The new owner's address
     */
    function transferProductOwnership(uint256 productId, address newOwner) external nonReentrant {
        Product storage product = products[productId];
        require(product.owner == msg.sender, "Not the owner");
        require(newOwner != address(0), "Invalid address");

        address previousOwner = product.owner;
        product.owner = newOwner;

        emit OwnershipTransferred(productId, previousOwner, newOwner);
    }

    /**
     * @dev Update the platform fee (owner only)
     * @param newFeeBps New fee in basis points
     */
    function updatePlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_BPS, "Fee too high");
        uint256 oldFee = platformFeeBps;
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @dev Withdraw accrued platform fees (owner only)
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = accruedFees;
        require(amount > 0, "No fees to withdraw");

        accruedFees = 0;
        tonysCoin.safeTransfer(owner(), amount);

        emit FeesWithdrawn(owner(), amount);
    }

    /**
     * @dev Get all products as an array
     */
    function getAllProducts() external view returns (Product[] memory) {
        Product[] memory allProducts = new Product[](productCount);
        for (uint256 i = 1; i <= productCount; i++) {
            allProducts[i - 1] = products[i];
        }
        return allProducts;
    }

    /**
     * @dev Get accrued fees
     */
    function getAccruedFees() external view returns (uint256) {
        return accruedFees;
    }
}
