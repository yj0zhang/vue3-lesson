import { proxyRefs, reactive } from "@vue/reactivity";
import { hasOwn, isFunction, ShapeFlags } from "@vue/shared";

export const currentInstance = null;
export function createComponentInstance(vnode,parent) {
    const instance = {
        data:null,//状态
        vnode,//组件的虚拟节点
        subTree: null,//子树
        isMounted: false,//是否挂载完成
        update: null,//组件的更新函数
        props:{},
        attrs:{},
        slots:{},
        propsOptions:vnode.type.props,
        component:null,
        proxy:null,//用来代理props attrs data
        setupState:{},
        exposed: null,
        parent,
        provides: parent ? parent.provides : Object.create(null),
    }
    return instance;
}

const initProps = (instance, rawProps) => {
    //rawProps 使用组件时，传入的
    const props = {};
    const attrs = {};
    const propsOptions = instance.propsOptions ||{};//组件中定义的
    if(rawProps){
        for(let key in rawProps){
            const value = rawProps[key];
            //todo 校验value类型
            if(key in propsOptions) {
                props[key] = value;
            } else {
                attrs[key] = value
            }
        }
    }
    instance.attrs = attrs;
    //源码里是shallowReactive
    instance.props = reactive(props);
}

const publicProperty = {
    $attrs: (instance)=>instance.attrs,
    $slots: (instance)=>instance.slots,
}
const handler = {
    get(target,key){
        const {data,props, setupState} = target;
        if(data && hasOwn(data,key)) {
            return data[key];
        } else if(hasOwn(props,key)){
            return props[key];
        } else if(setupState && hasOwn(setupState,key)){
            return setupState[key]
        }
        //对于一些无法修改的属性 $slots $attrs
        const getter = publicProperty[key];
        if(getter) {
            return getter(target)
        }
    },
    set(target,key,value){
        const {data,props, setupState} = target;
        if(data && hasOwn(data,key)) {
            data[key] = value;
        } else if(hasOwn(props,key)){
            // props[key]  = value;
            console.warn("props are readonly")
            return false;
        } else if(setupState && hasOwn(setupState,key)){
            setupState[key] = value;
        }
        return true;
    }
}

export function initSlots(instance,children){
    if(instance.vnode.shapeFlag &ShapeFlags.SLOTS_CHILDREN){
        instance.slots = children
    } else {
        instance.slots = {}
    }
}
export function setupComponent(instance) {
    const {vnode} = instance
    //属性
    initProps(instance, vnode.props);
    initSlots(instance,vnode.children);
    //代理对象
    instance.proxy = new Proxy(instance,handler);
    const {data, render,setup} = vnode.type;

    if(setup) {
        const setupContext = {
            slots: instance.slots,
            attrs: instance.attrs,
            emit(event,...payload){
                const eventName = `on${event[0].toUpperCase()+event.slice(1)}`;
                const handler = instance.vnode.props[eventName];
                handler&&handler(payload)
            },
            expose:(value)=>{
                instance.exposed = value;
            },
        }
        const setupResult = setup(instance.props,setupContext);
        if(isFunction(setupResult)) {
            instance.render = setupResult;
        } else {
            instance.setupState = proxyRefs(setupResult);
        }
    }
    if(data && !isFunction(data)){
        return console.warn("data option must be a function")
    }
    instance.data = data ? reactive(data.call(instance.proxy)) : null
    instance.render = instance.render || render
}