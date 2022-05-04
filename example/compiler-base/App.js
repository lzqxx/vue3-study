import { ref } from "../../lib/vue3-study.esm.js";

export const App = {
  name: "App",
  // template: `<div>hi,{{message}}</div>`,
  template: `<div>hi,{{count}}</div>`,
  // template: `<div>hi,{{message}},{{count}}</div>`,
  setup() {
    const message = ref("message")
    const count = (window.count = ref(1));
    return {
      message,
      count,
    };
  },
};
