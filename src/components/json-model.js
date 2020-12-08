/* globals AFRAME THREE */

AFRAME.registerComponent('json-model', {
  schema: {
    src: {type: 'asset'} // Or:
    ,data: {type: 'array'} //TODO Is this how you do this?
  },

  init: function () {
    this.objectLoader = new THREE.ObjectLoader();
    this.objectLoader.setCrossOrigin('');
  },

  update: function (oldData) {
    var self = this;
    let callback = function (group) {
      var Rotation = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
      group.traverse(function (child) {
        if (!(child instanceof THREE.Mesh)) { return; }
        child.position.applyMatrix4(Rotation);
      });
      self.el.setObject3D('mesh', group);
      self.el.emit('model-loaded', {format: 'json', model: group, src: src});
    };
    if (!(!this.data.src || this.data.src === oldData.src)) {
      var src = this.data.src;
      this.objectLoader.load(this.data.src, callback);
    } else if (!(!this.data.data || this.data.data === oldData.data)) { //TODO Does the second one do anything?
      this.objectLoader.parse(this.data.data, callback);
    }
  }
});