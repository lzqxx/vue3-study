import {
  h
} from "../../lib/vue3-study.esm.js";

export const Foo = {
  name: "Foo",
  setup(props, { emit }) {
    const emitAdd = () => {
      console.log("Foo emitAdd");
      emit("add", 1, 2);
      emit("add-foo", 3, 4);
    }

    return {
      emitAdd
    }
  },
  render() {
    const foo = h("p", {}, "Foo");
    const btn = h("button", {
      onClick: this.emitAdd
    }, "emitAdd");
    return h("div", {}, [foo, btn]);
  }
}