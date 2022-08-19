import {visualizer} from 'rollup-plugin-visualizer';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [visualizer({
    filename: 'target/stats.html'
  })],
};