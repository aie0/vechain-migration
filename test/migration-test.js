const { expect } = require("chai");
const { ethers } = require("hardhat");

const { addToken, generateUser, setMigration, validateMigration, validateFinishMigration, generateTargetAddress } = require("./helpers");

describe("Migration", function () {
  it("Should return empty holdings once created", async function () {
    const token0 = await addToken();
    const user1 = await generateUser();
    const user2 = await generateUser();

    const migration = await setMigration(token0, user1);
    const balance1 = await migration.getLockedHoldings(user1.address);
    const balance2 = await migration.getLockedHoldings(user2.address);

    expect(balance1).to.equal(0);
    expect(balance2).to.equal(0);
  });

  it("Should return empty holdings for non-migrated tokens", async function () {
    const token0 = await addToken();
    const user1 = await generateUser();
    const user2 = await generateUser();

    await token0.mint(user2.address, 10000000);

    const migration = await setMigration(token0, user1);
    const balance1 = await migration.getLockedHoldings(user1.address);
    const balance2 = await migration.getLockedHoldings(user2.address);

    expect(balance1).to.equal(0);
    expect(balance2).to.equal(0);
  });

  it("Should return empty holdings for non-migrated tokens", async function () {
    const token0 = await addToken();
    const user1 = await generateUser();
    const user2 = await generateUser();

    await token0.mint(user2.address, 10000000);

    const migration = await setMigration(token0, user1);
    const balance1 = await migration.getLockedHoldings(user1.address);
    const balance2 = await migration.getLockedHoldings(user2.address);

    expect(balance1).to.equal(0);
    expect(balance2).to.equal(0);
  });

  it("Should allow only owner to change migrators", async function () {
    const token0 = await addToken();
    const user1 = await generateUser();

    const migration = await setMigration(token0, user1);

    await migration.setMigrateRole((await ethers.getSigners())[0].address);

    const migration2 = migration.connect((await ethers.getSigners())[1]);

    await expect(migration2.setMigrateRole(user1.address)).to.be.revertedWith("UNAUTHORISED");
  });

  it("Should allow to migrate only existing and approved tokens", async function () {
    const token0 = await addToken();
    const user1 = await generateUser();
    let targetAddress = await generateTargetAddress();
    const signer2 = (await ethers.getSigners())[1];
    const minted = 100000000;
    const locked = 1000;

    await token0.mint(signer2.address, minted);

    const migration = await setMigration(token0, user1);
    const migration2 = migration.connect(signer2);
    const token2 = token0.connect(signer2);

    // too much, not approved
    await expect(migration2.migrate(targetAddress, minted + locked)).to.be.reverted;

    // exists, not approved
    await expect(migration2.migrate(targetAddress, locked)).to.be.reverted;

    await token2.approve(migration.address, locked);
    await migration2.migrate(targetAddress, locked);

    await validateMigration(migration2, token2, signer2, minted, locked, targetAddress);
  });

  it("Should allow only migrator to finish migration", async function () {
    const token0 = await addToken();
    const user1 = await generateUser();
    const targetAddress = await generateTargetAddress();
    const signer2 = (await ethers.getSigners())[1];

    const migration = await setMigration(token0, user1);

    const migration2 = migration.connect(signer2);

    await expect(migration2.finishMigration(user1.address, targetAddress, 0)).to.be.revertedWith("UNAUTHORISED");

    await migration.setMigrateRole(signer2.address);

    await expect(migration2.finishMigration(user1.address, targetAddress, 0)).to.be.revertedWith("ZERO_MIGRATION");
  });

  it("Should allow finish migration for all already locked tokens", async function () {
    const token0 = await addToken();
    const user1 = await generateUser();
    const targetAddress = await generateTargetAddress();
    const signer2 = (await ethers.getSigners())[1];
    const signer3 = (await ethers.getSigners())[2];
    const minted = 100000000;
    const locked = 1000;

    await token0.mint(signer2.address, minted);

    const migration = await setMigration(token0, user1);
    const migration2 = migration.connect(signer2);
    const migration3 = migration.connect(signer3);
    const token2 = token0.connect(signer2);

    await token2.approve(migration.address, locked);
    await migration2.migrate(targetAddress, locked);

    await validateMigration(migration2, token2, signer2, minted, locked, targetAddress);
    await migration.setMigrateRole(signer3.address);

    await migration3.finishMigration(signer2.address, targetAddress, locked);

    await validateFinishMigration(migration, token0, signer2, minted - locked, locked, locked, targetAddress);
  });

  it("Should allow finish migration for partial already locked tokens", async function () {
    const token0 = await addToken();
    const user1 = await generateUser();
    const targetAddress = await generateTargetAddress();
    const signer2 = (await ethers.getSigners())[1];
    const signer3 = (await ethers.getSigners())[2];
    const minted = 100000000;
    const locked = 1000;
    const migrated = 500;

    await token0.mint(signer2.address, minted);

    const migration = await setMigration(token0, user1);
    const migration2 = migration.connect(signer2);
    const migration3 = migration.connect(signer3);
    const token2 = token0.connect(signer2);

    await token2.approve(migration.address, locked);
    await migration2.migrate(targetAddress, locked);

    await validateMigration(migration2, token2, signer2, minted, locked, targetAddress);
    await migration.setMigrateRole(signer3.address);

    await migration3.finishMigration(signer2.address, targetAddress, migrated);

    await validateFinishMigration(migration, token0, signer2, minted - locked, migrated, locked, targetAddress);
  });
});
