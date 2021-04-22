const { SourceMapSource } = require("webpack").sources;
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

    // Unfortunately the regex below doesn't work as js flavoured regex makes only the last capture included
    // in a capture group available (unlike .NET which lets you iterate over all captures in a group).
    // This means formatable nuggets with multiple formatable items will fail.
    //
    // Take the following nugget for example:
    // - [[[%0 %1|||1|||2]]]
    //
    // The regex below will only include "2" in the second capture group, rather than all captures "1|||2".
    // We need to do multiple rounds of parsing in order to work around this
    //var regex = /\[\[\[(.+?)(?:\|\|\|(.+?))*(?:\/\/\/(.+?))?\]\]\]/s;
    var regex = /\[\[\[(.+?)(?:\|\|\|.+?)*(?:\/\/\/(.+?))?\]\]\]/s;

    var locale;
    if (self.locale[1] !== null) {
        locale = require(path.join(self.options.localesPath, `/webpack-easyi18n-temp/${self.locale[0]}.json`));
    }

    compiler.hooks.compilation.tap('EasyI18nPlugin', (compilation) => {
        compilation.hooks.processAssets.tap(
            {
                name: 'EasyI18nPlugin',
                state: compilation.PROCESS_ASSETS_STAGE_DERIVED,
            },
            () => {
                compilation.getAssets().forEach((asset) => {
                    localizeFile(asset.name, compilation);
                });
            }
        );
    });

    function localizeFile(filename, compilation) {
        var originalSourceObj = compilation.assets[filename];
        var originalSource = originalSourceObj.source();
        var source = originalSource;

        // skip any files that have been excluded
        var modifyFile = typeof source === 'string'
            && (self.options.excludeUrls == null || !self.options.excludeUrls.some(excludedUrl => filename.includes(excludedUrl)))
            && (self.options.includeUrls == null || self.options.includeUrls.some(includedUrl => filename.includes(includedUrl)))
            ;
        if (!modifyFile) return;

        while ((m = regex.exec(source)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            const nuggetSyntaxRemoved = m[1]
            if (self.locale[1] === null) {
                replacement = nuggetSyntaxRemoved;
            } else {
                // .po files use \n notation for line breaks
                const localeKey = m[1].replace('\r\n', '\n');

                // find this nugget in the locale's array of translations
                replacement = locale[localeKey];
                if (typeof (replacement) === "undefined" || replacement === "") {
                    compilation.warnings.push(
                        new Error(`Missing translation in ${filename}.\n '${m[1]}' : ${self.locale[0]}`));

                    if (self.options.alwaysRemoveBrackets) {
                        replacement = nuggetSyntaxRemoved;
                    } else {
                        continue; // leave this nugget alone
                    }
                }
            }

            // format nuggets
            var formatItemsMatch = m[0].match(/\|\|\|(.+?)(?:\/\/\/.+?)?\]\]\]/s)
            if (formatItemsMatch) {
                const formatItems = formatItemsMatch[1]
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

            // replace the source with our translations
            source = source.replace(m[0], replacement);
        }

        compilation.updateAsset(filename, new SourceMapSource(
            source,
            filename,
            originalSourceObj.map(),
            originalSource,
            null,
            true));
    }
};

module.exports = EasyI18nPlugin;
