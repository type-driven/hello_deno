import { hello_deno } from "../src/mod.ts";

Deno.bench("Hello Bench! You fast?", () => {
  hello_deno();
});
