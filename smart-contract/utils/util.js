const { Web3 } = require("web3");
const web3 = new Web3();

async function keccak256(data) {
  const hashData = web3.utils.keccak256(data);
  return hashData;
}

module.exports = {
  keccak256,
};
