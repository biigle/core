/**
 * Keyboard event handler.
 *
 * Usage:
 *
 * var kb = biigle.$require('keyboard');
 *
 * kb.on('Delete', function (event) {
 *     console.log('Something should be deleted but I never get called.');
 * });
 *
 * kb.on('Delete', function (event) {
 *     console.log('I am executed first and cancel event handling.');
 * return false;
 * }, 1);
 *
 * kb.on('Delete', function (event) {
 *     console.log('I belong to another listener set and am not active by default.')
 * }, 0, 'other-set');
 *
 * // Now only the last event listener is active.
 * kb.setActiveSet('other-set');
 */
biigle.$declare('keyboard', new Vue({
    data: {
        activeListenerSetName: 'default',
        listenerSets: {
            'default': {},
        },
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
    computed: {
        activeListenerSet: function () {
            return this.listenerSets[this.activeListenerSetName] || {};
        },
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

            if (this.activeListenerSet.hasOwnProperty(e.key)) {
                this.executeCallbacks(this.activeListenerSet[e.key], e);
            }
        },
        executeCallbacks: function (list, e) {
            // Prevent default if there are any listeners.
            e.preventDefault();
            // Go from highest priority down.
            for (var i = list.length - 1; i >= 0; i--) {
                // Callbacks can cancel further propagation.
                if (list[i].callback(e) === false) {
                    return;
                }
            }
        },
        on: function (key, callback, priority, set) {
            if (!this.isKeyIdentifier(key)) {
                console.error(key + ' is not a valid key.');
                return;
            }

            // Also register the listener for the keys of the compatibility map.
            if (this.compatibilityMap.hasOwnProperty(key)) {
                this.on(this.compatibilityMap[key], callback, priority, set);
            }

            priority = priority || 0;
            var listener = {
                callback: callback,
                priority: priority
            };

            set = set || 'default';

            if (!this.listenerSets.hasOwnProperty(set)) {
                this.listenerSets[set] = {};
            }

            var listeners = this.listenerSets[set];

            if (listeners.hasOwnProperty(key)) {
                var list = listeners[key];
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
                listeners[key] = [listener];
            }
        },
        off: function (key, callback, set) {
            set = set || 'default';
            var listeners = this.listenerSets[set];
            if (listeners && listeners.hasOwnProperty(key)) {
                var list = listeners[key];
                for (var i = list.length - 1; i >= 0; i--) {
                    if (list[i].callback === callback) {
                        list.splice(i, 1);
                        break;
                    }
                }
            }
        },
        setActiveSet: function (set) {
            this.activeListenerSetName = set;
        },
    },
    created: function () {
        // Use keydown because keypress does not fire for all keys that can be used in
        // shortcuts.
        document.body.addEventListener('keydown', this.handleKeyEvents);
    },
}));
// Legacy support of old name.
biigle.$declare('core.keyboard', biigle.$require('keyboard'));
