const ConcatSource = require("webpack-sources").ConcatSource;
const path = require("path");
const {
    readFileSync,
    writeFileSync,
    mkdirSync
} = require("fs");
const gettextToI18Next = require("i18next-conv").gettextToI18next;

function I18nPlugin(locale, options) {
    this.locale = locale;
    this.options = options || {};
}

function save(target) {
    return result => {
        writeFileSync(target, result);
    };
}

const mkdir = function(dirPath) {
    try {
        mkdirSync(dirPath);
    } catch (err) {
        if (err.code !== "EEXIST") throw err;
    }
};

I18nPlugin.prototype.apply = function(compiler) {
    var self = this;
    if (self.locale[1] !== null) {
        var poPath = path.join(self.options.localesPath, self.locale[1]);
        var locale = self.locale[0];

        mkdir(path.resolve(path.join(self.options.localesPath, "/webpack-i18n-temp/")));

        gettextToI18Next(locale, readFileSync(poPath), {})
            .then(save(path.join(self.options.localesPath, `/webpack-i18n-temp/${locale}.json`)));
    }


    var regex = typeof(self.options.regex) === "undefined" ?
        /\[\[\[(.+?)(?:\|\|\|(.+?))*(?:\/\/\/(.+?))?\]\]\]/g :
        self.options.regex;

    compiler.plugin("compilation",
        function(compilation) {

            compilation.plugin("optimize-chunk-assets",
                function(chunks, callback) {

                    var locale;
                    if (self.locale[1] !== null) {
                        locale = require(path.join(self.options.localesPath, `/webpack-i18n-temp/${self.locale[0]}.json`));
                    }

                    chunks.forEach(function(chunk) {
                        chunk.files.forEach(function(file) {
                            var source = compilation.assets[file].source();
                            while ((m = regex.exec(source)) !== null) {

                                if (m.index === regex.lastIndex) {
                                    regex.lastIndex++;
                                }

                                if (self.locale[1] === null) {
                                    source = source.replace(m[0], m[1]);
                                } else {
                                    const replacement = locale[m[1]];
                                    if (typeof(replacement) === "undefined") {
                                        compilation.warnings.push(
                                            new Error(`Missing translation, '${m[1]}' : ${self.locale[0]}`));
                                        if(self.options.alwaysRemoveBrackets){
                                            source = source.replace(m[0], m[1]);
                                        }
                                    } else {
                                        source = source.replace(m[0], replacement);
                                    }
                                }
                            }

                            compilation.assets[file] =
                                new ConcatSource(`/**i18n replaced ${self.locale[0]}**/`, "\n", source);
                        });
                    });
                    callback();
                });
        });
};

module.exports = I18nPlugin;
