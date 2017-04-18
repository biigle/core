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
    window.addEventListener('load', function () {
        var element = document.getElementById(id);
        if (element) callback(element);
    });
};

/**
 * Require an object under a specific namespace.
 * If it doesn't exist yet, it will be created.
 *
 * @param  String|Array namespace Namespace like 'messages.message' or
 *                                ['messages', 'message']
 * @return Object
 */
biigle.$require = function (namespace) {
    namespace = Array.isArray(namespace) ? namespace : namespace.split('.');
    var object = biigle;
    for (var i = 0, j = namespace.length; i < j; i++) {
        object[namespace[i]] = object[namespace[i]] || {};
        object = object[namespace[i]];
    }

    return object;
};


/**
 * Declare an object in the namespace even if the namespace doesn't exist yet
 *
 * @param  String namespace Namespace like 'messages.message' where the last part
 *                          should be the name of the component. All components will be
 *                          added to the global biigle object.
 * @param  Object object Object to declare. If it is a function, the function will be
 *                       called and expected to return the object.
 * @return Object
 */
biigle.$declare = function (namespace, object) {
    namespace = namespace.split('.');
    var name = namespace.pop();
    var parent = biigle.$require(namespace);
    parent[name] = (typeof object === 'function') ? object() : object;

    return object;
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
biigle.$component = function (namespace, declaration) {
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
