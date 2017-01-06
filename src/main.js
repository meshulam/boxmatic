import Store from './store';
import ThreeView from './threeView';
import BoxEditor from './boxEditor';

window.Store = Store;   // for debugging

Store.update({
  dimW: { value: 13, unit: 'in'},
  dimL: { value: 13, unit: 'in'},
  dimH: { value: 13, unit: 'in'},
  thickness: { value: .5, unit: 'in'},
});

const editorEl = document.getElementById('editor');
const editor = BoxEditor({
  el: editorEl,
  store: Store,
});

const view3DEl = document.getElementById('preview-3d');
const view3D = ThreeView({
  el: view3DEl,
});
view3D.render();


