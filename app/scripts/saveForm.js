import BoxMaker from './boxmaker';
import {layoutSvg} from './util/svgExport';

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
    const shapes = bom.parts.map(part => part.shape);
    const svgString = layoutSvg(shapes);

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
