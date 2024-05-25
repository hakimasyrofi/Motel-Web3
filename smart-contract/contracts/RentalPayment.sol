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
    mapping(address => uint256[]) private ownerBookings;

    constructor(address _mobifiWallet, address _paymentToken) {
        mobifiWallet = _mobifiWallet;
        paymentToken = IERC20(_paymentToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }

    modifier onlyManagerOrAdmin() {
        require(hasRole(MANAGER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not a manager or admin");
        _;
    }

    function createBooking(uint256 bookingId, address payable _owner, uint256 _amount, uint256 _endTime) external {
        require(_amount > 0, "Payment must be greater than 0");
        require(bookings[bookingId].renter == address(0), "Booking ID must be unique");

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

        ownerBookings[_owner].push(bookingId);

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

    function resolveDispute(uint256 _bookingId, bool favorRenter) external onlyManagerOrAdmin {
        Booking storage booking = bookings[_bookingId];
        require(booking.disputed, "No dispute raised");

        if (favorRenter) {
            require(paymentToken.transfer(booking.renter, booking.amount), "Transfer to renter failed");
            booking.paid = true;
        }

        booking.disputed = false;
    }

    function releasePayment() external {
        uint256 totalAmount = 0;
        uint256[] storage ownerBookingIds = ownerBookings[msg.sender];
        uint256[] memory newOwnerBookingIds = new uint256[](ownerBookingIds.length);
        uint256 newIndex = 0;

        for (uint256 i = 0; i < ownerBookingIds.length; i++) {
            uint256 bookingId = ownerBookingIds[i];
            Booking storage booking = bookings[bookingId];
            if (
                block.timestamp > booking.endTime + 7 days &&
                !booking.disputed &&
                !booking.paid
            ) {
                totalAmount += booking.amount;
                booking.paid = true;
            } else {
                // If the booking is not processed, keep its ID
                newOwnerBookingIds[newIndex] = bookingId;
                newIndex++;
            }
        }

        // Update ownerBookings with the new array excluding processed booking IDs
        ownerBookings[msg.sender] = newOwnerBookingIds;

        require(totalAmount > 0, "No payment available to release");
        require(paymentToken.transfer(msg.sender, totalAmount), "Transfer failed");
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
