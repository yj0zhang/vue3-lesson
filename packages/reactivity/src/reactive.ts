import { isObject } from "@vue/shared"
import { mutableHandlers } from "./baseHandler";
import { ReactiveFlags } from "./constants";

// 用于记录代理后的结果，同一个对象，代理多次，返回同一个代理
const reactiveMap = new WeakMap();

function createReactiveObject(target) {
    if (!isObject(target)) {
        return target;
    }
    if (target[ReactiveFlags.IS_REACTIVE]) {
        //target已经是代理
        return target;
    }
    const exitsProxy = reactiveMap.get(target)
    if (exitsProxy) {
        //target已被代理过
        return exitsProxy;
    }
    let proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
}

export function reactive(target) {
    return createReactiveObject(target);
}

export function toReactive(value) {
    return isObject(value) ? reactive(value):value;
}