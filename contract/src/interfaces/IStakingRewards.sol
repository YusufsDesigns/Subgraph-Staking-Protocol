// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStakingRewards {
    // ── Events ────────────────────────────────────────────────────────────────
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardAdded(uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);

    // ── User Functions ────────────────────────────────────────────────────────
    function stake(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function claimReward() external;
    function exit() external;

    // ── View Functions ────────────────────────────────────────────────────────
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function lastTimeRewardApplicable() external view returns (uint256);
    function rewardPerToken() external view returns (uint256);
    function earned(address account) external view returns (uint256);

    // ── Owner Functions ───────────────────────────────────────────────────────
    function notifyRewardAmount(uint256 reward) external;
    function setRewardsDuration(uint256 duration) external;

    // ── Public State Getters ──────────────────────────────────────────────────
    function rewardsDuration() external view returns (uint256);
    function periodFinish() external view returns (uint256);
    function rewardRate() external view returns (uint256);
    function lastUpdateTime() external view returns (uint256);
    function rewardPerTokenStored() external view returns (uint256);
    function userRewardPerTokenPaid(address account) external view returns (uint256);
    function rewards(address account) external view returns (uint256);
}