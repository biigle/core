/**
 * @namespace dias.transects
 * @description The DIAS transects module.
 */
angular.module('dias.transects', ['dias.api']);

/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectTransectController
 * @memberOf dias.projects
 * @description Controller for a single transect in the transect list of the
 * project index page.
 */
try {
angular.module('dias.projects').controller('ProjectTransectController', ["$scope", "$element", "$modal", "ProjectTransect", "msg", function ($scope, $element, $modal, ProjectTransect, msg) {
		"use strict";

		var showConfirmationModal = function () {
			var modalInstance = $modal.open({
				templateUrl: 'confirmDeleteTransectModal.html',
				size: 'sm'
			});

			return modalInstance;
		};

		var removeSuccess = function () {
			$scope.removeTransect($scope.$index);
		};

		var removeError = function (response) {
			if (response.status === 400) {
				showConfirmationModal().result.then(function (result) {
					if (result == 'force') {
						$scope.remove(true);
					} else {
						$scope.cancelRemove();
					}
				});
			} else {
				msg.responseError(response);
			}
		};

		$scope.startRemove = function () {
			$scope.removing = true;
		};

		$scope.cancelRemove = function () {
			$scope.removing = false;
		};

		$scope.remove = function (force) {
			var params;

			if (force) {
				params = {project_id: $scope.projectId, force: true};
			} else {
				params = {project_id: $scope.projectId};
			}

			ProjectTransect.detach(
				params, {id: $scope.transect.id},
				removeSuccess, removeError
			);
		};

		$scope.$watch('editing', function (editing) {
			if (!editing) {
				$scope.cancelRemove();
			}
		});
	}]
);
} catch (e) {
	// dias.projects is not loaded on this page
}
/**
 * @namespace dias.projects
 * @ngdoc controller
 * @name ProjectTransectsController
 * @memberOf dias.projects
 * @description Handles modification of the transects of a project.
 */
try {
angular.module('dias.projects').controller('ProjectTransectsController', ["$scope", "ProjectTransect", function ($scope, ProjectTransect) {
		"use strict";

		$scope.transects = ProjectTransect.query({ project_id: $scope.projectId });

		$scope.edit = function () {
			$scope.editing = !$scope.editing;
		};

		$scope.removeTransect = function (index) {
			$scope.transects.splice(index, 1);
		};

		// leave editing mode when there are no more transects to edit
		$scope.$watchCollection('transects', function (transects) {
			if (transects && transects.length === 0) {
				$scope.editing = false;
			}
		});
	}]
);
} catch (e) {
	// dias.projects is not loaded on this page
}
/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name ImagePageButtonController
 * @memberOf dias.transects
 * @description Controls the button for going to the image index page when clicking on an image of the transects view.
 */
angular.module('dias.transects').controller('ImagePageButtonController', ["$scope", "$attrs", function ($scope, $attrs) {
		"use strict";

		var prefix = $attrs.imageUrl + '/';
		var suffix = '';
		var id = 'image-page-button';

		$scope.selected = false;

		$scope.activate = function () {
			$scope.toggleButton(id);
		};

		$scope.$on('button.setActive', function (e, buttonId) {
			$scope.selected = id === buttonId;
			if ($scope.selected) {
				$scope.setImageUrl(prefix, suffix);
			}
		});
	}]
);
/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name ImagesController
 * @memberOf dias.transects
 * @description Controller for displaying the huge amout of images of a
 * transect on a singe page.
 */
angular.module('dias.transects').controller('ImagesController', ["$scope", "TransectImage", "$attrs", "$element", "$timeout", function ($scope, TransectImage, $attrs, $element, $timeout) {
		"use strict";

		var element = $element[0];
		var boundingRect, timeoutPromise;
		// add this much images for each step
		var step = 20;
		// offset of the element bottom to the window lower bound in pixels at 
		// which a new bunch of images should be displayed
		var newStepOffset = 100;

		var needsNewStep = function () {
			boundingRect = element.getBoundingClientRect();
			return element.scrollTop >= element.scrollHeight - element.offsetHeight - newStepOffset;
		};

		var checkLowerBound = function () {
			if (needsNewStep()) {
				$scope.limit += step;
				$scope.$apply();
			}
		};

		// attempts to fill the current viewport with images
		// uses $timeout to wait for DOM rendering, then checks again
		var initialize = function () {
			if (needsNewStep()) {
				$scope.limit += step;
				timeoutPromise = $timeout(initialize, 500);
			} else {
				// viewport is full, now switch to event listeners for loading
				$timeout.cancel(timeoutPromise);
				element.addEventListener('scroll', checkLowerBound);
				window.addEventListener('resize', checkLowerBound);
			}
		};

		// array of all image ids of this transect
		$scope.images = TransectImage.query({transect_id: $attrs.transectId});
		// number of currently shown images
		$scope.limit = 20;

		$timeout(initialize);
	}]
);
/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name SidebarController
 * @memberOf dias.transects
 * @description Controller for the sidebar of the transects index page.
 */
angular.module('dias.transects').controller('SidebarController', ["$scope", "Image", "$attrs", function ($scope, Image, $attrs) {
		"use strict";

		$scope.exifKeys = $attrs.exifKeys.split(',');

		var handleImageClick = function (angularEvent, clickEvent, imageId) {
			if ($scope.active.button) return;

			clickEvent.preventDefault();
			$scope.imageData = Image.get({id: imageId});
		};

		$scope.$on('image.selected', handleImageClick);
	}]
);
/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name TransectsController
 * @memberOf dias.transects
 * @description Controller for managing the transects index page.
 */
angular.module('dias.transects').controller('TransectsController', ["$scope", "$timeout", function ($scope, $timeout) {
		"use strict";

		var activeButtonStorageKey = 'dias.transects.index.active.button';
		var prefix = '';
		var suffix = '';

		$scope.active = {
			image: '',
			button: ''
		};

		$scope.getImageUrl = function (id) {
			if (!prefix && !suffix) {
				return '#';
			}
			return prefix + id + suffix;
		};

		$scope.setImageUrl = function (p, s) {
			prefix = p;
			suffix = s;
		};

		$scope.imageSelected = function (e, id) {
			$scope.$broadcast('image.selected', e, id);
			$scope.active.image = id;
		};

		$scope.toggleButton = function (id) {
			if ($scope.active.button == id) {
				id = '';
			}
			$scope.active.button = id;
			$scope.$broadcast('button.setActive', id);
			window.localStorage.setItem(activeButtonStorageKey, id);
		};

		// default active button is image page button if none was set in 
		// localStorage
		// $scope.toggleButton(window.localStorage.getItem(activeButtonStorageKey) ||	'image-page-button');
		$timeout(function () {
			var id = window.localStorage.getItem(activeButtonStorageKey);
			$scope.toggleButton(id === null ? 'image-page-button' : id);
		});
	}]
);
//# sourceMappingURL=main.js.map