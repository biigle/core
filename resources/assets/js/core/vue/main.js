/**
 * The global application object that will contain all JS components.
 *
 * @type {Object}
 */
biigle = {};

/**
 * Register a new Vue ViewModel based on the element ID.
 *
 * If the element does not exist, the view model will not be instanciated.
 * @param  {string}   id       Element ID
 * @param  {Function} callback Function that instanciates the view model.
 */
biigle.$viewModel = function (id, callback) {
    var element = document.getElementById(id);
    window.addEventListener('load', function () {
        if (element) callback(element);
    });
};

/**
 * Require an object under a specific namespace
 *
 * If it doesn't exist yet, it will be created. This can be used to declare
 * interdependent objects (like Vue components) in arbitrary ordering.
 *
 * @param  String namespace Namespace like 'messages.message'
 * @return Object
 */
biigle.$require = function (namespace) {
    var object = biigle;
    var namepsace = namespace.split('.');
    for (var i = 0, j = namepsace.length; i < j; i++) {
        object[namepsace[i]] = object[namepsace[i]] || {};
        object = object[namepsace[i]];
    }

    return object;
};

/**
 * Register a (local Vue) component that can be biigle.$require()'d
 *
 * This works for any object, not just Vue components.
 *
 * @param  String namespace Namespace like 'messages.message' where the last part
 *                          should be the name of the component. All components will be
 *                          added to the global biigle object.
 * @param  Object declaration (Vue) component declaration. If it is a function, it will
 *                            be called and expected to return the declaration.
 * @return Object Reference to the component object returned by biigle.$require
 */
biigle.$declare = function (namespace, declaration) {
    var object = biigle.$require(namespace);
    if (typeof declaration === 'function') {
        declaration = declaration();
    }

    for (var prop in declaration) {
        if (!declaration.hasOwnProperty(prop)) continue;
        object[prop] = declaration[prop];
    }

    return object;
};
