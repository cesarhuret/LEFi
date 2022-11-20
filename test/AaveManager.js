const hre = require("hardhat");
const erc20abi = require('./erc20.json');


describe("test contract", function () {
    it("Nice", async function () {
        const [owner] = await ethers.getSigners();
        console.log(owner.address);
        const tokenvalue = hre.ethers.utils.parseEther("100");
        const tokencol = hre.ethers.utils.parseEther("10");
        const tokenloan = hre.ethers.utils.parseEther("40");

        const AaveManager = await ethers.getContractFactory("AaveManager");
        const deployedContract = await AaveManager.deploy({ gasPrice: ethers.utils.parseUnits('1.5', 'gwei'), gasLimit: 1000000 });
        console.log('AaveManager deployed at: ' + deployedContract.address);

        const tokenContract = new ethers.Contract(
            '0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43',
            erc20abi,
            owner
        );

        const approveTx = await tokenContract.approve(
            deployedContract.address,
            ethers.constants.MaxUint256,
            { gasPrice: ethers.utils.parseUnits('1.5', 'gwei'), gasLimit: 100000 }
        );
        const approveResult = await approveTx.wait();
        console.log(approveResult);

        const depositTx = await deployedContract.deposit(
            (100*1000000).toString(),
            (45*1000000).toString(),
            '0x07C725d58437504CA5f814AE406e70E21C5e8e9e',
            (1*1000000000000000000).toString(),
            { gasPrice: ethers.utils.parseUnits('1.5', 'gwei'), gasLimit: 1000000 }
        );

        const depositResult = await depositTx.wait();
        console.log(depositResult);

        const totalDebt = await deployedContract.getTotalBorrowedAmountInBase('0x7e764ef3ca3a1f2ed4e4ce6ad162021148b09460');
        console.log(totalDebt);

        //await manage.deployed();

        /*         await manage.deposit({ value: tokenvalue }, { value: tokencol }, { value: tokenloan });
         */
    });
});