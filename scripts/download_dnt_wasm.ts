// need to fetch the WASM that `deno vendor` ignores
const dntWasm = await fetch(
  "https://github.com/denoland/dnt/blob/main/lib/pkg/dnt_wasm_bg.wasm?raw=true",
);
if (dntWasm.body) {
  const wasm = await Deno.open(
    "./vendor/deno.land/x/dnt@0.33.0/lib/pkg/dnt_wasm_bg.wasm",
    {
      write: true,
      create: true,
    },
  );
  await dntWasm.body.pipeTo(wasm.writable);
}