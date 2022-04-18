import {
  h
} from "../../lib/vue3-study.esm.js";
export const App = {
  name: "App",
  setup() {
    return {
      x: 50,
      y: 50
    }
  },

  render() {
    return h("rect", {
      x: this.x,
      y: this.y
    })
  },
};