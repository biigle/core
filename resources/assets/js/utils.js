import { createApp } from 'vue'

/**
 * Mount a Vue viewmodel to an element with a given ID if the element exists.
 *
 * @param string id
 * @param Object vm
 */
let mount = function (id, vm) {
    window.addEventListener('load', function () {
        let element = document.getElementById(id);
        if (element) {
            const app = createApp(vm);
            // Vue 2 compatibility.
            app.config.compilerOptions.whitespace = 'preserve';
            app.mount(element)
        }
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
let require = function (namespace) {
    namespace = Array.isArray(namespace) ? namespace : namespace.split('.');
    if (!window.biigle) {
        window.biigle = {};
    }

    let object = window.biigle;
    for (let i = 0, j = namespace.length; i < j; i++) {
        if (!object.hasOwnProperty(namespace[i])) {
            object[namespace[i]] = {};
        }
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
let declare = function (namespace, object) {
    namespace = namespace.split('.');
    let name = namespace.pop();
    let parent = require(namespace);
    parent[name] = object;

    return object;
};

export {mount, require, declare};
