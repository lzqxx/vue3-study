import {
  h
} from "../../lib/vue3-study.esm.js";

export const Foo = {
  name: "Foo",
  setup(props) {
    // props.count
    console.log(props);

    // 只读，不允许修改
    props.count++
    console.log(props);
  },
  render() {
    return h("div", {}, "foo: " + this.count);
  }
}