// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LibUjrah
 * @notice Library untuk perhitungan Ujrah (imbal hasil tetap) - Gas efficient
 * @dev Digunakan untuk perhitungan dan validasi staking berbasis prinsip syariah.
 */
library LibUjrah {
    /**
     * @notice Hitung ujrah berdasarkan jumlah ETH, rate (basis points), dan periode dalam hari.
     * @param ethAmount Jumlah ETH yang di-stake
     * @param ujrahBp Rate ujrah dalam basis points (misal 400 = 4%)
     * @param periodeHari Lama periode staking (hari)
     * @return ujrahPeriode Jumlah ujrah yang harus dibayar
     */
    function hitungUjrah(
        uint256 ethAmount,
        uint256 ujrahBp,
        uint256 periodeHari
    ) internal pure returns (uint256 ujrahPeriode) {
        // Ujrah tahunan = ethAmount * (ujrahBp / 10000)
        uint256 ujrahTahunan = (ethAmount * ujrahBp) / 10000;

        // Ujrah periode = ujrah tahunan * (hari / 365)
        ujrahPeriode = (ujrahTahunan * periodeHari) / 365;
    }

    /**
     * @notice Validasi parameter staking agar sesuai dengan ketentuan protokol
     * @param amount Jumlah ETH yang di-stake
     * @param minStake Batas minimum staking
     * @param maxStake Batas maksimum staking
     * @param periodeHari Lama periode staking dalam hari
     * @return valid True jika parameter valid
     */
    function validateStakeParams(
        uint256 amount,
        uint256 minStake,
        uint256 maxStake,
        uint256 periodeHari
    ) internal pure returns (bool valid) {
        valid = (
            amount >= minStake &&
            amount <= maxStake &&
            periodeHari >= 1
        );
    }
}
