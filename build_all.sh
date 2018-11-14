rm -rf .cache public
cd triangles \
  && ./release.sh \
  && wasm-bindgen ./target/wasm32-unknown-unknown/release/*.wasm --out-dir ./build
cd -
cp ./triangles/build/* ./src
./opt.sh
gatsby build

