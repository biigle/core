/**
 * Keyboard event handler.
 */
biigle.$declare('labelTrees.stores.keyboard', new Vue({
    data: {
        listeners: {},
        // Events that have these tags as target will be ignored.
        ignoredTags: ['input', 'textarea', 'select'],
    },
    methods: {
        hasListener: function (key) {
            return this.listeners.hasOwnProperty(key);
        },
        parseCharOrCode: function (coc) {
            if (typeof coc === 'string' || coc instanceof String) {
                return coc.toLowerCase();
            }

            return coc;
        },
        shouldIgnoreTarget: function (e) {
            return this.ignoredTags.indexOf(e.target.tagName.toLowerCase()) !== -1;
        },
        handleKeyEvents: function (e) {
            if (this.shouldIgnoreTarget(e)) {
                return;
            }

            var code = e.keyCode;
            var character = String.fromCharCode(e.which || code).toLowerCase();

            if (this.hasListener(code)) {
                this.executeCallbacks(code, e);
            }

            if (this.hasListener(character)) {
                this.executeCallbacks(character, e);
            }
        },
        executeCallbacks: function (key, e) {
            var list = this.listeners[key];
            // go from highest priority down
            for (var i = list.length - 1; i >= 0; i--) {
                // callbacks can cancel further propagation
                if (list[i].callback(e) === false) return;
            }
        },
        on: function (charOrCode, callback, priority) {
            charOrCode = this.parseCharOrCode(charOrCode);

            priority = priority || 0;
            var listener = {
                callback: callback,
                priority: priority
            };

            if (this.hasListener(charOrCode)) {
                var list = this.listeners[charOrCode];
                var i;

                for (i = 0; i < list.length; i++) {
                    if (list[i].priority >= priority) break;
                }

                if (i === list.length - 1) {
                    list.push(listener);
                } else {
                    list.splice(i, 0, listener);
                }

            } else {
                this.listeners[charOrCode] = [listener];
            }
        },
        off: function (charOrCode, callback) {
            charOrCode = this.parseCharOrCode(charOrCode);

            if (this.hasListener(charOrCode)) {
                var list = this.listeners[charOrCode];
                for (var i = list.length - 1; i >= 0; i--) {
                    if (list[i].callback === callback) {
                        list.splice(i, 1);
                        break;
                    }
                }
            }
        },
    },
    created: function () {
        document.body.addEventListener('keydown', this.handleKeyEvents);
    },
}));
