import gulp from "gulp";
import _ from "underscore";
import fs from "fs";
import plumber from "gulp-plumber";
import notify from "gulp-notify";
import postcss from "gulp-postcss";
import {js_beautify as beautify} from "js-beautify";
import {named} from "named-regexp";


const camelize = (str) => str && str.toLowerCase().replace(/-(.)/g, (match, group1)=>group1.toUpperCase()) || str;
const onEnd = (blocks, dest, opts)=> {
    const ignoreEmptyBlocks = opts.ignoreEmptyBlocks;

    Object.keys(blocks).forEach(function (block) {
        const size = _.size(blocks[block]);
        if (size <= 1 && ignoreEmptyBlocks) {
            return blocks[block] = undefined;
        } else {
            return Object.keys(blocks[block]).forEach(function (elem) {
                if (typeof blocks[block][elem] !== "number" && _.isEmpty(blocks[block][elem])) {
                    return blocks[block][elem] = 1;
                }
            });
        }
    });

    const jsonContent = beautify((JSON.stringify(blocks, {
        indent_size: 2
    })).replace(/"([^"]+?)":/g, "$1:"));

    const content = [];
    content.push("/**");
    content.push(" * WARNING: This is automatically generated content, any changes applied manually, will be overwritten");
    content.push(" */");
    content.push(`export default ${jsonContent}`);
    fs.writeFileSync(dest, content.join("\r\n"));
};

const pipePostCSS = (blocks)=>(css) => {
    const block_match = ":<bem>(:<block>[a-z0-9\-]+?)";
    const element_match = "(:<_element>(:<isElement>__)(:<element>[a-z0-9\-]+?))";
    const modifier_match = "(:<_modifier>(:<isModifier>\-\-)(:<modifier>[a-z0-9\-]+?))";
    const r = named(new RegExp(`^\\.(${block_match}${element_match}*${modifier_match}*)$`, "i"));

    return css.nodes.forEach(function (node) {
        if (!node.selector) {
            return;
        }

        return (node.selector.split(",")).forEach(function (selector) {
            var block, blockName, c, element, elementName, m, modifierName;
            m = r.exec(selector);
            c = m && m.captures;
            if (c && c.block[0]) {
                blockName = camelize(c.block[0]);
                elementName = camelize(c.element[0]);
                modifierName = camelize(c.modifier[0]);
                block = blocks[blockName] || (blocks[blockName] = {__name: blockName});
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

const ret = ({src,dest, opts = {}})=> {
    const blocks = {};
    return gulp
        .src(src)
        .pipe(plumber({errorHandler: notify.onError("Babel build error: <%= error.name %> <%= error.message %>")}))
        .pipe(postcss([pipePostCSS(blocks, opts)]))
        .on("end", ()=>onEnd(blocks, dest, opts));

};

export default ret;