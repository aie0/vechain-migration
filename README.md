
- User is able to call the smart contract and pass the amount of tokens to be migrated. The contract transfers the received amount of JUR token to the contract, as a deposit, and emits an event for the off-chain minting process.

## Motivation

The motivation behind the implementation is to enable snap-shoting of the blockchain at the particular block to cross-check the  announced amount to migrate vs the balance at the snapshot moment.

The flow goes as follows:

1. User calls *ERC20::approve* method of the migrated token with the address of the *Migration* contract and the amount to migrate. This will allocate asset for the future *tranferFrom* calls from the *Migration* contract.
2. User calls *Migration::migrate* method with the address on target chain, to where the assets should be migrated, along with the amount to migrate. We don't use the full balance amount, as users might not want to migrate the whole amount at first, rather to check how the migration process works.
3. *Migration::migrate* transfers the received amount of tokens to the *Migration* contract account and emits an event with the account address, new address on the target chain, and the amount to migrate.
4. Off-chain process checks if the approved amount to migrate lesser or equal the user’s balance during the snapshot event, mints tokens on the target chains, and calls Migration::finishMigration method to update that tokens were migrated.

create an accounts (```User```), which can interact with their portfolio (```Migration```). In order for tokens to be deposited to the portfolio, they first need to leave an account's balance in order to be moved to the portfolio, which manages the pool of all the accounts. From the perspective of the token, portfolio is one large account - just like any other user.

As token management (minting and burning) cannot be under portfolio's or user's control, tokens need to appear somehow. A designated method is created ```User::acquire```, which is a wrapper ```Token:::mint```. It can be done through purchasing at some exchange or through the mining process. Once "acquired", users can deposit (```User::deposit```), withdraw (```User::withdraw```) and emergency withdraw all (```User::withdrawAll```) their tokens.

Token contract derives from ```@openzeppelin::ERC20Permit``` (bonus task supporting EIP-2612 interface), which in turn derives from ```@openzeppelin::ERC20```, to support the ERC20 interface. While almost all the implementation of the token derived from the openzepplin, there are minor changes to ```ERC20Permit::permit``` override by  introducing of ```ISigner``` interface to decouple accounts from their signing identity. The signing identity is passed from the front-side, which holds the signing private key.

## Flows

### Migration holdings

As portfolio holds all the accounts' tokens under its own account, there is a need for "managing books" and tracking how many of which tokens are allocated to different accounts. This is done by storing account to their holdings for each token, in a form of array ```MigrationHolding[]```. Each array item, in turn, holds account to amount mapping ```mapping(address => uint256)```.

To support quick lookups, a mapping of supported tokens is managed separately  ```mapping(address => SupportedToken)```, which holds index to portfolio holding array as well as support flag - to validate the portfolio supports a particular token. This structure allows quick account holding lookup as well as iteration of the holdings, as follows: ```_holdings[_supportedTokens[token_].index].accountHoldings[msg.sender] = amountGoesHere```.

### Deposit and withdrawal

In order to add token to the portfolio, method ```User::deposit``` first increases allowance for the portfolio and then calls portfolio method ```Migration::deposit```, which finalises the transaction by transfering tokens from account to the portfolio.

Likewise, in order to remove token from the portfolio, method ```User::withdraw``` first asks for allowance through ```Migration::allowWithdrawal``` and then finalises the transaction.

Emergency withdrawal works differently in ```User::withdrawAll```, by sending a single transaction to the ```Migration::withdrawAll``` and it making all the withdrawals for all the token at once - without making an allowance loop. Allowance is still used internally in the portfolio method to comply with ERC20.

All the methods use ```msg.sender``` address for all the transactions. The auth process on the ```User``` side was left out of the scope of the assignment.

### EIP-2612 permits

The token contract also supports EIP-2612 permits. ```Migration::depositWithPermit``` implements the permission-based flow. As permission signature is transfered through the parameters, there is no need in making a transaction from the ```User``` contract nor using ```msg.sender```. Instead the passed permission signature is validated through the ```Token::permit``` method, which increases the allowance appropriately - effectively making a one-single transaction.

## Gas Optimisation

The code was not specifically verified for gas optimisation, and there should be a room for improvement througout the codebase.

## Installing pre-requisites

- Install packages ```$ npm install```

## Testing

Unit tests were created for all classes, testing basic happy flow scenarios and some edge cases. Can be executed by: ```npx hardhat test```.

## Deployment

- Deploy the contracts ```npx hardhat run scripts/sample-script.js```
