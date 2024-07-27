import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const plugins = [
  nodeResolve({
    mainFields: ['browser', 'jsnext', 'module', 'main'],
  }),
  commonjs({
    browser: true,
  }),
];

export default [{
  input: 'page/src/pkg/iframe-ipc.js',
  output: {
    file: 'page/dist/pkg/iframe-ipc.js',
    format: 'iife',
  },
  plugins,
}, {
  input: 'page/src/pkg/iframe-ipcs.js',
  output: {
    file: 'page/dist/pkg/iframe-ipcs.js',
    format: 'iife',
  },
  plugins,
}, {
  input: 'page/src/example.js',
  output: {
    file: 'page/dist/example.js',
    format: 'iife',
  },
  plugins,
}];
