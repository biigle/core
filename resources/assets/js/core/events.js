import mitt from 'mitt';

/**
 * Global event bus
 */
const bus = mitt();

const emit = bus.emit;
bus.emit = function () {
    if (arguments.length > 2) {
        throw new Error('The events.emit() method does not support more than two arguments.');
    }

    return emit(...arguments);
};

// Vue 2 legacy support.
bus.$on = function () {
    console.warn('The events.$on() method is deprecated. Use events.on() instead.');
    return bus.on(...arguments);
};

// Vue 2 legacy support.
bus.$emit = function () {
    console.warn('The events.$emit() method is deprecated. Use events.emit() instead.');
    return bus.emit(...arguments);
};

// Once polyfill. See: https://github.com/developit/mitt/issues/136#issuecomment-977934794
bus.once = (type, handler) => {
    const fn = (...args) => {
      bus.off(type, fn);
      handler(args);
    };

    return bus.on(type, fn);
};

// Vue 2 legacy support.
bus.$once = function () {
    console.warn('The events.$once() method is deprecated. Use events.once() instead.');
    return bus.once(...arguments);
};

export default bus;
