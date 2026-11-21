// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockIDRX} from "../src/MockIDRX.sol";
import {Campaign} from "../src/Campaign.sol";

contract CampaignInvariantTest is Test {
    MockIDRX internal token;
    Campaign internal campaign;
    Handler internal handler;

    address internal operator = address(this);
    address internal relayer = makeAddr("relayer");

    uint256 internal constant JATAH = 500_000e18;
    uint256 internal constant MAX_PER_TX = 200_000e18;
    uint256 internal constant MAX_PER_HARI = 500_000e18;

    function setUp() public {
        token = new MockIDRX();
        campaign = new Campaign(operator, address(token), JATAH, MAX_PER_TX, MAX_PER_HARI);
        campaign.setAgent(relayer);

        handler = new Handler(token, campaign, operator, relayer);

        // Restrict invariant fuzzer to Handler-only entry. Without this, the
        // fuzzer calls MockIDRX.faucet() directly, minting to arbitrary senders
        // (including the Campaign address itself in some seeds), which breaks
        // pool-solvency bookkeeping without violating the contract invariant.
        targetContract(address(handler));
        excludeContract(address(token));
        excludeContract(address(campaign));
    }

    function invariant_poolSolvencyBalanceMatchesBookkeeping() public view {
        assertEq(
            token.balanceOf(address(campaign)),
            handler.totalDonasi() - handler.totalBelanja(),
            "BR-08 violation: pool balance diverged from totalDonasi - totalBelanja"
        );
    }

    function invariant_sudahBelanjaWithinJatahForAllRecipients() public view {
        address[] memory rs = handler.recipients();
        for (uint256 i = 0; i < rs.length; i++) {
            assertLe(
                campaign.sudahBelanja(rs[i]),
                campaign.jatahPerPenerima(),
                "BR-03 violation: sudahBelanja > jatahPerPenerima"
            );
        }
    }

    function invariant_nonceNeverReused() public view {
        assertEq(
            handler.successBelanjaCount(),
            handler.uniqueNoncesConsumed(),
            "BR-07 violation: nonce reuse detected"
        );
    }
}

contract Handler is Test {
    MockIDRX public immutable token;
    Campaign public immutable campaign;
    address public immutable operator;
    address public immutable relayer;

    uint256 public totalDonasi;
    uint256 public totalBelanja;
    uint256 public successBelanjaCount;
    uint256 public uniqueNoncesConsumed;

    uint256 private nonceCounter;
    address[] private _recipients;
    address[] private _stores;
    mapping(uint256 => bool) private _localNonceUsed;

    constructor(MockIDRX _token, Campaign _campaign, address _operator, address _relayer) {
        token = _token;
        campaign = _campaign;
        operator = _operator;
        relayer = _relayer;

        for (uint256 i = 0; i < 3; i++) {
            _stores.push(makeAddr(string(abi.encodePacked("toko-handler-", i))));
        }
        vm.startPrank(operator);
        for (uint256 i = 0; i < 3; i++) {
            campaign.setWhitelist(_stores[i], true);
        }
        vm.stopPrank();
    }

    function recipients() external view returns (address[] memory) {
        return _recipients;
    }

    function donate(uint256 donorSeed, uint256 amount) external {
        address donor = makeAddr(string(abi.encodePacked("donor-handler-", donorSeed)));
        amount = bound(amount, 1, 20_000_000e18);

        vm.prank(donor);
        token.faucet();
        vm.startPrank(donor);
        token.approve(address(campaign), amount);
        campaign.donasi(amount);
        vm.stopPrank();

        totalDonasi += amount;
    }

    function registerRecipient(uint256 seed) external {
        address recip = makeAddr(string(abi.encodePacked("penerima-handler-", seed)));

        address[] memory arr = new address[](1);
        arr[0] = recip;
        bool[] memory ok = new bool[](1);
        ok[0] = true;

        vm.prank(operator);
        campaign.setPenerimaBatch(arr, ok);

        _recipients.push(recip);
    }

    function belanja(uint256 recipIdx, uint256 storeIdx, uint256 amount, uint256 expiryOffset) external {
        if (_recipients.length == 0) return;
        recipIdx = bound(recipIdx, 0, _recipients.length - 1);
        storeIdx = bound(storeIdx, 0, _stores.length - 1);
        amount = bound(amount, 1, 4 * campaign.jatahPerPenerima());
        expiryOffset = bound(expiryOffset, 1, 1 hours);

        uint256 nonce = ++nonceCounter;
        uint256 expiry = block.timestamp + expiryOffset;

        vm.prank(relayer);
        try campaign.belanja(_recipients[recipIdx], _stores[storeIdx], amount, nonce, expiry) {
            totalBelanja += amount;
            successBelanjaCount++;
            if (!_localNonceUsed[nonce]) {
                _localNonceUsed[nonce] = true;
                uniqueNoncesConsumed++;
            }
        } catch {}
    }

    function delistStore(uint256 storeIdx) external {
        if (_stores.length == 0) return;
        storeIdx = bound(storeIdx, 0, _stores.length - 1);
        vm.prank(operator);
        campaign.setWhitelist(_stores[storeIdx], false);
    }

    function relistStore(uint256 storeIdx) external {
        if (_stores.length == 0) return;
        storeIdx = bound(storeIdx, 0, _stores.length - 1);
        vm.prank(operator);
        campaign.setWhitelist(_stores[storeIdx], true);
    }
}