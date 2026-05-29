'use strict';
window.SA = window.SA || {};

SA.EventBus = (function() {
  const listeners = {};

  return {
    on(event, fn) {
      (listeners[event] = listeners[event] || []).push(fn);
      return () => this.off(event, fn);
    },
    off(event, fn) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(f => f !== fn);
    },
    emit(event, data) {
      (listeners[event] || []).slice().forEach(fn => fn(data));
    },
    once(event, fn) {
      const wrapper = (data) => { fn(data); this.off(event, wrapper); };
      this.on(event, wrapper);
    },
    clear() {
      Object.keys(listeners).forEach(k => delete listeners[k]);
    }
  };
})();
