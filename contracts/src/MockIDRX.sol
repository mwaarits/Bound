// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockIDRX is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 10_000_000e18;
    uint256 public constant INITIAL_SUPPLY = 1_000_000e18;

    constructor() ERC20("Mock IDRX", "mIDRX") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}