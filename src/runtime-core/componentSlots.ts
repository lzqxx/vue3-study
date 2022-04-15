import { ShapeFlags } from "../shared/ShapeFlags";
import { createVNode, Fragment } from "./vnode";

// export function initSlots(instance: any, slots: any) {
//   if (slots) {
//     instance.slots = createVNode(Fragment,{},Array.isArray(slots) ? slots : [slots]) ;
//   }
// }

export function initSlots(instance: any, children: any) {
  // slots
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children: any, slots: any) {
  // 为每个具名插槽定义函数，并将作用域插槽作为参数
  // 具名插槽函数的render具体实现由调用方实现，调用方使用可用createVNode方法，控制反转
  for (const key in children) {
    const value = children[key];
    slots[key] = (props: any) => normalizeSlotValue(value(props));
  }
}

// 全转成数组统一处理
function normalizeSlotValue(value: any) {
  return Array.isArray(value) ? value : [value];
}
