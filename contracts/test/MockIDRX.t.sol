// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockIDRX} from "../src/MockIDRX.sol";

contract MockIDRXTest is Test {
    MockIDRX internal token;
    address internal deployer = address(this);
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint256 internal constant FAUCET_AMOUNT = 10_000_000e18;
    uint256 internal constant INITIAL_SUPPLY = 1_000_000e18;

    function setUp() public {
        token = new MockIDRX();
    }

    function test_NameIsMockIDRX() public view {
        assertEq(token.name(), "Mock IDRX");
    }

    function test_SymbolIsMIDRX() public view {
        assertEq(token.symbol(), "mIDRX");
    }

    function test_DecimalsIs18_OneTokenIsOneIDR() public view {
        assertEq(token.decimals(), 18);
    }

    function test_ConstructorMintsInitialSupplyToDeployer() public {
        assertEq(token.balanceOf(deployer), INITIAL_SUPPLY);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
    }

    function test_FaucetAmountConstantIsTenMillion() public view {
        assertEq(token.FAUCET_AMOUNT(), FAUCET_AMOUNT);
    }

    function test_InitialSupplyConstantIsOneMillion() public view {
        assertEq(token.INITIAL_SUPPLY(), INITIAL_SUPPLY);
    }

    function test_FaucetMintsTenMillionToCaller() public {
        vm.prank(alice);
        token.faucet();

        assertEq(token.balanceOf(alice), FAUCET_AMOUNT);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + FAUCET_AMOUNT);
    }

    function test_FaucetIsUnlimited_RepeatCallsMintEachTime() public {
        vm.startPrank(alice);
        token.faucet();
        token.faucet();
        token.faucet();
        vm.stopPrank();

        assertEq(token.balanceOf(alice), 3 * FAUCET_AMOUNT);
    }

    function test_FaucetIsPermissionless_AnyExternallyOwnedAccountCanCall() public {
        vm.prank(bob);
        token.faucet();

        assertEq(token.balanceOf(bob), FAUCET_AMOUNT);
    }

    function testFuzz_FaucetAddsToExistingBalance(uint8 calls) public {
        uint256 expected = uint256(calls) * FAUCET_AMOUNT;
        vm.startPrank(alice);
        for (uint256 i = 0; i < calls; i++) {
            token.faucet();
        }
        vm.stopPrank();

        assertEq(token.balanceOf(alice), expected);
    }
}