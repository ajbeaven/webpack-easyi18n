# webpack-easyi18n
### Go from [gettext](https://en.wikipedia.org/wiki/Gettext) catalog (.po files) to embeded localization in your Webpack bundles.

```bash
npm install --save-dev webpack-easyi18n
```
Designed for use with [EasyI18n].

### Usage

To localize text in your application, surround your strings with [[[ and ]]] markup characters to mark them as translatable. We call these snippets 'nuggets':

```js
document.write("[[[Login using]]]");
```

Make your translations (for example using [Poedit](https://poedit.net/)) to create the .po files

Add the easy plugin to your Webpack config (notice the 'Locales' variable that indicates language/.po location):

```js
const Path = require("path");
const Webpack = require("webpack");
const EasyI18nPlugin = require("webpack-easyi18n");

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
            new EasyI18nPlugin([locale, Locales[locale]], {
                srcPath: Path.join(__dirname, "./src"),
                localesPath: Path.join(__dirname, "./Locale")
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
|**`alwaysRemoveBrackets`**|`{Boolean}`| If alwaysRemoveBrackets is true and a nugget is missing a translation, then the original string is retained but the brackets are removed _(default:false)_|

A 'webpack-easyi18n-temp' directory beneath you locales directory is created on each Webpack build. There is no need to deploy this directory to production and can be removed, for example using rimraf and the WebpackShellPlugin:

```js
new WebpackShellPlugin({ onBuildStart: ['echo "Webpack Start"'], onBuildEnd: ['rimraf ./locales/webpack-easyi18n-temp'] })
```
