import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { partytownVite } from '@builder.io/partytown/utils';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [
    partytownVite({
      config: {
        forward: ['dataLayer.push'],
      },
      dest: path.join(__dirname, 'dist', '~partytown'),
    }),
    visualizer({
      filename: 'target/stats.html',
    }),
  ],
};
