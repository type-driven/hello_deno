import { assertStrictEquals } from "https://deno.land/std/testing/asserts.ts";
import { hello_deno } from "./mod.ts";

Deno.test("Be nice, say hello!", () => {
  assertStrictEquals(hello_deno(), "HELLO DENO!", "Didn't say hello :(");
});
