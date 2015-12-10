/**
 * @namespace dias.annotations
 * @description The DIAS annotations module.
 */
angular.module('dias.annotations', ['dias.api', 'dias.ui']);

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
angular.module('dias.annotations').controller('AnnotatorController', ["$scope", "images", "urlParams", "msg", "IMAGE_ID", function ($scope, images, urlParams, msg, IMAGE_ID) {
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

        var handleKeyEvents = function (e) {
            switch (e.keyCode) {
                case 37:
                    $scope.prevImage();
                    break;
                case 39:
                case 32:
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

        document.addEventListener('keydown', handleKeyEvents);

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
angular.module('dias.annotations').controller('CategoriesController', ["$scope", "labels", function ($scope, labels) {
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
            switch (String.fromCharCode(charCode).toLowerCase()) {
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

        var viewportSource = new ol.source.Vector();

		var minimap = new ol.Map({
			target: 'minimap',
			// remove controls
			controls: [],
			// disable interactions
			interactions: []
		});

        var mapSize = map.getSize();

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
			viewport.setGeometry(ol.geom.Polygon.fromExtent(
                map.getView().calculateExtent(mapSize)
            ));
		};

		map.on('postcompose', refreshViewport);

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

        $scope.$on('keypress', function (e, keyEvent) {
            switch (keyEvent.keyCode) {
                case 9:
                    keyEvent.preventDefault();
                    $scope.toggleFoldout('categories');
                    break;
                case 46:
                    $scope.deleteSelectedAnnotations();
                    break;
            }
        });

        // the currently opened sidebar-'extension' is remembered through localStorage
        if (window.localStorage[foldoutStorageKey]) {
            $scope.openFoldout(window.localStorage[foldoutStorageKey]);
        }
	}]
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
angular.module('dias.annotations').service('images', ["TransectImage", "URL", "$q", "filterSubset", "TRANSECT_ID", function (TransectImage, URL, $q, filterSubset, TRANSECT_ID) {
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
            style: styles.features
        });

		// select interaction working on "singleclick"
		var select = new ol.interaction.Select({
			style: styles.highlight,
            layers: [annotationLayer]
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
		};

		this.init = function (scope) {
            map.addLayer(annotationLayer);
			// featureOverlay.setMap(map);
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
                    map.getView().fit(f.getGeometry(), map.getSize());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkaXJlY3RpdmVzL2Fubm90YXRpb25MaXN0SXRlbS5qcyIsImRpcmVjdGl2ZXMvbGFiZWxDYXRlZ29yeUl0ZW0uanMiLCJkaXJlY3RpdmVzL2xhYmVsSXRlbS5qcyIsImNvbnRyb2xsZXJzL0Fubm90YXRpb25zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0Fubm90YXRvckNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9DYW52YXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ2F0ZWdvcmllc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Db25maWRlbmNlQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NvbnRyb2xzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL01pbmltYXBDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2VsZWN0ZWRMYWJlbENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TaWRlYmFyQ29udHJvbGxlci5qcyIsImZhY3Rvcmllcy9kZWJvdW5jZS5qcyIsImZhY3Rvcmllcy9tYXAuanMiLCJzZXJ2aWNlcy9hbm5vdGF0aW9ucy5qcyIsInNlcnZpY2VzL2ltYWdlcy5qcyIsInNlcnZpY2VzL2xhYmVscy5qcyIsInNlcnZpY2VzL21hcEFubm90YXRpb25zLmpzIiwic2VydmljZXMvbWFwSW1hZ2UuanMiLCJzZXJ2aWNlcy9zdHlsZXMuanMiLCJzZXJ2aWNlcy91cmxQYXJhbXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsb0JBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7QUNHQSxRQUFBLE9BQUEsb0JBQUEsVUFBQSxpQ0FBQSxVQUFBLFFBQUE7RUFDQTs7RUFFQSxPQUFBO0dBQ0EsT0FBQTtHQUNBLHVCQUFBLFVBQUEsUUFBQTtJQUNBLE9BQUEsYUFBQSxVQUFBLE9BQUEsV0FBQSxNQUFBOztJQUVBLE9BQUEsV0FBQSxZQUFBO0tBQ0EsT0FBQSxPQUFB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QUFBLFlBQUE7R0FDQSxXQUFBLFFBQUEsT0FBQSxRQUFBLFdBQUE7R0FDQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBLFVBQUEsWUFBQTtHQUNBLFlBQUEsS0FBQTtHQUNBLE9BQUE7OztFQUdBLEtBQUEsUUFBQSxVQUFBLFFBQUE7R0FDQSxjQUFBLFdBQUEsTUFBQTtHQUNBLFlBQUEsU0FBQSxLQUFBLFVBQUEsR0FBQTtJQUNBLEVBQUEsUUFBQTs7R0FFQSxPQUFBOzs7RUFHQSxLQUFBLE1BQUEsVUFBQSxRQUFBO0dBQ0EsSUFBQSxDQUFBLE9BQUEsWUFBQSxPQUFBLE9BQUE7SUFDQSxPQUFBLFdBQUEsT0FBQSxNQUFBLE9BQUE7O0dBRUEsSUFBQSxRQUFBLE9BQUE7R0FDQSxPQUFBLFdBQUEsTUFBQTtHQUNBLE9BQUEsYUFBQSxPQUFBO0dBQ0EsSUFBQSxhQUFBLFdBQUEsSUFBQTtHQUNBLFdBQUE7Y0FDQSxLQUFBO2NBQ0EsS0FBQTtjQUNBLE1BQUEsSUFBQTs7R0FFQSxPQUFBOzs7RUFHQSxLQUFBLFNBQUEsVUFBQSxZQUFBOztHQUVBLElBQUEsUUFBQSxZQUFBLFFBQUE7R0FDQSxJQUFBLFFBQUEsQ0FBQSxHQUFBO0lBQ0EsT0FBQSxXQUFBLFFBQUEsWUFBQTs7O0tBR0EsUUFBQSxZQUFBLFFBQUE7S0FDQSxZQUFBLE9BQUEsT0FBQTtPQUNBLElBQUE7Ozs7RUFJQSxLQUFBLFVBQUEsVUFBQSxJQUFBO0dBQ0EsT0FBQSxZQUFBLFFBQUE7OztFQUdBLEtBQUEsVUFBQSxZQUFBO0dBQ0EsT0FBQTs7Ozs7Ozs7Ozs7QUN6REEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsd0VBQUEsVUFBQSxlQUFBLEtBQUEsSUFBQSxjQUFBLGFBQUE7RUFDQTs7RUFFQSxJQUFBLFFBQUE7O0VBRUEsSUFBQSxXQUFBOztFQUVBLElBQUEsa0JBQUE7O0VBRUEsSUFBQSxTQUFBOzs7RUFHQSxLQUFBLGVBQUE7Ozs7OztFQU1BLElBQUEsU0FBQSxVQUFBLElBQUE7R0FDQSxLQUFBLE1BQUEsTUFBQSxhQUFBO0dBQ0EsSUFBQSxR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T0FBQSxNQUFBLFFBQUEsWUFBQTs7O29CQUdBLFFBQUEsV0FBQSxPQUFBLFFBQUE7b0JBQ0EsV0FBQSxPQUFBLE9BQUEsT0FBQTttQkFDQSxJQUFBOzs7O1FBSUEsS0FBQSxVQUFBLFlBQUE7WUFDQSxJQUFBLE9BQUE7WUFDQSxJQUFBLE1BQUE7WUFDQSxJQUFBLFFBQUEsVUFBQSxPQUFBO2dCQUNBLElBQUEsU0FBQSxNQUFBO2dCQUNBLElBQUEsS0FBQSxLQUFBLFNBQUE7b0JBQ0EsS0FBQSxLQUFBLFFBQUEsS0FBQTt1QkFDQTtvQkFDQSxLQUFBLEtBQUEsVUFBQSxDQUFBOzs7O1lBSUEsS0FBQSxRQUFBLEtBQUEsVUFBQSxRQUFBO2dCQUNBLEtBQUEsT0FBQSxRQUFBO29CQUNBLEtBQUEsT0FBQTtvQkFDQSxPQUFBLEtBQUEsUUFBQTs7OztZQUlBLE9BQUE7OztRQUdBLEtBQUEsU0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsS0FBQSxjQUFBLFVBQUEsT0FBQTtZQUNBLGdCQUFBOzs7UUFHQSxLQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLEtBQUEsY0FBQSxZQUFBO1lBQ0EsT0FBQSxDQUFBLENBQUE7OztRQUdBLEtBQUEsdUJBQUEsVUFBQSxZQUFBO1lBQ0Esb0JBQUE7OztRQUdBLEtBQUEsdUJBQUEsWUFBQTtZQUNBLE9BQUE7Ozs7UUFJQSxDQUFBLFVBQUEsT0FBQTtZQUNBLElBQUEsV0FBQSxHQUFBO1lBQ0EsTUFBQSxVQUFBLFNBQUE7O1lBRUEsSUFBQSxXQUFBLENBQUE7OztZQUdBLElBQUEsZUFBQSxZQUFBO2dCQUNBLElBQUEsRUFBQSxhQUFBLFlBQUEsUUFBQTtvQkFDQSxTQUFBLFFBQUE7Ozs7WUFJQSxPQUFBLFFBQUEsTUFBQSxNQUFBOztZQUVBLFlBQUEsUUFBQSxVQUFBLElBQUE7Z0JBQ0EsUUFBQSxJQUFBLENBQUEsSUFBQSxLQUFBLFVBQUEsU0FBQTtvQkFDQSxPQUFBLFFBQUEsUUFBQSxhQUFBLE1BQUEsQ0FBQSxZQUFBLEtBQUE7OztXQUdBOzs7Ozs7Ozs7OztBQ3hIQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSx5RUFBQSxVQUFBLEtBQUEsUUFBQSxhQUFBLFVBQUEsUUFBQTtFQUNBOztRQUVBLElBQUEscUJBQUEsSUFBQSxHQUFBO1FBQ0EsSUFBQSxtQkFBQSxJQUFBLEdBQUEsT0FBQSxPQUFBO1lBQ0EsVUFBQTs7UUFFQSxJQUFBLGtCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxRQUFBO1lBQ0EsT0FBQSxPQUFBOzs7O0VBSUEsSUFBQSxTQUFBLElBQUEsR0FBQSxZQUFBLE9BQUE7R0FDQSxPQUFBLE9BQUE7WUFDQSxRQUFBLENBQUE7OztFQUdBLElBQUEsbUJBQUEsT0FBQTs7RUFFQSxJQUFBLFNBQUEsSUFBQSxHQUFBLFlBQUEsT0FBQTtHQUNBLFVBQUE7Ozs7R0FJQSxpQkFBQSxTQUFBLE9BQUE7SUFDQSxPQUFBLEdBQUEsT0FBQSxVQUFBLGFBQUEsVUFBQSxHQUFBLE9BQUEsVUFBQSxZQUFBOzs7OztFQUtBLElBQUE7Ozs7RUFJQSxJQUFBLHFCQUFBLFVBQUEsT0FBQTtHQUNBLE9BQUEsQ0FBQSxHQUFBLE1BQUEsSUFBQSxHQUFBLE9BQUEsYUFBQSxTQUFBLE1BQUE7Ozs7O0VBS0EsSUFBQSxtQkFBQSxVQUFBLE9BQUE7R0FDQSxPQUFBLENBQUEsTUFBQSxHQUFBLE9BQUEsYUFBQSxTQUFBLE1BQUE7Ozs7O0VBS0EsSUFBQSxpQkFBQSxVQUFBLFVBQUE7R0FDQSxRQUFBLFNBQUE7SUFDQSxLQUFBOztLQUVBLE9BQUEsQ0FBQSxTQUFBLGFBQUEsQ0FBQSxTQUFBLGFBQUE7SUFDQSxLQUFBO0lBQ0EsS0FBQTtLQUNBLE9BQUEsU0FBQSxpQkFBQTtJQUNBLEtBQUE7S0FDQSxPQUFBLENBQUEsU0FBQTtJQUNBO0tBQ0EsT0FBQSxTQUFBOzs7OztFQUtBLElBQUEsdUJBQUEsVUFBQSxHQUFBO0dBQ0EsSUFBQSxVQUFBLEVBQUE7R0FDQSxJQUFBLE9BQUEsWUFBQTtJQUNBLElBQUEsY0FBQSxlQUFBLFFBQUE7SUFDQSxRQUFBLFdBQUEsU0FBQSxZQUFBLElBQUE7SUFDQSxRQUFBLFdBQUE7Ozs7R0FJQSxTQUFBLE1BQUEsS0FBQSxRQUFBLFdBQUE7OztFQUdBLElBQUEsZ0JBQUEsVUFBQSxZQUFBO0dBQ0EsSUFBQTtHQUNBLElBQUEsU0FBQSxXQUFBLE9BQUEsSUFBQTs7R0FFQSxRQUFBLFdBQUE7SUFDQSxLQUFBO0tBQ0EsV0FBQSxJQUFBLEdBQUEsS0FBQSxNQUFBLE9BQUE7S0FDQTtJQUNBLEtBQUE7S0FDQSxXQUFBLElBQUEsR0FBQSxLQUFBLFVBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTs7S0FFQSxXQUFBLElBQUEsR0FBQSxLQUFBLFFBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTtLQUNBLFdBQUEsSUFBQSxHQUFBLEtBQUEsV0FBQTtLQUNBO0lBQ0EsS0FBQTs7S0FFQSxXQUFBLElBQUEsR0FBQSxLQUFBLE9BQUEsT0FBQSxJQUFBLE9BQUEsR0FBQTtLQUNBOztnQkFFQTtvQkFDQSxRQUFBLE1BQUEsK0JBQUEsV0FBQTtvQkFDQTs7O0dBR0EsSUFBQSxVQUFBLElBQUEsR0FBQSxRQUFBLEVBQUEsVUFBQTtHQUNBLFFBQUEsR0FBQSxVQUFBO0dBQ0EsUUFBQSxhQUFBO1lBQ0EsaUJBQUEsV0FBQTs7O0VBR0EsSUFBQSxxQkFBQSxVQUFBLEdBQUEsT0FBQTs7WUFFQSxpQkFBQTtHQUNBLGlCQUFBOztHQUVBLFlBQUEsTUFBQSxDQUFBLElBQUEsTUFBQSxNQUFBLFNBQUEsS0FBQSxZQUFBO0lBQ0EsWUFBQSxRQUFBOzs7O0VBSUEsSUFBQSxtQkFBQSxVQUFBLEdBQUE7R0FDQSxJQUFBLFdBQUEsRUFBQSxRQUFBO0dBQ0EsSUFBQSxjQUFBLGVBQUE7O0dBRUEsRUFBQSxRQUFBLGFBQUEsWUFBQSxJQUFBO0lBQ0EsSUFBQSxPQUFBO0lBQ0EsT0FBQSxTQUFBO0lBQ0EsUUFBQSxZQUFBLElBQUE7Ozs7R0FJQSxFQUFBLFFBQUEsV0FBQSxTQUFBLE1BQUEsWUFBQTtnQkFDQSxpQkFBQSxjQUFBLEVBQUE7OztHQUdBLEVBQUEsUUFBQSxHQUFBLFVBQUE7OztFQUdBLEtBQUEsT0FBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFNBQUE7O0dBRUEsSUFBQSxlQUFBO0dBQ0EsTUFBQSxJQUFBLGVBQUE7O0dBRUEsaUJBQUEsR0FBQSxpQkFBQSxZQUFBOztJQUVBLElBQUEsQ0FBQSxNQUFBLFNBQUE7O0tBRUEsTUFBQTs7Ozs7RUFLQSxLQUFBLGVBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxVQUFBOztHQUVBLE9BQUEsUUFBQTtHQUNBLE9BQUEsSUFBQSxHQUFBLFlBQUEsS0FBQTtnQkFDQSxRQUFBO0lBQ0EsTUFBQTtJQUNBLE9BQUEsT0FBQTs7O0dBR0EsSUFBQSxlQUFBO0dBQ0EsSUFBQSxlQUFBO0dBQ0EsS0FBQSxHQUFBLFdBQUE7OztFQUdBLEtBQUEsZ0JBQUEsWUFBQTtHQUNBLElBQUEsa0JBQUE7R0FDQSxJQUFBLGtCQUFBO1lBQ0EsT0FBQSxVQUFBOztHQUVBLGlCQUFBOzs7RUFHQSxLQUFBLGlCQUFBLFlBQUE7R0FDQSxpQkFBQSxRQUFBLFVBQUEsU0FBQTtJQUNBLFlBQUEsT0FBQSxRQUFBLFlBQUEsS0FBQSxZQUFBO0tBQ0EsaUJBQUEsY0FBQTtLQUNBLGlCQUFBLE9BQUE7Ozs7O0VBS0EsS0FBQSxTQUFBLFVBQUEsSUFBQTtHQUNBLElBQUE7R0FDQSxpQkFBQSxlQUFBLFVBQUEsR0FBQTtJQUNBLElBQUEsRUFBQSxXQUFBLE9BQUEsSUFBQTtLQUNBLFVBQUE7Ozs7R0FJQSxJQUFBLENBQUEsaUJBQUEsT0FBQSxVQUFBO0lBQ0EsaUJBQUEsS0FBQTs7Ozs7UUFLQSxLQUFBLE1BQUEsVUFBQSxJQUFBO1lBQ0EsaUJBQUEsZUFBQSxVQUFBLEdBQUE7Z0JBQ0EsSUFBQSxFQUFBLFdBQUEsT0FBQSxJQUFBO29CQUNBLElBQUEsVUFBQSxJQUFBLEVBQUEsZUFBQSxJQUFBOzs7OztFQUtBLEtBQUEsaUJBQUEsWUFBQTtHQUNBLGlCQUFBOzs7RUFHQSxLQUFBLHNCQUFBLFlBQUE7R0FDQSxPQUFBOzs7Ozs7Ozs7Ozs7QUNuTkEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsb0JBQUEsVUFBQSxLQUFBO0VBQ0E7RUFDQSxJQUFBLFNBQUEsQ0FBQSxHQUFBLEdBQUEsR0FBQTs7RUFFQSxJQUFBLGFBQUEsSUFBQSxHQUFBLEtBQUEsV0FBQTtHQUNBLE1BQUE7R0FDQSxPQUFBO0dBQ0EsUUFBQTs7O0VBR0EsSUFBQSxhQUFBLElBQUEsR0FBQSxNQUFBOztFQUVBLEtBQUEsT0FBQSxVQUFBLE9BQUE7R0FDQSxJQUFBLFNBQUE7OztHQUdBLE1BQUEsSUFBQSxlQUFBLFVBQUEsR0FBQSxPQUFBO0lBQ0EsT0FBQSxLQUFBLE1BQUE7SUFDQSxPQUFBLEtBQUEsTUFBQTs7SUFFQSxJQUFBLE9BQUEsTUFBQSxTQUFBOztJQUVBLElBQUEsU0FBQSxNQUFBLFNBQUE7O0lBRUEsSUFBQSxPQUFBLE9BQUEsYUFBQSxPQUFBLE9BQUEsV0FBQTtLQUNBLFNBQUEsR0FBQSxPQUFBLFVBQUE7OztJQUdBLElBQUEsY0FBQSxJQUFBLEdBQUEsT0FBQSxZQUFBO0tBQ0EsS0FBQSxNQUFBO0tBQ0EsWUFBQTtLQUNBLGFBQUE7OztJQUdBLFdBQUEsVUFBQTs7SUFFQSxJQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7S0FDQSxZQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUE7S0FDQSxZQUFBOztLQUVBLGVBQUE7O0tBRUEsUUFBQTs7OztJQUlBLElBQUEsU0FBQSxXQUFBO0tBQ0EsSUFBQSxVQUFBLElBQUEsUUFBQSxJQUFBOzs7OztFQUtBLEtBQUEsWUFBQSxZQUFBO0dBQ0EsT0FBQTs7O0VBR0EsS0FBQSxnQkFBQSxZQUFBO0dBQ0EsT0FBQTs7O1FBR0EsS0FBQSxXQUFBLFlBQUE7WUFDQSxPQUFBOzs7Ozs7Ozs7Ozs7QUMvREEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsVUFBQSxZQUFBO0VBQ0E7O0VBRUEsSUFBQSxRQUFBLENBQUEsS0FBQSxLQUFBLEtBQUE7RUFDQSxJQUFBLE9BQUEsQ0FBQSxHQUFBLEtBQUEsS0FBQTtFQUNBLElBQUEsU0FBQTtFQUNBLElBQUEsUUFBQTs7RUFFQSxLQUFBLFdBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQTtLQUNBLE9BQUE7O0lBRUEsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtNQUNBLE9BQUE7O0tBRUEsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO01BQ0EsT0FBQTtNQUNBLE9BQUE7Ozs7R0FJQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQTtLQUNBLE9BQUE7Ozs7O0VBS0EsS0FBQSxZQUFBO0dBQ0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUE7S0FDQSxPQUFBOztJQUVBLE9BQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLFFBQUE7S0FDQSxNQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7TUFDQSxPQUFBOztLQUVBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtNQUNBLE9BQUE7TUFDQSxPQUFBOzs7O0dBSUEsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUE7S0FDQSxPQUFBOzs7OztFQUtBLEtBQUEsVUFBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsT0FBQTs7SUFFQSxPQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBO01BQ0EsT0FBQTs7S0FFQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7TUFDQSxPQUFBO01BQ0EsT0FBQTtNQUNBLFVBQUEsQ0FBQTs7OztHQUlBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsT0FBQTtLQUNBLFVBQUEsQ0FBQTs7Ozs7RUFLQSxLQUFBLFdBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQTtLQUNBLE9BQUE7OztHQUdBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsT0FBQTs7Ozs7Ozs7Ozs7OztBQy9GQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxhQUFBLFlBQUE7RUFDQTs7RUFFQSxJQUFBLFFBQUE7OztFQUdBLElBQUEsY0FBQSxZQUFBO0dBQ0EsSUFBQSxTQUFBLFNBQUEsS0FBQSxRQUFBLEtBQUE7OEJBQ0EsTUFBQTs7R0FFQSxJQUFBLFFBQUE7O0dBRUEsT0FBQSxRQUFBLFVBQUEsT0FBQTs7SUFFQSxJQUFBLFVBQUEsTUFBQSxNQUFBO0lBQ0EsSUFBQSxXQUFBLFFBQUEsV0FBQSxHQUFBO0tBQ0EsTUFBQSxRQUFBLE1BQUEsbUJBQUEsUUFBQTs7OztHQUlBLE9BQUE7Ozs7RUFJQSxJQUFBLGNBQUEsVUFBQSxPQUFBO0dBQ0EsSUFBQSxTQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsT0FBQTtJQUNBLFVBQUEsTUFBQSxNQUFBLG1CQUFBLE1BQUEsUUFBQTs7R0FFQSxPQUFBLE9BQUEsVUFBQSxHQUFBLE9BQUEsU0FBQTs7O0VBR0EsS0FBQSxZQUFBLFVBQUEsR0FBQTtHQUNBLE1BQUEsT0FBQTtHQUNBLFFBQUEsVUFBQSxPQUFBLElBQUEsTUFBQSxPQUFBLE1BQUEsWUFBQTs7OztFQUlBLEtBQUEsTUFBQSxVQUFBLFFBQUE7R0FDQSxLQUFBLElBQUEsT0FBQSxRQUFBO0lBQ0EsTUFBQSxPQUFBLE9BQUE7O0dBRUEsUUFBQSxhQUFBLE9BQUEsSUFBQSxNQUFBLE9BQUEsTUFBQSxZQUFBOzs7O0VBSUEsS0FBQSxNQUFBLFVBQUEsS0FBQTtHQUNBLE9BQUEsTUFBQTs7O0VBR0EsUUFBQSxRQUFBOztFQUVBLElBQUEsQ0FBQSxPQUFBO0dBQ0EsUUFBQTs7O0VBR0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgYW5ub3RhdGlvbnMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycsIFsnZGlhcy5hcGknLCAnZGlhcy51aSddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBhbm5vdGF0aW9uTGlzdEl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQW4gYW5ub3RhdGlvbiBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZGlyZWN0aXZlKCdhbm5vdGF0aW9uTGlzdEl0ZW0nLCBmdW5jdGlvbiAobGFiZWxzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0c2NvcGU6IHRydWUsXG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cdFx0XHRcdCRzY29wZS5zaGFwZUNsYXNzID0gJ2ljb24tJyArICRzY29wZS5hbm5vdGF0aW9uLnNoYXBlLnRvTG93ZXJDYXNlKCk7XG5cblx0XHRcdFx0JHNjb3BlLnNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuaXNTZWxlY3RlZCgkc2NvcGUuYW5ub3RhdGlvbi5pZCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmF0dGFjaExhYmVsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGxhYmVscy5hdHRhY2hUb0Fubm90YXRpb24oJHNjb3BlLmFubm90YXRpb24pO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5yZW1vdmVMYWJlbCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuXHRcdFx0XHRcdGxhYmVscy5yZW1vdmVGcm9tQW5ub3RhdGlvbigkc2NvcGUuYW5ub3RhdGlvbiwgbGFiZWwpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5jYW5BdHRhY2hMYWJlbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLnNlbGVjdGVkKCkgJiYgbGFiZWxzLmhhc1NlbGVjdGVkKCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRMYWJlbCA9IGxhYmVscy5nZXRTZWxlY3RlZDtcblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudENvbmZpZGVuY2UgPSBsYWJlbHMuZ2V0Q3VycmVudENvbmZpZGVuY2U7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYWJlbENhdGVnb3J5SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBIGxhYmVsIGNhdGVnb3J5IGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5kaXJlY3RpdmUoJ2xhYmVsQ2F0ZWdvcnlJdGVtJywgZnVuY3Rpb24gKCRjb21waWxlLCAkdGltZW91dCwgJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQycsXG5cbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnbGFiZWwtaXRlbS5odG1sJyxcblxuICAgICAgICAgICAgc2NvcGU6IHRydWUsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyB3YWl0IGZvciB0aGlzIGVsZW1lbnQgdG8gYmUgcmVuZGVyZWQgdW50aWwgdGhlIGNoaWxkcmVuIGFyZVxuICAgICAgICAgICAgICAgIC8vIGFwcGVuZGVkLCBvdGhlcndpc2UgdGhlcmUgd291bGQgYmUgdG9vIG11Y2ggcmVjdXJzaW9uIGZvclxuICAgICAgICAgICAgICAgIC8vIGFuZ3VsYXJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoJ2xhYmVsLXN1YnRyZWUuaHRtbCcpKTtcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKCRjb21waWxlKGNvbnRlbnQpKHNjb3BlKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgLy8gb3BlbiB0aGUgc3VidHJlZSBvZiB0aGlzIGl0ZW1cbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpdGVtIGhhcyBjaGlsZHJlblxuICAgICAgICAgICAgICAgICRzY29wZS5pc0V4cGFuZGFibGUgPSAkc2NvcGUudHJlZSAmJiAhISRzY29wZS50cmVlWyRzY29wZS5pdGVtLmlkXTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaXMgY3VycmVudGx5IHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIC8vIGhhbmRsZSB0aGlzIGJ5IHRoZSBldmVudCByYXRoZXIgdGhhbiBhbiBvd24gY2xpY2sgaGFuZGxlciB0b1xuICAgICAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBjbGljayBhbmQgc2VhcmNoIGZpZWxkIGFjdGlvbnMgaW4gYSB1bmlmaWVkIHdheVxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZSwgY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgYW4gaXRlbSBpcyBzZWxlY3RlZCwgaXRzIHN1YnRyZWUgYW5kIGFsbCBwYXJlbnQgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIG9wZW5lZFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0uaWQgPT09IGNhdGVnb3J5LmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgaGl0cyBhbGwgcGFyZW50IHNjb3Blcy9pdGVtc1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiBhIGNoaWxkIGl0ZW0gd2FzIHNlbGVjdGVkLCB0aGlzIGl0ZW0gc2hvdWxkIGJlIG9wZW5lZCwgdG9vXG4gICAgICAgICAgICAgICAgLy8gc28gdGhlIHNlbGVjdGVkIGl0ZW0gYmVjb21lcyB2aXNpYmxlIGluIHRoZSB0cmVlXG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5vcGVuUGFyZW50cycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAvLyBzdG9wIHByb3BhZ2F0aW9uIGlmIHRoaXMgaXMgYSByb290IGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5pdGVtLnBhcmVudF9pZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgbGFiZWxJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEFuIGFubm90YXRpb24gbGFiZWwgbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmRpcmVjdGl2ZSgnbGFiZWxJdGVtJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0dmFyIGNvbmZpZGVuY2UgPSAkc2NvcGUuYW5ub3RhdGlvbkxhYmVsLmNvbmZpZGVuY2U7XG5cblx0XHRcdFx0aWYgKGNvbmZpZGVuY2UgPD0gMC4yNSkge1xuXHRcdFx0XHRcdCRzY29wZS5jbGFzcyA9ICdsYWJlbC1kYW5nZXInO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC41ICkge1xuXHRcdFx0XHRcdCRzY29wZS5jbGFzcyA9ICdsYWJlbC13YXJuaW5nJztcblx0XHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNzUgKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXN1Y2Nlc3MnO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCRzY29wZS5jbGFzcyA9ICdsYWJlbC1wcmltYXJ5Jztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEFubm90YXRpb25zQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgYW5ub3RhdGlvbnMgbGlzdCBpbiB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0Fubm90YXRpb25zQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEFubm90YXRpb25zLCBsYWJlbHMsIGFubm90YXRpb25zLCBzaGFwZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5zZWxlY3RlZEZlYXR1cmVzID0gbWFwQW5ub3RhdGlvbnMuZ2V0U2VsZWN0ZWRGZWF0dXJlcygpLmdldEFycmF5KCk7XG5cblx0XHQkc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignc2VsZWN0ZWRGZWF0dXJlcycsIGZ1bmN0aW9uIChmZWF0dXJlcykge1xuXHRcdFx0ZmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoZmVhdHVyZSkge1xuXHRcdFx0XHRsYWJlbHMuZmV0Y2hGb3JBbm5vdGF0aW9uKGZlYXR1cmUuYW5ub3RhdGlvbik7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHZhciByZWZyZXNoQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuYW5ub3RhdGlvbnMgPSBhbm5vdGF0aW9ucy5jdXJyZW50KCk7XG5cdFx0fTtcblxuXHRcdHZhciBzZWxlY3RlZEZlYXR1cmVzID0gbWFwQW5ub3RhdGlvbnMuZ2V0U2VsZWN0ZWRGZWF0dXJlcygpO1xuXG5cdFx0JHNjb3BlLmFubm90YXRpb25zID0gW107XG5cblx0XHQkc2NvcGUuY2xlYXJTZWxlY3Rpb24gPSBtYXBBbm5vdGF0aW9ucy5jbGVhclNlbGVjdGlvbjtcblxuXHRcdCRzY29wZS5zZWxlY3RBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGUsIGlkKSB7XG5cdFx0XHQvLyBhbGxvdyBtdWx0aXBsZSBzZWxlY3Rpb25zXG5cdFx0XHRpZiAoIWUuc2hpZnRLZXkpIHtcblx0XHRcdFx0JHNjb3BlLmNsZWFyU2VsZWN0aW9uKCk7XG5cdFx0XHR9XG5cdFx0XHRtYXBBbm5vdGF0aW9ucy5zZWxlY3QoaWQpO1xuXHRcdH07XG5cbiAgICAgICAgJHNjb3BlLmZpdEFubm90YXRpb24gPSBtYXBBbm5vdGF0aW9ucy5maXQ7XG5cblx0XHQkc2NvcGUuaXNTZWxlY3RlZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIHNlbGVjdGVkID0gZmFsc2U7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmZvckVhY2goZnVuY3Rpb24gKGZlYXR1cmUpIHtcblx0XHRcdFx0aWYgKGZlYXR1cmUuYW5ub3RhdGlvbiAmJiBmZWF0dXJlLmFubm90YXRpb24uaWQgPT0gaWQpIHtcblx0XHRcdFx0XHRzZWxlY3RlZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIHNlbGVjdGVkO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIHJlZnJlc2hBbm5vdGF0aW9ucyk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEFubm90YXRvckNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFpbiBjb250cm9sbGVyIG9mIHRoZSBBbm5vdGF0b3IgYXBwbGljYXRpb24uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQW5ub3RhdG9yQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGltYWdlcywgdXJsUGFyYW1zLCBtc2csIElNQUdFX0lEKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5pbWFnZXMgPSBpbWFnZXM7XG4gICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgIC8vIHRoZSBjdXJyZW50IGNhbnZhcyB2aWV3cG9ydCwgc3luY2VkIHdpdGggdGhlIFVSTCBwYXJhbWV0ZXJzXG4gICAgICAgICRzY29wZS52aWV3cG9ydCA9IHtcbiAgICAgICAgICAgIHpvb206IHVybFBhcmFtcy5nZXQoJ3onKSxcbiAgICAgICAgICAgIGNlbnRlcjogW3VybFBhcmFtcy5nZXQoJ3gnKSwgdXJsUGFyYW1zLmdldCgneScpXVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGZpbmlzaCBpbWFnZSBsb2FkaW5nIHByb2Nlc3NcbiAgICAgICAgdmFyIGZpbmlzaExvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnaW1hZ2Uuc2hvd24nLCAkc2NvcGUuaW1hZ2VzLmN1cnJlbnRJbWFnZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgdmFyIHB1c2hTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHVybFBhcmFtcy5wdXNoU3RhdGUoJHNjb3BlLmltYWdlcy5jdXJyZW50SW1hZ2UuX2lkKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzdGFydCBpbWFnZSBsb2FkaW5nIHByb2Nlc3NcbiAgICAgICAgdmFyIHN0YXJ0TG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGxvYWQgdGhlIGltYWdlIGJ5IGlkLiBkb2Vzbid0IGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5IGJ5IGl0c2VsZlxuICAgICAgICB2YXIgbG9hZEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBzdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZXMuc2hvdyhwYXJzZUludChpZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVLZXlFdmVudHMgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgc3dpdGNoIChlLmtleUNvZGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDM3OlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucHJldkltYWdlKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzk6XG4gICAgICAgICAgICAgICAgY2FzZSAzMjpcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5leHRJbWFnZSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdrZXlwcmVzcycsIGUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzaG93IHRoZSBuZXh0IGltYWdlIGFuZCBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeVxuICAgICAgICAkc2NvcGUubmV4dEltYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc3RhcnRMb2FkaW5nKCk7XG4gICAgICAgICAgICBpbWFnZXMubmV4dCgpXG4gICAgICAgICAgICAgICAgICAudGhlbihmaW5pc2hMb2FkaW5nKVxuICAgICAgICAgICAgICAgICAgLnRoZW4ocHVzaFN0YXRlKVxuICAgICAgICAgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzaG93IHRoZSBwcmV2aW91cyBpbWFnZSBhbmQgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgJHNjb3BlLnByZXZJbWFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgaW1hZ2VzLnByZXYoKVxuICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgIC50aGVuKHB1c2hTdGF0ZSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSBVUkwgcGFyYW1ldGVycyBvZiB0aGUgdmlld3BvcnRcbiAgICAgICAgJHNjb3BlLiRvbignY2FudmFzLm1vdmVlbmQnLCBmdW5jdGlvbihlLCBwYXJhbXMpIHtcbiAgICAgICAgICAgICRzY29wZS52aWV3cG9ydC56b29tID0gcGFyYW1zLnpvb207XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuY2VudGVyWzBdID0gTWF0aC5yb3VuZChwYXJhbXMuY2VudGVyWzBdKTtcbiAgICAgICAgICAgICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMV0gPSBNYXRoLnJvdW5kKHBhcmFtcy5jZW50ZXJbMV0pO1xuICAgICAgICAgICAgdXJsUGFyYW1zLnNldCh7XG4gICAgICAgICAgICAgICAgejogJHNjb3BlLnZpZXdwb3J0Lnpvb20sXG4gICAgICAgICAgICAgICAgeDogJHNjb3BlLnZpZXdwb3J0LmNlbnRlclswXSxcbiAgICAgICAgICAgICAgICB5OiAkc2NvcGUudmlld3BvcnQuY2VudGVyWzFdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gbGlzdGVuIHRvIHRoZSBicm93c2VyIFwiYmFja1wiIGJ1dHRvblxuICAgICAgICB3aW5kb3cub25wb3BzdGF0ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBzdGF0ZSA9IGUuc3RhdGU7XG4gICAgICAgICAgICBpZiAoc3RhdGUgJiYgc3RhdGUuc2x1ZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbG9hZEltYWdlKHN0YXRlLnNsdWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlFdmVudHMpO1xuXG4gICAgICAgIC8vIGluaXRpYWxpemUgdGhlIGltYWdlcyBzZXJ2aWNlXG4gICAgICAgIGltYWdlcy5pbml0KCk7XG4gICAgICAgIC8vIGRpc3BsYXkgdGhlIGZpcnN0IGltYWdlXG4gICAgICAgIGxvYWRJbWFnZShJTUFHRV9JRCkudGhlbihwdXNoU3RhdGUpO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENhbnZhc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFpbiBjb250cm9sbGVyIGZvciB0aGUgYW5ub3RhdGlvbiBjYW52YXMgZWxlbWVudFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NhbnZhc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBJbWFnZSwgbWFwQW5ub3RhdGlvbnMsIG1hcCwgJHRpbWVvdXQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdC8vIHVwZGF0ZSB0aGUgVVJMIHBhcmFtZXRlcnNcblx0XHRtYXAub24oJ21vdmVlbmQnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHR2YXIgdmlldyA9IG1hcC5nZXRWaWV3KCk7XG5cdFx0XHQkc2NvcGUuJGVtaXQoJ2NhbnZhcy5tb3ZlZW5kJywge1xuXHRcdFx0XHRjZW50ZXI6IHZpZXcuZ2V0Q2VudGVyKCksXG5cdFx0XHRcdHpvb206IHZpZXcuZ2V0Wm9vbSgpXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1hcEltYWdlLmluaXQoJHNjb3BlKTtcblx0XHRtYXBBbm5vdGF0aW9ucy5pbml0KCRzY29wZSk7XG5cblx0XHR2YXIgdXBkYXRlU2l6ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdC8vIHdvcmthcm91bmQsIHNvIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQgKmFmdGVyKiB0aGUgYW5ndWxhciBkaWdlc3Rcblx0XHRcdC8vIGFuZCAqYWZ0ZXIqIHRoZSBmb2xkb3V0IHdhcyByZW5kZXJlZFxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBuZWVkcyB0byBiZSB3cmFwcGVkIGluIGFuIGV4dHJhIGZ1bmN0aW9uIHNpbmNlIHVwZGF0ZVNpemUgYWNjZXB0cyBhcmd1bWVudHNcblx0XHRcdFx0bWFwLnVwZGF0ZVNpemUoKTtcblx0XHRcdH0sIDUwLCBmYWxzZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5vcGVuJywgdXBkYXRlU2l6ZSk7XG5cdFx0JHNjb3BlLiRvbignc2lkZWJhci5mb2xkb3V0LmNsb3NlJywgdXBkYXRlU2l6ZSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENhdGVnb3JpZXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyIGxhYmVsIGNhdGVnb3JpZXMgZm9sZG91dFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NhdGVnb3JpZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbGFiZWxzKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIG1heGltdW0gbnVtYmVyIG9mIGFsbG93ZWQgZmF2b3VyaXRlc1xuICAgICAgICB2YXIgbWF4RmF2b3VyaXRlcyA9IDk7XG4gICAgICAgIHZhciBmYXZvdXJpdGVzU3RvcmFnZUtleSA9ICdkaWFzLmFubm90YXRpb25zLmxhYmVsLWZhdm91cml0ZXMnO1xuXG4gICAgICAgIC8vIHNhdmVzIHRoZSBJRHMgb2YgdGhlIGZhdm91cml0ZXMgaW4gbG9jYWxTdG9yYWdlXG4gICAgICAgIHZhciBzdG9yZUZhdm91cml0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdG1wID0gJHNjb3BlLmZhdm91cml0ZXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uaWQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbZmF2b3VyaXRlc1N0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkodG1wKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXN0b3JlcyB0aGUgZmF2b3VyaXRlcyBmcm9tIHRoZSBJRHMgaW4gbG9jYWxTdG9yYWdlXG4gICAgICAgIHZhciBsb2FkRmF2b3VyaXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW2Zhdm91cml0ZXNTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgICAgIHZhciB0bXAgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbZmF2b3VyaXRlc1N0b3JhZ2VLZXldKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcyA9ICRzY29wZS5jYXRlZ29yaWVzLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IHRha2UgdGhvc2UgY2F0ZWdvcmllcyBhcyBmYXZvdXJpdGVzIHRoYXQgYXJlIGF2YWlsYWJsZSBmb3IgdGhpcyBpbWFnZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG1wLmluZGV4T2YoaXRlbS5pZCkgIT09IC0xO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5ob3RrZXlzTWFwID0gWyfwnZ+tJywgJ/Cdn64nLCAn8J2frycsICfwnZ+wJywgJ/Cdn7EnLCAn8J2fsicsICfwnZ+zJywgJ/Cdn7QnLCAn8J2ftSddO1xuICAgICAgICAkc2NvcGUuY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcyA9IFtdO1xuICAgICAgICBsYWJlbHMucHJvbWlzZS50aGVuKGZ1bmN0aW9uIChhbGwpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBhbGwpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY2F0ZWdvcmllcyA9ICRzY29wZS5jYXRlZ29yaWVzLmNvbmNhdChhbGxba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2FkRmF2b3VyaXRlcygpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuY2F0ZWdvcmllc1RyZWUgPSBsYWJlbHMuZ2V0VHJlZSgpO1xuXG4gICAgICAgICRzY29wZS5zZWxlY3RJdGVtID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIGxhYmVscy5zZXRTZWxlY3RlZChpdGVtKTtcbiAgICAgICAgICAgICRzY29wZS5zZWFyY2hDYXRlZ29yeSA9ICcnOyAvLyBjbGVhciBzZWFyY2ggZmllbGRcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdjYXRlZ29yaWVzLnNlbGVjdGVkJywgaXRlbSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzRmF2b3VyaXRlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuZmF2b3VyaXRlcy5pbmRleE9mKGl0ZW0pICE9PSAtMTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBhZGRzIGEgbmV3IGl0ZW0gdG8gdGhlIGZhdm91cml0ZXMgb3IgcmVtb3ZlcyBpdCBpZiBpdCBpcyBhbHJlYWR5IGEgZmF2b3VyaXRlXG4gICAgICAgICRzY29wZS50b2dnbGVGYXZvdXJpdGUgPSBmdW5jdGlvbiAoZSwgaXRlbSkge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIHZhciBpbmRleCA9ICRzY29wZS5mYXZvdXJpdGVzLmluZGV4T2YoaXRlbSk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xICYmICRzY29wZS5mYXZvdXJpdGVzLmxlbmd0aCA8IG1heEZhdm91cml0ZXMpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RvcmVGYXZvdXJpdGVzKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmV0dXJucyB3aGV0aGVyIHRoZSB1c2VyIGlzIHN0aWxsIGFsbG93ZWQgdG8gYWRkIGZhdm91cml0ZXNcbiAgICAgICAgJHNjb3BlLmZhdm91cml0ZXNMZWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5mYXZvdXJpdGVzLmxlbmd0aCA8IG1heEZhdm91cml0ZXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2VsZWN0IGZhdm91cml0ZXMgb24gbnVtYmVycyAxLTlcbiAgICAgICAgJHNjb3BlLiRvbigna2V5cHJlc3MnLCBmdW5jdGlvbiAoZSwga2V5RXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBjaGFyQ29kZSA9IChrZXlFdmVudC53aGljaCkgPyBrZXlFdmVudC53aGljaCA6IGtleUV2ZW50LmtleUNvZGU7XG4gICAgICAgICAgICB2YXIgbnVtYmVyID0gcGFyc2VJbnQoU3RyaW5nLmZyb21DaGFyQ29kZShjaGFyQ29kZSkpO1xuICAgICAgICAgICAgaWYgKCFpc05hTihudW1iZXIpICYmIG51bWJlciA+IDAgJiYgbnVtYmVyIDw9ICRzY29wZS5mYXZvdXJpdGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RJdGVtKCRzY29wZS5mYXZvdXJpdGVzW251bWJlciAtIDFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQ29uZmlkZW5jZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGNvbmZpZGVuY2UgY29udHJvbFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NvbmZpZGVuY2VDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbGFiZWxzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuY29uZmlkZW5jZSA9IDEuMDtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ2NvbmZpZGVuY2UnLCBmdW5jdGlvbiAoY29uZmlkZW5jZSkge1xuXHRcdFx0bGFiZWxzLnNldEN1cnJlbnRDb25maWRlbmNlKHBhcnNlRmxvYXQoY29uZmlkZW5jZSkpO1xuXG5cdFx0XHRpZiAoY29uZmlkZW5jZSA8PSAwLjI1KSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtZGFuZ2VyJztcblx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjUgKSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtd2FybmluZyc7XG5cdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC43NSApIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC1zdWNjZXNzJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtcHJpbWFyeSc7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENvbnRyb2xzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBjb250cm9sIGJ1dHRvbnNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDb250cm9sc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywgbGFiZWxzLCBtc2csICRhdHRycykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGRyYXdpbmcgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5zZWxlY3RTaGFwZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0XHRpZiAoIWxhYmVscy5oYXNTZWxlY3RlZCgpKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdzaWRlYmFyLmZvbGRvdXQuZG8tb3BlbicsICdjYXRlZ29yaWVzJyk7XG5cdFx0XHRcdG1zZy5pbmZvKCRhdHRycy5zZWxlY3RDYXRlZ29yeSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0bWFwQW5ub3RhdGlvbnMuZmluaXNoRHJhd2luZygpO1xuXG5cdFx0XHRpZiAobmFtZSA9PT0gbnVsbCB8fCAoZHJhd2luZyAmJiAkc2NvcGUuc2VsZWN0ZWRTaGFwZSA9PT0gbmFtZSkpIHtcblx0XHRcdFx0JHNjb3BlLnNlbGVjdGVkU2hhcGUgPSAnJztcblx0XHRcdFx0ZHJhd2luZyA9IGZhbHNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLnNlbGVjdGVkU2hhcGUgPSBuYW1lO1xuXHRcdFx0XHRtYXBBbm5vdGF0aW9ucy5zdGFydERyYXdpbmcobmFtZSk7XG5cdFx0XHRcdGRyYXdpbmcgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH07XG5cbiAgICAgICAgJHNjb3BlLiRvbigna2V5cHJlc3MnLCBmdW5jdGlvbiAoZSwga2V5RXZlbnQpIHtcbiAgICAgICAgICAgIC8vIGRlc2VsZWN0IGRyYXdpbmcgdG9vbCBvbiBlc2NhcGVcbiAgICAgICAgICAgIGlmIChrZXlFdmVudC5rZXlDb2RlID09PSAyNykge1xuICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZShudWxsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgY2hhckNvZGUgPSAoa2V5RXZlbnQud2hpY2gpID8ga2V5RXZlbnQud2hpY2ggOiBrZXlFdmVudC5rZXlDb2RlO1xuICAgICAgICAgICAgc3dpdGNoIChTdHJpbmcuZnJvbUNoYXJDb2RlKGNoYXJDb2RlKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnYSc6XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnUG9pbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncyc6XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnUmVjdGFuZ2xlJyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2QnOlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ0NpcmNsZScpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdmJzpcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdMaW5lU3RyaW5nJyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2cnOlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ1BvbHlnb24nKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBNaW5pbWFwQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgbWluaW1hcCBpbiB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ01pbmltYXBDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwLCBtYXBJbWFnZSwgJGVsZW1lbnQsIHN0eWxlcykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciB2aWV3cG9ydFNvdXJjZSA9IG5ldyBvbC5zb3VyY2UuVmVjdG9yKCk7XG5cblx0XHR2YXIgbWluaW1hcCA9IG5ldyBvbC5NYXAoe1xuXHRcdFx0dGFyZ2V0OiAnbWluaW1hcCcsXG5cdFx0XHQvLyByZW1vdmUgY29udHJvbHNcblx0XHRcdGNvbnRyb2xzOiBbXSxcblx0XHRcdC8vIGRpc2FibGUgaW50ZXJhY3Rpb25zXG5cdFx0XHRpbnRlcmFjdGlvbnM6IFtdXG5cdFx0fSk7XG5cbiAgICAgICAgdmFyIG1hcFNpemUgPSBtYXAuZ2V0U2l6ZSgpO1xuXG5cdFx0Ly8gZ2V0IHRoZSBzYW1lIGxheWVycyB0aGFuIHRoZSBtYXBcblx0XHRtaW5pbWFwLmFkZExheWVyKG1hcEltYWdlLmdldExheWVyKCkpO1xuICAgICAgICBtaW5pbWFwLmFkZExheWVyKG5ldyBvbC5sYXllci5WZWN0b3Ioe1xuICAgICAgICAgICAgc291cmNlOiB2aWV3cG9ydFNvdXJjZSxcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZXMudmlld3BvcnRcbiAgICAgICAgfSkpO1xuXG5cdFx0dmFyIHZpZXdwb3J0ID0gbmV3IG9sLkZlYXR1cmUoKTtcblx0XHR2aWV3cG9ydFNvdXJjZS5hZGRGZWF0dXJlKHZpZXdwb3J0KTtcblxuXHRcdC8vIHJlZnJlc2ggdGhlIHZpZXcgKHRoZSBpbWFnZSBzaXplIGNvdWxkIGhhdmUgYmVlbiBjaGFuZ2VkKVxuXHRcdCRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC5zZXRWaWV3KG5ldyBvbC5WaWV3KHtcblx0XHRcdFx0cHJvamVjdGlvbjogbWFwSW1hZ2UuZ2V0UHJvamVjdGlvbigpLFxuXHRcdFx0XHRjZW50ZXI6IG9sLmV4dGVudC5nZXRDZW50ZXIobWFwSW1hZ2UuZ2V0RXh0ZW50KCkpLFxuXHRcdFx0XHR6b29tOiAwXG5cdFx0XHR9KSk7XG5cdFx0fSk7XG5cblx0XHQvLyBtb3ZlIHRoZSB2aWV3cG9ydCByZWN0YW5nbGUgb24gdGhlIG1pbmltYXBcblx0XHR2YXIgcmVmcmVzaFZpZXdwb3J0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmlld3BvcnQuc2V0R2VvbWV0cnkob2wuZ2VvbS5Qb2x5Z29uLmZyb21FeHRlbnQoXG4gICAgICAgICAgICAgICAgbWFwLmdldFZpZXcoKS5jYWxjdWxhdGVFeHRlbnQobWFwU2l6ZSlcbiAgICAgICAgICAgICkpO1xuXHRcdH07XG5cblx0XHRtYXAub24oJ3Bvc3Rjb21wb3NlJywgcmVmcmVzaFZpZXdwb3J0KTtcblxuXHRcdHZhciBkcmFnVmlld3BvcnQgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0bWFwLmdldFZpZXcoKS5zZXRDZW50ZXIoZS5jb29yZGluYXRlKTtcblx0XHR9O1xuXG5cdFx0bWluaW1hcC5vbigncG9pbnRlcmRyYWcnLCBkcmFnVmlld3BvcnQpO1xuXG5cdFx0JGVsZW1lbnQub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtaW5pbWFwLnVuKCdwb2ludGVyZHJhZycsIGRyYWdWaWV3cG9ydCk7XG5cdFx0fSk7XG5cblx0XHQkZWxlbWVudC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcdG1pbmltYXAub24oJ3BvaW50ZXJkcmFnJywgZHJhZ1ZpZXdwb3J0KTtcblx0XHR9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2VsZWN0ZWRMYWJlbENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNlbGVjdGVkIGxhYmVsIGRpc3BsYXkgaW4gdGhlIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NlbGVjdGVkTGFiZWxDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbGFiZWxzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLmdldFNlbGVjdGVkTGFiZWwgPSBsYWJlbHMuZ2V0U2VsZWN0ZWQ7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNpZGViYXJDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2lkZWJhckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkcm9vdFNjb3BlLCBtYXBBbm5vdGF0aW9ucykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBmb2xkb3V0U3RvcmFnZUtleSA9ICdkaWFzLmFubm90YXRpb25zLnNpZGViYXItZm9sZG91dCc7XG5cbiAgICAgICAgJHNjb3BlLmZvbGRvdXQgPSAnJztcblxuXHRcdCRzY29wZS5vcGVuRm9sZG91dCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2ZvbGRvdXRTdG9yYWdlS2V5XSA9IG5hbWU7XG4gICAgICAgICAgICAkc2NvcGUuZm9sZG91dCA9IG5hbWU7XG5cdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NpZGViYXIuZm9sZG91dC5vcGVuJywgbmFtZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jbG9zZUZvbGRvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oZm9sZG91dFN0b3JhZ2VLZXkpO1xuXHRcdFx0JHNjb3BlLmZvbGRvdXQgPSAnJztcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2lkZWJhci5mb2xkb3V0LmNsb3NlJyk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVGb2xkb3V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRcdGlmICgkc2NvcGUuZm9sZG91dCA9PT0gbmFtZSkge1xuXHRcdFx0XHQkc2NvcGUuY2xvc2VGb2xkb3V0KCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUub3BlbkZvbGRvdXQobmFtZSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5kZWxldGVTZWxlY3RlZEFubm90YXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKG1hcEFubm90YXRpb25zLmdldFNlbGVjdGVkRmVhdHVyZXMoKS5nZXRMZW5ndGgoKSA+IDAgJiYgY29uZmlybSgnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSBhbGwgc2VsZWN0ZWQgYW5ub3RhdGlvbnM/JykpIHtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5kZWxldGVTZWxlY3RlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKCdzaWRlYmFyLmZvbGRvdXQuZG8tb3BlbicsIGZ1bmN0aW9uIChlLCBuYW1lKSB7XG4gICAgICAgICAgICAkc2NvcGUub3BlbkZvbGRvdXQobmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS4kb24oJ2tleXByZXNzJywgZnVuY3Rpb24gKGUsIGtleUV2ZW50KSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGtleUV2ZW50LmtleUNvZGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDk6XG4gICAgICAgICAgICAgICAgICAgIGtleUV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS50b2dnbGVGb2xkb3V0KCdjYXRlZ29yaWVzJyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDY6XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5kZWxldGVTZWxlY3RlZEFubm90YXRpb25zKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyB0aGUgY3VycmVudGx5IG9wZW5lZCBzaWRlYmFyLSdleHRlbnNpb24nIGlzIHJlbWVtYmVyZWQgdGhyb3VnaCBsb2NhbFN0b3JhZ2VcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICAkc2NvcGUub3BlbkZvbGRvdXQod2luZG93LmxvY2FsU3RvcmFnZVtmb2xkb3V0U3RvcmFnZUtleV0pO1xuICAgICAgICB9XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIGRlYm91bmNlXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgZGVib3VuY2Ugc2VydmljZSB0byBwZXJmb3JtIGFuIGFjdGlvbiBvbmx5IHdoZW4gdGhpcyBmdW5jdGlvblxuICogd2Fzbid0IGNhbGxlZCBhZ2FpbiBpbiBhIHNob3J0IHBlcmlvZCBvZiB0aW1lLlxuICogc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEzMzIwMDE2LzE3OTY1MjNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5mYWN0b3J5KCdkZWJvdW5jZScsIGZ1bmN0aW9uICgkdGltZW91dCwgJHEpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciB0aW1lb3V0cyA9IHt9O1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChmdW5jLCB3YWl0LCBpZCkge1xuXHRcdFx0Ly8gQ3JlYXRlIGEgZGVmZXJyZWQgb2JqZWN0IHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHdlIG5lZWQgdG9cblx0XHRcdC8vIGFjdHVhbGx5IGNhbGwgdGhlIGZ1bmNcblx0XHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0XHRcdHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHRpbWVvdXRzW2lkXSA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncykpO1xuXHRcdFx0XHRcdGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aWYgKHRpbWVvdXRzW2lkXSkge1xuXHRcdFx0XHRcdCR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0c1tpZF0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRpbWVvdXRzW2lkXSA9ICR0aW1lb3V0KGxhdGVyLCB3YWl0KTtcblx0XHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG5cdFx0XHR9KSgpO1xuXHRcdH07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBtYXBcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBmYWN0b3J5IGhhbmRsaW5nIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZmFjdG9yeSgnbWFwJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIG1hcCA9IG5ldyBvbC5NYXAoe1xuXHRcdFx0dGFyZ2V0OiAnY2FudmFzJyxcblx0XHRcdGNvbnRyb2xzOiBbXG5cdFx0XHRcdG5ldyBvbC5jb250cm9sLlpvb20oKSxcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuWm9vbVRvRXh0ZW50KCksXG5cdFx0XHRcdG5ldyBvbC5jb250cm9sLkZ1bGxTY3JlZW4oKVxuXHRcdFx0XSxcbiAgICAgICAgICAgIGludGVyYWN0aW9uczogb2wuaW50ZXJhY3Rpb24uZGVmYXVsdHMoe1xuICAgICAgICAgICAgICAgIGtleWJvYXJkOiBmYWxzZVxuICAgICAgICAgICAgfSlcblx0XHR9KTtcblxuXHRcdHJldHVybiBtYXA7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGFubm90YXRpb25zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSB0aGUgYW5ub3RhdGlvbnMgdG8gbWFrZSB0aGVtIGF2YWlsYWJsZSBpbiBtdWx0aXBsZSBjb250cm9sbGVycy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdhbm5vdGF0aW9ucycsIGZ1bmN0aW9uIChBbm5vdGF0aW9uLCBzaGFwZXMsIGxhYmVscywgbXNnKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgYW5ub3RhdGlvbnM7XG5cblx0XHR2YXIgcmVzb2x2ZVNoYXBlTmFtZSA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHRhbm5vdGF0aW9uLnNoYXBlID0gc2hhcGVzLmdldE5hbWUoYW5ub3RhdGlvbi5zaGFwZV9pZCk7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbjtcblx0XHR9O1xuXG5cdFx0dmFyIGFkZEFubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0YW5ub3RhdGlvbnMucHVzaChhbm5vdGF0aW9uKTtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR0aGlzLnF1ZXJ5ID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0YW5ub3RhdGlvbnMgPSBBbm5vdGF0aW9uLnF1ZXJ5KHBhcmFtcyk7XG5cdFx0XHRhbm5vdGF0aW9ucy4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uIChhKSB7XG5cdFx0XHRcdGEuZm9yRWFjaChyZXNvbHZlU2hhcGVOYW1lKTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb25zO1xuXHRcdH07XG5cblx0XHR0aGlzLmFkZCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcblx0XHRcdGlmICghcGFyYW1zLnNoYXBlX2lkICYmIHBhcmFtcy5zaGFwZSkge1xuXHRcdFx0XHRwYXJhbXMuc2hhcGVfaWQgPSBzaGFwZXMuZ2V0SWQocGFyYW1zLnNoYXBlKTtcblx0XHRcdH1cblx0XHRcdHZhciBsYWJlbCA9IGxhYmVscy5nZXRTZWxlY3RlZCgpO1xuXHRcdFx0cGFyYW1zLmxhYmVsX2lkID0gbGFiZWwuaWQ7XG5cdFx0XHRwYXJhbXMuY29uZmlkZW5jZSA9IGxhYmVscy5nZXRDdXJyZW50Q29uZmlkZW5jZSgpO1xuXHRcdFx0dmFyIGFubm90YXRpb24gPSBBbm5vdGF0aW9uLmFkZChwYXJhbXMpO1xuXHRcdFx0YW5ub3RhdGlvbi4kcHJvbWlzZVxuXHRcdFx0ICAgICAgICAgIC50aGVuKHJlc29sdmVTaGFwZU5hbWUpXG5cdFx0XHQgICAgICAgICAgLnRoZW4oYWRkQW5ub3RhdGlvbilcblx0XHRcdCAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuXG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbjtcblx0XHR9O1xuXG5cdFx0dGhpcy5kZWxldGUgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0Ly8gdXNlIGluZGV4IHRvIHNlZSBpZiB0aGUgYW5ub3RhdGlvbiBleGlzdHMgaW4gdGhlIGFubm90YXRpb25zIGxpc3Rcblx0XHRcdHZhciBpbmRleCA9IGFubm90YXRpb25zLmluZGV4T2YoYW5ub3RhdGlvbik7XG5cdFx0XHRpZiAoaW5kZXggPiAtMSkge1xuXHRcdFx0XHRyZXR1cm4gYW5ub3RhdGlvbi4kZGVsZXRlKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQvLyB1cGRhdGUgdGhlIGluZGV4IHNpbmNlIHRoZSBhbm5vdGF0aW9ucyBsaXN0IG1heSBoYXZlIGJlZW4gXG5cdFx0XHRcdFx0Ly8gbW9kaWZpZWQgaW4gdGhlIG1lYW50aW1lXG5cdFx0XHRcdFx0aW5kZXggPSBhbm5vdGF0aW9ucy5pbmRleE9mKGFubm90YXRpb24pO1xuXHRcdFx0XHRcdGFubm90YXRpb25zLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdH0sIG1zZy5yZXNwb25zZUVycm9yKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5mb3JFYWNoID0gZnVuY3Rpb24gKGZuKSB7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnMuZm9yRWFjaChmbik7XG5cdFx0fTtcblxuXHRcdHRoaXMuY3VycmVudCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9ucztcblx0XHR9O1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgaW1hZ2VzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1hbmFnZXMgKHByZS0pbG9hZGluZyBvZiB0aGUgaW1hZ2VzIHRvIGFubm90YXRlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2ltYWdlcycsIGZ1bmN0aW9uIChUcmFuc2VjdEltYWdlLCBVUkwsICRxLCBmaWx0ZXJTdWJzZXQsIFRSQU5TRUNUX0lEKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXHRcdC8vIGFycmF5IG9mIGFsbCBpbWFnZSBJRHMgb2YgdGhlIHRyYW5zZWN0XG5cdFx0dmFyIGltYWdlSWRzID0gW107XG5cdFx0Ly8gbWF4aW11bSBudW1iZXIgb2YgaW1hZ2VzIHRvIGhvbGQgaW4gYnVmZmVyXG5cdFx0dmFyIE1BWF9CVUZGRVJfU0laRSA9IDEwO1xuXHRcdC8vIGJ1ZmZlciBvZiBhbHJlYWR5IGxvYWRlZCBpbWFnZXNcblx0XHR2YXIgYnVmZmVyID0gW107XG5cblx0XHQvLyB0aGUgY3VycmVudGx5IHNob3duIGltYWdlXG5cdFx0dGhpcy5jdXJyZW50SW1hZ2UgPSB1bmRlZmluZWQ7XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBuZXh0IElEIG9mIHRoZSBzcGVjaWZpZWQgaW1hZ2Ugb3IgdGhlIG5leHQgSUQgb2YgdGhlXG5cdFx0ICogY3VycmVudCBpbWFnZSBpZiBubyBpbWFnZSB3YXMgc3BlY2lmaWVkLlxuXHRcdCAqL1xuXHRcdHZhciBuZXh0SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdHZhciBpbmRleCA9IGltYWdlSWRzLmluZGV4T2YoaWQpO1xuXHRcdFx0cmV0dXJuIGltYWdlSWRzWyhpbmRleCArIDEpICUgaW1hZ2VJZHMubGVuZ3RoXTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgcHJldmlvdXMgSUQgb2YgdGhlIHNwZWNpZmllZCBpbWFnZSBvciB0aGUgcHJldmlvdXMgSUQgb2Zcblx0XHQgKiB0aGUgY3VycmVudCBpbWFnZSBpZiBubyBpbWFnZSB3YXMgc3BlY2lmaWVkLlxuXHRcdCAqL1xuXHRcdHZhciBwcmV2SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdHZhciBpbmRleCA9IGltYWdlSWRzLmluZGV4T2YoaWQpO1xuXHRcdFx0dmFyIGxlbmd0aCA9IGltYWdlSWRzLmxlbmd0aDtcblx0XHRcdHJldHVybiBpbWFnZUlkc1soaW5kZXggLSAxICsgbGVuZ3RoKSAlIGxlbmd0aF07XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIHNwZWNpZmllZCBpbWFnZSBmcm9tIHRoZSBidWZmZXIgb3IgYHVuZGVmaW5lZGAgaWYgaXQgaXNcblx0XHQgKiBub3QgYnVmZmVyZWQuXG5cdFx0ICovXG5cdFx0dmFyIGdldEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRpZCA9IGlkIHx8IF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0XHRmb3IgKHZhciBpID0gYnVmZmVyLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdGlmIChidWZmZXJbaV0uX2lkID09IGlkKSByZXR1cm4gYnVmZmVyW2ldO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTZXRzIHRoZSBzcGVjaWZpZWQgaW1hZ2UgdG8gYXMgdGhlIGN1cnJlbnRseSBzaG93biBpbWFnZS5cblx0XHQgKi9cblx0XHR2YXIgc2hvdyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0X3RoaXMuY3VycmVudEltYWdlID0gZ2V0SW1hZ2UoaWQpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBMb2FkcyB0aGUgc3BlY2lmaWVkIGltYWdlIGVpdGhlciBmcm9tIGJ1ZmZlciBvciBmcm9tIHRoZSBleHRlcm5hbFxuXHRcdCAqIHJlc291cmNlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGdldHMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXNcblx0XHQgKiBsb2FkZWQuXG5cdFx0ICovXG5cdFx0dmFyIGZldGNoSW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0XHR2YXIgaW1nID0gZ2V0SW1hZ2UoaWQpO1xuXG5cdFx0XHRpZiAoaW1nKSB7XG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW1nKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuXHRcdFx0XHRpbWcuX2lkID0gaWQ7XG5cdFx0XHRcdGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0YnVmZmVyLnB1c2goaW1nKTtcblx0XHRcdFx0XHQvLyBjb250cm9sIG1heGltdW0gYnVmZmVyIHNpemVcblx0XHRcdFx0XHRpZiAoYnVmZmVyLmxlbmd0aCA+IE1BWF9CVUZGRVJfU0laRSkge1xuXHRcdFx0XHRcdFx0YnVmZmVyLnNoaWZ0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW1nKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAobXNnKSB7XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KG1zZyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGltZy5zcmMgPSBVUkwgKyBcIi9hcGkvdjEvaW1hZ2VzL1wiICsgaWQgKyBcIi9maWxlXCI7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBJbml0aWFsaXplcyB0aGUgc2VydmljZSBmb3IgYSBnaXZlbiB0cmFuc2VjdC4gUmV0dXJucyBhIHByb21pc2UgdGhhdFxuXHRcdCAqIGlzIHJlc29sdmVkLCB3aGVuIHRoZSBzZXJ2aWNlIGlzIGluaXRpYWxpemVkLlxuXHRcdCAqL1xuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGltYWdlSWRzID0gVHJhbnNlY3RJbWFnZS5xdWVyeSh7dHJhbnNlY3RfaWQ6IFRSQU5TRUNUX0lEfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGxvb2sgZm9yIGEgc2VxdWVuY2Ugb2YgaW1hZ2UgSURzIGluIGxvY2FsIHN0b3JhZ2UuXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBzZXF1ZW5jZSBpcyBwcm9kdWNlcyBieSB0aGUgdHJhbnNlY3QgaW5kZXggcGFnZSB3aGVuIHRoZSBpbWFnZXMgYXJlXG4gICAgICAgICAgICAgICAgLy8gc29ydGVkIG9yIGZpbHRlcmVkLiB3ZSB3YW50IHRvIHJlZmxlY3QgdGhlIHNhbWUgb3JkZXJpbmcgb3IgZmlsdGVyaW5nIGhlcmVcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGUgYW5ub3RhdG9yXG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlZFNlcXVlbmNlID0gd2luZG93LmxvY2FsU3RvcmFnZVsnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5pbWFnZXMnXTtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmVkU2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmVkU2VxdWVuY2UgPSBKU09OLnBhcnNlKHN0b3JlZFNlcXVlbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgc3VjaCBhIHN0b3JlZCBzZXF1ZW5jZSwgZmlsdGVyIG91dCBhbnkgaW1hZ2UgSURzIHRoYXQgZG8gbm90XG4gICAgICAgICAgICAgICAgICAgIC8vIGJlbG9uZyB0byB0aGUgdHJhbnNlY3QgKGFueSBtb3JlKSwgc2luY2Ugc29tZSBvZiB0aGVtIG1heSBoYXZlIGJlZW4gZGVsZXRlZFxuICAgICAgICAgICAgICAgICAgICAvLyBpbiB0aGUgbWVhbnRpbWVcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyU3Vic2V0KHN0b3JlZFNlcXVlbmNlLCBpbWFnZUlkcyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgcHJvbWlzZSBpcyBub3QgcmVtb3ZlZCB3aGVuIG92ZXJ3cml0aW5nIGltYWdlSWRzIHNpbmNlIHdlXG4gICAgICAgICAgICAgICAgICAgIC8vIG5lZWQgaXQgbGF0ZXIgb24uXG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlLiRwcm9taXNlID0gaW1hZ2VJZHMuJHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlLiRyZXNvbHZlZCA9IGltYWdlSWRzLiRyZXNvbHZlZDtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlbiBzZXQgdGhlIHN0b3JlZCBzZXF1ZW5jZSBhcyB0aGUgc2VxdWVuY2Ugb2YgaW1hZ2UgSURzIGluc3RlYWQgb2Ygc2ltcGx5XG4gICAgICAgICAgICAgICAgICAgIC8vIGFsbCBJRHMgYmVsb25naW5nIHRvIHRoZSB0cmFuc2VjdFxuICAgICAgICAgICAgICAgICAgICBpbWFnZUlkcyA9IHN0b3JlZFNlcXVlbmNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHMuJHByb21pc2U7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNob3cgdGhlIGltYWdlIHdpdGggdGhlIHNwZWNpZmllZCBJRC4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMuc2hvdyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIHByb21pc2UgPSBmZXRjaEltYWdlKGlkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzaG93KGlkKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyB3YWl0IGZvciBpbWFnZUlkcyB0byBiZSBsb2FkZWRcblx0XHRcdGltYWdlSWRzLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyBwcmUtbG9hZCBwcmV2aW91cyBhbmQgbmV4dCBpbWFnZXMgYnV0IGRvbid0IGRpc3BsYXkgdGhlbVxuXHRcdFx0XHRmZXRjaEltYWdlKG5leHRJZChpZCkpO1xuXHRcdFx0XHRmZXRjaEltYWdlKHByZXZJZChpZCkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBwcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBuZXh0IGltYWdlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzXG5cdFx0ICogcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXMgc2hvd24uXG5cdFx0ICovXG5cdFx0dGhpcy5uZXh0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF90aGlzLnNob3cobmV4dElkKCkpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBwcmV2aW91cyBpbWFnZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMucHJldiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfdGhpcy5zaG93KHByZXZJZCgpKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRDdXJyZW50SWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBsYWJlbHNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGZvciBhbm5vdGF0aW9uIGxhYmVscyB0byBwcm92aWRlIHNvbWUgY29udmVuaWVuY2UgZnVuY3Rpb25zLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2xhYmVscycsIGZ1bmN0aW9uIChBbm5vdGF0aW9uTGFiZWwsIExhYmVsLCBQcm9qZWN0TGFiZWwsIFByb2plY3QsIG1zZywgJHEsIFBST0pFQ1RfSURTKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZExhYmVsO1xuICAgICAgICB2YXIgY3VycmVudENvbmZpZGVuY2UgPSAxLjA7XG5cbiAgICAgICAgdmFyIGxhYmVscyA9IHt9O1xuXG4gICAgICAgIC8vIHRoaXMgcHJvbWlzZSBpcyByZXNvbHZlZCB3aGVuIGFsbCBsYWJlbHMgd2VyZSBsb2FkZWRcbiAgICAgICAgdGhpcy5wcm9taXNlID0gbnVsbDtcblxuICAgICAgICB0aGlzLmZldGNoRm9yQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICBpZiAoIWFubm90YXRpb24pIHJldHVybjtcblxuICAgICAgICAgICAgLy8gZG9uJ3QgZmV0Y2ggdHdpY2VcbiAgICAgICAgICAgIGlmICghYW5ub3RhdGlvbi5sYWJlbHMpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscyA9IEFubm90YXRpb25MYWJlbC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgIGFubm90YXRpb25faWQ6IGFubm90YXRpb24uaWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFubm90YXRpb24ubGFiZWxzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYXR0YWNoVG9Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IEFubm90YXRpb25MYWJlbC5hdHRhY2goe1xuICAgICAgICAgICAgICAgIGFubm90YXRpb25faWQ6IGFubm90YXRpb24uaWQsXG4gICAgICAgICAgICAgICAgbGFiZWxfaWQ6IHNlbGVjdGVkTGFiZWwuaWQsXG4gICAgICAgICAgICAgICAgY29uZmlkZW5jZTogY3VycmVudENvbmZpZGVuY2VcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsYWJlbC4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscy5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsYWJlbC4kcHJvbWlzZS5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG5cbiAgICAgICAgICAgIHJldHVybiBsYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJlbW92ZUZyb21Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24sIGxhYmVsKSB7XG4gICAgICAgICAgICAvLyB1c2UgaW5kZXggdG8gc2VlIGlmIHRoZSBsYWJlbCBleGlzdHMgZm9yIHRoZSBhbm5vdGF0aW9uXG4gICAgICAgICAgICB2YXIgaW5kZXggPSBhbm5vdGF0aW9uLmxhYmVscy5pbmRleE9mKGxhYmVsKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhYmVsLiRkZWxldGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGluZGV4IHNpbmNlIHRoZSBsYWJlbCBsaXN0IG1heSBoYXZlIGJlZW4gbW9kaWZpZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIG1lYW50aW1lXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gYW5ub3RhdGlvbi5sYWJlbHMuaW5kZXhPZihsYWJlbCk7XG4gICAgICAgICAgICAgICAgICAgIGFubm90YXRpb24ubGFiZWxzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgfSwgbXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0VHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge307XG4gICAgICAgICAgICB2YXIga2V5ID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBidWlsZCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBsYWJlbC5wYXJlbnRfaWQ7XG4gICAgICAgICAgICAgICAgaWYgKHRyZWVba2V5XVtwYXJlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XVtwYXJlbnRdLnB1c2gobGFiZWwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XVtwYXJlbnRdID0gW2xhYmVsXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnByb21pc2UudGhlbihmdW5jdGlvbiAobGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBsYWJlbHNba2V5XS5mb3JFYWNoKGJ1aWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbGFiZWxzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2V0U2VsZWN0ZWQgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkTGFiZWwgPSBsYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldFNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGVkTGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIXNlbGVjdGVkTGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRDdXJyZW50Q29uZmlkZW5jZSA9IGZ1bmN0aW9uIChjb25maWRlbmNlKSB7XG4gICAgICAgICAgICBjdXJyZW50Q29uZmlkZW5jZSA9IGNvbmZpZGVuY2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRDdXJyZW50Q29uZmlkZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50Q29uZmlkZW5jZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpbml0XG4gICAgICAgIChmdW5jdGlvbiAoX3RoaXMpIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBfdGhpcy5wcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIC8vIC0xIGJlY2F1c2Ugb2YgZ2xvYmFsIGxhYmVsc1xuICAgICAgICAgICAgdmFyIGZpbmlzaGVkID0gLTE7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFsbCBsYWJlbHMgYXJlIHRoZXJlLiBpZiB5ZXMsIHJlc29sdmVcbiAgICAgICAgICAgIHZhciBtYXliZVJlc29sdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCsrZmluaXNoZWQgPT09IFBST0pFQ1RfSURTLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGxhYmVscyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbGFiZWxzW251bGxdID0gTGFiZWwucXVlcnkobWF5YmVSZXNvbHZlKTtcblxuICAgICAgICAgICAgUFJPSkVDVF9JRFMuZm9yRWFjaChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgICAgICBQcm9qZWN0LmdldCh7aWQ6IGlkfSwgZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxzW3Byb2plY3QubmFtZV0gPSBQcm9qZWN0TGFiZWwucXVlcnkoe3Byb2plY3RfaWQ6IGlkfSwgbWF5YmVSZXNvbHZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSh0aGlzKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBtYXBBbm5vdGF0aW9uc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgaGFuZGxpbmcgdGhlIGFubm90YXRpb25zIGxheWVyIG9uIHRoZSBPcGVuTGF5ZXJzIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ21hcEFubm90YXRpb25zJywgZnVuY3Rpb24gKG1hcCwgaW1hZ2VzLCBhbm5vdGF0aW9ucywgZGVib3VuY2UsIHN0eWxlcykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBhbm5vdGF0aW9uRmVhdHVyZXMgPSBuZXcgb2wuQ29sbGVjdGlvbigpO1xuICAgICAgICB2YXIgYW5ub3RhdGlvblNvdXJjZSA9IG5ldyBvbC5zb3VyY2UuVmVjdG9yKHtcbiAgICAgICAgICAgIGZlYXR1cmVzOiBhbm5vdGF0aW9uRmVhdHVyZXNcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBhbm5vdGF0aW9uTGF5ZXIgPSBuZXcgb2wubGF5ZXIuVmVjdG9yKHtcbiAgICAgICAgICAgIHNvdXJjZTogYW5ub3RhdGlvblNvdXJjZSxcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZXMuZmVhdHVyZXNcbiAgICAgICAgfSk7XG5cblx0XHQvLyBzZWxlY3QgaW50ZXJhY3Rpb24gd29ya2luZyBvbiBcInNpbmdsZWNsaWNrXCJcblx0XHR2YXIgc2VsZWN0ID0gbmV3IG9sLmludGVyYWN0aW9uLlNlbGVjdCh7XG5cdFx0XHRzdHlsZTogc3R5bGVzLmhpZ2hsaWdodCxcbiAgICAgICAgICAgIGxheWVyczogW2Fubm90YXRpb25MYXllcl1cblx0XHR9KTtcblxuXHRcdHZhciBzZWxlY3RlZEZlYXR1cmVzID0gc2VsZWN0LmdldEZlYXR1cmVzKCk7XG5cblx0XHR2YXIgbW9kaWZ5ID0gbmV3IG9sLmludGVyYWN0aW9uLk1vZGlmeSh7XG5cdFx0XHRmZWF0dXJlczogYW5ub3RhdGlvbkZlYXR1cmVzLFxuXHRcdFx0Ly8gdGhlIFNISUZUIGtleSBtdXN0IGJlIHByZXNzZWQgdG8gZGVsZXRlIHZlcnRpY2VzLCBzb1xuXHRcdFx0Ly8gdGhhdCBuZXcgdmVydGljZXMgY2FuIGJlIGRyYXduIGF0IHRoZSBzYW1lIHBvc2l0aW9uXG5cdFx0XHQvLyBvZiBleGlzdGluZyB2ZXJ0aWNlc1xuXHRcdFx0ZGVsZXRlQ29uZGl0aW9uOiBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRyZXR1cm4gb2wuZXZlbnRzLmNvbmRpdGlvbi5zaGlmdEtleU9ubHkoZXZlbnQpICYmIG9sLmV2ZW50cy5jb25kaXRpb24uc2luZ2xlQ2xpY2soZXZlbnQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gZHJhd2luZyBpbnRlcmFjdGlvblxuXHRcdHZhciBkcmF3O1xuXG5cdFx0Ly8gY29udmVydCBhIHBvaW50IGFycmF5IHRvIGEgcG9pbnQgb2JqZWN0XG5cdFx0Ly8gcmUtaW52ZXJ0IHRoZSB5IGF4aXNcblx0XHR2YXIgY29udmVydEZyb21PTFBvaW50ID0gZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRyZXR1cm4ge3g6IHBvaW50WzBdLCB5OiBpbWFnZXMuY3VycmVudEltYWdlLmhlaWdodCAtIHBvaW50WzFdfTtcblx0XHR9O1xuXG5cdFx0Ly8gY29udmVydCBhIHBvaW50IG9iamVjdCB0byBhIHBvaW50IGFycmF5XG5cdFx0Ly8gaW52ZXJ0IHRoZSB5IGF4aXNcblx0XHR2YXIgY29udmVydFRvT0xQb2ludCA9IGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdFx0cmV0dXJuIFtwb2ludC54LCBpbWFnZXMuY3VycmVudEltYWdlLmhlaWdodCAtIHBvaW50LnldO1xuXHRcdH07XG5cblx0XHQvLyBhc3NlbWJsZXMgdGhlIGNvb3JkaW5hdGUgYXJyYXlzIGRlcGVuZGluZyBvbiB0aGUgZ2VvbWV0cnkgdHlwZVxuXHRcdC8vIHNvIHRoZXkgaGF2ZSBhIHVuaWZpZWQgZm9ybWF0XG5cdFx0dmFyIGdldENvb3JkaW5hdGVzID0gZnVuY3Rpb24gKGdlb21ldHJ5KSB7XG5cdFx0XHRzd2l0Y2ggKGdlb21ldHJ5LmdldFR5cGUoKSkge1xuXHRcdFx0XHRjYXNlICdDaXJjbGUnOlxuXHRcdFx0XHRcdC8vIHJhZGl1cyBpcyB0aGUgeCB2YWx1ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjaXJjbGVcblx0XHRcdFx0XHRyZXR1cm4gW2dlb21ldHJ5LmdldENlbnRlcigpLCBbZ2VvbWV0cnkuZ2V0UmFkaXVzKCksIDBdXTtcblx0XHRcdFx0Y2FzZSAnUG9seWdvbic6XG5cdFx0XHRcdGNhc2UgJ1JlY3RhbmdsZSc6XG5cdFx0XHRcdFx0cmV0dXJuIGdlb21ldHJ5LmdldENvb3JkaW5hdGVzKClbMF07XG5cdFx0XHRcdGNhc2UgJ1BvaW50Jzpcblx0XHRcdFx0XHRyZXR1cm4gW2dlb21ldHJ5LmdldENvb3JkaW5hdGVzKCldO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdHJldHVybiBnZW9tZXRyeS5nZXRDb29yZGluYXRlcygpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBzYXZlcyB0aGUgdXBkYXRlZCBnZW9tZXRyeSBvZiBhbiBhbm5vdGF0aW9uIGZlYXR1cmVcblx0XHR2YXIgaGFuZGxlR2VvbWV0cnlDaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIGZlYXR1cmUgPSBlLnRhcmdldDtcblx0XHRcdHZhciBzYXZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR2YXIgY29vcmRpbmF0ZXMgPSBnZXRDb29yZGluYXRlcyhmZWF0dXJlLmdldEdlb21ldHJ5KCkpO1xuXHRcdFx0XHRmZWF0dXJlLmFubm90YXRpb24ucG9pbnRzID0gY29vcmRpbmF0ZXMubWFwKGNvbnZlcnRGcm9tT0xQb2ludCk7XG5cdFx0XHRcdGZlYXR1cmUuYW5ub3RhdGlvbi4kc2F2ZSgpO1xuXHRcdFx0fTtcblx0XHRcdC8vIHRoaXMgZXZlbnQgaXMgcmFwaWRseSBmaXJlZCwgc28gd2FpdCB1bnRpbCB0aGUgZmlyaW5nIHN0b3BzXG5cdFx0XHQvLyBiZWZvcmUgc2F2aW5nIHRoZSBjaGFuZ2VzXG5cdFx0XHRkZWJvdW5jZShzYXZlLCA1MDAsIGZlYXR1cmUuYW5ub3RhdGlvbi5pZCk7XG5cdFx0fTtcblxuXHRcdHZhciBjcmVhdGVGZWF0dXJlID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdHZhciBnZW9tZXRyeTtcblx0XHRcdHZhciBwb2ludHMgPSBhbm5vdGF0aW9uLnBvaW50cy5tYXAoY29udmVydFRvT0xQb2ludCk7XG5cblx0XHRcdHN3aXRjaCAoYW5ub3RhdGlvbi5zaGFwZSkge1xuXHRcdFx0XHRjYXNlICdQb2ludCc6XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5Qb2ludChwb2ludHNbMF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdSZWN0YW5nbGUnOlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uUmVjdGFuZ2xlKFsgcG9pbnRzIF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdQb2x5Z29uJzpcblx0XHRcdFx0XHQvLyBleGFtcGxlOiBodHRwczovL2dpdGh1Yi5jb20vb3BlbmxheWVycy9vbDMvYmxvYi9tYXN0ZXIvZXhhbXBsZXMvZ2VvanNvbi5qcyNMMTI2XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5Qb2x5Z29uKFsgcG9pbnRzIF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdMaW5lU3RyaW5nJzpcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLkxpbmVTdHJpbmcocG9pbnRzKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnQ2lyY2xlJzpcblx0XHRcdFx0XHQvLyByYWRpdXMgaXMgdGhlIHggdmFsdWUgb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY2lyY2xlXG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5DaXJjbGUocG9pbnRzWzBdLCBwb2ludHNbMV1bMF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIHVuc3VwcG9ydGVkIHNoYXBlcyBhcmUgaWdub3JlZFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Vua25vd24gYW5ub3RhdGlvbiBzaGFwZTogJyArIGFubm90YXRpb24uc2hhcGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciBmZWF0dXJlID0gbmV3IG9sLkZlYXR1cmUoeyBnZW9tZXRyeTogZ2VvbWV0cnkgfSk7XG5cdFx0XHRmZWF0dXJlLm9uKCdjaGFuZ2UnLCBoYW5kbGVHZW9tZXRyeUNoYW5nZSk7XG5cdFx0XHRmZWF0dXJlLmFubm90YXRpb24gPSBhbm5vdGF0aW9uO1xuICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5hZGRGZWF0dXJlKGZlYXR1cmUpO1xuXHRcdH07XG5cblx0XHR2YXIgcmVmcmVzaEFubm90YXRpb25zID0gZnVuY3Rpb24gKGUsIGltYWdlKSB7XG5cdFx0XHQvLyBjbGVhciBmZWF0dXJlcyBvZiBwcmV2aW91cyBpbWFnZVxuICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5jbGVhcigpO1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5jbGVhcigpO1xuXG5cdFx0XHRhbm5vdGF0aW9ucy5xdWVyeSh7aWQ6IGltYWdlLl9pZH0pLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRhbm5vdGF0aW9ucy5mb3JFYWNoKGNyZWF0ZUZlYXR1cmUpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHZhciBoYW5kbGVOZXdGZWF0dXJlID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciBnZW9tZXRyeSA9IGUuZmVhdHVyZS5nZXRHZW9tZXRyeSgpO1xuXHRcdFx0dmFyIGNvb3JkaW5hdGVzID0gZ2V0Q29vcmRpbmF0ZXMoZ2VvbWV0cnkpO1xuXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbiA9IGFubm90YXRpb25zLmFkZCh7XG5cdFx0XHRcdGlkOiBpbWFnZXMuZ2V0Q3VycmVudElkKCksXG5cdFx0XHRcdHNoYXBlOiBnZW9tZXRyeS5nZXRUeXBlKCksXG5cdFx0XHRcdHBvaW50czogY29vcmRpbmF0ZXMubWFwKGNvbnZlcnRGcm9tT0xQb2ludClcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBpZiB0aGUgZmVhdHVyZSBjb3VsZG4ndCBiZSBzYXZlZCwgcmVtb3ZlIGl0IGFnYWluXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbi4kcHJvbWlzZS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5yZW1vdmVGZWF0dXJlKGUuZmVhdHVyZSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0ZS5mZWF0dXJlLm9uKCdjaGFuZ2UnLCBoYW5kbGVHZW9tZXRyeUNoYW5nZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgbWFwLmFkZExheWVyKGFubm90YXRpb25MYXllcik7XG5cdFx0XHQvLyBmZWF0dXJlT3ZlcmxheS5zZXRNYXAobWFwKTtcblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihzZWxlY3QpO1xuXHRcdFx0c2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIHJlZnJlc2hBbm5vdGF0aW9ucyk7XG5cblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMub24oJ2NoYW5nZTpsZW5ndGgnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdC8vIGlmIG5vdCBhbHJlYWR5IGRpZ2VzdGluZywgZGlnZXN0XG5cdFx0XHRcdGlmICghc2NvcGUuJCRwaGFzZSkge1xuXHRcdFx0XHRcdC8vIHByb3BhZ2F0ZSBuZXcgc2VsZWN0aW9ucyB0aHJvdWdoIHRoZSBhbmd1bGFyIGFwcGxpY2F0aW9uXG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLnN0YXJ0RHJhd2luZyA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICAgICAgICBzZWxlY3Quc2V0QWN0aXZlKGZhbHNlKTtcblxuXHRcdFx0dHlwZSA9IHR5cGUgfHwgJ1BvaW50Jztcblx0XHRcdGRyYXcgPSBuZXcgb2wuaW50ZXJhY3Rpb24uRHJhdyh7XG4gICAgICAgICAgICAgICAgc291cmNlOiBhbm5vdGF0aW9uU291cmNlLFxuXHRcdFx0XHR0eXBlOiB0eXBlLFxuXHRcdFx0XHRzdHlsZTogc3R5bGVzLmVkaXRpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24obW9kaWZ5KTtcblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihkcmF3KTtcblx0XHRcdGRyYXcub24oJ2RyYXdlbmQnLCBoYW5kbGVOZXdGZWF0dXJlKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5maW5pc2hEcmF3aW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0bWFwLnJlbW92ZUludGVyYWN0aW9uKGRyYXcpO1xuXHRcdFx0bWFwLnJlbW92ZUludGVyYWN0aW9uKG1vZGlmeSk7XG4gICAgICAgICAgICBzZWxlY3Quc2V0QWN0aXZlKHRydWUpO1xuXHRcdFx0Ly8gZG9uJ3Qgc2VsZWN0IHRoZSBsYXN0IGRyYXduIHBvaW50XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmNsZWFyKCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZGVsZXRlU2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmZvckVhY2goZnVuY3Rpb24gKGZlYXR1cmUpIHtcblx0XHRcdFx0YW5ub3RhdGlvbnMuZGVsZXRlKGZlYXR1cmUuYW5ub3RhdGlvbikudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0YW5ub3RhdGlvblNvdXJjZS5yZW1vdmVGZWF0dXJlKGZlYXR1cmUpO1xuXHRcdFx0XHRcdHNlbGVjdGVkRmVhdHVyZXMucmVtb3ZlKGZlYXR1cmUpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLnNlbGVjdCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIGZlYXR1cmU7XG5cdFx0XHRhbm5vdGF0aW9uU291cmNlLmZvckVhY2hGZWF0dXJlKGZ1bmN0aW9uIChmKSB7XG5cdFx0XHRcdGlmIChmLmFubm90YXRpb24uaWQgPT09IGlkKSB7XG5cdFx0XHRcdFx0ZmVhdHVyZSA9IGY7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gcmVtb3ZlIHNlbGVjdGlvbiBpZiBmZWF0dXJlIHdhcyBhbHJlYWR5IHNlbGVjdGVkLiBvdGhlcndpc2Ugc2VsZWN0LlxuXHRcdFx0aWYgKCFzZWxlY3RlZEZlYXR1cmVzLnJlbW92ZShmZWF0dXJlKSkge1xuXHRcdFx0XHRzZWxlY3RlZEZlYXR1cmVzLnB1c2goZmVhdHVyZSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuICAgICAgICAvLyBmaXRzIHRoZSB2aWV3IHRvIHRoZSBnaXZlbiBmZWF0dXJlXG4gICAgICAgIHRoaXMuZml0ID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLmZvckVhY2hGZWF0dXJlKGZ1bmN0aW9uIChmKSB7XG4gICAgICAgICAgICAgICAgaWYgKGYuYW5ub3RhdGlvbi5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFwLmdldFZpZXcoKS5maXQoZi5nZXRHZW9tZXRyeSgpLCBtYXAuZ2V0U2l6ZSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuXHRcdHRoaXMuY2xlYXJTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmNsZWFyKCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0U2VsZWN0ZWRGZWF0dXJlcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBzZWxlY3RlZEZlYXR1cmVzO1xuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG1hcEltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBoYW5kbGluZyB0aGUgaW1hZ2UgbGF5ZXIgb24gdGhlIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnbWFwSW1hZ2UnLCBmdW5jdGlvbiAobWFwKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cdFx0dmFyIGV4dGVudCA9IFswLCAwLCAwLCAwXTtcblxuXHRcdHZhciBwcm9qZWN0aW9uID0gbmV3IG9sLnByb2ouUHJvamVjdGlvbih7XG5cdFx0XHRjb2RlOiAnZGlhcy1pbWFnZScsXG5cdFx0XHR1bml0czogJ3BpeGVscycsXG5cdFx0XHRleHRlbnQ6IGV4dGVudFxuXHRcdH0pO1xuXG5cdFx0dmFyIGltYWdlTGF5ZXIgPSBuZXcgb2wubGF5ZXIuSW1hZ2UoKTtcblxuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uIChzY29wZSkge1xuXHRcdFx0bWFwLmFkZExheWVyKGltYWdlTGF5ZXIpO1xuXG5cdFx0XHQvLyByZWZyZXNoIHRoZSBpbWFnZSBzb3VyY2Vcblx0XHRcdHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCBmdW5jdGlvbiAoZSwgaW1hZ2UpIHtcblx0XHRcdFx0ZXh0ZW50WzJdID0gaW1hZ2Uud2lkdGg7XG5cdFx0XHRcdGV4dGVudFszXSA9IGltYWdlLmhlaWdodDtcblxuXHRcdFx0XHR2YXIgem9vbSA9IHNjb3BlLnZpZXdwb3J0Lnpvb207XG5cblx0XHRcdFx0dmFyIGNlbnRlciA9IHNjb3BlLnZpZXdwb3J0LmNlbnRlcjtcblx0XHRcdFx0Ly8gdmlld3BvcnQgY2VudGVyIGlzIHN0aWxsIHVuaW5pdGlhbGl6ZWRcblx0XHRcdFx0aWYgKGNlbnRlclswXSA9PT0gdW5kZWZpbmVkICYmIGNlbnRlclsxXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0Y2VudGVyID0gb2wuZXh0ZW50LmdldENlbnRlcihleHRlbnQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGltYWdlU3RhdGljID0gbmV3IG9sLnNvdXJjZS5JbWFnZVN0YXRpYyh7XG5cdFx0XHRcdFx0dXJsOiBpbWFnZS5zcmMsXG5cdFx0XHRcdFx0cHJvamVjdGlvbjogcHJvamVjdGlvbixcblx0XHRcdFx0XHRpbWFnZUV4dGVudDogZXh0ZW50XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGltYWdlTGF5ZXIuc2V0U291cmNlKGltYWdlU3RhdGljKTtcblxuXHRcdFx0XHRtYXAuc2V0VmlldyhuZXcgb2wuVmlldyh7XG5cdFx0XHRcdFx0cHJvamVjdGlvbjogcHJvamVjdGlvbixcblx0XHRcdFx0XHRjZW50ZXI6IGNlbnRlcixcblx0XHRcdFx0XHR6b29tOiB6b29tLFxuXHRcdFx0XHRcdHpvb21GYWN0b3I6IDEuNSxcblx0XHRcdFx0XHQvLyBhbGxvdyBhIG1heGltdW0gb2YgNHggbWFnbmlmaWNhdGlvblxuXHRcdFx0XHRcdG1pblJlc29sdXRpb246IDAuMjUsXG5cdFx0XHRcdFx0Ly8gcmVzdHJpY3QgbW92ZW1lbnRcblx0XHRcdFx0XHRleHRlbnQ6IGV4dGVudFxuXHRcdFx0XHR9KSk7XG5cblx0XHRcdFx0Ly8gaWYgem9vbSBpcyBub3QgaW5pdGlhbGl6ZWQsIGZpdCB0aGUgdmlldyB0byB0aGUgaW1hZ2UgZXh0ZW50XG5cdFx0XHRcdGlmICh6b29tID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRtYXAuZ2V0VmlldygpLmZpdChleHRlbnQsIG1hcC5nZXRTaXplKCkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRFeHRlbnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gZXh0ZW50O1xuXHRcdH07XG5cblx0XHR0aGlzLmdldFByb2plY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gcHJvamVjdGlvbjtcblx0XHR9O1xuXG4gICAgICAgIHRoaXMuZ2V0TGF5ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VMYXllcjtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgc3R5bGVzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgdGhlIE9wZW5MYXllcnMgc3R5bGVzXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnc3R5bGVzJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHdoaXRlID0gWzI1NSwgMjU1LCAyNTUsIDFdO1xuXHRcdHZhciBibHVlID0gWzAsIDE1MywgMjU1LCAxXTtcblx0XHR2YXIgb3JhbmdlID0gJyNmZjVlMDAnO1xuXHRcdHZhciB3aWR0aCA9IDM7XG5cblx0XHR0aGlzLmZlYXR1cmVzID0gW1xuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRjb2xvcjogd2hpdGUsXG5cdFx0XHRcdFx0d2lkdGg6IDVcblx0XHRcdFx0fSksXG5cdFx0XHRcdGltYWdlOiBuZXcgb2wuc3R5bGUuQ2lyY2xlKHtcblx0XHRcdFx0XHRyYWRpdXM6IDYsXG5cdFx0XHRcdFx0ZmlsbDogbmV3IG9sLnN0eWxlLkZpbGwoe1xuXHRcdFx0XHRcdFx0Y29sb3I6IGJsdWVcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdFx0Y29sb3I6IHdoaXRlLFxuXHRcdFx0XHRcdFx0d2lkdGg6IDJcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiBibHVlLFxuXHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdF07XG5cblx0XHR0aGlzLmhpZ2hsaWdodCA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IHdoaXRlLFxuXHRcdFx0XHRcdHdpZHRoOiA2XG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG5cdFx0XHRcdFx0cmFkaXVzOiA2LFxuXHRcdFx0XHRcdGZpbGw6IG5ldyBvbC5zdHlsZS5GaWxsKHtcblx0XHRcdFx0XHRcdGNvbG9yOiBvcmFuZ2Vcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdFx0Y29sb3I6IHdoaXRlLFxuXHRcdFx0XHRcdFx0d2lkdGg6IDNcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiBvcmFuZ2UsXG5cdFx0XHRcdFx0d2lkdGg6IDNcblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0XTtcblxuXHRcdHRoaXMuZWRpdGluZyA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IHdoaXRlLFxuXHRcdFx0XHRcdHdpZHRoOiA1XG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG5cdFx0XHRcdFx0cmFkaXVzOiA2LFxuXHRcdFx0XHRcdGZpbGw6IG5ldyBvbC5zdHlsZS5GaWxsKHtcblx0XHRcdFx0XHRcdGNvbG9yOiBibHVlXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRcdGNvbG9yOiB3aGl0ZSxcblx0XHRcdFx0XHRcdHdpZHRoOiAyLFxuXHRcdFx0XHRcdFx0bGluZURhc2g6IFszXVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0pXG5cdFx0XHR9KSxcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IGJsdWUsXG5cdFx0XHRcdFx0d2lkdGg6IDMsXG5cdFx0XHRcdFx0bGluZURhc2g6IFs1XVxuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHRdO1xuXG5cdFx0dGhpcy52aWV3cG9ydCA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IGJsdWUsXG5cdFx0XHRcdFx0d2lkdGg6IDNcblx0XHRcdFx0fSksXG5cdFx0XHR9KSxcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IHdoaXRlLFxuXHRcdFx0XHRcdHdpZHRoOiAxXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdF07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSB1cmxQYXJhbXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gVGhlIEdFVCBwYXJhbWV0ZXJzIG9mIHRoZSB1cmwuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgndXJsUGFyYW1zJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHN0YXRlID0ge307XG5cblx0XHQvLyB0cmFuc2Zvcm1zIGEgVVJMIHBhcmFtZXRlciBzdHJpbmcgbGlrZSAjYT0xJmI9MiB0byBhbiBvYmplY3Rcblx0XHR2YXIgZGVjb2RlU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gbG9jYXRpb24uaGFzaC5yZXBsYWNlKCcjJywgJycpXG5cdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnJicpO1xuXG5cdFx0XHR2YXIgc3RhdGUgPSB7fTtcblxuXHRcdFx0cGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKHBhcmFtKSB7XG5cdFx0XHRcdC8vIGNhcHR1cmUga2V5LXZhbHVlIHBhaXJzXG5cdFx0XHRcdHZhciBjYXB0dXJlID0gcGFyYW0ubWF0Y2goLyguKylcXD0oLispLyk7XG5cdFx0XHRcdGlmIChjYXB0dXJlICYmIGNhcHR1cmUubGVuZ3RoID09PSAzKSB7XG5cdFx0XHRcdFx0c3RhdGVbY2FwdHVyZVsxXV0gPSBkZWNvZGVVUklDb21wb25lbnQoY2FwdHVyZVsyXSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gc3RhdGU7XG5cdFx0fTtcblxuXHRcdC8vIHRyYW5zZm9ybXMgYW4gb2JqZWN0IHRvIGEgVVJMIHBhcmFtZXRlciBzdHJpbmdcblx0XHR2YXIgZW5jb2RlU3RhdGUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcblx0XHRcdHZhciBwYXJhbXMgPSAnJztcblx0XHRcdGZvciAodmFyIGtleSBpbiBzdGF0ZSkge1xuXHRcdFx0XHRwYXJhbXMgKz0ga2V5ICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0YXRlW2tleV0pICsgJyYnO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHBhcmFtcy5zdWJzdHJpbmcoMCwgcGFyYW1zLmxlbmd0aCAtIDEpO1xuXHRcdH07XG5cblx0XHR0aGlzLnB1c2hTdGF0ZSA9IGZ1bmN0aW9uIChzKSB7XG5cdFx0XHRzdGF0ZS5zbHVnID0gcztcblx0XHRcdGhpc3RvcnkucHVzaFN0YXRlKHN0YXRlLCAnJywgc3RhdGUuc2x1ZyArICcjJyArIGVuY29kZVN0YXRlKHN0YXRlKSk7XG5cdFx0fTtcblxuXHRcdC8vIHNldHMgYSBVUkwgcGFyYW1ldGVyIGFuZCB1cGRhdGVzIHRoZSBoaXN0b3J5IHN0YXRlXG5cdFx0dGhpcy5zZXQgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gcGFyYW1zKSB7XG5cdFx0XHRcdHN0YXRlW2tleV0gPSBwYXJhbXNba2V5XTtcblx0XHRcdH1cblx0XHRcdGhpc3RvcnkucmVwbGFjZVN0YXRlKHN0YXRlLCAnJywgc3RhdGUuc2x1ZyArICcjJyArIGVuY29kZVN0YXRlKHN0YXRlKSk7XG5cdFx0fTtcblxuXHRcdC8vIHJldHVybnMgYSBVUkwgcGFyYW1ldGVyXG5cdFx0dGhpcy5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRyZXR1cm4gc3RhdGVba2V5XTtcblx0XHR9O1xuXG5cdFx0c3RhdGUgPSBoaXN0b3J5LnN0YXRlO1xuXG5cdFx0aWYgKCFzdGF0ZSkge1xuXHRcdFx0c3RhdGUgPSBkZWNvZGVTdGF0ZSgpO1xuXHRcdH1cblx0fVxuKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=