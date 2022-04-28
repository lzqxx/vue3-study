import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  end,
}

export function baseParse(content: string): any {
  const context = createParserContext(content);
  return createRoot(parseChildren(context, []));
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

function parseChildren(context: any, ancestors: any[]): any[] | undefined {
  const nodes = [];
  let node;

  while (!isEnd(context)) {
    const s = context.source;

    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s.startsWith("<")) {
      if (/^<([a-z]*)/i.test(s)) {
        node = parseElement(context, ancestors);
      }
    }

    if (!node) {
      node = parseText(context);
    }

    nodes.push(node);
  }

  return nodes;
}

function isEnd(context: any) {
  const s = context.source;

  return !s || s.startsWith("</");
}

function parseText(context: any): any {
  let endIndex = context.source.length;
  const endTokens = ["<", "{{"];

  for (let i = 0; i < endTokens.length; i++) {
    let index = context.source.indexOf(endTokens[i]);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content: content,
  };
}

function parseTextData(context: any, length: number) {
  const content = context.source.slice(0, length);

  advanceBy(context, length);
  return content;
}

function parseElement(context: any, ancestors: any[]): any {
  const element: any = parseTag(context, TagType.Start);
  ancestors.push(element.tag);
  element.children = parseChildren(context, ancestors);

  // 判断是否有结束标签
  const needEndToken = ancestors.pop();
  let match = /^<\/([a-z]*)/i.exec(context.source) || [];
  if (match.length < 1 || needEndToken !== match[1]) {
    throw `缺少结束标签:</${needEndToken}>`;
  }

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

  advanceBy(context, closeDelimiter.length);

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
