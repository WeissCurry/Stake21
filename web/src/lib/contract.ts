import { ethers } from "ethers";
import { STAKE_CONTRACT, STAKE_ABI } from "@/constants";

const RPC_URL = "https://testnet.evm.nodes.onflow.org";

export function getContract() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(STAKE_CONTRACT, STAKE_ABI, provider);
}