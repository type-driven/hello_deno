import { hello_deno } from "./mod.ts";

export function main() {
  hello_deno();
}

if (import.meta.main) {
  main();
}
