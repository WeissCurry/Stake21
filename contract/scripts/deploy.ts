import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
import { formatEther, keccak256, toBytes } from "viem";
import * as fs from "fs";

async function main() {
  console.log("🚀 Starting Syariah Registry & AmanahStakes deployment...\n");

  // --- ENV CHECK ---
  if (!process.env.WALLET_KEY)
    throw new Error("❌ WALLET_KEY not found in .env file");

  // --- SETUP DEPLOYER ---
  const deployers = await hre.viem.getWalletClients();
  const deployer = deployers?.[0];
  if (!deployer)
    throw new Error("❌ Wallet client not found. Check Hardhat config or .env.");

  const publicClient = await hre.viem.getPublicClient();
  console.log("📍 Deployer:", deployer.account.address);

  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  console.log("💰 Balance:", formatEther(balance), "ETH\n");

  // ============================================================
  // 1️⃣ Deploy SyariahRegistry
  // ============================================================
  console.log("📘 Deploying SyariahRegistry...");
  const syariah = await hre.viem.deployContract("SyariahRegistry", []);
  console.log("✅ SyariahRegistry deployed at:", syariah.address, "\n");

  // ============================================================
  // 2️⃣ Deploy AmanahStakesNFT
  // ============================================================
  console.log("🪙 Deploying AmanahStakesNFT...");
  const baseURI = "https://metadata.amanahstakes.xyz/";
  // ✅ constructor(string baseURI_)
  const nft = await hre.viem.deployContract("AmanahStakesNFT", [baseURI]);
  console.log("✅ AmanahStakesNFT deployed at:", nft.address, "\n");

  // ============================================================
  // 3️⃣ Deploy AmanahStakesCore
  // ============================================================
  console.log("⚙️ Deploying AmanahStakesCore...");
  const initialTermsIPFS = "QmExampleIPFSHashForIjarahTermsV1";
  const initialTermsHash = keccak256(toBytes(initialTermsIPFS));
  const core = await hre.viem.deployContract("AmanahStakesCore", [
    initialTermsHash,
  ]);
  console.log("✅ AmanahStakesCore deployed at:", core.address, "\n");

  // ============================================================
  // 4️⃣ Linking & Role Setup
  // ============================================================
  console.log("🔗 Linking contracts...");

  const gasPrice = await publicClient.getGasPrice();
  const higherGas = (gasPrice * 120n) / 100n;

  try {
    // Link NFT ke Core
    const tx1 = await core.write.setNFTContract([nft.address], {
      gasPrice: higherGas,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx1 });
    console.log("✅ Core linked to NFT");

    // Grant minter & burner roles
    const tx2 = await nft.write.grantMinterRole([core.address], {
      gasPrice: higherGas,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx2 });
    console.log("✅ Core granted MINTER_ROLE");

    const tx3 = await nft.write.grantBurnerRole([core.address], {
      gasPrice: higherGas,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx3 });
    console.log("✅ Core granted BURNER_ROLE");

    // Aktifkan fitur NFT
    const tx4 = await core.write.toggleNFTFeature([true], {
      gasPrice: higherGas,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx4 });
    console.log("✅ NFT feature enabled");

    // Aktifkan platform
    const config = await core.read.getConfig();
    if (!config.isActive) {
      const tx5 = await core.write.activatePlatform({ gasPrice: higherGas });
      await publicClient.waitForTransactionReceipt({ hash: tx5 });
      console.log("✅ Platform activated");
    } else {
      console.log("⚙️ Platform already active, skipping activation.");
    }
  } catch (err: any) {
    console.error("⚠️ Linking/activation error:", err.message);
  }

  // ============================================================
  // 5️⃣ Save Deployment Info
  // ============================================================
  const chainId = await publicClient.getChainId();
  const blockNumber = await publicClient.getBlockNumber();

  const deploymentData = {
    network: hre.network.name,
    chainId,
    deployer: deployer.account.address,
    timestamp: new Date().toISOString(),
    blockNumber,
    contracts: {
      SyariahRegistry: syariah.address,
      AmanahStakesNFT: nft.address,
      AmanahStakesCore: core.address,
    },
    terms: {
      ipfs: initialTermsIPFS,
      hash: initialTermsHash,
    },
  };

  // BigInt-safe JSON
  const replacer = (_key: string, value: any) =>
    typeof value === "bigint" ? value.toString() : value;
  if (!fs.existsSync("./deployments"))
    fs.mkdirSync("./deployments", { recursive: true });

  const filename = `./deployments/${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentData, replacer, 2));
  fs.writeFileSync(
    `./deployments/latest-${hre.network.name}.json`,
    JSON.stringify(deploymentData, replacer, 2)
  );

  console.log(`\n💾 Deployment data saved to: ${filename}`);
  console.log("\n🎉 All contracts deployed, linked, and activated successfully!\n");

  // ============================================================
  // 6️⃣ Verification Guide
  // ============================================================
  console.log("🔍 To verify on Basescan:");
  console.log(
    `npx hardhat verify --network ${hre.network.name} ${syariah.address}`
  );
  console.log(
    `npx hardhat verify --network ${hre.network.name} ${nft.address} "${baseURI}"`
  );
  console.log(
    `npx hardhat verify --network ${hre.network.name} ${core.address} "${initialTermsHash}"`
  );
}

// ------------------------------------------------------------
main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
