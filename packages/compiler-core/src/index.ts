

//编译分为三步
// 1. 将模版转化成ast语法树（源码中使用了第三方模块）
// 2. 转化生成codegennode
// 3. 转化成render函数

import { NodeTypes } from "./ast";


function createParserContext(content) {
    return {
        originalSource: content,
        source: content,//字符串会不停的减少
        line:1,
        column:1,
        offset:0,
    }
}

function isEnd(context) {
    return !context.source
}

//截取
function advanceBy(context, endIndex) {
    let c = context.source;
    context.source = c.slice(endIndex);
}

function parseTextData(context, endIndex) {
    const content = context.source.slice(0,endIndex);
    advanceBy(context, endIndex);
    return content;
}

function parseText(context) {
    let tokens = ['<','{{'];//找当前离着最近的词法
    let endIndex = context.source.length;
    for(let i = 0; i < tokens.length;i++) {
        const index = context.source.indexOf(tokens[i],1);
        if(index!==-1&&endIndex>index){
            endIndex=index;
        }
    }
    //0-endIndex为文字内容
    let content = parseTextData(context,endIndex);
    return {
        type: NodeTypes.TEXT,
        content
    }
}

function advanceSpaces(context) {
    const match = /^[\t\r\n]+/.exec(context.source);
    if(match) {
        advanceBy(context,match[0].length)
    }
}

function getCursor(context) {
    //
}
function getSelection(context, index) {
    //
}
function parseTag(context) {
    const start = getCursor(context);
    const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source)
    const tag = match[0];
    advanceBy(context, match[0].length);
    const isSelfClosing = context.source.startsWith('/>');
    advanceSpaces(context);
    advanceBy(context, isSelfClosing ? 2:1);
    return  {
        type: NodeTypes.ELEMENT,
        tag,
        isSelfClosing,
        loc: getSelection(context,start),
    }
}

function parseElement(context) {
    const ele = parseTag(context);
    if(context.source.startsWith('</')) {
        parseTag(context)//闭合标签，直接移除
    }
    (ele as any).children = [];
    (ele as any).loc = getSelection(context,ele.loc.satrt)
    return ele;
}

function parseChildren(context) {
    let nodes = []
    while(!isEnd(context)) {
        let node;
        const c = context.source;
        if(c.startsWith('{{')) {
            node="表达式"
        } else if(c[0] === '<'){
            node = parseElement(context)
        } else {
            //文本
            node = parseText(context);
        }
        //状态机
        nodes.push(node);
    }
    return nodes;
}

function createRoot(children) {
    return {
        type: NodeTypes.ROOT,
        children,
    }
}
// 将模版转化成ast语法树
function parse(template) {
    //根据template产生一棵树;
    const context = createParserContext(template);
    return createRoot(parseChildren(context))
}

export {parse}