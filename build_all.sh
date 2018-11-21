#!/bin/bash
# Check if our dependency license list needs to be refreshed
package_hash=`md5 ./package.json`
if [[ $package_hash != `cat ./package_hash` ]]; then
	echo $package_hash > ./package_hash
  echo "Generating new liceneses listing..."
  nlf -c > ./src/licenses.csv
fi

rm -rf .cache public
cd triangles &&
	./release.sh &&
	wasm-bindgen ./target/wasm32-unknown-unknown/release/*.wasm --out-dir ./build
cd -
cp ./triangles/build/* ./src
./opt.sh
gatsby build
