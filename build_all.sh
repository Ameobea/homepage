#!/bin/bash
# Check if our dependency license list needs to be refreshed
package_hash=$(md5sum ./package.json)
#if [[ $package_hash != $(cat ./package_hash) ]]; then
#	echo $package_hash >./package_hash
#	echo "Generating new liceneses listing..."
#	yarn gen-licenses
#fi

rm -rf .cache public
cd triangles &&
	./release.sh &&
	wasm-bindgen ./target/wasm32-unknown-unknown/release/*.wasm --browser --remove-producers-section --out-dir ./build
cd -
cp ./triangles/build/* ./src
./opt.sh
yarn build
