set dotenv-load := true

build-all:
  #!/bin/bash

  rm -rf .cache public
  cd triangles && \
    ./release.sh && \
    wasm-bindgen ./target/wasm32-unknown-unknown/release/*.wasm --target web --remove-producers-section --out-dir ./build
  cd ..
  cp ./triangles/build/* ./src
  just opt
  yarn build

  just build-notes
  rm -rf public/notes
  cp -r notes/public public/notes

build-notes:
  cd notes && just build && cd ..

opt:
  wasm-opt ./src/*.wasm -O4 -c -o ./src/*.wasm

run:
  cd triangles && \
    ./build.sh && \
    wasm-bindgen ./target/wasm32-unknown-unknown/debug/*.wasm --target web --remove-producers-section --out-dir ./build
  cd ..
  cp ./triangles/build/* ./src/
  gatsby develop --port 8009

deploy:
  rsync -Prv -e "ssh -o StrictHostKeyChecking=no -o IdentitiesOnly=yes -F /dev/null" ./public/* debian@cprimozic.ameo.dev:/var/www/cprimozic.net/
