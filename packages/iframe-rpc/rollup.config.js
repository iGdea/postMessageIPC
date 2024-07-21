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
  input: 'example/example.js',
  output: {
    file: 'example/dist/example.full.js',
    format: 'iife',
  },
  plugins,
}];
