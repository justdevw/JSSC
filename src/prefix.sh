for file in dist/jssc.js dist/jssc.cjs dist/jssc.mjs dist/jssc.min.js dist/worker.js dist/worker.min.js dist/cli.js; do
    printf "/*\n\n%s\n\n*/\n\n/*! JSSC <https://jssc.js.org/> (c) 2025-2026 JustDeveloper <https://justdeveloper.is-a.dev/> */\n\n" "$(cat LICENSE; printf "\n\n\n"; cat src/prefix.txt)" | cat - "$file" > temp.js && mv temp.js "$file"
done

for file in dist/cli.js; do
    printf "#!/usr/bin/env node\n\n" | cat - "$file" > temp.js && mv temp.js "$file"
done
