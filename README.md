# Motel Web3

This repository is a derivative of two original repositories: [motelFrontend](https://github.com/Mehedi-Hasan0/motelFrontend) and [motelBackend](https://github.com/Mehedi-Hasan0/motelBackend). It has been enhanced with a cryptocurrency payment function, allowing the website to accept payments using cryptocurrency. This enhancement has already been implemented, enabling users to make transactions seamlessly with cryptocurrency on the platform.

# Setup Instructions

## A. MetaMask Configuration

### 1. Setup MetaMask

1. **Install MetaMask**: If you haven't already, download and install the MetaMask extension for your browser.
2. **Create Accounts**: Create three accounts in MetaMask:
   - **Renter**
   - **House Owner**
   - **Mobifi Commission Receiver**

### 2. Adding Test Network to MetaMask

To use the Polygon Amoy test network, follow these steps:

1. Open MetaMask and click on the three dots at the top right corner.
2. Select **"Settings"** from the dropdown menu.
3. Go to **"Networks"**.
4. Click on **"Add Network"** at the bottom.
5. Enter the following details:
   - **Network Name**: Amoy Testnet
   - **New RPC URL**: [https://still-broken-hill.matic-amoy.quiknode.pro/8709bf5eb7f5a10aa1d549e0b3e378d5b9372a96/](https://still-broken-hill.matic-amoy.quiknode.pro/8709bf5eb7f5a10aa1d549e0b3e378d5b9372a96/)
   - **Chain ID**: 80002
   - **Currency Symbol**: (Leave it blank or enter 'MATIC' if required)
   - **Block Explorer URL**: [https://amoy.polygonscan.com/](https://amoy.polygonscan.com/)
6. Click **"Save"** to add the Amoy Testnet network.

### 3. Obtain Native Test Tokens

To obtain the native test tokens required for transactions on the test network, please follow these steps:

1. Visit the [Polygon Faucet](https://faucet.polygon.technology/).
2. Select the Polygon PoS (Amoy) network and input your wallet address.
3. Upon successful request, a pop-up notification will confirm the transfer of native test tokens.

### 4. Importing Payment Token

We will use USDT test tokens for transactions in the motel application. To import the token into MetaMask:

1. Open MetaMask and click on **"Import Tokens"**.
2. Paste the token address into the appropriate field:
   - **Token Address**: [0xbDB00B61B1b1B79101C22916Efefe661dD6e48eC](https://amoy.polygonscan.com/address/0xbDB00B61B1b1B79101C22916Efefe661dD6e48eC)
3. Click **"Next"** and then **"Import"**.

### 5. Get Test Tokens

To mint USDT test tokens, follow these steps:

1. Visit the [Amoy PolygonScan contract page](https://amoy.polygonscan.com/address/0xbDB00B61B1b1B79101C22916Efefe661dD6e48eC#writeContract).
2. Connect your MetaMask wallet to the website.
3. Select the **"mint"** function.
4. Fill in the required details:
   - **Address**: The address that will receive the tokens.
   - **Amount**: The amount of tokens to mint (in 18 decimal format).
5. Execute the transaction to mint tokens to the specified address.

Following these steps will configure MetaMask for use with the Polygon Amoy test network and set up the necessary tokens for transactions.

## B. Web Application

You can clone this repository to your local computer: [Motel-Web3 Repository](https://github.com/hakimasyrofi/Motel-Web3.git).

### 1. Smart Contract

1. **Navigate to Smart Contract Directory**:
   ```bash
   cd Motel-Web3/smart-contract
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:

   - Rename `.env.example` to `.env`.
   - Fill in the required variables in the `.env` file.

4. **Compile Smart Contracts**:
   ```bash
   npx hardhat compile
   ```
5. **(Optional) Test Smart Contracts**:
   ```bash
   npx hardhat test
   ```
6. **Deploy Smart Contracts**:
   ```bash
   npx hardhat run scripts/RentalPayment.js --network amoy
   ```
   - Note the deployed `rentalpayment` address for use in the front-end configuration.

### 2. Front-End

1. **Navigate to Front-End Directory**:
   ```bash
   cd Motel-Web3/frontend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:

   - Rename `.env.example` to `.env`.
   - Fill in the required variables, including the `rentalpayment` address obtained from the smart contract deployment.

4. **Run the Front-End**:
   ```bash
   npm run dev
   ```

### 3. Back-End

1. **Navigate to Back-End Directory**:
   ```bash
   cd Motel-Web3/backend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:

   - Rename `.env.example` to `.env`.
   - Fill in the required variables.

4. **Run the Back-End**:
   ```bash
   npm run dev
   ```

### 4. Simulation

1. **Access the Front-End**:
   - Open the local link provided by Vite (usually [http://localhost:5173/](http://localhost:5173/)) in your browser.
2. **Sign Up**:

   - Choose **"Sign Up"**.
   - Choose **"Continue with MetaMask"**.
   - If this is the first time using MetaMask on the site, fill out the registration form (first name, last name, birthdate, email, and password). This information is needed for verification when checking in at the destination.

3. **Access the Website**:
   - After registration, you can access the website.

#### A. House Owner

1. **Register and Setup a Motel**:
   - After registration, choose **"Profile"** in the navbar.
   - Select **"Motel Your Home"** and click **"Motel Setup"**.
   - Fill in all the required information, including the house owner's wallet address to receive payments, and list the hotel.

#### B. Renter

1. **Reserve a Place**:
   - After registration, select the place you want to rent.
   - Fill in the check-in and check-out times and the number of guests, then click **"Reserve"**.
2. **Make a Payment**:
   - On the payment page, choose **"Pay with Crypto (USDT)"** and click **"Confirm and Pay"**.
   - Two pop-ups will appear:
     - The first pop-up is to approve access to the smart contract to spend tokens in the wallet.
     - The second pop-up is to interact with the **"CreateBooking"** function in the smart contract.
   - After accepting both pop-ups in MetaMask and successful transactions, the token will be transferred to the smart contract, with 5% commission sent directly to the Mobifi commission receiver. The house owner can disburse their tokens from the smart contract 7 days after the booking ends.
