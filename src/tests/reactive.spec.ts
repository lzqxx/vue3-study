import { reactive } from "../reactive";

describe("reactive", () => {
  it("reactive", () => {
    const orig = { foo: 1 };
    const reactitvityObj = reactive(orig);

    orig.foo++;
    expect(reactitvityObj.foo).toBe(2);
  });
});
