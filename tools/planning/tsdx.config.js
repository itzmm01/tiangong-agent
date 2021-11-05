const postcss = require('rollup-plugin-postcss');
const url = require('@rollup/plugin-url');
const json = require('@rollup/plugin-json');
const copy = require('rollup-plugin-copy-assets');
const dynamicImportVars = require('@rollup/plugin-dynamic-import-vars').default;

const path = require('path');

module.exports = {
  rollup(originConfig, options) {
    const env = options.env || '';
    const config = originConfig;
    if (env.length) {
      config.output.dir = path.resolve(`./dist/${config.output.format}-${env}`);
    } else {
      config.output.dir = path.resolve(`./dist/${config.output.format}`);
    }
    delete config.output.file;
    // config.plugins.push(legacy({
    //   'src/validator/index.js':"demoValidator"
    // }));
    config.plugins.push(url({ fileName: '[name][extname]', sourceDir: path.join(__dirname, 'src') }));
    config.plugins.push(json());
    config.plugins.push(copy({ assets: ['/src/img', '/src/template'] }));
    config.plugins.push(postcss({ inject: true, extract: 'style/index.css' }));
    config.plugins.push(dynamicImportVars({ include: ['/src/**/*.tsx'] }));
    return config;
  },
};
