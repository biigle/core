import {require} from './utils';

/**
 * Register a new Vue ViewModel based on the element ID.
 *
 * If the element does not exist, the view model will not be instanciated.
 * @param  {string}   id       Element ID
 * @param  {Function} callback Function that instanciates the view model.
 */
let viewModel = function (id, callback) {
    console.warn('The biigle.$viewModel function is deprecated. Use the mount function instead.');
    window.addEventListener('load', function () {
        var element = document.getElementById(id);
        if (element) callback(element);
    });
};

/**
 * Declare a Vue Component in a way that biigle.$require() is resolved correctly even
 * if it is called *before* the Component was declared.
 *
 * ATTENTION: Only use this function for Vue Component declarations (plain objects).
 * Not for Vue instances (new Vue), for example, because the prototype functions will
 * not be resolved!
 *
 * @param  String namespace Namespace like 'messages.message' where the last part
 *                          should be the name of the component. All components will be
 *                          added to the global biigle object.
 * @param  Object declaration Vue Component declaration object
 * @return Object
 */
let component = function (namespace, declaration) {
    console.warn('The biigle.$component function is deprecated. Use ES6 modules instead.');
    var object = require(namespace);

    if (typeof declaration === 'function') {
        declaration = declaration();
    }

    for (var prop in declaration) {
        if (!declaration.hasOwnProperty(prop)) continue;
        object[prop] = declaration[prop];
    }

    return object;
};

export {viewModel, component};
