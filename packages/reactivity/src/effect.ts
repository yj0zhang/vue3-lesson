import { DirtyLevels } from "./constants";

export function effect(fn,options?) {
    // 创建一个响应式effect 数据变化后可以重新执行

    //创建一个effect，只要依赖的属性变化了就要执行回调
    const _effect = new ReactiveEffect(fn, () => {
        // 默认scheduler
        _effect.run()
    })
    _effect.run();
    if (options) {
        Object.assign(_effect, options);//用户传递的覆盖默认的
    }
    const runner =_effect.run.bind(_effect);
    runner.effct = _effect;
    return runner
}
// 全局变量
export let activeEffect;
function preCleanEffect(effect) {
    effect._depsLength = 0;
    effect._trackId++;//每次执行，id+1，在同一次effect执行中，id相同
}
function postCleanEffect(effect) {
    if (effect.deps.length > effect._depsLength) {
        for(let i = effect._depsLength; i<effect.deps.length; i++) {
            cleanDepEffect(effect.deps[i],effect);
        }
        effect.deps.length = effect._depsLength;
    }
    effect.deps.splice(effect._depsLength)
}
export class ReactiveEffect {
    _trackId = 0;//用于记录当前effect执行了几次(防止一个属性在当前effect中多次依赖收集)
    deps = [];
    _depsLength = 0;
    _running = 0;
    _dirtyLevel = DirtyLevels.Dirty

    public active = true;
    // fn 用户编写的函数
    constructor(public fn, public scheduler) {}

    public get dirty() {
        return this._dirtyLevel === DirtyLevels.Dirty;
    }
    public set dirty(v) {
        this._dirtyLevel = v ? DirtyLevels.Dirty : DirtyLevels.NoDirty;
    }
    run() {
        this._dirtyLevel = DirtyLevels.NoDirty;
        if (!this.active) {
            return this.fn();
        }
        let lastEffect = activeEffect;
        try{
            activeEffect = this;
            // effect重新执行前，需要将上一次的依赖清空
            preCleanEffect(this);
            this._running++;
            return this.fn();
        } finally {
            this._running--;
            postCleanEffect(this);
            activeEffect = lastEffect;
        }
    }
    stop() {
        this.active = false;//todo
    }
}

function cleanDepEffect(dep,effect) {
    dep.delete(effect);
    if(dep.size === 0) {
        dep.cleanup();
    }
}

//双向记忆
export function trackEffect(effect, dep) {
    // 更新当前effect的_trackId
    if (dep.get(effect) !== effect._trackId) {
        // 同一次effect中，对同一属性，只收集一次
        dep.set(effect,effect._trackId);//更新id
        //按照顺序对比dep，不一样的话，表明老的不需要了，换成新的
        let oldDep = effect.deps[effect._depsLength];
        if (oldDep !== dep) {
            if (oldDep) {
                //删掉老的
                cleanDepEffect(oldDep, effect);
            }
            //换成新的
            effect.deps[effect._depsLength++] = dep;
        } else {
            effect._depsLength++
        }
    }
}
export function triggerEffects(dep) {
    for(const effect of dep.keys()) {
        if (effect._dirtyLevel < DirtyLevels.Dirty) {
            effect._dirtyLevel = DirtyLevels.Dirty;
        }
        if (effect.scheduler) {
            if(!effect._running){
                // 不是正在执行，才能执行
                effect.scheduler();
            }
        }
    }
}