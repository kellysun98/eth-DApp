const Adoption = artifacts.require("Adoption")
const Donate = artifacts.require("Donate")
const Election = artifacts.require("Election")
const Purchase = artifacts.require("Purchase")
const Filter = artifacts.require("Filter")
const {hashAddress} = require('../src/constant.json')

module.exports = function(deployer) {
  deployer.deploy(Adoption)
  deployer.deploy(Donate, hashAddress);
  deployer.deploy(Election)
  deployer.deploy(Purchase)
  deployer.deploy(Filter)
};