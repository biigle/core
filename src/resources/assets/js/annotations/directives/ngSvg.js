/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name ngSVG
 * @memberOf dias.annotations
 * @description A general directive that enables manipulation of SVG 
 * attributes like `width` or `x` by Angular.
 */
angular.forEach(
	[
		'x',
		'cx',
		'y',
		'cy',
		'r',
		'width',
		'height',
		'transform'
	],
	function(name) {
		var ngName = 'ng' + name[0].toUpperCase() + name.slice(1);
		angular.module('dias.annotations').directive(ngName, function() {
			return function(scope, element, attrs) {
				attrs.$observe(ngName, function(value) {
					attrs.$set(name, value); 
				});
			};
		});
	}
);