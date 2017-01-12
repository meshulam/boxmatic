
const state = {};
const subscribers = [];

// Returns a shallow copy of the state object
function get() {
  return Object.assign({}, state);
}

function update(newCfg) {
  let changed = false;

  // detect when no changes were made (should mostly work)
  Object.keys(newCfg).forEach((key) => {
    const newVal = newCfg[key];
    if (newVal !== state[key] &&
        JSON.stringify(newVal) !== JSON.stringify(state[key])) {
      state[key] = newVal;
      changed = true;
    }
  });

  if (changed) {
    subscribers.forEach(subscriber => {
      subscriber(state);
    });
  }
}


function subscribe(subscriber) {
  if (subscribers.indexOf(subscriber) < 0) {
    subscribers.push(subscriber);
  }
}

function unsubscribe(subscriber) {
  const ind = subscribers.indexOf(subscriber);
  if (ind >= 0) {
    subscribers.splice(ind, 1);
  }
}

export default {
  update,
  subscribe,
  unsubscribe,
  get,
}

