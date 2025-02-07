import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";
import { isRef } from "./ref";

export function watch(source,cb,options = {} as any) {
    return doWatch(source,cb,options)
}

// 控制depth 以及当前遍历到了哪一层
function traverse(source, depth, currentDepth = 0,seen=new Set()){
    if (!isObject(source)) {
        return source
    }
    if (depth) {
        if(currentDepth >= depth) {
            return source;
        }
        currentDepth++;
    }
    if(seen.has(source)) {
        return source;
    }
    for(let key in source) {
        traverse(source[key], depth, currentDepth, seen);
    }
    return source;//遍历就会触发每个属性的get
}
function doWatch(source,cb,{deep}){
    const reactiveGetter = (source) => traverse(source, deep === false ? 1:undefined);
    // 产生一个可以给ReactiveEffect来使用的getter，需要对这个对象进行取值操作，会关联当前的reactiveEffect
    let getter;
    if (isReactive(source)) {
        getter = () => reactiveGetter(source);
    } else if (isRef(source)) {
        getter = () => source.value;
    } else if (isFunction(source)) {
        getter = source;
    }
    let oldValue;
    const job = () => {
        const newValue = effect.run()
        cb(newValue, oldValue);
        oldValue = newValue;
    }
    const effect = new ReactiveEffect(getter, job)
    oldValue = effect.run()
}