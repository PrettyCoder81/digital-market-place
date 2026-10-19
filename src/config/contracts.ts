/**
 * Smart Contract Configuration
 * Contains contract addresses, ABIs, and network configuration
 * for the TonysCoin Digital Marketplace on Ethereum Sepolia
 */

// Contract Addresses
export const TONYSCOIN_ADDRESS = '0x0C3fE514a1977ea6521d705171Ebcb916ABD28Be';
export const MARKETPLACE_ADDRESS = '0x89bE3eeB9873407e46001848ea7dDE28e45c6c50';

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

// Marketplace Contract ABI - Key functions
export const MARKETPLACE_ABI = [
  // Read functions
  'function listingFee() external view returns (uint256)',
  'function platformFeeBps() external view returns (uint256)',
  'function owner() external view returns (address)',
  'function productCount() external view returns (uint256)',
  'function products(uint256 productId) external view returns (uint256 id, string name, string description, uint256 price, address owner, bool isListed)',
  'function getAccruedFees() external view returns (uint256)',
  'function getAllProducts() external view returns (tuple(uint256 id, string name, string description, uint256 price, address owner, bool isListed)[])',
  
  // Write functions
  'function createProduct(string name, string description, uint256 price) external',
  'function buyProduct(uint256 productId) external',
  'function transferProductOwnership(uint256 productId, address newOwner) external',
  'function updatePlatformFee(uint256 newFeeBps) external',
  'function withdrawPlatformFees() external',
  
  // Events
  'event ProductCreated(uint256 indexed productId, string name, uint256 price, address indexed seller)',
  'event ProductPurchased(uint256 indexed productId, address indexed buyer, uint256 price)',
  'event OwnershipTransferred(uint256 indexed productId, address indexed from, address indexed to)',
  'event PlatformFeeUpdated(uint256 oldFee, uint256 newFee)',
  'event FeesWithdrawn(address indexed owner, uint256 amount)',
];

// Default listing fee (10 TC = 10 * 10^18)
export const DEFAULT_LISTING_FEE = '10000000000000000000';

// Default platform fee (5% = 500 bps)
export const DEFAULT_PLATFORM_FEE_BPS = 500;
