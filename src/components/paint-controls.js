/* globals AFRAME THREE */
AFRAME.registerComponent('paint-controls', {
  dependencies: ['brush'],

  schema: {
    hand: {default: 'left'}
  },

  init: function () {
    var el = this.el;
    var self = this;
    var tooltips = null;
    this.controller = null;
    this.modelLoaded = false;

    this.onModelLoaded = this.onModelLoaded.bind(this);
    el.addEventListener('model-loaded', this.onModelLoaded);

    el.addEventListener('controllerconnected', function (evt) {
      var controllerName = evt.detail.name;
      if (controllerName === 'windows-motion-controls')
      {
        var gltfName = evt.detail.component.el.components['gltf-model'].data;
        const SAMSUNG_DEVICE = '045E-065D';
        if (!!gltfName)
        {
          if (gltfName.indexOf(SAMSUNG_DEVICE) >= 0)
          {
            controllerName = "windows-motion-samsung-controls";
          }
        }
      }

      tooltips = Utils.getTooltips(controllerName);
      if (controllerName.indexOf('windows-motion') >= 0) {
        // el.setAttribute('teleport-controls', {button: 'trackpad'});
      } else if (controllerName === 'oculus-touch-controls') {
        var hand = evt.detail.component.data.hand;
        //el.setAttribute('teleport-controls', {button: hand === 'left' ? 'ybutton' : 'bbutton'});
        el.setAttribute('obj-model', {obj: 'assets/models/oculus-' + hand + '-controller.obj', mtl: 'https://cdn.aframe.io/controllers/oculus/oculus-touch-controller-' + hand + '.mtl'});
      } else if (controllerName === 'vive-controls') {
        el.setAttribute('json-model', {src: 'assets/models/controller_vive.json'});
      } else { return; }

      if (!!tooltips) {
        tooltips.forEach(function (tooltip) {
          tooltip.setAttribute('visible', true);
        });
      }

      this.controller = controllerName;
    });
  },

  // buttonId
  // 0 - trackpad
  // 1 - trigger ( intensity value from 0.5 to 1 )
  // 2 - grip
  // 3 - menu ( dispatch but better for menu options )
  // 4 - system ( never dispatched on this layer )
  mapping: {
    axis0: 'trackpad',
    axis1: 'trackpad',
    button0: 'trackpad',
    button1: 'trigger',
    button2: 'grip',
    button3: 'menu',
    button4: 'system'
  },

  update: function () {
    var data = this.data;
    var el = this.el;
    el.setAttribute('vive-controls', {hand: data.hand, model: false});
    el.setAttribute('oculus-touch-controls', {hand: data.hand, model: false});
    el.setAttribute('windows-motion-controls', {hand: data.hand});
  },

  play: function () {
  },

  pause: function () {
  },

  onModelLoaded: function (evt) {
    if (evt.target !== this.el) { return; }

    var controllerObject3D = evt.detail.model;
    var buttonMeshes;
    
    buttonMeshes = this.buttonMeshes = {};

    buttonMeshes.sizeHint = controllerObject3D.getObjectByName('sizehint');
    buttonMeshes.colorTip = controllerObject3D.getObjectByName('tip');

    this.modelLoaded = true;
  },

  onButtonEvent: function (id, evtName) {
    var buttonName = this.mapping['button' + id];
    this.el.emit(buttonName + evtName);
    this.updateModel(buttonName, evtName);
  },

  updateModel: function (buttonName, state) {
    var material = state === 'up' ? this.material : this.highLightMaterial;
    var buttonMeshes = this.buttonMeshes;
    var button = buttonMeshes && buttonMeshes[buttonName];
    if (state === 'down' && button && !this.material) {
      material = this.material = button.material;
    }
    if (!material) { return; }
    if (buttonName === 'grip') {
      buttonMeshes.grip.left.material = material;
      buttonMeshes.grip.right.material = material;
      return;
    }
    if (!button) { return; }
    button.material = material;
  }
});
