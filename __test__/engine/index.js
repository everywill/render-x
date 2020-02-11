const fs = require('fs');
const path = require('path');
const { xEngine, xInstance } = require('../../dist/x-render.umd');
var Konva = require('konva-node');

const frameworkBundle = path.join(__dirname + '../../../dist/js-framework.umd.js');

xEngine.initSDKEnvironment(frameworkBundle);

const ins = new xInstance();

ins.frame = new Konva.Stage({
  width: 100,
  height: 200
});

fs.readFile(path.join(__dirname + '/js-bundle.js'), function(error, data) {
  if (error) throw error;
  ins.renderWithBundleString(data.toString());
});
