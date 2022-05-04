import { NodeTypes } from "../ast";

// 插件，
export function transformExpression(node: any) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
  }
}

// 插值时添加上下文对象
function processExpression(node: any) {
  node.content = `_ctx.${node.content}`;
  return node;
}
