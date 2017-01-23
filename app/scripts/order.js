
export default function OrderView(cfg) {
  const ob = {
    el: cfg.el,
    store: cfg.store,
  }

  const state = ob.store.get();
  const stateStr = JSON.stringify(state);

  const cfgInput = ob.el.querySelector('#mce-BOXCFG');
  cfgInput.value = stateStr;

  return ob;
}
