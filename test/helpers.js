const { expect } = require("chai");
const ed = require('@noble/ed25519');

async function addToken() {
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy([]);
    await token.deployed();

    return token;
}

async function generateTargetAddress() {
    return Array.from(await ed.getPublicKey(ed.utils.randomPrivateKey()));
}

async function generateUser() {
    const provider = ethers.getDefaultProvider();  //Takes 1 second
    const signer = ethers.Wallet.createRandom().connect(provider);  //Takes 30 seconds !!!

    return signer;
}
  
async function setMigration(token, migrator) {
    const Migration = await ethers.getContractFactory("Migration");
    const portfolio = await Migration.deploy(token.address, migrator.address);
    await portfolio.deployed();
    return portfolio;
}

async function validateTargetAddresses(toAddress, targetAddress) {
    expect(toAddress.length).to.be.equal(targetAddress.length);

    for (let i = 0; i < targetAddress.length; i++) {
        expect(toAddress[i]).to.equal("0x" + targetAddress[i].toString(16));
    }
}

async function validateMigration(migration, token, user, userBalance, lockedBalance, targetAddress) {
    let eventFilter = token.filters.Transfer();
    let events = await token.queryFilter(eventFilter);
    expect(events.length).to.be.equal(2);
    expect(events[0].args.from).to.be.equal("0x0000000000000000000000000000000000000000"); //mint
    
    expect(events[1].args.from).to.be.equal(user.address);
    expect(events[1].args.to).to.be.equal(migration.address);
    expect(events[1].args.value).to.be.equal("0x" + lockedBalance.toString(16));

    eventFilter = migration.filters.Migrate();
    events = await migration.queryFilter(eventFilter);

    expect(events.length).to.be.equal(1);
    expect(events[0].args.from).to.be.equal(user.address);

    validateTargetAddresses(events[0].args.to, targetAddress);
    expect(events[0].args.value).to.be.equal("0x" + lockedBalance.toString(16));

    expect(await token.balanceOf(user.address)).to.be.equal(userBalance - lockedBalance);
    expect(await migration.getLockedHoldings(user.address)).to.be.equal(lockedBalance);
  }
  
async function validateFinishMigration(migration, token, user, userBalance, migratedBalance, lockedBalance, targetAddress) {
    let eventFilter = migration.filters.Migrated();
    let events = await migration.queryFilter(eventFilter);

    expect(events.length).to.be.equal(1);
    expect(events[0].args.from).to.be.equal(user.address);

    validateTargetAddresses(events[0].args.to, targetAddress);
    expect(events[0].args.value).to.be.equal("0x" + migratedBalance.toString(16));

    expect(await token.balanceOf(user.address)).to.be.equal(userBalance);
    expect(await migration.getLockedHoldings(user.address)).to.be.equal(lockedBalance - migratedBalance);
  }

module.exports = {
    addToken: addToken,
    generateUser: generateUser,
    setMigration: setMigration,
    validateMigration: validateMigration,
    validateFinishMigration: validateFinishMigration,
    generateTargetAddress: generateTargetAddress
};