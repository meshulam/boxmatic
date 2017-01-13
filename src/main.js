import 'core-js/fn/array/from';

import Store from './store';
import ThreeView from './threeView';
import BoxEditor from './boxEditor';
import SaveForm from './saveForm';
import ModalManager from './modalManager';

window.Store = Store;   // for debugging

Store.update({
  dimW: { value: 5, unit: 'in'},
  dimL: { value: 5, unit: 'in'},
  dimH: { value: 5, unit: 'in'},
  thickness: { value: .5, unit: 'in'},
  currentModal: null,
});

const modal = document.querySelector('.modal-container');
const modalMgr = ModalManager({
  el: modal,
  store: Store,
})

const saveEl = document.getElementById('save-dialog');
const saveDialog = SaveForm({
  store: Store,
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
view3D.startAnimation();


