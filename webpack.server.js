const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = env => {
  const appName = env.appName;
  return {
    mode: 'development',
    target: 'node',
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    entry: `./apps/${appName}/src/main.js`,
    output: {
      path: path.resolve(__dirname, 'dist', appName),
      filename: 'main.bundle.js',
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              configFile: path.resolve(__dirname, 'babel.server.js'),
              presets: [
                // Exporting cjs modules addresses the mixed use of import /
                // module.exports across existing dashboard src.
                //
                // Error: TypeError: Cannot assign to read only property 'exports' of object '#<Object>'
                //
                // See https://babeljs.io/docs/babel-preset-env#modules
                ['@babel/preset-env', { modules: 'commonjs' }]
              ]
            }
          }
        }
      ]
    }
  };
};
