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
  // 1. Deploy SyariahRegistry
  // ============================================================
  
  console.log("📜 Deploying SyariahRegistry...");
  const syariahRegistry = await hre.viem.deployContract("SyariahRegistry");
  const syariahRegistryAddress = syariahRegistry.address;
  console.log("✅ SyariahRegistry deployed to:", syariahRegistryAddress);

  // ============================================================
  // 2. Deploy AmanahStakesCore
  // ============================================================
  
  // Generate initial terms hash (example: keccak256 of terms document IPFS hash)
  const initialTermsIPFS = "QmExampleIPFSHashForIjarahTermsV1"; // Replace with actual IPFS hash
  const initialTermsHash = keccak256(toBytes(initialTermsIPFS));
  
  console.log("\n📜 Deploying AmanahStakesCore...");
  console.log("📄 Initial Terms Hash:", initialTermsHash);
  
  const amanahStakesCore = await hre.viem.deployContract("AmanahStakesCore", [initialTermsHash]);
  const amanahStakesCoreAddress = amanahStakesCore.address;
  console.log("✅ AmanahStakesCore deployed to:", amanahStakesCoreAddress);

  // ============================================================
  // 3. Initialize Contracts (Optional)
  // ============================================================
  
  console.log("\n⚙️  Initializing contracts...");
  
  // Wait for a few blocks before making transactions to avoid nonce conflicts
  console.log("⏳ Waiting for network confirmation...");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Get gas price for Base Sepolia
  const gasPrice = await publicClient.getGasPrice();
  const increasedGasPrice = (gasPrice * 120n) / 100n; // Increase by 20%
  
  // Define certificate URI outside try-catch so it's accessible later
  const certURI = "ipfs://QmExampleCertificateHash"; // Replace with actual certificate IPFS
  
  try {
    // Activate SyariahRegistry platform
    console.log("📋 Activating SyariahRegistry with certificate:", certURI);
    const activateHash = await syariahRegistry.write.activatePlatform([certURI], {
      gasPrice: increasedGasPrice
    });
    await publicClient.waitForTransactionReceipt({ hash: activateHash });
    console.log("✅ SyariahRegistry platform activated");
    
    // Wait between transactions
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Activate AmanahStakesCore platform
    console.log("📋 Activating AmanahStakesCore...");
    const activateCoreHash = await amanahStakesCore.write.activatePlatform({
      gasPrice: increasedGasPrice
    });
    await publicClient.waitForTransactionReceipt({ hash: activateCoreHash });
    console.log("✅ AmanahStakesCore platform activated");
    
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
        console.log(`💵 Depositing ${formatEther(depositAmount)} ETH to AmanahStakesCore treasury...`);
        const depositHash = await amanahStakesCore.write.depositTreasury({ 
          value: depositAmount,
          gasPrice: increasedGasPrice
        });
        await publicClient.waitForTransactionReceipt({ hash: depositHash });
        console.log("✅ Treasury deposited");
      } else {
        console.log("⚠️  Skipping treasury deposit - insufficient balance");
      }
    } else {
      console.log("⚠️  Skipping treasury deposit - balance too low (keep for gas)");
    }
  } catch (error: any) {
    console.error("\n⚠️  Initialization error:", error.message);
    console.log("💡 Tip: You can manually activate the contracts later using the contract addresses below.");
  }

  // ============================================================
  // 4. Display Summary
  // ============================================================
  
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📊 Contract Addresses:");
  console.log("├─ SyariahRegistry:    ", syariahRegistryAddress);
  console.log("└─ AmanahStakesCore:   ", amanahStakesCoreAddress);
  
  try {
    console.log("\n📋 Configuration:");
    const config = await amanahStakesCore.read.getConfig();
    console.log("├─ Min Stake:          ", formatEther(config[0]), "ETH");
    console.log("├─ Max Stake:          ", formatEther(config[1]), "ETH");
    console.log("├─ Ujrah Rate:         ", Number(config[2]) / 100, "%");
    console.log("├─ Min Lock Days:      ", config[3].toString(), "days");
    console.log("├─ Max Lock Days:      ", config[4].toString(), "days");
    console.log("└─ Early Penalty:      ", Number(config[5]) / 100, "%");
    
    console.log("\n💰 Treasury Balance:");
    const treasuryBalance = await publicClient.getBalance({ address: amanahStakesCoreAddress });
    console.log("└─ AmanahStakesCore:   ", formatEther(treasuryBalance), "ETH");
  } catch (error) {
    console.log("\n⚠️  Could not fetch contract details (contracts may need manual activation)");
  }
  
  console.log("\n📝 Terms Hash:");
  console.log("└─", initialTermsHash);
  
  console.log("\n" + "=".repeat(60));
  console.log("📌 Save these addresses for frontend integration!");
  console.log("=".repeat(60) + "\n");

  // ============================================================
  // 5. Verification Info (for Etherscan/Basescan)
  // ============================================================
  
  console.log("🔍 To verify contracts on Basescan, run:\n");
  console.log(`npx hardhat verify --network baseSepolia ${syariahRegistryAddress}`);
  console.log(`npx hardhat verify --network baseSepolia ${amanahStakesCoreAddress} "${initialTermsHash}"`);
  console.log();

  // ============================================================
  // 6. Export addresses to JSON
  // ============================================================
  
  const networkInfo = await publicClient.getChainId();
  const deploymentData = {
    network: hre.network.name,
    chainId: networkInfo.toString(),
    deployer: deployer.account.address,
    timestamp: new Date().toISOString(),
    contracts: {
      SyariahRegistry: {
        address: syariahRegistryAddress,
        certificateURI: certURI || "ipfs://QmExampleCertificateHash"
      },
      AmanahStakesCore: {
        address: amanahStakesCoreAddress,
        termsHash: initialTermsHash,
        termsIPFS: initialTermsIPFS
      }
    }
  };
  
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const filename = `${deploymentsDir}/deployment-${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2));
  console.log(`💾 Deployment data saved to: ${filename}\n`);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });