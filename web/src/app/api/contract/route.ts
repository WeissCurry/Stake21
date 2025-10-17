import { NextResponse } from "next/server";
import { getContract } from "@/lib/contract";

export async function GET() {
  try {
    const contract = getContract();
    const config = await contract.getConfig();
    const termsHash = await contract.getCurrentTerms();
    return NextResponse.json({ config, termsHash });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}