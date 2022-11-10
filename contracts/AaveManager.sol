// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IPool } from "@aave/core-v3/contracts/interfaces/IPool.sol";

contract AaveManager {
    
    // address public collateralToken = 0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43; // USDC
    // address public borrowedToken = 0x2e3A2fb8473316A02b8A297B982498E661E1f6f5; // WETH
    address public cAToken; // aUSDC
    address public bAToken; // aWETH
    address public poolAddress = 0x368EedF3f56ad10b9bC57eed4Dac65B26Bb667f6; // AAVE Pool Goerli
    IPool Pool = IPool(0x368EedF3f56ad10b9bC57eed4Dac65B26Bb667f6);

    mapping(address => uint256) public balances;
    mapping(address => uint256) public healthRatios;

    event Withdrawal(uint256 amount);
    event Deposit(uint256 amount);
    event VerifySettings(address token, uint256 healthRatio);
    event Rebalance(address _beneficiary, address _owner, uint256 _amount);
    event Management(address _beneficiary, address _owner, uint256 _healthRatio);
    event CheckCollateralAmount(uint256 healthFactor, uint256 _collateral, uint256 _loan);
    event EmitUserAccountData(uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor);

    struct UserAccountData {
        uint256 totalCollateralBase;
        uint256 totalDebtBase;
        uint256 availableBorrowsBase;
        uint256 currentLiquidationThreshold;
        uint256 ltv;
        uint256 healthFactor;
    }

    constructor() {

    }

    function deposit(
        uint256 collateral,
        uint256 healthRatio,
        address collateralToken,
        address borrowedToken,
        uint256 loanValueInCollateralToken,
        uint256 loanValueInBorrowedToken
    ) 
        public
        payable
    {
        require(
            (collateral*100)/loanValueInCollateralToken > 125,
            "Maximum health ratio has to be greater than 125%"
        );

        require(
            healthRatio > 125,
            "Health ratio has to be greater than 125%"
        );
       
        emit
        CheckCollateralAmount(
            healthRatio,
            collateral,
            loanValueInCollateralToken
        );

        // Transfer collateral into our smart contract
        ERC20(
            collateralToken
        ).transferFrom(
            msg.sender,
            address(this),
            collateral
        );

        // Approve AAVE Goerli contract to spend USDC
        IERC20(
            collateralToken
        ).approve(
            poolAddress,
            type(uint).max
        );

        // supply to AAVE
        // Receives aEthUSDC
        Pool.supply(
            collateralToken,
            loanValueInCollateralToken,
            address(this),
            0
        );

        // Add the deposited tokens into existing balance 
        balances[msg.sender] += collateral;
        
        healthRatios[msg.sender] = healthRatio;

        emit
        Deposit(
            (healthRatio*loanValueInCollateralToken)/100
        );

        // deposit the rest of the balance in Yearn



        // Borrow from AAVE
        // Receives aWETH
        Pool.borrow(
            borrowedToken,
            loanValueInBorrowedToken,
            1,
            0,
            address(this)
        );

        // send back the borrowed token to the user
        IERC20(borrowedToken).transfer(msg.sender, loanValueInBorrowedToken);

    }

    // function manage(uint256 newHealthRatio) public {
    //     // get the current health ratio
    //     uint256 currentHealthRatio = healthRatios[msg.sender];
        
    //     // get the current balance
    //     uint256 currentBalance = balances[msg.sender];
        
    //     // if the new health ratio is greater than the current health ratio
    //     if (newHealthRatio > currentHealthRatio) {
    //         // get the amount of tokens to be deposited or withdrawn
    //         uint256 amount = (newHealthRatio - currentHealthRatio) * currentBalance;
    //         // withdraw tokens from sommelier
            
    //         // deposit the amount of tokens into euler
    //         // eToken.deposit(0, amount);
    //         // borrow the amount of token
    //         // borrowedDToken.borrow(0, amount);

    //     } else {
    //         // get the amount of tokens to be deposited or withdrawn
    //         uint256 amount = (currentHealthRatio - newHealthRatio) * currentBalance;

    //         // approve & repay the amount of tokens
    //         // IERC20(borrowedToken).approve(EULER_TESTNET, type(uint).max);
    //         //repay the amount of tokens
    //         // borrowedDToken.repay(0, amount);
    //         // withdraw the amount of tokens
    //         // eToken.withdraw(0, amount);
    //         // supply back into sommelie
    //     }
            
    //     // update the health ratio
    //     healthRatios[msg.sender] = newHealthRatio;
    // }

    
    // function rebalance(uint256 healthRatio) public {
    //     // if the health ratio is greater than 5% 
    //     // withdraw from euler
    //     uint256 eamount; 

    //     //repay the amount of tokens
    //     // borrowedDToken.repay(0, eamount);

    //     // withdraw the amount of tokens
    //     // eToken.withdraw(0, eamount);
        
    //     //make  the current health ratio = target health ratio from Euler through calculations
    //     // deposit into sommelier

    //     // if the health ratio is less than 5%
    //     // withdraw from sommelier
    //     //make  the current health ratio = target health ratio from Euler through calculations

    //     // deposit into euler
    //     // eToken.deposit(0, samount);

    // }

    // function withdraw() public {

    //     ERC20(borrowedToken).transferFrom(
    //         msg.sender,
    //         address(this),
    //         IERC20(borrowedToken).balanceOf(msg.sender)
    //     );

    //     // IERC20(borrowedToken).approve(EULER_TESTNET, type(uint).max);

    //     // repay the borrowed tokens
    //     // borrowedDToken.repay(0, type(uint).max);

    //     // withdraw the collateral tokens
    //     // eToken.withdraw(0, type(uint).max);

    //     uint256 balance = IERC20(collateralToken).balanceOf(address(this));

    //     emit Withdrawal(balance);

    //     ERC20(collateralToken).transferFrom(
    //         address(this),
    //         msg.sender,
    //         balance - 5e6
    //     );

    //     balances[msg.sender] -= balance - 5e6;

    //     // Transfer withdrawed tokens back to the user

    //     // same for sommelier
    // }
}
