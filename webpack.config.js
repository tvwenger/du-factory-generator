const HtmlWebpackPlugin = require("html-webpack-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")
const TerserJSPlugin = require("terser-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const OptimizeCSSAssetsPlugin = require("css-minimizer-webpack-plugin")
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
        filename: "[name].[fullhash].js",
        ...ifProd({
            publicPath: "/du-factory-generator/",
        }),
    },
    devServer: {
        static: "./dist",
        port: 8080,
        historyApiFallback: true,
    },
    entry: "./src/main.tsx",
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            modules: {
                                exportLocalsConvention: "camelCase",
                            },
                        },
                    },
                    "sass-loader",
                ],
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
            {
                test: /\.png$/,
                use: ["file-loader"],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "./public/index.html",
        }),
        new MiniCssExtractPlugin({
            filename: "[name].[fullhash].css",
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
        minimizer: ifProd([new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})]),
    },
})
