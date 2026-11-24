import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "node_modules/**", "tests/**", "next-env.d.ts"]),
  {
    rules: {
      // The studio at "/" builds itself imperatively on load, so moving to and from it is a full
      // page load on purpose (a client side hop would leave the previous page's state behind).
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-location-assign-relative-destination": "off",
      // Admin pages load their data in an effect and keep loose shapes for API replies. Worth
      // tightening over time, not worth blocking a release on.
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // lib/studio.ts is one long script written in plain ES5 style, and is excluded from type
    // checking (@ts-nocheck). These rules are about style, not behaviour: converting 300 `var`s in a
    // script that leans on hoisting is a way to introduce bugs, not remove them.
    files: ["lib/studio.ts"],
    rules: {
      "no-var": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);
