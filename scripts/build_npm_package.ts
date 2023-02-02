import { build, emptyDir } from "https://deno.land/x/dnt@0.33.1/mod.ts";
import { JSONC } from "https://deno.land/x/jsonc_parser@v0.0.1/mod.ts";

const { metadata } = JSONC.parse(Deno.readTextFileSync("./deno.jsonc"));
console.log(metadata);

const { name, version } = metadata;

await emptyDir("./npm");
await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  importMap: "./vendor/import_map.json",
  typeCheck: false,
  skipSourceOutput: true,
  test: true,
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name,
    version,
    description: "Hello NPM, yours truly, Deno.",
    license: "MIT",
    repository: {
      type: "git",
      url: "https://github.com/type-driven/hello_deno",
    },
  },
  scriptModule: "cjs",
});

// post build steps
Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");
Deno.writeTextFileSync(
  "npm/.npmrc",
  "//registry.npmjs.org/:_authToken=${NPM_TOKEN}",
);
