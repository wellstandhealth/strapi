'use strict';

/**
 *
 */
module.exports = function createEventHub() {
  const subscribers = [];

  const addSubscriber = (cb) => {
    subscribers.push(cb);

    return () => {
      subscribers.splice(subscribers.indexOf(cb), 1);
    };
  };

  const emit = (...args) => {
    for (const subscriber of subscribers) {
      subscriber(...args);
    }
  };

  const removeAllSubscribers = () => {};

  return {
    emit,
    addSubscriber,
    removeAllSubscribers,
  };
};
