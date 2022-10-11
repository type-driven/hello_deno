import { assertStrictEquals } from "./deps.ts";
import { hello_deno } from "../src/mod.ts";

Deno.test("Be nice, say hello!", () => {
  assertStrictEquals(hello_deno(), "HELLO DENO!", "Didn't say hello :(");
});
