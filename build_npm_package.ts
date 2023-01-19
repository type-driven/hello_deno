import { build, emptyDir } from "https://deno.land/x/dnt@0.33.0/mod.ts";

await emptyDir("./npm");
await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  importMap: "./import_map.json",
  typeCheck: false,
  skipSourceOutput: true,
  test: true,
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  mappings: {},
  package: {
    // package.json properties
    name: "hello-deno",
    version: Deno.args[0],
    description: "Hello NPM, yours truly, Deno.",
    license: "MIT",
    repository: {
      type: "git",
      url: "https://github.com/pixeleet/hello_deno",
    },
  },
  scriptModule: "cjs",
});

// post build steps
Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");
