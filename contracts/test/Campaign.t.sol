// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MockIDRX} from "../src/MockIDRX.sol";
import {Campaign} from "../src/Campaign.sol";

contract CampaignTest is Test {
    MockIDRX internal token;
    Campaign internal campaign;

    address internal operator = address(this);
    address internal relayer = makeAddr("relayer");
    address internal toko1 = makeAddr("toko1");
    address internal toko2 = makeAddr("toko2");
    address internal penerima1 = makeAddr("penerima1");
    address internal penerima2 = makeAddr("penerima2");
    address internal penerima3 = makeAddr("penerima3");
    address internal outsider = makeAddr("outsider");

    uint256 internal constant JATAH = 500_000e18;
    uint256 internal constant MAX_PER_TX = 200_000e18;
    uint256 internal constant MAX_PER_HARI = 500_000e18;

    function setUp() public {
        token = new MockIDRX();
        campaign = new Campaign(
            operator,
            address(token),
            JATAH,
            MAX_PER_TX,
            MAX_PER_HARI
        );
    }

    function test_ConstructorSetsTokenAddress() public view {
        assertEq(address(campaign.token()), address(token));
    }

    function test_ConstructorSetsJatahPerPenerima() public view {
        assertEq(campaign.jatahPerPenerima(), JATAH);
    }

    function test_ConstructorSetsMaxPerTx() public view {
        assertEq(campaign.maxPerTx(), MAX_PER_TX);
    }

    function test_ConstructorSetsMaxPerHari() public view {
        assertEq(campaign.maxPerHari(), MAX_PER_HARI);
    }

    function test_ConstructorTransfersOwnershipToOperatorImmediately() public {
        assertEq(campaign.owner(), operator);
    }

    function test_ConstructorLeavesAgentUnset() public view {
        assertEq(campaign.agent(), address(0));
    }

    function test_SetAgentSetsAgentAddress() public {
        campaign.setAgent(relayer);
        assertEq(campaign.agent(), relayer);
    }

    function test_SetAgentEmitsAgentDiubahEvent() public {
        vm.expectEmit(true, true, true, true);
        emit AgentDiubah(relayer);
        campaign.setAgent(relayer);
    }

    function test_SetAgentRevertsForNonOwner() public {
        vm.prank(outsider);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, outsider));
        campaign.setAgent(relayer);
    }

    function test_SetWhitelistSetsTrueAndEmits() public {
        vm.expectEmit(true, true, true, true);
        emit WhitelistDiubah(toko1, true);
        campaign.setWhitelist(toko1, true);

        assertTrue(campaign.isWhitelist(toko1));
    }

    function test_SetWhitelistSetsFalseAndEmits() public {
        campaign.setWhitelist(toko1, true);
        vm.expectEmit(true, true, true, true);
        emit WhitelistDiubah(toko1, false);
        campaign.setWhitelist(toko1, false);

        assertFalse(campaign.isWhitelist(toko1));
    }

    function test_SetWhitelistRevertsForNonOwner() public {
        vm.prank(outsider);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, outsider));
        campaign.setWhitelist(toko1, true);
    }

    function test_SetPenerimaBatchSetsAllAndEmitsPerEntry() public {
        address[] memory orang = new address[](3);
        orang[0] = penerima1;
        orang[1] = penerima2;
        orang[2] = penerima3;
        bool[] memory diizinkan = new bool[](3);
        diizinkan[0] = true;
        diizinkan[1] = true;
        diizinkan[2] = true;

        vm.expectEmit(true, true, true, true);
        emit PenerimaDiubah(penerima1, true);
        vm.expectEmit(true, true, true, true);
        emit PenerimaDiubah(penerima2, true);
        vm.expectEmit(true, true, true, true);
        emit PenerimaDiubah(penerima3, true);
        campaign.setPenerimaBatch(orang, diizinkan);

        assertTrue(campaign.isPenerima(penerima1));
        assertTrue(campaign.isPenerima(penerima2));
        assertTrue(campaign.isPenerima(penerima3));
    }

    function test_SetPenerimaBatchCanDeactivateEntry() public {
        address[] memory orang = new address[](1);
        orang[0] = penerima1;
        bool[] memory diizinkan = new bool[](1);
        diizinkan[0] = true;
        campaign.setPenerimaBatch(orang, diizinkan);

        diizinkan[0] = false;
        campaign.setPenerimaBatch(orang, diizinkan);

        assertFalse(campaign.isPenerima(penerima1));
    }

    function test_SetPenerimaBatchRevertsOnLengthMismatch() public {
        address[] memory orang = new address[](2);
        orang[0] = penerima1;
        orang[1] = penerima2;
        bool[] memory diizinkan = new bool[](1);
        diizinkan[0] = true;

        vm.expectRevert(Campaign.LengthMismatch.selector);
        campaign.setPenerimaBatch(orang, diizinkan);
    }

    function test_SetPenerimaBatchRevertsForNonOwner() public {
        address[] memory orang = new address[](1);
        orang[0] = penerima1;
        bool[] memory diizinkan = new bool[](1);
        diizinkan[0] = true;

        vm.prank(outsider);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, outsider));
        campaign.setPenerimaBatch(orang, diizinkan);
    }

    function test_SetLimitUpdatesBothAndEmits() public {
        vm.expectEmit(true, true, true, true);
        emit LimitDiubah(100_000e18, 300_000e18);
        campaign.setLimit(100_000e18, 300_000e18);

        assertEq(campaign.maxPerTx(), 100_000e18);
        assertEq(campaign.maxPerHari(), 300_000e18);
    }

    function test_SetLimitRevertsForNonOwner() public {
        vm.prank(outsider);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, outsider));
        campaign.setLimit(100_000e18, 300_000e18);
    }

    event AgentDiubah(address agent);
    event WhitelistDiubah(address indexed toko, bool diizinkan);
    event PenerimaDiubah(address indexed penerima, bool diizinkan);
    event LimitDiubah(uint256 maxPerTx, uint256 maxPerHari);
}