import { hello_deno } from "./mod.ts";

export function main() {
  console.log(hello_deno());
}

if (import.meta.main) {
  main();
}
