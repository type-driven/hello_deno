// need to fetch the WASM that `deno vendor` ignores
const dntDir = Array
  .from(Deno.readDirSync("./vendor/deno.land/x"))
  .find((f) => f.name.startsWith("dnt@"))?.name;

if (!dntDir) {
  throw new Error("Could not find dnt in vendor directory.");
}

const out = `./vendor/deno.land/x/${dntDir}/lib/pkg/dnt_wasm_bg.wasm`;
let shouldDownload = true;

try {
  await Deno.stat(out);
  shouldDownload = false;
} catch (e) {
  if (!(e instanceof Deno.errors.NotFound)) {
    throw e;
  }
}

if (shouldDownload) {
  const dntWasm = await fetch(
    "https://github.com/denoland/dnt/blob/main/lib/pkg/dnt_wasm_bg.wasm?raw=true",
  );
  if (dntWasm.body) {
    const wasm = await Deno.open(
      out,
      {
        write: true,
        create: true,
      },
    );
    await dntWasm.body.pipeTo(wasm.writable);
  }
}

console.log("Downloaded dnt WASM.", out);
