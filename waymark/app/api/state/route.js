import { NextResponse } from "next/server";
import { loadState, saveState, usingDatabase } from "../../../lib/store";
import { applyOp } from "../../../lib/ops";

export const dynamic = "force-dynamic";

function guard(req) {
  const expected = process.env.APP_PASSCODE;
  if (!expected) {
    return NextResponse.json({ error: "APP_PASSCODE is not set on the server." }, { status: 500 });
  }
  if (req.headers.get("x-passcode") !== expected) {
    return NextResponse.json({ error: "Wrong passcode." }, { status: 401 });
  }
  return null;
}

export async function GET(req) {
  const denied = guard(req);
  if (denied) return denied;
  return NextResponse.json({ state: await loadState(), persistent: usingDatabase });
}

export async function POST(req) {
  const denied = guard(req);
  if (denied) return denied;
  const op = await req.json();
  const next = applyOp(await loadState(), op);
  await saveState(next);
  return NextResponse.json({ state: next });
}
