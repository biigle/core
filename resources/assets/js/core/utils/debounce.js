/**
 * Waits until the debounce wasn't called for 'wait' ms with the id until the callback
 * is executed. If it is contiuously called, the callback is not executed.
 */
biigle.$declare('utils.debounce', function () {
    var debounceTimeouts = {};
    return function (callback, wait, id) {
        if (debounceTimeouts.hasOwnProperty(id)) {
            window.clearTimeout(debounceTimeouts[id]);
        }
        debounceTimeouts[id] = window.setTimeout(callback, wait);
    };
});
