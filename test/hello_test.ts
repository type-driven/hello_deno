import { assertStrictEquals } from "https://deno.land/std@0.162.0/testing/asserts.ts";
import { hello_deno } from "../src/mod.ts";

Deno.test("Be nice, say hello!", () => {
  assertStrictEquals(hello_deno(), "HELLO DENO!", "Didn't say hello :(");
});
