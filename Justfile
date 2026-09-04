set dotenv-load := true

cdn := "https://cprimozic.b-cdn.net"
deploy_target := "debian@ameo.dev:/var/www/cprimozic.net/"

# Build the wasm triangle background and stage it under static/triangles/<hash>/ so the files are
# immutable-cacheable like everything else the CDN serves
triangles:
  #!/usr/bin/env bash
  set -euo pipefail
  cargo build --manifest-path triangles/Cargo.toml --target wasm32-unknown-unknown --release
  wasm-bindgen triangles/target/wasm32-unknown-unknown/release/engine.wasm --target web --remove-producers-section --out-dir triangles/build
  wasm-opt triangles/build/engine_bg.wasm -O4 -c -o triangles/build/engine_bg.wasm
  hash=$(cat triangles/build/engine_bg.wasm triangles/build/engine.js triangles/js/*.js | shasum | cut -c1-10)
  rm -rf static/triangles
  mkdir -p static/triangles/$hash src/lib/generated
  cp triangles/build/engine.js triangles/build/engine_bg.wasm triangles/js/*.js static/triangles/$hash/
  echo "{ \"dir\": \"/triangles/$hash\" }" > src/lib/generated/triangles.json

# Rebuild the Hugo notes site; `bun run build` copies its output into static/notes
notes:
  hugo --source notes --quiet

# Local/trial build with root-relative asset URLs
build: triangles notes
  bun run build

# Production build with assets served through the CDN pull zone
build-prod: triangles notes
  ASSET_PREFIX={{cdn}} bun run build

run: triangles
  bun run dev

preview:
  bun run preview

# Uploads land in temp files and are swapped into place together at the end, then orphans are
# removed, so a page served mid-deploy never references assets that aren't there yet
deploy: build-prod
  rsync -rv --delay-updates --delete-after ./build/ {{deploy_target}}
