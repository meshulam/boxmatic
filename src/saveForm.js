import BoxMaker from './boxmaker';
import {toSvg} from './util/svgExport';

export default function SaveForm(cfg) {
  const ob = {
    el: cfg.el,
    store: cfg.store,
  }

  function updateView(state) {
    //if (state.currentModal !== 'save-modal') return;

    const previewContainer = ob.el.querySelector('.preview-2d'),
          downloadSvg = ob.el.querySelector('[data-action="downloadSvg"]');

    const bom = BoxMaker(state);
    const faces = bom.makeFaces2D();
    const svgString = toSvg(faces);

    previewContainer.innerHTML = svgString;
    downloadSvg.href = 'data:image/svg+xml,' + svgString;
    downloadSvg.download = 'boxo-pattern';
  }

  updateView(ob.store.get());   // initial update
  // Don't need to subscribe since this view will be recreated
  // each time it's opened
  //ob.store.subscribe((newState) => updateView(newState));

  return ob;
}
