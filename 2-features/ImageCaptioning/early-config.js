import * as transformers from '@huggingface/transformers';
transformers.env.allowLocalModels = true;
import { env } from '@huggingface/transformers';
env.allowRemoteModels = false;
env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('onnx-runtime/');
