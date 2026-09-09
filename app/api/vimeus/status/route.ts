import { NextResponse } from "next/server";
import { isVimeusApiConfigured, isVimeusEmbedConfigured } from "@/lib/vimeus/config";

export async function GET() {
  return NextResponse.json({
    apiConfigured: isVimeusApiConfigured(),
    embedConfigured: isVimeusEmbedConfigured(),
  });
}
