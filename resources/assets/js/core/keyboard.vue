<script>
/**
 * Keyboard event handler.
 *
 * Usage:
 *
 * let kb = biigle.$require('keyboard');
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
export default new Vue({
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
        activeListenerSet() {
            return this.listenerSets[this.activeListenerSetName] || {};
        },
        pressedKeys() {
            return this.pressedKeysArray.slice().sort().join('+');
        },
    },
    methods: {
        isKeyIdentifier(key) {
            return typeof key === 'string' || key instanceof String;
        },
        prepareKeys(keys) {
            if (!Array.isArray(keys)) {
                keys = keys.split('+');
            }

            return keys.slice()
                .map((key) => {
                    if (!this.isKeyIdentifier(key)) {
                        throw `${key} is not a valid key.`;
                    }

                    return key.toLowerCase();
                })
                .sort();
        },
        shouldIgnoreTarget(e) {
            return this.ignoredTags.indexOf(e.target.tagName.toLowerCase()) !== -1;
        },
        handleKeyDown(e) {
            e = e || event; // see: http://stackoverflow.com/a/5630990/1796523
            if (this.shouldIgnoreTarget(e)) {
                return;
            }

            if (!e.repeat) {
                this.pressedKeysArray.push(e.key.toLowerCase());
            }
            // Sometimes a modifier key is still pressed when the page is loaded (e.g.
            // if the user travelled back in browser history using the keys). Check for
            // meta keys on each keypress to get the correct set of pressed keys in these
            // cases.
            this.maybeInjectModifierKeys(e);
            this.handleKeyEvents(e, this.pressedKeys);
        },
        maybeInjectModifierKeys(e) {
            if (e.altKey && this.pressedKeysArray.indexOf('alt') === -1) {
                this.pressedKeysArray.push('alt');
            }
            if (e.ctrlKey && this.pressedKeysArray.indexOf('control') === -1) {
                this.pressedKeysArray.push('control');
            }
            if (e.metaKey && this.pressedKeysArray.indexOf('meta') === -1) {
                this.pressedKeysArray.push('meta');
            }
            if (e.shiftKey && this.pressedKeysArray.indexOf('shift') === -1) {
                this.pressedKeysArray.push('shift');
            }
        },
        handleKeyUp(e) {
            let index = this.pressedKeysArray.indexOf(e.key.toLowerCase());
            if (index !== -1) {
                this.pressedKeysArray.splice(index, 1);
            }
        },
        handleKeyEvents(e, keys) {
            if (this.activeListenerSet.hasOwnProperty(keys)) {
                this.executeCallbacks(this.activeListenerSet[keys], e);
            }
        },
        clearPressedKeys() {
            this.pressedKeysArray = [];
        },
        executeCallbacks(list, e) {
            // Prevent default if there are any listeners.
            e.preventDefault();
            // Go from highest priority down.
            for (let i = list.length - 1; i >= 0; i--) {
                // Callbacks can cancel further propagation.
                if (list[i].callback(e) === false) {
                    return;
                }
            }
        },
        on(keys, callback, priority, set) {
            keys = this.prepareKeys(keys);
            let listenerKeys = keys.join('+');

            // Also register the listener for the keys of the compatibility map.
            this.compatibilityMaps.forEach((map) => {
                let compatKeys = keys.map(function (key) {
                    return map.hasOwnProperty(key) ? map[key] : key;
                });
                if (listenerKeys !== compatKeys.join('+')) {
                    this.on(compatKeys, callback, priority, set);
                }
            });

            priority = priority || 0;
            let listener = {
                callback: callback,
                priority: priority
            };

            set = set || 'default';

            if (!this.listenerSets.hasOwnProperty(set)) {
                this.listenerSets[set] = {};
            }

            let listeners = this.listenerSets[set];

            if (listeners.hasOwnProperty(listenerKeys)) {
                let list = listeners[listenerKeys];
                let i;

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
        off(keys, callback, set) {
            keys = this.prepareKeys(keys).join('+');
            set = set || 'default';
            let listeners = this.listenerSets[set];
            if (listeners && listeners.hasOwnProperty(keys)) {
                let list = listeners[keys];
                for (let i = list.length - 1; i >= 0; i--) {
                    if (list[i].callback === callback) {
                        list.splice(i, 1);
                        break;
                    }
                }
            }
        },
        setActiveSet(set) {
            this.activeListenerSetName = set;
        },
    },
    created() {
        // Use keydown because keypress does not fire for all keys that can be used in
        // shortcuts.
        document.body.addEventListener('keydown', this.handleKeyDown);
        document.body.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('focus', this.clearPressedKeys);
    },
});
</script>
