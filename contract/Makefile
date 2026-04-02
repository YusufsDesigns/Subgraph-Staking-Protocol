-include .env

.PHONY: all test clean deploy help

DEFAULT_ANVIL_KEY := 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

help:
	@echo "Usage:"
	@echo "  make install         - Install dependencies"
	@echo "  make build           - Compile contracts"
	@echo "  make test            - Run all tests"
	@echo "  make test-v          - Run tests verbose"
	@echo "  make snapshot        - Update gas snapshots"
	@echo "  make anvil           - Start local chain"
	@echo "  make deploy          - Deploy to Anvil"
	@echo "  make deploy-sepolia  - Deploy to Sepolia + verify"

all: clean remove install update build

clean   :; forge clean
remove  :; rm -rf .gitmodules && rm -rf .git/modules/* && rm -rf lib && touch .gitmodules && git add . && git commit -m "chore: remove submodules"
install :; forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 --no-commit
update  :; forge update
build   :; forge build
test    :; forge test -vv
test-v  :; forge test -vvvv
snapshot:; forge snapshot
format  :; forge fmt
anvil   :; anvil -m 'test test test test test test test test test test test junk' --steps-tracing --block-time 1

deploy:
	@forge script script/DeployStakingRewards.s.sol:DeployStakingRewards --rpc-url http://localhost:8545 --private-key $(DEFAULT_ANVIL_KEY) --broadcast

deploy-sepolia:
	@forge script script/DeployStakingRewards.s.sol:DeployStakingRewards --rpc-url $(SEPOLIA_RPC_URL) --account $(ACCOUNT) --sender $(DEPLOYER_ADDRESS) --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv