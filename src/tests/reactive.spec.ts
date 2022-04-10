import { isProxy, isReactive, reactive } from "../reactive";

describe("reactive", () => {
  it("reactive", () => {
    const orig = { foo: 1 };
    const reactitvityObj = reactive(orig);

    orig.foo++;
    expect(reactitvityObj.foo).toBe(2);

    expect(isReactive(orig)).toBe(false);
    expect(isReactive(reactitvityObj)).toBe(true);
    expect(isProxy(orig)).toBe(false);
    expect(isProxy(reactitvityObj)).toBe(true);
  });

  test("nested reactives", () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    };
    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);

    expect(isProxy(observed.nested)).toBe(true);
  });
});
