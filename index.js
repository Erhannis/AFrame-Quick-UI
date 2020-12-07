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
require('./src/components/paint-controls.js');