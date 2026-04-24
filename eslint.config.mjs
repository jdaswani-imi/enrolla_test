import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Prototype uses setState-in-effect for pagination resets — acceptable pattern here.
      "react-hooks/set-state-in-effect": "warn",
      // Math.random / Date.now in useMemo blanks — not worth restructuring in a prototype.
      "react-hooks/purity": "warn",
    },
  },
]);

export default eslintConfig;
