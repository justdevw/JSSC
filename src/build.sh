npm install
mkdir dist
mkdir dist/windows
cp -r bin/windows/ui dist/windows/ui
cp bin/windows/default.justc dist/windows/default.justc
cp bin/windows/jssc.vbs dist/windows/jssc.vbs
cp bin/windows/icon.ico dist/windows/icon.ico

node src/emoji.js
rm -f src/emoji.js

npx rollup -c

reserved="reserved=['compress','decompress','JSSC','jssc','compressLarge','compressToBase64','compressLargeToBase64','decompressFromBase64','cache','version','JSSC1']"
npx terser dist/jssc.js -c -m "$reserved" --format "ascii_only=true" -o dist/jssc.min.js
npx terser dist/worker.js -c -m "$reserved" --module --format "ascii_only=true" -o dist/worker.min.js

cp src/index.d.ts dist/jssc.d.ts

bash src/prefix.sh
