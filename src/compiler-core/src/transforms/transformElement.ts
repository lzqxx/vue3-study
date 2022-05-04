import { NodeTypes, createVNodeCall } from "../ast";

/**
 * 将 element类型的 codegenNode 转换数据结构
 * @param node
 * @param context
 */
export function transformElement(node: any, context: any) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const vnodeTag = `"${node.tag}"`;

      let vnodeProps;

      const children = node.children;
      let vnodeChildren = children[0];

      node.codegenNode = createVNodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      );
    };
  }
}
