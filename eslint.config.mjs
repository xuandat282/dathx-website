// @ts-check
import astro from "eslint-plugin-astro";
import tsParser from "@typescript-eslint/parser";

export default [
  ...astro.configs["flat/recommended"],
  {
    // Parse frontmatter TS (`interface Props`, typed props) correctly.
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: { parser: tsParser },
    },
  },
  {
    ignores: ["dist/", ".astro/", ".wrangler/", "node_modules/"],
  },
];
