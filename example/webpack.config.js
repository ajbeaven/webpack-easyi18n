const Path = require("path");
const Webpack = require("webpack");
const I18N = require("../src"); //require('webpack-i18n')

var Locales = {
    "en-gb": null,
    "pt-br": "pt-BR/messages.po"
};

module.exports = Object.keys(Locales).map(function(locale) {

    var plugins = [];

    return {
        mode: 'development',
        entry: Path.join(__dirname, "src", "index"),
        devtool: "source-map",
        output: {
            filename: Locales[locale] === null ? "js/[name].[hash].js" : "js/[name].[hash]." + locale + ".js",
            path: Path.join(__dirname, "dist"),
            publicPath: ""
        },
        plugins: plugins.concat([
            new I18N([locale, Locales[locale]], {
                srcPath: Path.join(__dirname, "./src"),
                localesPath: Path.join(__dirname, "./Locale"),
                regex: /\[\[\[(.+?)(?:\|\|\|(.+?))*(?:\/\/\/(.+?))?\]\]\]/g
            })
        ])
    };
});
