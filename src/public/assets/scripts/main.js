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
angular.module('dias.annotations').controller('AnnotatorController', ["$scope", "$attrs", "images", "urlParams", "msg", "labels", function ($scope, $attrs, images, urlParams, msg, labels) {
        "use strict";

        $scope.images = images;
        $scope.imageLoading = true;
        $scope.editMode = !!$attrs.editMode;
        // don't parse an empty string
        $scope.projectIds = $attrs.projectIds ? $attrs.projectIds.split(',') : [];

        labels.setProjectIds($scope.projectIds);

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

        $scope.categories = [];
        labels.promise.then(function (all) {
            for (var key in all) {
                $scope.categories = $scope.categories.concat(all[key]);
            }
        });

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

		$scope.confidence = 1.0;

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
                $scope.$emit('sidebar.foldout.do-open', 'categories');
				msg.info($attrs.selectCategory);
				return;
			}

			mapAnnotations.finishDrawing();

			if (name === null || (drawing && $scope.selectedShape === name)) {
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

        $rootScope.$on('sidebar.foldout.do-open', function (e, name) {
            $scope.openFoldout(name);
        });
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
angular.module('dias.annotations').directive('labelCategoryItem', ["$compile", "$timeout", "$templateCache", function ($compile, $timeout, $templateCache) {
        "use strict";

        return {
            restrict: 'C',

            templateUrl: 'label-item.html',

            scope: true,

            link: function (scope, element, attrs) {
                // wait for this element to be rendered until the children are
                // appended, otherwise there would be too much recursion for
                // angular
                var content = angular.element($templateCache.get('label-subtree.html'));
                $timeout(function () {
                    element.append($compile(content)(scope));
                });
            },

            controller: ["$scope", function ($scope) {
                // open the subtree of this item
                $scope.isOpen = false;
                // this item has children
                $scope.isExpandable = !!$scope.tree[$scope.item.id];
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
angular.module('dias.annotations').service('labels', ["AnnotationLabel", "Label", "ProjectLabel", "Project", "msg", "$q", function (AnnotationLabel, Label, ProjectLabel, Project, msg, $q) {
        "use strict";

        var selectedLabel;
        var currentConfidence = 1.0;

        var labels = {};

        // this promise is resolved when all labels were loaded
        this.promise = null;

        this.setProjectIds = function (ids) {
            var deferred = $q.defer();
            this.promise = deferred.promise;
            // -1 bcause of global labels
            var finished = -1;

            // check if all labels are there. if yes, resolve
            var maybeResolve = function () {
                if (++finished === ids.length) {
                    deferred.resolve(labels);
                }
            };

            labels[null] = Label.query(maybeResolve);

            ids.forEach(function (id) {
                Project.get({id: id}, function (project) {
                    labels[project.name] = ProjectLabel.query({project_id: id}, maybeResolve);
                });
            });
        };

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
            var key = null;
            var build = function (label) {
                var parent = label.parent_id;
                if (tree[key][parent]) {
                    tree[key][parent].push(label);
                } else {
                    tree[key][parent] = [label];
                }
            };

            this.promise.then(function (labels) {
                for (key in labels) {
                    tree[key] = {};
                    labels[key].forEach(build);
                }
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
				case 'Rectangle':
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
				case 'Rectangle':
					geometry = new ol.geom.Rectangle([ points ]);
					break;
				case 'Polygon':
					// example: https://github.com/openlayers/ol3/blob/master/examples/geojson.js#L126
					geometry = new ol.geom.Polygon([ points ]);
					break;
				case 'LineString':
					geometry = new ol.geom.LineString(points);
					break;
				case 'Circle':
					// radius is the x value of the second point of the circle
					geometry = new ol.geom.Circle(points[0], points[1][0]);
					break;
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

			e.feature.on('change', handleGeometryChange);
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
			draw = new ol.interaction.Draw({
				features: features,
				type: type,
				style: styles.editing
			});

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0b3JDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ2FudmFzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NhdGVnb3JpZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ29uZmlkZW5jZUNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Db250cm9sc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9NaW5pbWFwQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NpZGViYXJDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9hbm5vdGF0aW9uTGlzdEl0ZW0uanMiLCJkaXJlY3RpdmVzL2xhYmVsQ2F0ZWdvcnlJdGVtLmpzIiwiZGlyZWN0aXZlcy9sYWJlbEl0ZW0uanMiLCJmYWN0b3JpZXMvZGVib3VuY2UuanMiLCJmYWN0b3JpZXMvbWFwLmpzIiwic2VydmljZXMvYW5ub3RhdGlvbnMuanMiLCJzZXJ2aWNlcy9pbWFnZXMuanMiLCJzZXJ2aWNlcy9sYWJlbHMuanMiLCJzZXJ2aWNlcy9tYXBBbm5vdGF0aW9ucy5qcyIsInNlcnZpY2VzL21hcEltYWdlLmpzIiwic2VydmljZXMvc3R5bGVzLmpzIiwic2VydmljZXMvdXJsUGFyYW1zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLG9CQUFBLENBQUEsWUFBQTs7Ozs7Ozs7O0FDR0EsUUFBQSxPQUFBLG9CQUFBLFdBQUEseUZBQUEsVUFBQSxRQUFBLGdCQUFBLFFBQUEsYUFBQSxRQUFBO0VBQ0E7O0VBRUEsT0FBQSxtQkFBQSxlQUFBLHNCQUFBOztFQUVBLE9BQUEsaUJBQUEsb0JBQUEsVUFBQSxVQUFBO0dBQ0EsU0FBQSxRQUFBLFVBQUEsU0FBQTtJQUNBLE9BQUEsbUJBQUEsUUFBQTs7OztFQUlBLElBQUEscUJBQUEsWUFBQTtHQUNBLE9BQUEsY0FBQSxZQUFBOzs7RUFHQSxJQUFBLG1CQUFBLGVBQUE7O0VBRUEsT0FBQSxjQUFBOztFQUVBLE9BQUEsaUJBQUEsZUFBQTs7RUFFQSxPQUFBLG1CQUFBLFVBQUEsR0FBQSxJQUFBOztHQUVBLElBQUEsQ0FBQSxFQUFBLFVBQUE7SUFDQSxPQUFBOztHQUVBLGVBQUEsT0FBQTs7O0VBR0EsT0FBQSxhQUFBLFVBQUEsSUFBQTtHQUNBLElBQUEsV0FBQTtHQUNBLGlCQUFBLFFBQUEsVUFBQSxTQUFBO0lBQ0EsSUFBQSxRQUFBLGNBQUEsUUFBQSxXQUFBLE1BQUEsSUFBQTtLQUNBLFdBQUE7OztHQUdBLE9BQUE7OztFQUdBLE9BQUEsSUFBQSxlQUFBOzs7Ozs7Ozs7OztBQ3ZDQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSxvRkFBQSxVQUFBLFFBQUEsUUFBQSxRQUFBLFdBQUEsS0FBQSxRQUFBO1FBQ0E7O1FBRUEsT0FBQSxTQUFBO1FBQ0EsT0FBQSxlQUFBO1FBQ0EsT0FBQSxXQUFBLENBQUEsQ0FBQSxPQUFBOztRQUVBLE9BQUEsYUFBQSxPQUFBLGFBQUEsT0FBQSxXQUFBLE1BQUEsT0FBQTs7UUFFQSxPQUFBLGNBQUEsT0FBQTs7O1FBR0EsT0FBQSxXQUFBO1lBQ0EsTUFBQSxVQUFBLElBQUE7WUFDQSxRQUFBLENBQUEsVUFBQSxJQUFBLE1BQUEsVUFBQSxJQUFBOzs7O1FBSUEsSUFBQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQSxlQUFBO1lBQ0EsT0FBQSxXQUFBLGVBQUEsT0FBQSxPQUFBOzs7O1FBSUEsSUFBQSxZQUFBLFlBQUE7WUFDQSxVQUFBLFVBQUEsT0FBQSxPQUFBLGFBQUE7Ozs7UUFJQSxJQUFBLGVBQUEsWUFBQTtZQUNBLE9BQUEsZUFBQTs7OztRQUlBLElBQUEsWUFBQSxVQUFBLElBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQSxLQUFBLFNBQUE7MEJBQ0EsS0FBQTswQkFDQSxNQUFBLElBQUE7OztRQUdBLElBQUEsa0JBQUEsVUFBQSxHQUFBO1lBQ0EsUUFBQSxFQUFBO2dCQUNBLEtBQUE7b0JBQ0EsT0FBQTtvQkFDQTtnQkFDQSxLQUFBO29CQUNBLE9BQUE7b0JBQ0E7Ozs7O1FBS0EsT0FBQSxZQUFBLFlBQUE7WUFDQTtZQUNBLE9BQUE7bUJBQ0EsS0FBQTttQkFDQSxLQUFBO21CQUNBLE1BQUEsSUFBQTs7OztRQUlBLE9BQUEsWUFBQSxZQUFBO1lBQ0E7WUFDQSxPQUFBO21CQUNBLEtBQUE7bUJBQ0EsS0FBQTttQkFDQSxNQUFBLElBQUE7Ozs7UUFJQSxPQUFBLElBQUEsa0JBQUEsU0FBQSxHQUFBLFFBQUE7WUFDQSxPQUFBLFNBQUEsT0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQSxLQUFBLE1BQUEsT0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQSxLQUFBLE1BQUEsT0FBQSxPQUFBO1lBQ0EsVUFBQSxJQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBLE9BQUE7Z0JBQ0EsR0FBQSxPQUFBLFNBQUEsT0FBQTs7Ozs7UUFLQSxPQUFBLGFBQUEsU0FBQSxHQUFBO1lBQ0EsSUFBQSxRQUFBLEVBQUE7WUFDQSxJQUFBLFNBQUEsTUFBQSxTQUFBLFdBQUE7Z0JBQ0EsVUFBQSxNQUFBOzs7O1FBSUEsU0FBQSxpQkFBQSxZQUFBOzs7UUFHQSxPQUFBLEtBQUEsT0FBQTs7UUFFQSxVQUFBLE9BQUEsU0FBQSxLQUFBOzs7Ozs7Ozs7OztBQy9GQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSxnRkFBQSxVQUFBLFFBQUEsVUFBQSxnQkFBQSxLQUFBLFVBQUE7RUFDQTs7O0VBR0EsSUFBQSxHQUFBLFdBQUEsU0FBQSxHQUFBO0dBQ0EsSUFBQSxPQUFBLElBQUE7R0FDQSxPQUFBLE1BQUEsa0JBQUE7SUFDQSxRQUFBLEtBQUE7SUFDQSxNQUFBLEtBQUE7Ozs7RUFJQSxTQUFBLEtBQUE7RUFDQSxlQUFBLEtBQUE7O0VBRUEsSUFBQSxhQUFBLFlBQUE7OztHQUdBLFNBQUEsV0FBQTtJQUNBLElBQUE7TUFDQSxHQUFBOzs7RUFHQSxPQUFBLElBQUEsd0JBQUE7RUFDQSxPQUFBLElBQUEseUJBQUE7Ozs7Ozs7Ozs7QUN4QkEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsNkNBQUEsVUFBQSxRQUFBLFFBQUE7UUFDQTs7UUFFQSxPQUFBLGFBQUE7UUFDQSxPQUFBLFFBQUEsS0FBQSxVQUFBLEtBQUE7WUFDQSxLQUFBLElBQUEsT0FBQSxLQUFBO2dCQUNBLE9BQUEsYUFBQSxPQUFBLFdBQUEsT0FBQSxJQUFBOzs7O1FBSUEsT0FBQSxpQkFBQSxPQUFBOztRQUVBLE9BQUEsYUFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBLGlCQUFBO1lBQ0EsT0FBQSxXQUFBLHVCQUFBOzs7Ozs7Ozs7Ozs7QUNmQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSw2Q0FBQSxVQUFBLFFBQUEsUUFBQTtFQUNBOztFQUVBLE9BQUEsYUFBQTs7RUFFQSxPQUFBLE9BQUEsY0FBQSxVQUFBLFlBQUE7R0FDQSxPQUFBLHFCQUFBLFdBQUE7O0dBRUEsSUFBQSxjQUFBLE1BQUE7SUFDQSxPQUFBLGtCQUFBO1VBQ0EsSUFBQSxjQUFBLE1BQUE7SUFDQSxPQUFBLGtCQUFBO1VBQ0EsSUFBQSxjQUFBLE9BQUE7SUFDQSxPQUFBLGtCQUFBO1VBQ0E7SUFDQSxPQUFBLGtCQUFBOzs7Ozs7Ozs7Ozs7O0FDZkEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsOEVBQUEsVUFBQSxRQUFBLGdCQUFBLFFBQUEsS0FBQSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBOztFQUVBLE9BQUEsY0FBQSxVQUFBLE1BQUE7R0FDQSxJQUFBLENBQUEsT0FBQSxlQUFBO2dCQUNBLE9BQUEsTUFBQSwyQkFBQTtJQUNBLElBQUEsS0FBQSxPQUFBO0lBQ0E7OztHQUdBLGVBQUE7O0dBRUEsSUFBQSxTQUFBLFNBQUEsV0FBQSxPQUFBLGtCQUFBLE9BQUE7SUFDQSxPQUFBLGdCQUFBO0lBQ0EsVUFBQTtVQUNBO0lBQ0EsT0FBQSxnQkFBQTtJQUNBLGVBQUEsYUFBQTtJQUNBLFVBQUE7Ozs7Ozs7Ozs7Ozs7QUNwQkEsUUFBQSxPQUFBLG9CQUFBLFdBQUEseUVBQUEsVUFBQSxRQUFBLEtBQUEsVUFBQSxVQUFBLFFBQUE7RUFDQTs7RUFFQSxJQUFBLFVBQUEsSUFBQSxHQUFBLElBQUE7R0FDQSxRQUFBOztHQUVBLFVBQUE7O0dBRUEsY0FBQTs7OztFQUlBLFFBQUEsY0FBQSxJQUFBOztFQUVBLElBQUEsaUJBQUEsSUFBQSxHQUFBLGVBQUE7R0FDQSxLQUFBO0dBQ0EsT0FBQSxPQUFBOzs7RUFHQSxJQUFBLFdBQUEsSUFBQSxHQUFBO0VBQ0EsZUFBQSxXQUFBOzs7RUFHQSxPQUFBLElBQUEsZUFBQSxZQUFBO0dBQ0EsUUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO0lBQ0EsWUFBQSxTQUFBO0lBQ0EsUUFBQSxHQUFBLE9BQUEsVUFBQSxTQUFBO0lBQ0EsTUFBQTs7Ozs7RUFLQSxJQUFBLGtCQUFBLFlBQUE7R0FDQSxJQUFBLFNBQUEsSUFBQSxVQUFBLGdCQUFBLElBQUE7R0FDQSxTQUFBLFlBQUEsR0FBQSxLQUFBLFFBQUEsV0FBQTs7O0VBR0EsSUFBQSxHQUFBLFdBQUE7O0VBRUEsSUFBQSxlQUFBLFVBQUEsR0FBQTtHQUNBLElBQUEsVUFBQSxVQUFBLEVBQUE7OztFQUdBLFFBQUEsR0FBQSxlQUFBOztFQUVBLFNBQUEsR0FBQSxjQUFBLFlBQUE7R0FDQSxRQUFBLEdBQUEsZUFBQTs7O0VBR0EsU0FBQSxHQUFBLGNBQUEsWUFBQTtHQUNBLFFBQUEsR0FBQSxlQUFBOzs7Ozs7Ozs7OztBQ2xEQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSxnRUFBQSxVQUFBLFFBQUEsWUFBQSxnQkFBQTtFQUNBOzs7RUFHQSxPQUFBLFVBQUE7O0VBRUEsT0FBQSxjQUFBLFVBQUEsTUFBQTtHQUNBLE9BQUEsVUFBQTtHQUNBLFdBQUEsV0FBQTs7O0VBR0EsT0FBQSxlQUFBLFlBQUE7R0FDQSxPQUFBLFVBQUE7R0FDQSxXQUFBLFdBQUE7OztFQUdBLE9BQUEsZ0JBQUEsVUFBQSxNQUFBO0dBQ0EsSUFBQSxPQUFBLFlBQUEsTUFBQTtJQUNBLE9BQUE7VUFD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SUFBQSxrQkFBQTs7RUFFQSxJQUFBLFNBQUE7OztFQUdBLEtBQUEsZUFBQTs7Ozs7O0VBTUEsSUFBQSxTQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsTUFBQSxNQUFBLGFBQUE7R0FDQSxJQUFBLFFBQUEsU0FBQSxRQUFBO0dBQ0EsT0FBQSxTQUFBLENBQUEsUUFBQSxLQUFBLFNBQUE7Ozs7Ozs7RUFPQSxJQUFBLFNBQUEsVUFBQSxJQUFBO0dBQ0EsS0FBQSxNQUFBLE1BQUEsYUFBQTtHQUNBLElBQUEsUUFBQSxTQUFBLFFBQUE7R0FDQSxJQUFBLFNBQUEsU0FBQTtHQUNBLE9BQUEsU0FBQSxDQUFBLFFBQUEsSUFBQSxVQUFBOzs7Ozs7O0VBT0EsSUFBQSxXQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsTUFBQSxNQUFBLGFBQUE7R0FDQSxLQUFBLElBQUEsSUFBQSxPQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtJQUNBLElBQUEsT0FBQSxHQUFBLE9BQUEsSUFBQSxPQUFBLE9BQUE7OztHQUdBLE9BQUE7Ozs7OztFQU1BLElBQUEsT0FBQSxVQUFBLElBQUE7R0FDQSxNQUFBLGVBQUEsU0FBQTs7Ozs7Ozs7RUFRQSxJQUFBLGFBQUEsVUFBQSxJQUFBO0dBQ0EsSUFBQSxXQUFBLEdBQUE7R0FDQSxJQUFBLE1BQUEsU0FBQTs7R0FFQSxJQUFBLEtBQUE7SUFDQSxTQUFBLFFBQUE7VUFDQTtJQUNBLE1BQUEsU0FBQSxjQUFBO0lBQ0EsSUFBQSxNQUFBO0lBQ0EsSUFBQSxTQUFBLFlBQUE7S0FDQSxPQUFBLEtBQUE7O0tBRUEsSUFBQSxPQUFBLFNBQUEsaUJBQUE7TUFDQSxPQUFBOztLQUVBLFNBQUEsUUFBQTs7SUFFQSxJQUFBLFVBQUEsVUFBQSxLQUFBO0tBQ0EsU0FBQSxPQUFBOztJQUVBLElBQUEsTUFBQSxNQUFBLG9CQUFBLEtBQUE7OztHQUdBLE9BQUEsU0FBQTs7Ozs7OztFQU9BLEtBQUEsT0FBQSxVQUFBLFlBQUE7R0FDQSxXQUFBLGNBQUEsTUFBQSxDQUFBLGFBQUE7O0dBRUEsT0FBQSxTQUFB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QTtFQUNBOztFQUVBLElBQUEsaUJBQUEsSUFBQSxHQUFBLGVBQUE7R0FDQSxPQUFBLE9BQUE7OztFQUdBLElBQUEsV0FBQSxJQUFBLEdBQUE7O0VBRUEsZUFBQSxZQUFBOzs7RUFHQSxJQUFBLFNBQUEsSUFBQSxHQUFBLFlBQUEsT0FBQTtHQUNBLE9BQUEsT0FBQTs7O0VBR0EsSUFBQSxtQkFBQSxPQUFBOztFQUVBLElBQUEsU0FBQSxJQUFBLEdBQUEsWUFBQSxPQUFBO0dBQ0EsVUFBQSxlQUFBOzs7O0dBSUEsaUJBQUEsU0FBQSxPQUFBO0lBQ0EsT0FBQSxHQUFBLE9BQUEsVUFBQSxhQUFBLFVBQUEsR0FBQSxPQUFBLFVBQUEsWUFBQTs7Ozs7RUFLQSxJQUFBOzs7O0VBSUEsSUFBQSxxQkFBQSxVQUFBLE9BQUE7R0FDQSxPQUFBLENBQUEsR0FBQSxNQUFBLElBQUEsR0FBQSxPQUFBLGFBQUEsU0FBQSxNQUFBOzs7OztFQUtBLElBQUEsbUJBQUEsVUFBQSxPQUFBO0dBQ0EsT0FBQSxDQUFBLE1BQUEsR0FBQSxPQUFBLGFBQUEsU0FBQSxNQUFBOzs7OztFQUtBLElBQUEsaUJBQUEsVUFBQSxVQUFBO0dBQ0EsUUFBQSxTQUFBO0lBQ0EsS0FBQTs7S0FFQSxPQUFBLENBQUEsU0FBQSxhQUFBLENBQUEsU0FBQSxhQUFBO0lBQ0EsS0FBQTtJQUNBLEtBQUE7S0FDQSxPQUFBLFNBQUEsaUJBQUE7SUFDQSxLQUFBO0tBQ0EsT0FBQSxDQUFBLFNBQUE7SUFDQTtLQUNBLE9BQUEsU0FBQTs7Ozs7RUFLQSxJQUFBLHVCQUFBLFVBQUEsR0FBQTtHQUNBLElBQUEsVUFBQSxFQUFBO0dBQ0EsSUFBQSxPQUFBLFlBQUE7SUFDQSxJQUFBLGNBQUEsZUFBQSxRQUFBO0lBQ0EsUUFBQSxXQUFBLFNBQUEsWUFBQSxJQUFBO0lBQ0EsUUFBQSxXQUFBOzs7O0dBSUEsU0FBQSxNQUFBLEtBQUEsUUFBQSxXQUFBOzs7RUFHQSxJQUFBLGdCQUFBLFVBQUEsWUFBQTtHQUNBLElBQUE7R0FDQSxJQUFBLFNBQUEsV0FBQSxPQUFBLElBQUE7O0dBRUEsUUFBQSxXQUFBO0lBQ0EsS0FBQTtLQUNBLFdBQUEsSUFBQSxHQUFBLEtBQUEsTUFBQSxPQUFBO0tBQ0E7SUFDQSxLQUFBO0tBQ0EsV0FBQSxJQUFBLEdBQUEsS0FBQSxVQUFBLEVBQUE7S0FDQTtJQUNBLEtBQUE7O0tBRUEsV0FBQSxJQUFBLEdBQUEsS0FBQSxRQUFBLEVBQUE7S0FDQTtJQUNBLEtBQUE7S0FDQSxXQUFBLElBQUEsR0FBQSxLQUFBLFdBQUE7S0FDQTtJQUNBLEtBQUE7O0tBRUEsV0FBQSxJQUFBLEdBQUEsS0FBQSxPQUFBLE9BQUEsSUFBQSxPQUFBLEdBQUE7S0FDQTs7O0dBR0EsSUFBQSxVQUFBLElBQUEsR0FBQSxRQUFBLEVBQUEsVUFBQTtHQUNBLFFBQUEsR0FBQSxVQUFBO0dBQ0EsUUFBQSxhQUFBO0dBQ0EsU0FBQSxLQUFBOzs7RUFHQSxJQUFBLHFCQUFBLFVBQUEsR0FBQSxPQUFBOztHQUVBLFNBQUE7R0FDQSxpQkFBQTs7R0FFQSxZQUFBLE1BQUEsQ0FBQSxJQUFBLE1BQUEsTUFBQSxTQUFBLEtBQUEsWUFBQTtJQUNBLFlBQUEsUUFBQTs7OztFQUlBLElBQUEsbUJBQUEsVUFBQSxHQUFBO0dBQ0EsSUFBQSxXQUFBLEVBQUEsUUFBQTtHQUNBLElBQUEsY0FBQSxlQUFBOztHQUVBLEVBQUEsUUFBQSxhQUFBLFlBQUEsSUFBQTtJQUNBLElBQUEsT0FBQTtJQUNBLE9BQUEsU0FBQTtJQUNBLFFBQUEsWUFBQSxJQUFBOzs7O0dBSUEsRUFBQSxRQUFBLFdBQUEsU0FBQSxNQUFBLFlBQUE7SUFDQSxTQUFBLE9BQUEsRUFBQTs7O0dBR0EsRUFBQSxRQUFBLEdBQUEsVUFBQTs7O0VBR0EsS0FBQSxPQUFBLFVBQUEsT0FBQTtHQUNBLGVBQUEsT0FBQTtHQUNBLElBQUEsZUFBQTtHQUNBLE1BQUEsSUFBQSxlQUFBOztHQUVBLGlCQUFBLEdBQUEsaUJBQUEsWUFBQTs7SUFFQSxJQUFBLENBQUEsTUFBQSxTQUFBOztLQUVBLE1BQUE7Ozs7O0VBS0EsS0FBQSxlQUFBLFVBQUEsTUFBQTtHQUNBLElBQUEsa0JBQUE7O0dBRUEsT0FBQSxRQUFBO0dBQ0EsT0FBQSxJQUFBLEdBQUEsWUFBQSxLQUFBO0lBQ0EsVUFBQTtJQUNBLE1BQUE7SUFDQSxPQUFBLE9BQUE7OztHQUdBLElBQUEsZUFBQTtHQUNBLElBQUEsZUFBQTtHQUNBLEtBQUEsR0FBQSxXQUFBOzs7RUFHQSxLQUFBLGdCQUFBLFlBQUE7R0FDQSxJQUFBLGtCQUFBO0dBQ0EsSUFBQSxrQkFBQTtHQUNBLElBQUEsZUFBQTs7R0FFQSxpQkFBQTs7O0VBR0EsS0FBQSxpQkFBQSxZQUFBO0dBQ0EsaUJBQUEsUUFBQSxVQUFBLFNBQUE7SUFDQSxZQUFBLE9BQUEsUUFBQSxZQUFBLEtBQUEsWUFBQTtLQUNBLFNBQUEsT0FBQTtLQUNBLGlCQUFBLE9BQUE7Ozs7O0VBS0EsS0FBQSxTQUFBLFVBQUEsSUFBQTtHQUNBLElBQUE7R0FDQSxTQUFBLFFBQUEsVUFBQSxHQUFBO0lBQ0EsSUFBQSxFQUFBLFdBQUEsT0FBQSxJQUFBO0tBQ0EsVUFBQTs7OztHQUlBLElBQUEsQ0FBQSxpQkFBQSxPQUFBLFVBQUE7SUFDQSxpQkFBQSxLQUFBOzs7O0VBSUEsS0FBQSxpQkFBQSxZQUFBO0dBQ0EsaUJBQUE7OztFQUdBLEtBQUEsc0JBQUEsWUFBQTtHQUNBLE9BQUE7Ozs7Ozs7Ozs7OztBQ25NQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxvQkFBQSxVQUFBLEtBQUE7RUFDQTtFQUNBLElBQUEsU0FBQSxDQUFBLEdBQUEsR0FBQSxHQUFBOztFQUVBLElBQUEsYUFBQSxJQUFBLEdBQUEsS0FBQSxXQUFBO0dBQ0EsTUFBQTtHQUNBLE9BQUE7R0FDQSxRQUFBOzs7RUFHQSxJQUFBLGFBQUEsSUFBQSxHQUFBLE1BQUE7O0VBRUEsS0FBQSxPQUFBLFVBQUEsT0FBQTtHQUNBLElBQUEsU0FBQTs7O0dBR0EsTUFBQSxJQUFBLGVBQUEsVUFBQSxHQUFBLE9BQUE7SUFDQSxPQUFBLEtBQUEsTUFBQTtJQUNBLE9BQUEsS0FBQSxNQUFBOztJQUVBLElBQUEsT0FBQSxNQUFBLFNBQUE7O0lBRUEsSUFBQSxTQUFBLE1BQUEsU0FBQTs7SUFFQSxJQUFBLE9BQUEsT0FBQSxhQUFBLE9BQUEsT0FBQSxXQUFBO0tBQ0EsU0FBQSxHQUFBLE9BQUEsVUFBQTs7O0lBR0EsSUFBQSxjQUFBLElBQUEsR0FBQSxPQUFBLFlBQUE7S0FDQSxLQUFBLE1BQUE7S0FDQSxZQUFBO0tBQ0EsYUFBQTs7O0lBR0EsV0FBQSxVQUFBOztJQUVBLElBQUEsUUFBQSxJQUFBLEdBQUEsS0FBQTtLQUNBLFlBQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQTtLQUNBLFlBQUE7O0tBRUEsZUFBQTs7S0FFQSxRQUFBOzs7O0lBSUEsSUFBQSxTQUFBLFdBQUE7S0FDQSxJQUFBLFVBQUEsVUFBQSxRQUFBLElBQUE7Ozs7O0VBS0EsS0FBQSxZQUFBLFlBQUE7R0FDQSxPQUFBOzs7RUFHQSxLQUFBLGdCQUFBLFlBQUE7R0FDQSxPQUFBOzs7Ozs7Ozs7OztBQzNEQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxVQUFBLFlBQUE7RUFDQTs7RUFFQSxJQUFBLFFBQUEsQ0FBQSxLQUFBLEtBQUEsS0FBQTtFQUNBLElBQUEsT0FBQSxDQUFBLEdBQUEsS0FBQSxLQUFBO0VBQ0EsSUFBQSxTQUFBO0VBQ0EsSUFBQSxRQUFBOztFQUVBLEtBQUEsV0FBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsT0FBQTs7SUFFQSxPQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBO01BQ0EsT0FBQTs7S0FFQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7TUFDQSxPQUFBO01BQ0EsT0FBQTs7OztHQUlBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsT0FBQTs7Ozs7RUFLQSxLQUFBLFlBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQTtLQUNBLE9BQUE7O0lBRUEsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtNQUNBLE9BQUE7O0tBRUEsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO01BQ0EsT0FBQTtNQUNBLE9BQUE7Ozs7R0FJQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQTtLQUNBLE9BQUE7Ozs7O0VBS0EsS0FBQSxVQUFBO0dBQ0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUE7S0FDQSxPQUFBOztJQUVBLE9BQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLFFBQUE7S0FDQSxNQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7TUFDQSxPQUFBOztLQUVBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtNQUNBLE9BQUE7TUFDQSxPQUFBO01BQ0EsVUFBQSxDQUFBOzs7O0dBSUEsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsVUFBQSxDQUFBOzs7OztFQUtBLEtBQUEsV0FBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsT0FBQTs7O0dBR0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUE7S0FDQSxPQUFBOzs7Ozs7Ozs7Ozs7O0FDL0ZBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLGFBQUEsWUFBQTtFQUNBOztFQUVBLElBQUEsUUFBQTs7O0VBR0EsSUFBQSxjQUFBLFlBQUE7R0FDQSxJQUFBLFNBQUEsU0FBQSxLQUFBLFFBQUEsS0FBQTs4QkFDQSxNQUFBOztHQUVBLElBQUEsUUFBQTs7R0FFQSxPQUFBLFFBQUEsVUFBQSxPQUFBOztJQUVBLElBQUEsVUFBQSxNQUFBLE1BQUE7SUFDQSxJQUFBLFdBQUEsUUFBQSxXQUFBLEdBQUE7S0FDQSxNQUFBLFFBQUEsTUFBQSxtQkFBQSxRQUFBOzs7O0dBSUEsT0FBQTs7OztFQUlBLElBQUEsY0FBQSxVQUFBLE9BQUE7R0FDQSxJQUFBLFNBQUE7R0FDQSxLQUFBLElBQUEsT0FBQSxPQUFBO0lBQ0EsVUFBQSxNQUFBLE1BQUEsbUJBQUEsTUFBQSxRQUFBOztHQUVBLE9BQUEsT0FBQSxVQUFBLEdBQUEsT0FBQSxTQUFBOzs7RUFHQSxLQUFBLFlBQUEsVUFBQSxHQUFBO0dBQ0EsTUFBQSxPQUFBO0dBQ0EsUUFBQSxVQUFBLE9BQUEsSUFBQSxNQUFBLE9BQUEsTUFBQSxZQUFBOzs7O0VBSUEsS0FBQSxNQUFBLFVBQUEsUUFBQTtHQUNBLEtBQUEsSUFBQSxPQUFBLFFBQUE7SUFDQSxNQUFBLE9BQUEsT0FBQTs7R0FFQSxRQUFBLGFBQUEsT0FBQSxJQUFBLE1BQUEsT0FBQSxNQUFBLFlBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsVUFBQSxLQUFBO0dBQ0EsT0FBQSxNQUFBOzs7RUFHQSxRQUFBLFFBQUE7O0VBRUEsSUFBQSxDQUFBLE9BQUE7R0FDQSxRQUFBOzs7RUFHQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBhbm5vdGF0aW9ucyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJywgWydkaWFzLmFwaScsICdkaWFzLnVpLm1lc3NhZ2VzJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0aW9uc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGFubm90YXRpb25zIGxpc3QgaW4gdGhlIHNpZGViYXJcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdBbm5vdGF0aW9uc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywgbGFiZWxzLCBhbm5vdGF0aW9ucywgc2hhcGVzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuc2VsZWN0ZWRGZWF0dXJlcyA9IG1hcEFubm90YXRpb25zLmdldFNlbGVjdGVkRmVhdHVyZXMoKS5nZXRBcnJheSgpO1xuXG5cdFx0JHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oJ3NlbGVjdGVkRmVhdHVyZXMnLCBmdW5jdGlvbiAoZmVhdHVyZXMpIHtcblx0XHRcdGZlYXR1cmVzLmZvckVhY2goZnVuY3Rpb24gKGZlYXR1cmUpIHtcblx0XHRcdFx0bGFiZWxzLmZldGNoRm9yQW5ub3RhdGlvbihmZWF0dXJlLmFubm90YXRpb24pO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHR2YXIgcmVmcmVzaEFubm90YXRpb25zID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmFubm90YXRpb25zID0gYW5ub3RhdGlvbnMuY3VycmVudCgpO1xuXHRcdH07XG5cblx0XHR2YXIgc2VsZWN0ZWRGZWF0dXJlcyA9IG1hcEFubm90YXRpb25zLmdldFNlbGVjdGVkRmVhdHVyZXMoKTtcblxuXHRcdCRzY29wZS5hbm5vdGF0aW9ucyA9IFtdO1xuXG5cdFx0JHNjb3BlLmNsZWFyU2VsZWN0aW9uID0gbWFwQW5ub3RhdGlvbnMuY2xlYXJTZWxlY3Rpb247XG5cblx0XHQkc2NvcGUuc2VsZWN0QW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChlLCBpZCkge1xuXHRcdFx0Ly8gYWxsb3cgbXVsdGlwbGUgc2VsZWN0aW9uc1xuXHRcdFx0aWYgKCFlLnNoaWZ0S2V5KSB7XG5cdFx0XHRcdCRzY29wZS5jbGVhclNlbGVjdGlvbigpO1xuXHRcdFx0fVxuXHRcdFx0bWFwQW5ub3RhdGlvbnMuc2VsZWN0KGlkKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmlzU2VsZWN0ZWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBzZWxlY3RlZCA9IGZhbHNlO1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5mb3JFYWNoKGZ1bmN0aW9uIChmZWF0dXJlKSB7XG5cdFx0XHRcdGlmIChmZWF0dXJlLmFubm90YXRpb24gJiYgZmVhdHVyZS5hbm5vdGF0aW9uLmlkID09IGlkKSB7XG5cdFx0XHRcdFx0c2VsZWN0ZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBzZWxlY3RlZDtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCByZWZyZXNoQW5ub3RhdGlvbnMpO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0b3JDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1haW4gY29udHJvbGxlciBvZiB0aGUgQW5ub3RhdG9yIGFwcGxpY2F0aW9uLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0Fubm90YXRvckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkYXR0cnMsIGltYWdlcywgdXJsUGFyYW1zLCBtc2csIGxhYmVscykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuaW1hZ2VzID0gaW1hZ2VzO1xuICAgICAgICAkc2NvcGUuaW1hZ2VMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmVkaXRNb2RlID0gISEkYXR0cnMuZWRpdE1vZGU7XG4gICAgICAgIC8vIGRvbid0IHBhcnNlIGFuIGVtcHR5IHN0cmluZ1xuICAgICAgICAkc2NvcGUucHJvamVjdElkcyA9ICRhdHRycy5wcm9qZWN0SWRzID8gJGF0dHJzLnByb2plY3RJZHMuc3BsaXQoJywnKSA6IFtdO1xuXG4gICAgICAgIGxhYmVscy5zZXRQcm9qZWN0SWRzKCRzY29wZS5wcm9qZWN0SWRzKTtcblxuICAgICAgICAvLyB0aGUgY3VycmVudCBjYW52YXMgdmlld3BvcnQsIHN5bmNlZCB3aXRoIHRoZSBVUkwgcGFyYW1ldGVyc1xuICAgICAgICAkc2NvcGUudmlld3BvcnQgPSB7XG4gICAgICAgICAgICB6b29tOiB1cmxQYXJhbXMuZ2V0KCd6JyksXG4gICAgICAgICAgICBjZW50ZXI6IFt1cmxQYXJhbXMuZ2V0KCd4JyksIHVybFBhcmFtcy5nZXQoJ3knKV1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmaW5pc2ggaW1hZ2UgbG9hZGluZyBwcm9jZXNzXG4gICAgICAgIHZhciBmaW5pc2hMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2ltYWdlLnNob3duJywgJHNjb3BlLmltYWdlcy5jdXJyZW50SW1hZ2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5XG4gICAgICAgIHZhciBwdXNoU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB1cmxQYXJhbXMucHVzaFN0YXRlKCRzY29wZS5pbWFnZXMuY3VycmVudEltYWdlLl9pZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc3RhcnQgaW1hZ2UgbG9hZGluZyBwcm9jZXNzXG4gICAgICAgIHZhciBzdGFydExvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBsb2FkIHRoZSBpbWFnZSBieSBpZC4gZG9lc24ndCBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeSBieSBpdHNlbGZcbiAgICAgICAgdmFyIGxvYWRJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgc3RhcnRMb2FkaW5nKCk7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VzLnNob3cocGFyc2VJbnQoaWQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlS2V5RXZlbnRzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoZS5rZXlDb2RlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAzNzpcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnByZXZJbWFnZSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM5OlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubmV4dEltYWdlKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHNob3cgdGhlIG5leHQgaW1hZ2UgYW5kIGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5XG4gICAgICAgICRzY29wZS5uZXh0SW1hZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIGltYWdlcy5uZXh0KClcbiAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAudGhlbihwdXNoU3RhdGUpXG4gICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHNob3cgdGhlIHByZXZpb3VzIGltYWdlIGFuZCBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeVxuICAgICAgICAkc2NvcGUucHJldkltYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc3RhcnRMb2FkaW5nKCk7XG4gICAgICAgICAgICBpbWFnZXMucHJldigpXG4gICAgICAgICAgICAgICAgICAudGhlbihmaW5pc2hMb2FkaW5nKVxuICAgICAgICAgICAgICAgICAgLnRoZW4ocHVzaFN0YXRlKVxuICAgICAgICAgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyB1cGRhdGUgdGhlIFVSTCBwYXJhbWV0ZXJzIG9mIHRoZSB2aWV3cG9ydFxuICAgICAgICAkc2NvcGUuJG9uKCdjYW52YXMubW92ZWVuZCcsIGZ1bmN0aW9uKGUsIHBhcmFtcykge1xuICAgICAgICAgICAgJHNjb3BlLnZpZXdwb3J0Lnpvb20gPSBwYXJhbXMuem9vbTtcbiAgICAgICAgICAgICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMF0gPSBNYXRoLnJvdW5kKHBhcmFtcy5jZW50ZXJbMF0pO1xuICAgICAgICAgICAgJHNjb3BlLnZpZXdwb3J0LmNlbnRlclsxXSA9IE1hdGgucm91bmQocGFyYW1zLmNlbnRlclsxXSk7XG4gICAgICAgICAgICB1cmxQYXJhbXMuc2V0KHtcbiAgICAgICAgICAgICAgICB6OiAkc2NvcGUudmlld3BvcnQuem9vbSxcbiAgICAgICAgICAgICAgICB4OiAkc2NvcGUudmlld3BvcnQuY2VudGVyWzBdLFxuICAgICAgICAgICAgICAgIHk6ICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMV1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBsaXN0ZW4gdG8gdGhlIGJyb3dzZXIgXCJiYWNrXCIgYnV0dG9uXG4gICAgICAgIHdpbmRvdy5vbnBvcHN0YXRlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHN0YXRlID0gZS5zdGF0ZTtcbiAgICAgICAgICAgIGlmIChzdGF0ZSAmJiBzdGF0ZS5zbHVnICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBsb2FkSW1hZ2Uoc3RhdGUuc2x1Zyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5cHJlc3MnLCBoYW5kbGVLZXlFdmVudHMpO1xuXG4gICAgICAgIC8vIGluaXRpYWxpemUgdGhlIGltYWdlcyBzZXJ2aWNlXG4gICAgICAgIGltYWdlcy5pbml0KCRhdHRycy50cmFuc2VjdElkKTtcbiAgICAgICAgLy8gZGlzcGxheSB0aGUgZmlyc3QgaW1hZ2VcbiAgICAgICAgbG9hZEltYWdlKCRhdHRycy5pbWFnZUlkKS50aGVuKHB1c2hTdGF0ZSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQ2FudmFzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBNYWluIGNvbnRyb2xsZXIgZm9yIHRoZSBhbm5vdGF0aW9uIGNhbnZhcyBlbGVtZW50XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQ2FudmFzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEltYWdlLCBtYXBBbm5vdGF0aW9ucywgbWFwLCAkdGltZW91dCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0Ly8gdXBkYXRlIHRoZSBVUkwgcGFyYW1ldGVyc1xuXHRcdG1hcC5vbignbW92ZWVuZCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdHZhciB2aWV3ID0gbWFwLmdldFZpZXcoKTtcblx0XHRcdCRzY29wZS4kZW1pdCgnY2FudmFzLm1vdmVlbmQnLCB7XG5cdFx0XHRcdGNlbnRlcjogdmlldy5nZXRDZW50ZXIoKSxcblx0XHRcdFx0em9vbTogdmlldy5nZXRab29tKClcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWFwSW1hZ2UuaW5pdCgkc2NvcGUpO1xuXHRcdG1hcEFubm90YXRpb25zLmluaXQoJHNjb3BlKTtcblxuXHRcdHZhciB1cGRhdGVTaXplID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0Ly8gd29ya2Fyb3VuZCwgc28gdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZCAqYWZ0ZXIqIHRoZSBhbmd1bGFyIGRpZ2VzdFxuXHRcdFx0Ly8gYW5kICphZnRlciogdGhlIGZvbGRvdXQgd2FzIHJlbmRlcmVkXG5cdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0bWFwLnVwZGF0ZVNpemUoKTtcblx0XHRcdH0sIDAsIGZhbHNlKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiRvbignc2lkZWJhci5mb2xkb3V0Lm9wZW4nLCB1cGRhdGVTaXplKTtcblx0XHQkc2NvcGUuJG9uKCdzaWRlYmFyLmZvbGRvdXQuY2xvc2UnLCB1cGRhdGVTaXplKTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENhdGVnb3JpZXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyIGxhYmVsIGNhdGVnb3JpZXMgZm9sZG91dFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NhdGVnb3JpZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbGFiZWxzKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5jYXRlZ29yaWVzID0gW107XG4gICAgICAgIGxhYmVscy5wcm9taXNlLnRoZW4oZnVuY3Rpb24gKGFsbCkge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGFsbCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5jYXRlZ29yaWVzID0gJHNjb3BlLmNhdGVnb3JpZXMuY29uY2F0KGFsbFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXNUcmVlID0gbGFiZWxzLmdldFRyZWUoKTtcblxuICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICBsYWJlbHMuc2V0U2VsZWN0ZWQoaXRlbSk7XG4gICAgICAgICAgICAkc2NvcGUuc2VhcmNoQ2F0ZWdvcnkgPSAnJzsgLy8gY2xlYXIgc2VhcmNoIGZpZWxkXG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGl0ZW0pO1xuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENvbmZpZGVuY2VDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBjb25maWRlbmNlIGNvbnRyb2xcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDb25maWRlbmNlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGxhYmVscykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLmNvbmZpZGVuY2UgPSAxLjA7XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdjb25maWRlbmNlJywgZnVuY3Rpb24gKGNvbmZpZGVuY2UpIHtcblx0XHRcdGxhYmVscy5zZXRDdXJyZW50Q29uZmlkZW5jZShwYXJzZUZsb2F0KGNvbmZpZGVuY2UpKTtcblxuXHRcdFx0aWYgKGNvbmZpZGVuY2UgPD0gMC4yNSkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLWRhbmdlcic7XG5cdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC41ICkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXdhcm5pbmcnO1xuXHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNzUgKSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtc3VjY2Vzcyc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXByaW1hcnknO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDb250cm9sc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgY29udHJvbCBidXR0b25zXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQ29udHJvbHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMsIGxhYmVscywgbXNnLCAkYXR0cnMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBkcmF3aW5nID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuc2VsZWN0U2hhcGUgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0aWYgKCFsYWJlbHMuaGFzU2VsZWN0ZWQoKSkge1xuICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnc2lkZWJhci5mb2xkb3V0LmRvLW9wZW4nLCAnY2F0ZWdvcmllcycpO1xuXHRcdFx0XHRtc2cuaW5mbygkYXR0cnMuc2VsZWN0Q2F0ZWdvcnkpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdG1hcEFubm90YXRpb25zLmZpbmlzaERyYXdpbmcoKTtcblxuXHRcdFx0aWYgKG5hbWUgPT09IG51bGwgfHwgKGRyYXdpbmcgJiYgJHNjb3BlLnNlbGVjdGVkU2hhcGUgPT09IG5hbWUpKSB7XG5cdFx0XHRcdCRzY29wZS5zZWxlY3RlZFNoYXBlID0gJyc7XG5cdFx0XHRcdGRyYXdpbmcgPSBmYWxzZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5zZWxlY3RlZFNoYXBlID0gbmFtZTtcblx0XHRcdFx0bWFwQW5ub3RhdGlvbnMuc3RhcnREcmF3aW5nKG5hbWUpO1xuXHRcdFx0XHRkcmF3aW5nID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBNaW5pbWFwQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgbWluaW1hcCBpbiB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ01pbmltYXBDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwLCBtYXBJbWFnZSwgJGVsZW1lbnQsIHN0eWxlcykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIG1pbmltYXAgPSBuZXcgb2wuTWFwKHtcblx0XHRcdHRhcmdldDogJ21pbmltYXAnLFxuXHRcdFx0Ly8gcmVtb3ZlIGNvbnRyb2xzXG5cdFx0XHRjb250cm9sczogW10sXG5cdFx0XHQvLyBkaXNhYmxlIGludGVyYWN0aW9uc1xuXHRcdFx0aW50ZXJhY3Rpb25zOiBbXVxuXHRcdH0pO1xuXG5cdFx0Ly8gZ2V0IHRoZSBzYW1lIGxheWVycyB0aGFuIHRoZSBtYXBcblx0XHRtaW5pbWFwLnNldExheWVyR3JvdXAobWFwLmdldExheWVyR3JvdXAoKSk7XG5cblx0XHR2YXIgZmVhdHVyZU92ZXJsYXkgPSBuZXcgb2wuRmVhdHVyZU92ZXJsYXkoe1xuXHRcdFx0bWFwOiBtaW5pbWFwLFxuXHRcdFx0c3R5bGU6IHN0eWxlcy52aWV3cG9ydFxuXHRcdH0pO1xuXG5cdFx0dmFyIHZpZXdwb3J0ID0gbmV3IG9sLkZlYXR1cmUoKTtcblx0XHRmZWF0dXJlT3ZlcmxheS5hZGRGZWF0dXJlKHZpZXdwb3J0KTtcblxuXHRcdC8vIHJlZnJlc2ggdGhlIHZpZXcgKHRoZSBpbWFnZSBzaXplIGNvdWxkIGhhdmUgYmVlbiBjaGFuZ2VkKVxuXHRcdCRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC5zZXRWaWV3KG5ldyBvbC5WaWV3KHtcblx0XHRcdFx0cHJvamVjdGlvbjogbWFwSW1hZ2UuZ2V0UHJvamVjdGlvbigpLFxuXHRcdFx0XHRjZW50ZXI6IG9sLmV4dGVudC5nZXRDZW50ZXIobWFwSW1hZ2UuZ2V0RXh0ZW50KCkpLFxuXHRcdFx0XHR6b29tOiAwXG5cdFx0XHR9KSk7XG5cdFx0fSk7XG5cblx0XHQvLyBtb3ZlIHRoZSB2aWV3cG9ydCByZWN0YW5nbGUgb24gdGhlIG1pbmltYXBcblx0XHR2YXIgcmVmcmVzaFZpZXdwb3J0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIGV4dGVudCA9IG1hcC5nZXRWaWV3KCkuY2FsY3VsYXRlRXh0ZW50KG1hcC5nZXRTaXplKCkpO1xuXHRcdFx0dmlld3BvcnQuc2V0R2VvbWV0cnkob2wuZ2VvbS5Qb2x5Z29uLmZyb21FeHRlbnQoZXh0ZW50KSk7XG5cdFx0fTtcblxuXHRcdG1hcC5vbignbW92ZWVuZCcsIHJlZnJlc2hWaWV3cG9ydCk7XG5cblx0XHR2YXIgZHJhZ1ZpZXdwb3J0ID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdG1hcC5nZXRWaWV3KCkuc2V0Q2VudGVyKGUuY29vcmRpbmF0ZSk7XG5cdFx0fTtcblxuXHRcdG1pbmltYXAub24oJ3BvaW50ZXJkcmFnJywgZHJhZ1ZpZXdwb3J0KTtcblxuXHRcdCRlbGVtZW50Lm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC51bigncG9pbnRlcmRyYWcnLCBkcmFnVmlld3BvcnQpO1xuXHRcdH0pO1xuXG5cdFx0JGVsZW1lbnQub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtaW5pbWFwLm9uKCdwb2ludGVyZHJhZycsIGRyYWdWaWV3cG9ydCk7XG5cdFx0fSk7XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTaWRlYmFyQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NpZGViYXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgbWFwQW5ub3RhdGlvbnMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdC8vIHRoZSBjdXJyZW50bHkgb3BlbmVkIHNpZGViYXItJ2V4dGVuc2lvbidcblx0XHQkc2NvcGUuZm9sZG91dCA9ICcnO1xuXG5cdFx0JHNjb3BlLm9wZW5Gb2xkb3V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRcdCRzY29wZS5mb2xkb3V0ID0gbmFtZTtcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2lkZWJhci5mb2xkb3V0Lm9wZW4nKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNsb3NlRm9sZG91dCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5mb2xkb3V0ID0gJyc7XG5cdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NpZGViYXIuZm9sZG91dC5jbG9zZScpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlRm9sZG91dCA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmZvbGRvdXQgPT09IG5hbWUpIHtcblx0XHRcdFx0JHNjb3BlLmNsb3NlRm9sZG91dCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLm9wZW5Gb2xkb3V0KG5hbWUpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUuZGVsZXRlU2VsZWN0ZWRBbm5vdGF0aW9ucyA9IG1hcEFubm90YXRpb25zLmRlbGV0ZVNlbGVjdGVkO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKCdzaWRlYmFyLmZvbGRvdXQuZG8tb3BlbicsIGZ1bmN0aW9uIChlLCBuYW1lKSB7XG4gICAgICAgICAgICAkc2NvcGUub3BlbkZvbGRvdXQobmFtZSk7XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGFubm90YXRpb25MaXN0SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBbiBhbm5vdGF0aW9uIGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5kaXJlY3RpdmUoJ2Fubm90YXRpb25MaXN0SXRlbScsIGZ1bmN0aW9uIChsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRzY29wZTogdHJ1ZSxcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0JHNjb3BlLnNoYXBlQ2xhc3MgPSAnaWNvbi0nICsgJHNjb3BlLmFubm90YXRpb24uc2hhcGUudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0XHQkc2NvcGUuc2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS5pc1NlbGVjdGVkKCRzY29wZS5hbm5vdGF0aW9uLmlkKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuYXR0YWNoTGFiZWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0bGFiZWxzLmF0dGFjaFRvQW5ub3RhdGlvbigkc2NvcGUuYW5ub3RhdGlvbik7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLnJlbW92ZUxhYmVsID0gZnVuY3Rpb24gKGxhYmVsKSB7XG5cdFx0XHRcdFx0bGFiZWxzLnJlbW92ZUZyb21Bbm5vdGF0aW9uKCRzY29wZS5hbm5vdGF0aW9uLCBsYWJlbCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmNhbkF0dGFjaExhYmVsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuc2VsZWN0ZWQoKSAmJiBsYWJlbHMuaGFzU2VsZWN0ZWQoKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudExhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkO1xuXG5cdFx0XHRcdCRzY29wZS5jdXJyZW50Q29uZmlkZW5jZSA9IGxhYmVscy5nZXRDdXJyZW50Q29uZmlkZW5jZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhYmVsQ2F0ZWdvcnlJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgbGFiZWwgY2F0ZWdvcnkgbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmRpcmVjdGl2ZSgnbGFiZWxDYXRlZ29yeUl0ZW0nLCBmdW5jdGlvbiAoJGNvbXBpbGUsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdDJyxcblxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdsYWJlbC1pdGVtLmh0bWwnLFxuXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHdhaXQgZm9yIHRoaXMgZWxlbWVudCB0byBiZSByZW5kZXJlZCB1bnRpbCB0aGUgY2hpbGRyZW4gYXJlXG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kZWQsIG90aGVyd2lzZSB0aGVyZSB3b3VsZCBiZSB0b28gbXVjaCByZWN1cnNpb24gZm9yXG4gICAgICAgICAgICAgICAgLy8gYW5ndWxhclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnbGFiZWwtc3VidHJlZS5odG1sJykpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoY29udGVudCkoc2NvcGUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIHRoZSBzdWJ0cmVlIG9mIHRoaXMgaXRlbVxuICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaGFzIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzRXhwYW5kYWJsZSA9ICEhJHNjb3BlLnRyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8gaGFuZGxlIHRoaXMgYnkgdGhlIGV2ZW50IHJhdGhlciB0aGFuIGFuIG93biBjbGljayBoYW5kbGVyIHRvXG4gICAgICAgICAgICAgICAgLy8gZGVhbCB3aXRoIGNsaWNrIGFuZCBzZWFyY2ggZmllbGQgYWN0aW9ucyBpbiBhIHVuaWZpZWQgd2F5XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGZ1bmN0aW9uIChlLCBjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbiBpdGVtIGlzIHNlbGVjdGVkLCBpdHMgc3VidHJlZSBhbmQgYWxsIHBhcmVudCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgb3BlbmVkXG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5pZCA9PT0gY2F0ZWdvcnkuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBoaXRzIGFsbCBwYXJlbnQgc2NvcGVzL2l0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGEgY2hpbGQgaXRlbSB3YXMgc2VsZWN0ZWQsIHRoaXMgaXRlbSBzaG91bGQgYmUgb3BlbmVkLCB0b29cbiAgICAgICAgICAgICAgICAvLyBzbyB0aGUgc2VsZWN0ZWQgaXRlbSBiZWNvbWVzIHZpc2libGUgaW4gdGhlIHRyZWVcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3AgcHJvcGFnYXRpb24gaWYgdGhpcyBpcyBhIHJvb3QgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0ucGFyZW50X2lkID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYWJlbEl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQW4gYW5ub3RhdGlvbiBsYWJlbCBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZGlyZWN0aXZlKCdsYWJlbEl0ZW0nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFx0XHR2YXIgY29uZmlkZW5jZSA9ICRzY29wZS5hbm5vdGF0aW9uTGFiZWwuY29uZmlkZW5jZTtcblxuXHRcdFx0XHRpZiAoY29uZmlkZW5jZSA8PSAwLjI1KSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLWRhbmdlcic7XG5cdFx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjUgKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXdhcm5pbmcnO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC43NSApIHtcblx0XHRcdFx0XHQkc2NvcGUuY2xhc3MgPSAnbGFiZWwtc3VjY2Vzcyc7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXByaW1hcnknO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgZGVib3VuY2VcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQSBkZWJvdW5jZSBzZXJ2aWNlIHRvIHBlcmZvcm0gYW4gYWN0aW9uIG9ubHkgd2hlbiB0aGlzIGZ1bmN0aW9uXG4gKiB3YXNuJ3QgY2FsbGVkIGFnYWluIGluIGEgc2hvcnQgcGVyaW9kIG9mIHRpbWUuXG4gKiBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTMzMjAwMTYvMTc5NjUyM1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmZhY3RvcnkoJ2RlYm91bmNlJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkcSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHRpbWVvdXRzID0ge307XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gKGZ1bmMsIHdhaXQsIGlkKSB7XG5cdFx0XHQvLyBDcmVhdGUgYSBkZWZlcnJlZCBvYmplY3QgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gd2UgbmVlZCB0b1xuXHRcdFx0Ly8gYWN0dWFsbHkgY2FsbCB0aGUgZnVuY1xuXHRcdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHRcdFx0dmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGltZW91dHNbaWRdID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKSk7XG5cdFx0XHRcdFx0ZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpZiAodGltZW91dHNbaWRdKSB7XG5cdFx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRzW2lkXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGltZW91dHNbaWRdID0gJHRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHRcdH0pKCk7XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIG1hcFxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIGZhY3RvcnkgaGFuZGxpbmcgT3BlbkxheWVycyBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5mYWN0b3J5KCdtYXAnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgbWFwID0gbmV3IG9sLk1hcCh7XG5cdFx0XHR0YXJnZXQ6ICdjYW52YXMnLFxuXHRcdFx0Y29udHJvbHM6IFtcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuWm9vbSgpLFxuXHRcdFx0XHRuZXcgb2wuY29udHJvbC5ab29tVG9FeHRlbnQoKSxcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuRnVsbFNjcmVlbigpXG5cdFx0XHRdXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gbWFwO1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgYW5ub3RhdGlvbnNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIHRoZSBhbm5vdGF0aW9ucyB0byBtYWtlIHRoZW0gYXZhaWxhYmxlIGluIG11bHRpcGxlIGNvbnRyb2xsZXJzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2Fubm90YXRpb25zJywgZnVuY3Rpb24gKEFubm90YXRpb24sIHNoYXBlcywgbGFiZWxzLCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBhbm5vdGF0aW9ucztcblxuXHRcdHZhciByZXNvbHZlU2hhcGVOYW1lID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdGFubm90YXRpb24uc2hhcGUgPSBzaGFwZXMuZ2V0TmFtZShhbm5vdGF0aW9uLnNoYXBlX2lkKTtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR2YXIgYWRkQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHRhbm5vdGF0aW9ucy5wdXNoKGFubm90YXRpb24pO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb247XG5cdFx0fTtcblxuXHRcdHRoaXMucXVlcnkgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRhbm5vdGF0aW9ucyA9IEFubm90YXRpb24ucXVlcnkocGFyYW1zKTtcblx0XHRcdGFubm90YXRpb25zLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKGEpIHtcblx0XHRcdFx0YS5mb3JFYWNoKHJlc29sdmVTaGFwZU5hbWUpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnM7XG5cdFx0fTtcblxuXHRcdHRoaXMuYWRkID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0aWYgKCFwYXJhbXMuc2hhcGVfaWQgJiYgcGFyYW1zLnNoYXBlKSB7XG5cdFx0XHRcdHBhcmFtcy5zaGFwZV9pZCA9IHNoYXBlcy5nZXRJZChwYXJhbXMuc2hhcGUpO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGxhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkKCk7XG5cdFx0XHRwYXJhbXMubGFiZWxfaWQgPSBsYWJlbC5pZDtcblx0XHRcdHBhcmFtcy5jb25maWRlbmNlID0gbGFiZWxzLmdldEN1cnJlbnRDb25maWRlbmNlKCk7XG5cdFx0XHR2YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uYWRkKHBhcmFtcyk7XG5cdFx0XHRhbm5vdGF0aW9uLiRwcm9taXNlXG5cdFx0XHQgICAgICAgICAgLnRoZW4ocmVzb2x2ZVNoYXBlTmFtZSlcblx0XHRcdCAgICAgICAgICAudGhlbihhZGRBbm5vdGF0aW9uKVxuXHRcdFx0ICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG5cblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHQvLyB1c2UgaW5kZXggdG8gc2VlIGlmIHRoZSBhbm5vdGF0aW9uIGV4aXN0cyBpbiB0aGUgYW5ub3RhdGlvbnMgbGlzdFxuXHRcdFx0dmFyIGluZGV4ID0gYW5ub3RhdGlvbnMuaW5kZXhPZihhbm5vdGF0aW9uKTtcblx0XHRcdGlmIChpbmRleCA+IC0xKSB7XG5cdFx0XHRcdHJldHVybiBhbm5vdGF0aW9uLiRkZWxldGUoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdC8vIHVwZGF0ZSB0aGUgaW5kZXggc2luY2UgdGhlIGFubm90YXRpb25zIGxpc3QgbWF5IGhhdmUgYmVlbiBcblx0XHRcdFx0XHQvLyBtb2RpZmllZCBpbiB0aGUgbWVhbnRpbWVcblx0XHRcdFx0XHRpbmRleCA9IGFubm90YXRpb25zLmluZGV4T2YoYW5ub3RhdGlvbik7XG5cdFx0XHRcdFx0YW5ub3RhdGlvbnMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0fSwgbXNnLnJlc3BvbnNlRXJyb3IpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLmZvckVhY2ggPSBmdW5jdGlvbiAoZm4pIHtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9ucy5mb3JFYWNoKGZuKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5jdXJyZW50ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb25zO1xuXHRcdH07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBpbWFnZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFuYWdlcyAocHJlLSlsb2FkaW5nIG9mIHRoZSBpbWFnZXMgdG8gYW5ub3RhdGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnaW1hZ2VzJywgZnVuY3Rpb24gKFRyYW5zZWN0SW1hZ2UsIFVSTCwgJHEpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cdFx0Ly8gYXJyYXkgb2YgYWxsIGltYWdlIElEcyBvZiB0aGUgdHJhbnNlY3Rcblx0XHR2YXIgaW1hZ2VJZHMgPSBbXTtcblx0XHQvLyBtYXhpbXVtIG51bWJlciBvZiBpbWFnZXMgdG8gaG9sZCBpbiBidWZmZXJcblx0XHR2YXIgTUFYX0JVRkZFUl9TSVpFID0gMTA7XG5cdFx0Ly8gYnVmZmVyIG9mIGFscmVhZHkgbG9hZGVkIGltYWdlc1xuXHRcdHZhciBidWZmZXIgPSBbXTtcblxuXHRcdC8vIHRoZSBjdXJyZW50bHkgc2hvd24gaW1hZ2Vcblx0XHR0aGlzLmN1cnJlbnRJbWFnZSA9IHVuZGVmaW5lZDtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIG5leHQgSUQgb2YgdGhlIHNwZWNpZmllZCBpbWFnZSBvciB0aGUgbmV4dCBJRCBvZiB0aGUgXG5cdFx0ICogY3VycmVudCBpbWFnZSBpZiBubyBpbWFnZSB3YXMgc3BlY2lmaWVkLlxuXHRcdCAqL1xuXHRcdHZhciBuZXh0SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdHZhciBpbmRleCA9IGltYWdlSWRzLmluZGV4T2YoaWQpO1xuXHRcdFx0cmV0dXJuIGltYWdlSWRzWyhpbmRleCArIDEpICUgaW1hZ2VJZHMubGVuZ3RoXTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgcHJldmlvdXMgSUQgb2YgdGhlIHNwZWNpZmllZCBpbWFnZSBvciB0aGUgcHJldmlvdXMgSUQgb2Zcblx0XHQgKiB0aGUgY3VycmVudCBpbWFnZSBpZiBubyBpbWFnZSB3YXMgc3BlY2lmaWVkLlxuXHRcdCAqL1xuXHRcdHZhciBwcmV2SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdHZhciBpbmRleCA9IGltYWdlSWRzLmluZGV4T2YoaWQpO1xuXHRcdFx0dmFyIGxlbmd0aCA9IGltYWdlSWRzLmxlbmd0aDtcblx0XHRcdHJldHVybiBpbWFnZUlkc1soaW5kZXggLSAxICsgbGVuZ3RoKSAlIGxlbmd0aF07XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIHNwZWNpZmllZCBpbWFnZSBmcm9tIHRoZSBidWZmZXIgb3IgYHVuZGVmaW5lZGAgaWYgaXQgaXNcblx0XHQgKiBub3QgYnVmZmVyZWQuXG5cdFx0ICovXG5cdFx0dmFyIGdldEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRpZCA9IGlkIHx8IF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0XHRmb3IgKHZhciBpID0gYnVmZmVyLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdGlmIChidWZmZXJbaV0uX2lkID09IGlkKSByZXR1cm4gYnVmZmVyW2ldO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTZXRzIHRoZSBzcGVjaWZpZWQgaW1hZ2UgdG8gYXMgdGhlIGN1cnJlbnRseSBzaG93biBpbWFnZS5cblx0XHQgKi9cblx0XHR2YXIgc2hvdyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0X3RoaXMuY3VycmVudEltYWdlID0gZ2V0SW1hZ2UoaWQpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBMb2FkcyB0aGUgc3BlY2lmaWVkIGltYWdlIGVpdGhlciBmcm9tIGJ1ZmZlciBvciBmcm9tIHRoZSBleHRlcm5hbCBcblx0XHQgKiByZXNvdXJjZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBnZXRzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzXG5cdFx0ICogbG9hZGVkLlxuXHRcdCAqL1xuXHRcdHZhciBmZXRjaEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXHRcdFx0dmFyIGltZyA9IGdldEltYWdlKGlkKTtcblxuXHRcdFx0aWYgKGltZykge1xuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGltZyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcblx0XHRcdFx0aW1nLl9pZCA9IGlkO1xuXHRcdFx0XHRpbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGJ1ZmZlci5wdXNoKGltZyk7XG5cdFx0XHRcdFx0Ly8gY29udHJvbCBtYXhpbXVtIGJ1ZmZlciBzaXplXG5cdFx0XHRcdFx0aWYgKGJ1ZmZlci5sZW5ndGggPiBNQVhfQlVGRkVSX1NJWkUpIHtcblx0XHRcdFx0XHRcdGJ1ZmZlci5zaGlmdCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGltZyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGltZy5vbmVycm9yID0gZnVuY3Rpb24gKG1zZykge1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlamVjdChtc2cpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpbWcuc3JjID0gVVJMICsgXCIvYXBpL3YxL2ltYWdlcy9cIiArIGlkICsgXCIvZmlsZVwiO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSW5pdGlhbGl6ZXMgdGhlIHNlcnZpY2UgZm9yIGEgZ2l2ZW4gdHJhbnNlY3QuIFJldHVybnMgYSBwcm9taXNlIHRoYXRcblx0XHQgKiBpcyByZXNvbHZlZCwgd2hlbiB0aGUgc2VydmljZSBpcyBpbml0aWFsaXplZC5cblx0XHQgKi9cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAodHJhbnNlY3RJZCkge1xuXHRcdFx0aW1hZ2VJZHMgPSBUcmFuc2VjdEltYWdlLnF1ZXJ5KHt0cmFuc2VjdF9pZDogdHJhbnNlY3RJZH0pO1xuXHRcdFx0XG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHMuJHByb21pc2U7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNob3cgdGhlIGltYWdlIHdpdGggdGhlIHNwZWNpZmllZCBJRC4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMuc2hvdyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIHByb21pc2UgPSBmZXRjaEltYWdlKGlkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzaG93KGlkKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyB3YWl0IGZvciBpbWFnZUlkcyB0byBiZSBsb2FkZWRcblx0XHRcdGltYWdlSWRzLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyBwcmUtbG9hZCBwcmV2aW91cyBhbmQgbmV4dCBpbWFnZXMgYnV0IGRvbid0IGRpc3BsYXkgdGhlbVxuXHRcdFx0XHRmZXRjaEltYWdlKG5leHRJZChpZCkpO1xuXHRcdFx0XHRmZXRjaEltYWdlKHByZXZJZChpZCkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBwcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBuZXh0IGltYWdlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzXG5cdFx0ICogcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXMgc2hvd24uXG5cdFx0ICovXG5cdFx0dGhpcy5uZXh0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF90aGlzLnNob3cobmV4dElkKCkpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBwcmV2aW91cyBpbWFnZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMucHJldiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfdGhpcy5zaG93KHByZXZJZCgpKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRDdXJyZW50SWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHR9O1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbGFiZWxzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgYW5ub3RhdGlvbiBsYWJlbHMgdG8gcHJvdmlkZSBzb21lIGNvbnZlbmllbmNlIGZ1bmN0aW9ucy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdsYWJlbHMnLCBmdW5jdGlvbiAoQW5ub3RhdGlvbkxhYmVsLCBMYWJlbCwgUHJvamVjdExhYmVsLCBQcm9qZWN0LCBtc2csICRxKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZExhYmVsO1xuICAgICAgICB2YXIgY3VycmVudENvbmZpZGVuY2UgPSAxLjA7XG5cbiAgICAgICAgdmFyIGxhYmVscyA9IHt9O1xuXG4gICAgICAgIC8vIHRoaXMgcHJvbWlzZSBpcyByZXNvbHZlZCB3aGVuIGFsbCBsYWJlbHMgd2VyZSBsb2FkZWRcbiAgICAgICAgdGhpcy5wcm9taXNlID0gbnVsbDtcblxuICAgICAgICB0aGlzLnNldFByb2plY3RJZHMgPSBmdW5jdGlvbiAoaWRzKSB7XG4gICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgdGhpcy5wcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIC8vIC0xIGJjYXVzZSBvZiBnbG9iYWwgbGFiZWxzXG4gICAgICAgICAgICB2YXIgZmluaXNoZWQgPSAtMTtcblxuICAgICAgICAgICAgLy8gY2hlY2sgaWYgYWxsIGxhYmVscyBhcmUgdGhlcmUuIGlmIHllcywgcmVzb2x2ZVxuICAgICAgICAgICAgdmFyIG1heWJlUmVzb2x2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoKytmaW5pc2hlZCA9PT0gaWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGxhYmVscyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbGFiZWxzW251bGxdID0gTGFiZWwucXVlcnkobWF5YmVSZXNvbHZlKTtcblxuICAgICAgICAgICAgaWRzLmZvckVhY2goZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICAgICAgUHJvamVjdC5nZXQoe2lkOiBpZH0sIGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsc1twcm9qZWN0Lm5hbWVdID0gUHJvamVjdExhYmVsLnF1ZXJ5KHtwcm9qZWN0X2lkOiBpZH0sIG1heWJlUmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmZldGNoRm9yQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICBpZiAoIWFubm90YXRpb24pIHJldHVybjtcblxuICAgICAgICAgICAgLy8gZG9uJ3QgZmV0Y2ggdHdpY2VcbiAgICAgICAgICAgIGlmICghYW5ub3RhdGlvbi5sYWJlbHMpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscyA9IEFubm90YXRpb25MYWJlbC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgIGFubm90YXRpb25faWQ6IGFubm90YXRpb24uaWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFubm90YXRpb24ubGFiZWxzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYXR0YWNoVG9Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IEFubm90YXRpb25MYWJlbC5hdHRhY2goe1xuICAgICAgICAgICAgICAgIGFubm90YXRpb25faWQ6IGFubm90YXRpb24uaWQsXG4gICAgICAgICAgICAgICAgbGFiZWxfaWQ6IHNlbGVjdGVkTGFiZWwuaWQsXG4gICAgICAgICAgICAgICAgY29uZmlkZW5jZTogY3VycmVudENvbmZpZGVuY2VcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsYWJlbC4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscy5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsYWJlbC4kcHJvbWlzZS5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG5cbiAgICAgICAgICAgIHJldHVybiBsYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJlbW92ZUZyb21Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24sIGxhYmVsKSB7XG4gICAgICAgICAgICAvLyB1c2UgaW5kZXggdG8gc2VlIGlmIHRoZSBsYWJlbCBleGlzdHMgZm9yIHRoZSBhbm5vdGF0aW9uXG4gICAgICAgICAgICB2YXIgaW5kZXggPSBhbm5vdGF0aW9uLmxhYmVscy5pbmRleE9mKGxhYmVsKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhYmVsLiRkZWxldGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGluZGV4IHNpbmNlIHRoZSBsYWJlbCBsaXN0IG1heSBoYXZlIGJlZW4gbW9kaWZpZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIG1lYW50aW1lXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gYW5ub3RhdGlvbi5sYWJlbHMuaW5kZXhPZihsYWJlbCk7XG4gICAgICAgICAgICAgICAgICAgIGFubm90YXRpb24ubGFiZWxzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgfSwgbXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0VHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge307XG4gICAgICAgICAgICB2YXIga2V5ID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBidWlsZCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBsYWJlbC5wYXJlbnRfaWQ7XG4gICAgICAgICAgICAgICAgaWYgKHRyZWVba2V5XVtwYXJlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XVtwYXJlbnRdLnB1c2gobGFiZWwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XVtwYXJlbnRdID0gW2xhYmVsXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnByb21pc2UudGhlbihmdW5jdGlvbiAobGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBsYWJlbHNba2V5XS5mb3JFYWNoKGJ1aWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbGFiZWxzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2V0U2VsZWN0ZWQgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkTGFiZWwgPSBsYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldFNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGVkTGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIXNlbGVjdGVkTGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRDdXJyZW50Q29uZmlkZW5jZSA9IGZ1bmN0aW9uIChjb25maWRlbmNlKSB7XG4gICAgICAgICAgICBjdXJyZW50Q29uZmlkZW5jZSA9IGNvbmZpZGVuY2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRDdXJyZW50Q29uZmlkZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50Q29uZmlkZW5jZTtcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBtYXBBbm5vdGF0aW9uc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgaGFuZGxpbmcgdGhlIGFubm90YXRpb25zIGxheWVyIG9uIHRoZSBPcGVuTGF5ZXJzIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ21hcEFubm90YXRpb25zJywgZnVuY3Rpb24gKG1hcCwgaW1hZ2VzLCBhbm5vdGF0aW9ucywgZGVib3VuY2UsIHN0eWxlcykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGZlYXR1cmVPdmVybGF5ID0gbmV3IG9sLkZlYXR1cmVPdmVybGF5KHtcblx0XHRcdHN0eWxlOiBzdHlsZXMuZmVhdHVyZXNcblx0XHR9KTtcblxuXHRcdHZhciBmZWF0dXJlcyA9IG5ldyBvbC5Db2xsZWN0aW9uKCk7XG5cblx0XHRmZWF0dXJlT3ZlcmxheS5zZXRGZWF0dXJlcyhmZWF0dXJlcyk7XG5cblx0XHQvLyBzZWxlY3QgaW50ZXJhY3Rpb24gd29ya2luZyBvbiBcInNpbmdsZWNsaWNrXCJcblx0XHR2YXIgc2VsZWN0ID0gbmV3IG9sLmludGVyYWN0aW9uLlNlbGVjdCh7XG5cdFx0XHRzdHlsZTogc3R5bGVzLmhpZ2hsaWdodFxuXHRcdH0pO1xuXG5cdFx0dmFyIHNlbGVjdGVkRmVhdHVyZXMgPSBzZWxlY3QuZ2V0RmVhdHVyZXMoKTtcblxuXHRcdHZhciBtb2RpZnkgPSBuZXcgb2wuaW50ZXJhY3Rpb24uTW9kaWZ5KHtcblx0XHRcdGZlYXR1cmVzOiBmZWF0dXJlT3ZlcmxheS5nZXRGZWF0dXJlcygpLFxuXHRcdFx0Ly8gdGhlIFNISUZUIGtleSBtdXN0IGJlIHByZXNzZWQgdG8gZGVsZXRlIHZlcnRpY2VzLCBzb1xuXHRcdFx0Ly8gdGhhdCBuZXcgdmVydGljZXMgY2FuIGJlIGRyYXduIGF0IHRoZSBzYW1lIHBvc2l0aW9uXG5cdFx0XHQvLyBvZiBleGlzdGluZyB2ZXJ0aWNlc1xuXHRcdFx0ZGVsZXRlQ29uZGl0aW9uOiBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRyZXR1cm4gb2wuZXZlbnRzLmNvbmRpdGlvbi5zaGlmdEtleU9ubHkoZXZlbnQpICYmIG9sLmV2ZW50cy5jb25kaXRpb24uc2luZ2xlQ2xpY2soZXZlbnQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gZHJhd2luZyBpbnRlcmFjdGlvblxuXHRcdHZhciBkcmF3O1xuXG5cdFx0Ly8gY29udmVydCBhIHBvaW50IGFycmF5IHRvIGEgcG9pbnQgb2JqZWN0XG5cdFx0Ly8gcmUtaW52ZXJ0IHRoZSB5IGF4aXNcblx0XHR2YXIgY29udmVydEZyb21PTFBvaW50ID0gZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRyZXR1cm4ge3g6IHBvaW50WzBdLCB5OiBpbWFnZXMuY3VycmVudEltYWdlLmhlaWdodCAtIHBvaW50WzFdfTtcblx0XHR9O1xuXG5cdFx0Ly8gY29udmVydCBhIHBvaW50IG9iamVjdCB0byBhIHBvaW50IGFycmF5XG5cdFx0Ly8gaW52ZXJ0IHRoZSB5IGF4aXNcblx0XHR2YXIgY29udmVydFRvT0xQb2ludCA9IGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdFx0cmV0dXJuIFtwb2ludC54LCBpbWFnZXMuY3VycmVudEltYWdlLmhlaWdodCAtIHBvaW50LnldO1xuXHRcdH07XG5cblx0XHQvLyBhc3NlbWJsZXMgdGhlIGNvb3JkaW5hdGUgYXJyYXlzIGRlcGVuZGluZyBvbiB0aGUgZ2VvbWV0cnkgdHlwZVxuXHRcdC8vIHNvIHRoZXkgaGF2ZSBhIHVuaWZpZWQgZm9ybWF0XG5cdFx0dmFyIGdldENvb3JkaW5hdGVzID0gZnVuY3Rpb24gKGdlb21ldHJ5KSB7XG5cdFx0XHRzd2l0Y2ggKGdlb21ldHJ5LmdldFR5cGUoKSkge1xuXHRcdFx0XHRjYXNlICdDaXJjbGUnOlxuXHRcdFx0XHRcdC8vIHJhZGl1cyBpcyB0aGUgeCB2YWx1ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjaXJjbGVcblx0XHRcdFx0XHRyZXR1cm4gW2dlb21ldHJ5LmdldENlbnRlcigpLCBbZ2VvbWV0cnkuZ2V0UmFkaXVzKCksIDBdXTtcblx0XHRcdFx0Y2FzZSAnUG9seWdvbic6XG5cdFx0XHRcdGNhc2UgJ1JlY3RhbmdsZSc6XG5cdFx0XHRcdFx0cmV0dXJuIGdlb21ldHJ5LmdldENvb3JkaW5hdGVzKClbMF07XG5cdFx0XHRcdGNhc2UgJ1BvaW50Jzpcblx0XHRcdFx0XHRyZXR1cm4gW2dlb21ldHJ5LmdldENvb3JkaW5hdGVzKCldO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdHJldHVybiBnZW9tZXRyeS5nZXRDb29yZGluYXRlcygpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBzYXZlcyB0aGUgdXBkYXRlZCBnZW9tZXRyeSBvZiBhbiBhbm5vdGF0aW9uIGZlYXR1cmVcblx0XHR2YXIgaGFuZGxlR2VvbWV0cnlDaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIGZlYXR1cmUgPSBlLnRhcmdldDtcblx0XHRcdHZhciBzYXZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR2YXIgY29vcmRpbmF0ZXMgPSBnZXRDb29yZGluYXRlcyhmZWF0dXJlLmdldEdlb21ldHJ5KCkpO1xuXHRcdFx0XHRmZWF0dXJlLmFubm90YXRpb24ucG9pbnRzID0gY29vcmRpbmF0ZXMubWFwKGNvbnZlcnRGcm9tT0xQb2ludCk7XG5cdFx0XHRcdGZlYXR1cmUuYW5ub3RhdGlvbi4kc2F2ZSgpO1xuXHRcdFx0fTtcblx0XHRcdC8vIHRoaXMgZXZlbnQgaXMgcmFwaWRseSBmaXJlZCwgc28gd2FpdCB1bnRpbCB0aGUgZmlyaW5nIHN0b3BzXG5cdFx0XHQvLyBiZWZvcmUgc2F2aW5nIHRoZSBjaGFuZ2VzXG5cdFx0XHRkZWJvdW5jZShzYXZlLCA1MDAsIGZlYXR1cmUuYW5ub3RhdGlvbi5pZCk7XG5cdFx0fTtcblxuXHRcdHZhciBjcmVhdGVGZWF0dXJlID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdHZhciBnZW9tZXRyeTtcblx0XHRcdHZhciBwb2ludHMgPSBhbm5vdGF0aW9uLnBvaW50cy5tYXAoY29udmVydFRvT0xQb2ludCk7XG5cblx0XHRcdHN3aXRjaCAoYW5ub3RhdGlvbi5zaGFwZSkge1xuXHRcdFx0XHRjYXNlICdQb2ludCc6XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5Qb2ludChwb2ludHNbMF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdSZWN0YW5nbGUnOlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uUmVjdGFuZ2xlKFsgcG9pbnRzIF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdQb2x5Z29uJzpcblx0XHRcdFx0XHQvLyBleGFtcGxlOiBodHRwczovL2dpdGh1Yi5jb20vb3BlbmxheWVycy9vbDMvYmxvYi9tYXN0ZXIvZXhhbXBsZXMvZ2VvanNvbi5qcyNMMTI2XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5Qb2x5Z29uKFsgcG9pbnRzIF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdMaW5lU3RyaW5nJzpcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLkxpbmVTdHJpbmcocG9pbnRzKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnQ2lyY2xlJzpcblx0XHRcdFx0XHQvLyByYWRpdXMgaXMgdGhlIHggdmFsdWUgb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY2lyY2xlXG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5DaXJjbGUocG9pbnRzWzBdLCBwb2ludHNbMV1bMF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgZmVhdHVyZSA9IG5ldyBvbC5GZWF0dXJlKHsgZ2VvbWV0cnk6IGdlb21ldHJ5IH0pO1xuXHRcdFx0ZmVhdHVyZS5vbignY2hhbmdlJywgaGFuZGxlR2VvbWV0cnlDaGFuZ2UpO1xuXHRcdFx0ZmVhdHVyZS5hbm5vdGF0aW9uID0gYW5ub3RhdGlvbjtcblx0XHRcdGZlYXR1cmVzLnB1c2goZmVhdHVyZSk7XG5cdFx0fTtcblxuXHRcdHZhciByZWZyZXNoQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoZSwgaW1hZ2UpIHtcblx0XHRcdC8vIGNsZWFyIGZlYXR1cmVzIG9mIHByZXZpb3VzIGltYWdlXG5cdFx0XHRmZWF0dXJlcy5jbGVhcigpO1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5jbGVhcigpO1xuXG5cdFx0XHRhbm5vdGF0aW9ucy5xdWVyeSh7aWQ6IGltYWdlLl9pZH0pLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRhbm5vdGF0aW9ucy5mb3JFYWNoKGNyZWF0ZUZlYXR1cmUpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHZhciBoYW5kbGVOZXdGZWF0dXJlID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciBnZW9tZXRyeSA9IGUuZmVhdHVyZS5nZXRHZW9tZXRyeSgpO1xuXHRcdFx0dmFyIGNvb3JkaW5hdGVzID0gZ2V0Q29vcmRpbmF0ZXMoZ2VvbWV0cnkpO1xuXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbiA9IGFubm90YXRpb25zLmFkZCh7XG5cdFx0XHRcdGlkOiBpbWFnZXMuZ2V0Q3VycmVudElkKCksXG5cdFx0XHRcdHNoYXBlOiBnZW9tZXRyeS5nZXRUeXBlKCksXG5cdFx0XHRcdHBvaW50czogY29vcmRpbmF0ZXMubWFwKGNvbnZlcnRGcm9tT0xQb2ludClcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBpZiB0aGUgZmVhdHVyZSBjb3VsZG4ndCBiZSBzYXZlZCwgcmVtb3ZlIGl0IGFnYWluXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbi4kcHJvbWlzZS5jYXRjaChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGZlYXR1cmVzLnJlbW92ZShlLmZlYXR1cmUpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGUuZmVhdHVyZS5vbignY2hhbmdlJywgaGFuZGxlR2VvbWV0cnlDaGFuZ2UpO1xuXHRcdH07XG5cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoc2NvcGUpIHtcblx0XHRcdGZlYXR1cmVPdmVybGF5LnNldE1hcChtYXApO1xuXHRcdFx0bWFwLmFkZEludGVyYWN0aW9uKHNlbGVjdCk7XG5cdFx0XHRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgcmVmcmVzaEFubm90YXRpb25zKTtcblxuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5vbignY2hhbmdlOmxlbmd0aCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0Ly8gaWYgbm90IGFscmVhZHkgZGlnZXN0aW5nLCBkaWdlc3Rcblx0XHRcdFx0aWYgKCFzY29wZS4kJHBoYXNlKSB7XG5cdFx0XHRcdFx0Ly8gcHJvcGFnYXRlIG5ldyBzZWxlY3Rpb25zIHRocm91Z2ggdGhlIGFuZ3VsYXIgYXBwbGljYXRpb25cblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuc3RhcnREcmF3aW5nID0gZnVuY3Rpb24gKHR5cGUpIHtcblx0XHRcdG1hcC5yZW1vdmVJbnRlcmFjdGlvbihzZWxlY3QpO1xuXG5cdFx0XHR0eXBlID0gdHlwZSB8fCAnUG9pbnQnO1xuXHRcdFx0ZHJhdyA9IG5ldyBvbC5pbnRlcmFjdGlvbi5EcmF3KHtcblx0XHRcdFx0ZmVhdHVyZXM6IGZlYXR1cmVzLFxuXHRcdFx0XHR0eXBlOiB0eXBlLFxuXHRcdFx0XHRzdHlsZTogc3R5bGVzLmVkaXRpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24obW9kaWZ5KTtcblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihkcmF3KTtcblx0XHRcdGRyYXcub24oJ2RyYXdlbmQnLCBoYW5kbGVOZXdGZWF0dXJlKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5maW5pc2hEcmF3aW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0bWFwLnJlbW92ZUludGVyYWN0aW9uKGRyYXcpO1xuXHRcdFx0bWFwLnJlbW92ZUludGVyYWN0aW9uKG1vZGlmeSk7XG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24oc2VsZWN0KTtcblx0XHRcdC8vIG5vbid0IHNlbGVjdCB0aGUgbGFzdCBkcmF3biBwb2ludFxuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5jbGVhcigpO1xuXHRcdH07XG5cblx0XHR0aGlzLmRlbGV0ZVNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5mb3JFYWNoKGZ1bmN0aW9uIChmZWF0dXJlKSB7XG5cdFx0XHRcdGFubm90YXRpb25zLmRlbGV0ZShmZWF0dXJlLmFubm90YXRpb24pLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGZlYXR1cmVzLnJlbW92ZShmZWF0dXJlKTtcblx0XHRcdFx0XHRzZWxlY3RlZEZlYXR1cmVzLnJlbW92ZShmZWF0dXJlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5zZWxlY3QgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBmZWF0dXJlO1xuXHRcdFx0ZmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoZikge1xuXHRcdFx0XHRpZiAoZi5hbm5vdGF0aW9uLmlkID09PSBpZCkge1xuXHRcdFx0XHRcdGZlYXR1cmUgPSBmO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIHJlbW92ZSBzZWxlY3Rpb24gaWYgZmVhdHVyZSB3YXMgYWxyZWFkeSBzZWxlY3RlZC4gb3RoZXJ3aXNlIHNlbGVjdC5cblx0XHRcdGlmICghc2VsZWN0ZWRGZWF0dXJlcy5yZW1vdmUoZmVhdHVyZSkpIHtcblx0XHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5wdXNoKGZlYXR1cmUpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLmNsZWFyU2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5jbGVhcigpO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldFNlbGVjdGVkRmVhdHVyZXMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gc2VsZWN0ZWRGZWF0dXJlcztcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBtYXBJbWFnZVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgaGFuZGxpbmcgdGhlIGltYWdlIGxheWVyIG9uIHRoZSBPcGVuTGF5ZXJzIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ21hcEltYWdlJywgZnVuY3Rpb24gKG1hcCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXHRcdHZhciBleHRlbnQgPSBbMCwgMCwgMCwgMF07XG5cblx0XHR2YXIgcHJvamVjdGlvbiA9IG5ldyBvbC5wcm9qLlByb2plY3Rpb24oe1xuXHRcdFx0Y29kZTogJ2RpYXMtaW1hZ2UnLFxuXHRcdFx0dW5pdHM6ICdwaXhlbHMnLFxuXHRcdFx0ZXh0ZW50OiBleHRlbnRcblx0XHR9KTtcblxuXHRcdHZhciBpbWFnZUxheWVyID0gbmV3IG9sLmxheWVyLkltYWdlKCk7XG5cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoc2NvcGUpIHtcblx0XHRcdG1hcC5hZGRMYXllcihpbWFnZUxheWVyKTtcblxuXHRcdFx0Ly8gcmVmcmVzaCB0aGUgaW1hZ2Ugc291cmNlXG5cdFx0XHRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgZnVuY3Rpb24gKGUsIGltYWdlKSB7XG5cdFx0XHRcdGV4dGVudFsyXSA9IGltYWdlLndpZHRoO1xuXHRcdFx0XHRleHRlbnRbM10gPSBpbWFnZS5oZWlnaHQ7XG5cblx0XHRcdFx0dmFyIHpvb20gPSBzY29wZS52aWV3cG9ydC56b29tO1xuXG5cdFx0XHRcdHZhciBjZW50ZXIgPSBzY29wZS52aWV3cG9ydC5jZW50ZXI7XG5cdFx0XHRcdC8vIHZpZXdwb3J0IGNlbnRlciBpcyBzdGlsbCB1bmluaXRpYWxpemVkXG5cdFx0XHRcdGlmIChjZW50ZXJbMF0gPT09IHVuZGVmaW5lZCAmJiBjZW50ZXJbMV0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGNlbnRlciA9IG9sLmV4dGVudC5nZXRDZW50ZXIoZXh0ZW50KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBpbWFnZVN0YXRpYyA9IG5ldyBvbC5zb3VyY2UuSW1hZ2VTdGF0aWMoe1xuXHRcdFx0XHRcdHVybDogaW1hZ2Uuc3JjLFxuXHRcdFx0XHRcdHByb2plY3Rpb246IHByb2plY3Rpb24sXG5cdFx0XHRcdFx0aW1hZ2VFeHRlbnQ6IGV4dGVudFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpbWFnZUxheWVyLnNldFNvdXJjZShpbWFnZVN0YXRpYyk7XG5cblx0XHRcdFx0bWFwLnNldFZpZXcobmV3IG9sLlZpZXcoe1xuXHRcdFx0XHRcdHByb2plY3Rpb246IHByb2plY3Rpb24sXG5cdFx0XHRcdFx0Y2VudGVyOiBjZW50ZXIsXG5cdFx0XHRcdFx0em9vbTogem9vbSxcblx0XHRcdFx0XHR6b29tRmFjdG9yOiAxLjUsXG5cdFx0XHRcdFx0Ly8gYWxsb3cgYSBtYXhpbXVtIG9mIDR4IG1hZ25pZmljYXRpb25cblx0XHRcdFx0XHRtaW5SZXNvbHV0aW9uOiAwLjI1LFxuXHRcdFx0XHRcdC8vIHJlc3RyaWN0IG1vdmVtZW50XG5cdFx0XHRcdFx0ZXh0ZW50OiBleHRlbnRcblx0XHRcdFx0fSkpO1xuXG5cdFx0XHRcdC8vIGlmIHpvb20gaXMgbm90IGluaXRpYWxpemVkLCBmaXQgdGhlIHZpZXcgdG8gdGhlIGltYWdlIGV4dGVudFxuXHRcdFx0XHRpZiAoem9vbSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0bWFwLmdldFZpZXcoKS5maXRFeHRlbnQoZXh0ZW50LCBtYXAuZ2V0U2l6ZSgpKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0RXh0ZW50ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGV4dGVudDtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRQcm9qZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHByb2plY3Rpb247XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIHN0eWxlc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgZm9yIHRoZSBPcGVuTGF5ZXJzIHN0eWxlc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ3N0eWxlcycsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciB3aGl0ZSA9IFsyNTUsIDI1NSwgMjU1LCAxXTtcblx0XHR2YXIgYmx1ZSA9IFswLCAxNTMsIDI1NSwgMV07XG5cdFx0dmFyIG9yYW5nZSA9ICcjZmY1ZTAwJztcblx0XHR2YXIgd2lkdGggPSAzO1xuXG5cdFx0dGhpcy5mZWF0dXJlcyA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IHdoaXRlLFxuXHRcdFx0XHRcdHdpZHRoOiA1XG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG5cdFx0XHRcdFx0cmFkaXVzOiA2LFxuXHRcdFx0XHRcdGZpbGw6IG5ldyBvbC5zdHlsZS5GaWxsKHtcblx0XHRcdFx0XHRcdGNvbG9yOiBibHVlXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRcdGNvbG9yOiB3aGl0ZSxcblx0XHRcdFx0XHRcdHdpZHRoOiAyXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSlcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRjb2xvcjogYmx1ZSxcblx0XHRcdFx0XHR3aWR0aDogM1xuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHRdO1xuXG5cdFx0dGhpcy5oaWdobGlnaHQgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB3aGl0ZSxcblx0XHRcdFx0XHR3aWR0aDogNlxuXHRcdFx0XHR9KSxcblx0XHRcdFx0aW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0XHRcdHJhZGl1czogNixcblx0XHRcdFx0XHRmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XG5cdFx0XHRcdFx0XHRjb2xvcjogb3JhbmdlXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRcdGNvbG9yOiB3aGl0ZSxcblx0XHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSlcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRjb2xvcjogb3JhbmdlLFxuXHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdF07XG5cblx0XHR0aGlzLmVkaXRpbmcgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB3aGl0ZSxcblx0XHRcdFx0XHR3aWR0aDogNVxuXHRcdFx0XHR9KSxcblx0XHRcdFx0aW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0XHRcdHJhZGl1czogNixcblx0XHRcdFx0XHRmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XG5cdFx0XHRcdFx0XHRjb2xvcjogYmx1ZVxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0XHRjb2xvcjogd2hpdGUsXG5cdFx0XHRcdFx0XHR3aWR0aDogMixcblx0XHRcdFx0XHRcdGxpbmVEYXNoOiBbM11cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiBibHVlLFxuXHRcdFx0XHRcdHdpZHRoOiAzLFxuXHRcdFx0XHRcdGxpbmVEYXNoOiBbNV1cblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0XTtcblxuXHRcdHRoaXMudmlld3BvcnQgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiBibHVlLFxuXHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdH0pLFxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB3aGl0ZSxcblx0XHRcdFx0XHR3aWR0aDogMVxuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHRdO1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgdXJsUGFyYW1zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFRoZSBHRVQgcGFyYW1ldGVycyBvZiB0aGUgdXJsLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ3VybFBhcmFtcycsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBzdGF0ZSA9IHt9O1xuXG5cdFx0Ly8gdHJhbnNmb3JtcyBhIFVSTCBwYXJhbWV0ZXIgc3RyaW5nIGxpa2UgI2E9MSZiPTIgdG8gYW4gb2JqZWN0XG5cdFx0dmFyIGRlY29kZVN0YXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHBhcmFtcyA9IGxvY2F0aW9uLmhhc2gucmVwbGFjZSgnIycsICcnKVxuXHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJyYnKTtcblxuXHRcdFx0dmFyIHN0YXRlID0ge307XG5cblx0XHRcdHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJhbSkge1xuXHRcdFx0XHQvLyBjYXB0dXJlIGtleS12YWx1ZSBwYWlyc1xuXHRcdFx0XHR2YXIgY2FwdHVyZSA9IHBhcmFtLm1hdGNoKC8oLispXFw9KC4rKS8pO1xuXHRcdFx0XHRpZiAoY2FwdHVyZSAmJiBjYXB0dXJlLmxlbmd0aCA9PT0gMykge1xuXHRcdFx0XHRcdHN0YXRlW2NhcHR1cmVbMV1dID0gZGVjb2RlVVJJQ29tcG9uZW50KGNhcHR1cmVbMl0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHN0YXRlO1xuXHRcdH07XG5cblx0XHQvLyB0cmFuc2Zvcm1zIGFuIG9iamVjdCB0byBhIFVSTCBwYXJhbWV0ZXIgc3RyaW5nXG5cdFx0dmFyIGVuY29kZVN0YXRlID0gZnVuY3Rpb24gKHN0YXRlKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gJyc7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gc3RhdGUpIHtcblx0XHRcdFx0cGFyYW1zICs9IGtleSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChzdGF0ZVtrZXldKSArICcmJztcblx0XHRcdH1cblx0XHRcdHJldHVybiBwYXJhbXMuc3Vic3RyaW5nKDAsIHBhcmFtcy5sZW5ndGggLSAxKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5wdXNoU3RhdGUgPSBmdW5jdGlvbiAocykge1xuXHRcdFx0c3RhdGUuc2x1ZyA9IHM7XG5cdFx0XHRoaXN0b3J5LnB1c2hTdGF0ZShzdGF0ZSwgJycsIHN0YXRlLnNsdWcgKyAnIycgKyBlbmNvZGVTdGF0ZShzdGF0ZSkpO1xuXHRcdH07XG5cblx0XHQvLyBzZXRzIGEgVVJMIHBhcmFtZXRlciBhbmQgdXBkYXRlcyB0aGUgaGlzdG9yeSBzdGF0ZVxuXHRcdHRoaXMuc2V0ID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIHBhcmFtcykge1xuXHRcdFx0XHRzdGF0ZVtrZXldID0gcGFyYW1zW2tleV07XG5cdFx0XHR9XG5cdFx0XHRoaXN0b3J5LnJlcGxhY2VTdGF0ZShzdGF0ZSwgJycsIHN0YXRlLnNsdWcgKyAnIycgKyBlbmNvZGVTdGF0ZShzdGF0ZSkpO1xuXHRcdH07XG5cblx0XHQvLyByZXR1cm5zIGEgVVJMIHBhcmFtZXRlclxuXHRcdHRoaXMuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuXHRcdFx0cmV0dXJuIHN0YXRlW2tleV07XG5cdFx0fTtcblxuXHRcdHN0YXRlID0gaGlzdG9yeS5zdGF0ZTtcblxuXHRcdGlmICghc3RhdGUpIHtcblx0XHRcdHN0YXRlID0gZGVjb2RlU3RhdGUoKTtcblx0XHR9XG5cdH1cbik7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9