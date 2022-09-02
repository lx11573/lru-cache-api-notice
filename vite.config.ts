/*
 * @Author: lyu
 * @Date: 2022-08-10 11:23:16
 */
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts'

export default defineConfig({
	plugins: [dts({
		include: ['src/index.ts']
	})],
	build: {
		lib: {
			entry: './src/index.ts',
			name: 'index',
			fileName: format => `index.${format}.js`
		}
	}
})