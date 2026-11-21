// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Campaign is Ownable2Step, ReentrancyGuard {
    IERC20 public immutable token;
    address public agent;
    uint256 public jatahPerPenerima;
    uint256 public maxPerTx;
    uint256 public maxPerHari;

    mapping(address => bool) public isWhitelist;
    mapping(address => bool) public isPenerima;
    mapping(address => uint256) public sudahBelanja;
    mapping(address => mapping(uint256 => uint256)) public belanjaHariIni;
    mapping(uint256 => bool) public nonceTerpakai;

    error BUKAN_PENERIMA();
    error BUKAN_WHITELIST();
    error JATAH_HABIS();
    error POOL_HABIS();
    error LIMIT();
    error EXPIRED();
    error NONCE_DIGUNAKAN();
    error BukanAgent();
    error LengthMismatch();

    event Donasi(address indexed donatur, uint256 jumlah);
    event Belanja(address indexed penerima, address indexed toko, uint256 jumlah, uint256 nonce);
    event WhitelistDiubah(address indexed toko, bool diizinkan);
    event PenerimaDiubah(address indexed penerima, bool diizinkan);
    event LimitDiubah(uint256 maxPerTx, uint256 maxPerHari);
    event AgentDiubah(address agent);

    constructor(
        address operator_,
        address token_,
        uint256 jatahPerPenerima_,
        uint256 maxPerTx_,
        uint256 maxPerHari_
    ) Ownable(operator_) {
        token = IERC20(token_);
        jatahPerPenerima = jatahPerPenerima_;
        maxPerTx = maxPerTx_;
        maxPerHari = maxPerHari_;
    }

    function setAgent(address agent_) external onlyOwner {
        agent = agent_;
        emit AgentDiubah(agent_);
    }

    function setWhitelist(address toko, bool diizinkan) external onlyOwner {
        isWhitelist[toko] = diizinkan;
        emit WhitelistDiubah(toko, diizinkan);
    }

    function setPenerimaBatch(address[] calldata orang, bool[] calldata diizinkan) external onlyOwner {
        if (orang.length != diizinkan.length) revert LengthMismatch();
        for (uint256 i = 0; i < orang.length; i++) {
            address p = orang[i];
            isPenerima[p] = diizinkan[i];
            emit PenerimaDiubah(p, diizinkan[i]);
        }
    }

    function setLimit(uint256 maxPerTx_, uint256 maxPerHari_) external onlyOwner {
        maxPerTx = maxPerTx_;
        maxPerHari = maxPerHari_;
        emit LimitDiubah(maxPerTx_, maxPerHari_);
    }

    function donasi(uint256 jumlah) external nonReentrant {
        token.transferFrom(msg.sender, address(this), jumlah);
        emit Donasi(msg.sender, jumlah);
    }

    function belanja(
        address penerima,
        address toko,
        uint256 jumlah,
        uint256 nonce,
        uint256 expiry
    ) external nonReentrant {
        if (msg.sender != agent && msg.sender != owner()) revert BukanAgent();
        if (!isPenerima[penerima]) revert BUKAN_PENERIMA();
        if (!isWhitelist[toko]) revert BUKAN_WHITELIST();
        if (sudahBelanja[penerima] + jumlah > jatahPerPenerima) revert JATAH_HABIS();
        if (token.balanceOf(address(this)) < jumlah) revert POOL_HABIS();
        if (jumlah > maxPerTx) revert LIMIT();
        uint256 today = block.timestamp / 1 days;
        if (belanjaHariIni[penerima][today] + jumlah > maxPerHari) revert LIMIT();
        if (block.timestamp > expiry) revert EXPIRED();
        if (nonceTerpakai[nonce]) revert NONCE_DIGUNAKAN();

        nonceTerpakai[nonce] = true;
        sudahBelanja[penerima] += jumlah;
        belanjaHariIni[penerima][today] += jumlah;
        token.transfer(toko, jumlah);
        emit Belanja(penerima, toko, jumlah, nonce);
    }
}