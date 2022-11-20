// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Base {
    
    address public immutable collateralToken;
    address[] public borrowableAssets;

    // Note: Base means it has been multiplied with the price of the asset, in terms of base currency
    // if the base currency is ETH, then the price of the asset is in terms of ETH, and is multiplied by that
    uint256 public totalCollateral;

    mapping(address => uint256) public borrowedAssets;

    uint256 public totalHealthRatio;

    struct UserData {
        uint256 myTotalDeposit;
        uint256 myHealthRatio;
        mapping(address => uint256) myBorrowedAssets;
    }

    mapping(address => UserData) public usersDataObject;

    event TellUserData(
        uint256 _myCollateralBalance,
        uint256 _myBorrowedBalanceInBase,
        uint256 _myHealthRatio
    );

    constructor(
        address _collateralToken,
        address[] memory _borrowableAssets
    ) {
        collateralToken = _collateralToken;
        borrowableAssets = _borrowableAssets;
    }

}