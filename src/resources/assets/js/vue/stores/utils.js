/**
 * Store for utility functions
 */
biigle.$declare('annotations.stores.utils', function () {
    var debounceTimeouts = {};
    return {
        debounce: function (callback, wait, id) {
            if (debounceTimeouts.hasOwnProperty(id)) {
                clearTimeout(debounceTimeouts[id]);
            }
            debounceTimeouts[id] = setTimeout(callback, wait);
        },
    };
});
