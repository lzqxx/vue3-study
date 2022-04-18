// import { render } from "./renderer";
import { createVNode } from "./vnode";

// export function createApp(rootComponent: any) {
//   return {
//     mount(rootContainer: any) {
//       const vnode = createVNode(rootComponent);
//       render(vnode, rootContainer)
//     }
//   }

// }

// 为了调用内部的render，封装成函数，把内部 render 传进来
export function createAppAPI(render: any) {
  return function createApp(rootComponent: any) {
    return {
      mount(rootContainer: any) {
        const vnode = createVNode(rootComponent);
        render(vnode, rootContainer);
      },
    };
  };
}
