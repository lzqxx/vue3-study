import {
  h
} from "../lib/vue3-study.esm.js"
export const App = {
  render() {
    // ui
    return h("div", {
      id: "root",
      class: ["red", "hard"]
    }, [h("p", {
      class: "red"
    }, "hi "), h("p", {
      class: ["blue"]
    }, "vue3 core")]);
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};