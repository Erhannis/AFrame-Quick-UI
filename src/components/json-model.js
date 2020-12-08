/* globals AFRAME THREE */

AFRAME.registerComponent('json-model', {
  schema: {
    src: {type: 'asset'} // Or:
    //,data: {type: 'object'} //TODO Is this how you do this?
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
    } else if (!(!this.attrValue.data || this.attrValue.data === oldData.data)) { //TODO What's the difference between this.data and this.attrValue?  Why did one end up one place and the other end up the other?  //TODO Does the second one do anything?
      this.objectLoader.parse(this.attrValue.data, callback);
    }
  }
});
