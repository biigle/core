/**
 * @namespace biigle.ui.utils
 * @ngdoc service
 * @name keyboard
 * @memberOf biigle.ui.utils
 * @description Service to register and manage keypress events with priorities
 */
angular.module('biigle.ui.utils').service('keyboard', function ($document) {
        "use strict";

        // maps key codes/characters to arrays of listeners
        var charListeners = {};
        var codeListeners = {};
        var body = $document[0].body;

        var executeCallbacks = function (list, e) {
            // go from highest priority down
            for (var i = list.length - 1; i >= 0; i--) {
                // callbacks can cancel further propagation
                if (list[i].callback(e) === false) return;
            }
        };

        var handleKeyEvents = function (e) {
            e = e || event; // IE compatibility
            if (e.target !== body) {
                // don't do anything if e.g. the user types into an input field
                return;
            }

            var code = e.keyCode;
            var character = String.fromCharCode(e.which || code).toLowerCase();

            if (codeListeners[code]) {
                executeCallbacks(codeListeners[code], e);
            }

            if (charListeners[character]) {
                executeCallbacks(charListeners[character], e);
            }
        };

        $document.bind('keypress', handleKeyEvents);

        // register a new event listener for the key code or character with an optional priority
        // listeners with higher priority are called first anc can return 'false' to prevent the
        // listeners with lower priority from being called
        this.on = function (charOrCode, callback, priority) {
            var listeners = codeListeners;
            if (typeof charOrCode === 'string' || charOrCode instanceof String) {
                charOrCode = charOrCode.toLowerCase();
                listeners = charListeners;
            }

            priority = priority || 0;
            var listener = {
                callback: callback,
                priority: priority
            };

            if (listeners[charOrCode]) {
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
        };

        // unregister an event listener
        this.off = function (charOrCode, callback) {
            var listeners = codeListeners;
            if (typeof charOrCode === 'string' || charOrCode instanceof String) {
                charOrCode = charOrCode.toLowerCase();
                listeners = charListeners;
            }

            if (listeners[charOrCode]) {
                var list = listeners[charOrCode];
                for (var i = 0; i < list.length; i++) {
                    if (list[i].callback === callback) {
                        list.splice(i, 1);
                        break;
                    }
                }
            }
        };
    }
);
