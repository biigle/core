/**
 * Keyboard event handler.
 */
biigle.$declare('labelTrees.stores.keyboard', new Vue({
    data: {
        // Distinguish between char and code listeners because a key event with code
        // 9 is not the same as one with char '9'!
        charListeners: {},
        codeListeners: {},
        // Events that have these tags as target will be ignored.
        ignoredTags: ['input', 'textarea', 'select'],
    },
    methods: {
        isChar: function (key) {
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

            var code = e.keyCode || e.charCode;
            var char = String.fromCharCode(e.which || code).toLowerCase();

            if (this.codeListeners.hasOwnProperty(code)) {
                this.executeCallbacks(this.codeListeners[code], e);
            }

            if (this.charListeners.hasOwnProperty(char)) {
                this.executeCallbacks(this.charListeners[char], e);
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
        document.body.addEventListener('keypress', this.handleKeyEvents);
    },
}));
