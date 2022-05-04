'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const EMPTY_OBJ = {};
function isObject(value) {
    return value !== null && typeof value === "object";
}
function isString(value) {
    return value !== null && typeof value === "string";
}
function isFunction(value) {
    return value !== null && typeof value === "function";
}
function hasChanged(value, oldValye) {
    return !Object.is(value, oldValye);
}
const hasOwn = (val, key) => {
    return Object.prototype.hasOwnProperty.call(val, key);
};
function camelize(str) {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
}
function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}
function toHandlerKey(str) {
    return str ? "on" + capitalize(str) : "";
}

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

var NodeTypes;
(function (NodeTypes) {
    NodeTypes[NodeTypes["INTERPOLATION"] = 0] = "INTERPOLATION";
    NodeTypes[NodeTypes["SIMPLE_EXPRESSION"] = 1] = "SIMPLE_EXPRESSION";
    NodeTypes[NodeTypes["ELEMENT"] = 2] = "ELEMENT";
    NodeTypes[NodeTypes["TEXT"] = 3] = "TEXT";
    NodeTypes[NodeTypes["ROOT"] = 4] = "ROOT";
    NodeTypes[NodeTypes["COMPOUND_EXPRESSION"] = 5] = "COMPOUND_EXPRESSION";
})(NodeTypes || (NodeTypes = {}));
function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: NodeTypes.ELEMENT,
        tag,
        props,
        children,
    };
}

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    // 拼接成
    // const { toDisplayString: _toDisplayString } = Vue
    genFunctionPreamble(ast, context);
    // 拼接成
    // return function render(_ctx, _cache) {
    //   return "hi"
    // }
    push("return ");
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(", ");
    push(`function ${functionName}(${signature}) {`);
    push(" return ");
    genNode(ast.codegenNode, context);
    push(" }");
    return {
        code: context.code,
    };
}
function createCodegenContext() {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}
function genNode(node, context) {
    switch (node.type) {
        case NodeTypes.TEXT:
            genText(node, context);
            break;
        case NodeTypes.INTERPOLATION:
            genInterpolation(node, context);
            break;
        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(node, context);
            break;
        case NodeTypes.ELEMENT:
            genElement(node, context);
            break;
        case NodeTypes.COMPOUND_EXPRESSION:
            genCompoundExpression(node, context);
            break;
    }
}
function genFunctionPreamble(ast, context) {
    const VueBinging = "Vue";
    const { push } = context;
    if (ast.helpers.length > 0) {
        const aliasHelper = (s) => {
            return `${helperMapName[s]}: _${helperMapName[s]}`;
        };
        push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`);
        push("\n\n");
    }
}
function genText(node, context) {
    const { push } = context;
    push(`"${node.content}"`);
}
function genInterpolation(node, context) {
    // _toDisplayString(_ctx.message)
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(`)`);
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable([tag, props, children]), context);
    push(")");
}
function genNullable(args) {
    return args.map((arg) => arg || "null");
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}

var TagType;
(function (TagType) {
    TagType[TagType["Start"] = 0] = "Start";
    TagType[TagType["end"] = 1] = "end";
})(TagType || (TagType = {}));
function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
// 转成对象
// source 为还需编译的字符串值
function createParserContext(content) {
    return {
        source: content,
    };
}
function createRoot(children) {
    return {
        children,
        type: NodeTypes.ROOT,
    };
}
function parseChildren(context, ancestors) {
    const nodes = [];
    let node;
    while (!isEnd(context)) {
        const s = context.source;
        if (s.startsWith("{{")) {
            node = parseInterpolation(context);
        }
        else if (s.startsWith("<")) {
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
function isEnd(context) {
    const s = context.source;
    return !s || s.startsWith("</");
}
function parseText(context) {
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
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, length);
    return content;
}
function parseElement(context, ancestors) {
    const element = parseTag(context, TagType.Start);
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
function parseTag(context, tagType) {
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
function parseInterpolation(context) {
    let openDelimiter = "{{";
    let closeDelimiter = "}}";
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
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
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    traverseNode(root, context);
    // root 的 node 固定取 children[0],所以直接封装出来
    createRootCodegen(root);
    // 将content中的依赖提到root上
    root.helpers = [...context.helpers.keys()];
}
function createTransformContext(root, option) {
    const context = {
        root,
        nodeTransforms: option.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === NodeTypes.ELEMENT) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = child;
    }
}
function traverseNode(node, context) {
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        let transformFun = nodeTransforms[i];
        const onExit = transformFun(node, context);
        if (onExit) {
            exitFns.push(onExit);
        }
    }
    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING);
            break;
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children || [];
    for (let i = 0; i < children.length; i++) {
        traverseNode(children[i], context);
    }
}

/**
 * 将 element类型的 codegenNode 转换数据结构
 * @param node
 * @param context
 */
function transformElement(node, context) {
    if (node.type === NodeTypes.ELEMENT) {
        return () => {
            const vnodeTag = `"${node.tag}"`;
            let vnodeProps;
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

// 插件，
function transformExpression(node) {
    if (node.type === NodeTypes.INTERPOLATION) {
        node.content = processExpression(node.content);
    }
}
// 插值时添加上下文对象
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION;
}

/**
 * 插件，将表达式de content转换成 复合类型
 * @param node
 */
function transformText(node) {
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
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

const targetMap = new Map();
let activeEffect = null;
let shouldTrack = false; // 是否在收集依赖，用activeEffect可判断，但此处用此变量更有语义化
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
    }
    run() {
        // fix: 解决stop再runner后，无法stop的问题
        if (!this.active) {
            this.active = true;
        }
        shouldTrack = true;
        activeEffect = this;
        // 触发get事件收集依赖
        let result = this.fn();
        // 依赖收集完后清掉
        activeEffect = null;
        shouldTrack = false;
        return result;
    }
    // 实际上是清除，不是单词stop停止的含义
    stop() {
        // 优化重复调用stop的性能问题
        if (this.active) {
            clearupEffect(this);
            this.onStop && this.onStop();
            this.active = false;
        }
    }
}
function clearupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
}
function effect(fn, options) {
    const _effect = new ReactiveEffect(fn);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function track(target, key) {
    if (!isTracking())
        return;
    // 对象依赖
    let targetDeps = targetMap.get(target);
    if (!targetDeps) {
        targetDeps = new Map();
        targetMap.set(target, targetDeps);
    }
    // 字段属性依赖
    let dep = targetDeps.get(key);
    if (!dep) {
        dep = new Set();
        targetDeps.set(key, dep);
    }
    trackEffects(dep);
}
function isTracking() {
    return shouldTrack && activeEffect;
}
function trackEffects(dep) {
    // 属性上增加一个依赖
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
        // 依赖挂上属性依赖
        activeEffect.deps.push(dep);
    }
}
function trigger(target, key) {
    const targetDeps = targetMap.get(target);
    if (!targetDeps)
        return;
    const deps = targetDeps.get(key);
    if (!deps || deps.size === 0)
        return;
    triggerEffects(deps);
}
function triggerEffects(dep) {
    dep.forEach((effect) => {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    });
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const readonlySet = createReadonlySetter();
const shallowReactiveGet = createGetter(false, true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === exports.ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === exports.ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        // 依赖收集
        if (!isReadonly) {
            track(target, key);
        }
        // 不嵌套
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            // 嵌套
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        let res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
function createReadonlySetter() {
    return function set(target, key, value) {
        console.warn(`key:${key} 是 readonly, 不允许修改`);
        return true;
    };
}
const mutableHandlers = {
    get,
    set,
};
const shallowReactiveHandlers = {
    get: shallowReactiveGet,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set: readonlySet,
};
const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set: readonlySet,
};

exports.ReactiveFlags = void 0;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
})(exports.ReactiveFlags || (exports.ReactiveFlags = {}));
function createReactiveObject(target, baseHandlers) {
    return new Proxy(target, baseHandlers);
}
function reactive(target) {
    return createReactiveObject(target, mutableHandlers);
}
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers);
}
function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyHandlers);
}
function shallowReactive(target) {
    return createReactiveObject(target, shallowReactiveHandlers);
}
function isReactive(value) {
    return !!value[exports.ReactiveFlags.IS_REACTIVE];
}
function isReadonly(value) {
    return !!value[exports.ReactiveFlags.IS_READONLY];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}

class refImpt {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        // 收集依赖
        if (isTracking()) {
            trackRefValue(this);
        }
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._value = convert(newValue);
            this._rawValue = newValue;
            triggerRefValue(this);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function triggerRefValue(ref) {
    triggerEffects(ref.dep);
}
function trackRefValue(ref) {
    if (isTracking()) {
        // effect执行时 activeEffect 会赋值，然后收集依赖
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new refImpt(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
// 为了调用时省略.value，template时有用到
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(target[key]);
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            return Reflect.set(target, key, value);
        },
    });
}

function emit(instance, event, ...arg) {
    const { props } = instance;
    // emit("add") -> onAdd()
    // emit("add-foo") -> onAddFoo()
    const handleKey = toHandlerKey(camelize(event));
    const handle = props[handleKey];
    handle && handle(...arg);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => {
        return i.vnode.el;
    },
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

/**
 * 虚拟节点上的标识枚举
 */
var ShapeFlags;
(function (ShapeFlags) {
    ShapeFlags[ShapeFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlags[ShapeFlags["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    ShapeFlags[ShapeFlags["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    ShapeFlags[ShapeFlags["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
    ShapeFlags[ShapeFlags["SLOT_CHILDREN"] = 16] = "SLOT_CHILDREN";
})(ShapeFlags || (ShapeFlags = {}));

// export function initSlots(instance: any, slots: any) {
//   if (slots) {
//     instance.slots = createVNode(Fragment,{},Array.isArray(slots) ? slots : [slots]) ;
//   }
// }
function initSlots(instance, children) {
    // slots
    const { vnode } = instance;
    if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    // 为每个具名插槽定义函数，并将作用域插槽作为参数
    // 具名插槽函数的render具体实现由调用方实现，调用方使用可用createVNode方法，控制反转
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
// 全转成数组统一处理
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        // props 浅只读
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // TODO function
    if (typeof setupResult === "object") {
        // 为了 render/template 中直接this.field，不用this.value.fielf
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
// 全局变量赋值通过函数方式，方便后续问题排查、断点调试
function setCurrentInstance(instance) {
    currentInstance = instance;
}
// 为了解耦，compiler 通过外部传入，用于template
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

/**
 * 是否更新组件
 * 只需要判断props是否改变
 * @param prevVNode
 * @param nextVNode
 */
function shouldUpdateComponent(prevVNode, nextVNode) {
    const prevProps = prevVNode.props;
    const nextProps = nextVNode.props;
    // 如果新节点少了props，是不是会有问题？
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
/**
 * 创建虚拟节点
 * @param type vue组件的optoins
 * @param props
 * @param children
 * @returns
 */
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (isString(vnode.children)) {
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
    else if (Array.isArray(vnode.children)) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }
    // 组件且children是数组
    // if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    //   if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    //     vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    //   }
    // }
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        if (typeof children === "object") {
            vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return isString(type) ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}

// import { render } from "./renderer";
// export function createApp(rootComponent: any) {
//   return {
//     mount(rootContainer: any) {
//       const vnode = createVNode(rootComponent);
//       render(vnode, rootContainer)
//     }
//   }
// }
// 为了调用内部的render，封装成函数，把内部 render 传进来
function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

const queue = [];
const p = Promise.resolve();
// 变量控制，promise 开始执行才建新的 Promise，
//  否则 job 直接放入队列，等待 promise 执行
let isFlushPending = false;
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    // 变量控制，promise 开始执行才建新的 promise
    if (isFlushPending) {
        return;
    }
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    function patch(n1, n2, container, parentComponent, anchor) {
        // n1为空则是新增，n1有值则是修改
        switch (n2.type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (n2.shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(null, subTree, container, instance, anchor);
                // console.log(instance.vnode === initialVNode); // true
                // console.log(instance.vnode === subTree); // false
                // createApp -> instance -> instance.render() -> subTree
                // patch -> 生成el -> vnode(subTree).el = el
                // 子树有自己的vnode，为根组件实例instance的下级。
                // instance 根组件实例 render 后，得到子树（非组件实例vnode），patch 后得到子树 el。
                // 组件实例自身是没有实际 el，不用渲染到浏览器，所以把子树的 el 直接赋值给组件实例的vnode上，
                // 浏览器渲染时直接渲染子树的 el
                initialVNode.el = subTree.el;
                // instance.vnode.el = subTree.el;// 等同上面
                instance.isMounted = true;
            }
            else {
                const { next, vnode } = instance;
                // 更新组件信息
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                // 需要比对新旧节点来更新
                const prevSubTree = instance.subTree;
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                queueJobs(instance.update);
            }
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        instance.vnode = nextVNode.vnode;
        instance.next = null;
        instance.props = nextVNode.props;
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        // 新vnode带上el
        let el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag: prevShapeFlag } = n1;
        const { shapeFlag } = n2;
        const c1 = n1.children;
        const c2 = n2.children;
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // array转text
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                unMountChildren(c1);
            }
            // array转text 或 text修改 时
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            // text 转 array
            if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // TODO: array 与 array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        // 前端很多时候前后节点没变化
        // 先左右侧无变化对比，缩小后面遍历范围
        // 再中间区变化区比对
        let i = 0;
        let l2 = c2.length;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧相同对比
        while (i <= e1 && i <= e2) {
            let n1 = c1[i];
            let n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧相同对比
        while (i <= e1 && i <= e2) {
            let n1 = c1[e1];
            let n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 已找出中间不同区域
        // 处理左右侧变多或变少节点的情况
        // 变多时
        if (i > e1) {
            // 避免全相同
            if (i <= e2) {
                let nextPos = e2 + 1;
                // e2的后一位小于自身长度左侧加，否则末尾加
                let anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 变少
            while (i <= e1) {
                hostRemove(c1[e1].el);
                e1--;
            }
        }
        else {
            // 中间区域差异
            let s1 = i;
            let s2 = i;
            let toBePatched = e2 - s2 + 1;
            let patched = 0; // 新的能命中的数量
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false;
            let maxNewIndexSoFar = 0;
            newIndexToOldIndexMap.fill(0);
            console.log("newIndexToOldIndexMap=", newIndexToOldIndexMap);
            // key 与节点映射关系
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                // 没 key 可能有问题
                if (c2[i].key) {
                    keyToNewIndexMap.set(c2[i].key, i);
                }
            }
            // 删掉没了的
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // map 已全命中
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 没key,遍历c2中间区
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    // 删除
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 加1为了区分下标志为0时
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, parentAnchor);
                    patched++;
                }
            }
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            // 因为insert是从某el前插入，所以从后往前加才能确保后el是正确位置，才不会有问题
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                // 旧中没找到
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    // 递增子序列已全找到
                    // 或找到非子序列的节点，则插入
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unMountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            let el = children[i].el;
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // 有新prop或prop有改变
            for (const key in newProps) {
                let prevProp = oldProps[key];
                let nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            // 有prop被移除
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const { type } = vnode;
        const { children } = vnode;
        const { props } = vnode;
        const { shapeFlag } = vnode;
        // let el = (vnode.el = document.createElement(type));
        let el = (vnode.el = hostCreateElement(type));
        // children
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children;
        }
        else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        // props
        for (const key in props) {
            const val = props[key];
            // if (isOn(key)) {
            //   const eventName = key.slice(2).toLowerCase();
            //   el.addEventListener(eventName, val);
            // } else {
            //   el.setAttribute(key, val);
            // }
            hostPatchProp(el, key, null, val);
        }
        // container.append(el);
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, el, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, el, parentComponent, anchor);
        });
    }
    return {
        // 为了暴露render，封装函数把render当参数暴露出去
        createApp: createAppAPI(render),
    };
}
/**
 * 最长递增子序列
 * @param arr
 * @returns
 */
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    // 在 setup内才能获取currentInstance，且才能调用provide
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 第一次调用provies时初始化
        if (provides === parentProvides) {
            // 通过prototype，为inject时自身找不到往上找
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    let currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 从父组件的provides找
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else {
            if (isFunction(defaultValue)) {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (prop) => {
        return /^on[A-Z]/.test(prop);
    };
    if (isOn(key)) {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, nextVal);
    }
    else {
        if (nextVal === null || nextVal === undefined) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor = null) {
    parent.insertBefore(child, anchor);
}
function remove(child) {
    let parent = child.parentNode;
    parent && parent.removeChild(child);
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    // 使用 document 的 renderer
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
  __proto__: null,
  createApp: createApp,
  h: h,
  createTextVNode: createTextVNode,
  createElementVNode: createVNode,
  renderSlots: renderSlots,
  getCurrentInstance: getCurrentInstance,
  provide: provide,
  inject: inject,
  createRenderer: createRenderer,
  nextTick: nextTick,
  toDisplayString: toDisplayString,
  ref: ref,
  get ReactiveFlags () { return exports.ReactiveFlags; },
  createReactiveObject: createReactiveObject,
  reactive: reactive,
  readonly: readonly,
  shallowReadonly: shallowReadonly,
  shallowReactive: shallowReactive,
  isReactive: isReactive,
  isReadonly: isReadonly,
  isProxy: isProxy
});

function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

exports.createApp = createApp;
exports.createElementVNode = createVNode;
exports.createReactiveObject = createReactiveObject;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.nextTick = nextTick;
exports.provide = provide;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.renderSlots = renderSlots;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
exports.toDisplayString = toDisplayString;
