cd triangles \
  && ./build.sh \
  && wasm-bindgen ./target/wasm32-unknown-unknown/debug/*.wasm --out-dir ./build
cd -
cp ./triangles/build/* ./src/
gatsby develop
