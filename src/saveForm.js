import BoxMaker from './boxmaker';
import {toSvg} from './util/svgExport';

export default function SaveForm(cfg) {
  const ob = {
    el: cfg.el,
    store: cfg.store,
  }

  const previewContainer = ob.el.querySelector('.preview-2d'),
        downloadSvg = ob.el.querySelector('[data-action="downloadSvg"]');

  function updateView(state) {
    if (state.showSaveDialog) {
      ob.el.classList.add('show');
    } else {
      ob.el.classList.remove('show');
      return;   // short circuit rendering when not shown
    }
    const bom = BoxMaker(state);
    const faces = bom.makeFaces2D();
    const svgString = toSvg(faces);

    previewContainer.innerHTML = svgString;
    downloadSvg.href = 'data:image/svg+xml,' + svgString;
    downloadSvg.download = 'boxo-pattern';
  }

  updateView(ob.store.get());   // initial update
  ob.store.subscribe((newState) => updateView(newState));

  ob.el.addEventListener('click', function(e) {
    if (e.target === this) {
      console.log(e);
      ob.store.update({showSaveDialog: false});
    }
  });

  return ob;
}
