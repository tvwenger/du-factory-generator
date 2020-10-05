const HtmlWebpackPlugin = require("html-webpack-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")
const path = require("path")

module.exports = ({ ifDev, ifProd }) => ({
    ...ifDev({
        mode: "development",
        devtool: "eval-source-map",
    }),
    ...ifProd({
        mode: "production",
        devtool: "source-map",
    }),
    output: {
        path: path.join(__dirname, "./dist"),
        filename: "[name].[hash].js",
        ...ifProd({
            publicPath: "/du-factory-planer/",
        }),
    },
    devServer: {
        publicPath: "/",
        contentBase: "./dist",
        port: 8080,
        historyApiFallback: true,
    },
    entry: "./src/main.ts",
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "./public/index.html",
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: "static",
            openAnalyzer: false,
        }),
    ],
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /node_modules/,
                    chunks: "initial",
                    name: "vendor",
                },
            },
        },
    },
})