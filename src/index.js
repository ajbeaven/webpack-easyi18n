const ConcatSource = require("webpack-sources").ConcatSource;
const path = require("path");
const {
    readFileSync,
    writeFileSync,
    mkdirSync
} = require("fs");
const gettextToI18Next = require("i18next-conv").gettextToI18next;

const defaultOptions = {
    alwaysRemoveBrackets: true,
};

function EasyI18nPlugin(locale, options = {}) {
    this.locale = locale;
    this.options = Object.assign({}, options, defaultOptions);
}

function save(target) {
    return result => {
        writeFileSync(target, result);
    };
}

const mkdir = function (dirPath) {
    try {
        mkdirSync(dirPath);
    } catch (err) {
        if (err.code !== "EEXIST") throw err;
    }
};

EasyI18nPlugin.prototype.apply = function (compiler) {
    var self = this;
    if (self.locale[1] !== null) {
        var poPath = path.join(self.options.localesPath, self.locale[1]);
        var locale = self.locale[0];

        mkdir(path.resolve(path.join(self.options.localesPath, "/webpack-easyi18n-temp/")));

        gettextToI18Next(locale, readFileSync(poPath), {})
            .then(save(path.join(self.options.localesPath, `/webpack-easyi18n-temp/${locale}.json`)));
    }


    var regex = /\[\[\[(.+?)((?:\|\|\|(.+?))*)(?:\/\/\/(.+?))?\]\]\]/g;

    compiler.hooks.emit.tapAsync('EasyI18nPlugin', (compilation, callback) => {
        // Explore each chunk (build output):
        compilation.chunks.forEach((chunk) => {
            var locale;
            if (self.locale[1] !== null) {
                locale = require(path.join(self.options.localesPath, `/webpack-easyi18n-temp/${self.locale[0]}.json`));
            }

            // Explore each asset filename generated by the chunk:
            chunk.files.forEach((filename) => {
                // Get the asset source for each file generated by the chunk:
                var source = compilation.assets[filename].source();

                // skip any files that have been excluded
                var modifyFile = self.options.excludeUrls == null
                    || !self.options.excludeUrls.some(excludedUrl => filename.includes(excludedUrl));
                if (!modifyFile) return;

                while ((m = regex.exec(source)) !== null) {

                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }

                    if (self.locale[1] === null) {
                        source = source.replace(m[0], m[1]);
                    } else {
                        let replacement = locale[m[1]];
                        if (typeof (replacement) === "undefined" || replacement === "") {
                            compilation.warnings.push(
                                new Error(`Missing translation, '${m[1]}' : ${self.locale[0]}`));
                            if (self.options.alwaysRemoveBrackets) {
                                source = source.replace(m[0], m[1]);
                            }
                        } else {
                            var formatItemsGroup = m[2];
                            if (formatItemsGroup) {
                                const formatItems = formatItemsGroup
                                    .slice(3)
                                    .split('|||');

                                replacement = replacement.replace(/(%\d+)/g, (value) => {
                                    var identifier = parseInt(value.slice(1));
                                    if (!isNaN(identifier) && formatItems.length > identifier) {
                                        return formatItems[identifier];
                                    } else {
                                        return value;
                                    }
                                });
                            }
                            source = source.replace(m[0], replacement);
                        }
                    }
                }

                compilation.assets[filename] =
                    new ConcatSource(`/**i18n replaced ${self.locale[0]}**/`, "\n", source);
            });
        });

        callback();
    });
};

module.exports = EasyI18nPlugin;
