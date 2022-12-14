// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IEulerEToken, IEulerMarkets, EulerAddrGoerli, IEulerDToken } from "./interfaces/IEuler.sol";
// import { Cellar } from "cellar-contracts/src/base/Cellar.sol";

contract Manager {
    
    address public collateralToken = address(0x693FaeC006aeBCAE7849141a2ea60c6dd8097E25); // USDC
    address public EULER_TESTNET = address(0x931172BB95549d0f29e10ae2D079ABA3C63318B3); // Euler Goerli 
    address public borrowedToken = address(0xa3401DFdBd584E918f59fD1C3a558467E373DacC); // WETH

    IEulerMarkets markets = IEulerMarkets(0x3EbC39b84B1F856fAFE9803A9e1Eae7Da016Da36);
    IEulerEToken eToken = IEulerEToken(markets.underlyingToEToken(collateralToken));
    IEulerDToken borrowedDToken = IEulerDToken(markets.underlyingToDToken(borrowedToken));

    address payable public owner;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public healthRatios;

    event Withdrawal(uint256 amount);
    event Deposit(uint256 amount);
    event VerifySettings(address token, uint256 healthRatio);
    event Rebalance(address _beneficiary, address _owner, uint256 _amount);
    event Management(address _beneficiary, address _owner, uint256 _healthRatio);
    event VerifyEloan(uint256 _borrowedAmount);

    constructor() {
        
    }

    function deposit(uint256 collateral, uint256 healthRatio, uint256 loan) public payable {
        require((collateral/loan)*100 > 125, "Health ratio has to be greater than 125%");
        // Health Ratio is something like 110 but you divide by 100 to get 1.1

        // Transfer collateral into our smart contract
        ERC20(collateralToken).transferFrom(
            msg.sender,
            address(this),
            collateral
        );

        // Approve Euler Goerli contract to spend USDC
        IERC20(collateralToken).approve(
            EULER_TESTNET,
            type(uint).max
        );

        // Add the deposited tokens into existing balance 
        balances[msg.sender] += collateral;

        healthRatios[msg.sender] = healthRatio;

        // Deposit 1-healthRatio into sommelier
        // Cellar().deposit((1-healthRatio*amount)/100, msg.sender);
        // Missing Goerli Sommelier address


        // Interact with Euler to deposit the tokens
        eToken.deposit(0, (healthRatio*loan)/100);

        // Enter Euler market to receive eUSDC
        markets.enterMarket(0, collateralToken);
        emit Deposit(collateral);

        //get the underlying token
        uint256 eloan = eToken.balanceOfUnderlying(address(this));

        emit VerifyEloan(eloan);
    
        // Borrow the loan amount
        borrowedDToken.borrow(0, eloan);

        //send back the borrowed token to the user
        IERC20(borrowedToken).transfer(msg.sender, eloan);
        
        // deposit in sommelier

    }

    function manage(uint256 newHealthRatio) public {
        // get the current health ratio
        uint256 currentHealthRatio = healthRatios[msg.sender];
        
        // get the current balance
        uint256 currentBalance = balances[msg.sender];
        
        // if the new health ratio is greater than the current health ratio
        if (newHealthRatio > currentHealthRatio) {
            // get the amount of tokens to be deposited or withdrawn
            uint256 amount = (newHealthRatio - currentHealthRatio) * currentBalance;
            // withdraw tokens from sommelier
            
            // deposit the amount of tokens into euler
            eToken.deposit(0, amount);
            // borrow the amount of token
            borrowedDToken.borrow(0, amount);

        } else {
            // get the amount of tokens to be deposited or withdrawn
            uint256 amount = (currentHealthRatio - newHealthRatio) * currentBalance;

            // approve & repay the amount of tokens
            IERC20(borrowedToken).approve(EULER_TESTNET, type(uint).max);
            //repay the amount of tokens
            borrowedDToken.repay(0, amount);
            // withdraw the amount of tokens
            eToken.withdraw(0, amount);
            // supply back into sommelie
        }
            
        // update the health ratio
        healthRatios[msg.sender] = newHealthRatio;
        emit Management(msg.sender, owner, newHealthRatio);
    }

    
    function rebalance(uint256 healthRatio) public {
        // if the health ratio is greater than 5% 
        // withdraw from euler
        uint256 eamount; 

        //repay the amount of tokens
        borrowedDToken.repay(0, eamount);

        // withdraw the amount of tokens
        eToken.withdraw(0, eamount);
        
        //make  the current health ratio = target health ratio from Euler through calculations
        // deposit into sommelier

        // if the health ratio is less than 5%
        // withdraw from sommelier
        //make  the current health ratio = target health ratio from Euler through calculations
        uint256 samount; 
        // deposit into euler
        eToken.deposit(0, samount);

    }

    function withdraw() public {

        ERC20(borrowedToken).transferFrom(
            msg.sender,
            address(this),
            IERC20(borrowedToken).balanceOf(msg.sender)
        );

        IERC20(borrowedToken).approve(EULER_TESTNET, type(uint).max);

        // repay the borrowed tokens
        borrowedDToken.repay(0, type(uint).max);

        // withdraw the collateral tokens
        eToken.withdraw(0, type(uint).max);

        uint256 balance = IERC20(collateralToken).balanceOf(address(this));

        emit Withdrawal(balance);

        ERC20(collateralToken).transferFrom(
            address(this),
            msg.sender,
            balance - 5e6
        );

        balances[msg.sender] -= balance - 5e6;

        // Transfer withdrawed tokens back to the user

        // same for sommelier
    }
}
