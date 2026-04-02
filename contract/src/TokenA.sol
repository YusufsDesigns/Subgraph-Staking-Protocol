// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title TokenA
/// @notice Staking token — only exists for testing.
///         In a real deployment you delete this and pass in an existing token address.
contract TokenA is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("Staking Token", "TKA") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    /// @dev For funding test wallets. Remove in production.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}