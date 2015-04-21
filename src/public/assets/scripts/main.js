/**
 * @namespace dias.annotations
 * @description The DIAS annotations module.
 */
angular.module('dias.annotations', ['dias.api']);

/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotationsController
 * @memberOf dias.annotations
 * @description Controller for managing the annotations on the SVG.
 */
angular.module('dias.annotations').controller('AnnotationsController', ["$scope", "ImageAnnotation", "AnnotationLabel", "AnnotationPoint", "Shape", function ($scope, ImageAnnotation, AnnotationLabel, AnnotationPoint, Shape) {
		"use strict";

		// $scope.shapes = {};

		// Shape.query(function (shapes) {
		// 	shapes.forEach(function (shape) {
		// 		$scope.shapes[shape.id] = shape.name;
		// 	});
		// });

		// $scope.annotations = {};

		// var refreshAnnotations = function (e, image) {
		// 	$scope.annotations = ImageAnnotation.query({image_id: image._id});
		// 	$scope.annotations.$promise.then(function () {
		// 		$scope.annotations.forEach(function (annotation) {
		// 			annotation.points = AnnotationPoint.query({annotation_id: annotation.id});
		// 			annotation.labels = AnnotationLabel.query({annotation_id: annotation.id});
		// 			annotation.shape = function () {
		// 				return $scope.shapes[this.shape_id];
		// 			};
		// 		});
		// 	});
		// };

		// var refreshOffset = function () {
		// 	var image = $scope.images.currentImage;
		// 	if (!image) return;

		// 	var scaleX = $scope.width / image.width;
		// 	var scaleY = $scope.height / image.height;

		// 	var offsetX = ($scope.width - image.width * scaleY) / 2;
		// 	var offsetY = ($scope.height - image.height * scaleX) / 2;
		// 	offsetX = Math.max(offsetX, 0);
		// 	offsetY = Math.max(offsetY, 0);
			
		// 	$scope.offsetX = offsetX;
		// 	$scope.offsetY = offsetY;
		// };

		// $scope.$on('image.shown', refreshAnnotations);
		// $scope.$on('image.shown', refreshOffset);
		// $scope.$watch('width', refreshOffset);
		// $scope.$watch('height', refreshOffset);
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotatorController
 * @memberOf dias.annotations
 * @description Main controller of the Annotator application.
 */
angular.module('dias.annotations').controller('AnnotatorController', ["$scope", "$attrs", "images", "urlParams", function ($scope, $attrs, images, urlParams) {
		"use strict";

		$scope.images = images;
		$scope.imageLoading = true;

		// the current canvas viewport, synced with the URL parameters
		$scope.viewport = {
			zoom: urlParams.get('z'),
			center: [urlParams.get('x'), urlParams.get('y')]
		};

		// finish image loading process
		var finishLoading = function () {
			$scope.imageLoading = false;
			$scope.$broadcast('image.shown', $scope.images.currentImage);
		};

		// create a new history entry
		var pushState = function () {
			urlParams.pushState($scope.images.currentImage._id);
		};

		// start image loading process
		var startLoading = function () {
			$scope.imageLoading = true;
		};

		// load the image by id. doesn't create a new history entry by itself
		var loadImage = function (id) {
			startLoading();
			return images.show(parseInt(id)).then(finishLoading);
		};

		// show the next image and create a new history entry
		$scope.nextImage = function () {
			startLoading();
			images.next().then(finishLoading).then(pushState);
		};

		// show the previous image and create a new history entry
		$scope.prevImage = function () {
			startLoading();
			images.prev().then(finishLoading).then(pushState);
		};

		// update the URL parameters of the viewport
		$scope.$on('canvas.moveend', function(e, params) {
			$scope.viewport.zoom = params.zoom;
			$scope.viewport.center[0] = Math.round(params.center[0]);
			$scope.viewport.center[1] = Math.round(params.center[1]);
			urlParams.set({
				z: $scope.viewport.zoom,
				x: $scope.viewport.center[0],
				y: $scope.viewport.center[1]
			});
		});

		// listen to the browser "back" button
		window.onpopstate = function(e) {
			var state = e.state;
			if (state && state.slug !== undefined) {
				loadImage(state.slug);
			}
		};

		// initialize the images service
		images.init($attrs.transectId);
		// display the first image
		loadImage($attrs.imageId).then(finishLoading).then(pushState);
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name CanvasController
 * @memberOf dias.annotations
 * @description Main controller for the annotation canvas element
 */
angular.module('dias.annotations').controller('CanvasController', ["$scope", "mapImage", function ($scope, mapImage) {
		"use strict";

		var map = new ol.Map({
			target: 'canvas',
			layers: []
		});

		// update the URL parameters
		map.on('moveend', function(e) {
			var view = map.getView();
			$scope.$emit('canvas.moveend', {
				center: view.getCenter(),
				zoom: view.getZoom()
			});
		});

		mapImage.init(map, $scope);
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name annotation
 * @memberOf dias.annotations
 * @description Directive to display an annotation on the SVG.
 */
angular.module('dias.annotations').directive('annotation', function () {
	return {
		restrict: 'A',
		// template: '<polygon data-ng-attr-points="{{ points }}" />',
		controller: ["$scope", function ($scope) {
			$scope.shape = $scope.shapes[$scope.annotation.shape_id];

			$scope.points = '';

			$scope.annotation.points.$promise.then(function (points) {
				points.forEach(function (point) {
					$scope.points += point.x + ',' + point.y + ' ';
				});
			});
		}]
	};
});
/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name annotationPoint
 * @memberOf dias.annotations
 * @description Directive to display an annotationPoint on the SVG.
 */
angular.module('dias.annotations').directive('annotationPoint', function () {
	return {
		restrict: 'A',
		template: '<use xlink:href="#marker" data-ng-attr-x="{{ point.x }}" data-ng-attr-y="{{ point.y }}" data-ng-if="point" />',
		replace: true,
		controller: ["$scope", function ($scope) {
			$scope.annotation.points.$promise.then(function (points) {
				$scope.point = $scope.annotation.points[0];
			});
		}]
	};
});
/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name images
 * @memberOf dias.annotations
 * @description Manages (pre-)loading of the images to annotate.
 */
angular.module('dias.annotations').service('images', ["TransectImage", "URL", "$q", function (TransectImage, URL, $q) {
		"use strict";

		var _this = this;
		// array of all image IDs of the transect
		var imageIds = [];
		// maximum number of images to hold in buffer
		var MAX_BUFFER_SIZE = 10;
		// buffer of already loaded images
		var buffer = [];

		// the currently shown image
		this.currentImage = undefined;

		/**
		 * Returns the next ID of the specified image or the next ID of the 
		 * current image if no image was specified.
		 */
		var nextId = function (id) {
			id = id || _this.currentImage._id;
			var index = imageIds.indexOf(id);
			return imageIds[(index + 1) % imageIds.length];
		};

		/**
		 * Returns the previous ID of the specified image or the previous ID of
		 * the current image if no image was specified.
		 */
		var prevId = function (id) {
			id = id || _this.currentImage._id;
			var index = imageIds.indexOf(id);
			var length = imageIds.length;
			return imageIds[(index - 1 + length) % length];
		};

		/**
		 * Returns the specified image from the buffer or `undefined` if it is
		 * not buffered.
		 */
		var getImage = function (id) {
			id = id || _this.currentImage._id;
			for (var i = buffer.length - 1; i >= 0; i--) {
				if (buffer[i]._id == id) return buffer[i];
			}

			return undefined;
		};

		/**
		 * Sets the specified image to as the currently shown image.
		 */
		var show = function (id) {
			_this.currentImage = getImage(id);
		};

		/**
		 * Loads the specified image either from buffer or from the external 
		 * resource. Returns a promise that gets resolved when the image is
		 * loaded.
		 */
		var fetchImage = function (id) {
			var deferred = $q.defer();
			var img = getImage(id);

			if (img) {
				deferred.resolve(img);
			} else {
				img = document.createElement('img');
				img._id = id;
				img.onload = function () {
					buffer.push(img);
					// control maximum buffer size
					if (buffer.length > MAX_BUFFER_SIZE) {
						buffer.shift();
					}
					deferred.resolve(img);
				};
				img.onerror = function (msg) {
					deferred.reject(msg);
				};
				img.src = URL + "/api/v1/images/" + id + "/file";
			}

			return deferred.promise;
		};

		/**
		 * Initializes the service for a given transect. Returns a promise that
		 * is resolved, when the service is initialized.
		 */
		this.init = function (transectId) {
			imageIds = TransectImage.query({transect_id: transectId});
			
			return imageIds.$promise;
		};

		/**
		 * Show the image with the specified ID. Returns a promise that is
		 * resolved when the image is shown.
		 */
		this.show = function (id) {
			var promise = fetchImage(id).then(function() {
				show(id);
			});

			// wait for imageIds to be loaded
			imageIds.$promise.then(function () {
				// pre-load previous and next images but don't display them
				fetchImage(nextId(id));
				fetchImage(prevId(id));
			});

			return promise;
		};

		/**
		 * Show the next image. Returns a promise that is
		 * resolved when the image is shown.
		 */
		this.next = function () {
			return _this.show(nextId());
		};

		/**
		 * Show the previous image. Returns a promise that is
		 * resolved when the image is shown.
		 */
		this.prev = function () {
			return _this.show(prevId());
		};
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name mapImage
 * @memberOf dias.annotations
 * @description Wrapper service handling the image layer on the OpenLayers map
 */
angular.module('dias.annotations').service('mapImage', function () {
		"use strict";
		var extent = [0, 0, 0, 0];

		var projection = new ol.proj.Projection({
			code: 'dias-image',
			units: 'pixels',
			extent: extent
		});

		var imageLayer = new ol.layer.Image();

		this.init = function (map, scope) {
			map.addLayer(imageLayer);

			// refresh the image source
			scope.$on('image.shown', function (e, image) {
				extent[2] = image.width;
				extent[3] = image.height;

				var zoom = scope.viewport.zoom;

				var center = scope.viewport.center;
				// viewport center is still uninitialized
				if (center[0] === undefined && center[1] === undefined) {
					center = ol.extent.getCenter(extent);
				}

				var imageStatic = new ol.source.ImageStatic({
					url: image.src,
					projection: projection,
					imageExtent: extent
				});

				imageLayer.setSource(imageStatic);

				map.setView(new ol.View({
					projection: projection,
					center: center,
					zoom: zoom,
					// allow a maximum of 4x magnification
					minResolution: 0.25,
					// restrict movement
					extent: extent
				}));

				// if zoom is not initialized, fit the view to the image extent
				if (zoom === undefined) {
					map.getView().fitExtent(extent, map.getSize());
				}
			});
		};
	}
);
/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name urlParams
 * @memberOf dias.annotations
 * @description The GET parameters of the url.
 */
angular.module('dias.annotations').service('urlParams', function () {
		"use strict";

		var state = {};

		// transforms a URL parameter string like #a=1&b=2 to an object
		var decodeState = function () {
			var params = location.hash.replace('#', '')
			                          .split('&');

			var state = {};

			params.forEach(function (param) {
				// capture key-value pairs
				var capture = param.match(/(.+)\=(.+)/);
				if (capture && capture.length === 3) {
					state[capture[1]] = decodeURIComponent(capture[2]);
				}
			});

			return state;
		};

		// transforms an object to a URL parameter string
		var encodeState = function (state) {
			var params = '';
			for (var key in state) {
				params += key + '=' + encodeURIComponent(state[key]) + '&';
			}
			return params.substring(0, params.length - 1);
		};

		this.pushState = function (s) {
			state.slug = s;
			history.pushState(state, '', state.slug + '#' + encodeState(state));
		};

		// sets a URL parameter and updates the history state
		this.set = function (params) {
			for (var key in params) {
				state[key] = params[key];
			}
			history.replaceState(state, '', state.slug + '#' + encodeState(state));
		};

		// returns a URL parameter
		this.get = function (key) {
			return state[key];
		};

		state = history.state;

		if (!state) {
			state = decodeState();
		}
	}
);
//# sourceMappingURL=main.js.map