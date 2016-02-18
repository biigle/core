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
 * @name SidebarCategoryFoldoutController
 * @memberOf dias.annotations
 * @description Controller for the sidebar category foldout button
 */
angular.module('dias.annotations').controller('SidebarCategoryFoldoutController', ["$scope", "keyboard", function ($scope, keyboard) {
		"use strict";

        keyboard.on(9, function (e) {
            e.preventDefault();
            $scope.toggleFoldout('categories');
            $scope.$apply();
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
angular.module('dias.annotations').controller('SidebarController', ["$scope", "$rootScope", function ($scope, $rootScope) {
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

        $rootScope.$on('sidebar.foldout.do-open', function (e, name) {
            $scope.openFoldout(name);
        });

        // the currently opened sidebar-'extension' is remembered through localStorage
        if (window.localStorage[foldoutStorageKey]) {
            $scope.openFoldout(window.localStorage[foldoutStorageKey]);
        }
	}]
);

/**
 * @namespace dias.annotations
 * @ngdoc controller
 * @name SidebarDeleteSelectedAnnotationsController
 * @memberOf dias.annotations
 * @description Controller for the sidebar category foldout button
 */
angular.module('dias.annotations').controller('SidebarDeleteSelectedAnnotationsController', ["$scope", "keyboard", "mapAnnotations", function ($scope, keyboard, mapAnnotations) {
		"use strict";

        $scope.deleteSelectedAnnotations = function () {
            if (mapAnnotations.getSelectedFeatures().getLength() > 0 && confirm('Are you sure you want to delete all selected annotations?')) {
                mapAnnotations.deleteSelected();
            }
        };

        keyboard.on(46, function (e) {
            $scope.deleteSelectedAnnotations();
            $scope.$apply();
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
                return AnnotationLabel.delete({id: label.id}, function () {
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
        var currentAnnotationIndex = 0;

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
            currentAnnotationIndex = (currentAnnotationIndex + 1) % annotationFeatures.getLength();
            _this.jumpToCurrent();
        };

        this.hasNext = function () {
            return (currentAnnotationIndex + 1) < annotationFeatures.getLength();
        };

        this.cyclePrevious = function () {
            // we want no negative index here
            currentAnnotationIndex = (currentAnnotationIndex + annotationFeatures.getLength() - 1) % annotationFeatures.getLength();
            _this.jumpToCurrent();
        };

        this.hasPrevious = function () {
            return currentAnnotationIndex > 0;
        };

        this.jumpToCurrent = function () {
            // only jump once the annotations were loaded
            annotations.getPromise().then(function () {
                selectAndShowAnnotation(annotationFeatures.item(currentAnnotationIndex));
            });
        };

        this.jumpToFirst = function () {
            currentAnnotationIndex = 0;
            _this.jumpToCurrent();
        };

        this.jumpToLast = function () {
            annotations.getPromise().then(function () {
                // wait for the new annotations to be loaded
                if (annotationFeatures.getLength() !== 0) {
                    currentAnnotationIndex = annotationFeatures.getLength() - 1;
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
            return annotationFeatures.item(currentAnnotationIndex).annotation;
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

        var _this = this;

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
            var color = feature.color ? ('#' + feature.color) : _this.colors.blue;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0N5Y2xpbmdDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQW5ub3RhdG9yQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NhbnZhc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9DYXRlZ29yaWVzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NvbmZpZGVuY2VDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ29udHJvbHNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvTWluaW1hcENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TZWxlY3RlZExhYmVsQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NldHRpbmdzQW5ub3RhdGlvbk9wYWNpdHlDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2V0dGluZ3NDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2lkZWJhckNhdGVnb3J5Rm9sZG91dENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TaWRlYmFyQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NpZGViYXJEZWxldGVTZWxlY3RlZEFubm90YXRpb25zQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvYW5ub3RhdGlvbkxpc3RJdGVtLmpzIiwiZGlyZWN0aXZlcy9sYWJlbENhdGVnb3J5SXRlbS5qcyIsImRpcmVjdGl2ZXMvbGFiZWxJdGVtLmpzIiwiZmFjdG9yaWVzL2RlYm91bmNlLmpzIiwiZmFjdG9yaWVzL21hcC5qcyIsInNlcnZpY2VzL2Fubm90YXRpb25zLmpzIiwic2VydmljZXMvaW1hZ2VzLmpzIiwic2VydmljZXMva2V5Ym9hcmQuanMiLCJzZXJ2aWNlcy9sYWJlbHMuanMiLCJzZXJ2aWNlcy9tYXBBbm5vdGF0aW9ucy5qcyIsInNlcnZpY2VzL21hcEltYWdlLmpzIiwic2Vydmlj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QUFBO0lBQ0EsZUFBQSxhQUFBO0lBQ0EsVUFBQTs7Ozs7UUFLQSxTQUFBLEdBQUEsSUFBQSxZQUFBO1lBQ0EsT0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxLQUFBLFlBQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsT0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxLQUFBLFlBQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBOzs7Ozs7Ozs7Ozs7QUNwREEsUUFBQSxPQUFBLG9CQUFBLFdBQUEseUVBQUEsVUFBQSxRQUFBLEtBQUEsVUFBQSxVQUFBLFFBQUE7RUFDQTs7UUFFQSxJQUFBLGlCQUFBLElBQUEsR0FBQSxPQUFBOztFQUVBLElBQUEsVUFBQSxJQUFBLEdBQUEsSUFBQTtHQUNBLFFBQUE7O0dBRUEsVUFBQTs7R0FFQSxjQUFBOzs7UUFHQSxJQUFBLFVBQUEsSUFBQTtRQUNBLElBQUEsVUFBQSxJQUFBOzs7RUFHQSxRQUFBLFNBQUEsU0FBQTtRQUNBLFFBQUEsU0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsUUFBQTtZQUNBLE9BQUEsT0FBQTs7O0VBR0EsSUFBQSxXQUFBLElBQUEsR0FBQTtFQUNBLGVBQUEsV0FBQTs7O0VBR0EsT0FBQSxJQUFBLGVBQUEsWUFBQTtHQUNBLFFBQUEsUUFBQSxJQUFBLEdBQUEsS0FBQTtJQUNBLFlBQUEsU0FBQTtJQUNBLFFBQUEsR0FBQSxPQUFBLFVBQUEsU0FBQTtJQUNBLE1BQUE7Ozs7O0VBS0EsSUFBQSxrQkFBQSxZQUFBO0dBQ0EsU0FBQSxZQUFBLEdBQUEsS0FBQSxRQUFBLFdBQUEsUUFBQSxnQkFBQTs7O1FBR0EsSUFBQSxHQUFBLGVBQUEsWUFBQTtZQUNBLFVBQUEsSUFBQTs7O1FBR0EsSUFBQSxHQUFBLGVBQUEsWUFBQTtZQUNBLFVBQUEsSUFBQTs7O0VBR0EsSUFBQSxHQUFBLGVBQUE7O0VBRUEsSUFBQSxlQUFBLFVBQUEsR0FBQTtHQUNBLFFBQUEsVUFBQSxFQUFBOzs7RUFHQSxRQUFBLEdBQUEsZUFBQTs7RUFFQSxTQUFBLEdBQUEsY0FBQSxZQUFBO0dBQ0EsUUFBQSxHQUFBLGVBQUE7OztFQUdBLFNBQUEsR0FBQSxjQUFBLFlBQUE7R0FDQSxRQUFBLEdBQUEsZUFBQTs7Ozs7Ozs7Ozs7O0FDN0RBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLGdEQUFBLFVBQUEsUUFBQSxRQUFBO0VBQ0E7O1FBRUEsT0FBQSxtQkFBQSxPQUFBOzs7Ozs7Ozs7OztBQ0hBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLG9FQUFBLFVBQUEsUUFBQSxnQkFBQTtRQUNBOztRQUVBLE9BQUEsbUJBQUEsc0JBQUE7UUFDQSxPQUFBLE9BQUEsK0JBQUEsVUFBQSxTQUFBO1lBQ0EsZUFBQSxXQUFBOzs7Ozs7Ozs7Ozs7QUNMQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSw2Q0FBQSxVQUFBLFFBQUEsVUFBQTtRQUNBOztRQUVBLElBQUEscUJBQUE7O1FBRUEsSUFBQSxrQkFBQTs7O1FBR0EsT0FBQSxXQUFBOzs7UUFHQSxPQUFBLG1CQUFBOztRQUVBLElBQUEsZ0JBQUEsWUFBQTtZQUNBLElBQUEsV0FBQSxRQUFBLEtBQUEsT0FBQTtZQUNBLEtBQUEsSUFBQSxPQUFBLFVBQUE7Z0JBQ0EsSUFBQSxTQUFBLFNBQUEsZ0JBQUEsTUFBQTs7b0JBRUEsT0FBQSxTQUFBOzs7O1lBSUEsT0FBQSxhQUFBLHNCQUFBLEtBQUEsVUFBQTs7O1FBR0EsSUFBQSx5QkFBQSxZQUFBOzs7WUFHQSxTQUFBLGVBQUEsS0FBQTs7O1FBR0EsSUFBQSxrQkFBQSxZQUFBO1lBQ0EsSUFBQSxXQUFBO1lBQ0EsSUFBQSxPQUFBLGFBQUEscUJBQUE7Z0JBQ0EsV0FBQSxLQUFBLE1BQUEsT0FBQSxhQUFBOzs7WUFHQSxPQUFBLFFBQUEsT0FBQSxVQUFBOzs7UUFHQSxPQUFBLGNBQUEsVUFBQSxLQUFBLE9BQUE7WUFDQSxPQUFBLFNBQUEsT0FBQTs7O1FBR0EsT0FBQSxjQUFBLFVBQUEsS0FBQTtZQUNBLE9BQUEsT0FBQSxTQUFBOzs7UUFHQSxPQUFBLHFCQUFBLFVBQUEsS0FBQSxPQUFBO1lBQ0EsZ0JBQUEsT0FBQTtZQUNBLElBQUEsQ0FBQSxPQUFBLFNBQUEsZUFBQSxNQUFBO2dCQUNBLE9BQUEsWUFBQSxLQUFBOzs7O1FBSUEsT0FBQSxzQkFBQSxVQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUEsaUJBQUEsT0FBQTs7O1FBR0EsT0FBQSxzQkFBQSxVQUFBLEtBQUE7WUFDQSxPQUFBLE9BQUEsaUJBQUE7OztRQUdBLE9BQUEsT0FBQSxZQUFBLHdCQUFBO1FBQ0EsUUFBQSxPQUFBLE9BQUEsVUFBQTs7Ozs7Ozs7Ozs7QUNoRUEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsMkRBQUEsVUFBQSxRQUFBLFVBQUE7RUFDQTs7UUFFQSxTQUFBLEdBQUEsR0FBQSxVQUFBLEdBQUE7WUFDQSxFQUFBO1lBQ0EsT0FBQSxjQUFBO1lBQ0EsT0FBQTs7Ozs7Ozs7Ozs7O0FDTkEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsOENBQUEsVUFBQSxRQUFBLFlBQUE7RUFDQTs7UUFFQSxJQUFBLG9CQUFBOztRQUVBLE9BQUEsVUFBQTs7RUFFQSxPQUFBLGNBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxhQUFBLHFCQUFBO1lBQ0EsT0FBQSxVQUFBO0dBQ0EsV0FBQSxXQUFBLHdCQUFBOzs7RUFHQSxPQUFBLGVBQUEsWUFBQTtZQUNBLE9BQUEsYUFBQSxXQUFBO0dBQ0EsT0FBQSxVQUFBO0dBQ0EsV0FBQSxXQUFBOzs7RUFHQSxPQUFBLGdCQUFBLFVBQUEsTUFBQTtHQUNBLElBQUEsT0FBQSxZQUFBLE1BQUE7SUFDQSxPQUFBO1VBQ0E7SUFDQSxPQUFBLFlBQUE7Ozs7UUFJQSxXQUFBLElBQUEsMkJBQUEsVUFBQSxHQUFBLE1BQUE7WUFDQSxPQUFBLFlBQUE7Ozs7UUFJQSxJQUFB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Ozs7Ozs7Ozs7O0FDdEJBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLE9BQUEsWUFBQTtFQUNBOztFQUVBLElBQUEsTUFBQSxJQUFBLEdBQUEsSUFBQTtHQUNBLFFBQUE7WUFDQSxVQUFBO0dBQ0EsVUFBQTtJQUNBLElBQUEsR0FBQSxRQUFBO0lBQ0EsSUFBQSxHQUFBLFFBQUE7SUFDQSxJQUFBLEdBQUEsUUFBQTs7WUFFQSxjQUFBLEdBQUEsWUFBQSxTQUFBO2dCQUNBLFVBQUE7Ozs7RUFJQSxPQUFBOzs7Ozs7Ozs7OztBQ2hCQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSwrQ0FBQSxVQUFBLFlBQUEsUUFBQSxLQUFBO0VBQ0E7O0VBRUEsSUFBQTtRQUNBLElBQUE7O0VBRUEsSUFBQSxtQkFBQSxVQUFBLFlBQUE7R0FDQSxXQUFBLFFBQUEsT0FBQSxRQUFBLFdBQUE7R0FDQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBLFVBQUEsWUFBQTtHQUNBLFlBQUEsS0FBQTtHQUNBLE9BQUE7OztFQUdBLEtBQUEsUUFBQSxVQUFBLFFBQUE7R0FDQSxjQUFBLFdBQUEsTUFBQTtZQUNBLFVBQUEsWUFBQTtHQUNBLFFBQUEsS0FBQSxVQUFBLEdBQUE7SUFDQSxFQUFBLFFBQUE7O0dBRUEsT0FBQTs7O0VBR0EsS0FBQSxNQUFBLFVBQUEsUUFBQTtHQUNBLElBQUEsQ0FBQSxPQUFBLFlBQUEsT0FBQSxPQUFBO0lBQ0EsT0FBQSxXQUFBLE9BQUEsTUFBQSxPQUFBOztHQUVBLElBQUEsYUFBQSxXQUFBLElBQUE7R0FDQSxXQUFBO2NBQ0EsS0FBQTtjQUNBLEtBQUE7Y0FDQSxNQUFBLElBQUE7O0dBRUEsT0FBQTs7O0VBR0EsS0FBQSxTQUFBLFVBQUEsWUFBQTs7R0FFQSxJQUFBLFFBQUEsWUFBQSxRQUFBO0dBQ0EsSUFBQSxRQUFBLENBQUEsR0FBQTtJQUNBLE9BQUEsV0FBQSxRQUFBLFlBQUE7OztLQUdBLFFBQUEsWUFBQSxRQUFBO0tBQ0EsWUFBQSxPQUFBLE9BQUE7T0FDQSxJQUFBOzs7O0VBSUEsS0FBQSxVQUFBLFVBQUEsSUFBQTtHQUNBLE9BQUEsWUFBQSxRQUFBOzs7RUFHQSxLQUFBLFVBQUEsWUFBQTtHQUNBLE9BQUE7OztRQUdBLEtBQUEsYUFBQSxZQUFBO1lBQ0EsT0FBQTs7Ozs7Ozs7Ozs7O0FDNURBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLHNGQUFBLFVBQUEsWUFBQSxlQUFBLEtBQUEsSUFBQSxjQUFBLGFBQUE7RUFDQTs7RUFFQSxJQUFBLFFBQUE7O0VBRUEsSUFBQSxXQUFBOztFQUVBLElBQUEsa0JBQUE7O0VBRUEsSUFBQSxTQUFBOzs7RUFHQSxLQUFBLGVBQUE7Ozs7OztFQU1BLElBQUEsU0FBQSxVQUFBLElBQUE7R0FDQSxLQUFBLE1BQUEsTUFBQSxhQUFBO0dBQ0EsSUFBQSxRQUFBLFNBQUEsUUFBQTtHQUNBLE9BQUEsU0FBQSxDQUFBLFFBQUEsS0FBQSxTQUFBOzs7Ozs7O0VBT0EsSUFBQSxTQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsTUFBQSxNQUFBLGFBQUE7R0FDQSxJQUFBLFFBQUEsU0FBQSxRQUFBO0dBQ0EsSUFBQSxTQUFBLFNBQUE7R0FDQSxPQUFBLFNBQUEsQ0FBQSxRQUFBLElBQUEsVUFBQTs7Ozs7OztFQU9BLElBQUEsV0FBQSxVQUFBLElBQUE7R0FDQSxLQUFBLE1BQUEsTUFBQSxhQUFBO0dBQ0EsS0FBQSxJQUFBLElBQUEsT0FBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7SUFDQSxJQUFBLE9BQUEsR0FBQSxPQUFBLElBQUEsT0FBQSxPQUFBOzs7R0FHQSxPQUFBOzs7Ozs7RUFNQSxJQUFBLE9BQUEsVUFBQSxJQUFBO0dBQ0EsTUFBQSxlQUFBLFNBQUE7Ozs7Ozs7O0VBUUEsSUFBQSxhQUFBLFVBQUEsSUFBQTtHQUNBLElBQUEsV0FBQSxHQUFBO0dBQ0EsSUFBQSxNQUFBLFNBQUE7O0dBRUEsSUFBQSxLQUFBO0lBQ0EsU0FBQSxRQUFBO1VBQ0E7SUFDQSxNQUFBLFNBQUEsY0FBQTtJQUNBLElBQUEsTUFBQTtJQUNBLElBQUEsU0FBQSxZQUFBO0tBQ0EsT0FBQSxLQUFBOztLQUVBLElBQUEsT0FBQSxTQUFBLGlCQUFBO01BQ0EsT0FBQTs7S0FFQSxTQUFBLFFBQUE7O0lBRUEsSUFBQSxVQUFBLFVBQUEsS0FBQTtLQUNBLFNBQUEsT0FBQTs7SUFFQSxJQUFBLE1BQUEsTUFBQSxvQkFBQSxLQUFBOzs7WUFHQSxXQUFBLFdBQUEsa0JBQUE7O0dBRUEsT0FBQSxTQUFBOzs7Ozs7O0VBT0EsS0FBQSxPQUFBLFlBQUE7R0FDQSxXQUFBLGNBQUEsTUFBQSxDQUFBLGFBQUEsY0FBQSxZQUFBOzs7OztnQkFLQSxJQUFBLGlCQUFBLE9BQUEsYUFBQSxvQkFBQSxjQUFBO2dCQUNBLElBQUEsZ0JBQUE7b0JBQ0EsaUJBQUEsS0FBQSxNQUFBOzs7O29CQUlBLGFBQUEsZ0JBQUE7OztvQkFHQSxlQUFBLFdBQUEsU0FBQTtvQkFDQSxlQUFBLFlBQUEsU0FBQTs7O29CQUdBLFdBQUE7Ozs7R0FJQSxPQUFBLFNBQUE7Ozs7Ozs7RUFPQSxLQUFBLE9BQUEsVUFBQSxJQUFBO0dBQ0EsSUFBQSxVQUFBLFdBQUEsSUFBQSxLQUFBLFdBQUE7SUFDQSxLQUFBOzs7O0dBSUEsU0FBQSxTQUFBLEtBQUEsWUFBQTs7SUFFQSxXQUFBLE9BQUE7SUFDQSxXQUFBLE9BQUE7OztHQUdBLE9BQUE7Ozs7Ozs7RUFPQSxLQUFBLE9BQUEsWUFBQTtHQUNBLE9BQUEsTUFBQSxLQUFBOzs7Ozs7O0VBT0EsS0FBQSxPQUFBLFlBQUE7R0FDQSxPQUFBLE1BQUEsS0FBQTs7O0VBR0EsS0FBQSxlQUFBLFlBQUE7R0FDQSxPQUFBLE1BQUEsYUFBQTs7Ozs7Ozs7Ozs7O0FDMUpBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLFlBQUEsWUFBQTtRQUNBOzs7UUFHQSxJQUFBLFlBQUE7O1FBRUEsSUFBQSxtQkFBQSxVQUFBLE1BQUEsR0FBQTs7WUFFQSxLQUFBLElBQUEsSUFBQSxLQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTs7Z0JBRUEsSUFBQSxLQUFBLEdBQUEsU0FBQSxPQUFBLE9BQUE7Ozs7UUFJQSxJQUFBLGtCQUFBLFVBQUEsR0FBQTtZQUNBLElBQUEsT0FBQSxFQUFBO1lBQ0EsSUFBQSxZQUFBLE9BQUEsYUFBQSxFQUFBLFNBQUEsTUFBQTs7WUFFQSxJQUFBLFVBQUEsT0FBQTtnQkFDQSxpQkFBQSxVQUFBLE9BQUE7OztZQUdBLElBQUEsVUFBQSxZQUFBO2dCQUNBLGlCQUFBLFVBQUEsWUFBQTs7OztRQUlBLFNBQUEsaUJBQUEsV0FBQTs7Ozs7UUFLQSxLQUFBLEtBQUEsVUFBQSxZQUFBLFVBQUEsVUFBQTtZQUNBLElBQUEsT0FBQSxlQUFBLFlBQUEsc0JBQUEsUUFBQTtnQkFDQSxhQUFBLFdBQUE7OztZQUdBLFdBQUEsWUFBQTtZQUNBLElBQUEsV0FBQTtnQkFDQSxVQUFBO2dCQUNBLFVBQUE7OztZQUdBLElBQUEsVUFBQSxhQUFBO2dCQUNBLElBQUEsT0FBQSxVQUFBO2dCQUNBLElBQUE7O2dCQUVBLEtBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxRQUFBLEtBQUE7b0JBQ0EsSUFBQSxLQUFBLEdBQUEsWUFBQSxVQUFBOzs7Z0JBR0EsSUFBQSxNQUFBLEtBQUEsU0FBQSxHQUFBO29CQUNBLEtBQUEsS0FBQTt1QkFDQTtvQkFDQSxLQUFBLE9BQUEsR0FBQSxHQUFBOzs7bUJBR0E7Z0JBQ0EsVUFBQSxjQUFBLENBQUE7Ozs7O1FBS0EsS0FBQSxNQUFBLFVBQUEsWUFBQSxVQUFBO1lBQ0EsSUFBQSxPQUFBLGVBQUEsWUFBQSxzQkFBQSxRQUFBO2dCQUNBLGFBQUEsV0FBQTs7O1lBR0EsSUFBQSxVQUFBLGFBQUE7Z0JBQ0EsSUFBQSxPQUFBLFVBQUE7Z0JBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLEtBQUEsUUFBQSxLQUFBO29CQUNBLElBQUEsS0FBQSxHQUFBLGFBQUEsVUFBQTt3QkFDQSxLQUFBLE9BQUEsR0FBQTt3QkFDQTs7Ozs7Ozs7Ozs7Ozs7O0FDekVBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLDhGQUFBLFVBQUEsaUJBQUEsT0FBQSxjQUFBLFNBQUEsS0FBQSxJQUFBLGFBQUE7UUFDQTs7UUFFQSxJQUFBO1FBQ0EsSUFBQSxvQkFBQTs7UUFFQSxJQUFBLFNBQUE7OztRQUdBLEtBQUEsVUFBQTs7UUFFQSxLQUFBLHFCQUFBLFVBQUEsWUFBQTtZQUNBLElBQUEsQ0FBQSxZQUFBOzs7WUFHQSxJQUFBLENBQUEsV0FBQSxRQUFBO2dCQUNBLFdBQUEsU0FBQSxnQkFBQSxNQUFBO29CQUNBLGVBQUEsV0FBQTs7OztZQUlBLE9BQUEsV0FBQTs7O1FBR0EsS0FBQSxxQkFBQSxVQUFBLFlBQUE7WUFDQSxJQUFBLFFBQUEsZ0JBQUEsT0FBQTtnQkFDQSxlQUFBLFdBQUE7Z0JBQ0EsVUFBQSxjQUFBO2dCQUNBLFlBQUE7OztZQUdBLE1BQUEsU0FBQSxLQUFBLFlBQUE7Z0JBQ0EsV0FBQSxPQUFBLEtBQUE7OztZQUdBLE1BQUEsU0FBQSxNQUFBLElBQUE7O1lBRUEsT0FBQTs7O1FBR0EsS0FBQSx1QkFBQSxVQUFBLFlBQUEsT0FBQTs7WUFFQSxJQUFBLFFBQUEsV0FBQSxPQUFBLFFBQUE7WUFDQSxJQUFBLFFBQUEsQ0FBQSxHQUFBO2dCQUNBLE9BQUEsZ0JBQUEsT0FBQSxDQUFBLElBQUEsTUFBQSxLQUFBLFlBQUE7OztvQkFHQSxRQUFBLFdBQUEsT0FBQSxRQUFBO29CQUNBLFdBQUEsT0FBQSxPQUFBLE9BQUE7bUJBQ0EsSUFBQTs7OztRQUlBLEtBQUEsVUFBQSxZQUFBO1lBQ0EsSUFBQSxPQUFBO1lBQ0EsSUFBQSxNQUFBO1lBQ0EsSUFBQSxRQUFBLFVBQUEsT0FBQTtnQkFDQSxJQUFBLFNBQUEsTUFBQTtnQkFDQSxJQUFBLEtBQUEsS0FBQSxTQUFBO29CQUNBLEtBQUEsS0FBQSxRQUFBLEtBQUE7dUJBQ0E7b0JBQ0EsS0FBQSxLQUFBLFVBQUEsQ0FBQTs7OztZQUlBLEtBQUEsUUFBQSxLQUFBLFVBQUEsUUFBQTtnQkFDQSxLQUFBLE9BQUEsUUFBQTtvQkFDQSxLQUFBLE9BQUE7b0JBQ0EsT0FBQSxLQUFBLFFBQUE7Ozs7WUFJQSxPQUFBOzs7UUFHQSxLQUFBLFNBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLEtBQUEsY0FBQSxVQUFBLE9BQUE7WUFDQSxnQkFBQTs7O1FBR0EsS0FBQSxjQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxLQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUEsQ0FBQSxDQUFBOzs7UUFHQSxLQUFBLHVCQUFBLFVBQUEsWUFBQTtZQUNBLG9CQUFBOzs7UUFHQSxLQUFBLHVCQUFBLFlBQUE7WUFDQSxPQUFBOzs7O1FBSUEsQ0FBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFdBQUEsR0FBQTtZQUNBLE1BQUEsVUFBQSxTQUFBOztZQUVBLElBQUEsV0FBQSxDQUFBOzs7WUFHQSxJQUFBLGVBQUEsWUFBQTtnQkFDQSxJQUFBLEVBQUEsYUFBQSxZQUFBLFFBQUE7b0JBQ0EsU0FBQSxRQUFBOzs7O1lBSUEsT0FBQSxRQUFBLE1BQUEsTUFBQTs7WUFFQSxZQUFBLFFBQUEsVUFBQSxJQUFBO2dCQUNBLFFBQUEsSUFBQSxDQUFBLElBQUEsS0FBQSxVQUFBLFNBQUE7b0JBQ0EsT0FBQSxRQUFBLFFBQUEsYUFBQSxNQUFBLENBQUEsWUFBQSxLQUFBOzs7V0FHQTs7Ozs7Ozs7Ozs7QUN4SEEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsZ0dBQUEsVUFBQSxLQUFBLFFBQUEsYUFBQSxVQUFBLFFBQUEsV0FBQSxRQUFBO0VBQ0E7O1FBRUEsSUFBQSxxQkFBQSxJQUFBLEdBQUE7UUFDQSxJQUFBLG1CQUFBLElBQUEsR0FBQSxPQUFBLE9BQUE7WUFDQSxVQUFBOztRQUVBLElBQUEsa0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLFFBQUE7WUFDQSxPQUFBLE9BQUE7WUFDQSxRQUFBOzs7O0VBSUEsSUFBQSxTQUFBLElBQUEsR0FBQSxZQUFBLE9BQUE7R0FDQSxPQUFBLE9BQUE7WUFDQSxRQUFBLENBQUE7O1lBRUEsT0FBQTs7O0VBR0EsSUFBQSxtQkFBQSxPQUFBOztFQUVBLElBQUEsU0FBQSxJQUFBLEdBQUEsWUFBQSxPQUFBO0dBQ0EsVUFBQTs7OztHQUlBLGlCQUFBLFNBQUEsT0FBQTtJQUNBLE9BQUEsR0FBQSxPQUFBLFVBQUEsYUFBQSxVQUFBLEdBQUEsT0FBQSxVQUFBLFlBQUE7Ozs7O0VBS0EsSUFBQTs7OztRQUlBLElBQUEseUJBQUE7O1FBRUEsSUFBQSxRQUFBOztRQUVBLElBQUEsMEJBQUEsVUFBQSxZQUFBO1lBQ0EsTUFBQTtZQUNBLElBQUEsWUFBQTtnQkFDQSxpQkFBQSxLQUFBO2dCQUNBLElBQUEsVUFBQSxJQUFBLFdBQUEsZUFBQSxJQUFBLFdBQUE7b0JBQ0EsU0FBQSxDQUFBLElBQUEsSUFBQSxJQUFBOzs7Ozs7O0VBT0EsSUFBQSxxQkFBQSxVQUFBLE9BQUE7R0FDQSxPQUFBLENBQUEsR0FBQSxNQUFBLElBQUEsR0FBQSxPQUFBLGFBQUEsU0FBQSxNQUFBOzs7OztFQUtBLElBQUEsbUJBQUEsVUFBQSxPQUFBO0dBQ0EsT0FBQSxDQUFBLE1BQUEsR0FBQSxPQUFBLGFBQUEsU0FBQSxNQUFBOzs7OztFQUtBLElBQUEsaUJBQUEsVUFBQSxVQUFBO0dBQ0EsUUFBQSxTQUFBO0lBQ0EsS0FBQTs7S0FFQSxPQUFBLENBQUEsU0FBQSxhQUFBLENBQUEsU0FBQSxhQUFBO0lBQ0EsS0FBQTtJQUNBLEtBQUE7S0FDQSxPQUFBLFNBQUEsaUJBQUE7SUFDQSxLQUFBO0tBQ0EsT0FBQSxDQUFBLFNBQUE7SUFDQTtLQUNBLE9BQUEsU0FBQTs7Ozs7RUFLQSxJQUFBLHVCQUFBLFVBQUEsR0FBQTtHQUNBLElBQUEsVUFBQSxFQUFBO0dBQ0EsSUFBQSxPQUFBLFlBQUE7SUFDQSxJQUFBLGNBQUEsZUFBQSxRQUFBO0lBQ0EsUUFBQSxXQUFBLFNBQUEsWUFBQSxJQUFBO0lBQ0EsUUFBQSxXQUFBOzs7O0dBSUEsU0FBQSxNQUFBLEtBQUEsUUFBQSxXQUFBOzs7RUFHQSxJQUFBLGdCQUFBLFVBQUEsWUFBQTtHQUNBLElBQUE7R0FDQSxJQUFBLFNBQUEsV0FBQSxPQUFBLElBQUE7O0dBRUEsUUFBQSxXQUFBO0lBQ0EsS0FBQTtLQUNBLFdBQUEsSUFBQSxHQUFBLEtBQUEsTUFBQSxPQUFBO0tBQ0E7SUFDQSxLQUFBO0tBQ0EsV0FBQSxJQUFBLEdBQUEsS0FBQSxVQUFBLEVBQUE7S0FDQTtJQUNBLEtBQUE7O0tBRUEsV0FBQSxJQUFBLEdBQUEsS0FBQSxRQUFBLEVBQUE7S0FDQTtJQUNBLEtBQUE7S0FDQSxXQUFBLElBQUEsR0FBQSxLQUFBLFdBQUE7S0FDQTtJQUNBLEtBQUE7O0tBRUEsV0FBQSxJQUFBLEdBQUEsS0FBQSxPQUFBLE9BQUEsSUFBQSxPQUFBLEdBQUE7S0FDQTs7Z0JBRUE7b0JBQ0EsUUFBQSxNQUFBLCtCQUFBLFdBQUE7b0JBQ0E7OztHQUdBLElBQUEsVUFBQSxJQUFBLEdBQUEsUUFBQSxFQUFBLFVBQUE7WUFDQSxRQUFBLGFBQUE7WUFDQSxJQUFBLFdBQUEsVUFBQSxXQUFBLE9BQUEsU0FBQSxHQUFBO2dCQUNBLFFBQUEsUUFBQSxXQUFBLE9BQUEsR0FBQSxNQUFBOztHQUVBLFFBQUEsR0FBQSxVQUFBO1lBQ0EsaUJBQUEsV0FBQTs7O0VBR0EsSUFBQSxxQkFBQSxVQUFBLEdBQUEsT0FBQTs7WUFFQSxpQkFBQTtHQUNBLE1BQUE7O0dBRUEsWUFBQSxNQUFBLENBQUEsSUFBQSxNQUFBLE1BQUEsU0FBQSxLQUFBLFlBQUE7SUFDQSxZQUFBLFFBQUE7Ozs7RUFJQSxJQUFBLG1CQUFBLFVBQUEsR0FBQTtHQUNBLElBQUEsV0FBQSxFQUFBLFFBQUE7R0FDQSxJQUFBLGNBQUEsZUFBQTtZQUNBLElBQUEsUUFBQSxPQUFBOztZQUVBLEVBQUEsUUFBQSxRQUFBLE1BQUE7O0dBRUEsRUFBQSxRQUFBLGFBQUEsWUFBQSxJQUFBO0lBQ0EsSUFBQSxPQUFBO0lBQ0EsT0FBQSxTQUFBO0lBQ0EsUUFBQSxZQUFBLElBQUE7Z0JBQ0EsVUFBQSxNQUFBO2dCQUNBLFlBQUEsT0FBQTs7OztHQUlBLEVBQUEsUUFBQSxXQUFBLFNBQUEsTUFBQSxZQUFBO2dCQUNBLGlCQUFBLGNBQUEsRUFBQTs7O0dBR0EsRUFBQSxRQUFBLEdBQUEsVUFBQTs7WUFFQSxPQUFBLEVBQUEsUUFBQSxXQUFBOzs7RUFHQSxLQUFBLE9BQUEsVUFBQSxPQUFBO1lBQ0EsSUFBQSxTQUFBO0dBQ0EsSUFBQSxlQUFBO0dBQ0EsTUFBQSxJQUFBLGVBQUE7O0dBRUEsaUJBQUEsR0FBQSxpQkFBQSxZQUFBOztJQUVBLElBQUEsQ0FBQSxNQUFBLFNBQUE7O0tBRUEsTUFBQTs7Ozs7RUFLQSxLQUFBLGVBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxVQUFBOztHQUVBLE9BQUEsUUFBQTtHQUNBLE9BQUEsSUFBQSxHQUFBLFlBQUEsS0FBQTtnQkFDQSxRQUFBO0lBQ0EsTUFBQTtJQUNBLE9BQUEsT0FBQTs7O0dBR0EsSUFBQSxlQUFBO0dBQ0EsSUFBQSxlQUFBO0dBQ0EsS0FBQSxHQUFBLFdBQUE7OztFQUdBLEtBQUEsZ0JBQUEsWUFBQTtHQUNBLElBQUEsa0JBQUE7R0FDQSxJQUFBLGtCQUFBO1lBQ0EsT0FBQSxVQUFBOztHQUVBLE1BQUE7OztFQUdBLEtBQUEsaUJBQUEsWUFBQTtHQUNBLGlCQUFBLFFBQUEsVUFBQSxTQUFBO0lBQ0EsWUFBQSxPQUFBLFFBQUEsWUFBQSxLQUFBLFlBQUE7S0FDQSxpQkFBQSxjQUFBO0tBQ0EsaUJBQUEsT0FBQTs7Ozs7RUFLQSxLQUFBLFNBQUEsVUFBQSxJQUFBO0dBQ0EsSUFBQTtHQUNBLGlCQUFBLGVBQUEsVUFBQSxHQUFBO0lBQ0EsSUFBQSxFQUFBLFdBQUEsT0FBQSxJQUFBO0tBQ0EsVUFBQTs7OztHQUlBLElBQUEsQ0FBQSxpQkFBQSxPQUFBLFVBQUE7SUFDQSxpQkFBQSxLQUFBOzs7OztRQUtBLEtBQUEsTUFBQSxVQUFBLElBQUE7WUFDQSxpQkFBQSxlQUFBLFVBQUEsR0FBQTtnQkFDQSxJQUFBLEVBQUEsV0FBQSxPQUFBLElBQUE7O29CQUVBLElBQUEsT0FBQSxJQUFBO29CQUNBLElBQUEsTUFBQSxHQUFBLFVBQUEsSUFBQTt3QkFDQSxRQUFBLEtBQUE7O29CQUVBLElBQUEsT0FBQSxHQUFBLFVBQUEsS0FBQTt3QkFDQSxZQUFBLEtBQUE7O29CQUVBLElBQUEsYUFBQSxLQUFBO29CQUNBLEtBQUEsSUFBQSxFQUFBLGVBQUEsSUFBQTs7Ozs7RUFLQSxLQUFBLGlCQUFBLFlBQUE7R0FDQSxpQkFBQTs7O0VBR0EsS0FBQSxzQkFBQSxZQUFBO0dBQ0EsT0FBQTs7OztRQUlBLEtBQUEsYUFBQSxVQUFBLFNBQUE7WUFDQSxpQkFBQSxXQUFBO1lBQ0EsT0FBQSxpQkFBQSxDQUFBLFNBQUE7OztRQUdBLEtBQUEsYUFBQSxVQUFBLFNBQUE7WUFDQSxnQkFBQSxXQUFBOzs7UUFHQSxLQUFBLFlBQUEsWUFBQTtZQUNBLHlCQUFBLENBQUEseUJBQUEsS0FBQSxtQkFBQTtZQUNBLE1BQUE7OztRQUdBLEtBQUEsVUFBQSxZQUFBO1lBQ0EsT0FBQSxDQUFBLHlCQUFBLEtBQUEsbUJBQUE7OztRQUdBLEtBQUEsZ0JBQUEsWUFBQTs7WUFFQSx5QkFBQSxDQUFBLHlCQUFBLG1CQUFBLGNBQUEsS0FBQSxtQkFBQTtZQUNBLE1BQUE7OztRQUdBLEtBQUEsY0FBQSxZQUFBO1lBQ0EsT0FBQSx5QkFBQTs7O1FBR0EsS0FBQSxnQkFBQSxZQUFBOztZQUVBLFlBQUEsYUFBQSxLQUFBLFlBQUE7Z0JBQ0Esd0JBQUEsbUJBQUEsS0FBQTs7OztRQUlBLEtBQUEsY0FBQSxZQUFBO1lBQ0EseUJBQUE7WUFDQSxNQUFBOzs7UUFHQSxLQUFBLGFBQUEsWUFBQTtZQUNBLFlBQUEsYUFBQSxLQUFBLFlBQUE7O2dCQUVBLElBQUEsbUJBQUEsZ0JBQUEsR0FBQTtvQkFDQSx5QkFBQSxtQkFBQSxjQUFBOztnQkFFQSxNQUFBOzs7OztRQUtBLEtBQUEsVUFBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLGFBQUEsaUJBQUEsS0FBQTtZQUNBLElBQUEsQ0FBQSxZQUFBO1lBQ0EsUUFBQSxTQUFBOztZQUVBLElBQUEsU0FBQSxZQUFBO2dCQUNBLElBQUEsaUJBQUEsY0FBQSxHQUFBO29CQUNBLGlCQUFBO3VCQUNBO29CQUNBLGlCQUFBLEtBQUE7Ozs7WUFJQSxVQUFBLFFBQUEsS0FBQSxRQUFBOzs7UUFHQSxLQUFBLGFBQUEsWUFBQTtZQUNBLE9BQUEsbUJBQUEsS0FBQSx3QkFBQTs7Ozs7Ozs7Ozs7O0FDaFVBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLG9CQUFBLFVBQUEsS0FBQTtFQUNBO0VBQ0EsSUFBQSxTQUFBLENBQUEsR0FBQSxHQUFBLEdBQUE7O0VBRUEsSUFBQSxhQUFBLElBQUEsR0FBQSxLQUFBLFdBQUE7R0FDQSxNQUFBO0dBQ0EsT0FBQTtHQUNBLFFBQUE7OztFQUdBLElBQUEsYUFBQSxJQUFBLEdBQUEsTUFBQTs7RUFFQSxLQUFBLE9BQUEsVUFBQSxPQUFBO0dBQ0EsSUFBQSxTQUFBOzs7R0FHQSxNQUFBLElBQUEsZUFBQSxVQUFBLEdBQUEsT0FBQTtJQUNBLE9BQUEsS0FBQSxNQUFBO0lBQ0EsT0FBQSxLQUFBLE1BQUE7O0lBRUEsSUFBQSxPQUFBLE1BQUEsU0FBQTs7SUFFQSxJQUFBLFNBQUEsTUFBQSxTQUFBOztJQUVBLElBQUEsT0FBQSxPQUFBLGFBQUEsT0FBQSxPQUFBLFdBQUE7S0FDQSxTQUFBLEdBQUEsT0FBQSxVQUFBOzs7SUFHQSxJQUFBLGNBQUEsSUFBQSxHQUFBLE9BQUEsWUFBQTtLQUNBLEtBQUEsTUFBQTtLQUNBLFlBQUE7S0FDQSxhQUFBOzs7SUFHQSxXQUFBLFVBQUE7O0lBRUEsSUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO0tBQ0EsWUFBQTtLQUNBLFFBQUE7S0FDQSxNQUFBO0tBQ0EsWUFBQTs7S0FFQSxlQUFBOztLQUVBLFFBQUE7Ozs7SUFJQSxJQUFBLFNBQUEsV0FBQTtLQUNBLElBQUEsVUFBQSxJQUFBLFFBQUEsSUFBQTs7Ozs7RUFLQSxLQUFBLFlBQUEsWUFBQTtHQUNBLE9BQUE7OztFQUdBLEtBQUEsZ0JBQUEsWUFBQTtHQUNBLE9BQUE7OztRQUdBLEtBQUEsV0FBQSxZQUFBO1lBQ0EsT0FBQTs7Ozs7Ozs7Ozs7O0FDL0RBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLFVBQUEsWUFBQTtFQUNBOztRQUVBLElBQUEsUUFBQTs7UUFFQSxLQUFBLFNBQUE7WUFDQSxPQUFBLENBQUEsS0FBQSxLQUFBLEtBQUE7WUFDQSxNQUFBLENBQUEsR0FBQSxLQUFBLEtBQUE7WUFDQSxRQUFBOzs7UUFHQSxJQUFBLHNCQUFBO1FBQ0EsSUFBQSxxQkFBQTs7UUFFQSxJQUFBLHVCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsd0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsSUFBQSxnQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLGlCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsb0JBQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBOzs7UUFHQSxJQUFBLHFCQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O1FBR0EsSUFBQSxzQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLHVCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsc0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTtZQUNBLFVBQUEsQ0FBQTs7O1FBR0EsSUFBQSxnQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBO1lBQ0EsVUFBQSxDQUFBOzs7UUFHQSxJQUFBLGNBQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBOzs7UUFHQSxJQUFBLGVBQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBOzs7RUFHQSxLQUFBLFdBQUEsVUFBQSxTQUFBO1lBQ0EsSUFBQSxRQUFBLFFBQUEsU0FBQSxNQUFBLFFBQUEsU0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBO2dCQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7b0JBQ0EsUUFBQTtvQkFDQSxPQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7d0JBQ0EsUUFBQTt3QkFDQSxNQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7NEJBQ0EsT0FBQTs7d0JBRUEsUUFBQTs7O2dCQUdBLElBQUEsR0FBQSxNQUFBLE1BQUE7b0JBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO3dCQUNBLE9BQUE7d0JBQ0EsT0FBQTs7Ozs7O0VBTUEsS0FBQSxZQUFBO0dBQ0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxPQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQTtLQUNBLFFBQUE7O2dCQUVBLFFBQUE7O0dBRUEsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUE7Z0JBQ0EsUUFBQTs7OztFQUlBLEtBQUEsVUFBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUE7S0FDQSxRQUFBOzs7R0FHQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQTs7OztFQUlBLEtBQUEsV0FBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBOztHQUVBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7b0JBQ0EsT0FBQSxLQUFBLE9BQUE7b0JBQ0EsT0FBQTs7Ozs7Ozs7Ozs7Ozs7QUNuSUEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsYUFBQSxZQUFBO0VBQ0E7O0VBRUEsSUFBQSxRQUFBOzs7RUFHQSxJQUFBLGNBQUEsWUFBQTtHQUNBLElBQUEsU0FBQSxTQUFBLEtBQUEsUUFBQSxLQUFBOzhCQUNBLE1BQUE7O0dBRUEsSUFBQSxRQUFBOztHQUVBLE9BQUEsUUFBQSxVQUFBLE9BQUE7O0lBRUEsSUFBQSxVQUFBLE1BQUEsTUFBQTtJQUNBLElBQUEsV0FBQSxRQUFBLFdBQUEsR0FBQTtLQUNBLE1BQUEsUUFBQSxNQUFBLG1CQUFBLFFBQUE7Ozs7R0FJQSxPQUFBOzs7O0VBSUEsSUFBQSxjQUFBLFVBQUEsT0FBQTtHQUNBLElBQUEsU0FBQTtHQUNBLEtBQUEsSUFBQSxPQUFBLE9BQUE7SUFDQSxVQUFBLE1BQUEsTUFBQSxtQkFBQSxNQUFBLFFBQUE7O0dBRUEsT0FBQSxPQUFBLFVBQUEsR0FBQSxPQUFBLFNBQUE7OztFQUdBLEtBQUEsWUFBQSxVQUFBLEdBQUE7R0FDQSxNQUFBLE9BQUE7R0FDQSxRQUFBLFVBQUEsT0FBQSxJQUFBLE1BQUEsT0FBQSxNQUFBLFlBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsVUFBQSxRQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsUUFBQTtJQUNBLE1BQUEsT0FBQSxPQUFBOztHQUVBLFFBQUEsYUFBQSxPQUFBLElBQUEsTUFBQSxPQUFBLE1BQUEsWUFBQTs7OztFQUlBLEtBQUEsTUFBQSxVQUFBLEtBQUE7R0FDQSxPQUFBLE1BQUE7OztFQUdBLFFBQUEsUUFBQTs7RUFFQSxJQUFBLENBQUEsT0FBQTtHQUNBLFFBQUE7OztFQUdBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIGFubm90YXRpb25zIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnLCBbJ2RpYXMuYXBpJywgJ2RpYXMudWknXSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEFubm90YXRpb25zQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgYW5ub3RhdGlvbnMgbGlzdCBpbiB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0Fubm90YXRpb25zQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEFubm90YXRpb25zLCBsYWJlbHMsIGFubm90YXRpb25zLCBzaGFwZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5zZWxlY3RlZEZlYXR1cmVzID0gbWFwQW5ub3RhdGlvbnMuZ2V0U2VsZWN0ZWRGZWF0dXJlcygpLmdldEFycmF5KCk7XG5cblx0XHR2YXIgcmVmcmVzaEFubm90YXRpb25zID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmFubm90YXRpb25zID0gYW5ub3RhdGlvbnMuY3VycmVudCgpO1xuXHRcdH07XG5cblx0XHR2YXIgc2VsZWN0ZWRGZWF0dXJlcyA9IG1hcEFubm90YXRpb25zLmdldFNlbGVjdGVkRmVhdHVyZXMoKTtcblxuXHRcdCRzY29wZS5hbm5vdGF0aW9ucyA9IFtdO1xuXG5cdFx0JHNjb3BlLmNsZWFyU2VsZWN0aW9uID0gbWFwQW5ub3RhdGlvbnMuY2xlYXJTZWxlY3Rpb247XG5cblx0XHQkc2NvcGUuc2VsZWN0QW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChlLCBpZCkge1xuXHRcdFx0Ly8gYWxsb3cgbXVsdGlwbGUgc2VsZWN0aW9uc1xuXHRcdFx0aWYgKCFlLnNoaWZ0S2V5KSB7XG5cdFx0XHRcdCRzY29wZS5jbGVhclNlbGVjdGlvbigpO1xuXHRcdFx0fVxuXHRcdFx0bWFwQW5ub3RhdGlvbnMuc2VsZWN0KGlkKTtcblx0XHR9O1xuXG4gICAgICAgICRzY29wZS5maXRBbm5vdGF0aW9uID0gbWFwQW5ub3RhdGlvbnMuZml0O1xuXG5cdFx0JHNjb3BlLmlzU2VsZWN0ZWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBzZWxlY3RlZCA9IGZhbHNlO1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5mb3JFYWNoKGZ1bmN0aW9uIChmZWF0dXJlKSB7XG5cdFx0XHRcdGlmIChmZWF0dXJlLmFubm90YXRpb24gJiYgZmVhdHVyZS5hbm5vdGF0aW9uLmlkID09IGlkKSB7XG5cdFx0XHRcdFx0c2VsZWN0ZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBzZWxlY3RlZDtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCByZWZyZXNoQW5ub3RhdGlvbnMpO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0aW9uc0N5Y2xpbmdDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBiYWNrZ3JvdW5kIHNlZ21lbnRhdGlvbiBST0kgb3BhY2l0eSBzZXR0aW5nc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0Fubm90YXRpb25zQ3ljbGluZ0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywgbGFiZWxzLCBrZXlib2FyZCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBmbGFnIHRvIHByZXZlbnQgY3ljbGluZyB3aGlsZSBhIG5ldyBpbWFnZSBpcyBsb2FkaW5nXG4gICAgICAgIHZhciBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGN5Y2xpbmdLZXkgPSAnYW5ub3RhdGlvbnMnO1xuXG4gICAgICAgIHZhciBuZXh0QW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAobG9hZGluZyB8fCAhJHNjb3BlLmN5Y2xpbmcoKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAobWFwQW5ub3RhdGlvbnMuaGFzTmV4dCgpKSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuY3ljbGVOZXh0KCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG1ldGhvZCBmcm9tIEFubm90YXRvckNvbnRyb2xsZXI7IG1hcEFubm90YXRpb25zIHdpbGwgcmVmcmVzaCBhdXRvbWF0aWNhbGx5XG4gICAgICAgICAgICAgICAgJHNjb3BlLm5leHRJbWFnZSgpLnRoZW4obWFwQW5ub3RhdGlvbnMuanVtcFRvRmlyc3QpO1xuICAgICAgICAgICAgICAgIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICAgIC8vIG9ubHkgYXBwbHkgaWYgdGhpcyB3YXMgY2FsbGVkIGJ5IHRoZSBrZXlib2FyZCBldmVudFxuICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY2FuY2VsIGFsbCBrZXlib2FyZCBldmVudHMgd2l0aCBsb3dlciBwcmlvcml0eVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBwcmV2QW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAobG9hZGluZyB8fCAhJHNjb3BlLmN5Y2xpbmcoKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAobWFwQW5ub3RhdGlvbnMuaGFzUHJldmlvdXMoKSkge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmN5Y2xlUHJldmlvdXMoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gbWV0aG9kIGZyb20gQW5ub3RhdG9yQ29udHJvbGxlcjsgbWFwQW5ub3RhdGlvbnMgd2lsbCByZWZyZXNoIGF1dG9tYXRpY2FsbHlcbiAgICAgICAgICAgICAgICAkc2NvcGUucHJldkltYWdlKCkudGhlbihtYXBBbm5vdGF0aW9ucy5qdW1wVG9MYXN0KTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGFwcGx5IGlmIHRoaXMgd2FzIGNhbGxlZCBieSB0aGUga2V5Ym9hcmQgZXZlbnRcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNhbmNlbCBhbGwga2V5Ym9hcmQgZXZlbnRzIHdpdGggbG93ZXIgcHJpb3JpdHlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgYXR0YWNoTGFiZWwgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcpIHJldHVybjtcbiAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoJHNjb3BlLmN5Y2xpbmcoKSAmJiBsYWJlbHMuaGFzU2VsZWN0ZWQoKSkge1xuICAgICAgICAgICAgICAgIGxhYmVscy5hdHRhY2hUb0Fubm90YXRpb24obWFwQW5ub3RhdGlvbnMuZ2V0Q3VycmVudCgpKS4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuZmxpY2tlcigxKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuZmxpY2tlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHN0b3AgY3ljbGluZyB1c2luZyBhIGtleWJvYXJkIGV2ZW50XG4gICAgICAgIHZhciBzdG9wQ3ljbGluZyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAkc2NvcGUuc3RvcEN5Y2xpbmcoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuY3ljbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuZ2V0Vm9sYXRpbGVTZXR0aW5ncygnY3ljbGUnKSA9PT0gY3ljbGluZ0tleTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc3RhcnRDeWNsaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNldFZvbGF0aWxlU2V0dGluZ3MoJ2N5Y2xlJywgY3ljbGluZ0tleSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnN0b3BDeWNsaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNldFZvbGF0aWxlU2V0dGluZ3MoJ2N5Y2xlJywgJycpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHRoZSBjeWNsZSBzZXR0aW5ncyBteSBiZSBzZXQgYnkgb3RoZXIgY29udHJvbGxlcnMsIHRvbywgc28gd2F0Y2ggaXRcbiAgICAgICAgLy8gaW5zdGVhZCBvZiB1c2luZyB0aGUgc3RhcnQvc3RvcCBmdW5jdGlvbnMgdG8gYWRkL3JlbW92ZSBldmVudHMgZXRjLlxuICAgICAgICAkc2NvcGUuJHdhdGNoKCd2b2xhdGlsZVNldHRpbmdzLmN5Y2xlJywgZnVuY3Rpb24gKGN5Y2xlLCBvbGRDeWNsZSkge1xuICAgICAgICAgICAgaWYgKGN5Y2xlID09PSBjeWNsaW5nS2V5KSB7XG4gICAgICAgICAgICAgICAgLy8gb3ZlcnJpZGUgcHJldmlvdXMgaW1hZ2Ugb24gYXJyb3cgbGVmdFxuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDM3LCBwcmV2QW5ub3RhdGlvbiwgMTApO1xuICAgICAgICAgICAgICAgIC8vIG92ZXJyaWRlIG5leHQgaW1hZ2Ugb24gYXJyb3cgcmlnaHQgYW5kIHNwYWNlXG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMzksIG5leHRBbm5vdGF0aW9uLCAxMCk7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMzIsIG5leHRBbm5vdGF0aW9uLCAxMCk7XG5cbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigxMywgYXR0YWNoTGFiZWwsIDEwKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigyNywgc3RvcEN5Y2xpbmcsIDEwKTtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5qdW1wVG9DdXJyZW50KCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9sZEN5Y2xlID09PSBjeWNsaW5nS2V5KSB7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDM3LCBwcmV2QW5ub3RhdGlvbik7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDM5LCBuZXh0QW5ub3RhdGlvbik7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDMyLCBuZXh0QW5ub3RhdGlvbik7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDEzLCBhdHRhY2hMYWJlbCk7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDI3LCBzdG9wQ3ljbGluZyk7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuY2xlYXJTZWxlY3RlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLnByZXZBbm5vdGF0aW9uID0gcHJldkFubm90YXRpb247XG4gICAgICAgICRzY29wZS5uZXh0QW5ub3RhdGlvbiA9IG5leHRBbm5vdGF0aW9uO1xuICAgICAgICAkc2NvcGUuYXR0YWNoTGFiZWwgPSBhdHRhY2hMYWJlbDtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0b3JDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1haW4gY29udHJvbGxlciBvZiB0aGUgQW5ub3RhdG9yIGFwcGxpY2F0aW9uLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0Fubm90YXRvckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBpbWFnZXMsIHVybFBhcmFtcywgbXNnLCBJTUFHRV9JRCwga2V5Ym9hcmQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLmltYWdlcyA9IGltYWdlcztcbiAgICAgICAgJHNjb3BlLmltYWdlTG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgLy8gdGhlIGN1cnJlbnQgY2FudmFzIHZpZXdwb3J0LCBzeW5jZWQgd2l0aCB0aGUgVVJMIHBhcmFtZXRlcnNcbiAgICAgICAgJHNjb3BlLnZpZXdwb3J0ID0ge1xuICAgICAgICAgICAgem9vbTogdXJsUGFyYW1zLmdldCgneicpLFxuICAgICAgICAgICAgY2VudGVyOiBbdXJsUGFyYW1zLmdldCgneCcpLCB1cmxQYXJhbXMuZ2V0KCd5JyldXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZmluaXNoIGltYWdlIGxvYWRpbmcgcHJvY2Vzc1xuICAgICAgICB2YXIgZmluaXNoTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdpbWFnZS5zaG93bicsICRzY29wZS5pbWFnZXMuY3VycmVudEltYWdlKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeVxuICAgICAgICB2YXIgcHVzaFN0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdXJsUGFyYW1zLnB1c2hTdGF0ZSgkc2NvcGUuaW1hZ2VzLmN1cnJlbnRJbWFnZS5faWQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHN0YXJ0IGltYWdlIGxvYWRpbmcgcHJvY2Vzc1xuICAgICAgICB2YXIgc3RhcnRMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlTG9hZGluZyA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gbG9hZCB0aGUgaW1hZ2UgYnkgaWQuIGRvZXNuJ3QgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnkgYnkgaXRzZWxmXG4gICAgICAgIHZhciBsb2FkSW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlcy5zaG93KHBhcnNlSW50KGlkKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmaW5pc2hMb2FkaW5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2hvdyB0aGUgbmV4dCBpbWFnZSBhbmQgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgJHNjb3BlLm5leHRJbWFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlcy5uZXh0KClcbiAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAudGhlbihwdXNoU3RhdGUpXG4gICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHNob3cgdGhlIHByZXZpb3VzIGltYWdlIGFuZCBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeVxuICAgICAgICAkc2NvcGUucHJldkltYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc3RhcnRMb2FkaW5nKCk7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VzLnByZXYoKVxuICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgIC50aGVuKHB1c2hTdGF0ZSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSBVUkwgcGFyYW1ldGVycyBvZiB0aGUgdmlld3BvcnRcbiAgICAgICAgJHNjb3BlLiRvbignY2FudmFzLm1vdmVlbmQnLCBmdW5jdGlvbihlLCBwYXJhbXMpIHtcbiAgICAgICAgICAgICRzY29wZS52aWV3cG9ydC56b29tID0gcGFyYW1zLnpvb207XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuY2VudGVyWzBdID0gTWF0aC5yb3VuZChwYXJhbXMuY2VudGVyWzBdKTtcbiAgICAgICAgICAgICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMV0gPSBNYXRoLnJvdW5kKHBhcmFtcy5jZW50ZXJbMV0pO1xuICAgICAgICAgICAgdXJsUGFyYW1zLnNldCh7XG4gICAgICAgICAgICAgICAgejogJHNjb3BlLnZpZXdwb3J0Lnpvb20sXG4gICAgICAgICAgICAgICAgeDogJHNjb3BlLnZpZXdwb3J0LmNlbnRlclswXSxcbiAgICAgICAgICAgICAgICB5OiAkc2NvcGUudmlld3BvcnQuY2VudGVyWzFdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oMzcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5wcmV2SW1hZ2UoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oMzksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oMzIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gbGlzdGVuIHRvIHRoZSBicm93c2VyIFwiYmFja1wiIGJ1dHRvblxuICAgICAgICB3aW5kb3cub25wb3BzdGF0ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBzdGF0ZSA9IGUuc3RhdGU7XG4gICAgICAgICAgICBpZiAoc3RhdGUgJiYgc3RhdGUuc2x1ZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbG9hZEltYWdlKHN0YXRlLnNsdWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGluaXRpYWxpemUgdGhlIGltYWdlcyBzZXJ2aWNlXG4gICAgICAgIGltYWdlcy5pbml0KCk7XG4gICAgICAgIC8vIGRpc3BsYXkgdGhlIGZpcnN0IGltYWdlXG4gICAgICAgIGxvYWRJbWFnZShJTUFHRV9JRCkudGhlbihwdXNoU3RhdGUpO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENhbnZhc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFpbiBjb250cm9sbGVyIGZvciB0aGUgYW5ub3RhdGlvbiBjYW52YXMgZWxlbWVudFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NhbnZhc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBJbWFnZSwgbWFwQW5ub3RhdGlvbnMsIG1hcCwgJHRpbWVvdXQsIGRlYm91bmNlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuXG5cdFx0Ly8gdXBkYXRlIHRoZSBVUkwgcGFyYW1ldGVyc1xuXHRcdG1hcC5vbignbW92ZWVuZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBlbWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnY2FudmFzLm1vdmVlbmQnLCB7XG4gICAgICAgICAgICAgICAgICAgIGNlbnRlcjogbWFwVmlldy5nZXRDZW50ZXIoKSxcbiAgICAgICAgICAgICAgICAgICAgem9vbTogbWFwVmlldy5nZXRab29tKClcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGRvbnQgdXBkYXRlIGltbWVkaWF0ZWx5IGJ1dCB3YWl0IGZvciBwb3NzaWJsZSBuZXcgY2hhbmdlc1xuICAgICAgICAgICAgZGVib3VuY2UoZW1pdCwgMTAwLCAnYW5ub3RhdG9yLmNhbnZhcy5tb3ZlZW5kJyk7XG5cdFx0fSk7XG5cbiAgICAgICAgbWFwLm9uKCdjaGFuZ2U6dmlldycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuICAgICAgICB9KTtcblxuXHRcdG1hcEltYWdlLmluaXQoJHNjb3BlKTtcblx0XHRtYXBBbm5vdGF0aW9ucy5pbml0KCRzY29wZSk7XG5cblx0XHR2YXIgdXBkYXRlU2l6ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdC8vIHdvcmthcm91bmQsIHNvIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQgKmFmdGVyKiB0aGUgYW5ndWxhciBkaWdlc3Rcblx0XHRcdC8vIGFuZCAqYWZ0ZXIqIHRoZSBmb2xkb3V0IHdhcyByZW5kZXJlZFxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBuZWVkcyB0byBiZSB3cmFwcGVkIGluIGFuIGV4dHJhIGZ1bmN0aW9uIHNpbmNlIHVwZGF0ZVNpemUgYWNjZXB0cyBhcmd1bWVudHNcblx0XHRcdFx0bWFwLnVwZGF0ZVNpemUoKTtcblx0XHRcdH0sIDUwLCBmYWxzZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5vcGVuJywgdXBkYXRlU2l6ZSk7XG5cdFx0JHNjb3BlLiRvbignc2lkZWJhci5mb2xkb3V0LmNsb3NlJywgdXBkYXRlU2l6ZSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENhdGVnb3JpZXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyIGxhYmVsIGNhdGVnb3JpZXMgZm9sZG91dFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NhdGVnb3JpZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbGFiZWxzLCBrZXlib2FyZCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBtYXhpbXVtIG51bWJlciBvZiBhbGxvd2VkIGZhdm91cml0ZXNcbiAgICAgICAgdmFyIG1heEZhdm91cml0ZXMgPSA5O1xuICAgICAgICB2YXIgZmF2b3VyaXRlc1N0b3JhZ2VLZXkgPSAnZGlhcy5hbm5vdGF0aW9ucy5sYWJlbC1mYXZvdXJpdGVzJztcblxuICAgICAgICAvLyBzYXZlcyB0aGUgSURzIG9mIHRoZSBmYXZvdXJpdGVzIGluIGxvY2FsU3RvcmFnZVxuICAgICAgICB2YXIgc3RvcmVGYXZvdXJpdGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRtcCA9ICRzY29wZS5mYXZvdXJpdGVzLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmlkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2Zhdm91cml0ZXNTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KHRtcCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmVzdG9yZXMgdGhlIGZhdm91cml0ZXMgZnJvbSB0aGUgSURzIGluIGxvY2FsU3RvcmFnZVxuICAgICAgICB2YXIgbG9hZEZhdm91cml0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtmYXZvdXJpdGVzU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgICAgICB2YXIgdG1wID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlW2Zhdm91cml0ZXNTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMgPSAkc2NvcGUuY2F0ZWdvcmllcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gb25seSB0YWtlIHRob3NlIGNhdGVnb3JpZXMgYXMgZmF2b3VyaXRlcyB0aGF0IGFyZSBhdmFpbGFibGUgZm9yIHRoaXMgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRtcC5pbmRleE9mKGl0ZW0uaWQpICE9PSAtMTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgY2hvb3NlRmF2b3VyaXRlID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gMCAmJiBpbmRleCA8ICRzY29wZS5mYXZvdXJpdGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RJdGVtKCRzY29wZS5mYXZvdXJpdGVzW2luZGV4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmhvdGtleXNNYXAgPSBbJ/Cdn60nLCAn8J2fricsICfwnZ+vJywgJ/Cdn7AnLCAn8J2fsScsICfwnZ+yJywgJ/Cdn7MnLCAn8J2ftCcsICfwnZ+1J107XG4gICAgICAgICRzY29wZS5jYXRlZ29yaWVzID0gW107XG4gICAgICAgICRzY29wZS5mYXZvdXJpdGVzID0gW107XG4gICAgICAgIGxhYmVscy5wcm9taXNlLnRoZW4oZnVuY3Rpb24gKGFsbCkge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGFsbCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5jYXRlZ29yaWVzID0gJHNjb3BlLmNhdGVnb3JpZXMuY29uY2F0KGFsbFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvYWRGYXZvdXJpdGVzKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS5jYXRlZ29yaWVzVHJlZSA9IGxhYmVscy5nZXRUcmVlKCk7XG5cbiAgICAgICAgJHNjb3BlLnNlbGVjdEl0ZW0gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgbGFiZWxzLnNldFNlbGVjdGVkKGl0ZW0pO1xuICAgICAgICAgICAgJHNjb3BlLnNlYXJjaENhdGVnb3J5ID0gJyc7IC8vIGNsZWFyIHNlYXJjaCBmaWVsZFxuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCBpdGVtKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNGYXZvdXJpdGUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5mYXZvdXJpdGVzLmluZGV4T2YoaXRlbSkgIT09IC0xO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGFkZHMgYSBuZXcgaXRlbSB0byB0aGUgZmF2b3VyaXRlcyBvciByZW1vdmVzIGl0IGlmIGl0IGlzIGFscmVhZHkgYSBmYXZvdXJpdGVcbiAgICAgICAgJHNjb3BlLnRvZ2dsZUZhdm91cml0ZSA9IGZ1bmN0aW9uIChlLCBpdGVtKSB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gJHNjb3BlLmZhdm91cml0ZXMuaW5kZXhPZihpdGVtKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEgJiYgJHNjb3BlLmZhdm91cml0ZXMubGVuZ3RoIDwgbWF4RmF2b3VyaXRlcykge1xuICAgICAgICAgICAgICAgICRzY29wZS5mYXZvdXJpdGVzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5mYXZvdXJpdGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdG9yZUZhdm91cml0ZXMoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXR1cm5zIHdoZXRoZXIgdGhlIHVzZXIgaXMgc3RpbGwgYWxsb3dlZCB0byBhZGQgZmF2b3VyaXRlc1xuICAgICAgICAkc2NvcGUuZmF2b3VyaXRlc0xlZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmZhdm91cml0ZXMubGVuZ3RoIDwgbWF4RmF2b3VyaXRlcztcbiAgICAgICAgfTtcblxuICAgICAgICBrZXlib2FyZC5vbignMScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSgwKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoMSk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCczJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDIpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignNCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSgzKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoNCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc2JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDUpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignNycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg2KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoNyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDgpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDb25maWRlbmNlQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgY29uZmlkZW5jZSBjb250cm9sXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQ29uZmlkZW5jZUNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5jb25maWRlbmNlID0gMS4wO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnY29uZmlkZW5jZScsIGZ1bmN0aW9uIChjb25maWRlbmNlKSB7XG5cdFx0XHRsYWJlbHMuc2V0Q3VycmVudENvbmZpZGVuY2UocGFyc2VGbG9hdChjb25maWRlbmNlKSk7XG5cblx0XHRcdGlmIChjb25maWRlbmNlIDw9IDAuMjUpIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC1kYW5nZXInO1xuXHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNSApIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC13YXJuaW5nJztcblx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjc1ICkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXN1Y2Nlc3MnO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC1wcmltYXJ5Jztcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQ29udHJvbHNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyIGNvbnRyb2wgYnV0dG9uc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NvbnRyb2xzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEFubm90YXRpb25zLCBsYWJlbHMsIG1zZywgJGF0dHJzLCBrZXlib2FyZCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGRyYXdpbmcgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5zZWxlY3RTaGFwZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0XHRpZiAoIWxhYmVscy5oYXNTZWxlY3RlZCgpKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdzaWRlYmFyLmZvbGRvdXQuZG8tb3BlbicsICdjYXRlZ29yaWVzJyk7XG5cdFx0XHRcdG1zZy5pbmZvKCRhdHRycy5zZWxlY3RDYXRlZ29yeSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0bWFwQW5ub3RhdGlvbnMuZmluaXNoRHJhd2luZygpO1xuXG5cdFx0XHRpZiAobmFtZSA9PT0gbnVsbCB8fCAoZHJhd2luZyAmJiAkc2NvcGUuc2VsZWN0ZWRTaGFwZSA9PT0gbmFtZSkpIHtcblx0XHRcdFx0JHNjb3BlLnNlbGVjdGVkU2hhcGUgPSAnJztcblx0XHRcdFx0ZHJhd2luZyA9IGZhbHNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLnNlbGVjdGVkU2hhcGUgPSBuYW1lO1xuXHRcdFx0XHRtYXBBbm5vdGF0aW9ucy5zdGFydERyYXdpbmcobmFtZSk7XG5cdFx0XHRcdGRyYXdpbmcgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH07XG5cbiAgICAgICAgLy8gZGVzZWxlY3QgZHJhd2luZyB0b29sIG9uIGVzY2FwZVxuICAgICAgICBrZXlib2FyZC5vbigyNywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKG51bGwpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignYScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnUG9pbnQnKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ1JlY3RhbmdsZScpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnQ2lyY2xlJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdmJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdMaW5lU3RyaW5nJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdnJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdQb2x5Z29uJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBNaW5pbWFwQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgbWluaW1hcCBpbiB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ01pbmltYXBDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwLCBtYXBJbWFnZSwgJGVsZW1lbnQsIHN0eWxlcykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciB2aWV3cG9ydFNvdXJjZSA9IG5ldyBvbC5zb3VyY2UuVmVjdG9yKCk7XG5cblx0XHR2YXIgbWluaW1hcCA9IG5ldyBvbC5NYXAoe1xuXHRcdFx0dGFyZ2V0OiAnbWluaW1hcCcsXG5cdFx0XHQvLyByZW1vdmUgY29udHJvbHNcblx0XHRcdGNvbnRyb2xzOiBbXSxcblx0XHRcdC8vIGRpc2FibGUgaW50ZXJhY3Rpb25zXG5cdFx0XHRpbnRlcmFjdGlvbnM6IFtdXG5cdFx0fSk7XG5cbiAgICAgICAgdmFyIG1hcFNpemUgPSBtYXAuZ2V0U2l6ZSgpO1xuICAgICAgICB2YXIgbWFwVmlldyA9IG1hcC5nZXRWaWV3KCk7XG5cblx0XHQvLyBnZXQgdGhlIHNhbWUgbGF5ZXJzIHRoYW4gdGhlIG1hcFxuXHRcdG1pbmltYXAuYWRkTGF5ZXIobWFwSW1hZ2UuZ2V0TGF5ZXIoKSk7XG4gICAgICAgIG1pbmltYXAuYWRkTGF5ZXIobmV3IG9sLmxheWVyLlZlY3Rvcih7XG4gICAgICAgICAgICBzb3VyY2U6IHZpZXdwb3J0U291cmNlLFxuICAgICAgICAgICAgc3R5bGU6IHN0eWxlcy52aWV3cG9ydFxuICAgICAgICB9KSk7XG5cblx0XHR2YXIgdmlld3BvcnQgPSBuZXcgb2wuRmVhdHVyZSgpO1xuXHRcdHZpZXdwb3J0U291cmNlLmFkZEZlYXR1cmUodmlld3BvcnQpO1xuXG5cdFx0Ly8gcmVmcmVzaCB0aGUgdmlldyAodGhlIGltYWdlIHNpemUgY291bGQgaGF2ZSBiZWVuIGNoYW5nZWQpXG5cdFx0JHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtaW5pbWFwLnNldFZpZXcobmV3IG9sLlZpZXcoe1xuXHRcdFx0XHRwcm9qZWN0aW9uOiBtYXBJbWFnZS5nZXRQcm9qZWN0aW9uKCksXG5cdFx0XHRcdGNlbnRlcjogb2wuZXh0ZW50LmdldENlbnRlcihtYXBJbWFnZS5nZXRFeHRlbnQoKSksXG5cdFx0XHRcdHpvb206IDBcblx0XHRcdH0pKTtcblx0XHR9KTtcblxuXHRcdC8vIG1vdmUgdGhlIHZpZXdwb3J0IHJlY3RhbmdsZSBvbiB0aGUgbWluaW1hcFxuXHRcdHZhciByZWZyZXNoVmlld3BvcnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2aWV3cG9ydC5zZXRHZW9tZXRyeShvbC5nZW9tLlBvbHlnb24uZnJvbUV4dGVudChtYXBWaWV3LmNhbGN1bGF0ZUV4dGVudChtYXBTaXplKSkpO1xuXHRcdH07XG5cbiAgICAgICAgbWFwLm9uKCdjaGFuZ2U6c2l6ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcFNpemUgPSBtYXAuZ2V0U2l6ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBtYXAub24oJ2NoYW5nZTp2aWV3JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWFwVmlldyA9IG1hcC5nZXRWaWV3KCk7XG4gICAgICAgIH0pO1xuXG5cdFx0bWFwLm9uKCdwb3N0Y29tcG9zZScsIHJlZnJlc2hWaWV3cG9ydCk7XG5cblx0XHR2YXIgZHJhZ1ZpZXdwb3J0ID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdG1hcFZpZXcuc2V0Q2VudGVyKGUuY29vcmRpbmF0ZSk7XG5cdFx0fTtcblxuXHRcdG1pbmltYXAub24oJ3BvaW50ZXJkcmFnJywgZHJhZ1ZpZXdwb3J0KTtcblxuXHRcdCRlbGVtZW50Lm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC51bigncG9pbnRlcmRyYWcnLCBkcmFnVmlld3BvcnQpO1xuXHRcdH0pO1xuXG5cdFx0JGVsZW1lbnQub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtaW5pbWFwLm9uKCdwb2ludGVyZHJhZycsIGRyYWdWaWV3cG9ydCk7XG5cdFx0fSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNlbGVjdGVkTGFiZWxDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzZWxlY3RlZCBsYWJlbCBkaXNwbGF5IGluIHRoZSBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTZWxlY3RlZExhYmVsQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGxhYmVscykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5nZXRTZWxlY3RlZExhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTZXR0aW5nc0Fubm90YXRpb25PcGFjaXR5Q29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBzZXR0aW5ncyBmb2xkb3V0XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2V0dGluZ3NBbm5vdGF0aW9uT3BhY2l0eUNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuc2V0RGVmYXVsdFNldHRpbmdzKCdhbm5vdGF0aW9uX29wYWNpdHknLCAnMScpO1xuICAgICAgICAkc2NvcGUuJHdhdGNoKCdzZXR0aW5ncy5hbm5vdGF0aW9uX29wYWNpdHknLCBmdW5jdGlvbiAob3BhY2l0eSkge1xuICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuc2V0T3BhY2l0eShvcGFjaXR5KTtcbiAgICAgICAgfSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2V0dGluZ3NDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyIHNldHRpbmdzIGZvbGRvdXRcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTZXR0aW5nc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBkZWJvdW5jZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgc2V0dGluZ3NTdG9yYWdlS2V5ID0gJ2RpYXMuYW5ub3RhdGlvbnMuc2V0dGluZ3MnO1xuXG4gICAgICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSB7fTtcblxuICAgICAgICAvLyBtYXkgYmUgZXh0ZW5kZWQgYnkgY2hpbGQgY29udHJvbGxlcnNcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzID0ge307XG5cbiAgICAgICAgLy8gbWF5IGJlIGV4dGVuZGVkIGJ5IGNoaWxkIGNvbnRyb2xsZXJzIGJ1dCB3aWxsIG5vdCBiZSBwZXJtYW5lbnRseSBzdG9yZWRcbiAgICAgICAgJHNjb3BlLnZvbGF0aWxlU2V0dGluZ3MgPSB7fTtcblxuICAgICAgICB2YXIgc3RvcmVTZXR0aW5ncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzZXR0aW5ncyA9IGFuZ3VsYXIuY29weSgkc2NvcGUuc2V0dGluZ3MpO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzW2tleV0gPT09IGRlZmF1bHRTZXR0aW5nc1trZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGRvbid0IHN0b3JlIGRlZmF1bHQgc2V0dGluZ3MgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzZXR0aW5nc1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc1N0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBzdG9yZVNldHRpbmdzRGVib3VuY2VkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gd2FpdCBmb3IgcXVpY2sgY2hhbmdlcyBhbmQgb25seSBzdG9yZSB0aGVtIG9uY2UgdGhpbmdzIGNhbG1lZCBkb3duIGFnYWluXG4gICAgICAgICAgICAvLyAoZS5nLiB3aGVuIHRoZSB1c2VyIGZvb2xzIGFyb3VuZCB3aXRoIGEgcmFuZ2Ugc2xpZGVyKVxuICAgICAgICAgICAgZGVib3VuY2Uoc3RvcmVTZXR0aW5ncywgMjUwLCBzZXR0aW5nc1N0b3JhZ2VLZXkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByZXN0b3JlU2V0dGluZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB7fTtcbiAgICAgICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW3NldHRpbmdzU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgICAgICBzZXR0aW5ncyA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc1N0b3JhZ2VLZXldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuZXh0ZW5kKHNldHRpbmdzLCBkZWZhdWx0U2V0dGluZ3MpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zZXRTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuc2V0dGluZ3Nba2V5XTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2V0RGVmYXVsdFNldHRpbmdzID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIGRlZmF1bHRTZXR0aW5nc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgICBpZiAoISRzY29wZS5zZXR0aW5ncy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnNldFNldHRpbmdzKGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zZXRWb2xhdGlsZVNldHRpbmdzID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICRzY29wZS52b2xhdGlsZVNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0Vm9sYXRpbGVTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUudm9sYXRpbGVTZXR0aW5nc1trZXldO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ3NldHRpbmdzJywgc3RvcmVTZXR0aW5nc0RlYm91bmNlZCwgdHJ1ZSk7XG4gICAgICAgIGFuZ3VsYXIuZXh0ZW5kKCRzY29wZS5zZXR0aW5ncywgcmVzdG9yZVNldHRpbmdzKCkpO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNpZGViYXJDYXRlZ29yeUZvbGRvdXRDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyIGNhdGVnb3J5IGZvbGRvdXQgYnV0dG9uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2lkZWJhckNhdGVnb3J5Rm9sZG91dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBrZXlib2FyZCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDksIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAkc2NvcGUudG9nZ2xlRm9sZG91dCgnY2F0ZWdvcmllcycpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2lkZWJhckNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXJcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTaWRlYmFyQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRyb290U2NvcGUpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgZm9sZG91dFN0b3JhZ2VLZXkgPSAnZGlhcy5hbm5vdGF0aW9ucy5zaWRlYmFyLWZvbGRvdXQnO1xuXG4gICAgICAgICRzY29wZS5mb2xkb3V0ID0gJyc7XG5cblx0XHQkc2NvcGUub3BlbkZvbGRvdXQgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVtmb2xkb3V0U3RvcmFnZUtleV0gPSBuYW1lO1xuICAgICAgICAgICAgJHNjb3BlLmZvbGRvdXQgPSBuYW1lO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzaWRlYmFyLmZvbGRvdXQub3BlbicsIG5hbWUpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuY2xvc2VGb2xkb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGZvbGRvdXRTdG9yYWdlS2V5KTtcblx0XHRcdCRzY29wZS5mb2xkb3V0ID0gJyc7XG5cdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NpZGViYXIuZm9sZG91dC5jbG9zZScpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlRm9sZG91dCA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmZvbGRvdXQgPT09IG5hbWUpIHtcblx0XHRcdFx0JHNjb3BlLmNsb3NlRm9sZG91dCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLm9wZW5Gb2xkb3V0KG5hbWUpO1xuXHRcdFx0fVxuXHRcdH07XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5kby1vcGVuJywgZnVuY3Rpb24gKGUsIG5hbWUpIHtcbiAgICAgICAgICAgICRzY29wZS5vcGVuRm9sZG91dChuYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gdGhlIGN1cnJlbnRseSBvcGVuZWQgc2lkZWJhci0nZXh0ZW5zaW9uJyBpcyByZW1lbWJlcmVkIHRocm91Z2ggbG9jYWxTdG9yYWdlXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW2ZvbGRvdXRTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgJHNjb3BlLm9wZW5Gb2xkb3V0KHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldKTtcbiAgICAgICAgfVxuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTaWRlYmFyRGVsZXRlU2VsZWN0ZWRBbm5vdGF0aW9uc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgY2F0ZWdvcnkgZm9sZG91dCBidXR0b25cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTaWRlYmFyRGVsZXRlU2VsZWN0ZWRBbm5vdGF0aW9uc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBrZXlib2FyZCwgbWFwQW5ub3RhdGlvbnMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuZGVsZXRlU2VsZWN0ZWRBbm5vdGF0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChtYXBBbm5vdGF0aW9ucy5nZXRTZWxlY3RlZEZlYXR1cmVzKCkuZ2V0TGVuZ3RoKCkgPiAwICYmIGNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgYWxsIHNlbGVjdGVkIGFubm90YXRpb25zPycpKSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuZGVsZXRlU2VsZWN0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBrZXlib2FyZC5vbig0NiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICRzY29wZS5kZWxldGVTZWxlY3RlZEFubm90YXRpb25zKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGFubm90YXRpb25MaXN0SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBbiBhbm5vdGF0aW9uIGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5kaXJlY3RpdmUoJ2Fubm90YXRpb25MaXN0SXRlbScsIGZ1bmN0aW9uIChsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRzY29wZTogdHJ1ZSxcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0JHNjb3BlLnNoYXBlQ2xhc3MgPSAnaWNvbi0nICsgJHNjb3BlLmFubm90YXRpb24uc2hhcGUudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0XHQkc2NvcGUuc2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS5pc1NlbGVjdGVkKCRzY29wZS5hbm5vdGF0aW9uLmlkKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuYXR0YWNoTGFiZWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0bGFiZWxzLmF0dGFjaFRvQW5ub3RhdGlvbigkc2NvcGUuYW5ub3RhdGlvbik7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLnJlbW92ZUxhYmVsID0gZnVuY3Rpb24gKGxhYmVsKSB7XG5cdFx0XHRcdFx0bGFiZWxzLnJlbW92ZUZyb21Bbm5vdGF0aW9uKCRzY29wZS5hbm5vdGF0aW9uLCBsYWJlbCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmNhbkF0dGFjaExhYmVsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuc2VsZWN0ZWQoKSAmJiBsYWJlbHMuaGFzU2VsZWN0ZWQoKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudExhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkO1xuXG5cdFx0XHRcdCRzY29wZS5jdXJyZW50Q29uZmlkZW5jZSA9IGxhYmVscy5nZXRDdXJyZW50Q29uZmlkZW5jZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhYmVsQ2F0ZWdvcnlJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgbGFiZWwgY2F0ZWdvcnkgbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmRpcmVjdGl2ZSgnbGFiZWxDYXRlZ29yeUl0ZW0nLCBmdW5jdGlvbiAoJGNvbXBpbGUsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdDJyxcblxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdsYWJlbC1pdGVtLmh0bWwnLFxuXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHdhaXQgZm9yIHRoaXMgZWxlbWVudCB0byBiZSByZW5kZXJlZCB1bnRpbCB0aGUgY2hpbGRyZW4gYXJlXG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kZWQsIG90aGVyd2lzZSB0aGVyZSB3b3VsZCBiZSB0b28gbXVjaCByZWN1cnNpb24gZm9yXG4gICAgICAgICAgICAgICAgLy8gYW5ndWxhclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnbGFiZWwtc3VidHJlZS5odG1sJykpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoY29udGVudCkoc2NvcGUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIHRoZSBzdWJ0cmVlIG9mIHRoaXMgaXRlbVxuICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaGFzIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzRXhwYW5kYWJsZSA9ICRzY29wZS50cmVlICYmICEhJHNjb3BlLnRyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8gaGFuZGxlIHRoaXMgYnkgdGhlIGV2ZW50IHJhdGhlciB0aGFuIGFuIG93biBjbGljayBoYW5kbGVyIHRvXG4gICAgICAgICAgICAgICAgLy8gZGVhbCB3aXRoIGNsaWNrIGFuZCBzZWFyY2ggZmllbGQgYWN0aW9ucyBpbiBhIHVuaWZpZWQgd2F5XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGZ1bmN0aW9uIChlLCBjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbiBpdGVtIGlzIHNlbGVjdGVkLCBpdHMgc3VidHJlZSBhbmQgYWxsIHBhcmVudCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgb3BlbmVkXG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5pZCA9PT0gY2F0ZWdvcnkuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBoaXRzIGFsbCBwYXJlbnQgc2NvcGVzL2l0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGEgY2hpbGQgaXRlbSB3YXMgc2VsZWN0ZWQsIHRoaXMgaXRlbSBzaG91bGQgYmUgb3BlbmVkLCB0b29cbiAgICAgICAgICAgICAgICAvLyBzbyB0aGUgc2VsZWN0ZWQgaXRlbSBiZWNvbWVzIHZpc2libGUgaW4gdGhlIHRyZWVcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3AgcHJvcGFnYXRpb24gaWYgdGhpcyBpcyBhIHJvb3QgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0ucGFyZW50X2lkID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYWJlbEl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQW4gYW5ub3RhdGlvbiBsYWJlbCBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZGlyZWN0aXZlKCdsYWJlbEl0ZW0nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFx0XHR2YXIgY29uZmlkZW5jZSA9ICRzY29wZS5hbm5vdGF0aW9uTGFiZWwuY29uZmlkZW5jZTtcblxuXHRcdFx0XHRpZiAoY29uZmlkZW5jZSA8PSAwLjI1KSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLWRhbmdlcic7XG5cdFx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjUgKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXdhcm5pbmcnO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC43NSApIHtcblx0XHRcdFx0XHQkc2NvcGUuY2xhc3MgPSAnbGFiZWwtc3VjY2Vzcyc7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXByaW1hcnknO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgZGVib3VuY2VcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQSBkZWJvdW5jZSBzZXJ2aWNlIHRvIHBlcmZvcm0gYW4gYWN0aW9uIG9ubHkgd2hlbiB0aGlzIGZ1bmN0aW9uXG4gKiB3YXNuJ3QgY2FsbGVkIGFnYWluIGluIGEgc2hvcnQgcGVyaW9kIG9mIHRpbWUuXG4gKiBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTMzMjAwMTYvMTc5NjUyM1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmZhY3RvcnkoJ2RlYm91bmNlJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkcSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHRpbWVvdXRzID0ge307XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gKGZ1bmMsIHdhaXQsIGlkKSB7XG5cdFx0XHQvLyBDcmVhdGUgYSBkZWZlcnJlZCBvYmplY3QgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gd2UgbmVlZCB0b1xuXHRcdFx0Ly8gYWN0dWFsbHkgY2FsbCB0aGUgZnVuY1xuXHRcdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHRcdFx0dmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGltZW91dHNbaWRdID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKSk7XG5cdFx0XHRcdFx0ZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpZiAodGltZW91dHNbaWRdKSB7XG5cdFx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRzW2lkXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGltZW91dHNbaWRdID0gJHRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHRcdH0pKCk7XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIG1hcFxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIGZhY3RvcnkgaGFuZGxpbmcgT3BlbkxheWVycyBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5mYWN0b3J5KCdtYXAnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgbWFwID0gbmV3IG9sLk1hcCh7XG5cdFx0XHR0YXJnZXQ6ICdjYW52YXMnLFxuICAgICAgICAgICAgcmVuZGVyZXI6ICdjYW52YXMnLFxuXHRcdFx0Y29udHJvbHM6IFtcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuWm9vbSgpLFxuXHRcdFx0XHRuZXcgb2wuY29udHJvbC5ab29tVG9FeHRlbnQoKSxcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuRnVsbFNjcmVlbigpXG5cdFx0XHRdLFxuICAgICAgICAgICAgaW50ZXJhY3Rpb25zOiBvbC5pbnRlcmFjdGlvbi5kZWZhdWx0cyh7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQ6IGZhbHNlXG4gICAgICAgICAgICB9KVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIG1hcDtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgYW5ub3RhdGlvbnNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIHRoZSBhbm5vdGF0aW9ucyB0byBtYWtlIHRoZW0gYXZhaWxhYmxlIGluIG11bHRpcGxlIGNvbnRyb2xsZXJzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2Fubm90YXRpb25zJywgZnVuY3Rpb24gKEFubm90YXRpb24sIHNoYXBlcywgbXNnKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgYW5ub3RhdGlvbnM7XG4gICAgICAgIHZhciBwcm9taXNlO1xuXG5cdFx0dmFyIHJlc29sdmVTaGFwZU5hbWUgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0YW5ub3RhdGlvbi5zaGFwZSA9IHNoYXBlcy5nZXROYW1lKGFubm90YXRpb24uc2hhcGVfaWQpO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb247XG5cdFx0fTtcblxuXHRcdHZhciBhZGRBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdGFubm90YXRpb25zLnB1c2goYW5ub3RhdGlvbik7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbjtcblx0XHR9O1xuXG5cdFx0dGhpcy5xdWVyeSA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcblx0XHRcdGFubm90YXRpb25zID0gQW5ub3RhdGlvbi5xdWVyeShwYXJhbXMpO1xuICAgICAgICAgICAgcHJvbWlzZSA9IGFubm90YXRpb25zLiRwcm9taXNlO1xuXHRcdFx0cHJvbWlzZS50aGVuKGZ1bmN0aW9uIChhKSB7XG5cdFx0XHRcdGEuZm9yRWFjaChyZXNvbHZlU2hhcGVOYW1lKTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb25zO1xuXHRcdH07XG5cblx0XHR0aGlzLmFkZCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcblx0XHRcdGlmICghcGFyYW1zLnNoYXBlX2lkICYmIHBhcmFtcy5zaGFwZSkge1xuXHRcdFx0XHRwYXJhbXMuc2hhcGVfaWQgPSBzaGFwZXMuZ2V0SWQocGFyYW1zLnNoYXBlKTtcblx0XHRcdH1cblx0XHRcdHZhciBhbm5vdGF0aW9uID0gQW5ub3RhdGlvbi5hZGQocGFyYW1zKTtcblx0XHRcdGFubm90YXRpb24uJHByb21pc2Vcblx0XHRcdCAgICAgICAgICAudGhlbihyZXNvbHZlU2hhcGVOYW1lKVxuXHRcdFx0ICAgICAgICAgIC50aGVuKGFkZEFubm90YXRpb24pXG5cdFx0XHQgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcblxuXHRcdFx0cmV0dXJuIGFubm90YXRpb247XG5cdFx0fTtcblxuXHRcdHRoaXMuZGVsZXRlID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdC8vIHVzZSBpbmRleCB0byBzZWUgaWYgdGhlIGFubm90YXRpb24gZXhpc3RzIGluIHRoZSBhbm5vdGF0aW9ucyBsaXN0XG5cdFx0XHR2YXIgaW5kZXggPSBhbm5vdGF0aW9ucy5pbmRleE9mKGFubm90YXRpb24pO1xuXHRcdFx0aWYgKGluZGV4ID4gLTEpIHtcblx0XHRcdFx0cmV0dXJuIGFubm90YXRpb24uJGRlbGV0ZShmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0Ly8gdXBkYXRlIHRoZSBpbmRleCBzaW5jZSB0aGUgYW5ub3RhdGlvbnMgbGlzdCBtYXkgaGF2ZSBiZWVuXG5cdFx0XHRcdFx0Ly8gbW9kaWZpZWQgaW4gdGhlIG1lYW50aW1lXG5cdFx0XHRcdFx0aW5kZXggPSBhbm5vdGF0aW9ucy5pbmRleE9mKGFubm90YXRpb24pO1xuXHRcdFx0XHRcdGFubm90YXRpb25zLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdH0sIG1zZy5yZXNwb25zZUVycm9yKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5mb3JFYWNoID0gZnVuY3Rpb24gKGZuKSB7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnMuZm9yRWFjaChmbik7XG5cdFx0fTtcblxuXHRcdHRoaXMuY3VycmVudCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9ucztcblx0XHR9O1xuXG4gICAgICAgIHRoaXMuZ2V0UHJvbWlzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBpbWFnZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFuYWdlcyAocHJlLSlsb2FkaW5nIG9mIHRoZSBpbWFnZXMgdG8gYW5ub3RhdGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnaW1hZ2VzJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIFRyYW5zZWN0SW1hZ2UsIFVSTCwgJHEsIGZpbHRlclN1YnNldCwgVFJBTlNFQ1RfSUQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cdFx0Ly8gYXJyYXkgb2YgYWxsIGltYWdlIElEcyBvZiB0aGUgdHJhbnNlY3Rcblx0XHR2YXIgaW1hZ2VJZHMgPSBbXTtcblx0XHQvLyBtYXhpbXVtIG51bWJlciBvZiBpbWFnZXMgdG8gaG9sZCBpbiBidWZmZXJcblx0XHR2YXIgTUFYX0JVRkZFUl9TSVpFID0gMTA7XG5cdFx0Ly8gYnVmZmVyIG9mIGFscmVhZHkgbG9hZGVkIGltYWdlc1xuXHRcdHZhciBidWZmZXIgPSBbXTtcblxuXHRcdC8vIHRoZSBjdXJyZW50bHkgc2hvd24gaW1hZ2Vcblx0XHR0aGlzLmN1cnJlbnRJbWFnZSA9IHVuZGVmaW5lZDtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIG5leHQgSUQgb2YgdGhlIHNwZWNpZmllZCBpbWFnZSBvciB0aGUgbmV4dCBJRCBvZiB0aGVcblx0XHQgKiBjdXJyZW50IGltYWdlIGlmIG5vIGltYWdlIHdhcyBzcGVjaWZpZWQuXG5cdFx0ICovXG5cdFx0dmFyIG5leHRJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0aWQgPSBpZCB8fCBfdGhpcy5jdXJyZW50SW1hZ2UuX2lkO1xuXHRcdFx0dmFyIGluZGV4ID0gaW1hZ2VJZHMuaW5kZXhPZihpZCk7XG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHNbKGluZGV4ICsgMSkgJSBpbWFnZUlkcy5sZW5ndGhdO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBwcmV2aW91cyBJRCBvZiB0aGUgc3BlY2lmaWVkIGltYWdlIG9yIHRoZSBwcmV2aW91cyBJRCBvZlxuXHRcdCAqIHRoZSBjdXJyZW50IGltYWdlIGlmIG5vIGltYWdlIHdhcyBzcGVjaWZpZWQuXG5cdFx0ICovXG5cdFx0dmFyIHByZXZJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0aWQgPSBpZCB8fCBfdGhpcy5jdXJyZW50SW1hZ2UuX2lkO1xuXHRcdFx0dmFyIGluZGV4ID0gaW1hZ2VJZHMuaW5kZXhPZihpZCk7XG5cdFx0XHR2YXIgbGVuZ3RoID0gaW1hZ2VJZHMubGVuZ3RoO1xuXHRcdFx0cmV0dXJuIGltYWdlSWRzWyhpbmRleCAtIDEgKyBsZW5ndGgpICUgbGVuZ3RoXTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgc3BlY2lmaWVkIGltYWdlIGZyb20gdGhlIGJ1ZmZlciBvciBgdW5kZWZpbmVkYCBpZiBpdCBpc1xuXHRcdCAqIG5vdCBidWZmZXJlZC5cblx0XHQgKi9cblx0XHR2YXIgZ2V0SW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdGZvciAodmFyIGkgPSBidWZmZXIubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0aWYgKGJ1ZmZlcltpXS5faWQgPT0gaWQpIHJldHVybiBidWZmZXJbaV07XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNldHMgdGhlIHNwZWNpZmllZCBpbWFnZSB0byBhcyB0aGUgY3VycmVudGx5IHNob3duIGltYWdlLlxuXHRcdCAqL1xuXHRcdHZhciBzaG93ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRfdGhpcy5jdXJyZW50SW1hZ2UgPSBnZXRJbWFnZShpZCk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIExvYWRzIHRoZSBzcGVjaWZpZWQgaW1hZ2UgZWl0aGVyIGZyb20gYnVmZmVyIG9yIGZyb20gdGhlIGV4dGVybmFsXG5cdFx0ICogcmVzb3VyY2UuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgZ2V0cyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpc1xuXHRcdCAqIGxvYWRlZC5cblx0XHQgKi9cblx0XHR2YXIgZmV0Y2hJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdHZhciBpbWcgPSBnZXRJbWFnZShpZCk7XG5cblx0XHRcdGlmIChpbWcpIHtcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbWcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG5cdFx0XHRcdGltZy5faWQgPSBpZDtcblx0XHRcdFx0aW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRidWZmZXIucHVzaChpbWcpO1xuXHRcdFx0XHRcdC8vIGNvbnRyb2wgbWF4aW11bSBidWZmZXIgc2l6ZVxuXHRcdFx0XHRcdGlmIChidWZmZXIubGVuZ3RoID4gTUFYX0JVRkZFUl9TSVpFKSB7XG5cdFx0XHRcdFx0XHRidWZmZXIuc2hpZnQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbWcpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpbWcub25lcnJvciA9IGZ1bmN0aW9uIChtc2cpIHtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3QobXNnKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aW1nLnNyYyA9IFVSTCArIFwiL2FwaS92MS9pbWFnZXMvXCIgKyBpZCArIFwiL2ZpbGVcIjtcblx0XHRcdH1cblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdpbWFnZS5mZXRjaGluZycsIGltZyk7XG5cblx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBJbml0aWFsaXplcyB0aGUgc2VydmljZSBmb3IgYSBnaXZlbiB0cmFuc2VjdC4gUmV0dXJucyBhIHByb21pc2UgdGhhdFxuXHRcdCAqIGlzIHJlc29sdmVkLCB3aGVuIHRoZSBzZXJ2aWNlIGlzIGluaXRpYWxpemVkLlxuXHRcdCAqL1xuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGltYWdlSWRzID0gVHJhbnNlY3RJbWFnZS5xdWVyeSh7dHJhbnNlY3RfaWQ6IFRSQU5TRUNUX0lEfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGxvb2sgZm9yIGEgc2VxdWVuY2Ugb2YgaW1hZ2UgSURzIGluIGxvY2FsIHN0b3JhZ2UuXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBzZXF1ZW5jZSBpcyBwcm9kdWNlcyBieSB0aGUgdHJhbnNlY3QgaW5kZXggcGFnZSB3aGVuIHRoZSBpbWFnZXMgYXJlXG4gICAgICAgICAgICAgICAgLy8gc29ydGVkIG9yIGZpbHRlcmVkLiB3ZSB3YW50IHRvIHJlZmxlY3QgdGhlIHNhbWUgb3JkZXJpbmcgb3IgZmlsdGVyaW5nIGhlcmVcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGUgYW5ub3RhdG9yXG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlZFNlcXVlbmNlID0gd2luZG93LmxvY2FsU3RvcmFnZVsnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5pbWFnZXMnXTtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmVkU2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmVkU2VxdWVuY2UgPSBKU09OLnBhcnNlKHN0b3JlZFNlcXVlbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgc3VjaCBhIHN0b3JlZCBzZXF1ZW5jZSwgZmlsdGVyIG91dCBhbnkgaW1hZ2UgSURzIHRoYXQgZG8gbm90XG4gICAgICAgICAgICAgICAgICAgIC8vIGJlbG9uZyB0byB0aGUgdHJhbnNlY3QgKGFueSBtb3JlKSwgc2luY2Ugc29tZSBvZiB0aGVtIG1heSBoYXZlIGJlZW4gZGVsZXRlZFxuICAgICAgICAgICAgICAgICAgICAvLyBpbiB0aGUgbWVhbnRpbWVcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyU3Vic2V0KHN0b3JlZFNlcXVlbmNlLCBpbWFnZUlkcyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgcHJvbWlzZSBpcyBub3QgcmVtb3ZlZCB3aGVuIG92ZXJ3cml0aW5nIGltYWdlSWRzIHNpbmNlIHdlXG4gICAgICAgICAgICAgICAgICAgIC8vIG5lZWQgaXQgbGF0ZXIgb24uXG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlLiRwcm9taXNlID0gaW1hZ2VJZHMuJHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlLiRyZXNvbHZlZCA9IGltYWdlSWRzLiRyZXNvbHZlZDtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlbiBzZXQgdGhlIHN0b3JlZCBzZXF1ZW5jZSBhcyB0aGUgc2VxdWVuY2Ugb2YgaW1hZ2UgSURzIGluc3RlYWQgb2Ygc2ltcGx5XG4gICAgICAgICAgICAgICAgICAgIC8vIGFsbCBJRHMgYmVsb25naW5nIHRvIHRoZSB0cmFuc2VjdFxuICAgICAgICAgICAgICAgICAgICBpbWFnZUlkcyA9IHN0b3JlZFNlcXVlbmNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHMuJHByb21pc2U7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNob3cgdGhlIGltYWdlIHdpdGggdGhlIHNwZWNpZmllZCBJRC4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMuc2hvdyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIHByb21pc2UgPSBmZXRjaEltYWdlKGlkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzaG93KGlkKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyB3YWl0IGZvciBpbWFnZUlkcyB0byBiZSBsb2FkZWRcblx0XHRcdGltYWdlSWRzLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyBwcmUtbG9hZCBwcmV2aW91cyBhbmQgbmV4dCBpbWFnZXMgYnV0IGRvbid0IGRpc3BsYXkgdGhlbVxuXHRcdFx0XHRmZXRjaEltYWdlKG5leHRJZChpZCkpO1xuXHRcdFx0XHRmZXRjaEltYWdlKHByZXZJZChpZCkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBwcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBuZXh0IGltYWdlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzXG5cdFx0ICogcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXMgc2hvd24uXG5cdFx0ICovXG5cdFx0dGhpcy5uZXh0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF90aGlzLnNob3cobmV4dElkKCkpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBwcmV2aW91cyBpbWFnZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMucHJldiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfdGhpcy5zaG93KHByZXZJZCgpKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRDdXJyZW50SWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBrZXlib2FyZFxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIHRvIHJlZ2lzdGVyIGFuZCBtYW5hZ2Uga2V5cHJlc3MgZXZlbnRzIHdpdGggcHJpb3JpdGllc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2tleWJvYXJkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBtYXBzIGtleSBjb2Rlcy9jaGFyYWN0ZXJzIHRvIGFycmF5cyBvZiBsaXN0ZW5lcnNcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHt9O1xuXG4gICAgICAgIHZhciBleGVjdXRlQ2FsbGJhY2tzID0gZnVuY3Rpb24gKGxpc3QsIGUpIHtcbiAgICAgICAgICAgIC8vIGdvIGZyb20gaGlnaGVzdCBwcmlvcml0eSBkb3duXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gbGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrcyBjYW4gY2FuY2VsIGZ1cnRoZXIgcHJvcGFnYXRpb25cbiAgICAgICAgICAgICAgICBpZiAobGlzdFtpXS5jYWxsYmFjayhlKSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlS2V5RXZlbnRzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHZhciBjb2RlID0gZS5rZXlDb2RlO1xuICAgICAgICAgICAgdmFyIGNoYXJhY3RlciA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZS53aGljaCB8fCBjb2RlKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NvZGVdKSB7XG4gICAgICAgICAgICAgICAgZXhlY3V0ZUNhbGxiYWNrcyhsaXN0ZW5lcnNbY29kZV0sIGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NoYXJhY3Rlcl0pIHtcbiAgICAgICAgICAgICAgICBleGVjdXRlQ2FsbGJhY2tzKGxpc3RlbmVyc1tjaGFyYWN0ZXJdLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5RXZlbnRzKTtcblxuICAgICAgICAvLyByZWdpc3RlciBhIG5ldyBldmVudCBsaXN0ZW5lciBmb3IgdGhlIGtleSBjb2RlIG9yIGNoYXJhY3RlciB3aXRoIGFuIG9wdGlvbmFsIHByaW9yaXR5XG4gICAgICAgIC8vIGxpc3RlbmVycyB3aXRoIGhpZ2hlciBwcmlvcml0eSBhcmUgY2FsbGVkIGZpcnN0IGFuYyBjYW4gcmV0dXJuICdmYWxzZScgdG8gcHJldmVudCB0aGVcbiAgICAgICAgLy8gbGlzdGVuZXJzIHdpdGggbG93ZXIgcHJpb3JpdHkgZnJvbSBiZWluZyBjYWxsZWRcbiAgICAgICAgdGhpcy5vbiA9IGZ1bmN0aW9uIChjaGFyT3JDb2RlLCBjYWxsYmFjaywgcHJpb3JpdHkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2hhck9yQ29kZSA9PT0gJ3N0cmluZycgfHwgY2hhck9yQ29kZSBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICAgICAgICAgIGNoYXJPckNvZGUgPSBjaGFyT3JDb2RlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcbiAgICAgICAgICAgIHZhciBsaXN0ZW5lciA9IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IHByaW9yaXR5XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NoYXJPckNvZGVdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBsaXN0ZW5lcnNbY2hhck9yQ29kZV07XG4gICAgICAgICAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdFtpXS5wcmlvcml0eSA+PSBwcmlvcml0eSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IGxpc3QubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3Quc3BsaWNlKGksIDAsIGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzW2NoYXJPckNvZGVdID0gW2xpc3RlbmVyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyB1bnJlZ2lzdGVyIGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIHRoaXMub2ZmID0gZnVuY3Rpb24gKGNoYXJPckNvZGUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNoYXJPckNvZGUgPT09ICdzdHJpbmcnIHx8IGNoYXJPckNvZGUgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBjaGFyT3JDb2RlID0gY2hhck9yQ29kZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NoYXJPckNvZGVdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBsaXN0ZW5lcnNbY2hhck9yQ29kZV07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaXN0W2ldLmNhbGxiYWNrID09PSBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBsYWJlbHNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGZvciBhbm5vdGF0aW9uIGxhYmVscyB0byBwcm92aWRlIHNvbWUgY29udmVuaWVuY2UgZnVuY3Rpb25zLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2xhYmVscycsIGZ1bmN0aW9uIChBbm5vdGF0aW9uTGFiZWwsIExhYmVsLCBQcm9qZWN0TGFiZWwsIFByb2plY3QsIG1zZywgJHEsIFBST0pFQ1RfSURTKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZExhYmVsO1xuICAgICAgICB2YXIgY3VycmVudENvbmZpZGVuY2UgPSAxLjA7XG5cbiAgICAgICAgdmFyIGxhYmVscyA9IHt9O1xuXG4gICAgICAgIC8vIHRoaXMgcHJvbWlzZSBpcyByZXNvbHZlZCB3aGVuIGFsbCBsYWJlbHMgd2VyZSBsb2FkZWRcbiAgICAgICAgdGhpcy5wcm9taXNlID0gbnVsbDtcblxuICAgICAgICB0aGlzLmZldGNoRm9yQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICBpZiAoIWFubm90YXRpb24pIHJldHVybjtcblxuICAgICAgICAgICAgLy8gZG9uJ3QgZmV0Y2ggdHdpY2VcbiAgICAgICAgICAgIGlmICghYW5ub3RhdGlvbi5sYWJlbHMpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscyA9IEFubm90YXRpb25MYWJlbC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgIGFubm90YXRpb25faWQ6IGFubm90YXRpb24uaWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFubm90YXRpb24ubGFiZWxzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYXR0YWNoVG9Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IEFubm90YXRpb25MYWJlbC5hdHRhY2goe1xuICAgICAgICAgICAgICAgIGFubm90YXRpb25faWQ6IGFubm90YXRpb24uaWQsXG4gICAgICAgICAgICAgICAgbGFiZWxfaWQ6IHNlbGVjdGVkTGFiZWwuaWQsXG4gICAgICAgICAgICAgICAgY29uZmlkZW5jZTogY3VycmVudENvbmZpZGVuY2VcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsYWJlbC4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscy5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsYWJlbC4kcHJvbWlzZS5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG5cbiAgICAgICAgICAgIHJldHVybiBsYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJlbW92ZUZyb21Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24sIGxhYmVsKSB7XG4gICAgICAgICAgICAvLyB1c2UgaW5kZXggdG8gc2VlIGlmIHRoZSBsYWJlbCBleGlzdHMgZm9yIHRoZSBhbm5vdGF0aW9uXG4gICAgICAgICAgICB2YXIgaW5kZXggPSBhbm5vdGF0aW9uLmxhYmVscy5pbmRleE9mKGxhYmVsKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFubm90YXRpb25MYWJlbC5kZWxldGUoe2lkOiBsYWJlbC5pZH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBpbmRleCBzaW5jZSB0aGUgbGFiZWwgbGlzdCBtYXkgaGF2ZSBiZWVuIG1vZGlmaWVkXG4gICAgICAgICAgICAgICAgICAgIC8vIGluIHRoZSBtZWFudGltZVxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGFubm90YXRpb24ubGFiZWxzLmluZGV4T2YobGFiZWwpO1xuICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIH0sIG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldFRyZWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHt9O1xuICAgICAgICAgICAgdmFyIGtleSA9IG51bGw7XG4gICAgICAgICAgICB2YXIgYnVpbGQgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gbGFiZWwucGFyZW50X2lkO1xuICAgICAgICAgICAgICAgIGlmICh0cmVlW2tleV1bcGFyZW50XSkge1xuICAgICAgICAgICAgICAgICAgICB0cmVlW2tleV1bcGFyZW50XS5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cmVlW2tleV1bcGFyZW50XSA9IFtsYWJlbF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5wcm9taXNlLnRoZW4oZnVuY3Rpb24gKGxhYmVscykge1xuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGxhYmVscykge1xuICAgICAgICAgICAgICAgICAgICB0cmVlW2tleV0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxzW2tleV0uZm9yRWFjaChidWlsZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cmVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxhYmVscztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldFNlbGVjdGVkID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICBzZWxlY3RlZExhYmVsID0gbGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZExhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzU2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFzZWxlY3RlZExhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2V0Q3VycmVudENvbmZpZGVuY2UgPSBmdW5jdGlvbiAoY29uZmlkZW5jZSkge1xuICAgICAgICAgICAgY3VycmVudENvbmZpZGVuY2UgPSBjb25maWRlbmNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0Q3VycmVudENvbmZpZGVuY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudENvbmZpZGVuY2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gaW5pdFxuICAgICAgICAoZnVuY3Rpb24gKF90aGlzKSB7XG4gICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgX3RoaXMucHJvbWlzZSA9IGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICAvLyAtMSBiZWNhdXNlIG9mIGdsb2JhbCBsYWJlbHNcbiAgICAgICAgICAgIHZhciBmaW5pc2hlZCA9IC0xO1xuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBhbGwgbGFiZWxzIGFyZSB0aGVyZS4gaWYgeWVzLCByZXNvbHZlXG4gICAgICAgICAgICB2YXIgbWF5YmVSZXNvbHZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgrK2ZpbmlzaGVkID09PSBQUk9KRUNUX0lEUy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShsYWJlbHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGxhYmVsc1tudWxsXSA9IExhYmVsLnF1ZXJ5KG1heWJlUmVzb2x2ZSk7XG5cbiAgICAgICAgICAgIFBST0pFQ1RfSURTLmZvckVhY2goZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICAgICAgUHJvamVjdC5nZXQoe2lkOiBpZH0sIGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsc1twcm9qZWN0Lm5hbWVdID0gUHJvamVjdExhYmVsLnF1ZXJ5KHtwcm9qZWN0X2lkOiBpZH0sIG1heWJlUmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkodGhpcyk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbWFwQW5ub3RhdGlvbnNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGhhbmRsaW5nIHRoZSBhbm5vdGF0aW9ucyBsYXllciBvbiB0aGUgT3BlbkxheWVycyBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdtYXBBbm5vdGF0aW9ucycsIGZ1bmN0aW9uIChtYXAsIGltYWdlcywgYW5ub3RhdGlvbnMsIGRlYm91bmNlLCBzdHlsZXMsICRpbnRlcnZhbCwgbGFiZWxzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGFubm90YXRpb25GZWF0dXJlcyA9IG5ldyBvbC5Db2xsZWN0aW9uKCk7XG4gICAgICAgIHZhciBhbm5vdGF0aW9uU291cmNlID0gbmV3IG9sLnNvdXJjZS5WZWN0b3Ioe1xuICAgICAgICAgICAgZmVhdHVyZXM6IGFubm90YXRpb25GZWF0dXJlc1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGFubm90YXRpb25MYXllciA9IG5ldyBvbC5sYXllci5WZWN0b3Ioe1xuICAgICAgICAgICAgc291cmNlOiBhbm5vdGF0aW9uU291cmNlLFxuICAgICAgICAgICAgc3R5bGU6IHN0eWxlcy5mZWF0dXJlcyxcbiAgICAgICAgICAgIHpJbmRleDogMTAwXG4gICAgICAgIH0pO1xuXG5cdFx0Ly8gc2VsZWN0IGludGVyYWN0aW9uIHdvcmtpbmcgb24gXCJzaW5nbGVjbGlja1wiXG5cdFx0dmFyIHNlbGVjdCA9IG5ldyBvbC5pbnRlcmFjdGlvbi5TZWxlY3Qoe1xuXHRcdFx0c3R5bGU6IHN0eWxlcy5oaWdobGlnaHQsXG4gICAgICAgICAgICBsYXllcnM6IFthbm5vdGF0aW9uTGF5ZXJdLFxuICAgICAgICAgICAgLy8gZW5hYmxlIHNlbGVjdGluZyBtdWx0aXBsZSBvdmVybGFwcGluZyBmZWF0dXJlcyBhdCBvbmNlXG4gICAgICAgICAgICBtdWx0aTogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0dmFyIHNlbGVjdGVkRmVhdHVyZXMgPSBzZWxlY3QuZ2V0RmVhdHVyZXMoKTtcblxuXHRcdHZhciBtb2RpZnkgPSBuZXcgb2wuaW50ZXJhY3Rpb24uTW9kaWZ5KHtcblx0XHRcdGZlYXR1cmVzOiBhbm5vdGF0aW9uRmVhdHVyZXMsXG5cdFx0XHQvLyB0aGUgU0hJRlQga2V5IG11c3QgYmUgcHJlc3NlZCB0byBkZWxldGUgdmVydGljZXMsIHNvXG5cdFx0XHQvLyB0aGF0IG5ldyB2ZXJ0aWNlcyBjYW4gYmUgZHJhd24gYXQgdGhlIHNhbWUgcG9zaXRpb25cblx0XHRcdC8vIG9mIGV4aXN0aW5nIHZlcnRpY2VzXG5cdFx0XHRkZWxldGVDb25kaXRpb246IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0XHRcdHJldHVybiBvbC5ldmVudHMuY29uZGl0aW9uLnNoaWZ0S2V5T25seShldmVudCkgJiYgb2wuZXZlbnRzLmNvbmRpdGlvbi5zaW5nbGVDbGljayhldmVudCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBkcmF3aW5nIGludGVyYWN0aW9uXG5cdFx0dmFyIGRyYXc7XG5cbiAgICAgICAgLy8gaW5kZXggb2YgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBhbm5vdGF0aW9uIChkdXJpbmcgY3ljbGluZyB0aHJvdWdoIGFubm90YXRpb25zKVxuICAgICAgICAvLyBpbiB0aGUgYW5ub3RhdGlvbkZlYXR1cmVzIGNvbGxlY3Rpb25cbiAgICAgICAgdmFyIGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggPSAwO1xuXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgdmFyIHNlbGVjdEFuZFNob3dBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcbiAgICAgICAgICAgIF90aGlzLmNsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICBpZiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkRmVhdHVyZXMucHVzaChhbm5vdGF0aW9uKTtcbiAgICAgICAgICAgICAgICBtYXAuZ2V0VmlldygpLmZpdChhbm5vdGF0aW9uLmdldEdlb21ldHJ5KCksIG1hcC5nZXRTaXplKCksIHtcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogWzUwLCA1MCwgNTAsIDUwXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG5cdFx0Ly8gY29udmVydCBhIHBvaW50IGFycmF5IHRvIGEgcG9pbnQgb2JqZWN0XG5cdFx0Ly8gcmUtaW52ZXJ0IHRoZSB5IGF4aXNcblx0XHR2YXIgY29udmVydEZyb21PTFBvaW50ID0gZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRyZXR1cm4ge3g6IHBvaW50WzBdLCB5OiBpbWFnZXMuY3VycmVudEltYWdlLmhlaWdodCAtIHBvaW50WzFdfTtcblx0XHR9O1xuXG5cdFx0Ly8gY29udmVydCBhIHBvaW50IG9iamVjdCB0byBhIHBvaW50IGFycmF5XG5cdFx0Ly8gaW52ZXJ0IHRoZSB5IGF4aXNcblx0XHR2YXIgY29udmVydFRvT0xQb2ludCA9IGZ1bmN0aW9uIChwb2ludCkge1xuXHRcdFx0cmV0dXJuIFtwb2ludC54LCBpbWFnZXMuY3VycmVudEltYWdlLmhlaWdodCAtIHBvaW50LnldO1xuXHRcdH07XG5cblx0XHQvLyBhc3NlbWJsZXMgdGhlIGNvb3JkaW5hdGUgYXJyYXlzIGRlcGVuZGluZyBvbiB0aGUgZ2VvbWV0cnkgdHlwZVxuXHRcdC8vIHNvIHRoZXkgaGF2ZSBhIHVuaWZpZWQgZm9ybWF0XG5cdFx0dmFyIGdldENvb3JkaW5hdGVzID0gZnVuY3Rpb24gKGdlb21ldHJ5KSB7XG5cdFx0XHRzd2l0Y2ggKGdlb21ldHJ5LmdldFR5cGUoKSkge1xuXHRcdFx0XHRjYXNlICdDaXJjbGUnOlxuXHRcdFx0XHRcdC8vIHJhZGl1cyBpcyB0aGUgeCB2YWx1ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjaXJjbGVcblx0XHRcdFx0XHRyZXR1cm4gW2dlb21ldHJ5LmdldENlbnRlcigpLCBbZ2VvbWV0cnkuZ2V0UmFkaXVzKCksIDBdXTtcblx0XHRcdFx0Y2FzZSAnUG9seWdvbic6XG5cdFx0XHRcdGNhc2UgJ1JlY3RhbmdsZSc6XG5cdFx0XHRcdFx0cmV0dXJuIGdlb21ldHJ5LmdldENvb3JkaW5hdGVzKClbMF07XG5cdFx0XHRcdGNhc2UgJ1BvaW50Jzpcblx0XHRcdFx0XHRyZXR1cm4gW2dlb21ldHJ5LmdldENvb3JkaW5hdGVzKCldO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdHJldHVybiBnZW9tZXRyeS5nZXRDb29yZGluYXRlcygpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBzYXZlcyB0aGUgdXBkYXRlZCBnZW9tZXRyeSBvZiBhbiBhbm5vdGF0aW9uIGZlYXR1cmVcblx0XHR2YXIgaGFuZGxlR2VvbWV0cnlDaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIGZlYXR1cmUgPSBlLnRhcmdldDtcblx0XHRcdHZhciBzYXZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR2YXIgY29vcmRpbmF0ZXMgPSBnZXRDb29yZGluYXRlcyhmZWF0dXJlLmdldEdlb21ldHJ5KCkpO1xuXHRcdFx0XHRmZWF0dXJlLmFubm90YXRpb24ucG9pbnRzID0gY29vcmRpbmF0ZXMubWFwKGNvbnZlcnRGcm9tT0xQb2ludCk7XG5cdFx0XHRcdGZlYXR1cmUuYW5ub3RhdGlvbi4kc2F2ZSgpO1xuXHRcdFx0fTtcblx0XHRcdC8vIHRoaXMgZXZlbnQgaXMgcmFwaWRseSBmaXJlZCwgc28gd2FpdCB1bnRpbCB0aGUgZmlyaW5nIHN0b3BzXG5cdFx0XHQvLyBiZWZvcmUgc2F2aW5nIHRoZSBjaGFuZ2VzXG5cdFx0XHRkZWJvdW5jZShzYXZlLCA1MDAsIGZlYXR1cmUuYW5ub3RhdGlvbi5pZCk7XG5cdFx0fTtcblxuXHRcdHZhciBjcmVhdGVGZWF0dXJlID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdHZhciBnZW9tZXRyeTtcblx0XHRcdHZhciBwb2ludHMgPSBhbm5vdGF0aW9uLnBvaW50cy5tYXAoY29udmVydFRvT0xQb2ludCk7XG5cblx0XHRcdHN3aXRjaCAoYW5ub3RhdGlvbi5zaGFwZSkge1xuXHRcdFx0XHRjYXNlICdQb2ludCc6XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5Qb2ludChwb2ludHNbMF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdSZWN0YW5nbGUnOlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uUmVjdGFuZ2xlKFsgcG9pbnRzIF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdQb2x5Z29uJzpcblx0XHRcdFx0XHQvLyBleGFtcGxlOiBodHRwczovL2dpdGh1Yi5jb20vb3BlbmxheWVycy9vbDMvYmxvYi9tYXN0ZXIvZXhhbXBsZXMvZ2VvanNvbi5qcyNMMTI2XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5Qb2x5Z29uKFsgcG9pbnRzIF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdMaW5lU3RyaW5nJzpcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLkxpbmVTdHJpbmcocG9pbnRzKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnQ2lyY2xlJzpcblx0XHRcdFx0XHQvLyByYWRpdXMgaXMgdGhlIHggdmFsdWUgb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY2lyY2xlXG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5DaXJjbGUocG9pbnRzWzBdLCBwb2ludHNbMV1bMF0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIHVuc3VwcG9ydGVkIHNoYXBlcyBhcmUgaWdub3JlZFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Vua25vd24gYW5ub3RhdGlvbiBzaGFwZTogJyArIGFubm90YXRpb24uc2hhcGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciBmZWF0dXJlID0gbmV3IG9sLkZlYXR1cmUoeyBnZW9tZXRyeTogZ2VvbWV0cnkgfSk7XG4gICAgICAgICAgICBmZWF0dXJlLmFubm90YXRpb24gPSBhbm5vdGF0aW9uO1xuICAgICAgICAgICAgaWYgKGFubm90YXRpb24ubGFiZWxzICYmIGFubm90YXRpb24ubGFiZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlLmNvbG9yID0gYW5ub3RhdGlvbi5sYWJlbHNbMF0ubGFiZWwuY29sb3I7XG4gICAgICAgICAgICB9XG5cdFx0XHRmZWF0dXJlLm9uKCdjaGFuZ2UnLCBoYW5kbGVHZW9tZXRyeUNoYW5nZSk7XG4gICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLmFkZEZlYXR1cmUoZmVhdHVyZSk7XG5cdFx0fTtcblxuXHRcdHZhciByZWZyZXNoQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoZSwgaW1hZ2UpIHtcblx0XHRcdC8vIGNsZWFyIGZlYXR1cmVzIG9mIHByZXZpb3VzIGltYWdlXG4gICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLmNsZWFyKCk7XG5cdFx0XHRfdGhpcy5jbGVhclNlbGVjdGlvbigpO1xuXG5cdFx0XHRhbm5vdGF0aW9ucy5xdWVyeSh7aWQ6IGltYWdlLl9pZH0pLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRhbm5vdGF0aW9ucy5mb3JFYWNoKGNyZWF0ZUZlYXR1cmUpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHZhciBoYW5kbGVOZXdGZWF0dXJlID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciBnZW9tZXRyeSA9IGUuZmVhdHVyZS5nZXRHZW9tZXRyeSgpO1xuXHRcdFx0dmFyIGNvb3JkaW5hdGVzID0gZ2V0Q29vcmRpbmF0ZXMoZ2VvbWV0cnkpO1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkKCk7XG5cbiAgICAgICAgICAgIGUuZmVhdHVyZS5jb2xvciA9IGxhYmVsLmNvbG9yO1xuXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbiA9IGFubm90YXRpb25zLmFkZCh7XG5cdFx0XHRcdGlkOiBpbWFnZXMuZ2V0Q3VycmVudElkKCksXG5cdFx0XHRcdHNoYXBlOiBnZW9tZXRyeS5nZXRUeXBlKCksXG5cdFx0XHRcdHBvaW50czogY29vcmRpbmF0ZXMubWFwKGNvbnZlcnRGcm9tT0xQb2ludCksXG4gICAgICAgICAgICAgICAgbGFiZWxfaWQ6IGxhYmVsLmlkLFxuICAgICAgICAgICAgICAgIGNvbmZpZGVuY2U6IGxhYmVscy5nZXRDdXJyZW50Q29uZmlkZW5jZSgpXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gaWYgdGhlIGZlYXR1cmUgY291bGRuJ3QgYmUgc2F2ZWQsIHJlbW92ZSBpdCBhZ2FpblxuXHRcdFx0ZS5mZWF0dXJlLmFubm90YXRpb24uJHByb21pc2UuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UucmVtb3ZlRmVhdHVyZShlLmZlYXR1cmUpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGUuZmVhdHVyZS5vbignY2hhbmdlJywgaGFuZGxlR2VvbWV0cnlDaGFuZ2UpO1xuXG4gICAgICAgICAgICByZXR1cm4gZS5mZWF0dXJlLmFubm90YXRpb24uJHByb21pc2U7XG5cdFx0fTtcblxuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgbWFwLmFkZExheWVyKGFubm90YXRpb25MYXllcik7XG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24oc2VsZWN0KTtcblx0XHRcdHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCByZWZyZXNoQW5ub3RhdGlvbnMpO1xuXG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLm9uKCdjaGFuZ2U6bGVuZ3RoJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyBpZiBub3QgYWxyZWFkeSBkaWdlc3RpbmcsIGRpZ2VzdFxuXHRcdFx0XHRpZiAoIXNjb3BlLiQkcGhhc2UpIHtcblx0XHRcdFx0XHQvLyBwcm9wYWdhdGUgbmV3IHNlbGVjdGlvbnMgdGhyb3VnaCB0aGUgYW5ndWxhciBhcHBsaWNhdGlvblxuXHRcdFx0XHRcdHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5zdGFydERyYXdpbmcgPSBmdW5jdGlvbiAodHlwZSkge1xuICAgICAgICAgICAgc2VsZWN0LnNldEFjdGl2ZShmYWxzZSk7XG5cblx0XHRcdHR5cGUgPSB0eXBlIHx8ICdQb2ludCc7XG5cdFx0XHRkcmF3ID0gbmV3IG9sLmludGVyYWN0aW9uLkRyYXcoe1xuICAgICAgICAgICAgICAgIHNvdXJjZTogYW5ub3RhdGlvblNvdXJjZSxcblx0XHRcdFx0dHlwZTogdHlwZSxcblx0XHRcdFx0c3R5bGU6IHN0eWxlcy5lZGl0aW5nXG5cdFx0XHR9KTtcblxuXHRcdFx0bWFwLmFkZEludGVyYWN0aW9uKG1vZGlmeSk7XG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24oZHJhdyk7XG5cdFx0XHRkcmF3Lm9uKCdkcmF3ZW5kJywgaGFuZGxlTmV3RmVhdHVyZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZmluaXNoRHJhd2luZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdG1hcC5yZW1vdmVJbnRlcmFjdGlvbihkcmF3KTtcblx0XHRcdG1hcC5yZW1vdmVJbnRlcmFjdGlvbihtb2RpZnkpO1xuICAgICAgICAgICAgc2VsZWN0LnNldEFjdGl2ZSh0cnVlKTtcblx0XHRcdC8vIGRvbid0IHNlbGVjdCB0aGUgbGFzdCBkcmF3biBwb2ludFxuXHRcdFx0X3RoaXMuY2xlYXJTZWxlY3Rpb24oKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5kZWxldGVTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoZmVhdHVyZSkge1xuXHRcdFx0XHRhbm5vdGF0aW9ucy5kZWxldGUoZmVhdHVyZS5hbm5vdGF0aW9uKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRhbm5vdGF0aW9uU291cmNlLnJlbW92ZUZlYXR1cmUoZmVhdHVyZSk7XG5cdFx0XHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5yZW1vdmUoZmVhdHVyZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuc2VsZWN0ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgZmVhdHVyZTtcblx0XHRcdGFubm90YXRpb25Tb3VyY2UuZm9yRWFjaEZlYXR1cmUoZnVuY3Rpb24gKGYpIHtcblx0XHRcdFx0aWYgKGYuYW5ub3RhdGlvbi5pZCA9PT0gaWQpIHtcblx0XHRcdFx0XHRmZWF0dXJlID0gZjtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyByZW1vdmUgc2VsZWN0aW9uIGlmIGZlYXR1cmUgd2FzIGFscmVhZHkgc2VsZWN0ZWQuIG90aGVyd2lzZSBzZWxlY3QuXG5cdFx0XHRpZiAoIXNlbGVjdGVkRmVhdHVyZXMucmVtb3ZlKGZlYXR1cmUpKSB7XG5cdFx0XHRcdHNlbGVjdGVkRmVhdHVyZXMucHVzaChmZWF0dXJlKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIC8vIGZpdHMgdGhlIHZpZXcgdG8gdGhlIGdpdmVuIGZlYXR1cmVcbiAgICAgICAgdGhpcy5maXQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuZm9yRWFjaEZlYXR1cmUoZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgICAgICAgICBpZiAoZi5hbm5vdGF0aW9uLmlkID09PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBhbmltYXRlIGZpdFxuICAgICAgICAgICAgICAgICAgICB2YXIgdmlldyA9IG1hcC5nZXRWaWV3KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYW4gPSBvbC5hbmltYXRpb24ucGFuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogdmlldy5nZXRDZW50ZXIoKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHpvb20gPSBvbC5hbmltYXRpb24uem9vbSh7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHV0aW9uOiB2aWV3LmdldFJlc29sdXRpb24oKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgbWFwLmJlZm9yZVJlbmRlcihwYW4sIHpvb20pO1xuICAgICAgICAgICAgICAgICAgICB2aWV3LmZpdChmLmdldEdlb21ldHJ5KCksIG1hcC5nZXRTaXplKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG5cdFx0dGhpcy5jbGVhclNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuY2xlYXIoKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRTZWxlY3RlZEZlYXR1cmVzID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHNlbGVjdGVkRmVhdHVyZXM7XG5cdFx0fTtcblxuICAgICAgICAvLyBtYW51YWxseSBhZGQgYSBuZXcgZmVhdHVyZSAobm90IHRocm91Z2ggdGhlIGRyYXcgaW50ZXJhY3Rpb24pXG4gICAgICAgIHRoaXMuYWRkRmVhdHVyZSA9IGZ1bmN0aW9uIChmZWF0dXJlKSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLmFkZEZlYXR1cmUoZmVhdHVyZSk7XG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlTmV3RmVhdHVyZSh7ZmVhdHVyZTogZmVhdHVyZX0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2V0T3BhY2l0eSA9IGZ1bmN0aW9uIChvcGFjaXR5KSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9uTGF5ZXIuc2V0T3BhY2l0eShvcGFjaXR5KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmN5Y2xlTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggPSAoY3VycmVudEFubm90YXRpb25JbmRleCArIDEpICUgYW5ub3RhdGlvbkZlYXR1cmVzLmdldExlbmd0aCgpO1xuICAgICAgICAgICAgX3RoaXMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAoY3VycmVudEFubm90YXRpb25JbmRleCArIDEpIDwgYW5ub3RhdGlvbkZlYXR1cmVzLmdldExlbmd0aCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuY3ljbGVQcmV2aW91cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIHdlIHdhbnQgbm8gbmVnYXRpdmUgaW5kZXggaGVyZVxuICAgICAgICAgICAgY3VycmVudEFubm90YXRpb25JbmRleCA9IChjdXJyZW50QW5ub3RhdGlvbkluZGV4ICsgYW5ub3RhdGlvbkZlYXR1cmVzLmdldExlbmd0aCgpIC0gMSkgJSBhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCk7XG4gICAgICAgICAgICBfdGhpcy5qdW1wVG9DdXJyZW50KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNQcmV2aW91cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50QW5ub3RhdGlvbkluZGV4ID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmp1bXBUb0N1cnJlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBvbmx5IGp1bXAgb25jZSB0aGUgYW5ub3RhdGlvbnMgd2VyZSBsb2FkZWRcbiAgICAgICAgICAgIGFubm90YXRpb25zLmdldFByb21pc2UoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RBbmRTaG93QW5ub3RhdGlvbihhbm5vdGF0aW9uRmVhdHVyZXMuaXRlbShjdXJyZW50QW5ub3RhdGlvbkluZGV4KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmp1bXBUb0ZpcnN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY3VycmVudEFubm90YXRpb25JbmRleCA9IDA7XG4gICAgICAgICAgICBfdGhpcy5qdW1wVG9DdXJyZW50KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5qdW1wVG9MYXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgYW5ub3RhdGlvbnMuZ2V0UHJvbWlzZSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIHdhaXQgZm9yIHRoZSBuZXcgYW5ub3RhdGlvbnMgdG8gYmUgbG9hZGVkXG4gICAgICAgICAgICAgICAgaWYgKGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50QW5ub3RhdGlvbkluZGV4ID0gYW5ub3RhdGlvbkZlYXR1cmVzLmdldExlbmd0aCgpIC0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX3RoaXMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZmxpY2tlciB0aGUgaGlnaGxpZ2h0ZWQgYW5ub3RhdGlvbiB0byBzaWduYWwgYW4gZXJyb3JcbiAgICAgICAgdGhpcy5mbGlja2VyID0gZnVuY3Rpb24gKGNvdW50KSB7XG4gICAgICAgICAgICB2YXIgYW5ub3RhdGlvbiA9IHNlbGVjdGVkRmVhdHVyZXMuaXRlbSgwKTtcbiAgICAgICAgICAgIGlmICghYW5ub3RhdGlvbikgcmV0dXJuO1xuICAgICAgICAgICAgY291bnQgPSBjb3VudCB8fCAzO1xuXG4gICAgICAgICAgICB2YXIgdG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZEZlYXR1cmVzLmdldExlbmd0aCgpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZEZlYXR1cmVzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRGZWF0dXJlcy5wdXNoKGFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBudW1iZXIgb2YgcmVwZWF0cyBtdXN0IGJlIGV2ZW4sIG90aGVyd2lzZSB0aGUgbGF5ZXIgd291bGQgc3RheSBvbnZpc2libGVcbiAgICAgICAgICAgICRpbnRlcnZhbCh0b2dnbGUsIDEwMCwgY291bnQgKiAyKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEN1cnJlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYW5ub3RhdGlvbkZlYXR1cmVzLml0ZW0oY3VycmVudEFubm90YXRpb25JbmRleCkuYW5ub3RhdGlvbjtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbWFwSW1hZ2VcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGhhbmRsaW5nIHRoZSBpbWFnZSBsYXllciBvbiB0aGUgT3BlbkxheWVycyBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdtYXBJbWFnZScsIGZ1bmN0aW9uIChtYXApIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblx0XHR2YXIgZXh0ZW50ID0gWzAsIDAsIDAsIDBdO1xuXG5cdFx0dmFyIHByb2plY3Rpb24gPSBuZXcgb2wucHJvai5Qcm9qZWN0aW9uKHtcblx0XHRcdGNvZGU6ICdkaWFzLWltYWdlJyxcblx0XHRcdHVuaXRzOiAncGl4ZWxzJyxcblx0XHRcdGV4dGVudDogZXh0ZW50XG5cdFx0fSk7XG5cblx0XHR2YXIgaW1hZ2VMYXllciA9IG5ldyBvbC5sYXllci5JbWFnZSgpO1xuXG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKHNjb3BlKSB7XG5cdFx0XHRtYXAuYWRkTGF5ZXIoaW1hZ2VMYXllcik7XG5cblx0XHRcdC8vIHJlZnJlc2ggdGhlIGltYWdlIHNvdXJjZVxuXHRcdFx0c2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIGZ1bmN0aW9uIChlLCBpbWFnZSkge1xuXHRcdFx0XHRleHRlbnRbMl0gPSBpbWFnZS53aWR0aDtcblx0XHRcdFx0ZXh0ZW50WzNdID0gaW1hZ2UuaGVpZ2h0O1xuXG5cdFx0XHRcdHZhciB6b29tID0gc2NvcGUudmlld3BvcnQuem9vbTtcblxuXHRcdFx0XHR2YXIgY2VudGVyID0gc2NvcGUudmlld3BvcnQuY2VudGVyO1xuXHRcdFx0XHQvLyB2aWV3cG9ydCBjZW50ZXIgaXMgc3RpbGwgdW5pbml0aWFsaXplZFxuXHRcdFx0XHRpZiAoY2VudGVyWzBdID09PSB1bmRlZmluZWQgJiYgY2VudGVyWzFdID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRjZW50ZXIgPSBvbC5leHRlbnQuZ2V0Q2VudGVyKGV4dGVudCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgaW1hZ2VTdGF0aWMgPSBuZXcgb2wuc291cmNlLkltYWdlU3RhdGljKHtcblx0XHRcdFx0XHR1cmw6IGltYWdlLnNyYyxcblx0XHRcdFx0XHRwcm9qZWN0aW9uOiBwcm9qZWN0aW9uLFxuXHRcdFx0XHRcdGltYWdlRXh0ZW50OiBleHRlbnRcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aW1hZ2VMYXllci5zZXRTb3VyY2UoaW1hZ2VTdGF0aWMpO1xuXG5cdFx0XHRcdG1hcC5zZXRWaWV3KG5ldyBvbC5WaWV3KHtcblx0XHRcdFx0XHRwcm9qZWN0aW9uOiBwcm9qZWN0aW9uLFxuXHRcdFx0XHRcdGNlbnRlcjogY2VudGVyLFxuXHRcdFx0XHRcdHpvb206IHpvb20sXG5cdFx0XHRcdFx0em9vbUZhY3RvcjogMS41LFxuXHRcdFx0XHRcdC8vIGFsbG93IGEgbWF4aW11bSBvZiA0eCBtYWduaWZpY2F0aW9uXG5cdFx0XHRcdFx0bWluUmVzb2x1dGlvbjogMC4yNSxcblx0XHRcdFx0XHQvLyByZXN0cmljdCBtb3ZlbWVudFxuXHRcdFx0XHRcdGV4dGVudDogZXh0ZW50XG5cdFx0XHRcdH0pKTtcblxuXHRcdFx0XHQvLyBpZiB6b29tIGlzIG5vdCBpbml0aWFsaXplZCwgZml0IHRoZSB2aWV3IHRvIHRoZSBpbWFnZSBleHRlbnRcblx0XHRcdFx0aWYgKHpvb20gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdG1hcC5nZXRWaWV3KCkuZml0KGV4dGVudCwgbWFwLmdldFNpemUoKSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldEV4dGVudCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBleHRlbnQ7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0UHJvamVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBwcm9qZWN0aW9uO1xuXHRcdH07XG5cbiAgICAgICAgdGhpcy5nZXRMYXllciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZUxheWVyO1xuICAgICAgICB9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBzdHlsZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGZvciB0aGUgT3BlbkxheWVycyBzdHlsZXNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdzdHlsZXMnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB0aGlzLmNvbG9ycyA9IHtcbiAgICAgICAgICAgIHdoaXRlOiBbMjU1LCAyNTUsIDI1NSwgMV0sXG4gICAgICAgICAgICBibHVlOiBbMCwgMTUzLCAyNTUsIDFdLFxuICAgICAgICAgICAgb3JhbmdlOiAnI2ZmNWUwMCdcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZGVmYXVsdENpcmNsZVJhZGl1cyA9IDY7XG4gICAgICAgIHZhciBkZWZhdWx0U3Ryb2tlV2lkdGggPSAzO1xuXG4gICAgICAgIHZhciBkZWZhdWx0U3Ryb2tlT3V0bGluZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgd2lkdGg6IDVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkU3Ryb2tlT3V0bGluZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgd2lkdGg6IDZcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRTdHJva2UgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlLFxuICAgICAgICAgICAgd2lkdGg6IGRlZmF1bHRTdHJva2VXaWR0aFxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRTdHJva2UgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5vcmFuZ2UsXG4gICAgICAgICAgICB3aWR0aDogZGVmYXVsdFN0cm9rZVdpZHRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBkZWZhdWx0Q2lyY2xlRmlsbCA9IG5ldyBvbC5zdHlsZS5GaWxsKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZENpcmNsZUZpbGwgPSBuZXcgb2wuc3R5bGUuRmlsbCh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMub3JhbmdlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBkZWZhdWx0Q2lyY2xlU3Ryb2tlID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICB3aWR0aDogMlxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRDaXJjbGVTdHJva2UgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcbiAgICAgICAgICAgIHdpZHRoOiBkZWZhdWx0U3Ryb2tlV2lkdGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGVkaXRpbmdDaXJjbGVTdHJva2UgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcbiAgICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgICAgbGluZURhc2g6IFszXVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZWRpdGluZ1N0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLmJsdWUsXG4gICAgICAgICAgICB3aWR0aDogZGVmYXVsdFN0cm9rZVdpZHRoLFxuICAgICAgICAgICAgbGluZURhc2g6IFs1XVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZGVmYXVsdEZpbGwgPSBuZXcgb2wuc3R5bGUuRmlsbCh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMuYmx1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRGaWxsID0gbmV3IG9sLnN0eWxlLkZpbGwoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLm9yYW5nZVxuICAgICAgICB9KTtcblxuXHRcdHRoaXMuZmVhdHVyZXMgPSBmdW5jdGlvbiAoZmVhdHVyZSkge1xuICAgICAgICAgICAgdmFyIGNvbG9yID0gZmVhdHVyZS5jb2xvciA/ICgnIycgKyBmZWF0dXJlLmNvbG9yKSA6IF90aGlzLmNvbG9ycy5ibHVlO1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBuZXcgb2wuc3R5bGUuU3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICBzdHJva2U6IGRlZmF1bHRTdHJva2VPdXRsaW5lLFxuICAgICAgICAgICAgICAgICAgICBpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICByYWRpdXM6IGRlZmF1bHRDaXJjbGVSYWRpdXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGNvbG9yXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZTogZGVmYXVsdENpcmNsZVN0cm9rZVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBvbC5zdHlsZS5TdHlsZSh7XG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogY29sb3IsXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogM1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBdO1xuICAgICAgICB9O1xuXG5cdFx0dGhpcy5oaWdobGlnaHQgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IHNlbGVjdGVkU3Ryb2tlT3V0bGluZSxcblx0XHRcdFx0aW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0XHRcdHJhZGl1czogZGVmYXVsdENpcmNsZVJhZGl1cyxcblx0XHRcdFx0XHRmaWxsOiBzZWxlY3RlZENpcmNsZUZpbGwsXG5cdFx0XHRcdFx0c3Ryb2tlOiBzZWxlY3RlZENpcmNsZVN0cm9rZVxuXHRcdFx0XHR9KSxcbiAgICAgICAgICAgICAgICB6SW5kZXg6IDIwMFxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IHNlbGVjdGVkU3Ryb2tlLFxuICAgICAgICAgICAgICAgIHpJbmRleDogMjAwXG5cdFx0XHR9KVxuXHRcdF07XG5cblx0XHR0aGlzLmVkaXRpbmcgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IGRlZmF1bHRTdHJva2VPdXRsaW5lLFxuXHRcdFx0XHRpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG5cdFx0XHRcdFx0cmFkaXVzOiBkZWZhdWx0Q2lyY2xlUmFkaXVzLFxuXHRcdFx0XHRcdGZpbGw6IGRlZmF1bHRDaXJjbGVGaWxsLFxuXHRcdFx0XHRcdHN0cm9rZTogZWRpdGluZ0NpcmNsZVN0cm9rZVxuXHRcdFx0XHR9KVxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IGVkaXRpbmdTdHJva2Vcblx0XHRcdH0pXG5cdFx0XTtcblxuXHRcdHRoaXMudmlld3BvcnQgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IGRlZmF1bHRTdHJva2UsXG5cdFx0XHR9KSxcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDFcbiAgICAgICAgICAgICAgICB9KVxuXHRcdFx0fSlcblx0XHRdO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSB1cmxQYXJhbXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gVGhlIEdFVCBwYXJhbWV0ZXJzIG9mIHRoZSB1cmwuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgndXJsUGFyYW1zJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHN0YXRlID0ge307XG5cblx0XHQvLyB0cmFuc2Zvcm1zIGEgVVJMIHBhcmFtZXRlciBzdHJpbmcgbGlrZSAjYT0xJmI9MiB0byBhbiBvYmplY3Rcblx0XHR2YXIgZGVjb2RlU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gbG9jYXRpb24uaGFzaC5yZXBsYWNlKCcjJywgJycpXG5cdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnJicpO1xuXG5cdFx0XHR2YXIgc3RhdGUgPSB7fTtcblxuXHRcdFx0cGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKHBhcmFtKSB7XG5cdFx0XHRcdC8vIGNhcHR1cmUga2V5LXZhbHVlIHBhaXJzXG5cdFx0XHRcdHZhciBjYXB0dXJlID0gcGFyYW0ubWF0Y2goLyguKylcXD0oLispLyk7XG5cdFx0XHRcdGlmIChjYXB0dXJlICYmIGNhcHR1cmUubGVuZ3RoID09PSAzKSB7XG5cdFx0XHRcdFx0c3RhdGVbY2FwdHVyZVsxXV0gPSBkZWNvZGVVUklDb21wb25lbnQoY2FwdHVyZVsyXSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gc3RhdGU7XG5cdFx0fTtcblxuXHRcdC8vIHRyYW5zZm9ybXMgYW4gb2JqZWN0IHRvIGEgVVJMIHBhcmFtZXRlciBzdHJpbmdcblx0XHR2YXIgZW5jb2RlU3RhdGUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcblx0XHRcdHZhciBwYXJhbXMgPSAnJztcblx0XHRcdGZvciAodmFyIGtleSBpbiBzdGF0ZSkge1xuXHRcdFx0XHRwYXJhbXMgKz0ga2V5ICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0YXRlW2tleV0pICsgJyYnO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHBhcmFtcy5zdWJzdHJpbmcoMCwgcGFyYW1zLmxlbmd0aCAtIDEpO1xuXHRcdH07XG5cblx0XHR0aGlzLnB1c2hTdGF0ZSA9IGZ1bmN0aW9uIChzKSB7XG5cdFx0XHRzdGF0ZS5zbHVnID0gcztcblx0XHRcdGhpc3RvcnkucHVzaFN0YXRlKHN0YXRlLCAnJywgc3RhdGUuc2x1ZyArICcjJyArIGVuY29kZVN0YXRlKHN0YXRlKSk7XG5cdFx0fTtcblxuXHRcdC8vIHNldHMgYSBVUkwgcGFyYW1ldGVyIGFuZCB1cGRhdGVzIHRoZSBoaXN0b3J5IHN0YXRlXG5cdFx0dGhpcy5zZXQgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gcGFyYW1zKSB7XG5cdFx0XHRcdHN0YXRlW2tleV0gPSBwYXJhbXNba2V5XTtcblx0XHRcdH1cblx0XHRcdGhpc3RvcnkucmVwbGFjZVN0YXRlKHN0YXRlLCAnJywgc3RhdGUuc2x1ZyArICcjJyArIGVuY29kZVN0YXRlKHN0YXRlKSk7XG5cdFx0fTtcblxuXHRcdC8vIHJldHVybnMgYSBVUkwgcGFyYW1ldGVyXG5cdFx0dGhpcy5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRyZXR1cm4gc3RhdGVba2V5XTtcblx0XHR9O1xuXG5cdFx0c3RhdGUgPSBoaXN0b3J5LnN0YXRlO1xuXG5cdFx0aWYgKCFzdGF0ZSkge1xuXHRcdFx0c3RhdGUgPSBkZWNvZGVTdGF0ZSgpO1xuXHRcdH1cblx0fVxuKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=