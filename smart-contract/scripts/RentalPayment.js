// Deploy: npx hardhat run scripts/RentalPayment.js --network amoy
// Verify: npx hardhat verify --network amoy <contract address>

const hre = require("hardhat");
require("dotenv").config();

// async function main() {
//   const USDT = await hre.ethers.getContractFactory("USDT");

//   const usdt = await USDT.deploy();
//   console.log(`USDT Test deployed to ${usdt.target}`);
// }

async function main() {
  const RentalPayment = await hre.ethers.getContractFactory("RentalPayment");

  const rentalPayment = await RentalPayment.deploy(
    process.env.MOBIFI_RECEIVER_ADDRESS,
    process.env.AMOY_USDT_ADDRESS
  );
  console.log(`Rental Payment deployed to ${rentalPayment.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
