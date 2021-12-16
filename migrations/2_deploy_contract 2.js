const Adoption = artifacts.require("Adoption")
const Donate = artifacts.require("Donate")
const Election = artifacts.require("Election")
const {hashAddress} = require('../src/constant.json')

module.exports = function(deployer) {
  deployer.deploy(Adoption)
  deployer.deploy(Donate, "0xBaA69B63BCbF5A860d721a33d7067d1D16cFADA1");
  deployer.deploy(Election)
};