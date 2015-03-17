/**
 * @namespace dias.projects
 * @ngdoc durective
 * @name confirmClick
 * @memberOf dias.projects
 * @description Displays a confirm dialog when the element is clicked.
 * Stops the event propagation when the confirmation is canceled. The dialog
 * text is taken from the `confirm-click` element attribute.
 * @example
<input data-confirm-click="Are you really sure?" type="submit" value="Delete">
 */
angular.module('dias.projects').directive('confirmClick', function () {
	return {
		restrict: 'A',
		link: function (scope, element, attributes) {
			element.on('click', function (event) {
				var response = confirm(attributes.confirmClick);

				if (!response) {
					event.preventDefault();
					event.stopPropagation();
				}
			});
		}
	};
});
