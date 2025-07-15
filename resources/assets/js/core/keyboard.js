// Some browsers fire non-standard keys. This map maps standard keys to
// non-standard keys so their event listeners are also added. Every key is
// converted to lowercase.
// see: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
const COMPAT_MAPS = [
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
];

// Events that have these tags as target will be ignored.
const IGNORED_TAGS = [
    'input',
    'textarea',
    'select'
];

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
class Keyboard {
    constructor() {
        this.activeListenerSetName = 'default';
        this.listenerSets = {
            'default': {},
        };
        this.pressedKeysSet = new Set();

        // Use keydown because keypress does not fire for all keys that can be used in
        // shortcuts.
        document.body.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.body.addEventListener('keyup', this.handleKeyUp.bind(this));
        window.addEventListener('focus', this.clearPressedKeys.bind(this));
    }

    get activeListenerSet() {
        return this.listenerSets[this.activeListenerSetName] || {};
    }

    get pressedKeys() {
        return Array.from(this.pressedKeysSet).sort().join('+');
    }

    isKeyIdentifier(key) {
        return typeof key === 'string' || key instanceof String;
    }

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
    }

    shouldIgnoreTarget(e) {
        return IGNORED_TAGS.indexOf(e.target.tagName.toLowerCase()) !== -1;
    }

    handleKeyDown(e) {
        e = e || event; // see: http://stackoverflow.com/a/5630990/1796523
        if (this.shouldIgnoreTarget(e)) {
            return;
        }

        this.pressedKeysSet.add(e.key.toLowerCase());

        // Sometimes a modifier key is still pressed when the page is loaded (e.g.
        // if the user travelled back in browser history using the keys). Check for
        // meta keys on each keypress to get the correct set of pressed keys in these
        // cases.
        this.maybeInjectModifierKeys(e);
        this.handleKeyEvents(e, this.pressedKeys);
    }

    maybeInjectModifierKeys(e) {
        if (e.altKey) {
            this.pressedKeysSet.add('alt');
        }
        if (e.ctrlKey) {
            this.pressedKeysSet.add('control');
        }
        if (e.metaKey) {
            this.pressedKeysSet.add('meta');
        }
        if (e.shiftKey) {
            this.pressedKeysSet.add('shift');
        }
    }

    handleKeyUp(e) {
        this.pressedKeysSet.delete(e.key.toLowerCase());
    }

    handleKeyEvents(e, keys) {
        if (this.activeListenerSet.hasOwnProperty(keys)) {
            this.executeCallbacks(this.activeListenerSet[keys], e);
        }
    }

    clearPressedKeys() {
        this.pressedKeysSet.clear();
    }

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
    }

    on(keys, callback, priority, set) {
        keys = this.prepareKeys(keys);
        let listenerKeys = keys.join('+');

        // Also register the listener for the keys of the compatibility map.
        COMPAT_MAPS.forEach((map) => {
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
    }

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
    }

    setActiveSet(set) {
        this.activeListenerSetName = set;
    }
}

export default new Keyboard();
