/**
 * Contract Interactions Utility
 * Contains all Web3 interaction functions for the DigitalMarketPlace contract
 * 
 * Contract: DigitalMarketPlace on Ethereum Sepolia
 * Payment Token: TonysCoin (TC) ERC-20
 * 
 * Key behaviors:
 * - createProduct: requires listingFee approval (10 TC)
 * - buyProduct: requires full price approval; contract splits payment to seller + platform fee
 * - transferProductOwnership: no token cost, just gas
 * - withdrawPlatformFees: owner-only, takes (recipient, amount)
 */
import { ethers, BrowserProvider, Contract, Signer } from 'ethers';
import {
  TONYSCOIN_ADDRESS,
  MARKETPLACE_ADDRESS,
  ERC20_ABI,
  MARKETPLACE_ABI,
} from '../config/contracts';
import { logTransaction, TransactionLogPayload } from './apiClient';

/**
 * Best-effort: save a confirmed on-chain transaction to MongoDB via the
 * backend API. Never throws — a logging failure must not break the Web3 flow.
 */
async function saveTransaction(payload: TransactionLogPayload): Promise<void> {
  try {
    await logTransaction(payload);
  } catch (e) {
    console.warn('Failed to save transaction to backend:', e);
  }
}

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
 * Get accrued platform fees (public variable)
 */
export async function getAccruedFees(): Promise<string> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
  const fees = await contract.accruedPlatformFees();
  return ethers.formatEther(fees);
}

/**
 * Product type matching the Solidity struct
 */
export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  imageURI: string;
  owner: string;
  listed: boolean;
  createdAt: number;
}

/**
 * Get all products from the marketplace
 */
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
      imageURI: p.imageURI,
      owner: p.owner,
      listed: p.listed,
      createdAt: Number(p.createdAt),
    }));
  } catch {
    // Fallback: try to get products one by one
    const nextId = await contract.nextProductId();
    const count = Number(nextId);
    const products: Product[] = [];
    
    for (let i = 1; i < count; i++) {
      try {
        const p = await contract.getProduct(i);
        products.push({
          id: Number(p.id),
          name: p.name,
          description: p.description,
          price: ethers.formatEther(p.price),
          imageURI: p.imageURI,
          owner: p.owner,
          listed: p.listed,
          createdAt: Number(p.createdAt),
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
 * @param imageURI - IPFS URI or URL for the product image
 * @param onStatus - Callback for status updates
 */
export async function createProduct(
  name: string,
  description: string,
  price: string,
  imageURI: string,
  onStatus?: (status: string) => void
): Promise<string> {
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);
  
  const priceWei = ethers.parseEther(price);
  
  onStatus?.('Creating product on blockchain...');
  const tx = await marketplace.createProduct(name, description, priceWei, imageURI);
  
  onStatus?.('Waiting for transaction confirmation...');
  const receipt = await tx.wait();

  // Save the confirmed transaction to MongoDB via the backend API
  let productId: number | undefined;
  let amount = '0';
  try {
    const created = receipt.logs
      .map((log: any) => {
        try { return marketplace.interface.parseLog(log); } catch { return null; }
      })
      .find((e: any) => e?.name === 'ProductCreated');
    if (created) {
      productId = Number(created.args.productId);
      amount = ethers.formatEther(created.args.price);
    }
  } catch (e) {
    console.warn('Could not parse ProductCreated event:', e);
  }
  await saveTransaction({
    txHash: receipt.hash,
    type: 'CREATE',
    from: await signer.getAddress(),
    productId,
    amount,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed?.toString(),
    status: receipt.status === 1 ? 'confirmed' : 'failed',
  });

  return receipt.hash;
}

/**
 * Buy a product from the marketplace
 * 
 * NOTE: The contract does TWO safeTransferFrom calls:
 * 1. price - fee → seller
 * 2. fee → marketplace (platform fee)
 * 
 * So the buyer must approve the FULL price amount.
 * 
 * @param productId - The product ID to purchase
 * @param price - Full price in TC (human-readable) for approval
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
  

  // Parse ProductPurchased event and save the transaction to MongoDB
  let fromAddr = '';
  let toAddr: string | undefined;
  let amount = price;
  try {
    fromAddr = await signer.getAddress();
    const purchased = receipt.logs
      .map((log: any) => {
        try { return marketplace.interface.parseLog(log); } catch { return null; }
      })
      .find((e: any) => e?.name === 'ProductPurchased');
    if (purchased) {
      toAddr = purchased.args.seller;
      amount = ethers.formatEther(purchased.args.price);
    }
  } catch (e) {
    console.warn('Could not parse ProductPurchased event:', e);
  }
  await saveTransaction({
    txHash: receipt.hash,
    type: 'BUY',
    from: fromAddr,
    to: toAddr,
    productId,
    amount,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed?.toString(),
    status: receipt.status === 1 ? 'confirmed' : 'failed',
  });
  return receipt.hash;
}

/**
 * Transfer product ownership to a new address (no token cost, just gas)
 * Note: This also sets the product as unlisted.
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
  

  // Save the ownership transfer to MongoDB
  await saveTransaction({
    txHash: receipt.hash,
    type: 'TRANSFER',
    from: await signer.getAddress(),
    to: newOwner,
    productId,
    amount: '0',
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed?.toString(),
    status: receipt.status === 1 ? 'confirmed' : 'failed',
  });
  return receipt.hash;
}

/**
 * Toggle product listing status (owner only)
 * @param productId - The product ID
 * @param isListed - Whether the product should be listed
 * @param onStatus - Callback for status updates
 */
export async function setListing(
  productId: number,
  isListed: boolean,
  onStatus?: (status: string) => void
): Promise<string> {
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);
  
  onStatus?.('Updating listing status...');
  const tx = await marketplace.setListing(productId, isListed);
  
  onStatus?.('Waiting for confirmation...');
  const receipt = await tx.wait();
  

  // Save the listing change to MongoDB
  await saveTransaction({
    txHash: receipt.hash,
    type: isListed ? 'LISTING' : 'UNLISTING',
    from: await signer.getAddress(),
    productId,
    amount: '0',
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed?.toString(),
    status: receipt.status === 1 ? 'confirmed' : 'failed',
  });
  return receipt.hash;
}

/**
 * Update product details (owner only)
 * @param productId - The product ID
 * @param name - New name
 * @param description - New description
 * @param price - New price in TC (human-readable)
 * @param imageURI - New image URI
 * @param onStatus - Callback for status updates
 */
export async function updateProduct(
  productId: number,
  name: string,
  description: string,
  price: string,
  imageURI: string,
  onStatus?: (status: string) => void
): Promise<string> {
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);
  
  const priceWei = ethers.parseEther(price);
  
  onStatus?.('Updating product...');
  const tx = await marketplace.updateProduct(productId, name, description, priceWei, imageURI);
  
  onStatus?.('Waiting for confirmation...');
  const receipt = await tx.wait();
  
  return receipt.hash;
}

/**
 * Update platform fee (owner only)
 * @param newFeeBps - New fee in basis points (100 = 1%, 10000 = 100%)
 * @param onStatus - Callback for status updates
 */
export async function setPlatformFee(
  newFeeBps: number,
  onStatus?: (status: string) => void
): Promise<string> {
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);
  
  onStatus?.('Updating platform fee...');
  const tx = await marketplace.setPlatformFee(newFeeBps);
  
  onStatus?.('Waiting for confirmation...');
  const receipt = await tx.wait();
  

  // Save the fee update to MongoDB
  await saveTransaction({
    txHash: receipt.hash,
    type: 'FEE_UPDATE',
    from: await signer.getAddress(),
    amount: String(newFeeBps),
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed?.toString(),
    status: receipt.status === 1 ? 'confirmed' : 'failed',
  });
  return receipt.hash;
}

/**
 * Update listing fee (owner only)
 * @param newFee - New listing fee in TC (human-readable, e.g., "10")
 * @param onStatus - Callback for status updates
 */
export async function setListingFee(
  newFee: string,
  onStatus?: (status: string) => void
): Promise<string> {
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);
  
  const newFeeWei = ethers.parseEther(newFee);
  
  onStatus?.('Updating listing fee...');
  const tx = await marketplace.setListingFee(newFeeWei);
  
  onStatus?.('Waiting for confirmation...');
  const receipt = await tx.wait();
  
  return receipt.hash;
}

/**
 * Withdraw platform fees (owner only)
 * @param recipient - Address to receive the fees
 * @param amount - Amount in TC (human-readable) to withdraw
 * @param onStatus - Callback for status updates
 */
export async function withdrawPlatformFees(
  recipient: string,
  amount: string,
  onStatus?: (status: string) => void
): Promise<string> {
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);
  
  const amountWei = ethers.parseEther(amount);
  
  onStatus?.('Withdrawing platform fees...');
  const tx = await marketplace.withdrawPlatformFees(recipient, amountWei);
  
  onStatus?.('Waiting for withdrawal confirmation...');
  const receipt = await tx.wait();
  

  // Save the withdrawal to MongoDB
  await saveTransaction({
    txHash: receipt.hash,
    type: 'WITHDRAW',
    from: await signer.getAddress(),
    to: recipient,
    amount,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed?.toString(),
    status: receipt.status === 1 ? 'confirmed' : 'failed',
  });
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
