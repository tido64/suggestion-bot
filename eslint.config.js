import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        __filename: "readonly",
        console: "readonly",
        exports: "readonly",
        module: "readonly",
        process: "readonly",
        require: "readonly",
      },
    },
  },
];
