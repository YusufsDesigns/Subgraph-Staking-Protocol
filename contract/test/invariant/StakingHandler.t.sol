// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StakingRewards} from "src/StakingRewards.sol";
import {TokenA} from "src/TokenA.sol";
import {TokenB} from "src/TokenB.sol";

/// @title StakingHandler
/// @notice Wraps StakingRewards for invariant testing.
///         Foundry calls functions on this contract randomly.
///         Every call is made valid and realistic before hitting the real contract.
///         Ghost variables track parallel state so invariants can compare against them.
contract StakingHandler is Test {
    // ── Contracts ─────────────────────────────────────────────────────────────
    StakingRewards public stakingRewards;
    TokenA public tokenA;
    TokenB public tokenB;

    // ── Actors ────────────────────────────────────────────────────────────────
    address[] public actors;
    address internal currentActor;

    // ── Ghost Variables ───────────────────────────────────────────────────────
    // We maintain our own parallel tracking of state.
    // If these ever diverge from the contract — something is wrong.
    uint256 public ghost_totalStaked;
    uint256 public ghost_totalRewardsClaimed;

    // Track each actor's staked balance ourselves
    mapping(address => uint256) public ghost_stakedBalances;

    // ── Constants ─────────────────────────────────────────────────────────────
    uint256 constant INITIAL_USER_BALANCE = 10_000e18;
    uint256 constant MAX_STAKE = 1_000e18;
    uint256 constant MAX_REWARD_SEED = 10_000e18;

    address public DEPLOYER;

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(StakingRewards _stakingRewards, TokenA _tokenA, TokenB _tokenB, address _deployer) {
        stakingRewards = _stakingRewards;
        tokenA = _tokenA;
        tokenB = _tokenB;
        DEPLOYER = _deployer;

        // Create a realistic set of actors
        actors.push(makeAddr("actor1"));
        actors.push(makeAddr("actor2"));
        actors.push(makeAddr("actor3"));
        actors.push(makeAddr("actor4"));
        actors.push(makeAddr("actor5"));

        // Fund every actor with TokenA and pre-approve the staking contract
        vm.startPrank(DEPLOYER);
        for (uint256 i = 0; i < actors.length; i++) {
            tokenA.mint(actors[i], INITIAL_USER_BALANCE);
        }
        vm.stopPrank();

        for (uint256 i = 0; i < actors.length; i++) {
            vm.prank(actors[i]);
            tokenA.approve(address(stakingRewards), type(uint256).max);
        }
    }

    // ── Handler Functions (Foundry calls these randomly) ──────────────────────

    /// @notice Simulate a user staking a random amount
    function stake(uint256 actorSeed, uint256 amount) public {
        currentActor = _pickActor(actorSeed);
        amount = bound(amount, 1e15, MAX_STAKE);

        // Ensure actor has enough balance — mint more if needed
        if (tokenA.balanceOf(currentActor) < amount) {
            vm.prank(DEPLOYER);
            tokenA.mint(currentActor, amount);
        }

        vm.prank(currentActor);
        stakingRewards.stake(amount);

        // Update ghost state
        ghost_totalStaked += amount;
        ghost_stakedBalances[currentActor] += amount;
    }

    /// @notice Simulate a user withdrawing a random portion of their stake
    function withdraw(uint256 actorSeed, uint256 amount) public {
        currentActor = _pickActor(actorSeed);

        uint256 stakedBalance = stakingRewards.balanceOf(currentActor);

        // Skip if actor has nothing staked — don't let the campaign degenerate into reverts
        if (stakedBalance == 0) return;

        amount = bound(amount, 1, stakedBalance);

        vm.prank(currentActor);
        stakingRewards.withdraw(amount);

        // Update ghost state
        ghost_totalStaked -= amount;
        ghost_stakedBalances[currentActor] -= amount;
    }

    /// @notice Simulate a user claiming their rewards
    function claimReward(uint256 actorSeed) public {
        currentActor = _pickActor(actorSeed);

        uint256 pendingReward = stakingRewards.earned(currentActor);

        // Skip if nothing to claim
        if (pendingReward == 0) return;

        uint256 balanceBefore = tokenB.balanceOf(currentActor);

        vm.prank(currentActor);
        stakingRewards.claimReward();

        uint256 actualClaimed = tokenB.balanceOf(currentActor) - balanceBefore;
        ghost_totalRewardsClaimed += actualClaimed;
    }

    /// @notice Simulate a user calling exit (full withdraw + claim)
    function exit(uint256 actorSeed) public {
        currentActor = _pickActor(actorSeed);

        uint256 stakedBalance = stakingRewards.balanceOf(currentActor);
        if (stakedBalance == 0) return;

        // uint256 pendingReward = stakingRewards.earned(currentActor);
        uint256 balanceBefore = tokenB.balanceOf(currentActor);

        vm.prank(currentActor);
        stakingRewards.exit();

        // Update ghost state
        ghost_totalStaked -= stakedBalance;
        ghost_stakedBalances[currentActor] = 0;
        ghost_totalRewardsClaimed += tokenB.balanceOf(currentActor) - balanceBefore;
    }

    /// @notice Seed a new reward period — simulates the owner funding the contract
    function notifyRewardAmount(uint256 amount) public {
        amount = bound(amount, 1e18, MAX_REWARD_SEED);

        vm.startPrank(DEPLOYER);
        tokenB.mint(DEPLOYER, amount);
        tokenB.transfer(address(stakingRewards), amount * 2);
        stakingRewards.notifyRewardAmount(amount);
        vm.stopPrank();
    }

    /// @notice Warp time forward realistically — not billions of seconds
    function warpTime(uint256 seconds_) public {
        seconds_ = bound(seconds_, 1, 30 days);
        vm.warp(block.timestamp + seconds_);
    }

    // ── Internal Helpers ──────────────────────────────────────────────────────

    function _pickActor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    // ── Ghost Getters (for invariant assertions) ──────────────────────────────

    function getActors() external view returns (address[] memory) {
        return actors;
    }
}
