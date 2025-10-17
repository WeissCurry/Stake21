import { ethers } from "ethers";
import { STAKE_CONTRACT, STAKE_ABI } from "@/constants";

const RPC_URL = "https://sepolia.base.org";

export function getContract() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(STAKE_CONTRACT, STAKE_ABI, provider);
}