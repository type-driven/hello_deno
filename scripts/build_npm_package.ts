import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";
import _deno_json from "../deno.json" assert { type: "json" };

const { name, version } = _deno_json.metadata;

await emptyDir("./npm");
await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  importMap: "./deno.json",
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
