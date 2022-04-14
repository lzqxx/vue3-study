import { h } from "../../lib/vue3-study.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  name: "App",
  setup() { 
    return {}
  },
  render() {
    return h("div", {}, [
      h("p", {}, "APP"),
      h(Foo, {
        onAdd(a, b) {
          console.log("onAdd", a, b);
        },
        onAddFoo(a, b) {
          console.log("onAddFoo", a, b);
        }
      })
    ])
  }
}