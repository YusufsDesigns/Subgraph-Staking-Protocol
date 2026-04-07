// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StakingRewards} from "src/StakingRewards.sol";
import {TokenA} from "src/TokenA.sol";
import {TokenB} from "src/TokenB.sol";
import {StakingHandler} from "test/invariant/StakingHandler.t.sol";
import {DeployStakingRewards} from "script/DeployStakingRewards.s.sol";
import {HelperConfig} from "script/HelperConfig.s.sol";

/// @title StakingInvariantsTest
/// @notice Invariant tests for StakingRewards.
///
///         Foundry randomly calls StakingHandler functions in random order,
///         with random inputs, for 256 rounds. After every single call,
///         every invariant_ function is checked. If any fails, Foundry prints
///         the exact sequence of calls that broke it.
///
///         Invariants tested:
///           1. totalSupply always matches our ghost tracking
///           2. Contract TokenA balance always covers totalSupply
///           3. No actor can have earned more than the contract's TokenB balance
///           4. rewardRate * remaining time never exceeds contract's TokenB balance
///           5. Sum of all user balances always equals totalSupply
///           6. No user's staked balance ever exceeds their ghost tracked balance
contract StakingInvariantsTest is Test {
    // ── Contracts ─────────────────────────────────────────────────────────────
    StakingRewards public stakingRewards;
    StakingHandler public handler;
    TokenA         public tokenA;
    TokenB         public tokenB;
    HelperConfig   public config;

    address public DEPLOYER;

    // ── Setup ─────────────────────────────────────────────────────────────────

    function setUp() public {
        DeployStakingRewards deployer = new DeployStakingRewards();
        (stakingRewards, config) = deployer.run();

        tokenA = TokenA(address(stakingRewards.stakingToken()));
        tokenB = TokenB(address(stakingRewards.rewardsToken()));

        (,,, DEPLOYER) = config.activeNetworkConfig();

        // Deploy handler — gives Foundry a constrained set of actions to call
        handler = new StakingHandler(stakingRewards, tokenA, tokenB, DEPLOYER);

        // CRITICAL: tell Foundry to only call functions on the handler
        // Without this, Foundry calls functions on every contract it knows about
        targetContract(address(handler));
    }

    // =========================================================================
    // Invariant 1 — totalSupply matches ghost tracking
    // =========================================================================
    // No matter what sequence of stake/withdraw/exit happens,
    // the contract's totalSupply must always match our own tracking.
    // If they diverge, tokens were created or destroyed incorrectly.

    function invariant_TotalSupplyMatchesGhostTracking() public view {
        assertEq(
            stakingRewards.totalSupply(),
            handler.ghost_totalStaked(),
            "totalSupply diverged from ghost tracking"
        );
    }

    // =========================================================================
    // Invariant 2 — Contract TokenA balance always covers totalSupply
    // =========================================================================
    // The contract must always hold at least as much TokenA as it owes stakers.
    // If tokenA.balanceOf(contract) < totalSupply, some users can't withdraw.

    function invariant_ContractTokenACoversAllStakers() public view {
        assertGe(
            tokenA.balanceOf(address(stakingRewards)),
            stakingRewards.totalSupply(),
            "Contract TokenA balance cannot cover all stakers"
        );
    }

    // =========================================================================
    // Invariant 3 — No actor earned more than contract's TokenB balance
    // =========================================================================
    // The contract must always be able to pay any individual user their rewards.
    // If earned(user) > tokenB.balanceOf(contract), that user can never claim.

    function invariant_EarnedNeverExceedsContractTokenBBalance() public view {
        address[] memory actors = handler.getActors();
        uint256 contractTokenBBalance = tokenB.balanceOf(address(stakingRewards));

        for (uint256 i = 0; i < actors.length; i++) {
            assertLe(
                stakingRewards.earned(actors[i]),
                contractTokenBBalance,
                "An actor earned more than contract's TokenB balance"
            );
        }
    }

    // =========================================================================
    // Invariant 4 — rewardRate * remaining time never exceeds TokenB balance
    // =========================================================================
    // The contract must never promise more future rewards than it actually holds.
    // This is the solvency check — if this breaks, future claimers will get nothing.

    function invariant_RewardRateNeverExceedsTokenBBalance() public view {
        uint256 remainingTime = stakingRewards.periodFinish() > block.timestamp
            ? stakingRewards.periodFinish() - block.timestamp
            : 0;

        assertLe(
            stakingRewards.rewardRate() * remainingTime,
            tokenB.balanceOf(address(stakingRewards)),
            "Future reward obligations exceed contract TokenB balance"
        );
    }

    // =========================================================================
    // Invariant 5 — Sum of all actor balances equals totalSupply
    // =========================================================================
    // The sum of every individual user's staked balance must equal totalSupply.
    // This confirms no tokens are being double-counted or lost in the accounting.

    function invariant_SumOfBalancesEqualsTotalSupply() public view {
        address[] memory actors = handler.getActors();
        uint256 sumOfBalances;

        for (uint256 i = 0; i < actors.length; i++) {
            sumOfBalances += stakingRewards.balanceOf(actors[i]);
        }

        assertEq(
            sumOfBalances,
            stakingRewards.totalSupply(),
            "Sum of actor balances does not equal totalSupply"
        );
    }

    // =========================================================================
    // Invariant 6 — Contract balanceOf never exceeds ghost tracked balance
    // =========================================================================
    // For every actor, the contract's recorded balance must match our ghost tracking.
    // If they differ, the contract is crediting or debiting the wrong amounts.

    function invariant_ContractBalancesMatchGhostBalances() public view {
        address[] memory actors = handler.getActors();

        for (uint256 i = 0; i < actors.length; i++) {
            assertEq(
                stakingRewards.balanceOf(actors[i]),
                handler.ghost_stakedBalances(actors[i]),
                "Contract balance diverged from ghost balance for an actor"
            );
        }
    }
}