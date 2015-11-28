"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _gulp = require("gulp");

var _gulp2 = _interopRequireDefault(_gulp);

var _underscore = require("underscore");

var _underscore2 = _interopRequireDefault(_underscore);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _gulpPlumber = require("gulp-plumber");

var _gulpPlumber2 = _interopRequireDefault(_gulpPlumber);

var _gulpNotify = require("gulp-notify");

var _gulpNotify2 = _interopRequireDefault(_gulpNotify);

var _gulpPostcss = require("gulp-postcss");

var _gulpPostcss2 = _interopRequireDefault(_gulpPostcss);

var _jsBeautify = require("js-beautify");

var _namedRegexp = require("named-regexp");

var camelize = function camelize(str) {
    return str && str.toLowerCase().replace(/-(.)/g, function (match, group1) {
        return group1.toUpperCase();
    }) || str;
};
var onEnd = function onEnd(blocks, dest) {
    Object.keys(blocks).forEach(function (block) {
        if (_underscore2["default"].isEmpty(blocks[block])) {
            return blocks[block] = undefined;
        } else {
            return Object.keys(blocks[block]).forEach(function (elem) {
                if (typeof blocks[block][elem] !== "number" && _underscore2["default"].isEmpty(blocks[block][elem])) {
                    return blocks[block][elem] = 1;
                }
            });
        }
    });

    var jsonContent = (0, _jsBeautify.js_beautify)(JSON.stringify(blocks, {
        indent_size: 2
    }).replace(/"([^"]+?)":/g, "$1:"));

    var content = [];
    content.push("/**");
    content.push(" * WARNING: This is automatically generated content, any changes applied manually, will be overwritten");
    content.push(" */");
    content.push("export default " + jsonContent);
    _fs2["default"].writeFileSync(dest, content.join("\r\n"));
};

var pipePostCSS = function pipePostCSS(blocks) {
    return function (css) {
        var block_match = ":<bem>(:<block>[a-z0-9\-]+?)";
        var element_match = "(:<_element>(:<isElement>__)(:<element>[a-z0-9\-]+?))";
        var modifier_match = "(:<_modifier>(:<isModifier>\-\-)(:<modifier>[a-z0-9\-]+?))";
        var r = (0, _namedRegexp.named)(new RegExp("^.(" + block_match + element_match + "*" + modifier_match + "*)$", "i"));

        return css.nodes.forEach(function (node) {
            if (!node.selector) {
                return;
            }

            return node.selector.split(",").forEach(function (selector) {
                var block, blockName, c, element, elementName, m, modifierName;
                m = r.exec(selector);
                c = m && m.captures;
                if (c && c.block[0]) {
                    blockName = camelize(c.block[0]);
                    elementName = camelize(c.element[0]);
                    modifierName = camelize(c.modifier[0]);
                    block = blocks[blockName] || (blocks[blockName] = { __name: blockName });
                    if (elementName) {
                        element = block[elementName] || (block[elementName] = {});
                        if (modifierName) {
                            return element[modifierName] = 2;
                        }
                    } else if (modifierName) {
                        return block[modifierName] = 2;
                    }
                }
            });
        });
    };
};

var ret = function ret(_ref) {
    var src = _ref.src;
    var dest = _ref.dest;

    var blocks = {};
    return _gulp2["default"].src(src).pipe((0, _gulpPlumber2["default"])({ errorHandler: _gulpNotify2["default"].onError("Babel build error: <%= error.name %> <%= error.message %>") })).pipe((0, _gulpPostcss2["default"])([pipePostCSS(blocks)])).on("end", function () {
        return onEnd(blocks, dest);
    });
};

exports["default"] = ret;
module.exports = exports["default"];