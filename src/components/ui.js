/* globals AFRAME THREE */
AFRAME.registerComponent('ui', {
  schema: { brightness: { default: 1.0, max: 1.0, min: 0.0 } },
  dependencies: ['ui-raycaster'],

  init: function () {
    console.log("ui init");

    var el = this.el;
    var uiEl = this.uiEl = document.createElement('a-entity');
    uiEl.ui = this; //TODO Hack?  Or acceptable?
    var rayEl = this.rayEl = document.createElement('a-entity');
    this.closed = true;
    this.isTooltipPaused = false;
    this.bindMethods();
    this.intersectedObjects = [];
    this.hoveredOffObjects = [];
    this.hoveredOnObjects = [];
    this.pressedObjects = {};
    this.selectedObjects = {};
    this.unpressedObjects = {};
    this.resettedObjects = new Set();
    this.overriddenObjects = new Set();
    this.rayAngle = 45;
    this.rayDistance = 0.2; //TODO Optionize?

    // UI entity setup
    uiEl.setAttribute('position', '0 0.04 -0.15');
    uiEl.setAttribute('scale', '0 0 0');
    uiEl.setAttribute('visible', false);
    uiEl.classList.add('ui-container');
    el.appendChild(uiEl);

    // Emit request for UI elements to be created
    console.log("ui requestforui tx");
    el.emit("requestforui", {uiEl: uiEl});

    // Ray entity setup
    rayEl.setAttribute('line', '');

    //rayEl.setAttribute('visible', false);
    el.appendChild(rayEl);

    // Raycaster setup
    el.setAttribute('ui-raycaster', {
      far: this.rayDistance,
      objects: '.ui-container',
      rotation: -this.rayAngle
    });

    // Setup default mapping
    var mappings = {
      behaviours: {},
      mappings: {
        ui_default: {
          common: {
          },

          'vive-controls': {
            'menu.down': 'toggleMenu', //TODO Important

            // Teleport
            // 'trackpad.down': 'aim', //TODO Should this be included?
            // 'trackpad.up': 'teleport'  // It seems useful, but also, not really UI
          },

          'oculus-touch-controls': {
            'abutton.down': 'toggleMenu',
            'xbutton.down': 'toggleMenu',

            // Teleport
            // 'ybutton.down': 'aim',
            // 'ybutton.up': 'teleport',

            // 'bbutton.down': 'aim',
            // 'bbutton.up': 'teleport'
          },

          'windows-motion-controls': {
            'menu.down': 'toggleMenu',

            // Teleport
            // 'trackpad.down': 'aim',
            // 'trackpad.up': 'teleport'
          },
        }
      }
    };
    el.sceneEl.addEventListener('loaded', function() {
      AFRAME.registerInputMappings(mappings);
      AFRAME.currentInputMapping = 'ui_default';
    });

    this.controller = null;

    var self = this;

    el.addEventListener('controllerconnected', function (evt) {
      var controllerName = evt.detail.name;
      self.tooltips = Utils.getTooltips(controllerName);
      self.controller = {
        name: controllerName,
        hand: evt.detail.component.data.hand
      }

      if (controllerName === 'oculus-touch-controls') {
        self.uiEl.setAttribute('rotation', '45 0 0');
        uiEl.setAttribute('position', '0 0.13 -0.08');
        self.rayAngle = 0;
        el.setAttribute('ui-raycaster', {
          rotation: 0
        });
      } else if (controllerName === 'windows-motion-controls') {
        self.rayAngle = 25;
        self.rayDistance = 1;
        el.setAttribute('ui-raycaster', {
          rotation: -30,
          far: self.rayDistance
        });
      }

      if (self.el.isPlaying) {
        self.addToggleEvent();
      }
    });
  },

  bindMethods: function () {
    this.onComponentChanged = this.onComponentChanged.bind(this);
    this.onTriggerChanged = this.onTriggerChanged.bind(this);
    this.onIntersection = this.onIntersection.bind(this);
    this.onIntersected = this.onIntersected.bind(this);
    this.onIntersectionCleared = this.onIntersectionCleared.bind(this);
    this.onIntersectedCleared = this.onIntersectedCleared.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
  },

  tick: function () {
    // Hack until https://github.com/aframevr/aframe/issues/1886
    // is fixed.
    this.el.components['ui-raycaster'].refreshObjects(); //TODO Is that issue fixed?
    if (!this.closed && this.handEl) {
      this.updateIntersections();
      this.handleHover();
      this.handlePressedButtons();
    }
  },

  onTriggerChanged: function (evt) {
    var triggerValue = evt.detail.value;
    this.lastTriggerValue = triggerValue;
    if (evt.detail.value >= 0.25) {
      this.triggeredPressed = true;
    } else {
      this.triggeredPressed = false;
      this.handleButtonUp();
    }
  },

  handleButtonDown: function (object, position) {
    var name = object.name; //TODO UH.  None of these buttons have names.  How is this working at all?
    if (this.activeWidget && this.activeWidget !== name) { return; } //TODO What is this?
    this.activeWidget = undefined;
    var callback;
    if (this.pressedObjects[name]) {
      callback = object.el.oncontrollerhold;
    } else {
      callback = object.el.oncontrollerdown;
    }
    if (callback) {
      callback.call(object.el, object, position);
      this.activeWidget = name; //TODO Should this not be in the if-block?
    }
    this.pressedObjects[name] = object;
  },

  handleButtonUp: function () {
    var pressedObjects = this.pressedObjects;
    var unpressedObjects = this.unpressedObjects;
    this.activeWidget = undefined;
    Object.keys(pressedObjects).forEach(function (key) {
      var callback = pressedObjects[key].el.oncontrollerup;
      if (callback) {
        callback(pressedObjects[key]);
      }
      var buttonName = pressedObjects[key].name;
      unpressedObjects[buttonName] = pressedObjects[buttonName];
      delete pressedObjects[buttonName];
    });
  },

  handlePressedButtons: function () {
    var self = this;
    if (!this.triggeredPressed) { return; }
    this.hoveredOnObjects.forEach(function triggerAction (button) {
      self.handleButtonDown(button.object, button.point);
    });
  },

  handleHover: function () {
    this.updateHoverObjects();
    this.updateMaterials();
  },

  updateHoverObjects: function () {
    var intersectedObjects = this.intersectedObjects;
    this.hoveredOffObjects = this.hoveredOnObjects.filter(function (obj) {
      return intersectedObjects.indexOf(obj) === -1;
    });
    this.hoveredOnObjects = intersectedObjects;
  },

  updateMaterials: (function () {
    var point = new THREE.Vector3();
    return function () {
      var self = this;
      var pressedObjects = this.pressedObjects;
      if (!this.triggeredPressed);
      var unpressedObjects = this.unpressedObjects;
      var selectedObjects = this.selectedObjects; //TODO It would probably be better to use this than override
      // Remove hover highlights
      this.hoveredOffObjects.forEach(function (obj) {
        var object = obj.object;
        if (object.el.materials && object.el.materials.normal) {
          object.el.setAttribute("material", object.el.materials.normal);
        }
      });
      // Add highlight to newly intersected objects
      this.hoveredOnObjects.forEach(function (obj) {
        var object = obj.object;
        point.copy(obj.point);
        // Update ray
        self.handRayEl.object3D.worldToLocal(point);
        self.handRayEl.setAttribute('line', 'end', point);
        if (object.el.materials && object.el.materials.hover) {
          object.el.setAttribute("material", object.el.materials.hover);
        }
      });
      // Pressed Material
      Object.keys(pressedObjects).forEach(function (key) {
        var object = pressedObjects[key];
        if (object.el.materials && object.el.materials.pressed) {
          object.el.setAttribute("material", object.el.materials.pressed);
        }
      });
      // Unpressed Material
      Object.keys(unpressedObjects).forEach(function (key) {
        var object = unpressedObjects[key];
        if (object.el.materials && object.el.materials.normal) {
          object.el.setAttribute("material", object.el.materials.normal);
        }
        delete unpressedObjects[key];
      });
      // Selected material
      Object.keys(selectedObjects).forEach(function (key) {
        var object = selectedObjects[key];
        if (object.el.materials && object.el.materials.selected) {
          object.el.setAttribute("material", object.el.materials.selected);
        }
      });
      // Resetted materials
      this.resettedObjects.forEach(function (object) {
        if (object.materials && object.materials.normal) {
          object.setAttribute("material", object.materials.normal);
        }
      });
      this.resettedObjects.clear();
      // Apply material overrides //TODO Not called at the right times?  Too heavy?  We could try to make this run only when something changes - atm it runs every tick or something
      this.overriddenObjects.forEach(function (object) {
        if (object.materials && object.materials.override) {
          object.setAttribute("material", object.materials.override);
        }
      });
    };
  })(),

  addToggleEvent: function () {
    this.el.addEventListener('toggleMenu', this.toggleMenu);
  },

  removeToggleEvent: function () {
    this.el.removeEventListener('toggleMenu', this.toggleMenu);
  },

  play: function () {
    var el = this.el;
    var handEl = this.handEl;
    if (this.controller) {
      this.addToggleEvent();
    }

    el.addEventListener('raycaster-intersection', this.onIntersection);
    el.addEventListener('raycaster-intersection-cleared', this.onIntersectionCleared);
    el.addEventListener('raycaster-intersected', this.onIntersected);
    el.addEventListener('raycaster-intersected-cleared', this.onIntersectedCleared);
    if (!handEl) { return; }
    this.addHandListeners();
  },

  pause: function () {
    var el = this.el;
    var handEl = this.handEl;

    if (this.controller) {
      this.removeToggleEvent();
    }

    el.removeEventListener('raycaster-intersection', this.onIntersection);
    el.removeEventListener('raycaster-intersection-cleared', this.onIntersectionCleared);
    el.removeEventListener('raycaster-intersected', this.onIntersected);
    el.removeEventListener('raycaster-intersected-cleared', this.onIntersectedCleared);
    if (!handEl) { return; }
    this.removeHandListeners();
  },

  toggleMenu: function (evt) {
    if (this.closed) {
      this.system.closeAll();
      this.open();
      this.system.opened = this.el;
    } else {
      this.close();
      this.system.opened = undefined;
    }
  },

  open: function () {
    var uiEl = this.uiEl;
    // var coords = { x: 0, y: 0, z: 0 };
    // var tween;
    if (!this.closed) { return; }
    this.uiEl.setAttribute('visible', true);

    AFRAME.ANIME({
      targets: uiEl,
      translateX: [0, 1],
      translateY: [0, 1],
      translateZ: [0, 1],
      easing: 'easeOutExpo',
      duration: 100,
      update(anim) {
        const newScale = {
          x: anim.animations[0].currentValue,
          y: anim.animations[1].currentValue,
          z: anim.animations[2].currentValue,
        };

        uiEl.setAttribute('scale', newScale);
      },
      complete() {
      },
    });

    // tween = new AFRAME.TWEEN.Tween(coords)
    //     .to({ x: 1, y: 1, z: 1 }, 100)
    //     .onUpdate(function () {
    //       uiEl.setAttribute('scale', this);
    //     })
    //     .easing(AFRAME.TWEEN.Easing.Exponential.Out);
    // tween.start();
    this.el.setAttribute('brush', 'enabled', false);
    this.rayEl.setAttribute('visible', false);
    this.closed = false;

    if (!!this.tooltips) {
      var self = this;
      this.tooltips.forEach(function (tooltip) {
        if (tooltip.getAttribute('visible') && uiEl.parentEl.id !== tooltip.parentEl.id) {
          self.isTooltipPaused = true;
          tooltip.setAttribute('visible', false);
        }
      });
    }
    this.playSound('ui_menu');
  },

  updateIntersections: (function () {
    var raycaster = this.raycaster = new THREE.Raycaster();
    return function (evt) {
      this.updateRaycaster(raycaster);
      this.intersectedObjects = raycaster.intersectObjects(this.menuEls, true);
    };
  })(),

  onIntersection: function (evt) {
    var visible = this.closed && this.system.opened;
    //if (this.el.components.brush.active) { return; } //TODO
    this.rayEl.setAttribute('visible', !!visible);
    //this.el.setAttribute('brush', 'enabled', false); //TODO
  },

  onIntersected: function (evt) {
    var handEl = evt.detail.el;
    // Remove listeners of previous hand
    if (this.handEl) { this.removeHandListeners(); }
    this.handEl = handEl;
    this.handRayEl = this.handEl.components.ui.rayEl;
    this.menuEls = this.uiEl.object3D.children;
    this.syncUI();
    this.addHandListeners();
  },

  addHandListeners: function () {
    var handEl = this.handEl;
    handEl.addEventListener('componentchanged', this.onComponentChanged);
    handEl.addEventListener('triggerchanged', this.onTriggerChanged);
  },

  removeHandListeners: function () {
    var handEl = this.handEl;
    handEl.removeEventListener('componentchanged', this.onComponentChanged);
    handEl.removeEventListener('triggerchanged', this.onTriggerChanged);
  },

  onComponentChanged: function (evt) {
    //this.syncUI();
  },

  // I think this is for, like, when you have manually drawn/dynamic components or something?
  syncUI: function () {
  },

  onIntersectionCleared: function () {
    this.checkMenuIntersections = false;
    this.rayEl.setAttribute('visible', false);
    this.el.setAttribute('brush', 'enabled', true);
  },

  onIntersectedCleared: function (evt) {
    if (!this.handEl) { return; }
    this.handEl.removeEventListener('triggerchanged', this.onTriggerChanged);
    this.onTriggerChanged({detail:{value:0}});
  },

  updateRaycaster: (function () {
    var direction = new THREE.Vector3();
    var directionHelper = new THREE.Quaternion();
    var scaleDummy = new THREE.Vector3();
    var originVec3 = new THREE.Vector3();

    // Closure to make quaternion/vector3 objects private.
    return function (raycaster) {
      var object3D = this.handEl.object3D;

      // Update matrix world.
      object3D.updateMatrixWorld();
      // Grab the position and rotation.
      object3D.matrixWorld.decompose(originVec3, directionHelper, scaleDummy);
      // Apply rotation to a 0, 0, -1 vector.
      direction.set(0, 0, -1);
      direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), -(this.rayAngle / 360) * 2 * Math.PI);
      direction.applyQuaternion(directionHelper);
      raycaster.far = this.rayDistance;
      raycaster.set(originVec3, direction);
    };
  })(),

  close: function () {
    var uiEl = this.uiEl;
    // var coords = { x: 1, y: 1, z: 1 };
    // var tween;
    if (this.closed) { return; }

    AFRAME.ANIME({
      targets: uiEl,
      translateX: [1, 0],
      translateY: [1, 0],
      translateZ: [1, 0],
      easing: 'easeInExpo',
      duration: 100,
      update(anim) {
        const newScale = {
          x: anim.animations[0].currentValue,
          y: anim.animations[1].currentValue,
          z: anim.animations[2].currentValue,
        };

        uiEl.setAttribute('scale', newScale);
      },
      complete() {
      },
    });

    // tween = new AFRAME.TWEEN.Tween(coords)
    //     .to({ x: 0, y: 0, z: 0 }, 100)
    //     .onUpdate(function () {
    //       uiEl.setAttribute('scale', this);
    //     })
    //     .onComplete(function () {
    //       uiEl.setAttribute('visible', false);
    //     })
    //     .easing(AFRAME.TWEEN.Easing.Exponential.Out);
    // tween.start();
    this.el.setAttribute('brush', 'enabled', true);
    this.closed = true;

    if (!!this.tooltips && this.isTooltipPaused) {
      this.isTooltipPaused = false;
      this.tooltips.forEach(function (tooltip) {
        tooltip.setAttribute('visible', true);
      });
    }
    this.playSound('ui_menu');
  },

  playSound: function (sound, objName) { //TODO Doesn't like quick repeats
    if (objName === undefined || !this.pressedObjects[objName]) {
      let soundEl = document.getElementById(sound);
      if (soundEl) {
        soundEl.play();
      }
    }
  }
});
