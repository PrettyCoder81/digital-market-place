# TonysCoin Digital Marketplace

A decentralized digital marketplace built on Ethereum Sepolia testnet, using TonysCoin (TC) as the exclusive payment token.

## 🏗️ Architecture

```
├── src/                          # Frontend (Vite + React + MUI)
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Global styles
│   ├── global.d.ts              # TypeScript declarations
│   ├── config/
│   │   └── contracts.ts         # Contract addresses, ABIs, network config
│   ├── context/
│   │   └── Web3Context.tsx      # Wallet connection state management
│   ├── theme/
│   │   └── theme.ts             # MUI theme (dark/light mode)
│   ├── utils/
│   │   └── contractInteractions.ts  # Web3 interaction functions
│   └── components/
│       ├── Navbar.tsx           # Navigation + wallet connect
│       ├── ProductList.tsx      # Product grid display
│       ├── ProductCard.tsx      # Individual product card with actions
│       ├── CreateProductForm.tsx # Product creation form
│       └── AdminDashboard.tsx   # Owner admin panel
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
│       └── TonysCoinMarketplace.sol  # Solidity contract reference
│
└── index.html                    # HTML entry point
```

## 🔗 Contract Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| TonysCoin (TC) | `0x0C3fE514a1977ea6521d705171Ebcb916ABD28Be` |
| Marketplace | `0x89bE3eeB9873407e46001848ea7dDE28e45c6c50` |

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

## 📋 Features

### User Features
- **Connect Wallet**: MetaMask integration with Sepolia network detection
- **Browse Products**: View all listed products with images, prices, and owner info
- **Create Product**: Upload images to IPFS, set price in TC, list on marketplace
- **Purchase Product**: Buy products with 2-step Web3 flow (approve + buy)
- **Transfer Ownership**: Transfer owned products to another wallet (no TC cost)

### Admin Features
- **Dashboard**: View accrued platform fees and contract stats
- **Update Fee**: Modify platform fee in basis points (max 10000 = 100%)
- **Withdraw**: Withdraw accumulated TC fees to owner wallet

## 🔄 Web3 Transaction Flows

### Creating a Product (2-step)
1. `approve(TonysCoin, Marketplace, listingFee)` → Approve 10 TC listing fee
2. `createProduct(name, description, price)` → Create the product listing

### Buying a Product (2-step)
1. `approve(TonysCoin, Marketplace, productPrice)` → Approve product price
2. `buyProduct(productId)` → Execute the purchase

### Transferring Ownership (1-step)
1. `transferProductOwnership(productId, newOwner)` → Transfer ownership (free)

## 🎨 UI/UX

- **Theme**: Emerald green primary color, dark/light mode toggle
- **Components**: MUI Cards, Grids, Dialogs, Snackbars, Skeletons
- **Responsive**: Full mobile and desktop support
- **Feedback**: Loading states, transaction status messages, error handling

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, MUI v9, Ethers.js v6 |
| Backend | Node.js, Express.js, MongoDB (Mongoose) |
| Storage | IPFS via Pinata SDK |
| Blockchain | Ethereum Sepolia, Solidity ^0.8.20 |
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

## 📝 Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/tonyscoin-marketplace
PINATA_JWT=your_pinata_jwt_token
PORT=5000
```

## License

MIT
