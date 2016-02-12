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
 * @name AnnotationsCyclingController
 * @memberOf dias.annotations
 * @description Controller for the background segmentation ROI opacity settings
 */
angular.module('dias.annotations').controller('AnnotationsCyclingController', ["$scope", "mapAnnotations", "labels", "keyboard", function ($scope, mapAnnotations, labels, keyboard) {
        "use strict";

        // flag to prevent cycling while a new image is loading
        var loading = false;

        var cyclingKey = 'annotations';

        var nextAnnotation = function (e) {
            if (loading || !$scope.cycling()) return;

            if (mapAnnotations.hasNext()) {
                mapAnnotations.cycleNext();
            } else {
                // method from AnnotatorController; mapAnnotations will refresh automatically
                $scope.nextImage().then(mapAnnotations.jumpToFirst);
                loading = true;
            }

            if (e) {
                // only apply if this was called by the keyboard event
                $scope.$apply();
            }

            // cancel all keyboard events with lower priority
            return false;
        };

        var prevAnnotation = function (e) {
            if (loading || !$scope.cycling()) return;

            if (mapAnnotations.hasPrevious()) {
                mapAnnotations.cyclePrevious();
            } else {
                // method from AnnotatorController; mapAnnotations will refresh automatically
                $scope.prevImage().then(mapAnnotations.jumpToLast);
                loading = true;
            }

            if (e) {
                // only apply if this was called by the keyboard event
                $scope.$apply();
            }

            // cancel all keyboard events with lower priority
            return false;
        };

        var attachLabel = function (e) {
            if (loading) return;
            if (e) {
                e.preventDefault();
            }

            if ($scope.cycling() && labels.hasSelected()) {
                labels.attachToAnnotation(mapAnnotations.getCurrent()).$promise.then(function () {
                    mapAnnotations.flicker(1);
                });
            } else {
                mapAnnotations.flicker();
            }
        };

        // stop cycling using a keyboard event
        var stopCycling = function (e) {
            e.preventDefault();
            $scope.stopCycling();
            $scope.$apply();
            return false;
        };

        $scope.cycling = function () {
            return $scope.getVolatileSettings('cycle') === cyclingKey;
        };

        $scope.startCycling = function () {
            $scope.setVolatileSettings('cycle', cyclingKey);
        };

        $scope.stopCycling = function () {
            $scope.setVolatileSettings('cycle', '');
        };

        // the cycle settings my be set by other controllers, too, so watch it
        // instead of using the start/stop functions to add/remove events etc.
        $scope.$watch('volatileSettings.cycle', function (cycle, oldCycle) {
            if (cycle === cyclingKey) {
                // override previous image on arrow left
                keyboard.on(37, prevAnnotation, 10);
                // override next image on arrow right and space
                keyboard.on(39, nextAnnotation, 10);
                keyboard.on(32, nextAnnotation, 10);

                keyboard.on(13, attachLabel, 10);
                keyboard.on(27, stopCycling, 10);
                mapAnnotations.jumpToCurrent();
            } else if (oldCycle === cyclingKey) {
                keyboard.off(37, prevAnnotation);
                keyboard.off(39, nextAnnotation);
                keyboard.off(32, nextAnnotation);
                keyboard.off(13, attachLabel);
                keyboard.off(27, stopCycling);
                mapAnnotations.clearSelected();
            }
        });

        $scope.$on('image.shown', function () {
            loading = false;
        });

        $scope.prevAnnotation = prevAnnotation;
        $scope.nextAnnotation = nextAnnotation;
        $scope.attachLabel = attachLabel;
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
 * @name SettingsAnnotationOpacityController
 * @memberOf dias.annotations
 * @description Controller for the sidebar settings foldout
 */
angular.module('dias.annotations').controller('SettingsAnnotationOpacityController', ["$scope", "mapAnnotations", function ($scope, mapAnnotations) {
        "use strict";

        $scope.setDefaultSettings('annotation_opacity', '1');
        $scope.$watch('settings.annotation_opacity', function (opacity) {
            mapAnnotations.setOpacity(opacity);
        });
    }]
);

/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SettingsController
 * @memberOf dias.annotations
 * @description Controller for the sidebar settings foldout
 */
angular.module('dias.annotations').controller('SettingsController', ["$scope", "debounce", function ($scope, debounce) {
        "use strict";

        var settingsStorageKey = 'dias.annotations.settings';

        var defaultSettings = {};

        // may be extended by child controllers
        $scope.settings = {};

        // may be extended by child controllers but will not be permanently stored
        $scope.volatileSettings = {};

        var storeSettings = function () {
            var settings = angular.copy($scope.settings);
            for (var key in settings) {
                if (settings[key] === defaultSettings[key]) {
                    // don't store default settings values
                    delete settings[key];
                }
            }

            window.localStorage[settingsStorageKey] = JSON.stringify(settings);
        };

        var storeSettingsDebounced = function () {
            // wait for quick changes and only store them once things calmed down again
            // (e.g. when the user fools around with a range slider)
            debounce(storeSettings, 250, settingsStorageKey);
        };

        var restoreSettings = function () {
            var settings = {};
            if (window.localStorage[settingsStorageKey]) {
                settings = JSON.parse(window.localStorage[settingsStorageKey]);
            }

            return angular.extend(settings, defaultSettings);
        };

        $scope.setSettings = function (key, value) {
            $scope.settings[key] = value;
        };

        $scope.getSettings = function (key) {
            return $scope.settings[key];
        };

        $scope.setDefaultSettings = function (key, value) {
            defaultSettings[key] = value;
            if (!$scope.settings.hasOwnProperty(key)) {
                $scope.setSettings(key, value);
            }
        };

        $scope.setVolatileSettings = function (key, value) {
            $scope.volatileSettings[key] = value;
        };

        $scope.getVolatileSettings = function (key) {
            return $scope.volatileSettings[key];
        };

        $scope.$watch('settings', storeSettingsDebounced, true);
        angular.extend($scope.settings, restoreSettings());
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
angular.module('dias.annotations').service('annotations', ["Annotation", "shapes", "msg", function (Annotation, shapes, msg) {
		"use strict";

		var annotations;
        var promise;

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
            promise = annotations.$promise;
			promise.then(function (a) {
				a.forEach(resolveShapeName);
			});
			return annotations;
		};

		this.add = function (params) {
			if (!params.shape_id && params.shape) {
				params.shape_id = shapes.getId(params.shape);
			}
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

        this.getPromise = function () {
            return promise;
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
angular.module('dias.annotations').service('mapAnnotations', ["map", "images", "annotations", "debounce", "styles", "$interval", "labels", function (map, images, annotations, debounce, styles, $interval, labels) {
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

        // index of the currently selected annotation (during cycling through annotations)
        // in the annotationFeatures collection
        var currentAnnotation = 0;

        var _this = this;

        var selectAndShowAnnotation = function (annotation) {
            _this.clearSelection();
            if (annotation) {
                selectedFeatures.push(annotation);
                map.getView().fit(annotation.getGeometry(), map.getSize(), {
                    padding: [50, 50, 50, 50]
                });
            }
        };

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
            feature.annotation = annotation;
            if (annotation.labels && annotation.labels.length > 0) {
                feature.color = annotation.labels[0].label.color;
            }
			feature.on('change', handleGeometryChange);
            annotationSource.addFeature(feature);
		};

		var refreshAnnotations = function (e, image) {
			// clear features of previous image
            annotationSource.clear();
			_this.clearSelection();

			annotations.query({id: image._id}).$promise.then(function () {
				annotations.forEach(createFeature);
			});
		};

		var handleNewFeature = function (e) {
			var geometry = e.feature.getGeometry();
			var coordinates = getCoordinates(geometry);
            var label = labels.getSelected();

            e.feature.color = label.color;

			e.feature.annotation = annotations.add({
				id: images.getCurrentId(),
				shape: geometry.getType(),
				points: coordinates.map(convertFromOLPoint),
                label_id: label.id,
                confidence: labels.getCurrentConfidence()
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
			_this.clearSelection();
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

        this.setOpacity = function (opacity) {
            annotationLayer.setOpacity(opacity);
        };

        this.cycleNext = function () {
            currentAnnotation = (currentAnnotation + 1) % annotationFeatures.getLength();
            _this.jumpToCurrent();
        };

        this.hasNext = function () {
            return (currentAnnotation + 1) < annotationFeatures.getLength();
        };

        this.cyclePrevious = function () {
            // we want no negative index here
            currentAnnotation = (currentAnnotation + annotationFeatures.getLength() - 1) % annotationFeatures.getLength();
            _this.jumpToCurrent();
        };

        this.hasPrevious = function () {
            return currentAnnotation > 0;
        };

        this.jumpToCurrent = function () {
            // only jump once the annotations were loaded
            annotations.getPromise().then(function () {
                selectAndShowAnnotation(annotationFeatures.item(currentAnnotation));
            });
        };

        this.jumpToFirst = function () {
            currentAnnotation = 0;
            _this.jumpToCurrent();
        };

        this.jumpToLast = function () {
            annotations.getPromise().then(function () {
                // wait for the new annotations to be loaded
                if (annotationFeatures.getLength() !== 0) {
                    currentAnnotation = annotationFeatures.getLength() - 1;
                }
                _this.jumpToCurrent();
            });
        };

        // flicker the highlighted annotation to signal an error
        this.flicker = function (count) {
            var annotation = selectedFeatures.item(0);
            if (!annotation) return;
            count = count || 3;

            var toggle = function () {
                if (selectedFeatures.getLength() > 0) {
                    selectedFeatures.clear();
                } else {
                    selectedFeatures.push(annotation);
                }
            };
            // number of repeats must be even, otherwise the layer would stay onvisible
            $interval(toggle, 100, count * 2);
        };

        this.getCurrent = function () {
            return annotationFeatures.item(currentAnnotation).annotation;
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

        var defaultCircleRadius = 6;
        var defaultStrokeWidth = 3;

        var defaultStrokeOutline = new ol.style.Stroke({
            color: this.colors.white,
            width: 5
        });

        var selectedStrokeOutline = new ol.style.Stroke({
            color: this.colors.white,
            width: 6
        });

        var defaultStroke = new ol.style.Stroke({
            color: this.colors.blue,
            width: defaultStrokeWidth
        });

        var selectedStroke = new ol.style.Stroke({
            color: this.colors.orange,
            width: defaultStrokeWidth
        });

        var defaultCircleFill = new ol.style.Fill({
            color: this.colors.blue
        });

        var selectedCircleFill = new ol.style.Fill({
            color: this.colors.orange
        });

        var defaultCircleStroke = new ol.style.Stroke({
            color: this.colors.white,
            width: 2
        });

        var selectedCircleStroke = new ol.style.Stroke({
            color: this.colors.white,
            width: defaultStrokeWidth
        });

        var editingCircleStroke = new ol.style.Stroke({
            color: this.colors.white,
            width: 2,
            lineDash: [3]
        });

        var editingStroke = new ol.style.Stroke({
            color: this.colors.blue,
            width: defaultStrokeWidth,
            lineDash: [5]
        });

        var defaultFill = new ol.style.Fill({
            color: this.colors.blue
        });

        var selectedFill = new ol.style.Fill({
            color: this.colors.orange
        });

		this.features = function (feature) {
            var color = feature.color ? ('#' + feature.color) : this.colors.blue;
            return [
                new ol.style.Style({
                    stroke: defaultStrokeOutline,
                    image: new ol.style.Circle({
                        radius: defaultCircleRadius,
                        fill: new ol.style.Fill({
                            color: color
                        }),
                        stroke: defaultCircleStroke
                    })
                }),
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: color,
                        width: 3
                    })
                })
            ];
        };

		this.highlight = [
			new ol.style.Style({
				stroke: selectedStrokeOutline,
				image: new ol.style.Circle({
					radius: defaultCircleRadius,
					fill: selectedCircleFill,
					stroke: selectedCircleStroke
				}),
                zIndex: 200
			}),
			new ol.style.Style({
				stroke: selectedStroke,
                zIndex: 200
			})
		];

		this.editing = [
			new ol.style.Style({
				stroke: defaultStrokeOutline,
				image: new ol.style.Circle({
					radius: defaultCircleRadius,
					fill: defaultCircleFill,
					stroke: editingCircleStroke
				})
			}),
			new ol.style.Style({
				stroke: editingStroke
			})
		];

		this.viewport = [
			new ol.style.Style({
				stroke: defaultStroke,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0N5Y2xpbmdDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQW5ub3RhdG9yQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NhbnZhc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9DYXRlZ29yaWVzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NvbmZpZGVuY2VDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ29udHJvbHNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvTWluaW1hcENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TZWxlY3RlZExhYmVsQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NldHRpbmdzQW5ub3RhdGlvbk9wYWNpdHlDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2V0dGluZ3NDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2lkZWJhckNvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2Fubm90YXRpb25MaXN0SXRlbS5qcyIsImRpcmVjdGl2ZXMvbGFiZWxDYXRlZ29yeUl0ZW0uanMiLCJkaXJlY3RpdmVzL2xhYmVsSXRlbS5qcyIsImZhY3Rvcmllcy9kZWJvdW5jZS5qcyIsImZhY3Rvcmllcy9tYXAuanMiLCJzZXJ2aWNlcy9hbm5vdGF0aW9ucy5qcyIsInNlcnZpY2VzL2ltYWdlcy5qcyIsInNlcnZpY2VzL2tleWJvYXJkLmpzIiwic2VydmljZXMvbGFiZWxzLmpzIiwic2VydmljZXMvbWFwQW5ub3RhdGlvbnMuanMiLCJzZXJ2aWNlcy9tYXBJbWFnZS5qcyIsInNlcnZpY2VzL3N0eWxlcy5qcyIsInNlcnZpY2VzL3VybFBhcmFtcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxvQkFBQSxDQUFBLFlBQUE7Ozs7Ozs7OztBQ0dBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLHlGQUFBLFVBQUEsUUFBQSxnQkFBQSxRQUFBLGFBQUEsUUFBQTtFQUNBOztFQUVBLE9BQUEsbUJBQUEsZUFBQSxzQkFBQTs7RUFFQSxJQUFBLHFCQUFBLFlBQUE7R0FDQSxPQUFBLGNBQUEsWUFBQTs7O0VBR0EsSUFBQSxtQkFBQSxlQUFBOztFQUVBLE9BQUEsY0FBQTs7RUFFQSxPQUFBLGlCQUFBLGVBQUE7O0VBRUEsT0FBQSxtQkFBQSxVQUFBLEdBQUEsSUFBQTs7R0FFQSxJQUFBLENBQUEsRUFBQSxVQUFBO0lBQ0EsT0FBQTs7R0FFQSxlQUFBLE9BQUE7OztRQUdBLE9BQUEsZ0JBQUEsZUFBQTs7RUFFQSxPQUFBLGFBQUEsVUFBQSxJQUFBO0dBQ0EsSUFBQSxXQUFBO0dBQ0EsaUJBQUEsUUFBQSxVQUFBLFNBQUE7SUFDQSxJQUFBLFFBQUEsY0FBQSxRQUFBLFdBQUEsTUFBQSxJQUFBO0tBQ0EsV0FBQTs7O0dBR0EsT0FBQTs7O0VBR0EsT0FBQSxJQUFBLGVBQUE7Ozs7Ozs7Ozs7O0FDbkNBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLG1GQUFBLFVBQUEsUUFBQSxnQkFBQSxRQUFBLFVBQUE7UUFDQTs7O1FBR0EsSUFBQSxVQUFBOztRQUVBLElBQUEsYUFBQTs7UUFFQSxJQUFBLGlCQUFBLFVBQUEsR0FBQTtZQUNBLElBQUEsV0FBQSxDQUFBLE9BQUEsV0FBQTs7WUFFQSxJQUFBLGVBQUEsV0FBQTtnQkFDQSxlQUFBO21CQUNBOztnQkFFQSxPQUFBLFlBQUEsS0FBQSxlQUFBO2dCQUNBLFVBQUE7OztZQUdBLElBQUEsR0FBQTs7Z0JBRUEsT0FBQTs7OztZQUlBLE9BQUE7OztRQUdBLElBQUEsaUJBQUEsVUFBQSxHQUFBO1lBQ0EsSUFBQSxXQUFBLENBQUEsT0FBQSxXQUFBOztZQUVBLElBQUEsZUFBQSxlQUFBO2dCQUNBLGVBQUE7bUJBQ0E7O2dCQUVBLE9BQUEsWUFBQSxLQUFBLGVBQUE7Z0JBQ0EsVUFBQTs7O1lBR0EsSUFBQSxHQUFBOztnQkFFQSxPQUFBOzs7O1lBSUEsT0FBQTs7O1FBR0EsSUFBQSxjQUFBLFVBQUEsR0FBQTtZQUNBLElBQUEsU0FBQTtZQUNBLElBQUEsR0FBQTtnQkFDQSxFQUFBOzs7WUFHQSxJQUFBLE9BQUEsYUFBQSxPQUFBLGVBQUE7Z0JBQ0EsT0FBQSxtQkFBQSxlQUFBLGNBQUEsU0FBQSxLQUFBLFlBQUE7b0JBQ0EsZUFBQSxRQUFBOzttQkFFQTtnQkFDQSxlQUFBOzs7OztRQUtBLElBQUEsY0FBQSxVQUFBLEdBQUE7WUFDQSxFQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxPQUFBLFVBQUEsWUFBQTtZQUNBLE9BQUEsT0FBQSxvQkFBQSxhQUFBOzs7UUFHQSxPQUFBLGVBQUEsWUFBQTtZQUNBLE9BQUEsb0JBQUEsU0FBQTs7O1FBR0EsT0FBQSxjQUFBLFlBQUE7WUFDQSxPQUFBLG9CQUFBLFNBQUE7Ozs7O1FBS0EsT0FBQSxPQUFBLDBCQUFBLFVBQUEsT0FBQSxVQUFBO1lBQ0EsSUFBQSxVQUFBLFlBQUE7O2dCQUVBLFNBQUEsR0FBQSxJQUFBLGdCQUFBOztnQkFFQSxTQUFBLEdBQUEsSUFBQSxnQkFBQTtnQkFDQSxTQUFBLEdBQUEsSUFBQSxnQkFBQTs7Z0JBRUEsU0FBQSxHQUFBLElBQUEsYUFBQTtnQkFDQSxTQUFBLEdBQUEsSUFBQSxhQUFBO2dCQUNBLGVBQUE7bUJBQ0EsSUFBQSxhQUFBLFlBQUE7Z0JBQ0EsU0FBQSxJQUFBLElBQUE7Z0JBQ0EsU0FBQSxJQUFBLElBQUE7Z0JBQ0EsU0FBQSxJQUFBLElBQUE7Z0JBQ0EsU0FBQSxJQUFBLElBQUE7Z0JBQ0EsU0FBQSxJQUFBLElBQUE7Z0JBQ0EsZUFBQTs7OztRQUlBLE9BQUEsSUFBQSxlQUFBLFlBQUE7WUFDQSxVQUFBOzs7UUFHQSxPQUFBLGlCQUFBO1FBQ0EsT0FBQSxpQkFBQTtRQUNBLE9BQUEsY0FBQTs7Ozs7Ozs7Ozs7QUNoSEEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsd0ZBQUEsVUFBQSxRQUFBLFFBQUEsV0FBQSxLQUFBLFVBQUEsVUFBQTtRQUNBOztRQUVBLE9BQUEsU0FBQTtRQUNBLE9BQUEsZUFBQTs7O1FBR0EsT0FBQSxXQUFBO1lBQ0EsTUFBQSxVQUFBLElBQUE7WUFDQSxRQUFBLENBQUEsVUFBQSxJQUFBLE1BQUEsVUFBQSxJQUFBOzs7O1FBSUEsSUFBQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQSxlQUFBO1lBQ0EsT0FBQSxXQUFBLGVBQUEsT0FBQSxPQUFBOzs7O1FBSUEsSUFBQSxZQUFBLFlBQUE7WUFDQSxVQUFBLFVBQUEsT0FBQSxPQUFBLGFBQUE7Ozs7UUFJQSxJQUFBLGVBQUEsWUFBQTtZQUNBLE9BQUEsZUFBQTs7OztRQUlBLElBQUEsWUFBQSxVQUFBLElBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQSxLQUFBLFNBQUE7MEJBQ0EsS0FBQTswQkFDQSxNQUFBLElBQUE7Ozs7UUFJQSxPQUFBLFlBQUEsWUFBQTtZQUNBO1lBQ0EsT0FBQSxPQUFBO21CQUNBLEtBQUE7bUJBQ0EsS0FBQTttQkFDQSxNQUFBLElBQUE7Ozs7UUFJQSxPQUFBLFlBQUEsWUFBQTtZQUNBO1lBQ0EsT0FBQSxPQUFBO21CQUNBLEtBQUE7bUJBQ0EsS0FBQTttQkFDQSxNQUFBLElBQUE7Ozs7UUFJQSxPQUFBLElBQUEsa0JBQUEsU0FBQSxHQUFBLFFBQUE7WUFDQSxPQUFBLFNBQUEsT0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQSxLQUFBLE1BQUEsT0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQSxLQUFBLE1BQUEsT0FBQSxPQUFBO1lBQ0EsVUFBQSxJQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBLE9BQUE7Z0JBQ0EsR0FBQSxPQUFBLFNBQUEsT0FBQTs7OztRQUlBLFNBQUEsR0FBQSxJQUFBLFlBQUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLElBQUEsWUFBQTtZQUNBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsSUFBQSxZQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUE7Ozs7UUFJQSxPQUFBLGFBQUEsU0FBQSxHQUFBO1lBQ0EsSUFBQSxRQUFBLEVBQUE7WUFDQSxJQUFBLFNBQUEsTUFBQSxTQUFBLFdBQUE7Z0JBQ0EsVUFBQSxNQUFBOzs7OztRQUtBLE9BQUE7O1FBRUEsVUFBQSxVQUFBLEtBQUE7Ozs7Ozs7Ozs7O0FDNUZBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLDRGQUFBLFVBQUEsUUFBQSxVQUFBLGdCQUFBLEtBQUEsVUFBQSxVQUFBO0VBQ0E7O1FBRUEsSUFBQSxVQUFBLElBQUE7OztFQUdBLElBQUEsR0FBQSxXQUFBLFNBQUEsR0FBQTtZQUNBLElBQUEsT0FBQSxZQUFBO2dCQUNBLE9BQUEsTUFBQSxrQkFBQTtvQkFDQSxRQUFBLFFBQUE7b0JBQ0EsTUFBQSxRQUFBOzs7OztZQUtBLFNBQUEsTUFBQSxLQUFBOzs7UUFHQSxJQUFBLEdBQUEsZUFBQSxZQUFBO1lBQ0EsVUFBQSxJQUFBOzs7RUFHQSxTQUFBLEtBQUE7RUFDQSxlQUFBLEtBQUE7O0VBRUEsSUFBQSxhQUFBLFlBQUE7OztHQUdBLFNBQUEsV0FBQTs7SUFFQSxJQUFBO01BQ0EsSUFBQTs7O0VBR0EsT0FBQSxJQUFBLHdCQUFBO0VBQ0EsT0FBQSxJQUFBLHlCQUFBOzs7Ozs7Ozs7OztBQ25DQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSx5REFBQSxVQUFBLFFBQUEsUUFBQSxVQUFBO1FBQ0E7OztRQUdBLElBQUEsZ0JBQUE7UUFDQSxJQUFBLHVCQUFBOzs7UUFHQSxJQUFBLGtCQUFBLFlBQUE7WUFDQSxJQUFBLE1BQUEsT0FBQSxXQUFBLElBQUEsVUFBQSxNQUFBO2dCQUNBLE9BQUEsS0FBQTs7WUFFQSxPQUFBLGFBQUEsd0JBQUEsS0FBQSxVQUFBOzs7O1FBSUEsSUFBQSxpQkFBQSxZQUFBO1lBQ0EsSUFBQSxPQUFBLGFBQUEsdUJBQUE7Z0JBQ0EsSUFBQSxNQUFBLEtBQUEsTUFBQSxPQUFBLGFBQUE7Z0JBQ0EsT0FBQSxhQUFBLE9BQUEsV0FBQSxPQUFBLFVBQUEsTUFBQTs7b0JBRUEsT0FBQSxJQUFBLFFBQUEsS0FBQSxRQUFBLENBQUE7Ozs7O1FBS0EsSUFBQSxrQkFBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFNBQUEsS0FBQSxRQUFBLE9BQUEsV0FBQSxRQUFBO2dCQUNBLE9BQUEsV0FBQSxPQUFBLFdBQUE7Ozs7UUFJQSxPQUFBLGFBQUEsQ0FBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUE7UUFDQSxPQUFBLGFBQUE7UUFDQSxPQUFBLGFBQUE7UUFDQSxPQUFBLFFBQUEsS0FBQSxVQUFBLEtBQUE7WUFDQSxLQUFBLElBQUEsT0FBQSxLQUFBO2dCQUNBLE9BQUEsYUFBQSxPQUFBLFdBQUEsT0FBQSxJQUFBOztZQUVBOzs7UUFHQSxPQUFBLGlCQUFBLE9BQUE7O1FBRUEsT0FBQSxhQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUEsaUJBQUE7WUFDQSxPQUFBLFdBQUEsdUJBQUE7OztRQUdBLE9BQUEsY0FBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLE9BQUEsV0FBQSxRQUFBLFVBQUEsQ0FBQTs7OztRQUlBLE9BQUEsa0JBQUEsVUFBQSxHQUFBLE1BQUE7WUFDQSxFQUFBO1lBQ0EsSUFBQSxRQUFBLE9BQUEsV0FBQSxRQUFBO1lBQ0EsSUFBQSxVQUFBLENBQUEsS0FBQSxPQUFBLFdBQUEsU0FBQSxlQUFBO2dCQUNBLE9BQUEsV0FBQSxLQUFBO21CQUNBO2dCQUNBLE9BQUEsV0FBQSxPQUFBLE9BQUE7O1lBRUE7Ozs7UUFJQSxPQUFBLGlCQUFBLFlBQUE7WUFDQSxPQUFBLE9BQUEsV0FBQSxTQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7Ozs7Ozs7Ozs7QUNqSEEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsNkNBQUEsVUFBQSxRQUFBLFFBQUE7RUFDQTs7RUFFQSxPQUFBLGFBQUE7O0VBRUEsT0FBQSxPQUFBLGNBQUEsVUFBQSxZQUFBO0dBQ0EsT0FBQSxxQkFBQSxXQUFBOztHQUVBLElBQUEsY0FBQSxNQUFBO0lBQ0EsT0FBQSxrQkFBQTtVQUNBLElBQUEsY0FBQSxNQUFBO0lBQ0EsT0FBQSxrQkFBQTtVQUNBLElBQUEsY0FBQSxPQUFBO0lBQ0EsT0FBQSxrQkFBQTtVQUNBO0lBQ0EsT0FBQSxrQkFBQTs7Ozs7Ozs7Ozs7OztBQ2ZBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLDBGQUFBLFVBQUEsUUFBQSxnQkFBQSxRQUFBLEtBQUEsUUFBQSxVQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBOztFQUVBLE9BQUEsY0FBQSxVQUFBLE1BQUE7R0FDQSxJQUFBLENBQUEsT0FBQSxlQUFBO2dCQUNBLE9BQUEsTUFBQSwyQkFBQTtJQUNBLElBQUEsS0FBQSxPQUFBO0lBQ0E7OztHQUdBLGVBQUE7O0dBRUEsSUFBQSxTQUFBLFNBQUEsV0FBQSxPQUFBLGtCQUFBLE9BQUE7SUFDQSxPQUFBLGdCQUFBO0lBQ0EsVUFBQTtVQUNBO0lBQ0EsT0FBQSxnQkFBQTtJQUNBLGVBQUEsYUFBQTtJQUNBLFVBQUE7Ozs7O1FBS0EsU0FBQSxHQUFBLElBQUEsWUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxLQUFBLFlBQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsT0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxLQUFBLFlBQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsT0FBQSxZQUFBO1lBQ0EsT0FBQTs7Ozs7Ozs7Ozs7O0FDcERBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLHlFQUFBLFVBQUEsUUFBQSxLQUFBLFVBQUEsVUFBQSxRQUFBO0VBQ0E7O1FBRUEsSUFBQSxpQkFBQSxJQUFBLEdBQUEsT0FBQTs7RUFFQSxJQUFBLFVBQUEsSUFBQSxHQUFBLElBQUE7R0FDQSxRQUFBOztHQUVBLFVBQUE7O0dBRUEsY0FBQTs7O1FBR0EsSUFBQSxVQUFBLElBQUE7UUFDQSxJQUFBLFVBQUEsSUFBQTs7O0VBR0EsUUFBQSxTQUFBLFNBQUE7UUFDQSxRQUFBLFNBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLFFBQUE7WUFDQSxPQUFBLE9BQUE7OztFQUdBLElBQUEsV0FBQSxJQUFBLEdBQUE7RUFDQSxlQUFBLFdBQUE7OztFQUdBLE9BQUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxRQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7SUFDQSxZQUFBLFNBQUE7SUFDQSxRQUFBLEdBQUEsT0FBQSxVQUFBLFNBQUE7SUFDQSxNQUFBOzs7OztFQUtBLElBQUEsa0JBQUEsWUFBQTtHQUNBLFNBQUEsWUFBQSxHQUFBLEtBQUEsUUFBQSxXQUFBLFFBQUEsZ0JBQUE7OztRQUdBLElBQUEsR0FBQSxlQUFBLFlBQUE7WUFDQSxVQUFBLElBQUE7OztRQUdBLElBQUEsR0FBQSxlQUFBLFlBQUE7WUFDQSxVQUFBLElBQUE7OztFQUdBLElBQUEsR0FBQSxlQUFBOztFQUVBLElBQUEsZUFBQSxVQUFBLEdBQUE7R0FDQSxRQUFBLFVB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LFNBQUE7OztFQUdBLEtBQUEsZUFBQTs7Ozs7O0VBTUEsSUFBQSxTQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsTUFBQSxNQUFBLGFBQUE7R0FDQSxJQUFBLFFBQUEsU0FBQSxRQUFBO0dBQ0EsT0FBQSxTQUFBLENBQUEsUUFBQSxLQUFBLFNBQUE7Ozs7Ozs7RUFPQSxJQUFBLFNBQUEsVUFBQSxJQUFBO0dBQ0EsS0FBQSxNQUFBLE1BQUEsYUFBQTtHQUNBLElBQUEsUUFBQSxTQUFBLFFBQUE7R0FDQSxJQUFBLFNBQUEsU0FBQTtHQUNBLE9BQUEsU0FBQSxDQUFBLFFBQUEsSUFBQSxVQUFBOzs7Ozs7O0VBT0EsSUFBQSxXQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsTUFBQSxNQUFBLGFBQUE7R0FDQSxLQUFBLElBQUEsSUFBQSxPQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtJQUNBLElBQUEsT0FBQSxHQUFBLE9BQUEsSUFBQSxPQUFBLE9BQUE7OztHQUdBLE9BQUE7Ozs7OztFQU1BLElBQUEsT0FBQSxVQUFBLElBQUE7R0FDQSxNQUFBLGVBQUEsU0FBQTs7Ozs7Ozs7RUFRQSxJQUFBLGFBQUEsVUFBQSxJQUFBO0dBQ0EsSUFBQSxXQUFBLEdBQUE7R0FDQSxJQUFBLE1BQUEsU0FBQTs7R0FFQSxJQUFBLEtBQUE7SUFDQSxTQUFBLFFBQUE7VUFDQTtJQUNBLE1BQUEsU0FBQSxjQUFBO0lBQ0EsSUFBQSxNQUFBO0lBQ0EsSUFBQSxTQUFBLFlBQUE7S0FDQSxPQUFBLEtBQUE7O0tBRUEsSUFBQSxPQUFBLFNBQUEsaUJBQUE7TUFDQSxPQUFBOztLQUVBLFNBQUEsUUFBQTs7SUFFQSxJQUFBLFVBQUEsVUFBQSxLQUFBO0tBQ0EsU0FBQSxPQUFBOztJQUVBLElBQUEsTUFBQSxNQUFBLG9CQUFBLEtBQUE7OztZQUdBLFdBQUEsV0FBQSxrQkFBQTs7R0FFQSxPQUFBLFNBQUE7Ozs7Ozs7RUFPQSxLQUFBLE9BQUEsWUFBQTtHQUNBLFdBQUEsY0FBQSxNQUFBLENBQUEsYUFBQSxjQUFBLFlBQUE7Ozs7O2dCQUtB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LGVBQUEsV0FBQTtnQkFDQSxVQUFBLGNBQUE7Z0JBQ0EsWUFBQTs7O1lBR0EsTUFBQSxTQUFBLEtBQUEsWUFBQTtnQkFDQSxXQUFBLE9BQUEsS0FBQTs7O1lBR0EsTUFBQSxTQUFBLE1BQUEsSUFBQTs7WUFFQSxPQUFBOzs7UUFHQSxLQUFBLHVCQUFBLFVBQUEsWUFBQSxPQUFBOztZQUVBLElBQUEsUUFBQSxXQUFBLE9BQUEsUUFBQTtZQUNBLElBQUEsUUFBQSxDQUFBLEdBQUE7Z0JBQ0EsT0FBQSxNQUFBLFFBQUEsWUFBQTs7O29CQUdBLFFBQUEsV0FBQSxPQUFBLFFBQUE7b0JBQ0EsV0FBQSxPQUFBLE9BQUEsT0FBQTttQkFDQSxJQUFBOzs7O1FBSUEsS0FBQSxVQUFBLFlBQUE7WUFDQSxJQUFBLE9BQUE7WUFDQSxJQUFBLE1BQUE7WUFDQSxJQUFBLFFBQUEsVUFBQSxPQUFBO2dCQUNBLElBQUEsU0FBQSxNQUFBO2dCQUNBLElBQUEsS0FBQSxLQUFBLFNBQUE7b0JBQ0EsS0FBQSxLQUFBLFFBQUEsS0FBQTt1QkFDQTtvQkFDQSxLQUFBLEtBQUEsVUFBQSxDQUFBOzs7O1lBSUEsS0FBQSxRQUFBLEtBQUEsVUFBQSxRQUFBO2dCQUNBLEtBQUEsT0FBQSxRQUFBO29CQUNBLEtBQUEsT0FBQTtvQkFDQSxPQUFBLEtBQUEsUUFBQTs7OztZQUlBLE9BQUE7OztRQUdBLEtBQUEsU0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsS0FBQSxjQUFBLFVBQUEsT0FBQTtZQUNBLGdCQUFBOzs7UUFHQSxLQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLEtBQUEsY0FBQSxZQUFBO1lBQ0EsT0FBQSxDQUFBLENBQUE7OztRQUdBLEtBQUEsdUJBQUEsVUFBQSxZQUFBO1lBQ0Esb0JBQUE7OztRQUdBLEtBQUEsdUJBQUEsWUFBQTtZQUNBLE9BQUE7Ozs7UUFJQSxDQUFBLFVBQUEsT0FBQTtZQUNBLElBQUEsV0FBQSxHQUFBO1lBQ0EsTUFBQSxVQUFBLFNBQUE7O1lBRUEsSUFBQSxXQUFBLENBQUE7OztZQUdBLElBQUEsZUFBQSxZQUFBO2dCQUNBLElBQUEsRUFBQSxhQUFBLFlBQUEsUUFBQTtvQkFDQSxTQUFBLFFBQUE7Ozs7WUFJQSxPQUFBLFFBQUEsTUFBQSxNQUFBOztZQUVBLFlBQUEsUUFBQSxVQUFBLElBQUE7Z0JBQ0EsUUFBQSxJQUFBLENBQUEsSUFBQSxLQUFBLFVBQUEsU0FBQTtvQkFDQSxPQUFBLFFBQUEsUUFBQSxhQUFBLE1BQUEsQ0FBQSxZQUFBLEtBQUE7OztXQUdBOzs7Ozs7Ozs7OztBQ3hIQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxnR0FBQSxVQUFBLEtBQUEsUUFBQSxhQUFBLFVBQUEsUUFBQSxXQUFBLFFBQUE7RUFDQTs7UUFFQSxJQUFBLHFCQUFBLElBQUEsR0FBQTtRQUNBLElBQUEsbUJBQUEsSUFBQSxHQUFBLE9BQUEsT0FBQTtZQUNBLFVBQUE7O1FBRUEsSUFBQSxrQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsUUFBQTtZQUNBLE9BQUEsT0FBQTtZQUNBLFFBQUE7Ozs7RUFJQSxJQUFBLFNBQUEsSUFBQSxHQUFBLFlBQUEsT0FBQTtHQUNBLE9BQUEsT0FBQTtZQUNBLFFBQUEsQ0FBQTs7WUFFQSxPQUFBOzs7RUFHQSxJQUFBLG1CQUFBLE9BQUE7O0VBRUEsSUFBQSxTQUFBLElBQUEsR0FBQSxZQUFBLE9BQUE7R0FDQSxVQUFBOzs7O0dBSUEsaUJBQUEsU0FBQSxPQUFBO0lBQ0EsT0FBQSxHQUFBLE9BQUEsVUFBQSxhQUFBLFVBQUEsR0FBQSxPQUFBLFVBQUEsWUFBQTs7Ozs7RUFLQSxJQUFBOzs7O1FBSUEsSUFBQSxvQkFBQTs7UUFFQSxJQUFBLFFBQUE7O1FBRUEsSUFBQSwwQkFBQSxVQUFBLFlBQUE7WUFDQSxNQUFBO1lBQ0EsSUFBQSxZQUFBO2dCQUNBLGlCQUFBLEtBQUE7Z0JBQ0EsSUFBQSxVQUFBLElBQUEsV0FBQSxlQUFBLElBQUEsV0FBQTtvQkFDQSxTQUFBLENBQUEsSUFBQSxJQUFBLElBQUE7Ozs7Ozs7RUFPQSxJQUFBLHFCQUFBLFVBQUEsT0FBQTtHQUNBLE9BQUEsQ0FBQSxHQUFBLE1BQUEsSUFBQSxHQUFBLE9BQUEsYUFBQSxTQUFBLE1BQUE7Ozs7O0VBS0EsSUFBQSxtQkFBQSxVQUFBLE9BQUE7R0FDQSxPQUFBLENBQUEsTUFBQSxHQUFBLE9BQUEsYUFBQSxTQUFBLE1BQUE7Ozs7O0VBS0EsSUFBQSxpQkFBQSxVQUFBLFVBQUE7R0FDQSxRQUFBLFNBQUE7SUFDQSxLQUFBOztLQUVBLE9BQUEsQ0FBQSxTQUFBLGFBQUEsQ0FBQSxTQUFBLGFBQUE7SUFDQSxLQUFBO0lBQ0EsS0FBQTtLQUNBLE9BQUEsU0FBQSxpQkFBQTtJQUNBLEtBQUE7S0FDQSxPQUFBLENBQUEsU0FBQTtJQUNBO0tBQ0EsT0FBQSxTQUFBOzs7OztFQUtBLElBQUEsdUJBQUEsVUFBQSxHQUFBO0dBQ0EsSUFBQSxVQUFBLEVBQUE7R0FDQSxJQUFBLE9BQUEsWUFBQTtJQUNBLElBQUEsY0FBQSxlQUFBLFFBQUE7SUFDQSxRQUFBLFdBQUEsU0FBQSxZQUFBLElBQUE7SUFDQSxRQUFBLFdBQUE7Ozs7R0FJQSxTQUFBLE1BQUEsS0FBQSxRQUFBLFdBQUE7OztFQUdBLElBQUEsZ0JBQUEsVUFBQSxZQUFBO0dBQ0EsSUFBQTtHQUNBLElBQUEsU0FBQSxXQUFBLE9BQUEsSUFBQTs7R0FFQSxRQUFBLFdBQUE7SUFDQSxLQUFBO0tBQ0EsV0FBQSxJQUFBLEdBQUEsS0FBQSxNQUFBLE9BQUE7S0FDQTtJQUNBLEtBQUE7S0FDQSxXQUFBLElBQUEsR0FBQSxLQUFBLFVBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTs7S0FFQSxXQUFBLElBQUEsR0FBQSxLQUFBLFFBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTtLQUNBLFdBQUEsSUFBQSxHQUFBLEtBQUEsV0FBQTtLQUNBO0lBQ0EsS0FBQTs7S0FFQSxXQUFBLElBQUEsR0FBQSxLQUFBLE9BQUEsT0FBQSxJQUFBLE9BQUEsR0FBQTtLQUNBOztnQkFFQTtvQkFDQSxRQUFBLE1BQUEsK0JBQUEsV0FBQTtvQkFDQTs7O0dBR0EsSUFBQSxVQUFBLElBQUEsR0FBQSxRQUFBLEVBQUEsVUFBQTtZQUNBLFFBQUEsYUFBQTtZQUNBLElBQUEsV0FBQSxVQUFBLFdBQUEsT0FBQSxTQUFBLEdBQUE7Z0JBQ0EsUUFBQSxRQUFBLFdBQUEsT0FBQSxHQUFBLE1BQUE7O0dBRUEsUUFBQSxHQUFBLFVBQUE7WUFDQSxpQkFBQSxXQUFBOzs7RUFHQSxJQUFBLHFCQUFBLFVBQUEsR0FBQSxPQUFBOztZQUVBLGlCQUFBO0dBQ0EsTUFBQTs7R0FFQSxZQUFBLE1BQUEsQ0FBQSxJQUFBLE1BQUEsTUFBQSxTQUFBLEtBQUEsWUFBQTtJQUNBLFlBQUEsUUFBQTs7OztFQUlBLElBQUEsbUJBQUEsVUFBQSxHQUFBO0dBQ0EsSUFBQSxXQUFBLEVBQUEsUUFBQTtHQUNBLElBQUEsY0FBQSxlQUFBO1lBQ0EsSUFBQSxRQUFBLE9BQUE7O1lBRUEsRUFBQSxRQUFBLFFBQUEsTUFBQTs7R0FFQSxFQUFBLFFBQUEsYUFBQSxZQUFBLElBQUE7SUFDQSxJQUFBLE9BQUE7SUFDQSxPQUFBLFNBQUE7SUFDQSxRQUFBLFlBQUEsSUFBQTtnQkFDQSxVQUFBLE1BQUE7Z0JBQ0EsWUFBQSxPQUFBOzs7O0dBSUEsRUFBQSxRQUFBLFdBQUEsU0FBQSxNQUFBLFlBQUE7Z0JBQ0EsaUJBQUEsY0FBQSxFQUFBOzs7R0FHQSxFQUFBLFFBQUEsR0FBQSxVQUFBOztZQUVBLE9BQUEsRUFBQSxRQUFBLFdBQUE7OztFQUdBLEtBQUEsT0FBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFNBQUE7R0FDQSxJQUFBLGVBQUE7R0FDQSxNQUFBLElBQUEsZUFBQTs7R0FFQSxpQkFBQSxHQUFBLGlCQUFBLFlBQUE7O0lBRUEsSUFBQSxDQUFBLE1BQUEsU0FBQTs7S0FFQSxNQUFBOzs7OztFQUtBLEtBQUEsZUFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLFVBQUE7O0dBRUEsT0FBQSxRQUFBO0dBQ0EsT0FBQSxJQUFBLEdBQUEsWUFBQSxLQUFBO2dCQUNBLFFBQUE7SUFDQSxNQUFBO0lBQ0EsT0FBQSxPQUFBOzs7R0FHQSxJQUFBLGVBQUE7R0FDQSxJQUFBLGVB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T0FBQSxLQUFBLE1BQUE7SUFDQSxPQUFBLEtBQUEsTUFBQTs7SUFFQSxJQUFBLE9BQUEsTUFBQSxTQUFBOztJQUVBLElBQUEsU0FBQSxNQUFBLFNBQUE7O0lBRUEsSUFBQSxPQUFBLE9BQUEsYUFBQSxPQUFBLE9BQUEsV0FBQTtLQUNBLFNBQUEsR0FBQSxPQUFBLFVBQUE7OztJQUdBLElBQUEsY0FBQSxJQUFBLEdBQUEsT0FBQSxZQUFBO0tBQ0EsS0FBQSxNQUFBO0tBQ0EsWUFBQTtLQUNBLGFBQUE7OztJQUdBLFdBQUEsVUFBQTs7SUFFQSxJQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7S0FDQSxZQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUE7S0FDQSxZQUFBOztLQUVBLGVBQUE7O0tBRUEsUUFBQTs7OztJQUlBLElBQUEsU0FBQSxXQUFBO0tBQ0EsSUFBQSxVQUFBLElBQUEsUUFBQSxJQUFBOzs7OztFQUtBLEtBQUEsWUFBQSxZQUFBO0dBQ0EsT0FBQTs7O0VBR0EsS0FBQSxnQkFBQSxZQUFBO0dBQ0EsT0FBQTs7O1FBR0EsS0FBQSxXQUFBLFlBQUE7WUFDQSxPQUFBOzs7Ozs7Ozs7Ozs7QUMvREEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsVUFBQSxZQUFBO0VBQ0E7O1FBRUEsS0FBQSxTQUFBO1lBQ0EsT0FBQSxDQUFBLEtBQUEsS0FBQSxLQUFBO1lBQ0EsTUFBQSxDQUFBLEdBQUEsS0FBQSxLQUFBO1lBQ0EsUUFBQTs7O1FBR0EsSUFBQSxzQkFBQTtRQUNBLElBQUEscUJBQUE7O1FBRUEsSUFBQSx1QkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLHdCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsZ0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsSUFBQSxpQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLG9CQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O1FBR0EsSUFBQSxxQkFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7OztRQUdBLElBQUEsc0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsSUFBQSx1QkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLHNCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7WUFDQSxVQUFBLENBQUE7OztRQUdBLElBQUEsZ0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTtZQUNBLFVBQUEsQ0FBQTs7O1FBR0EsSUFBQSxjQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O1FBR0EsSUFBQSxlQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O0VBR0EsS0FBQSxXQUFBLFVBQUEsU0FBQTtZQUNBLElBQUEsUUFBQSxRQUFBLFNBQUEsTUFBQSxRQUFBLFNBQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTtnQkFDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO29CQUNBLFFBQUE7b0JBQ0EsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO3dCQUNBLFFBQUE7d0JBQ0EsTUFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBOzRCQUNBLE9BQUE7O3dCQUVBLFFBQUE7OztnQkFHQSxJQUFBLEdBQUEsTUFBQSxNQUFBO29CQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTt3QkFDQSxPQUFBO3dCQUNBLE9BQUE7Ozs7OztFQU1BLEtBQUEsWUFBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUE7S0FDQSxRQUFBOztnQkFFQSxRQUFBOztHQUVBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBO2dCQUNBLFFBQUE7Ozs7RUFJQSxLQUFBLFVBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLE9BQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLFFBQUE7S0FDQSxNQUFBO0tBQ0EsUUFBQTs7O0dBR0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUE7Ozs7RUFJQSxLQUFBLFdBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQTs7R0FFQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO29CQUNBLE9BQUEsS0FBQSxPQUFBO29CQUNBLE9BQUE7Ozs7Ozs7Ozs7Ozs7O0FDaklBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLGFBQUEsWUFBQTtFQUNBOztFQUVBLElBQUEsUUFBQTs7O0VBR0EsSUFBQSxjQUFBLFlBQUE7R0FDQSxJQUFBLFNBQUEsU0FBQSxLQUFBLFFBQUEsS0FBQTs4QkFDQSxNQUFBOztHQUVBLElBQUEsUUFBQTs7R0FFQSxPQUFBLFFBQUEsVUFBQSxPQUFBOztJQUVBLElBQUEsVUFBQSxNQUFBLE1BQUE7SUFDQSxJQUFBLFdBQUEsUUFBQSxXQUFBLEdBQUE7S0FDQSxNQUFBLFFBQUEsTUFBQSxtQkFBQSxRQUFBOzs7O0dBSUEsT0FBQTs7OztFQUlBLElBQUEsY0FBQSxVQUFBLE9BQUE7R0FDQSxJQUFBLFNBQUE7R0FDQSxLQUFBLElBQUEsT0FBQSxPQUFBO0lBQ0EsVUFBQSxNQUFBLE1BQUEsbUJBQUEsTUFBQSxRQUFBOztHQUVBLE9BQUEsT0FBQSxVQUFBLEdBQUEsT0FBQSxTQUFBOzs7RUFHQSxLQUFBLFlBQUEsVUFBQSxHQUFBO0dBQ0EsTUFBQSxPQUFBO0dBQ0EsUUFBQSxVQUFBLE9BQUEsSUFBQSxNQUFBLE9BQUEsTUFBQSxZQUFBOzs7O0VBSUEsS0FBQSxNQUFBLFVBQUEsUUFBQTtHQUNBLEtBQUEsSUFBQSxPQUFBLFFBQUE7SUFDQSxNQUFBLE9BQUEsT0FBQTs7R0FFQSxRQUFBLGFBQUEsT0FBQSxJQUFBLE1BQUEsT0FBQSxNQUFBLFlBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsVUFBQSxLQUFBO0dBQ0EsT0FBQSxNQUFBOzs7RUFHQSxRQUFBLFFBQUE7O0VBRUEsSUFBQSxDQUFBLE9BQUE7R0FDQSxRQUFBOzs7RUFHQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBhbm5vdGF0aW9ucyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJywgWydkaWFzLmFwaScsICdkaWFzLnVpJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0aW9uc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGFubm90YXRpb25zIGxpc3QgaW4gdGhlIHNpZGViYXJcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdBbm5vdGF0aW9uc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywgbGFiZWxzLCBhbm5vdGF0aW9ucywgc2hhcGVzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuc2VsZWN0ZWRGZWF0dXJlcyA9IG1hcEFubm90YXRpb25zLmdldFNlbGVjdGVkRmVhdHVyZXMoKS5nZXRBcnJheSgpO1xuXG5cdFx0dmFyIHJlZnJlc2hBbm5vdGF0aW9ucyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5hbm5vdGF0aW9ucyA9IGFubm90YXRpb25zLmN1cnJlbnQoKTtcblx0XHR9O1xuXG5cdFx0dmFyIHNlbGVjdGVkRmVhdHVyZXMgPSBtYXBBbm5vdGF0aW9ucy5nZXRTZWxlY3RlZEZlYXR1cmVzKCk7XG5cblx0XHQkc2NvcGUuYW5ub3RhdGlvbnMgPSBbXTtcblxuXHRcdCRzY29wZS5jbGVhclNlbGVjdGlvbiA9IG1hcEFubm90YXRpb25zLmNsZWFyU2VsZWN0aW9uO1xuXG5cdFx0JHNjb3BlLnNlbGVjdEFubm90YXRpb24gPSBmdW5jdGlvbiAoZSwgaWQpIHtcblx0XHRcdC8vIGFsbG93IG11bHRpcGxlIHNlbGVjdGlvbnNcblx0XHRcdGlmICghZS5zaGlmdEtleSkge1xuXHRcdFx0XHQkc2NvcGUuY2xlYXJTZWxlY3Rpb24oKTtcblx0XHRcdH1cblx0XHRcdG1hcEFubm90YXRpb25zLnNlbGVjdChpZCk7XG5cdFx0fTtcblxuICAgICAgICAkc2NvcGUuZml0QW5ub3RhdGlvbiA9IG1hcEFubm90YXRpb25zLmZpdDtcblxuXHRcdCRzY29wZS5pc1NlbGVjdGVkID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgc2VsZWN0ZWQgPSBmYWxzZTtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoZmVhdHVyZSkge1xuXHRcdFx0XHRpZiAoZmVhdHVyZS5hbm5vdGF0aW9uICYmIGZlYXR1cmUuYW5ub3RhdGlvbi5pZCA9PSBpZCkge1xuXHRcdFx0XHRcdHNlbGVjdGVkID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gc2VsZWN0ZWQ7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgcmVmcmVzaEFubm90YXRpb25zKTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQW5ub3RhdGlvbnNDeWNsaW5nQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgYmFja2dyb3VuZCBzZWdtZW50YXRpb24gUk9JIG9wYWNpdHkgc2V0dGluZ3NcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdBbm5vdGF0aW9uc0N5Y2xpbmdDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMsIGxhYmVscywga2V5Ym9hcmQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gZmxhZyB0byBwcmV2ZW50IGN5Y2xpbmcgd2hpbGUgYSBuZXcgaW1hZ2UgaXMgbG9hZGluZ1xuICAgICAgICB2YXIgbG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBjeWNsaW5nS2V5ID0gJ2Fubm90YXRpb25zJztcblxuICAgICAgICB2YXIgbmV4dEFubm90YXRpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcgfHwgISRzY29wZS5jeWNsaW5nKCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKG1hcEFubm90YXRpb25zLmhhc05leHQoKSkge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmN5Y2xlTmV4dCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBtZXRob2QgZnJvbSBBbm5vdGF0b3JDb250cm9sbGVyOyBtYXBBbm5vdGF0aW9ucyB3aWxsIHJlZnJlc2ggYXV0b21hdGljYWxseVxuICAgICAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKS50aGVuKG1hcEFubm90YXRpb25zLmp1bXBUb0ZpcnN0KTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGFwcGx5IGlmIHRoaXMgd2FzIGNhbGxlZCBieSB0aGUga2V5Ym9hcmQgZXZlbnRcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNhbmNlbCBhbGwga2V5Ym9hcmQgZXZlbnRzIHdpdGggbG93ZXIgcHJpb3JpdHlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcHJldkFubm90YXRpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcgfHwgISRzY29wZS5jeWNsaW5nKCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKG1hcEFubm90YXRpb25zLmhhc1ByZXZpb3VzKCkpIHtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5jeWNsZVByZXZpb3VzKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG1ldGhvZCBmcm9tIEFubm90YXRvckNvbnRyb2xsZXI7IG1hcEFubm90YXRpb25zIHdpbGwgcmVmcmVzaCBhdXRvbWF0aWNhbGx5XG4gICAgICAgICAgICAgICAgJHNjb3BlLnByZXZJbWFnZSgpLnRoZW4obWFwQW5ub3RhdGlvbnMuanVtcFRvTGFzdCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gb25seSBhcHBseSBpZiB0aGlzIHdhcyBjYWxsZWQgYnkgdGhlIGtleWJvYXJkIGV2ZW50XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjYW5jZWwgYWxsIGtleWJvYXJkIGV2ZW50cyB3aXRoIGxvd2VyIHByaW9yaXR5XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGF0dGFjaExhYmVsID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmIChsb2FkaW5nKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCRzY29wZS5jeWNsaW5nKCkgJiYgbGFiZWxzLmhhc1NlbGVjdGVkKCkpIHtcbiAgICAgICAgICAgICAgICBsYWJlbHMuYXR0YWNoVG9Bbm5vdGF0aW9uKG1hcEFubm90YXRpb25zLmdldEN1cnJlbnQoKSkuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmZsaWNrZXIoMSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmZsaWNrZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzdG9wIGN5Y2xpbmcgdXNpbmcgYSBrZXlib2FyZCBldmVudFxuICAgICAgICB2YXIgc3RvcEN5Y2xpbmcgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgJHNjb3BlLnN0b3BDeWNsaW5nKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmN5Y2xpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmdldFZvbGF0aWxlU2V0dGluZ3MoJ2N5Y2xlJykgPT09IGN5Y2xpbmdLZXk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnN0YXJ0Q3ljbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScsIGN5Y2xpbmdLZXkpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zdG9wQ3ljbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScsICcnKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyB0aGUgY3ljbGUgc2V0dGluZ3MgbXkgYmUgc2V0IGJ5IG90aGVyIGNvbnRyb2xsZXJzLCB0b28sIHNvIHdhdGNoIGl0XG4gICAgICAgIC8vIGluc3RlYWQgb2YgdXNpbmcgdGhlIHN0YXJ0L3N0b3AgZnVuY3Rpb25zIHRvIGFkZC9yZW1vdmUgZXZlbnRzIGV0Yy5cbiAgICAgICAgJHNjb3BlLiR3YXRjaCgndm9sYXRpbGVTZXR0aW5ncy5jeWNsZScsIGZ1bmN0aW9uIChjeWNsZSwgb2xkQ3ljbGUpIHtcbiAgICAgICAgICAgIGlmIChjeWNsZSA9PT0gY3ljbGluZ0tleSkge1xuICAgICAgICAgICAgICAgIC8vIG92ZXJyaWRlIHByZXZpb3VzIGltYWdlIG9uIGFycm93IGxlZnRcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzNywgcHJldkFubm90YXRpb24sIDEwKTtcbiAgICAgICAgICAgICAgICAvLyBvdmVycmlkZSBuZXh0IGltYWdlIG9uIGFycm93IHJpZ2h0IGFuZCBzcGFjZVxuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDM5LCBuZXh0QW5ub3RhdGlvbiwgMTApO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDMyLCBuZXh0QW5ub3RhdGlvbiwgMTApO1xuXG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMTMsIGF0dGFjaExhYmVsLCAxMCk7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMjcsIHN0b3BDeWNsaW5nLCAxMCk7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvbGRDeWNsZSA9PT0gY3ljbGluZ0tleSkge1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzNywgcHJldkFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzOSwgbmV4dEFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzMiwgbmV4dEFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigxMywgYXR0YWNoTGFiZWwpO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigyNywgc3RvcEN5Y2xpbmcpO1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmNsZWFyU2VsZWN0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS5wcmV2QW5ub3RhdGlvbiA9IHByZXZBbm5vdGF0aW9uO1xuICAgICAgICAkc2NvcGUubmV4dEFubm90YXRpb24gPSBuZXh0QW5ub3RhdGlvbjtcbiAgICAgICAgJHNjb3BlLmF0dGFjaExhYmVsID0gYXR0YWNoTGFiZWw7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQW5ub3RhdG9yQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBNYWluIGNvbnRyb2xsZXIgb2YgdGhlIEFubm90YXRvciBhcHBsaWNhdGlvbi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdBbm5vdGF0b3JDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgaW1hZ2VzLCB1cmxQYXJhbXMsIG1zZywgSU1BR0VfSUQsIGtleWJvYXJkKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5pbWFnZXMgPSBpbWFnZXM7XG4gICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgIC8vIHRoZSBjdXJyZW50IGNhbnZhcyB2aWV3cG9ydCwgc3luY2VkIHdpdGggdGhlIFVSTCBwYXJhbWV0ZXJzXG4gICAgICAgICRzY29wZS52aWV3cG9ydCA9IHtcbiAgICAgICAgICAgIHpvb206IHVybFBhcmFtcy5nZXQoJ3onKSxcbiAgICAgICAgICAgIGNlbnRlcjogW3VybFBhcmFtcy5nZXQoJ3gnKSwgdXJsUGFyYW1zLmdldCgneScpXVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGZpbmlzaCBpbWFnZSBsb2FkaW5nIHByb2Nlc3NcbiAgICAgICAgdmFyIGZpbmlzaExvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnaW1hZ2Uuc2hvd24nLCAkc2NvcGUuaW1hZ2VzLmN1cnJlbnRJbWFnZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgdmFyIHB1c2hTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHVybFBhcmFtcy5wdXNoU3RhdGUoJHNjb3BlLmltYWdlcy5jdXJyZW50SW1hZ2UuX2lkKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzdGFydCBpbWFnZSBsb2FkaW5nIHByb2Nlc3NcbiAgICAgICAgdmFyIHN0YXJ0TG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGxvYWQgdGhlIGltYWdlIGJ5IGlkLiBkb2Vzbid0IGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5IGJ5IGl0c2VsZlxuICAgICAgICB2YXIgbG9hZEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBzdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZXMuc2hvdyhwYXJzZUludChpZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHNob3cgdGhlIG5leHQgaW1hZ2UgYW5kIGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5XG4gICAgICAgICRzY29wZS5uZXh0SW1hZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZXMubmV4dCgpXG4gICAgICAgICAgICAgICAgICAudGhlbihmaW5pc2hMb2FkaW5nKVxuICAgICAgICAgICAgICAgICAgLnRoZW4ocHVzaFN0YXRlKVxuICAgICAgICAgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzaG93IHRoZSBwcmV2aW91cyBpbWFnZSBhbmQgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgJHNjb3BlLnByZXZJbWFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlcy5wcmV2KClcbiAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAudGhlbihwdXNoU3RhdGUpXG4gICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgVVJMIHBhcmFtZXRlcnMgb2YgdGhlIHZpZXdwb3J0XG4gICAgICAgICRzY29wZS4kb24oJ2NhbnZhcy5tb3ZlZW5kJywgZnVuY3Rpb24oZSwgcGFyYW1zKSB7XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuem9vbSA9IHBhcmFtcy56b29tO1xuICAgICAgICAgICAgJHNjb3BlLnZpZXdwb3J0LmNlbnRlclswXSA9IE1hdGgucm91bmQocGFyYW1zLmNlbnRlclswXSk7XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuY2VudGVyWzFdID0gTWF0aC5yb3VuZChwYXJhbXMuY2VudGVyWzFdKTtcbiAgICAgICAgICAgIHVybFBhcmFtcy5zZXQoe1xuICAgICAgICAgICAgICAgIHo6ICRzY29wZS52aWV3cG9ydC56b29tLFxuICAgICAgICAgICAgICAgIHg6ICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMF0sXG4gICAgICAgICAgICAgICAgeTogJHNjb3BlLnZpZXdwb3J0LmNlbnRlclsxXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDM3LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUucHJldkltYWdlKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDM5LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUubmV4dEltYWdlKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDMyLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUubmV4dEltYWdlKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGxpc3RlbiB0byB0aGUgYnJvd3NlciBcImJhY2tcIiBidXR0b25cbiAgICAgICAgd2luZG93Lm9ucG9wc3RhdGUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSBlLnN0YXRlO1xuICAgICAgICAgICAgaWYgKHN0YXRlICYmIHN0YXRlLnNsdWcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGxvYWRJbWFnZShzdGF0ZS5zbHVnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpbml0aWFsaXplIHRoZSBpbWFnZXMgc2VydmljZVxuICAgICAgICBpbWFnZXMuaW5pdCgpO1xuICAgICAgICAvLyBkaXNwbGF5IHRoZSBmaXJzdCBpbWFnZVxuICAgICAgICBsb2FkSW1hZ2UoSU1BR0VfSUQpLnRoZW4ocHVzaFN0YXRlKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDYW52YXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1haW4gY29udHJvbGxlciBmb3IgdGhlIGFubm90YXRpb24gY2FudmFzIGVsZW1lbnRcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDYW52YXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwSW1hZ2UsIG1hcEFubm90YXRpb25zLCBtYXAsICR0aW1lb3V0LCBkZWJvdW5jZSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBtYXBWaWV3ID0gbWFwLmdldFZpZXcoKTtcblxuXHRcdC8vIHVwZGF0ZSB0aGUgVVJMIHBhcmFtZXRlcnNcblx0XHRtYXAub24oJ21vdmVlbmQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgZW1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhbnZhcy5tb3ZlZW5kJywge1xuICAgICAgICAgICAgICAgICAgICBjZW50ZXI6IG1hcFZpZXcuZ2V0Q2VudGVyKCksXG4gICAgICAgICAgICAgICAgICAgIHpvb206IG1hcFZpZXcuZ2V0Wm9vbSgpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBkb250IHVwZGF0ZSBpbW1lZGlhdGVseSBidXQgd2FpdCBmb3IgcG9zc2libGUgbmV3IGNoYW5nZXNcbiAgICAgICAgICAgIGRlYm91bmNlKGVtaXQsIDEwMCwgJ2Fubm90YXRvci5jYW52YXMubW92ZWVuZCcpO1xuXHRcdH0pO1xuXG4gICAgICAgIG1hcC5vbignY2hhbmdlOnZpZXcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBWaWV3ID0gbWFwLmdldFZpZXcoKTtcbiAgICAgICAgfSk7XG5cblx0XHRtYXBJbWFnZS5pbml0KCRzY29wZSk7XG5cdFx0bWFwQW5ub3RhdGlvbnMuaW5pdCgkc2NvcGUpO1xuXG5cdFx0dmFyIHVwZGF0ZVNpemUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQvLyB3b3JrYXJvdW5kLCBzbyB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkICphZnRlciogdGhlIGFuZ3VsYXIgZGlnZXN0XG5cdFx0XHQvLyBhbmQgKmFmdGVyKiB0aGUgZm9sZG91dCB3YXMgcmVuZGVyZWRcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgbmVlZHMgdG8gYmUgd3JhcHBlZCBpbiBhbiBleHRyYSBmdW5jdGlvbiBzaW5jZSB1cGRhdGVTaXplIGFjY2VwdHMgYXJndW1lbnRzXG5cdFx0XHRcdG1hcC51cGRhdGVTaXplKCk7XG5cdFx0XHR9LCA1MCwgZmFsc2UpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJG9uKCdzaWRlYmFyLmZvbGRvdXQub3BlbicsIHVwZGF0ZVNpemUpO1xuXHRcdCRzY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5jbG9zZScsIHVwZGF0ZVNpemUpO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDYXRlZ29yaWVzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBsYWJlbCBjYXRlZ29yaWVzIGZvbGRvdXRcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDYXRlZ29yaWVzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGxhYmVscywga2V5Ym9hcmQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gbWF4aW11bSBudW1iZXIgb2YgYWxsb3dlZCBmYXZvdXJpdGVzXG4gICAgICAgIHZhciBtYXhGYXZvdXJpdGVzID0gOTtcbiAgICAgICAgdmFyIGZhdm91cml0ZXNTdG9yYWdlS2V5ID0gJ2RpYXMuYW5ub3RhdGlvbnMubGFiZWwtZmF2b3VyaXRlcyc7XG5cbiAgICAgICAgLy8gc2F2ZXMgdGhlIElEcyBvZiB0aGUgZmF2b3VyaXRlcyBpbiBsb2NhbFN0b3JhZ2VcbiAgICAgICAgdmFyIHN0b3JlRmF2b3VyaXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0bXAgPSAkc2NvcGUuZmF2b3VyaXRlcy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5pZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVtmYXZvdXJpdGVzU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeSh0bXApO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJlc3RvcmVzIHRoZSBmYXZvdXJpdGVzIGZyb20gdGhlIElEcyBpbiBsb2NhbFN0b3JhZ2VcbiAgICAgICAgdmFyIGxvYWRGYXZvdXJpdGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbZmF2b3VyaXRlc1N0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRtcCA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtmYXZvdXJpdGVzU3RvcmFnZUtleV0pO1xuICAgICAgICAgICAgICAgICRzY29wZS5mYXZvdXJpdGVzID0gJHNjb3BlLmNhdGVnb3JpZXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgdGFrZSB0aG9zZSBjYXRlZ29yaWVzIGFzIGZhdm91cml0ZXMgdGhhdCBhcmUgYXZhaWxhYmxlIGZvciB0aGlzIGltYWdlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0bXAuaW5kZXhPZihpdGVtLmlkKSAhPT0gLTE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGNob29zZUZhdm91cml0ZSA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgaWYgKGluZGV4ID49IDAgJiYgaW5kZXggPCAkc2NvcGUuZmF2b3VyaXRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbSgkc2NvcGUuZmF2b3VyaXRlc1tpbmRleF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5ob3RrZXlzTWFwID0gWyfwnZ+tJywgJ/Cdn64nLCAn8J2frycsICfwnZ+wJywgJ/Cdn7EnLCAn8J2fsicsICfwnZ+zJywgJ/Cdn7QnLCAn8J2ftSddO1xuICAgICAgICAkc2NvcGUuY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcyA9IFtdO1xuICAgICAgICBsYWJlbHMucHJvbWlzZS50aGVuKGZ1bmN0aW9uIChhbGwpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBhbGwpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY2F0ZWdvcmllcyA9ICRzY29wZS5jYXRlZ29yaWVzLmNvbmNhdChhbGxba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2FkRmF2b3VyaXRlcygpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuY2F0ZWdvcmllc1RyZWUgPSBsYWJlbHMuZ2V0VHJlZSgpO1xuXG4gICAgICAgICRzY29wZS5zZWxlY3RJdGVtID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIGxhYmVscy5zZXRTZWxlY3RlZChpdGVtKTtcbiAgICAgICAgICAgICRzY29wZS5zZWFyY2hDYXRlZ29yeSA9ICcnOyAvLyBjbGVhciBzZWFyY2ggZmllbGRcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdjYXRlZ29yaWVzLnNlbGVjdGVkJywgaXRlbSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzRmF2b3VyaXRlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuZmF2b3VyaXRlcy5pbmRleE9mKGl0ZW0pICE9PSAtMTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBhZGRzIGEgbmV3IGl0ZW0gdG8gdGhlIGZhdm91cml0ZXMgb3IgcmVtb3ZlcyBpdCBpZiBpdCBpcyBhbHJlYWR5IGEgZmF2b3VyaXRlXG4gICAgICAgICRzY29wZS50b2dnbGVGYXZvdXJpdGUgPSBmdW5jdGlvbiAoZSwgaXRlbSkge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIHZhciBpbmRleCA9ICRzY29wZS5mYXZvdXJpdGVzLmluZGV4T2YoaXRlbSk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xICYmICRzY29wZS5mYXZvdXJpdGVzLmxlbmd0aCA8IG1heEZhdm91cml0ZXMpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RvcmVGYXZvdXJpdGVzKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmV0dXJucyB3aGV0aGVyIHRoZSB1c2VyIGlzIHN0aWxsIGFsbG93ZWQgdG8gYWRkIGZhdm91cml0ZXNcbiAgICAgICAgJHNjb3BlLmZhdm91cml0ZXNMZWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5mYXZvdXJpdGVzLmxlbmd0aCA8IG1heEZhdm91cml0ZXM7XG4gICAgICAgIH07XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzEnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoMCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCcyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDEpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignMycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSgyKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoMyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc1JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDQpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignNicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg1KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoNik7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc4JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDcpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignOScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg4KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQ29uZmlkZW5jZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGNvbmZpZGVuY2UgY29udHJvbFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NvbmZpZGVuY2VDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbGFiZWxzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuY29uZmlkZW5jZSA9IDEuMDtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ2NvbmZpZGVuY2UnLCBmdW5jdGlvbiAoY29uZmlkZW5jZSkge1xuXHRcdFx0bGFiZWxzLnNldEN1cnJlbnRDb25maWRlbmNlKHBhcnNlRmxvYXQoY29uZmlkZW5jZSkpO1xuXG5cdFx0XHRpZiAoY29uZmlkZW5jZSA8PSAwLjI1KSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtZGFuZ2VyJztcblx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjUgKSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtd2FybmluZyc7XG5cdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC43NSApIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC1zdWNjZXNzJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtcHJpbWFyeSc7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENvbnRyb2xzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBjb250cm9sIGJ1dHRvbnNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDb250cm9sc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywgbGFiZWxzLCBtc2csICRhdHRycywga2V5Ym9hcmQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBkcmF3aW5nID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuc2VsZWN0U2hhcGUgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0aWYgKCFsYWJlbHMuaGFzU2VsZWN0ZWQoKSkge1xuICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnc2lkZWJhci5mb2xkb3V0LmRvLW9wZW4nLCAnY2F0ZWdvcmllcycpO1xuXHRcdFx0XHRtc2cuaW5mbygkYXR0cnMuc2VsZWN0Q2F0ZWdvcnkpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdG1hcEFubm90YXRpb25zLmZpbmlzaERyYXdpbmcoKTtcblxuXHRcdFx0aWYgKG5hbWUgPT09IG51bGwgfHwgKGRyYXdpbmcgJiYgJHNjb3BlLnNlbGVjdGVkU2hhcGUgPT09IG5hbWUpKSB7XG5cdFx0XHRcdCRzY29wZS5zZWxlY3RlZFNoYXBlID0gJyc7XG5cdFx0XHRcdGRyYXdpbmcgPSBmYWxzZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5zZWxlY3RlZFNoYXBlID0gbmFtZTtcblx0XHRcdFx0bWFwQW5ub3RhdGlvbnMuc3RhcnREcmF3aW5nKG5hbWUpO1xuXHRcdFx0XHRkcmF3aW5nID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIC8vIGRlc2VsZWN0IGRyYXdpbmcgdG9vbCBvbiBlc2NhcGVcbiAgICAgICAga2V5Ym9hcmQub24oMjcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZShudWxsKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ2EnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ1BvaW50Jyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdSZWN0YW5nbGUnKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ2QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ0NpcmNsZScpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignZicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnTGluZVN0cmluZycpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignZycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnUG9seWdvbicpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgTWluaW1hcENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIG1pbmltYXAgaW4gdGhlIHNpZGViYXJcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdNaW5pbWFwQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcCwgbWFwSW1hZ2UsICRlbGVtZW50LCBzdHlsZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgdmlld3BvcnRTb3VyY2UgPSBuZXcgb2wuc291cmNlLlZlY3RvcigpO1xuXG5cdFx0dmFyIG1pbmltYXAgPSBuZXcgb2wuTWFwKHtcblx0XHRcdHRhcmdldDogJ21pbmltYXAnLFxuXHRcdFx0Ly8gcmVtb3ZlIGNvbnRyb2xzXG5cdFx0XHRjb250cm9sczogW10sXG5cdFx0XHQvLyBkaXNhYmxlIGludGVyYWN0aW9uc1xuXHRcdFx0aW50ZXJhY3Rpb25zOiBbXVxuXHRcdH0pO1xuXG4gICAgICAgIHZhciBtYXBTaXplID0gbWFwLmdldFNpemUoKTtcbiAgICAgICAgdmFyIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuXG5cdFx0Ly8gZ2V0IHRoZSBzYW1lIGxheWVycyB0aGFuIHRoZSBtYXBcblx0XHRtaW5pbWFwLmFkZExheWVyKG1hcEltYWdlLmdldExheWVyKCkpO1xuICAgICAgICBtaW5pbWFwLmFkZExheWVyKG5ldyBvbC5sYXllci5WZWN0b3Ioe1xuICAgICAgICAgICAgc291cmNlOiB2aWV3cG9ydFNvdXJjZSxcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZXMudmlld3BvcnRcbiAgICAgICAgfSkpO1xuXG5cdFx0dmFyIHZpZXdwb3J0ID0gbmV3IG9sLkZlYXR1cmUoKTtcblx0XHR2aWV3cG9ydFNvdXJjZS5hZGRGZWF0dXJlKHZpZXdwb3J0KTtcblxuXHRcdC8vIHJlZnJlc2ggdGhlIHZpZXcgKHRoZSBpbWFnZSBzaXplIGNvdWxkIGhhdmUgYmVlbiBjaGFuZ2VkKVxuXHRcdCRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC5zZXRWaWV3KG5ldyBvbC5WaWV3KHtcblx0XHRcdFx0cHJvamVjdGlvbjogbWFwSW1hZ2UuZ2V0UHJvamVjdGlvbigpLFxuXHRcdFx0XHRjZW50ZXI6IG9sLmV4dGVudC5nZXRDZW50ZXIobWFwSW1hZ2UuZ2V0RXh0ZW50KCkpLFxuXHRcdFx0XHR6b29tOiAwXG5cdFx0XHR9KSk7XG5cdFx0fSk7XG5cblx0XHQvLyBtb3ZlIHRoZSB2aWV3cG9ydCByZWN0YW5nbGUgb24gdGhlIG1pbmltYXBcblx0XHR2YXIgcmVmcmVzaFZpZXdwb3J0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmlld3BvcnQuc2V0R2VvbWV0cnkob2wuZ2VvbS5Qb2x5Z29uLmZyb21FeHRlbnQobWFwVmlldy5jYWxjdWxhdGVFeHRlbnQobWFwU2l6ZSkpKTtcblx0XHR9O1xuXG4gICAgICAgIG1hcC5vbignY2hhbmdlOnNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBTaXplID0gbWFwLmdldFNpemUoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbWFwLm9uKCdjaGFuZ2U6dmlldycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuICAgICAgICB9KTtcblxuXHRcdG1hcC5vbigncG9zdGNvbXBvc2UnLCByZWZyZXNoVmlld3BvcnQpO1xuXG5cdFx0dmFyIGRyYWdWaWV3cG9ydCA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRtYXBWaWV3LnNldENlbnRlcihlLmNvb3JkaW5hdGUpO1xuXHRcdH07XG5cblx0XHRtaW5pbWFwLm9uKCdwb2ludGVyZHJhZycsIGRyYWdWaWV3cG9ydCk7XG5cblx0XHQkZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdG1pbmltYXAudW4oJ3BvaW50ZXJkcmFnJywgZHJhZ1ZpZXdwb3J0KTtcblx0XHR9KTtcblxuXHRcdCRlbGVtZW50Lm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC5vbigncG9pbnRlcmRyYWcnLCBkcmFnVmlld3BvcnQpO1xuXHRcdH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTZWxlY3RlZExhYmVsQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2VsZWN0ZWQgbGFiZWwgZGlzcGxheSBpbiB0aGUgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2VsZWN0ZWRMYWJlbENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuZ2V0U2VsZWN0ZWRMYWJlbCA9IGxhYmVscy5nZXRTZWxlY3RlZDtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2V0dGluZ3NBbm5vdGF0aW9uT3BhY2l0eUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgc2V0dGluZ3MgZm9sZG91dFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NldHRpbmdzQW5ub3RhdGlvbk9wYWNpdHlDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLnNldERlZmF1bHRTZXR0aW5ncygnYW5ub3RhdGlvbl9vcGFjaXR5JywgJzEnKTtcbiAgICAgICAgJHNjb3BlLiR3YXRjaCgnc2V0dGluZ3MuYW5ub3RhdGlvbl9vcGFjaXR5JywgZnVuY3Rpb24gKG9wYWNpdHkpIHtcbiAgICAgICAgICAgIG1hcEFubm90YXRpb25zLnNldE9wYWNpdHkob3BhY2l0eSk7XG4gICAgICAgIH0pO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNldHRpbmdzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBzZXR0aW5ncyBmb2xkb3V0XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2V0dGluZ3NDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgZGVib3VuY2UpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIHNldHRpbmdzU3RvcmFnZUtleSA9ICdkaWFzLmFubm90YXRpb25zLnNldHRpbmdzJztcblxuICAgICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0ge307XG5cbiAgICAgICAgLy8gbWF5IGJlIGV4dGVuZGVkIGJ5IGNoaWxkIGNvbnRyb2xsZXJzXG4gICAgICAgICRzY29wZS5zZXR0aW5ncyA9IHt9O1xuXG4gICAgICAgIC8vIG1heSBiZSBleHRlbmRlZCBieSBjaGlsZCBjb250cm9sbGVycyBidXQgd2lsbCBub3QgYmUgcGVybWFuZW50bHkgc3RvcmVkXG4gICAgICAgICRzY29wZS52b2xhdGlsZVNldHRpbmdzID0ge307XG5cbiAgICAgICAgdmFyIHN0b3JlU2V0dGluZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc2V0dGluZ3MgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnNldHRpbmdzKTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5nc1trZXldID09PSBkZWZhdWx0U2V0dGluZ3Nba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBkb24ndCBzdG9yZSBkZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2V0dGluZ3Nba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KHNldHRpbmdzKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgc3RvcmVTZXR0aW5nc0RlYm91bmNlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIHdhaXQgZm9yIHF1aWNrIGNoYW5nZXMgYW5kIG9ubHkgc3RvcmUgdGhlbSBvbmNlIHRoaW5ncyBjYWxtZWQgZG93biBhZ2FpblxuICAgICAgICAgICAgLy8gKGUuZy4gd2hlbiB0aGUgdXNlciBmb29scyBhcm91bmQgd2l0aCBhIHJhbmdlIHNsaWRlcilcbiAgICAgICAgICAgIGRlYm91bmNlKHN0b3JlU2V0dGluZ3MsIDI1MCwgc2V0dGluZ3NTdG9yYWdlS2V5KTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmVzdG9yZVNldHRpbmdzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHNldHRpbmdzID0ge307XG4gICAgICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc1N0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmV4dGVuZChzZXR0aW5ncywgZGVmYXVsdFNldHRpbmdzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2V0U2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0U2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnNldHRpbmdzW2tleV07XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNldERlZmF1bHRTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBkZWZhdWx0U2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgaWYgKCEkc2NvcGUuc2V0dGluZ3MuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zZXRTZXR0aW5ncyhrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2V0Vm9sYXRpbGVTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAkc2NvcGUudm9sYXRpbGVTZXR0aW5nc1trZXldID0gdmFsdWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFZvbGF0aWxlU2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnZvbGF0aWxlU2V0dGluZ3Nba2V5XTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuJHdhdGNoKCdzZXR0aW5ncycsIHN0b3JlU2V0dGluZ3NEZWJvdW5jZWQsIHRydWUpO1xuICAgICAgICBhbmd1bGFyLmV4dGVuZCgkc2NvcGUuc2V0dGluZ3MsIHJlc3RvcmVTZXR0aW5ncygpKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTaWRlYmFyQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NpZGViYXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgbWFwQW5ub3RhdGlvbnMsIGtleWJvYXJkKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGZvbGRvdXRTdG9yYWdlS2V5ID0gJ2RpYXMuYW5ub3RhdGlvbnMuc2lkZWJhci1mb2xkb3V0JztcblxuICAgICAgICAkc2NvcGUuZm9sZG91dCA9ICcnO1xuXG5cdFx0JHNjb3BlLm9wZW5Gb2xkb3V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldID0gbmFtZTtcbiAgICAgICAgICAgICRzY29wZS5mb2xkb3V0ID0gbmFtZTtcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2lkZWJhci5mb2xkb3V0Lm9wZW4nLCBuYW1lKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNsb3NlRm9sZG91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShmb2xkb3V0U3RvcmFnZUtleSk7XG5cdFx0XHQkc2NvcGUuZm9sZG91dCA9ICcnO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzaWRlYmFyLmZvbGRvdXQuY2xvc2UnKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUZvbGRvdXQgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0aWYgKCRzY29wZS5mb2xkb3V0ID09PSBuYW1lKSB7XG5cdFx0XHRcdCRzY29wZS5jbG9zZUZvbGRvdXQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5vcGVuRm9sZG91dChuYW1lKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLmRlbGV0ZVNlbGVjdGVkQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAobWFwQW5ub3RhdGlvbnMuZ2V0U2VsZWN0ZWRGZWF0dXJlcygpLmdldExlbmd0aCgpID4gMCAmJiBjb25maXJtKCdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIGFsbCBzZWxlY3RlZCBhbm5vdGF0aW9ucz8nKSkge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmRlbGV0ZVNlbGVjdGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5kby1vcGVuJywgZnVuY3Rpb24gKGUsIG5hbWUpIHtcbiAgICAgICAgICAgICRzY29wZS5vcGVuRm9sZG91dChuYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oOSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICRzY29wZS50b2dnbGVGb2xkb3V0KCdjYXRlZ29yaWVzJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDQ2LCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZVNlbGVjdGVkQW5ub3RhdGlvbnMoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gdGhlIGN1cnJlbnRseSBvcGVuZWQgc2lkZWJhci0nZXh0ZW5zaW9uJyBpcyByZW1lbWJlcmVkIHRocm91Z2ggbG9jYWxTdG9yYWdlXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW2ZvbGRvdXRTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgJHNjb3BlLm9wZW5Gb2xkb3V0KHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldKTtcbiAgICAgICAgfVxuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGFubm90YXRpb25MaXN0SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBbiBhbm5vdGF0aW9uIGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5kaXJlY3RpdmUoJ2Fubm90YXRpb25MaXN0SXRlbScsIGZ1bmN0aW9uIChsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRzY29wZTogdHJ1ZSxcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0JHNjb3BlLnNoYXBlQ2xhc3MgPSAnaWNvbi0nICsgJHNjb3BlLmFubm90YXRpb24uc2hhcGUudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0XHQkc2NvcGUuc2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS5pc1NlbGVjdGVkKCRzY29wZS5hbm5vdGF0aW9uLmlkKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuYXR0YWNoTGFiZWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0bGFiZWxzLmF0dGFjaFRvQW5ub3RhdGlvbigkc2NvcGUuYW5ub3RhdGlvbik7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLnJlbW92ZUxhYmVsID0gZnVuY3Rpb24gKGxhYmVsKSB7XG5cdFx0XHRcdFx0bGFiZWxzLnJlbW92ZUZyb21Bbm5vdGF0aW9uKCRzY29wZS5hbm5vdGF0aW9uLCBsYWJlbCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmNhbkF0dGFjaExhYmVsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuc2VsZWN0ZWQoKSAmJiBsYWJlbHMuaGFzU2VsZWN0ZWQoKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudExhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkO1xuXG5cdFx0XHRcdCRzY29wZS5jdXJyZW50Q29uZmlkZW5jZSA9IGxhYmVscy5nZXRDdXJyZW50Q29uZmlkZW5jZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhYmVsQ2F0ZWdvcnlJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgbGFiZWwgY2F0ZWdvcnkgbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmRpcmVjdGl2ZSgnbGFiZWxDYXRlZ29yeUl0ZW0nLCBmdW5jdGlvbiAoJGNvbXBpbGUsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdDJyxcblxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdsYWJlbC1pdGVtLmh0bWwnLFxuXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHdhaXQgZm9yIHRoaXMgZWxlbWVudCB0byBiZSByZW5kZXJlZCB1bnRpbCB0aGUgY2hpbGRyZW4gYXJlXG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kZWQsIG90aGVyd2lzZSB0aGVyZSB3b3VsZCBiZSB0b28gbXVjaCByZWN1cnNpb24gZm9yXG4gICAgICAgICAgICAgICAgLy8gYW5ndWxhclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnbGFiZWwtc3VidHJlZS5odG1sJykpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoY29udGVudCkoc2NvcGUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIHRoZSBzdWJ0cmVlIG9mIHRoaXMgaXRlbVxuICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaGFzIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzRXhwYW5kYWJsZSA9ICRzY29wZS50cmVlICYmICEhJHNjb3BlLnRyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8gaGFuZGxlIHRoaXMgYnkgdGhlIGV2ZW50IHJhdGhlciB0aGFuIGFuIG93biBjbGljayBoYW5kbGVyIHRvXG4gICAgICAgICAgICAgICAgLy8gZGVhbCB3aXRoIGNsaWNrIGFuZCBzZWFyY2ggZmllbGQgYWN0aW9ucyBpbiBhIHVuaWZpZWQgd2F5XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGZ1bmN0aW9uIChlLCBjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbiBpdGVtIGlzIHNlbGVjdGVkLCBpdHMgc3VidHJlZSBhbmQgYWxsIHBhcmVudCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgb3BlbmVkXG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5pZCA9PT0gY2F0ZWdvcnkuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBoaXRzIGFsbCBwYXJlbnQgc2NvcGVzL2l0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGEgY2hpbGQgaXRlbSB3YXMgc2VsZWN0ZWQsIHRoaXMgaXRlbSBzaG91bGQgYmUgb3BlbmVkLCB0b29cbiAgICAgICAgICAgICAgICAvLyBzbyB0aGUgc2VsZWN0ZWQgaXRlbSBiZWNvbWVzIHZpc2libGUgaW4gdGhlIHRyZWVcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3AgcHJvcGFnYXRpb24gaWYgdGhpcyBpcyBhIHJvb3QgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0ucGFyZW50X2lkID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYWJlbEl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQW4gYW5ub3RhdGlvbiBsYWJlbCBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZGlyZWN0aXZlKCdsYWJlbEl0ZW0nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFx0XHR2YXIgY29uZmlkZW5jZSA9ICRzY29wZS5hbm5vdGF0aW9uTGFiZWwuY29uZmlkZW5jZTtcblxuXHRcdFx0XHRpZiAoY29uZmlkZW5jZSA8PSAwLjI1KSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLWRhbmdlcic7XG5cdFx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjUgKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXdhcm5pbmcnO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC43NSApIHtcblx0XHRcdFx0XHQkc2NvcGUuY2xhc3MgPSAnbGFiZWwtc3VjY2Vzcyc7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXByaW1hcnknO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgZGVib3VuY2VcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQSBkZWJvdW5jZSBzZXJ2aWNlIHRvIHBlcmZvcm0gYW4gYWN0aW9uIG9ubHkgd2hlbiB0aGlzIGZ1bmN0aW9uXG4gKiB3YXNuJ3QgY2FsbGVkIGFnYWluIGluIGEgc2hvcnQgcGVyaW9kIG9mIHRpbWUuXG4gKiBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTMzMjAwMTYvMTc5NjUyM1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmZhY3RvcnkoJ2RlYm91bmNlJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkcSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHRpbWVvdXRzID0ge307XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gKGZ1bmMsIHdhaXQsIGlkKSB7XG5cdFx0XHQvLyBDcmVhdGUgYSBkZWZlcnJlZCBvYmplY3QgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gd2UgbmVlZCB0b1xuXHRcdFx0Ly8gYWN0dWFsbHkgY2FsbCB0aGUgZnVuY1xuXHRcdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHRcdFx0dmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGltZW91dHNbaWRdID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKSk7XG5cdFx0XHRcdFx0ZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpZiAodGltZW91dHNbaWRdKSB7XG5cdFx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRzW2lkXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGltZW91dHNbaWRdID0gJHRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHRcdH0pKCk7XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIG1hcFxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIGZhY3RvcnkgaGFuZGxpbmcgT3BlbkxheWVycyBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5mYWN0b3J5KCdtYXAnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgbWFwID0gbmV3IG9sLk1hcCh7XG5cdFx0XHR0YXJnZXQ6ICdjYW52YXMnLFxuICAgICAgICAgICAgcmVuZGVyZXI6ICdjYW52YXMnLFxuXHRcdFx0Y29udHJvbHM6IFtcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuWm9vbSgpLFxuXHRcdFx0XHRuZXcgb2wuY29udHJvbC5ab29tVG9FeHRlbnQoKSxcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuRnVsbFNjcmVlbigpXG5cdFx0XHRdLFxuICAgICAgICAgICAgaW50ZXJhY3Rpb25zOiBvbC5pbnRlcmFjdGlvbi5kZWZhdWx0cyh7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQ6IGZhbHNlXG4gICAgICAgICAgICB9KVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIG1hcDtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgYW5ub3RhdGlvbnNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIHRoZSBhbm5vdGF0aW9ucyB0byBtYWtlIHRoZW0gYXZhaWxhYmxlIGluIG11bHRpcGxlIGNvbnRyb2xsZXJzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2Fubm90YXRpb25zJywgZnVuY3Rpb24gKEFubm90YXRpb24sIHNoYXBlcywgbXNnKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgYW5ub3RhdGlvbnM7XG4gICAgICAgIHZhciBwcm9taXNlO1xuXG5cdFx0dmFyIHJlc29sdmVTaGFwZU5hbWUgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0YW5ub3RhdGlvbi5zaGFwZSA9IHNoYXBlcy5nZXROYW1lKGFubm90YXRpb24uc2hhcGVfaWQpO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb247XG5cdFx0fTtcblxuXHRcdHZhciBhZGRBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdGFubm90YXRpb25zLnB1c2goYW5ub3RhdGlvbik7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbjtcblx0XHR9O1xuXG5cdFx0dGhpcy5xdWVyeSA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcblx0XHRcdGFubm90YXRpb25zID0gQW5ub3RhdGlvbi5xdWVyeShwYXJhbXMpO1xuICAgICAgICAgICAgcHJvbWlzZSA9IGFubm90YXRpb25zLiRwcm9taXNlO1xuXHRcdFx0cHJvbWlzZS50aGVuKGZ1bmN0aW9uIChhKSB7XG5cdFx0XHRcdGEuZm9yRWFjaChyZXNvbHZlU2hhcGVOYW1lKTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb25zO1xuXHRcdH07XG5cblx0XHR0aGlzLmFkZCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcblx0XHRcdGlmICghcGFyYW1zLnNoYXBlX2lkICYmIHBhcmFtcy5zaGFwZSkge1xuXHRcdFx0XHRwYXJhbXMuc2hhcGVfaWQgPSBzaGFwZXMuZ2V0SWQocGFyYW1zLnNoYXBlKTtcblx0XHRcdH1cblx0XHRcdHZhciBhbm5vdGF0aW9uID0gQW5ub3RhdGlvbi5hZGQocGFyYW1zKTtcblx0XHRcdGFubm90YXRpb24uJHByb21pc2Vcblx0XHRcdCAgICAgICAgICAudGhlbihyZXNvbHZlU2hhcGVOYW1lKVxuXHRcdFx0ICAgICAgICAgIC50aGVuKGFkZEFubm90YXRpb24pXG5cdFx0XHQgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcblxuXHRcdFx0cmV0dXJuIGFubm90YXRpb247XG5cdFx0fTtcblxuXHRcdHRoaXMuZGVsZXRlID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdC8vIHVzZSBpbmRleCB0byBzZWUgaWYgdGhlIGFubm90YXRpb24gZXhpc3RzIGluIHRoZSBhbm5vdGF0aW9ucyBsaXN0XG5cdFx0XHR2YXIgaW5kZXggPSBhbm5vdGF0aW9ucy5pbmRleE9mKGFubm90YXRpb24pO1xuXHRcdFx0aWYgKGluZGV4ID4gLTEpIHtcblx0XHRcdFx0cmV0dXJuIGFubm90YXRpb24uJGRlbGV0ZShmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0Ly8gdXBkYXRlIHRoZSBpbmRleCBzaW5jZSB0aGUgYW5ub3RhdGlvbnMgbGlzdCBtYXkgaGF2ZSBiZWVuXG5cdFx0XHRcdFx0Ly8gbW9kaWZpZWQgaW4gdGhlIG1lYW50aW1lXG5cdFx0XHRcdFx0aW5kZXggPSBhbm5vdGF0aW9ucy5pbmRleE9mKGFubm90YXRpb24pO1xuXHRcdFx0XHRcdGFubm90YXRpb25zLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdH0sIG1zZy5yZXNwb25zZUVycm9yKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5mb3JFYWNoID0gZnVuY3Rpb24gKGZuKSB7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnMuZm9yRWFjaChmbik7XG5cdFx0fTtcblxuXHRcdHRoaXMuY3VycmVudCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9ucztcblx0XHR9O1xuXG4gICAgICAgIHRoaXMuZ2V0UHJvbWlzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBpbWFnZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFuYWdlcyAocHJlLSlsb2FkaW5nIG9mIHRoZSBpbWFnZXMgdG8gYW5ub3RhdGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnaW1hZ2VzJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIFRyYW5zZWN0SW1hZ2UsIFVSTCwgJHEsIGZpbHRlclN1YnNldCwgVFJBTlNFQ1RfSUQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cdFx0Ly8gYXJyYXkgb2YgYWxsIGltYWdlIElEcyBvZiB0aGUgdHJhbnNlY3Rcblx0XHR2YXIgaW1hZ2VJZHMgPSBbXTtcblx0XHQvLyBtYXhpbXVtIG51bWJlciBvZiBpbWFnZXMgdG8gaG9sZCBpbiBidWZmZXJcblx0XHR2YXIgTUFYX0JVRkZFUl9TSVpFID0gMTA7XG5cdFx0Ly8gYnVmZmVyIG9mIGFscmVhZHkgbG9hZGVkIGltYWdlc1xuXHRcdHZhciBidWZmZXIgPSBbXTtcblxuXHRcdC8vIHRoZSBjdXJyZW50bHkgc2hvd24gaW1hZ2Vcblx0XHR0aGlzLmN1cnJlbnRJbWFnZSA9IHVuZGVmaW5lZDtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIG5leHQgSUQgb2YgdGhlIHNwZWNpZmllZCBpbWFnZSBvciB0aGUgbmV4dCBJRCBvZiB0aGVcblx0XHQgKiBjdXJyZW50IGltYWdlIGlmIG5vIGltYWdlIHdhcyBzcGVjaWZpZWQuXG5cdFx0ICovXG5cdFx0dmFyIG5leHRJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0aWQgPSBpZCB8fCBfdGhpcy5jdXJyZW50SW1hZ2UuX2lkO1xuXHRcdFx0dmFyIGluZGV4ID0gaW1hZ2VJZHMuaW5kZXhPZihpZCk7XG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHNbKGluZGV4ICsgMSkgJSBpbWFnZUlkcy5sZW5ndGhdO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBwcmV2aW91cyBJRCBvZiB0aGUgc3BlY2lmaWVkIGltYWdlIG9yIHRoZSBwcmV2aW91cyBJRCBvZlxuXHRcdCAqIHRoZSBjdXJyZW50IGltYWdlIGlmIG5vIGltYWdlIHdhcyBzcGVjaWZpZWQuXG5cdFx0ICovXG5cdFx0dmFyIHByZXZJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0aWQgPSBpZCB8fCBfdGhpcy5jdXJyZW50SW1hZ2UuX2lkO1xuXHRcdFx0dmFyIGluZGV4ID0gaW1hZ2VJZHMuaW5kZXhPZihpZCk7XG5cdFx0XHR2YXIgbGVuZ3RoID0gaW1hZ2VJZHMubGVuZ3RoO1xuXHRcdFx0cmV0dXJuIGltYWdlSWRzWyhpbmRleCAtIDEgKyBsZW5ndGgpICUgbGVuZ3RoXTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgc3BlY2lmaWVkIGltYWdlIGZyb20gdGhlIGJ1ZmZlciBvciBgdW5kZWZpbmVkYCBpZiBpdCBpc1xuXHRcdCAqIG5vdCBidWZmZXJlZC5cblx0XHQgKi9cblx0XHR2YXIgZ2V0SW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdGZvciAodmFyIGkgPSBidWZmZXIubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0aWYgKGJ1ZmZlcltpXS5faWQgPT0gaWQpIHJldHVybiBidWZmZXJbaV07XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNldHMgdGhlIHNwZWNpZmllZCBpbWFnZSB0byBhcyB0aGUgY3VycmVudGx5IHNob3duIGltYWdlLlxuXHRcdCAqL1xuXHRcdHZhciBzaG93ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRfdGhpcy5jdXJyZW50SW1hZ2UgPSBnZXRJbWFnZShpZCk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIExvYWRzIHRoZSBzcGVjaWZpZWQgaW1hZ2UgZWl0aGVyIGZyb20gYnVmZmVyIG9yIGZyb20gdGhlIGV4dGVybmFsXG5cdFx0ICogcmVzb3VyY2UuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgZ2V0cyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpc1xuXHRcdCAqIGxvYWRlZC5cblx0XHQgKi9cblx0XHR2YXIgZmV0Y2hJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdHZhciBpbWcgPSBnZXRJbWFnZShpZCk7XG5cblx0XHRcdGlmIChpbWcpIHtcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbWcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG5cdFx0XHRcdGltZy5faWQgPSBpZDtcblx0XHRcdFx0aW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRidWZmZXIucHVzaChpbWcpO1xuXHRcdFx0XHRcdC8vIGNvbnRyb2wgbWF4aW11bSBidWZmZXIgc2l6ZVxuXHRcdFx0XHRcdGlmIChidWZmZXIubGVuZ3RoID4gTUFYX0JVRkZFUl9TSVpFKSB7XG5cdFx0XHRcdFx0XHRidWZmZXIuc2hpZnQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbWcpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpbWcub25lcnJvciA9IGZ1bmN0aW9uIChtc2cpIHtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3QobXNnKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aW1nLnNyYyA9IFVSTCArIFwiL2FwaS92MS9pbWFnZXMvXCIgKyBpZCArIFwiL2ZpbGVcIjtcblx0XHRcdH1cblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdpbWFnZS5mZXRjaGluZycsIGltZyk7XG5cblx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBJbml0aWFsaXplcyB0aGUgc2VydmljZSBmb3IgYSBnaXZlbiB0cmFuc2VjdC4gUmV0dXJucyBhIHByb21pc2UgdGhhdFxuXHRcdCAqIGlzIHJlc29sdmVkLCB3aGVuIHRoZSBzZXJ2aWNlIGlzIGluaXRpYWxpemVkLlxuXHRcdCAqL1xuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGltYWdlSWRzID0gVHJhbnNlY3RJbWFnZS5xdWVyeSh7dHJhbnNlY3RfaWQ6IFRSQU5TRUNUX0lEfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGxvb2sgZm9yIGEgc2VxdWVuY2Ugb2YgaW1hZ2UgSURzIGluIGxvY2FsIHN0b3JhZ2UuXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBzZXF1ZW5jZSBpcyBwcm9kdWNlcyBieSB0aGUgdHJhbnNlY3QgaW5kZXggcGFnZSB3aGVuIHRoZSBpbWFnZXMgYXJlXG4gICAgICAgICAgICAgICAgLy8gc29ydGVkIG9yIGZpbHRlcmVkLiB3ZSB3YW50IHRvIHJlZmxlY3QgdGhlIHNhbWUgb3JkZXJpbmcgb3IgZmlsdGVyaW5nIGhlcmVcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGUgYW5ub3RhdG9yXG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlZFNlcXVlbmNlID0gd2luZG93LmxvY2FsU3RvcmFnZVsnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5pbWFnZXMnXTtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmVkU2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmVkU2VxdWVuY2UgPSBKU09OLnBhcnNlKHN0b3JlZFNlcXVlbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgc3VjaCBhIHN0b3JlZCBzZXF1ZW5jZSwgZmlsdGVyIG91dCBhbnkgaW1hZ2UgSURzIHRoYXQgZG8gbm90XG4gICAgICAgICAgICAgICAgICAgIC8vIGJlbG9uZyB0byB0aGUgdHJhbnNlY3QgKGFueSBtb3JlKSwgc2luY2Ugc29tZSBvZiB0aGVtIG1heSBoYXZlIGJlZW4gZGVsZXRlZFxuICAgICAgICAgICAgICAgICAgICAvLyBpbiB0aGUgbWVhbnRpbWVcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyU3Vic2V0KHN0b3JlZFNlcXVlbmNlLCBpbWFnZUlkcyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgcHJvbWlzZSBpcyBub3QgcmVtb3ZlZCB3aGVuIG92ZXJ3cml0aW5nIGltYWdlSWRzIHNpbmNlIHdlXG4gICAgICAgICAgICAgICAgICAgIC8vIG5lZWQgaXQgbGF0ZXIgb24uXG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlLiRwcm9taXNlID0gaW1hZ2VJZHMuJHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlLiRyZXNvbHZlZCA9IGltYWdlSWRzLiRyZXNvbHZlZDtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlbiBzZXQgdGhlIHN0b3JlZCBzZXF1ZW5jZSBhcyB0aGUgc2VxdWVuY2Ugb2YgaW1hZ2UgSURzIGluc3RlYWQgb2Ygc2ltcGx5XG4gICAgICAgICAgICAgICAgICAgIC8vIGFsbCBJRHMgYmVsb25naW5nIHRvIHRoZSB0cmFuc2VjdFxuICAgICAgICAgICAgICAgICAgICBpbWFnZUlkcyA9IHN0b3JlZFNlcXVlbmNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHMuJHByb21pc2U7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNob3cgdGhlIGltYWdlIHdpdGggdGhlIHNwZWNpZmllZCBJRC4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMuc2hvdyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIHByb21pc2UgPSBmZXRjaEltYWdlKGlkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzaG93KGlkKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyB3YWl0IGZvciBpbWFnZUlkcyB0byBiZSBsb2FkZWRcblx0XHRcdGltYWdlSWRzLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyBwcmUtbG9hZCBwcmV2aW91cyBhbmQgbmV4dCBpbWFnZXMgYnV0IGRvbid0IGRpc3BsYXkgdGhlbVxuXHRcdFx0XHRmZXRjaEltYWdlKG5leHRJZChpZCkpO1xuXHRcdFx0XHRmZXRjaEltYWdlKHByZXZJZChpZCkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBwcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBuZXh0IGltYWdlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzXG5cdFx0ICogcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXMgc2hvd24uXG5cdFx0ICovXG5cdFx0dGhpcy5uZXh0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF90aGlzLnNob3cobmV4dElkKCkpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBwcmV2aW91cyBpbWFnZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMucHJldiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfdGhpcy5zaG93KHByZXZJZCgpKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRDdXJyZW50SWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBrZXlib2FyZFxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIHRvIHJlZ2lzdGVyIGFuZCBtYW5hZ2Uga2V5cHJlc3MgZXZlbnRzIHdpdGggcHJpb3JpdGllc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2tleWJvYXJkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBtYXBzIGtleSBjb2Rlcy9jaGFyYWN0ZXJzIHRvIGFycmF5cyBvZiBsaXN0ZW5lcnNcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHt9O1xuXG4gICAgICAgIHZhciBleGVjdXRlQ2FsbGJhY2tzID0gZnVuY3Rpb24gKGxpc3QsIGUpIHtcbiAgICAgICAgICAgIC8vIGdvIGZyb20gaGlnaGVzdCBwcmlvcml0eSBkb3duXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gbGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrcyBjYW4gY2FuY2VsIGZ1cnRoZXIgcHJvcGFnYXRpb25cbiAgICAgICAgICAgICAgICBpZiAobGlzdFtpXS5jYWxsYmFjayhlKSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlS2V5RXZlbnRzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHZhciBjb2RlID0gZS5rZXlDb2RlO1xuICAgICAgICAgICAgdmFyIGNoYXJhY3RlciA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZS53aGljaCB8fCBjb2RlKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NvZGVdKSB7XG4gICAgICAgICAgICAgICAgZXhlY3V0ZUNhbGxiYWNrcyhsaXN0ZW5lcnNbY29kZV0sIGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NoYXJhY3Rlcl0pIHtcbiAgICAgICAgICAgICAgICBleGVjdXRlQ2FsbGJhY2tzKGxpc3RlbmVyc1tjaGFyYWN0ZXJdLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5RXZlbnRzKTtcblxuICAgICAgICAvLyByZWdpc3RlciBhIG5ldyBldmVudCBsaXN0ZW5lciBmb3IgdGhlIGtleSBjb2RlIG9yIGNoYXJhY3RlciB3aXRoIGFuIG9wdGlvbmFsIHByaW9yaXR5XG4gICAgICAgIC8vIGxpc3RlbmVycyB3aXRoIGhpZ2hlciBwcmlvcml0eSBhcmUgY2FsbGVkIGZpcnN0IGFuYyBjYW4gcmV0dXJuICdmYWxzZScgdG8gcHJldmVudCB0aGVcbiAgICAgICAgLy8gbGlzdGVuZXJzIHdpdGggbG93ZXIgcHJpb3JpdHkgZnJvbSBiZWluZyBjYWxsZWRcbiAgICAgICAgdGhpcy5vbiA9IGZ1bmN0aW9uIChjaGFyT3JDb2RlLCBjYWxsYmFjaywgcHJpb3JpdHkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2hhck9yQ29kZSA9PT0gJ3N0cmluZycgfHwgY2hhck9yQ29kZSBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICAgICAgICAgIGNoYXJPckNvZGUgPSBjaGFyT3JDb2RlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcbiAgICAgICAgICAgIHZhciBsaXN0ZW5lciA9IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IHByaW9yaXR5XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NoYXJPckNvZGVdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBsaXN0ZW5lcnNbY2hhck9yQ29kZV07XG4gICAgICAgICAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdFtpXS5wcmlvcml0eSA+PSBwcmlvcml0eSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IGxpc3QubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3Quc3BsaWNlKGksIDAsIGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzW2NoYXJPckNvZGVdID0gW2xpc3RlbmVyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyB1bnJlZ2lzdGVyIGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIHRoaXMub2ZmID0gZnVuY3Rpb24gKGNoYXJPckNvZGUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNoYXJPckNvZGUgPT09ICdzdHJpbmcnIHx8IGNoYXJPckNvZGUgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBjaGFyT3JDb2RlID0gY2hhck9yQ29kZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NoYXJPckNvZGVdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBsaXN0ZW5lcnNbY2hhck9yQ29kZV07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaXN0W2ldLmNhbGxiYWNrID09PSBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBsYWJlbHNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGZvciBhbm5vdGF0aW9uIGxhYmVscyB0byBwcm92aWRlIHNvbWUgY29udmVuaWVuY2UgZnVuY3Rpb25zLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2xhYmVscycsIGZ1bmN0aW9uIChBbm5vdGF0aW9uTGFiZWwsIExhYmVsLCBQcm9qZWN0TGFiZWwsIFByb2plY3QsIG1zZywgJHEsIFBST0pFQ1RfSURTKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZExhYmVsO1xuICAgICAgICB2YXIgY3VycmVudENvbmZpZGVuY2UgPSAxLjA7XG5cbiAgICAgICAgdmFyIGxhYmVscyA9IHt9O1xuXG4gICAgICAgIC8vIHRoaXMgcHJvbWlzZSBpcyByZXNvbHZlZCB3aGVuIGFsbCBsYWJlbHMgd2VyZSBsb2FkZWRcbiAgICAgICAgdGhpcy5wcm9taXNlID0gbnVsbDtcblxuICAgICAgICB0aGlzLmZldGNoRm9yQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICBpZiAoIWFubm90YXRpb24pIHJldHVybjtcblxuICAgICAgICAgICAgLy8gZG9uJ3QgZmV0Y2ggdHdpY2VcbiAgICAgICAgICAgIGlmICghYW5ub3RhdGlvbi5sYWJlbHMpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscyA9IEFubm90YXRpb25MYWJlbC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgIGFubm90YXRpb25faWQ6IGFubm90YXRpb24uaWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFubm90YXRpb24ubGFiZWxzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYXR0YWNoVG9Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IEFubm90YXRpb25MYWJlbC5hdHRhY2goe1xuICAgICAgICAgICAgICAgIGFubm90YXRpb25faWQ6IGFubm90YXRpb24uaWQsXG4gICAgICAgICAgICAgICAgbGFiZWxfaWQ6IHNlbGVjdGVkTGFiZWwuaWQsXG4gICAgICAgICAgICAgICAgY29uZmlkZW5jZTogY3VycmVudENvbmZpZGVuY2VcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsYWJlbC4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscy5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsYWJlbC4kcHJvbWlzZS5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG5cbiAgICAgICAgICAgIHJldHVybiBsYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJlbW92ZUZyb21Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24sIGxhYmVsKSB7XG4gICAgICAgICAgICAvLyB1c2UgaW5kZXggdG8gc2VlIGlmIHRoZSBsYWJlbCBleGlzdHMgZm9yIHRoZSBhbm5vdGF0aW9uXG4gICAgICAgICAgICB2YXIgaW5kZXggPSBhbm5vdGF0aW9uLmxhYmVscy5pbmRleE9mKGxhYmVsKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhYmVsLiRkZWxldGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGluZGV4IHNpbmNlIHRoZSBsYWJlbCBsaXN0IG1heSBoYXZlIGJlZW4gbW9kaWZpZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIG1lYW50aW1lXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gYW5ub3RhdGlvbi5sYWJlbHMuaW5kZXhPZihsYWJlbCk7XG4gICAgICAgICAgICAgICAgICAgIGFubm90YXRpb24ubGFiZWxzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgfSwgbXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0VHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge307XG4gICAgICAgICAgICB2YXIga2V5ID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBidWlsZCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBsYWJlbC5wYXJlbnRfaWQ7XG4gICAgICAgICAgICAgICAgaWYgKHRyZWVba2V5XVtwYXJlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XVtwYXJlbnRdLnB1c2gobGFiZWwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XVtwYXJlbnRdID0gW2xhYmVsXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnByb21pc2UudGhlbihmdW5jdGlvbiAobGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBsYWJlbHNba2V5XS5mb3JFYWNoKGJ1aWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbGFiZWxzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2V0U2VsZWN0ZWQgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkTGFiZWwgPSBsYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldFNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGVkTGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIXNlbGVjdGVkTGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRDdXJyZW50Q29uZmlkZW5jZSA9IGZ1bmN0aW9uIChjb25maWRlbmNlKSB7XG4gICAgICAgICAgICBjdXJyZW50Q29uZmlkZW5jZSA9IGNvbmZpZGVuY2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRDdXJyZW50Q29uZmlkZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50Q29uZmlkZW5jZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpbml0XG4gICAgICAgIChmdW5jdGlvbiAoX3RoaXMpIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBfdGhpcy5wcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIC8vIC0xIGJlY2F1c2Ugb2YgZ2xvYmFsIGxhYmVsc1xuICAgICAgICAgICAgdmFyIGZpbmlzaGVkID0gLTE7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFsbCBsYWJlbHMgYXJlIHRoZXJlLiBpZiB5ZXMsIHJlc29sdmVcbiAgICAgICAgICAgIHZhciBtYXliZVJlc29sdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCsrZmluaXNoZWQgPT09IFBST0pFQ1RfSURTLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGxhYmVscyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbGFiZWxzW251bGxdID0gTGFiZWwucXVlcnkobWF5YmVSZXNvbHZlKTtcblxuICAgICAgICAgICAgUFJPSkVDVF9JRFMuZm9yRWFjaChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgICAgICBQcm9qZWN0LmdldCh7aWQ6IGlkfSwgZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxzW3Byb2plY3QubmFtZV0gPSBQcm9qZWN0TGFiZWwucXVlcnkoe3Byb2plY3RfaWQ6IGlkfSwgbWF5YmVSZXNvbHZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSh0aGlzKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBtYXBBbm5vdGF0aW9uc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgaGFuZGxpbmcgdGhlIGFubm90YXRpb25zIGxheWVyIG9uIHRoZSBPcGVuTGF5ZXJzIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ21hcEFubm90YXRpb25zJywgZnVuY3Rpb24gKG1hcCwgaW1hZ2VzLCBhbm5vdGF0aW9ucywgZGVib3VuY2UsIHN0eWxlcywgJGludGVydmFsLCBsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgYW5ub3RhdGlvbkZlYXR1cmVzID0gbmV3IG9sLkNvbGxlY3Rpb24oKTtcbiAgICAgICAgdmFyIGFubm90YXRpb25Tb3VyY2UgPSBuZXcgb2wuc291cmNlLlZlY3Rvcih7XG4gICAgICAgICAgICBmZWF0dXJlczogYW5ub3RhdGlvbkZlYXR1cmVzXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgYW5ub3RhdGlvbkxheWVyID0gbmV3IG9sLmxheWVyLlZlY3Rvcih7XG4gICAgICAgICAgICBzb3VyY2U6IGFubm90YXRpb25Tb3VyY2UsXG4gICAgICAgICAgICBzdHlsZTogc3R5bGVzLmZlYXR1cmVzLFxuICAgICAgICAgICAgekluZGV4OiAxMDBcbiAgICAgICAgfSk7XG5cblx0XHQvLyBzZWxlY3QgaW50ZXJhY3Rpb24gd29ya2luZyBvbiBcInNpbmdsZWNsaWNrXCJcblx0XHR2YXIgc2VsZWN0ID0gbmV3IG9sLmludGVyYWN0aW9uLlNlbGVjdCh7XG5cdFx0XHRzdHlsZTogc3R5bGVzLmhpZ2hsaWdodCxcbiAgICAgICAgICAgIGxheWVyczogW2Fubm90YXRpb25MYXllcl0sXG4gICAgICAgICAgICAvLyBlbmFibGUgc2VsZWN0aW5nIG11bHRpcGxlIG92ZXJsYXBwaW5nIGZlYXR1cmVzIGF0IG9uY2VcbiAgICAgICAgICAgIG11bHRpOiB0cnVlXG5cdFx0fSk7XG5cblx0XHR2YXIgc2VsZWN0ZWRGZWF0dXJlcyA9IHNlbGVjdC5nZXRGZWF0dXJlcygpO1xuXG5cdFx0dmFyIG1vZGlmeSA9IG5ldyBvbC5pbnRlcmFjdGlvbi5Nb2RpZnkoe1xuXHRcdFx0ZmVhdHVyZXM6IGFubm90YXRpb25GZWF0dXJlcyxcblx0XHRcdC8vIHRoZSBTSElGVCBrZXkgbXVzdCBiZSBwcmVzc2VkIHRvIGRlbGV0ZSB2ZXJ0aWNlcywgc29cblx0XHRcdC8vIHRoYXQgbmV3IHZlcnRpY2VzIGNhbiBiZSBkcmF3biBhdCB0aGUgc2FtZSBwb3NpdGlvblxuXHRcdFx0Ly8gb2YgZXhpc3RpbmcgdmVydGljZXNcblx0XHRcdGRlbGV0ZUNvbmRpdGlvbjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0cmV0dXJuIG9sLmV2ZW50cy5jb25kaXRpb24uc2hpZnRLZXlPbmx5KGV2ZW50KSAmJiBvbC5ldmVudHMuY29uZGl0aW9uLnNpbmdsZUNsaWNrKGV2ZW50KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIGRyYXdpbmcgaW50ZXJhY3Rpb25cblx0XHR2YXIgZHJhdztcblxuICAgICAgICAvLyBpbmRleCBvZiB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGFubm90YXRpb24gKGR1cmluZyBjeWNsaW5nIHRocm91Z2ggYW5ub3RhdGlvbnMpXG4gICAgICAgIC8vIGluIHRoZSBhbm5vdGF0aW9uRmVhdHVyZXMgY29sbGVjdGlvblxuICAgICAgICB2YXIgY3VycmVudEFubm90YXRpb24gPSAwO1xuXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgdmFyIHNlbGVjdEFuZFNob3dBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcbiAgICAgICAgICAgIF90aGlzLmNsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICBpZiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkRmVhdHVyZXMucHVzaChhbm5vdGF0aW9uKTtcbiAgICAgICAgICAgICAgICBtYXAuZ2V0VmlldygpLmZpdChhbm5vdGF0aW9uLmdldEdlb21ldHJ5KCksIG1hcC5nZXRTaXplKCksIHtcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogWzUwLCA1MCwgNTAsIDUwXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG5cdFx0Ly8gY29udmVydCBhIHBvaW50IGFycmF5IHRvIGEgcG9pbnQgb2JqZWN0XG5cdFx0Ly8gcmUtaW52ZXJ0IHRoZSB5IGF4aXNcblx0XHR2YXIgY29udmVydEZyb21PTFBvaW50ID0gZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRyZXR1cm4ge3g6IHBvaW50WzBdLCB5OiBpbWFnZXMuY3VycmVudEltYWdlLmhlaWdodCAtIHBvaW50WzFdfTtcblx0XHR9O1xuXG5cdFx0Ly8gY29udmVydCBhIHBvaW50IG9iamVjdCB0byBhIHBvaW50IGFycmF5XG5cdFx0Ly8gaW52ZXJ0IHRoZSB5IGF4aXNcblx0XHR2YXIgY29udmVydFRvT0xQb2ludCA9IGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdFx0cmV0dXJuIFtwb2ludC54LCBpbWFnZXMuY3VycmVudEltYWdlLmhlaWdodCAtIHBvaW50LnldO1xuXHRcdH07XG5cblx0XHQvLyBhc3NlbWJsZXMgdGhlIGNvb3JkaW5hdGUgYXJyYXlzIGRlcGVuZGluZyBvbiB0aGUgZ2VvbWV0cnkgdHlwZVxuXHRcdC8vIHNvIHRoZXkgaGF2ZSBhIHVuaWZpZWQgZm9ybWF0XG5cdFx0dmFyIGdldENvb3JkaW5hdGVzID0gZnVuY3Rpb24gKGdlb21ldHJ5KSB7XG5cdFx0XHRzd2l0Y2ggKGdlb21ldHJ5LmdldFR5cGUoKSkge1xuXHRcdFx0XHRjYXNlICdDaXJjbGUnOlxuXHRcdFx0XHRcdC8vIHJhZGl1cyBpcyB0aGUgeCB2YWx1ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjaXJjbGVcblx0XHRcdFx0XHRyZXR1cm4gW2dlb21ldHJ5LmdldENlbnRlcigpLCBbZ2VvbWV0cnkuZ2V0UmFkaXVzKCksIDBdXTtcblx0XHRcdFx0Y2FzZSAnUG9seWdvbic6XG5cdFx0XHRcdGNhc2UgJ1JlY3RhbmdsZSc6XG5cdFx0XHRcdFx0cmV0dXJuIGdlb21ldHJ5LmdldENvb3JkaW5hdGVzKClbMF07XG5cdFx0XHRcdGNhc2UgJ1BvaW50Jzpcblx0XHRcdFx0XHRyZXR1cm4gW2dlb21ldHJ5LmdldENvb3JkaW5hdGVzKCldO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdHJldHVybiBnZW9tZXRyeS5nZXRDb29yZGluYXRlcygpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBzYXZlcyB0aGUgdXBkYXRlZCBnZW9tZXRyeSBvZiBhbiBhbm5vdGF0aW9uIGZlYXR1cmVcblx0XHR2YXIgaGFuZGxlR2VvbWV0cnlDaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIGZlYXR1cmUgPSBlLnRhcmdldDtcblx0XHRcdHZhciBzYXZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR2YXIgY29vcmRpbmF0ZXMgPSBnZXRDb29yZGluYXRlcyhmZWF0dXJlLmdldEdlb21ldHJ5KCkpO1xuXHRcdFx0XHRmZWF0dXJlLmFubm90YXRpb24ucG9pbnRzID0gY29vcmRpbmF0ZXMubWFwKGNvbnZlcnRGcm9tT0xQb2ludCk7XG5cdFx0XHRcdGZlYXR1cmUuYW5ub3RhdGlvbi4kc2F2ZSgpO1xuXHRcdFx0fTtcblx0XHRcdC8vIHRoaXMgZXZlbnQgaXMgcmFwaWRseSBmaXJlZCwgc28gd2FpdCB1bnRpbCB0aGUgZmlyaW5nIHN0b3BzXG5cdFx0XHQvLyBiZWZvcmUgc2F2aW5nIHRoZSBjaGFuZ2VzXG5cdFx0XHRkZWJvdW5jZShzYXZlLCA1MDAsIGZlYXR1cmUuYW5ub3RhdGlvbi5pZCk7XG5cdFx0fTtcblxuXHRcdHZhciBjcmVhdGVGZWF0dXJlID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdHZhciBnZW9tZXRyeTtcblx0XHRcdHZhciBwb2ludHMgPSBhbm5vdGF0aW9uLnBvaW50cy5tYXAoY29udmVydFRvT0xQb2ludCk7XG5cblx0XHRcdHN3aXRjaCAoYW5ub3RhdGlvbi5zaGFwZSkge1xuXHRcdFx0XHRjYXNlICdQb2ludCc6XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5Qb2ludChwb2ludHNbMF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdSZWN0YW5nbGUnOlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uUmVjdGFuZ2xlKFsgcG9pbnRzIF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdQb2x5Z29uJzpcblx0XHRcdFx0XHQvLyBleGFtcGxlOiBodHRwczovL2dpdGh1Yi5jb20vb3BlbmxheWVycy9vbDMvYmxvYi9tYXN0ZXIvZXhhbXBsZXMvZ2VvanNvbi5qcyNMMTI2XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5Qb2x5Z29uKFsgcG9pbnRzIF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdMaW5lU3RyaW5nJzpcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLkxpbmVTdHJpbmcocG9pbnRzKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnQ2lyY2xlJzpcblx0XHRcdFx0XHQvLyByYWRpdXMgaXMgdGhlIHggdmFsdWUgb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY2lyY2xlXG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5DaXJjbGUocG9pbnRzWzBdLCBwb2ludHNbMV1bMF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIHVuc3VwcG9ydGVkIHNoYXBlcyBhcmUgaWdub3JlZFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Vua25vd24gYW5ub3RhdGlvbiBzaGFwZTogJyArIGFubm90YXRpb24uc2hhcGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciBmZWF0dXJlID0gbmV3IG9sLkZlYXR1cmUoeyBnZW9tZXRyeTogZ2VvbWV0cnkgfSk7XG4gICAgICAgICAgICBmZWF0dXJlLmFubm90YXRpb24gPSBhbm5vdGF0aW9uO1xuICAgICAgICAgICAgaWYgKGFubm90YXRpb24ubGFiZWxzICYmIGFubm90YXRpb24ubGFiZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlLmNvbG9yID0gYW5ub3RhdGlvbi5sYWJlbHNbMF0ubGFiZWwuY29sb3I7XG4gICAgICAgICAgICB9XG5cdFx0XHRmZWF0dXJlLm9uKCdjaGFuZ2UnLCBoYW5kbGVHZW9tZXRyeUNoYW5nZSk7XG4gICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLmFkZEZlYXR1cmUoZmVhdHVyZSk7XG5cdFx0fTtcblxuXHRcdHZhciByZWZyZXNoQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoZSwgaW1hZ2UpIHtcblx0XHRcdC8vIGNsZWFyIGZlYXR1cmVzIG9mIHByZXZpb3VzIGltYWdlXG4gICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLmNsZWFyKCk7XG5cdFx0XHRfdGhpcy5jbGVhclNlbGVjdGlvbigpO1xuXG5cdFx0XHRhbm5vdGF0aW9ucy5xdWVyeSh7aWQ6IGltYWdlLl9pZH0pLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRhbm5vdGF0aW9ucy5mb3JFYWNoKGNyZWF0ZUZlYXR1cmUpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHZhciBoYW5kbGVOZXdGZWF0dXJlID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciBnZW9tZXRyeSA9IGUuZmVhdHVyZS5nZXRHZW9tZXRyeSgpO1xuXHRcdFx0dmFyIGNvb3JkaW5hdGVzID0gZ2V0Q29vcmRpbmF0ZXMoZ2VvbWV0cnkpO1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkKCk7XG5cbiAgICAgICAgICAgIGUuZmVhdHVyZS5jb2xvciA9IGxhYmVsLmNvbG9yO1xuXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbiA9IGFubm90YXRpb25zLmFkZCh7XG5cdFx0XHRcdGlkOiBpbWFnZXMuZ2V0Q3VycmVudElkKCksXG5cdFx0XHRcdHNoYXBlOiBnZW9tZXRyeS5nZXRUeXBlKCksXG5cdFx0XHRcdHBvaW50czogY29vcmRpbmF0ZXMubWFwKGNvbnZlcnRGcm9tT0xQb2ludCksXG4gICAgICAgICAgICAgICAgbGFiZWxfaWQ6IGxhYmVsLmlkLFxuICAgICAgICAgICAgICAgIGNvbmZpZGVuY2U6IGxhYmVscy5nZXRDdXJyZW50Q29uZmlkZW5jZSgpXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gaWYgdGhlIGZlYXR1cmUgY291bGRuJ3QgYmUgc2F2ZWQsIHJlbW92ZSBpdCBhZ2FpblxuXHRcdFx0ZS5mZWF0dXJlLmFubm90YXRpb24uJHByb21pc2UuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UucmVtb3ZlRmVhdHVyZShlLmZlYXR1cmUpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGUuZmVhdHVyZS5vbignY2hhbmdlJywgaGFuZGxlR2VvbWV0cnlDaGFuZ2UpO1xuXG4gICAgICAgICAgICByZXR1cm4gZS5mZWF0dXJlLmFubm90YXRpb24uJHByb21pc2U7XG5cdFx0fTtcblxuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgbWFwLmFkZExheWVyKGFubm90YXRpb25MYXllcik7XG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24oc2VsZWN0KTtcblx0XHRcdHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCByZWZyZXNoQW5ub3RhdGlvbnMpO1xuXG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLm9uKCdjaGFuZ2U6bGVuZ3RoJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyBpZiBub3QgYWxyZWFkeSBkaWdlc3RpbmcsIGRpZ2VzdFxuXHRcdFx0XHRpZiAoIXNjb3BlLiQkcGhhc2UpIHtcblx0XHRcdFx0XHQvLyBwcm9wYWdhdGUgbmV3IHNlbGVjdGlvbnMgdGhyb3VnaCB0aGUgYW5ndWxhciBhcHBsaWNhdGlvblxuXHRcdFx0XHRcdHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5zdGFydERyYXdpbmcgPSBmdW5jdGlvbiAodHlwZSkge1xuICAgICAgICAgICAgc2VsZWN0LnNldEFjdGl2ZShmYWxzZSk7XG5cblx0XHRcdHR5cGUgPSB0eXBlIHx8ICdQb2ludCc7XG5cdFx0XHRkcmF3ID0gbmV3IG9sLmludGVyYWN0aW9uLkRyYXcoe1xuICAgICAgICAgICAgICAgIHNvdXJjZTogYW5ub3RhdGlvblNvdXJjZSxcblx0XHRcdFx0dHlwZTogdHlwZSxcblx0XHRcdFx0c3R5bGU6IHN0eWxlcy5lZGl0aW5nXG5cdFx0XHR9KTtcblxuXHRcdFx0bWFwLmFkZEludGVyYWN0aW9uKG1vZGlmeSk7XG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24oZHJhdyk7XG5cdFx0XHRkcmF3Lm9uKCdkcmF3ZW5kJywgaGFuZGxlTmV3RmVhdHVyZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZmluaXNoRHJhd2luZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdG1hcC5yZW1vdmVJbnRlcmFjdGlvbihkcmF3KTtcblx0XHRcdG1hcC5yZW1vdmVJbnRlcmFjdGlvbihtb2RpZnkpO1xuICAgICAgICAgICAgc2VsZWN0LnNldEFjdGl2ZSh0cnVlKTtcblx0XHRcdC8vIGRvbid0IHNlbGVjdCB0aGUgbGFzdCBkcmF3biBwb2ludFxuXHRcdFx0X3RoaXMuY2xlYXJTZWxlY3Rpb24oKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5kZWxldGVTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoZmVhdHVyZSkge1xuXHRcdFx0XHRhbm5vdGF0aW9ucy5kZWxldGUoZmVhdHVyZS5hbm5vdGF0aW9uKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRhbm5vdGF0aW9uU291cmNlLnJlbW92ZUZlYXR1cmUoZmVhdHVyZSk7XG5cdFx0XHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5yZW1vdmUoZmVhdHVyZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuc2VsZWN0ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgZmVhdHVyZTtcblx0XHRcdGFubm90YXRpb25Tb3VyY2UuZm9yRWFjaEZlYXR1cmUoZnVuY3Rpb24gKGYpIHtcblx0XHRcdFx0aWYgKGYuYW5ub3RhdGlvbi5pZCA9PT0gaWQpIHtcblx0XHRcdFx0XHRmZWF0dXJlID0gZjtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyByZW1vdmUgc2VsZWN0aW9uIGlmIGZlYXR1cmUgd2FzIGFscmVhZHkgc2VsZWN0ZWQuIG90aGVyd2lzZSBzZWxlY3QuXG5cdFx0XHRpZiAoIXNlbGVjdGVkRmVhdHVyZXMucmVtb3ZlKGZlYXR1cmUpKSB7XG5cdFx0XHRcdHNlbGVjdGVkRmVhdHVyZXMucHVzaChmZWF0dXJlKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIC8vIGZpdHMgdGhlIHZpZXcgdG8gdGhlIGdpdmVuIGZlYXR1cmVcbiAgICAgICAgdGhpcy5maXQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuZm9yRWFjaEZlYXR1cmUoZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgICAgICAgICBpZiAoZi5hbm5vdGF0aW9uLmlkID09PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBhbmltYXRlIGZpdFxuICAgICAgICAgICAgICAgICAgICB2YXIgdmlldyA9IG1hcC5nZXRWaWV3KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYW4gPSBvbC5hbmltYXRpb24ucGFuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogdmlldy5nZXRDZW50ZXIoKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHpvb20gPSBvbC5hbmltYXRpb24uem9vbSh7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHV0aW9uOiB2aWV3LmdldFJlc29sdXRpb24oKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgbWFwLmJlZm9yZVJlbmRlcihwYW4sIHpvb20pO1xuICAgICAgICAgICAgICAgICAgICB2aWV3LmZpdChmLmdldEdlb21ldHJ5KCksIG1hcC5nZXRTaXplKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG5cdFx0dGhpcy5jbGVhclNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuY2xlYXIoKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRTZWxlY3RlZEZlYXR1cmVzID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHNlbGVjdGVkRmVhdHVyZXM7XG5cdFx0fTtcblxuICAgICAgICAvLyBtYW51YWxseSBhZGQgYSBuZXcgZmVhdHVyZSAobm90IHRocm91Z2ggdGhlIGRyYXcgaW50ZXJhY3Rpb24pXG4gICAgICAgIHRoaXMuYWRkRmVhdHVyZSA9IGZ1bmN0aW9uIChmZWF0dXJlKSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLmFkZEZlYXR1cmUoZmVhdHVyZSk7XG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlTmV3RmVhdHVyZSh7ZmVhdHVyZTogZmVhdHVyZX0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2V0T3BhY2l0eSA9IGZ1bmN0aW9uIChvcGFjaXR5KSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9uTGF5ZXIuc2V0T3BhY2l0eShvcGFjaXR5KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmN5Y2xlTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGN1cnJlbnRBbm5vdGF0aW9uID0gKGN1cnJlbnRBbm5vdGF0aW9uICsgMSkgJSBhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCk7XG4gICAgICAgICAgICBfdGhpcy5qdW1wVG9DdXJyZW50KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNOZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIChjdXJyZW50QW5ub3RhdGlvbiArIDEpIDwgYW5ub3RhdGlvbkZlYXR1cmVzLmdldExlbmd0aCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuY3ljbGVQcmV2aW91cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIHdlIHdhbnQgbm8gbmVnYXRpdmUgaW5kZXggaGVyZVxuICAgICAgICAgICAgY3VycmVudEFubm90YXRpb24gPSAoY3VycmVudEFubm90YXRpb24gKyBhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCkgLSAxKSAlIGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKTtcbiAgICAgICAgICAgIF90aGlzLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc1ByZXZpb3VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRBbm5vdGF0aW9uID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmp1bXBUb0N1cnJlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBvbmx5IGp1bXAgb25jZSB0aGUgYW5ub3RhdGlvbnMgd2VyZSBsb2FkZWRcbiAgICAgICAgICAgIGFubm90YXRpb25zLmdldFByb21pc2UoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RBbmRTaG93QW5ub3RhdGlvbihhbm5vdGF0aW9uRmVhdHVyZXMuaXRlbShjdXJyZW50QW5ub3RhdGlvbikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5qdW1wVG9GaXJzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGN1cnJlbnRBbm5vdGF0aW9uID0gMDtcbiAgICAgICAgICAgIF90aGlzLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmp1bXBUb0xhc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9ucy5nZXRQcm9taXNlKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gd2FpdCBmb3IgdGhlIG5ldyBhbm5vdGF0aW9ucyB0byBiZSBsb2FkZWRcbiAgICAgICAgICAgICAgICBpZiAoYW5ub3RhdGlvbkZlYXR1cmVzLmdldExlbmd0aCgpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRBbm5vdGF0aW9uID0gYW5ub3RhdGlvbkZlYXR1cmVzLmdldExlbmd0aCgpIC0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX3RoaXMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZmxpY2tlciB0aGUgaGlnaGxpZ2h0ZWQgYW5ub3RhdGlvbiB0byBzaWduYWwgYW4gZXJyb3JcbiAgICAgICAgdGhpcy5mbGlja2VyID0gZnVuY3Rpb24gKGNvdW50KSB7XG4gICAgICAgICAgICB2YXIgYW5ub3RhdGlvbiA9IHNlbGVjdGVkRmVhdHVyZXMuaXRlbSgwKTtcbiAgICAgICAgICAgIGlmICghYW5ub3RhdGlvbikgcmV0dXJuO1xuICAgICAgICAgICAgY291bnQgPSBjb3VudCB8fCAzO1xuXG4gICAgICAgICAgICB2YXIgdG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZEZlYXR1cmVzLmdldExlbmd0aCgpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZEZlYXR1cmVzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRGZWF0dXJlcy5wdXNoKGFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBudW1iZXIgb2YgcmVwZWF0cyBtdXN0IGJlIGV2ZW4sIG90aGVyd2lzZSB0aGUgbGF5ZXIgd291bGQgc3RheSBvbnZpc2libGVcbiAgICAgICAgICAgICRpbnRlcnZhbCh0b2dnbGUsIDEwMCwgY291bnQgKiAyKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEN1cnJlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYW5ub3RhdGlvbkZlYXR1cmVzLml0ZW0oY3VycmVudEFubm90YXRpb24pLmFubm90YXRpb247XG4gICAgICAgIH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG1hcEltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBoYW5kbGluZyB0aGUgaW1hZ2UgbGF5ZXIgb24gdGhlIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnbWFwSW1hZ2UnLCBmdW5jdGlvbiAobWFwKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cdFx0dmFyIGV4dGVudCA9IFswLCAwLCAwLCAwXTtcblxuXHRcdHZhciBwcm9qZWN0aW9uID0gbmV3IG9sLnByb2ouUHJvamVjdGlvbih7XG5cdFx0XHRjb2RlOiAnZGlhcy1pbWFnZScsXG5cdFx0XHR1bml0czogJ3BpeGVscycsXG5cdFx0XHRleHRlbnQ6IGV4dGVudFxuXHRcdH0pO1xuXG5cdFx0dmFyIGltYWdlTGF5ZXIgPSBuZXcgb2wubGF5ZXIuSW1hZ2UoKTtcblxuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uIChzY29wZSkge1xuXHRcdFx0bWFwLmFkZExheWVyKGltYWdlTGF5ZXIpO1xuXG5cdFx0XHQvLyByZWZyZXNoIHRoZSBpbWFnZSBzb3VyY2Vcblx0XHRcdHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCBmdW5jdGlvbiAoZSwgaW1hZ2UpIHtcblx0XHRcdFx0ZXh0ZW50WzJdID0gaW1hZ2Uud2lkdGg7XG5cdFx0XHRcdGV4dGVudFszXSA9IGltYWdlLmhlaWdodDtcblxuXHRcdFx0XHR2YXIgem9vbSA9IHNjb3BlLnZpZXdwb3J0Lnpvb207XG5cblx0XHRcdFx0dmFyIGNlbnRlciA9IHNjb3BlLnZpZXdwb3J0LmNlbnRlcjtcblx0XHRcdFx0Ly8gdmlld3BvcnQgY2VudGVyIGlzIHN0aWxsIHVuaW5pdGlhbGl6ZWRcblx0XHRcdFx0aWYgKGNlbnRlclswXSA9PT0gdW5kZWZpbmVkICYmIGNlbnRlclsxXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0Y2VudGVyID0gb2wuZXh0ZW50LmdldENlbnRlcihleHRlbnQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGltYWdlU3RhdGljID0gbmV3IG9sLnNvdXJjZS5JbWFnZVN0YXRpYyh7XG5cdFx0XHRcdFx0dXJsOiBpbWFnZS5zcmMsXG5cdFx0XHRcdFx0cHJvamVjdGlvbjogcHJvamVjdGlvbixcblx0XHRcdFx0XHRpbWFnZUV4dGVudDogZXh0ZW50XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGltYWdlTGF5ZXIuc2V0U291cmNlKGltYWdlU3RhdGljKTtcblxuXHRcdFx0XHRtYXAuc2V0VmlldyhuZXcgb2wuVmlldyh7XG5cdFx0XHRcdFx0cHJvamVjdGlvbjogcHJvamVjdGlvbixcblx0XHRcdFx0XHRjZW50ZXI6IGNlbnRlcixcblx0XHRcdFx0XHR6b29tOiB6b29tLFxuXHRcdFx0XHRcdHpvb21GYWN0b3I6IDEuNSxcblx0XHRcdFx0XHQvLyBhbGxvdyBhIG1heGltdW0gb2YgNHggbWFnbmlmaWNhdGlvblxuXHRcdFx0XHRcdG1pblJlc29sdXRpb246IDAuMjUsXG5cdFx0XHRcdFx0Ly8gcmVzdHJpY3QgbW92ZW1lbnRcblx0XHRcdFx0XHRleHRlbnQ6IGV4dGVudFxuXHRcdFx0XHR9KSk7XG5cblx0XHRcdFx0Ly8gaWYgem9vbSBpcyBub3QgaW5pdGlhbGl6ZWQsIGZpdCB0aGUgdmlldyB0byB0aGUgaW1hZ2UgZXh0ZW50XG5cdFx0XHRcdGlmICh6b29tID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRtYXAuZ2V0VmlldygpLmZpdChleHRlbnQsIG1hcC5nZXRTaXplKCkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRFeHRlbnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gZXh0ZW50O1xuXHRcdH07XG5cblx0XHR0aGlzLmdldFByb2plY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gcHJvamVjdGlvbjtcblx0XHR9O1xuXG4gICAgICAgIHRoaXMuZ2V0TGF5ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VMYXllcjtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgc3R5bGVzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgdGhlIE9wZW5MYXllcnMgc3R5bGVzXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnc3R5bGVzJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHRoaXMuY29sb3JzID0ge1xuICAgICAgICAgICAgd2hpdGU6IFsyNTUsIDI1NSwgMjU1LCAxXSxcbiAgICAgICAgICAgIGJsdWU6IFswLCAxNTMsIDI1NSwgMV0sXG4gICAgICAgICAgICBvcmFuZ2U6ICcjZmY1ZTAwJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBkZWZhdWx0Q2lyY2xlUmFkaXVzID0gNjtcbiAgICAgICAgdmFyIGRlZmF1bHRTdHJva2VXaWR0aCA9IDM7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRTdHJva2VPdXRsaW5lID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICB3aWR0aDogNVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRTdHJva2VPdXRsaW5lID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICB3aWR0aDogNlxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZGVmYXVsdFN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLmJsdWUsXG4gICAgICAgICAgICB3aWR0aDogZGVmYXVsdFN0cm9rZVdpZHRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZFN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLm9yYW5nZSxcbiAgICAgICAgICAgIHdpZHRoOiBkZWZhdWx0U3Ryb2tlV2lkdGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRDaXJjbGVGaWxsID0gbmV3IG9sLnN0eWxlLkZpbGwoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLmJsdWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkQ2lyY2xlRmlsbCA9IG5ldyBvbC5zdHlsZS5GaWxsKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5vcmFuZ2VcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRDaXJjbGVTdHJva2UgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcbiAgICAgICAgICAgIHdpZHRoOiAyXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZENpcmNsZVN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgd2lkdGg6IGRlZmF1bHRTdHJva2VXaWR0aFxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZWRpdGluZ0NpcmNsZVN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgd2lkdGg6IDIsXG4gICAgICAgICAgICBsaW5lRGFzaDogWzNdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBlZGl0aW5nU3Ryb2tlID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMuYmx1ZSxcbiAgICAgICAgICAgIHdpZHRoOiBkZWZhdWx0U3Ryb2tlV2lkdGgsXG4gICAgICAgICAgICBsaW5lRGFzaDogWzVdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBkZWZhdWx0RmlsbCA9IG5ldyBvbC5zdHlsZS5GaWxsKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZEZpbGwgPSBuZXcgb2wuc3R5bGUuRmlsbCh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMub3JhbmdlXG4gICAgICAgIH0pO1xuXG5cdFx0dGhpcy5mZWF0dXJlcyA9IGZ1bmN0aW9uIChmZWF0dXJlKSB7XG4gICAgICAgICAgICB2YXIgY29sb3IgPSBmZWF0dXJlLmNvbG9yID8gKCcjJyArIGZlYXR1cmUuY29sb3IpIDogdGhpcy5jb2xvcnMuYmx1ZTtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgbmV3IG9sLnN0eWxlLlN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOiBkZWZhdWx0U3Ryb2tlT3V0bGluZSxcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmFkaXVzOiBkZWZhdWx0Q2lyY2xlUmFkaXVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDogbmV3IG9sLnN0eWxlLkZpbGwoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBjb2xvclxuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJva2U6IGRlZmF1bHRDaXJjbGVTdHJva2VcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgb2wuc3R5bGUuU3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICBzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGNvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDNcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgXTtcbiAgICAgICAgfTtcblxuXHRcdHRoaXMuaGlnaGxpZ2h0ID0gW1xuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBzZWxlY3RlZFN0cm9rZU91dGxpbmUsXG5cdFx0XHRcdGltYWdlOiBuZXcgb2wuc3R5bGUuQ2lyY2xlKHtcblx0XHRcdFx0XHRyYWRpdXM6IGRlZmF1bHRDaXJjbGVSYWRpdXMsXG5cdFx0XHRcdFx0ZmlsbDogc2VsZWN0ZWRDaXJjbGVGaWxsLFxuXHRcdFx0XHRcdHN0cm9rZTogc2VsZWN0ZWRDaXJjbGVTdHJva2Vcblx0XHRcdFx0fSksXG4gICAgICAgICAgICAgICAgekluZGV4OiAyMDBcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBzZWxlY3RlZFN0cm9rZSxcbiAgICAgICAgICAgICAgICB6SW5kZXg6IDIwMFxuXHRcdFx0fSlcblx0XHRdO1xuXG5cdFx0dGhpcy5lZGl0aW5nID0gW1xuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBkZWZhdWx0U3Ryb2tlT3V0bGluZSxcblx0XHRcdFx0aW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0XHRcdHJhZGl1czogZGVmYXVsdENpcmNsZVJhZGl1cyxcblx0XHRcdFx0XHRmaWxsOiBkZWZhdWx0Q2lyY2xlRmlsbCxcblx0XHRcdFx0XHRzdHJva2U6IGVkaXRpbmdDaXJjbGVTdHJva2Vcblx0XHRcdFx0fSlcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBlZGl0aW5nU3Ryb2tlXG5cdFx0XHR9KVxuXHRcdF07XG5cblx0XHR0aGlzLnZpZXdwb3J0ID0gW1xuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBkZWZhdWx0U3Ryb2tlLFxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxXG4gICAgICAgICAgICAgICAgfSlcblx0XHRcdH0pXG5cdFx0XTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgdXJsUGFyYW1zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFRoZSBHRVQgcGFyYW1ldGVycyBvZiB0aGUgdXJsLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ3VybFBhcmFtcycsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBzdGF0ZSA9IHt9O1xuXG5cdFx0Ly8gdHJhbnNmb3JtcyBhIFVSTCBwYXJhbWV0ZXIgc3RyaW5nIGxpa2UgI2E9MSZiPTIgdG8gYW4gb2JqZWN0XG5cdFx0dmFyIGRlY29kZVN0YXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHBhcmFtcyA9IGxvY2F0aW9uLmhhc2gucmVwbGFjZSgnIycsICcnKVxuXHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJyYnKTtcblxuXHRcdFx0dmFyIHN0YXRlID0ge307XG5cblx0XHRcdHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJhbSkge1xuXHRcdFx0XHQvLyBjYXB0dXJlIGtleS12YWx1ZSBwYWlyc1xuXHRcdFx0XHR2YXIgY2FwdHVyZSA9IHBhcmFtLm1hdGNoKC8oLispXFw9KC4rKS8pO1xuXHRcdFx0XHRpZiAoY2FwdHVyZSAmJiBjYXB0dXJlLmxlbmd0aCA9PT0gMykge1xuXHRcdFx0XHRcdHN0YXRlW2NhcHR1cmVbMV1dID0gZGVjb2RlVVJJQ29tcG9uZW50KGNhcHR1cmVbMl0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHN0YXRlO1xuXHRcdH07XG5cblx0XHQvLyB0cmFuc2Zvcm1zIGFuIG9iamVjdCB0byBhIFVSTCBwYXJhbWV0ZXIgc3RyaW5nXG5cdFx0dmFyIGVuY29kZVN0YXRlID0gZnVuY3Rpb24gKHN0YXRlKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gJyc7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gc3RhdGUpIHtcblx0XHRcdFx0cGFyYW1zICs9IGtleSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChzdGF0ZVtrZXldKSArICcmJztcblx0XHRcdH1cblx0XHRcdHJldHVybiBwYXJhbXMuc3Vic3RyaW5nKDAsIHBhcmFtcy5sZW5ndGggLSAxKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5wdXNoU3RhdGUgPSBmdW5jdGlvbiAocykge1xuXHRcdFx0c3RhdGUuc2x1ZyA9IHM7XG5cdFx0XHRoaXN0b3J5LnB1c2hTdGF0ZShzdGF0ZSwgJycsIHN0YXRlLnNsdWcgKyAnIycgKyBlbmNvZGVTdGF0ZShzdGF0ZSkpO1xuXHRcdH07XG5cblx0XHQvLyBzZXRzIGEgVVJMIHBhcmFtZXRlciBhbmQgdXBkYXRlcyB0aGUgaGlzdG9yeSBzdGF0ZVxuXHRcdHRoaXMuc2V0ID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIHBhcmFtcykge1xuXHRcdFx0XHRzdGF0ZVtrZXldID0gcGFyYW1zW2tleV07XG5cdFx0XHR9XG5cdFx0XHRoaXN0b3J5LnJlcGxhY2VTdGF0ZShzdGF0ZSwgJycsIHN0YXRlLnNsdWcgKyAnIycgKyBlbmNvZGVTdGF0ZShzdGF0ZSkpO1xuXHRcdH07XG5cblx0XHQvLyByZXR1cm5zIGEgVVJMIHBhcmFtZXRlclxuXHRcdHRoaXMuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuXHRcdFx0cmV0dXJuIHN0YXRlW2tleV07XG5cdFx0fTtcblxuXHRcdHN0YXRlID0gaGlzdG9yeS5zdGF0ZTtcblxuXHRcdGlmICghc3RhdGUpIHtcblx0XHRcdHN0YXRlID0gZGVjb2RlU3RhdGUoKTtcblx0XHR9XG5cdH1cbik7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9