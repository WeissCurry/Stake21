import { NextResponse } from "next/server";
import { getContract } from "@/lib/contract";
import { ethers } from "ethers";

export async function GET() {
  try {
    const contract = getContract();
    const config = await contract.getConfig();

    // Destructure array result
    const [minStake, maxStake, ujrahRate, minLock, maxLock, penalty, active] = config;

    // Format to readable numbers
    return NextResponse.json({
      status: "success",
      data: {
        minStake: Number(ethers.formatEther(minStake)),  // 0.01 ETH
        maxStake: Number(ethers.formatEther(maxStake)),  // 32 ETH
        ujrahRate: Number(ujrahRate) / 100,              // 4%
        minLockDays: Number(minLock),
        maxLockDays: Number(maxLock),
        penalty: Number(penalty) / 100,                  // 10%
        isActive: active,
      },
    });
  } catch (err: any) {
    console.error("❌ Error:", err);
    return NextResponse.json({
      status: "error",
      message: err.message || "Failed to read contract",
    });
  }
}
