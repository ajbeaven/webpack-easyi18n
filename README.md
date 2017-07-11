# webpack-i18n
### Go from [gettext](https://en.wikipedia.org/wiki/Gettext) catalog (.po files) to embeded localization in your Webpack bundles.

```bash
npm install --save-dev webpack-i18n
```
Originally designed for use with [turquoiseowl/i18n](https://github.com/turquoiseowl/i18n) but should work with any .po file generation mechanism.

### Usage

To localize text in your application, surround your strings with [[[ and ]]] markup characters to mark them as translatable:

```js
document.write("[[[Login using]]]");
```

Make your translations (for example using [Poedit](https://poedit.net/)) to create the .po files

Add the webpack-i18n plugin to your Webpack config (notice the 'Locales' variable that indicates language/.po location):

```js
const Path = require("path");
const Webpack = require("webpack");
const I18N = require("webpack-i18n");

var Locales = {
    "en-gb": null, // Your application default language
    "pt-br": "pt-BR/messages.po"
};

module.exports = Object.keys(Locales).map(function(locale) {

    var plugins = [];

    return {
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
```

### Options

|Name|Type|Description|
|:--:|:--:|:----------|
|**`srcPath`**|`{String}`|Directory that should be used to locate your source files with strings for replacement _(required)_|
|**`localesPath`**|`{String}`|Directory containing the po files as referenced by 'Locales'  _(required)_|
|**`regex`**|`{String}`| The delimiter token sequence _(default:[[[]]])_|

A 'webpack-i18n-temp' directory beneath you locales directory is created on each Webpack build. There is no need to deploy this directory to production and can be removed, for example using rimraf and the WebpackShellPlugin:

```js
new WebpackShellPlugin({ onBuildStart: ['echo "Webpack Start"'], onBuildEnd: ['rimraf ./locales/webpack-i18n-temp'] })
```
