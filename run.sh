cd triangles &&
  ./build.sh &&
  wasm-bindgen ./target/wasm32-unknown-unknown/debug/*.wasm --browser --remove-producers-section --out-dir ./build
cd -
cp ./triangles/build/* ./src/
# GATSBY_LOGGER=yurnalist avoids the ink/yoga-layout-prebuilt native crash on Node 22+
GATSBY_LOGGER=yurnalist gatsby develop
