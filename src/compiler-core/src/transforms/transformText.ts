import { NodeTypes } from "../ast";
import { isText } from "../utils";

/**
 * 插件，将表达式de content转换成 复合类型
 * @param node
 */
export function transformText(node: any) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;
      let currentContainer;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              // 改成符合类型
              if (!currentContainer) {
                children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
                currentContainer = children[i];
              }
              // 复合vnode增加 加号字符串
              currentContainer.children.push(" + ");
              // 下一个vnode加入容器
              currentContainer.children.push(next);

              // 删掉后一个vnode
              children.splice(j, 1);

              // 更正删后的j
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}
