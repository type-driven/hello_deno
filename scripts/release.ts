#!/usr/bin/env -S deno run --allow-env --allow-read --allow-run
import {
  env,
  fallback,
  flag,
  pipeline,
  schema,
} from "https://deno.land/x/konfig@v0.1.2/mod.ts";
import { boolean } from "https://deno.land/x/fun/decoder.ts";
import { pipe } from "https://deno.land/x/fun@v2.0.0-alpha.10/fn.ts";
import { match } from "https://deno.land/x/fun@v.2.0.0-alpha.11/either.ts";
import { identity } from "https://deno.land/x/fun@v.2.0.0-alpha.11/fn.ts";
import {
  DecodeError,
  draw,
} from "https://deno.land/x/fun@v.2.0.0-alpha.11/decoder.ts";

const _throw = (cause: DecodeError) => {
  const err = draw(cause);
  throw new Error("Failed to load config" + "\n" + err, { cause });
};
const config = pipe(
  schema({
    dry_run: pipeline(
      env("DRY_RUN", boolean),
      flag("dry-run"),
      flag("D"),
      fallback(false),
    ),
    verbose: pipeline(
      env("VERBOSE", boolean),
      flag("verbose"),
      flag("V"),
      fallback(false),
    ),
  }),
  (config) => config.read(),
  match(_throw, identity),
);
console.log("Config", config);

const _run = async (cmd: string[]) => {
  console.log(`Running: ${cmd.join(" ")}`);
  if (!config.dry_run) {
    const p = Deno.run({
      cmd,
      stderr: "piped",
      stdout: "piped",
    });
    if (config.verbose) {
      const [status, stdout, stderr] = await Promise.all([
        p.status(),
        p.output(),
        p.stderrOutput(),
      ]);
      console.log("Status", status);
      console.log("Stdout", stdout);
      console.log("Stderr", stderr);
    }
    p.close();
  }
};

const { metadata } = JSON.parse(Deno.readTextFileSync("./deno.json"));
console.log("Metadata", metadata);

// set tag from version in metadata
let cmd = [
  "git",
  "tag",
  "-a",
  `v${metadata.version}`,
  "-m",
  `"release: v${metadata.version}"`,
];
await _run(cmd);

// push tag
cmd = ["git", "push", "origin", "--tags"];
await _run(cmd);
