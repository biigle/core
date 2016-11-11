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
