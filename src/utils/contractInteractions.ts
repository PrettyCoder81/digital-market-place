
import { ethers, BrowserProvider, Contract, Signer } from 'ethers';
import {
  TONYSCOIN_ADDRESS,
  MARKETPLACE_ADDRESS,
  ERC20_ABI,
  MARKETPLACE_ABI,
} from '../config/contracts';
import {
  logTransaction,
  saveProduct,
  updateProduct as apiUpdateProduct,
  TransactionLogPayload,
} from './apiClient';

function extractIpfsHash(uri: string): string {
  const m = uri.match(/^ipfs:\/\/([QmA-Za-z0-9]{30,68})/);
  return m ? m[1] : '';
}

async function saveProductMeta(payload: Parameters<typeof saveProduct>[0]): Promise<void> {
  try {
    await saveProduct(payload);
  } catch (e) {
    console.warn('Failed to save product to MongoDB:', e);
  }
}

async function patchProductMeta(
  productId: number,
  update: Parameters<typeof apiUpdateProduct>[1]
): Promise<void> {
  try {
    await apiUpdateProduct(productId, update);
  } catch (e) {
    console.warn('Failed to update product in MongoDB:', e);
  }
}


async function saveTransaction(payload: TransactionLogPayload): Promise<void> {
  try {
    await logTransaction(payload);
  } catch (e) {
    console.warn('Failed to save transaction to backend:', e);
  }
}

export async function getSigner(): Promise<Signer> {
  if (!window.ethereum) {
    throw new Error('No wallet detected. Please install MetaMask.');
  }
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer;
}

export function getTonysCoinContract(signer: Signer): Contract {
  return new Contract(TONYSCOIN_ADDRESS, ERC20_ABI, signer);
}

export function getMarketplaceContract(signer: Signer): Contract {
  return new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
}

export async function getTCBalance(address: string): Promise<string> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(TONYSCOIN_ADDRESS, ERC20_ABI, provider);
  const balance = await contract.balanceOf(address);
  return ethers.formatEther(balance);
}

export async function getListingFee(): Promise<string> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
  const fee = await contract.listingFee();
  return ethers.formatEther(fee);
}

export async function getPlatformFeeBps(): Promise<number> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
  const fee = await contract.platformFeeBps();
  return Number(fee);
}

export async function getContractOwner(): Promise<string> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
  return await contract.owner();
}

export async function getAccruedFees(): Promise<string> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
  const fees = await contract.accruedPlatformFees();
  return ethers.formatEther(fees);
}

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

  // Save the product itself to MongoDB so the frontend can display it
  if (productId !== undefined && receipt.status === 1) {
    const ownerAddress = await signer.getAddress();
    const ipfsHash = extractIpfsHash(imageURI);
    await saveProductMeta({
      productId,
      name,
      description,
      ipfsHash,
      ipfsUrl: ipfsHash ? `https://ipfs.io/ipfs/${ipfsHash}` : imageURI,
      ownerAddress,
      price: amount !== '0' ? amount : price,
      txHash: receipt.hash,
      imageURI,
    });
  }

  return receipt.hash;
}

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

  if (receipt.status === 1 && toAddr) {
    await patchProductMeta(productId, {
      ownerAddress: fromAddr,
      isListed: false,
    });
  }
  return receipt.hash;
}

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

  if (receipt.status === 1) {
    await patchProductMeta(productId, {
      ownerAddress: newOwner,
      isListed: false, // contract unlists on transfer
    });
  }
  return receipt.hash;
}

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

  // Keep the stored product's listing flag in sync
  if (receipt.status === 1) {
    await patchProductMeta(productId, { isListed });
  }
  return receipt.hash;
}


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

  // Keep the stored product metadata in sync with the on-chain update
  if (receipt.status === 1) {
    const ownerAddress = await signer.getAddress();
    const ipfsHash = extractIpfsHash(imageURI);
    await saveProductMeta({
      productId,
      name,
      description,
      ipfsHash,
      ipfsUrl: ipfsHash ? `https://ipfs.io/ipfs/${ipfsHash}` : imageURI,
      ownerAddress,
      price,
      txHash: receipt.hash,
      imageURI,
    });
  }

  return receipt.hash;
}

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

export async function checkAllowance(ownerAddress: string): Promise<string> {
  const provider = new BrowserProvider(window.ethereum!);
  const contract = new Contract(TONYSCOIN_ADDRESS, ERC20_ABI, provider);
  const allowance = await contract.allowance(ownerAddress, MARKETPLACE_ADDRESS);
  return ethers.formatEther(allowance);
}

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
