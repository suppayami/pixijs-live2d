const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = [
    {
        name: 'dev',
        mode: 'development',
        entry: './demo/main.ts',
        devtool: 'inline-source-map',
        plugins: [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                title: 'Pixi.js Live2D Demo',
            }),
        ],
        output: {
            filename: 'main.bundle.js',
            path: path.resolve(__dirname, 'dist_demo'),
        },
        devServer: {
            contentBase: ['./dist_demo', './assets'],
        },
    }
].map(config => ({
    ...config,
    module: {
        rules: [
            {
                test: /\.(ts|js)$/,
                use: 'babel-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
}))