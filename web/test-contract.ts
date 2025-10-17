import { ethers } from "ethers";
import raw from "./src/constants/ABI/AmanahStakesCore.json";

// ✅ pastikan ambil ABI dari `default` kalau ada
const STAKE_ABI: any = (raw as any).default || raw;
const STAKE_CONTRACT = "0x4b74C33B85Df20018E996CD59299685499d96A13";

const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const contract = new ethers.Contract(STAKE_CONTRACT, STAKE_ABI, provider);

async function test() {
  try {
    const config = await contract.getConfig();
    console.log("✅ Contract connected! Config:");
    console.log(config);
  } catch (err) {
    console.error("❌ Error reading:", err);
  }
}

test();
