// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title TokenB
/// @notice Reward token — this one you actually own and control.
///         Fund the staking contract with this before calling notifyRewardAmount.
contract TokenB is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("Reward Token", "TKB") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}