import { hello_deno } from "./mod.ts";

Deno.bench("Hello Bench! You fast?", () => {
  hello_deno();
});
