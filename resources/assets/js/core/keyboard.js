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
 *
 * You can define listeners for key combinations, too:
 *
 * kb.on('Control+A');
 *
 * Instead of "event.key" values to define listeners, you can also use "event.code" values
 * for listeners that are independent from the keyboard layout and language. Example:
 *
 * kb.on('Alt+Backquote');
 *
 * Note that modifier keys such as Alt, Control, etc. are still identified by their "event.key"
 * value here and not by "event.code" (AltLeft, ControlLeft, etc.).
 */
class Keyboard {
    constructor() {
        this.activeListenerSetName = 'default';
        this.listenerSets = {
            'default': {},
        };
        this.pressedKeysSet = new Set();
        this.pressedCodesSet = new Set();

        // Use keydown because keypress does not fire for all keys that can be used in
        // shortcuts.
        document.body.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.body.addEventListener('keyup', this.handleKeyUp.bind(this));
        window.addEventListener('blur', this.clearPressedKeys.bind(this));
    }

    get activeListenerSet() {
        return this.listenerSets[this.activeListenerSetName] || {};
    }

    get pressedKeys() {
        return Array.from(this.pressedKeysSet).sort().join('+');
    }

    get pressedCodes() {
        return Array.from(this.pressedCodesSet).sort().join('+');
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
        this.pressedCodesSet.add(e.code.toLowerCase());

        // Sometimes a modifier key is still pressed when the page is loaded (e.g.
        // if the user travelled back in browser history using the keys). Check for
        // meta keys on each keypress to get the correct set of pressed keys in these
        // cases.
        this.maybeInjectModifierKeys(e);

        this.handleKeyEvents(e, this.pressedKeys);

        // Some keys are the same as codes. Only execute the codes listeners if they are
        // actually different.
        if (this.pressedKeys !== this.pressedCodes) {
            this.handleKeyEvents(e, this.pressedCodes);
        }

        // Similarly, modifier keys must be removed immediately, e.g. in case a "switch
        // window" key combination was pressed. Otherwise the modifier keys would stick
        // forever.
        this.maybeRemoveModifierKeys(e);
    }

    maybeInjectModifierKeys(e) {
        if (e.altKey) {
            this.pressedKeysSet.add('alt');
            this.pressedCodesSet.add('alt');
        }
        if (e.ctrlKey) {
            this.pressedKeysSet.add('control');
            this.pressedCodesSet.add('control');
        }
        if (e.metaKey) {
            this.pressedKeysSet.add('meta');
            this.pressedCodesSet.add('meta');
        }
        if (e.shiftKey) {
            this.pressedKeysSet.add('shift');
            this.pressedCodesSet.add('shift');
        }
    }

    maybeRemoveModifierKeys(e) {
        if (e.altKey) {
            this.pressedKeysSet.delete('alt');
            this.pressedKeysSet.delete('alt');
        }
        if (e.ctrlKey) {
            this.pressedKeysSet.delete('control');
            this.pressedKeysSet.delete('control');
        }
        if (e.metaKey) {
            this.pressedKeysSet.delete('meta');
            this.pressedKeysSet.delete('meta');
        }
        if (e.shiftKey) {
            this.pressedKeysSet.delete('shift');
            this.pressedKeysSet.delete('shift');
        }
    }

    handleKeyUp(e) {
        this.pressedKeysSet.delete(e.key.toLowerCase());
        this.pressedCodesSet.delete(e.code.toLowerCase());
    }

    handleKeyEvents(e, keys) {
        if (this.activeListenerSet.hasOwnProperty(keys)) {
            this.executeCallbacks(this.activeListenerSet[keys], e);
        }
    }

    clearPressedKeys() {
        this.pressedKeysSet.clear();
        this.pressedCodesSet.clear();
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

        // Return callback to unlisten for convenience.
        return () => this.off(keys, callback, set);
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
