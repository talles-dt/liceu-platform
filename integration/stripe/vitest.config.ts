import path from 'node:path';
import {defineConfig} from 'vitest/config';
export default defineConfig({resolve:{alias:{'@/':path.resolve('.')+'/'}},test:{include:['integration/stripe/*.test.ts'],testTimeout:600000,hookTimeout:600000}});
