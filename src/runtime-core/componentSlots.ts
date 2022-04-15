import { ShapeFlags } from "../shared/ShapeFlags";
import { createVNode, Fragment } from "./vnode";

// export function initSlots(instance: any, slots: any) {
//   if (slots) {
//     instance.slots = createVNode(Fragment,{},Array.isArray(slots) ? slots : [slots]) ;
//   }
// }

export function initSlots(instance: any, children:any) {
  // slots
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children: any, slots: any) {
  for (const key in children) {
    const value = children[key];
    slots[key] = (props: any) => normalizeSlotValue(value(props));
  }
}

function normalizeSlotValue(value:any) {
  return Array.isArray(value) ? value : [value];
}
