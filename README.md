# MonTip - Decentralized Tipping Platform

MonTip is a decentralized tipping platform built on the Monad Network that allows users to create their own "tip jars" and receive cryptocurrency tips with low fees.

## Features

- Create a personalized tip jar with custom username
- Receive tips directly to your wallet
- Add social links (Twitter, Website)
- View tip history and statistics
- Share your tip jar link with your audience
- Only 1% platform fee

## Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- ethers.js
- React Router
- Monad Network

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask or other Web3 wallet

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/montip.git
   cd montip
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   VITE_CONTRACT_ADDRESS=0x7f003073a0b7763Fde2FdFf3E37Aa422EAb231d0
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Connecting to Monad Testnet

To use MonTip, you need to configure your MetaMask wallet to connect to the Monad Testnet:

1. Open MetaMask
2. Click on the network dropdown (usually says "Ethereum Mainnet")
3. Click "Add Network"
4. Fill in the following details:
   - Network Name: Monad Testnet
   - New RPC URL: https://testnet-rpc.monad.xyz
   - Chain ID: 10143
   - Currency Symbol: MON
   - Block Explorer URL: https://testnet.monadexplorer.com

5. Click "Save"

## Contract Information

- Contract Address: `0x7f003073a0b7763Fde2FdFf3E37Aa422EAb231d0`
- Network: Monad Testnet
- View on Block Explorer: [Monad Explorer](https://testnet.monadexplorer.com/address/0x7f003073a0b7763Fde2FdFf3E37Aa422EAb231d0)

## Security Considerations

- The contract includes standard security features such as reentrancy guards
- Emergency withdrawal mechanism is available for the contract owner
- Max length checks are implemented for user inputs
- Fee structures are fixed and transparent

## Building for Production

```bash
npm run build
# or
yarn build
```

This will generate a production-ready build in the `dist` directory.

## License

This project is licensed under the MIT License - see the LICENSE file for details.