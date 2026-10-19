# TonysCoin Digital Marketplace

A decentralized digital marketplace built on Ethereum Sepolia testnet, using TonysCoin (TC) as the exclusive payment token.

## 🏗️ Architecture

```
├── src/                          # Frontend (Vite + React + MUI v9)
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Global styles + Tailwind
│   ├── global.d.ts              # TypeScript declarations for window.ethereum
│   ├── config/
│   │   └── contracts.ts         # Contract addresses, ABIs, network config
│   ├── context/
│   │   └── Web3Context.tsx      # Wallet connection state management
│   ├── theme/
│   │   └── theme.ts             # MUI theme (dark/light mode, emerald green)
│   ├── utils/
│   │   └── contractInteractions.ts  # Web3 interaction functions
│   └── components/
│       ├── Navbar.tsx           # Navigation + wallet connect + theme toggle
│       ├── ProductList.tsx      # Product grid display with hero banner
│       ├── ProductCard.tsx      # Individual product card with buy/transfer/listing
│       ├── CreateProductForm.tsx # Product creation with IPFS upload
│       └── AdminDashboard.tsx   # Owner admin panel (fees, withdrawals)
│
├── server/                       # Backend (Express + MongoDB)
│   ├── server.js                # Express server entry
│   ├── package.json             # Backend dependencies
│   ├── .env.example             # Environment variables template
│   ├── models/
│   │   └── index.js            # Mongoose schemas (User, Product, Transaction)
│   ├── routes/
│   │   ├── ipfs.js             # IPFS/Pinata upload endpoints
│   │   ├── products.js         # Product CRUD endpoints
│   │   └── transactions.js     # Transaction logging endpoints
│   └── contracts/
│       └── DigitalMarketPlace.sol  # Solidity contract source
│
└── index.html                    # HTML entry point
```

## 🔗 Contract Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| TonysCoin (TC) | `0x0C3fE514a1977ea6521d705171Ebcb916ABD28Be` |
| DigitalMarketPlace | `0x59c401f90426595746DB171Fc600F0b9E09F93ba` |

## 📜 Smart Contract: DigitalMarketPlace

### Product Struct
```solidity
struct Product {
    uint256 id;
    string name;
    string description;
    uint256 price;
    string imageURI;    // IPFS URI for the product image
    address owner;
    bool listed;
    uint256 createdAt;
}
```

### Key Functions
| Function | Access | Description |
|----------|--------|-------------|
| `createProduct(name, description, price, imageURI)` | Anyone | Creates a product. Requires listingFee approval (10 TC) |
| `buyProduct(productId)` | Anyone (not owner) | Buys a listed product. Requires full price approval |
| `transferProductOwnership(productId, newOwner)` | Owner | Transfers ownership (no TC cost). Auto-delist |
| `setListing(productId, isListed)` | Owner | Toggle product listing status |
| `updateProduct(productId, name, description, price, imageURI)` | Owner | Update product details |
| `setPlatformFee(newFeeBps)` | Owner | Update platform fee (max 10000 bps) |
| `setListingFee(newFee)` | Owner | Update listing fee |
| `withdrawPlatformFees(recipient, amount)` | Owner | Withdraw accrued fees |

## 🚀 Quick Start

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd server
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

## 🔄 Web3 Transaction Flows

### Creating a Product (2-step)
1. `approve(TonysCoin, Marketplace, listingFee)` → Approve 10 TC listing fee
2. `createProduct(name, description, price, imageURI)` → Create the product listing

### Buying a Product (2-step)
1. `approve(TonysCoin, Marketplace, fullPrice)` → Approve full product price
2. `buyProduct(productId)` → Execute purchase
   - Contract does 2 safeTransferFrom calls:
     - `(price - fee)` → seller
     - `fee` → marketplace (platform fee)

### Transferring Ownership (1-step)
1. `transferProductOwnership(productId, newOwner)` → Transfer ownership (free, auto-delist)

### Toggling Listing (1-step)
1. `setListing(productId, isListed)` → List or delist product (owner only)

## 📋 Features

### User Features
- **Connect Wallet**: MetaMask integration with Sepolia network detection
- **Browse Products**: View all products with images (IPFS), prices, and owner info
- **Create Product**: Upload images to IPFS, set price in TC, list on marketplace
- **Purchase Product**: Buy products with 2-step Web3 flow (approve + buy)
- **Transfer Ownership**: Transfer owned products to another wallet (no TC cost)
- **List/Delist**: Toggle product availability (owner only)

### Admin Features
- **Dashboard**: View accrued platform fees and contract stats
- **Update Fee**: Modify platform fee in basis points (max 10000 = 100%)
- **Withdraw**: Withdraw accumulated TC fees to any address

## 🎨 UI/UX

- **Theme**: Emerald green primary color, dark/light mode toggle
- **Components**: MUI v9 Cards, Grids, Dialogs, Snackbars, Skeletons
- **Responsive**: Full mobile and desktop support
- **Feedback**: Loading states, transaction status messages, error handling
- **Hero Banner**: Gradient hero section with product stats

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, MUI v9, Ethers.js v6, Tailwind CSS |
| Backend | Node.js, Express.js, MongoDB (Mongoose) |
| Storage | IPFS via Pinata SDK |
| Blockchain | Ethereum Sepolia, Solidity ^0.8.24 |
| Styling | MUI Theme System, CSS-in-JS |

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ipfs/upload` | Upload image to IPFS |
| POST | `/api/ipfs/upload-json` | Upload JSON metadata |
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create/update product |
| PATCH | `/api/products/:id` | Update product status |
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Log transaction |
| GET | `/api/transactions/stats` | Transaction statistics |
| GET | `/api/health` | Health check |

## ⚠️ Error Handling

The application handles:
- User rejecting MetaMask transactions (code 4001)
- Insufficient TC balance
- Wrong network detection and auto-switch prompt
- IPFS upload failures (fallback to demo mode)
- Contract call reverts with descriptive messages
- Image loading failures (fallback to gradient placeholders)

## 📝 Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/tonyscoin-marketplace
PINATA_JWT=your_pinata_jwt_token
PORT=5000
```

## License

MIT
