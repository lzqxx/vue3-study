import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  end,
}

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
  const s = context.source;
  if (s.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (s.startsWith("<")) {
    if (/^<([a-z]*)/i.test(s)) {
      node = parseElement(context);
    }
  }

  if (!node) {
    node = parseText(context);
  }

  nodes.push(node);

  return nodes;
}

function parseText(context: any): any {
  // TODO 结束标识还没判断
  const content = parseTextData(context, context.source.length);

  advanceBy(context, content.length);

  return {
    type: NodeTypes.TEXT,
    content: content,
  };
}

function parseTextData(context:any, length:number){
  const content = context.source.slice(0, length);

  advanceBy(context, length);
  return content
}

function parseElement(context: any): any {
  const element = parseTag(context, TagType.Start);

  // TODO: children未实现

  parseTag(context, TagType.end);
  return element;
}

function parseTag(context: any, tagType: TagType) {
  const match = /^<\/?([a-z]*)/i.exec(context.source) || [];
  const tag = match[1] || "";

  advanceBy(context, match[0].length);

  advanceBy(context, 1); // > 符号

  if (tagType === TagType.end) {
    return;
  }

  return {
    type: NodeTypes.ELEMENT,
    tag: tag,
    children: [],
  };
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

  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = parseTextData(context, rawContentLength);
  const content = rawContent.trim();

  advanceBy(context, rawContentLength + closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}
