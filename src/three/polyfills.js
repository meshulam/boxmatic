/*
 * Methods I think should be in ThreeJs
 */

if (typeof THREE.MultiMaterial.prototype.set !== 'function') {

  THREE.MultiMaterial.prototype.set = function(prop, value) {

    var materials = this.materials;

    for ( var i = 0, l = materials.length; i < l; i ++ ) {

      materials[i][prop] = value;

    }

  }

}
