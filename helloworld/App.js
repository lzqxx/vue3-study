import {
  h
} from "../lib/vue3-study.esm.js"

export const App = {
  render() {
    // console.log(this.$el); // 还没挂在，所以没有值
    setTimeout(() => {
      console.log(this.$el);
    }, 3000);

    // ui
    return h(
      "div", {
        id: "root",
        class: ["red", "hard"]
      },
      "hi, " + this.msg
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