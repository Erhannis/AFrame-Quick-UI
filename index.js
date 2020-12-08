console.log("AFrameHandMenus loading");

require('aframe');
require('aframe-input-mapping-component');

require('./src/components/hand-menu.js');
require('./src/systems/ui.js');
require('./src/components/ui.js');
require('./src/components/ui-raycaster.js');

require('./src/LegacyJSONLoader.js');
require("./src/utils.js");
require('./src/components/json-model.js');
import model from './assets/models/controller_vive.json';
if (window.CONTROLLER_MODEL === undefined || window.hasOwnProperty('CONTROLLER_MODEL')) { //TODO Is hack?
  //CONTROLLER_MODEL = {src: 'assets/models/controller_vive.json'};
  window.CONTROLLER_MODEL = {data: model}; //TODO Kindof a hack
}
require('./src/components/paint-controls.js');