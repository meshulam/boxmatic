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
    const bom = BoxMaker(state);
    const faces = bom.makeFaces2D();
    previewContainer.innerHTML = toSvg(faces);
  }

  updateView(ob.store.get());   // initial update
  ob.store.subscribe((newState) => updateView(newState));

  return ob;
}
