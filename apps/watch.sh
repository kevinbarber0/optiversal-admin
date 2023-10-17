#!/bin/bash

# TODO On first run, nodemon will execute the app immediately, webpack, and then
# re-run the app

npx concurrently \
  "webpack -c webpack.server.js --env appName=$1 --watch" \
  "nodemon --watch dist/$1/main.bundle.js --exec npm run app:start $1"
