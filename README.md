# Token Migration

Migration of tokens from EVM chain, e.g. Vechain, to another chain with EdDSA keys, e.g. Polkadot, Solana

## Motivation

The motivation behind the implementation is to enable snap-shoting of the blockchain at the particular block to cross-check the  announced amount to migrate vs the balance at the snapshot moment. As *Migration* contract holds all the accounts' tokens which were locked and transferred from accounts to the contract, there is no possibility of double-spending of the tokens. However, as users may buy tokens after the snapshot timestamp, additional verification is required to ensure the all the locked tokens are eligible for migration.

### Migration Flow

1. User calls *ERC20::approve* method of the migrated token with the address of the *Migration* contract and the amount to migrate. This will allocate asset for the future *tranferFrom* calls from the *Migration* contract.
2. User calls *Migration::migrate* method with the address on target chain, to where the assets should be migrated, along with the amount to migrate. We don't use the full balance amount, as users might not want to migrate the whole amount at first, rather to check how the migration process works.
3. *Migration::migrate* transfers the received amount of tokens to the *Migration* contract account and emits an event with the account address, new address on the target chain, and the amount to migrate.
4. Off-chain process checks if the approved amount to migrate lesser or equal the user’s balance during the snapshot event, mints tokens on the target chains, and calls Migration::finishMigration method to update that tokens were migrated.

## Gas Optimisation

The code was not specifically verified for gas optimisation, and there should be a room for improvement throughout the codebase.

## Installing pre-requisites

- Install packages ```$ npm install```

## Testing

Unit tests were created for all classes, testing basic happy flow scenarios and some edge cases. Can be executed by: ```npx hardhat test```
