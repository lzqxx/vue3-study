import { isReactive, reactive, shallowReactive } from "../reactive";

describe("shallowReactive", () => {
  test("should not make non-reactive properties reactive", () => {
    const props = shallowReactive({ n: { foo: 1 } });
    expect(isReactive(props.n)).toBe(false);
  });
  
  test("should differentiate from normal reactive calls", async () => {
    const original = { foo: {} };
    const shallowProxy = shallowReactive(original);
    const reactiveProxy = reactive(original);
    expect(shallowProxy).not.toBe(reactiveProxy);
    expect(isReactive(shallowProxy.foo)).toBe(false);
    expect(isReactive(reactiveProxy.foo)).toBe(true);
  });
});
