import { NextResponse } from "next/server";
import { contractRead } from "@/lib/contract";

export async function GET() {
  try {
    const config = await contractRead.getConfig();
    const termsHash = await contractRead.getCurrentTerms();
    return NextResponse.json({ config, termsHash });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}