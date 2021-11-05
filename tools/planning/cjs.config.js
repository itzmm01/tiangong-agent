/**
 * 自定义cjs首页
 * @type {{}}
 */
module.exports = {
  cjsEntryFileContents(name) {
    return `'use strict'
    
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs-development/lib.js')
} else {
  module.exports = require('./cjs-production/lib.js')
}`;
  },
};
