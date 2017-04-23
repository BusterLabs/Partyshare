const path = require('path');

module.exports = {
    entry: path.resolve(__dirname, 'src', 'ui', 'index.js'),
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'src', 'static', 'js'),
    },
    target: 'electron',
    module: {
        loaders: [
            {
                test: /\.(js|jsx)$/,
                loader: 'babel-loader',
                include: [
                    path.resolve(__dirname, 'src', 'ui'),
                ],
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
};
