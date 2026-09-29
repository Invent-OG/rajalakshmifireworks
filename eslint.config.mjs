import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    ".astro/**",
    "dist/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
