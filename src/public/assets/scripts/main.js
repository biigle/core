/**
 * @namespace dias.annotations
 * @description The DIAS annotations module.
 */
angular.module('dias.annotations', ['dias.api', 'dias.ui.messages']);

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
                $scope.isExpandable = $scope.tree && !!$scope.tree[$scope.item.id];
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
            select.setActive(false);

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
            select.setActive(true);
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

        // fits the view to the given feature
        this.fit = function (id) {
            features.forEach(function (f) {
                if (f.annotation.id === id) {
                    map.getView().fitGeometry(f.getGeometry(), map.getSize());
                }
            });
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

        $scope.fitAnnotation = mapAnnotations.fit;

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
                default:
                    $scope.$apply(function () {
                        $scope.$broadcast('keypress', e);
                    });
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

        // maximum number of allowed favourites
        var maxFavourites = 9;
        var favouritesStorageKey = 'dias.annotations-label-favourites';

        // saves the IDs of the favourites in localStorage
        var storeFavourites = function () {
            var tmp = $scope.favourites.map(function (item) {
                return item.id;
            });
            window.localStorage[favouritesStorageKey] = JSON.stringify(tmp);
        };

        // restores the favourites from the IDs in localStorage
        var loadFavourites = function () {
            var tmp = JSON.parse(window.localStorage[favouritesStorageKey]);
            $scope.favourites = $scope.categories.filter(function (item) {
                return tmp.indexOf(item.id) !== -1;
            });
        };

        $scope.categories = [];
        $scope.favourites = [];
        labels.promise.then(function (all) {
            for (var key in all) {
                $scope.categories = $scope.categories.concat(all[key]);
            }
            loadFavourites();
        });

        $scope.categoriesTree = labels.getTree();

        $scope.selectItem = function (item) {
            labels.setSelected(item);
            $scope.searchCategory = ''; // clear search field
            $scope.$broadcast('categories.selected', item);
        };

        $scope.isFavourite = function (item) {
            return $scope.favourites.indexOf(item) !== -1;
        };

        // adds a new item to the favourites or removes it if it is already a favourite
        $scope.toggleFavourite = function (e, item) {
            e.stopPropagation();
            var index = $scope.favourites.indexOf(item);
            if (index === -1 && $scope.favourites.length < maxFavourites) {
                $scope.favourites.push(item);
            } else {
                $scope.favourites.splice(index, 1);
            }
            storeFavourites();
        };

        // returns whether the user is still allowed to add favourites
        $scope.favouritesLeft = function () {
            return $scope.favourites.length < maxFavourites;
        };

        // select favourites on numbers 1-9
        $scope.$on('keypress', function (e, keyEvent) {
            var charCode = (keyEvent.which) ? keyEvent.which : keyEvent.keyCode;
            var number = parseInt(String.fromCharCode(charCode));
            if (!isNaN(number) && number > 0 && number <= $scope.favourites.length) {
                $scope.selectItem($scope.favourites[number - 1]);
            }
        });
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

        $scope.$on('keypress', function (e, keyEvent) {
            // deselect drawing tool on escape
            if (keyEvent.keyCode === 27) {
                $scope.selectShape(null);
                return;
            }
            var charCode = (keyEvent.which) ? keyEvent.which : keyEvent.keyCode;
            switch (String.fromCharCode(charCode)) {
                case 'a':
                    $scope.selectShape('Point');
                    break;
                case 's':
                    $scope.selectShape('Rectangle');
                    break;
                case 'd':
                    $scope.selectShape('Circle');
                    break;
                case 'f':
                    $scope.selectShape('LineString');
                    break;
                case 'g':
                    $scope.selectShape('Polygon');
                    break;
            }
        });
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
 * @name SelectedLabelController
 * @memberOf dias.annotations
 * @description Controller for the selected label display in the map
 */
angular.module('dias.annotations').controller('SelectedLabelController', ["$scope", "labels", function ($scope, labels) {
		"use strict";

        $scope.getSelectedLabel = labels.getSelected;
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

        var foldoutStorageKey = 'dias.annotations.sidebar-foldout';

		// the currently opened sidebar-'extension' is remembered through localStorage
		$scope.foldout = window.localStorage[foldoutStorageKey] || '';
        if ($scope.foldout) {
            $rootScope.$broadcast('sidebar.foldout.open');
        }

		$scope.openFoldout = function (name) {
			$scope.foldout = window.localStorage[foldoutStorageKey] = name;
			$rootScope.$broadcast('sidebar.foldout.open');
		};

		$scope.closeFoldout = function () {
			$scope.foldout = window.localStorage[foldoutStorageKey] = '';
			$rootScope.$broadcast('sidebar.foldout.close');
		};

		$scope.toggleFoldout = function (name) {
			if ($scope.foldout === name) {
				$scope.closeFoldout();
			} else {
				$scope.openFoldout(name);
			}
		};

		$scope.deleteSelectedAnnotations = function () {
            if (mapAnnotations.getSelectedFeatures().getLength() > 0 && confirm('Are you sure you want to delete all selected annotations?')) {
                mapAnnotations.deleteSelected();
            }
        };

        $rootScope.$on('sidebar.foldout.do-open', function (e, name) {
            $scope.openFoldout(name);
        });

        $scope.$on('keypress', function (e, keyEvent) {
            if (keyEvent.keyCode === 46) {
                $scope.deleteSelectedAnnotations();
            }
        });
	}]
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkaXJlY3RpdmVzL2Fubm90YXRpb25MaXN0SXRlbS5qcyIsImRpcmVjdGl2ZXMvbGFiZWxDYXRlZ29yeUl0ZW0uanMiLCJkaXJlY3RpdmVzL2xhYmVsSXRlbS5qcyIsImZhY3Rvcmllcy9kZWJvdW5jZS5qcyIsImZhY3Rvcmllcy9tYXAuanMiLCJzZXJ2aWNlcy9hbm5vdGF0aW9ucy5qcyIsInNlcnZpY2VzL2ltYWdlcy5qcyIsInNlcnZpY2VzL2xhYmVscy5qcyIsInNlcnZpY2VzL21hcEFubm90YXRpb25zLmpzIiwic2VydmljZXMvbWFwSW1hZ2UuanMiLCJzZXJ2aWNlcy9zdHlsZXMuanMiLCJzZXJ2aWNlcy91cmxQYXJhbXMuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0b3JDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ2FudmFzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NhdGVnb3JpZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ29uZmlkZW5jZUNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Db250cm9sc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9NaW5pbWFwQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NlbGVjdGVkTGFiZWxDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2lkZWJhckNvbnRyb2xsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsb0JBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7QUNHQSxRQUFBLE9BQUEsb0JBQUEsVUFBQSxpQ0FBQSxVQUFBLFFBQUE7RUFDQTs7RUFFQSxPQUFBO0dBQ0EsT0FBQTtHQUNBLHVCQUFBLFVBQUEsUUFBQTtJQUNBLE9BQUEsYUFBQSxVQUFBLE9BQUEsV0FBQSxNQUFBOztJQUVBLE9BQUEsV0FBQSxZQUFBO0tBQ0EsT0FBQSxPQUFBLFdBQUEsT0FBQSxXQUFBOzs7SUFHQSxPQUFBLGNBQUEsWUFBQTtLQUNBLE9BQUEsbUJBQUEsT0FBQTs7O0lBR0EsT0FBQSxjQUFBLFVBQUEsT0FBQTtLQUNBLE9BQUEscUJBQUEsT0FBQSxZQUFBOzs7SUFHQSxPQUFBLGlCQUFBLFlBQUE7S0FDQSxPQUFBLE9BQUEsY0FBQSxPQUFBOzs7SUFHQSxPQUFBLGVBQUEsT0FBQTs7SUFFQSxPQUFBLG9CQUFBLE9BQUE7Ozs7Ozs7Ozs7Ozs7QUMxQkEsUUFBQSxPQUFBLG9CQUFBLFVBQUEsZ0VBQUEsVUFBQSxVQUFBLFVBQUEsZ0JBQUE7UUFDQTs7UUFFQSxPQUFBO1lBQ0EsVUFBQTs7WUFFQSxhQUFBOztZQUVBLE9BQUE7O1lBRUEsTUFBQSxVQUFBLE9BQUEsU0FBQSxPQUFBOzs7O2dCQUlBLElBQUEsVUFBQSxRQUFBLFFBQUEsZUFBQSxJQUFBO2dCQUNBLFNBQUEsWUFBQTtvQkFDQSxRQUFBLE9BQUEsU0FBQSxTQUFBOzs7O1lBSUEsdUJBQUEsVUFBQSxRQUFBOztnQkFFQSxPQUFBLFNBQUE7O2dCQUVBLE9BQUEsZUFBQSxPQUFBLFFBQUEsQ0FBQSxDQUFBLE9BQUEsS0FBQSxPQUFBLEtBQUE7O2dCQUVBLE9BQUEsYUFBQTs7OztnQkFJQSxPQUFBLElBQUEsdUJBQUEsVUFBQSxHQUFBLFVBQUE7OztvQkFHQSxJQUFBLE9BQUEsS0FBQSxPQUFBLFNBQUEsSUFBQTt3QkFDQSxPQUFBLFNBQUE7d0JBQ0EsT0FBQSxhQUFBOzt3QkFFQSxPQUFBLE1BQUE7MkJBQ0E7d0JBQ0EsT0FBQSxTQUFBO3dCQUNBLE9BQUEsYUFBQTs7Ozs7O2dCQU1BLE9BQUEsSUFBQSwwQkFBQSxVQUFBLEdBQUE7b0JBQ0EsT0FBQSxTQUFBOztvQkFFQSxJQUFBLE9BQUEsS0FBQSxjQUFBLE1BQUE7d0JBQ0EsRUFBQTs7Ozs7Ozs7Ozs7Ozs7O0FDbERBLFFBQUEsT0FBQSxvQkFBQSxVQUFBLGFBQUEsWUFBQTtFQUNBOztFQUVBLE9BQUE7R0FDQSx1QkFBQSxVQUFBLFFBQUE7SUFDQSxJQUFBLGFBQUEsT0FBQSxnQkFBQTs7SUFFQSxJQUFBLGNBQUEsTUFBQTtLQUNBLE9BQUEsUUFBQTtXQUNBLElBQUEsY0FBQSxNQUFBO0tBQ0EsT0FBQSxRQUFBO1dBQ0EsSUFBQSxjQUFBLE9BQUE7S0FDQSxPQUFBLFFBQUE7V0FDQTtLQUNBLE9BQUEsUUFBQTs7Ozs7Ozs7Ozs7Ozs7OztBQ1pBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLCtCQUFBLFVBQUEsVUFBQSxJQUFBO0VBQ0E7O0VBRUEsSUFBQSxXQUFBOztFQUVBLE9BQUEsVUFBQSxNQUFBLE1BQUEsSUFBQTs7O0dBR0EsSUFBQSxXQUFBLEdBQUE7R0FDQSxPQUFBLENBQUEsV0FBQTtJQUNBLElBQUEsVUFBQSxNQUFBLE9BQUE7SUFDQSxJQUFBLFFBQUEsV0FBQTtLQUNBLFNBQUEsTUFBQTtLQUNBLFNBQUEsUUFBQSxLQUFBLE1BQUEsU0FBQTtLQUNBLFdBQUEsR0FBQTs7SUFFQSxJQUFBLFNBQUEsS0FBQTtLQUNBLFNBQUEsT0FBQSxTQUFBOztJQUVBLFNBQUEsTUFBQSxTQUFBLE9BQUE7SUFDQSxPQUFBLFNBQUE7Ozs7Ozs7Ozs7OztBQ3RCQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxPQUFBLFlBQUE7RUFDQTs7RUFFQSxJQUFBLE1BQUEsSUFBQSxHQUFBLElBQUE7R0FDQSxRQUFBO0dBQ0EsVUFBQTtJQUNBLElBQUEsR0FBQSxRQUFBO0lBQ0EsSUFBQSxHQUFBLFFBQUE7SUFDQSxJQUFBLEdBQUEsUUFBQTs7OztFQUlBLE9BQUE7Ozs7Ozs7Ozs7QUNaQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSx5REFBQSxVQUFBLFlBQUEsUUFBQSxRQUFBLEtBQUE7RUFDQTs7RUFFQSxJQUFBOztFQUVBLElBQUEsbUJBQUEsVUFBQSxZQUFBO0dBQ0EsV0FBQSxRQUFBLE9BQUEsUUFBQSxXQUFBO0dBQ0EsT0FBQTs7O0VBR0EsSUFBQSxnQkFBQSxVQUFBLFlBQUE7R0FDQSxZQUFBLEtBQUE7R0FDQSxPQUFBOzs7RUFHQSxLQUFBLFFBQUEsVUFBQSxRQUFBO0dBQ0EsY0FBQSxXQUFBLE1BQUE7R0FDQSxZQUFBLFNBQUEsS0FBQSxVQUFBLEdBQUE7SUFDQSxFQUFBLFFBQUE7O0dBRUEsT0FBQTs7O0VBR0EsS0FBQSxNQUFBLFVBQUEsUUFBQTtHQUNBLElBQUEsQ0FBQSxPQUFBLFlBQUEsT0FBQSxPQUFBO0lBQ0EsT0FBQSxXQUFBLE9BQUEsTUFBQSxPQUFBOztHQUVBLElBQUEsUUFBQSxPQUFBO0dBQ0EsT0FBQSxXQUFBLE1BQUE7R0FDQSxPQUFBLGFBQUEsT0FBQTtHQUNBLElBQUEsYUFBQSxXQUFBLElBQUE7R0FDQSxXQUFBO2NBQ0EsS0FBQTtjQUNBLEtBQUE7Y0FDQSxNQUFBLElBQUE7O0dBRUEsT0FBQTs7O0VBR0EsS0FBQSxTQUFBLFVBQUEsWUFBQTs7R0FFQSxJQUFBLFFBQUEsWUFBQSxRQUFBO0dBQ0EsSUFBQSxRQUFBLENBQUEsR0FBQTtJQUNBLE9BQUEsV0FBQSxRQUFBLFlBQUE7OztLQUdBLFFBQUEsWUFBQSxRQUFBO0tBQ0EsWUFBQSxPQUFBLE9BQUE7T0FDQSxJQUFBOzs7O0VBSUEsS0FBQSxVQUFBLFVBQUEsSUFBQTtHQUNBLE9BQUEsWUFBQSxRQUFBOzs7RUFHQSxLQUFBLFVBQUEsWUFBQTtHQUNBLE9BQUE7Ozs7Ozs7Ozs7O0FDekRBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLHlDQUFBLFVBQUEsZUFBQSxLQUFBLElBQUE7RUFDQTs7RUFFQSxJQUFBLFFBQUE7O0VBRUEsSUFBQSxXQUFBOztFQUVBLElBQUEsa0JBQUE7O0VBRUEsSUFBQSxTQUFBOzs7RUFHQSxLQUFBLGVBQUE7Ozs7OztFQU1BLElBQUEsU0FBQSxVQUFBLElBQUE7R0FDQSxLQUFBLE1BQUEsTUFBQSxhQUFBO0dBQ0EsSUFBQSxRQUFBLFNBQUEsUUFBQTtHQUNBLE9BQUEsU0FBQSxDQUFBLFFBQUEsS0FBQSxTQUFBOzs7Ozs7O0VBT0EsSUFBQSxTQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsTUFBQSxNQUFBLGFBQUE7R0FDQSxJQUFBLFFBQUEsU0FBQSxRQUFBO0dBQ0EsSUFBQSxTQUFBLFNBQUE7R0FDQSxPQUFBLFNBQUEsQ0FBQSxRQUFBLElBQUEsVUFBQTs7Ozs7OztFQU9BLElBQUEsV0FBQSxVQUFBLElBQUE7R0FDQSxLQUFBLE1BQUEsTUFBQSxhQUFBO0dBQ0EsS0FBQSxJQUFBLElBQUEsT0FBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7SUFDQSxJQUFBLE9BQUEsR0FBQSxPQUFBLElBQUEsT0FBQSxPQUFBOzs7R0FHQSxPQUFBOzs7Ozs7RUFNQSxJQUFBLE9BQUEsVUFBQSxJQUFBO0dBQ0EsTUFBQSxlQUFBLFNBQUE7Ozs7Ozs7O0VBUUEsSUFBQSxhQUFBLFVBQUEsSUFBQTtHQUNBLElBQUEsV0FBQSxHQUFBO0dBQ0EsSUFBQSxNQUFBLFNBQUE7O0dBRUEsSUFBQSxLQUFBO0lBQ0EsU0FBQSxRQUFBO1VBQ0E7SUFDQSxNQUFBLFNBQUEsY0FBQTtJQUNBLElBQUEsTUFBQTtJQUNBLElBQUEsU0FBQSxZQUFBO0tBQ0EsT0FBQSxLQUFBOztLQUVBLElBQUEsT0FBQSxTQUFBLGlCQUFBO01BQ0EsT0FBQTs7S0FFQSxTQUFBLFFBQUE7O0lBRUEsSUFBQSxVQUFBLFVBQUEsS0FBQTtLQUNBLFNBQUEsT0FBQTs7SUFFQSxJQUFBLE1BQUEsTUFBQSxvQkFBQSxLQUFBOzs7R0FHQSxPQUFBLFNBQUE7Ozs7Ozs7RUFPQSxLQUFBLE9BQUEsVUFBQSxZQUFBO0dBQ0EsV0FBQSxjQUFBLE1BQUEsQ0FBQSxhQUFBOztHQUVBLE9BQUEsU0FBQTs7Ozs7OztFQU9BLEtBQUEsT0FBQSxVQUFBLElBQUE7R0FDQSxJQUFBLFVBQUEsV0FBQSxJQUFBLEtBQUEsV0FBQTtJQUNBLEtBQUE7Ozs7R0FJQSxTQUFBLFNBQUEsS0FBQSxZQUFBOztJQUVBLFdBQUEsT0FBQTtJQUNBLFdBQUEsT0FBQTs7O0dBR0EsT0FBQTs7Ozs7OztFQU9BLEtBQUEsT0FBQSxZQUFBO0dBQ0EsT0FBQSxNQUFBLEtBQUE7Ozs7Ozs7RUFPQSxLQUFBLE9BQUEsWUFBQTtHQUNBLE9BQUEsTUFBQSxLQUFBOzs7RUFHQSxLQUFBLGVBQUEsWUFBQTtHQUNBLE9BQUEsTUFBQSxhQUFBOzs7Ozs7Ozs7OztBQ3BJQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSwrRUFBQSxVQUFBLGlCQUFBLE9BQUEsY0FBQSxTQUFBLEtBQUEsSUFBQTtRQUNBOztRQUVBLElBQUE7UUFDQSxJQUFBLG9CQUFBOztRQUVBLElBQUEsU0FBQTs7O1FBR0EsS0FBQSxVQUFBOztRQUVBLEtBQUEsZ0JBQUEsVUFBQSxLQUFBO1lBQ0EsSUFBQSxXQUFBLEdBQUE7WUFDQSxLQUFBLFVBQUEsU0FBQTs7WUFFQSxJQUFBLFdBQUEsQ0FBQTs7O1lBR0EsSUFBQSxlQUFBLFlBQUE7Z0JBQ0EsSUFBQSxFQUFBLGFBQUEsSUFBQSxRQUFBO29CQUNBLFNBQUEsUUFBQTs7OztZQUlBLE9BQUEsUUFBQSxNQUFBLE1BQUE7O1lBRUEsSUFBQSxRQUFBLFVBQUEsSUFBQTtnQkFDQSxRQUFBLElBQUEsQ0FBQSxJQUFBLEtBQUEsVUFBQSxTQUFBO29CQUNBLE9BQUEsUUFBQSxRQUFBLGFBQUEsTUFBQSxDQUFBLFlBQUEsS0FBQTs7Ozs7UUFLQSxLQUFBLHFCQUFBLFVBQUEsWUFBQTtZQUNBLElBQUEsQ0FBQSxZQUFBOzs7WUFHQSxJQUFBLENBQUEsV0FBQSxRQUFBO2dCQUNBLFdBQUEsU0FBQSxnQkFBQSxNQUFBO29CQUNBLGVBQUEsV0FBQTs7OztZQUlBLE9BQUEsV0FBQTs7O1FBR0EsS0FBQSxxQkFBQSxVQUFBLFlBQUE7WUFDQSxJQUFBLFFBQUEsZ0JBQUEsT0FBQTtnQkFDQSxlQUFBLFdBQUE7Z0JBQ0EsVUFBQSxjQUFBO2dCQUNBLFlBQUE7OztZQUdBLE1BQUEsU0FBQSxLQUFBLFlBQUE7Z0JBQ0EsV0FBQSxPQUFBLEtBQUE7OztZQUdBLE1BQUEsU0FBQSxNQUFBLElBQUE7O1lBRUEsT0FBQTs7O1FBR0EsS0FBQSx1QkFBQSxVQUFBLFlBQUEsT0FBQTs7WUFFQSxJQUFBLFFBQUEsV0FBQSxPQUFBLFFBQUE7WUFDQSxJQUFBLFFBQUEsQ0FBQSxHQUFBO2dCQUNBLE9BQUEsTUFBQSxRQUFBLFlBQUE7OztvQkFHQSxRQUFBLFdBQUEsT0FBQSxRQUFBO29CQUNBLFdBQUEsT0FBQSxPQUFBLE9BQUE7bUJBQ0EsSUFBQTs7OztRQUlBLEtBQUEsVUFBQSxZQUFBO1lBQ0EsSUFBQSxPQUFBO1lBQ0EsSUFBQSxNQUFBO1lBQ0EsSUFBQSxRQUFBLFVBQUEsT0FBQTtnQkFDQSxJQUFBLFNBQUEsTUFBQTtnQkFDQSxJQUFBLEtBQUEsS0FBQSxTQUFBO29CQUNBLEtBQUEsS0FBQSxRQUFBLEtBQUE7dUJBQ0E7b0JBQ0EsS0FBQSxLQUFBLFVBQUEsQ0FBQTs7OztZQUlBLEtBQUEsUUFBQSxLQUFBLFVBQUEsUUFBQTtnQkFDQSxLQUFBLE9BQUEsUUFBQTtvQkFDQSxLQUFBLE9BQUE7b0JBQ0EsT0FBQSxLQUFBLFFBQUE7Ozs7WUFJQSxPQUFBOzs7UUFHQSxLQUFBLFNBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLEtBQUEsY0FBQSxVQUFBLE9BQUE7WUFDQSxnQkFBQTs7O1FBR0EsS0FBQSxjQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxLQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUEsQ0FBQSxDQUFBOzs7UUFHQSxLQUFBLHVCQUFBLFVBQUEsWUFBQTtZQUNBLG9CQUFBOzs7UUFHQSxLQUFBLHVCQUFBLFlBQUE7WUFDQSxPQUFBOzs7Ozs7Ozs7Ozs7QUN0SEEsUUFBQSxPQUFBLG9CQUFBLFFBQUEseUVBQUEsVUFBQSxLQUFBLFFBQUEsYUFBQSxVQUFBLFFBQUE7RUFDQTs7RUFFQSxJQUFBLGlCQUFBLElBQUEsR0FBQSxlQUFBO0dBQ0EsT0FBQSxPQUFBOzs7RUFHQSxJQUFBLFdBQUEsSUFBQSxHQUFBOztFQUVBLGVBQUEsWUFBQTs7O0VBR0EsSUFBQSxTQUFBLElBQUEsR0FBQSxZQUFBLE9BQUE7R0FDQSxPQUFBLE9BQUE7OztFQUdBLElBQUEsbUJBQUEsT0FBQTs7RUFFQSxJQUFBLFNBQUEsSUFBQSxHQUFBLFlBQUEsT0FBQTtHQUNBLFVBQUEsZUFBQTs7OztHQUlBLGlCQUFBLFNBQUEsT0FBQTtJQUNBLE9BQUEsR0FBQSxPQUFBLFVBQUEsYUFBQSxVQUFBLEdBQUEsT0FBQSxVQUFBLFlBQUE7Ozs7O0VBS0EsSUFBQTs7OztFQUlBLElBQUEscUJBQUEsVUFBQSxPQUFBO0dBQ0EsT0FBQSxDQUFBLEdBQUEsTUFBQSxJQUFBLEdBQUEsT0FBQSxhQUFBLFNBQUEsTUFBQTs7Ozs7RUFLQSxJQUFBLG1CQUFBLFVBQUEsT0FBQTtHQUNBLE9BQUEsQ0FBQSxNQUFBLEdBQUEsT0FBQSxhQUFBLFNBQUEsTUFBQTs7Ozs7RUFLQSxJQUFBLGlCQUFBLFVBQUEsVUFBQTtHQUNBLFFBQUEsU0FBQTtJQUNBLEtBQUE7O0tBRUEsT0FBQSxDQUFBLFNBQUEsYUFBQSxDQUFBLFNBQUEsYUFBQTtJQUNBLEtBQUE7SUFDQSxLQUFBO0tBQ0EsT0FBQSxTQUFBLGlCQUFBO0lBQ0EsS0FBQTtLQUNBLE9BQUEsQ0FBQSxTQUFBO0lBQ0E7S0FDQSxPQUFBLFNBQUE7Ozs7O0VBS0EsSUFBQSx1QkFBQSxVQUFBLEdBQUE7R0FDQSxJQUFBLFVBQUEsRUFBQTtHQUNBLElBQUEsT0FBQSxZQUFBO0lBQ0EsSUFBQSxjQUFBLGVBQUEsUUFBQTtJQUNBLFFBQUEsV0FBQSxTQUFBLFlBQUEsSUFBQTtJQUNBLFFBQUEsV0FBQTs7OztHQUlBLFNBQUEsTUFBQSxLQUFBLFFBQUEsV0FBQTs7O0VBR0EsSUFBQSxnQkFBQSxVQUFBLFlBQUE7R0FDQSxJQUFBO0dBQ0EsSUFBQSxTQUFBLFdBQUEsT0FBQSxJQUFBOztHQUVBLFFBQUEsV0FBQTtJQUNBLEtBQUE7S0FDQSxXQUFBLElBQUEsR0FBQSxLQUFBLE1BQUEsT0FBQTtLQUNBO0lBQ0EsS0FBQTtLQUNBLFdBQUEsSUFBQSxHQUFBLEtBQUEsVUFBQSxFQUFBO0tBQ0E7SUFDQSxLQUFBOztLQUVBLFdBQUEsSUFBQSxHQUFBLEtBQUEsUUFBQSxFQUFBO0tBQ0E7SUFDQSxLQUFBO0tBQ0EsV0FBQSxJQUFBLEdBQUEsS0FBQSxXQUFBO0tBQ0E7SUFDQSxLQUFBOztLQUVBLFdBQUEsSUFBQSxHQUFBLEtBQUEsT0FBQSxPQUFBLElBQUEsT0FBQSxHQUFBO0tBQ0E7OztHQUdBLElBQUEsVUFBQSxJQUFBLEdBQUEsUUFBQSxFQUFBLFVBQUE7R0FDQSxRQUFBLEdBQUEsVUFBQTtHQUNBLFFBQUEsYUFBQTtHQUNBLFNBQUEsS0FBQTs7O0VBR0EsSUFBQSxxQkFBQSxVQUFBLEdBQUEsT0FBQTs7R0FFQSxTQUFBO0dBQ0EsaUJBQUE7O0dBRUEsWUFBQSxNQUFBLENBQUEsSUFBQSxNQUFBLE1BQUEsU0FBQSxLQUFBLFlBQUE7SUFDQSxZQUFBLFFBQUE7Ozs7RUFJQSxJQUFBLG1CQUFBLFVBQUEsR0FBQTtHQUNBLElBQUEsV0FBQSxFQUFBLFFBQUE7R0FDQSxJQUFBLGNBQUEsZUFBQTs7R0FFQSxFQUFBLFFBQUEsYUFBQSxZQUFBLElBQUE7SUFDQSxJQUFBLE9BQUE7SUFDQSxPQUFBLFNBQUE7SUFDQSxRQUFBLFlBQUEsSUFBQTs7OztHQUlBLEVBQUEsUUFBQSxXQUFBLFNBQUEsTUFBQSxZQUFBO0lBQ0EsU0FBQSxPQUFBLEVBQUE7OztHQUdBLEVBQUEsUUFBQSxHQUFBLFVBQUE7OztFQUdBLEtBQUEsT0FBQSxVQUFBLE9BQUE7R0FDQSxlQUFBLE9BQUE7R0FDQSxJQUFBLGVBQUE7R0FDQSxNQUFBLElBQUEsZUFBQTs7R0FFQSxpQkFBQSxHQUFBLGlCQUFBLFlBQUE7O0lBRUEsSUFBQSxDQUFBLE1BQUEsU0FBQTs7S0FFQSxNQUFBOzs7OztFQUtBLEtBQUEsZUFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLFVBQUE7O0dBRUEsT0FBQSxRQUFBO0dBQ0EsT0FBQSxJQUFBLEdBQUEsWUFBQSxLQUFBO0lBQ0EsVUFBQTtJQUNBLE1BQUE7SUFDQSxPQUFBLE9BQUE7OztHQUdBLElBQUEsZUFBQTtHQUNBLElBQUEsZUFBQTtHQUNBLEtBQUEsR0FBQSxXQUFBOzs7RUFHQSxLQUFBLGdCQUFBLFlBQUE7R0FDQSxJQUFBLGtCQUFBO0dBQ0EsSUFBQSxrQkFBQTtZQUNBLE9BQUEsVUFBQTs7R0FFQSxpQkFBQTs7O0VBR0EsS0FBQSxpQkFBQSxZQUFBO0dBQ0EsaUJBQUEsUUFBQSxVQUFBLFNBQUE7SUFDQSxZQUFBLE9BQUEsUUFBQSxZQUFBLEtBQUEsWUFBQTtLQUNBLFNBQUEsT0FBQTtLQUNBLGlCQUFBLE9BQUE7Ozs7O0VBS0EsS0FBQSxTQUFBLFVBQUEsSUFBQTtHQUNBLElBQUE7R0FDQSxTQUFBLFFBQUEsVUFBQSxHQUFBO0lBQ0EsSUFBQSxFQUFBLFdBQUEsT0FBQSxJQUFBO0tBQ0EsVUFBQTs7OztHQUlBLElBQUEsQ0FBQSxpQkFBQSxPQUFBLFVBQUE7SUFDQSxpQkFBQSxLQUFBOzs7OztRQUtBLEtBQUEsTUFBQSxVQUFBLElBQUE7WUFDQSxTQUFBLFFBQUEsVUFBQSxHQUFBO2dCQUNBLElBQUEsRUFBQSxXQUFBLE9BQUEsSUFBQTtvQkFDQSxJQUFBLFVBQUEsWUFBQSxFQUFBLGVBQUEsSUFBQTs7Ozs7RUFLQSxLQUFBLGlCQUFBLFlBQUE7R0FDQSxpQkFBQTs7O0VBR0EsS0FBQSxzQkFBQSxZQUFBO0dBQ0EsT0FBQTs7Ozs7Ozs7Ozs7O0FDNU1BLFFBQUEsT0FBQSxvQkFBQSxRQUFBLG9CQUFBLFVBQUEsS0FBQTtFQUNBO0VBQ0EsSUFBQSxTQUFBLENBQUEsR0FBQSxHQUFBLEdBQUE7O0VBRUEsSUFBQSxhQUFBLElBQUEsR0FBQSxLQUFBLFdBQUE7R0FDQSxNQUFBO0dBQ0EsT0FBQTtHQUNBLFFBQUE7OztFQUdBLElBQUEsYUFBQSxJQUFBLEdBQUEsTUFBQTs7RUFFQSxLQUFBLE9BQUEsVUFBQSxPQUFBO0dBQ0EsSUFBQSxTQUFBOzs7R0FHQSxNQUFBLElBQUEsZUFBQSxVQUFBLEdBQUEsT0FBQTtJQUNBLE9BQUEsS0FBQSxNQUFBO0lBQ0EsT0FBQSxLQUFBLE1BQUE7O0lBRUEsSUFBQSxPQUFBLE1BQUEsU0FBQTs7SUFFQSxJQUFBLFNBQUEsTUFBQSxTQUFBOztJQUVBLElBQUEsT0FBQSxPQUFBLGFBQUEsT0FBQSxPQUFBLFdBQUE7S0FDQSxTQUFBLEdBQUEsT0FBQSxVQUFBOzs7SUFHQSxJQUFBLGNBQUEsSUFBQSxHQUFBLE9BQUEsWUFBQTtLQUNBLEtBQUEsTUFBQTtLQUNBLFlBQUE7S0FDQSxhQUFBOzs7SUFHQSxXQUFBLFVBQUE7O0lBRUEsSUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO0tBQ0EsWUFBQTtLQUNBLFFBQUE7S0FDQSxNQUFBO0tBQ0EsWUFBQTs7S0FFQSxlQUFBOztLQUVBLFFBQUE7Ozs7SUFJQSxJQUFBLFNBQUEsV0FBQTtLQUNBLElBQUEsVUFBQSxVQUFBLFFBQUEsSUFBQTs7Ozs7RUFLQSxLQUFBLFlBQUEsWUFBQTtHQUNBLE9BQUE7OztFQUdBLEtBQUEsZ0JBQUEsWUFBQTtHQUNBLE9BQUE7Ozs7Ozs7Ozs7O0FDM0RBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLFVBQUEsWUFBQTtFQUNBOztFQUVBLElBQUEsUUFBQSxDQUFBLEtBQUEsS0FBQSxLQUFBO0VBQ0EsSUFBQSxPQUFBLENBQUEsR0FBQSxLQUFBLEtBQUE7RUFDQSxJQUFBLFNBQUE7RUFDQSxJQUFBLFFBQUE7O0VBRUEsS0FBQSxXQUFBO0dBQ0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUE7S0FDQSxPQUFBOztJQUVBLE9BQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLFFBQUE7S0FDQSxNQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7TUFDQSxPQUFBOztLQUVBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtNQUNBLE9BQUE7TUFDQSxPQUFBOzs7O0dBSUEsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUE7S0FDQSxPQUFBOzs7OztFQUtBLEtBQUEsWUFBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsT0FBQTs7SUFFQSxPQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBO01BQ0EsT0FBQTs7S0FFQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7TUFDQSxPQUFBO01BQ0EsT0FBQTs7OztHQUlBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsT0FBQTs7Ozs7RUFLQSxLQUFBLFVBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQTtLQUNBLE9BQUE7O0lBRUEsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtNQUNBLE9BQUE7O0tBRUEsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO01BQ0EsT0FBQTtNQUNBLE9BQUE7TUFDQSxVQUFBLENBQUE7Ozs7R0FJQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQTtLQUNBLE9BQUE7S0FDQSxVQUFBLENBQUE7Ozs7O0VBS0EsS0FBQSxXQUFBO0dBQ0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUE7S0FDQSxPQUFBOzs7R0FHQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQTtLQUNBLE9BQUE7Ozs7Ozs7Ozs7Ozs7QUMvRkEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsYUFBQSxZQUFBO0VBQ0E7O0VBRUEsSUFBQSxRQUFBOzs7RUFHQSxJQUFBLGNBQUEsWUFBQTtHQUNBLElBQUEsU0FBQSxTQUFBLEtBQUEsUUFBQSxLQUFBOzhCQUNBLE1BQUE7O0dBRUEsSUFBQSxRQUFBOztHQUVBLE9BQUEsUUFBQSxVQUFBLE9BQUE7O0lBRUEsSUFBQSxVQUFBLE1BQUEsTUFBQTtJQUNBLElBQUEsV0FBQSxRQUFBLFdBQUEsR0FBQTtLQUNBLE1BQUEsUUFBQSxNQUFBLG1CQUFBLFFBQUE7Ozs7R0FJQSxPQUFBOzs7O0VBSUEsSUFBQSxjQUFBLFVBQUEsT0FBQTtHQUNBLElBQUEsU0FBQTtHQUNBLEtBQUEsSUFBQSxPQUFBLE9BQUE7SUFDQSxVQUFBLE1BQUEsTUFBQSxtQkFBQSxNQUFBLFFBQUE7O0dBRUEsT0FBQSxPQUFBLFVBQUEsR0FBQSxPQUFBLFNBQUE7OztFQUdBLEtBQUEsWUFBQSxVQUFBLEdBQUE7R0FDQSxNQUFBLE9BQUE7R0FDQSxRQUFBLFVBQUEsT0FBQSxJQUFBLE1BQUEsT0FBQSxNQUFBLFlBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsVUFBQSxRQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsUUFBQTtJQUNBLE1BQUEsT0FBQSxPQUFBOztHQUVBLFFBQUEsYUFBQSxPQUFBLElBQUEsTUFBQSxPQUFBLE1BQUEsWUFBQTs7OztFQUlBLEtBQUEsTUFBQSxVQUFBLEtBQUE7R0FDQSxPQUFBLE1BQUE7OztFQUdBLFFBQUEsUUFBQTs7RUFFQSxJQUFBLENBQUEsT0FBQTtHQUNBLFFBQUE7Ozs7Ozs7Ozs7O0FDckRBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLHlGQUFBLFVBQUEsUUFBQSxnQkFBQSxRQUFBLGFBQUEsUUFBQTtFQUNBOztFQUVBLE9BQUEsbUJBQUEsZUFBQSxzQkFBQTs7RUFFQSxPQUFBLGlCQUFBLG9CQUFBLFVBQUEsVUFBQTtHQUNBLFNBQUEsUUFBQSxVQUFBLFNBQUE7SUFDQSxPQUFBLG1CQUFBLFFBQUE7Ozs7RUFJQSxJQUFBLHFCQUFBLFlBQUE7R0FDQSxPQUFBLGNBQUEsWUFBQTs7O0VBR0EsSUFBQSxtQkFBQSxlQUFBOztFQUVBLE9BQUEsY0FBQTs7RUFFQSxPQUFBLGlCQUFBLGVBQUE7O0VBRUEsT0FBQSxtQkFBQSxVQUFBLEdBQUEsSUFBQTs7R0FFQSxJQUFBLENBQUEsRUFBQSxVQUFBO0lBQ0EsT0FBQTs7R0FFQSxlQUFBLE9BQUE7OztRQUdBLE9BQUEsZ0JBQUEsZUFBQTs7RUFFQSxPQUFBLGFBQUEsVUFBQSxJQUFBO0dBQ0EsSUFBQSxXQUFBO0dBQ0EsaUJBQUEsUUFBQSxVQUFBLFNBQUE7SUFDQSxJQUFBLFFBQUEsY0FBQSxRQUFBLFdBQUEsTUFBQSxJQUFBO0tBQ0EsV0FBQTs7O0dBR0EsT0FBQTs7O0VBR0EsT0FBQSxJQUFBLGVBQUE7Ozs7Ozs7Ozs7O0FDekNBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLG9GQUFBLFVBQUEsUUFBQSxRQUFBLFFBQUEsV0FBQSxLQUFBLFFBQUE7UUFDQTs7UUFFQSxPQUFBLFNBQUE7UUFDQSxPQUFBLGVBQUE7UUFDQSxPQUFBLFdBQUEsQ0FBQSxDQUFBLE9BQUE7O1FBRUEsT0FBQSxhQUFBLE9BQUEsYUFBQSxPQUFBLFdBQUEsTUFBQSxPQUFBOztRQUVBLE9BQUEsY0FBQSxPQUFBOzs7UUFHQSxPQUFBLFdBQUE7WUFDQSxNQUFBLFVBQUEsSUFBQTtZQUNBLFFBQUEsQ0FBQSxVQUFBLElBQUEsTUFBQSxVQUFBLElBQUE7Ozs7UUFJQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxPQUFBLGVBQUE7WUFDQSxPQUFBLFdBQUEsZUFBQSxPQUFBLE9BQUE7Ozs7UUFJQSxJQUFBLFlBQUEsWUFBQTtZQUNBLFVBQUEsVUFBQSxPQUFBLE9BQUEsYUFBQTs7OztRQUlBLElBQUEsZUFBQSxZQUFBO1lBQ0EsT0FBQSxlQUFBOzs7O1FBSUEsSUFBQSxZQUFBLFVBQUEsSUFBQTtZQUNBO1lBQ0EsT0FBQSxPQUFBLEtBQUEsU0FBQTswQkFDQSxLQUFBOzBCQUNBLE1BQUEsSUFBQTs7O1FBR0EsSUFBQSxrQkFBQSxVQUFBLEdBQUE7WUFDQSxRQUFBLEVBQUE7Z0JBQ0EsS0FBQTtvQkFDQSxPQUFBO29CQUNBO2dCQUNBLEtBQUE7b0JBQ0EsT0FBQTtvQkFDQTtnQkFDQTtvQkFDQSxPQUFBLE9BQUEsWUFBQTt3QkFDQSxPQUFBLFdBQUEsWUFBQTs7Ozs7O1FBTUEsT0FBQSxZQUFBLFlBQUE7WUFDQTtZQUNBLE9BQUE7bUJBQ0EsS0FBQTttQkFDQSxLQUFBO21CQUNBLE1BQUEsSUFBQTs7OztRQUlBLE9BQUEsWUFBQSxZQUFBO1lBQ0E7WUFDQSxPQUFBO21CQUNBLEtBQUE7bUJBQ0EsS0FBQTttQkFDQSxNQUFBLElBQUE7Ozs7UUFJQSxPQUFBLElBQUEsa0JBQUEsU0FBQSxHQUFBLFFBQUE7WUFDQSxPQUFBLFNBQUEsT0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQSxLQUFBLE1BQUEsT0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQSxLQUFBLE1BQUEsT0FBQSxPQUFBO1lBQ0EsVUFBQSxJQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBLE9BQUE7Z0JBQ0EsR0FBQSxPQUFBLFNBQUEsT0FBQTs7Ozs7UUFLQSxPQUFBLGFBQUEsU0FBQSxHQUFBO1lBQ0EsSUFBQSxRQUFBLEVBQUE7WUFDQSxJQUFBLFNBQUEsTUFBQSxTQUFBLFdBQUE7Z0JBQ0EsVUFBQSxNQUFBOzs7O1FBSUEsU0FBQSxpQkFBQSxZQUFBOzs7UUFHQSxPQUFBLEtBQUEsT0FBQTs7UUFFQSxVQUFBLE9BQUEsU0FBQSxLQUFBOzs7Ozs7Ozs7OztBQ25HQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSxnRkFBQSxVQUFBLFFBQUEsVUFBQSxnQkFBQSxLQUFBLFVBQUE7RUFDQTs7O0VBR0EsSUFBQSxHQUFBLFdBQUEsU0FBQSxHQUFBO0dBQ0EsSUFBQSxPQUFBLElBQUE7R0FDQSxPQUFBLE1BQUEsa0JBQUE7SUFDQSxRQUFBLEtBQUE7SUFDQSxNQUFBLEtBQUE7Ozs7RUFJQSxTQUFBLEtBQUE7RUFDQSxlQUFBLEtBQUE7O0VBRUEsSUFBQSxhQUFBLFlBQUE7OztHQUdBLFNBQUEsV0FBQTtJQUNBLElBQUE7TUFDQSxHQUFBOzs7RUFHQSxPQUFBLElBQUEsd0JBQUE7RUFDQSxPQUFBLElBQUEseUJBQUE7Ozs7Ozs7Ozs7QUN4QkEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsNkNBQUEsVUFBQSxRQUFBLFFBQUE7UUFDQTs7O1FBR0EsSUFBQSxnQkFBQTtRQUNBLElBQUEsdUJBQUE7OztRQUdBLElBQUEsa0JBQUEsWUFBQTtZQUNBLElBQUEsTUFBQSxPQUFBLFdBQUEsSUFBQSxVQUFBLE1BQUE7Z0JBQ0EsT0FBQSxLQUFBOztZQUVBLE9BQUEsYUFBQSx3QkFBQSxLQUFBLFVBQUE7Ozs7UUFJQSxJQUFBLGlCQUFBLFlBQUE7WUFDQSxJQUFBLE1BQUEsS0FBQSxNQUFBLE9BQUEsYUFBQTtZQUNBLE9BQUEsYUFBQSxPQUFBLFdBQUEsT0FBQSxVQUFBLE1BQUE7Z0JBQ0EsT0FBQSxJQUFBLFFBQUEsS0FBQSxRQUFBLENBQUE7Ozs7UUFJQSxPQUFBLGFBQUE7UUFDQSxPQUFBLGFBQUE7UUFDQSxPQUFBLFFBQUEsS0FBQSxVQUFBLEtBQUE7WUFDQSxLQUFBLElBQUEsT0FBQSxLQUFBO2dCQUNBLE9BQUEsYUFBQSxPQUFBLFdBQUEsT0FBQSxJQUFBOztZQUVBOzs7UUFHQSxPQUFBLGlCQUFBLE9BQUE7O1FBRUEsT0FBQSxhQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUEsaUJBQUE7WUFDQSxPQUFBLFdBQUEsdUJBQUE7OztRQUdBLE9BQUEsY0FBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLE9BQUEsV0FBQSxRQUFBLFVBQUEsQ0FBQTs7OztRQUlBLE9BQUEsa0JBQUEsVUFBQSxHQUFBLE1BQUE7WUFDQSxFQUFBO1lBQ0EsSUFBQSxRQUFBLE9BQUEsV0FBQSxRQUFBO1lBQ0EsSUFBQSxVQUFBLENBQUEsS0FBQSxPQUFBLFdBQUEsU0FBQSxlQUFBO2dCQUNBLE9BQUEsV0FBQSxLQUFBO21CQUNBO2dCQUNBLE9BQUEsV0FBQSxPQUFBLE9BQUE7O1lBRUE7Ozs7UUFJQSxPQUFBLGlCQUFBLFlBQUE7WUFDQSxPQUFBLE9BQUEsV0FBQSxTQUFBOzs7O1FBSUEsT0FBQSxJQUFBLFlBQUEsVUFBQSxHQUFBLFVBQUE7WUFDQSxJQUFBLFdBQUEsQ0FBQSxTQUFBLFNBQUEsU0FBQSxRQUFBLFNBQUE7WUFDQSxJQUFBLFNBQUEsU0FBQSxPQUFBLGFBQUE7WUFDQSxJQUFBLENBQUEsTUFBQSxXQUFBLFNBQUEsS0FBQSxVQUFBLE9BQUEsV0FBQSxRQUFBO2dCQUNBLE9BQUEsV0FBQSxPQUFBLFdBQUEsU0FBQTs7Ozs7Ozs7Ozs7OztBQ2xFQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSw2Q0FBQSxVQUFBLFFBQUEsUUFBQTtFQUNBOztFQUVBLE9BQUEsYUFBQTs7RUFFQSxPQUFBLE9BQUEsY0FBQSxVQUFBLFlBQUE7R0FDQSxPQUFBLHFCQUFBLFdBQUE7O0dBRUEsSUFBQSxjQUFBLE1BQUE7SUFDQSxPQUFBLGtCQUFBO1VBQ0EsSUFBQSxjQUFBLE1BQUE7SUFDQSxPQUFBLGtCQUFBO1VBQ0EsSUFBQSxjQUFBLE9BQUE7SUFDQSxPQUFBLGtCQUFBO1VBQ0E7SUFDQSxPQUFBLGtCQUFBOzs7Ozs7Ozs7Ozs7O0FDZkEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsOEVBQUEsVUFBQSxRQUFBLGdCQUFBLFFBQUEsS0FBQSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBOztFQUVBLE9BQUEsY0FBQSxVQUFBLE1BQUE7R0FDQSxJQUFBLENBQUEsT0FBQSxlQUFBO2dCQUNBLE9BQUEsTUFBQSwyQkFBQTtJQUNBLElBQUEsS0FBQSxPQUFBO0lBQ0E7OztHQUdBLGVBQUE7O0dBRUEsSUFBQSxTQUFBLFNBQUEsV0FBQSxPQUFBLGtCQUFBLE9BQUE7SUFDQSxPQUFBLGdCQUFBO0lBQ0EsVUFBQTtVQUNBO0lBQ0EsT0FBQSxnQkFBQTtJQUNBLGVBQUEsYUFBQTtJQUNBLFVBQUE7Ozs7UUFJQSxPQUFBLElBQUEsWUFBQSxVQUFBLEdBQUEsVUFBQTs7WUFFQSxJQUFBLFNBQUEsWUFBQSxJQUFBO2dCQUNBLE9BQUEsWUFBQTtnQkFDQTs7WUFFQSxJQUFBLFdBQUEsQ0FBQSxTQUFBLFNBQUEsU0FBQSxRQUFBLFNBQUE7WUFDQSxRQUFBLE9BQUEsYUFBQTtnQkFDQSxLQUFBO29CQUNBLE9BQUEsWUFBQTtvQkFDQTtnQkFDQSxLQUFBO29CQUNBLE9BQUEsWUFBQTtvQkFDQTtnQkFDQSxLQUFBO29CQUNBLE9BQUEsWUFBQTtvQkFDQTtnQkFDQSxLQUFBO29CQUNBLE9BQUEsWUFBQTtvQkFDQTtnQkFDQSxLQUFBO29CQUNBLE9BQUEsWUFBQTtvQkFDQTs7Ozs7Ozs7Ozs7OztBQzlDQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSx5RUFBQSxVQUFBLFFBQUEsS0FBQSxVQUFBLFVBQUEsUUFBQTtFQUNBOztFQUVBLElBQUEsVUFBQSxJQUFBLEdBQUEsSUFBQTtHQUNBLFFBQUE7O0dBRUEsVUFBQTs7R0FFQSxjQUFBOzs7O0VBSUEsUUFBQSxjQUFBLElBQUE7O0VBRUEsSUFBQSxpQkFBQSxJQUFBLEdBQUEsZUFBQTtHQUNBLEtBQUE7R0FDQSxPQUFBLE9BQUE7OztFQUdBLElBQUEsV0FBQSxJQUFBLEdBQUE7RUFDQSxlQUFBLFdBQUE7OztFQUdBLE9BQUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxRQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7SUFDQSxZQUFBLFNBQUE7SUFDQSxRQUFBLEdBQUEsT0FBQSxVQUFBLFNBQUE7SUFDQSxNQUFBOzs7OztFQUtBLElBQUEsa0JBQUEsWUFBQTtHQUNBLElBQUEsU0FBQSxJQUFBLFVBQUEsZ0JBQUEsSUFBQTtHQUNBLFNBQUEsWUFBQSxHQUFBLEtBQUEsUUFBQSxXQUFBOzs7RUFHQSxJQUFBLEdBQUEsV0FBQTs7RUFFQSxJQUFBLGVBQUEsVUFBQSxHQUFBO0dBQ0EsSUFBQSxVQUFBLFVBQUEsRUFBQTs7O0VBR0EsUUFBQSxHQUFBLGVBQUE7O0VBRUEsU0FBQSxHQUFBLGNBQUEsWUFBQTtHQUNBLFFBQUEsR0FBQSxlQUFBOzs7RUFHQSxTQUFBLEdBQUEsY0FBQSxZQUFBO0dBQ0EsUUFBQSxHQUFBLGVBQUE7Ozs7Ozs7Ozs7O0FDbERBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLGdEQUFBLFVBQUEsUUFBQSxRQUFBO0VBQ0E7O1FBRUEsT0FBQSxtQkFBQSxPQUFBOzs7Ozs7Ozs7OztBQ0hBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLGdFQUFBLFVBQUEsUUFBQSxZQUFBLGdCQUFBO0VBQ0E7O1FBRUEsSUFBQSxvQkFBQTs7O0VBR0EsT0FBQSxVQUFBLE9BQUEsYUFBQSxzQkFBQTtRQUNBLElBQUEsT0FBQSxTQUFBO1lBQ0EsV0FBQSxXQUFBOzs7RUFHQSxPQUFBLGNBQUEsVUFBQSxNQUFBO0dBQ0EsT0FBQSxVQUFBLE9BQUEsYUFBQSxxQkFBQTtHQUNBLFdBQUEsV0FBQTs7O0VBR0EsT0FBQSxlQUFBLFlBQUE7R0FDQSxPQUFBLFVBQUEsT0FBQSxhQUFBLHFCQUFBO0dBQ0EsV0FBQSxXQUFBOzs7RUFHQSxPQUFBLGdCQUFBLFVBQUEsTUFBQTtHQUNBLElBQUEsT0FBQSxZQUFBLE1BQUE7SUFDQSxPQUFBO1VBQ0E7SUFDQSxPQUFBLFlBQUE7Ozs7RUFJQSxPQUFBLDRCQUFBLFlBQUE7WUFDQSxJQUFBLGVBQUEsc0JBQUEsY0FBQSxLQUFBLFFBQUEsOERBQUE7Z0JBQ0EsZUFBQTs7OztRQUlBLFdBQUEsSUFBQSwyQkFBQSxVQUFBLEdBQUEsTUFBQTtZQUNBLE9BQUEsWUFBQTs7O1FBR0EsT0FBQSxJQUFBLFlBQUEsVUFBQSxHQUFBLFVBQUE7WUFDQSxJQUFBLFNBQUEsWUFBQSxJQUFBO2dCQUNBLE9BQUE7Ozs7O0FBS0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgYW5ub3RhdGlvbnMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycsIFsnZGlhcy5hcGknLCAnZGlhcy51aS5tZXNzYWdlcyddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBhbm5vdGF0aW9uTGlzdEl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQW4gYW5ub3RhdGlvbiBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZGlyZWN0aXZlKCdhbm5vdGF0aW9uTGlzdEl0ZW0nLCBmdW5jdGlvbiAobGFiZWxzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0c2NvcGU6IHRydWUsXG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cdFx0XHRcdCRzY29wZS5zaGFwZUNsYXNzID0gJ2ljb24tJyArICRzY29wZS5hbm5vdGF0aW9uLnNoYXBlLnRvTG93ZXJDYXNlKCk7XG5cblx0XHRcdFx0JHNjb3BlLnNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuaXNTZWxlY3RlZCgkc2NvcGUuYW5ub3RhdGlvbi5pZCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmF0dGFjaExhYmVsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGxhYmVscy5hdHRhY2hUb0Fubm90YXRpb24oJHNjb3BlLmFubm90YXRpb24pO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5yZW1vdmVMYWJlbCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuXHRcdFx0XHRcdGxhYmVscy5yZW1vdmVGcm9tQW5ub3RhdGlvbigkc2NvcGUuYW5ub3RhdGlvbiwgbGFiZWwpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5jYW5BdHRhY2hMYWJlbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLnNlbGVjdGVkKCkgJiYgbGFiZWxzLmhhc1NlbGVjdGVkKCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRMYWJlbCA9IGxhYmVscy5nZXRTZWxlY3RlZDtcblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudENvbmZpZGVuY2UgPSBsYWJlbHMuZ2V0Q3VycmVudENvbmZpZGVuY2U7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYWJlbENhdGVnb3J5SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBIGxhYmVsIGNhdGVnb3J5IGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5kaXJlY3RpdmUoJ2xhYmVsQ2F0ZWdvcnlJdGVtJywgZnVuY3Rpb24gKCRjb21waWxlLCAkdGltZW91dCwgJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQycsXG5cbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnbGFiZWwtaXRlbS5odG1sJyxcblxuICAgICAgICAgICAgc2NvcGU6IHRydWUsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyB3YWl0IGZvciB0aGlzIGVsZW1lbnQgdG8gYmUgcmVuZGVyZWQgdW50aWwgdGhlIGNoaWxkcmVuIGFyZVxuICAgICAgICAgICAgICAgIC8vIGFwcGVuZGVkLCBvdGhlcndpc2UgdGhlcmUgd291bGQgYmUgdG9vIG11Y2ggcmVjdXJzaW9uIGZvclxuICAgICAgICAgICAgICAgIC8vIGFuZ3VsYXJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoJ2xhYmVsLXN1YnRyZWUuaHRtbCcpKTtcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKCRjb21waWxlKGNvbnRlbnQpKHNjb3BlKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgLy8gb3BlbiB0aGUgc3VidHJlZSBvZiB0aGlzIGl0ZW1cbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpdGVtIGhhcyBjaGlsZHJlblxuICAgICAgICAgICAgICAgICRzY29wZS5pc0V4cGFuZGFibGUgPSAkc2NvcGUudHJlZSAmJiAhISRzY29wZS50cmVlWyRzY29wZS5pdGVtLmlkXTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaXMgY3VycmVudGx5IHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIC8vIGhhbmRsZSB0aGlzIGJ5IHRoZSBldmVudCByYXRoZXIgdGhhbiBhbiBvd24gY2xpY2sgaGFuZGxlciB0b1xuICAgICAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBjbGljayBhbmQgc2VhcmNoIGZpZWxkIGFjdGlvbnMgaW4gYSB1bmlmaWVkIHdheVxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZSwgY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgYW4gaXRlbSBpcyBzZWxlY3RlZCwgaXRzIHN1YnRyZWUgYW5kIGFsbCBwYXJlbnQgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIG9wZW5lZFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0uaWQgPT09IGNhdGVnb3J5LmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgaGl0cyBhbGwgcGFyZW50IHNjb3Blcy9pdGVtc1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiBhIGNoaWxkIGl0ZW0gd2FzIHNlbGVjdGVkLCB0aGlzIGl0ZW0gc2hvdWxkIGJlIG9wZW5lZCwgdG9vXG4gICAgICAgICAgICAgICAgLy8gc28gdGhlIHNlbGVjdGVkIGl0ZW0gYmVjb21lcyB2aXNpYmxlIGluIHRoZSB0cmVlXG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5vcGVuUGFyZW50cycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAvLyBzdG9wIHByb3BhZ2F0aW9uIGlmIHRoaXMgaXMgYSByb290IGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5pdGVtLnBhcmVudF9pZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgbGFiZWxJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEFuIGFubm90YXRpb24gbGFiZWwgbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmRpcmVjdGl2ZSgnbGFiZWxJdGVtJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0dmFyIGNvbmZpZGVuY2UgPSAkc2NvcGUuYW5ub3RhdGlvbkxhYmVsLmNvbmZpZGVuY2U7XG5cblx0XHRcdFx0aWYgKGNvbmZpZGVuY2UgPD0gMC4yNSkge1xuXHRcdFx0XHRcdCRzY29wZS5jbGFzcyA9ICdsYWJlbC1kYW5nZXInO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC41ICkge1xuXHRcdFx0XHRcdCRzY29wZS5jbGFzcyA9ICdsYWJlbC13YXJuaW5nJztcblx0XHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNzUgKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXN1Y2Nlc3MnO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCRzY29wZS5jbGFzcyA9ICdsYWJlbC1wcmltYXJ5Jztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIGRlYm91bmNlXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgZGVib3VuY2Ugc2VydmljZSB0byBwZXJmb3JtIGFuIGFjdGlvbiBvbmx5IHdoZW4gdGhpcyBmdW5jdGlvblxuICogd2Fzbid0IGNhbGxlZCBhZ2FpbiBpbiBhIHNob3J0IHBlcmlvZCBvZiB0aW1lLlxuICogc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEzMzIwMDE2LzE3OTY1MjNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5mYWN0b3J5KCdkZWJvdW5jZScsIGZ1bmN0aW9uICgkdGltZW91dCwgJHEpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciB0aW1lb3V0cyA9IHt9O1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChmdW5jLCB3YWl0LCBpZCkge1xuXHRcdFx0Ly8gQ3JlYXRlIGEgZGVmZXJyZWQgb2JqZWN0IHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHdlIG5lZWQgdG9cblx0XHRcdC8vIGFjdHVhbGx5IGNhbGwgdGhlIGZ1bmNcblx0XHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0XHRcdHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHRpbWVvdXRzW2lkXSA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncykpO1xuXHRcdFx0XHRcdGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aWYgKHRpbWVvdXRzW2lkXSkge1xuXHRcdFx0XHRcdCR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0c1tpZF0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRpbWVvdXRzW2lkXSA9ICR0aW1lb3V0KGxhdGVyLCB3YWl0KTtcblx0XHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG5cdFx0XHR9KSgpO1xuXHRcdH07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBtYXBcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBmYWN0b3J5IGhhbmRsaW5nIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZmFjdG9yeSgnbWFwJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIG1hcCA9IG5ldyBvbC5NYXAoe1xuXHRcdFx0dGFyZ2V0OiAnY2FudmFzJyxcblx0XHRcdGNvbnRyb2xzOiBbXG5cdFx0XHRcdG5ldyBvbC5jb250cm9sLlpvb20oKSxcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuWm9vbVRvRXh0ZW50KCksXG5cdFx0XHRcdG5ldyBvbC5jb250cm9sLkZ1bGxTY3JlZW4oKVxuXHRcdFx0XVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIG1hcDtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGFubm90YXRpb25zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSB0aGUgYW5ub3RhdGlvbnMgdG8gbWFrZSB0aGVtIGF2YWlsYWJsZSBpbiBtdWx0aXBsZSBjb250cm9sbGVycy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdhbm5vdGF0aW9ucycsIGZ1bmN0aW9uIChBbm5vdGF0aW9uLCBzaGFwZXMsIGxhYmVscywgbXNnKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgYW5ub3RhdGlvbnM7XG5cblx0XHR2YXIgcmVzb2x2ZVNoYXBlTmFtZSA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHRhbm5vdGF0aW9uLnNoYXBlID0gc2hhcGVzLmdldE5hbWUoYW5ub3RhdGlvbi5zaGFwZV9pZCk7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbjtcblx0XHR9O1xuXG5cdFx0dmFyIGFkZEFubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0YW5ub3RhdGlvbnMucHVzaChhbm5vdGF0aW9uKTtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR0aGlzLnF1ZXJ5ID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0YW5ub3RhdGlvbnMgPSBBbm5vdGF0aW9uLnF1ZXJ5KHBhcmFtcyk7XG5cdFx0XHRhbm5vdGF0aW9ucy4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uIChhKSB7XG5cdFx0XHRcdGEuZm9yRWFjaChyZXNvbHZlU2hhcGVOYW1lKTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb25zO1xuXHRcdH07XG5cblx0XHR0aGlzLmFkZCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcblx0XHRcdGlmICghcGFyYW1zLnNoYXBlX2lkICYmIHBhcmFtcy5zaGFwZSkge1xuXHRcdFx0XHRwYXJhbXMuc2hhcGVfaWQgPSBzaGFwZXMuZ2V0SWQocGFyYW1zLnNoYXBlKTtcblx0XHRcdH1cblx0XHRcdHZhciBsYWJlbCA9IGxhYmVscy5nZXRTZWxlY3RlZCgpO1xuXHRcdFx0cGFyYW1zLmxhYmVsX2lkID0gbGFiZWwuaWQ7XG5cdFx0XHRwYXJhbXMuY29uZmlkZW5jZSA9IGxhYmVscy5nZXRDdXJyZW50Q29uZmlkZW5jZSgpO1xuXHRcdFx0dmFyIGFubm90YXRpb24gPSBBbm5vdGF0aW9uLmFkZChwYXJhbXMpO1xuXHRcdFx0YW5ub3RhdGlvbi4kcHJvbWlzZVxuXHRcdFx0ICAgICAgICAgIC50aGVuKHJlc29sdmVTaGFwZU5hbWUpXG5cdFx0XHQgICAgICAgICAgLnRoZW4oYWRkQW5ub3RhdGlvbilcblx0XHRcdCAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuXG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbjtcblx0XHR9O1xuXG5cdFx0dGhpcy5kZWxldGUgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0Ly8gdXNlIGluZGV4IHRvIHNlZSBpZiB0aGUgYW5ub3RhdGlvbiBleGlzdHMgaW4gdGhlIGFubm90YXRpb25zIGxpc3Rcblx0XHRcdHZhciBpbmRleCA9IGFubm90YXRpb25zLmluZGV4T2YoYW5ub3RhdGlvbik7XG5cdFx0XHRpZiAoaW5kZXggPiAtMSkge1xuXHRcdFx0XHRyZXR1cm4gYW5ub3RhdGlvbi4kZGVsZXRlKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQvLyB1cGRhdGUgdGhlIGluZGV4IHNpbmNlIHRoZSBhbm5vdGF0aW9ucyBsaXN0IG1heSBoYXZlIGJlZW4gXG5cdFx0XHRcdFx0Ly8gbW9kaWZpZWQgaW4gdGhlIG1lYW50aW1lXG5cdFx0XHRcdFx0aW5kZXggPSBhbm5vdGF0aW9ucy5pbmRleE9mKGFubm90YXRpb24pO1xuXHRcdFx0XHRcdGFubm90YXRpb25zLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdH0sIG1zZy5yZXNwb25zZUVycm9yKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5mb3JFYWNoID0gZnVuY3Rpb24gKGZuKSB7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnMuZm9yRWFjaChmbik7XG5cdFx0fTtcblxuXHRcdHRoaXMuY3VycmVudCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9ucztcblx0XHR9O1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgaW1hZ2VzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1hbmFnZXMgKHByZS0pbG9hZGluZyBvZiB0aGUgaW1hZ2VzIHRvIGFubm90YXRlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2ltYWdlcycsIGZ1bmN0aW9uIChUcmFuc2VjdEltYWdlLCBVUkwsICRxKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXHRcdC8vIGFycmF5IG9mIGFsbCBpbWFnZSBJRHMgb2YgdGhlIHRyYW5zZWN0XG5cdFx0dmFyIGltYWdlSWRzID0gW107XG5cdFx0Ly8gbWF4aW11bSBudW1iZXIgb2YgaW1hZ2VzIHRvIGhvbGQgaW4gYnVmZmVyXG5cdFx0dmFyIE1BWF9CVUZGRVJfU0laRSA9IDEwO1xuXHRcdC8vIGJ1ZmZlciBvZiBhbHJlYWR5IGxvYWRlZCBpbWFnZXNcblx0XHR2YXIgYnVmZmVyID0gW107XG5cblx0XHQvLyB0aGUgY3VycmVudGx5IHNob3duIGltYWdlXG5cdFx0dGhpcy5jdXJyZW50SW1hZ2UgPSB1bmRlZmluZWQ7XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBuZXh0IElEIG9mIHRoZSBzcGVjaWZpZWQgaW1hZ2Ugb3IgdGhlIG5leHQgSUQgb2YgdGhlIFxuXHRcdCAqIGN1cnJlbnQgaW1hZ2UgaWYgbm8gaW1hZ2Ugd2FzIHNwZWNpZmllZC5cblx0XHQgKi9cblx0XHR2YXIgbmV4dElkID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRpZCA9IGlkIHx8IF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0XHR2YXIgaW5kZXggPSBpbWFnZUlkcy5pbmRleE9mKGlkKTtcblx0XHRcdHJldHVybiBpbWFnZUlkc1soaW5kZXggKyAxKSAlIGltYWdlSWRzLmxlbmd0aF07XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIHByZXZpb3VzIElEIG9mIHRoZSBzcGVjaWZpZWQgaW1hZ2Ugb3IgdGhlIHByZXZpb3VzIElEIG9mXG5cdFx0ICogdGhlIGN1cnJlbnQgaW1hZ2UgaWYgbm8gaW1hZ2Ugd2FzIHNwZWNpZmllZC5cblx0XHQgKi9cblx0XHR2YXIgcHJldklkID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRpZCA9IGlkIHx8IF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0XHR2YXIgaW5kZXggPSBpbWFnZUlkcy5pbmRleE9mKGlkKTtcblx0XHRcdHZhciBsZW5ndGggPSBpbWFnZUlkcy5sZW5ndGg7XG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHNbKGluZGV4IC0gMSArIGxlbmd0aCkgJSBsZW5ndGhdO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBzcGVjaWZpZWQgaW1hZ2UgZnJvbSB0aGUgYnVmZmVyIG9yIGB1bmRlZmluZWRgIGlmIGl0IGlzXG5cdFx0ICogbm90IGJ1ZmZlcmVkLlxuXHRcdCAqL1xuXHRcdHZhciBnZXRJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0aWQgPSBpZCB8fCBfdGhpcy5jdXJyZW50SW1hZ2UuX2lkO1xuXHRcdFx0Zm9yICh2YXIgaSA9IGJ1ZmZlci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRpZiAoYnVmZmVyW2ldLl9pZCA9PSBpZCkgcmV0dXJuIGJ1ZmZlcltpXTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2V0cyB0aGUgc3BlY2lmaWVkIGltYWdlIHRvIGFzIHRoZSBjdXJyZW50bHkgc2hvd24gaW1hZ2UuXG5cdFx0ICovXG5cdFx0dmFyIHNob3cgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdF90aGlzLmN1cnJlbnRJbWFnZSA9IGdldEltYWdlKGlkKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogTG9hZHMgdGhlIHNwZWNpZmllZCBpbWFnZSBlaXRoZXIgZnJvbSBidWZmZXIgb3IgZnJvbSB0aGUgZXh0ZXJuYWwgXG5cdFx0ICogcmVzb3VyY2UuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgZ2V0cyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpc1xuXHRcdCAqIGxvYWRlZC5cblx0XHQgKi9cblx0XHR2YXIgZmV0Y2hJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdHZhciBpbWcgPSBnZXRJbWFnZShpZCk7XG5cblx0XHRcdGlmIChpbWcpIHtcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbWcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG5cdFx0XHRcdGltZy5faWQgPSBpZDtcblx0XHRcdFx0aW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRidWZmZXIucHVzaChpbWcpO1xuXHRcdFx0XHRcdC8vIGNvbnRyb2wgbWF4aW11bSBidWZmZXIgc2l6ZVxuXHRcdFx0XHRcdGlmIChidWZmZXIubGVuZ3RoID4gTUFYX0JVRkZFUl9TSVpFKSB7XG5cdFx0XHRcdFx0XHRidWZmZXIuc2hpZnQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbWcpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpbWcub25lcnJvciA9IGZ1bmN0aW9uIChtc2cpIHtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3QobXNnKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aW1nLnNyYyA9IFVSTCArIFwiL2FwaS92MS9pbWFnZXMvXCIgKyBpZCArIFwiL2ZpbGVcIjtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEluaXRpYWxpemVzIHRoZSBzZXJ2aWNlIGZvciBhIGdpdmVuIHRyYW5zZWN0LiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0XG5cdFx0ICogaXMgcmVzb2x2ZWQsIHdoZW4gdGhlIHNlcnZpY2UgaXMgaW5pdGlhbGl6ZWQuXG5cdFx0ICovXG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKHRyYW5zZWN0SWQpIHtcblx0XHRcdGltYWdlSWRzID0gVHJhbnNlY3RJbWFnZS5xdWVyeSh7dHJhbnNlY3RfaWQ6IHRyYW5zZWN0SWR9KTtcblx0XHRcdFxuXHRcdFx0cmV0dXJuIGltYWdlSWRzLiRwcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBpbWFnZSB3aXRoIHRoZSBzcGVjaWZpZWQgSUQuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXNcblx0XHQgKiByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpcyBzaG93bi5cblx0XHQgKi9cblx0XHR0aGlzLnNob3cgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBwcm9taXNlID0gZmV0Y2hJbWFnZShpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0c2hvdyhpZCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gd2FpdCBmb3IgaW1hZ2VJZHMgdG8gYmUgbG9hZGVkXG5cdFx0XHRpbWFnZUlkcy4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0Ly8gcHJlLWxvYWQgcHJldmlvdXMgYW5kIG5leHQgaW1hZ2VzIGJ1dCBkb24ndCBkaXNwbGF5IHRoZW1cblx0XHRcdFx0ZmV0Y2hJbWFnZShuZXh0SWQoaWQpKTtcblx0XHRcdFx0ZmV0Y2hJbWFnZShwcmV2SWQoaWQpKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gcHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2hvdyB0aGUgbmV4dCBpbWFnZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMubmV4dCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfdGhpcy5zaG93KG5leHRJZCgpKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2hvdyB0aGUgcHJldmlvdXMgaW1hZ2UuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXNcblx0XHQgKiByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpcyBzaG93bi5cblx0XHQgKi9cblx0XHR0aGlzLnByZXYgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3RoaXMuc2hvdyhwcmV2SWQoKSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0Q3VycmVudElkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGxhYmVsc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgZm9yIGFubm90YXRpb24gbGFiZWxzIHRvIHByb3ZpZGUgc29tZSBjb252ZW5pZW5jZSBmdW5jdGlvbnMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnbGFiZWxzJywgZnVuY3Rpb24gKEFubm90YXRpb25MYWJlbCwgTGFiZWwsIFByb2plY3RMYWJlbCwgUHJvamVjdCwgbXNnLCAkcSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRMYWJlbDtcbiAgICAgICAgdmFyIGN1cnJlbnRDb25maWRlbmNlID0gMS4wO1xuXG4gICAgICAgIHZhciBsYWJlbHMgPSB7fTtcblxuICAgICAgICAvLyB0aGlzIHByb21pc2UgaXMgcmVzb2x2ZWQgd2hlbiBhbGwgbGFiZWxzIHdlcmUgbG9hZGVkXG4gICAgICAgIHRoaXMucHJvbWlzZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5zZXRQcm9qZWN0SWRzID0gZnVuY3Rpb24gKGlkcykge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIHRoaXMucHJvbWlzZSA9IGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICAvLyAtMSBiY2F1c2Ugb2YgZ2xvYmFsIGxhYmVsc1xuICAgICAgICAgICAgdmFyIGZpbmlzaGVkID0gLTE7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFsbCBsYWJlbHMgYXJlIHRoZXJlLiBpZiB5ZXMsIHJlc29sdmVcbiAgICAgICAgICAgIHZhciBtYXliZVJlc29sdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCsrZmluaXNoZWQgPT09IGlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShsYWJlbHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGxhYmVsc1tudWxsXSA9IExhYmVsLnF1ZXJ5KG1heWJlUmVzb2x2ZSk7XG5cbiAgICAgICAgICAgIGlkcy5mb3JFYWNoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICAgIFByb2plY3QuZ2V0KHtpZDogaWR9LCBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbHNbcHJvamVjdC5uYW1lXSA9IFByb2plY3RMYWJlbC5xdWVyeSh7cHJvamVjdF9pZDogaWR9LCBtYXliZVJlc29sdmUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5mZXRjaEZvckFubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgaWYgKCFhbm5vdGF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIGRvbid0IGZldGNoIHR3aWNlXG4gICAgICAgICAgICBpZiAoIWFubm90YXRpb24ubGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMgPSBBbm5vdGF0aW9uTGFiZWwucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9uX2lkOiBhbm5vdGF0aW9uLmlkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhbm5vdGF0aW9uLmxhYmVscztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmF0dGFjaFRvQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSBBbm5vdGF0aW9uTGFiZWwuYXR0YWNoKHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uX2lkOiBhbm5vdGF0aW9uLmlkLFxuICAgICAgICAgICAgICAgIGxhYmVsX2lkOiBzZWxlY3RlZExhYmVsLmlkLFxuICAgICAgICAgICAgICAgIGNvbmZpZGVuY2U6IGN1cnJlbnRDb25maWRlbmNlXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGFiZWwuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMucHVzaChsYWJlbCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGFiZWwuJHByb21pc2UuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuXG4gICAgICAgICAgICByZXR1cm4gbGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yZW1vdmVGcm9tQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uLCBsYWJlbCkge1xuICAgICAgICAgICAgLy8gdXNlIGluZGV4IHRvIHNlZSBpZiB0aGUgbGFiZWwgZXhpc3RzIGZvciB0aGUgYW5ub3RhdGlvblxuICAgICAgICAgICAgdmFyIGluZGV4ID0gYW5ub3RhdGlvbi5sYWJlbHMuaW5kZXhPZihsYWJlbCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsYWJlbC4kZGVsZXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBpbmRleCBzaW5jZSB0aGUgbGFiZWwgbGlzdCBtYXkgaGF2ZSBiZWVuIG1vZGlmaWVkXG4gICAgICAgICAgICAgICAgICAgIC8vIGluIHRoZSBtZWFudGltZVxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGFubm90YXRpb24ubGFiZWxzLmluZGV4T2YobGFiZWwpO1xuICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIH0sIG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldFRyZWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHt9O1xuICAgICAgICAgICAgdmFyIGtleSA9IG51bGw7XG4gICAgICAgICAgICB2YXIgYnVpbGQgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gbGFiZWwucGFyZW50X2lkO1xuICAgICAgICAgICAgICAgIGlmICh0cmVlW2tleV1bcGFyZW50XSkge1xuICAgICAgICAgICAgICAgICAgICB0cmVlW2tleV1bcGFyZW50XS5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cmVlW2tleV1bcGFyZW50XSA9IFtsYWJlbF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5wcm9taXNlLnRoZW4oZnVuY3Rpb24gKGxhYmVscykge1xuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGxhYmVscykge1xuICAgICAgICAgICAgICAgICAgICB0cmVlW2tleV0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxzW2tleV0uZm9yRWFjaChidWlsZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cmVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxhYmVscztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldFNlbGVjdGVkID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICBzZWxlY3RlZExhYmVsID0gbGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZExhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzU2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFzZWxlY3RlZExhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2V0Q3VycmVudENvbmZpZGVuY2UgPSBmdW5jdGlvbiAoY29uZmlkZW5jZSkge1xuICAgICAgICAgICAgY3VycmVudENvbmZpZGVuY2UgPSBjb25maWRlbmNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0Q3VycmVudENvbmZpZGVuY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudENvbmZpZGVuY2U7XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbWFwQW5ub3RhdGlvbnNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGhhbmRsaW5nIHRoZSBhbm5vdGF0aW9ucyBsYXllciBvbiB0aGUgT3BlbkxheWVycyBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdtYXBBbm5vdGF0aW9ucycsIGZ1bmN0aW9uIChtYXAsIGltYWdlcywgYW5ub3RhdGlvbnMsIGRlYm91bmNlLCBzdHlsZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBmZWF0dXJlT3ZlcmxheSA9IG5ldyBvbC5GZWF0dXJlT3ZlcmxheSh7XG5cdFx0XHRzdHlsZTogc3R5bGVzLmZlYXR1cmVzXG5cdFx0fSk7XG5cblx0XHR2YXIgZmVhdHVyZXMgPSBuZXcgb2wuQ29sbGVjdGlvbigpO1xuXG5cdFx0ZmVhdHVyZU92ZXJsYXkuc2V0RmVhdHVyZXMoZmVhdHVyZXMpO1xuXG5cdFx0Ly8gc2VsZWN0IGludGVyYWN0aW9uIHdvcmtpbmcgb24gXCJzaW5nbGVjbGlja1wiXG5cdFx0dmFyIHNlbGVjdCA9IG5ldyBvbC5pbnRlcmFjdGlvbi5TZWxlY3Qoe1xuXHRcdFx0c3R5bGU6IHN0eWxlcy5oaWdobGlnaHRcblx0XHR9KTtcblxuXHRcdHZhciBzZWxlY3RlZEZlYXR1cmVzID0gc2VsZWN0LmdldEZlYXR1cmVzKCk7XG5cblx0XHR2YXIgbW9kaWZ5ID0gbmV3IG9sLmludGVyYWN0aW9uLk1vZGlmeSh7XG5cdFx0XHRmZWF0dXJlczogZmVhdHVyZU92ZXJsYXkuZ2V0RmVhdHVyZXMoKSxcblx0XHRcdC8vIHRoZSBTSElGVCBrZXkgbXVzdCBiZSBwcmVzc2VkIHRvIGRlbGV0ZSB2ZXJ0aWNlcywgc29cblx0XHRcdC8vIHRoYXQgbmV3IHZlcnRpY2VzIGNhbiBiZSBkcmF3biBhdCB0aGUgc2FtZSBwb3NpdGlvblxuXHRcdFx0Ly8gb2YgZXhpc3RpbmcgdmVydGljZXNcblx0XHRcdGRlbGV0ZUNvbmRpdGlvbjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0cmV0dXJuIG9sLmV2ZW50cy5jb25kaXRpb24uc2hpZnRLZXlPbmx5KGV2ZW50KSAmJiBvbC5ldmVudHMuY29uZGl0aW9uLnNpbmdsZUNsaWNrKGV2ZW50KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIGRyYXdpbmcgaW50ZXJhY3Rpb25cblx0XHR2YXIgZHJhdztcblxuXHRcdC8vIGNvbnZlcnQgYSBwb2ludCBhcnJheSB0byBhIHBvaW50IG9iamVjdFxuXHRcdC8vIHJlLWludmVydCB0aGUgeSBheGlzXG5cdFx0dmFyIGNvbnZlcnRGcm9tT0xQb2ludCA9IGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdFx0cmV0dXJuIHt4OiBwb2ludFswXSwgeTogaW1hZ2VzLmN1cnJlbnRJbWFnZS5oZWlnaHQgLSBwb2ludFsxXX07XG5cdFx0fTtcblxuXHRcdC8vIGNvbnZlcnQgYSBwb2ludCBvYmplY3QgdG8gYSBwb2ludCBhcnJheVxuXHRcdC8vIGludmVydCB0aGUgeSBheGlzXG5cdFx0dmFyIGNvbnZlcnRUb09MUG9pbnQgPSBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdHJldHVybiBbcG9pbnQueCwgaW1hZ2VzLmN1cnJlbnRJbWFnZS5oZWlnaHQgLSBwb2ludC55XTtcblx0XHR9O1xuXG5cdFx0Ly8gYXNzZW1ibGVzIHRoZSBjb29yZGluYXRlIGFycmF5cyBkZXBlbmRpbmcgb24gdGhlIGdlb21ldHJ5IHR5cGVcblx0XHQvLyBzbyB0aGV5IGhhdmUgYSB1bmlmaWVkIGZvcm1hdFxuXHRcdHZhciBnZXRDb29yZGluYXRlcyA9IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xuXHRcdFx0c3dpdGNoIChnZW9tZXRyeS5nZXRUeXBlKCkpIHtcblx0XHRcdFx0Y2FzZSAnQ2lyY2xlJzpcblx0XHRcdFx0XHQvLyByYWRpdXMgaXMgdGhlIHggdmFsdWUgb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY2lyY2xlXG5cdFx0XHRcdFx0cmV0dXJuIFtnZW9tZXRyeS5nZXRDZW50ZXIoKSwgW2dlb21ldHJ5LmdldFJhZGl1cygpLCAwXV07XG5cdFx0XHRcdGNhc2UgJ1BvbHlnb24nOlxuXHRcdFx0XHRjYXNlICdSZWN0YW5nbGUnOlxuXHRcdFx0XHRcdHJldHVybiBnZW9tZXRyeS5nZXRDb29yZGluYXRlcygpWzBdO1xuXHRcdFx0XHRjYXNlICdQb2ludCc6XG5cdFx0XHRcdFx0cmV0dXJuIFtnZW9tZXRyeS5nZXRDb29yZGluYXRlcygpXTtcblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRyZXR1cm4gZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gc2F2ZXMgdGhlIHVwZGF0ZWQgZ2VvbWV0cnkgb2YgYW4gYW5ub3RhdGlvbiBmZWF0dXJlXG5cdFx0dmFyIGhhbmRsZUdlb21ldHJ5Q2hhbmdlID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciBmZWF0dXJlID0gZS50YXJnZXQ7XG5cdFx0XHR2YXIgc2F2ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0dmFyIGNvb3JkaW5hdGVzID0gZ2V0Q29vcmRpbmF0ZXMoZmVhdHVyZS5nZXRHZW9tZXRyeSgpKTtcblx0XHRcdFx0ZmVhdHVyZS5hbm5vdGF0aW9uLnBvaW50cyA9IGNvb3JkaW5hdGVzLm1hcChjb252ZXJ0RnJvbU9MUG9pbnQpO1xuXHRcdFx0XHRmZWF0dXJlLmFubm90YXRpb24uJHNhdmUoKTtcblx0XHRcdH07XG5cdFx0XHQvLyB0aGlzIGV2ZW50IGlzIHJhcGlkbHkgZmlyZWQsIHNvIHdhaXQgdW50aWwgdGhlIGZpcmluZyBzdG9wc1xuXHRcdFx0Ly8gYmVmb3JlIHNhdmluZyB0aGUgY2hhbmdlc1xuXHRcdFx0ZGVib3VuY2Uoc2F2ZSwgNTAwLCBmZWF0dXJlLmFubm90YXRpb24uaWQpO1xuXHRcdH07XG5cblx0XHR2YXIgY3JlYXRlRmVhdHVyZSA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHR2YXIgZ2VvbWV0cnk7XG5cdFx0XHR2YXIgcG9pbnRzID0gYW5ub3RhdGlvbi5wb2ludHMubWFwKGNvbnZlcnRUb09MUG9pbnQpO1xuXG5cdFx0XHRzd2l0Y2ggKGFubm90YXRpb24uc2hhcGUpIHtcblx0XHRcdFx0Y2FzZSAnUG9pbnQnOlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uUG9pbnQocG9pbnRzWzBdKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnUmVjdGFuZ2xlJzpcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlJlY3RhbmdsZShbIHBvaW50cyBdKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnUG9seWdvbic6XG5cdFx0XHRcdFx0Ly8gZXhhbXBsZTogaHR0cHM6Ly9naXRodWIuY29tL29wZW5sYXllcnMvb2wzL2Jsb2IvbWFzdGVyL2V4YW1wbGVzL2dlb2pzb24uanMjTDEyNlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uUG9seWdvbihbIHBvaW50cyBdKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnTGluZVN0cmluZyc6XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5MaW5lU3RyaW5nKHBvaW50cyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0NpcmNsZSc6XG5cdFx0XHRcdFx0Ly8gcmFkaXVzIGlzIHRoZSB4IHZhbHVlIG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGNpcmNsZVxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uQ2lyY2xlKHBvaW50c1swXSwgcG9pbnRzWzFdWzBdKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXHRcdFx0dmFyIGZlYXR1cmUgPSBuZXcgb2wuRmVhdHVyZSh7IGdlb21ldHJ5OiBnZW9tZXRyeSB9KTtcblx0XHRcdGZlYXR1cmUub24oJ2NoYW5nZScsIGhhbmRsZUdlb21ldHJ5Q2hhbmdlKTtcblx0XHRcdGZlYXR1cmUuYW5ub3RhdGlvbiA9IGFubm90YXRpb247XG5cdFx0XHRmZWF0dXJlcy5wdXNoKGZlYXR1cmUpO1xuXHRcdH07XG5cblx0XHR2YXIgcmVmcmVzaEFubm90YXRpb25zID0gZnVuY3Rpb24gKGUsIGltYWdlKSB7XG5cdFx0XHQvLyBjbGVhciBmZWF0dXJlcyBvZiBwcmV2aW91cyBpbWFnZVxuXHRcdFx0ZmVhdHVyZXMuY2xlYXIoKTtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuY2xlYXIoKTtcblxuXHRcdFx0YW5ub3RhdGlvbnMucXVlcnkoe2lkOiBpbWFnZS5faWR9KS4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0YW5ub3RhdGlvbnMuZm9yRWFjaChjcmVhdGVGZWF0dXJlKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHR2YXIgaGFuZGxlTmV3RmVhdHVyZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgZ2VvbWV0cnkgPSBlLmZlYXR1cmUuZ2V0R2VvbWV0cnkoKTtcblx0XHRcdHZhciBjb29yZGluYXRlcyA9IGdldENvb3JkaW5hdGVzKGdlb21ldHJ5KTtcblxuXHRcdFx0ZS5mZWF0dXJlLmFubm90YXRpb24gPSBhbm5vdGF0aW9ucy5hZGQoe1xuXHRcdFx0XHRpZDogaW1hZ2VzLmdldEN1cnJlbnRJZCgpLFxuXHRcdFx0XHRzaGFwZTogZ2VvbWV0cnkuZ2V0VHlwZSgpLFxuXHRcdFx0XHRwb2ludHM6IGNvb3JkaW5hdGVzLm1hcChjb252ZXJ0RnJvbU9MUG9pbnQpXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gaWYgdGhlIGZlYXR1cmUgY291bGRuJ3QgYmUgc2F2ZWQsIHJlbW92ZSBpdCBhZ2FpblxuXHRcdFx0ZS5mZWF0dXJlLmFubm90YXRpb24uJHByb21pc2UuY2F0Y2goZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRmZWF0dXJlcy5yZW1vdmUoZS5mZWF0dXJlKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRlLmZlYXR1cmUub24oJ2NoYW5nZScsIGhhbmRsZUdlb21ldHJ5Q2hhbmdlKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKHNjb3BlKSB7XG5cdFx0XHRmZWF0dXJlT3ZlcmxheS5zZXRNYXAobWFwKTtcblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihzZWxlY3QpO1xuXHRcdFx0c2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIHJlZnJlc2hBbm5vdGF0aW9ucyk7XG5cblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMub24oJ2NoYW5nZTpsZW5ndGgnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdC8vIGlmIG5vdCBhbHJlYWR5IGRpZ2VzdGluZywgZGlnZXN0XG5cdFx0XHRcdGlmICghc2NvcGUuJCRwaGFzZSkge1xuXHRcdFx0XHRcdC8vIHByb3BhZ2F0ZSBuZXcgc2VsZWN0aW9ucyB0aHJvdWdoIHRoZSBhbmd1bGFyIGFwcGxpY2F0aW9uXG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLnN0YXJ0RHJhd2luZyA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICAgICAgICBzZWxlY3Quc2V0QWN0aXZlKGZhbHNlKTtcblxuXHRcdFx0dHlwZSA9IHR5cGUgfHwgJ1BvaW50Jztcblx0XHRcdGRyYXcgPSBuZXcgb2wuaW50ZXJhY3Rpb24uRHJhdyh7XG5cdFx0XHRcdGZlYXR1cmVzOiBmZWF0dXJlcyxcblx0XHRcdFx0dHlwZTogdHlwZSxcblx0XHRcdFx0c3R5bGU6IHN0eWxlcy5lZGl0aW5nXG5cdFx0XHR9KTtcblxuXHRcdFx0bWFwLmFkZEludGVyYWN0aW9uKG1vZGlmeSk7XG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24oZHJhdyk7XG5cdFx0XHRkcmF3Lm9uKCdkcmF3ZW5kJywgaGFuZGxlTmV3RmVhdHVyZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZmluaXNoRHJhd2luZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdG1hcC5yZW1vdmVJbnRlcmFjdGlvbihkcmF3KTtcblx0XHRcdG1hcC5yZW1vdmVJbnRlcmFjdGlvbihtb2RpZnkpO1xuICAgICAgICAgICAgc2VsZWN0LnNldEFjdGl2ZSh0cnVlKTtcblx0XHRcdC8vIG5vbid0IHNlbGVjdCB0aGUgbGFzdCBkcmF3biBwb2ludFxuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5jbGVhcigpO1xuXHRcdH07XG5cblx0XHR0aGlzLmRlbGV0ZVNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5mb3JFYWNoKGZ1bmN0aW9uIChmZWF0dXJlKSB7XG5cdFx0XHRcdGFubm90YXRpb25zLmRlbGV0ZShmZWF0dXJlLmFubm90YXRpb24pLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGZlYXR1cmVzLnJlbW92ZShmZWF0dXJlKTtcblx0XHRcdFx0XHRzZWxlY3RlZEZlYXR1cmVzLnJlbW92ZShmZWF0dXJlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5zZWxlY3QgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBmZWF0dXJlO1xuXHRcdFx0ZmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoZikge1xuXHRcdFx0XHRpZiAoZi5hbm5vdGF0aW9uLmlkID09PSBpZCkge1xuXHRcdFx0XHRcdGZlYXR1cmUgPSBmO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIHJlbW92ZSBzZWxlY3Rpb24gaWYgZmVhdHVyZSB3YXMgYWxyZWFkeSBzZWxlY3RlZC4gb3RoZXJ3aXNlIHNlbGVjdC5cblx0XHRcdGlmICghc2VsZWN0ZWRGZWF0dXJlcy5yZW1vdmUoZmVhdHVyZSkpIHtcblx0XHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5wdXNoKGZlYXR1cmUpO1xuXHRcdFx0fVxuXHRcdH07XG5cbiAgICAgICAgLy8gZml0cyB0aGUgdmlldyB0byB0aGUgZ2l2ZW4gZmVhdHVyZVxuICAgICAgICB0aGlzLmZpdCA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgZmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoZikge1xuICAgICAgICAgICAgICAgIGlmIChmLmFubm90YXRpb24uaWQgPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcC5nZXRWaWV3KCkuZml0R2VvbWV0cnkoZi5nZXRHZW9tZXRyeSgpLCBtYXAuZ2V0U2l6ZSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuXHRcdHRoaXMuY2xlYXJTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmNsZWFyKCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0U2VsZWN0ZWRGZWF0dXJlcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBzZWxlY3RlZEZlYXR1cmVzO1xuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG1hcEltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBoYW5kbGluZyB0aGUgaW1hZ2UgbGF5ZXIgb24gdGhlIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnbWFwSW1hZ2UnLCBmdW5jdGlvbiAobWFwKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cdFx0dmFyIGV4dGVudCA9IFswLCAwLCAwLCAwXTtcblxuXHRcdHZhciBwcm9qZWN0aW9uID0gbmV3IG9sLnByb2ouUHJvamVjdGlvbih7XG5cdFx0XHRjb2RlOiAnZGlhcy1pbWFnZScsXG5cdFx0XHR1bml0czogJ3BpeGVscycsXG5cdFx0XHRleHRlbnQ6IGV4dGVudFxuXHRcdH0pO1xuXG5cdFx0dmFyIGltYWdlTGF5ZXIgPSBuZXcgb2wubGF5ZXIuSW1hZ2UoKTtcblxuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uIChzY29wZSkge1xuXHRcdFx0bWFwLmFkZExheWVyKGltYWdlTGF5ZXIpO1xuXG5cdFx0XHQvLyByZWZyZXNoIHRoZSBpbWFnZSBzb3VyY2Vcblx0XHRcdHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCBmdW5jdGlvbiAoZSwgaW1hZ2UpIHtcblx0XHRcdFx0ZXh0ZW50WzJdID0gaW1hZ2Uud2lkdGg7XG5cdFx0XHRcdGV4dGVudFszXSA9IGltYWdlLmhlaWdodDtcblxuXHRcdFx0XHR2YXIgem9vbSA9IHNjb3BlLnZpZXdwb3J0Lnpvb207XG5cblx0XHRcdFx0dmFyIGNlbnRlciA9IHNjb3BlLnZpZXdwb3J0LmNlbnRlcjtcblx0XHRcdFx0Ly8gdmlld3BvcnQgY2VudGVyIGlzIHN0aWxsIHVuaW5pdGlhbGl6ZWRcblx0XHRcdFx0aWYgKGNlbnRlclswXSA9PT0gdW5kZWZpbmVkICYmIGNlbnRlclsxXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0Y2VudGVyID0gb2wuZXh0ZW50LmdldENlbnRlcihleHRlbnQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGltYWdlU3RhdGljID0gbmV3IG9sLnNvdXJjZS5JbWFnZVN0YXRpYyh7XG5cdFx0XHRcdFx0dXJsOiBpbWFnZS5zcmMsXG5cdFx0XHRcdFx0cHJvamVjdGlvbjogcHJvamVjdGlvbixcblx0XHRcdFx0XHRpbWFnZUV4dGVudDogZXh0ZW50XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGltYWdlTGF5ZXIuc2V0U291cmNlKGltYWdlU3RhdGljKTtcblxuXHRcdFx0XHRtYXAuc2V0VmlldyhuZXcgb2wuVmlldyh7XG5cdFx0XHRcdFx0cHJvamVjdGlvbjogcHJvamVjdGlvbixcblx0XHRcdFx0XHRjZW50ZXI6IGNlbnRlcixcblx0XHRcdFx0XHR6b29tOiB6b29tLFxuXHRcdFx0XHRcdHpvb21GYWN0b3I6IDEuNSxcblx0XHRcdFx0XHQvLyBhbGxvdyBhIG1heGltdW0gb2YgNHggbWFnbmlmaWNhdGlvblxuXHRcdFx0XHRcdG1pblJlc29sdXRpb246IDAuMjUsXG5cdFx0XHRcdFx0Ly8gcmVzdHJpY3QgbW92ZW1lbnRcblx0XHRcdFx0XHRleHRlbnQ6IGV4dGVudFxuXHRcdFx0XHR9KSk7XG5cblx0XHRcdFx0Ly8gaWYgem9vbSBpcyBub3QgaW5pdGlhbGl6ZWQsIGZpdCB0aGUgdmlldyB0byB0aGUgaW1hZ2UgZXh0ZW50XG5cdFx0XHRcdGlmICh6b29tID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRtYXAuZ2V0VmlldygpLmZpdEV4dGVudChleHRlbnQsIG1hcC5nZXRTaXplKCkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRFeHRlbnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gZXh0ZW50O1xuXHRcdH07XG5cblx0XHR0aGlzLmdldFByb2plY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gcHJvamVjdGlvbjtcblx0XHR9O1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgc3R5bGVzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgdGhlIE9wZW5MYXllcnMgc3R5bGVzXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnc3R5bGVzJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHdoaXRlID0gWzI1NSwgMjU1LCAyNTUsIDFdO1xuXHRcdHZhciBibHVlID0gWzAsIDE1MywgMjU1LCAxXTtcblx0XHR2YXIgb3JhbmdlID0gJyNmZjVlMDAnO1xuXHRcdHZhciB3aWR0aCA9IDM7XG5cblx0XHR0aGlzLmZlYXR1cmVzID0gW1xuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRjb2xvcjogd2hpdGUsXG5cdFx0XHRcdFx0d2lkdGg6IDVcblx0XHRcdFx0fSksXG5cdFx0XHRcdGltYWdlOiBuZXcgb2wuc3R5bGUuQ2lyY2xlKHtcblx0XHRcdFx0XHRyYWRpdXM6IDYsXG5cdFx0XHRcdFx0ZmlsbDogbmV3IG9sLnN0eWxlLkZpbGwoe1xuXHRcdFx0XHRcdFx0Y29sb3I6IGJsdWVcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdFx0Y29sb3I6IHdoaXRlLFxuXHRcdFx0XHRcdFx0d2lkdGg6IDJcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiBibHVlLFxuXHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdF07XG5cblx0XHR0aGlzLmhpZ2hsaWdodCA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IHdoaXRlLFxuXHRcdFx0XHRcdHdpZHRoOiA2XG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG5cdFx0XHRcdFx0cmFkaXVzOiA2LFxuXHRcdFx0XHRcdGZpbGw6IG5ldyBvbC5zdHlsZS5GaWxsKHtcblx0XHRcdFx0XHRcdGNvbG9yOiBvcmFuZ2Vcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdFx0Y29sb3I6IHdoaXRlLFxuXHRcdFx0XHRcdFx0d2lkdGg6IDNcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiBvcmFuZ2UsXG5cdFx0XHRcdFx0d2lkdGg6IDNcblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0XTtcblxuXHRcdHRoaXMuZWRpdGluZyA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IHdoaXRlLFxuXHRcdFx0XHRcdHdpZHRoOiA1XG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG5cdFx0XHRcdFx0cmFkaXVzOiA2LFxuXHRcdFx0XHRcdGZpbGw6IG5ldyBvbC5zdHlsZS5GaWxsKHtcblx0XHRcdFx0XHRcdGNvbG9yOiBibHVlXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRcdGNvbG9yOiB3aGl0ZSxcblx0XHRcdFx0XHRcdHdpZHRoOiAyLFxuXHRcdFx0XHRcdFx0bGluZURhc2g6IFszXVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0pXG5cdFx0XHR9KSxcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IGJsdWUsXG5cdFx0XHRcdFx0d2lkdGg6IDMsXG5cdFx0XHRcdFx0bGluZURhc2g6IFs1XVxuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHRdO1xuXG5cdFx0dGhpcy52aWV3cG9ydCA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IGJsdWUsXG5cdFx0XHRcdFx0d2lkdGg6IDNcblx0XHRcdFx0fSksXG5cdFx0XHR9KSxcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IHdoaXRlLFxuXHRcdFx0XHRcdHdpZHRoOiAxXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdF07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSB1cmxQYXJhbXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gVGhlIEdFVCBwYXJhbWV0ZXJzIG9mIHRoZSB1cmwuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgndXJsUGFyYW1zJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHN0YXRlID0ge307XG5cblx0XHQvLyB0cmFuc2Zvcm1zIGEgVVJMIHBhcmFtZXRlciBzdHJpbmcgbGlrZSAjYT0xJmI9MiB0byBhbiBvYmplY3Rcblx0XHR2YXIgZGVjb2RlU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gbG9jYXRpb24uaGFzaC5yZXBsYWNlKCcjJywgJycpXG5cdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnJicpO1xuXG5cdFx0XHR2YXIgc3RhdGUgPSB7fTtcblxuXHRcdFx0cGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKHBhcmFtKSB7XG5cdFx0XHRcdC8vIGNhcHR1cmUga2V5LXZhbHVlIHBhaXJzXG5cdFx0XHRcdHZhciBjYXB0dXJlID0gcGFyYW0ubWF0Y2goLyguKylcXD0oLispLyk7XG5cdFx0XHRcdGlmIChjYXB0dXJlICYmIGNhcHR1cmUubGVuZ3RoID09PSAzKSB7XG5cdFx0XHRcdFx0c3RhdGVbY2FwdHVyZVsxXV0gPSBkZWNvZGVVUklDb21wb25lbnQoY2FwdHVyZVsyXSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gc3RhdGU7XG5cdFx0fTtcblxuXHRcdC8vIHRyYW5zZm9ybXMgYW4gb2JqZWN0IHRvIGEgVVJMIHBhcmFtZXRlciBzdHJpbmdcblx0XHR2YXIgZW5jb2RlU3RhdGUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcblx0XHRcdHZhciBwYXJhbXMgPSAnJztcblx0XHRcdGZvciAodmFyIGtleSBpbiBzdGF0ZSkge1xuXHRcdFx0XHRwYXJhbXMgKz0ga2V5ICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0YXRlW2tleV0pICsgJyYnO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHBhcmFtcy5zdWJzdHJpbmcoMCwgcGFyYW1zLmxlbmd0aCAtIDEpO1xuXHRcdH07XG5cblx0XHR0aGlzLnB1c2hTdGF0ZSA9IGZ1bmN0aW9uIChzKSB7XG5cdFx0XHRzdGF0ZS5zbHVnID0gcztcblx0XHRcdGhpc3RvcnkucHVzaFN0YXRlKHN0YXRlLCAnJywgc3RhdGUuc2x1ZyArICcjJyArIGVuY29kZVN0YXRlKHN0YXRlKSk7XG5cdFx0fTtcblxuXHRcdC8vIHNldHMgYSBVUkwgcGFyYW1ldGVyIGFuZCB1cGRhdGVzIHRoZSBoaXN0b3J5IHN0YXRlXG5cdFx0dGhpcy5zZXQgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gcGFyYW1zKSB7XG5cdFx0XHRcdHN0YXRlW2tleV0gPSBwYXJhbXNba2V5XTtcblx0XHRcdH1cblx0XHRcdGhpc3RvcnkucmVwbGFjZVN0YXRlKHN0YXRlLCAnJywgc3RhdGUuc2x1ZyArICcjJyArIGVuY29kZVN0YXRlKHN0YXRlKSk7XG5cdFx0fTtcblxuXHRcdC8vIHJldHVybnMgYSBVUkwgcGFyYW1ldGVyXG5cdFx0dGhpcy5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRyZXR1cm4gc3RhdGVba2V5XTtcblx0XHR9O1xuXG5cdFx0c3RhdGUgPSBoaXN0b3J5LnN0YXRlO1xuXG5cdFx0aWYgKCFzdGF0ZSkge1xuXHRcdFx0c3RhdGUgPSBkZWNvZGVTdGF0ZSgpO1xuXHRcdH1cblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEFubm90YXRpb25zQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgYW5ub3RhdGlvbnMgbGlzdCBpbiB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0Fubm90YXRpb25zQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEFubm90YXRpb25zLCBsYWJlbHMsIGFubm90YXRpb25zLCBzaGFwZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5zZWxlY3RlZEZlYXR1cmVzID0gbWFwQW5ub3RhdGlvbnMuZ2V0U2VsZWN0ZWRGZWF0dXJlcygpLmdldEFycmF5KCk7XG5cblx0XHQkc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignc2VsZWN0ZWRGZWF0dXJlcycsIGZ1bmN0aW9uIChmZWF0dXJlcykge1xuXHRcdFx0ZmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoZmVhdHVyZSkge1xuXHRcdFx0XHRsYWJlbHMuZmV0Y2hGb3JBbm5vdGF0aW9uKGZlYXR1cmUuYW5ub3RhdGlvbik7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHZhciByZWZyZXNoQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuYW5ub3RhdGlvbnMgPSBhbm5vdGF0aW9ucy5jdXJyZW50KCk7XG5cdFx0fTtcblxuXHRcdHZhciBzZWxlY3RlZEZlYXR1cmVzID0gbWFwQW5ub3RhdGlvbnMuZ2V0U2VsZWN0ZWRGZWF0dXJlcygpO1xuXG5cdFx0JHNjb3BlLmFubm90YXRpb25zID0gW107XG5cblx0XHQkc2NvcGUuY2xlYXJTZWxlY3Rpb24gPSBtYXBBbm5vdGF0aW9ucy5jbGVhclNlbGVjdGlvbjtcblxuXHRcdCRzY29wZS5zZWxlY3RBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGUsIGlkKSB7XG5cdFx0XHQvLyBhbGxvdyBtdWx0aXBsZSBzZWxlY3Rpb25zXG5cdFx0XHRpZiAoIWUuc2hpZnRLZXkpIHtcblx0XHRcdFx0JHNjb3BlLmNsZWFyU2VsZWN0aW9uKCk7XG5cdFx0XHR9XG5cdFx0XHRtYXBBbm5vdGF0aW9ucy5zZWxlY3QoaWQpO1xuXHRcdH07XG5cbiAgICAgICAgJHNjb3BlLmZpdEFubm90YXRpb24gPSBtYXBBbm5vdGF0aW9ucy5maXQ7XG5cblx0XHQkc2NvcGUuaXNTZWxlY3RlZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIHNlbGVjdGVkID0gZmFsc2U7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmZvckVhY2goZnVuY3Rpb24gKGZlYXR1cmUpIHtcblx0XHRcdFx0aWYgKGZlYXR1cmUuYW5ub3RhdGlvbiAmJiBmZWF0dXJlLmFubm90YXRpb24uaWQgPT0gaWQpIHtcblx0XHRcdFx0XHRzZWxlY3RlZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIHNlbGVjdGVkO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIHJlZnJlc2hBbm5vdGF0aW9ucyk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEFubm90YXRvckNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFpbiBjb250cm9sbGVyIG9mIHRoZSBBbm5vdGF0b3IgYXBwbGljYXRpb24uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQW5ub3RhdG9yQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRhdHRycywgaW1hZ2VzLCB1cmxQYXJhbXMsIG1zZywgbGFiZWxzKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5pbWFnZXMgPSBpbWFnZXM7XG4gICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAkc2NvcGUuZWRpdE1vZGUgPSAhISRhdHRycy5lZGl0TW9kZTtcbiAgICAgICAgLy8gZG9uJ3QgcGFyc2UgYW4gZW1wdHkgc3RyaW5nXG4gICAgICAgICRzY29wZS5wcm9qZWN0SWRzID0gJGF0dHJzLnByb2plY3RJZHMgPyAkYXR0cnMucHJvamVjdElkcy5zcGxpdCgnLCcpIDogW107XG5cbiAgICAgICAgbGFiZWxzLnNldFByb2plY3RJZHMoJHNjb3BlLnByb2plY3RJZHMpO1xuXG4gICAgICAgIC8vIHRoZSBjdXJyZW50IGNhbnZhcyB2aWV3cG9ydCwgc3luY2VkIHdpdGggdGhlIFVSTCBwYXJhbWV0ZXJzXG4gICAgICAgICRzY29wZS52aWV3cG9ydCA9IHtcbiAgICAgICAgICAgIHpvb206IHVybFBhcmFtcy5nZXQoJ3onKSxcbiAgICAgICAgICAgIGNlbnRlcjogW3VybFBhcmFtcy5nZXQoJ3gnKSwgdXJsUGFyYW1zLmdldCgneScpXVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGZpbmlzaCBpbWFnZSBsb2FkaW5nIHByb2Nlc3NcbiAgICAgICAgdmFyIGZpbmlzaExvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnaW1hZ2Uuc2hvd24nLCAkc2NvcGUuaW1hZ2VzLmN1cnJlbnRJbWFnZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgdmFyIHB1c2hTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHVybFBhcmFtcy5wdXNoU3RhdGUoJHNjb3BlLmltYWdlcy5jdXJyZW50SW1hZ2UuX2lkKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzdGFydCBpbWFnZSBsb2FkaW5nIHByb2Nlc3NcbiAgICAgICAgdmFyIHN0YXJ0TG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGxvYWQgdGhlIGltYWdlIGJ5IGlkLiBkb2Vzbid0IGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5IGJ5IGl0c2VsZlxuICAgICAgICB2YXIgbG9hZEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBzdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZXMuc2hvdyhwYXJzZUludChpZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVLZXlFdmVudHMgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgc3dpdGNoIChlLmtleUNvZGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDM3OlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucHJldkltYWdlKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzk6XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgna2V5cHJlc3MnLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2hvdyB0aGUgbmV4dCBpbWFnZSBhbmQgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgJHNjb3BlLm5leHRJbWFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgaW1hZ2VzLm5leHQoKVxuICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgIC50aGVuKHB1c2hTdGF0ZSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2hvdyB0aGUgcHJldmlvdXMgaW1hZ2UgYW5kIGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5XG4gICAgICAgICRzY29wZS5wcmV2SW1hZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIGltYWdlcy5wcmV2KClcbiAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAudGhlbihwdXNoU3RhdGUpXG4gICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgVVJMIHBhcmFtZXRlcnMgb2YgdGhlIHZpZXdwb3J0XG4gICAgICAgICRzY29wZS4kb24oJ2NhbnZhcy5tb3ZlZW5kJywgZnVuY3Rpb24oZSwgcGFyYW1zKSB7XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuem9vbSA9IHBhcmFtcy56b29tO1xuICAgICAgICAgICAgJHNjb3BlLnZpZXdwb3J0LmNlbnRlclswXSA9IE1hdGgucm91bmQocGFyYW1zLmNlbnRlclswXSk7XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuY2VudGVyWzFdID0gTWF0aC5yb3VuZChwYXJhbXMuY2VudGVyWzFdKTtcbiAgICAgICAgICAgIHVybFBhcmFtcy5zZXQoe1xuICAgICAgICAgICAgICAgIHo6ICRzY29wZS52aWV3cG9ydC56b29tLFxuICAgICAgICAgICAgICAgIHg6ICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMF0sXG4gICAgICAgICAgICAgICAgeTogJHNjb3BlLnZpZXdwb3J0LmNlbnRlclsxXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGxpc3RlbiB0byB0aGUgYnJvd3NlciBcImJhY2tcIiBidXR0b25cbiAgICAgICAgd2luZG93Lm9ucG9wc3RhdGUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSBlLnN0YXRlO1xuICAgICAgICAgICAgaWYgKHN0YXRlICYmIHN0YXRlLnNsdWcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGxvYWRJbWFnZShzdGF0ZS5zbHVnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIGhhbmRsZUtleUV2ZW50cyk7XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSB0aGUgaW1hZ2VzIHNlcnZpY2VcbiAgICAgICAgaW1hZ2VzLmluaXQoJGF0dHJzLnRyYW5zZWN0SWQpO1xuICAgICAgICAvLyBkaXNwbGF5IHRoZSBmaXJzdCBpbWFnZVxuICAgICAgICBsb2FkSW1hZ2UoJGF0dHJzLmltYWdlSWQpLnRoZW4ocHVzaFN0YXRlKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDYW52YXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1haW4gY29udHJvbGxlciBmb3IgdGhlIGFubm90YXRpb24gY2FudmFzIGVsZW1lbnRcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDYW52YXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwSW1hZ2UsIG1hcEFubm90YXRpb25zLCBtYXAsICR0aW1lb3V0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQvLyB1cGRhdGUgdGhlIFVSTCBwYXJhbWV0ZXJzXG5cdFx0bWFwLm9uKCdtb3ZlZW5kJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIHZpZXcgPSBtYXAuZ2V0VmlldygpO1xuXHRcdFx0JHNjb3BlLiRlbWl0KCdjYW52YXMubW92ZWVuZCcsIHtcblx0XHRcdFx0Y2VudGVyOiB2aWV3LmdldENlbnRlcigpLFxuXHRcdFx0XHR6b29tOiB2aWV3LmdldFpvb20oKVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRtYXBJbWFnZS5pbml0KCRzY29wZSk7XG5cdFx0bWFwQW5ub3RhdGlvbnMuaW5pdCgkc2NvcGUpO1xuXG5cdFx0dmFyIHVwZGF0ZVNpemUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQvLyB3b3JrYXJvdW5kLCBzbyB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkICphZnRlciogdGhlIGFuZ3VsYXIgZGlnZXN0XG5cdFx0XHQvLyBhbmQgKmFmdGVyKiB0aGUgZm9sZG91dCB3YXMgcmVuZGVyZWRcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRtYXAudXBkYXRlU2l6ZSgpO1xuXHRcdFx0fSwgMCwgZmFsc2UpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJG9uKCdzaWRlYmFyLmZvbGRvdXQub3BlbicsIHVwZGF0ZVNpemUpO1xuXHRcdCRzY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5jbG9zZScsIHVwZGF0ZVNpemUpO1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQ2F0ZWdvcmllc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgbGFiZWwgY2F0ZWdvcmllcyBmb2xkb3V0XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQ2F0ZWdvcmllc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBsYWJlbHMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gbWF4aW11bSBudW1iZXIgb2YgYWxsb3dlZCBmYXZvdXJpdGVzXG4gICAgICAgIHZhciBtYXhGYXZvdXJpdGVzID0gOTtcbiAgICAgICAgdmFyIGZhdm91cml0ZXNTdG9yYWdlS2V5ID0gJ2RpYXMuYW5ub3RhdGlvbnMtbGFiZWwtZmF2b3VyaXRlcyc7XG5cbiAgICAgICAgLy8gc2F2ZXMgdGhlIElEcyBvZiB0aGUgZmF2b3VyaXRlcyBpbiBsb2NhbFN0b3JhZ2VcbiAgICAgICAgdmFyIHN0b3JlRmF2b3VyaXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0bXAgPSAkc2NvcGUuZmF2b3VyaXRlcy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5pZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVtmYXZvdXJpdGVzU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeSh0bXApO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJlc3RvcmVzIHRoZSBmYXZvdXJpdGVzIGZyb20gdGhlIElEcyBpbiBsb2NhbFN0b3JhZ2VcbiAgICAgICAgdmFyIGxvYWRGYXZvdXJpdGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRtcCA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtmYXZvdXJpdGVzU3RvcmFnZUtleV0pO1xuICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMgPSAkc2NvcGUuY2F0ZWdvcmllcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG1wLmluZGV4T2YoaXRlbS5pZCkgIT09IC0xO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXMgPSBbXTtcbiAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMgPSBbXTtcbiAgICAgICAgbGFiZWxzLnByb21pc2UudGhlbihmdW5jdGlvbiAoYWxsKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gYWxsKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXMgPSAkc2NvcGUuY2F0ZWdvcmllcy5jb25jYXQoYWxsW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbG9hZEZhdm91cml0ZXMoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXNUcmVlID0gbGFiZWxzLmdldFRyZWUoKTtcblxuICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICBsYWJlbHMuc2V0U2VsZWN0ZWQoaXRlbSk7XG4gICAgICAgICAgICAkc2NvcGUuc2VhcmNoQ2F0ZWdvcnkgPSAnJzsgLy8gY2xlYXIgc2VhcmNoIGZpZWxkXG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGl0ZW0pO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0Zhdm91cml0ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmZhdm91cml0ZXMuaW5kZXhPZihpdGVtKSAhPT0gLTE7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gYWRkcyBhIG5ldyBpdGVtIHRvIHRoZSBmYXZvdXJpdGVzIG9yIHJlbW92ZXMgaXQgaWYgaXQgaXMgYWxyZWFkeSBhIGZhdm91cml0ZVxuICAgICAgICAkc2NvcGUudG9nZ2xlRmF2b3VyaXRlID0gZnVuY3Rpb24gKGUsIGl0ZW0pIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSAkc2NvcGUuZmF2b3VyaXRlcy5pbmRleE9mKGl0ZW0pO1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSAmJiAkc2NvcGUuZmF2b3VyaXRlcy5sZW5ndGggPCBtYXhGYXZvdXJpdGVzKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMucHVzaChpdGVtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0b3JlRmF2b3VyaXRlcygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJldHVybnMgd2hldGhlciB0aGUgdXNlciBpcyBzdGlsbCBhbGxvd2VkIHRvIGFkZCBmYXZvdXJpdGVzXG4gICAgICAgICRzY29wZS5mYXZvdXJpdGVzTGVmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuZmF2b3VyaXRlcy5sZW5ndGggPCBtYXhGYXZvdXJpdGVzO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHNlbGVjdCBmYXZvdXJpdGVzIG9uIG51bWJlcnMgMS05XG4gICAgICAgICRzY29wZS4kb24oJ2tleXByZXNzJywgZnVuY3Rpb24gKGUsIGtleUV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgY2hhckNvZGUgPSAoa2V5RXZlbnQud2hpY2gpID8ga2V5RXZlbnQud2hpY2ggOiBrZXlFdmVudC5rZXlDb2RlO1xuICAgICAgICAgICAgdmFyIG51bWJlciA9IHBhcnNlSW50KFN0cmluZy5mcm9tQ2hhckNvZGUoY2hhckNvZGUpKTtcbiAgICAgICAgICAgIGlmICghaXNOYU4obnVtYmVyKSAmJiBudW1iZXIgPiAwICYmIG51bWJlciA8PSAkc2NvcGUuZmF2b3VyaXRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbSgkc2NvcGUuZmF2b3VyaXRlc1tudW1iZXIgLSAxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENvbmZpZGVuY2VDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBjb25maWRlbmNlIGNvbnRyb2xcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDb25maWRlbmNlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGxhYmVscykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLmNvbmZpZGVuY2UgPSAxLjA7XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdjb25maWRlbmNlJywgZnVuY3Rpb24gKGNvbmZpZGVuY2UpIHtcblx0XHRcdGxhYmVscy5zZXRDdXJyZW50Q29uZmlkZW5jZShwYXJzZUZsb2F0KGNvbmZpZGVuY2UpKTtcblxuXHRcdFx0aWYgKGNvbmZpZGVuY2UgPD0gMC4yNSkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLWRhbmdlcic7XG5cdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC41ICkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXdhcm5pbmcnO1xuXHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNzUgKSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtc3VjY2Vzcyc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXByaW1hcnknO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDb250cm9sc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgY29udHJvbCBidXR0b25zXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQ29udHJvbHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMsIGxhYmVscywgbXNnLCAkYXR0cnMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBkcmF3aW5nID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuc2VsZWN0U2hhcGUgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0aWYgKCFsYWJlbHMuaGFzU2VsZWN0ZWQoKSkge1xuICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnc2lkZWJhci5mb2xkb3V0LmRvLW9wZW4nLCAnY2F0ZWdvcmllcycpO1xuXHRcdFx0XHRtc2cuaW5mbygkYXR0cnMuc2VsZWN0Q2F0ZWdvcnkpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdG1hcEFubm90YXRpb25zLmZpbmlzaERyYXdpbmcoKTtcblxuXHRcdFx0aWYgKG5hbWUgPT09IG51bGwgfHwgKGRyYXdpbmcgJiYgJHNjb3BlLnNlbGVjdGVkU2hhcGUgPT09IG5hbWUpKSB7XG5cdFx0XHRcdCRzY29wZS5zZWxlY3RlZFNoYXBlID0gJyc7XG5cdFx0XHRcdGRyYXdpbmcgPSBmYWxzZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5zZWxlY3RlZFNoYXBlID0gbmFtZTtcblx0XHRcdFx0bWFwQW5ub3RhdGlvbnMuc3RhcnREcmF3aW5nKG5hbWUpO1xuXHRcdFx0XHRkcmF3aW5nID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgICRzY29wZS4kb24oJ2tleXByZXNzJywgZnVuY3Rpb24gKGUsIGtleUV2ZW50KSB7XG4gICAgICAgICAgICAvLyBkZXNlbGVjdCBkcmF3aW5nIHRvb2wgb24gZXNjYXBlXG4gICAgICAgICAgICBpZiAoa2V5RXZlbnQua2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUobnVsbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGNoYXJDb2RlID0gKGtleUV2ZW50LndoaWNoKSA/IGtleUV2ZW50LndoaWNoIDoga2V5RXZlbnQua2V5Q29kZTtcbiAgICAgICAgICAgIHN3aXRjaCAoU3RyaW5nLmZyb21DaGFyQ29kZShjaGFyQ29kZSkpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdhJzpcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdQb2ludCcpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdSZWN0YW5nbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnQ2lyY2xlJyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2YnOlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ0xpbmVTdHJpbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZyc6XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnUG9seWdvbicpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIE1pbmltYXBDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBtaW5pbWFwIGluIHRoZSBzaWRlYmFyXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignTWluaW1hcENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXAsIG1hcEltYWdlLCAkZWxlbWVudCwgc3R5bGVzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgbWluaW1hcCA9IG5ldyBvbC5NYXAoe1xuXHRcdFx0dGFyZ2V0OiAnbWluaW1hcCcsXG5cdFx0XHQvLyByZW1vdmUgY29udHJvbHNcblx0XHRcdGNvbnRyb2xzOiBbXSxcblx0XHRcdC8vIGRpc2FibGUgaW50ZXJhY3Rpb25zXG5cdFx0XHRpbnRlcmFjdGlvbnM6IFtdXG5cdFx0fSk7XG5cblx0XHQvLyBnZXQgdGhlIHNhbWUgbGF5ZXJzIHRoYW4gdGhlIG1hcFxuXHRcdG1pbmltYXAuc2V0TGF5ZXJHcm91cChtYXAuZ2V0TGF5ZXJHcm91cCgpKTtcblxuXHRcdHZhciBmZWF0dXJlT3ZlcmxheSA9IG5ldyBvbC5GZWF0dXJlT3ZlcmxheSh7XG5cdFx0XHRtYXA6IG1pbmltYXAsXG5cdFx0XHRzdHlsZTogc3R5bGVzLnZpZXdwb3J0XG5cdFx0fSk7XG5cblx0XHR2YXIgdmlld3BvcnQgPSBuZXcgb2wuRmVhdHVyZSgpO1xuXHRcdGZlYXR1cmVPdmVybGF5LmFkZEZlYXR1cmUodmlld3BvcnQpO1xuXG5cdFx0Ly8gcmVmcmVzaCB0aGUgdmlldyAodGhlIGltYWdlIHNpemUgY291bGQgaGF2ZSBiZWVuIGNoYW5nZWQpXG5cdFx0JHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtaW5pbWFwLnNldFZpZXcobmV3IG9sLlZpZXcoe1xuXHRcdFx0XHRwcm9qZWN0aW9uOiBtYXBJbWFnZS5nZXRQcm9qZWN0aW9uKCksXG5cdFx0XHRcdGNlbnRlcjogb2wuZXh0ZW50LmdldENlbnRlcihtYXBJbWFnZS5nZXRFeHRlbnQoKSksXG5cdFx0XHRcdHpvb206IDBcblx0XHRcdH0pKTtcblx0XHR9KTtcblxuXHRcdC8vIG1vdmUgdGhlIHZpZXdwb3J0IHJlY3RhbmdsZSBvbiB0aGUgbWluaW1hcFxuXHRcdHZhciByZWZyZXNoVmlld3BvcnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgZXh0ZW50ID0gbWFwLmdldFZpZXcoKS5jYWxjdWxhdGVFeHRlbnQobWFwLmdldFNpemUoKSk7XG5cdFx0XHR2aWV3cG9ydC5zZXRHZW9tZXRyeShvbC5nZW9tLlBvbHlnb24uZnJvbUV4dGVudChleHRlbnQpKTtcblx0XHR9O1xuXG5cdFx0bWFwLm9uKCdtb3ZlZW5kJywgcmVmcmVzaFZpZXdwb3J0KTtcblxuXHRcdHZhciBkcmFnVmlld3BvcnQgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0bWFwLmdldFZpZXcoKS5zZXRDZW50ZXIoZS5jb29yZGluYXRlKTtcblx0XHR9O1xuXG5cdFx0bWluaW1hcC5vbigncG9pbnRlcmRyYWcnLCBkcmFnVmlld3BvcnQpO1xuXG5cdFx0JGVsZW1lbnQub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtaW5pbWFwLnVuKCdwb2ludGVyZHJhZycsIGRyYWdWaWV3cG9ydCk7XG5cdFx0fSk7XG5cblx0XHQkZWxlbWVudC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcdG1pbmltYXAub24oJ3BvaW50ZXJkcmFnJywgZHJhZ1ZpZXdwb3J0KTtcblx0XHR9KTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNlbGVjdGVkTGFiZWxDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzZWxlY3RlZCBsYWJlbCBkaXNwbGF5IGluIHRoZSBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTZWxlY3RlZExhYmVsQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGxhYmVscykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5nZXRTZWxlY3RlZExhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTaWRlYmFyQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NpZGViYXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgbWFwQW5ub3RhdGlvbnMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgZm9sZG91dFN0b3JhZ2VLZXkgPSAnZGlhcy5hbm5vdGF0aW9ucy5zaWRlYmFyLWZvbGRvdXQnO1xuXG5cdFx0Ly8gdGhlIGN1cnJlbnRseSBvcGVuZWQgc2lkZWJhci0nZXh0ZW5zaW9uJyBpcyByZW1lbWJlcmVkIHRocm91Z2ggbG9jYWxTdG9yYWdlXG5cdFx0JHNjb3BlLmZvbGRvdXQgPSB3aW5kb3cubG9jYWxTdG9yYWdlW2ZvbGRvdXRTdG9yYWdlS2V5XSB8fCAnJztcbiAgICAgICAgaWYgKCRzY29wZS5mb2xkb3V0KSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NpZGViYXIuZm9sZG91dC5vcGVuJyk7XG4gICAgICAgIH1cblxuXHRcdCRzY29wZS5vcGVuRm9sZG91dCA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0XHQkc2NvcGUuZm9sZG91dCA9IHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldID0gbmFtZTtcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2lkZWJhci5mb2xkb3V0Lm9wZW4nKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNsb3NlRm9sZG91dCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5mb2xkb3V0ID0gd2luZG93LmxvY2FsU3RvcmFnZVtmb2xkb3V0U3RvcmFnZUtleV0gPSAnJztcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2lkZWJhci5mb2xkb3V0LmNsb3NlJyk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVGb2xkb3V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRcdGlmICgkc2NvcGUuZm9sZG91dCA9PT0gbmFtZSkge1xuXHRcdFx0XHQkc2NvcGUuY2xvc2VGb2xkb3V0KCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUub3BlbkZvbGRvdXQobmFtZSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5kZWxldGVTZWxlY3RlZEFubm90YXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKG1hcEFubm90YXRpb25zLmdldFNlbGVjdGVkRmVhdHVyZXMoKS5nZXRMZW5ndGgoKSA+IDAgJiYgY29uZmlybSgnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSBhbGwgc2VsZWN0ZWQgYW5ub3RhdGlvbnM/JykpIHtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5kZWxldGVTZWxlY3RlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKCdzaWRlYmFyLmZvbGRvdXQuZG8tb3BlbicsIGZ1bmN0aW9uIChlLCBuYW1lKSB7XG4gICAgICAgICAgICAkc2NvcGUub3BlbkZvbGRvdXQobmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS4kb24oJ2tleXByZXNzJywgZnVuY3Rpb24gKGUsIGtleUV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoa2V5RXZlbnQua2V5Q29kZSA9PT0gNDYpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZGVsZXRlU2VsZWN0ZWRBbm5vdGF0aW9ucygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblx0fVxuKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==