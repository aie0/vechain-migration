//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.4.23;

import "hardhat/console.sol";
import "./Token.sol";

contract Migration {
    event Migrate(address indexed from, uint[] to, uint256 value);
    event Migrated(address indexed from, uint[] to, uint256 value);
    event ChangeMigrateRole(address contractOwner, address migrateRole);
    
    Token private _token;
    address private _contractOwner;
    address private _migrateRole;
    mapping(address => uint256) _lockedHoldings;

    constructor(address token_address_, address migrateRole_) public {
        console.log("Migration::constructor");
        _token = Token(token_address_);
        _migrateRole = migrateRole_;
        _contractOwner = msg.sender;
    }

    function safeAdd(uint256 a, uint256 b) internal pure returns (uint256 c) {
        c = a + b;
        require(c >= a, "OVERFLOW");
    }

    function safeSub(uint256 a, uint256 b) internal pure returns (uint256 c) {
        c = a - b;
        require(b <= a, "UNDERFLOW");
    }

    function migrate(uint[] target_address_, uint256 amount_) public {
        console.log("Migration::migrate");

        _token.transferFrom(msg.sender, address(this), amount_);
        
        _lockedHoldings[msg.sender] = safeAdd(_lockedHoldings[msg.sender], amount_);
        
        emit Migrate(msg.sender, target_address_, amount_);
    }

    function setMigrateRole(address migrateRole_) public {
        console.log("Migration::setMigrateRole");
        require(msg.sender == _contractOwner, "UNAUTHORISED");

        _migrateRole = migrateRole_;

        emit ChangeMigrateRole(msg.sender, migrateRole_);
    }

    function finishMigration(address account_address_, uint[] target_address_, uint256 amount_) public {
        console.log("Migration::finishMigration");
        require(msg.sender == _migrateRole, "UNAUTHORISED");
        require(amount_ > 0, "ZERO_MIGRATION");
        require(_lockedHoldings[account_address_] >= amount_, "NOT_ENOUGH_LOCKED");

        _lockedHoldings[account_address_] = safeSub(_lockedHoldings[account_address_], amount_);
        
        emit Migrated(account_address_, target_address_, amount_);
    }

    function getLockedHoldings(address account_address_) public view returns (uint256)  {
        console.log("Migration::getLockedHoldings");

        return _lockedHoldings[account_address_];
    }
}