module.exports = {
  "presets": ["@babel/env"],
  "plugins": [
    ["module-resolver", {
      "root": ["./src"],

      // TODO More of these will be needed to match jsconfig.json depending on
      // app dependencies. Consider requiring jsconfig.json (and mapping values
      // to meet babel's config needs) to keep them in sync.
      "alias": {
        "@db": "./src/db",
        "@services": "./src/services",
        "@util": "./src/util",
        "@helpers": "./src/helpers",
      }
    }]
  ]
}
