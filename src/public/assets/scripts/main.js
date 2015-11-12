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
angular.module('dias.annotations').service('images', ["TransectImage", "URL", "$q", "filterSubset", function (TransectImage, URL, $q, filterSubset) {
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
			imageIds = TransectImage.query({transect_id: transectId}, function () {
                // look for a sequence of image IDs in local storage.
                // this sequence is produces by the transect index page when the images are
                // sorted or filtered. we want to reflect the same ordering or filtering here
                // in the annotator
                var storedSequence = window.localStorage['dias.transects.' + transectId + '.images'];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0b3JDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ2FudmFzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NhdGVnb3JpZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ29uZmlkZW5jZUNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Db250cm9sc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9NaW5pbWFwQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NlbGVjdGVkTGFiZWxDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2lkZWJhckNvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2Fubm90YXRpb25MaXN0SXRlbS5qcyIsImRpcmVjdGl2ZXMvbGFiZWxDYXRlZ29yeUl0ZW0uanMiLCJkaXJlY3RpdmVzL2xhYmVsSXRlbS5qcyIsImZhY3Rvcmllcy9kZWJvdW5jZS5qcyIsImZhY3Rvcmllcy9tYXAuanMiLCJzZXJ2aWNlcy9hbm5vdGF0aW9ucy5qcyIsInNlcnZpY2VzL2ltYWdlcy5qcyIsInNlcnZpY2VzL2xhYmVscy5qcyIsInNlcnZpY2VzL21hcEFubm90YXRpb25zLmpzIiwic2VydmljZXMvbWFwSW1hZ2UuanMiLCJzZXJ2aWNlcy9zdHlsZXMuanMiLCJzZXJ2aWNlcy91cmxQYXJhbXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsb0JBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7QUNHQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSx5RkFBQSxVQUFBLFFBQUEsZ0JBQUEsUUFBQSxhQUFBLFFBQUE7RUFDQTs7RUFFQSxPQUFBLG1CQUFBLGVBQUEsc0JBQUE7O0VBRUEsT0FBQSxpQkFBQSxvQkFBQSxVQUFBLFVBQUE7R0FDQSxTQUFBLFFBQUEsVUFBQSxTQUFBO0lBQ0EsT0FBQSxtQkFBQSxRQUFBOzs7O0VBSUEsSUFBQSxxQkFBQSxZQUFBO0dBQ0EsT0FBQSxjQUFBLFlBQUE7OztFQUdBLElBQUEsbUJBQUEsZUFBQTs7RUFFQSxPQUFBLGNBQUE7O0VBRUEsT0FBQSxpQkFBQSxlQUFBOztFQUVBLE9BQUEsbUJBQUEsVUFBQSxHQUFBLElBQUE7O0dBRUEsSUFBQSxDQUFBLEVBQUEsVUFBQTtJQUNBLE9BQUE7O0dBRUEsZUFBQSxPQUFBOzs7UUFHQSxPQUFBLGdCQUFBLGVBQUE7O0VBRUEsT0FBQSxhQUFBLFVBQUEsSUFBQTtHQUNBLElBQUEsV0FBQTtHQUNBLGlCQUFBLFFBQUEsVUFBQSxTQUFBO0lBQ0EsSUFBQSxRQUFBLGNBQUEsUUFBQSxXQUFBLE1BQUEsSUFBQTtLQUNBLFdBQUE7OztHQUdBLE9BQUE7OztFQUdBLE9BQUEsSUFBQSxlQUFBOzs7Ozs7Ozs7OztBQ3pDQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSxvRkFBQSxVQUFBLFFBQUEsUUFBQSxRQUFBLFdBQUEsS0FBQSxRQUFBO1FBQ0E7O1FBRUEsT0FBQSxTQUFBO1FBQ0EsT0FBQSxlQUFBO1FBQ0EsT0FBQSxXQUFBLENBQUEsQ0FBQSxPQUFBOztRQUVBLE9BQUEsYUFBQSxPQUFBLGFBQUEsT0FBQSxXQUFBLE1BQUEsT0FBQTs7UUFFQSxPQUFBLGNBQUEsT0FBQTs7O1FBR0EsT0FBQSxXQUFBO1lBQ0EsTUFBQSxVQUFBLElBQUE7WUFDQSxRQUFBLENBQUEsVUFBQSxJQUFBLE1BQUEsVUFBQSxJQUFBOzs7O1FBSUEsSUFBQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQSxlQUFBO1lBQ0EsT0FBQSxXQUFBLGVBQUEsT0FBQSxPQUFBOzs7O1FBSUEsSUFBQSxZQUFBLFlBQUE7WUFDQSxVQUFBLFVBQUEsT0FBQSxPQUFBLGFBQUE7Ozs7UUFJQSxJQUFBLGVBQUEsWUFBQTtZQUNBLE9BQUEsZUFBQTs7OztRQUlBLElBQUEsWUFBQSxVQUFBLElBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQSxLQUFBLFNBQUE7MEJBQ0EsS0FBQTswQkFDQSxNQUFBLElBQUE7OztRQUdBLElBQUEsa0JBQUEsVUFBQSxHQUFBO1lBQ0EsUUFBQSxFQUFBO2dCQUNBLEtBQUE7b0JBQ0EsT0FBQTtvQkFDQTtnQkFDQSxLQUFBO2dCQUNBLEtBQUE7b0JBQ0EsT0FBQTtvQkFDQTtnQkFDQTtvQkFDQSxPQUFBLE9BQUEsWUFBQTt3QkFDQSxPQUFBLFdBQUEsWUFBQTs7Ozs7O1FBTUEsT0FBQSxZQUFBLFlBQUE7WUFDQTtZQUNBLE9BQUE7bUJBQ0EsS0FBQTttQkFDQSxLQUFBO21CQUNBLE1BQUEsSUFBQTs7OztRQUlBLE9BQUEsWUFBQSxZQUFBO1lBQ0E7WUFDQSxPQUFBO21CQUNBLEtBQUE7bUJBQ0EsS0FBQTttQkFDQSxNQUFBLElBQUE7Ozs7UUFJQSxPQUFBLElBQUEsa0JBQUEsU0FBQSxHQUFBLFFBQUE7WUFDQSxPQUFBLFNBQUEsT0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQSxLQUFBLE1BQUEsT0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQSxLQUFBLE1BQUEsT0FBQSxPQUFBO1lBQ0EsVUFBQSxJQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBLE9BQUE7Z0JBQ0EsR0FBQSxPQUFBLFNBQUEsT0FBQTs7Ozs7UUFLQSxPQUFBLGFBQUEsU0FBQSxHQUFBO1lBQ0EsSUFBQSxRQUFBLEVBQUE7WUFDQSxJQUFBLFNBQUEsTUFBQSxTQUFBLFdBQUE7Z0JBQ0EsVUFBQSxNQUFBOzs7O1FBSUEsU0FBQSxpQkFBQSxXQUFBOzs7UUFHQSxPQUFBLEtBQUEsT0FBQTs7UUFFQSxVQUFBLE9BQUEsU0FBQSxLQUFBOzs7Ozs7Ozs7OztBQ3BHQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSxnRkFBQSxVQUFBLFFBQUEsVUFBQSxnQkFBQSxLQUFBLFVBQUE7RUFDQTs7O0VBR0EsSUFBQSxHQUFBLFdBQUEsU0FBQSxHQUFBO0dBQ0EsSUFBQSxPQUFBLElBQUE7R0FDQSxPQUFBLE1BQUEsa0JBQUE7SUFDQSxRQUFBLEtBQUE7SUFDQSxNQUFBLEtBQUE7Ozs7RUFJQSxTQUFBLEtBQUE7RUFDQSxlQUFBLEtBQUE7O0VBRUEsSUFBQSxhQUFBLFlBQUE7OztHQUdBLFNBQUEsV0FBQTtJQUNBLElBQUE7TUFDQSxHQUFBOzs7RUFHQSxPQUFBLElBQUEsd0JBQUE7RUFDQSxPQUFBLElBQUEseUJBQUE7Ozs7Ozs7Ozs7QUN4QkEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsNkNBQUEsVUFBQSxRQUFBLFFBQUE7UUFDQTs7O1FBR0EsSUFBQSxnQkFBQTtRQUNBLElBQUEsdUJBQUE7OztRQUdBLElBQUEsa0JBQUEsWUFBQTtZQUNBLElBQUEsTUFBQSxPQUFBLFdBQUEsSUFBQSxVQUFBLE1BQUE7Z0JBQ0EsT0FBQSxLQUFBOztZQUVBLE9BQUEsYUFBQSx3QkFBQSxLQUFBLFVBQUE7Ozs7UUFJQSxJQUFBLGlCQUFBLFlBQUE7WUFDQSxJQUFBLE9BQUEsYUFBQSx1QkFBQTtnQkFDQSxJQUFBLE1BQUEsS0FBQSxNQUFBLE9BQUEsYUFBQTtnQkFDQSxPQUFBLGFBQUEsT0FBQSxXQUFBLE9BQUEsVUFBQSxNQUFBOztvQkFFQSxPQUFBLElBQUEsUUFBQSxLQUFBLFFBQUEsQ0FBQTs7Ozs7UUFLQSxPQUFBLGFBQUEsQ0FBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUE7UUFDQSxPQUFBLGFBQUE7UUFDQSxPQUFBLGFBQUE7UUFDQSxPQUFBLFFBQUEsS0FBQSxVQUFBLEtBQUE7WUFDQSxLQUFBLElBQUEsT0FBQSxLQUFBO2dCQUNBLE9BQUEsYUFBQSxPQUFBLFdBQUEsT0FBQSxJQUFBOztZQUVBOzs7UUFHQSxPQUFBLGlCQUFBLE9BQUE7O1FBRUEsT0FBQSxhQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUEsaUJBQUE7WUFDQSxPQUFBLFdBQUEsdUJBQUE7OztRQUdBLE9BQUEsY0FBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLE9BQUEsV0FBQSxRQUFBLFVBQUEsQ0FBQTs7OztRQUlBLE9BQUEsa0JBQUEsVUFBQSxHQUFBLE1BQUE7WUFDQSxFQUFBO1lBQ0EsSUFBQSxRQUFBLE9BQUEsV0FBQSxRQUFBO1lBQ0EsSUFBQSxVQUFBLENBQUEsS0FBQSxPQUFBLFdBQUEsU0FBQSxlQUFBO2dCQUNBLE9BQUEsV0FBQSxLQUFBO21CQUNBO2dCQUNBLE9BQUEsV0FBQSxPQUFBLE9BQUE7O1lBRUE7Ozs7UUFJQSxPQUFBLGlCQUFBLFlBQUE7WUFDQSxPQUFBLE9BQUEsV0FBQSxTQUFBOzs7O1FBSUEsT0FBQSxJQUFBLFlBQUEsVUFBQSxHQUFBLFVBQUE7WUFDQSxJQUFBLFdBQUEsQ0FBQSxTQUFBLFNBQUEsU0FBQSxRQUFBLFNBQUE7WUFDQSxJQUFBLFNBQUEsU0FBQSxPQUFBLGFBQUE7WUFDQSxJQUFBLENBQUEsTUFBQSxXQUFBLFNBQUEsS0FBQSxVQUFBLE9BQUEsV0FBQSxRQUFBO2dCQUNBLE9BQUEsV0FBQSxPQUFBLFdBQUEsU0FBQTs7Ozs7Ozs7Ozs7OztBQ3RFQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSw2Q0FBQSxVQUFBLFFBQUEsUUFBQTtFQUNBOztFQUVBLE9BQUEsYUFBQTs7RUFFQSxPQUFBLE9BQUEsY0FBQSxVQUFBLFlBQUE7R0FDQSxPQUFBLHFCQUFBLFdBQUE7O0dBRUEsSUFBQSxjQUFBLE1BQUE7SUFDQSxPQUFBLGtCQUFBO1VBQ0EsSUFBQSxjQUFBLE1BQUE7SUFDQSxPQUFBLGtCQUFBO1VBQ0EsSUFBQSxjQUFBLE9BQUE7SUFDQSxPQUFBLGtCQUFBO1VBQ0E7SUFDQSxPQUFBLGtCQUFBOzs7Ozs7Ozs7Ozs7O0FDZkEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsOEVBQUEsVUFBQSxRQUFBLGdCQUFBLFFBQUEsS0FBQSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBOztFQUVBLE9BQUEsY0FBQSxVQUFBLE1BQUE7R0FDQSxJQUFBLENBQUEsT0FBQSxlQUFBO2dCQUNBLE9BQUEsTUFBQSwyQkFBQTtJQUNBLElBQUEsS0FBQSxPQUFBO0lBQ0E7OztHQUdBLGVBQUE7O0dBRUEsSUFBQSxTQUFBLFNBQUEsV0FBQSxPQUFBLGtCQUFBLE9BQUE7SUFDQSxPQUFBLGdCQUFBO0lBQ0EsVUFBQTtVQUNBO0lBQ0EsT0FBQSxnQkFBQTtJQUNBLGVBQUEsYUFBQTtJQUNBLFVBQUE7Ozs7UUFJQSxPQUFBLElBQUEsWUFBQSxVQUFBLEdBQUEsVUFBQTs7WUFFQSxJQUFBLFNBQUEsWUFBQSxJQUFBO2dCQUNBLE9BQUEsWUFBQTtnQkFDQTs7WUFFQSxJQUFBLFdBQUEsQ0FBQSxTQUFBLFNBQUEsU0FBQSxRQUFBLFNBQUE7WUFDQSxRQUFBLE9BQUEsYUFBQSxVQUFBO2dCQUNBLEtBQUE7b0JBQ0EsT0FBQSxZQUFBO29CQUNBO2dCQUNBLEtBQUE7b0JBQ0EsT0FBQSxZQUFBO29CQUNBO2dCQUNBLEtBQUE7b0JBQ0EsT0FBQSxZQUFBO29CQUNBO2dCQUNBLEtBQUE7b0JBQ0EsT0FBQSxZQUFBO29CQUNBO2dCQUNBLEtBQUE7b0JBQ0EsT0FBQSxZQUFBO29CQUNBOzs7Ozs7Ozs7Ozs7O0FDOUNBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLHlFQUFBLFVBQUEsUUFBQSxLQUFBLFVBQUEsVUFBQSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBLElBQUEsR0FBQSxJQUFBO0dBQ0EsUUFBQTs7R0FFQSxVQUFBOztHQUVBLGNBQUE7Ozs7RUFJQSxRQUFBLGNBQUEsSUFBQTs7RUFFQSxJQUFBLGlCQUFBLElBQUEsR0FBQSxlQUFBO0dBQ0EsS0FBQTtHQUNBLE9BQUEsT0FBQTs7O0VBR0EsSUFBQSxXQUFBLElBQUEsR0FBQTtFQUNBLGVBQUEsV0FBQTs7O0VBR0EsT0FBQSxJQUFBLGVBQUEsWUFBQTtHQUNBLFFBQUEsUUFBQSxJQUFBLEdBQUEsS0FBQTtJQUNBLFlBQUEsU0FBQTtJQUNBLFFBQUEsR0FBQSxPQUFBLFVBQUEsU0FBQTtJQUNBLE1BQUE7Ozs7O0VBS0EsSUFBQSxrQkFBQSxZQUFBO0dBQ0EsSUFBQSxTQUFBLElBQUEsVUFBQSxnQkFBQSxJQUFBO0dBQ0EsU0FBQSxZQUFBLEdBQUEsS0FBQSxRQUFBLFdBQUE7OztFQUdBLElBQUEsR0FBQSxXQUFB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LFVBQUEsWUFBQSxRQUFBLFFBQUEsS0FBQTtFQUNBOztFQUVBLElBQUE7O0VBRUEsSUFBQSxtQkFBQSxVQUFBLFlBQUE7R0FDQSxXQUFBLFFBQUEsT0FBQSxRQUFBLFdBQUE7R0FDQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBLFVBQUEsWUFBQTtHQUNBLFlBQUEsS0FBQTtHQUNBLE9BQUE7OztFQUdBLEtBQUEsUUFBQSxVQUFBLFFBQUE7R0FDQSxjQUFBLFdBQUEsTUFBQTtHQUNBLFlBQUEsU0FBQSxLQUFBLFVBQUEsR0FBQTtJQUNBLEVBQUEsUUFBQTs7R0FFQSxPQUFBOzs7RUFHQSxLQUFBLE1BQUEsVUFBQSxRQUFBO0dBQ0EsSUFBQSxDQUFBLE9BQUEsWUFBQSxPQUFBLE9BQUE7SUFDQSxPQUFBLFdBQUEsT0FBQSxNQUFBLE9BQUE7O0dBRUEsSUFBQSxRQUFBLE9BQUE7R0FDQSxPQUFBLFdBQUEsTUFBQTtHQUNBLE9BQUEsYUFBQSxPQUFBO0dBQ0EsSUFBQSxhQUFBLFdBQUEsSUFBQTtHQUNBLFdBQUE7Y0FDQSxLQUFBO2NBQ0EsS0FBQTtjQUNBLE1BQUEsSUFBQTs7R0FFQSxPQUFBOzs7RUFHQSxLQUFBLFNBQUEsVUFBQSxZQUFBOztHQUVBLElBQUEsUUFBQSxZQUFBLFFBQUE7R0FDQSxJQUFBLFFBQUEsQ0FBQSxHQUFBO0lBQ0EsT0FBQSxXQUFBLFFBQUEsWUFBQTs7O0tBR0EsUUFBQSxZQUFBLFFBQUE7S0FDQSxZQUFBLE9BQUEsT0FBQTtPQUNBLElBQUE7Ozs7RUFJQSxLQUFBLFVBQUEsVUFBQSxJQUFBO0dBQ0EsT0FBQSxZQUFBLFFBQUE7OztFQUdBLEtBQUEsVUFBQSxZQUFBO0dBQ0EsT0FBQTs7Ozs7Ozs7Ozs7QUN6REEsUUFBQSxPQUFBLG9CQUFBLFFBQUEseURBQUEsVUFBQSxlQUFBLEtBQUEsSUFBQSxjQUFBO0VBQ0E7O0VBRUEsSUFBQSxRQUFBOztFQUVBLElBQUEsV0FBQTs7RUFFQSxJQUFBLGtCQUFBOztFQUVBLElBQUEsU0FBQTs7O0VBR0EsS0FBQSxlQUFBOzs7Ozs7RUFNQSxJQUFBLFNBQUEsVUFBQSxJQUFBO0dBQ0EsS0FBQSxNQUFBLE1BQUEsYUFBQTtHQUNBLElBQUEsUUFBQSxTQUFBLFFBQUE7R0FDQSxPQUFBLFNBQUEsQ0FBQSxRQUFBLEtBQUEsU0FBQTs7Ozs7OztFQU9BLElBQUEsU0FBQSxVQUFBLElBQUE7R0FDQSxLQUFBLE1BQUEsTUFBQSxhQUFBO0dBQ0EsSUFBQSxRQUFBLFNBQUEsUUFBQTtHQUNBLElBQUEsU0FBQSxTQUFBO0dBQ0EsT0FBQSxTQUFBLENBQUEsUUFBQSxJQUFBLFVBQUE7Ozs7Ozs7RUFPQSxJQUFBLFdBQUEsVUFBQSxJQUFBO0dBQ0EsS0FBQSxNQUFBLE1BQUEsYUFBQTtHQUNBLEtBQUEsSUFBQSxJQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO0lBQ0EsSUFBQSxPQUFBLEdBQUEsT0FBQSxJQUFBLE9BQUEsT0FBQTs7O0dBR0EsT0FBQTs7Ozs7O0VBTUEsSUFBQSxPQUFBLFVBQUEsSUFBQTtHQUNBLE1BQUEsZUFBQSxTQUFBOzs7Ozs7OztFQVFBLElBQUEsYUFBQSxVQUFBLElBQUE7R0FDQSxJQUFBLFdBQUEsR0FBQTtHQUNBLElBQUEsTUFBQSxTQUFBOztHQUVBLElBQUEsS0FBQTtJQUNBLFNBQUEsUUFBQTtVQUNBO0lBQ0EsTUFBQSxTQUFBLGNBQUE7SUFDQSxJQUFBLE1BQUE7SUFDQSxJQUFBLFNBQUEsWUFBQTtLQUNBLE9BQUEsS0FBQTs7S0FFQSxJQUFBLE9BQUEsU0FBQSxpQkFBQTtNQUNBLE9BQUE7O0tBRUEsU0FBQSxRQUFBOztJQUVBLElBQUEsVUFBQSxVQUFBLEtBQUE7S0FDQSxTQUFBLE9BQUE7O0lBRUEsSUFBQSxNQUFBLE1BQUEsb0JBQUEsS0FBQTs7O0dBR0EsT0FBQSxTQUFBOzs7Ozs7O0VBT0EsS0FBQSxPQUFBLFVBQUEsWUFBQTtHQUNBLFdBQUEsY0FBQSxNQUFBLENBQUEsYUFBQSxhQUFBLFlBQUE7Ozs7O2dCQUtBLElBQUEsaUJBQUEsT0FBQSxhQUFBLG9CQUFBLGFBQUE7Z0JBQ0EsSUFBQSxnQkFBQTtv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WUFDQSxvQkFBQTs7O1FBR0EsS0FBQSx1QkFBQSxZQUFBO1lBQ0EsT0FBQTs7Ozs7Ozs7Ozs7O0FDdEhBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLHlFQUFBLFVBQUEsS0FBQSxRQUFBLGFBQUEsVUFBQSxRQUFBO0VBQ0E7O0VBRUEsSUFBQSxpQkFBQSxJQUFBLEdBQUEsZUFBQTtHQUNBLE9BQUEsT0FBQTs7O0VBR0EsSUFBQSxXQUFBLElBQUEsR0FBQTs7RUFFQSxlQUFBLFlBQUE7OztFQUdBLElBQUEsU0FBQSxJQUFBLEdBQUEsWUFBQSxPQUFBO0dBQ0EsT0FBQSxPQUFBOzs7RUFHQSxJQUFBLG1CQUFBLE9BQUE7O0VBRUEsSUFBQSxTQUFBLElBQUEsR0FBQSxZQUFBLE9BQUE7R0FDQSxVQUFBLGVBQUE7Ozs7R0FJQSxpQkFBQSxTQUFBLE9BQUE7SUFDQSxPQUFBLEdBQUEsT0FBQSxVQUFBLGFBQUEsVUFBQSxHQUFBLE9BQUEsVUFBQSxZQUFBOzs7OztFQUtBLElBQUE7Ozs7RUFJQSxJQUFBLHFCQUFBLFVBQUEsT0FBQTtHQUNBLE9BQUEsQ0FBQSxHQUFBLE1BQUEsSUFBQSxHQUFBLE9BQUEsYUFBQSxTQUFBLE1BQUE7Ozs7O0VBS0EsSUFBQSxtQkFBQSxVQUFBLE9BQUE7R0FDQSxPQUFBLENBQUEsTUFBQSxHQUFBLE9BQUEsYUFBQSxTQUFBLE1BQUE7Ozs7O0VBS0EsSUFBQSxpQkFBQSxVQUFBLFVBQUE7R0FDQSxRQUFBLFNBQUE7SUFDQSxLQUFBOztLQUVBLE9BQUEsQ0FBQSxTQUFBLGFBQUEsQ0FBQSxTQUFBLGFBQUE7SUFDQSxLQUFBO0lBQ0EsS0FBQTtLQUNBLE9BQUEsU0FBQSxpQkFBQTtJQUNBLEtBQUE7S0FDQSxPQUFBLENBQUEsU0FBQTtJQUNBO0tBQ0EsT0FBQSxTQUFBOzs7OztFQUtBLElBQUEsdUJBQUEsVUFBQSxHQUFBO0dBQ0EsSUFBQSxVQUFBLEVBQUE7R0FDQSxJQUFBLE9BQUEsWUFBQTtJQUNBLElBQUEsY0FBQSxlQUFBLFFBQUE7SUFDQSxRQUFBLFdBQUEsU0FBQSxZQUFBLElBQUE7SUFDQSxRQUFBLFdBQUE7Ozs7R0FJQSxTQUFBLE1BQUEsS0FBQSxRQUFBLFdBQUE7OztFQUdBLElBQUEsZ0JBQUEsVUFBQSxZQUFBO0dBQ0EsSUFBQTtHQUNBLElBQUEsU0FBQSxXQUFBLE9BQUEsSUFBQTs7R0FFQSxRQUFBLFdBQUE7SUFDQSxLQUFBO0tBQ0EsV0FBQSxJQUFBLEdBQUEsS0FBQSxNQUFBLE9BQUE7S0FDQTtJQUNBLEtBQUE7S0FDQSxXQUFBLElBQUEsR0FBQSxLQUFBLFVBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTs7S0FFQSxXQUFBLElBQUEsR0FBQSxLQUFBLFFBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTtLQUNBLFdBQUEsSUFBQSxHQUFBLEtBQUEsV0FBQTtLQUNBO0lBQ0EsS0FBQTs7S0FFQSxXQUFBLElBQUEsR0FBQSxLQUFBLE9BQUEsT0FBQSxJQUFBLE9BQUEsR0FBQTtLQUNBOzs7R0FHQSxJQUFBLFVBQUEsSUFBQSxHQUFBLFFBQUEsRUFBQSxVQUFBO0dBQ0EsUUFBQSxHQUFBLFVBQUE7R0FDQSxRQUFBLGFBQUE7R0FDQSxTQUFBLEtBQUE7OztFQUdBLElBQUEscUJBQUEsVUFBQSxHQUFBLE9BQUE7O0dBRUEsU0FBQTtHQUNBLGlCQUFBOztHQUVBLFlBQUEsTUFBQSxDQUFBLElBQUEsTUFBQSxNQUFBLFNBQUEsS0FBQSxZQUFBO0lBQ0EsWUFBQSxRQUFBOzs7O0VBSUEsSUFBQSxtQkFBQSxVQUFBLEdBQUE7R0FDQSxJQUFBLFdBQUEsRUFBQSxRQUFBO0dBQ0EsSUFBQSxjQUFBLGVBQUE7O0dBRUEsRUFBQSxRQUFBLGFBQUEsWUFBQSxJQUFBO0lBQ0EsSUFBQSxPQUFBO0lBQ0EsT0FBQSxTQUFBO0lBQ0EsUUFBQSxZQUFBLElBQUE7Ozs7R0FJQSxFQUFBLFFBQUEsV0FBQSxTQUFBLE1BQUEsWUFBQTtJQUNBLFNBQUEsT0FBQSxFQUFBOzs7R0FHQSxFQUFBLFFBQUEsR0FBQSxVQUFBOzs7RUFHQSxLQUFBLE9BQUEsVUFBQSxPQUFBO0dBQ0EsZUFBQSxPQUFBO0dBQ0EsSUFBQSxlQUFBO0dBQ0EsTUFBQSxJQUFBLGVBQUE7O0dBRUEsaUJBQUEsR0FBQSxpQkFBQSxZQUFBOztJQUVBLElBQUEsQ0FBQSxNQUFBLFNBQUE7O0tBRUEsTUFBQTs7Ozs7RUFLQSxLQUFBLGVBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxVQUFBOztHQUVBLE9BQUEsUUFBQTtHQUNBLE9BQUEsSUFBQSxHQUFBLFlBQUEsS0FBQTtJQUNBLFVBQUE7SUFDQSxNQUFBO0lBQ0EsT0FBQSxPQUFBOzs7R0FHQSxJQUFBLGVBQUE7R0FDQSxJQUFBLGVBQUE7R0FDQSxLQUFBLEdBQUEsV0FBQTs7O0VBR0EsS0FBQSxnQkFBQSxZQUFBO0dBQ0EsSUFBQSxrQkFBQTtHQUNBLElBQUEsa0JBQUE7WUFDQSxPQUFBLFVBQUE7O0dBRUEsaUJBQUE7OztFQUdBLEtBQUEsaUJBQUEsWUFBQTtHQUNBLGlCQUFBLFFBQUEsVUFBQSxTQUFBO0lBQ0EsWUFBQSxPQUFBLFFBQUEsWUFBQSxLQUFBLFlBQUE7S0FDQSxTQUFBLE9BQUE7S0FDQSxpQkFBQSxPQUFBOzs7OztFQUtBLEtBQUEsU0FBQSxVQUFBLElBQUE7R0FDQSxJQUFBO0dBQ0EsU0FBQSxRQUFBLFVBQUEsR0FBQTtJQUNBLElBQUEsRUFBQSxXQUFBLE9BQUEsSUFBQTtLQUNBLFVBQUE7Ozs7R0FJQSxJQUFBLENBQUEsaUJBQUEsT0FBQSxVQUFBO0lBQ0EsaUJBQUEsS0FBQTs7Ozs7UUFLQSxLQUFBLE1BQUEsVUFBQSxJQUFBO1lBQ0EsU0FBQSxRQUFBLFVBQUEsR0FBQTtnQkFDQSxJQUFBLEVBQUEsV0FBQSxPQUFBLElBQUE7b0JBQ0EsSUFBQSxVQUFBLFlBQUEsRUFBQSxlQUFBLElBQUE7Ozs7O0VBS0EsS0FBQSxpQkFBQSxZQUFBO0dBQ0EsaUJBQUE7OztFQUdBLEtBQUEsc0JBQUEsWUFBQTtHQUNBLE9BQUE7Ozs7Ozs7Ozs7OztBQzVNQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxvQkFBQSxVQUFBLEtBQUE7RUFDQTtFQUNBLElBQUEsU0FBQSxDQUFBLEdBQUEsR0FBQSxHQUFBOztFQUVBLElBQUEsYUFBQSxJQUFBLEdBQUEsS0FBQSxXQUFBO0dBQ0EsTUFBQTtHQUNBLE9BQUE7R0FDQSxRQUFBOzs7RUFHQSxJQUFBLGFBQUEsSUFBQSxHQUFBLE1BQUE7O0VBRUEsS0FBQSxPQUFBLFVBQUEsT0FBQTtHQUNBLElBQUEsU0FBQTs7O0dBR0EsTUFBQSxJQUFBLGVBQUEsVUFBQSxHQUFBLE9BQUE7SUFDQSxPQUFBLEtBQUEsTUFBQTtJQUNBLE9BQUEsS0FBQSxNQUFBOztJQUVBLElBQUEsT0FBQSxNQUFBLFNBQUE7O0lBRUEsSUFBQSxTQUFBLE1BQUEsU0FBQTs7SUFFQSxJQUFBLE9BQUEsT0FBQSxhQUFBLE9BQUEsT0FBQSxXQUFBO0tBQ0EsU0FBQSxHQUFBLE9BQUEsVUFBQTs7O0lBR0EsSUFBQSxjQUFBLElBQUEsR0FBQSxPQUFBLFlBQUE7S0FDQSxLQUFBLE1BQUE7S0FDQSxZQUFBO0tBQ0EsYUFBQTs7O0lBR0EsV0FBQSxVQUFBOztJQUVBLElBQUEsUUFBQSxJQUFBLEdBQUEsS0FBQTtLQUNBLFlBQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQTtLQUNBLFlBQUE7O0tBRUEsZUFBQTs7S0FFQSxRQUFBOzs7O0lBSUEsSUFBQSxTQUFBLFdBQUE7S0FDQSxJQUFBLFVBQUEsVUFBQSxRQUFBLElBQUE7Ozs7O0VBS0EsS0FBQSxZQUFBLFlBQUE7R0FDQSxPQUFBOzs7RUFHQSxLQUFBLGdCQUFBLFlBQUE7R0FDQSxPQUFBOzs7Ozs7Ozs7OztBQzNEQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxVQUFBLFlBQUE7RUFDQTs7RUFFQSxJQUFBLFFBQUEsQ0FBQSxLQUFBLEtBQUEsS0FBQTtFQUNBLElBQUEsT0FBQSxDQUFBLEdBQUEsS0FBQSxLQUFBO0VBQ0EsSUFBQSxTQUFBO0VBQ0EsSUFBQSxRQUFBOztFQUVBLEtBQUEsV0FBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsT0FBQTs7SUFFQSxPQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBO01BQ0EsT0FBQTs7S0FFQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7TUFDQSxPQUFBO01BQ0EsT0FBQTs7OztHQUlBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsT0FBQTs7Ozs7RUFLQSxLQUFBLFlBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQTtLQUNBLE9BQUE7O0lBRUEsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtNQUNBLE9BQUE7O0tBRUEsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO01BQ0EsT0FBQTtNQUNBLE9BQUE7Ozs7R0FJQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQTtLQUNBLE9BQUE7Ozs7O0VBS0EsS0FBQSxVQUFBO0dBQ0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUE7S0FDQSxPQUFBOztJQUVBLE9BQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLFFBQUE7S0FDQSxNQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7TUFDQSxPQUFBOztLQUVBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtNQUNBLE9BQUE7TUFDQSxPQUFBO01BQ0EsVUFBQSxDQUFBOzs7O0dBSUEsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsVUFBQSxDQUFBOzs7OztFQUtBLEtBQUEsV0FBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBO0tBQ0EsT0FBQTs7O0dBR0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUE7S0FDQSxPQUFBOzs7Ozs7Ozs7Ozs7O0FDL0ZBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLGFBQUEsWUFBQTtFQUNBOztFQUVBLElBQUEsUUFBQTs7O0VBR0EsSUFBQSxjQUFBLFlBQUE7R0FDQSxJQUFBLFNBQUEsU0FBQSxLQUFBLFFBQUEsS0FBQTs4QkFDQSxNQUFBOztHQUVBLElBQUEsUUFBQTs7R0FFQSxPQUFBLFFBQUEsVUFBQSxPQUFBOztJQUVBLElBQUEsVUFBQSxNQUFBLE1BQUE7SUFDQSxJQUFBLFdBQUEsUUFBQSxXQUFBLEdBQUE7S0FDQSxNQUFBLFFBQUEsTUFBQSxtQkFBQSxRQUFBOzs7O0dBSUEsT0FBQTs7OztFQUlBLElBQUEsY0FBQSxVQUFBLE9BQUE7R0FDQSxJQUFBLFNBQUE7R0FDQSxLQUFBLElBQUEsT0FBQSxPQUFBO0lBQ0EsVUFBQSxNQUFBLE1BQUEsbUJBQUEsTUFBQSxRQUFBOztHQUVBLE9BQUEsT0FBQSxVQUFBLEdBQUEsT0FBQSxTQUFBOzs7RUFHQSxLQUFBLFlBQUEsVUFBQSxHQUFBO0dBQ0EsTUFBQSxPQUFBO0dBQ0EsUUFBQSxVQUFBLE9BQUEsSUFBQSxNQUFBLE9BQUEsTUFBQSxZQUFBOzs7O0VBSUEsS0FBQSxNQUFBLFVBQUEsUUFBQTtHQUNBLEtBQUEsSUFBQSxPQUFBLFFBQUE7SUFDQSxNQUFBLE9BQUEsT0FBQTs7R0FFQSxRQUFBLGFBQUEsT0FBQSxJQUFBLE1BQUEsT0FBQSxNQUFBLFlBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsVUFBQSxLQUFBO0dBQ0EsT0FBQSxNQUFBOzs7RUFHQSxRQUFBLFFBQUE7O0VBRUEsSUFBQSxDQUFBLE9BQUE7R0FDQSxRQUFBOzs7RUFHQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBhbm5vdGF0aW9ucyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJywgWydkaWFzLmFwaScsICdkaWFzLnVpJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0aW9uc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGFubm90YXRpb25zIGxpc3QgaW4gdGhlIHNpZGViYXJcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdBbm5vdGF0aW9uc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywgbGFiZWxzLCBhbm5vdGF0aW9ucywgc2hhcGVzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuc2VsZWN0ZWRGZWF0dXJlcyA9IG1hcEFubm90YXRpb25zLmdldFNlbGVjdGVkRmVhdHVyZXMoKS5nZXRBcnJheSgpO1xuXG5cdFx0JHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oJ3NlbGVjdGVkRmVhdHVyZXMnLCBmdW5jdGlvbiAoZmVhdHVyZXMpIHtcblx0XHRcdGZlYXR1cmVzLmZvckVhY2goZnVuY3Rpb24gKGZlYXR1cmUpIHtcblx0XHRcdFx0bGFiZWxzLmZldGNoRm9yQW5ub3RhdGlvbihmZWF0dXJlLmFubm90YXRpb24pO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHR2YXIgcmVmcmVzaEFubm90YXRpb25zID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmFubm90YXRpb25zID0gYW5ub3RhdGlvbnMuY3VycmVudCgpO1xuXHRcdH07XG5cblx0XHR2YXIgc2VsZWN0ZWRGZWF0dXJlcyA9IG1hcEFubm90YXRpb25zLmdldFNlbGVjdGVkRmVhdHVyZXMoKTtcblxuXHRcdCRzY29wZS5hbm5vdGF0aW9ucyA9IFtdO1xuXG5cdFx0JHNjb3BlLmNsZWFyU2VsZWN0aW9uID0gbWFwQW5ub3RhdGlvbnMuY2xlYXJTZWxlY3Rpb247XG5cblx0XHQkc2NvcGUuc2VsZWN0QW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChlLCBpZCkge1xuXHRcdFx0Ly8gYWxsb3cgbXVsdGlwbGUgc2VsZWN0aW9uc1xuXHRcdFx0aWYgKCFlLnNoaWZ0S2V5KSB7XG5cdFx0XHRcdCRzY29wZS5jbGVhclNlbGVjdGlvbigpO1xuXHRcdFx0fVxuXHRcdFx0bWFwQW5ub3RhdGlvbnMuc2VsZWN0KGlkKTtcblx0XHR9O1xuXG4gICAgICAgICRzY29wZS5maXRBbm5vdGF0aW9uID0gbWFwQW5ub3RhdGlvbnMuZml0O1xuXG5cdFx0JHNjb3BlLmlzU2VsZWN0ZWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBzZWxlY3RlZCA9IGZhbHNlO1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5mb3JFYWNoKGZ1bmN0aW9uIChmZWF0dXJlKSB7XG5cdFx0XHRcdGlmIChmZWF0dXJlLmFubm90YXRpb24gJiYgZmVhdHVyZS5hbm5vdGF0aW9uLmlkID09IGlkKSB7XG5cdFx0XHRcdFx0c2VsZWN0ZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBzZWxlY3RlZDtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCByZWZyZXNoQW5ub3RhdGlvbnMpO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0b3JDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1haW4gY29udHJvbGxlciBvZiB0aGUgQW5ub3RhdG9yIGFwcGxpY2F0aW9uLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0Fubm90YXRvckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkYXR0cnMsIGltYWdlcywgdXJsUGFyYW1zLCBtc2csIGxhYmVscykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuaW1hZ2VzID0gaW1hZ2VzO1xuICAgICAgICAkc2NvcGUuaW1hZ2VMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmVkaXRNb2RlID0gISEkYXR0cnMuZWRpdE1vZGU7XG4gICAgICAgIC8vIGRvbid0IHBhcnNlIGFuIGVtcHR5IHN0cmluZ1xuICAgICAgICAkc2NvcGUucHJvamVjdElkcyA9ICRhdHRycy5wcm9qZWN0SWRzID8gJGF0dHJzLnByb2plY3RJZHMuc3BsaXQoJywnKSA6IFtdO1xuXG4gICAgICAgIGxhYmVscy5zZXRQcm9qZWN0SWRzKCRzY29wZS5wcm9qZWN0SWRzKTtcblxuICAgICAgICAvLyB0aGUgY3VycmVudCBjYW52YXMgdmlld3BvcnQsIHN5bmNlZCB3aXRoIHRoZSBVUkwgcGFyYW1ldGVyc1xuICAgICAgICAkc2NvcGUudmlld3BvcnQgPSB7XG4gICAgICAgICAgICB6b29tOiB1cmxQYXJhbXMuZ2V0KCd6JyksXG4gICAgICAgICAgICBjZW50ZXI6IFt1cmxQYXJhbXMuZ2V0KCd4JyksIHVybFBhcmFtcy5nZXQoJ3knKV1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmaW5pc2ggaW1hZ2UgbG9hZGluZyBwcm9jZXNzXG4gICAgICAgIHZhciBmaW5pc2hMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2ltYWdlLnNob3duJywgJHNjb3BlLmltYWdlcy5jdXJyZW50SW1hZ2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5XG4gICAgICAgIHZhciBwdXNoU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB1cmxQYXJhbXMucHVzaFN0YXRlKCRzY29wZS5pbWFnZXMuY3VycmVudEltYWdlLl9pZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc3RhcnQgaW1hZ2UgbG9hZGluZyBwcm9jZXNzXG4gICAgICAgIHZhciBzdGFydExvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBsb2FkIHRoZSBpbWFnZSBieSBpZC4gZG9lc24ndCBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeSBieSBpdHNlbGZcbiAgICAgICAgdmFyIGxvYWRJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgc3RhcnRMb2FkaW5nKCk7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VzLnNob3cocGFyc2VJbnQoaWQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlS2V5RXZlbnRzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoZS5rZXlDb2RlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAzNzpcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnByZXZJbWFnZSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM5OlxuICAgICAgICAgICAgICAgIGNhc2UgMzI6XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgna2V5cHJlc3MnLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2hvdyB0aGUgbmV4dCBpbWFnZSBhbmQgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgJHNjb3BlLm5leHRJbWFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgaW1hZ2VzLm5leHQoKVxuICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgIC50aGVuKHB1c2hTdGF0ZSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2hvdyB0aGUgcHJldmlvdXMgaW1hZ2UgYW5kIGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5XG4gICAgICAgICRzY29wZS5wcmV2SW1hZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIGltYWdlcy5wcmV2KClcbiAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAudGhlbihwdXNoU3RhdGUpXG4gICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgVVJMIHBhcmFtZXRlcnMgb2YgdGhlIHZpZXdwb3J0XG4gICAgICAgICRzY29wZS4kb24oJ2NhbnZhcy5tb3ZlZW5kJywgZnVuY3Rpb24oZSwgcGFyYW1zKSB7XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuem9vbSA9IHBhcmFtcy56b29tO1xuICAgICAgICAgICAgJHNjb3BlLnZpZXdwb3J0LmNlbnRlclswXSA9IE1hdGgucm91bmQocGFyYW1zLmNlbnRlclswXSk7XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuY2VudGVyWzFdID0gTWF0aC5yb3VuZChwYXJhbXMuY2VudGVyWzFdKTtcbiAgICAgICAgICAgIHVybFBhcmFtcy5zZXQoe1xuICAgICAgICAgICAgICAgIHo6ICRzY29wZS52aWV3cG9ydC56b29tLFxuICAgICAgICAgICAgICAgIHg6ICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMF0sXG4gICAgICAgICAgICAgICAgeTogJHNjb3BlLnZpZXdwb3J0LmNlbnRlclsxXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGxpc3RlbiB0byB0aGUgYnJvd3NlciBcImJhY2tcIiBidXR0b25cbiAgICAgICAgd2luZG93Lm9ucG9wc3RhdGUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSBlLnN0YXRlO1xuICAgICAgICAgICAgaWYgKHN0YXRlICYmIHN0YXRlLnNsdWcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGxvYWRJbWFnZShzdGF0ZS5zbHVnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5RXZlbnRzKTtcblxuICAgICAgICAvLyBpbml0aWFsaXplIHRoZSBpbWFnZXMgc2VydmljZVxuICAgICAgICBpbWFnZXMuaW5pdCgkYXR0cnMudHJhbnNlY3RJZCk7XG4gICAgICAgIC8vIGRpc3BsYXkgdGhlIGZpcnN0IGltYWdlXG4gICAgICAgIGxvYWRJbWFnZSgkYXR0cnMuaW1hZ2VJZCkudGhlbihwdXNoU3RhdGUpO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENhbnZhc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFpbiBjb250cm9sbGVyIGZvciB0aGUgYW5ub3RhdGlvbiBjYW52YXMgZWxlbWVudFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NhbnZhc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBJbWFnZSwgbWFwQW5ub3RhdGlvbnMsIG1hcCwgJHRpbWVvdXQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdC8vIHVwZGF0ZSB0aGUgVVJMIHBhcmFtZXRlcnNcblx0XHRtYXAub24oJ21vdmVlbmQnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHR2YXIgdmlldyA9IG1hcC5nZXRWaWV3KCk7XG5cdFx0XHQkc2NvcGUuJGVtaXQoJ2NhbnZhcy5tb3ZlZW5kJywge1xuXHRcdFx0XHRjZW50ZXI6IHZpZXcuZ2V0Q2VudGVyKCksXG5cdFx0XHRcdHpvb206IHZpZXcuZ2V0Wm9vbSgpXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1hcEltYWdlLmluaXQoJHNjb3BlKTtcblx0XHRtYXBBbm5vdGF0aW9ucy5pbml0KCRzY29wZSk7XG5cblx0XHR2YXIgdXBkYXRlU2l6ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdC8vIHdvcmthcm91bmQsIHNvIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQgKmFmdGVyKiB0aGUgYW5ndWxhciBkaWdlc3Rcblx0XHRcdC8vIGFuZCAqYWZ0ZXIqIHRoZSBmb2xkb3V0IHdhcyByZW5kZXJlZFxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdG1hcC51cGRhdGVTaXplKCk7XG5cdFx0XHR9LCAwLCBmYWxzZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5vcGVuJywgdXBkYXRlU2l6ZSk7XG5cdFx0JHNjb3BlLiRvbignc2lkZWJhci5mb2xkb3V0LmNsb3NlJywgdXBkYXRlU2l6ZSk7XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDYXRlZ29yaWVzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBsYWJlbCBjYXRlZ29yaWVzIGZvbGRvdXRcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDYXRlZ29yaWVzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGxhYmVscykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBtYXhpbXVtIG51bWJlciBvZiBhbGxvd2VkIGZhdm91cml0ZXNcbiAgICAgICAgdmFyIG1heEZhdm91cml0ZXMgPSA5O1xuICAgICAgICB2YXIgZmF2b3VyaXRlc1N0b3JhZ2VLZXkgPSAnZGlhcy5hbm5vdGF0aW9ucy5sYWJlbC1mYXZvdXJpdGVzJztcblxuICAgICAgICAvLyBzYXZlcyB0aGUgSURzIG9mIHRoZSBmYXZvdXJpdGVzIGluIGxvY2FsU3RvcmFnZVxuICAgICAgICB2YXIgc3RvcmVGYXZvdXJpdGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRtcCA9ICRzY29wZS5mYXZvdXJpdGVzLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmlkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2Zhdm91cml0ZXNTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KHRtcCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmVzdG9yZXMgdGhlIGZhdm91cml0ZXMgZnJvbSB0aGUgSURzIGluIGxvY2FsU3RvcmFnZVxuICAgICAgICB2YXIgbG9hZEZhdm91cml0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtmYXZvdXJpdGVzU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgICAgICB2YXIgdG1wID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlW2Zhdm91cml0ZXNTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMgPSAkc2NvcGUuY2F0ZWdvcmllcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gb25seSB0YWtlIHRob3NlIGNhdGVnb3JpZXMgYXMgZmF2b3VyaXRlcyB0aGF0IGFyZSBhdmFpbGFibGUgZm9yIHRoaXMgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRtcC5pbmRleE9mKGl0ZW0uaWQpICE9PSAtMTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaG90a2V5c01hcCA9IFsn8J2frScsICfwnZ+uJywgJ/Cdn68nLCAn8J2fsCcsICfwnZ+xJywgJ/Cdn7InLCAn8J2fsycsICfwnZ+0JywgJ/Cdn7UnXTtcbiAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXMgPSBbXTtcbiAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMgPSBbXTtcbiAgICAgICAgbGFiZWxzLnByb21pc2UudGhlbihmdW5jdGlvbiAoYWxsKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gYWxsKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXMgPSAkc2NvcGUuY2F0ZWdvcmllcy5jb25jYXQoYWxsW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbG9hZEZhdm91cml0ZXMoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXNUcmVlID0gbGFiZWxzLmdldFRyZWUoKTtcblxuICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICBsYWJlbHMuc2V0U2VsZWN0ZWQoaXRlbSk7XG4gICAgICAgICAgICAkc2NvcGUuc2VhcmNoQ2F0ZWdvcnkgPSAnJzsgLy8gY2xlYXIgc2VhcmNoIGZpZWxkXG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGl0ZW0pO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0Zhdm91cml0ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmZhdm91cml0ZXMuaW5kZXhPZihpdGVtKSAhPT0gLTE7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gYWRkcyBhIG5ldyBpdGVtIHRvIHRoZSBmYXZvdXJpdGVzIG9yIHJlbW92ZXMgaXQgaWYgaXQgaXMgYWxyZWFkeSBhIGZhdm91cml0ZVxuICAgICAgICAkc2NvcGUudG9nZ2xlRmF2b3VyaXRlID0gZnVuY3Rpb24gKGUsIGl0ZW0pIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSAkc2NvcGUuZmF2b3VyaXRlcy5pbmRleE9mKGl0ZW0pO1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSAmJiAkc2NvcGUuZmF2b3VyaXRlcy5sZW5ndGggPCBtYXhGYXZvdXJpdGVzKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMucHVzaChpdGVtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0b3JlRmF2b3VyaXRlcygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJldHVybnMgd2hldGhlciB0aGUgdXNlciBpcyBzdGlsbCBhbGxvd2VkIHRvIGFkZCBmYXZvdXJpdGVzXG4gICAgICAgICRzY29wZS5mYXZvdXJpdGVzTGVmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuZmF2b3VyaXRlcy5sZW5ndGggPCBtYXhGYXZvdXJpdGVzO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHNlbGVjdCBmYXZvdXJpdGVzIG9uIG51bWJlcnMgMS05XG4gICAgICAgICRzY29wZS4kb24oJ2tleXByZXNzJywgZnVuY3Rpb24gKGUsIGtleUV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgY2hhckNvZGUgPSAoa2V5RXZlbnQud2hpY2gpID8ga2V5RXZlbnQud2hpY2ggOiBrZXlFdmVudC5rZXlDb2RlO1xuICAgICAgICAgICAgdmFyIG51bWJlciA9IHBhcnNlSW50KFN0cmluZy5mcm9tQ2hhckNvZGUoY2hhckNvZGUpKTtcbiAgICAgICAgICAgIGlmICghaXNOYU4obnVtYmVyKSAmJiBudW1iZXIgPiAwICYmIG51bWJlciA8PSAkc2NvcGUuZmF2b3VyaXRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbSgkc2NvcGUuZmF2b3VyaXRlc1tudW1iZXIgLSAxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENvbmZpZGVuY2VDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBjb25maWRlbmNlIGNvbnRyb2xcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDb25maWRlbmNlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGxhYmVscykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLmNvbmZpZGVuY2UgPSAxLjA7XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdjb25maWRlbmNlJywgZnVuY3Rpb24gKGNvbmZpZGVuY2UpIHtcblx0XHRcdGxhYmVscy5zZXRDdXJyZW50Q29uZmlkZW5jZShwYXJzZUZsb2F0KGNvbmZpZGVuY2UpKTtcblxuXHRcdFx0aWYgKGNvbmZpZGVuY2UgPD0gMC4yNSkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLWRhbmdlcic7XG5cdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC41ICkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXdhcm5pbmcnO1xuXHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNzUgKSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtc3VjY2Vzcyc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXByaW1hcnknO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDb250cm9sc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgY29udHJvbCBidXR0b25zXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQ29udHJvbHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMsIGxhYmVscywgbXNnLCAkYXR0cnMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBkcmF3aW5nID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuc2VsZWN0U2hhcGUgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0aWYgKCFsYWJlbHMuaGFzU2VsZWN0ZWQoKSkge1xuICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnc2lkZWJhci5mb2xkb3V0LmRvLW9wZW4nLCAnY2F0ZWdvcmllcycpO1xuXHRcdFx0XHRtc2cuaW5mbygkYXR0cnMuc2VsZWN0Q2F0ZWdvcnkpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdG1hcEFubm90YXRpb25zLmZpbmlzaERyYXdpbmcoKTtcblxuXHRcdFx0aWYgKG5hbWUgPT09IG51bGwgfHwgKGRyYXdpbmcgJiYgJHNjb3BlLnNlbGVjdGVkU2hhcGUgPT09IG5hbWUpKSB7XG5cdFx0XHRcdCRzY29wZS5zZWxlY3RlZFNoYXBlID0gJyc7XG5cdFx0XHRcdGRyYXdpbmcgPSBmYWxzZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5zZWxlY3RlZFNoYXBlID0gbmFtZTtcblx0XHRcdFx0bWFwQW5ub3RhdGlvbnMuc3RhcnREcmF3aW5nKG5hbWUpO1xuXHRcdFx0XHRkcmF3aW5nID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgICRzY29wZS4kb24oJ2tleXByZXNzJywgZnVuY3Rpb24gKGUsIGtleUV2ZW50KSB7XG4gICAgICAgICAgICAvLyBkZXNlbGVjdCBkcmF3aW5nIHRvb2wgb24gZXNjYXBlXG4gICAgICAgICAgICBpZiAoa2V5RXZlbnQua2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUobnVsbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGNoYXJDb2RlID0gKGtleUV2ZW50LndoaWNoKSA/IGtleUV2ZW50LndoaWNoIDoga2V5RXZlbnQua2V5Q29kZTtcbiAgICAgICAgICAgIHN3aXRjaCAoU3RyaW5nLmZyb21DaGFyQ29kZShjaGFyQ29kZSkudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2EnOlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ1BvaW50Jyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3MnOlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ1JlY3RhbmdsZScpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdDaXJjbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZic6XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnTGluZVN0cmluZycpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdnJzpcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdQb2x5Z29uJyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgTWluaW1hcENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIG1pbmltYXAgaW4gdGhlIHNpZGViYXJcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdNaW5pbWFwQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcCwgbWFwSW1hZ2UsICRlbGVtZW50LCBzdHlsZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBtaW5pbWFwID0gbmV3IG9sLk1hcCh7XG5cdFx0XHR0YXJnZXQ6ICdtaW5pbWFwJyxcblx0XHRcdC8vIHJlbW92ZSBjb250cm9sc1xuXHRcdFx0Y29udHJvbHM6IFtdLFxuXHRcdFx0Ly8gZGlzYWJsZSBpbnRlcmFjdGlvbnNcblx0XHRcdGludGVyYWN0aW9uczogW11cblx0XHR9KTtcblxuXHRcdC8vIGdldCB0aGUgc2FtZSBsYXllcnMgdGhhbiB0aGUgbWFwXG5cdFx0bWluaW1hcC5zZXRMYXllckdyb3VwKG1hcC5nZXRMYXllckdyb3VwKCkpO1xuXG5cdFx0dmFyIGZlYXR1cmVPdmVybGF5ID0gbmV3IG9sLkZlYXR1cmVPdmVybGF5KHtcblx0XHRcdG1hcDogbWluaW1hcCxcblx0XHRcdHN0eWxlOiBzdHlsZXMudmlld3BvcnRcblx0XHR9KTtcblxuXHRcdHZhciB2aWV3cG9ydCA9IG5ldyBvbC5GZWF0dXJlKCk7XG5cdFx0ZmVhdHVyZU92ZXJsYXkuYWRkRmVhdHVyZSh2aWV3cG9ydCk7XG5cblx0XHQvLyByZWZyZXNoIHRoZSB2aWV3ICh0aGUgaW1hZ2Ugc2l6ZSBjb3VsZCBoYXZlIGJlZW4gY2hhbmdlZClcblx0XHQkc2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIGZ1bmN0aW9uICgpIHtcblx0XHRcdG1pbmltYXAuc2V0VmlldyhuZXcgb2wuVmlldyh7XG5cdFx0XHRcdHByb2plY3Rpb246IG1hcEltYWdlLmdldFByb2plY3Rpb24oKSxcblx0XHRcdFx0Y2VudGVyOiBvbC5leHRlbnQuZ2V0Q2VudGVyKG1hcEltYWdlLmdldEV4dGVudCgpKSxcblx0XHRcdFx0em9vbTogMFxuXHRcdFx0fSkpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gbW92ZSB0aGUgdmlld3BvcnQgcmVjdGFuZ2xlIG9uIHRoZSBtaW5pbWFwXG5cdFx0dmFyIHJlZnJlc2hWaWV3cG9ydCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBleHRlbnQgPSBtYXAuZ2V0VmlldygpLmNhbGN1bGF0ZUV4dGVudChtYXAuZ2V0U2l6ZSgpKTtcblx0XHRcdHZpZXdwb3J0LnNldEdlb21ldHJ5KG9sLmdlb20uUG9seWdvbi5mcm9tRXh0ZW50KGV4dGVudCkpO1xuXHRcdH07XG5cblx0XHRtYXAub24oJ21vdmVlbmQnLCByZWZyZXNoVmlld3BvcnQpO1xuXG5cdFx0dmFyIGRyYWdWaWV3cG9ydCA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRtYXAuZ2V0VmlldygpLnNldENlbnRlcihlLmNvb3JkaW5hdGUpO1xuXHRcdH07XG5cblx0XHRtaW5pbWFwLm9uKCdwb2ludGVyZHJhZycsIGRyYWdWaWV3cG9ydCk7XG5cblx0XHQkZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdG1pbmltYXAudW4oJ3BvaW50ZXJkcmFnJywgZHJhZ1ZpZXdwb3J0KTtcblx0XHR9KTtcblxuXHRcdCRlbGVtZW50Lm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC5vbigncG9pbnRlcmRyYWcnLCBkcmFnVmlld3BvcnQpO1xuXHRcdH0pO1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2VsZWN0ZWRMYWJlbENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNlbGVjdGVkIGxhYmVsIGRpc3BsYXkgaW4gdGhlIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NlbGVjdGVkTGFiZWxDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbGFiZWxzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLmdldFNlbGVjdGVkTGFiZWwgPSBsYWJlbHMuZ2V0U2VsZWN0ZWQ7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNpZGViYXJDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2lkZWJhckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkcm9vdFNjb3BlLCBtYXBBbm5vdGF0aW9ucykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBmb2xkb3V0U3RvcmFnZUtleSA9ICdkaWFzLmFubm90YXRpb25zLnNpZGViYXItZm9sZG91dCc7XG5cblx0XHQvLyB0aGUgY3VycmVudGx5IG9wZW5lZCBzaWRlYmFyLSdleHRlbnNpb24nIGlzIHJlbWVtYmVyZWQgdGhyb3VnaCBsb2NhbFN0b3JhZ2Vcblx0XHQkc2NvcGUuZm9sZG91dCA9IHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldIHx8ICcnO1xuICAgICAgICBpZiAoJHNjb3BlLmZvbGRvdXQpIHtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2lkZWJhci5mb2xkb3V0Lm9wZW4nKTtcbiAgICAgICAgfVxuXG5cdFx0JHNjb3BlLm9wZW5Gb2xkb3V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRcdCRzY29wZS5mb2xkb3V0ID0gd2luZG93LmxvY2FsU3RvcmFnZVtmb2xkb3V0U3RvcmFnZUtleV0gPSBuYW1lO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzaWRlYmFyLmZvbGRvdXQub3BlbicpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuY2xvc2VGb2xkb3V0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmZvbGRvdXQgPSB3aW5kb3cubG9jYWxTdG9yYWdlW2ZvbGRvdXRTdG9yYWdlS2V5XSA9ICcnO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzaWRlYmFyLmZvbGRvdXQuY2xvc2UnKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUZvbGRvdXQgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0aWYgKCRzY29wZS5mb2xkb3V0ID09PSBuYW1lKSB7XG5cdFx0XHRcdCRzY29wZS5jbG9zZUZvbGRvdXQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5vcGVuRm9sZG91dChuYW1lKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLmRlbGV0ZVNlbGVjdGVkQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAobWFwQW5ub3RhdGlvbnMuZ2V0U2VsZWN0ZWRGZWF0dXJlcygpLmdldExlbmd0aCgpID4gMCAmJiBjb25maXJtKCdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIGFsbCBzZWxlY3RlZCBhbm5vdGF0aW9ucz8nKSkge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmRlbGV0ZVNlbGVjdGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5kby1vcGVuJywgZnVuY3Rpb24gKGUsIG5hbWUpIHtcbiAgICAgICAgICAgICRzY29wZS5vcGVuRm9sZG91dChuYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLiRvbigna2V5cHJlc3MnLCBmdW5jdGlvbiAoZSwga2V5RXZlbnQpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoa2V5RXZlbnQua2V5Q29kZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgICAgICAgICAga2V5RXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZUZvbGRvdXQoJ2NhdGVnb3JpZXMnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0NjpcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZVNlbGVjdGVkQW5ub3RhdGlvbnMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGFubm90YXRpb25MaXN0SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBbiBhbm5vdGF0aW9uIGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5kaXJlY3RpdmUoJ2Fubm90YXRpb25MaXN0SXRlbScsIGZ1bmN0aW9uIChsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRzY29wZTogdHJ1ZSxcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0JHNjb3BlLnNoYXBlQ2xhc3MgPSAnaWNvbi0nICsgJHNjb3BlLmFubm90YXRpb24uc2hhcGUudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0XHQkc2NvcGUuc2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS5pc1NlbGVjdGVkKCRzY29wZS5hbm5vdGF0aW9uLmlkKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuYXR0YWNoTGFiZWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0bGFiZWxzLmF0dGFjaFRvQW5ub3RhdGlvbigkc2NvcGUuYW5ub3RhdGlvbik7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLnJlbW92ZUxhYmVsID0gZnVuY3Rpb24gKGxhYmVsKSB7XG5cdFx0XHRcdFx0bGFiZWxzLnJlbW92ZUZyb21Bbm5vdGF0aW9uKCRzY29wZS5hbm5vdGF0aW9uLCBsYWJlbCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmNhbkF0dGFjaExhYmVsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuc2VsZWN0ZWQoKSAmJiBsYWJlbHMuaGFzU2VsZWN0ZWQoKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudExhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkO1xuXG5cdFx0XHRcdCRzY29wZS5jdXJyZW50Q29uZmlkZW5jZSA9IGxhYmVscy5nZXRDdXJyZW50Q29uZmlkZW5jZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhYmVsQ2F0ZWdvcnlJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgbGFiZWwgY2F0ZWdvcnkgbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmRpcmVjdGl2ZSgnbGFiZWxDYXRlZ29yeUl0ZW0nLCBmdW5jdGlvbiAoJGNvbXBpbGUsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdDJyxcblxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdsYWJlbC1pdGVtLmh0bWwnLFxuXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHdhaXQgZm9yIHRoaXMgZWxlbWVudCB0byBiZSByZW5kZXJlZCB1bnRpbCB0aGUgY2hpbGRyZW4gYXJlXG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kZWQsIG90aGVyd2lzZSB0aGVyZSB3b3VsZCBiZSB0b28gbXVjaCByZWN1cnNpb24gZm9yXG4gICAgICAgICAgICAgICAgLy8gYW5ndWxhclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnbGFiZWwtc3VidHJlZS5odG1sJykpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoY29udGVudCkoc2NvcGUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIHRoZSBzdWJ0cmVlIG9mIHRoaXMgaXRlbVxuICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaGFzIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzRXhwYW5kYWJsZSA9ICRzY29wZS50cmVlICYmICEhJHNjb3BlLnRyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8gaGFuZGxlIHRoaXMgYnkgdGhlIGV2ZW50IHJhdGhlciB0aGFuIGFuIG93biBjbGljayBoYW5kbGVyIHRvXG4gICAgICAgICAgICAgICAgLy8gZGVhbCB3aXRoIGNsaWNrIGFuZCBzZWFyY2ggZmllbGQgYWN0aW9ucyBpbiBhIHVuaWZpZWQgd2F5XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGZ1bmN0aW9uIChlLCBjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbiBpdGVtIGlzIHNlbGVjdGVkLCBpdHMgc3VidHJlZSBhbmQgYWxsIHBhcmVudCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgb3BlbmVkXG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5pZCA9PT0gY2F0ZWdvcnkuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBoaXRzIGFsbCBwYXJlbnQgc2NvcGVzL2l0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGEgY2hpbGQgaXRlbSB3YXMgc2VsZWN0ZWQsIHRoaXMgaXRlbSBzaG91bGQgYmUgb3BlbmVkLCB0b29cbiAgICAgICAgICAgICAgICAvLyBzbyB0aGUgc2VsZWN0ZWQgaXRlbSBiZWNvbWVzIHZpc2libGUgaW4gdGhlIHRyZWVcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3AgcHJvcGFnYXRpb24gaWYgdGhpcyBpcyBhIHJvb3QgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0ucGFyZW50X2lkID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYWJlbEl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQW4gYW5ub3RhdGlvbiBsYWJlbCBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZGlyZWN0aXZlKCdsYWJlbEl0ZW0nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFx0XHR2YXIgY29uZmlkZW5jZSA9ICRzY29wZS5hbm5vdGF0aW9uTGFiZWwuY29uZmlkZW5jZTtcblxuXHRcdFx0XHRpZiAoY29uZmlkZW5jZSA8PSAwLjI1KSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLWRhbmdlcic7XG5cdFx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjUgKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXdhcm5pbmcnO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC43NSApIHtcblx0XHRcdFx0XHQkc2NvcGUuY2xhc3MgPSAnbGFiZWwtc3VjY2Vzcyc7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXByaW1hcnknO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgZGVib3VuY2VcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQSBkZWJvdW5jZSBzZXJ2aWNlIHRvIHBlcmZvcm0gYW4gYWN0aW9uIG9ubHkgd2hlbiB0aGlzIGZ1bmN0aW9uXG4gKiB3YXNuJ3QgY2FsbGVkIGFnYWluIGluIGEgc2hvcnQgcGVyaW9kIG9mIHRpbWUuXG4gKiBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTMzMjAwMTYvMTc5NjUyM1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmZhY3RvcnkoJ2RlYm91bmNlJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkcSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHRpbWVvdXRzID0ge307XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gKGZ1bmMsIHdhaXQsIGlkKSB7XG5cdFx0XHQvLyBDcmVhdGUgYSBkZWZlcnJlZCBvYmplY3QgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gd2UgbmVlZCB0b1xuXHRcdFx0Ly8gYWN0dWFsbHkgY2FsbCB0aGUgZnVuY1xuXHRcdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHRcdFx0dmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGltZW91dHNbaWRdID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKSk7XG5cdFx0XHRcdFx0ZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpZiAodGltZW91dHNbaWRdKSB7XG5cdFx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRzW2lkXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGltZW91dHNbaWRdID0gJHRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHRcdH0pKCk7XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIG1hcFxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIGZhY3RvcnkgaGFuZGxpbmcgT3BlbkxheWVycyBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5mYWN0b3J5KCdtYXAnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgbWFwID0gbmV3IG9sLk1hcCh7XG5cdFx0XHR0YXJnZXQ6ICdjYW52YXMnLFxuXHRcdFx0Y29udHJvbHM6IFtcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuWm9vbSgpLFxuXHRcdFx0XHRuZXcgb2wuY29udHJvbC5ab29tVG9FeHRlbnQoKSxcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuRnVsbFNjcmVlbigpXG5cdFx0XHRdLFxuICAgICAgICAgICAgaW50ZXJhY3Rpb25zOiBvbC5pbnRlcmFjdGlvbi5kZWZhdWx0cyh7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQ6IGZhbHNlXG4gICAgICAgICAgICB9KVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIG1hcDtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgYW5ub3RhdGlvbnNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIHRoZSBhbm5vdGF0aW9ucyB0byBtYWtlIHRoZW0gYXZhaWxhYmxlIGluIG11bHRpcGxlIGNvbnRyb2xsZXJzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2Fubm90YXRpb25zJywgZnVuY3Rpb24gKEFubm90YXRpb24sIHNoYXBlcywgbGFiZWxzLCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBhbm5vdGF0aW9ucztcblxuXHRcdHZhciByZXNvbHZlU2hhcGVOYW1lID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdGFubm90YXRpb24uc2hhcGUgPSBzaGFwZXMuZ2V0TmFtZShhbm5vdGF0aW9uLnNoYXBlX2lkKTtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR2YXIgYWRkQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHRhbm5vdGF0aW9ucy5wdXNoKGFubm90YXRpb24pO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb247XG5cdFx0fTtcblxuXHRcdHRoaXMucXVlcnkgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRhbm5vdGF0aW9ucyA9IEFubm90YXRpb24ucXVlcnkocGFyYW1zKTtcblx0XHRcdGFubm90YXRpb25zLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKGEpIHtcblx0XHRcdFx0YS5mb3JFYWNoKHJlc29sdmVTaGFwZU5hbWUpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnM7XG5cdFx0fTtcblxuXHRcdHRoaXMuYWRkID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0aWYgKCFwYXJhbXMuc2hhcGVfaWQgJiYgcGFyYW1zLnNoYXBlKSB7XG5cdFx0XHRcdHBhcmFtcy5zaGFwZV9pZCA9IHNoYXBlcy5nZXRJZChwYXJhbXMuc2hhcGUpO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGxhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkKCk7XG5cdFx0XHRwYXJhbXMubGFiZWxfaWQgPSBsYWJlbC5pZDtcblx0XHRcdHBhcmFtcy5jb25maWRlbmNlID0gbGFiZWxzLmdldEN1cnJlbnRDb25maWRlbmNlKCk7XG5cdFx0XHR2YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uYWRkKHBhcmFtcyk7XG5cdFx0XHRhbm5vdGF0aW9uLiRwcm9taXNlXG5cdFx0XHQgICAgICAgICAgLnRoZW4ocmVzb2x2ZVNoYXBlTmFtZSlcblx0XHRcdCAgICAgICAgICAudGhlbihhZGRBbm5vdGF0aW9uKVxuXHRcdFx0ICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG5cblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHQvLyB1c2UgaW5kZXggdG8gc2VlIGlmIHRoZSBhbm5vdGF0aW9uIGV4aXN0cyBpbiB0aGUgYW5ub3RhdGlvbnMgbGlzdFxuXHRcdFx0dmFyIGluZGV4ID0gYW5ub3RhdGlvbnMuaW5kZXhPZihhbm5vdGF0aW9uKTtcblx0XHRcdGlmIChpbmRleCA+IC0xKSB7XG5cdFx0XHRcdHJldHVybiBhbm5vdGF0aW9uLiRkZWxldGUoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdC8vIHVwZGF0ZSB0aGUgaW5kZXggc2luY2UgdGhlIGFubm90YXRpb25zIGxpc3QgbWF5IGhhdmUgYmVlbiBcblx0XHRcdFx0XHQvLyBtb2RpZmllZCBpbiB0aGUgbWVhbnRpbWVcblx0XHRcdFx0XHRpbmRleCA9IGFubm90YXRpb25zLmluZGV4T2YoYW5ub3RhdGlvbik7XG5cdFx0XHRcdFx0YW5ub3RhdGlvbnMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0fSwgbXNnLnJlc3BvbnNlRXJyb3IpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLmZvckVhY2ggPSBmdW5jdGlvbiAoZm4pIHtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9ucy5mb3JFYWNoKGZuKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5jdXJyZW50ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb25zO1xuXHRcdH07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBpbWFnZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFuYWdlcyAocHJlLSlsb2FkaW5nIG9mIHRoZSBpbWFnZXMgdG8gYW5ub3RhdGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnaW1hZ2VzJywgZnVuY3Rpb24gKFRyYW5zZWN0SW1hZ2UsIFVSTCwgJHEsIGZpbHRlclN1YnNldCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIF90aGlzID0gdGhpcztcblx0XHQvLyBhcnJheSBvZiBhbGwgaW1hZ2UgSURzIG9mIHRoZSB0cmFuc2VjdFxuXHRcdHZhciBpbWFnZUlkcyA9IFtdO1xuXHRcdC8vIG1heGltdW0gbnVtYmVyIG9mIGltYWdlcyB0byBob2xkIGluIGJ1ZmZlclxuXHRcdHZhciBNQVhfQlVGRkVSX1NJWkUgPSAxMDtcblx0XHQvLyBidWZmZXIgb2YgYWxyZWFkeSBsb2FkZWQgaW1hZ2VzXG5cdFx0dmFyIGJ1ZmZlciA9IFtdO1xuXG5cdFx0Ly8gdGhlIGN1cnJlbnRseSBzaG93biBpbWFnZVxuXHRcdHRoaXMuY3VycmVudEltYWdlID0gdW5kZWZpbmVkO1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgbmV4dCBJRCBvZiB0aGUgc3BlY2lmaWVkIGltYWdlIG9yIHRoZSBuZXh0IElEIG9mIHRoZVxuXHRcdCAqIGN1cnJlbnQgaW1hZ2UgaWYgbm8gaW1hZ2Ugd2FzIHNwZWNpZmllZC5cblx0XHQgKi9cblx0XHR2YXIgbmV4dElkID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRpZCA9IGlkIHx8IF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0XHR2YXIgaW5kZXggPSBpbWFnZUlkcy5pbmRleE9mKGlkKTtcblx0XHRcdHJldHVybiBpbWFnZUlkc1soaW5kZXggKyAxKSAlIGltYWdlSWRzLmxlbmd0aF07XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIHByZXZpb3VzIElEIG9mIHRoZSBzcGVjaWZpZWQgaW1hZ2Ugb3IgdGhlIHByZXZpb3VzIElEIG9mXG5cdFx0ICogdGhlIGN1cnJlbnQgaW1hZ2UgaWYgbm8gaW1hZ2Ugd2FzIHNwZWNpZmllZC5cblx0XHQgKi9cblx0XHR2YXIgcHJldklkID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRpZCA9IGlkIHx8IF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0XHR2YXIgaW5kZXggPSBpbWFnZUlkcy5pbmRleE9mKGlkKTtcblx0XHRcdHZhciBsZW5ndGggPSBpbWFnZUlkcy5sZW5ndGg7XG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHNbKGluZGV4IC0gMSArIGxlbmd0aCkgJSBsZW5ndGhdO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBzcGVjaWZpZWQgaW1hZ2UgZnJvbSB0aGUgYnVmZmVyIG9yIGB1bmRlZmluZWRgIGlmIGl0IGlzXG5cdFx0ICogbm90IGJ1ZmZlcmVkLlxuXHRcdCAqL1xuXHRcdHZhciBnZXRJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0aWQgPSBpZCB8fCBfdGhpcy5jdXJyZW50SW1hZ2UuX2lkO1xuXHRcdFx0Zm9yICh2YXIgaSA9IGJ1ZmZlci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRpZiAoYnVmZmVyW2ldLl9pZCA9PSBpZCkgcmV0dXJuIGJ1ZmZlcltpXTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2V0cyB0aGUgc3BlY2lmaWVkIGltYWdlIHRvIGFzIHRoZSBjdXJyZW50bHkgc2hvd24gaW1hZ2UuXG5cdFx0ICovXG5cdFx0dmFyIHNob3cgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdF90aGlzLmN1cnJlbnRJbWFnZSA9IGdldEltYWdlKGlkKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogTG9hZHMgdGhlIHNwZWNpZmllZCBpbWFnZSBlaXRoZXIgZnJvbSBidWZmZXIgb3IgZnJvbSB0aGUgZXh0ZXJuYWxcblx0XHQgKiByZXNvdXJjZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBnZXRzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzXG5cdFx0ICogbG9hZGVkLlxuXHRcdCAqL1xuXHRcdHZhciBmZXRjaEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXHRcdFx0dmFyIGltZyA9IGdldEltYWdlKGlkKTtcblxuXHRcdFx0aWYgKGltZykge1xuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGltZyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcblx0XHRcdFx0aW1nLl9pZCA9IGlkO1xuXHRcdFx0XHRpbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGJ1ZmZlci5wdXNoKGltZyk7XG5cdFx0XHRcdFx0Ly8gY29udHJvbCBtYXhpbXVtIGJ1ZmZlciBzaXplXG5cdFx0XHRcdFx0aWYgKGJ1ZmZlci5sZW5ndGggPiBNQVhfQlVGRkVSX1NJWkUpIHtcblx0XHRcdFx0XHRcdGJ1ZmZlci5zaGlmdCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGltZyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGltZy5vbmVycm9yID0gZnVuY3Rpb24gKG1zZykge1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlamVjdChtc2cpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpbWcuc3JjID0gVVJMICsgXCIvYXBpL3YxL2ltYWdlcy9cIiArIGlkICsgXCIvZmlsZVwiO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSW5pdGlhbGl6ZXMgdGhlIHNlcnZpY2UgZm9yIGEgZ2l2ZW4gdHJhbnNlY3QuIFJldHVybnMgYSBwcm9taXNlIHRoYXRcblx0XHQgKiBpcyByZXNvbHZlZCwgd2hlbiB0aGUgc2VydmljZSBpcyBpbml0aWFsaXplZC5cblx0XHQgKi9cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAodHJhbnNlY3RJZCkge1xuXHRcdFx0aW1hZ2VJZHMgPSBUcmFuc2VjdEltYWdlLnF1ZXJ5KHt0cmFuc2VjdF9pZDogdHJhbnNlY3RJZH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBsb29rIGZvciBhIHNlcXVlbmNlIG9mIGltYWdlIElEcyBpbiBsb2NhbCBzdG9yYWdlLlxuICAgICAgICAgICAgICAgIC8vIHRoaXMgc2VxdWVuY2UgaXMgcHJvZHVjZXMgYnkgdGhlIHRyYW5zZWN0IGluZGV4IHBhZ2Ugd2hlbiB0aGUgaW1hZ2VzIGFyZVxuICAgICAgICAgICAgICAgIC8vIHNvcnRlZCBvciBmaWx0ZXJlZC4gd2Ugd2FudCB0byByZWZsZWN0IHRoZSBzYW1lIG9yZGVyaW5nIG9yIGZpbHRlcmluZyBoZXJlXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhlIGFubm90YXRvclxuICAgICAgICAgICAgICAgIHZhciBzdG9yZWRTZXF1ZW5jZSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2VbJ2RpYXMudHJhbnNlY3RzLicgKyB0cmFuc2VjdElkICsgJy5pbWFnZXMnXTtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmVkU2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmVkU2VxdWVuY2UgPSBKU09OLnBhcnNlKHN0b3JlZFNlcXVlbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgc3VjaCBhIHN0b3JlZCBzZXF1ZW5jZSwgZmlsdGVyIG91dCBhbnkgaW1hZ2UgSURzIHRoYXQgZG8gbm90XG4gICAgICAgICAgICAgICAgICAgIC8vIGJlbG9uZyB0byB0aGUgdHJhbnNlY3QgKGFueSBtb3JlKSwgc2luY2Ugc29tZSBvZiB0aGVtIG1heSBoYXZlIGJlZW4gZGVsZXRlZFxuICAgICAgICAgICAgICAgICAgICAvLyBpbiB0aGUgbWVhbnRpbWVcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyU3Vic2V0KHN0b3JlZFNlcXVlbmNlLCBpbWFnZUlkcyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgcHJvbWlzZSBpcyBub3QgcmVtb3ZlZCB3aGVuIG92ZXJ3cml0aW5nIGltYWdlSWRzIHNpbmNlIHdlXG4gICAgICAgICAgICAgICAgICAgIC8vIG5lZWQgaXQgbGF0ZXIgb24uXG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlLiRwcm9taXNlID0gaW1hZ2VJZHMuJHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlLiRyZXNvbHZlZCA9IGltYWdlSWRzLiRyZXNvbHZlZDtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlbiBzZXQgdGhlIHN0b3JlZCBzZXF1ZW5jZSBhcyB0aGUgc2VxdWVuY2Ugb2YgaW1hZ2UgSURzIGluc3RlYWQgb2Ygc2ltcGx5XG4gICAgICAgICAgICAgICAgICAgIC8vIGFsbCBJRHMgYmVsb25naW5nIHRvIHRoZSB0cmFuc2VjdFxuICAgICAgICAgICAgICAgICAgICBpbWFnZUlkcyA9IHN0b3JlZFNlcXVlbmNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHMuJHByb21pc2U7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNob3cgdGhlIGltYWdlIHdpdGggdGhlIHNwZWNpZmllZCBJRC4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMuc2hvdyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIHByb21pc2UgPSBmZXRjaEltYWdlKGlkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzaG93KGlkKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyB3YWl0IGZvciBpbWFnZUlkcyB0byBiZSBsb2FkZWRcblx0XHRcdGltYWdlSWRzLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyBwcmUtbG9hZCBwcmV2aW91cyBhbmQgbmV4dCBpbWFnZXMgYnV0IGRvbid0IGRpc3BsYXkgdGhlbVxuXHRcdFx0XHRmZXRjaEltYWdlKG5leHRJZChpZCkpO1xuXHRcdFx0XHRmZXRjaEltYWdlKHByZXZJZChpZCkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBwcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBuZXh0IGltYWdlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzXG5cdFx0ICogcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXMgc2hvd24uXG5cdFx0ICovXG5cdFx0dGhpcy5uZXh0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF90aGlzLnNob3cobmV4dElkKCkpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBwcmV2aW91cyBpbWFnZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMucHJldiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfdGhpcy5zaG93KHByZXZJZCgpKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRDdXJyZW50SWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBsYWJlbHNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGZvciBhbm5vdGF0aW9uIGxhYmVscyB0byBwcm92aWRlIHNvbWUgY29udmVuaWVuY2UgZnVuY3Rpb25zLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2xhYmVscycsIGZ1bmN0aW9uIChBbm5vdGF0aW9uTGFiZWwsIExhYmVsLCBQcm9qZWN0TGFiZWwsIFByb2plY3QsIG1zZywgJHEpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkTGFiZWw7XG4gICAgICAgIHZhciBjdXJyZW50Q29uZmlkZW5jZSA9IDEuMDtcblxuICAgICAgICB2YXIgbGFiZWxzID0ge307XG5cbiAgICAgICAgLy8gdGhpcyBwcm9taXNlIGlzIHJlc29sdmVkIHdoZW4gYWxsIGxhYmVscyB3ZXJlIGxvYWRlZFxuICAgICAgICB0aGlzLnByb21pc2UgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuc2V0UHJvamVjdElkcyA9IGZ1bmN0aW9uIChpZHMpIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICB0aGlzLnByb21pc2UgPSBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICAgICAgLy8gLTEgYmNhdXNlIG9mIGdsb2JhbCBsYWJlbHNcbiAgICAgICAgICAgIHZhciBmaW5pc2hlZCA9IC0xO1xuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBhbGwgbGFiZWxzIGFyZSB0aGVyZS4gaWYgeWVzLCByZXNvbHZlXG4gICAgICAgICAgICB2YXIgbWF5YmVSZXNvbHZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgrK2ZpbmlzaGVkID09PSBpZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUobGFiZWxzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBsYWJlbHNbbnVsbF0gPSBMYWJlbC5xdWVyeShtYXliZVJlc29sdmUpO1xuXG4gICAgICAgICAgICBpZHMuZm9yRWFjaChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgICAgICBQcm9qZWN0LmdldCh7aWQ6IGlkfSwgZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxzW3Byb2plY3QubmFtZV0gPSBQcm9qZWN0TGFiZWwucXVlcnkoe3Byb2plY3RfaWQ6IGlkfSwgbWF5YmVSZXNvbHZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZmV0Y2hGb3JBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcbiAgICAgICAgICAgIGlmICghYW5ub3RhdGlvbikgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyBkb24ndCBmZXRjaCB0d2ljZVxuICAgICAgICAgICAgaWYgKCFhbm5vdGF0aW9uLmxhYmVscykge1xuICAgICAgICAgICAgICAgIGFubm90YXRpb24ubGFiZWxzID0gQW5ub3RhdGlvbkxhYmVsLnF1ZXJ5KHtcbiAgICAgICAgICAgICAgICAgICAgYW5ub3RhdGlvbl9pZDogYW5ub3RhdGlvbi5pZFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYW5ub3RhdGlvbi5sYWJlbHM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hdHRhY2hUb0Fubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gQW5ub3RhdGlvbkxhYmVsLmF0dGFjaCh7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbl9pZDogYW5ub3RhdGlvbi5pZCxcbiAgICAgICAgICAgICAgICBsYWJlbF9pZDogc2VsZWN0ZWRMYWJlbC5pZCxcbiAgICAgICAgICAgICAgICBjb25maWRlbmNlOiBjdXJyZW50Q29uZmlkZW5jZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxhYmVsLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGFubm90YXRpb24ubGFiZWxzLnB1c2gobGFiZWwpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxhYmVsLiRwcm9taXNlLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcblxuICAgICAgICAgICAgcmV0dXJuIGxhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucmVtb3ZlRnJvbUFubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbiwgbGFiZWwpIHtcbiAgICAgICAgICAgIC8vIHVzZSBpbmRleCB0byBzZWUgaWYgdGhlIGxhYmVsIGV4aXN0cyBmb3IgdGhlIGFubm90YXRpb25cbiAgICAgICAgICAgIHZhciBpbmRleCA9IGFubm90YXRpb24ubGFiZWxzLmluZGV4T2YobGFiZWwpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFiZWwuJGRlbGV0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaW5kZXggc2luY2UgdGhlIGxhYmVsIGxpc3QgbWF5IGhhdmUgYmVlbiBtb2RpZmllZFxuICAgICAgICAgICAgICAgICAgICAvLyBpbiB0aGUgbWVhbnRpbWVcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBhbm5vdGF0aW9uLmxhYmVscy5pbmRleE9mKGxhYmVsKTtcbiAgICAgICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB9LCBtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRUcmVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7fTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBudWxsO1xuICAgICAgICAgICAgdmFyIGJ1aWxkID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGxhYmVsLnBhcmVudF9pZDtcbiAgICAgICAgICAgICAgICBpZiAodHJlZVtrZXldW3BhcmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZVtrZXldW3BhcmVudF0ucHVzaChsYWJlbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZVtrZXldW3BhcmVudF0gPSBbbGFiZWxdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucHJvbWlzZS50aGVuKGZ1bmN0aW9uIChsYWJlbHMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBsYWJlbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZVtrZXldID0ge307XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsc1trZXldLmZvckVhY2goYnVpbGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJlZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBsYWJlbHM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRTZWxlY3RlZCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgc2VsZWN0ZWRMYWJlbCA9IGxhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0U2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0ZWRMYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc1NlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhc2VsZWN0ZWRMYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldEN1cnJlbnRDb25maWRlbmNlID0gZnVuY3Rpb24gKGNvbmZpZGVuY2UpIHtcbiAgICAgICAgICAgIGN1cnJlbnRDb25maWRlbmNlID0gY29uZmlkZW5jZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEN1cnJlbnRDb25maWRlbmNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRDb25maWRlbmNlO1xuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG1hcEFubm90YXRpb25zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBoYW5kbGluZyB0aGUgYW5ub3RhdGlvbnMgbGF5ZXIgb24gdGhlIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnbWFwQW5ub3RhdGlvbnMnLCBmdW5jdGlvbiAobWFwLCBpbWFnZXMsIGFubm90YXRpb25zLCBkZWJvdW5jZSwgc3R5bGVzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgZmVhdHVyZU92ZXJsYXkgPSBuZXcgb2wuRmVhdHVyZU92ZXJsYXkoe1xuXHRcdFx0c3R5bGU6IHN0eWxlcy5mZWF0dXJlc1xuXHRcdH0pO1xuXG5cdFx0dmFyIGZlYXR1cmVzID0gbmV3IG9sLkNvbGxlY3Rpb24oKTtcblxuXHRcdGZlYXR1cmVPdmVybGF5LnNldEZlYXR1cmVzKGZlYXR1cmVzKTtcblxuXHRcdC8vIHNlbGVjdCBpbnRlcmFjdGlvbiB3b3JraW5nIG9uIFwic2luZ2xlY2xpY2tcIlxuXHRcdHZhciBzZWxlY3QgPSBuZXcgb2wuaW50ZXJhY3Rpb24uU2VsZWN0KHtcblx0XHRcdHN0eWxlOiBzdHlsZXMuaGlnaGxpZ2h0XG5cdFx0fSk7XG5cblx0XHR2YXIgc2VsZWN0ZWRGZWF0dXJlcyA9IHNlbGVjdC5nZXRGZWF0dXJlcygpO1xuXG5cdFx0dmFyIG1vZGlmeSA9IG5ldyBvbC5pbnRlcmFjdGlvbi5Nb2RpZnkoe1xuXHRcdFx0ZmVhdHVyZXM6IGZlYXR1cmVPdmVybGF5LmdldEZlYXR1cmVzKCksXG5cdFx0XHQvLyB0aGUgU0hJRlQga2V5IG11c3QgYmUgcHJlc3NlZCB0byBkZWxldGUgdmVydGljZXMsIHNvXG5cdFx0XHQvLyB0aGF0IG5ldyB2ZXJ0aWNlcyBjYW4gYmUgZHJhd24gYXQgdGhlIHNhbWUgcG9zaXRpb25cblx0XHRcdC8vIG9mIGV4aXN0aW5nIHZlcnRpY2VzXG5cdFx0XHRkZWxldGVDb25kaXRpb246IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0XHRcdHJldHVybiBvbC5ldmVudHMuY29uZGl0aW9uLnNoaWZ0S2V5T25seShldmVudCkgJiYgb2wuZXZlbnRzLmNvbmRpdGlvbi5zaW5nbGVDbGljayhldmVudCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBkcmF3aW5nIGludGVyYWN0aW9uXG5cdFx0dmFyIGRyYXc7XG5cblx0XHQvLyBjb252ZXJ0IGEgcG9pbnQgYXJyYXkgdG8gYSBwb2ludCBvYmplY3Rcblx0XHQvLyByZS1pbnZlcnQgdGhlIHkgYXhpc1xuXHRcdHZhciBjb252ZXJ0RnJvbU9MUG9pbnQgPSBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdHJldHVybiB7eDogcG9pbnRbMF0sIHk6IGltYWdlcy5jdXJyZW50SW1hZ2UuaGVpZ2h0IC0gcG9pbnRbMV19O1xuXHRcdH07XG5cblx0XHQvLyBjb252ZXJ0IGEgcG9pbnQgb2JqZWN0IHRvIGEgcG9pbnQgYXJyYXlcblx0XHQvLyBpbnZlcnQgdGhlIHkgYXhpc1xuXHRcdHZhciBjb252ZXJ0VG9PTFBvaW50ID0gZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRyZXR1cm4gW3BvaW50LngsIGltYWdlcy5jdXJyZW50SW1hZ2UuaGVpZ2h0IC0gcG9pbnQueV07XG5cdFx0fTtcblxuXHRcdC8vIGFzc2VtYmxlcyB0aGUgY29vcmRpbmF0ZSBhcnJheXMgZGVwZW5kaW5nIG9uIHRoZSBnZW9tZXRyeSB0eXBlXG5cdFx0Ly8gc28gdGhleSBoYXZlIGEgdW5pZmllZCBmb3JtYXRcblx0XHR2YXIgZ2V0Q29vcmRpbmF0ZXMgPSBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcblx0XHRcdHN3aXRjaCAoZ2VvbWV0cnkuZ2V0VHlwZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ0NpcmNsZSc6XG5cdFx0XHRcdFx0Ly8gcmFkaXVzIGlzIHRoZSB4IHZhbHVlIG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGNpcmNsZVxuXHRcdFx0XHRcdHJldHVybiBbZ2VvbWV0cnkuZ2V0Q2VudGVyKCksIFtnZW9tZXRyeS5nZXRSYWRpdXMoKSwgMF1dO1xuXHRcdFx0XHRjYXNlICdQb2x5Z29uJzpcblx0XHRcdFx0Y2FzZSAnUmVjdGFuZ2xlJzpcblx0XHRcdFx0XHRyZXR1cm4gZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKVswXTtcblx0XHRcdFx0Y2FzZSAnUG9pbnQnOlxuXHRcdFx0XHRcdHJldHVybiBbZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKV07XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0cmV0dXJuIGdlb21ldHJ5LmdldENvb3JkaW5hdGVzKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIHNhdmVzIHRoZSB1cGRhdGVkIGdlb21ldHJ5IG9mIGFuIGFubm90YXRpb24gZmVhdHVyZVxuXHRcdHZhciBoYW5kbGVHZW9tZXRyeUNoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgZmVhdHVyZSA9IGUudGFyZ2V0O1xuXHRcdFx0dmFyIHNhdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHZhciBjb29yZGluYXRlcyA9IGdldENvb3JkaW5hdGVzKGZlYXR1cmUuZ2V0R2VvbWV0cnkoKSk7XG5cdFx0XHRcdGZlYXR1cmUuYW5ub3RhdGlvbi5wb2ludHMgPSBjb29yZGluYXRlcy5tYXAoY29udmVydEZyb21PTFBvaW50KTtcblx0XHRcdFx0ZmVhdHVyZS5hbm5vdGF0aW9uLiRzYXZlKCk7XG5cdFx0XHR9O1xuXHRcdFx0Ly8gdGhpcyBldmVudCBpcyByYXBpZGx5IGZpcmVkLCBzbyB3YWl0IHVudGlsIHRoZSBmaXJpbmcgc3RvcHNcblx0XHRcdC8vIGJlZm9yZSBzYXZpbmcgdGhlIGNoYW5nZXNcblx0XHRcdGRlYm91bmNlKHNhdmUsIDUwMCwgZmVhdHVyZS5hbm5vdGF0aW9uLmlkKTtcblx0XHR9O1xuXG5cdFx0dmFyIGNyZWF0ZUZlYXR1cmUgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0dmFyIGdlb21ldHJ5O1xuXHRcdFx0dmFyIHBvaW50cyA9IGFubm90YXRpb24ucG9pbnRzLm1hcChjb252ZXJ0VG9PTFBvaW50KTtcblxuXHRcdFx0c3dpdGNoIChhbm5vdGF0aW9uLnNoYXBlKSB7XG5cdFx0XHRcdGNhc2UgJ1BvaW50Jzpcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlBvaW50KHBvaW50c1swXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ1JlY3RhbmdsZSc6XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5SZWN0YW5nbGUoWyBwb2ludHMgXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ1BvbHlnb24nOlxuXHRcdFx0XHRcdC8vIGV4YW1wbGU6IGh0dHBzOi8vZ2l0aHViLmNvbS9vcGVubGF5ZXJzL29sMy9ibG9iL21hc3Rlci9leGFtcGxlcy9nZW9qc29uLmpzI0wxMjZcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlBvbHlnb24oWyBwb2ludHMgXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0xpbmVTdHJpbmcnOlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uTGluZVN0cmluZyhwb2ludHMpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdDaXJjbGUnOlxuXHRcdFx0XHRcdC8vIHJhZGl1cyBpcyB0aGUgeCB2YWx1ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjaXJjbGVcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLkNpcmNsZShwb2ludHNbMF0sIHBvaW50c1sxXVswXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBmZWF0dXJlID0gbmV3IG9sLkZlYXR1cmUoeyBnZW9tZXRyeTogZ2VvbWV0cnkgfSk7XG5cdFx0XHRmZWF0dXJlLm9uKCdjaGFuZ2UnLCBoYW5kbGVHZW9tZXRyeUNoYW5nZSk7XG5cdFx0XHRmZWF0dXJlLmFubm90YXRpb24gPSBhbm5vdGF0aW9uO1xuXHRcdFx0ZmVhdHVyZXMucHVzaChmZWF0dXJlKTtcblx0XHR9O1xuXG5cdFx0dmFyIHJlZnJlc2hBbm5vdGF0aW9ucyA9IGZ1bmN0aW9uIChlLCBpbWFnZSkge1xuXHRcdFx0Ly8gY2xlYXIgZmVhdHVyZXMgb2YgcHJldmlvdXMgaW1hZ2Vcblx0XHRcdGZlYXR1cmVzLmNsZWFyKCk7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmNsZWFyKCk7XG5cblx0XHRcdGFubm90YXRpb25zLnF1ZXJ5KHtpZDogaW1hZ2UuX2lkfSkuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGFubm90YXRpb25zLmZvckVhY2goY3JlYXRlRmVhdHVyZSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dmFyIGhhbmRsZU5ld0ZlYXR1cmUgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIGdlb21ldHJ5ID0gZS5mZWF0dXJlLmdldEdlb21ldHJ5KCk7XG5cdFx0XHR2YXIgY29vcmRpbmF0ZXMgPSBnZXRDb29yZGluYXRlcyhnZW9tZXRyeSk7XG5cblx0XHRcdGUuZmVhdHVyZS5hbm5vdGF0aW9uID0gYW5ub3RhdGlvbnMuYWRkKHtcblx0XHRcdFx0aWQ6IGltYWdlcy5nZXRDdXJyZW50SWQoKSxcblx0XHRcdFx0c2hhcGU6IGdlb21ldHJ5LmdldFR5cGUoKSxcblx0XHRcdFx0cG9pbnRzOiBjb29yZGluYXRlcy5tYXAoY29udmVydEZyb21PTFBvaW50KVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIGlmIHRoZSBmZWF0dXJlIGNvdWxkbid0IGJlIHNhdmVkLCByZW1vdmUgaXQgYWdhaW5cblx0XHRcdGUuZmVhdHVyZS5hbm5vdGF0aW9uLiRwcm9taXNlLmNhdGNoKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0ZmVhdHVyZXMucmVtb3ZlKGUuZmVhdHVyZSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0ZS5mZWF0dXJlLm9uKCdjaGFuZ2UnLCBoYW5kbGVHZW9tZXRyeUNoYW5nZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uIChzY29wZSkge1xuXHRcdFx0ZmVhdHVyZU92ZXJsYXkuc2V0TWFwKG1hcCk7XG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24oc2VsZWN0KTtcblx0XHRcdHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCByZWZyZXNoQW5ub3RhdGlvbnMpO1xuXG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLm9uKCdjaGFuZ2U6bGVuZ3RoJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyBpZiBub3QgYWxyZWFkeSBkaWdlc3RpbmcsIGRpZ2VzdFxuXHRcdFx0XHRpZiAoIXNjb3BlLiQkcGhhc2UpIHtcblx0XHRcdFx0XHQvLyBwcm9wYWdhdGUgbmV3IHNlbGVjdGlvbnMgdGhyb3VnaCB0aGUgYW5ndWxhciBhcHBsaWNhdGlvblxuXHRcdFx0XHRcdHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5zdGFydERyYXdpbmcgPSBmdW5jdGlvbiAodHlwZSkge1xuICAgICAgICAgICAgc2VsZWN0LnNldEFjdGl2ZShmYWxzZSk7XG5cblx0XHRcdHR5cGUgPSB0eXBlIHx8ICdQb2ludCc7XG5cdFx0XHRkcmF3ID0gbmV3IG9sLmludGVyYWN0aW9uLkRyYXcoe1xuXHRcdFx0XHRmZWF0dXJlczogZmVhdHVyZXMsXG5cdFx0XHRcdHR5cGU6IHR5cGUsXG5cdFx0XHRcdHN0eWxlOiBzdHlsZXMuZWRpdGluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihtb2RpZnkpO1xuXHRcdFx0bWFwLmFkZEludGVyYWN0aW9uKGRyYXcpO1xuXHRcdFx0ZHJhdy5vbignZHJhd2VuZCcsIGhhbmRsZU5ld0ZlYXR1cmUpO1xuXHRcdH07XG5cblx0XHR0aGlzLmZpbmlzaERyYXdpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtYXAucmVtb3ZlSW50ZXJhY3Rpb24oZHJhdyk7XG5cdFx0XHRtYXAucmVtb3ZlSW50ZXJhY3Rpb24obW9kaWZ5KTtcbiAgICAgICAgICAgIHNlbGVjdC5zZXRBY3RpdmUodHJ1ZSk7XG5cdFx0XHQvLyBub24ndCBzZWxlY3QgdGhlIGxhc3QgZHJhd24gcG9pbnRcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuY2xlYXIoKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5kZWxldGVTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoZmVhdHVyZSkge1xuXHRcdFx0XHRhbm5vdGF0aW9ucy5kZWxldGUoZmVhdHVyZS5hbm5vdGF0aW9uKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRmZWF0dXJlcy5yZW1vdmUoZmVhdHVyZSk7XG5cdFx0XHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5yZW1vdmUoZmVhdHVyZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuc2VsZWN0ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgZmVhdHVyZTtcblx0XHRcdGZlYXR1cmVzLmZvckVhY2goZnVuY3Rpb24gKGYpIHtcblx0XHRcdFx0aWYgKGYuYW5ub3RhdGlvbi5pZCA9PT0gaWQpIHtcblx0XHRcdFx0XHRmZWF0dXJlID0gZjtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyByZW1vdmUgc2VsZWN0aW9uIGlmIGZlYXR1cmUgd2FzIGFscmVhZHkgc2VsZWN0ZWQuIG90aGVyd2lzZSBzZWxlY3QuXG5cdFx0XHRpZiAoIXNlbGVjdGVkRmVhdHVyZXMucmVtb3ZlKGZlYXR1cmUpKSB7XG5cdFx0XHRcdHNlbGVjdGVkRmVhdHVyZXMucHVzaChmZWF0dXJlKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIC8vIGZpdHMgdGhlIHZpZXcgdG8gdGhlIGdpdmVuIGZlYXR1cmVcbiAgICAgICAgdGhpcy5maXQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGZlYXR1cmVzLmZvckVhY2goZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgICAgICAgICBpZiAoZi5hbm5vdGF0aW9uLmlkID09PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICBtYXAuZ2V0VmlldygpLmZpdEdlb21ldHJ5KGYuZ2V0R2VvbWV0cnkoKSwgbWFwLmdldFNpemUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cblx0XHR0aGlzLmNsZWFyU2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5jbGVhcigpO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldFNlbGVjdGVkRmVhdHVyZXMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gc2VsZWN0ZWRGZWF0dXJlcztcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBtYXBJbWFnZVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgaGFuZGxpbmcgdGhlIGltYWdlIGxheWVyIG9uIHRoZSBPcGVuTGF5ZXJzIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ21hcEltYWdlJywgZnVuY3Rpb24gKG1hcCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXHRcdHZhciBleHRlbnQgPSBbMCwgMCwgMCwgMF07XG5cblx0XHR2YXIgcHJvamVjdGlvbiA9IG5ldyBvbC5wcm9qLlByb2plY3Rpb24oe1xuXHRcdFx0Y29kZTogJ2RpYXMtaW1hZ2UnLFxuXHRcdFx0dW5pdHM6ICdwaXhlbHMnLFxuXHRcdFx0ZXh0ZW50OiBleHRlbnRcblx0XHR9KTtcblxuXHRcdHZhciBpbWFnZUxheWVyID0gbmV3IG9sLmxheWVyLkltYWdlKCk7XG5cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoc2NvcGUpIHtcblx0XHRcdG1hcC5hZGRMYXllcihpbWFnZUxheWVyKTtcblxuXHRcdFx0Ly8gcmVmcmVzaCB0aGUgaW1hZ2Ugc291cmNlXG5cdFx0XHRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgZnVuY3Rpb24gKGUsIGltYWdlKSB7XG5cdFx0XHRcdGV4dGVudFsyXSA9IGltYWdlLndpZHRoO1xuXHRcdFx0XHRleHRlbnRbM10gPSBpbWFnZS5oZWlnaHQ7XG5cblx0XHRcdFx0dmFyIHpvb20gPSBzY29wZS52aWV3cG9ydC56b29tO1xuXG5cdFx0XHRcdHZhciBjZW50ZXIgPSBzY29wZS52aWV3cG9ydC5jZW50ZXI7XG5cdFx0XHRcdC8vIHZpZXdwb3J0IGNlbnRlciBpcyBzdGlsbCB1bmluaXRpYWxpemVkXG5cdFx0XHRcdGlmIChjZW50ZXJbMF0gPT09IHVuZGVmaW5lZCAmJiBjZW50ZXJbMV0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGNlbnRlciA9IG9sLmV4dGVudC5nZXRDZW50ZXIoZXh0ZW50KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBpbWFnZVN0YXRpYyA9IG5ldyBvbC5zb3VyY2UuSW1hZ2VTdGF0aWMoe1xuXHRcdFx0XHRcdHVybDogaW1hZ2Uuc3JjLFxuXHRcdFx0XHRcdHByb2plY3Rpb246IHByb2plY3Rpb24sXG5cdFx0XHRcdFx0aW1hZ2VFeHRlbnQ6IGV4dGVudFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpbWFnZUxheWVyLnNldFNvdXJjZShpbWFnZVN0YXRpYyk7XG5cblx0XHRcdFx0bWFwLnNldFZpZXcobmV3IG9sLlZpZXcoe1xuXHRcdFx0XHRcdHByb2plY3Rpb246IHByb2plY3Rpb24sXG5cdFx0XHRcdFx0Y2VudGVyOiBjZW50ZXIsXG5cdFx0XHRcdFx0em9vbTogem9vbSxcblx0XHRcdFx0XHR6b29tRmFjdG9yOiAxLjUsXG5cdFx0XHRcdFx0Ly8gYWxsb3cgYSBtYXhpbXVtIG9mIDR4IG1hZ25pZmljYXRpb25cblx0XHRcdFx0XHRtaW5SZXNvbHV0aW9uOiAwLjI1LFxuXHRcdFx0XHRcdC8vIHJlc3RyaWN0IG1vdmVtZW50XG5cdFx0XHRcdFx0ZXh0ZW50OiBleHRlbnRcblx0XHRcdFx0fSkpO1xuXG5cdFx0XHRcdC8vIGlmIHpvb20gaXMgbm90IGluaXRpYWxpemVkLCBmaXQgdGhlIHZpZXcgdG8gdGhlIGltYWdlIGV4dGVudFxuXHRcdFx0XHRpZiAoem9vbSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0bWFwLmdldFZpZXcoKS5maXRFeHRlbnQoZXh0ZW50LCBtYXAuZ2V0U2l6ZSgpKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0RXh0ZW50ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGV4dGVudDtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRQcm9qZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHByb2plY3Rpb247XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIHN0eWxlc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgZm9yIHRoZSBPcGVuTGF5ZXJzIHN0eWxlc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ3N0eWxlcycsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciB3aGl0ZSA9IFsyNTUsIDI1NSwgMjU1LCAxXTtcblx0XHR2YXIgYmx1ZSA9IFswLCAxNTMsIDI1NSwgMV07XG5cdFx0dmFyIG9yYW5nZSA9ICcjZmY1ZTAwJztcblx0XHR2YXIgd2lkdGggPSAzO1xuXG5cdFx0dGhpcy5mZWF0dXJlcyA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IHdoaXRlLFxuXHRcdFx0XHRcdHdpZHRoOiA1XG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG5cdFx0XHRcdFx0cmFkaXVzOiA2LFxuXHRcdFx0XHRcdGZpbGw6IG5ldyBvbC5zdHlsZS5GaWxsKHtcblx0XHRcdFx0XHRcdGNvbG9yOiBibHVlXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRcdGNvbG9yOiB3aGl0ZSxcblx0XHRcdFx0XHRcdHdpZHRoOiAyXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSlcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRjb2xvcjogYmx1ZSxcblx0XHRcdFx0XHR3aWR0aDogM1xuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHRdO1xuXG5cdFx0dGhpcy5oaWdobGlnaHQgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB3aGl0ZSxcblx0XHRcdFx0XHR3aWR0aDogNlxuXHRcdFx0XHR9KSxcblx0XHRcdFx0aW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0XHRcdHJhZGl1czogNixcblx0XHRcdFx0XHRmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XG5cdFx0XHRcdFx0XHRjb2xvcjogb3JhbmdlXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRcdGNvbG9yOiB3aGl0ZSxcblx0XHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSlcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRjb2xvcjogb3JhbmdlLFxuXHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdF07XG5cblx0XHR0aGlzLmVkaXRpbmcgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB3aGl0ZSxcblx0XHRcdFx0XHR3aWR0aDogNVxuXHRcdFx0XHR9KSxcblx0XHRcdFx0aW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0XHRcdHJhZGl1czogNixcblx0XHRcdFx0XHRmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XG5cdFx0XHRcdFx0XHRjb2xvcjogYmx1ZVxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0XHRjb2xvcjogd2hpdGUsXG5cdFx0XHRcdFx0XHR3aWR0aDogMixcblx0XHRcdFx0XHRcdGxpbmVEYXNoOiBbM11cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiBibHVlLFxuXHRcdFx0XHRcdHdpZHRoOiAzLFxuXHRcdFx0XHRcdGxpbmVEYXNoOiBbNV1cblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0XTtcblxuXHRcdHRoaXMudmlld3BvcnQgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiBibHVlLFxuXHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdH0pLFxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB3aGl0ZSxcblx0XHRcdFx0XHR3aWR0aDogMVxuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHRdO1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgdXJsUGFyYW1zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFRoZSBHRVQgcGFyYW1ldGVycyBvZiB0aGUgdXJsLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ3VybFBhcmFtcycsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBzdGF0ZSA9IHt9O1xuXG5cdFx0Ly8gdHJhbnNmb3JtcyBhIFVSTCBwYXJhbWV0ZXIgc3RyaW5nIGxpa2UgI2E9MSZiPTIgdG8gYW4gb2JqZWN0XG5cdFx0dmFyIGRlY29kZVN0YXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHBhcmFtcyA9IGxvY2F0aW9uLmhhc2gucmVwbGFjZSgnIycsICcnKVxuXHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJyYnKTtcblxuXHRcdFx0dmFyIHN0YXRlID0ge307XG5cblx0XHRcdHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJhbSkge1xuXHRcdFx0XHQvLyBjYXB0dXJlIGtleS12YWx1ZSBwYWlyc1xuXHRcdFx0XHR2YXIgY2FwdHVyZSA9IHBhcmFtLm1hdGNoKC8oLispXFw9KC4rKS8pO1xuXHRcdFx0XHRpZiAoY2FwdHVyZSAmJiBjYXB0dXJlLmxlbmd0aCA9PT0gMykge1xuXHRcdFx0XHRcdHN0YXRlW2NhcHR1cmVbMV1dID0gZGVjb2RlVVJJQ29tcG9uZW50KGNhcHR1cmVbMl0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHN0YXRlO1xuXHRcdH07XG5cblx0XHQvLyB0cmFuc2Zvcm1zIGFuIG9iamVjdCB0byBhIFVSTCBwYXJhbWV0ZXIgc3RyaW5nXG5cdFx0dmFyIGVuY29kZVN0YXRlID0gZnVuY3Rpb24gKHN0YXRlKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gJyc7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gc3RhdGUpIHtcblx0XHRcdFx0cGFyYW1zICs9IGtleSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChzdGF0ZVtrZXldKSArICcmJztcblx0XHRcdH1cblx0XHRcdHJldHVybiBwYXJhbXMuc3Vic3RyaW5nKDAsIHBhcmFtcy5sZW5ndGggLSAxKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5wdXNoU3RhdGUgPSBmdW5jdGlvbiAocykge1xuXHRcdFx0c3RhdGUuc2x1ZyA9IHM7XG5cdFx0XHRoaXN0b3J5LnB1c2hTdGF0ZShzdGF0ZSwgJycsIHN0YXRlLnNsdWcgKyAnIycgKyBlbmNvZGVTdGF0ZShzdGF0ZSkpO1xuXHRcdH07XG5cblx0XHQvLyBzZXRzIGEgVVJMIHBhcmFtZXRlciBhbmQgdXBkYXRlcyB0aGUgaGlzdG9yeSBzdGF0ZVxuXHRcdHRoaXMuc2V0ID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIHBhcmFtcykge1xuXHRcdFx0XHRzdGF0ZVtrZXldID0gcGFyYW1zW2tleV07XG5cdFx0XHR9XG5cdFx0XHRoaXN0b3J5LnJlcGxhY2VTdGF0ZShzdGF0ZSwgJycsIHN0YXRlLnNsdWcgKyAnIycgKyBlbmNvZGVTdGF0ZShzdGF0ZSkpO1xuXHRcdH07XG5cblx0XHQvLyByZXR1cm5zIGEgVVJMIHBhcmFtZXRlclxuXHRcdHRoaXMuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuXHRcdFx0cmV0dXJuIHN0YXRlW2tleV07XG5cdFx0fTtcblxuXHRcdHN0YXRlID0gaGlzdG9yeS5zdGF0ZTtcblxuXHRcdGlmICghc3RhdGUpIHtcblx0XHRcdHN0YXRlID0gZGVjb2RlU3RhdGUoKTtcblx0XHR9XG5cdH1cbik7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9