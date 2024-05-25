// npx hardhat test ./test/TestRentalPayment.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { getAccount, getRentalPayment } = require("./TestDeploy");
const { keccak256 } = require("../utils/util");

describe("RentalPayment", function () {
  let rentalPayment, paymentToken;
  let admin, manager, renter, owner, mobifiRecipientWallet;

  before(async () => {
    [rentalPayment, paymentToken] = await getRentalPayment();
    [admin, manager, renter, owner, mobifiRecipientWallet] = await getAccount();

    // Mint tokens to renter
    await paymentToken.mint(renter.address, 1000);
  });

  describe("addManager", function () {
    it("+ should grant manager role", async function () {
      await rentalPayment.connect(admin).addManager(manager.address);
      const managerRole = await keccak256("MANAGER_ROLE");
      expect(await rentalPayment.hasRole(managerRole, manager.address)).to.be
        .true;
    });

    it("- should fail to grant manager role if not admin", async function () {
      await expect(
        rentalPayment.connect(renter).addManager(manager.address)
      ).to.be.revertedWith("Caller is not an admin");
    });
  });

  describe("createBooking", function () {
    it("+ should create a booking and transfer tokens correctly", async function () {
      const amount = 100;
      const commission = (amount * 5) / 100;
      const amountAfterCommission = amount - commission;

      await paymentToken.connect(renter).approve(rentalPayment.target, amount);

      await expect(() =>
        rentalPayment.connect(renter).createBooking(
          0, // Booking ID
          owner.address,
          amount,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.changeTokenBalances(
        paymentToken,
        [renter, rentalPayment, mobifiRecipientWallet],
        [amount * -1, amountAfterCommission, commission]
      );

      const booking = await rentalPayment.bookings(0);
      expect(booking.renter).to.equal(renter.address);
      expect(booking.owner).to.equal(owner.address);
      expect(booking.amount).to.equal(amountAfterCommission);
      expect(booking.disputed).to.be.false;
      expect(booking.paid).to.be.false;
    });

    it("+ should create another booking", async function () {
      const amount = 200;
      const commission = (amount * 5) / 100;
      const amountAfterCommission = amount - commission;

      await paymentToken.connect(renter).approve(rentalPayment.target, amount);

      await expect(() =>
        rentalPayment.connect(renter).createBooking(
          1, // Booking ID
          owner.address,
          amount,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.changeTokenBalances(
        paymentToken,
        [renter, rentalPayment, mobifiRecipientWallet],
        [amount * -1, amountAfterCommission, commission]
      );

      const booking = await rentalPayment.bookings(1);
      expect(booking.renter).to.equal(renter.address);
      expect(booking.owner).to.equal(owner.address);
      expect(booking.amount).to.equal(amountAfterCommission);
      expect(booking.disputed).to.be.false;
      expect(booking.paid).to.be.false;
    });

    it("- should fail to create a booking with zero amount", async function () {
      await expect(
        rentalPayment.connect(renter).createBooking(
          2, // Booking ID
          owner.address,
          0,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.revertedWith("Payment must be greater than 0");
    });

    it("- should fail to create a booking with duplicate ID", async function () {
      await expect(
        rentalPayment.connect(renter).createBooking(
          0, // Duplicate Booking ID
          owner.address,
          100,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.revertedWith("Booking ID must be unique");
    });
  });

  describe("raiseDispute", function () {
    it("+ should allow renter or owner to raise a dispute", async function () {
      await rentalPayment.connect(renter).raiseDispute(0);

      const booking = await rentalPayment.bookings(0);
      expect(booking.disputed).to.be.true;
      expect(booking.paid).to.be.false;
    });

    it("- should fail to raise a dispute by non-authorized user", async function () {
      await expect(
        rentalPayment.connect(manager).raiseDispute(0)
      ).to.be.revertedWith("Not authorized to raise a dispute");
    });
  });

  describe("resolveDispute", function () {
    it("+ should resolve dispute in favor of the renter", async function () {
      await rentalPayment.connect(manager).resolveDispute(0, true);

      const updatedBooking = await rentalPayment.bookings(0);
      expect(updatedBooking.paid).to.be.true;
      expect(updatedBooking.disputed).to.be.false;
    });

    it("- should fail to resolve dispute if not manager or admin", async function () {
      await expect(
        rentalPayment.connect(renter).resolveDispute(0, true)
      ).to.be.revertedWith("Caller is not a manager or admin");
    });
  });

  describe("releasePayment", function () {
    it("+ should release payment to the owner after the dispute period has ended", async function () {
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]); // 8 days
      await ethers.provider.send("evm_mine", []); // Mine a new block to apply the time change

      const booking = await rentalPayment.bookings(1);
      await expect(() =>
        rentalPayment.connect(owner).releasePayment()
      ).to.changeTokenBalance(paymentToken, owner, booking.amount);

      const updatedBooking = await rentalPayment.bookings(1);
      expect(updatedBooking.paid).to.be.true;
    });

    it("- should fail to release payment if there are no valid bookings", async function () {
      await expect(
        rentalPayment.connect(owner).releasePayment()
      ).to.be.revertedWith("No payment available to release");
    });
  });

  describe("removeManager", function () {
    it("+ should remove manager role", async function () {
      await rentalPayment.connect(admin).removeManager(manager.address);
      const managerRole = await keccak256("MANAGER_ROLE");
      expect(await rentalPayment.hasRole(managerRole, manager.address)).to.be
        .false;
    });

    it("- should fail to remove manager role if not admin", async function () {
      await expect(
        rentalPayment.connect(renter).removeManager(manager.address)
      ).to.be.revertedWith("Caller is not an admin");
    });
  });

  describe("changeMobifiWallet", function () {
    it("+ should change mobifiWallet", async function () {
      const [newWallet] = await ethers.getSigners();
      await rentalPayment.connect(admin).changeMobifiWallet(newWallet.address);
      expect(await rentalPayment.mobifiWallet()).to.equal(newWallet.address);
    });

    it("- should fail to change mobifiWallet if not admin", async function () {
      const [newWallet] = await ethers.getSigners();
      await expect(
        rentalPayment.connect(renter).changeMobifiWallet(newWallet.address)
      ).to.be.revertedWith("Caller is not an admin");
    });
  });

  describe("changeCommissionPercentage", function () {
    it("+ should change commission percentage", async function () {
      const newPercentage = 10;
      await rentalPayment
        .connect(admin)
        .changeCommissionPercentage(newPercentage);
      expect(await rentalPayment.commissionPercentage()).to.equal(
        newPercentage
      );
    });

    it("- should fail to change commission percentage if not admin", async function () {
      const newPercentage = 10;
      await expect(
        rentalPayment.connect(renter).changeCommissionPercentage(newPercentage)
      ).to.be.revertedWith("Caller is not an admin");
    });

    it("- should fail to change commission percentage to more than 100", async function () {
      const newPercentage = 101;
      await expect(
        rentalPayment.connect(admin).changeCommissionPercentage(newPercentage)
      ).to.be.revertedWith("Commission percentage cannot exceed 100");
    });
  });
});
