import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsp from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import next from "@next/eslint-plugin-next";

export default [
  js.configs.recommended, // JavaScript rules
  tseslint.configs.recommended, // TypeScript rules
  next.configs.recommended, // Next.js rules
  {
    languageOptions: {
      parser: tsp,
    },
  },
  {
    plugins: {
      "@typescript-eslint": tseslint,
      prettier,
      jsdoc,
      next
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "prettier/prettier": "error",
      "require-jsdoc": "off",
      "valid-jsdoc": "off",
      "@next/next/no-assign-module-variable": "off"
    }
  },
  {
    ignores: ["node_modules", ".next", "dist", "public"], // Ignore these folders
  },
];
