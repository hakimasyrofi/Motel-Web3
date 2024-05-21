const { ethers } = require("hardhat");

let admin, manager, renter, owner, mobifiRecipientWallet;

async function generateAccount() {
  [admin, manager, renter, owner, mobifiRecipientWallet] =
    await ethers.getSigners();
}

async function getAccount() {
  return [admin, manager, renter, owner, mobifiRecipientWallet];
}

// USDT
async function deployUSDT() {
  const USDT = await ethers.getContractFactory("USDT");
  const usdt = await USDT.deploy();
  return usdt;
}

// Rental Payment
async function getRentalPayment() {
  await generateAccount();
  const usdt = await deployUSDT();

  const RentalPayment = await ethers.getContractFactory("RentalPayment");
  const rentalPayment = await RentalPayment.deploy(
    mobifiRecipientWallet,
    usdt.target
  );
  return [rentalPayment, usdt];
}

module.exports = {
  getAccount,
  getRentalPayment,
};
