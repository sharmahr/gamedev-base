const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
  const mode = argv.mode || "development";
  const isDev = mode === "development";
  const apiTarget = process.env.WEBPACK_API_URL || "http://localhost:8000";

  return {
    mode,
    entry: "./src/main.jsx",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "assets/[name].[contenthash:8].js",
      publicPath: "/",
      clean: true,
    },
    resolve: {
      extensions: [".js", ".jsx"],
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env",
                ["@babel/preset-react", { runtime: "automatic" }],
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
      }),
    ],
    devServer: {
      host: "0.0.0.0",
      port: 5173,
      hot: true,
      historyApiFallback: true,
      proxy: [
        {
          context: ["/api"],
          target: apiTarget,
          changeOrigin: true,
        },
      ],
    },
    devtool: isDev ? "eval-source-map" : "source-map",
  };
};
