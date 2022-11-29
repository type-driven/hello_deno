# Hello Deno!

An opinionated deno project starter template.

This template provides examples and a batteries included experience for
starting a new project in Deno land.

>```shell
>$ just all
>```

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

- [Deno](https://deno.land/manual/getting_started/installation)
- [VSCode Deno Extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno) 
- [Just](https://github.com/casey/just)

## Install guide
### Deno VSCode Extension
```sh
code --install-extension denoland.vscode-deno
```
Manual 
> https://deno.land/manual/vscode_deno

### Deno
Refer to [deno manual installation](https://deno.land/manual@v1.28.2/getting_started/installation)
### Just
Refer to [just packages installation](https://github.com/casey/just#packages)

Note: Windows users, please use `git-bash` to interact with `just`
## Structure
- `.vscode` [VSCode configurations](.vscode/)
	- `extensions.json` [VSCode extensions](.vscode/extensions.json)
	- `settings.json` [VSCode settings](.vscode/settings.json)
- `bin/` [`deno compile` output](bin/hello_deno)
	- `build_npm_package.ts` [transforming for `npm` with `dnt`](./build_npm_package.ts)
	- `deno.jsonc` [using `deno.jsonc` config file](./deno.jsonc)
	- `import_map.json` [using `import_map.json`](./import_map.json)
	- `lock.json` [lockfile](./lock.json)
	- `vendor` [Vendored dependencies](vendor)
- `hello_bench.ts` [`deno bench` example](hello_bench.ts)
- `hello_test.ts` [`deno test` example](hello_test.ts)
- `justfile` [Justfile for running tasks](justfile)
- `LICENCE` [default MIT licence](LICENCE)
- `main.ts` [compilation entry-point `main.ts`](main.ts)
- `mod.ts` [library entry point `mod.ts`](mod.ts)

## Justfile

### Dependencies and Tasks

> Tasks can be considered the equivalent of `npm` scripts. Deno counterpart exposes
 `deno task` command, and it's not ideal to write your tasks in `deno.json` config.
Therefore the author's best current advice is just using a `makefile`.
> The sections are organized into Chores and Tasks.

### Configuration

#### `dev_flags`

```make
dev_flags = --unstable -A -c ./deno.jsonc
```

Default run flags: 
- Enabling Deno Unstable APIs 
- allowing All Permissions.
- Setting Deno Conifg path

#### `prod_flags`
```make
prod_flags = --check --cached-only --no-remote --import-map=vendor/import_map.json --lock ./lock.json
```

Production flags:
- always type-check (tsc)
- use only cached deps
- no remote dependencies allowed
- point to vendored import-map always
- validate dependencies against lock file

> Locking settings, defining the lock file.

#### `dep_flags`

```make
dep_flags = --import-map ./import_map.json --lock ./lock.json
```

Dependency flags:
- use import map to resolve dependencies
- use/write lock file to `./lock.json`

#### `test_files`

> Path to test files (e.g. `./*_test.ts`)

#### `source_files`

> Path to source files, default is any file in the root, (e.g. `./*.ts`)

#### `all_files`

```make
all_files = "./*.ts ./node/*.ts"
```

> Source + Test files.

#### `udd`

```make
udd = deno run -A https://deno.land/x/udd@0.7.3/main.ts
```

> Alias for UDD library. Used for automatically updating dependencies.

### Most important commands

- `just chores`: Update dependencies, write lock file, reload cache, vendor
  dependencies and load them into cache.
- `just build`: Build `bin`, `lib` and `npm` package.
- `just`: chores && build

### Dependencies

Modules are typically registered in the import-map.

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

### Benchmarks end in `_bench.ts`

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
