##  Contract Architecture

| Contract | Description |
|-----------|--------------|
| **LibUjrah.sol** | Library to calculate *ujrah* (fee / reward) for stakers. |
| **SyariahRegistry.sol** | Manages shariah certification (no riba, gharar, maysir). |
| **AmanahStakesTreasury.sol** | Stores and releases funds safely. |
| **AmanahStakesCore.sol** | Main staking logic (stake, claim, withdraw). |
| **AmanahStakesToken.sol** | (Optional) NFT / SBT proof of staking. |


## Alur testing simple

- Deploy semua kontrak → ambil address-nya
- Set registry di core (jika perlu)
- Tambah audit di SyariahRegistry
- Grant role ke validator/admin
- Lakukan stake
- Cek total staking
- Lakukan unstake
- Distribusi ujrah lewat Treasury
- Pause/unpause buat tes keamanan
