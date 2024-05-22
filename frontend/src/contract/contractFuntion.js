import { ethers } from "ethers";
import rentalPaymentArtifacts from "../contract/artifacts/RentalPayment.json";
import usdtArtifacts from "../contract/artifacts/USDT.json";

const rentalPaymentAddress = import.meta.env
  .VITE_RENTAL_PAYMENT_CONTRACT_ADDRESS;
const tokenAddress = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

export const getRentalPaymentContract = async () => {
  const RentalPaymentContract = new ethers.Contract(
    rentalPaymentAddress,
    rentalPaymentArtifacts.abi,
    signer
  );
  return RentalPaymentContract;
};

export const getTokenContract = async () => {
  const TokenContract = new ethers.Contract(
    tokenAddress,
    usdtArtifacts.abi,
    signer
  );
  return TokenContract;
};

export const createBooking = async (owner, amount, endTime) => {
  const rentalPaymentContract = await getRentalPaymentContract();
  const tokenContract = await getTokenContract();

  const approve = await tokenContract.approve(rentalPaymentAddress, amount);
  await approve.wait();

  const createBooking = await rentalPaymentContract.createBooking(
    owner,
    amount,
    endTime
  );
  await createBooking.wait();
};
