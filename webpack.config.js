const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
    name: 'browser',
    mode: 'production',
    entry: './src/pixi_live2d.ts',
    devtool: 'source-map',
    plugins: [new CleanWebpackPlugin()],
    output: {
        filename: 'pixi_live2d.browser.js',
        path: path.resolve(__dirname, 'dist'),
        library: ['PIXI', 'live2d'],
        libraryTarget: 'umd',
    },
    externals: {
        fs: 'fs',
        'pixi.js': 'PIXI',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'babel-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
}
