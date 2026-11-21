// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockIDRX} from "../src/MockIDRX.sol";
import {Campaign} from "../src/Campaign.sol";
import {CampaignFactory} from "../src/CampaignFactory.sol";

contract CampaignFactoryTest is Test {
    MockIDRX internal token;
    CampaignFactory internal factory;

    address internal operator = address(this);
    address internal otherOperator = makeAddr("other-operator");

    uint256 internal constant JATAH = 500_000e18;
    uint256 internal constant MAX_PER_TX = 200_000e18;
    uint256 internal constant MAX_PER_HARI = 500_000e18;

    function setUp() public {
        token = new MockIDRX();
        factory = new CampaignFactory();
    }

    function test_CreateCampaignDeploysCampaignWithCallerAsOperator() public {
        address deployed = factory.createCampaign(
            address(token),
            "Banjir Demak 2025",
            JATAH,
            MAX_PER_TX,
            MAX_PER_HARI
        );
        Campaign c = Campaign(deployed);

        assertEq(c.owner(), operator);
        assertEq(address(c.token()), address(token));
        assertEq(c.jatahPerPenerima(), JATAH);
        assertEq(c.maxPerTx(), MAX_PER_TX);
        assertEq(c.maxPerHari(), MAX_PER_HARI);
    }

    function test_CreateCampaignSetsOperatorFromMsgSender() public {
        vm.prank(otherOperator);
        address deployed = factory.createCampaign(
            address(token),
            "Banjir Bandung 2025",
            JATAH,
            MAX_PER_TX,
            MAX_PER_HARI
        );

        assertEq(Campaign(deployed).owner(), otherOperator);
    }

    function test_CreateCampaignEmitsCampaignCreatedWithOperatorTokenAndData() public {
        vm.expectEmit(false, true, true, true);
        emit CampaignCreated(
            address(0),
            operator,
            address(token),
            "Banjir Demak 2025",
            JATAH,
            MAX_PER_TX,
            MAX_PER_HARI
        );

        factory.createCampaign(
            address(token),
            "Banjir Demak 2025",
            JATAH,
            MAX_PER_TX,
            MAX_PER_HARI
        );
    }

    function test_CreateCampaignMultipleInstancesAreDistinct() public {
        address a = factory.createCampaign(address(token), "A", JATAH, MAX_PER_TX, MAX_PER_HARI);
        address b = factory.createCampaign(address(token), "B", JATAH, MAX_PER_TX, MAX_PER_HARI);

        assertFalse(a == b);
    }

    function test_CreateCampaignReturnsDeployedAddress() public {
        address predicted = vm.computeCreateAddress(address(factory), vm.getNonce(address(factory)));

        address deployed = factory.createCampaign(
            address(token),
            "Predictable",
            JATAH,
            MAX_PER_TX,
            MAX_PER_HARI
        );

        assertEq(deployed, predicted);
    }

    event CampaignCreated(
        address indexed campaign,
        address indexed operator,
        address indexed token,
        string name,
        uint256 jatahPerPenerima,
        uint256 maxPerTx,
        uint256 maxPerHari
    );
}