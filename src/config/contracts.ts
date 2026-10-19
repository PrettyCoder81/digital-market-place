/**
 * Smart Contract Configuration
 * Contains contract addresses, ABIs, and network configuration
 * for the TonysCoin Digital Marketplace on Ethereum Sepolia
 */

// PINATA
export const PINATA_GATEWAY="turquoise-deep-takin-179.mypinata.cloud"

// Contract Addresses
export const TONYSCOIN_ADDRESS = '0x0C3fE514a1977ea6521d705171Ebcb916ABD28Be';
export const MARKETPLACE_ADDRESS = '0x58B8C864484eba2121Ec2dFE58b925dA9F250025';

// Network Configuration
export const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex
export const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;
export const SEPOLIA_NETWORK_NAME = 'Sepolia Testnet';
export const SEPOLIA_RPC_URL = 'https://rpc.sepolia.org';
export const SEPOLIA_BLOCK_EXPLORER = 'https://sepolia.etherscan.io';

// ERC-20 ABI (TonysCoin) - Minimal ABI for approve, allowance, balanceOf, symbol, decimals
export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
];

/**
 * Marketplace Contract ABI - DigitalMarketPlace
 * Matches the deployed Solidity contract exactly.
 * 
 * Key behaviors:
 * - createProduct(name, description, price, imageURI): requires listingFee approval
 * - buyProduct(productId): requires price approval; contract does 2 safeTransferFrom calls
 *   (one to seller for price-fee, one to self for fee)
 * - transferProductOwnership(productId, newOwner): sets listed=false, no token cost
 * - withdrawPlatformFees(recipient, amount): owner-only, withdraws accrued fees
 * - setPlatformFee(newFeeBps): owner-only
 * - setListingFee(newFee): owner-only
 * - setListing(productId, isListed): owner-only toggle
 * - updateProduct(productId, name, description, price, imageURI): owner-only update
 */
export const MARKETPLACE_ABI = [
  // Read functions
  'function paymentToken() external view returns (address)',
  'function platformFeeBps() external view returns (uint256)',
  'function listingFee() external view returns (uint256)',
  'function nextProductId() external view returns (uint256)',
  'function accruedPlatformFees() external view returns (uint256)',
  'function owner() external view returns (address)',
  'function FEE_DENOMINATOR() external view returns (uint256)',
  'function MAX_FEE_BPS() external view returns (uint256)',
  'function getProduct(uint256 productId) external view returns (tuple(uint256 id, string name, string description, uint256 price, string imageURI, address owner, bool listed, uint256 createdAt))',
  'function getAllProducts() external view returns (tuple(uint256 id, string name, string description, uint256 price, string imageURI, address owner, bool listed, uint256 createdAt)[])',
  
  // Write functions
  'function createProduct(string name, string description, uint256 price, string imageURI) external returns (uint256)',
  'function buyProduct(uint256 productId) external',
  'function transferProductOwnership(uint256 productId, address newOwner) external',
  'function setPlatformFee(uint256 newFeeBps) external',
  'function setListingFee(uint256 newFee) external',
  'function setListing(uint256 productId, bool isListed) external',
  'function updateProduct(uint256 productId, string name, string description, uint256 price, string imageURI) external',
  'function withdrawPlatformFees(address recipient, uint256 amount) external',
  
  // Events
  'event ProductCreated(uint256 indexed productId, address indexed owner, uint256 price)',
  'event ProductUpdated(uint256 indexed productId)',
  'event ProductListingChanged(uint256 indexed productId, bool listed)',
  'event ProductPurchased(uint256 indexed productId, address indexed buyer, address indexed seller, uint256 price, uint256 fee)',
  'event ProductOwnershipTransferred(uint256 indexed productId, address indexed previousOwner, address indexed newOwner)',
  'event PlatformFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps)',
  'event ListingFeeUpdated(uint256 oldFee, uint256 newFee)',
  'event PlatformFeesWithdrawn(address indexed recipient, uint256 amount)',
];

// Default listing fee (10 TC = 10 * 10^18)
export const DEFAULT_LISTING_FEE = '10000000000000000000';

// Default platform fee (5% = 500 bps)
export const DEFAULT_PLATFORM_FEE_BPS = 500;
