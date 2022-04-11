import { render } from "./renderer";
import { createVnode } from "./vnode";

export function createApp(rootComponent: any) {
  return {
    mount(rootContainer: any) {
      const vnode = createVnode(rootComponent);
      render(vnode, rootContainer)
    }
  }

}