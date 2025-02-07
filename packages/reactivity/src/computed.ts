import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

class ComputedRefImpl{
    public _value;
    public effect;
    public dep;
    constructor(getter,public setter){
        //创建一个effect，来管理当前计算属性的dirty属性
        this.effect = new ReactiveEffect(()=>getter(this._value), () => {
            //计算属性依赖的值变化了，执行此函数，触发重新渲染
            triggerRefValue(this);
        })
    }
    get value() {
        if(this.effect.dirty) {
            this._value = this.effect.run();
            // 如果在effect中访问了计算属性，计算属性可以收集这个effect
            trackRefValue(this);
        }
        return this._value;
    }
    set value(v) {
        this.setter(v)
    }
}
export function computed(getterOrOptions){
    let onlyGetter = isFunction(getterOrOptions);
    let getter,setter;
    if (onlyGetter) {
        getter = getterOrOptions;
        setter = () => {};
    } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    // console.log(getter,setter)
    return new ComputedRefImpl(getter,setter)
}