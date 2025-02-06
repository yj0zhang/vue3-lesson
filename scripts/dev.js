// 这个文件会帮我们打包packages下的模块，最终打包出js文件

// node dev.js 要打包的package名字 -f 打包的格式

import minimist  from "minimist";
import {resolve, dirname} from 'path';
import { fileURLToPath } from "url";
import { createRequire } from "module";
import esbuild from 'esbuild';

//node中的命令参数通过process来获取process.argv
const args = minimist(process.argv.slice(2));

// node中esm模块没有__dirname 需要取一下
const __filename = fileURLToPath(import.meta.url);// 获取文件的绝对路径 file://
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const target = args._[0] || 'reactivity';//打包哪个项目
const format = args.f || 'iife';//打包后的模块化规范

// 入口文件
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
const pkg = require(`../packages/${target}/package.json`);

esbuild.context({
    entryPoints: [entry],//入口
    outfile:resolve(__dirname,`../packages/${target}/dist/${target}.js`),//出口
    bundle: true,
    platform: 'browser',//打包后给浏览器使用
    sourcemap:true,//可以调试源码
    format,//cjs esm iife
    globalName: pkg.buildOptions?.name
}).then((ctx)=> {
    console.log("start dev");
    return ctx.watch();//监控入口文件持续进行打包
})