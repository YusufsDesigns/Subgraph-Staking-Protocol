// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {TokenA} from "src/TokenA.sol";
import {TokenB} from "src/TokenB.sol";

contract HelperConfig is Script {
    error HelperConfig__UnsupportedChain(uint256 chainId);

    struct NetworkConfig {
        address stakingToken;
        address rewardsToken;
        uint256 rewardsDuration;
        address deployerAddress; // address only — no private key ever stored here
    }

    // Only used internally for Anvil test deployments — never for real networks
    uint256 public constant ANVIL_DEFAULT_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    uint256 public constant REWARDS_DURATION = 7 days;
    uint256 public constant INITIAL_SUPPLY   = 1_000_000e18;

    NetworkConfig public activeNetworkConfig;

    constructor() {
        if (block.chainid == 11155111) {
            activeNetworkConfig = getSepoliaConfig();
        } else if (block.chainid == 31337) {
            activeNetworkConfig = getOrCreateAnvilConfig();
        } else {
            revert HelperConfig__UnsupportedChain(block.chainid);
        }
    }

    /// @notice Sepolia config.
    ///         Reads your deployer address from .env (address only, never a key).
    ///         If tokens aren't deployed yet, vm.startBroadcast() with no args
    ///         uses the --account keystore signer from the CLI.
    function getSepoliaConfig() public returns (NetworkConfig memory) {
        address stakingToken    = vm.envOr("TOKEN_A_ADDRESS", address(0));
        address rewardsToken    = vm.envOr("TOKEN_B_ADDRESS", address(0));
        address deployerAddress = vm.envAddress("DEPLOYER_ADDRESS");

        if (stakingToken == address(0) || rewardsToken == address(0)) {
            vm.startBroadcast(); // keystore signer — set via --account on CLI
            TokenA tA = new TokenA(INITIAL_SUPPLY);
            TokenB tB = new TokenB(INITIAL_SUPPLY);
            vm.stopBroadcast();
            stakingToken = address(tA);
            rewardsToken = address(tB);
        }

        return NetworkConfig({
            stakingToken:    stakingToken,
            rewardsToken:    rewardsToken,
            rewardsDuration: REWARDS_DURATION,
            deployerAddress: deployerAddress
        });
    }

    /// @notice Anvil config — uses the deterministic default key.
    ///         Only ever runs in local tests, never on a real network.
    function getOrCreateAnvilConfig() public returns (NetworkConfig memory) {
        if (activeNetworkConfig.stakingToken != address(0)) {
            return activeNetworkConfig;
        }

        address anvilDeployer = vm.addr(ANVIL_DEFAULT_KEY);

        vm.startBroadcast(ANVIL_DEFAULT_KEY);
        TokenA tA = new TokenA(INITIAL_SUPPLY);
        TokenB tB = new TokenB(INITIAL_SUPPLY);
        vm.stopBroadcast();

        return NetworkConfig({
            stakingToken:    address(tA),
            rewardsToken:    address(tB),
            rewardsDuration: REWARDS_DURATION,
            deployerAddress: anvilDeployer
        });
    }
}