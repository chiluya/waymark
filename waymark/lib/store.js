import { Redis } from "@upstash/redis";
import { initialState } from "./plan";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;
const KEY = "waymark:state";

export const usingDatabase = !!redis;

// Local-dev fallback (memory only; resets on restart). Production uses Redis.
const mem = globalThis.__waymarkMem || (globalThis.__waymarkMem = { state: null });

export async function loadState() {
  if (redis) return (await redis.get(KEY)) || initialState();
  return mem.state || initialState();
}

export async function saveState(state) {
  if (redis) await redis.set(KEY, state);
  else mem.state = state;
}
