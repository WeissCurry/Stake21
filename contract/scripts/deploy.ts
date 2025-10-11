import hre from "hardhat";
import { formatEther, parseEther, keccak256, toBytes } from "viem";
import * as fs from "fs";

async function main() {
  console.log("🚀 Starting deployment...\n");

  // Get deployer account
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  
  console.log("📍 Deploying contracts with account:", deployer.account.address);
  const balance = await publicClient.getBalance({ address: deployer.account.address });
  console.log("💰 Account balance:", formatEther(balance), "ETH\n");

  // ============================================================
  // 1. Deploy AmanahStakesCore (Enhanced with Timestamps)
  // ============================================================
  
  // Generate initial terms hash (example: keccak256 of terms document IPFS hash)
  const initialTermsIPFS = "QmExampleIPFSHashForIjarahTermsV1"; // Replace with actual IPFS hash
  const initialTermsHash = keccak256(toBytes(initialTermsIPFS));
  
  console.log("📜 Deploying AmanahStakesCore (Enhanced Version)...");
  console.log("📄 Initial Terms Hash:", initialTermsHash);
  
  const amanahStakesCore = await hre.viem.deployContract("AmanahStakesCore", [initialTermsHash]);
  const amanahStakesCoreAddress = amanahStakesCore.address;
  console.log("✅ AmanahStakesCore deployed to:", amanahStakesCoreAddress);

  // ============================================================
  // 2. Initialize Contract
  // ============================================================
  
  console.log("\n⚙️  Initializing contract...");
  
  // Wait for a few blocks before making transactions to avoid nonce conflicts
  console.log("⏳ Waiting for network confirmation...");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Get gas price for Base Sepolia
  const gasPrice = await publicClient.getGasPrice();
  const increasedGasPrice = (gasPrice * 120n) / 100n; // Increase by 20%
  
  try {
    // Activate AmanahStakesCore platform
    console.log("📋 Activating AmanahStakesCore platform...");
    const activateCoreHash = await amanahStakesCore.write.activatePlatform({
      gasPrice: increasedGasPrice
    });
    await publicClient.waitForTransactionReceipt({ hash: activateCoreHash });
    console.log("✅ Platform activated successfully");
    
    // Wait between transactions
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Deposit initial treasury (optional - only if enough balance)
    const currentBalance = await publicClient.getBalance({ address: deployer.account.address });
    const minRequiredBalance = parseEther("0.05"); // Keep 0.05 ETH for gas
    
    if (currentBalance > minRequiredBalance) {
      // Deposit 50% of available balance (or max 0.5 ETH, whichever is smaller)
      const availableForDeposit = currentBalance - minRequiredBalance;
      const maxDeposit = parseEther("0.5");
      const depositAmount = availableForDeposit > maxDeposit ? maxDeposit : availableForDeposit / 2n;
      
      if (depositAmount > 0n) {
        console.log(`💵 Depositing ${formatEther(depositAmount)} ETH to treasury...`);
        const depositHash = await amanahStakesCore.write.depositTreasury({ 
          value: depositAmount,
          gasPrice: increasedGasPrice
        });
        await publicClient.waitForTransactionReceipt({ hash: depositHash });
        console.log("✅ Treasury deposited successfully");
      } else {
        console.log("⚠️  Skipping treasury deposit - insufficient balance");
      }
    } else {
      console.log("⚠️  Skipping treasury deposit - balance too low (keep for gas)");
    }
  } catch (error: any) {
    console.error("\n⚠️  Initialization error:", error.message);
    console.log("💡 Tip: You can manually activate the contract later using:");
    console.log(`   - Contract address: ${amanahStakesCoreAddress}`);
    console.log(`   - Call activatePlatform() as ADMIN`);
  }

  // ============================================================
  // 3. Display Summary with Enhanced Details
  // ============================================================
  
  console.log("\n" + "=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log("\n📊 Contract Address:");
  console.log("└─ AmanahStakesCore:   ", amanahStakesCoreAddress);
  
  try {
    console.log("\n📋 Platform Configuration:");
    const config = await amanahStakesCore.read.getConfig();
    console.log("├─ Min Stake:          ", formatEther(config[0]), "ETH");
    console.log("├─ Max Stake:          ", formatEther(config[1]), "ETH");
    console.log("├─ Ujrah Rate:         ", Number(config[2]) / 100, "% annually");
    console.log("├─ Min Lock Days:      ", config[3].toString(), "days");
    console.log("├─ Max Lock Days:      ", config[4].toString(), "days");
    console.log("├─ Early Penalty:      ", Number(config[5]) / 100, "%");
    console.log("└─ Platform Active:    ", config[6] ? "✅ Yes" : "❌ No");
    
    console.log("\n📊 Platform Statistics:");
    const stats = await amanahStakesCore.read.getPlatformStats();
    console.log("├─ Total Staked:       ", formatEther(stats[0]), "ETH");
    console.log("├─ Total Ujrah Paid:   ", formatEther(stats[1]), "ETH");
    console.log("├─ Active Akads:       ", stats[2].toString());
    console.log("├─ Completed Akads:    ", stats[3].toString());
    console.log("├─ Total Akads:        ", stats[4].toString());
    console.log("├─ Platform Active:    ", stats[5] ? "✅ Yes" : "❌ No");
    console.log("└─ Is Paused:          ", stats[6] ? "⚠️  Yes" : "✅ No");
    
    console.log("\n💰 Treasury Status:");
    const treasuryBalance = await publicClient.getBalance({ address: amanahStakesCoreAddress });
    const availableBalance = await amanahStakesCore.read.getAvailableBalance();
    console.log("├─ Total Balance:      ", formatEther(treasuryBalance), "ETH");
    console.log("└─ Available (Excess): ", formatEther(availableBalance), "ETH");
  } catch (error) {
    console.log("\n⚠️  Could not fetch contract details (contract may need manual activation)");
  }
  
  console.log("\n📝 Ijarah Terms:");
  console.log("├─ Terms Hash:         ", initialTermsHash);
  console.log("└─ IPFS Reference:     ", initialTermsIPFS);
  
  console.log("\n" + "=".repeat(70));
  
  // ============================================================
  // 4. Display New Timestamp Features
  // ============================================================
  
  console.log("\n✨ NEW FEATURES IN THIS VERSION:");
  console.log("=".repeat(70));
  console.log("📅 Enhanced Timestamp Tracking:");
  console.log("  ├─ createdAt:        When akad was created");
  console.log("  ├─ ujrahClaimedAt:   When ujrah was claimed");
  console.log("  └─ completedAt:      When akad was completed/cancelled");
  console.log("\n🔍 New View Functions:");
  console.log("  └─ getAkadTimestamps(): Get detailed time information for any akad");
  console.log("     - Returns: createdAt, startTime, endTime, ujrahClaimedAt,");
  console.log("                completedAt, timeElapsed, timeRemaining, isExpired");
  console.log("=".repeat(70));

  // ============================================================
  // 5. User Guide
  // ============================================================
  
  console.log("\n📖 QUICK START GUIDE:");
  console.log("=".repeat(70));
  console.log("\n👤 For Users:");
  console.log("  1. Call agreeToTerms() with current terms hash");
  console.log("  2. Call createAkad() with desired lock period (7-365 days)");
  console.log("  3. Monitor your akad using getAkadTimestamps()");
  console.log("  4. Claim ujrah anytime using claimUjrah()");
  console.log("  5. Withdraw principal after lock period using withdrawPrincipal()");
  console.log("\n👨‍💼 For Admins:");
  console.log("  1. Deposit ETH to treasury using depositTreasury()");
  console.log("  2. Monitor platform stats using getPlatformStats()");
  console.log("  3. Update config if needed using updateConfig()");
  console.log("  4. Emergency: use deactivatePlatform() or forceCompleteAkad()");
  
  console.log("\n" + "=".repeat(70));
  console.log("📌 Save this address for frontend integration!");
  console.log("=".repeat(70) + "\n");

  // ============================================================
  // 6. Verification Info (for Etherscan/Basescan)
  // ============================================================
  
  console.log("🔍 To verify contract on Basescan, run:\n");
  console.log(`npx hardhat verify --network ${hre.network.name} ${amanahStakesCoreAddress} "${initialTermsHash}"`);
  console.log();

  // ============================================================
  // 7. Export Deployment Data to JSON
  // ============================================================
  
  const networkInfo = await publicClient.getChainId();
  const deploymentData = {
    network: hre.network.name,
    chainId: networkInfo.toString(),
    deployer: deployer.account.address,
    timestamp: new Date().toISOString(),
    blockNumber: await publicClient.getBlockNumber(),
    contract: {
      name: "AmanahStakesCore",
      address: amanahStakesCoreAddress,
      version: "2.0.0-enhanced-timestamps",
      termsHash: initialTermsHash,
      termsIPFS: initialTermsIPFS
    },
    features: {
      timestampTracking: true,
      timestamps: [
        "createdAt",
        "ujrahClaimedAt", 
        "completedAt"
      ],
      newViewFunctions: [
        "getAkadTimestamps()"
      ]
    },
    configuration: {
      minStake: "0.01",
      maxStake: "32",
      ujrahRate: "4%",
      minLockDays: 7,
      maxLockDays: 365,
      earlyWithdrawalPenalty: "10%"
    }
  };
  
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `${deploymentsDir}/deployment-${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2));
  console.log(`💾 Deployment data saved to: ${filename}`);
  
  // Also save latest deployment for easy access
  const latestFilename = `${deploymentsDir}/latest-${hre.network.name}.json`;
  fs.writeFileSync(latestFilename, JSON.stringify(deploymentData, null, 2));
  console.log(`💾 Latest deployment saved to: ${latestFilename}\n`);

  // ============================================================
  // 8. Generate Frontend Integration Snippet
  // ============================================================
  
  console.log("📋 Frontend Integration (TypeScript):");
  console.log("=".repeat(70));
  console.log(`
// Add to your frontend config
export const AMANAH_STAKES_ADDRESS = "${amanahStakesCoreAddress}";
export const TERMS_HASH = "${initialTermsHash}";
export const NETWORK_CHAIN_ID = ${networkInfo};

// Example: Get akad with timestamps
const akadTimestamps = await contract.read.getAkadTimestamps([akadId]);
console.log("Created:", new Date(Number(akadTimestamps[0]) * 1000));
console.log("Ujrah Claimed:", akadTimestamps[3] > 0n 
  ? new Date(Number(akadTimestamps[3]) * 1000) 
  : "Not claimed yet");
console.log("Completed:", akadTimestamps[4] > 0n 
  ? new Date(Number(akadTimestamps[4]) * 1000) 
  : "Still active");
console.log("Time Elapsed:", Number(akadTimestamps[5]), "seconds");
console.log("Time Remaining:", Number(akadTimestamps[6]), "seconds");
console.log("Is Expired:", akadTimestamps[7]);
  `);
  console.log("=".repeat(70) + "\n");
}

// Execute deployment
main()
  .then(() => {
    console.log("✅ Deployment script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });