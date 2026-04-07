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
    address public DEPLOYER;

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
        DEPLOYER = deployerAddr;

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
        vm.prank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);

        vm.warp(block.timestamp + 1 days);

        uint256 aliceRewardBalance = stakingRewards.earned(ALICE);

        vm.prank(ALICE);
        stakingRewards.claimReward();

        assertEq(tokenB.balanceOf(ALICE), aliceRewardBalance);
    }

    function test_ClaimReward_ZeroesRewardsMapping() public {
        vm.prank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);

        vm.warp(block.timestamp + 1 days);

        vm.prank(ALICE);
        stakingRewards.claimReward();

        assertEq(stakingRewards.rewards(ALICE), 0);
    }

    function test_ClaimReward_EmitsRewardClaimedEvent() public {
        vm.prank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);

        vm.warp(block.timestamp + 1 days);

        uint256 aliceRewardBalance = stakingRewards.earned(ALICE);

        vm.prank(ALICE);
        vm.expectEmit(true, false, false, true);
        emit IStakingRewards.RewardClaimed(ALICE, aliceRewardBalance);
        stakingRewards.claimReward();
    }

    function test_ClaimReward_NoOp_WhenNothingEarned() public {
        // TODO: claim with nothing earned — should not revert, transfer 0
    }

    // =========================================================================
    // exit()
    // =========================================================================

    function test_Exit_WithdrawsAllAndClaims() public {
        // TODO: after exit, balance == 0 and tokenB > 0 in Alice's wallet
        vm.startPrank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);
        stakingRewards.withdraw(WITHDRAW_AMOUNT);

        vm.warp(block.timestamp + 1 days);

        uint256 aliceRewardBalance = stakingRewards.earned(ALICE);

        stakingRewards.claimReward();
        vm.stopPrank();

        uint256 remainingUserBalance = STAKE_AMOUNT - WITHDRAW_AMOUNT;

        assertEq(stakingRewards.balanceOf(ALICE), remainingUserBalance);
        assertEq(tokenB.balanceOf(ALICE), aliceRewardBalance);
    }

    function test_Exit_ZeroesAllUserState() public {
        vm.startPrank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);
        stakingRewards.withdraw(STAKE_AMOUNT);

        vm.warp(block.timestamp + 1 days);

        stakingRewards.claimReward();
        vm.stopPrank();

        assertEq(stakingRewards.balanceOf(ALICE), 0);
        assertEq(stakingRewards.rewards(ALICE), 0);
    }

    // =========================================================================
    // notifyRewardAmount()
    // =========================================================================

    function test_NotifyRewardAmount_SetsCorrectRewardRate() public view {
        assertEq(stakingRewards.rewardRate(), REWARD_AMOUNT / REWARDS_DURATION);
    }

    function test_NotifyRewardAmount_SetsPeriodFinish() public view {
        assertEq(stakingRewards.rewardsDuration(), REWARDS_DURATION);
    }

    function test_NotifyRewardAmount_MidPeriod_RollsOverRemaining() public {
        uint256 REWARD_RATE = stakingRewards.rewardRate();
        // TODO: seed → warp halfway → seed again → check new rate includes leftover
        vm.warp(block.timestamp + 4 days);

        uint256 remaining = (stakingRewards.periodFinish() - block.timestamp) * REWARD_RATE;
        REWARD_RATE = (REWARD_AMOUNT + remaining) / REWARDS_DURATION;

        vm.startPrank(DEPLOYER);
        tokenB.transfer(address(stakingRewards), REWARD_AMOUNT);
        stakingRewards.notifyRewardAmount(REWARD_AMOUNT);
        vm.stopPrank();

        assertEq(stakingRewards.rewardRate(), REWARD_RATE);
    }

    function test_NotifyRewardAmount_RevertsWhen_NotOwner() public {
        // TODO
    }

    function test_NotifyRewardAmount_RevertsWhen_RateTooHigh() public {
        // TODO: call without funding contract first
        vm.startPrank(DEPLOYER);
        vm.expectRevert(StakingRewards.StakingRewards__RewardRateTooHigh.selector);
        stakingRewards.notifyRewardAmount(REWARD_AMOUNT);
        vm.stopPrank();
    }

    // =========================================================================
    // setRewardsDuration()
    // =========================================================================

    function test_SetRewardsDuration_UpdatesDuration() public {
        // Warp past the active period so we're allowed to change duration
        vm.warp(stakingRewards.periodFinish() + 1);

        uint256 newDuration = 14 days;

        vm.prank(DEPLOYER);
        stakingRewards.setRewardsDuration(newDuration);

        assertEq(stakingRewards.rewardsDuration(), newDuration);
    }

    function test_SetRewardsDuration_EmitsEvent() public {
        vm.warp(stakingRewards.periodFinish() + 1);

        uint256 newDuration = 14 days;

        vm.prank(DEPLOYER);
        vm.expectEmit(false, false, false, true);
        emit IStakingRewards.RewardsDurationUpdated(newDuration);
        stakingRewards.setRewardsDuration(newDuration);
    }

    function test_SetRewardsDuration_RevertsWhen_PeriodActive() public {
        // Period is still active — should revert
        vm.prank(DEPLOYER);
        vm.expectRevert(StakingRewards.StakingRewards__RewardPeriodNotFinished.selector);
        stakingRewards.setRewardsDuration(14 days);
    }

    // =========================================================================
    // earned() / rewardPerToken()
    // =========================================================================

    function test_Earned_IsZeroWithNoTimeElapsed() public {
        // TODO
        vm.prank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);
        assertEq(stakingRewards.earned(ALICE), 0);
    }

    function test_Earned_IncreasesOverTime() public {
        // TODO: stake → warp 1 day → assert earned > 0
        vm.prank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);

        vm.warp(block.timestamp + 1 days);

        assertGt(stakingRewards.earned(ALICE), 0);
    }

    function test_Earned_ProportionalToStakeShare() public {
        // Alice stakes 100, Bob stakes 300 → total 400
        // Alice owns 25% of pool, Bob owns 75%
        vm.prank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT); // 100e18

        vm.prank(BOB);
        stakingRewards.stake(300e18);

        vm.warp(block.timestamp + 1 days);

        uint256 aliceEarned = stakingRewards.earned(ALICE);
        uint256 bobEarned = stakingRewards.earned(BOB);

        // Bob should have earned exactly 3x Alice (300/100 ratio)
        // Use assertApproxEqAbs to tolerate 1 wei of rounding
        assertApproxEqAbs(bobEarned, aliceEarned * 3, 1e10);

        // Together they should have earned close to 1 day worth of rewards
        uint256 oneDayRewards = stakingRewards.rewardRate() * 1 days;
        assertApproxEqAbs(aliceEarned + bobEarned, oneDayRewards, 1e10);
    }

    function test_Earned_StopsAfterPeriodFinish() public {
        // TODO: warp past period → check earned stops growing
        vm.prank(ALICE);
        stakingRewards.stake(STAKE_AMOUNT);

        vm.warp(stakingRewards.periodFinish() + 1);

        uint256 aliceEarnedBeforePeriodEnds = stakingRewards.earned(ALICE);

        vm.warp(block.timestamp + 1 days);

        uint256 aliceEarnedAfterPeriodEnds = stakingRewards.earned(ALICE);

        assertEq(aliceEarnedBeforePeriodEnds, aliceEarnedAfterPeriodEnds);
    }

    function test_RewardPerToken_ZeroWhenNothingStaked() public view {
        // TODO
        assertEq(stakingRewards.rewardPerToken(), 0);
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

        assertEq(tokenA.balanceOf(ALICE), balanceBefore);
    }

    function testFuzz_Earned_NeverExceedsContractBalance(uint256 stakeAmount, uint256 timeElapsed) public {
        stakeAmount = bound(stakeAmount, 1e18, STAKE_AMOUNT);
        timeElapsed = bound(timeElapsed, 1, REWARDS_DURATION * 2);

        vm.prank(ALICE);
        stakingRewards.stake(stakeAmount);

        vm.warp(block.timestamp + timeElapsed);

        assertLe(stakingRewards.earned(ALICE), tokenB.balanceOf(address(stakingRewards)));
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

        assertEq(stakingRewards.totalSupply(), stakingRewards.balanceOf(ALICE) + stakingRewards.balanceOf(BOB));
    }

    // =========================================================================
    // HelperConfig Tests
    // =========================================================================

    function test_HelperConfig_AnvilChain_SetsCorrectStakingToken() public view {
        (address stakingToken,,,) = config.activeNetworkConfig();
        assertNotEq(stakingToken, address(0));
        assertEq(stakingToken, address(tokenA));
    }

    function test_HelperConfig_AnvilChain_SetsCorrectRewardsToken() public view {
        (, address rewardsToken,,) = config.activeNetworkConfig();
        assertNotEq(rewardsToken, address(0));
        assertEq(rewardsToken, address(tokenB));
    }

    function test_HelperConfig_AnvilChain_SetsCorrectRewardsDuration() public view {
        (,, uint256 rewardsDuration,) = config.activeNetworkConfig();
        assertEq(rewardsDuration, 7 days);
    }

    function test_HelperConfig_AnvilChain_SetsCorrectDeployerAddress() public view {
        (,,, address deployerAddress) = config.activeNetworkConfig();
        assertEq(deployerAddress, vm.addr(config.ANVIL_DEFAULT_KEY()));
    }

    function test_HelperConfig_AnvilChain_DeployerReceivesInitialTokenASupply() public view {
        (,,, address deployerAddress) = config.activeNetworkConfig();
        // Deployer got INITIAL_SUPPLY on deploy — some was seeded to staking contract
        // but the rest must still be in their wallet
        assertGt(tokenA.balanceOf(deployerAddress), 0);
    }

    function test_HelperConfig_AnvilChain_DeployerReceivesInitialTokenBSupply() public view {
        (,,, address deployerAddress) = config.activeNetworkConfig();
        // Deployer got INITIAL_SUPPLY of TokenB — some was sent to staking contract
        // as initial rewards, remainder stays in deployer wallet
        assertGt(tokenB.balanceOf(deployerAddress), 0);
    }
}
