/**
 * @namespace dias.projects
 * @description The DIAS projects module.
 */
angular.module('dias.projects', ['dias.core']);

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkaXJlY3RpdmVzL2NvbmZpcm1DbGljay5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLnByb2plY3RzXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgcHJvamVjdHMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycsIFsnZGlhcy5jb3JlJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMucHJvamVjdHNcbiAqIEBuZ2RvYyBkdXJlY3RpdmVcbiAqIEBuYW1lIGNvbmZpcm1DbGlja1xuICogQG1lbWJlck9mIGRpYXMucHJvamVjdHNcbiAqIEBkZXNjcmlwdGlvbiBEaXNwbGF5cyBhIGNvbmZpcm0gZGlhbG9nIHdoZW4gdGhlIGVsZW1lbnQgaXMgY2xpY2tlZC5cbiAqIFN0b3BzIHRoZSBldmVudCBwcm9wYWdhdGlvbiB3aGVuIHRoZSBjb25maXJtYXRpb24gaXMgY2FuY2VsZWQuIFRoZSBkaWFsb2dcbiAqIHRleHQgaXMgdGFrZW4gZnJvbSB0aGUgYGNvbmZpcm0tY2xpY2tgIGVsZW1lbnQgYXR0cmlidXRlLlxuICogQGV4YW1wbGVcbjxpbnB1dCBkYXRhLWNvbmZpcm0tY2xpY2s9XCJBcmUgeW91IHJlYWxseSBzdXJlP1wiIHR5cGU9XCJzdWJtaXRcIiB2YWx1ZT1cIkRlbGV0ZVwiPlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5wcm9qZWN0cycpLmRpcmVjdGl2ZSgnY29uZmlybUNsaWNrJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRyaWJ1dGVzKSB7XG5cdFx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdFx0XHR2YXIgcmVzcG9uc2UgPSBjb25maXJtKGF0dHJpYnV0ZXMuY29uZmlybUNsaWNrKTtcblxuXHRcdFx0XHRpZiAoIXJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=