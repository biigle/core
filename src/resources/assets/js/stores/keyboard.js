/**
 * Keyboard event handler.
 */
biigle.$declare('labelTrees.stores.keyboard', new Vue({
    data: {
        // Distinguish between char and code listeners because a key event with code
        // 9 is not the same as one with char '9'!
        charListeners: {},
        codeListeners: {},
        // Key codes that should be handled on the keydown event rather than keypress.
        // This is because of the behavior of Chrome and IE not to fire keypress on some
        // keys (like the arrow keys).
        keyDownCodes: [37, 38, 39, 40],
        keyDownListeners: {},
        // Events that have these tags as target will be ignored.
        ignoredTags: ['input', 'textarea', 'select'],
    },
    methods: {
        isChar: function (key) {
            return typeof key === 'string' || key instanceof String;
        },
        isKeyDownCode: function (code) {
            return this.keyDownCodes.indexOf(code) !== -1;
        },
        shouldIgnoreTarget: function (e) {
            return this.ignoredTags.indexOf(e.target.tagName.toLowerCase()) !== -1;
        },
        handleKeyEvents: function (e) {
            e = e || event; // see: http://stackoverflow.com/a/5630990/1796523
            if (this.shouldIgnoreTarget(e)) {
                return;
            }

            var code = e.keyCode || e.charCode;
            var char = String.fromCharCode(e.which || code).toLowerCase();

            if (this.codeListeners.hasOwnProperty(code)) {
                this.executeCallbacks(this.codeListeners[code], e);
            }

            if (this.charListeners.hasOwnProperty(char)) {
                this.executeCallbacks(this.charListeners[char], e);
            }
        },
        handleKeyDownEvents: function (e) {
            e = e || event; // see: http://stackoverflow.com/a/5630990/1796523
            if (this.shouldIgnoreTarget(e)) {
                return;
            }

            var code = e.keyCode || e.charCode;

            if (this.keyDownListeners.hasOwnProperty(code)) {
                this.executeCallbacks(this.keyDownListeners[code], e);
            }
        },
        executeCallbacks: function (list, e) {
            // go from highest priority down
            for (var i = list.length - 1; i >= 0; i--) {
                // callbacks can cancel further propagation
                if (list[i].callback(e) === false) return;
            }
        },
        on: function (charOrCode, callback, priority) {
            var listeners = this.codeListeners;
            if (this.isChar(charOrCode)) {
                listeners = this.charListeners;
                charOrCode = charOrCode.toLowerCase();
            } else if (this.isKeyDownCode(charOrCode)) {
                listeners = this.keyDownListeners;
            }

            priority = priority || 0;
            var listener = {
                callback: callback,
                priority: priority
            };

            if (listeners.hasOwnProperty(charOrCode)) {
                var list = listeners[charOrCode];
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
                listeners[charOrCode] = [listener];
            }
        },
        off: function (charOrCode, callback) {
            var listeners = this.codeListeners;
            if (this.isChar(charOrCode)) {
                listeners = this.charListeners;
                charOrCode = charOrCode.toLowerCase();
            } else if (this.isKeyDownCode(charOrCode)) {
                listeners = this.keyDownListeners;
            }

            if (listeners.hasOwnProperty(charOrCode)) {
                var list = listeners[charOrCode];
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
        // Keydown is only used in special cases where keypress doesn't fire.
        document.body.addEventListener('keydown', this.handleKeyDownEvents);
    },
}));
