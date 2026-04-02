// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HelperConfig} from "script/HelperConfig.s.sol";
import {StakingRewards} from "src/StakingRewards.sol";
import {TokenB} from "src/TokenB.sol";

contract DeployStakingRewards is Script {
    uint256 public constant INITIAL_REWARD_AMOUNT = 1_000e18;

    function run() external returns (StakingRewards stakingRewards, HelperConfig config) {
        config = new HelperConfig();

        (address stakingToken, address rewardsToken, uint256 rewardsDuration, address deployerAddress) =
            config.activeNetworkConfig();

        vm.startBroadcast();

        stakingRewards = new StakingRewards(deployerAddress, stakingToken, rewardsToken, rewardsDuration);

        // Mint reward tokens to deployer
        TokenB(rewardsToken).mint(deployerAddress, INITIAL_REWARD_AMOUNT);

        // Transfer reward tokens to staking contract
        TokenB(rewardsToken).transfer(address(stakingRewards), INITIAL_REWARD_AMOUNT);

        // Now notify reward amount
        stakingRewards.notifyRewardAmount(INITIAL_REWARD_AMOUNT);

        vm.stopBroadcast();
    }
}
