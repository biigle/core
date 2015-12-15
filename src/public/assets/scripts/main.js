/**
 * @namespace dias.annotations
 * @description The DIAS annotations module.
 */
angular.module('dias.annotations', ['dias.api', 'dias.ui']);

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
angular.module('dias.annotations').controller('AnnotatorController', ["$scope", "images", "urlParams", "msg", "IMAGE_ID", "keyboard", function ($scope, images, urlParams, msg, IMAGE_ID, keyboard) {
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
            return images.show(parseInt(id))
                         .then(finishLoading)
                         .catch(msg.responseError);
        };

        // show the next image and create a new history entry
        $scope.nextImage = function () {
            startLoading();
            return images.next()
                  .then(finishLoading)
                  .then(pushState)
                  .catch(msg.responseError);
        };

        // show the previous image and create a new history entry
        $scope.prevImage = function () {
            startLoading();
            return images.prev()
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

        keyboard.on(37, function () {
            $scope.prevImage();
            $scope.$apply();
        });

        keyboard.on(39, function () {
            $scope.nextImage();
            $scope.$apply();
        });

        keyboard.on(32, function () {
            $scope.nextImage();
            $scope.$apply();
        });

        // listen to the browser "back" button
        window.onpopstate = function(e) {
            var state = e.state;
            if (state && state.slug !== undefined) {
                loadImage(state.slug);
            }
        };

        // initialize the images service
        images.init();
        // display the first image
        loadImage(IMAGE_ID).then(pushState);
    }]
);

/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name CanvasController
 * @memberOf dias.annotations
 * @description Main controller for the annotation canvas element
 */
angular.module('dias.annotations').controller('CanvasController', ["$scope", "mapImage", "mapAnnotations", "map", "$timeout", "debounce", function ($scope, mapImage, mapAnnotations, map, $timeout, debounce) {
		"use strict";

        var mapView = map.getView();

		// update the URL parameters
		map.on('moveend', function(e) {
            var emit = function () {
                $scope.$emit('canvas.moveend', {
                    center: mapView.getCenter(),
                    zoom: mapView.getZoom()
                });
            };

            // dont update immediately but wait for possible new changes
            debounce(emit, 100, 'annotator.canvas.moveend');
		});

        map.on('change:view', function () {
            mapView = map.getView();
        });

		mapImage.init($scope);
		mapAnnotations.init($scope);

		var updateSize = function () {
			// workaround, so the function is called *after* the angular digest
			// and *after* the foldout was rendered
			$timeout(function() {
                // this needs to be wrapped in an extra function since updateSize accepts arguments
				map.updateSize();
			}, 50, false);
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
angular.module('dias.annotations').controller('CategoriesController', ["$scope", "labels", "keyboard", function ($scope, labels, keyboard) {
        "use strict";

        // maximum number of allowed favourites
        var maxFavourites = 9;
        var favouritesStorageKey = 'dias.annotations.label-favourites';

        // saves the IDs of the favourites in localStorage
        var storeFavourites = function () {
            var tmp = $scope.favourites.map(function (item) {
                return item.id;
            });
            window.localStorage[favouritesStorageKey] = JSON.stringify(tmp);
        };

        // restores the favourites from the IDs in localStorage
        var loadFavourites = function () {
            if (window.localStorage[favouritesStorageKey]) {
                var tmp = JSON.parse(window.localStorage[favouritesStorageKey]);
                $scope.favourites = $scope.categories.filter(function (item) {
                    // only take those categories as favourites that are available for this image
                    return tmp.indexOf(item.id) !== -1;
                });
            }
        };

        var chooseFavourite = function (index) {
            if (index >= 0 && index < $scope.favourites.length) {
                $scope.selectItem($scope.favourites[index]);
            }
        };

        $scope.hotkeysMap = ['𝟭', '𝟮', '𝟯', '𝟰', '𝟱', '𝟲', '𝟳', '𝟴', '𝟵'];
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

        keyboard.on('1', function () {
            chooseFavourite(0);
            $scope.$apply();
        });

        keyboard.on('2', function () {
            chooseFavourite(1);
            $scope.$apply();
        });

        keyboard.on('3', function () {
            chooseFavourite(2);
            $scope.$apply();
        });

        keyboard.on('4', function () {
            chooseFavourite(3);
            $scope.$apply();
        });

        keyboard.on('5', function () {
            chooseFavourite(4);
            $scope.$apply();
        });

        keyboard.on('6', function () {
            chooseFavourite(5);
            $scope.$apply();
        });

        keyboard.on('7', function () {
            chooseFavourite(6);
            $scope.$apply();
        });

        keyboard.on('8', function () {
            chooseFavourite(7);
            $scope.$apply();
        });

        keyboard.on('9', function () {
            chooseFavourite(8);
            $scope.$apply();
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
angular.module('dias.annotations').controller('ControlsController', ["$scope", "mapAnnotations", "labels", "msg", "$attrs", "keyboard", function ($scope, mapAnnotations, labels, msg, $attrs, keyboard) {
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

        // deselect drawing tool on escape
        keyboard.on(27, function () {
            $scope.selectShape(null);
            $scope.$apply();
        });

        keyboard.on('a', function () {
            $scope.selectShape('Point');
            $scope.$apply();
        });

        keyboard.on('s', function () {
            $scope.selectShape('Rectangle');
            $scope.$apply();
        });

        keyboard.on('d', function () {
            $scope.selectShape('Circle');
            $scope.$apply();
        });

        keyboard.on('f', function () {
            $scope.selectShape('LineString');
            $scope.$apply();
        });

        keyboard.on('g', function () {
            $scope.selectShape('Polygon');
            $scope.$apply();
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

        var viewportSource = new ol.source.Vector();

		var minimap = new ol.Map({
			target: 'minimap',
			// remove controls
			controls: [],
			// disable interactions
			interactions: []
		});

        var mapSize = map.getSize();
        var mapView = map.getView();

		// get the same layers than the map
		minimap.addLayer(mapImage.getLayer());
        minimap.addLayer(new ol.layer.Vector({
            source: viewportSource,
            style: styles.viewport
        }));

		var viewport = new ol.Feature();
		viewportSource.addFeature(viewport);

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
			viewport.setGeometry(ol.geom.Polygon.fromExtent(mapView.calculateExtent(mapSize)));
		};

        map.on('change:size', function () {
            mapSize = map.getSize();
        });

        map.on('change:view', function () {
            mapView = map.getView();
        });

		map.on('postcompose', refreshViewport);

		var dragViewport = function (e) {
			mapView.setCenter(e.coordinate);
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
angular.module('dias.annotations').controller('SidebarController', ["$scope", "$rootScope", "mapAnnotations", "keyboard", function ($scope, $rootScope, mapAnnotations, keyboard) {
		"use strict";

        var foldoutStorageKey = 'dias.annotations.sidebar-foldout';

        $scope.foldout = '';

		$scope.openFoldout = function (name) {
            window.localStorage[foldoutStorageKey] = name;
            $scope.foldout = name;
			$rootScope.$broadcast('sidebar.foldout.open', name);
		};

		$scope.closeFoldout = function () {
            window.localStorage.removeItem(foldoutStorageKey);
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

		$scope.deleteSelectedAnnotations = function () {
            if (mapAnnotations.getSelectedFeatures().getLength() > 0 && confirm('Are you sure you want to delete all selected annotations?')) {
                mapAnnotations.deleteSelected();
            }
        };

        $rootScope.$on('sidebar.foldout.do-open', function (e, name) {
            $scope.openFoldout(name);
        });

        keyboard.on(9, function (e) {
            e.preventDefault();
            $scope.toggleFoldout('categories');
            $scope.$apply();
        });

        keyboard.on(46, function (e) {
            $scope.deleteSelectedAnnotations();
            $scope.$apply();
        });

        // the currently opened sidebar-'extension' is remembered through localStorage
        if (window.localStorage[foldoutStorageKey]) {
            $scope.openFoldout(window.localStorage[foldoutStorageKey]);
        }
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
            renderer: 'canvas',
			controls: [
				new ol.control.Zoom(),
				new ol.control.ZoomToExtent(),
				new ol.control.FullScreen()
			],
            interactions: ol.interaction.defaults({
                keyboard: false
            })
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
angular.module('dias.annotations').service('images', ["$rootScope", "TransectImage", "URL", "$q", "filterSubset", "TRANSECT_ID", function ($rootScope, TransectImage, URL, $q, filterSubset, TRANSECT_ID) {
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

            $rootScope.$broadcast('image.fetching', img);

			return deferred.promise;
		};

		/**
		 * Initializes the service for a given transect. Returns a promise that
		 * is resolved, when the service is initialized.
		 */
		this.init = function () {
			imageIds = TransectImage.query({transect_id: TRANSECT_ID}, function () {
                // look for a sequence of image IDs in local storage.
                // this sequence is produces by the transect index page when the images are
                // sorted or filtered. we want to reflect the same ordering or filtering here
                // in the annotator
                var storedSequence = window.localStorage['dias.transects.' + TRANSECT_ID + '.images'];
                if (storedSequence) {
                    storedSequence = JSON.parse(storedSequence);
                    // if there is such a stored sequence, filter out any image IDs that do not
                    // belong to the transect (any more), since some of them may have been deleted
                    // in the meantime
                    filterSubset(storedSequence, imageIds);
                    // make sure the promise is not removed when overwriting imageIds since we
                    // need it later on.
                    storedSequence.$promise = imageIds.$promise;
                    storedSequence.$resolved = imageIds.$resolved;
                    // then set the stored sequence as the sequence of image IDs instead of simply
                    // all IDs belonging to the transect
                    imageIds = storedSequence;
                }
            });

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
 * @name keyboard
 * @memberOf dias.annotations
 * @description Service to register and manage keypress events with priorities
 */
angular.module('dias.annotations').service('keyboard', function () {
        "use strict";

        // maps key codes/characters to arrays of listeners
        var listeners = {};

        var executeCallbacks = function (list, e) {
            // go from highest priority down
            for (var i = list.length - 1; i >= 0; i--) {
                // callbacks can cancel further propagation
                if (list[i].callback(e) === false) return;
            }
        };

        var handleKeyEvents = function (e) {
            var code = e.keyCode;
            var character = String.fromCharCode(e.which || code).toLowerCase();

            if (listeners[code]) {
                executeCallbacks(listeners[code], e);
            }

            if (listeners[character]) {
                executeCallbacks(listeners[character], e);
            }
        };

        document.addEventListener('keydown', handleKeyEvents);

        // register a new event listener for the key code or character with an optional priority
        // listeners with higher priority are called first anc can return 'false' to prevent the
        // listeners with lower priority from being called
        this.on = function (charOrCode, callback, priority) {
            if (typeof charOrCode === 'string' || charOrCode instanceof String) {
                charOrCode = charOrCode.toLowerCase();
            }

            priority = priority || 0;
            var listener = {
                callback: callback,
                priority: priority
            };

            if (listeners[charOrCode]) {
                var list = listeners[charOrCode];
                var i;

                for (i = 0; i < list.length; i++) {
                    if (list[i].priority >= priority) break;
                }

                if (i === list.length - 1) {
                    list.push(listener);
                } else {
                    list.splice(i, 0, listener);
                }

            } else {
                listeners[charOrCode] = [listener];
            }
        };

        // unregister an event listener
        this.off = function (charOrCode, callback) {
            if (typeof charOrCode === 'string' || charOrCode instanceof String) {
                charOrCode = charOrCode.toLowerCase();
            }

            if (listeners[charOrCode]) {
                var list = listeners[charOrCode];
                for (var i = 0; i < list.length; i++) {
                    if (list[i].callback === callback) {
                        list.splice(i, 1);
                        break;
                    }
                }
            }
        };
    }
);

/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name labels
 * @memberOf dias.annotations
 * @description Wrapper service for annotation labels to provide some convenience functions.
 */
angular.module('dias.annotations').service('labels', ["AnnotationLabel", "Label", "ProjectLabel", "Project", "msg", "$q", "PROJECT_IDS", function (AnnotationLabel, Label, ProjectLabel, Project, msg, $q, PROJECT_IDS) {
        "use strict";

        var selectedLabel;
        var currentConfidence = 1.0;

        var labels = {};

        // this promise is resolved when all labels were loaded
        this.promise = null;

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

        // init
        (function (_this) {
            var deferred = $q.defer();
            _this.promise = deferred.promise;
            // -1 because of global labels
            var finished = -1;

            // check if all labels are there. if yes, resolve
            var maybeResolve = function () {
                if (++finished === PROJECT_IDS.length) {
                    deferred.resolve(labels);
                }
            };

            labels[null] = Label.query(maybeResolve);

            PROJECT_IDS.forEach(function (id) {
                Project.get({id: id}, function (project) {
                    labels[project.name] = ProjectLabel.query({project_id: id}, maybeResolve);
                });
            });
        })(this);
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

        var annotationFeatures = new ol.Collection();
        var annotationSource = new ol.source.Vector({
            features: annotationFeatures
        });
        var annotationLayer = new ol.layer.Vector({
            source: annotationSource,
            style: styles.features,
            zIndex: 100
        });

		// select interaction working on "singleclick"
		var select = new ol.interaction.Select({
			style: styles.highlight,
            layers: [annotationLayer],
            // enable selecting multiple overlapping features at once
            multi: true
		});

		var selectedFeatures = select.getFeatures();

		var modify = new ol.interaction.Modify({
			features: annotationFeatures,
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
                // unsupported shapes are ignored
                default:
                    console.error('Unknown annotation shape: ' + annotation.shape);
                    return;
			}

			var feature = new ol.Feature({ geometry: geometry });
			feature.on('change', handleGeometryChange);
			feature.annotation = annotation;
            annotationSource.addFeature(feature);
		};

		var refreshAnnotations = function (e, image) {
			// clear features of previous image
            annotationSource.clear();
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
                annotationSource.removeFeature(e.feature);
			});

			e.feature.on('change', handleGeometryChange);

            return e.feature.annotation.$promise;
		};

		this.init = function (scope) {
            map.addLayer(annotationLayer);
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
                source: annotationSource,
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
			// don't select the last drawn point
			selectedFeatures.clear();
		};

		this.deleteSelected = function () {
			selectedFeatures.forEach(function (feature) {
				annotations.delete(feature.annotation).then(function () {
					annotationSource.removeFeature(feature);
					selectedFeatures.remove(feature);
				});
			});
		};

		this.select = function (id) {
			var feature;
			annotationSource.forEachFeature(function (f) {
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
            annotationSource.forEachFeature(function (f) {
                if (f.annotation.id === id) {
                    // animate fit
                    var view = map.getView();
                    var pan = ol.animation.pan({
                        source: view.getCenter()
                    });
                    var zoom = ol.animation.zoom({
                        resolution: view.getResolution()
                    });
                    map.beforeRender(pan, zoom);
                    view.fit(f.getGeometry(), map.getSize());
                }
            });
        };

		this.clearSelection = function () {
			selectedFeatures.clear();
		};

		this.getSelectedFeatures = function () {
			return selectedFeatures;
		};

        // manually add a new feature (not through the draw interaction)
        this.addFeature = function (feature) {
            annotationSource.addFeature(feature);
            return handleNewFeature({feature: feature});
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
					map.getView().fit(extent, map.getSize());
				}
			});
		};

		this.getExtent = function () {
			return extent;
		};

		this.getProjection = function () {
			return projection;
		};

        this.getLayer = function () {
            return imageLayer;
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

        this.colors = {
            white: [255, 255, 255, 1],
            blue: [0, 153, 255, 1],
            orange: '#ff5e00'
        };

		var width = 3;

		this.features = [
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: this.colors.white,
					width: 5
				}),
				image: new ol.style.Circle({
					radius: 6,
					fill: new ol.style.Fill({
						color: this.colors.blue
					}),
					stroke: new ol.style.Stroke({
						color: this.colors.white,
						width: 2
					})
				})
			}),
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: this.colors.blue,
					width: 3
				})
			})
		];

		this.highlight = [
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: this.colors.white,
					width: 6
				}),
				image: new ol.style.Circle({
					radius: 6,
					fill: new ol.style.Fill({
						color: this.colors.orange
					}),
					stroke: new ol.style.Stroke({
						color: this.colors.white,
						width: 3
					})
				})
			}),
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: this.colors.orange,
					width: 3
				})
			})
		];

		this.editing = [
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: this.colors.white,
					width: 5
				}),
				image: new ol.style.Circle({
					radius: 6,
					fill: new ol.style.Fill({
						color: this.colors.blue
					}),
					stroke: new ol.style.Stroke({
						color: this.colors.white,
						width: 2,
						lineDash: [3]
					})
				})
			}),
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: this.colors.blue,
					width: 3,
					lineDash: [5]
				})
			})
		];

		this.viewport = [
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: this.colors.blue,
					width: 3
				}),
			}),
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: this.colors.white,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0b3JDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ2FudmFzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NhdGVnb3JpZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ29uZmlkZW5jZUNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Db250cm9sc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9NaW5pbWFwQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NlbGVjdGVkTGFiZWxDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2lkZWJhckNvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2Fubm90YXRpb25MaXN0SXRlbS5qcyIsImRpcmVjdGl2ZXMvbGFiZWxDYXRlZ29yeUl0ZW0uanMiLCJkaXJlY3RpdmVzL2xhYmVsSXRlbS5qcyIsImZhY3Rvcmllcy9kZWJvdW5jZS5qcyIsImZhY3Rvcmllcy9tYXAuanMiLCJzZXJ2aWNlcy9hbm5vdGF0aW9ucy5qcyIsInNlcnZpY2VzL2ltYWdlcy5qcyIsInNlcnZpY2VzL2tleWJvYXJkLmpzIiwic2VydmljZXMvbGFiZWxzLmpzIiwic2VydmljZXMvbWFwQW5ub3RhdGlvbnMuanMiLCJzZXJ2aWNlcy9tYXBJbWFnZS5qcyIsInNlcnZpY2VzL3N0eWxlcy5qcyIsInNlcnZpY2VzL3VybFBhcmFtcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxvQkFBQSxDQUFBLFlBQUE7Ozs7Ozs7OztBQ0dBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLHlGQUFBLFVBQUEsUUFBQSxnQkFBQSxRQUFBLGFBQUEsUUFBQTtFQUNBOztFQUVBLE9BQUEsbUJBQUEsZUFBQSxzQkFBQTs7RUFFQSxPQUFBLGlCQUFBLG9CQUFBLFVBQUEsVUFBQTtHQUNBLFNBQUEsUUFBQSxVQUFBLFNBQUE7SUFDQSxPQUFBLG1CQUFBLFFBQUE7Ozs7RUFJQSxJQUFBLHFCQUFBLFlBQUE7R0FDQSxPQUFBLGNBQUEsWUFBQTs7O0VBR0EsSUFBQSxtQkFBQSxlQUFBOztFQUVBLE9BQUEsY0FBQTs7RUFFQSxPQUFBLGlCQUFBLGVBQUE7O0VBRUEsT0FBQSxtQkFBQSxVQUFBLEdBQUEsSUFBQTs7R0FFQSxJQUFBLENBQUEsRUFBQSxVQUFBO0lBQ0EsT0FBQTs7R0FFQSxlQUFBLE9BQUE7OztRQUdBLE9BQUEsZ0JBQUEsZUFBQTs7RUFFQSxPQUFBLGFBQUEsVUFBQSxJQUFBO0dBQ0EsSUFBQSxXQUFBO0dBQ0EsaUJBQUEsUUFBQSxVQUFBLFNBQUE7SUFDQSxJQUFBLFFBQUEsY0FBQSxRQUFBLFdBQUEsTUFBQSxJQUFBO0tBQ0EsV0FBQTs7O0dBR0EsT0FBQTs7O0VBR0EsT0FBQSxJQUFBLGVBQUE7Ozs7Ozs7Ozs7O0FDekNBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLHdGQUFBLFVBQUEsUUFBQSxRQUFBLFdBQUEsS0FBQSxVQUFBLFVBQUE7UUFDQTs7UUFFQSxPQUFBLFNBQUE7UUFDQSxPQUFBLGVBQUE7OztRQUdBLE9BQUEsV0FBQTtZQUNBLE1BQUEsVUFBQSxJQUFBO1lBQ0EsUUFBQSxDQUFBLFVBQUEsSUFBQSxNQUFBLFVBQUEsSUFBQTs7OztRQUlBLElBQUEsZ0JBQUEsWUFBQTtZQUNBLE9BQUEsZUFBQTtZQUNBLE9BQUEsV0FBQSxlQUFBLE9BQUEsT0FBQTs7OztRQUlBLElBQUEsWUFBQSxZQUFBO1lBQ0EsVUFBQSxVQUFBLE9BQUEsT0FBQSxhQUFBOzs7O1FBSUEsSUFBQSxlQUFBLFlBQUE7WUFDQSxPQUFBLGVBQUE7Ozs7UUFJQSxJQUFBLFlBQUEsVUFBQSxJQUFBO1lBQ0E7WUFDQSxPQUFBLE9BQUEsS0FBQSxTQUFBOzBCQUNBLEtBQUE7MEJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxZQUFBLFlBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQTttQkFDQSxLQUFBO21CQUNBLEtBQUE7bUJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxZQUFBLFlBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQTttQkFDQSxLQUFBO21CQUNBLEtBQUE7bUJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxJQUFBLGtCQUFBLFNBQUEsR0FBQSxRQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsT0FBQTtZQUNBLE9BQUEsU0FBQSxPQUFBLEtBQUEsS0FBQSxNQUFBLE9BQUEsT0FBQTtZQUNBLE9BQUEsU0FBQSxPQUFBLEtBQUEsS0FBQSxNQUFBLE9BQUEsT0FBQTtZQUNBLFVBQUEsSUFBQTtnQkFDQSxHQUFBLE9BQUEsU0FBQTtnQkFDQSxHQUFBLE9BQUEsU0FBQSxPQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBLE9BQUE7Ozs7UUFJQSxTQUFBLEdBQUEsSUFBQSxZQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxJQUFBLFlBQUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLElBQUEsWUFBQTtZQUNBLE9BQUE7WUFDQSxPQUFBOzs7O1FBSUEsT0FBQSxhQUFBLFNBQUEsR0FBQTtZQUNBLElBQUEsUUFBQSxFQUFBO1lBQ0EsSUFBQSxTQUFBLE1BQUEsU0FBQSxXQUFBO2dCQUNBLFVBQUEsTUFBQTs7Ozs7UUFLQSxPQUFBOztRQUVBLFVBQUEsVUFBQSxLQUFBOzs7Ozs7Ozs7OztBQzVGQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSw0RkFBQSxVQUFBLFFBQUEsVUFBQSxnQkFBQSxLQUFBLFVBQUEsVUFBQTtFQUNBOztRQUVBLElBQUEsVUFBQSxJQUFBOzs7RUFHQSxJQUFBLEdBQUEsV0FBQSxTQUFBLEdBQUE7WUFDQSxJQUFBLE9BQUEsWUFBQTtnQkFDQSxPQUFBLE1BQUEsa0JBQUE7b0JBQ0EsUUFBQSxRQUFBO29CQUNBLE1BQUEsUUFBQTs7Ozs7WUFLQSxTQUFBLE1BQUEsS0FBQTs7O1FBR0EsSUFBQSxHQUFBLGVBQUEsWUFBQTtZQUNBLFVBQUEsSUFBQTs7O0VBR0EsU0FBQSxLQUFBO0VBQ0EsZUFBQSxLQUFBOztFQUVBLElBQUEsYUFBQSxZQUFBOzs7R0FHQSxTQUFBLFdBQUE7O0lBRUEsSUFBQTtNQUNBLElBQUE7OztFQUdBLE9BQUEsSUFBQSx3QkFBQTtFQUNBLE9BQUEsSUFBQSx5QkFBQTs7Ozs7Ozs7Ozs7QUNuQ0EsUUFBQSxPQUFBLG9CQUFBLFdBQUEseURBQUEsVUFBQSxRQUFBLFFBQUEsVUFBQTtRQUNBOzs7UUFHQSxJQUFBLGdCQUFBO1FBQ0EsSUFBQSx1QkFBQTs7O1FBR0EsSUFBQSxrQkFBQSxZQUFBO1lBQ0EsSUFBQSxNQUFBLE9BQUEsV0FBQSxJQUFBLFVBQUEsTUFBQTtnQkFDQSxPQUFBLEtBQUE7O1lBRUEsT0FBQSxhQUFBLHdCQUFBLEtBQUEsVUFBQTs7OztRQUlBLElBQUEsaUJBQUEsWUFBQTtZQUNBLElBQUEsT0FBQSxhQUFBLHVCQUFBO2dCQUNBLElBQUEsTUFBQSxLQUFBLE1BQUEsT0FBQSxhQUFBO2dCQUNBLE9BQUEsYUFBQSxPQUFBLFdBQUEsT0FBQSxVQUFBLE1BQUE7O29CQUVBLE9BQUEsSUFBQSxRQUFBLEtBQUEsUUFBQSxDQUFBOzs7OztRQUtBLElBQUEsa0JBQUEsVUFBQSxPQUFBO1lBQ0EsSUFBQSxTQUFBLEtBQUEsUUFBQSxPQUFBLFdBQUEsUUFBQTtnQkFDQSxPQUFBLFdBQUEsT0FBQSxXQUFBOzs7O1FBSUEsT0FBQSxhQUFBLENBQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBO1FBQ0EsT0FBQSxhQUFBO1FBQ0EsT0FBQSxhQUFBO1FBQ0EsT0FBQSxRQUFBLEtBQUEsVUFBQSxLQUFBO1lBQ0EsS0FBQSxJQUFBLE9BQUEsS0FBQTtnQkFDQSxPQUFBLGFBQUEsT0FBQSxXQUFBLE9BQUEsSUFBQTs7WUFFQTs7O1FBR0EsT0FBQSxpQkFBQSxPQUFBOztRQUVBLE9BQUEsYUFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBLGlCQUFBO1lBQ0EsT0FBQSxXQUFBLHVCQUFBOzs7UUFHQSxPQUFBLGNBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxPQUFBLFdBQUEsUUFBQSxVQUFBLENBQUE7Ozs7UUFJQSxPQUFBLGtCQUFBLFVBQUEsR0FBQSxNQUFBO1lBQ0EsRUFBQTtZQUNBLElBQUEsUUFBQSxPQUFBLFdBQUEsUUFBQTtZQUNBLElBQUEsVUFBQSxDQUFBLEtBQUEsT0FBQSxXQUFBLFNBQUEsZUFBQTtnQkFDQSxPQUFBLFdBQUEsS0FBQTttQkFDQTtnQkFDQSxPQUFBLFdBQUEsT0FBQSxPQUFBOztZQUVBOzs7O1FBSUEsT0FBQSxpQkFBQSxZQUFBO1lBQ0EsT0FBQSxPQUFBLFdBQUEsU0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7Ozs7Ozs7Ozs7O0FDakhBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLDZDQUFBLFVBQUEsUUFBQSxRQUFBO0VBQ0E7O0VBRUEsT0FBQSxhQUFBOztFQUVBLE9BQUEsT0FBQSxjQUFBLFVBQUEsWUFBQTtHQUNBLE9BQUEscUJBQUEsV0FBQTs7R0FFQSxJQUFBLGNBQUEsTUFBQTtJQUNBLE9BQUEsa0JBQUE7VUFDQSxJQUFBLGNBQUEsTUFBQTtJQUNBLE9BQUEsa0JBQUE7VUFDQSxJQUFBLGNBQUEsT0FBQTtJQUNBLE9BQUEsa0JBQUE7VUFDQTtJQUNBLE9BQUEsa0JBQUE7Ozs7Ozs7Ozs7Ozs7QUNmQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSwwRkFBQSxVQUFBLFFBQUEsZ0JBQUEsUUFBQSxLQUFBLFFBQUEsVUFBQTtFQUNBOztFQUVBLElBQUEsVUFBQTs7RUFFQSxPQUFBLGNBQUEsVUFBQSxNQUFBO0dBQ0EsSUFBQSxDQUFBLE9BQUEsZUFBQTtnQkFDQSxPQUFBLE1BQUEsMkJBQUE7SUFDQSxJQUFBLEtBQUEsT0FBQTtJQUNBOzs7R0FHQSxlQUFBOztHQUVBLElBQUEsU0FBQSxTQUFBLFdBQUEsT0FBQSxrQkFBQSxPQUFBO0lBQ0EsT0FBQSxnQkFBQTtJQUNBLFVBQUE7VUFDQTtJQUNBLE9BQUEsZ0JBQUE7SUFDQSxlQUFBLGFBQUE7SUFDQSxVQUFBOzs7OztRQUtBLFNBQUEsR0FBQSxJQUFBLFlBQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsT0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxLQUFBLFlBQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsT0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUE7Ozs7Ozs7Ozs7OztBQ3BEQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSx5RUFBQSxVQUFBLFFBQUEsS0FBQSxVQUFBLFVBQUEsUUFBQTtFQUNBOztRQUVBLElBQUEsaUJBQUEsSUFBQSxHQUFBLE9BQUE7O0VBRUEsSUFBQSxVQUFBLElBQUEsR0FBQSxJQUFBO0dBQ0EsUUFBQTs7R0FFQSxVQUFBOztHQUVBLGNBQUE7OztRQUdBLElBQUEsVUFBQSxJQUFBO1FBQ0EsSUFBQSxVQUFBLElBQUE7OztFQUdBLFFBQUEsU0FBQSxTQUFBO1FBQ0EsUUFBQSxTQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxRQUFBO1lBQ0EsT0FBQSxPQUFBOzs7RUFHQSxJQUFBLFdBQUEsSUFBQSxHQUFBO0VBQ0EsZUFBQSxXQUFBOzs7RUFHQSxPQUFBLElBQUEsZUFBQSxZQUFBO0dBQ0EsUUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO0lBQ0EsWUFBQSxTQUFBO0lBQ0EsUUFBQSxHQUFBLE9BQUEsVUFBQSxTQUFBO0lBQ0EsTUFBQTs7Ozs7RUFLQSxJQUFBLGtCQUFBLFlBQUE7R0FDQSxTQUFBLFlBQUEsR0FBQSxLQUFBLFFBQUEsV0FBQSxRQUFBLGdCQUFBOzs7UUFHQSxJQUFBLEdBQUEsZUFBQSxZQUFBO1lBQ0EsVUFBQSxJQUFBOzs7UUFHQSxJQUFBLEdBQUEsZUFBQSxZQUFBO1lBQ0EsVUFBQSxJQUFBOzs7RUFHQSxJQUFBLEdBQUEsZUFBQTs7RUFFQSxJQUFBLGVBQUEsVUFBQSxHQUFBO0dBQ0EsUUFBQSxVQUFBLEVBQUE7OztFQUdBLFFBQUEsR0FBQSxlQUFBOztFQUVBLFNBQUEsR0FBQSxjQUFBLFlBQUE7R0FDQSxRQUFBLEdBQUEsZUFBQTs7O0VBR0EsU0FBQSxHQUFBLGNBQUEsWUFBQTtHQUNBLFFBQUEsR0FBQSxlQUFBOzs7Ozs7Ozs7Ozs7QUM3REEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsZ0RBQUEsVUFBQSxRQUFBLFFBQUE7RUFDQTs7UUFFQSxPQUFBLG1CQUFBLE9BQUE7Ozs7Ozs7Ozs7O0FDSEEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsNEVBQUEsVUFBQSxRQUFBLFlBQUEsZ0JBQUEsVUFBQTtFQUNBOztRQUVBLElBQUEsb0JBQUE7O1FBRUEsT0FBQSxVQUFBOztFQUVBLE9BQUEsY0FBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLGFBQUEscUJBQUE7WUFDQSxPQUFBLFVBQUE7R0FDQSxXQUFBLFdBQUEsd0JBQUE7OztFQUdBLE9BQUEsZUFBQSxZQUFBO1lB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QUEsV0FBQTtJQUNBLElBQUEsVUFBQSxNQUFBLE9BQUE7SUFDQSxJQUFBLFFBQUEsV0FBQTtLQUNBLFNBQUEsTUFBQTtLQUNBLFNBQUEsUUFBQSxLQUFBLE1BQUEsU0FBQTtLQUNBLFdBQUEsR0FBQTs7SUFFQSxJQUFBLFNBQUEsS0FBQTtLQUNBLFNBQUEsT0FBQSxTQUFBOztJQUVBLFNBQUEsTUFBQSxTQUFBLE9BQUE7SUFDQSxPQUFBLFNBQUE7Ozs7Ozs7Ozs7OztBQ3RCQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxPQUFBLFlBQUE7RUFDQTs7RUFFQSxJQUFBLE1BQUEsSUFBQSxHQUFBLElBQUE7R0FDQSxRQUFBO1lBQ0EsVUFBQTtHQUNBLFVBQUE7SUFDQSxJQUFBLEdBQUEsUUFBQTtJQUNBLElBQUEsR0FBQSxRQUFBO0lBQ0EsSUFBQSxHQUFBLFFBQUE7O1lBRUEsY0FBQSxHQUFBLFlBQUEsU0FBQTtnQkFDQSxVQUFBOzs7O0VBSUEsT0FBQTs7Ozs7Ozs7Ozs7QUNoQkEsUUFBQSxPQUFBLG9CQUFBLFFBQUEseURBQUEsVUFBQSxZQUFBLFFBQUEsUUFBQSxLQUFBO0VBQ0E7O0VBRUEsSUFBQTs7RUFFQSxJQUFBLG1CQUFBLFVBQUEsWUFBQTtHQUNBLFdBQUEsUUFBQSxPQUFBLFFBQUEsV0FBQTtHQUNBLE9BQUE7OztFQUdBLElBQUEsZ0JBQUEsVUFBQSxZQUFBO0dBQ0EsWUFBQSxLQUFBO0dBQ0EsT0FBQTs7O0VBR0EsS0FBQSxRQUFBLFVBQUEsUUFBQTtHQUNBLGNBQUEsV0FBQSxNQUFBO0dBQ0EsWUFBQSxTQUFBLEtBQUEsVUFBQSxHQUFBO0lBQ0EsRUFBQSxRQUFBOztHQUVBLE9BQUE7OztFQUdBLEtBQUEsTUFBQSxVQUFBLFFBQUE7R0FDQSxJQUFBLENBQUEsT0FBQSxZQUFBLE9BQUEsT0FBQTtJQUNBLE9BQUEsV0FBQSxPQUFBLE1BQUEsT0FBQTs7R0FFQSxJQUFBLFFBQUEsT0FBQTtHQUNBLE9BQUEsV0FBQSxNQUFBO0dBQ0EsT0FBQSxhQUFBLE9BQUE7R0FDQSxJQUFBLGFBQUEsV0FBQSxJQUFBO0dBQ0EsV0FBQTtjQUNBLEtBQUE7Y0FDQSxLQUFBO2NBQ0EsTUFBQSxJQUFBOztHQUVBLE9BQUE7OztFQUdBLEtBQUEsU0FBQSxVQUFBLFlBQUE7O0dBRUEsSUFBQSxRQUFBLFlBQUEsUUFBQTtHQUNBLElBQUEsUUFBQSxDQUFBLEdBQUE7SUFDQSxPQUFBLFdBQUEsUUFBQSxZQUFBOzs7S0FHQSxRQUFBLFlBQUEsUUFBQTtLQUNBLFlBQUEsT0FBQSxPQUFBO09BQ0EsSUFBQTs7OztFQUlBLEtBQUEsVUFBQSxVQUFBLElBQUE7R0FDQSxPQUFBLFlBQUEsUUFBQTs7O0VBR0EsS0FBQSxVQUFBLFlBQUE7R0FDQSxPQUFBOzs7Ozs7Ozs7OztBQ3pEQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxzRkFBQSxVQUFBLFlBQUEsZUFBQSxLQUFBLElBQUEsY0FBQSxhQUFBO0VBQ0E7O0VBRUEsSUFBQSxRQUFBOztFQUVBLElBQUEsV0FBQTs7RUFFQSxJQUFBLGtCQUFBOztFQUVBLElBQUEsU0FBQTs7O0VBR0EsS0FBQSxlQUFBOzs7Ozs7RUFNQSxJQUFBLFNBQUEsVUFBQSxJQUFBO0dBQ0EsS0FBQSxNQUFBLE1BQUEsYUFBQTtHQUNBLElBQUEsUUFBQSxTQUFBLFFBQUE7R0FDQSxPQUFBLFNBQUEsQ0FBQSxRQUFBLEtBQUEsU0FBQTs7Ozs7OztFQU9BLElBQUEsU0FBQSxVQUFBLElBQUE7R0FDQSxLQUFBLE1BQUEsTUFBQSxhQUFBO0dBQ0EsSUFBQSxRQUFBLFNBQUEsUUFBQTtHQUNBLElBQUEsU0FBQSxTQUFBO0dBQ0EsT0FBQSxTQUFBLENBQUEsUUFBQSxJQUFBLFVBQUE7Ozs7Ozs7RUFPQSxJQUFBLFdBQUEsVUFBQSxJQUFBO0dBQ0EsS0FBQSxNQUFBLE1BQUEsYUFBQTtHQUNBLEtBQUEsSUFBQSxJQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO0lBQ0EsSUFBQSxPQUFBLEdBQUEsT0FBQSxJQUFBLE9BQUEsT0FBQTs7O0dBR0EsT0FBQTs7Ozs7O0VBTUEsSUFBQSxPQUFBLFVBQUEsSUFBQTtH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LE9BQUE7R0FDQSxPQUFBLE9BQUE7WUFDQSxRQUFBLENBQUE7O1lBRUEsT0FBQTs7O0VBR0EsSUFBQSxtQkFBQSxPQUFBOztFQUVBLElBQUEsU0FBQSxJQUFBLEdBQUEsWUFBQSxPQUFBO0dBQ0EsVUFBQTs7OztHQUlBLGlCQUFBLFNBQUEsT0FBQTtJQUNBLE9BQUEsR0FBQSxPQUFBLFVBQUEsYUFBQSxVQUFBLEdBQUEsT0FBQSxVQUFBLFlBQUE7Ozs7O0VBS0EsSUFBQTs7OztFQUlBLElBQUEscUJBQUEsVUFBQSxPQUFBO0dBQ0EsT0FBQSxDQUFBLEdBQUEsTUFBQSxJQUFBLEdBQUEsT0FBQSxhQUFBLFNBQUEsTUFBQTs7Ozs7RUFLQSxJQUFBLG1CQUFBLFVBQUEsT0FBQTtHQUNBLE9BQUEsQ0FBQSxNQUFBLEdBQUEsT0FBQSxhQUFBLFNBQUEsTUFBQTs7Ozs7RUFLQSxJQUFBLGlCQUFBLFVBQUEsVUFBQTtHQUNBLFFBQUEsU0FBQTtJQUNBLEtBQUE7O0tBRUEsT0FBQSxDQUFBLFNBQUEsYUFBQSxDQUFBLFNBQUEsYUFBQTtJQUNBLEtBQUE7SUFDQSxLQUFBO0tBQ0EsT0FBQSxTQUFBLGlCQUFBO0lBQ0EsS0FBQTtLQUNBLE9BQUEsQ0FBQSxTQUFBO0lBQ0E7S0FDQSxPQUFBLFNBQUE7Ozs7O0VBS0EsSUFBQSx1QkFBQSxVQUFBLEdBQUE7R0FDQSxJQUFBLFVBQUEsRUFBQTtHQUNBLElBQUEsT0FBQSxZQUFBO0lBQ0EsSUFBQSxjQUFBLGVBQUEsUUFBQTtJQUNBLFFBQUEsV0FBQSxTQUFBLFlBQUEsSUFBQTtJQUNBLFFBQUEsV0FBQTs7OztHQUlBLFNBQUEsTUFBQSxLQUFBLFFBQUEsV0FBQTs7O0VBR0EsSUFBQSxnQkFBQSxVQUFBLFlBQUE7R0FDQSxJQUFBO0dBQ0EsSUFBQSxTQUFBLFdBQUEsT0FBQSxJQUFBOztHQUVBLFFBQUEsV0FBQTtJQUNBLEtBQUE7S0FDQSxXQUFBLElBQUEsR0FBQSxLQUFBLE1BQUEsT0FBQTtLQUNBO0lBQ0EsS0FBQTtLQUNBLFdBQUEsSUFBQSxHQUFBLEtBQUEsVUFBQSxFQUFBO0tBQ0E7SUFDQSxLQUFBOztLQUVBLFdBQUEsSUFBQSxHQUFBLEtBQUEsUUFBQSxFQUFBO0tBQ0E7SUFDQSxLQUFBO0tBQ0EsV0FBQSxJQUFBLEdBQUEsS0FBQSxXQUFBO0tBQ0E7SUFDQSxLQUFBOztLQUVBLFdBQUEsSUFBQSxHQUFBLEtBQUEsT0FBQSxPQUFBLElBQUEsT0FBQSxHQUFBO0tBQ0E7O2dCQUVBO29CQUNBLFFBQUEsTUFBQSwrQkFBQSxXQUFBO29CQUNBOzs7R0FHQSxJQUFBLFVBQUEsSUFBQSxHQUFBLFFBQUEsRUFBQSxVQUFBO0dBQ0EsUUFBQSxHQUFBLFVBQUE7R0FDQSxRQUFBLGFBQUE7WUFDQSxpQkFBQSxXQUFBOzs7RUFHQSxJQUFBLHFCQUFBLFVBQUEsR0FBQSxPQUFBOztZQUVBLGlCQUFBO0dBQ0EsaUJBQUE7O0dBRUEsWUFBQSxNQUFBLENBQUEsSUFBQSxNQUFBLE1BQUEsU0FBQSxLQUFBLFlBQUE7SUFDQSxZQUFBLFFBQUE7Ozs7RUFJQSxJQUFBLG1CQUFBLFVBQUEsR0FBQTtHQUNBLElBQUEsV0FBQSxFQUFBLFFBQUE7R0FDQSxJQUFBLGNBQUEsZUFBQTs7R0FFQSxFQUFBLFFBQUEsYUFBQSxZQUFBLElBQUE7SUFDQSxJQUFBLE9BQUE7SUFDQSxPQUFBLFNBQUE7SUFDQSxRQUFBLFlBQUEsSUFBQTs7OztHQUlBLEVBQUEsUUFBQSxXQUFBLFNBQUEsTUFBQSxZQUFBO2dCQUNBLGlCQUFBLGNBQUEsRUFBQTs7O0dBR0EsRUFBQSxRQUFBLEdBQUEsVUFBQTs7WUFFQSxPQUFBLEVBQUEsUUFBQSxXQUFBOzs7RUFHQSxLQUFBLE9BQUEsVUFBQSxPQUFBO1lBQ0EsSUFBQSxTQUFBO0dBQ0EsSUFBQSxlQUFBO0dBQ0EsTUFBQSxJQUFBLGVBQUE7O0dBRUEsaUJBQUEsR0FBQSxpQkFBQSxZQUFBOztJQUVBLElBQUEsQ0FBQSxNQUFBLFNBQUE7O0tBRUEsTUFBQTs7Ozs7RUFLQSxLQUFBLGVBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxVQUFBOztHQUVBLE9BQUEsUUFBQTtHQUNBLE9BQUEsSUFBQSxHQUFBLFlBQUEsS0FBQTtnQkFDQSxRQUFBO0lBQ0EsTUFBQTtJQUNBLE9BQUEsT0FBQTs7O0dBR0EsSUFBQSxlQUFBO0dBQ0EsSUFBQSxlQUFBO0dBQ0EsS0FBQSxHQUFBLFdBQUE7OztFQUdBLEtBQUEsZ0JBQUEsWUFBQTtHQUNBLElBQUEsa0JBQUE7R0FDQSxJQUFBLGtCQUFBO1lBQ0EsT0FBQSxVQUFBOztHQUVBLGlCQUFBOzs7RUFHQSxLQUFBLGlCQUFBLFlBQUE7R0FDQSxpQkFBQSxRQUFBLFVBQUEsU0FBQTtJQUNBLFlBQUEsT0FBQSxRQUFBLFlBQUEsS0FBQSxZQUFBO0tBQ0EsaUJBQUEsY0FBQTtLQUNBLGlCQUFBLE9BQUE7Ozs7O0VBS0EsS0FBQSxTQUFBLFVBQUEsSUFBQTtHQUNBLElBQUE7R0FDQSxpQkFBQSxlQUFBLFVBQUEsR0FBQTtJQUNBLElBQUEsRUFBQSxXQUFBLE9BQUEsSUFBQTtLQUNBLFVBQUE7Ozs7R0FJQSxJQUFBLENBQUEsaUJBQUEsT0FBQSxVQUFBO0lBQ0EsaUJBQUEsS0FBQTs7Ozs7UUFLQSxLQUFBLE1BQUEsVUFBQSxJQUFBO1lBQ0EsaUJBQUEsZUFBQSxVQUFBLEdBQUE7Z0JBQ0EsSUFBQSxFQUFBLFdBQUEsT0FBQSxJQUFBOztvQkFFQSxJQUFBLE9BQUEsSUFBQTtvQkFDQSxJQUFBLE1BQUEsR0FBQSxVQUFBLElBQUE7d0JBQ0EsUUFBQSxLQUFBOztvQkFFQSxJQUFBLE9BQUEsR0FBQSxVQUFBLEtBQUE7d0JBQ0EsWUFBQSxLQUFBOztvQkFFQSxJQUFBLGFBQUEsS0FBQTtvQkFDQSxLQUFBLElBQUEsRUFBQSxlQUFBLElBQUE7Ozs7O0VBS0EsS0FBQSxpQkFBQSxZQUFBO0dBQ0EsaUJBQUE7OztFQUdBLEtBQUEsc0JBQUEsWUFBQTtHQUNBLE9BQUE7Ozs7UUFJQSxLQUFBLGFBQUEsVUFBQSxTQUFBO1lBQ0EsaUJBQUEsV0FBQTtZQUNBLE9BQUEsaUJBQUEsQ0FBQSxTQUFBOzs7Ozs7Ozs7Ozs7QUN0T0EsUUFBQSxPQUFBLG9CQUFBLFFBQUEsb0JBQUEsVUFBQSxLQUFBO0VBQ0E7RUFDQSxJQUFBLFNBQUEsQ0FBQSxHQUFBLEdBQUEsR0FBQTs7RUFFQSxJQUFBLGFBQUEsSUFBQSxHQUFBLEtBQUEsV0FBQTtHQUNBLE1BQUE7R0FDQSxPQUFBO0dBQ0EsUUFBQTs7O0VBR0EsSUFBQSxhQUFBLElBQUEsR0FBQSxNQUFBOztFQUVBLEtBQUEsT0FBQSxVQUFBLE9BQUE7R0FDQSxJQUFBLFNBQUE7OztHQUdBLE1BQUEsSUFBQSxlQUFBLFVBQUEsR0FBQSxPQUFBO0lBQ0EsT0FBQSxLQUFBLE1BQUE7SUFDQSxPQUFBLEtBQUEsTUFBQTs7SUFFQSxJQUFBLE9BQUEsTUFBQSxTQUFBOztJQUVBLElBQUEsU0FBQSxNQUFBLFNBQUE7O0lBRUEsSUFBQSxPQUFBLE9BQUEsYUFBQSxPQUFBLE9BQUEsV0FBQTtLQUNBLFNBQUEsR0FBQSxPQUFBLFVBQUE7OztJQUdBLElBQUEsY0FBQSxJQUFBLEdBQUEsT0FBQSxZQUFBO0tBQ0EsS0FBQSxNQUFBO0tBQ0EsWUFBQTtLQUNBLGFBQUE7OztJQUdBLFdBQUEsVUFBQTs7SUFFQSxJQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7S0FDQSxZQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUE7S0FDQSxZQUFBOztLQUVBLGVBQUE7O0tBRUEsUUFBQTs7OztJQUlBLElBQUEsU0FBQSxXQUFBO0tBQ0EsSUFBQSxVQUFBLElBQUEsUUFBQSxJQUFBOzs7OztFQUtBLEtBQUEsWUFBQSxZQUFBO0dBQ0EsT0FBQTs7O0VBR0EsS0FBQSxnQkFBQSxZQUFBO0dBQ0EsT0FBQTs7O1FBR0EsS0FBQSxXQUFBLFlBQUE7WUFDQSxPQUFBOzs7Ozs7Ozs7Ozs7QUMvREEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsVUFBQSxZQUFBO0VBQ0E7O1FBRUEsS0FBQSxTQUFBO1lBQ0EsT0FBQSxDQUFBLEtBQUEsS0FBQSxLQUFBO1lBQ0EsTUFBQSxDQUFBLEdBQUEsS0FBQSxLQUFBO1lBQ0EsUUFBQTs7O0VBR0EsSUFBQSxRQUFBOztFQUVBLEtBQUEsV0FBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBLEtBQUEsT0FBQTtLQUNBLE9BQUE7O0lBRUEsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtNQUNBLE9BQUEsS0FBQSxPQUFBOztLQUVBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtNQUNBLE9BQUEsS0FBQSxPQUFBO01BQ0EsT0FBQTs7OztHQUlBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBLEtBQUEsT0FBQTtLQUNBLE9BQUE7Ozs7O0VBS0EsS0FBQSxZQUFBO0dBQ0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUEsS0FBQSxPQUFBO0tBQ0EsT0FBQTs7SUFFQSxPQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBO01BQ0EsT0FBQSxLQUFBLE9BQUE7O0tBRUEsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO01BQ0EsT0FBQSxLQUFBLE9BQUE7TUFDQSxPQUFBOzs7O0dBSUEsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUEsS0FBQSxPQUFBO0tBQ0EsT0FBQTs7Ozs7RUFLQSxLQUFBLFVBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQSxLQUFBLE9BQUE7S0FDQSxPQUFBOztJQUVBLE9BQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLFFBQUE7S0FDQSxNQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7TUFDQSxPQUFBLEtBQUEsT0FBQTs7S0FFQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7TUFDQSxPQUFBLEtBQUEsT0FBQTtNQUNBLE9BQUE7TUFDQSxVQUFBLENBQUE7Ozs7R0FJQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQSxLQUFBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsVUFBQSxDQUFBOzs7OztFQUtBLEtBQUEsV0FBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBLEtBQUEsT0FBQTtLQUNBLE9BQUE7OztHQUdBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBLEtBQUEsT0FBQTtLQUNBLE9BQUE7Ozs7Ozs7Ozs7Ozs7O0FDbEdBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLGFBQUEsWUFBQTtFQUNBOztFQUVBLElBQUEsUUFBQTs7O0VBR0EsSUFBQSxjQUFBLFlBQUE7R0FDQSxJQUFBLFNBQUEsU0FBQSxLQUFBLFFBQUEsS0FBQTs4QkFDQSxNQUFBOztHQUVBLElBQUEsUUFBQTs7R0FFQSxPQUFBLFFBQUEsVUFBQSxPQUFBOztJQUVBLElBQUEsVUFBQSxNQUFBLE1BQUE7SUFDQSxJQUFBLFdBQUEsUUFBQSxXQUFBLEdBQUE7S0FDQSxNQUFBLFFBQUEsTUFBQSxtQkFBQSxRQUFBOzs7O0dBSUEsT0FBQTs7OztFQUlBLElBQUEsY0FBQSxVQUFBLE9BQUE7R0FDQSxJQUFBLFNBQUE7R0FDQSxLQUFBLElBQUEsT0FBQSxPQUFBO0lBQ0EsVUFBQSxNQUFBLE1BQUEsbUJBQUEsTUFBQSxRQUFBOztHQUVBLE9BQUEsT0FBQSxVQUFBLEdBQUEsT0FBQSxTQUFBOzs7RUFHQSxLQUFBLFlBQUEsVUFBQSxHQUFBO0dBQ0EsTUFBQSxPQUFBO0dBQ0EsUUFBQSxVQUFBLE9BQUEsSUFBQSxNQUFBLE9BQUEsTUFBQSxZQUFBOzs7O0VBSUEsS0FBQSxNQUFBLFVBQUEsUUFBQTtHQUNBLEtBQUEsSUFBQSxPQUFBLFFBQUE7SUFDQSxNQUFBLE9BQUEsT0FBQTs7R0FFQSxRQUFBLGFBQUEsT0FBQSxJQUFBLE1BQUEsT0FBQSxNQUFBLFlBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsVUFBQSxLQUFBO0dBQ0EsT0FBQSxNQUFBOzs7RUFHQSxRQUFBLFFBQUE7O0VBRUEsSUFBQSxDQUFBLE9BQUE7R0FDQSxRQUFBOzs7RUFHQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBhbm5vdGF0aW9ucyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJywgWydkaWFzLmFwaScsICdkaWFzLnVpJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0aW9uc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGFubm90YXRpb25zIGxpc3QgaW4gdGhlIHNpZGViYXJcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdBbm5vdGF0aW9uc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywgbGFiZWxzLCBhbm5vdGF0aW9ucywgc2hhcGVzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuc2VsZWN0ZWRGZWF0dXJlcyA9IG1hcEFubm90YXRpb25zLmdldFNlbGVjdGVkRmVhdHVyZXMoKS5nZXRBcnJheSgpO1xuXG5cdFx0JHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oJ3NlbGVjdGVkRmVhdHVyZXMnLCBmdW5jdGlvbiAoZmVhdHVyZXMpIHtcblx0XHRcdGZlYXR1cmVzLmZvckVhY2goZnVuY3Rpb24gKGZlYXR1cmUpIHtcblx0XHRcdFx0bGFiZWxzLmZldGNoRm9yQW5ub3RhdGlvbihmZWF0dXJlLmFubm90YXRpb24pO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHR2YXIgcmVmcmVzaEFubm90YXRpb25zID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmFubm90YXRpb25zID0gYW5ub3RhdGlvbnMuY3VycmVudCgpO1xuXHRcdH07XG5cblx0XHR2YXIgc2VsZWN0ZWRGZWF0dXJlcyA9IG1hcEFubm90YXRpb25zLmdldFNlbGVjdGVkRmVhdHVyZXMoKTtcblxuXHRcdCRzY29wZS5hbm5vdGF0aW9ucyA9IFtdO1xuXG5cdFx0JHNjb3BlLmNsZWFyU2VsZWN0aW9uID0gbWFwQW5ub3RhdGlvbnMuY2xlYXJTZWxlY3Rpb247XG5cblx0XHQkc2NvcGUuc2VsZWN0QW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChlLCBpZCkge1xuXHRcdFx0Ly8gYWxsb3cgbXVsdGlwbGUgc2VsZWN0aW9uc1xuXHRcdFx0aWYgKCFlLnNoaWZ0S2V5KSB7XG5cdFx0XHRcdCRzY29wZS5jbGVhclNlbGVjdGlvbigpO1xuXHRcdFx0fVxuXHRcdFx0bWFwQW5ub3RhdGlvbnMuc2VsZWN0KGlkKTtcblx0XHR9O1xuXG4gICAgICAgICRzY29wZS5maXRBbm5vdGF0aW9uID0gbWFwQW5ub3RhdGlvbnMuZml0O1xuXG5cdFx0JHNjb3BlLmlzU2VsZWN0ZWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBzZWxlY3RlZCA9IGZhbHNlO1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5mb3JFYWNoKGZ1bmN0aW9uIChmZWF0dXJlKSB7XG5cdFx0XHRcdGlmIChmZWF0dXJlLmFubm90YXRpb24gJiYgZmVhdHVyZS5hbm5vdGF0aW9uLmlkID09IGlkKSB7XG5cdFx0XHRcdFx0c2VsZWN0ZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBzZWxlY3RlZDtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCByZWZyZXNoQW5ub3RhdGlvbnMpO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0b3JDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1haW4gY29udHJvbGxlciBvZiB0aGUgQW5ub3RhdG9yIGFwcGxpY2F0aW9uLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0Fubm90YXRvckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBpbWFnZXMsIHVybFBhcmFtcywgbXNnLCBJTUFHRV9JRCwga2V5Ym9hcmQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLmltYWdlcyA9IGltYWdlcztcbiAgICAgICAgJHNjb3BlLmltYWdlTG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgLy8gdGhlIGN1cnJlbnQgY2FudmFzIHZpZXdwb3J0LCBzeW5jZWQgd2l0aCB0aGUgVVJMIHBhcmFtZXRlcnNcbiAgICAgICAgJHNjb3BlLnZpZXdwb3J0ID0ge1xuICAgICAgICAgICAgem9vbTogdXJsUGFyYW1zLmdldCgneicpLFxuICAgICAgICAgICAgY2VudGVyOiBbdXJsUGFyYW1zLmdldCgneCcpLCB1cmxQYXJhbXMuZ2V0KCd5JyldXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZmluaXNoIGltYWdlIGxvYWRpbmcgcHJvY2Vzc1xuICAgICAgICB2YXIgZmluaXNoTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdpbWFnZS5zaG93bicsICRzY29wZS5pbWFnZXMuY3VycmVudEltYWdlKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeVxuICAgICAgICB2YXIgcHVzaFN0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdXJsUGFyYW1zLnB1c2hTdGF0ZSgkc2NvcGUuaW1hZ2VzLmN1cnJlbnRJbWFnZS5faWQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHN0YXJ0IGltYWdlIGxvYWRpbmcgcHJvY2Vzc1xuICAgICAgICB2YXIgc3RhcnRMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlTG9hZGluZyA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gbG9hZCB0aGUgaW1hZ2UgYnkgaWQuIGRvZXNuJ3QgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnkgYnkgaXRzZWxmXG4gICAgICAgIHZhciBsb2FkSW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlcy5zaG93KHBhcnNlSW50KGlkKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmaW5pc2hMb2FkaW5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2hvdyB0aGUgbmV4dCBpbWFnZSBhbmQgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgJHNjb3BlLm5leHRJbWFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlcy5uZXh0KClcbiAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAudGhlbihwdXNoU3RhdGUpXG4gICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHNob3cgdGhlIHByZXZpb3VzIGltYWdlIGFuZCBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeVxuICAgICAgICAkc2NvcGUucHJldkltYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc3RhcnRMb2FkaW5nKCk7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VzLnByZXYoKVxuICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgIC50aGVuKHB1c2hTdGF0ZSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSBVUkwgcGFyYW1ldGVycyBvZiB0aGUgdmlld3BvcnRcbiAgICAgICAgJHNjb3BlLiRvbignY2FudmFzLm1vdmVlbmQnLCBmdW5jdGlvbihlLCBwYXJhbXMpIHtcbiAgICAgICAgICAgICRzY29wZS52aWV3cG9ydC56b29tID0gcGFyYW1zLnpvb207XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuY2VudGVyWzBdID0gTWF0aC5yb3VuZChwYXJhbXMuY2VudGVyWzBdKTtcbiAgICAgICAgICAgICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMV0gPSBNYXRoLnJvdW5kKHBhcmFtcy5jZW50ZXJbMV0pO1xuICAgICAgICAgICAgdXJsUGFyYW1zLnNldCh7XG4gICAgICAgICAgICAgICAgejogJHNjb3BlLnZpZXdwb3J0Lnpvb20sXG4gICAgICAgICAgICAgICAgeDogJHNjb3BlLnZpZXdwb3J0LmNlbnRlclswXSxcbiAgICAgICAgICAgICAgICB5OiAkc2NvcGUudmlld3BvcnQuY2VudGVyWzFdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oMzcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5wcmV2SW1hZ2UoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oMzksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oMzIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gbGlzdGVuIHRvIHRoZSBicm93c2VyIFwiYmFja1wiIGJ1dHRvblxuICAgICAgICB3aW5kb3cub25wb3BzdGF0ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBzdGF0ZSA9IGUuc3RhdGU7XG4gICAgICAgICAgICBpZiAoc3RhdGUgJiYgc3RhdGUuc2x1ZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbG9hZEltYWdlKHN0YXRlLnNsdWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGluaXRpYWxpemUgdGhlIGltYWdlcyBzZXJ2aWNlXG4gICAgICAgIGltYWdlcy5pbml0KCk7XG4gICAgICAgIC8vIGRpc3BsYXkgdGhlIGZpcnN0IGltYWdlXG4gICAgICAgIGxvYWRJbWFnZShJTUFHRV9JRCkudGhlbihwdXNoU3RhdGUpO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENhbnZhc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFpbiBjb250cm9sbGVyIGZvciB0aGUgYW5ub3RhdGlvbiBjYW52YXMgZWxlbWVudFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NhbnZhc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBJbWFnZSwgbWFwQW5ub3RhdGlvbnMsIG1hcCwgJHRpbWVvdXQsIGRlYm91bmNlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuXG5cdFx0Ly8gdXBkYXRlIHRoZSBVUkwgcGFyYW1ldGVyc1xuXHRcdG1hcC5vbignbW92ZWVuZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBlbWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnY2FudmFzLm1vdmVlbmQnLCB7XG4gICAgICAgICAgICAgICAgICAgIGNlbnRlcjogbWFwVmlldy5nZXRDZW50ZXIoKSxcbiAgICAgICAgICAgICAgICAgICAgem9vbTogbWFwVmlldy5nZXRab29tKClcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGRvbnQgdXBkYXRlIGltbWVkaWF0ZWx5IGJ1dCB3YWl0IGZvciBwb3NzaWJsZSBuZXcgY2hhbmdlc1xuICAgICAgICAgICAgZGVib3VuY2UoZW1pdCwgMTAwLCAnYW5ub3RhdG9yLmNhbnZhcy5tb3ZlZW5kJyk7XG5cdFx0fSk7XG5cbiAgICAgICAgbWFwLm9uKCdjaGFuZ2U6dmlldycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuICAgICAgICB9KTtcblxuXHRcdG1hcEltYWdlLmluaXQoJHNjb3BlKTtcblx0XHRtYXBBbm5vdGF0aW9ucy5pbml0KCRzY29wZSk7XG5cblx0XHR2YXIgdXBkYXRlU2l6ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdC8vIHdvcmthcm91bmQsIHNvIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQgKmFmdGVyKiB0aGUgYW5ndWxhciBkaWdlc3Rcblx0XHRcdC8vIGFuZCAqYWZ0ZXIqIHRoZSBmb2xkb3V0IHdhcyByZW5kZXJlZFxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBuZWVkcyB0byBiZSB3cmFwcGVkIGluIGFuIGV4dHJhIGZ1bmN0aW9uIHNpbmNlIHVwZGF0ZVNpemUgYWNjZXB0cyBhcmd1bWVudHNcblx0XHRcdFx0bWFwLnVwZGF0ZVNpemUoKTtcblx0XHRcdH0sIDUwLCBmYWxzZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5vcGVuJywgdXBkYXRlU2l6ZSk7XG5cdFx0JHNjb3BlLiRvbignc2lkZWJhci5mb2xkb3V0LmNsb3NlJywgdXBkYXRlU2l6ZSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENhdGVnb3JpZXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyIGxhYmVsIGNhdGVnb3JpZXMgZm9sZG91dFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NhdGVnb3JpZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbGFiZWxzLCBrZXlib2FyZCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBtYXhpbXVtIG51bWJlciBvZiBhbGxvd2VkIGZhdm91cml0ZXNcbiAgICAgICAgdmFyIG1heEZhdm91cml0ZXMgPSA5O1xuICAgICAgICB2YXIgZmF2b3VyaXRlc1N0b3JhZ2VLZXkgPSAnZGlhcy5hbm5vdGF0aW9ucy5sYWJlbC1mYXZvdXJpdGVzJztcblxuICAgICAgICAvLyBzYXZlcyB0aGUgSURzIG9mIHRoZSBmYXZvdXJpdGVzIGluIGxvY2FsU3RvcmFnZVxuICAgICAgICB2YXIgc3RvcmVGYXZvdXJpdGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRtcCA9ICRzY29wZS5mYXZvdXJpdGVzLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmlkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2Zhdm91cml0ZXNTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KHRtcCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmVzdG9yZXMgdGhlIGZhdm91cml0ZXMgZnJvbSB0aGUgSURzIGluIGxvY2FsU3RvcmFnZVxuICAgICAgICB2YXIgbG9hZEZhdm91cml0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtmYXZvdXJpdGVzU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgICAgICB2YXIgdG1wID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlW2Zhdm91cml0ZXNTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMgPSAkc2NvcGUuY2F0ZWdvcmllcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gb25seSB0YWtlIHRob3NlIGNhdGVnb3JpZXMgYXMgZmF2b3VyaXRlcyB0aGF0IGFyZSBhdmFpbGFibGUgZm9yIHRoaXMgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRtcC5pbmRleE9mKGl0ZW0uaWQpICE9PSAtMTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgY2hvb3NlRmF2b3VyaXRlID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gMCAmJiBpbmRleCA8ICRzY29wZS5mYXZvdXJpdGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RJdGVtKCRzY29wZS5mYXZvdXJpdGVzW2luZGV4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmhvdGtleXNNYXAgPSBbJ/Cdn60nLCAn8J2fricsICfwnZ+vJywgJ/Cdn7AnLCAn8J2fsScsICfwnZ+yJywgJ/Cdn7MnLCAn8J2ftCcsICfwnZ+1J107XG4gICAgICAgICRzY29wZS5jYXRlZ29yaWVzID0gW107XG4gICAgICAgICRzY29wZS5mYXZvdXJpdGVzID0gW107XG4gICAgICAgIGxhYmVscy5wcm9taXNlLnRoZW4oZnVuY3Rpb24gKGFsbCkge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGFsbCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5jYXRlZ29yaWVzID0gJHNjb3BlLmNhdGVnb3JpZXMuY29uY2F0KGFsbFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvYWRGYXZvdXJpdGVzKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS5jYXRlZ29yaWVzVHJlZSA9IGxhYmVscy5nZXRUcmVlKCk7XG5cbiAgICAgICAgJHNjb3BlLnNlbGVjdEl0ZW0gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgbGFiZWxzLnNldFNlbGVjdGVkKGl0ZW0pO1xuICAgICAgICAgICAgJHNjb3BlLnNlYXJjaENhdGVnb3J5ID0gJyc7IC8vIGNsZWFyIHNlYXJjaCBmaWVsZFxuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCBpdGVtKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNGYXZvdXJpdGUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5mYXZvdXJpdGVzLmluZGV4T2YoaXRlbSkgIT09IC0xO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGFkZHMgYSBuZXcgaXRlbSB0byB0aGUgZmF2b3VyaXRlcyBvciByZW1vdmVzIGl0IGlmIGl0IGlzIGFscmVhZHkgYSBmYXZvdXJpdGVcbiAgICAgICAgJHNjb3BlLnRvZ2dsZUZhdm91cml0ZSA9IGZ1bmN0aW9uIChlLCBpdGVtKSB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gJHNjb3BlLmZhdm91cml0ZXMuaW5kZXhPZihpdGVtKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEgJiYgJHNjb3BlLmZhdm91cml0ZXMubGVuZ3RoIDwgbWF4RmF2b3VyaXRlcykge1xuICAgICAgICAgICAgICAgICRzY29wZS5mYXZvdXJpdGVzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5mYXZvdXJpdGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdG9yZUZhdm91cml0ZXMoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXR1cm5zIHdoZXRoZXIgdGhlIHVzZXIgaXMgc3RpbGwgYWxsb3dlZCB0byBhZGQgZmF2b3VyaXRlc1xuICAgICAgICAkc2NvcGUuZmF2b3VyaXRlc0xlZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmZhdm91cml0ZXMubGVuZ3RoIDwgbWF4RmF2b3VyaXRlcztcbiAgICAgICAgfTtcblxuICAgICAgICBrZXlib2FyZC5vbignMScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSgwKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoMSk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCczJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDIpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignNCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSgzKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoNCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc2JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDUpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignNycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg2KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoNyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDgpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDb25maWRlbmNlQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgY29uZmlkZW5jZSBjb250cm9sXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQ29uZmlkZW5jZUNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5jb25maWRlbmNlID0gMS4wO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnY29uZmlkZW5jZScsIGZ1bmN0aW9uIChjb25maWRlbmNlKSB7XG5cdFx0XHRsYWJlbHMuc2V0Q3VycmVudENvbmZpZGVuY2UocGFyc2VGbG9hdChjb25maWRlbmNlKSk7XG5cblx0XHRcdGlmIChjb25maWRlbmNlIDw9IDAuMjUpIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC1kYW5nZXInO1xuXHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNSApIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC13YXJuaW5nJztcblx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjc1ICkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXN1Y2Nlc3MnO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC1wcmltYXJ5Jztcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQ29udHJvbHNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyIGNvbnRyb2wgYnV0dG9uc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NvbnRyb2xzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEFubm90YXRpb25zLCBsYWJlbHMsIG1zZywgJGF0dHJzLCBrZXlib2FyZCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGRyYXdpbmcgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5zZWxlY3RTaGFwZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0XHRpZiAoIWxhYmVscy5oYXNTZWxlY3RlZCgpKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdzaWRlYmFyLmZvbGRvdXQuZG8tb3BlbicsICdjYXRlZ29yaWVzJyk7XG5cdFx0XHRcdG1zZy5pbmZvKCRhdHRycy5zZWxlY3RDYXRlZ29yeSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0bWFwQW5ub3RhdGlvbnMuZmluaXNoRHJhd2luZygpO1xuXG5cdFx0XHRpZiAobmFtZSA9PT0gbnVsbCB8fCAoZHJhd2luZyAmJiAkc2NvcGUuc2VsZWN0ZWRTaGFwZSA9PT0gbmFtZSkpIHtcblx0XHRcdFx0JHNjb3BlLnNlbGVjdGVkU2hhcGUgPSAnJztcblx0XHRcdFx0ZHJhd2luZyA9IGZhbHNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLnNlbGVjdGVkU2hhcGUgPSBuYW1lO1xuXHRcdFx0XHRtYXBBbm5vdGF0aW9ucy5zdGFydERyYXdpbmcobmFtZSk7XG5cdFx0XHRcdGRyYXdpbmcgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH07XG5cbiAgICAgICAgLy8gZGVzZWxlY3QgZHJhd2luZyB0b29sIG9uIGVzY2FwZVxuICAgICAgICBrZXlib2FyZC5vbigyNywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKG51bGwpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignYScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnUG9pbnQnKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ1JlY3RhbmdsZScpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnQ2lyY2xlJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdmJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdMaW5lU3RyaW5nJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdnJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdQb2x5Z29uJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBNaW5pbWFwQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgbWluaW1hcCBpbiB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ01pbmltYXBDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwLCBtYXBJbWFnZSwgJGVsZW1lbnQsIHN0eWxlcykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciB2aWV3cG9ydFNvdXJjZSA9IG5ldyBvbC5zb3VyY2UuVmVjdG9yKCk7XG5cblx0XHR2YXIgbWluaW1hcCA9IG5ldyBvbC5NYXAoe1xuXHRcdFx0dGFyZ2V0OiAnbWluaW1hcCcsXG5cdFx0XHQvLyByZW1vdmUgY29udHJvbHNcblx0XHRcdGNvbnRyb2xzOiBbXSxcblx0XHRcdC8vIGRpc2FibGUgaW50ZXJhY3Rpb25zXG5cdFx0XHRpbnRlcmFjdGlvbnM6IFtdXG5cdFx0fSk7XG5cbiAgICAgICAgdmFyIG1hcFNpemUgPSBtYXAuZ2V0U2l6ZSgpO1xuICAgICAgICB2YXIgbWFwVmlldyA9IG1hcC5nZXRWaWV3KCk7XG5cblx0XHQvLyBnZXQgdGhlIHNhbWUgbGF5ZXJzIHRoYW4gdGhlIG1hcFxuXHRcdG1pbmltYXAuYWRkTGF5ZXIobWFwSW1hZ2UuZ2V0TGF5ZXIoKSk7XG4gICAgICAgIG1pbmltYXAuYWRkTGF5ZXIobmV3IG9sLmxheWVyLlZlY3Rvcih7XG4gICAgICAgICAgICBzb3VyY2U6IHZpZXdwb3J0U291cmNlLFxuICAgICAgICAgICAgc3R5bGU6IHN0eWxlcy52aWV3cG9ydFxuICAgICAgICB9KSk7XG5cblx0XHR2YXIgdmlld3BvcnQgPSBuZXcgb2wuRmVhdHVyZSgpO1xuXHRcdHZpZXdwb3J0U291cmNlLmFkZEZlYXR1cmUodmlld3BvcnQpO1xuXG5cdFx0Ly8gcmVmcmVzaCB0aGUgdmlldyAodGhlIGltYWdlIHNpemUgY291bGQgaGF2ZSBiZWVuIGNoYW5nZWQpXG5cdFx0JHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtaW5pbWFwLnNldFZpZXcobmV3IG9sLlZpZXcoe1xuXHRcdFx0XHRwcm9qZWN0aW9uOiBtYXBJbWFnZS5nZXRQcm9qZWN0aW9uKCksXG5cdFx0XHRcdGNlbnRlcjogb2wuZXh0ZW50LmdldENlbnRlcihtYXBJbWFnZS5nZXRFeHRlbnQoKSksXG5cdFx0XHRcdHpvb206IDBcblx0XHRcdH0pKTtcblx0XHR9KTtcblxuXHRcdC8vIG1vdmUgdGhlIHZpZXdwb3J0IHJlY3RhbmdsZSBvbiB0aGUgbWluaW1hcFxuXHRcdHZhciByZWZyZXNoVmlld3BvcnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2aWV3cG9ydC5zZXRHZW9tZXRyeShvbC5nZW9tLlBvbHlnb24uZnJvbUV4dGVudChtYXBWaWV3LmNhbGN1bGF0ZUV4dGVudChtYXBTaXplKSkpO1xuXHRcdH07XG5cbiAgICAgICAgbWFwLm9uKCdjaGFuZ2U6c2l6ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcFNpemUgPSBtYXAuZ2V0U2l6ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBtYXAub24oJ2NoYW5nZTp2aWV3JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWFwVmlldyA9IG1hcC5nZXRWaWV3KCk7XG4gICAgICAgIH0pO1xuXG5cdFx0bWFwLm9uKCdwb3N0Y29tcG9zZScsIHJlZnJlc2hWaWV3cG9ydCk7XG5cblx0XHR2YXIgZHJhZ1ZpZXdwb3J0ID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdG1hcFZpZXcuc2V0Q2VudGVyKGUuY29vcmRpbmF0ZSk7XG5cdFx0fTtcblxuXHRcdG1pbmltYXAub24oJ3BvaW50ZXJkcmFnJywgZHJhZ1ZpZXdwb3J0KTtcblxuXHRcdCRlbGVtZW50Lm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC51bigncG9pbnRlcmRyYWcnLCBkcmFnVmlld3BvcnQpO1xuXHRcdH0pO1xuXG5cdFx0JGVsZW1lbnQub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtaW5pbWFwLm9uKCdwb2ludGVyZHJhZycsIGRyYWdWaWV3cG9ydCk7XG5cdFx0fSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNlbGVjdGVkTGFiZWxDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzZWxlY3RlZCBsYWJlbCBkaXNwbGF5IGluIHRoZSBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTZWxlY3RlZExhYmVsQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGxhYmVscykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5nZXRTZWxlY3RlZExhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTaWRlYmFyQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NpZGViYXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgbWFwQW5ub3RhdGlvbnMsIGtleWJvYXJkKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGZvbGRvdXRTdG9yYWdlS2V5ID0gJ2RpYXMuYW5ub3RhdGlvbnMuc2lkZWJhci1mb2xkb3V0JztcblxuICAgICAgICAkc2NvcGUuZm9sZG91dCA9ICcnO1xuXG5cdFx0JHNjb3BlLm9wZW5Gb2xkb3V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldID0gbmFtZTtcbiAgICAgICAgICAgICRzY29wZS5mb2xkb3V0ID0gbmFtZTtcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2lkZWJhci5mb2xkb3V0Lm9wZW4nLCBuYW1lKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNsb3NlRm9sZG91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShmb2xkb3V0U3RvcmFnZUtleSk7XG5cdFx0XHQkc2NvcGUuZm9sZG91dCA9ICcnO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzaWRlYmFyLmZvbGRvdXQuY2xvc2UnKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUZvbGRvdXQgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0aWYgKCRzY29wZS5mb2xkb3V0ID09PSBuYW1lKSB7XG5cdFx0XHRcdCRzY29wZS5jbG9zZUZvbGRvdXQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5vcGVuRm9sZG91dChuYW1lKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLmRlbGV0ZVNlbGVjdGVkQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAobWFwQW5ub3RhdGlvbnMuZ2V0U2VsZWN0ZWRGZWF0dXJlcygpLmdldExlbmd0aCgpID4gMCAmJiBjb25maXJtKCdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIGFsbCBzZWxlY3RlZCBhbm5vdGF0aW9ucz8nKSkge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmRlbGV0ZVNlbGVjdGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5kby1vcGVuJywgZnVuY3Rpb24gKGUsIG5hbWUpIHtcbiAgICAgICAgICAgICRzY29wZS5vcGVuRm9sZG91dChuYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oOSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICRzY29wZS50b2dnbGVGb2xkb3V0KCdjYXRlZ29yaWVzJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDQ2LCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZVNlbGVjdGVkQW5ub3RhdGlvbnMoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gdGhlIGN1cnJlbnRseSBvcGVuZWQgc2lkZWJhci0nZXh0ZW5zaW9uJyBpcyByZW1lbWJlcmVkIHRocm91Z2ggbG9jYWxTdG9yYWdlXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW2ZvbGRvdXRTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgJHNjb3BlLm9wZW5Gb2xkb3V0KHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldKTtcbiAgICAgICAgfVxuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGFubm90YXRpb25MaXN0SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBbiBhbm5vdGF0aW9uIGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5kaXJlY3RpdmUoJ2Fubm90YXRpb25MaXN0SXRlbScsIGZ1bmN0aW9uIChsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRzY29wZTogdHJ1ZSxcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0JHNjb3BlLnNoYXBlQ2xhc3MgPSAnaWNvbi0nICsgJHNjb3BlLmFubm90YXRpb24uc2hhcGUudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0XHQkc2NvcGUuc2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS5pc1NlbGVjdGVkKCRzY29wZS5hbm5vdGF0aW9uLmlkKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuYXR0YWNoTGFiZWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0bGFiZWxzLmF0dGFjaFRvQW5ub3RhdGlvbigkc2NvcGUuYW5ub3RhdGlvbik7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLnJlbW92ZUxhYmVsID0gZnVuY3Rpb24gKGxhYmVsKSB7XG5cdFx0XHRcdFx0bGFiZWxzLnJlbW92ZUZyb21Bbm5vdGF0aW9uKCRzY29wZS5hbm5vdGF0aW9uLCBsYWJlbCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmNhbkF0dGFjaExhYmVsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuc2VsZWN0ZWQoKSAmJiBsYWJlbHMuaGFzU2VsZWN0ZWQoKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudExhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkO1xuXG5cdFx0XHRcdCRzY29wZS5jdXJyZW50Q29uZmlkZW5jZSA9IGxhYmVscy5nZXRDdXJyZW50Q29uZmlkZW5jZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhYmVsQ2F0ZWdvcnlJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgbGFiZWwgY2F0ZWdvcnkgbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmRpcmVjdGl2ZSgnbGFiZWxDYXRlZ29yeUl0ZW0nLCBmdW5jdGlvbiAoJGNvbXBpbGUsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdDJyxcblxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdsYWJlbC1pdGVtLmh0bWwnLFxuXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHdhaXQgZm9yIHRoaXMgZWxlbWVudCB0byBiZSByZW5kZXJlZCB1bnRpbCB0aGUgY2hpbGRyZW4gYXJlXG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kZWQsIG90aGVyd2lzZSB0aGVyZSB3b3VsZCBiZSB0b28gbXVjaCByZWN1cnNpb24gZm9yXG4gICAgICAgICAgICAgICAgLy8gYW5ndWxhclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnbGFiZWwtc3VidHJlZS5odG1sJykpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoY29udGVudCkoc2NvcGUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIHRoZSBzdWJ0cmVlIG9mIHRoaXMgaXRlbVxuICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaGFzIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzRXhwYW5kYWJsZSA9ICRzY29wZS50cmVlICYmICEhJHNjb3BlLnRyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8gaGFuZGxlIHRoaXMgYnkgdGhlIGV2ZW50IHJhdGhlciB0aGFuIGFuIG93biBjbGljayBoYW5kbGVyIHRvXG4gICAgICAgICAgICAgICAgLy8gZGVhbCB3aXRoIGNsaWNrIGFuZCBzZWFyY2ggZmllbGQgYWN0aW9ucyBpbiBhIHVuaWZpZWQgd2F5XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGZ1bmN0aW9uIChlLCBjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbiBpdGVtIGlzIHNlbGVjdGVkLCBpdHMgc3VidHJlZSBhbmQgYWxsIHBhcmVudCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgb3BlbmVkXG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5pZCA9PT0gY2F0ZWdvcnkuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBoaXRzIGFsbCBwYXJlbnQgc2NvcGVzL2l0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGEgY2hpbGQgaXRlbSB3YXMgc2VsZWN0ZWQsIHRoaXMgaXRlbSBzaG91bGQgYmUgb3BlbmVkLCB0b29cbiAgICAgICAgICAgICAgICAvLyBzbyB0aGUgc2VsZWN0ZWQgaXRlbSBiZWNvbWVzIHZpc2libGUgaW4gdGhlIHRyZWVcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3AgcHJvcGFnYXRpb24gaWYgdGhpcyBpcyBhIHJvb3QgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0ucGFyZW50X2lkID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYWJlbEl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQW4gYW5ub3RhdGlvbiBsYWJlbCBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZGlyZWN0aXZlKCdsYWJlbEl0ZW0nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFx0XHR2YXIgY29uZmlkZW5jZSA9ICRzY29wZS5hbm5vdGF0aW9uTGFiZWwuY29uZmlkZW5jZTtcblxuXHRcdFx0XHRpZiAoY29uZmlkZW5jZSA8PSAwLjI1KSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLWRhbmdlcic7XG5cdFx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjUgKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXdhcm5pbmcnO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC43NSApIHtcblx0XHRcdFx0XHQkc2NvcGUuY2xhc3MgPSAnbGFiZWwtc3VjY2Vzcyc7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXByaW1hcnknO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgZGVib3VuY2VcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQSBkZWJvdW5jZSBzZXJ2aWNlIHRvIHBlcmZvcm0gYW4gYWN0aW9uIG9ubHkgd2hlbiB0aGlzIGZ1bmN0aW9uXG4gKiB3YXNuJ3QgY2FsbGVkIGFnYWluIGluIGEgc2hvcnQgcGVyaW9kIG9mIHRpbWUuXG4gKiBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTMzMjAwMTYvMTc5NjUyM1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmZhY3RvcnkoJ2RlYm91bmNlJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkcSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHRpbWVvdXRzID0ge307XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gKGZ1bmMsIHdhaXQsIGlkKSB7XG5cdFx0XHQvLyBDcmVhdGUgYSBkZWZlcnJlZCBvYmplY3QgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gd2UgbmVlZCB0b1xuXHRcdFx0Ly8gYWN0dWFsbHkgY2FsbCB0aGUgZnVuY1xuXHRcdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHRcdFx0dmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGltZW91dHNbaWRdID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKSk7XG5cdFx0XHRcdFx0ZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpZiAodGltZW91dHNbaWRdKSB7XG5cdFx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRzW2lkXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGltZW91dHNbaWRdID0gJHRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHRcdH0pKCk7XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIG1hcFxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIGZhY3RvcnkgaGFuZGxpbmcgT3BlbkxheWVycyBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5mYWN0b3J5KCdtYXAnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgbWFwID0gbmV3IG9sLk1hcCh7XG5cdFx0XHR0YXJnZXQ6ICdjYW52YXMnLFxuICAgICAgICAgICAgcmVuZGVyZXI6ICdjYW52YXMnLFxuXHRcdFx0Y29udHJvbHM6IFtcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuWm9vbSgpLFxuXHRcdFx0XHRuZXcgb2wuY29udHJvbC5ab29tVG9FeHRlbnQoKSxcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuRnVsbFNjcmVlbigpXG5cdFx0XHRdLFxuICAgICAgICAgICAgaW50ZXJhY3Rpb25zOiBvbC5pbnRlcmFjdGlvbi5kZWZhdWx0cyh7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQ6IGZhbHNlXG4gICAgICAgICAgICB9KVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIG1hcDtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgYW5ub3RhdGlvbnNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIHRoZSBhbm5vdGF0aW9ucyB0byBtYWtlIHRoZW0gYXZhaWxhYmxlIGluIG11bHRpcGxlIGNvbnRyb2xsZXJzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2Fubm90YXRpb25zJywgZnVuY3Rpb24gKEFubm90YXRpb24sIHNoYXBlcywgbGFiZWxzLCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBhbm5vdGF0aW9ucztcblxuXHRcdHZhciByZXNvbHZlU2hhcGVOYW1lID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdGFubm90YXRpb24uc2hhcGUgPSBzaGFwZXMuZ2V0TmFtZShhbm5vdGF0aW9uLnNoYXBlX2lkKTtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR2YXIgYWRkQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHRhbm5vdGF0aW9ucy5wdXNoKGFubm90YXRpb24pO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb247XG5cdFx0fTtcblxuXHRcdHRoaXMucXVlcnkgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRhbm5vdGF0aW9ucyA9IEFubm90YXRpb24ucXVlcnkocGFyYW1zKTtcblx0XHRcdGFubm90YXRpb25zLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKGEpIHtcblx0XHRcdFx0YS5mb3JFYWNoKHJlc29sdmVTaGFwZU5hbWUpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnM7XG5cdFx0fTtcblxuXHRcdHRoaXMuYWRkID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0aWYgKCFwYXJhbXMuc2hhcGVfaWQgJiYgcGFyYW1zLnNoYXBlKSB7XG5cdFx0XHRcdHBhcmFtcy5zaGFwZV9pZCA9IHNoYXBlcy5nZXRJZChwYXJhbXMuc2hhcGUpO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGxhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkKCk7XG5cdFx0XHRwYXJhbXMubGFiZWxfaWQgPSBsYWJlbC5pZDtcblx0XHRcdHBhcmFtcy5jb25maWRlbmNlID0gbGFiZWxzLmdldEN1cnJlbnRDb25maWRlbmNlKCk7XG5cdFx0XHR2YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uYWRkKHBhcmFtcyk7XG5cdFx0XHRhbm5vdGF0aW9uLiRwcm9taXNlXG5cdFx0XHQgICAgICAgICAgLnRoZW4ocmVzb2x2ZVNoYXBlTmFtZSlcblx0XHRcdCAgICAgICAgICAudGhlbihhZGRBbm5vdGF0aW9uKVxuXHRcdFx0ICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG5cblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHQvLyB1c2UgaW5kZXggdG8gc2VlIGlmIHRoZSBhbm5vdGF0aW9uIGV4aXN0cyBpbiB0aGUgYW5ub3RhdGlvbnMgbGlzdFxuXHRcdFx0dmFyIGluZGV4ID0gYW5ub3RhdGlvbnMuaW5kZXhPZihhbm5vdGF0aW9uKTtcblx0XHRcdGlmIChpbmRleCA+IC0xKSB7XG5cdFx0XHRcdHJldHVybiBhbm5vdGF0aW9uLiRkZWxldGUoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdC8vIHVwZGF0ZSB0aGUgaW5kZXggc2luY2UgdGhlIGFubm90YXRpb25zIGxpc3QgbWF5IGhhdmUgYmVlbiBcblx0XHRcdFx0XHQvLyBtb2RpZmllZCBpbiB0aGUgbWVhbnRpbWVcblx0XHRcdFx0XHRpbmRleCA9IGFubm90YXRpb25zLmluZGV4T2YoYW5ub3RhdGlvbik7XG5cdFx0XHRcdFx0YW5ub3RhdGlvbnMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0fSwgbXNnLnJlc3BvbnNlRXJyb3IpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLmZvckVhY2ggPSBmdW5jdGlvbiAoZm4pIHtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9ucy5mb3JFYWNoKGZuKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5jdXJyZW50ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb25zO1xuXHRcdH07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBpbWFnZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFuYWdlcyAocHJlLSlsb2FkaW5nIG9mIHRoZSBpbWFnZXMgdG8gYW5ub3RhdGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnaW1hZ2VzJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIFRyYW5zZWN0SW1hZ2UsIFVSTCwgJHEsIGZpbHRlclN1YnNldCwgVFJBTlNFQ1RfSUQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cdFx0Ly8gYXJyYXkgb2YgYWxsIGltYWdlIElEcyBvZiB0aGUgdHJhbnNlY3Rcblx0XHR2YXIgaW1hZ2VJZHMgPSBbXTtcblx0XHQvLyBtYXhpbXVtIG51bWJlciBvZiBpbWFnZXMgdG8gaG9sZCBpbiBidWZmZXJcblx0XHR2YXIgTUFYX0JVRkZFUl9TSVpFID0gMTA7XG5cdFx0Ly8gYnVmZmVyIG9mIGFscmVhZHkgbG9hZGVkIGltYWdlc1xuXHRcdHZhciBidWZmZXIgPSBbXTtcblxuXHRcdC8vIHRoZSBjdXJyZW50bHkgc2hvd24gaW1hZ2Vcblx0XHR0aGlzLmN1cnJlbnRJbWFnZSA9IHVuZGVmaW5lZDtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIG5leHQgSUQgb2YgdGhlIHNwZWNpZmllZCBpbWFnZSBvciB0aGUgbmV4dCBJRCBvZiB0aGVcblx0XHQgKiBjdXJyZW50IGltYWdlIGlmIG5vIGltYWdlIHdhcyBzcGVjaWZpZWQuXG5cdFx0ICovXG5cdFx0dmFyIG5leHRJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0aWQgPSBpZCB8fCBfdGhpcy5jdXJyZW50SW1hZ2UuX2lkO1xuXHRcdFx0dmFyIGluZGV4ID0gaW1hZ2VJZHMuaW5kZXhPZihpZCk7XG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHNbKGluZGV4ICsgMSkgJSBpbWFnZUlkcy5sZW5ndGhdO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBwcmV2aW91cyBJRCBvZiB0aGUgc3BlY2lmaWVkIGltYWdlIG9yIHRoZSBwcmV2aW91cyBJRCBvZlxuXHRcdCAqIHRoZSBjdXJyZW50IGltYWdlIGlmIG5vIGltYWdlIHdhcyBzcGVjaWZpZWQuXG5cdFx0ICovXG5cdFx0dmFyIHByZXZJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0aWQgPSBpZCB8fCBfdGhpcy5jdXJyZW50SW1hZ2UuX2lkO1xuXHRcdFx0dmFyIGluZGV4ID0gaW1hZ2VJZHMuaW5kZXhPZihpZCk7XG5cdFx0XHR2YXIgbGVuZ3RoID0gaW1hZ2VJZHMubGVuZ3RoO1xuXHRcdFx0cmV0dXJuIGltYWdlSWRzWyhpbmRleCAtIDEgKyBsZW5ndGgpICUgbGVuZ3RoXTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgc3BlY2lmaWVkIGltYWdlIGZyb20gdGhlIGJ1ZmZlciBvciBgdW5kZWZpbmVkYCBpZiBpdCBpc1xuXHRcdCAqIG5vdCBidWZmZXJlZC5cblx0XHQgKi9cblx0XHR2YXIgZ2V0SW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdGZvciAodmFyIGkgPSBidWZmZXIubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0aWYgKGJ1ZmZlcltpXS5faWQgPT0gaWQpIHJldHVybiBidWZmZXJbaV07XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNldHMgdGhlIHNwZWNpZmllZCBpbWFnZSB0byBhcyB0aGUgY3VycmVudGx5IHNob3duIGltYWdlLlxuXHRcdCAqL1xuXHRcdHZhciBzaG93ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRfdGhpcy5jdXJyZW50SW1hZ2UgPSBnZXRJbWFnZShpZCk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIExvYWRzIHRoZSBzcGVjaWZpZWQgaW1hZ2UgZWl0aGVyIGZyb20gYnVmZmVyIG9yIGZyb20gdGhlIGV4dGVybmFsXG5cdFx0ICogcmVzb3VyY2UuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgZ2V0cyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpc1xuXHRcdCAqIGxvYWRlZC5cblx0XHQgKi9cblx0XHR2YXIgZmV0Y2hJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdHZhciBpbWcgPSBnZXRJbWFnZShpZCk7XG5cblx0XHRcdGlmIChpbWcpIHtcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbWcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG5cdFx0XHRcdGltZy5faWQgPSBpZDtcblx0XHRcdFx0aW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRidWZmZXIucHVzaChpbWcpO1xuXHRcdFx0XHRcdC8vIGNvbnRyb2wgbWF4aW11bSBidWZmZXIgc2l6ZVxuXHRcdFx0XHRcdGlmIChidWZmZXIubGVuZ3RoID4gTUFYX0JVRkZFUl9TSVpFKSB7XG5cdFx0XHRcdFx0XHRidWZmZXIuc2hpZnQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbWcpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpbWcub25lcnJvciA9IGZ1bmN0aW9uIChtc2cpIHtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3QobXNnKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aW1nLnNyYyA9IFVSTCArIFwiL2FwaS92MS9pbWFnZXMvXCIgKyBpZCArIFwiL2ZpbGVcIjtcblx0XHRcdH1cblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdpbWFnZS5mZXRjaGluZycsIGltZyk7XG5cblx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBJbml0aWFsaXplcyB0aGUgc2VydmljZSBmb3IgYSBnaXZlbiB0cmFuc2VjdC4gUmV0dXJucyBhIHByb21pc2UgdGhhdFxuXHRcdCAqIGlzIHJlc29sdmVkLCB3aGVuIHRoZSBzZXJ2aWNlIGlzIGluaXRpYWxpemVkLlxuXHRcdCAqL1xuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGltYWdlSWRzID0gVHJhbnNlY3RJbWFnZS5xdWVyeSh7dHJhbnNlY3RfaWQ6IFRSQU5TRUNUX0lEfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGxvb2sgZm9yIGEgc2VxdWVuY2Ugb2YgaW1hZ2UgSURzIGluIGxvY2FsIHN0b3JhZ2UuXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBzZXF1ZW5jZSBpcyBwcm9kdWNlcyBieSB0aGUgdHJhbnNlY3QgaW5kZXggcGFnZSB3aGVuIHRoZSBpbWFnZXMgYXJlXG4gICAgICAgICAgICAgICAgLy8gc29ydGVkIG9yIGZpbHRlcmVkLiB3ZSB3YW50IHRvIHJlZmxlY3QgdGhlIHNhbWUgb3JkZXJpbmcgb3IgZmlsdGVyaW5nIGhlcmVcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGUgYW5ub3RhdG9yXG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlZFNlcXVlbmNlID0gd2luZG93LmxvY2FsU3RvcmFnZVsnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5pbWFnZXMnXTtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmVkU2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmVkU2VxdWVuY2UgPSBKU09OLnBhcnNlKHN0b3JlZFNlcXVlbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgc3VjaCBhIHN0b3JlZCBzZXF1ZW5jZSwgZmlsdGVyIG91dCBhbnkgaW1hZ2UgSURzIHRoYXQgZG8gbm90XG4gICAgICAgICAgICAgICAgICAgIC8vIGJlbG9uZyB0byB0aGUgdHJhbnNlY3QgKGFueSBtb3JlKSwgc2luY2Ugc29tZSBvZiB0aGVtIG1heSBoYXZlIGJlZW4gZGVsZXRlZFxuICAgICAgICAgICAgICAgICAgICAvLyBpbiB0aGUgbWVhbnRpbWVcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyU3Vic2V0KHN0b3JlZFNlcXVlbmNlLCBpbWFnZUlkcyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgcHJvbWlzZSBpcyBub3QgcmVtb3ZlZCB3aGVuIG92ZXJ3cml0aW5nIGltYWdlSWRzIHNpbmNlIHdlXG4gICAgICAgICAgICAgICAgICAgIC8vIG5lZWQgaXQgbGF0ZXIgb24uXG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlLiRwcm9taXNlID0gaW1hZ2VJZHMuJHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlLiRyZXNvbHZlZCA9IGltYWdlSWRzLiRyZXNvbHZlZDtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlbiBzZXQgdGhlIHN0b3JlZCBzZXF1ZW5jZSBhcyB0aGUgc2VxdWVuY2Ugb2YgaW1hZ2UgSURzIGluc3RlYWQgb2Ygc2ltcGx5XG4gICAgICAgICAgICAgICAgICAgIC8vIGFsbCBJRHMgYmVsb25naW5nIHRvIHRoZSB0cmFuc2VjdFxuICAgICAgICAgICAgICAgICAgICBpbWFnZUlkcyA9IHN0b3JlZFNlcXVlbmNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHMuJHByb21pc2U7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNob3cgdGhlIGltYWdlIHdpdGggdGhlIHNwZWNpZmllZCBJRC4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMuc2hvdyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIHByb21pc2UgPSBmZXRjaEltYWdlKGlkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzaG93KGlkKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyB3YWl0IGZvciBpbWFnZUlkcyB0byBiZSBsb2FkZWRcblx0XHRcdGltYWdlSWRzLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyBwcmUtbG9hZCBwcmV2aW91cyBhbmQgbmV4dCBpbWFnZXMgYnV0IGRvbid0IGRpc3BsYXkgdGhlbVxuXHRcdFx0XHRmZXRjaEltYWdlKG5leHRJZChpZCkpO1xuXHRcdFx0XHRmZXRjaEltYWdlKHByZXZJZChpZCkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBwcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBuZXh0IGltYWdlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzXG5cdFx0ICogcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXMgc2hvd24uXG5cdFx0ICovXG5cdFx0dGhpcy5uZXh0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF90aGlzLnNob3cobmV4dElkKCkpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBwcmV2aW91cyBpbWFnZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMucHJldiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfdGhpcy5zaG93KHByZXZJZCgpKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRDdXJyZW50SWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBrZXlib2FyZFxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIHRvIHJlZ2lzdGVyIGFuZCBtYW5hZ2Uga2V5cHJlc3MgZXZlbnRzIHdpdGggcHJpb3JpdGllc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2tleWJvYXJkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBtYXBzIGtleSBjb2Rlcy9jaGFyYWN0ZXJzIHRvIGFycmF5cyBvZiBsaXN0ZW5lcnNcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHt9O1xuXG4gICAgICAgIHZhciBleGVjdXRlQ2FsbGJhY2tzID0gZnVuY3Rpb24gKGxpc3QsIGUpIHtcbiAgICAgICAgICAgIC8vIGdvIGZyb20gaGlnaGVzdCBwcmlvcml0eSBkb3duXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gbGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrcyBjYW4gY2FuY2VsIGZ1cnRoZXIgcHJvcGFnYXRpb25cbiAgICAgICAgICAgICAgICBpZiAobGlzdFtpXS5jYWxsYmFjayhlKSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlS2V5RXZlbnRzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHZhciBjb2RlID0gZS5rZXlDb2RlO1xuICAgICAgICAgICAgdmFyIGNoYXJhY3RlciA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZS53aGljaCB8fCBjb2RlKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NvZGVdKSB7XG4gICAgICAgICAgICAgICAgZXhlY3V0ZUNhbGxiYWNrcyhsaXN0ZW5lcnNbY29kZV0sIGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NoYXJhY3Rlcl0pIHtcbiAgICAgICAgICAgICAgICBleGVjdXRlQ2FsbGJhY2tzKGxpc3RlbmVyc1tjaGFyYWN0ZXJdLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5RXZlbnRzKTtcblxuICAgICAgICAvLyByZWdpc3RlciBhIG5ldyBldmVudCBsaXN0ZW5lciBmb3IgdGhlIGtleSBjb2RlIG9yIGNoYXJhY3RlciB3aXRoIGFuIG9wdGlvbmFsIHByaW9yaXR5XG4gICAgICAgIC8vIGxpc3RlbmVycyB3aXRoIGhpZ2hlciBwcmlvcml0eSBhcmUgY2FsbGVkIGZpcnN0IGFuYyBjYW4gcmV0dXJuICdmYWxzZScgdG8gcHJldmVudCB0aGVcbiAgICAgICAgLy8gbGlzdGVuZXJzIHdpdGggbG93ZXIgcHJpb3JpdHkgZnJvbSBiZWluZyBjYWxsZWRcbiAgICAgICAgdGhpcy5vbiA9IGZ1bmN0aW9uIChjaGFyT3JDb2RlLCBjYWxsYmFjaywgcHJpb3JpdHkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2hhck9yQ29kZSA9PT0gJ3N0cmluZycgfHwgY2hhck9yQ29kZSBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICAgICAgICAgIGNoYXJPckNvZGUgPSBjaGFyT3JDb2RlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcbiAgICAgICAgICAgIHZhciBsaXN0ZW5lciA9IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IHByaW9yaXR5XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NoYXJPckNvZGVdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBsaXN0ZW5lcnNbY2hhck9yQ29kZV07XG4gICAgICAgICAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdFtpXS5wcmlvcml0eSA+PSBwcmlvcml0eSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IGxpc3QubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3Quc3BsaWNlKGksIDAsIGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzW2NoYXJPckNvZGVdID0gW2xpc3RlbmVyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyB1bnJlZ2lzdGVyIGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIHRoaXMub2ZmID0gZnVuY3Rpb24gKGNoYXJPckNvZGUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNoYXJPckNvZGUgPT09ICdzdHJpbmcnIHx8IGNoYXJPckNvZGUgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBjaGFyT3JDb2RlID0gY2hhck9yQ29kZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NoYXJPckNvZGVdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBsaXN0ZW5lcnNbY2hhck9yQ29kZV07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaXN0W2ldLmNhbGxiYWNrID09PSBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBsYWJlbHNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGZvciBhbm5vdGF0aW9uIGxhYmVscyB0byBwcm92aWRlIHNvbWUgY29udmVuaWVuY2UgZnVuY3Rpb25zLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2xhYmVscycsIGZ1bmN0aW9uIChBbm5vdGF0aW9uTGFiZWwsIExhYmVsLCBQcm9qZWN0TGFiZWwsIFByb2plY3QsIG1zZywgJHEsIFBST0pFQ1RfSURTKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZExhYmVsO1xuICAgICAgICB2YXIgY3VycmVudENvbmZpZGVuY2UgPSAxLjA7XG5cbiAgICAgICAgdmFyIGxhYmVscyA9IHt9O1xuXG4gICAgICAgIC8vIHRoaXMgcHJvbWlzZSBpcyByZXNvbHZlZCB3aGVuIGFsbCBsYWJlbHMgd2VyZSBsb2FkZWRcbiAgICAgICAgdGhpcy5wcm9taXNlID0gbnVsbDtcblxuICAgICAgICB0aGlzLmZldGNoRm9yQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICBpZiAoIWFubm90YXRpb24pIHJldHVybjtcblxuICAgICAgICAgICAgLy8gZG9uJ3QgZmV0Y2ggdHdpY2VcbiAgICAgICAgICAgIGlmICghYW5ub3RhdGlvbi5sYWJlbHMpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscyA9IEFubm90YXRpb25MYWJlbC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgIGFubm90YXRpb25faWQ6IGFubm90YXRpb24uaWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFubm90YXRpb24ubGFiZWxzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYXR0YWNoVG9Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IEFubm90YXRpb25MYWJlbC5hdHRhY2goe1xuICAgICAgICAgICAgICAgIGFubm90YXRpb25faWQ6IGFubm90YXRpb24uaWQsXG4gICAgICAgICAgICAgICAgbGFiZWxfaWQ6IHNlbGVjdGVkTGFiZWwuaWQsXG4gICAgICAgICAgICAgICAgY29uZmlkZW5jZTogY3VycmVudENvbmZpZGVuY2VcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsYWJlbC4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscy5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsYWJlbC4kcHJvbWlzZS5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG5cbiAgICAgICAgICAgIHJldHVybiBsYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJlbW92ZUZyb21Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24sIGxhYmVsKSB7XG4gICAgICAgICAgICAvLyB1c2UgaW5kZXggdG8gc2VlIGlmIHRoZSBsYWJlbCBleGlzdHMgZm9yIHRoZSBhbm5vdGF0aW9uXG4gICAgICAgICAgICB2YXIgaW5kZXggPSBhbm5vdGF0aW9uLmxhYmVscy5pbmRleE9mKGxhYmVsKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhYmVsLiRkZWxldGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGluZGV4IHNpbmNlIHRoZSBsYWJlbCBsaXN0IG1heSBoYXZlIGJlZW4gbW9kaWZpZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIG1lYW50aW1lXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gYW5ub3RhdGlvbi5sYWJlbHMuaW5kZXhPZihsYWJlbCk7XG4gICAgICAgICAgICAgICAgICAgIGFubm90YXRpb24ubGFiZWxzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgfSwgbXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0VHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge307XG4gICAgICAgICAgICB2YXIga2V5ID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBidWlsZCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBsYWJlbC5wYXJlbnRfaWQ7XG4gICAgICAgICAgICAgICAgaWYgKHRyZWVba2V5XVtwYXJlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XVtwYXJlbnRdLnB1c2gobGFiZWwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XVtwYXJlbnRdID0gW2xhYmVsXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnByb21pc2UudGhlbihmdW5jdGlvbiAobGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBsYWJlbHNba2V5XS5mb3JFYWNoKGJ1aWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbGFiZWxzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2V0U2VsZWN0ZWQgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkTGFiZWwgPSBsYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldFNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGVkTGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIXNlbGVjdGVkTGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRDdXJyZW50Q29uZmlkZW5jZSA9IGZ1bmN0aW9uIChjb25maWRlbmNlKSB7XG4gICAgICAgICAgICBjdXJyZW50Q29uZmlkZW5jZSA9IGNvbmZpZGVuY2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRDdXJyZW50Q29uZmlkZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50Q29uZmlkZW5jZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpbml0XG4gICAgICAgIChmdW5jdGlvbiAoX3RoaXMpIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBfdGhpcy5wcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIC8vIC0xIGJlY2F1c2Ugb2YgZ2xvYmFsIGxhYmVsc1xuICAgICAgICAgICAgdmFyIGZpbmlzaGVkID0gLTE7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFsbCBsYWJlbHMgYXJlIHRoZXJlLiBpZiB5ZXMsIHJlc29sdmVcbiAgICAgICAgICAgIHZhciBtYXliZVJlc29sdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCsrZmluaXNoZWQgPT09IFBST0pFQ1RfSURTLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGxhYmVscyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbGFiZWxzW251bGxdID0gTGFiZWwucXVlcnkobWF5YmVSZXNvbHZlKTtcblxuICAgICAgICAgICAgUFJPSkVDVF9JRFMuZm9yRWFjaChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgICAgICBQcm9qZWN0LmdldCh7aWQ6IGlkfSwgZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxzW3Byb2plY3QubmFtZV0gPSBQcm9qZWN0TGFiZWwucXVlcnkoe3Byb2plY3RfaWQ6IGlkfSwgbWF5YmVSZXNvbHZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSh0aGlzKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBtYXBBbm5vdGF0aW9uc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgaGFuZGxpbmcgdGhlIGFubm90YXRpb25zIGxheWVyIG9uIHRoZSBPcGVuTGF5ZXJzIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ21hcEFubm90YXRpb25zJywgZnVuY3Rpb24gKG1hcCwgaW1hZ2VzLCBhbm5vdGF0aW9ucywgZGVib3VuY2UsIHN0eWxlcykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBhbm5vdGF0aW9uRmVhdHVyZXMgPSBuZXcgb2wuQ29sbGVjdGlvbigpO1xuICAgICAgICB2YXIgYW5ub3RhdGlvblNvdXJjZSA9IG5ldyBvbC5zb3VyY2UuVmVjdG9yKHtcbiAgICAgICAgICAgIGZlYXR1cmVzOiBhbm5vdGF0aW9uRmVhdHVyZXNcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBhbm5vdGF0aW9uTGF5ZXIgPSBuZXcgb2wubGF5ZXIuVmVjdG9yKHtcbiAgICAgICAgICAgIHNvdXJjZTogYW5ub3RhdGlvblNvdXJjZSxcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZXMuZmVhdHVyZXMsXG4gICAgICAgICAgICB6SW5kZXg6IDEwMFxuICAgICAgICB9KTtcblxuXHRcdC8vIHNlbGVjdCBpbnRlcmFjdGlvbiB3b3JraW5nIG9uIFwic2luZ2xlY2xpY2tcIlxuXHRcdHZhciBzZWxlY3QgPSBuZXcgb2wuaW50ZXJhY3Rpb24uU2VsZWN0KHtcblx0XHRcdHN0eWxlOiBzdHlsZXMuaGlnaGxpZ2h0LFxuICAgICAgICAgICAgbGF5ZXJzOiBbYW5ub3RhdGlvbkxheWVyXSxcbiAgICAgICAgICAgIC8vIGVuYWJsZSBzZWxlY3RpbmcgbXVsdGlwbGUgb3ZlcmxhcHBpbmcgZmVhdHVyZXMgYXQgb25jZVxuICAgICAgICAgICAgbXVsdGk6IHRydWVcblx0XHR9KTtcblxuXHRcdHZhciBzZWxlY3RlZEZlYXR1cmVzID0gc2VsZWN0LmdldEZlYXR1cmVzKCk7XG5cblx0XHR2YXIgbW9kaWZ5ID0gbmV3IG9sLmludGVyYWN0aW9uLk1vZGlmeSh7XG5cdFx0XHRmZWF0dXJlczogYW5ub3RhdGlvbkZlYXR1cmVzLFxuXHRcdFx0Ly8gdGhlIFNISUZUIGtleSBtdXN0IGJlIHByZXNzZWQgdG8gZGVsZXRlIHZlcnRpY2VzLCBzb1xuXHRcdFx0Ly8gdGhhdCBuZXcgdmVydGljZXMgY2FuIGJlIGRyYXduIGF0IHRoZSBzYW1lIHBvc2l0aW9uXG5cdFx0XHQvLyBvZiBleGlzdGluZyB2ZXJ0aWNlc1xuXHRcdFx0ZGVsZXRlQ29uZGl0aW9uOiBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRyZXR1cm4gb2wuZXZlbnRzLmNvbmRpdGlvbi5zaGlmdEtleU9ubHkoZXZlbnQpICYmIG9sLmV2ZW50cy5jb25kaXRpb24uc2luZ2xlQ2xpY2soZXZlbnQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gZHJhd2luZyBpbnRlcmFjdGlvblxuXHRcdHZhciBkcmF3O1xuXG5cdFx0Ly8gY29udmVydCBhIHBvaW50IGFycmF5IHRvIGEgcG9pbnQgb2JqZWN0XG5cdFx0Ly8gcmUtaW52ZXJ0IHRoZSB5IGF4aXNcblx0XHR2YXIgY29udmVydEZyb21PTFBvaW50ID0gZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRyZXR1cm4ge3g6IHBvaW50WzBdLCB5OiBpbWFnZXMuY3VycmVudEltYWdlLmhlaWdodCAtIHBvaW50WzFdfTtcblx0XHR9O1xuXG5cdFx0Ly8gY29udmVydCBhIHBvaW50IG9iamVjdCB0byBhIHBvaW50IGFycmF5XG5cdFx0Ly8gaW52ZXJ0IHRoZSB5IGF4aXNcblx0XHR2YXIgY29udmVydFRvT0xQb2ludCA9IGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdFx0cmV0dXJuIFtwb2ludC54LCBpbWFnZXMuY3VycmVudEltYWdlLmhlaWdodCAtIHBvaW50LnldO1xuXHRcdH07XG5cblx0XHQvLyBhc3NlbWJsZXMgdGhlIGNvb3JkaW5hdGUgYXJyYXlzIGRlcGVuZGluZyBvbiB0aGUgZ2VvbWV0cnkgdHlwZVxuXHRcdC8vIHNvIHRoZXkgaGF2ZSBhIHVuaWZpZWQgZm9ybWF0XG5cdFx0dmFyIGdldENvb3JkaW5hdGVzID0gZnVuY3Rpb24gKGdlb21ldHJ5KSB7XG5cdFx0XHRzd2l0Y2ggKGdlb21ldHJ5LmdldFR5cGUoKSkge1xuXHRcdFx0XHRjYXNlICdDaXJjbGUnOlxuXHRcdFx0XHRcdC8vIHJhZGl1cyBpcyB0aGUgeCB2YWx1ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjaXJjbGVcblx0XHRcdFx0XHRyZXR1cm4gW2dlb21ldHJ5LmdldENlbnRlcigpLCBbZ2VvbWV0cnkuZ2V0UmFkaXVzKCksIDBdXTtcblx0XHRcdFx0Y2FzZSAnUG9seWdvbic6XG5cdFx0XHRcdGNhc2UgJ1JlY3RhbmdsZSc6XG5cdFx0XHRcdFx0cmV0dXJuIGdlb21ldHJ5LmdldENvb3JkaW5hdGVzKClbMF07XG5cdFx0XHRcdGNhc2UgJ1BvaW50Jzpcblx0XHRcdFx0XHRyZXR1cm4gW2dlb21ldHJ5LmdldENvb3JkaW5hdGVzKCldO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdHJldHVybiBnZW9tZXRyeS5nZXRDb29yZGluYXRlcygpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBzYXZlcyB0aGUgdXBkYXRlZCBnZW9tZXRyeSBvZiBhbiBhbm5vdGF0aW9uIGZlYXR1cmVcblx0XHR2YXIgaGFuZGxlR2VvbWV0cnlDaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIGZlYXR1cmUgPSBlLnRhcmdldDtcblx0XHRcdHZhciBzYXZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR2YXIgY29vcmRpbmF0ZXMgPSBnZXRDb29yZGluYXRlcyhmZWF0dXJlLmdldEdlb21ldHJ5KCkpO1xuXHRcdFx0XHRmZWF0dXJlLmFubm90YXRpb24ucG9pbnRzID0gY29vcmRpbmF0ZXMubWFwKGNvbnZlcnRGcm9tT0xQb2ludCk7XG5cdFx0XHRcdGZlYXR1cmUuYW5ub3RhdGlvbi4kc2F2ZSgpO1xuXHRcdFx0fTtcblx0XHRcdC8vIHRoaXMgZXZlbnQgaXMgcmFwaWRseSBmaXJlZCwgc28gd2FpdCB1bnRpbCB0aGUgZmlyaW5nIHN0b3BzXG5cdFx0XHQvLyBiZWZvcmUgc2F2aW5nIHRoZSBjaGFuZ2VzXG5cdFx0XHRkZWJvdW5jZShzYXZlLCA1MDAsIGZlYXR1cmUuYW5ub3RhdGlvbi5pZCk7XG5cdFx0fTtcblxuXHRcdHZhciBjcmVhdGVGZWF0dXJlID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdHZhciBnZW9tZXRyeTtcblx0XHRcdHZhciBwb2ludHMgPSBhbm5vdGF0aW9uLnBvaW50cy5tYXAoY29udmVydFRvT0xQb2ludCk7XG5cblx0XHRcdHN3aXRjaCAoYW5ub3RhdGlvbi5zaGFwZSkge1xuXHRcdFx0XHRjYXNlICdQb2ludCc6XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5Qb2ludChwb2ludHNbMF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdSZWN0YW5nbGUnOlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uUmVjdGFuZ2xlKFsgcG9pbnRzIF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdQb2x5Z29uJzpcblx0XHRcdFx0XHQvLyBleGFtcGxlOiBodHRwczovL2dpdGh1Yi5jb20vb3BlbmxheWVycy9vbDMvYmxvYi9tYXN0ZXIvZXhhbXBsZXMvZ2VvanNvbi5qcyNMMTI2XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5Qb2x5Z29uKFsgcG9pbnRzIF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdMaW5lU3RyaW5nJzpcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLkxpbmVTdHJpbmcocG9pbnRzKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnQ2lyY2xlJzpcblx0XHRcdFx0XHQvLyByYWRpdXMgaXMgdGhlIHggdmFsdWUgb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY2lyY2xlXG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5DaXJjbGUocG9pbnRzWzBdLCBwb2ludHNbMV1bMF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIHVuc3VwcG9ydGVkIHNoYXBlcyBhcmUgaWdub3JlZFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Vua25vd24gYW5ub3RhdGlvbiBzaGFwZTogJyArIGFubm90YXRpb24uc2hhcGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciBmZWF0dXJlID0gbmV3IG9sLkZlYXR1cmUoeyBnZW9tZXRyeTogZ2VvbWV0cnkgfSk7XG5cdFx0XHRmZWF0dXJlLm9uKCdjaGFuZ2UnLCBoYW5kbGVHZW9tZXRyeUNoYW5nZSk7XG5cdFx0XHRmZWF0dXJlLmFubm90YXRpb24gPSBhbm5vdGF0aW9uO1xuICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5hZGRGZWF0dXJlKGZlYXR1cmUpO1xuXHRcdH07XG5cblx0XHR2YXIgcmVmcmVzaEFubm90YXRpb25zID0gZnVuY3Rpb24gKGUsIGltYWdlKSB7XG5cdFx0XHQvLyBjbGVhciBmZWF0dXJlcyBvZiBwcmV2aW91cyBpbWFnZVxuICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5jbGVhcigpO1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5jbGVhcigpO1xuXG5cdFx0XHRhbm5vdGF0aW9ucy5xdWVyeSh7aWQ6IGltYWdlLl9pZH0pLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRhbm5vdGF0aW9ucy5mb3JFYWNoKGNyZWF0ZUZlYXR1cmUpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHZhciBoYW5kbGVOZXdGZWF0dXJlID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciBnZW9tZXRyeSA9IGUuZmVhdHVyZS5nZXRHZW9tZXRyeSgpO1xuXHRcdFx0dmFyIGNvb3JkaW5hdGVzID0gZ2V0Q29vcmRpbmF0ZXMoZ2VvbWV0cnkpO1xuXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbiA9IGFubm90YXRpb25zLmFkZCh7XG5cdFx0XHRcdGlkOiBpbWFnZXMuZ2V0Q3VycmVudElkKCksXG5cdFx0XHRcdHNoYXBlOiBnZW9tZXRyeS5nZXRUeXBlKCksXG5cdFx0XHRcdHBvaW50czogY29vcmRpbmF0ZXMubWFwKGNvbnZlcnRGcm9tT0xQb2ludClcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBpZiB0aGUgZmVhdHVyZSBjb3VsZG4ndCBiZSBzYXZlZCwgcmVtb3ZlIGl0IGFnYWluXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbi4kcHJvbWlzZS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5yZW1vdmVGZWF0dXJlKGUuZmVhdHVyZSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0ZS5mZWF0dXJlLm9uKCdjaGFuZ2UnLCBoYW5kbGVHZW9tZXRyeUNoYW5nZSk7XG5cbiAgICAgICAgICAgIHJldHVybiBlLmZlYXR1cmUuYW5ub3RhdGlvbi4kcHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBtYXAuYWRkTGF5ZXIoYW5ub3RhdGlvbkxheWVyKTtcblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihzZWxlY3QpO1xuXHRcdFx0c2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIHJlZnJlc2hBbm5vdGF0aW9ucyk7XG5cblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMub24oJ2NoYW5nZTpsZW5ndGgnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdC8vIGlmIG5vdCBhbHJlYWR5IGRpZ2VzdGluZywgZGlnZXN0XG5cdFx0XHRcdGlmICghc2NvcGUuJCRwaGFzZSkge1xuXHRcdFx0XHRcdC8vIHByb3BhZ2F0ZSBuZXcgc2VsZWN0aW9ucyB0aHJvdWdoIHRoZSBhbmd1bGFyIGFwcGxpY2F0aW9uXG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLnN0YXJ0RHJhd2luZyA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICAgICAgICBzZWxlY3Quc2V0QWN0aXZlKGZhbHNlKTtcblxuXHRcdFx0dHlwZSA9IHR5cGUgfHwgJ1BvaW50Jztcblx0XHRcdGRyYXcgPSBuZXcgb2wuaW50ZXJhY3Rpb24uRHJhdyh7XG4gICAgICAgICAgICAgICAgc291cmNlOiBhbm5vdGF0aW9uU291cmNlLFxuXHRcdFx0XHR0eXBlOiB0eXBlLFxuXHRcdFx0XHRzdHlsZTogc3R5bGVzLmVkaXRpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24obW9kaWZ5KTtcblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihkcmF3KTtcblx0XHRcdGRyYXcub24oJ2RyYXdlbmQnLCBoYW5kbGVOZXdGZWF0dXJlKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5maW5pc2hEcmF3aW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0bWFwLnJlbW92ZUludGVyYWN0aW9uKGRyYXcpO1xuXHRcdFx0bWFwLnJlbW92ZUludGVyYWN0aW9uKG1vZGlmeSk7XG4gICAgICAgICAgICBzZWxlY3Quc2V0QWN0aXZlKHRydWUpO1xuXHRcdFx0Ly8gZG9uJ3Qgc2VsZWN0IHRoZSBsYXN0IGRyYXduIHBvaW50XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmNsZWFyKCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZGVsZXRlU2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmZvckVhY2goZnVuY3Rpb24gKGZlYXR1cmUpIHtcblx0XHRcdFx0YW5ub3RhdGlvbnMuZGVsZXRlKGZlYXR1cmUuYW5ub3RhdGlvbikudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0YW5ub3RhdGlvblNvdXJjZS5yZW1vdmVGZWF0dXJlKGZlYXR1cmUpO1xuXHRcdFx0XHRcdHNlbGVjdGVkRmVhdHVyZXMucmVtb3ZlKGZlYXR1cmUpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLnNlbGVjdCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIGZlYXR1cmU7XG5cdFx0XHRhbm5vdGF0aW9uU291cmNlLmZvckVhY2hGZWF0dXJlKGZ1bmN0aW9uIChmKSB7XG5cdFx0XHRcdGlmIChmLmFubm90YXRpb24uaWQgPT09IGlkKSB7XG5cdFx0XHRcdFx0ZmVhdHVyZSA9IGY7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gcmVtb3ZlIHNlbGVjdGlvbiBpZiBmZWF0dXJlIHdhcyBhbHJlYWR5IHNlbGVjdGVkLiBvdGhlcndpc2Ugc2VsZWN0LlxuXHRcdFx0aWYgKCFzZWxlY3RlZEZlYXR1cmVzLnJlbW92ZShmZWF0dXJlKSkge1xuXHRcdFx0XHRzZWxlY3RlZEZlYXR1cmVzLnB1c2goZmVhdHVyZSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuICAgICAgICAvLyBmaXRzIHRoZSB2aWV3IHRvIHRoZSBnaXZlbiBmZWF0dXJlXG4gICAgICAgIHRoaXMuZml0ID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLmZvckVhY2hGZWF0dXJlKGZ1bmN0aW9uIChmKSB7XG4gICAgICAgICAgICAgICAgaWYgKGYuYW5ub3RhdGlvbi5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYW5pbWF0ZSBmaXRcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZpZXcgPSBtYXAuZ2V0VmlldygpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFuID0gb2wuYW5pbWF0aW9uLnBhbih7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IHZpZXcuZ2V0Q2VudGVyKClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB6b29tID0gb2wuYW5pbWF0aW9uLnpvb20oe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x1dGlvbjogdmlldy5nZXRSZXNvbHV0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIG1hcC5iZWZvcmVSZW5kZXIocGFuLCB6b29tKTtcbiAgICAgICAgICAgICAgICAgICAgdmlldy5maXQoZi5nZXRHZW9tZXRyeSgpLCBtYXAuZ2V0U2l6ZSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuXHRcdHRoaXMuY2xlYXJTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmNsZWFyKCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0U2VsZWN0ZWRGZWF0dXJlcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBzZWxlY3RlZEZlYXR1cmVzO1xuXHRcdH07XG5cbiAgICAgICAgLy8gbWFudWFsbHkgYWRkIGEgbmV3IGZlYXR1cmUgKG5vdCB0aHJvdWdoIHRoZSBkcmF3IGludGVyYWN0aW9uKVxuICAgICAgICB0aGlzLmFkZEZlYXR1cmUgPSBmdW5jdGlvbiAoZmVhdHVyZSkge1xuICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5hZGRGZWF0dXJlKGZlYXR1cmUpO1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZU5ld0ZlYXR1cmUoe2ZlYXR1cmU6IGZlYXR1cmV9KTtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbWFwSW1hZ2VcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGhhbmRsaW5nIHRoZSBpbWFnZSBsYXllciBvbiB0aGUgT3BlbkxheWVycyBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdtYXBJbWFnZScsIGZ1bmN0aW9uIChtYXApIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblx0XHR2YXIgZXh0ZW50ID0gWzAsIDAsIDAsIDBdO1xuXG5cdFx0dmFyIHByb2plY3Rpb24gPSBuZXcgb2wucHJvai5Qcm9qZWN0aW9uKHtcblx0XHRcdGNvZGU6ICdkaWFzLWltYWdlJyxcblx0XHRcdHVuaXRzOiAncGl4ZWxzJyxcblx0XHRcdGV4dGVudDogZXh0ZW50XG5cdFx0fSk7XG5cblx0XHR2YXIgaW1hZ2VMYXllciA9IG5ldyBvbC5sYXllci5JbWFnZSgpO1xuXG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKHNjb3BlKSB7XG5cdFx0XHRtYXAuYWRkTGF5ZXIoaW1hZ2VMYXllcik7XG5cblx0XHRcdC8vIHJlZnJlc2ggdGhlIGltYWdlIHNvdXJjZVxuXHRcdFx0c2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIGZ1bmN0aW9uIChlLCBpbWFnZSkge1xuXHRcdFx0XHRleHRlbnRbMl0gPSBpbWFnZS53aWR0aDtcblx0XHRcdFx0ZXh0ZW50WzNdID0gaW1hZ2UuaGVpZ2h0O1xuXG5cdFx0XHRcdHZhciB6b29tID0gc2NvcGUudmlld3BvcnQuem9vbTtcblxuXHRcdFx0XHR2YXIgY2VudGVyID0gc2NvcGUudmlld3BvcnQuY2VudGVyO1xuXHRcdFx0XHQvLyB2aWV3cG9ydCBjZW50ZXIgaXMgc3RpbGwgdW5pbml0aWFsaXplZFxuXHRcdFx0XHRpZiAoY2VudGVyWzBdID09PSB1bmRlZmluZWQgJiYgY2VudGVyWzFdID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRjZW50ZXIgPSBvbC5leHRlbnQuZ2V0Q2VudGVyKGV4dGVudCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgaW1hZ2VTdGF0aWMgPSBuZXcgb2wuc291cmNlLkltYWdlU3RhdGljKHtcblx0XHRcdFx0XHR1cmw6IGltYWdlLnNyYyxcblx0XHRcdFx0XHRwcm9qZWN0aW9uOiBwcm9qZWN0aW9uLFxuXHRcdFx0XHRcdGltYWdlRXh0ZW50OiBleHRlbnRcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aW1hZ2VMYXllci5zZXRTb3VyY2UoaW1hZ2VTdGF0aWMpO1xuXG5cdFx0XHRcdG1hcC5zZXRWaWV3KG5ldyBvbC5WaWV3KHtcblx0XHRcdFx0XHRwcm9qZWN0aW9uOiBwcm9qZWN0aW9uLFxuXHRcdFx0XHRcdGNlbnRlcjogY2VudGVyLFxuXHRcdFx0XHRcdHpvb206IHpvb20sXG5cdFx0XHRcdFx0em9vbUZhY3RvcjogMS41LFxuXHRcdFx0XHRcdC8vIGFsbG93IGEgbWF4aW11bSBvZiA0eCBtYWduaWZpY2F0aW9uXG5cdFx0XHRcdFx0bWluUmVzb2x1dGlvbjogMC4yNSxcblx0XHRcdFx0XHQvLyByZXN0cmljdCBtb3ZlbWVudFxuXHRcdFx0XHRcdGV4dGVudDogZXh0ZW50XG5cdFx0XHRcdH0pKTtcblxuXHRcdFx0XHQvLyBpZiB6b29tIGlzIG5vdCBpbml0aWFsaXplZCwgZml0IHRoZSB2aWV3IHRvIHRoZSBpbWFnZSBleHRlbnRcblx0XHRcdFx0aWYgKHpvb20gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdG1hcC5nZXRWaWV3KCkuZml0KGV4dGVudCwgbWFwLmdldFNpemUoKSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldEV4dGVudCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBleHRlbnQ7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0UHJvamVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBwcm9qZWN0aW9uO1xuXHRcdH07XG5cbiAgICAgICAgdGhpcy5nZXRMYXllciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZUxheWVyO1xuICAgICAgICB9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBzdHlsZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGZvciB0aGUgT3BlbkxheWVycyBzdHlsZXNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdzdHlsZXMnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdGhpcy5jb2xvcnMgPSB7XG4gICAgICAgICAgICB3aGl0ZTogWzI1NSwgMjU1LCAyNTUsIDFdLFxuICAgICAgICAgICAgYmx1ZTogWzAsIDE1MywgMjU1LCAxXSxcbiAgICAgICAgICAgIG9yYW5nZTogJyNmZjVlMDAnXG4gICAgICAgIH07XG5cblx0XHR2YXIgd2lkdGggPSAzO1xuXG5cdFx0dGhpcy5mZWF0dXJlcyA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuXHRcdFx0XHRcdHdpZHRoOiA1XG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG5cdFx0XHRcdFx0cmFkaXVzOiA2LFxuXHRcdFx0XHRcdGZpbGw6IG5ldyBvbC5zdHlsZS5GaWxsKHtcblx0XHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcblx0XHRcdFx0XHRcdHdpZHRoOiAyXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSlcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRjb2xvcjogdGhpcy5jb2xvcnMuYmx1ZSxcblx0XHRcdFx0XHR3aWR0aDogM1xuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHRdO1xuXG5cdFx0dGhpcy5oaWdobGlnaHQgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcblx0XHRcdFx0XHR3aWR0aDogNlxuXHRcdFx0XHR9KSxcblx0XHRcdFx0aW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0XHRcdHJhZGl1czogNixcblx0XHRcdFx0XHRmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XG5cdFx0XHRcdFx0XHRjb2xvcjogdGhpcy5jb2xvcnMub3JhbmdlXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcblx0XHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSlcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRjb2xvcjogdGhpcy5jb2xvcnMub3JhbmdlLFxuXHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdF07XG5cblx0XHR0aGlzLmVkaXRpbmcgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcblx0XHRcdFx0XHR3aWR0aDogNVxuXHRcdFx0XHR9KSxcblx0XHRcdFx0aW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0XHRcdHJhZGl1czogNixcblx0XHRcdFx0XHRmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XG5cdFx0XHRcdFx0XHRjb2xvcjogdGhpcy5jb2xvcnMuYmx1ZVxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0XHRjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG5cdFx0XHRcdFx0XHR3aWR0aDogMixcblx0XHRcdFx0XHRcdGxpbmVEYXNoOiBbM11cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlLFxuXHRcdFx0XHRcdHdpZHRoOiAzLFxuXHRcdFx0XHRcdGxpbmVEYXNoOiBbNV1cblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0XTtcblxuXHRcdHRoaXMudmlld3BvcnQgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlLFxuXHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdH0pLFxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcblx0XHRcdFx0XHR3aWR0aDogMVxuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHRdO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSB1cmxQYXJhbXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gVGhlIEdFVCBwYXJhbWV0ZXJzIG9mIHRoZSB1cmwuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgndXJsUGFyYW1zJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHN0YXRlID0ge307XG5cblx0XHQvLyB0cmFuc2Zvcm1zIGEgVVJMIHBhcmFtZXRlciBzdHJpbmcgbGlrZSAjYT0xJmI9MiB0byBhbiBvYmplY3Rcblx0XHR2YXIgZGVjb2RlU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gbG9jYXRpb24uaGFzaC5yZXBsYWNlKCcjJywgJycpXG5cdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnJicpO1xuXG5cdFx0XHR2YXIgc3RhdGUgPSB7fTtcblxuXHRcdFx0cGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKHBhcmFtKSB7XG5cdFx0XHRcdC8vIGNhcHR1cmUga2V5LXZhbHVlIHBhaXJzXG5cdFx0XHRcdHZhciBjYXB0dXJlID0gcGFyYW0ubWF0Y2goLyguKylcXD0oLispLyk7XG5cdFx0XHRcdGlmIChjYXB0dXJlICYmIGNhcHR1cmUubGVuZ3RoID09PSAzKSB7XG5cdFx0XHRcdFx0c3RhdGVbY2FwdHVyZVsxXV0gPSBkZWNvZGVVUklDb21wb25lbnQoY2FwdHVyZVsyXSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gc3RhdGU7XG5cdFx0fTtcblxuXHRcdC8vIHRyYW5zZm9ybXMgYW4gb2JqZWN0IHRvIGEgVVJMIHBhcmFtZXRlciBzdHJpbmdcblx0XHR2YXIgZW5jb2RlU3RhdGUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcblx0XHRcdHZhciBwYXJhbXMgPSAnJztcblx0XHRcdGZvciAodmFyIGtleSBpbiBzdGF0ZSkge1xuXHRcdFx0XHRwYXJhbXMgKz0ga2V5ICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0YXRlW2tleV0pICsgJyYnO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHBhcmFtcy5zdWJzdHJpbmcoMCwgcGFyYW1zLmxlbmd0aCAtIDEpO1xuXHRcdH07XG5cblx0XHR0aGlzLnB1c2hTdGF0ZSA9IGZ1bmN0aW9uIChzKSB7XG5cdFx0XHRzdGF0ZS5zbHVnID0gcztcblx0XHRcdGhpc3RvcnkucHVzaFN0YXRlKHN0YXRlLCAnJywgc3RhdGUuc2x1ZyArICcjJyArIGVuY29kZVN0YXRlKHN0YXRlKSk7XG5cdFx0fTtcblxuXHRcdC8vIHNldHMgYSBVUkwgcGFyYW1ldGVyIGFuZCB1cGRhdGVzIHRoZSBoaXN0b3J5IHN0YXRlXG5cdFx0dGhpcy5zZXQgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gcGFyYW1zKSB7XG5cdFx0XHRcdHN0YXRlW2tleV0gPSBwYXJhbXNba2V5XTtcblx0XHRcdH1cblx0XHRcdGhpc3RvcnkucmVwbGFjZVN0YXRlKHN0YXRlLCAnJywgc3RhdGUuc2x1ZyArICcjJyArIGVuY29kZVN0YXRlKHN0YXRlKSk7XG5cdFx0fTtcblxuXHRcdC8vIHJldHVybnMgYSBVUkwgcGFyYW1ldGVyXG5cdFx0dGhpcy5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRyZXR1cm4gc3RhdGVba2V5XTtcblx0XHR9O1xuXG5cdFx0c3RhdGUgPSBoaXN0b3J5LnN0YXRlO1xuXG5cdFx0aWYgKCFzdGF0ZSkge1xuXHRcdFx0c3RhdGUgPSBkZWNvZGVTdGF0ZSgpO1xuXHRcdH1cblx0fVxuKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=