import type { Configuration } from "webpack";

import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import path from "node:path";
import url from "node:url";
import hmr from "webpack";
import RouteManifestPlugin from "webpack-route-manifest";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

const hotMiddlewareScript = "webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true";

const mode          = process.env.NODE_ENV === "production" ? "production" : "development";
const isDevelopment = mode === "development";

const sharedPlugins = [
  new RouteManifestPlugin({
    inline: false,
    filename: "route-manifest.json",
    routes: (file) => {
      file = file.replace(path.join(dirname, "../src"), "").replace(/\.[tj]sx?$/, "");

      if (!file.includes("/pages/")) return "*";
      const name = "/" + file.replace("./pages/", "").toLowerCase();
      return name === "/home" ? "/" : name;
    },
  }),
];

const devPlugins = [
  new hmr.HotModuleReplacementPlugin({}),
  new ReactRefreshWebpackPlugin({
    overlay: {
      sockIntegration: "whm",
    },
  }),
];

const plugins = isDevelopment ? [...sharedPlugins, ...devPlugins] : sharedPlugins;

const main = isDevelopment ? ["./src/client.tsx", hotMiddlewareScript] : ["./src/client.tsx"];

const contentHash = isDevelopment ? "" : "?v=[contenthash:8]";

const client: Configuration = {
  mode,
  entry: { main },
  output: {
    path: path.resolve(dirname, "./dist"),
    filename: `[name].js${contentHash}`,
    chunkFilename: `[name].chunk.js${contentHash}`,
    publicPath: "/",
  },
  devtool: isDevelopment ? "inline-source-map" : undefined,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              plugins: ["babel-plugin-styled-components", ...(isDevelopment ? ["react-refresh/babel"] : [])],
              presets: [["@babel/preset-react", { runtime: "automatic" }]],
            },
          },
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  resolve: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".jsx": [".tsx", ".jsx"],
    },
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
        },
        default: {
          name: "default",
          minChunks: 2,
          enforce: true,
        },
      },
    },
  },
  plugins,
};

export default client;
