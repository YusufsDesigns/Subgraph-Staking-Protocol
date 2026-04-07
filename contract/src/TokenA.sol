// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title TokenA
/// @notice Staking token — only exists for testing.
///         In a real deployment you delete this and pass in an existing token address.
contract TokenA is ERC20, Ownable {
    error TokenA__CooldownNotFinished(uint256 availableAt);

    uint256 public constant FAUCET_AMOUNT = 100e18;
    uint256 public constant FAUCET_COOLDOWN = 24 hours;

    mapping(address => uint256) public lastClaimed;

    constructor(uint256 initialSupply) ERC20("Staking Token", "TKA") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    /// @dev For funding test wallets. Remove in production.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function faucet() external {
        uint256 availableAt = lastClaimed[msg.sender] + FAUCET_COOLDOWN;
        if (block.timestamp < availableAt) {
            revert TokenA__CooldownNotFinished(availableAt);
        }

        lastClaimed[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
