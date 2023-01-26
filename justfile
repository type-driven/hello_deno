#
# Variables                                                                 
#

# Dev flags, unstable apis enabled and every permission allowed.
dev_flags := "--unstable --allow-all"

# Should write strict --allow-xxx flags here for your prod build
prod_flags := "--config ./deno.jsonc --lock ./lock.json --no-remote --import-map=./vendor/import_map.json"

# Set config path, use locked dependencies, override import map (config used vendored import-map)
dep_flags := "--config ./deno.jsonc --lock ./lock.json"

# Examples docs and such
doc_files := "examples/*.ts **/*.md"

# Source files
source_files := "./*.ts"

# Test Files
test_files := "./*_test.ts"

# All files
all_files := "./*.ts ./scripts/*.ts"

# Default action shows help (remove to make `just` run all by default)
default: 
	just --list

#
# Tasks
#

# Run all tasks (chores && build)
all: chores && build

# Run the benchmark(s)
bench:
	deno bench {{dev_flags}} {{dep_flags}}

# build binary, bundle, node module
build: _build-bin _build-lib _build-npm

# Run CI/CD Related tasks only
ci: _check test bench build

cd: build && _publish-npm

# update deps (+ lock, cahce, vendor), lint and format all files, run tests and benchmarks
chores: update _lint _format test bench

# Essentially npm install --lock
deps: _reload _lock _vendor _cache

# Profiling
debug:
	deno run --v8-flags=--prof --inspect-brk {{dev_flags}} main.ts

# Run a script locally in dev mode
run $ENTRYPOINT="main.ts" $ARGS="":
	deno run --allow-all {{prod_flags}} {{ENTRYPOINT}} {{ARGS}}

# run tests with coverage and doc-tests
test: _clean
	deno test {{dev_flags}} {{dep_flags}} --doc --coverage=cov_profile {{test_files}}

# Check for updates
update: && deps
	just _udd "{{all_files}} import_map.json"

#
# Helper tasks
#

# Build the bin
_build-bin: _cache
	deno compile {{prod_flags}} -o bin/hello_deno ./main.ts

# Build the lib
_build-lib: _cache
	mkdir -p lib
	deno bundle --no-check {{prod_flags}} mod.ts lib/index.js

# Build the npm module VERSION needs to be set e.g. export VERSION=v1.0.0
_build-npm: _cache
	just run ./scripts/download_dnt_wasm.ts
	just run ./scripts/build_npm_package.ts {{env_var_or_default('VERSION', 'v1.0.0')}}

# locally cache (locked) dependencies
_cache:
	deno cache {{prod_flags}} {{all_files}}

# Run checks
_check:
	deno check {{dep_flags}} {{all_files}}
	deno fmt --check {{all_files}} {{doc_files}}

# Clean before build
_clean:
	rm -rf bin cov_profile lib npm

# `deno fmt` docs and files
_format:
	deno fmt {{all_files}} {{doc_files}}

# `deno lint` all files
_lint:
	deno lint {{all_files}}

# Lock when you add new dependencies
_lock:
	deno cache {{dep_flags}} --lock-write {{all_files}}

# Publish the npm module from CI
_publish-npm:
	cd npm && npm publish

# Reload cache
_reload:
	deno cache -r {{dep_flags}} {{all_files}}

# Update dependencies to latest versions.
_udd paths:
	deno run {{dev_flags}} https://deno.land/x/udd@0.7.3/main.ts {{paths}}

# Vendor the dependencies
_vendor:
	rm -rf ./vendor 
	deno vendor {{dep_flags}} --force {{all_files}} --output ./vendor