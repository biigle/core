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
        // non-standard keys so their event listeners are also added. Every key is
        // converted to lowercase.
        // see: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
        compatibilityMaps: [
            // Firefox
            {
                'hyper': 'os',
                'meta': 'os',
                'super': 'os',
            },
            // InternetExplorer
            {
                'meta': 'os',
                'scrolllock': 'Scroll',
                ' ': 'spacebar',
                'arrowdown': 'down',
                'arrowleft': 'left',
                'arrowright': 'right',
                'arrowup': 'up',
                'crsel': 'crsel',
                'delete': 'del',
                'exsel': 'exsel',
                'contextmenu': 'apps',
                'escape': 'esc',
            },
        ],
        // Events that have these tags as target will be ignored.
        ignoredTags: [
            'input',
            'textarea',
            'select'
        ],
        pressedKeysArray: [],
    },
    computed: {
        activeListenerSet: function () {
            return this.listenerSets[this.activeListenerSetName] || {};
        },
        pressedKeys: function () {
            return this.pressedKeysArray.slice().sort().join('+');
        },
    },
    methods: {
        isKeyIdentifier: function (key) {
            return typeof key === 'string' || key instanceof String;
        },
        prepareKeys: function (keys) {
            if (!Array.isArray(keys)) {
                keys = keys.split('+');
            }

            return keys.slice()
                .map(function (key) {
                    if (!this.isKeyIdentifier(key)) {
                        throw key + ' is not a valid key.';
                    }

                    return key.toLowerCase();
                }, this)
                .sort();
        },
        shouldIgnoreTarget: function (e) {
            return this.ignoredTags.indexOf(e.target.tagName.toLowerCase()) !== -1;
        },
        handleKeyDown: function (e) {
            e = e || event; // see: http://stackoverflow.com/a/5630990/1796523
            if (this.shouldIgnoreTarget(e)) {
                return;
            }

            this.pressedKeysArray.push(e.key.toLowerCase());
            this.handleKeyEvents(e, this.pressedKeys);
        },
        handleKeyUp: function (e) {
            var index = this.pressedKeysArray.indexOf(e.key.toLowerCase());
            if (index !== -1) {
                this.pressedKeysArray.splice(index, 1);
            }
        },
        handleKeyEvents: function (e, keys) {
            if (this.activeListenerSet.hasOwnProperty(keys)) {
                this.executeCallbacks(this.activeListenerSet[keys], e);
            }
        },
        clearPressedKeys: function () {
            this.pressedKeysArray = [];
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
        on: function (keys, callback, priority, set) {
            keys = this.prepareKeys(keys);
            var listenerKeys = keys.join('+');

            // Also register the listener for the keys of the compatibility map.
            this.compatibilityMaps.forEach(function (map) {
                var compatKeys = keys.map(function (key) {
                    return map.hasOwnProperty(key) ? map[key] : key;
                });
                if (listenerKeys !== compatKeys.join('+')) {
                    this.on(compatKeys, callback, priority, set);
                }
            }, this);

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

            if (listeners.hasOwnProperty(listenerKeys)) {
                var list = listeners[listenerKeys];
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
                listeners[listenerKeys] = [listener];
            }
        },
        off: function (keys, callback, set) {
            keys = this.prepareKeys(keys).join('+');
            var listeners = this.listenerSets[set];
            if (listeners && listeners.hasOwnProperty(keys)) {
                var list = listeners[keys];
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
        document.body.addEventListener('keydown', this.handleKeyDown);
        document.body.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('focus', this.clearPressedKeys);
    },
}));
// Legacy support of old name.
biigle.$declare('core.keyboard', biigle.$require('keyboard'));
