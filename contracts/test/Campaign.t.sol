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

    function test_DonasiPullsApprovedTokensFromDonorToCampaign() public {
        uint256 amount = 10_000_000e18;
        address donatur = makeAddr("donatur");

        token.faucet();
        token.transfer(donatur, amount);
        vm.startPrank(donatur);
        token.approve(address(campaign), amount);
        campaign.donasi(amount);
        vm.stopPrank();

        assertEq(token.balanceOf(donatur), 0);
        assertEq(token.balanceOf(address(campaign)), amount);
    }

    function test_DonasiEmitsDonasiEvent() public {
        uint256 amount = 1_000_000e18;
        address donatur = makeAddr("donatur-2");

        token.faucet();
        token.transfer(donatur, amount);
        vm.startPrank(donatur);
        token.approve(address(campaign), amount);

        vm.expectEmit(true, true, true, true);
        emit Donasi(donatur, amount);
        campaign.donasi(amount);
        vm.stopPrank();
    }

    function test_DonasiAccumulatesAcrossMultipleDonors() public {
        address d1 = makeAddr("d1");
        address d2 = makeAddr("d2");
        uint256 a1 = 3_000_000e18;
        uint256 a2 = 7_000_000e18;

        token.faucet();
        token.transfer(d1, a1);
        token.faucet();
        token.transfer(d2, a2);

        vm.startPrank(d1);
        token.approve(address(campaign), a1);
        campaign.donasi(a1);
        vm.stopPrank();

        vm.startPrank(d2);
        token.approve(address(campaign), a2);
        campaign.donasi(a2);
        vm.stopPrank();

        assertEq(token.balanceOf(address(campaign)), a1 + a2);
    }

    function test_DonasiRevertsIfAllowanceInsufficient() public {
        uint256 amount = 1_000_000e18;
        address donatur = makeAddr("donatur-no-approve");

        token.faucet();
        token.transfer(donatur, amount);
        vm.startPrank(donatur);
        vm.expectRevert();
        campaign.donasi(amount);
        vm.stopPrank();
    }

    function _setupDemoState(uint256 poolAmount) internal {
        token.faucet();
        token.approve(address(campaign), poolAmount);
        campaign.donasi(poolAmount);

        campaign.setAgent(relayer);
        campaign.setWhitelist(toko1, true);
        campaign.setWhitelist(toko2, true);

        address[] memory orang = new address[](1);
        orang[0] = penerima1;
        bool[] memory diizinkan = new bool[](1);
        diizinkan[0] = true;
        campaign.setPenerimaBatch(orang, diizinkan);
    }

    function test_BelanjaSuccessMovesFundsAndEmitsEvent() public {
        _setupDemoState(10_000_000e18);
        uint256 jumlah = 50_000e18;
        uint256 nonce = 1;
        uint256 expiry = block.timestamp + 5 minutes;

        uint256 poolBefore = token.balanceOf(address(campaign));
        uint256 tokoBefore = token.balanceOf(toko1);

        vm.prank(relayer);
        vm.expectEmit(true, true, true, true);
        emit Belanja(penerima1, toko1, jumlah, nonce);
        campaign.belanja(penerima1, toko1, jumlah, nonce, expiry);

        assertEq(token.balanceOf(address(campaign)), poolBefore - jumlah);
        assertEq(token.balanceOf(toko1), tokoBefore + jumlah);
        assertTrue(campaign.nonceTerpakai(nonce));
        assertEq(campaign.sudahBelanja(penerima1), jumlah);
    }

    function test_BelanjaUpdatesDailyCounterPerUtcDay() public {
        _setupDemoState(10_000_000e18);
        uint256 today = block.timestamp / 1 days;
        uint256 first = 50_000e18;
        uint256 second = 100_000e18;

        vm.startPrank(relayer);
        campaign.belanja(penerima1, toko1, first, 1, block.timestamp + 5 minutes);
        campaign.belanja(penerima1, toko2, second, 2, block.timestamp + 5 minutes);
        vm.stopPrank();

        assertEq(campaign.belanjaHariIni(penerima1, today), first + second);
        assertEq(campaign.sudahBelanja(penerima1), first + second);
    }

    function test_BelanjaDailyCounterResetsAcrossUtcDayBoundary() public {
        _setupDemoState(10_000_000e18);
        uint256 day1 = block.timestamp / 1 days;

        vm.prank(relayer);
        campaign.belanja(penerima1, toko1, 50_000e18, 1, block.timestamp + 5 minutes);

        vm.warp((day1 + 1) * 1 days + 1);
        uint256 day2 = block.timestamp / 1 days;

        vm.prank(relayer);
        campaign.belanja(penerima1, toko1, 100_000e18, 2, block.timestamp + 5 minutes);

        assertEq(campaign.belanjaHariIni(penerima1, day1), 50_000e18);
        assertEq(campaign.belanjaHariIni(penerima1, day2), 100_000e18);
        assertEq(campaign.sudahBelanja(penerima1), 150_000e18);
    }

    function test_BelanjaRevertsForNonAgentNonOwner() public {
        _setupDemoState(10_000_000e18);
        vm.prank(outsider);
        vm.expectRevert(Campaign.BukanAgent.selector);
        campaign.belanja(penerima1, toko1, 50_000e18, 1, block.timestamp + 5 minutes);
    }

    function test_BelanjaOwnerCanAlsoSubmit() public {
        _setupDemoState(10_000_000e18);
        campaign.belanja(penerima1, toko1, 50_000e18, 1, block.timestamp + 5 minutes);
        assertEq(campaign.sudahBelanja(penerima1), 50_000e18);
    }

    function test_BR01_BelanjaRevertsWithBukanPenerimaForOutsider() public {
        _setupDemoState(10_000_000e18);
        vm.prank(relayer);
        vm.expectRevert(Campaign.BUKAN_PENERIMA.selector);
        campaign.belanja(outsider, toko1, 50_000e18, 1, block.timestamp + 5 minutes);
    }

    function test_BR02_BelanjaRevertsWithBukanWhitelistForUnlistedStore() public {
        _setupDemoState(10_000_000e18);
        address unlisted = makeAddr("toko-palsu");
        vm.prank(relayer);
        vm.expectRevert(Campaign.BUKAN_WHITELIST.selector);
        campaign.belanja(penerima1, unlisted, 50_000e18, 1, block.timestamp + 5 minutes);
    }

    function test_BR03a_BelanjaRevertsWithJatahHabisWhenOverQuota() public {
        _setupDemoState(10_000_000e18);
        vm.prank(relayer);
        vm.expectRevert(Campaign.JATAH_HABIS.selector);
        campaign.belanja(penerima1, toko1, JATAH + 1, 1, block.timestamp + 5 minutes);
    }

    function test_BR03b_BelanjaRevertsWithPoolHabisWhenPoolLow() public {
        uint256 smallPool = 100_000e18;
        _setupDemoState(smallPool);
        uint256 jumlah = 150_000e18;

        vm.prank(relayer);
        vm.expectRevert(Campaign.POOL_HABIS.selector);
        campaign.belanja(penerima1, toko1, jumlah, 1, block.timestamp + 5 minutes);
    }

    function test_BR04_BelanjaRevertsWithLimitWhenOverMaxPerTx() public {
        _setupDemoState(10_000_000e18);
        vm.prank(relayer);
        vm.expectRevert(Campaign.LIMIT.selector);
        campaign.belanja(penerima1, toko1, MAX_PER_TX + 1, 1, block.timestamp + 5 minutes);
    }

    function test_BR05_BelanjaRevertsWithLimitWhenDailyCapExceededAcrossTxs() public {
        Campaign bigQuota = new Campaign(operator, address(token), 2_000_000e18, MAX_PER_TX, MAX_PER_HARI);
        token.faucet();
        token.approve(address(bigQuota), 10_000_000e18);
        bigQuota.donasi(10_000_000e18);
        bigQuota.setAgent(relayer);
        bigQuota.setWhitelist(toko1, true);
        bigQuota.setWhitelist(toko2, true);
        address[] memory orang = new address[](1);
        orang[0] = penerima1;
        bool[] memory diizinkan = new bool[](1);
        diizinkan[0] = true;
        bigQuota.setPenerimaBatch(orang, diizinkan);

        vm.startPrank(relayer);
        bigQuota.belanja(penerima1, toko1, MAX_PER_TX, 1, block.timestamp + 5 minutes);
        bigQuota.belanja(penerima1, toko2, MAX_PER_TX, 2, block.timestamp + 5 minutes);
        vm.expectRevert(Campaign.LIMIT.selector);
        bigQuota.belanja(penerima1, toko1, MAX_PER_TX, 3, block.timestamp + 5 minutes);
        vm.stopPrank();
    }

    function test_BR06_BelanjaRevertsWithExpiredWhenPastExpiry() public {
        _setupDemoState(10_000_000e18);
        vm.prank(relayer);
        vm.expectRevert(Campaign.EXPIRED.selector);
        campaign.belanja(penerima1, toko1, 50_000e18, 1, block.timestamp - 1);
    }

    function test_BR07_BelanjaRevertsWithNonceDigunakanOnReuse() public {
        _setupDemoState(10_000_000e18);
        vm.startPrank(relayer);
        campaign.belanja(penerima1, toko1, 50_000e18, 1, block.timestamp + 5 minutes);
        vm.expectRevert(Campaign.NONCE_DIGUNAKAN.selector);
        campaign.belanja(penerima1, toko2, 50_000e18, 1, block.timestamp + 5 minutes);
        vm.stopPrank();
    }

    function test_BR09_BelanjaRevertsWithBukanWhitelistAfterDelist() public {
        _setupDemoState(10_000_000e18);
        campaign.setWhitelist(toko1, false);
        vm.prank(relayer);
        vm.expectRevert(Campaign.BUKAN_WHITELIST.selector);
        campaign.belanja(penerima1, toko1, 50_000e18, 1, block.timestamp + 5 minutes);
    }

    event AgentDiubah(address agent);
    event WhitelistDiubah(address indexed toko, bool diizinkan);
    event PenerimaDiubah(address indexed penerima, bool diizinkan);
    event LimitDiubah(uint256 maxPerTx, uint256 maxPerHari);
    event Donasi(address indexed donatur, uint256 jumlah);
    event Belanja(address indexed penerima, address indexed toko, uint256 jumlah, uint256 nonce);
}