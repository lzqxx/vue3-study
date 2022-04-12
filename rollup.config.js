import typescriptPlugin from "rollup-plugin-typescript";

export default {
  input: "./src/index.ts",
  output: [{
      format: "cjs",
      file: "lib/vue3-study.cjs.js"
    },
    {
      format: "es",
      file: "lib/vue3-study.esm.js"
    },
  ],
  plugins: [typescriptPlugin()]
};