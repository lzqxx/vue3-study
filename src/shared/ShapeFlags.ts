
/**
 * 虚拟节点上的标识枚举
 */
export const enum ShapeFlags {
  ELEMENT = 1, // element
  STATEFUL_COMPONENT = 1 << 1, // 组件
  TEXT_CHILDREN = 1 << 2, // children 是 Text
  ARRAY_CHILDREN = 1 << 3, // children 是数组
  SLOT_CHILDREN = 1 << 4, // children 是slot
}
