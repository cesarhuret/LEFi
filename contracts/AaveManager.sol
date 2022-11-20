// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC20Metadata.sol";
import { IPool } from "@aave/core-v3/contracts/interfaces/IPool.sol";
import { IAaveOracle } from "@aave/core-v3/contracts/interfaces/IAaveOracle.sol";
import { VaultAPI } from "./interfaces/Yearn/BaseStrategy.sol";
import "./Base.sol";

/**
 * @author  Cesar Huret
 * @title   AaveManager
 * @dev     .
 * @notice  .
 */

contract AaveManager is Base {

    address public immutable poolAddress;
    address public immutable yVaultAddress;
    IPool public immutable aPool;
    VaultAPI public immutable yVault;
    IERC20 public immutable YTestToken;
    IAaveOracle public immutable aaveOracle;

    constructor (
        address _collateralToken,
        address _poolAddress,
        address _oracleAddress,
        address[] memory _borrowableAssets
    ) Base (
        _collateralToken,
        _borrowableAssets
    ) {
        poolAddress = _poolAddress;
        yVaultAddress = 0xbbe176D71b032ebB72dE7309E8DB6320235f7ae9;
        
        aPool = IPool(_poolAddress); // Aave Pool Goerli
        yVault = VaultAPI(0xbbe176D71b032ebB72dE7309E8DB6320235f7ae9); // My Testing Goerli yVault
        
        YTestToken = IERC20(0xF8EBaF73Fc7da042494857822976cD8F02263B49); // Just a Testing Token for Yearn on Goerli
        
        aaveOracle = IAaveOracle(_oracleAddress); // Aave Oracle

    }
    
    /**
     * @notice  .
     * @dev     .
     * @param   _totalDeposit  .
     * @param   _collateral  .
     * @param   _borrowToken  .
     * @param   _loanValueInBorrowedToken  .
     */ 
    function deposit(
        uint256 _totalDeposit,
        uint256 _collateral,
        address _borrowToken,
        uint256 _loanValueInBorrowedToken
    )
        public
        payable
    {

        // NEED TO ADJUST THE DECIMALS --> get that from IERC20(token).decimals() 
        // wait but Solidity doesn't accept decimals --> find where you need to divide by decimals


        // health ratio is the the total of all the borrowed assets in the base token, divided by the total collateral
        UserData storage myUserData = usersDataObject[msg.sender];

        myUserData.myBorrowedAssets[_borrowToken] += _loanValueInBorrowedToken;

        uint256 _totalLoanValueInBase = getTotalBorrowedAmountInBase(msg.sender);

        uint256 _healthRatio = 
            (_collateral * aaveOracle.getAssetPrice(collateralToken) * 100)
            /(_totalLoanValueInBase * (10**ERC20(collateralToken).decimals()));

        require(
            _healthRatio > 130,
            "Health ratio has to be greater than 130%"
        );

        // Transfer collateral into our smart contract
        ERC20(
            collateralToken
        ).transferFrom(
            msg.sender,
            address(this),
            _totalDeposit
        );

        // Approve AAVE Goerli contract to spend USDC
        IERC20(
            collateralToken
        ).approve(
            poolAddress,
            type(uint).max
        );

        // // Approve Yearn Vault contract to spend USDC
        // YTestToken.approve(yVaultAddress, type(uint).max);

        // supply to AAVE
        // Receives aEthUSDC
        aPool.supply(
            collateralToken,
            _collateral,
            address(this),
            0
        );
        
        // // deposit the rest of the balance in Yearn
        // yVault.deposit(_totalDeposit - _collateral, address(this));

        // Borrow from AAVE
        // Receives Link
        aPool.borrow(
            _borrowToken,
            _loanValueInBorrowedToken,
            2,
            0,
            address(this)
        );

        // send back the borrowed token to the user
        IERC20(
            _borrowToken
        ).transfer(
            msg.sender,
            _loanValueInBorrowedToken
        );

        // // healthratio% = (collateral*100)/loan
        // // collateral = (loan*healthratio)/100

        myUserData.myTotalDeposit += _totalDeposit;
        myUserData.myHealthRatio = _healthRatio;

        totalCollateral += _collateral;
        borrowedAssets[_borrowToken] += _loanValueInBorrowedToken;

        emit TellUserData(
            (_collateral*aaveOracle.getAssetPrice(collateralToken)) / (10**ERC20(collateralToken).decimals()),
            _totalLoanValueInBase,
            _healthRatio
        );

    }

    function getTotalBorrowedAmountInBase(
        address user
    ) public
      view
    returns (
        uint256
    ) {
        UserData storage myUserData = usersDataObject[user];
        uint256 totalBorrowedAmountInBase = 0;

        for(
            uint256 i = 0;
            i < borrowableAssets.length;
            i++
        ) {
            uint256 loanValueOfATokenInBase = (myUserData.myBorrowedAssets[borrowableAssets[i]]*aaveOracle.getAssetPrice(borrowableAssets[i]))/(10**ERC20(borrowableAssets[i]).decimals());
            totalBorrowedAmountInBase += loanValueOfATokenInBase;
        }

        return totalBorrowedAmountInBase;
    }

    function withdraw(
        uint256 _amountToRepayInBorrowed,
        uint256 _amountToWithdrawInBase,
        uint256 _amountToUnstake,
        address _borrowToken
    ) public {

        UserData storage myUserData = usersDataObject[msg.sender];

        require(
            myUserData.myTotalDeposit >= _amountToWithdrawInBase + _amountToUnstake,
            "You can't withdraw more than you deposited"
        );

        uint256 currentBorrowedInBase = getTotalBorrowedAmountInBase(msg.sender);

        uint256 myCollateral = (currentBorrowedInBase * aaveOracle.getAssetPrice(collateralToken) * myUserData.myHealthRatio)/(100*1e8);

        // Define myCollateral = 
        require(
            myUserData.myTotalDeposit - myCollateral >= _amountToUnstake,
            "You can't unstake more than you have staked"
        );

        require(
            myUserData.myBorrowedAssets[_borrowToken] >= _amountToRepayInBorrowed,
            "You can't repay more than you borrowed (Borrowed Token)"
        );

        myUserData.myBorrowedAssets[_borrowToken] -= _amountToRepayInBorrowed;
        
        uint256 newLoanValueInBase = getTotalBorrowedAmountInBase(msg.sender);

        require(
            newLoanValueInBase >= 0,
            "You can't borrow negative values"
        );

        // Something's not right here, currentBorrowedinBase needs to be in collateralToken Price right? 
        uint256 newCollateral = 
            (_amountToWithdrawInBase*aaveOracle.getAssetPrice(collateralToken))/(10**ERC20(collateralToken).decimals()) >= myCollateral
            ? 0
            : myCollateral - (_amountToWithdrawInBase*aaveOracle.getAssetPrice(collateralToken))/(10**ERC20(collateralToken).decimals());


        myUserData.myHealthRatio = newLoanValueInBase == 0
            ? 0
            : (newCollateral*100)/newLoanValueInBase;

        require(
            (myUserData.myHealthRatio == 0 && newLoanValueInBase == 0) || myUserData.myHealthRatio > 130,
            "Health ratio has to be greater than 130%, or repay your loan and withdraw everything to get a 0 health ratio"
        );

        // User needs to transfer borrowed tokens to manager
        ERC20(_borrowToken).transferFrom(
            msg.sender,
            address(this),
            _amountToRepayInBorrowed
        );

        IERC20(
            _borrowToken
        ).approve(
            poolAddress,
            type(uint).max
        );

        // repay the borrowed tokens to AAVE
        aPool.repay(
            _borrowToken,
            _amountToRepayInBorrowed,
            2,
            address(this)
        );

        // withdraw the collateral
        if(_amountToWithdrawInBase > 0) {
            aPool.withdraw(
                collateralToken,
                _amountToWithdrawInBase,
                address(this)
            );
        }

        IERC20(
            collateralToken
        ).transfer(
            msg.sender,
            _amountToWithdrawInBase + _amountToUnstake
        );

        borrowedAssets[_borrowToken] -= _amountToRepayInBorrowed;

        myUserData.myTotalDeposit -= _amountToWithdrawInBase + _amountToUnstake;

        totalCollateral -= _amountToWithdrawInBase;

        emit TellUserData(
            newCollateral,
            newLoanValueInBase,
            myUserData.myHealthRatio
        );

    }

    function setNewHealthRatio(
        uint256 _newHealthRatio
    ) public {

        UserData storage myUserData = usersDataObject[msg.sender];

        require(
            myUserData.myHealthRatio > 0,
            "Your health ratio is 0, you can't set a new one"
        );

        require(
            _newHealthRatio != myUserData.myHealthRatio,
            "Can't set to the same existing health ratio"
        );
        
        require(
            _newHealthRatio > 130,
            "Health ratio has to be greater than 130%"
        );

        // we can figure out how much collateral we need for a particular health ratio by using: 
        // (loanValueInCollateralToken*healthRatio)/100 = newCollateralNeeded
        // Now we need to know if we have extra collateral or not

        uint256 myBorrowedBalanceInBase = getTotalBorrowedAmountInBase(msg.sender);
        uint256 myCollateralBalance = (myBorrowedBalanceInBase*myUserData.myHealthRatio)/100;

        uint256 newCollateralWeNeedToReachTo = (myBorrowedBalanceInBase*_newHealthRatio)/100; // But this isn't in Base USD, get the price conversion

        if(newCollateralWeNeedToReachTo > myCollateralBalance) {

            // withdraw from yearn



            // deposit more collateral
            aPool.supply(
                collateralToken,
                ((10**ERC20(collateralToken).decimals())*(newCollateralWeNeedToReachTo - myCollateralBalance))/1e8,
                address(this),
                0
            );

            totalCollateral += ((10**ERC20(collateralToken).decimals())*(newCollateralWeNeedToReachTo - myCollateralBalance))/1e8;

        } else if(newCollateralWeNeedToReachTo < myCollateralBalance) {

            // withdraw extra collateral
            aPool.withdraw(
                collateralToken,
                ((10**ERC20(collateralToken).decimals())*(myCollateralBalance - newCollateralWeNeedToReachTo))/1e8,
                address(this)
            );

            totalCollateral -= ((10**ERC20(collateralToken).decimals())*(myCollateralBalance - newCollateralWeNeedToReachTo))/1e8;

            // deposit in yearn

        }

        myUserData.myHealthRatio = _newHealthRatio;

        emit TellUserData(
            (((myBorrowedBalanceInBase*_newHealthRatio)/100)*aaveOracle.getAssetPrice(collateralToken))/1e8,
            myBorrowedBalanceInBase,
            myUserData.myHealthRatio
        );

    }

    function getManagerBorrowedTotalInBase(  
    ) public
      view
    returns (
        uint256
    ) {
        uint256 totalBorrowedAmountInBase = 0;

        for(
            uint256 i = 0;
            i < borrowableAssets.length;
            i++
        ) {
            uint256 loanValueOfATokenInBase = (borrowedAssets[borrowableAssets[i]]*aaveOracle.getAssetPrice(borrowableAssets[i]))/(10**ERC20(borrowableAssets[i]).decimals());
            totalBorrowedAmountInBase += loanValueOfATokenInBase;
        }

        return totalBorrowedAmountInBase;
    }

    function batchRebalance(
        address _borrowToken
    ) public {

    //     // depending on new price, we need to rebalance
        
    //     // our borrowed amount is worth something new

    //     // we need to check if we have enough collateral to cover the new loan value

        uint256 borrowedTotalInBase = getManagerBorrowedTotalInBase();

        uint256 totalCollateralInBase = (totalCollateral*aaveOracle.getAssetPrice(collateralToken))/(10**ERC20(collateralToken).decimals());

        uint256 _healthRatio = (totalCollateralInBase*100)/borrowedTotalInBase;

        uint256 newCollateralNeeded = (borrowedTotalInBase*140)/100;

        if(newCollateralNeeded > totalCollateralInBase) {

            // we need to withdraw from yearn

            // we need to deposit more collateral

            aPool.supply(
                collateralToken,
                ((newCollateralNeeded - totalCollateralInBase)*(10**ERC20(collateralToken).decimals()))/1e8,
                address(this),
                0
            );

            totalCollateral += ((newCollateralNeeded - totalCollateralInBase)*(10**ERC20(collateralToken).decimals()))/1e8;

        } else if(newCollateralNeeded < totalCollateralInBase) {

            // we need to withdraw extra collateral

            aPool.withdraw(
                collateralToken,
                ((totalCollateralInBase - newCollateralNeeded)*(10**ERC20(collateralToken).decimals()))/1e8,
                address(this)
            );

            totalCollateral -= ((totalCollateralInBase - newCollateralNeeded)*(10**ERC20(collateralToken).decimals()))/1e8;

            // we need to deposit in yearn

        }

        emit TellUserData(
            newCollateralNeeded,
            borrowedTotalInBase,
            140
        );
    }

}