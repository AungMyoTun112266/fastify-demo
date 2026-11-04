import js from "@eslint/js";
import tseslint from "typescript-eslint";

const sharedJsRules = {
  "no-console": "off",
  "no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
    },
  ],
  "no-undef": "error",
  "no-redeclare": "error",
  "no-unreachable": "error",
  eqeqeq: ["error", "always"],
  "no-var": "error",
  "prefer-const": "error",
  "no-eval": "error",
  "no-implied-eval": "error",
  "no-new-func": "error",
  curly: ["error", "all"],
  "dot-notation": "error",
  "require-await": "warn",
  "no-async-promise-executor": "error",
  "no-return-await": "error",
  "no-throw-literal": "error",
  "no-global-assign": "error",
  "no-implicit-globals": "error",
  complexity: ["warn", 15],
  "max-depth": ["warn", 4],
  "no-constant-condition": "error",
  "no-empty": ["error", { allowEmptyCatch: true }],
  "no-extra-boolean-cast": "error",
  "valid-typeof": "error",
  "no-dupe-args": "error",
  "no-process-exit": "error",
};

export default tseslint.config(
  {
    ignores: [
      "tests/",
      "vitest.e2e.config.ts",
      "node_modules/",
      "dist/",
      "build/",
      ".serverless/",
      "*.min.js",
      "coverage/",
      "infra/layers/",
      ".eslintrc.js",
    ],
  },

  // JavaScript
  {
    ...js.configs.recommended,
    files: ["**/*.{js,mjs}"],
  },

  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        URL: "readonly",
      },
    },
    rules: sharedJsRules,
  },

  // TypeScript — type-aware linting
  {
    files: ["**/*.ts"],

    extends: [...tseslint.configs.recommendedTypeChecked],

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      // Type safety
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unsafe-enum-comparison": "error",
      "@typescript-eslint/no-base-to-string": "error",
      "@typescript-eslint/restrict-plus-operands": "error",
      "@typescript-eslint/restrict-template-expressions": "error",
      "@typescript-eslint/only-throw-error": "error",
      "@typescript-eslint/use-unknown-in-catch-callback-variable": "error",

      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",

      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",

      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "never",
        },
      ],

      // Promise / async
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",

      // TypeScript style
      "@typescript-eslint/no-require-imports": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/no-empty-object-type": [
        "error",
        {
          allowInterfaces: "always",
          allowObjectTypes: "always",
        },
      ],

      // Boolean / null
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",

      // Functions
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],

      // General JS rules for TS
      "no-console": "off",
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-async-promise-executor": "error",
      "no-constant-condition": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-extra-boolean-cast": "error",
      "valid-typeof": "error",

      // Maintainability
      complexity: ["warn", 15],
      "max-depth": ["warn", 4],
    },
  },

  // Tests / utilities
  {
    files: ["tests/**/*.ts", "util/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
);
