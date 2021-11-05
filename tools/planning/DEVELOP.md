# 开发指引



## 打包

修改依赖模块 tsdx/dist/index.js 内写入index.js的方法
```js
function writeCjsEntryFile(name) {
    const contents = `
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs-production/lib')
} else {
  module.exports = require('./cjs-development/lib')
}
`;
    return fs.outputFile(path_1.default.join(constants_1.paths.appDist, 'index.js'), contents);
}
```


## 遗留问题

- 主机配置界面无数据时，新增数据导致表格行与表头错位；
