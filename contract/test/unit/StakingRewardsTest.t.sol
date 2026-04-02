// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {DeployStakingRewards} from "script/DeployStakingRewards.s.sol";
import {HelperConfig} from "script/HelperConfig.s.sol";
import {StakingRewards} from "src/StakingRewards.sol";
import {IStakingRewards} from "src/interfaces/IStakingRewards.sol";
import {TokenA} from "src/TokenA.sol";
import {TokenB} from "src/TokenB.sol";

contract StakingRewardsTest is Test {
    // ── Contracts ─────────────────────────────────────────────────────────────
    StakingRewards public stakingRewards;
    HelperConfig public config;
    TokenA public tokenA;
    TokenB public tokenB;

    // ── Actors ────────────────────────────────────────────────────────────────
    address public OWNER = makeAddr("owner");
    address public ALICE = makeAddr("alice");
    address public BOB = makeAddr("bob");
    address public CHARLIE = makeAddr("charlie");

    // ── Constants ─────────────────────────────────────────────────────────────
    uint256 public constant STAKE_AMOUNT = 100e18;
    uint256 public constant WITHDRAW_AMOUNT = 10e18;
    uint256 public constant REWARD_AMOUNT = 1_000e18;
    uint256 public constant REWARDS_DURATION = 7 days;

    // ── Setup ─────────────────────────────────────────────────────────────────

    function setUp() public {
        DeployStakingRewards deployer = new DeployStakingRewards();
        (stakingRewards, config) = deployer.run();

        tokenA = TokenA(address(stakingRewards.stakingToken()));
        tokenB = TokenB(address(stakingRewards.rewardsToken()));

        // Use deployerAddress — no key, just the address
        (,,, address deployerAddr) = config.activeNetworkConfig();

        vm.startPrank(deployerAddr);
        tokenA.mint(ALICE, STAKE_AMOUNT * 10);
        tokenA.mint(BOB, STAKE_AMOUNT * 10);
        tokenA.mint(CHARLIE, STAKE_AMOUNT * 10);
        vm.stopPrank();

        vm.prank(ALICE);
        tokenA.approve(address(stakingRewards), type(uint256).max);
        vm.prank(BOB);
        tokenA.approve(address(stakingRewards), type(uint256).max);
        vm.prank(CHARLIE);
        tokenA.approve(address(stakingRewards), type(uint256).max);
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    function test_Constructor_SetsTokenAddresses() public view {
        assertEq(address(stakingRewards.stakingToken()), address(tokenA));
        assertEq(address(stakingRewards.rewardsToken()), address(tokenB));
    }

    function test_Constructor_SetsRewardsDuration() public view {
        // TODO
        assertEq(stakingRewards.rewardsDuration(), REWARDS_DURATION);
    }

    function test_Constructor_RevertsWhen_ZeroAddressTokens() public {
        vm.expectRevert(StakingRewards.StakingRewards__ZeroAddress.selector);
        new StakingRewards(address(this), address(0), address(tokenB), REWARDS_DURATION);

        vm.expectRevert(StakingRewards.StakingRewards__ZeroAddress.selector);
        new StakingRewards(address(this), address(tokenA), address(0), REWARDS_DURATION);
    }

    // =========================================================================
    // stake()
    // =========================================================================

    function test_Stake_UpdatesUserBalance() public {
        vm.startPrank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);
        vm.stopPrank();

        assertEq(stakingRewards.balanceOf(ALICE), STAKE_AMOUNT);
    }

    function test_Stake_UpdatesTotalSupply() public {
        vm.startPrank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);
        vm.stopPrank();

        assertEq(stakingRewards.totalSupply(), STAKE_AMOUNT);
    }

    function test_Stake_TransfersTokenAFromUser() public {
        vm.startPrank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);
        vm.stopPrank();

        assertEq(tokenA.balanceOf(address(stakingRewards)), STAKE_AMOUNT);
    }

    function test_Stake_EmitsStakedEvent() public {
        vm.startPrank(ALICE);
        vm.expectEmit(true, false, false, true);
        emit IStakingRewards.Staked(ALICE, STAKE_AMOUNT);
        stakingRewards.stake(STAKE_AMOUNT);
        vm.stopPrank();
    }

    function test_Stake_RevertsWhen_ZeroAmount() public {
        vm.startPrank(ALICE);
        vm.expectRevert(StakingRewards.StakingRewards__ZeroAmount.selector);
        stakingRewards.stake(0);
        vm.stopPrank();
    }

    function test_Stake_MultipleUsers_TrackSeparately() public {
        vm.prank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);

        vm.prank(BOB);
        stakingRewards.stake(STAKE_AMOUNT);

        vm.prank(CHARLIE);
        stakingRewards.stake(STAKE_AMOUNT);

        assertEq(stakingRewards.balanceOf(ALICE), STAKE_AMOUNT);
        assertEq(stakingRewards.balanceOf(BOB), STAKE_AMOUNT);
        assertEq(stakingRewards.balanceOf(CHARLIE), STAKE_AMOUNT);

        assertEq(stakingRewards.totalSupply(), STAKE_AMOUNT * 3);
        assertEq(tokenA.balanceOf(address(stakingRewards)), STAKE_AMOUNT * 3);
    }

    // =========================================================================
    // withdraw()
    // =========================================================================

    function test_Withdraw_UpdatesUserBalance() public {
        vm.startPrank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);
        stakingRewards.withdraw(WITHDRAW_AMOUNT);
        vm.stopPrank();

        uint256 remainingUserBalance = STAKE_AMOUNT - WITHDRAW_AMOUNT;

        assertEq(stakingRewards.balanceOf(ALICE), remainingUserBalance);
    }

    function test_Withdraw_UpdatesTotalSupply() public {
        vm.startPrank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);
        stakingRewards.withdraw(WITHDRAW_AMOUNT);
        vm.stopPrank();

        uint256 remainingUserBalance = STAKE_AMOUNT - WITHDRAW_AMOUNT;

        assertEq(stakingRewards.totalSupply(), remainingUserBalance);
    }

    function test_Withdraw_ReturnsTokenAToUser() public {
        vm.startPrank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);
        stakingRewards.withdraw(STAKE_AMOUNT);
        vm.stopPrank();

        assertEq(tokenA.balanceOf(ALICE), STAKE_AMOUNT * 10);
    }

    function test_Withdraw_EmitsWithdrawnEvent() public {
        vm.startPrank(ALICE);
        stakingRewards.stake(WITHDRAW_AMOUNT);

        vm.expectEmit(true, false, false, true);
        emit IStakingRewards.Withdrawn(ALICE, WITHDRAW_AMOUNT);
        stakingRewards.withdraw(WITHDRAW_AMOUNT);

        vm.stopPrank();
    }

    function test_Withdraw_RevertsWhen_ZeroAmount() public {
        vm.startPrank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);
        vm.expectRevert(StakingRewards.StakingRewards__ZeroAmount.selector);
        stakingRewards.withdraw(0);
        vm.stopPrank();
    }

    function test_Withdraw_RevertsWhen_InsufficientBalance() public {
        uint256 inssuficientAmount = 10_000e18;
        vm.startPrank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);

        vm.expectRevert(
            abi.encodeWithSelector(
                StakingRewards.StakingRewards__InsufficientBalance.selector, STAKE_AMOUNT, inssuficientAmount
            )
        );
        stakingRewards.withdraw(inssuficientAmount);

        vm.stopPrank();
    }

    function test_Withdraw_DoesNotClaimPendingRewards() public {
        vm.startPrank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days);

        vm.startPrank(ALICE);
        stakingRewards.withdraw(STAKE_AMOUNT);
        vm.stopPrank();

        // Rewards should still be sitting there unclaimed
        assertGt(stakingRewards.earned(ALICE), 0);
    }

    // =========================================================================
    // claimReward()
    // =========================================================================

    function test_ClaimReward_TransfersCorrectTokenBAmount() public {
        // TODO: stake → _seedRewards → warp → claim → check tokenB balance
    }

    function test_ClaimReward_ZeroesRewardsMapping() public {
        // TODO
    }

    function test_ClaimReward_EmitsRewardClaimedEvent() public {
        // TODO
    }

    function test_ClaimReward_NoOp_WhenNothingEarned() public {
        // TODO: claim with nothing earned — should not revert, transfer 0
    }

    // =========================================================================
    // exit()
    // =========================================================================

    function test_Exit_WithdrawsAllAndClaims() public {
        // TODO: after exit, balance == 0 and tokenB > 0 in Alice's wallet
    }

    function test_Exit_ZeroesAllUserState() public {
        // TODO
    }

    // =========================================================================
    // notifyRewardAmount()
    // =========================================================================

    function test_NotifyRewardAmount_SetsCorrectRewardRate() public {
        // TODO: assertEq(rewardRate, REWARD_AMOUNT / REWARDS_DURATION)
    }

    function test_NotifyRewardAmount_SetsPeriodFinish() public {
        // TODO
    }

    function test_NotifyRewardAmount_MidPeriod_RollsOverRemaining() public {
        // TODO: seed → warp halfway → seed again → check new rate includes leftover
    }

    function test_NotifyRewardAmount_RevertsWhen_NotOwner() public {
        // TODO
    }

    function test_NotifyRewardAmount_RevertsWhen_RateTooHigh() public {
        // TODO: call without funding contract first
    }

    // =========================================================================
    // setRewardsDuration()
    // =========================================================================

    function test_SetRewardsDuration_UpdatesDuration() public {
        // TODO: warp past periodFinish → set → assert
    }

    function test_SetRewardsDuration_EmitsEvent() public {
        // TODO
    }

    function test_SetRewardsDuration_RevertsWhen_PeriodActive() public {
        // TODO
    }

    // =========================================================================
    // earned() / rewardPerToken()
    // =========================================================================

    function test_Earned_IsZeroWithNoTimeElapsed() public {
        // TODO
    }

    function test_Earned_IncreasesOverTime() public {
        // TODO: stake → warp 1 day → assert earned > 0
    }

    function test_Earned_ProportionalToStakeShare() public {
        // TODO: Alice 100, Bob 300 → Alice earns ~25%, Bob ~75%
    }

    function test_Earned_StopsAfterPeriodFinish() public {
        // TODO: warp past period → check earned stops growing
    }

    function test_RewardPerToken_ZeroWhenNothingStaked() public {
        // TODO
    }

    // =========================================================================
    // Fuzz Tests
    // =========================================================================

    function testFuzz_Stake_Withdraw_RoundTrip(uint256 amount) public {
        amount = bound(amount, 1e15, STAKE_AMOUNT * 5);

        (,,, address deployerAddr) = config.activeNetworkConfig();
        vm.prank(deployerAddr);
        tokenA.mint(ALICE, amount);

        uint256 balanceBefore = tokenA.balanceOf(ALICE);

        vm.startPrank(ALICE);
        stakingRewards.stake(amount);
        stakingRewards.withdraw(amount);
        vm.stopPrank();

        // TODO: assertEq(tokenA.balanceOf(ALICE), balanceBefore)
    }

    function testFuzz_Earned_NeverExceedsContractBalance(uint256 stakeAmount, uint256 timeElapsed) public {
        stakeAmount = bound(stakeAmount, 1e18, STAKE_AMOUNT);
        timeElapsed = bound(timeElapsed, 1, REWARDS_DURATION * 2);

        vm.prank(ALICE);
        stakingRewards.stake(stakeAmount);

        vm.warp(block.timestamp + timeElapsed);

        // TODO: assertLe(stakingRewards.earned(ALICE), tokenB.balanceOf(address(stakingRewards)))
    }

    function testFuzz_TotalSupply_EqualsSumOfBalances(uint256 aliceAmount, uint256 bobAmount) public {
        aliceAmount = bound(aliceAmount, 1e15, STAKE_AMOUNT);
        bobAmount = bound(bobAmount, 1e15, STAKE_AMOUNT);

        (,,, address deployerAddr) = config.activeNetworkConfig();
        vm.prank(deployerAddr);
        tokenA.mint(BOB, bobAmount);

        vm.prank(ALICE);
        stakingRewards.stake(aliceAmount);

        vm.prank(BOB);
        stakingRewards.stake(bobAmount);

        // TODO: assertEq(
        //   stakingRewards.totalSupply(),
        //   stakingRewards.balanceOf(ALICE) + stakingRewards.balanceOf(BOB)
        // )
    }
}
