require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.9",
      },
      {
        version: "0.8.10",
      },
      {
        version: "0.8.12",
      },
    ],
  },
  paths: {
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://goerli.infura.io/v3/1d89957478604b6d9da08cbb9151b746",
      }
    },
    localhost: {
      url: `http://127.0.0.1:8545/`,
      accounts: [''] //0x14dC79964da2C08b23698B3D3cc7Ca32193d9955
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: '7F9FANI79KMS5W817Z41IXA12NIT1UWPKE', // Free API Key btw, get your own lol
  },
};
