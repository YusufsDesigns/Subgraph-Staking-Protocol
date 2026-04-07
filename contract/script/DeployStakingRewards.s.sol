// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HelperConfig} from "script/HelperConfig.s.sol";
import {StakingRewards} from "src/StakingRewards.sol";
import {TokenA} from "src/TokenA.sol";
import {TokenB} from "src/TokenB.sol";

contract DeployStakingRewards is Script {
    uint256 public constant INITIAL_REWARD_AMOUNT = 1_000e18;

    function run() external returns (StakingRewards stakingRewards, HelperConfig config) {
        config = new HelperConfig();

        (address stakingToken, address rewardsToken, uint256 rewardsDuration, address deployerAddress) =
            config.activeNetworkConfig();

        vm.startBroadcast();

        stakingRewards = new StakingRewards(deployerAddress, stakingToken, rewardsToken, rewardsDuration);

        TokenB(rewardsToken).mint(address(stakingRewards), INITIAL_REWARD_AMOUNT);

        // Now notify reward amount
        stakingRewards.notifyRewardAmount(INITIAL_REWARD_AMOUNT);

        // Fund test wallets with TokenA
        TokenA(stakingToken).mint(0x08e29966eD9D2FC9c861DB5F37869Fe9766555b3, 1_000e18);
        TokenA(stakingToken).mint(0x043F00335Cb668aF83e934a72a4009957afcEd33, 1_000e18);

        vm.stopBroadcast();
    }
}
