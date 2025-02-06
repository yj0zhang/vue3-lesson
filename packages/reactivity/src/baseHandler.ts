import { activeEffect } from "./effect";
import { track, trigger } from "./reactiveEffect";

export enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',//命名基本唯一
}
export const mutableHandlers: ProxyHandler<any> = {
    get(target,key,receiver){
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true;
        }
        //取值时，应该让响应式属性和effect映射起来
        // 依赖收集
        //effct.ts中的全局变量 activeEffect
        track(target,key);//收集target上的key属性，和effect关联
        return Reflect.get(target, key, receiver);
    },
    set(target,key,value,receiver){
        // 找到属性，让对应的effect更新
        //触发更新
        let oldValue = target[key];
        let result = Reflect.set(target,key,value,receiver);
        if (oldValue !== value) {
            // 需要触发页面更新
            trigger(target,key,value,oldValue);
        }
        return result
    }
}