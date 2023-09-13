module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:jest/recommended",
    "plugin:jest/style",
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: "module",
  },
};
