/**
 * Keyboard event handler.
 */
biigle.$declare('keyboard', new Vue({
    data: {
        listeners: {},
        // Some browsers fire non-standard keys. This map maps standard keys to
        // non-standard keys so their event listeners are also added.
        // see: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
        compatibilityMap: {
            'Hyper': 'OS',
            'Meta': 'OS',
            'ScrollLock': 'Scroll',
            'Super': 'OS',
            ' ': 'Spacebar',
            'ArrowDown': 'Down',
            'ArrowLeft': 'Left',
            'ArrowRight': 'Right',
            'ArrowUp': 'Up',
            'CrSel': 'Crsel',
            'Delete': 'Del',
            'ExSel': 'Exsel',
            'ContextMenu': 'Apps',
            'Escape': 'Esc',
        },
        // Events that have these tags as target will be ignored.
        ignoredTags: [
            'input',
            'textarea',
            'select'
        ],
    },
    methods: {
        isKeyIdentifier: function (key) {
            return typeof key === 'string' || key instanceof String;
        },
        shouldIgnoreTarget: function (e) {
            return this.ignoredTags.indexOf(e.target.tagName.toLowerCase()) !== -1;
        },
        handleKeyEvents: function (e) {
            e = e || event; // see: http://stackoverflow.com/a/5630990/1796523
            if (this.shouldIgnoreTarget(e)) {
                return;
            }

            if (this.listeners.hasOwnProperty(e.key)) {
                this.executeCallbacks(this.listeners[e.key], e);
            }
        },
        executeCallbacks: function (list, e) {
            // go from highest priority down
            for (var i = list.length - 1; i >= 0; i--) {
                // callbacks can cancel further propagation
                if (list[i].callback(e) === false) return;
            }
        },
        on: function (key, callback, priority) {
            if (!this.isKeyIdentifier(key)) {
                console.error(key + ' is not a valid key.');
                return;
            }

            // Also register the listener for the keys of the compatibility map.
            if (this.compatibilityMap.hasOwnProperty(key)) {
                this.on(this.compatibilityMap[key], callback, priority);
            }

            priority = priority || 0;
            var listener = {
                callback: callback,
                priority: priority
            };

            if (this.listeners.hasOwnProperty(key)) {
                var list = this.listeners[key];
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
                this.listeners[key] = [listener];
            }
        },
        off: function (key, callback) {
            if (this.listeners.hasOwnProperty(key)) {
                var list = this.listeners[key];
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
        // We use keypress because it handles the numpad keys correctly.
        document.body.addEventListener('keypress', this.handleKeyEvents);
    },
}));
// Legacy support of old name.
biigle.$declare('core.keyboard', biigle.$require('keyboard'));
