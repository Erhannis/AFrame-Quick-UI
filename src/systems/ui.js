/* globals AFRAME */
AFRAME.registerSystem('ui', {
  init: function () {
  },

  closeAll: function () {
    var els = document.querySelectorAll('[ui]');
    var i;
    for (i = 0; i < els.length; i++) {
      els[i].components.ui.close();
    }
  }
});
