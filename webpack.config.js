const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const extractCSSPlugin = new ExtractTextPlugin({
    filename: 'css/[name].css',
    allChunks: true,
});


module.exports = {
    entry: path.resolve(__dirname, 'src', 'ui', 'index.js'),
    output: {
        filename: 'js/bundle.js',
        path: path.resolve(__dirname, 'src', 'static'),
    },
    target: 'electron',
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                loader: 'babel-loader',
                include: [
                    path.resolve(__dirname, 'src', 'ui'),
                ],
            },
            {
                test: /\.(css|scss)$/,
                loader: extractCSSPlugin.extract({
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                modules: true,
                                importLoaders: 2,
                                localIdentName: '[name]--[local]___[hash:base64:5]',
                            },
                        },
                    ],
                }),
            },
        ],
    },
    resolve: {
        alias: {
            'react': 'preact-compat',
            'react-dom': 'preact-compat',
        },
        modules: [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, 'src', 'ui'),
            path.resolve(__dirname, 'src', 'electron'),
        ],
        extensions: ['.js', '.jsx'],
    },
    plugins: [extractCSSPlugin],
};
