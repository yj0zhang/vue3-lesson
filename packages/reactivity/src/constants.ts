
export enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',//命名基本唯一
}
export enum DirtyLevels {
    Dirty = 4, //脏值，意味着取值时要运行计算属性
    NoDirty = 0,//不脏，就返回上一次的计算结果
}