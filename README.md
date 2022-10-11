# Hello Deno!

An opinionated deno project starter template.

This template provides examples and a batteries included experience for
starting a new project in Deno land.

## Features
- Sane VSCode defaults for deno
- Benchmarking example
- Compiled executable example
- Testing example
- Vendoring capabilities
- NPM Compatibility
- Deno confiugration
- Import Map usage example 
- Standard MIT Licence
- Executable entry point (main.ts)
- Library entry points (mod.ts)


## Requirements

- [Deno](https://deno.land/manual/getting_started/installation) `brew install deno`
- [VSCode Deno Extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno) `code --install-extension denoland.vscode-deno`
- [Just](https://github.com/casey/just) `brew install just`

> https://deno.land/manual/vscode_deno

## Structure

- `.vscode` [VSCode configuration for deno](.vscode/settings.json)
- `bench` [`deno bench` example](bench/hello_bench.ts)
- `bin` [`deno compile` output](bin/hello_deno)
- `test` [`deno test` example](test/hello_test.ts)
- `vendor` [Vendored dependencies](vendor)
- `build_npm_package.ts` [transforming for `npm` with `dnt`](build_npm_package.ts)
- `deno.jsonc` [using `deno.jsonc` config file](deno.jsonc)
- `import_map.json` [using `import_map.json`](import_map.json)
- `LICENCE` [default MIT licence](LICENCE)
- `main.ts` [compilation entry-point `main.ts`](main.ts)
- `mod.ts` [library entry point `mod.ts`](mod.ts)

## Justfile

### Dependencies and Tasks

> Tasks can be considered the equivalent of `npm` scripts While deno exposes
> `deno task` command it's not ideal to write your tasks in the `deno.json`
> config, therefore the author's best current advice is just using a `makefile`.
> The sections are organized into Chores and Tasks.

### Configuration

#### `dev_flags`

```make
dev_flags = --unstable -A
```

> Default run flags. Enabling Deno Unstable APIs and allowing All Permissions.

#### `prod_flags`
```make
prod_flags =
```

> Empty by default, add only NEEDED permissions here!

#### `lock_flags`

```make
lock_flags = --lock lock.json
```

> Locking settings, defining the lock file.

#### `dep_flags`

```make
dep_flags = --import-map ./import_map.json $(lock_flags)
```

> Dependency settings, to resolve packages from import-ma and pin dependencies
> with lock file.

#### `docs`

> Path of documentation artifacts, (e.g. `examples/*.ts benchmark*.md **/*.md`)

#### `test_files`

> Path to test files (e.g. `./test/*_test.ts`)

#### `source_files`

> Path to source files, default is any file in the root, (e.g. `./*.ts`)

#### `all_files`

```make
all_files = $(source_files) $(test_files)
```

> Source + Test files.

#### `udd`

```make
udd = deno run -A https://deno.land/x/udd@0.7.3/main.ts
```

> Alias for UDD library. Used for automatically updating dependencies.

### Most important commands

- `make chores`: Update dependencies, write lock file, reload cache, vendor
  dependencies and load them into cache.
- `make build`: Build `bin` and `npm` package.

### Dependencies

Modules are

#### Check for updates

```make
update:
	$(udd) main.ts $(dep_flags) --test="make test"
	make deps
```

> Look over import_map and dependency tree stemming from `main.ts` entry-point
> and update them to latest versions.

#### Run dependency related task chain

```make
deps: lock reload vendor cache
```

> Reload dependency tree without updating it.

#### Lock when you add new dependencies

```make
lock:
	deno cache $(dep_flags) --lock-write $(source_files)
```

> Produce a lock file of the dependency tree.

#### Reload cache

```make
reload:
	deno cache -r $(dep_flags) $(source_files)
```

> Reload local cache.

#### Vendor the dependencies

Import map overridden as config sets the vendored import-map. Obviously the
vendoring can't depend on the import map it outputs.

```make
vendor: 
	deno vendor $(dep_flags)  --force $(source_files)
```

> Vendor dependencies for production builds.

# Cache the locked dependencies

```make
cache:
	deno cache $(lock_flags) $(source_files)
```

> Populate local cache from vendored dependencies for all source files.

### Tasks

### Run the benchmark(s)

### Benchamrks end in `_bench.ts`

```make
bench: clean
	deno bench $(run_flags)
```

> Run benchmarks.

### Build the bin

```make
build-bin: cache
	deno compile -o bin/hello_deno --import-map vendor/import_map.json $(run_flags) ./main.ts
```

> Compile into a single executable.

### Build for NPM

```make
build-npm:
	deno run -A ./build_npm_package.ts $$VERSION
```

> Build a package to be published on npm.

```make
clean:
	rm -rf bin npm
```

> Clean previously built artifacts.

### Publish the npm module from CI

```make
publish: deno build-npm
	cd npm && npm publish
```

> Release to NPM.

### Profiling

```make
debug:
	deno run --v8-flags=--prof --inspect-brk $(run_flags) bench/run_suite.ts
```

> Debug

### Linting

```make
lint:
	deno lint $(all_files)
```

> Run linter.

### Formatting

```make
format:
	deno fmt $(all_files) $(docs)
```

> Run formatting.

### Testing

```make
test: clean
	deno test $(run_flags) --coverage=cov_profile $(test_files)
	deno test $(run_flags) --doc mod.ts
```

> Run tests.
