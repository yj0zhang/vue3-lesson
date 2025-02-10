// packages/compiler-core/src/index.ts
function createParserContext(content) {
  return {
    originalSource: content,
    source: content,
    //字符串会不停的减少
    line: 1,
    column: 1,
    offset: 0
  };
}
function isEnd(context) {
  return !context.source;
}
function advanceBy(context, endIndex) {
  let c = context.source;
  context.source = c.slice(endIndex);
}
function parseTextData(context, endIndex) {
  const content = context.source.slice(0, endIndex);
  advanceBy(context, endIndex);
  return content;
}
function parseText(context) {
  let tokens = ["<", "{{"];
  let endIndex = context.source.length;
  for (let i = 0; i < tokens.length; i++) {
    const index = context.source.indexOf(tokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  let content = parseTextData(context, endIndex);
  return {
    type: 2 /* TEXT */,
    content
  };
}
function advanceSpaces(context) {
  const match = /^[\t\r\n]+/.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length);
  }
}
function getCursor(context) {
}
function getSelection(context, index) {
}
function parseTag(context) {
  const start = getCursor(context);
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source);
  const tag = match[0];
  advanceBy(context, match[0].length);
  const isSelfClosing = context.source.startsWith("/>");
  advanceSpaces(context);
  advanceBy(context, isSelfClosing ? 2 : 1);
  return {
    type: 1 /* ELEMENT */,
    tag,
    isSelfClosing,
    loc: getSelection(context, start)
  };
}
function parseElement(context) {
  const ele = parseTag(context);
  if (context.source.startsWith("</")) {
    parseTag(context);
  }
  ele.children = [];
  ele.loc = getSelection(context, ele.loc.satrt);
  return ele;
}
function parseChildren(context) {
  let nodes = [];
  while (!isEnd(context)) {
    let node;
    const c = context.source;
    if (c.startsWith("{{")) {
      node = "\u8868\u8FBE\u5F0F";
    } else if (c[0] === "<") {
      node = parseElement(context);
    } else {
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}
function createRoot(children) {
  return {
    type: 0 /* ROOT */,
    children
  };
}
function parse(template) {
  const context = createParserContext(template);
  return createRoot(parseChildren(context));
}
export {
  parse
};
//# sourceMappingURL=compiler-core.js.map
