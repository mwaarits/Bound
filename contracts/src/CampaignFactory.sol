// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Campaign} from "./Campaign.sol";

contract CampaignFactory {
    event CampaignCreated(
        address indexed campaign,
        address indexed operator,
        address indexed token,
        string name,
        uint256 jatahPerPenerima,
        uint256 maxPerTx,
        uint256 maxPerHari
    );

    function createCampaign(
        address token,
        string calldata name,
        uint256 jatahPerPenerima,
        uint256 maxPerTx,
        uint256 maxPerHari
    ) external returns (address) {
        Campaign c = new Campaign(msg.sender, token, jatahPerPenerima, maxPerTx, maxPerHari);
        emit CampaignCreated(
            address(c),
            msg.sender,
            token,
            name,
            jatahPerPenerima,
            maxPerTx,
            maxPerHari
        );
        return address(c);
    }
}