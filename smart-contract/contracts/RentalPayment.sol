// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RentalPayment is AccessControl {
    bytes32 constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    address public mobifiWallet;
    uint256 public commissionPercentage = 5;
    IERC20 public paymentToken;

    struct Booking {
        address renter;
        address payable owner;
        uint256 amount;
        uint256 endTime;
        bool disputed;
        bool paid;
    }

    mapping(uint256 => Booking) public bookings;
    uint256 public bookingCounter;

    constructor(address _mobifiWallet, address _paymentToken) {
        mobifiWallet = _mobifiWallet;
        paymentToken = IERC20(_paymentToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }

    modifier onlyManager() {
        require(hasRole(MANAGER_ROLE, msg.sender), "Caller is not a manager");
        _;
    }

    function createBooking(address payable _owner, uint256 _amount, uint256 _endTime) external {
        require(_amount > 0, "Payment must be greater than 0");

        uint256 bookingId = bookingCounter++;
        uint256 commission = (_amount * commissionPercentage) / 100;
        uint256 amountAfterCommission = _amount - commission;

        bookings[bookingId] = Booking({
            renter: msg.sender,
            owner: _owner,
            amount: amountAfterCommission,
            endTime: _endTime,
            disputed: false,
            paid: false
        });

        require(paymentToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        require(paymentToken.transfer(mobifiWallet, commission), "Commission transfer failed");
    }

    function raiseDispute(uint256 _bookingId) external {
        Booking storage booking = bookings[_bookingId];
        require(msg.sender == booking.renter || msg.sender == booking.owner, "Not authorized to raise a dispute");
        require(block.timestamp <= booking.endTime + 7 days, "Dispute period has ended");
        require(!booking.paid, "Payment already released");

        booking.disputed = true;
    }

    function resolveDispute(uint256 _bookingId, bool favorRenter) external onlyManager {
        Booking storage booking = bookings[_bookingId];
        require(booking.disputed, "No dispute raised");

        if (favorRenter) {
            require(paymentToken.transfer(booking.renter, booking.amount), "Transfer to renter failed");
            booking.paid = true;
        }

        booking.disputed = false;
    }

    function releasePayment(uint256 _bookingId) external {
        Booking storage booking = bookings[_bookingId];
        require(booking.owner == msg.sender, "Caller is not an owner");
        require(block.timestamp > booking.endTime + 7 days, "Dispute period not ended");
        require(!booking.disputed, "Dispute raised");
        require(!booking.paid, "Payment already released");

        booking.paid = true;
        require(paymentToken.transfer(booking.owner, booking.amount), "Transfer failed");
    }

    function addManager(address manager) external onlyAdmin {
        grantRole(MANAGER_ROLE, manager);
    }

    function removeManager(address manager) external onlyAdmin {
        revokeRole(MANAGER_ROLE, manager);
    }

    function changeMobifiWallet(address _newMobifiWallet) external onlyAdmin {
        mobifiWallet = _newMobifiWallet;
    }

    function changeCommissionPercentage(uint256 _newPercentage) external onlyAdmin {
        require(_newPercentage <= 100, "Commission percentage cannot exceed 100");
        commissionPercentage = _newPercentage;
    }
}
