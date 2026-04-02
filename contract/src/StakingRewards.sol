// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IStakingRewards} from "src/interfaces/IStakingRewards.sol";

/// @title StakingRewards
/// @author Yusuf Lawal
/// @notice Users stake Token A and earn Token B proportional to their
///         share of the pool and duration staked.
///
/// @dev The Math:
///
///   rewardPerToken() =
///     rewardPerTokenStored
///     + (rewardRate * (lastTimeRewardApplicable() - lastUpdateTime) * PRECISION)
///       / totalSupply
///
///   earned(user) =
///     (s_balances[user] * (rewardPerToken() - userRewardPerTokenPaid[user]) / PRECISION)
///     + rewards[user]
///
///   The updateReward modifier snapshots this before every state change.
contract StakingRewards is IStakingRewards, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ── Errors ────────────────────────────────────────────────────────────────
    error StakingRewards__ZeroAmount();
    error StakingRewards__ZeroAddress();
    error StakingRewards__RewardPeriodNotFinished();
    error StakingRewards__RewardRateTooHigh();
    error StakingRewards__InsufficientBalance(uint256 available, uint256 requested);

    // ── Constants ─────────────────────────────────────────────────────────────
    uint256 private constant PRECISION = 1e18;

    // ── State Variables ───────────────────────────────────────────────────────
    IERC20 public immutable rewardsToken;
    IERC20 public immutable stakingToken;

    uint256 public rewardsDuration;
    uint256 public periodFinish;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address user => uint256 rewardPerTokenPaid) public userRewardPerTokenPaid;
    mapping(address user => uint256 pendingReward) public rewards;

    uint256 private s_totalSupply;
    mapping(address user => uint256 balance) private s_balances;

    // ── Modifier ──────────────────────────────────────────────────────────────

    /// @dev Snapshots the global accumulator and saves the caller's earned()
    ///      before any state change happens. Apply to every state-changing function.
    ///
    ///  Steps:
    ///    1. rewardPerTokenStored = rewardPerToken()
    ///    2. lastUpdateTime       = lastTimeRewardApplicable()
    ///    3. if account != address(0):
    ///         rewards[account]               = earned(account)
    ///         userRewardPerTokenPaid[account] = rewardPerTokenStored
    modifier updateReward(address account) {
        // TODO: implement
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if(account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(
        address initialOwner,
        address _stakingToken,
        address _rewardsToken,
        uint256 _rewardsDuration
    ) Ownable(initialOwner) {
        if (_stakingToken == address(0) || _rewardsToken == address(0)) {
            revert StakingRewards__ZeroAddress();
        }
        stakingToken    = IERC20(_stakingToken);
        rewardsToken    = IERC20(_rewardsToken);
        rewardsDuration = _rewardsDuration;
    }

    // ── External: User Functions ──────────────────────────────────────────────

    /// @inheritdoc IStakingRewards
    /// @dev CEI — Checks: amount > 0
    ///           Effects: s_totalSupply += amount; s_balances[msg.sender] += amount
    ///           Interactions: stakingToken.safeTransferFrom(...)
    ///      Emit Staked(msg.sender, amount)
    function stake(uint256 amount) public nonReentrant updateReward(msg.sender) {
        // TODO
        if(amount <= 0) revert StakingRewards__ZeroAmount();

        s_totalSupply += amount;
        s_balances[msg.sender] += amount;

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /// @inheritdoc IStakingRewards
    /// @dev CEI — Checks: amount > 0; balance >= amount
    ///           Effects: s_totalSupply -= amount; s_balances[msg.sender] -= amount
    ///           Interactions: stakingToken.safeTransfer(...)
    ///      Emit Withdrawn(msg.sender, amount)
    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        // TODO
        if(amount <= 0) {
            revert StakingRewards__ZeroAmount();
        }
        if(amount > s_balances[msg.sender]) {
            revert StakingRewards__InsufficientBalance(s_balances[msg.sender], amount);
        }

        s_totalSupply -= amount;
        s_balances[msg.sender] -= amount;

        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @inheritdoc IStakingRewards
    /// @dev CEI — Effects: cache rewards[msg.sender]; set to 0
    ///           Interactions: rewardsToken.safeTransfer(...) only if reward > 0
    ///      Emit RewardClaimed(msg.sender, reward)
    function claimReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        // TODO
        if(reward > 0) {
        rewards[msg.sender] = 0;
            rewardsToken.safeTransfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    /// @inheritdoc IStakingRewards
    function exit() public {
        withdraw(s_balances[msg.sender]);
        claimReward();
    }

    // ── External: Owner Functions ─────────────────────────────────────────────

    /// @inheritdoc IStakingRewards
    /// @dev Case 1 — new period (block.timestamp >= periodFinish):
    ///        rewardRate = reward / rewardsDuration
    ///      Case 2 — mid-period:
    ///        remaining  = (periodFinish - block.timestamp) * rewardRate
    ///        rewardRate = (reward + remaining) / rewardsDuration
    ///      Always verify: rewardRate * rewardsDuration <= rewardsToken.balanceOf(this)
    ///      Then: lastUpdateTime = block.timestamp; periodFinish = block.timestamp + rewardsDuration
    ///      Emit RewardAdded(reward)
    function notifyRewardAmount(uint256 reward) external onlyOwner updateReward(address(0)) {
        if(block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = (periodFinish - block.timestamp) * rewardRate;
            rewardRate = (reward + remaining) / rewardsDuration;
        }

        if(rewardRate * rewardsDuration > rewardsToken.balanceOf(address(this))){
            revert StakingRewards__RewardRateTooHigh();
        }

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
    }

    /// @inheritdoc IStakingRewards
    /// @dev Revert StakingRewards__RewardPeriodNotFinished if block.timestamp < periodFinish
    ///      Emit RewardsDurationUpdated(duration)
    function setRewardsDuration(uint256 duration) external onlyOwner {
        if(block.timestamp < periodFinish) {
            revert StakingRewards__RewardPeriodNotFinished();
        }

        rewardsDuration = duration;
        emit RewardsDurationUpdated(duration);
    }

    // ── Public View Functions ─────────────────────────────────────────────────

    function totalSupply() external view returns (uint256) {
        return s_totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return s_balances[account];
    }

    /// @inheritdoc IStakingRewards
    /// @dev return block.timestamp < periodFinish ? block.timestamp : periodFinish
    function lastTimeRewardApplicable() public view returns (uint256) {
        // TODO
        return block.timestamp >= periodFinish ? periodFinish : block.timestamp;
    }

    /// @inheritdoc IStakingRewards
    /// @dev If s_totalSupply == 0 return rewardPerTokenStored (accumulator doesn't move)
    function rewardPerToken() public view returns (uint256) {
        // TODO
        if(s_totalSupply == 0) {
            return rewardPerTokenStored;
        }

        return rewardPerTokenStored + (rewardRate * (lastTimeRewardApplicable() - lastUpdateTime) * PRECISION) / s_totalSupply;
    }

    /// @inheritdoc IStakingRewards
    function earned(address account) public view returns (uint256) {
        // TODO
        return (s_balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) / PRECISION) + rewards[account];
    }
}