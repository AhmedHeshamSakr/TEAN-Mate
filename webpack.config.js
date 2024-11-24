import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  entry: {
    content: './4-content/content.js',
    background: './3-background/background.js',
    sidebar: './1-sidebar/sidebar.js'
  },
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
                ['@babel/plugin-transform-runtime', {
                  corejs: 3,
                  regenerator: true
                }]
              ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    alias: {
      '@features': resolve(__dirname, '2-features'),
      '@background': resolve(__dirname, '3-background'),
      '@content': resolve(__dirname, '4-content'),
      '@common': resolve(__dirname, '5-common'),
      '@sidebar': resolve(__dirname, '1-sidebar'),
    },
    extensions: ['.js', '.css']
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: '1-sidebar/sidebar.html',
          to: 'sidebar.html'
        },
        {
          from: '1-sidebar/sidebar.css',
          to: 'sidebar.css'
        },
        { from: './dist/sidebar.bundle.js', 
          to: 'sidebar.bundle.js' 
        },
        {
          from: 'manifest.json',
          to: 'manifest.json'
        }
      ]
    })
  ],
  devServer: {
    static: {
      directory: resolve(__dirname, 'dist')
    },
    host: 'localhost',
    port: 8080,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    client: {
      webSocketURL: {
        hostname: 'localhost',
        port: 8080,
      },
    },
    hot: true,
    liveReload: true,
    devMiddleware: {
      writeToDisk: true
    }
  }
};