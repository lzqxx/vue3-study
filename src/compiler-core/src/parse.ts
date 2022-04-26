import { NodeTypes } from "./ast";

export function baseParse(content: string): any {
  const context = createParserContext(content);
  return createRoot(parseChildren(context));
}

// 转成对象
// source 为还需编译的字符串值
function createParserContext(content: string): object {
  return {
    source: content,
  };
}

function createRoot(children: any[] | undefined) {
  return {
    children,
  };
}

function parseChildren(context: any): any[] | undefined {
  const nodes = [];
  let node;
  if (context.source.startsWith("{{")) {
    node = parseInterpolation(context);
  }

  nodes.push(node);

  return nodes;
}

function parseInterpolation(context: any) {
  let openDelimiter = "{{";
  let closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );
  if (closeIndex === -1) {
    throw '缺"}}"，插入表达式格式异常';
  }

  advanceBy(context, openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length
  const rawContent = context.source.slice(0, rawContentLength)
  const content = rawContent.trim();

  advanceBy(context, rawContentLength + closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content
    },
  };
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}
