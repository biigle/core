/**
 * @namespace dias.annotations
 * @description The DIAS annotations module.
 */
angular.module('dias.annotations', ['dias.api', 'dias.ui.messages']);

/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotationsController
 * @memberOf dias.annotations
 * @description Controller for the annotations list in the sidebar
 */
angular.module('dias.annotations').controller('AnnotationsController', ["$scope", "mapAnnotations", "labels", "annotations", "shapes", function ($scope, mapAnnotations, labels, annotations, shapes) {
		"use strict";

		$scope.selectedFeatures = mapAnnotations.getSelectedFeatures().getArray();

		$scope.$watchCollection('selectedFeatures', function (features) {
			features.forEach(function (feature) {
				labels.fetchForAnnotation(feature.annotation);
			});
		});

		var refreshAnnotations = function () {
			$scope.annotations = annotations.current();
		};

		var selectedFeatures = mapAnnotations.getSelectedFeatures();

		$scope.annotations = [];

		$scope.clearSelection = mapAnnotations.clearSelection;
		
		$scope.selectAnnotation = function (e, id) {
			// allow multiple selections
			if (!e.shiftKey) {
				$scope.clearSelection();
			}
			mapAnnotations.select(id);
		};

		$scope.isSelected = function (id) {
			var selected = false;
			selectedFeatures.forEach(function (feature) {
				if (feature.annotation && feature.annotation.id == id) {
					selected = true;
				}
			});
			return selected;
		};

		$scope.$on('image.shown', refreshAnnotations);
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name AnnotatorController
 * @memberOf dias.annotations
 * @description Main controller of the Annotator application.
 */
angular.module('dias.annotations').controller('AnnotatorController', ["$scope", "$attrs", "images", "urlParams", "msg", function ($scope, $attrs, images, urlParams, msg) {
		"use strict";

		$scope.images = images;
		$scope.imageLoading = true;
		$scope.editMode = !!$attrs.editMode;

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
			return images.show(parseInt(id))
			             .then(finishLoading)
			             .catch(msg.responseError);
		};

		var handleKeyEvents = function (e) {
			switch (e.keyCode) {
				case 37:
					$scope.prevImage();
					break;
				case 39:
					$scope.nextImage();
					break;
			}
		};

		// show the next image and create a new history entry
		$scope.nextImage = function () {
			startLoading();
			images.next()
			      .then(finishLoading)
			      .then(pushState)
			      .catch(msg.responseError);
		};

		// show the previous image and create a new history entry
		$scope.prevImage = function () {
			startLoading();
			images.prev()
			      .then(finishLoading)
			      .then(pushState)
			      .catch(msg.responseError);
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

		document.addEventListener('keypress', handleKeyEvents);

		// initialize the images service
		images.init($attrs.transectId);
		// display the first image
		loadImage($attrs.imageId).then(pushState);
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name CanvasController
 * @memberOf dias.annotations
 * @description Main controller for the annotation canvas element
 */
angular.module('dias.annotations').controller('CanvasController', ["$scope", "mapImage", "mapAnnotations", "map", "$timeout", function ($scope, mapImage, mapAnnotations, map, $timeout) {
		"use strict";

		// update the URL parameters
		map.on('moveend', function(e) {
			var view = map.getView();
			$scope.$emit('canvas.moveend', {
				center: view.getCenter(),
				zoom: view.getZoom()
			});
		});

		mapImage.init($scope);
		mapAnnotations.init($scope);

		var updateSize = function () {
			// workaround, so the function is called *after* the angular digest
			// and *after* the foldout was rendered
			$timeout(function() {
				map.updateSize();
			}, 0, false);
		};

		$scope.$on('sidebar.foldout.open', updateSize);
		$scope.$on('sidebar.foldout.close', updateSize);
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name CategoriesController
 * @memberOf dias.annotations
 * @description Controller for the sidebar label categories foldout
 */
angular.module('dias.annotations').controller('CategoriesController', ["$scope", "labels", function ($scope, labels) {
		"use strict";

		$scope.categories = labels.getAll();

		$scope.categoriesTree = labels.getTree();

		$scope.selectItem = function (item) {
			labels.setSelected(item);
			$scope.searchCategory = ''; // clear search field
			$scope.$broadcast('categories.selected', item);
		};
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name ConfidenceController
 * @memberOf dias.annotations
 * @description Controller for the confidence control
 */
angular.module('dias.annotations').controller('ConfidenceController', ["$scope", "labels", function ($scope, labels) {
		"use strict";

		$scope.confidence = 0.5;

		$scope.$watch('confidence', function (confidence) {
			labels.setCurrentConfidence(parseFloat(confidence));

			if (confidence <= 0.25) {
				$scope.confidenceClass = 'label-danger';
			} else if (confidence <= 0.5 ) {
				$scope.confidenceClass = 'label-warning';
			} else if (confidence <= 0.75 ) {
				$scope.confidenceClass = 'label-success';
			} else {
				$scope.confidenceClass = 'label-primary';
			}
		});
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name ControlsController
 * @memberOf dias.annotations
 * @description Controller for the sidebar control buttons
 */
angular.module('dias.annotations').controller('ControlsController', ["$scope", "mapAnnotations", "labels", "msg", "$attrs", function ($scope, mapAnnotations, labels, msg, $attrs) {
		"use strict";

		var drawing = false;

		$scope.selectShape = function (name) {
			if (!labels.hasSelected()) {
				$scope.openFoldout('categories');
				msg.info($attrs.selectCategory);
				return;
			}

			mapAnnotations.finishDrawing();

			if (drawing || name === null) {
				$scope.selectedShape = '';
				drawing = false;
			} else {
				$scope.selectedShape = name;
				mapAnnotations.startDrawing(name);
				drawing = true;
			}
		};
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name MinimapController
 * @memberOf dias.annotations
 * @description Controller for the minimap in the sidebar
 */
angular.module('dias.annotations').controller('MinimapController', ["$scope", "map", "mapImage", "$element", "styles", function ($scope, map, mapImage, $element, styles) {
		"use strict";

		var minimap = new ol.Map({
			target: 'minimap',
			// remove controls
			controls: [],
			// disable interactions
			interactions: []
		});

		// get the same layers than the map
		minimap.setLayerGroup(map.getLayerGroup());

		var featureOverlay = new ol.FeatureOverlay({
			map: minimap,
			style: styles.viewport
		});

		var viewport = new ol.Feature();
		featureOverlay.addFeature(viewport);

		// refresh the view (the image size could have been changed)
		$scope.$on('image.shown', function () {
			minimap.setView(new ol.View({
				projection: mapImage.getProjection(),
				center: ol.extent.getCenter(mapImage.getExtent()),
				zoom: 0
			}));
		});

		// move the viewport rectangle on the minimap
		var refreshViewport = function () {
			var extent = map.getView().calculateExtent(map.getSize());
			viewport.setGeometry(ol.geom.Polygon.fromExtent(extent));
		};

		map.on('moveend', refreshViewport);

		var dragViewport = function (e) {
			map.getView().setCenter(e.coordinate);
		};

		minimap.on('pointerdrag', dragViewport);

		$element.on('mouseleave', function () {
			minimap.un('pointerdrag', dragViewport);
		});

		$element.on('mouseenter', function () {
			minimap.on('pointerdrag', dragViewport);
		});
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SidebarController
 * @memberOf dias.annotations
 * @description Controller for the sidebar
 */
angular.module('dias.annotations').controller('SidebarController', ["$scope", "$rootScope", "mapAnnotations", function ($scope, $rootScope, mapAnnotations) {
		"use strict";

		// the currently opened sidebar-'extension'
		$scope.foldout = '';

		$scope.openFoldout = function (name) {
			$scope.foldout = name;
			$rootScope.$broadcast('sidebar.foldout.open');
		};

		$scope.closeFoldout = function () {
			$scope.foldout = '';
			$rootScope.$broadcast('sidebar.foldout.close');
		};

		$scope.toggleFoldout = function (name) {
			if ($scope.foldout === name) {
				$scope.closeFoldout();
			} else {
				$scope.openFoldout(name);
			}
		};

		$scope.deleteSelectedAnnotations = mapAnnotations.deleteSelected;
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name annotationListItem
 * @memberOf dias.annotations
 * @description An annotation list item.
 */
angular.module('dias.annotations').directive('annotationListItem', ["labels", function (labels) {
		"use strict";

		return {
			scope: true,
			controller: ["$scope", function ($scope) {
				$scope.shapeClass = 'icon-' + $scope.annotation.shape.toLowerCase();

				$scope.selected = function () {
					return $scope.isSelected($scope.annotation.id);
				};

				$scope.attachLabel = function () {
					labels.attachToAnnotation($scope.annotation);
				};

				$scope.removeLabel = function (label) {
					labels.removeFromAnnotation($scope.annotation, label);
				};

				$scope.canAttachLabel = function () {
					return $scope.selected() && labels.hasSelected();
				};

				$scope.currentLabel = labels.getSelected;

				$scope.currentConfidence = labels.getCurrentConfidence;
			}]
		};
	}]
);

/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name labelCategoryItem
 * @memberOf dias.annotations
 * @description A label category list item.
 */
angular.module('dias.annotations').directive('labelCategoryItem', ["$compile", "$timeout", function ($compile, $timeout) {
		"use strict";

		return {
			restrict: 'C',

			template: '<span class="item__name" data-ng-click="selectItem(item)">{{item.name}}</span>',

			scope: true,

			link: function (scope, element, attrs) {
				// wait for this element to be rendered until the children are
				// appended, otherwise there would be too much recursion for 
				// angular
				var content = angular.element('<ul class="label-category-subtree list-unstyled"><li class="label-category-item" data-ng-class="{open: isOpen, expandable: isExpandable, selected: isSelected}" data-ng-repeat="item in categoriesTree[item.id]"></li></ul>');
				$timeout(function () {
					element.append($compile(content)(scope));
				});
			},

			controller: ["$scope", function ($scope) {
				// open the subtree of this item
				$scope.isOpen = false;
				// this item has children
				$scope.isExpandable = !!$scope.categoriesTree[$scope.item.id];
				// this item is currently selected
				$scope.isSelected = false;

				// handle this by the event rather than an own click handler to 
				// deal with click and search field actions in a unified way
				$scope.$on('categories.selected', function (e, category) {
					// if an item is selected, its subtree and all parent items 
					// should be opened
					if ($scope.item.id === category.id) {
						$scope.isOpen = true;
						$scope.isSelected = true;
						// this hits all parent scopes/items
						$scope.$emit('categories.openParents');
					} else {
						$scope.isOpen = false;
						$scope.isSelected = false;
					}
				});

				// if a child item was selected, this item should be opened, too
				// so the selected item becomes visible in the tree
				$scope.$on('categories.openParents', function (e) {
					$scope.isOpen = true;
					// stop propagation if this is a root element
					if ($scope.item.parent_id === null) {
						e.stopPropagation();
					}
				});
			}]
		};
	}]
);

/**
 * @namespace dias.annotations
 * @ngdoc directive
 * @name labelItem
 * @memberOf dias.annotations
 * @description An annotation label list item.
 */
angular.module('dias.annotations').directive('labelItem', function () {
		"use strict";

		return {
			controller: ["$scope", function ($scope) {
				var confidence = $scope.annotationLabel.confidence;

				if (confidence <= 0.25) {
					$scope.class = 'label-danger';
				} else if (confidence <= 0.5 ) {
					$scope.class = 'label-warning';
				} else if (confidence <= 0.75 ) {
					$scope.class = 'label-success';
				} else {
					$scope.class = 'label-primary';
				}
			}]
		};
	}
);

/**
 * @namespace dias.annotations
 * @ngdoc factory
 * @name debounce
 * @memberOf dias.annotations
 * @description A debounce service to perform an action only when this function
 * wasn't called again in a short period of time.
 * see http://stackoverflow.com/a/13320016/1796523
 */
angular.module('dias.annotations').factory('debounce', ["$timeout", "$q", function ($timeout, $q) {
		"use strict";

		var timeouts = {};

		return function (func, wait, id) {
			// Create a deferred object that will be resolved when we need to
			// actually call the func
			var deferred = $q.defer();
			return (function() {
				var context = this, args = arguments;
				var later = function() {
					timeouts[id] = undefined;
					deferred.resolve(func.apply(context, args));
					deferred = $q.defer();
				};
				if (timeouts[id]) {
					$timeout.cancel(timeouts[id]);
				}
				timeouts[id] = $timeout(later, wait);
				return deferred.promise;
			})();
		};
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc factory
 * @name map
 * @memberOf dias.annotations
 * @description Wrapper factory handling OpenLayers map
 */
angular.module('dias.annotations').factory('map', function () {
		"use strict";

		var map = new ol.Map({
			target: 'canvas',
			controls: [
				new ol.control.Zoom(),
				new ol.control.ZoomToExtent(),
				new ol.control.FullScreen()
			]
		});

		return map;
	}
);
/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name annotations
 * @memberOf dias.annotations
 * @description Wrapper service the annotations to make them available in multiple controllers.
 */
angular.module('dias.annotations').service('annotations', ["Annotation", "shapes", "labels", "msg", function (Annotation, shapes, labels, msg) {
		"use strict";

		var annotations;

		var resolveShapeName = function (annotation) {
			annotation.shape = shapes.getName(annotation.shape_id);
			return annotation;
		};

		var addAnnotation = function (annotation) {
			annotations.push(annotation);
			return annotation;
		};

		this.query = function (params) {
			annotations = Annotation.query(params);
			annotations.$promise.then(function (a) {
				a.forEach(resolveShapeName);
			});
			return annotations;
		};

		this.add = function (params) {
			if (!params.shape_id && params.shape) {
				params.shape_id = shapes.getId(params.shape);
			}
			var label = labels.getSelected();
			params.label_id = label.id;
			params.confidence = labels.getCurrentConfidence();
			var annotation = Annotation.add(params);
			annotation.$promise
			          .then(resolveShapeName)
			          .then(addAnnotation)
			          .catch(msg.responseError);

			return annotation;
		};

		this.delete = function (annotation) {
			// use index to see if the annotation exists in the annotations list
			var index = annotations.indexOf(annotation);
			if (index > -1) {
				return annotation.$delete(function () {
					// update the index since the annotations list may have been 
					// modified in the meantime
					index = annotations.indexOf(annotation);
					annotations.splice(index, 1);
				}, msg.responseError);
			}
		};

		this.forEach = function (fn) {
			return annotations.forEach(fn);
		};

		this.current = function () {
			return annotations;
		};
	}]
);
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

		this.getCurrentId = function () {
			return _this.currentImage._id;
		};
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name labels
 * @memberOf dias.annotations
 * @description Wrapper service for annotation labels to provide some convenience functions.
 */
angular.module('dias.annotations').service('labels', ["AnnotationLabel", "Label", "msg", function (AnnotationLabel, Label, msg) {
		"use strict";

		var selectedLabel;
		var currentConfidence = 0.5;

		var labels = Label.query();

		this.fetchForAnnotation = function (annotation) {
			if (!annotation) return;

			// don't fetch twice
			if (!annotation.labels) {
				annotation.labels = AnnotationLabel.query({
						annotation_id: annotation.id
				});
			}

			return annotation.labels;
		};

		this.attachToAnnotation = function (annotation) {
			var label = AnnotationLabel.attach({
				annotation_id: annotation.id,
				label_id: selectedLabel.id,
				confidence: currentConfidence
			});

			label.$promise.then(function () {
				annotation.labels.push(label);
			});

			label.$promise.catch(msg.responseError);

			return label;
		};

		this.removeFromAnnotation = function (annotation, label) {
			// use index to see if the label exists for the annotation
			var index = annotation.labels.indexOf(label);
			if (index > -1) {
				return label.$delete(function () {
					// update the index since the label list may have been modified 
					// in the meantime
					index = annotation.labels.indexOf(label);
					annotation.labels.splice(index, 1);
				}, msg.responseError);
			}
		};

		this.getTree = function () {
			var tree = {};
			var build = function (label) {
				var parent = label.parent_id;
				if (tree[parent]) {
					tree[parent].push(label);
				} else {
					tree[parent] = [label];
				}
			};

			labels.$promise.then(function (labels) {
				labels.forEach(build);
			});

			return tree;
		};

		this.getAll = function () {
			return labels;
		};

		this.setSelected = function (label) {
			selectedLabel = label;
		};

		this.getSelected = function () {
			return selectedLabel;
		};

		this.hasSelected = function () {
			return !!selectedLabel;
		};

		this.setCurrentConfidence = function (confidence) {
			currentConfidence = confidence;
		};

		this.getCurrentConfidence = function () {
			return currentConfidence;
		};
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name mapAnnotations
 * @memberOf dias.annotations
 * @description Wrapper service handling the annotations layer on the OpenLayers map
 */
angular.module('dias.annotations').service('mapAnnotations', ["map", "images", "annotations", "debounce", "styles", function (map, images, annotations, debounce, styles) {
		"use strict";

		var featureOverlay = new ol.FeatureOverlay({
			style: styles.features
		});

		var features = new ol.Collection();

		featureOverlay.setFeatures(features);

		// select interaction working on "singleclick"
		var select = new ol.interaction.Select({
			style: styles.highlight
		});

		var selectedFeatures = select.getFeatures();

		var modify = new ol.interaction.Modify({
			features: featureOverlay.getFeatures(),
			// the SHIFT key must be pressed to delete vertices, so
			// that new vertices can be drawn at the same position
			// of existing vertices
			deleteCondition: function(event) {
				return ol.events.condition.shiftKeyOnly(event) && ol.events.condition.singleClick(event);
			}
		});

		// drawing interaction
		var draw;

		// convert a point array to a point object
		// re-invert the y axis
		var convertFromOLPoint = function (point) {
			return {x: point[0], y: images.currentImage.height - point[1]};
		};

		// convert a point object to a point array
		// invert the y axis
		var convertToOLPoint = function (point) {
			return [point.x, images.currentImage.height - point.y];
		};

		// assembles the coordinate arrays depending on the geometry type
		// so they have a unified format
		var getCoordinates = function (geometry) {
			switch (geometry.getType()) {
				case 'Circle':
					// radius is the x value of the second point of the circle
					return [geometry.getCenter(), [geometry.getRadius(), 0]];
				case 'Polygon':
					return geometry.getCoordinates()[0];
				case 'Point':
					return [geometry.getCoordinates()];
				default:
					return geometry.getCoordinates();
			}
		};

		// saves the updated geometry of an annotation feature
		var handleGeometryChange = function (e) {
			var feature = e.target;
			var save = function () {
				var coordinates = getCoordinates(feature.getGeometry());
				feature.annotation.points = coordinates.map(convertFromOLPoint);
				feature.annotation.$save();
			};
			// this event is rapidly fired, so wait until the firing stops
			// before saving the changes
			debounce(save, 500, feature.annotation.id);
		};

		var createFeature = function (annotation) {
			var geometry;
			var points = annotation.points.map(convertToOLPoint);

			switch (annotation.shape) {
				case 'Point':
					geometry = new ol.geom.Point(points[0]);
					break;
				case 'Polygon':
					// close the polygon
					points.push(points[0]);
					// example: https://github.com/openlayers/ol3/blob/master/examples/geojson.js#L126
					geometry = new ol.geom.Polygon([ points ]);
					break;
				case 'LineString':
					geometry = new ol.geom.LineString(points);
					break;
				case 'Circle':
					// radius is the x value of the second point of the circle
					geometry = new ol.geom.Circle(points[0], points[1][0]);
			}

			var feature = new ol.Feature({ geometry: geometry });
			feature.on('change', handleGeometryChange);
			feature.annotation = annotation;
			features.push(feature);
		};

		var refreshAnnotations = function (e, image) {
			// clear features of previous image
			features.clear();
			selectedFeatures.clear();

			annotations.query({id: image._id}).$promise.then(function () {
				annotations.forEach(createFeature);
			});
		};

		var handleNewFeature = function (e) {
			var geometry = e.feature.getGeometry();
			var coordinates = getCoordinates(geometry);

			e.feature.annotation = annotations.add({
				id: images.getCurrentId(),
				shape: geometry.getType(),
				points: coordinates.map(convertFromOLPoint)
			});

			// if the feature couldn't be saved, remove it again
			e.feature.annotation.$promise.catch(function () {
				features.remove(e.feature);
			});
		};

		this.init = function (scope) {
			featureOverlay.setMap(map);
			map.addInteraction(select);
			scope.$on('image.shown', refreshAnnotations);

			selectedFeatures.on('change:length', function () {
				// if not already digesting, digest
				if (!scope.$$phase) {
					// propagate new selections through the angular application
					scope.$apply();
				}
			});
		};

		this.startDrawing = function (type) {
			map.removeInteraction(select);

			type = type || 'Point';
			
			if (type === 'Rectangle') {
				// see https://github.com/openlayers/ol3/blob/100020fd5976612c15b6e80b05a37b230532075d/examples/draw-features.js#L60-72
				draw = new ol.interaction.Draw({
					features: features,
					// use LineString so the geometry always has an end point
					// the feature will be saved as Polygon nevertheless
					type: 'LineString',
					style: styles.editing,
					maxPoints: 2,
					geometryFunction: function (coordinates, geometry) {
						geometry = geometry || new ol.geom.Polygon(null);
						var start = coordinates[0];
						var end = coordinates[1];
						geometry.setCoordinates([[
							start,
							[start[0], end[1]],
							end,
							[end[0], start[1]],
							start
						]]);
						return geometry;
					}
				});
			} else {
				draw = new ol.interaction.Draw({
					features: features,
					type: type,
					style: styles.editing
				});
			}

			map.addInteraction(modify);
			map.addInteraction(draw);
			draw.on('drawend', handleNewFeature);
		};

		this.finishDrawing = function () {
			map.removeInteraction(draw);
			map.removeInteraction(modify);
			map.addInteraction(select);
			// non't select the last drawn point
			selectedFeatures.clear();
		};

		this.deleteSelected = function () {
			selectedFeatures.forEach(function (feature) {
				annotations.delete(feature.annotation).then(function () {
					features.remove(feature);
					selectedFeatures.remove(feature);
				});
			});
		};

		this.select = function (id) {
			var feature;
			features.forEach(function (f) {
				if (f.annotation.id === id) {
					feature = f;
				}
			});
			// remove selection if feature was already selected. otherwise select.
			if (!selectedFeatures.remove(feature)) {
				selectedFeatures.push(feature);
			}
		};

		this.clearSelection = function () {
			selectedFeatures.clear();
		};

		this.getSelectedFeatures = function () {
			return selectedFeatures;
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
angular.module('dias.annotations').service('mapImage', ["map", function (map) {
		"use strict";
		var extent = [0, 0, 0, 0];

		var projection = new ol.proj.Projection({
			code: 'dias-image',
			units: 'pixels',
			extent: extent
		});

		var imageLayer = new ol.layer.Image();

		this.init = function (scope) {
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
					zoomFactor: 1.5,
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

		this.getExtent = function () {
			return extent;
		};

		this.getProjection = function () {
			return projection;
		};
	}]
);
/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name styles
 * @memberOf dias.annotations
 * @description Wrapper service for the OpenLayers styles
 */
angular.module('dias.annotations').service('styles', function () {
		"use strict";

		var white = [255, 255, 255, 1];
		var blue = [0, 153, 255, 1];
		var orange = '#ff5e00';
		var width = 3;

		this.features = [
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: white,
					width: 5
				}),
				image: new ol.style.Circle({
					radius: 6,
					fill: new ol.style.Fill({
						color: blue
					}),
					stroke: new ol.style.Stroke({
						color: white,
						width: 2
					})
				})
			}),
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: blue,
					width: 3
				})
			})
		];

		this.highlight = [
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: white,
					width: 6
				}),
				image: new ol.style.Circle({
					radius: 6,
					fill: new ol.style.Fill({
						color: orange
					}),
					stroke: new ol.style.Stroke({
						color: white,
						width: 3
					})
				})
			}),
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: orange,
					width: 3
				})
			})
		];

		this.editing = [
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: white,
					width: 5
				}),
				image: new ol.style.Circle({
					radius: 6,
					fill: new ol.style.Fill({
						color: blue
					}),
					stroke: new ol.style.Stroke({
						color: white,
						width: 2,
						lineDash: [3]
					})
				})
			}),
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: blue,
					width: 3,
					lineDash: [5]
				})
			})
		];

		this.viewport = [
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: blue,
					width: 3
				}),
			}),
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: white,
					width: 1
				})
			})
		];
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
/**
 * @namespace dias.transects
 * @ngdoc controller
 * @name AnnotatorButtonController
 * @memberOf dias.transects
 * @description Controls the button for going to the image annotator when clicking on an image of the transects view.
 */
try {
angular.module('dias.transects').controller('AnnotatorButtonController', ["$scope", "$attrs", function ($scope, $attrs) {
		"use strict";

		var prefix = $attrs.annotatorUrl + '/';
		var suffix = '';
		var id = 'image-annotator-button';

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
} catch (e) {
	// dias.transects is not loaded on this page
}
//# sourceMappingURL=main.js.map