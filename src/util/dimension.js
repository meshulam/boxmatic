
export const UNIT = {
  'in': {
    'id': 'in',
    'name': 'inch',
    'scale': 25.4,
  },
  'mm': {
    'id': 'mm',
    'name': 'millimeter',
    'scale': 1,
  },
  'cm': {
    'id': 'cm',
    'name': 'centimeter',
    'scale': 10,
  }
}

// Functions for parsing/formatting dimensions.

export function validate(dimObj) {
  if (typeof dimObj === 'object' &&
      typeof dimObj.value === 'number' &&
      typeof dimObj.unit === 'string' &&
      UNIT.hasOwnProperty(dimObj.unit)) {
    return dimObj;
  }

  return false;
}

const dimRegex = /([\d\.\,-]+)\s*(\w*)/;

export function parse(dimString, defaultUnit) {
  // ignore unknown default units
  defaultUnit = UNIT.hasOwnProperty(defaultUnit) ? defaultUnit : undefined;

  if (typeof dimString === 'number' && defaultUnit) {
    return {
      value: dimString,
      unit: defaultUnit,
    }
  }

  if (typeof dimString === 'object') {
    return validate(dimString);
  }

  if (typeof dimString === 'string') {
    const num = parseFloat(dimString);  // Ignores trailing chars
    const res = /([A-Za-z]+)\s*$/.exec(dimString);
    const unit = (res && res[1] && UNIT.hasOwnProperty(res[1].toLowerCase())) ?
      res[1] : defaultUnit;

    if (num && unit) {
      return {
        value: num,
        unit: unit
      }
    }
  }
}

export function format(dimObj) {
  return validate(dimObj) ?
    `${dimObj.value} ${dimObj.unit}` :
    '';
}

// Normalize to default units
export function norm(dimObj) {
  if (validate(dimObj)) {
    return dimObj.value*UNIT[dimObj.unit].scale;
  }
  return;
}

export function normalizeDimensions(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = norm(obj[key]) || obj[key];
    return acc;
  }, {});
}
