const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const erc20abi = require('./erc20.json');

async function main() {

    const [owner] = await ethers.getSigners();

    const Manage = await hre.ethers.getContractFactory("AaveManager");

    const deployedContract = await Manage.deploy(
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        '0xb023e699F5a33916Ea823A16485e259257cA8Bd1',
        ['0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619']
    );

    await deployedContract.deployed();

    const tokenContract = new ethers.Contract(
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        erc20abi,
        owner
    );
    const collateralDecimals = await tokenContract.decimals()

    const linkContract = new ethers.Contract(
        '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        erc20abi,
        owner
    );
    const borrowDecimals = await linkContract.decimals();

    console.log('=============================');
    console.log("Aave Manager: ", deployedContract.address);
    console.log('Manager balance left: ' + ethers.utils.formatUnits(await tokenContract.balanceOf(deployedContract.address), collateralDecimals) + ' USDC');
    console.log('User balance left: ' + ethers.utils.formatUnits(await tokenContract.balanceOf(owner.address), collateralDecimals) + ' USDC');
    console.log('=============================');

    const approveTx = await tokenContract.approve(
        deployedContract.address,
        ethers.constants.MaxUint256,
    );

    const borrowApproveTx = await linkContract.approve(
        deployedContract.address,
        ethers.constants.MaxUint256,
    );

    await approveTx.wait();

    await borrowApproveTx.wait();

    const _totalDeposit = BigNumber.from(10000).mul(BigNumber.from(10).pow(collateralDecimals));
    const _collateral = BigNumber.from(4500).mul(BigNumber.from(10).pow(collateralDecimals));
    const _borrowed = BigNumber.from(1).mul(BigNumber.from(10).pow(borrowDecimals));

    const depositTx = await deployedContract.deposit(
        _totalDeposit,
        _collateral,
        '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        _borrowed,
        // { gasPrice: ethers.utils.parseUnits('1.5', 'gwei'), gasLimit: 5000000 }
    );

    const depositResult = await depositTx.wait();
    const topics = depositResult.logs;

    // topics.forEach((topic) => {console.log(topic)});
    const eventResults = depositResult.events;
    console.log('\n1. Deposit\n');
    console.log('=============================');
    const userData = eventResults[eventResults.length-1].args;
    console.log('Collateral: ' + ethers.utils.formatUnits(userData._myCollateralBalance, 8));
    console.log('Borrowed Balance: ' + ethers.utils.formatUnits(userData._myBorrowedBalanceInBase, 8));
    console.log('Health Factor: ' + ethers.utils.formatUnits(userData._myHealthRatio, 0));
    console.log('Manager balance left: ' + ethers.utils.formatUnits(await tokenContract.balanceOf(deployedContract.address), collateralDecimals) + ' USDC');
    const totalDebt = await deployedContract.getTotalBorrowedAmountInBase('0x7e764ef3ca3a1f2ed4e4ce6ad162021148b09460');
    console.log('Your total debt: ' + totalDebt/10**8);
    console.log('Contract Total Collateral: ' + ethers.utils.formatUnits(await deployedContract.totalCollateral(), collateralDecimals));
    console.log('Gas Used: ' + ethers.utils.formatUnits(depositResult.gasUsed, 0));
    console.log('=============================');

    // console.log(ethers.utils.formatUnits(await linkContract.balanceOf('0x7E764eF3Ca3a1f2ed4e4Ce6Ad162021148B09460'), 18));
   
    // const ManagerbalanceOf = await tokenContract.balanceOf(deployedContract.address);

    // console.log('Manager balance left: ' + ethers.utils.formatUnits(ManagerbalanceOf, collateralDecimals) + ' USDC');
    
    // const userbalanceOf1 = await tokenContract.balanceOf('0x7e764ef3ca3a1f2ed4e4ce6ad162021148b09460');
    // console.log('User balance left: ' + ethers.utils.formatUnits(userbalanceOf1, collateralDecimals) + ' USDC');
    const setNewHealthRatioTx = await deployedContract.setNewHealthRatio(
        (140).toString(),
        // { gasPrice: ethers.utils.parseUnits('1.5', 'gwei'), gasLimit: 5000000 }
    );

    const healthResult = await setNewHealthRatioTx.wait();
    const healthEvents = healthResult.events;

    console.log('\n2. Set New Health Ratio\n');
    console.log('=============================');
    const setNewHealthRatio = healthEvents[healthEvents.length-1].args;
    console.log('New Collateral: ' + ethers.utils.formatUnits(setNewHealthRatio._myCollateralBalance, 0));
    console.log('New Loan Value: ' + ethers.utils.formatUnits(setNewHealthRatio._myBorrowedBalanceInBase, 0));
    console.log('New Health Ratio: ' + ethers.utils.formatUnits(setNewHealthRatio._myHealthRatio, 0));
    console.log('Contract Total Collateral: ' + ethers.utils.formatUnits(await deployedContract.totalCollateral(), collateralDecimals));
    console.log('Manager balance left: ' + ethers.utils.formatUnits(await tokenContract.balanceOf(deployedContract.address), collateralDecimals) + ' USDC');
    console.log('=============================');

    const batchRebalanceTx = await deployedContract.batchRebalance(
        '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        // { gasPrice: ethers.utils.parseUnits('1.5', 'gwei'), gasLimit: 5000000 }
    );

    const rebalanceResult = await batchRebalanceTx.wait();
    const rebalanceEvents = rebalanceResult.events;

    console.log('\n3. Batch Rebalance\n');
    console.log('=============================');
    const batchRebalance = rebalanceEvents[rebalanceEvents.length-1].args;
    console.log('New Collateral: ' + ethers.utils.formatUnits(batchRebalance._myCollateralBalance, 8));
    console.log('New Loan Value: ' + ethers.utils.formatUnits(batchRebalance._myBorrowedBalanceInBase, 8));
    console.log('New Health Ratio: ' + ethers.utils.formatUnits(batchRebalance._myHealthRatio, 0));
    console.log('Contract Total Collateral: ' + ethers.utils.formatUnits(await deployedContract.totalCollateral(), collateralDecimals));
    console.log('Manager balance left: ' + ethers.utils.formatUnits(await tokenContract.balanceOf(deployedContract.address), collateralDecimals) + ' USDC');
    console.log('=============================');


    // uint256 _amountToRepayInBorrowed,
    // uint256 _amountToWithdrawInBase,
    // uint256 _amountToUnstake,
    // address _borrowToken
    const withdrawTx = await deployedContract.withdraw(
        BigNumber.from(1).mul(BigNumber.from(10).pow(borrowDecimals)),
        BigNumber.from(1642).mul(BigNumber.from(10).pow(collateralDecimals)),
        BigNumber.from(8357).mul(BigNumber.from(10).pow(collateralDecimals)),
        '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        // { gasPrice: ethers.utils.parseUnits('1.5', 'gwei'), gasLimit: 5000000 }
    );

    const withdrawResult = await withdrawTx.wait();
    const withdrawEvents = withdrawResult.events;
    console.log('\n4. Withdrawal\n');
    console.log('=============================');
    const withdrawal = withdrawEvents[withdrawEvents.length-1].args;
    console.log('New Collateral: ' + ethers.utils.formatUnits(withdrawal._myCollateralBalance, 8));
    console.log('New Loan Value: ' + ethers.utils.formatUnits(withdrawal._myBorrowedBalanceInBase, 8));
    console.log('New Health Ratio: ' + ethers.utils.formatUnits(withdrawal._myHealthRatio, 0));
    console.log('Contract Total Collateral: ' + ethers.utils.formatUnits(await deployedContract.totalCollateral(), collateralDecimals));
    console.log('=============================\n');
    // console.log(parseFloat(ethers.utils.formatUnits(withdrawal._myCollateralBalance, 0)) - parseFloat(ethers.utils.formatUnits(withdrawal._myBorrowedBalanceInBase, 0)));

    console.log('=============================');
    console.log('Manager balance left: ' + ethers.utils.formatUnits(await tokenContract.balanceOf(deployedContract.address), collateralDecimals) + ' USDC');
    console.log('User balance left: ' + ethers.utils.formatUnits(await tokenContract.balanceOf(owner.address), collateralDecimals) + ' USDC');
    console.log('=============================\n');
    
    // console.log(withdrawResult)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});