
const state = {};
const subscribers = [];

function get() {
  return state;
}

function update(newCfg) {
  Object.assign(state, newCfg);
  // TODO: detect when no changes were made
  subscribers.forEach(subscriber => {
    console.log("Calling subscriber on state change")
    subscriber(state);
  });
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

