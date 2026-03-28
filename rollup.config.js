import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import { codecovRollupPlugin } from "@codecov/rollup-plugin";

import { name__ } from './lib/meta.js';

function bundleName(str) {
    return str
        .replaceAll(' ', '_')
        .replaceAll('(', '[')
        .replaceAll(')', ']');
}
const codecovConfig = (name) => ({
    enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
    bundleName: name__ + (
        name.length > 0 ? bundleName('_' + name) : ''
    ),
    uploadToken: process.env.CODECOV_TOKEN,
    telemetry: false
})

export default [
    {
        input: 'src/index.js',
        plugins: [
            resolve(),
            json(),
            commonjs(),
            codecovRollupPlugin(codecovConfig(''))
        ],
        output: [
            {
                file: 'dist/jssc.mjs',
                format: 'es'
            },
            {
                file: 'dist/jssc.cjs',
                format: 'cjs',
                exports: 'named'
            },
            {
                file: 'dist/jssc.js',
                format: 'umd',
                name: name__,
                globals: {
                    justc: "JUSTC"
                }
            }
        ],
        external: [
            'justc'
        ]
    },
    {
        input: 'src/worker.js',
        plugins: [
            resolve({ preferBuiltins: true }),
            json(),
            commonjs(),
            codecovRollupPlugin(codecovConfig('Worker'))
        ],
        output: {
            file: 'dist/worker.js',
            format: 'es',
            inlineDynamicImports: true
        },
        external: [
            'justc',
            'node:worker_threads'
        ]
    },
    {
        input: 'bin/index.js',
        plugins: [
            resolve({
                preferBuiltins: true,
                exportConditions: ['node']
            }),
            json(),
            commonjs(),
            codecovRollupPlugin(codecovConfig('CLI'))
        ],
        output: {
            file: 'dist/cli.js',
            format: 'es'
        },
        external: [
            'justc',
            'fs',
            'path',
            'url',
            'child_process',
            'os',
            'https',
            'node:readline'
        ]
    },
    {
        input: 'bin/windows/install.js',
        plugins: [
            resolve({
                preferBuiltins: true,
                exportConditions: ['node']
            }),
            json(),
            commonjs(),
            codecovRollupPlugin(codecovConfig('Windows Integration (Install)'))
        ],
        output: {
            file: 'dist/windows/install.js',
            format: 'es'
        },
        external: [
            'justc',
            'fs',
            'path',
            'url',
            'child_process',
            'os',
            'https',
            'node:readline'
        ]
    },
    {
        input: 'bin/windows/uninstall.js',
        plugins: [
            resolve({
                preferBuiltins: true,
                exportConditions: ['node']
            }),
            json(),
            commonjs(),
            codecovRollupPlugin(codecovConfig('Windows Integration (Uninstall)'))
        ],
        output: {
            file: 'dist/windows/uninstall.js',
            format: 'es'
        },
        external: [
            'justc',
            'fs',
            'path',
            'url',
            'child_process',
            'os',
            'https',
            'node:readline'
        ]
    }
]
