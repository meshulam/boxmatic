import * as DimUtil from './util/dimension';
import SaveForm from './saveForm';

const PRESETS = {
  vinyl: {
    dimW: { value: 13, unit: 'in'},
    dimL: { value: 13, unit: 'in'},
    dimH: { value: 13, unit: 'in'},
    thickness: { value: .5, unit: 'in'},
  },
  underbed: {
    dimW: { value: 18, unit: 'in'},
    dimL: { value: 24, unit: 'in'},
    dimH: { value: 5, unit: 'in'},
    thickness: { value: .5, unit: 'in'},
  },
  eurorack: {
    dimW: { value: 14, unit: 'in'},
    dimL: { value: 5, unit: 'in'},
    dimH: { value: 5, unit: 'in'},
    thickness: { value: .25, unit: 'in'},
  },
}

// Sets the displayed value of an input based on the internal representation
// of the value
function setInput(el, value) {
  const inputKind = el.dataset.inputKind;
  if (!inputKind) {
    el.value = value;
  } else if (inputKind === 'dim') {
    el.value = DimUtil.format(value);
    el.dataset.unit = value.unit;   // Keep track of unit on element itself
  } else {
    throw new Error(`Unknown input kind: ${inputKind}`);
  }
}

// Returns the internal representation for the given field
function getInput(el) {
  const inputKind = el.dataset.inputKind;
  if (!inputKind) {
    return el.value;
  } else if (inputKind === 'dim') {
    return DimUtil.parse(el.value, el.dataset.unit);
  } else {
    throw new Error(`Unknown input kind: ${inputKind}`);
  }
}

function isValidValue(el, value) {
  const inputKind = el.dataset.inputKind;
  if (!inputKind) {
    return true;
  } else if (inputKind === 'dim') {
    return DimUtil.validate(value);
  }
  return false;
}


export default function BoxEditor(cfg) {
  const ob = {
    el: cfg.el,
    store: cfg.store,
  };
  const dimFields = Array.from(ob.el.querySelectorAll('input[data-input-kind="dim"]')),
        fields = Array.from(ob.el.querySelectorAll('input[data-field]')),
        presets = Array.from(ob.el.querySelectorAll('[data-preset]')),
        saveButton = ob.el.querySelector('[data-action="savePattern"]');

  function updateView(state) {
    fields.forEach((el) => {
      const key = el.dataset.field;
      setInput(el, state[key]);
    });
  }

  function applyPreset(ev) {
    const pre = PRESETS[ev.currentTarget.dataset.preset];
    if (pre) {
      ob.store.update(pre);
    }
  }

  function fieldChanged(ev) {
    const field = ev.target.dataset.field;
    const newVal = getInput(ev.target);

    if (!isValidValue(ev.target, newVal)) {
      ev.target.classList.add('invalid')
    } else {
      ev.target.classList.remove('invalid')
      console.log(`Setting ${field} to`, newVal)
      ob.store.update(
        {[field]: newVal}
      );
    }
  }

  updateView(ob.store.get());   // initial update
  ob.store.subscribe((newState) => updateView(newState));

  fields.forEach((el) => {
    el.addEventListener('blur', fieldChanged);
    el.addEventListener('focus', (ev) => ev.target.select());
  });
  presets.forEach((el) => {
    el.addEventListener('click', applyPreset);
  });
  saveButton.addEventListener('click', () => {
    ob.store.update({showSaveDialog: true});
  });

  return ob;
}
