// dedicated to node

const { parentPort } = require('worker_threads');

global.parentPort = parentPort;

parentPort.on('message', ({cmd, data}) => {
  // console.log(`js-framework: received message, cmd: ${cmd}\n`);
  // console.log('data:\n');
  // console.log(JSON.stringify(data, null, 2));
  // console.log('---');
  switch (cmd) {
    case 'invokeMethod':
      const { name, args } = data;
      global[name](...args);
  }
});

import framework from './frameworks/vanilla';
import { init, config } from './runtime/index';

global = global || globalThis;

config.framework = framework;
const globalMethods = init(config);

for (let methodName in globalMethods) {
  global[methodName] = (...args) => {
    const ret = globalMethods[methodName](...args);
    if (ret instanceof Error) {
      console.error(ret.toString());
    }
    return ret;
  }
}