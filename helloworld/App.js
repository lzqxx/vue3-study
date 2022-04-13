import {
  h
} from "../lib/vue3-study.esm.js";
import {
  Foo
} from "./Foo.js";

export const App = {
  name: "App",
  render() {
    // console.log(this.$el); // 还没挂在，所以没有值
    setTimeout(() => {
      console.log(this.$el);
    }, 3000);

    // ui
    return h(
      "div", {
        id: "root",
        class: ["red", "hard"],
        onClick() {
          console.log("click");
        },
        onMousedown() {
          console.log("mousedown");
        },
      },
      // array contain component
      [
        h("div", {}, "hi," + this.msg),
        h(Foo, {
          count: 1,
        }),
      ]
      // string
      // "hi, " + this.msg
      // Array
      // [
      //   h("p", {
      //     class: "red"
      //   }, "hi "),
      //   h("p", {
      //     class: ["blue"]
      //   }, "vue3 core")
      // ]
    );
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};