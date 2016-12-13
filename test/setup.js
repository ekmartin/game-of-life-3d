import fs from 'fs';
import { createEventTarget } from './utils';

require.extensions['.glsl'] = (shaderModule, filePath) => {
  const content = fs.readFileSync(filePath).toString();
  shaderModule.exports = content;
  return shaderModule;
};

global.window = createEventTarget();
global.document = createEventTarget();
