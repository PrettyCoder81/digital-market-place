/**
 * Contract Interactions Utility
 * Contains all Web3 interaction functions for the marketplace
 */
import { ethers, BrowserProvider, Contract, Signer } from 'ethers';
import {
  TONYSCOIN_ADDRESS,
  MARKETPLACE_ADDRESS,
  ERC20_ABI,
  MARKETPLACE_ABI,
} from '../config/contracts';

/**
 * Get a signer from the connected wallet
 */
export async function getSigner(): Promise<Signer> {
  if (!window.ethereum) {
    throw new Error('No wallet detected. Please install MetaMask.');
  }
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer;
}

/**
 * Get contract instances
 */
export function getTonysCoinContract(signer: Signer): Contract {
  return new Contract(TONYSCOIN_ADDRESS, ERC20_ABI, signer);
}

export function getMarketplaceContract(signer: Signer): Contract {
  return new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
}

/**
 * Get TC balance for an address
 */
export async function getTCBalance(address: string): Promise<string> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(TONYSCOIN_ADDRESS, ERC20_ABI, provider);
  const balance = await contract.balanceOf(address);
  return ethers.formatEther(balance);
}

/**
 * Get the listing fee from the contract
 */
export async function getListingFee(): Promise<string> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
  const fee = await contract.listingFee();
  return ethers.formatEther(fee);
}

/**
 * Get the platform fee in basis points
 */
export async function getPlatformFeeBps(): Promise<number> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
  const fee = await contract.platformFeeBps();
  return Number(fee);
}

/**
 * Get the contract owner address
 */
export async function getContractOwner(): Promise<string> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
  return await contract.owner();
}

/**
 * Get accrued platform fees
 */
export async function getAccruedFees(): Promise<string> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
  const fees = await contract.getAccruedFees();
  return ethers.formatEther(fees);
}

/**
 * Get all products from the marketplace
 */
export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  owner: string;
  isListed: boolean;
  imageHash?: string;
}

export async function getAllProducts(): Promise<Product[]> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
  
  try {
    const products = await contract.getAllProducts();
    return products.map((p: any) => ({
      id: Number(p.id),
      name: p.name,
      description: p.description,
      price: ethers.formatEther(p.price),
      owner: p.owner,
      isListed: p.isListed,
    }));
  } catch {
    // Fallback: try to get products one by one
    const productCount = await contract.productCount();
    const count = Number(productCount);
    const products: Product[] = [];
    
    for (let i = 1; i <= count; i++) {
      try {
        const p = await contract.products(i);
        products.push({
          id: i,
          name: p.name,
          description: p.description,
          price: ethers.formatEther(p.price),
          owner: p.owner,
          isListed: p.isListed,
        });
      } catch (e) {
        console.warn(`Failed to fetch product ${i}:`, e);
      }
    }
    return products;
  }
}

/**
 * Approve TonysCoin spending for the marketplace
 * @param amount - Amount in TC (human-readable, e.g., "10")
 * @param onStatus - Callback for status updates
 */
export async function approveToken(
  amount: string,
  onStatus?: (status: string) => void
): Promise<string> {
  const signer = await getSigner();
  const tcContract = getTonysCoinContract(signer);
  
  onStatus?.('Approving TonysCoin spending...');
  
  const amountWei = ethers.parseEther(amount);
  const tx = await tcContract.approve(MARKETPLACE_ADDRESS, amountWei);
  
  onStatus?.('Waiting for approval confirmation...');
  const receipt = await tx.wait();
  
  return receipt.hash;
}

/**
 * Create a new product listing
 * @param name - Product name
 * @param description - Product description
 * @param price - Price in TC (human-readable)
 * @param onStatus - Callback for status updates
 */
export async function createProduct(
  name: string,
  description: string,
  price: string,
  onStatus?: (status: string) => void
): Promise<string> {
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);
  
  const priceWei = ethers.parseEther(price);
  
  onStatus?.('Creating product on blockchain...');
  const tx = await marketplace.createProduct(name, description, priceWei);
  
  onStatus?.('Waiting for transaction confirmation...');
  const receipt = await tx.wait();
  
  return receipt.hash;
}

/**
 * Buy a product from the marketplace
 * @param productId - The product ID to purchase
 * @param price - Price in TC (human-readable) for approval
 * @param onStatus - Callback for status updates
 */
export async function buyProduct(
  productId: number,
  price: string,
  onStatus?: (status: string) => void
): Promise<string> {
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);
  
  onStatus?.('Purchasing product...');
  const tx = await marketplace.buyProduct(productId);
  
  onStatus?.('Waiting for purchase confirmation...');
  const receipt = await tx.wait();
  
  return receipt.hash;
}

/**
 * Transfer product ownership to a new address
 * @param productId - The product ID to transfer
 * @param newOwner - The new owner's wallet address
 * @param onStatus - Callback for status updates
 */
export async function transferOwnership(
  productId: number,
  newOwner: string,
  onStatus?: (status: string) => void
): Promise<string> {
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);
  
  onStatus?.('Transferring ownership...');
  const tx = await marketplace.transferProductOwnership(productId, newOwner);
  
  onStatus?.('Waiting for transfer confirmation...');
  const receipt = await tx.wait();
  
  return receipt.hash;
}

/**
 * Update platform fee (owner only)
 * @param newFeeBps - New fee in basis points (100 = 1%, 10000 = 100%)
 * @param onStatus - Callback for status updates
 */
export async function updatePlatformFee(
  newFeeBps: number,
  onStatus?: (status: string) => void
): Promise<string> {
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);
  
  onStatus?.('Updating platform fee...');
  const tx = await marketplace.updatePlatformFee(newFeeBps);
  
  onStatus?.('Waiting for confirmation...');
  const receipt = await tx.wait();
  
  return receipt.hash;
}

/**
 * Withdraw platform fees (owner only)
 * @param onStatus - Callback for status updates
 */
export async function withdrawFees(
  onStatus?: (status: string) => void
): Promise<string> {
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);
  
  onStatus?.('Withdrawing platform fees...');
  const tx = await marketplace.withdrawPlatformFees();
  
  onStatus?.('Waiting for withdrawal confirmation...');
  const receipt = await tx.wait();
  
  return receipt.hash;
}

/**
 * Check allowance for marketplace
 */
export async function checkAllowance(ownerAddress: string): Promise<string> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(TONYSCOIN_ADDRESS, ERC20_ABI, provider);
  const allowance = await contract.allowance(ownerAddress, MARKETPLACE_ADDRESS);
  return ethers.formatEther(allowance);
}

/**
 * Switch to Sepolia network
 */
export async function switchToSepolia(): Promise<void> {
  if (!window.ethereum) throw new Error('No wallet detected');
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      // Chain not added, add it
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xaa36a7',
          chainName: 'Sepolia Testnet',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://rpc.sepolia.org'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      });
    } else {
      throw error;
    }
  }
}
