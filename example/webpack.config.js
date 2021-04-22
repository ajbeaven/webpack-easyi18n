const Path = require("path");
const Webpack = require("webpack");
const EasyI18nPlugin = require("../src"); //require('webpack-easyi18n')
const HtmlWebpackPlugin = require('html-webpack-plugin');

var locales = {
    "en-gb": null,
    "pt-br": "pt-BR/messages.po"
};

module.exports = Object.keys(locales).map(function (locale) {
    return {
        mode: 'development',
        entry: Path.join(__dirname, "src", "index"),
        devtool: "source-map",
        output: {
            filename: locales[locale] === null ? "js/[name].[contenthash].js" : "js/[name].[contenthash]." + locale + ".js",
            path: Path.join(__dirname, "dist"),
            publicPath: ""
        },
        plugins: [
            new HtmlWebpackPlugin({
                filename: locales[locale] === null ? 'index.html' : 'index.' + locale + '.html',
            }),
            new EasyI18nPlugin([locale, locales[locale]], {
                srcPath: Path.join(__dirname, "./src"),
                localesPath: Path.join(__dirname, "./locale"),
                includeUrls: [
                    '.html',
                    '.js'
                ]
            }),
        ]
    };
});
