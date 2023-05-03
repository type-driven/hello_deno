import _deno_json from "../deno.json" assert { type: "json" };
import { compare } from "https://deno.land/x/semver/mod.ts";

const required = _deno_json.metadata.minDenoVersion;

function atLeast(version: string): boolean {
  const ord = compare(Deno.version.deno, version);
  if (ord === 1 || ord === 0) return true;
  return false;
}

if (atLeast(required)) {
  console.log(`Deno version is at least ${required}`);
} else {
  console.error(`Deno version must be at least ${required}`);
}
