import Keyboard from './keyboard.js';
import {exitFullscreen} from './utils.js';
import {MessageBox} from 'uiv';

// Number of message boxes that are currently open.
let openCount = 0;
// Whether the keyboard shortcuts were enabled before the first message box opened.
let keyboardWasEnabled = true;

function open(type, options) {
    // Exit fullscreen mode so the message box is visible. It is appended to the
    // document body and would be hidden behind a fullscreen element otherwise.
    exitFullscreen();

    // The native dialogs block all keyboard events of the page. Do the same for the
    // keyboard shortcuts so e.g. pressing "Delete" again does not open another dialog.
    if (openCount === 0) {
        keyboardWasEnabled = Keyboard.enabled;
        Keyboard.disable();
    }
    openCount += 1;

    return MessageBox[type](options)
        .finally(function () {
            openCount -= 1;
            if (openCount === 0 && keyboardWasEnabled) {
                Keyboard.enable();
            }
        });
}

function makeOptions(content, options) {
    return Object.assign({
        content: content,
        // Use regular sized dialogs instead of small ones so longer messages fit.
        size: 'md',
    }, options);
}

/**
 * Replacement for the native window.alert(). Resolves once the dialog was closed.
 *
 * @param {String} content Message to display.
 * @param {Object} options Additional options for the uiv MessageBox.
 *
 * @return {Promise}
 */
export function alert(content, options) {
    return open('alert', makeOptions(content, options))
        .then(() => undefined);
}

/**
 * Replacement for the native window.confirm(). Resolves with `true` if the user
 * confirmed and with `false` if the dialog was cancelled.
 *
 * @param {String} content Message to display.
 * @param {Object} options Additional options for the uiv MessageBox (e.g. title,
 *                         okText, okType or cancelText).
 *
 * @return {Promise<Boolean>}
 */
export function confirm(content, options) {
    return open('confirm', makeOptions(content, options))
        .then(() => true, () => false);
}

/**
 * Replacement for the native window.prompt(). Resolves with the entered value or
 * with `null` if the dialog was cancelled.
 *
 * @param {String} content Message to display.
 * @param {Object} options Additional options for the uiv MessageBox (e.g. title,
 *                         okText, defaultValue or validator).
 *
 * @return {Promise<String|null>}
 */
export function prompt(content, options) {
    return open('prompt', makeOptions(content, options))
        .then((value) => value, () => null);
}

export default {alert, confirm, prompt};
