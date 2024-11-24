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
      },
      {
        test: /\.wasm$/,
        type: 'javascript/auto',
        use: {
            loader: 'file-loader',
        },
      },
      {
        test: /\.(onnx|json)$/,
        use: [
          {
              loader: 'file-loader',
              options: {
                  name: '[name].[hash].[ext]', // Output file name
                  outputPath: 'assets/', // Output folder
              },
          },
        ],
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
        },
        {
          from: '2-features/TTS/voices.json',
          to: 'TTS/voices.json'
        },
        {
          from: '2-features/TTS/piper_phonemize.js',
          to: 'TTS/piper_phonemize.js'
        },
        {
          from: '2-features/TTS/voices_models',
          to: 'TTS/voices_models'
        },
        {
          from: '2-features/TTS/piper_phonemize.wasm',
          to: 'TTS/piper_phonemize.wasm'
        },
        {
          from: '2-features/TTS/piper_phonemize.data',
          to: 'TTS/piper_phonemize.data'
        },
        {
          from: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm',
          to: 'ort-wasm-simd-threaded.wasm'
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