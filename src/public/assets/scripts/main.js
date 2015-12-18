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
angular.module('dias.annotations').service('annotations', ["Annotation", "shapes", "labels", "msg", function (Annotation, shapes, labels, msg) {
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
angular.module('dias.annotations').service('mapAnnotations', ["map", "images", "annotations", "debounce", "styles", "$interval", function (map, images, annotations, debounce, styles, $interval) {
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
			feature.on('change', handleGeometryChange);
			feature.annotation = annotation;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0N5Y2xpbmdDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQW5ub3RhdG9yQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NhbnZhc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9DYXRlZ29yaWVzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NvbmZpZGVuY2VDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ29udHJvbHNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvTWluaW1hcENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TZWxlY3RlZExhYmVsQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NldHRpbmdzQW5ub3RhdGlvbk9wYWNpdHlDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2V0dGluZ3NDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2lkZWJhckNvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2Fubm90YXRpb25MaXN0SXRlbS5qcyIsImRpcmVjdGl2ZXMvbGFiZWxDYXRlZ29yeUl0ZW0uanMiLCJkaXJlY3RpdmVzL2xhYmVsSXRlbS5qcyIsImZhY3Rvcmllcy9kZWJvdW5jZS5qcyIsImZhY3Rvcmllcy9tYXAuanMiLCJzZXJ2aWNlcy9hbm5vdGF0aW9ucy5qcyIsInNlcnZpY2VzL2ltYWdlcy5qcyIsInNlcnZpY2VzL2tleWJvYXJkLmpzIiwic2VydmljZXMvbGFiZWxzLmpzIiwic2VydmljZXMvbWFwQW5ub3RhdGlvbnMuanMiLCJzZXJ2aWNlcy9tYXBJbWFnZS5qcyIsInNlcnZpY2VzL3N0eWxlcy5qcyIsInNlcnZpY2VzL3VybFBhcmFtcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUlBLFFBQUEsT0FBQSxvQkFBQSxDQUFBLFlBQUE7Ozs7Ozs7OztBQ0dBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLHlGQUFBLFVBQUEsUUFBQSxnQkFBQSxRQUFBLGFBQUEsUUFBQTtFQUNBOztFQUVBLE9BQUEsbUJBQUEsZUFBQSxzQkFBQTs7RUFFQSxPQUFBLGlCQUFBLG9CQUFBLFVBQUEsVUFBQTtHQUNBLFNBQUEsUUFBQSxVQUFBLFNBQUE7SUFDQSxPQUFBLG1CQUFBLFFBQUE7Ozs7RUFJQSxJQUFBLHFCQUFBLFlBQUE7R0FDQSxPQUFBLGNBQUEsWUFBQTs7O0VBR0EsSUFBQSxtQkFBQSxlQUFBOztFQUVBLE9BQUEsY0FBQTs7RUFFQSxPQUFBLGlCQUFBLGVBQUE7O0VBRUEsT0FBQSxtQkFBQSxVQUFBLEdBQUEsSUFBQTs7R0FFQSxJQUFBLENBQUEsRUFBQSxVQUFBO0lBQ0EsT0FBQTs7R0FFQSxlQUFBLE9BQUE7OztRQUdBLE9BQUEsZ0JBQUEsZUFBQTs7RUFFQSxPQUFBLGFBQUEsVUFBQSxJQUFBO0dBQ0EsSUFBQSxXQUFBO0dBQ0EsaUJBQUEsUUFBQSxVQUFBLFNBQUE7SUFDQSxJQUFBLFFBQUEsY0FBQSxRQUFBLFdBQUEsTUFBQSxJQUFBO0tBQ0EsV0FBQTs7O0dBR0EsT0FBQTs7O0VBR0EsT0FBQSxJQUFBLGVBQUE7Ozs7Ozs7Ozs7O0FDekNBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLG1GQUFBLFVBQUEsUUFBQSxnQkFBQSxRQUFBLFVBQUE7UUFDQTs7O1FBR0EsSUFBQSxVQUFBOztRQUVBLElBQUEsYUFBQTs7UUFFQSxJQUFBLGlCQUFBLFVBQUEsR0FBQTtZQUNBLElBQUEsV0FBQSxDQUFBLE9BQUEsV0FBQTs7WUFFQSxJQUFBLGVBQUEsV0FBQTtnQkFDQSxlQUFBO21CQUNBOztnQkFFQSxPQUFBLFlBQUEsS0FBQSxlQUFBO2dCQUNBLFVBQUE7OztZQUdBLElBQUEsR0FBQTs7Z0JBRUEsT0FBQTs7OztZQUlBLE9BQUE7OztRQUdBLElBQUEsaUJBQUEsVUFBQSxHQUFBO1lBQ0EsSUFBQSxXQUFBLENBQUEsT0FBQSxXQUFBOztZQUVBLElBQUEsZUFBQSxlQUFBO2dCQUNBLGVBQUE7bUJBQ0E7O2dCQUVBLE9BQUEsWUFBQSxLQUFBLGVBQUE7Z0JBQ0EsVUFBQTs7O1lBR0EsSUFBQSxHQUFBOztnQkFFQSxPQUFBOzs7O1lBSUEsT0FBQTs7O1FBR0EsSUFBQSxjQUFBLFVBQUEsR0FBQTtZQUNBLElBQUEsU0FBQTtZQUNBLElBQUEsR0FBQTtnQkFDQSxFQUFBOzs7WUFHQSxJQUFBLE9BQUEsYUFBQSxPQUFBLGVBQUE7Z0JBQ0EsT0FBQSxtQkFBQSxlQUFBLGNBQUEsU0FBQSxLQUFBLFlBQUE7b0JBQ0EsZUFBQSxRQUFBOzttQkFFQTtnQkFDQSxlQUFBOzs7OztRQUtBLElBQUEsY0FBQSxVQUFBLEdBQUE7WUFDQSxFQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxPQUFBLFVBQUEsWUFBQTtZQUNBLE9BQUEsT0FBQSxvQkFBQSxhQUFBOzs7UUFHQSxPQUFBLGVBQUEsWUFBQTtZQUNBLE9BQUEsb0JBQUEsU0FBQTs7O1FBR0EsT0FBQSxjQUFBLFlBQUE7WUFDQSxPQUFBLG9CQUFBLFNBQUE7Ozs7O1FBS0EsT0FBQSxPQUFBLDBCQUFBLFVBQUEsT0FBQSxVQUFBO1lBQ0EsSUFBQSxVQUFBLFlBQUE7O2dCQUVBLFNBQUEsR0FBQSxJQUFBLGdCQUFBOztnQkFFQSxTQUFBLEdBQUEsSUFBQSxnQkFBQTtnQkFDQSxTQUFBLEdBQUEsSUFBQSxnQkFBQTs7Z0JBRUEsU0FBQSxHQUFBLElBQUEsYUFBQTtnQkFDQSxTQUFBLEdBQUEsSUFBQSxhQUFBO2dCQUNBLGVBQUE7bUJBQ0EsSUFBQSxhQUFBLFlBQUE7Z0JBQ0EsU0FBQSxJQUFBLElBQUE7Z0JBQ0EsU0FBQSxJQUFBLElBQUE7Z0JBQ0EsU0FBQSxJQUFBLElBQUE7Z0JBQ0EsU0FBQSxJQUFBLElBQUE7Z0JBQ0EsU0FBQSxJQUFBLElBQUE7Z0JBQ0EsZUFBQTs7OztRQUlBLE9BQUEsSUFBQSxlQUFBLFlBQUE7WUFDQSxVQUFBOzs7UUFHQSxPQUFBLGlCQUFBO1FBQ0EsT0FBQSxpQkFBQTtRQUNBLE9BQUEsY0FBQTs7Ozs7Ozs7Ozs7QUNoSEEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsd0ZBQUEsVUFBQSxRQUFBLFFBQUEsV0FBQSxLQUFBLFVBQUEsVUFBQTtRQUNBOztRQUVBLE9BQUEsU0FBQTtRQUNBLE9BQUEsZUFBQTs7O1FBR0EsT0FBQSxXQUFBO1lBQ0EsTUFBQSxVQUFBLElBQUE7WUFDQSxRQUFBLENBQUEsVUFBQSxJQUFBLE1BQUEsVUFBQSxJQUFBOzs7O1FBSUEsSUFBQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQSxlQUFBO1lBQ0EsT0FBQSxXQUFBLGVBQUEsT0FBQSxPQUFBOzs7O1FBSUEsSUFBQSxZQUFBLFlBQUE7WUFDQSxVQUFBLFVBQUEsT0FBQSxPQUFBLGFBQUE7Ozs7UUFJQSxJQUFBLGVBQUEsWUFBQTtZQUNBLE9BQUEsZUFBQTs7OztRQUlBLElBQUEsWUFBQSxVQUFBLElBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQSxLQUFBLFNBQUE7MEJBQ0EsS0FBQTswQkFDQSxNQUFBLElBQUE7Ozs7UUFJQSxPQUFBLFlBQUEsWUFBQTtZQUNBO1lBQ0EsT0FBQSxPQUFBO21CQUNBLEtBQUE7bUJBQ0EsS0FBQTttQkFDQSxNQUFBLElBQUE7Ozs7UUFJQSxPQUFBLFlBQUEsWUFBQTtZQUNBO1lBQ0EsT0FBQSxPQUFBO21CQUNBLEtBQUE7bUJBQ0EsS0FBQTttQkFDQSxNQUFBLElBQUE7Ozs7UUFJQSxPQUFBLElBQUEsa0JBQUEsU0FBQSxHQUFBLFFBQUE7WUFDQSxPQUFBLFNBQUEsT0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQSxLQUFBLE1BQUEsT0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQSxLQUFBLE1BQUEsT0FBQSxPQUFBO1lBQ0EsVUFBQSxJQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBLE9BQUE7Z0JBQ0EsR0FBQSxPQUFBLFNBQUEsT0FBQTs7OztRQUlBLFNBQUEsR0FBQSxJQUFBLFlBQUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLElBQUEsWUFBQTtZQUNBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsSUFBQSxZQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUE7Ozs7UUFJQSxPQUFBLGFBQUEsU0FBQSxHQUFBO1lBQ0EsSUFBQSxRQUFBLEVBQUE7WUFDQSxJQUFBLFNBQUEsTUFBQSxTQUFBLFdBQUE7Z0JBQ0EsVUFBQSxNQUFBOzs7OztRQUtBLE9BQUE7O1FBRUEsVUFBQSxVQUFBLEtBQUE7Ozs7Ozs7Ozs7O0FDNUZBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLDRGQUFBLFVBQUEsUUFBQSxVQUFBLGdCQUFBLEtBQUEsVUFBQSxVQUFBO0VBQ0E7O1FBRUEsSUFBQSxVQUFBLElBQUE7OztFQUdBLElBQUEsR0FBQSxXQUFBLFNBQUEsR0FBQTtZQUNBLElBQUEsT0FBQSxZQUFBO2dCQUNBLE9BQUEsTUFBQSxrQkFBQTtvQkFDQSxRQUFBLFFBQUE7b0JBQ0EsTUFBQSxRQUFBOzs7OztZQUtBLFNBQUEsTUFBQSxLQUFBOzs7UUFHQSxJQUFBLEdBQUEsZUFBQSxZQUFBO1lBQ0EsVUFBQSxJQUFBOzs7RUFHQSxTQUFBLEtBQUE7RUFDQSxlQUFBLEtBQUE7O0VBRUEsSUFBQSxhQUFBLFlBQUE7OztHQUdBLFNBQUEsV0FBQTs7SUFFQSxJQUFBO01BQ0EsSUFBQTs7O0VBR0EsT0FBQSxJQUFBLHdCQUFBO0VBQ0EsT0FBQSxJQUFBLHlCQUFBOzs7Ozs7Ozs7OztBQ25DQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSx5REFBQSxVQUFBLFFBQUEsUUFBQSxVQUFBO1FBQ0E7OztRQUdBLElBQUEsZ0JBQUE7UUFDQSxJQUFBLHVCQUFBOzs7UUFHQSxJQUFBLGtCQUFBLFlBQUE7WUFDQSxJQUFBLE1BQUEsT0FBQSxXQUFBLElBQUEsVUFBQSxNQUFBO2dCQUNBLE9BQUEsS0FBQTs7WUFFQSxPQUFBLGFBQUEsd0JBQUEsS0FBQSxVQUFBOzs7O1FBSUEsSUFBQSxpQkFBQSxZQUFBO1lBQ0EsSUFBQSxPQUFBLGFBQUEsdUJBQUE7Z0JBQ0EsSUFBQSxNQUFBLEtBQUEsTUFBQSxPQUFBLGFBQUE7Z0JBQ0EsT0FBQSxhQUFBLE9BQUEsV0FBQSxPQUFBLFVBQUEsTUFBQTs7b0JBRUEsT0FBQSxJQUFBLFFBQUEsS0FBQSxRQUFBLENBQUE7Ozs7O1FBS0EsSUFBQSxrQkFBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFNBQUEsS0FBQSxRQUFBLE9BQUEsV0FBQSxRQUFBO2dCQUNBLE9BQUEsV0FBQSxPQUFBLFdBQUE7Ozs7UUFJQSxPQUFBLGFBQUEsQ0FBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUE7UUFDQSxPQUFBLGFBQUE7UUFDQSxPQUFBLGFBQUE7UUFDQSxPQUFBLFFBQUEsS0FBQSxVQUFBLEtBQUE7WUFDQSxLQUFBLElBQUEsT0FBQSxLQUFBO2dCQUNBLE9BQUEsYUFBQSxPQUFBLFdBQUEsT0FBQSxJQUFBOztZQUVBOzs7UUFHQSxPQUFBLGlCQUFBLE9BQUE7O1FBRUEsT0FBQSxhQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUEsaUJBQUE7WUFDQSxPQUFBLFdBQUEsdUJBQUE7OztRQUdBLE9BQUEsY0FBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLE9BQUEsV0FBQSxRQUFBLFVBQUEsQ0FBQTs7OztRQUlBLE9BQUEsa0JBQUEsVUFBQSxHQUFBLE1BQUE7WUFDQSxFQUFBO1lBQ0EsSUFBQSxRQUFBLE9BQUEsV0FBQSxRQUFBO1lBQ0EsSUFBQSxVQUFBLENBQUEsS0FBQSxPQUFBLFdBQUEsU0FBQSxlQUFBO2dCQUNBLE9BQUEsV0FBQSxLQUFBO21CQUNBO2dCQUNBLE9BQUEsV0FBQSxPQUFBLE9BQUE7O1lBRUE7Ozs7UUFJQSxPQUFBLGlCQUFBLFlBQUE7WUFDQSxPQUFBLE9BQUEsV0FBQSxTQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7Ozs7Ozs7Ozs7QUNqSEEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsNkNBQUEsVUFBQSxRQUFBLFFBQUE7RUFDQTs7RUFFQSxPQUFBLGFBQUE7O0VBRUEsT0FBQSxPQUFBLGNBQUEsVUFBQSxZQUFBO0dBQ0EsT0FBQSxxQkFBQSxXQUFBOztHQUVBLElBQUEsY0FBQSxNQUFBO0lBQ0EsT0FBQSxrQkFBQTtVQUNBLElBQUEsY0FBQSxNQUFBO0lBQ0EsT0FBQSxrQkFBQTtVQUNBLElBQUEsY0FBQSxPQUFBO0lBQ0EsT0FBQSxrQkFBQTtVQUNBO0lBQ0EsT0FBQSxrQkFBQTs7Ozs7Ozs7Ozs7OztBQ2ZBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLDBGQUFBLFVBQUEsUUFBQSxnQkFBQSxRQUFBLEtBQUEsUUFBQSxVQUFBO0VBQ0E7O0VBRUEsSUFBQSxVQUFBOztFQUVBLE9BQUEsY0FBQSxVQUFBLE1BQUE7R0FDQSxJQUFBLENBQUEsT0FBQSxlQUFBO2dCQUNBLE9BQUEsTUFBQSwyQkFBQTtJQUNBLElBQUEsS0FBQSxPQUFBO0lBQ0E7OztHQUdBLGVBQUE7O0dBRUEsSUFBQSxTQUFBLFNBQUEsV0FBQSxPQUFBLGtCQUFBLE9BQUE7SUFDQSxPQUFBLGdCQUFBO0lBQ0EsVUFBQTtVQUNBO0lBQ0EsT0FBQSxnQkFBQTtJQUNBLGVBQUEsYUFBQTtJQUNBLFVBQUE7Ozs7O1FBS0EsU0FBQSxHQUFBLElBQUEsWUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxLQUFBLFlBQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsT0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxLQUFBLFlBQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsT0FBQSxZQUFBO1lBQ0EsT0FBQTs7Ozs7Ozs7Ozs7O0FDcERBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLHlFQUFBLFVBQUEsUUFBQSxLQUFBLFVBQUEsVUFBQSxRQUFBO0VBQ0E7O1FBRUEsSUFBQSxpQkFBQSxJQUFBLEdBQUEsT0FBQTs7RUFFQSxJQUFBLFVBQUEsSUFBQSxHQUFBLElBQUE7R0FDQSxRQUFBOztHQUVBLFVBQUE7O0dBRUEsY0FBQTs7O1FBR0EsSUFBQSxVQUFBLElBQUE7UUFDQSxJQUFBLFVBQUEsSUFBQTs7O0VBR0EsUUFBQSxTQUFBLFNBQUE7UUFDQSxRQUFBLFNBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLFFBQUE7WUFDQSxPQUFBLE9BQUE7OztFQUdBLElBQUEsV0FBQSxJQUFBLEdBQUE7RUFDQSxlQUFBLFdBQUE7OztFQUdBLE9BQUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxRQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7SUFDQSxZQUFBLFNBQUE7SUFDQSxRQUFBLEdBQUEsT0FBQSxVQUFBLFNBQUE7SUFDQSxNQUFBOzs7OztFQUtBLElBQUEsa0JBQUEsWUFBQTtHQUNBLFNBQUEsWUFBQSxHQUFBLEtBQUEsUUFBQSxXQUFBLFFBQUEsZ0JBQUE7OztRQUdBLElBQUEsR0FBQSxlQUFBLFlBQUE7WUFDQSxVQUFBLElBQUE7OztRQUdBLElBQUEsR0FBQSxlQUFB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UUFBQTtJQUNBLElBQUEsR0FBQSxRQUFBOztZQUVBLGNBQUEsR0FBQSxZQUFBLFNBQUE7Z0JBQ0EsVUFBQTs7OztFQUlBLE9BQUE7Ozs7Ozs7Ozs7O0FDaEJBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLHlEQUFBLFVBQUEsWUFBQSxRQUFBLFFBQUEsS0FBQTtFQUNBOztFQUVBLElBQUE7UUFDQSxJQUFBOztFQUVBLElBQUEsbUJBQUEsVUFBQSxZQUFBO0dBQ0EsV0FBQSxRQUFBLE9BQUEsUUFBQSxXQUFBO0dBQ0EsT0FBQTs7O0VBR0EsSUFBQSxnQkFBQSxVQUFBLFlBQUE7R0FDQSxZQUFBLEtBQUE7R0FDQSxPQUFBOzs7RUFHQSxLQUFBLFFBQUEsVUFBQSxRQUFBO0dBQ0EsY0FBQSxXQUFBLE1BQUE7WUFDQSxVQUFBLFlBQUE7R0FDQSxRQUFBLEtBQUEsVUFBQSxHQUFBO0lBQ0EsRUFBQSxRQUFBOztHQUVBLE9BQUE7OztFQUdBLEtBQUEsTUFBQSxVQUFBLFFBQUE7R0FDQSxJQUFBLENBQUEsT0FBQSxZQUFBLE9BQUEsT0FBQTtJQUNBLE9BQUEsV0FBQSxPQUFBLE1BQUEsT0FBQTs7R0FFQSxJQUFBLFFBQUEsT0FBQTtHQUNBLE9BQUEsV0FBQSxNQUFBO0dBQ0EsT0FBQSxhQUFBLE9BQUE7R0FDQSxJQUFBLGFBQUEsV0FBQSxJQUFBO0dBQ0EsV0FBQTtjQUNBLEtBQUE7Y0FDQSxLQUFBO2NBQ0EsTUFBQSxJQUFBOztHQUVBLE9BQUE7OztFQUdBLEtBQUEsU0FBQSxVQUFBLFlBQUE7O0dBRUEsSUFBQSxRQUFBLFlBQUEsUUFBQTtHQUNBLElBQUEsUUFBQSxDQUFBLEdBQUE7SUFDQSxPQUFBLFdBQUEsUUFBQSxZQUFBOzs7S0FHQSxRQUFBLFlBQUEsUUFBQTtLQUNBLFlBQUEsT0FBQSxPQUFBO09BQ0EsSUFBQTs7OztFQUlBLEtBQUEsVUFBQSxVQUFBLElBQUE7R0FDQSxPQUFBLFlBQUEsUUFBQTs7O0VBR0EsS0FBQSxVQUFBLFlBQUE7R0FDQSxPQUFBOzs7UUFHQSxLQUFBLGFBQUEsWUFBQTtZQUNBLE9BQUE7Ozs7Ozs7Ozs7OztBQy9EQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxzRkFBQSxVQUFBLFlBQUEsZUFBQSxLQUFBLElBQUEsY0FBQSxhQUFBO0VBQ0E7O0VBRUEsSUFBQSxRQUFBOztFQUVBLElBQUEsV0FBQTs7RUFFQSxJQUFBLGtCQUFBOztFQUVBLElBQUEsU0FBQTs7O0VBR0EsS0FBQSxlQUFBOzs7Ozs7RUFNQSxJQUFBLFNBQUEsVUFBQSxJQUFBO0dBQ0EsS0FBQSxNQUFBLE1BQUEsYUFBQTtHQUNBLElBQUEsUUFBQSxTQUFBLFFBQUE7R0FDQSxPQUFBLFNBQUEsQ0FBQSxRQUFBLEtBQUEsU0FBQTs7Ozs7OztFQU9BLElBQUEsU0FBQSxVQUFBLElBQUE7R0FDQSxLQUFBLE1BQUEsTUFBQSxhQUFBO0dBQ0EsSUFBQSxRQUFBLFNBQUEsUUFBQTtHQUNBLElBQUEsU0FBQSxTQUFBO0dBQ0EsT0FBQSxTQUFBLENBQUEsUUFBQSxJQUFBLFVBQUE7Ozs7Ozs7RUFPQSxJQUFBLFdBQUEsVUFBQSxJQUFBO0dBQ0EsS0FBQSxNQUFBLE1BQUEsYUFBQTtHQUNBLEtBQUEsSUFBQSxJQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO0lBQ0EsSUFBQSxPQUFBLEdBQUEsT0FBQSxJQUFBLE9BQUEsT0FBQTs7O0dBR0EsT0FBQTs7Ozs7O0VBTUEsSUFBQSxPQUFBLFVBQUEsSUFBQTtHQUNBLE1BQUEsZUFBQSxTQUFBOzs7Ozs7OztFQVFBLElBQUEsYUFBQSxVQUFBLElBQUE7R0FDQSxJQUFBLFdBQUEsR0FBQTtHQUNBLElBQUEsTUFBQSxTQUFBOztHQUVBLElBQUEsS0FBQTtJQUNBLFNBQUEsUUFBQTtVQUNBO0lBQ0EsTUFBQSxTQUFBLGNBQUE7SUFDQSxJQUFBLE1BQUE7SUFDQSxJQUFBLFNBQUEsWUFBQTtLQUNBLE9BQUEsS0FBQTs7S0FFQSxJQUFBLE9BQUEsU0FBQSxpQkFBQTtNQUNBLE9BQUE7O0tBRUEsU0FBQSxRQUFBOztJQUVBLElBQUEsVUFBQSxVQUFBLEtBQUE7S0FDQSxTQUFBLE9BQUE7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SUFBQSxZQUFBO2dCQUNBLGlCQUFBLEtBQUE7Z0JBQ0EsSUFBQSxVQUFBLElBQUEsV0FBQSxlQUFBLElBQUEsV0FBQTtvQkFDQSxTQUFBLENBQUEsSUFBQSxJQUFBLElBQUE7Ozs7Ozs7RUFPQSxJQUFBLHFCQUFBLFVBQUEsT0FBQTtHQUNBLE9BQUEsQ0FBQSxHQUFBLE1BQUEsSUFBQSxHQUFBLE9BQUEsYUFBQSxTQUFBLE1BQUE7Ozs7O0VBS0EsSUFBQSxtQkFBQSxVQUFBLE9BQUE7R0FDQSxPQUFBLENBQUEsTUFBQSxHQUFBLE9BQUEsYUFBQSxTQUFBLE1BQUE7Ozs7O0VBS0EsSUFBQSxpQkFBQSxVQUFBLFVBQUE7R0FDQSxRQUFBLFNBQUE7SUFDQSxLQUFBOztLQUVBLE9BQUEsQ0FBQSxTQUFBLGFBQUEsQ0FBQSxTQUFBLGFBQUE7SUFDQSxLQUFBO0lBQ0EsS0FBQTtLQUNBLE9BQUEsU0FBQSxpQkFBQTtJQUNBLEtBQUE7S0FDQSxPQUFBLENBQUEsU0FBQTtJQUNBO0tBQ0EsT0FBQSxTQUFBOzs7OztFQUtBLElBQUEsdUJBQUEsVUFBQSxHQUFBO0dBQ0EsSUFBQSxVQUFBLEVBQUE7R0FDQSxJQUFBLE9BQUEsWUFBQTtJQUNBLElBQUEsY0FBQSxlQUFBLFFBQUE7SUFDQSxRQUFBLFdBQUEsU0FBQSxZQUFBLElBQUE7SUFDQSxRQUFBLFdBQUE7Ozs7R0FJQSxTQUFBLE1BQUEsS0FBQSxRQUFBLFdBQUE7OztFQUdBLElBQUEsZ0JBQUEsVUFBQSxZQUFBO0dBQ0EsSUFBQTtHQUNBLElBQUEsU0FBQSxXQUFBLE9BQUEsSUFBQTs7R0FFQSxRQUFBLFdBQUE7SUFDQSxLQUFBO0tBQ0EsV0FBQSxJQUFBLEdBQUEsS0FBQSxNQUFBLE9BQUE7S0FDQTtJQUNBLEtBQUE7S0FDQSxXQUFBLElBQUEsR0FBQSxLQUFBLFVBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTs7S0FFQSxXQUFBLElBQUEsR0FBQSxLQUFBLFFBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTtLQUNBLFdBQUEsSUFBQSxHQUFBLEtBQUEsV0FBQTtLQUNB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O0lBQ0EsT0FBQSxLQUFBLE1BQUE7O0lBRUEsSUFBQSxPQUFBLE1BQUEsU0FBQTs7SUFFQSxJQUFBLFNBQUEsTUFBQSxTQUFBOztJQUVBLElBQUEsT0FBQSxPQUFBLGFBQUEsT0FBQSxPQUFBLFdBQUE7S0FDQSxTQUFBLEdBQUEsT0FBQSxVQUFBOzs7SUFHQSxJQUFBLGNBQUEsSUFBQSxHQUFBLE9BQUEsWUFBQTtLQUNBLEtBQUEsTUFBQTtLQUNBLFlBQUE7S0FDQSxhQUFBOzs7SUFHQSxXQUFBLFVBQUE7O0lBRUEsSUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO0tBQ0EsWUFBQTtLQUNBLFFBQUE7S0FDQSxNQUFBO0tBQ0EsWUFBQTs7S0FFQSxlQUFBOztLQUVBLFFBQUE7Ozs7SUFJQSxJQUFBLFNBQUEsV0FBQTtLQUNBLElBQUEsVUFBQSxJQUFBLFFBQUEsSUFBQTs7Ozs7RUFLQSxLQUFBLFlBQUEsWUFBQTtHQUNBLE9BQUE7OztFQUdBLEtBQUEsZ0JBQUEsWUFBQTtHQUNBLE9BQUE7OztRQUdBLEtBQUEsV0FBQSxZQUFBO1lBQ0EsT0FBQTs7Ozs7Ozs7Ozs7O0FDL0RBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLFVBQUEsWUFBQTtFQUNBOztRQUVBLEtBQUEsU0FBQTtZQUNBLE9BQUEsQ0FBQSxLQUFBLEtBQUEsS0FBQTtZQUNBLE1BQUEsQ0FBQSxHQUFBLEtBQUEsS0FBQTtZQUNBLFFBQUE7OztFQUdBLElBQUEsUUFBQTs7RUFFQSxLQUFBLFdBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQSxLQUFBLE9BQUE7S0FDQSxPQUFBOztJQUVBLE9BQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLFFBQUE7S0FDQSxNQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7TUFDQSxPQUFBLEtBQUEsT0FBQTs7S0FFQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7TUFDQSxPQUFBLEtBQUEsT0FBQTtNQUNBLE9BQUE7Ozs7R0FJQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQSxLQUFBLE9BQUE7S0FDQSxPQUFBOzs7OztFQUtBLEtBQUEsWUFBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBLEtBQUEsT0FBQTtLQUNBLE9BQUE7O0lBRUEsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtNQUNBLE9BQUEsS0FBQSxPQUFBOztLQUVBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtNQUNBLE9BQUEsS0FBQSxPQUFBO01BQ0EsT0FBQTs7OztHQUlBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxPQUFBLEtBQUEsT0FBQTtLQUNBLE9BQUE7Ozs7O0VBS0EsS0FBQSxVQUFBO0dBQ0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUEsS0FBQSxPQUFBO0tBQ0EsT0FBQTs7SUFFQSxPQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBO01BQ0EsT0FBQSxLQUFBLE9BQUE7O0tBRUEsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO01BQ0EsT0FBQSxLQUFBLE9BQUE7TUFDQSxPQUFBO01BQ0EsVUFBQSxDQUFBOzs7O0dBSUEsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLE9BQUEsS0FBQSxPQUFBO0tBQ0EsT0FBQTtLQUNBLFVBQUEsQ0FBQTs7Ozs7RUFLQSxLQUFBLFdBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQSxLQUFBLE9BQUE7S0FDQSxPQUFBOzs7R0FHQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsT0FBQSxLQUFBLE9BQUE7S0FDQSxPQUFBOzs7Ozs7Ozs7Ozs7OztBQ2xHQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxhQUFBLFlBQUE7RUFDQTs7RUFFQSxJQUFBLFFBQUE7OztFQUdBLElBQUEsY0FBQSxZQUFBO0dBQ0EsSUFBQSxTQUFBLFNBQUEsS0FBQSxRQUFBLEtBQUE7OEJBQ0EsTUFBQTs7R0FFQSxJQUFBLFFBQUE7O0dBRUEsT0FBQSxRQUFBLFVBQUEsT0FBQTs7SUFFQSxJQUFBLFVBQUEsTUFBQSxNQUFBO0lBQ0EsSUFBQSxXQUFBLFFBQUEsV0FBQSxHQUFBO0tBQ0EsTUFBQSxRQUFBLE1BQUEsbUJBQUEsUUFBQTs7OztHQUlBLE9BQUE7Ozs7RUFJQSxJQUFBLGNBQUEsVUFBQSxPQUFBO0dBQ0EsSUFBQSxTQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsT0FBQTtJQUNBLFVBQUEsTUFBQSxNQUFBLG1CQUFBLE1BQUEsUUFBQTs7R0FFQSxPQUFBLE9BQUEsVUFBQSxHQUFBLE9BQUEsU0FBQTs7O0VBR0EsS0FBQSxZQUFBLFVBQUEsR0FBQTtHQUNBLE1BQUEsT0FBQTtHQUNBLFFBQUEsVUFBQSxPQUFBLElBQUEsTUFBQSxPQUFBLE1BQUEsWUFBQTs7OztFQUlBLEtBQUEsTUFBQSxVQUFBLFFBQUE7R0FDQSxLQUFBLElBQUEsT0FBQSxRQUFBO0lBQ0EsTUFBQSxPQUFBLE9BQUE7O0dBRUEsUUFBQSxhQUFBLE9BQUEsSUFBQSxNQUFBLE9BQUEsTUFBQSxZQUFBOzs7O0VBSUEsS0FBQSxNQUFBLFVBQUEsS0FBQTtHQUNBLE9BQUEsTUFBQTs7O0VBR0EsUUFBQSxRQUFBOztFQUVBLElBQUEsQ0FBQSxPQUFBO0dBQ0EsUUFBQTs7O0VBR0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgYW5ub3RhdGlvbnMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycsIFsnZGlhcy5hcGknLCAnZGlhcy51aSddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQW5ub3RhdGlvbnNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBhbm5vdGF0aW9ucyBsaXN0IGluIHRoZSBzaWRlYmFyXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQW5ub3RhdGlvbnNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMsIGxhYmVscywgYW5ub3RhdGlvbnMsIHNoYXBlcykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLnNlbGVjdGVkRmVhdHVyZXMgPSBtYXBBbm5vdGF0aW9ucy5nZXRTZWxlY3RlZEZlYXR1cmVzKCkuZ2V0QXJyYXkoKTtcblxuXHRcdCRzY29wZS4kd2F0Y2hDb2xsZWN0aW9uKCdzZWxlY3RlZEZlYXR1cmVzJywgZnVuY3Rpb24gKGZlYXR1cmVzKSB7XG5cdFx0XHRmZWF0dXJlcy5mb3JFYWNoKGZ1bmN0aW9uIChmZWF0dXJlKSB7XG5cdFx0XHRcdGxhYmVscy5mZXRjaEZvckFubm90YXRpb24oZmVhdHVyZS5hbm5vdGF0aW9uKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0dmFyIHJlZnJlc2hBbm5vdGF0aW9ucyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5hbm5vdGF0aW9ucyA9IGFubm90YXRpb25zLmN1cnJlbnQoKTtcblx0XHR9O1xuXG5cdFx0dmFyIHNlbGVjdGVkRmVhdHVyZXMgPSBtYXBBbm5vdGF0aW9ucy5nZXRTZWxlY3RlZEZlYXR1cmVzKCk7XG5cblx0XHQkc2NvcGUuYW5ub3RhdGlvbnMgPSBbXTtcblxuXHRcdCRzY29wZS5jbGVhclNlbGVjdGlvbiA9IG1hcEFubm90YXRpb25zLmNsZWFyU2VsZWN0aW9uO1xuXG5cdFx0JHNjb3BlLnNlbGVjdEFubm90YXRpb24gPSBmdW5jdGlvbiAoZSwgaWQpIHtcblx0XHRcdC8vIGFsbG93IG11bHRpcGxlIHNlbGVjdGlvbnNcblx0XHRcdGlmICghZS5zaGlmdEtleSkge1xuXHRcdFx0XHQkc2NvcGUuY2xlYXJTZWxlY3Rpb24oKTtcblx0XHRcdH1cblx0XHRcdG1hcEFubm90YXRpb25zLnNlbGVjdChpZCk7XG5cdFx0fTtcblxuICAgICAgICAkc2NvcGUuZml0QW5ub3RhdGlvbiA9IG1hcEFubm90YXRpb25zLmZpdDtcblxuXHRcdCRzY29wZS5pc1NlbGVjdGVkID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgc2VsZWN0ZWQgPSBmYWxzZTtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoZmVhdHVyZSkge1xuXHRcdFx0XHRpZiAoZmVhdHVyZS5hbm5vdGF0aW9uICYmIGZlYXR1cmUuYW5ub3RhdGlvbi5pZCA9PSBpZCkge1xuXHRcdFx0XHRcdHNlbGVjdGVkID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gc2VsZWN0ZWQ7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgcmVmcmVzaEFubm90YXRpb25zKTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQW5ub3RhdGlvbnNDeWNsaW5nQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgYmFja2dyb3VuZCBzZWdtZW50YXRpb24gUk9JIG9wYWNpdHkgc2V0dGluZ3NcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdBbm5vdGF0aW9uc0N5Y2xpbmdDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMsIGxhYmVscywga2V5Ym9hcmQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gZmxhZyB0byBwcmV2ZW50IGN5Y2xpbmcgd2hpbGUgYSBuZXcgaW1hZ2UgaXMgbG9hZGluZ1xuICAgICAgICB2YXIgbG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBjeWNsaW5nS2V5ID0gJ2Fubm90YXRpb25zJztcblxuICAgICAgICB2YXIgbmV4dEFubm90YXRpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcgfHwgISRzY29wZS5jeWNsaW5nKCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKG1hcEFubm90YXRpb25zLmhhc05leHQoKSkge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmN5Y2xlTmV4dCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBtZXRob2QgZnJvbSBBbm5vdGF0b3JDb250cm9sbGVyOyBtYXBBbm5vdGF0aW9ucyB3aWxsIHJlZnJlc2ggYXV0b21hdGljYWxseVxuICAgICAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKS50aGVuKG1hcEFubm90YXRpb25zLmp1bXBUb0ZpcnN0KTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGFwcGx5IGlmIHRoaXMgd2FzIGNhbGxlZCBieSB0aGUga2V5Ym9hcmQgZXZlbnRcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNhbmNlbCBhbGwga2V5Ym9hcmQgZXZlbnRzIHdpdGggbG93ZXIgcHJpb3JpdHlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcHJldkFubm90YXRpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcgfHwgISRzY29wZS5jeWNsaW5nKCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKG1hcEFubm90YXRpb25zLmhhc1ByZXZpb3VzKCkpIHtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5jeWNsZVByZXZpb3VzKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG1ldGhvZCBmcm9tIEFubm90YXRvckNvbnRyb2xsZXI7IG1hcEFubm90YXRpb25zIHdpbGwgcmVmcmVzaCBhdXRvbWF0aWNhbGx5XG4gICAgICAgICAgICAgICAgJHNjb3BlLnByZXZJbWFnZSgpLnRoZW4obWFwQW5ub3RhdGlvbnMuanVtcFRvTGFzdCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gb25seSBhcHBseSBpZiB0aGlzIHdhcyBjYWxsZWQgYnkgdGhlIGtleWJvYXJkIGV2ZW50XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjYW5jZWwgYWxsIGtleWJvYXJkIGV2ZW50cyB3aXRoIGxvd2VyIHByaW9yaXR5XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGF0dGFjaExhYmVsID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmIChsb2FkaW5nKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCRzY29wZS5jeWNsaW5nKCkgJiYgbGFiZWxzLmhhc1NlbGVjdGVkKCkpIHtcbiAgICAgICAgICAgICAgICBsYWJlbHMuYXR0YWNoVG9Bbm5vdGF0aW9uKG1hcEFubm90YXRpb25zLmdldEN1cnJlbnQoKSkuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmZsaWNrZXIoMSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmZsaWNrZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzdG9wIGN5Y2xpbmcgdXNpbmcgYSBrZXlib2FyZCBldmVudFxuICAgICAgICB2YXIgc3RvcEN5Y2xpbmcgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgJHNjb3BlLnN0b3BDeWNsaW5nKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmN5Y2xpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmdldFZvbGF0aWxlU2V0dGluZ3MoJ2N5Y2xlJykgPT09IGN5Y2xpbmdLZXk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnN0YXJ0Q3ljbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScsIGN5Y2xpbmdLZXkpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zdG9wQ3ljbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScsICcnKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyB0aGUgY3ljbGUgc2V0dGluZ3MgbXkgYmUgc2V0IGJ5IG90aGVyIGNvbnRyb2xsZXJzLCB0b28sIHNvIHdhdGNoIGl0XG4gICAgICAgIC8vIGluc3RlYWQgb2YgdXNpbmcgdGhlIHN0YXJ0L3N0b3AgZnVuY3Rpb25zIHRvIGFkZC9yZW1vdmUgZXZlbnRzIGV0Yy5cbiAgICAgICAgJHNjb3BlLiR3YXRjaCgndm9sYXRpbGVTZXR0aW5ncy5jeWNsZScsIGZ1bmN0aW9uIChjeWNsZSwgb2xkQ3ljbGUpIHtcbiAgICAgICAgICAgIGlmIChjeWNsZSA9PT0gY3ljbGluZ0tleSkge1xuICAgICAgICAgICAgICAgIC8vIG92ZXJyaWRlIHByZXZpb3VzIGltYWdlIG9uIGFycm93IGxlZnRcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzNywgcHJldkFubm90YXRpb24sIDEwKTtcbiAgICAgICAgICAgICAgICAvLyBvdmVycmlkZSBuZXh0IGltYWdlIG9uIGFycm93IHJpZ2h0IGFuZCBzcGFjZVxuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDM5LCBuZXh0QW5ub3RhdGlvbiwgMTApO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDMyLCBuZXh0QW5ub3RhdGlvbiwgMTApO1xuXG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMTMsIGF0dGFjaExhYmVsLCAxMCk7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMjcsIHN0b3BDeWNsaW5nLCAxMCk7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvbGRDeWNsZSA9PT0gY3ljbGluZ0tleSkge1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzNywgcHJldkFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzOSwgbmV4dEFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzMiwgbmV4dEFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigxMywgYXR0YWNoTGFiZWwpO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigyNywgc3RvcEN5Y2xpbmcpO1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmNsZWFyU2VsZWN0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS5wcmV2QW5ub3RhdGlvbiA9IHByZXZBbm5vdGF0aW9uO1xuICAgICAgICAkc2NvcGUubmV4dEFubm90YXRpb24gPSBuZXh0QW5ub3RhdGlvbjtcbiAgICAgICAgJHNjb3BlLmF0dGFjaExhYmVsID0gYXR0YWNoTGFiZWw7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQW5ub3RhdG9yQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBNYWluIGNvbnRyb2xsZXIgb2YgdGhlIEFubm90YXRvciBhcHBsaWNhdGlvbi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdBbm5vdGF0b3JDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgaW1hZ2VzLCB1cmxQYXJhbXMsIG1zZywgSU1BR0VfSUQsIGtleWJvYXJkKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5pbWFnZXMgPSBpbWFnZXM7XG4gICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgIC8vIHRoZSBjdXJyZW50IGNhbnZhcyB2aWV3cG9ydCwgc3luY2VkIHdpdGggdGhlIFVSTCBwYXJhbWV0ZXJzXG4gICAgICAgICRzY29wZS52aWV3cG9ydCA9IHtcbiAgICAgICAgICAgIHpvb206IHVybFBhcmFtcy5nZXQoJ3onKSxcbiAgICAgICAgICAgIGNlbnRlcjogW3VybFBhcmFtcy5nZXQoJ3gnKSwgdXJsUGFyYW1zLmdldCgneScpXVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGZpbmlzaCBpbWFnZSBsb2FkaW5nIHByb2Nlc3NcbiAgICAgICAgdmFyIGZpbmlzaExvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnaW1hZ2Uuc2hvd24nLCAkc2NvcGUuaW1hZ2VzLmN1cnJlbnRJbWFnZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgdmFyIHB1c2hTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHVybFBhcmFtcy5wdXNoU3RhdGUoJHNjb3BlLmltYWdlcy5jdXJyZW50SW1hZ2UuX2lkKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzdGFydCBpbWFnZSBsb2FkaW5nIHByb2Nlc3NcbiAgICAgICAgdmFyIHN0YXJ0TG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGxvYWQgdGhlIGltYWdlIGJ5IGlkLiBkb2Vzbid0IGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5IGJ5IGl0c2VsZlxuICAgICAgICB2YXIgbG9hZEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBzdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZXMuc2hvdyhwYXJzZUludChpZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHNob3cgdGhlIG5leHQgaW1hZ2UgYW5kIGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5XG4gICAgICAgICRzY29wZS5uZXh0SW1hZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZXMubmV4dCgpXG4gICAgICAgICAgICAgICAgICAudGhlbihmaW5pc2hMb2FkaW5nKVxuICAgICAgICAgICAgICAgICAgLnRoZW4ocHVzaFN0YXRlKVxuICAgICAgICAgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzaG93IHRoZSBwcmV2aW91cyBpbWFnZSBhbmQgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgJHNjb3BlLnByZXZJbWFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlcy5wcmV2KClcbiAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAudGhlbihwdXNoU3RhdGUpXG4gICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgVVJMIHBhcmFtZXRlcnMgb2YgdGhlIHZpZXdwb3J0XG4gICAgICAgICRzY29wZS4kb24oJ2NhbnZhcy5tb3ZlZW5kJywgZnVuY3Rpb24oZSwgcGFyYW1zKSB7XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuem9vbSA9IHBhcmFtcy56b29tO1xuICAgICAgICAgICAgJHNjb3BlLnZpZXdwb3J0LmNlbnRlclswXSA9IE1hdGgucm91bmQocGFyYW1zLmNlbnRlclswXSk7XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuY2VudGVyWzFdID0gTWF0aC5yb3VuZChwYXJhbXMuY2VudGVyWzFdKTtcbiAgICAgICAgICAgIHVybFBhcmFtcy5zZXQoe1xuICAgICAgICAgICAgICAgIHo6ICRzY29wZS52aWV3cG9ydC56b29tLFxuICAgICAgICAgICAgICAgIHg6ICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMF0sXG4gICAgICAgICAgICAgICAgeTogJHNjb3BlLnZpZXdwb3J0LmNlbnRlclsxXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDM3LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUucHJldkltYWdlKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDM5LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUubmV4dEltYWdlKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDMyLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUubmV4dEltYWdlKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGxpc3RlbiB0byB0aGUgYnJvd3NlciBcImJhY2tcIiBidXR0b25cbiAgICAgICAgd2luZG93Lm9ucG9wc3RhdGUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSBlLnN0YXRlO1xuICAgICAgICAgICAgaWYgKHN0YXRlICYmIHN0YXRlLnNsdWcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGxvYWRJbWFnZShzdGF0ZS5zbHVnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpbml0aWFsaXplIHRoZSBpbWFnZXMgc2VydmljZVxuICAgICAgICBpbWFnZXMuaW5pdCgpO1xuICAgICAgICAvLyBkaXNwbGF5IHRoZSBmaXJzdCBpbWFnZVxuICAgICAgICBsb2FkSW1hZ2UoSU1BR0VfSUQpLnRoZW4ocHVzaFN0YXRlKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDYW52YXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1haW4gY29udHJvbGxlciBmb3IgdGhlIGFubm90YXRpb24gY2FudmFzIGVsZW1lbnRcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDYW52YXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwSW1hZ2UsIG1hcEFubm90YXRpb25zLCBtYXAsICR0aW1lb3V0LCBkZWJvdW5jZSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBtYXBWaWV3ID0gbWFwLmdldFZpZXcoKTtcblxuXHRcdC8vIHVwZGF0ZSB0aGUgVVJMIHBhcmFtZXRlcnNcblx0XHRtYXAub24oJ21vdmVlbmQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgZW1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhbnZhcy5tb3ZlZW5kJywge1xuICAgICAgICAgICAgICAgICAgICBjZW50ZXI6IG1hcFZpZXcuZ2V0Q2VudGVyKCksXG4gICAgICAgICAgICAgICAgICAgIHpvb206IG1hcFZpZXcuZ2V0Wm9vbSgpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBkb250IHVwZGF0ZSBpbW1lZGlhdGVseSBidXQgd2FpdCBmb3IgcG9zc2libGUgbmV3IGNoYW5nZXNcbiAgICAgICAgICAgIGRlYm91bmNlKGVtaXQsIDEwMCwgJ2Fubm90YXRvci5jYW52YXMubW92ZWVuZCcpO1xuXHRcdH0pO1xuXG4gICAgICAgIG1hcC5vbignY2hhbmdlOnZpZXcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBWaWV3ID0gbWFwLmdldFZpZXcoKTtcbiAgICAgICAgfSk7XG5cblx0XHRtYXBJbWFnZS5pbml0KCRzY29wZSk7XG5cdFx0bWFwQW5ub3RhdGlvbnMuaW5pdCgkc2NvcGUpO1xuXG5cdFx0dmFyIHVwZGF0ZVNpemUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQvLyB3b3JrYXJvdW5kLCBzbyB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkICphZnRlciogdGhlIGFuZ3VsYXIgZGlnZXN0XG5cdFx0XHQvLyBhbmQgKmFmdGVyKiB0aGUgZm9sZG91dCB3YXMgcmVuZGVyZWRcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgbmVlZHMgdG8gYmUgd3JhcHBlZCBpbiBhbiBleHRyYSBmdW5jdGlvbiBzaW5jZSB1cGRhdGVTaXplIGFjY2VwdHMgYXJndW1lbnRzXG5cdFx0XHRcdG1hcC51cGRhdGVTaXplKCk7XG5cdFx0XHR9LCA1MCwgZmFsc2UpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJG9uKCdzaWRlYmFyLmZvbGRvdXQub3BlbicsIHVwZGF0ZVNpemUpO1xuXHRcdCRzY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5jbG9zZScsIHVwZGF0ZVNpemUpO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDYXRlZ29yaWVzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBsYWJlbCBjYXRlZ29yaWVzIGZvbGRvdXRcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDYXRlZ29yaWVzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGxhYmVscywga2V5Ym9hcmQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gbWF4aW11bSBudW1iZXIgb2YgYWxsb3dlZCBmYXZvdXJpdGVzXG4gICAgICAgIHZhciBtYXhGYXZvdXJpdGVzID0gOTtcbiAgICAgICAgdmFyIGZhdm91cml0ZXNTdG9yYWdlS2V5ID0gJ2RpYXMuYW5ub3RhdGlvbnMubGFiZWwtZmF2b3VyaXRlcyc7XG5cbiAgICAgICAgLy8gc2F2ZXMgdGhlIElEcyBvZiB0aGUgZmF2b3VyaXRlcyBpbiBsb2NhbFN0b3JhZ2VcbiAgICAgICAgdmFyIHN0b3JlRmF2b3VyaXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0bXAgPSAkc2NvcGUuZmF2b3VyaXRlcy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5pZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVtmYXZvdXJpdGVzU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeSh0bXApO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJlc3RvcmVzIHRoZSBmYXZvdXJpdGVzIGZyb20gdGhlIElEcyBpbiBsb2NhbFN0b3JhZ2VcbiAgICAgICAgdmFyIGxvYWRGYXZvdXJpdGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbZmF2b3VyaXRlc1N0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRtcCA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtmYXZvdXJpdGVzU3RvcmFnZUtleV0pO1xuICAgICAgICAgICAgICAgICRzY29wZS5mYXZvdXJpdGVzID0gJHNjb3BlLmNhdGVnb3JpZXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgdGFrZSB0aG9zZSBjYXRlZ29yaWVzIGFzIGZhdm91cml0ZXMgdGhhdCBhcmUgYXZhaWxhYmxlIGZvciB0aGlzIGltYWdlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0bXAuaW5kZXhPZihpdGVtLmlkKSAhPT0gLTE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGNob29zZUZhdm91cml0ZSA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgaWYgKGluZGV4ID49IDAgJiYgaW5kZXggPCAkc2NvcGUuZmF2b3VyaXRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbSgkc2NvcGUuZmF2b3VyaXRlc1tpbmRleF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5ob3RrZXlzTWFwID0gWyfwnZ+tJywgJ/Cdn64nLCAn8J2frycsICfwnZ+wJywgJ/Cdn7EnLCAn8J2fsicsICfwnZ+zJywgJ/Cdn7QnLCAn8J2ftSddO1xuICAgICAgICAkc2NvcGUuY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcyA9IFtdO1xuICAgICAgICBsYWJlbHMucHJvbWlzZS50aGVuKGZ1bmN0aW9uIChhbGwpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBhbGwpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY2F0ZWdvcmllcyA9ICRzY29wZS5jYXRlZ29yaWVzLmNvbmNhdChhbGxba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2FkRmF2b3VyaXRlcygpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuY2F0ZWdvcmllc1RyZWUgPSBsYWJlbHMuZ2V0VHJlZSgpO1xuXG4gICAgICAgICRzY29wZS5zZWxlY3RJdGVtID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIGxhYmVscy5zZXRTZWxlY3RlZChpdGVtKTtcbiAgICAgICAgICAgICRzY29wZS5zZWFyY2hDYXRlZ29yeSA9ICcnOyAvLyBjbGVhciBzZWFyY2ggZmllbGRcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdjYXRlZ29yaWVzLnNlbGVjdGVkJywgaXRlbSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzRmF2b3VyaXRlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuZmF2b3VyaXRlcy5pbmRleE9mKGl0ZW0pICE9PSAtMTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBhZGRzIGEgbmV3IGl0ZW0gdG8gdGhlIGZhdm91cml0ZXMgb3IgcmVtb3ZlcyBpdCBpZiBpdCBpcyBhbHJlYWR5IGEgZmF2b3VyaXRlXG4gICAgICAgICRzY29wZS50b2dnbGVGYXZvdXJpdGUgPSBmdW5jdGlvbiAoZSwgaXRlbSkge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIHZhciBpbmRleCA9ICRzY29wZS5mYXZvdXJpdGVzLmluZGV4T2YoaXRlbSk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xICYmICRzY29wZS5mYXZvdXJpdGVzLmxlbmd0aCA8IG1heEZhdm91cml0ZXMpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RvcmVGYXZvdXJpdGVzKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmV0dXJucyB3aGV0aGVyIHRoZSB1c2VyIGlzIHN0aWxsIGFsbG93ZWQgdG8gYWRkIGZhdm91cml0ZXNcbiAgICAgICAgJHNjb3BlLmZhdm91cml0ZXNMZWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5mYXZvdXJpdGVzLmxlbmd0aCA8IG1heEZhdm91cml0ZXM7XG4gICAgICAgIH07XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzEnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoMCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCcyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDEpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignMycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSgyKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoMyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc1JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDQpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignNicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg1KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoNik7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc4JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDcpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignOScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg4KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQ29uZmlkZW5jZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGNvbmZpZGVuY2UgY29udHJvbFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NvbmZpZGVuY2VDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbGFiZWxzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuY29uZmlkZW5jZSA9IDEuMDtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ2NvbmZpZGVuY2UnLCBmdW5jdGlvbiAoY29uZmlkZW5jZSkge1xuXHRcdFx0bGFiZWxzLnNldEN1cnJlbnRDb25maWRlbmNlKHBhcnNlRmxvYXQoY29uZmlkZW5jZSkpO1xuXG5cdFx0XHRpZiAoY29uZmlkZW5jZSA8PSAwLjI1KSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtZGFuZ2VyJztcblx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjUgKSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtd2FybmluZyc7XG5cdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC43NSApIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC1zdWNjZXNzJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtcHJpbWFyeSc7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENvbnRyb2xzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBjb250cm9sIGJ1dHRvbnNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDb250cm9sc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywgbGFiZWxzLCBtc2csICRhdHRycywga2V5Ym9hcmQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBkcmF3aW5nID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuc2VsZWN0U2hhcGUgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0aWYgKCFsYWJlbHMuaGFzU2VsZWN0ZWQoKSkge1xuICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnc2lkZWJhci5mb2xkb3V0LmRvLW9wZW4nLCAnY2F0ZWdvcmllcycpO1xuXHRcdFx0XHRtc2cuaW5mbygkYXR0cnMuc2VsZWN0Q2F0ZWdvcnkpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdG1hcEFubm90YXRpb25zLmZpbmlzaERyYXdpbmcoKTtcblxuXHRcdFx0aWYgKG5hbWUgPT09IG51bGwgfHwgKGRyYXdpbmcgJiYgJHNjb3BlLnNlbGVjdGVkU2hhcGUgPT09IG5hbWUpKSB7XG5cdFx0XHRcdCRzY29wZS5zZWxlY3RlZFNoYXBlID0gJyc7XG5cdFx0XHRcdGRyYXdpbmcgPSBmYWxzZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5zZWxlY3RlZFNoYXBlID0gbmFtZTtcblx0XHRcdFx0bWFwQW5ub3RhdGlvbnMuc3RhcnREcmF3aW5nKG5hbWUpO1xuXHRcdFx0XHRkcmF3aW5nID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIC8vIGRlc2VsZWN0IGRyYXdpbmcgdG9vbCBvbiBlc2NhcGVcbiAgICAgICAga2V5Ym9hcmQub24oMjcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZShudWxsKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ2EnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ1BvaW50Jyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdSZWN0YW5nbGUnKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ2QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ0NpcmNsZScpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignZicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnTGluZVN0cmluZycpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignZycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnUG9seWdvbicpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgTWluaW1hcENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIG1pbmltYXAgaW4gdGhlIHNpZGViYXJcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdNaW5pbWFwQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcCwgbWFwSW1hZ2UsICRlbGVtZW50LCBzdHlsZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgdmlld3BvcnRTb3VyY2UgPSBuZXcgb2wuc291cmNlLlZlY3RvcigpO1xuXG5cdFx0dmFyIG1pbmltYXAgPSBuZXcgb2wuTWFwKHtcblx0XHRcdHRhcmdldDogJ21pbmltYXAnLFxuXHRcdFx0Ly8gcmVtb3ZlIGNvbnRyb2xzXG5cdFx0XHRjb250cm9sczogW10sXG5cdFx0XHQvLyBkaXNhYmxlIGludGVyYWN0aW9uc1xuXHRcdFx0aW50ZXJhY3Rpb25zOiBbXVxuXHRcdH0pO1xuXG4gICAgICAgIHZhciBtYXBTaXplID0gbWFwLmdldFNpemUoKTtcbiAgICAgICAgdmFyIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuXG5cdFx0Ly8gZ2V0IHRoZSBzYW1lIGxheWVycyB0aGFuIHRoZSBtYXBcblx0XHRtaW5pbWFwLmFkZExheWVyKG1hcEltYWdlLmdldExheWVyKCkpO1xuICAgICAgICBtaW5pbWFwLmFkZExheWVyKG5ldyBvbC5sYXllci5WZWN0b3Ioe1xuICAgICAgICAgICAgc291cmNlOiB2aWV3cG9ydFNvdXJjZSxcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZXMudmlld3BvcnRcbiAgICAgICAgfSkpO1xuXG5cdFx0dmFyIHZpZXdwb3J0ID0gbmV3IG9sLkZlYXR1cmUoKTtcblx0XHR2aWV3cG9ydFNvdXJjZS5hZGRGZWF0dXJlKHZpZXdwb3J0KTtcblxuXHRcdC8vIHJlZnJlc2ggdGhlIHZpZXcgKHRoZSBpbWFnZSBzaXplIGNvdWxkIGhhdmUgYmVlbiBjaGFuZ2VkKVxuXHRcdCRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC5zZXRWaWV3KG5ldyBvbC5WaWV3KHtcblx0XHRcdFx0cHJvamVjdGlvbjogbWFwSW1hZ2UuZ2V0UHJvamVjdGlvbigpLFxuXHRcdFx0XHRjZW50ZXI6IG9sLmV4dGVudC5nZXRDZW50ZXIobWFwSW1hZ2UuZ2V0RXh0ZW50KCkpLFxuXHRcdFx0XHR6b29tOiAwXG5cdFx0XHR9KSk7XG5cdFx0fSk7XG5cblx0XHQvLyBtb3ZlIHRoZSB2aWV3cG9ydCByZWN0YW5nbGUgb24gdGhlIG1pbmltYXBcblx0XHR2YXIgcmVmcmVzaFZpZXdwb3J0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmlld3BvcnQuc2V0R2VvbWV0cnkob2wuZ2VvbS5Qb2x5Z29uLmZyb21FeHRlbnQobWFwVmlldy5jYWxjdWxhdGVFeHRlbnQobWFwU2l6ZSkpKTtcblx0XHR9O1xuXG4gICAgICAgIG1hcC5vbignY2hhbmdlOnNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBTaXplID0gbWFwLmdldFNpemUoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbWFwLm9uKCdjaGFuZ2U6dmlldycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuICAgICAgICB9KTtcblxuXHRcdG1hcC5vbigncG9zdGNvbXBvc2UnLCByZWZyZXNoVmlld3BvcnQpO1xuXG5cdFx0dmFyIGRyYWdWaWV3cG9ydCA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRtYXBWaWV3LnNldENlbnRlcihlLmNvb3JkaW5hdGUpO1xuXHRcdH07XG5cblx0XHRtaW5pbWFwLm9uKCdwb2ludGVyZHJhZycsIGRyYWdWaWV3cG9ydCk7XG5cblx0XHQkZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdG1pbmltYXAudW4oJ3BvaW50ZXJkcmFnJywgZHJhZ1ZpZXdwb3J0KTtcblx0XHR9KTtcblxuXHRcdCRlbGVtZW50Lm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC5vbigncG9pbnRlcmRyYWcnLCBkcmFnVmlld3BvcnQpO1xuXHRcdH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTZWxlY3RlZExhYmVsQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2VsZWN0ZWQgbGFiZWwgZGlzcGxheSBpbiB0aGUgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2VsZWN0ZWRMYWJlbENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuZ2V0U2VsZWN0ZWRMYWJlbCA9IGxhYmVscy5nZXRTZWxlY3RlZDtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2V0dGluZ3NBbm5vdGF0aW9uT3BhY2l0eUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgc2V0dGluZ3MgZm9sZG91dFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NldHRpbmdzQW5ub3RhdGlvbk9wYWNpdHlDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLnNldERlZmF1bHRTZXR0aW5ncygnYW5ub3RhdGlvbl9vcGFjaXR5JywgJzEnKTtcbiAgICAgICAgJHNjb3BlLiR3YXRjaCgnc2V0dGluZ3MuYW5ub3RhdGlvbl9vcGFjaXR5JywgZnVuY3Rpb24gKG9wYWNpdHkpIHtcbiAgICAgICAgICAgIG1hcEFubm90YXRpb25zLnNldE9wYWNpdHkob3BhY2l0eSk7XG4gICAgICAgIH0pO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNldHRpbmdzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBzZXR0aW5ncyBmb2xkb3V0XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2V0dGluZ3NDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgZGVib3VuY2UpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIHNldHRpbmdzU3RvcmFnZUtleSA9ICdkaWFzLmFubm90YXRpb25zLnNldHRpbmdzJztcblxuICAgICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0ge307XG5cbiAgICAgICAgLy8gbWF5IGJlIGV4dGVuZGVkIGJ5IGNoaWxkIGNvbnRyb2xsZXJzXG4gICAgICAgICRzY29wZS5zZXR0aW5ncyA9IHt9O1xuXG4gICAgICAgIC8vIG1heSBiZSBleHRlbmRlZCBieSBjaGlsZCBjb250cm9sbGVycyBidXQgd2lsbCBub3QgYmUgcGVybWFuZW50bHkgc3RvcmVkXG4gICAgICAgICRzY29wZS52b2xhdGlsZVNldHRpbmdzID0ge307XG5cbiAgICAgICAgdmFyIHN0b3JlU2V0dGluZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc2V0dGluZ3MgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnNldHRpbmdzKTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5nc1trZXldID09PSBkZWZhdWx0U2V0dGluZ3Nba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBkb24ndCBzdG9yZSBkZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2V0dGluZ3Nba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KHNldHRpbmdzKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgc3RvcmVTZXR0aW5nc0RlYm91bmNlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIHdhaXQgZm9yIHF1aWNrIGNoYW5nZXMgYW5kIG9ubHkgc3RvcmUgdGhlbSBvbmNlIHRoaW5ncyBjYWxtZWQgZG93biBhZ2FpblxuICAgICAgICAgICAgLy8gKGUuZy4gd2hlbiB0aGUgdXNlciBmb29scyBhcm91bmQgd2l0aCBhIHJhbmdlIHNsaWRlcilcbiAgICAgICAgICAgIGRlYm91bmNlKHN0b3JlU2V0dGluZ3MsIDI1MCwgc2V0dGluZ3NTdG9yYWdlS2V5KTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmVzdG9yZVNldHRpbmdzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHNldHRpbmdzID0ge307XG4gICAgICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc1N0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmV4dGVuZChzZXR0aW5ncywgZGVmYXVsdFNldHRpbmdzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2V0U2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0U2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnNldHRpbmdzW2tleV07XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNldERlZmF1bHRTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBkZWZhdWx0U2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgaWYgKCEkc2NvcGUuc2V0dGluZ3MuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zZXRTZXR0aW5ncyhrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2V0Vm9sYXRpbGVTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAkc2NvcGUudm9sYXRpbGVTZXR0aW5nc1trZXldID0gdmFsdWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFZvbGF0aWxlU2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnZvbGF0aWxlU2V0dGluZ3Nba2V5XTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuJHdhdGNoKCdzZXR0aW5ncycsIHN0b3JlU2V0dGluZ3NEZWJvdW5jZWQsIHRydWUpO1xuICAgICAgICBhbmd1bGFyLmV4dGVuZCgkc2NvcGUuc2V0dGluZ3MsIHJlc3RvcmVTZXR0aW5ncygpKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTaWRlYmFyQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NpZGViYXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgbWFwQW5ub3RhdGlvbnMsIGtleWJvYXJkKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGZvbGRvdXRTdG9yYWdlS2V5ID0gJ2RpYXMuYW5ub3RhdGlvbnMuc2lkZWJhci1mb2xkb3V0JztcblxuICAgICAgICAkc2NvcGUuZm9sZG91dCA9ICcnO1xuXG5cdFx0JHNjb3BlLm9wZW5Gb2xkb3V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldID0gbmFtZTtcbiAgICAgICAgICAgICRzY29wZS5mb2xkb3V0ID0gbmFtZTtcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2lkZWJhci5mb2xkb3V0Lm9wZW4nLCBuYW1lKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNsb3NlRm9sZG91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShmb2xkb3V0U3RvcmFnZUtleSk7XG5cdFx0XHQkc2NvcGUuZm9sZG91dCA9ICcnO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzaWRlYmFyLmZvbGRvdXQuY2xvc2UnKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUZvbGRvdXQgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0aWYgKCRzY29wZS5mb2xkb3V0ID09PSBuYW1lKSB7XG5cdFx0XHRcdCRzY29wZS5jbG9zZUZvbGRvdXQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5vcGVuRm9sZG91dChuYW1lKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLmRlbGV0ZVNlbGVjdGVkQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAobWFwQW5ub3RhdGlvbnMuZ2V0U2VsZWN0ZWRGZWF0dXJlcygpLmdldExlbmd0aCgpID4gMCAmJiBjb25maXJtKCdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIGFsbCBzZWxlY3RlZCBhbm5vdGF0aW9ucz8nKSkge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmRlbGV0ZVNlbGVjdGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5kby1vcGVuJywgZnVuY3Rpb24gKGUsIG5hbWUpIHtcbiAgICAgICAgICAgICRzY29wZS5vcGVuRm9sZG91dChuYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oOSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICRzY29wZS50b2dnbGVGb2xkb3V0KCdjYXRlZ29yaWVzJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDQ2LCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZVNlbGVjdGVkQW5ub3RhdGlvbnMoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gdGhlIGN1cnJlbnRseSBvcGVuZWQgc2lkZWJhci0nZXh0ZW5zaW9uJyBpcyByZW1lbWJlcmVkIHRocm91Z2ggbG9jYWxTdG9yYWdlXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW2ZvbGRvdXRTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgJHNjb3BlLm9wZW5Gb2xkb3V0KHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldKTtcbiAgICAgICAgfVxuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGFubm90YXRpb25MaXN0SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBbiBhbm5vdGF0aW9uIGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5kaXJlY3RpdmUoJ2Fubm90YXRpb25MaXN0SXRlbScsIGZ1bmN0aW9uIChsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRzY29wZTogdHJ1ZSxcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0JHNjb3BlLnNoYXBlQ2xhc3MgPSAnaWNvbi0nICsgJHNjb3BlLmFubm90YXRpb24uc2hhcGUudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0XHQkc2NvcGUuc2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS5pc1NlbGVjdGVkKCRzY29wZS5hbm5vdGF0aW9uLmlkKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuYXR0YWNoTGFiZWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0bGFiZWxzLmF0dGFjaFRvQW5ub3RhdGlvbigkc2NvcGUuYW5ub3RhdGlvbik7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLnJlbW92ZUxhYmVsID0gZnVuY3Rpb24gKGxhYmVsKSB7XG5cdFx0XHRcdFx0bGFiZWxzLnJlbW92ZUZyb21Bbm5vdGF0aW9uKCRzY29wZS5hbm5vdGF0aW9uLCBsYWJlbCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmNhbkF0dGFjaExhYmVsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuc2VsZWN0ZWQoKSAmJiBsYWJlbHMuaGFzU2VsZWN0ZWQoKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudExhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkO1xuXG5cdFx0XHRcdCRzY29wZS5jdXJyZW50Q29uZmlkZW5jZSA9IGxhYmVscy5nZXRDdXJyZW50Q29uZmlkZW5jZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhYmVsQ2F0ZWdvcnlJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgbGFiZWwgY2F0ZWdvcnkgbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmRpcmVjdGl2ZSgnbGFiZWxDYXRlZ29yeUl0ZW0nLCBmdW5jdGlvbiAoJGNvbXBpbGUsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdDJyxcblxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdsYWJlbC1pdGVtLmh0bWwnLFxuXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHdhaXQgZm9yIHRoaXMgZWxlbWVudCB0byBiZSByZW5kZXJlZCB1bnRpbCB0aGUgY2hpbGRyZW4gYXJlXG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kZWQsIG90aGVyd2lzZSB0aGVyZSB3b3VsZCBiZSB0b28gbXVjaCByZWN1cnNpb24gZm9yXG4gICAgICAgICAgICAgICAgLy8gYW5ndWxhclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnbGFiZWwtc3VidHJlZS5odG1sJykpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoY29udGVudCkoc2NvcGUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIHRoZSBzdWJ0cmVlIG9mIHRoaXMgaXRlbVxuICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaGFzIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzRXhwYW5kYWJsZSA9ICRzY29wZS50cmVlICYmICEhJHNjb3BlLnRyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8gaGFuZGxlIHRoaXMgYnkgdGhlIGV2ZW50IHJhdGhlciB0aGFuIGFuIG93biBjbGljayBoYW5kbGVyIHRvXG4gICAgICAgICAgICAgICAgLy8gZGVhbCB3aXRoIGNsaWNrIGFuZCBzZWFyY2ggZmllbGQgYWN0aW9ucyBpbiBhIHVuaWZpZWQgd2F5XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGZ1bmN0aW9uIChlLCBjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbiBpdGVtIGlzIHNlbGVjdGVkLCBpdHMgc3VidHJlZSBhbmQgYWxsIHBhcmVudCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgb3BlbmVkXG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5pZCA9PT0gY2F0ZWdvcnkuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBoaXRzIGFsbCBwYXJlbnQgc2NvcGVzL2l0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGEgY2hpbGQgaXRlbSB3YXMgc2VsZWN0ZWQsIHRoaXMgaXRlbSBzaG91bGQgYmUgb3BlbmVkLCB0b29cbiAgICAgICAgICAgICAgICAvLyBzbyB0aGUgc2VsZWN0ZWQgaXRlbSBiZWNvbWVzIHZpc2libGUgaW4gdGhlIHRyZWVcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3AgcHJvcGFnYXRpb24gaWYgdGhpcyBpcyBhIHJvb3QgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0ucGFyZW50X2lkID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYWJlbEl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQW4gYW5ub3RhdGlvbiBsYWJlbCBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZGlyZWN0aXZlKCdsYWJlbEl0ZW0nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFx0XHR2YXIgY29uZmlkZW5jZSA9ICRzY29wZS5hbm5vdGF0aW9uTGFiZWwuY29uZmlkZW5jZTtcblxuXHRcdFx0XHRpZiAoY29uZmlkZW5jZSA8PSAwLjI1KSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLWRhbmdlcic7XG5cdFx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjUgKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXdhcm5pbmcnO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC43NSApIHtcblx0XHRcdFx0XHQkc2NvcGUuY2xhc3MgPSAnbGFiZWwtc3VjY2Vzcyc7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXByaW1hcnknO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgZGVib3VuY2VcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQSBkZWJvdW5jZSBzZXJ2aWNlIHRvIHBlcmZvcm0gYW4gYWN0aW9uIG9ubHkgd2hlbiB0aGlzIGZ1bmN0aW9uXG4gKiB3YXNuJ3QgY2FsbGVkIGFnYWluIGluIGEgc2hvcnQgcGVyaW9kIG9mIHRpbWUuXG4gKiBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTMzMjAwMTYvMTc5NjUyM1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmZhY3RvcnkoJ2RlYm91bmNlJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkcSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHRpbWVvdXRzID0ge307XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gKGZ1bmMsIHdhaXQsIGlkKSB7XG5cdFx0XHQvLyBDcmVhdGUgYSBkZWZlcnJlZCBvYmplY3QgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gd2UgbmVlZCB0b1xuXHRcdFx0Ly8gYWN0dWFsbHkgY2FsbCB0aGUgZnVuY1xuXHRcdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdHJldHVybiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHRcdFx0dmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGltZW91dHNbaWRdID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKSk7XG5cdFx0XHRcdFx0ZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpZiAodGltZW91dHNbaWRdKSB7XG5cdFx0XHRcdFx0JHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRzW2lkXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGltZW91dHNbaWRdID0gJHRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHRcdH0pKCk7XG5cdFx0fTtcblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIG1hcFxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIGZhY3RvcnkgaGFuZGxpbmcgT3BlbkxheWVycyBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5mYWN0b3J5KCdtYXAnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgbWFwID0gbmV3IG9sLk1hcCh7XG5cdFx0XHR0YXJnZXQ6ICdjYW52YXMnLFxuICAgICAgICAgICAgcmVuZGVyZXI6ICdjYW52YXMnLFxuXHRcdFx0Y29udHJvbHM6IFtcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuWm9vbSgpLFxuXHRcdFx0XHRuZXcgb2wuY29udHJvbC5ab29tVG9FeHRlbnQoKSxcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuRnVsbFNjcmVlbigpXG5cdFx0XHRdLFxuICAgICAgICAgICAgaW50ZXJhY3Rpb25zOiBvbC5pbnRlcmFjdGlvbi5kZWZhdWx0cyh7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQ6IGZhbHNlXG4gICAgICAgICAgICB9KVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIG1hcDtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgYW5ub3RhdGlvbnNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIHRoZSBhbm5vdGF0aW9ucyB0byBtYWtlIHRoZW0gYXZhaWxhYmxlIGluIG11bHRpcGxlIGNvbnRyb2xsZXJzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2Fubm90YXRpb25zJywgZnVuY3Rpb24gKEFubm90YXRpb24sIHNoYXBlcywgbGFiZWxzLCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBhbm5vdGF0aW9ucztcbiAgICAgICAgdmFyIHByb21pc2U7XG5cblx0XHR2YXIgcmVzb2x2ZVNoYXBlTmFtZSA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHRhbm5vdGF0aW9uLnNoYXBlID0gc2hhcGVzLmdldE5hbWUoYW5ub3RhdGlvbi5zaGFwZV9pZCk7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbjtcblx0XHR9O1xuXG5cdFx0dmFyIGFkZEFubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0YW5ub3RhdGlvbnMucHVzaChhbm5vdGF0aW9uKTtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR0aGlzLnF1ZXJ5ID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0YW5ub3RhdGlvbnMgPSBBbm5vdGF0aW9uLnF1ZXJ5KHBhcmFtcyk7XG4gICAgICAgICAgICBwcm9taXNlID0gYW5ub3RhdGlvbnMuJHByb21pc2U7XG5cdFx0XHRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKGEpIHtcblx0XHRcdFx0YS5mb3JFYWNoKHJlc29sdmVTaGFwZU5hbWUpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnM7XG5cdFx0fTtcblxuXHRcdHRoaXMuYWRkID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0aWYgKCFwYXJhbXMuc2hhcGVfaWQgJiYgcGFyYW1zLnNoYXBlKSB7XG5cdFx0XHRcdHBhcmFtcy5zaGFwZV9pZCA9IHNoYXBlcy5nZXRJZChwYXJhbXMuc2hhcGUpO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGxhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkKCk7XG5cdFx0XHRwYXJhbXMubGFiZWxfaWQgPSBsYWJlbC5pZDtcblx0XHRcdHBhcmFtcy5jb25maWRlbmNlID0gbGFiZWxzLmdldEN1cnJlbnRDb25maWRlbmNlKCk7XG5cdFx0XHR2YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uYWRkKHBhcmFtcyk7XG5cdFx0XHRhbm5vdGF0aW9uLiRwcm9taXNlXG5cdFx0XHQgICAgICAgICAgLnRoZW4ocmVzb2x2ZVNoYXBlTmFtZSlcblx0XHRcdCAgICAgICAgICAudGhlbihhZGRBbm5vdGF0aW9uKVxuXHRcdFx0ICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG5cblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHQvLyB1c2UgaW5kZXggdG8gc2VlIGlmIHRoZSBhbm5vdGF0aW9uIGV4aXN0cyBpbiB0aGUgYW5ub3RhdGlvbnMgbGlzdFxuXHRcdFx0dmFyIGluZGV4ID0gYW5ub3RhdGlvbnMuaW5kZXhPZihhbm5vdGF0aW9uKTtcblx0XHRcdGlmIChpbmRleCA+IC0xKSB7XG5cdFx0XHRcdHJldHVybiBhbm5vdGF0aW9uLiRkZWxldGUoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdC8vIHVwZGF0ZSB0aGUgaW5kZXggc2luY2UgdGhlIGFubm90YXRpb25zIGxpc3QgbWF5IGhhdmUgYmVlblxuXHRcdFx0XHRcdC8vIG1vZGlmaWVkIGluIHRoZSBtZWFudGltZVxuXHRcdFx0XHRcdGluZGV4ID0gYW5ub3RhdGlvbnMuaW5kZXhPZihhbm5vdGF0aW9uKTtcblx0XHRcdFx0XHRhbm5vdGF0aW9ucy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHR9LCBtc2cucmVzcG9uc2VFcnJvcik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRoaXMuZm9yRWFjaCA9IGZ1bmN0aW9uIChmbikge1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb25zLmZvckVhY2goZm4pO1xuXHRcdH07XG5cblx0XHR0aGlzLmN1cnJlbnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnM7XG5cdFx0fTtcblxuICAgICAgICB0aGlzLmdldFByb21pc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgaW1hZ2VzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1hbmFnZXMgKHByZS0pbG9hZGluZyBvZiB0aGUgaW1hZ2VzIHRvIGFubm90YXRlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2ltYWdlcycsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBUcmFuc2VjdEltYWdlLCBVUkwsICRxLCBmaWx0ZXJTdWJzZXQsIFRSQU5TRUNUX0lEKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXHRcdC8vIGFycmF5IG9mIGFsbCBpbWFnZSBJRHMgb2YgdGhlIHRyYW5zZWN0XG5cdFx0dmFyIGltYWdlSWRzID0gW107XG5cdFx0Ly8gbWF4aW11bSBudW1iZXIgb2YgaW1hZ2VzIHRvIGhvbGQgaW4gYnVmZmVyXG5cdFx0dmFyIE1BWF9CVUZGRVJfU0laRSA9IDEwO1xuXHRcdC8vIGJ1ZmZlciBvZiBhbHJlYWR5IGxvYWRlZCBpbWFnZXNcblx0XHR2YXIgYnVmZmVyID0gW107XG5cblx0XHQvLyB0aGUgY3VycmVudGx5IHNob3duIGltYWdlXG5cdFx0dGhpcy5jdXJyZW50SW1hZ2UgPSB1bmRlZmluZWQ7XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBuZXh0IElEIG9mIHRoZSBzcGVjaWZpZWQgaW1hZ2Ugb3IgdGhlIG5leHQgSUQgb2YgdGhlXG5cdFx0ICogY3VycmVudCBpbWFnZSBpZiBubyBpbWFnZSB3YXMgc3BlY2lmaWVkLlxuXHRcdCAqL1xuXHRcdHZhciBuZXh0SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdHZhciBpbmRleCA9IGltYWdlSWRzLmluZGV4T2YoaWQpO1xuXHRcdFx0cmV0dXJuIGltYWdlSWRzWyhpbmRleCArIDEpICUgaW1hZ2VJZHMubGVuZ3RoXTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgcHJldmlvdXMgSUQgb2YgdGhlIHNwZWNpZmllZCBpbWFnZSBvciB0aGUgcHJldmlvdXMgSUQgb2Zcblx0XHQgKiB0aGUgY3VycmVudCBpbWFnZSBpZiBubyBpbWFnZSB3YXMgc3BlY2lmaWVkLlxuXHRcdCAqL1xuXHRcdHZhciBwcmV2SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdHZhciBpbmRleCA9IGltYWdlSWRzLmluZGV4T2YoaWQpO1xuXHRcdFx0dmFyIGxlbmd0aCA9IGltYWdlSWRzLmxlbmd0aDtcblx0XHRcdHJldHVybiBpbWFnZUlkc1soaW5kZXggLSAxICsgbGVuZ3RoKSAlIGxlbmd0aF07XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIHNwZWNpZmllZCBpbWFnZSBmcm9tIHRoZSBidWZmZXIgb3IgYHVuZGVmaW5lZGAgaWYgaXQgaXNcblx0XHQgKiBub3QgYnVmZmVyZWQuXG5cdFx0ICovXG5cdFx0dmFyIGdldEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRpZCA9IGlkIHx8IF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0XHRmb3IgKHZhciBpID0gYnVmZmVyLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdGlmIChidWZmZXJbaV0uX2lkID09IGlkKSByZXR1cm4gYnVmZmVyW2ldO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTZXRzIHRoZSBzcGVjaWZpZWQgaW1hZ2UgdG8gYXMgdGhlIGN1cnJlbnRseSBzaG93biBpbWFnZS5cblx0XHQgKi9cblx0XHR2YXIgc2hvdyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0X3RoaXMuY3VycmVudEltYWdlID0gZ2V0SW1hZ2UoaWQpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBMb2FkcyB0aGUgc3BlY2lmaWVkIGltYWdlIGVpdGhlciBmcm9tIGJ1ZmZlciBvciBmcm9tIHRoZSBleHRlcm5hbFxuXHRcdCAqIHJlc291cmNlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGdldHMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXNcblx0XHQgKiBsb2FkZWQuXG5cdFx0ICovXG5cdFx0dmFyIGZldGNoSW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0XHR2YXIgaW1nID0gZ2V0SW1hZ2UoaWQpO1xuXG5cdFx0XHRpZiAoaW1nKSB7XG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW1nKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuXHRcdFx0XHRpbWcuX2lkID0gaWQ7XG5cdFx0XHRcdGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0YnVmZmVyLnB1c2goaW1nKTtcblx0XHRcdFx0XHQvLyBjb250cm9sIG1heGltdW0gYnVmZmVyIHNpemVcblx0XHRcdFx0XHRpZiAoYnVmZmVyLmxlbmd0aCA+IE1BWF9CVUZGRVJfU0laRSkge1xuXHRcdFx0XHRcdFx0YnVmZmVyLnNoaWZ0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW1nKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAobXNnKSB7XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KG1zZyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGltZy5zcmMgPSBVUkwgKyBcIi9hcGkvdjEvaW1hZ2VzL1wiICsgaWQgKyBcIi9maWxlXCI7XG5cdFx0XHR9XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnaW1hZ2UuZmV0Y2hpbmcnLCBpbWcpO1xuXG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSW5pdGlhbGl6ZXMgdGhlIHNlcnZpY2UgZm9yIGEgZ2l2ZW4gdHJhbnNlY3QuIFJldHVybnMgYSBwcm9taXNlIHRoYXRcblx0XHQgKiBpcyByZXNvbHZlZCwgd2hlbiB0aGUgc2VydmljZSBpcyBpbml0aWFsaXplZC5cblx0XHQgKi9cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpbWFnZUlkcyA9IFRyYW5zZWN0SW1hZ2UucXVlcnkoe3RyYW5zZWN0X2lkOiBUUkFOU0VDVF9JRH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBsb29rIGZvciBhIHNlcXVlbmNlIG9mIGltYWdlIElEcyBpbiBsb2NhbCBzdG9yYWdlLlxuICAgICAgICAgICAgICAgIC8vIHRoaXMgc2VxdWVuY2UgaXMgcHJvZHVjZXMgYnkgdGhlIHRyYW5zZWN0IGluZGV4IHBhZ2Ugd2hlbiB0aGUgaW1hZ2VzIGFyZVxuICAgICAgICAgICAgICAgIC8vIHNvcnRlZCBvciBmaWx0ZXJlZC4gd2Ugd2FudCB0byByZWZsZWN0IHRoZSBzYW1lIG9yZGVyaW5nIG9yIGZpbHRlcmluZyBoZXJlXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhlIGFubm90YXRvclxuICAgICAgICAgICAgICAgIHZhciBzdG9yZWRTZXF1ZW5jZSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2VbJ2RpYXMudHJhbnNlY3RzLicgKyBUUkFOU0VDVF9JRCArICcuaW1hZ2VzJ107XG4gICAgICAgICAgICAgICAgaWYgKHN0b3JlZFNlcXVlbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlID0gSlNPTi5wYXJzZShzdG9yZWRTZXF1ZW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIHN1Y2ggYSBzdG9yZWQgc2VxdWVuY2UsIGZpbHRlciBvdXQgYW55IGltYWdlIElEcyB0aGF0IGRvIG5vdFxuICAgICAgICAgICAgICAgICAgICAvLyBiZWxvbmcgdG8gdGhlIHRyYW5zZWN0IChhbnkgbW9yZSksIHNpbmNlIHNvbWUgb2YgdGhlbSBtYXkgaGF2ZSBiZWVuIGRlbGV0ZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIG1lYW50aW1lXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclN1YnNldChzdG9yZWRTZXF1ZW5jZSwgaW1hZ2VJZHMpO1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIHByb21pc2UgaXMgbm90IHJlbW92ZWQgd2hlbiBvdmVyd3JpdGluZyBpbWFnZUlkcyBzaW5jZSB3ZVxuICAgICAgICAgICAgICAgICAgICAvLyBuZWVkIGl0IGxhdGVyIG9uLlxuICAgICAgICAgICAgICAgICAgICBzdG9yZWRTZXF1ZW5jZS4kcHJvbWlzZSA9IGltYWdlSWRzLiRwcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICBzdG9yZWRTZXF1ZW5jZS4kcmVzb2x2ZWQgPSBpbWFnZUlkcy4kcmVzb2x2ZWQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZW4gc2V0IHRoZSBzdG9yZWQgc2VxdWVuY2UgYXMgdGhlIHNlcXVlbmNlIG9mIGltYWdlIElEcyBpbnN0ZWFkIG9mIHNpbXBseVxuICAgICAgICAgICAgICAgICAgICAvLyBhbGwgSURzIGJlbG9uZ2luZyB0byB0aGUgdHJhbnNlY3RcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VJZHMgPSBzdG9yZWRTZXF1ZW5jZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuXHRcdFx0cmV0dXJuIGltYWdlSWRzLiRwcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBpbWFnZSB3aXRoIHRoZSBzcGVjaWZpZWQgSUQuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXNcblx0XHQgKiByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpcyBzaG93bi5cblx0XHQgKi9cblx0XHR0aGlzLnNob3cgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBwcm9taXNlID0gZmV0Y2hJbWFnZShpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0c2hvdyhpZCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gd2FpdCBmb3IgaW1hZ2VJZHMgdG8gYmUgbG9hZGVkXG5cdFx0XHRpbWFnZUlkcy4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0Ly8gcHJlLWxvYWQgcHJldmlvdXMgYW5kIG5leHQgaW1hZ2VzIGJ1dCBkb24ndCBkaXNwbGF5IHRoZW1cblx0XHRcdFx0ZmV0Y2hJbWFnZShuZXh0SWQoaWQpKTtcblx0XHRcdFx0ZmV0Y2hJbWFnZShwcmV2SWQoaWQpKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gcHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2hvdyB0aGUgbmV4dCBpbWFnZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMubmV4dCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfdGhpcy5zaG93KG5leHRJZCgpKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2hvdyB0aGUgcHJldmlvdXMgaW1hZ2UuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXNcblx0XHQgKiByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpcyBzaG93bi5cblx0XHQgKi9cblx0XHR0aGlzLnByZXYgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3RoaXMuc2hvdyhwcmV2SWQoKSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0Q3VycmVudElkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUga2V5Ym9hcmRcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSB0byByZWdpc3RlciBhbmQgbWFuYWdlIGtleXByZXNzIGV2ZW50cyB3aXRoIHByaW9yaXRpZXNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdrZXlib2FyZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gbWFwcyBrZXkgY29kZXMvY2hhcmFjdGVycyB0byBhcnJheXMgb2YgbGlzdGVuZXJzXG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB7fTtcblxuICAgICAgICB2YXIgZXhlY3V0ZUNhbGxiYWNrcyA9IGZ1bmN0aW9uIChsaXN0LCBlKSB7XG4gICAgICAgICAgICAvLyBnbyBmcm9tIGhpZ2hlc3QgcHJpb3JpdHkgZG93blxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IGxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAvLyBjYWxsYmFja3MgY2FuIGNhbmNlbCBmdXJ0aGVyIHByb3BhZ2F0aW9uXG4gICAgICAgICAgICAgICAgaWYgKGxpc3RbaV0uY2FsbGJhY2soZSkgPT09IGZhbHNlKSByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZUtleUV2ZW50cyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgY29kZSA9IGUua2V5Q29kZTtcbiAgICAgICAgICAgIHZhciBjaGFyYWN0ZXIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGUud2hpY2ggfHwgY29kZSkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjb2RlXSkge1xuICAgICAgICAgICAgICAgIGV4ZWN1dGVDYWxsYmFja3MobGlzdGVuZXJzW2NvZGVdLCBlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjaGFyYWN0ZXJdKSB7XG4gICAgICAgICAgICAgICAgZXhlY3V0ZUNhbGxiYWNrcyhsaXN0ZW5lcnNbY2hhcmFjdGVyXSwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleUV2ZW50cyk7XG5cbiAgICAgICAgLy8gcmVnaXN0ZXIgYSBuZXcgZXZlbnQgbGlzdGVuZXIgZm9yIHRoZSBrZXkgY29kZSBvciBjaGFyYWN0ZXIgd2l0aCBhbiBvcHRpb25hbCBwcmlvcml0eVxuICAgICAgICAvLyBsaXN0ZW5lcnMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgYXJlIGNhbGxlZCBmaXJzdCBhbmMgY2FuIHJldHVybiAnZmFsc2UnIHRvIHByZXZlbnQgdGhlXG4gICAgICAgIC8vIGxpc3RlbmVycyB3aXRoIGxvd2VyIHByaW9yaXR5IGZyb20gYmVpbmcgY2FsbGVkXG4gICAgICAgIHRoaXMub24gPSBmdW5jdGlvbiAoY2hhck9yQ29kZSwgY2FsbGJhY2ssIHByaW9yaXR5KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNoYXJPckNvZGUgPT09ICdzdHJpbmcnIHx8IGNoYXJPckNvZGUgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBjaGFyT3JDb2RlID0gY2hhck9yQ29kZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcmlvcml0eSA9IHByaW9yaXR5IHx8IDA7XG4gICAgICAgICAgICB2YXIgbGlzdGVuZXIgPSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrLFxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiBwcmlvcml0eVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjaGFyT3JDb2RlXSkge1xuICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gbGlzdGVuZXJzW2NoYXJPckNvZGVdO1xuICAgICAgICAgICAgICAgIHZhciBpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RbaV0ucHJpb3JpdHkgPj0gcHJpb3JpdHkpIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpID09PSBsaXN0Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnNwbGljZShpLCAwLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyc1tjaGFyT3JDb2RlXSA9IFtsaXN0ZW5lcl07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdW5yZWdpc3RlciBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICB0aGlzLm9mZiA9IGZ1bmN0aW9uIChjaGFyT3JDb2RlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjaGFyT3JDb2RlID09PSAnc3RyaW5nJyB8fCBjaGFyT3JDb2RlIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgY2hhck9yQ29kZSA9IGNoYXJPckNvZGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjaGFyT3JDb2RlXSkge1xuICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gbGlzdGVuZXJzW2NoYXJPckNvZGVdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdFtpXS5jYWxsYmFjayA9PT0gY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbGFiZWxzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgYW5ub3RhdGlvbiBsYWJlbHMgdG8gcHJvdmlkZSBzb21lIGNvbnZlbmllbmNlIGZ1bmN0aW9ucy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdsYWJlbHMnLCBmdW5jdGlvbiAoQW5ub3RhdGlvbkxhYmVsLCBMYWJlbCwgUHJvamVjdExhYmVsLCBQcm9qZWN0LCBtc2csICRxLCBQUk9KRUNUX0lEUykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRMYWJlbDtcbiAgICAgICAgdmFyIGN1cnJlbnRDb25maWRlbmNlID0gMS4wO1xuXG4gICAgICAgIHZhciBsYWJlbHMgPSB7fTtcblxuICAgICAgICAvLyB0aGlzIHByb21pc2UgaXMgcmVzb2x2ZWQgd2hlbiBhbGwgbGFiZWxzIHdlcmUgbG9hZGVkXG4gICAgICAgIHRoaXMucHJvbWlzZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5mZXRjaEZvckFubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgaWYgKCFhbm5vdGF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIGRvbid0IGZldGNoIHR3aWNlXG4gICAgICAgICAgICBpZiAoIWFubm90YXRpb24ubGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMgPSBBbm5vdGF0aW9uTGFiZWwucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9uX2lkOiBhbm5vdGF0aW9uLmlkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhbm5vdGF0aW9uLmxhYmVscztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmF0dGFjaFRvQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSBBbm5vdGF0aW9uTGFiZWwuYXR0YWNoKHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uX2lkOiBhbm5vdGF0aW9uLmlkLFxuICAgICAgICAgICAgICAgIGxhYmVsX2lkOiBzZWxlY3RlZExhYmVsLmlkLFxuICAgICAgICAgICAgICAgIGNvbmZpZGVuY2U6IGN1cnJlbnRDb25maWRlbmNlXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGFiZWwuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMucHVzaChsYWJlbCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGFiZWwuJHByb21pc2UuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuXG4gICAgICAgICAgICByZXR1cm4gbGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yZW1vdmVGcm9tQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uLCBsYWJlbCkge1xuICAgICAgICAgICAgLy8gdXNlIGluZGV4IHRvIHNlZSBpZiB0aGUgbGFiZWwgZXhpc3RzIGZvciB0aGUgYW5ub3RhdGlvblxuICAgICAgICAgICAgdmFyIGluZGV4ID0gYW5ub3RhdGlvbi5sYWJlbHMuaW5kZXhPZihsYWJlbCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsYWJlbC4kZGVsZXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBpbmRleCBzaW5jZSB0aGUgbGFiZWwgbGlzdCBtYXkgaGF2ZSBiZWVuIG1vZGlmaWVkXG4gICAgICAgICAgICAgICAgICAgIC8vIGluIHRoZSBtZWFudGltZVxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGFubm90YXRpb24ubGFiZWxzLmluZGV4T2YobGFiZWwpO1xuICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIH0sIG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldFRyZWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHt9O1xuICAgICAgICAgICAgdmFyIGtleSA9IG51bGw7XG4gICAgICAgICAgICB2YXIgYnVpbGQgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gbGFiZWwucGFyZW50X2lkO1xuICAgICAgICAgICAgICAgIGlmICh0cmVlW2tleV1bcGFyZW50XSkge1xuICAgICAgICAgICAgICAgICAgICB0cmVlW2tleV1bcGFyZW50XS5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cmVlW2tleV1bcGFyZW50XSA9IFtsYWJlbF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5wcm9taXNlLnRoZW4oZnVuY3Rpb24gKGxhYmVscykge1xuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGxhYmVscykge1xuICAgICAgICAgICAgICAgICAgICB0cmVlW2tleV0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxzW2tleV0uZm9yRWFjaChidWlsZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cmVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxhYmVscztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldFNlbGVjdGVkID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICBzZWxlY3RlZExhYmVsID0gbGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZExhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzU2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFzZWxlY3RlZExhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2V0Q3VycmVudENvbmZpZGVuY2UgPSBmdW5jdGlvbiAoY29uZmlkZW5jZSkge1xuICAgICAgICAgICAgY3VycmVudENvbmZpZGVuY2UgPSBjb25maWRlbmNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0Q3VycmVudENvbmZpZGVuY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudENvbmZpZGVuY2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gaW5pdFxuICAgICAgICAoZnVuY3Rpb24gKF90aGlzKSB7XG4gICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgX3RoaXMucHJvbWlzZSA9IGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICAvLyAtMSBiZWNhdXNlIG9mIGdsb2JhbCBsYWJlbHNcbiAgICAgICAgICAgIHZhciBmaW5pc2hlZCA9IC0xO1xuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBhbGwgbGFiZWxzIGFyZSB0aGVyZS4gaWYgeWVzLCByZXNvbHZlXG4gICAgICAgICAgICB2YXIgbWF5YmVSZXNvbHZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgrK2ZpbmlzaGVkID09PSBQUk9KRUNUX0lEUy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShsYWJlbHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGxhYmVsc1tudWxsXSA9IExhYmVsLnF1ZXJ5KG1heWJlUmVzb2x2ZSk7XG5cbiAgICAgICAgICAgIFBST0pFQ1RfSURTLmZvckVhY2goZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICAgICAgUHJvamVjdC5nZXQoe2lkOiBpZH0sIGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsc1twcm9qZWN0Lm5hbWVdID0gUHJvamVjdExhYmVsLnF1ZXJ5KHtwcm9qZWN0X2lkOiBpZH0sIG1heWJlUmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkodGhpcyk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbWFwQW5ub3RhdGlvbnNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGhhbmRsaW5nIHRoZSBhbm5vdGF0aW9ucyBsYXllciBvbiB0aGUgT3BlbkxheWVycyBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdtYXBBbm5vdGF0aW9ucycsIGZ1bmN0aW9uIChtYXAsIGltYWdlcywgYW5ub3RhdGlvbnMsIGRlYm91bmNlLCBzdHlsZXMsICRpbnRlcnZhbCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBhbm5vdGF0aW9uRmVhdHVyZXMgPSBuZXcgb2wuQ29sbGVjdGlvbigpO1xuICAgICAgICB2YXIgYW5ub3RhdGlvblNvdXJjZSA9IG5ldyBvbC5zb3VyY2UuVmVjdG9yKHtcbiAgICAgICAgICAgIGZlYXR1cmVzOiBhbm5vdGF0aW9uRmVhdHVyZXNcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBhbm5vdGF0aW9uTGF5ZXIgPSBuZXcgb2wubGF5ZXIuVmVjdG9yKHtcbiAgICAgICAgICAgIHNvdXJjZTogYW5ub3RhdGlvblNvdXJjZSxcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZXMuZmVhdHVyZXMsXG4gICAgICAgICAgICB6SW5kZXg6IDEwMFxuICAgICAgICB9KTtcblxuXHRcdC8vIHNlbGVjdCBpbnRlcmFjdGlvbiB3b3JraW5nIG9uIFwic2luZ2xlY2xpY2tcIlxuXHRcdHZhciBzZWxlY3QgPSBuZXcgb2wuaW50ZXJhY3Rpb24uU2VsZWN0KHtcblx0XHRcdHN0eWxlOiBzdHlsZXMuaGlnaGxpZ2h0LFxuICAgICAgICAgICAgbGF5ZXJzOiBbYW5ub3RhdGlvbkxheWVyXSxcbiAgICAgICAgICAgIC8vIGVuYWJsZSBzZWxlY3RpbmcgbXVsdGlwbGUgb3ZlcmxhcHBpbmcgZmVhdHVyZXMgYXQgb25jZVxuICAgICAgICAgICAgbXVsdGk6IHRydWVcblx0XHR9KTtcblxuXHRcdHZhciBzZWxlY3RlZEZlYXR1cmVzID0gc2VsZWN0LmdldEZlYXR1cmVzKCk7XG5cblx0XHR2YXIgbW9kaWZ5ID0gbmV3IG9sLmludGVyYWN0aW9uLk1vZGlmeSh7XG5cdFx0XHRmZWF0dXJlczogYW5ub3RhdGlvbkZlYXR1cmVzLFxuXHRcdFx0Ly8gdGhlIFNISUZUIGtleSBtdXN0IGJlIHByZXNzZWQgdG8gZGVsZXRlIHZlcnRpY2VzLCBzb1xuXHRcdFx0Ly8gdGhhdCBuZXcgdmVydGljZXMgY2FuIGJlIGRyYXduIGF0IHRoZSBzYW1lIHBvc2l0aW9uXG5cdFx0XHQvLyBvZiBleGlzdGluZyB2ZXJ0aWNlc1xuXHRcdFx0ZGVsZXRlQ29uZGl0aW9uOiBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRyZXR1cm4gb2wuZXZlbnRzLmNvbmRpdGlvbi5zaGlmdEtleU9ubHkoZXZlbnQpICYmIG9sLmV2ZW50cy5jb25kaXRpb24uc2luZ2xlQ2xpY2soZXZlbnQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gZHJhd2luZyBpbnRlcmFjdGlvblxuXHRcdHZhciBkcmF3O1xuXG4gICAgICAgIC8vIGluZGV4IG9mIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgYW5ub3RhdGlvbiAoZHVyaW5nIGN5Y2xpbmcgdGhyb3VnaCBhbm5vdGF0aW9ucylcbiAgICAgICAgLy8gaW4gdGhlIGFubm90YXRpb25GZWF0dXJlcyBjb2xsZWN0aW9uXG4gICAgICAgIHZhciBjdXJyZW50QW5ub3RhdGlvbiA9IDA7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB2YXIgc2VsZWN0QW5kU2hvd0Fubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIGlmIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRGZWF0dXJlcy5wdXNoKGFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIG1hcC5nZXRWaWV3KCkuZml0KGFubm90YXRpb24uZ2V0R2VvbWV0cnkoKSwgbWFwLmdldFNpemUoKSwge1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiBbNTAsIDUwLCA1MCwgNTBdXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cblx0XHQvLyBjb252ZXJ0IGEgcG9pbnQgYXJyYXkgdG8gYSBwb2ludCBvYmplY3Rcblx0XHQvLyByZS1pbnZlcnQgdGhlIHkgYXhpc1xuXHRcdHZhciBjb252ZXJ0RnJvbU9MUG9pbnQgPSBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdHJldHVybiB7eDogcG9pbnRbMF0sIHk6IGltYWdlcy5jdXJyZW50SW1hZ2UuaGVpZ2h0IC0gcG9pbnRbMV19O1xuXHRcdH07XG5cblx0XHQvLyBjb252ZXJ0IGEgcG9pbnQgb2JqZWN0IHRvIGEgcG9pbnQgYXJyYXlcblx0XHQvLyBpbnZlcnQgdGhlIHkgYXhpc1xuXHRcdHZhciBjb252ZXJ0VG9PTFBvaW50ID0gZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRyZXR1cm4gW3BvaW50LngsIGltYWdlcy5jdXJyZW50SW1hZ2UuaGVpZ2h0IC0gcG9pbnQueV07XG5cdFx0fTtcblxuXHRcdC8vIGFzc2VtYmxlcyB0aGUgY29vcmRpbmF0ZSBhcnJheXMgZGVwZW5kaW5nIG9uIHRoZSBnZW9tZXRyeSB0eXBlXG5cdFx0Ly8gc28gdGhleSBoYXZlIGEgdW5pZmllZCBmb3JtYXRcblx0XHR2YXIgZ2V0Q29vcmRpbmF0ZXMgPSBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcblx0XHRcdHN3aXRjaCAoZ2VvbWV0cnkuZ2V0VHlwZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ0NpcmNsZSc6XG5cdFx0XHRcdFx0Ly8gcmFkaXVzIGlzIHRoZSB4IHZhbHVlIG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGNpcmNsZVxuXHRcdFx0XHRcdHJldHVybiBbZ2VvbWV0cnkuZ2V0Q2VudGVyKCksIFtnZW9tZXRyeS5nZXRSYWRpdXMoKSwgMF1dO1xuXHRcdFx0XHRjYXNlICdQb2x5Z29uJzpcblx0XHRcdFx0Y2FzZSAnUmVjdGFuZ2xlJzpcblx0XHRcdFx0XHRyZXR1cm4gZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKVswXTtcblx0XHRcdFx0Y2FzZSAnUG9pbnQnOlxuXHRcdFx0XHRcdHJldHVybiBbZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKV07XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0cmV0dXJuIGdlb21ldHJ5LmdldENvb3JkaW5hdGVzKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIHNhdmVzIHRoZSB1cGRhdGVkIGdlb21ldHJ5IG9mIGFuIGFubm90YXRpb24gZmVhdHVyZVxuXHRcdHZhciBoYW5kbGVHZW9tZXRyeUNoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgZmVhdHVyZSA9IGUudGFyZ2V0O1xuXHRcdFx0dmFyIHNhdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHZhciBjb29yZGluYXRlcyA9IGdldENvb3JkaW5hdGVzKGZlYXR1cmUuZ2V0R2VvbWV0cnkoKSk7XG5cdFx0XHRcdGZlYXR1cmUuYW5ub3RhdGlvbi5wb2ludHMgPSBjb29yZGluYXRlcy5tYXAoY29udmVydEZyb21PTFBvaW50KTtcblx0XHRcdFx0ZmVhdHVyZS5hbm5vdGF0aW9uLiRzYXZlKCk7XG5cdFx0XHR9O1xuXHRcdFx0Ly8gdGhpcyBldmVudCBpcyByYXBpZGx5IGZpcmVkLCBzbyB3YWl0IHVudGlsIHRoZSBmaXJpbmcgc3RvcHNcblx0XHRcdC8vIGJlZm9yZSBzYXZpbmcgdGhlIGNoYW5nZXNcblx0XHRcdGRlYm91bmNlKHNhdmUsIDUwMCwgZmVhdHVyZS5hbm5vdGF0aW9uLmlkKTtcblx0XHR9O1xuXG5cdFx0dmFyIGNyZWF0ZUZlYXR1cmUgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0dmFyIGdlb21ldHJ5O1xuXHRcdFx0dmFyIHBvaW50cyA9IGFubm90YXRpb24ucG9pbnRzLm1hcChjb252ZXJ0VG9PTFBvaW50KTtcblxuXHRcdFx0c3dpdGNoIChhbm5vdGF0aW9uLnNoYXBlKSB7XG5cdFx0XHRcdGNhc2UgJ1BvaW50Jzpcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlBvaW50KHBvaW50c1swXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ1JlY3RhbmdsZSc6XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5SZWN0YW5nbGUoWyBwb2ludHMgXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ1BvbHlnb24nOlxuXHRcdFx0XHRcdC8vIGV4YW1wbGU6IGh0dHBzOi8vZ2l0aHViLmNvbS9vcGVubGF5ZXJzL29sMy9ibG9iL21hc3Rlci9leGFtcGxlcy9nZW9qc29uLmpzI0wxMjZcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlBvbHlnb24oWyBwb2ludHMgXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0xpbmVTdHJpbmcnOlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uTGluZVN0cmluZyhwb2ludHMpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdDaXJjbGUnOlxuXHRcdFx0XHRcdC8vIHJhZGl1cyBpcyB0aGUgeCB2YWx1ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjaXJjbGVcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLkNpcmNsZShwb2ludHNbMF0sIHBvaW50c1sxXVswXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gdW5zdXBwb3J0ZWQgc2hhcGVzIGFyZSBpZ25vcmVkXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVW5rbm93biBhbm5vdGF0aW9uIHNoYXBlOiAnICsgYW5ub3RhdGlvbi5zaGFwZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGZlYXR1cmUgPSBuZXcgb2wuRmVhdHVyZSh7IGdlb21ldHJ5OiBnZW9tZXRyeSB9KTtcblx0XHRcdGZlYXR1cmUub24oJ2NoYW5nZScsIGhhbmRsZUdlb21ldHJ5Q2hhbmdlKTtcblx0XHRcdGZlYXR1cmUuYW5ub3RhdGlvbiA9IGFubm90YXRpb247XG4gICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLmFkZEZlYXR1cmUoZmVhdHVyZSk7XG5cdFx0fTtcblxuXHRcdHZhciByZWZyZXNoQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoZSwgaW1hZ2UpIHtcblx0XHRcdC8vIGNsZWFyIGZlYXR1cmVzIG9mIHByZXZpb3VzIGltYWdlXG4gICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLmNsZWFyKCk7XG5cdFx0XHRfdGhpcy5jbGVhclNlbGVjdGlvbigpO1xuXG5cdFx0XHRhbm5vdGF0aW9ucy5xdWVyeSh7aWQ6IGltYWdlLl9pZH0pLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRhbm5vdGF0aW9ucy5mb3JFYWNoKGNyZWF0ZUZlYXR1cmUpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHZhciBoYW5kbGVOZXdGZWF0dXJlID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciBnZW9tZXRyeSA9IGUuZmVhdHVyZS5nZXRHZW9tZXRyeSgpO1xuXHRcdFx0dmFyIGNvb3JkaW5hdGVzID0gZ2V0Q29vcmRpbmF0ZXMoZ2VvbWV0cnkpO1xuXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbiA9IGFubm90YXRpb25zLmFkZCh7XG5cdFx0XHRcdGlkOiBpbWFnZXMuZ2V0Q3VycmVudElkKCksXG5cdFx0XHRcdHNoYXBlOiBnZW9tZXRyeS5nZXRUeXBlKCksXG5cdFx0XHRcdHBvaW50czogY29vcmRpbmF0ZXMubWFwKGNvbnZlcnRGcm9tT0xQb2ludClcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBpZiB0aGUgZmVhdHVyZSBjb3VsZG4ndCBiZSBzYXZlZCwgcmVtb3ZlIGl0IGFnYWluXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbi4kcHJvbWlzZS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5yZW1vdmVGZWF0dXJlKGUuZmVhdHVyZSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0ZS5mZWF0dXJlLm9uKCdjaGFuZ2UnLCBoYW5kbGVHZW9tZXRyeUNoYW5nZSk7XG5cbiAgICAgICAgICAgIHJldHVybiBlLmZlYXR1cmUuYW5ub3RhdGlvbi4kcHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBtYXAuYWRkTGF5ZXIoYW5ub3RhdGlvbkxheWVyKTtcblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihzZWxlY3QpO1xuXHRcdFx0c2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIHJlZnJlc2hBbm5vdGF0aW9ucyk7XG5cblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMub24oJ2NoYW5nZTpsZW5ndGgnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdC8vIGlmIG5vdCBhbHJlYWR5IGRpZ2VzdGluZywgZGlnZXN0XG5cdFx0XHRcdGlmICghc2NvcGUuJCRwaGFzZSkge1xuXHRcdFx0XHRcdC8vIHByb3BhZ2F0ZSBuZXcgc2VsZWN0aW9ucyB0aHJvdWdoIHRoZSBhbmd1bGFyIGFwcGxpY2F0aW9uXG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLnN0YXJ0RHJhd2luZyA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICAgICAgICBzZWxlY3Quc2V0QWN0aXZlKGZhbHNlKTtcblxuXHRcdFx0dHlwZSA9IHR5cGUgfHwgJ1BvaW50Jztcblx0XHRcdGRyYXcgPSBuZXcgb2wuaW50ZXJhY3Rpb24uRHJhdyh7XG4gICAgICAgICAgICAgICAgc291cmNlOiBhbm5vdGF0aW9uU291cmNlLFxuXHRcdFx0XHR0eXBlOiB0eXBlLFxuXHRcdFx0XHRzdHlsZTogc3R5bGVzLmVkaXRpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24obW9kaWZ5KTtcblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihkcmF3KTtcblx0XHRcdGRyYXcub24oJ2RyYXdlbmQnLCBoYW5kbGVOZXdGZWF0dXJlKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5maW5pc2hEcmF3aW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0bWFwLnJlbW92ZUludGVyYWN0aW9uKGRyYXcpO1xuXHRcdFx0bWFwLnJlbW92ZUludGVyYWN0aW9uKG1vZGlmeSk7XG4gICAgICAgICAgICBzZWxlY3Quc2V0QWN0aXZlKHRydWUpO1xuXHRcdFx0Ly8gZG9uJ3Qgc2VsZWN0IHRoZSBsYXN0IGRyYXduIHBvaW50XG5cdFx0XHRfdGhpcy5jbGVhclNlbGVjdGlvbigpO1xuXHRcdH07XG5cblx0XHR0aGlzLmRlbGV0ZVNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5mb3JFYWNoKGZ1bmN0aW9uIChmZWF0dXJlKSB7XG5cdFx0XHRcdGFubm90YXRpb25zLmRlbGV0ZShmZWF0dXJlLmFubm90YXRpb24pLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGFubm90YXRpb25Tb3VyY2UucmVtb3ZlRmVhdHVyZShmZWF0dXJlKTtcblx0XHRcdFx0XHRzZWxlY3RlZEZlYXR1cmVzLnJlbW92ZShmZWF0dXJlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5zZWxlY3QgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBmZWF0dXJlO1xuXHRcdFx0YW5ub3RhdGlvblNvdXJjZS5mb3JFYWNoRmVhdHVyZShmdW5jdGlvbiAoZikge1xuXHRcdFx0XHRpZiAoZi5hbm5vdGF0aW9uLmlkID09PSBpZCkge1xuXHRcdFx0XHRcdGZlYXR1cmUgPSBmO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIHJlbW92ZSBzZWxlY3Rpb24gaWYgZmVhdHVyZSB3YXMgYWxyZWFkeSBzZWxlY3RlZC4gb3RoZXJ3aXNlIHNlbGVjdC5cblx0XHRcdGlmICghc2VsZWN0ZWRGZWF0dXJlcy5yZW1vdmUoZmVhdHVyZSkpIHtcblx0XHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5wdXNoKGZlYXR1cmUpO1xuXHRcdFx0fVxuXHRcdH07XG5cbiAgICAgICAgLy8gZml0cyB0aGUgdmlldyB0byB0aGUgZ2l2ZW4gZmVhdHVyZVxuICAgICAgICB0aGlzLmZpdCA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5mb3JFYWNoRmVhdHVyZShmdW5jdGlvbiAoZikge1xuICAgICAgICAgICAgICAgIGlmIChmLmFubm90YXRpb24uaWQgPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFuaW1hdGUgZml0XG4gICAgICAgICAgICAgICAgICAgIHZhciB2aWV3ID0gbWFwLmdldFZpZXcoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhbiA9IG9sLmFuaW1hdGlvbi5wYW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiB2aWV3LmdldENlbnRlcigpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgem9vbSA9IG9sLmFuaW1hdGlvbi56b29tKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdXRpb246IHZpZXcuZ2V0UmVzb2x1dGlvbigpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBtYXAuYmVmb3JlUmVuZGVyKHBhbiwgem9vbSk7XG4gICAgICAgICAgICAgICAgICAgIHZpZXcuZml0KGYuZ2V0R2VvbWV0cnkoKSwgbWFwLmdldFNpemUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cblx0XHR0aGlzLmNsZWFyU2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5jbGVhcigpO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldFNlbGVjdGVkRmVhdHVyZXMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gc2VsZWN0ZWRGZWF0dXJlcztcblx0XHR9O1xuXG4gICAgICAgIC8vIG1hbnVhbGx5IGFkZCBhIG5ldyBmZWF0dXJlIChub3QgdGhyb3VnaCB0aGUgZHJhdyBpbnRlcmFjdGlvbilcbiAgICAgICAgdGhpcy5hZGRGZWF0dXJlID0gZnVuY3Rpb24gKGZlYXR1cmUpIHtcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuYWRkRmVhdHVyZShmZWF0dXJlKTtcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVOZXdGZWF0dXJlKHtmZWF0dXJlOiBmZWF0dXJlfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRPcGFjaXR5ID0gZnVuY3Rpb24gKG9wYWNpdHkpIHtcbiAgICAgICAgICAgIGFubm90YXRpb25MYXllci5zZXRPcGFjaXR5KG9wYWNpdHkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuY3ljbGVOZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY3VycmVudEFubm90YXRpb24gPSAoY3VycmVudEFubm90YXRpb24gKyAxKSAlIGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKTtcbiAgICAgICAgICAgIF90aGlzLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc05leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKGN1cnJlbnRBbm5vdGF0aW9uICsgMSkgPCBhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5jeWNsZVByZXZpb3VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gd2Ugd2FudCBubyBuZWdhdGl2ZSBpbmRleCBoZXJlXG4gICAgICAgICAgICBjdXJyZW50QW5ub3RhdGlvbiA9IChjdXJyZW50QW5ub3RhdGlvbiArIGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKSAtIDEpICUgYW5ub3RhdGlvbkZlYXR1cmVzLmdldExlbmd0aCgpO1xuICAgICAgICAgICAgX3RoaXMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzUHJldmlvdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudEFubm90YXRpb24gPiAwO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuanVtcFRvQ3VycmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIG9ubHkganVtcCBvbmNlIHRoZSBhbm5vdGF0aW9ucyB3ZXJlIGxvYWRlZFxuICAgICAgICAgICAgYW5ub3RhdGlvbnMuZ2V0UHJvbWlzZSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGVjdEFuZFNob3dBbm5vdGF0aW9uKGFubm90YXRpb25GZWF0dXJlcy5pdGVtKGN1cnJlbnRBbm5vdGF0aW9uKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmp1bXBUb0ZpcnN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY3VycmVudEFubm90YXRpb24gPSAwO1xuICAgICAgICAgICAgX3RoaXMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuanVtcFRvTGFzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFubm90YXRpb25zLmdldFByb21pc2UoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyB3YWl0IGZvciB0aGUgbmV3IGFubm90YXRpb25zIHRvIGJlIGxvYWRlZFxuICAgICAgICAgICAgICAgIGlmIChhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCkgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEFubm90YXRpb24gPSBhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCkgLSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfdGhpcy5qdW1wVG9DdXJyZW50KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmbGlja2VyIHRoZSBoaWdobGlnaHRlZCBhbm5vdGF0aW9uIHRvIHNpZ25hbCBhbiBlcnJvclxuICAgICAgICB0aGlzLmZsaWNrZXIgPSBmdW5jdGlvbiAoY291bnQpIHtcbiAgICAgICAgICAgIHZhciBhbm5vdGF0aW9uID0gc2VsZWN0ZWRGZWF0dXJlcy5pdGVtKDApO1xuICAgICAgICAgICAgaWYgKCFhbm5vdGF0aW9uKSByZXR1cm47XG4gICAgICAgICAgICBjb3VudCA9IGNvdW50IHx8IDM7XG5cbiAgICAgICAgICAgIHZhciB0b2dnbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkRmVhdHVyZXMuZ2V0TGVuZ3RoKCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkRmVhdHVyZXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZEZlYXR1cmVzLnB1c2goYW5ub3RhdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIG51bWJlciBvZiByZXBlYXRzIG11c3QgYmUgZXZlbiwgb3RoZXJ3aXNlIHRoZSBsYXllciB3b3VsZCBzdGF5IG9udmlzaWJsZVxuICAgICAgICAgICAgJGludGVydmFsKHRvZ2dsZSwgMTAwLCBjb3VudCAqIDIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0Q3VycmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhbm5vdGF0aW9uRmVhdHVyZXMuaXRlbShjdXJyZW50QW5ub3RhdGlvbikuYW5ub3RhdGlvbjtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbWFwSW1hZ2VcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGhhbmRsaW5nIHRoZSBpbWFnZSBsYXllciBvbiB0aGUgT3BlbkxheWVycyBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdtYXBJbWFnZScsIGZ1bmN0aW9uIChtYXApIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblx0XHR2YXIgZXh0ZW50ID0gWzAsIDAsIDAsIDBdO1xuXG5cdFx0dmFyIHByb2plY3Rpb24gPSBuZXcgb2wucHJvai5Qcm9qZWN0aW9uKHtcblx0XHRcdGNvZGU6ICdkaWFzLWltYWdlJyxcblx0XHRcdHVuaXRzOiAncGl4ZWxzJyxcblx0XHRcdGV4dGVudDogZXh0ZW50XG5cdFx0fSk7XG5cblx0XHR2YXIgaW1hZ2VMYXllciA9IG5ldyBvbC5sYXllci5JbWFnZSgpO1xuXG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKHNjb3BlKSB7XG5cdFx0XHRtYXAuYWRkTGF5ZXIoaW1hZ2VMYXllcik7XG5cblx0XHRcdC8vIHJlZnJlc2ggdGhlIGltYWdlIHNvdXJjZVxuXHRcdFx0c2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIGZ1bmN0aW9uIChlLCBpbWFnZSkge1xuXHRcdFx0XHRleHRlbnRbMl0gPSBpbWFnZS53aWR0aDtcblx0XHRcdFx0ZXh0ZW50WzNdID0gaW1hZ2UuaGVpZ2h0O1xuXG5cdFx0XHRcdHZhciB6b29tID0gc2NvcGUudmlld3BvcnQuem9vbTtcblxuXHRcdFx0XHR2YXIgY2VudGVyID0gc2NvcGUudmlld3BvcnQuY2VudGVyO1xuXHRcdFx0XHQvLyB2aWV3cG9ydCBjZW50ZXIgaXMgc3RpbGwgdW5pbml0aWFsaXplZFxuXHRcdFx0XHRpZiAoY2VudGVyWzBdID09PSB1bmRlZmluZWQgJiYgY2VudGVyWzFdID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRjZW50ZXIgPSBvbC5leHRlbnQuZ2V0Q2VudGVyKGV4dGVudCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgaW1hZ2VTdGF0aWMgPSBuZXcgb2wuc291cmNlLkltYWdlU3RhdGljKHtcblx0XHRcdFx0XHR1cmw6IGltYWdlLnNyYyxcblx0XHRcdFx0XHRwcm9qZWN0aW9uOiBwcm9qZWN0aW9uLFxuXHRcdFx0XHRcdGltYWdlRXh0ZW50OiBleHRlbnRcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aW1hZ2VMYXllci5zZXRTb3VyY2UoaW1hZ2VTdGF0aWMpO1xuXG5cdFx0XHRcdG1hcC5zZXRWaWV3KG5ldyBvbC5WaWV3KHtcblx0XHRcdFx0XHRwcm9qZWN0aW9uOiBwcm9qZWN0aW9uLFxuXHRcdFx0XHRcdGNlbnRlcjogY2VudGVyLFxuXHRcdFx0XHRcdHpvb206IHpvb20sXG5cdFx0XHRcdFx0em9vbUZhY3RvcjogMS41LFxuXHRcdFx0XHRcdC8vIGFsbG93IGEgbWF4aW11bSBvZiA0eCBtYWduaWZpY2F0aW9uXG5cdFx0XHRcdFx0bWluUmVzb2x1dGlvbjogMC4yNSxcblx0XHRcdFx0XHQvLyByZXN0cmljdCBtb3ZlbWVudFxuXHRcdFx0XHRcdGV4dGVudDogZXh0ZW50XG5cdFx0XHRcdH0pKTtcblxuXHRcdFx0XHQvLyBpZiB6b29tIGlzIG5vdCBpbml0aWFsaXplZCwgZml0IHRoZSB2aWV3IHRvIHRoZSBpbWFnZSBleHRlbnRcblx0XHRcdFx0aWYgKHpvb20gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdG1hcC5nZXRWaWV3KCkuZml0KGV4dGVudCwgbWFwLmdldFNpemUoKSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldEV4dGVudCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBleHRlbnQ7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0UHJvamVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBwcm9qZWN0aW9uO1xuXHRcdH07XG5cbiAgICAgICAgdGhpcy5nZXRMYXllciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZUxheWVyO1xuICAgICAgICB9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBzdHlsZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGZvciB0aGUgT3BlbkxheWVycyBzdHlsZXNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdzdHlsZXMnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdGhpcy5jb2xvcnMgPSB7XG4gICAgICAgICAgICB3aGl0ZTogWzI1NSwgMjU1LCAyNTUsIDFdLFxuICAgICAgICAgICAgYmx1ZTogWzAsIDE1MywgMjU1LCAxXSxcbiAgICAgICAgICAgIG9yYW5nZTogJyNmZjVlMDAnXG4gICAgICAgIH07XG5cblx0XHR2YXIgd2lkdGggPSAzO1xuXG5cdFx0dGhpcy5mZWF0dXJlcyA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0Y29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuXHRcdFx0XHRcdHdpZHRoOiA1XG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG5cdFx0XHRcdFx0cmFkaXVzOiA2LFxuXHRcdFx0XHRcdGZpbGw6IG5ldyBvbC5zdHlsZS5GaWxsKHtcblx0XHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcblx0XHRcdFx0XHRcdHdpZHRoOiAyXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSlcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRjb2xvcjogdGhpcy5jb2xvcnMuYmx1ZSxcblx0XHRcdFx0XHR3aWR0aDogM1xuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHRdO1xuXG5cdFx0dGhpcy5oaWdobGlnaHQgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcblx0XHRcdFx0XHR3aWR0aDogNlxuXHRcdFx0XHR9KSxcblx0XHRcdFx0aW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0XHRcdHJhZGl1czogNixcblx0XHRcdFx0XHRmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XG5cdFx0XHRcdFx0XHRjb2xvcjogdGhpcy5jb2xvcnMub3JhbmdlXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcblx0XHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSlcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHRcdFx0XHRjb2xvcjogdGhpcy5jb2xvcnMub3JhbmdlLFxuXHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdF07XG5cblx0XHR0aGlzLmVkaXRpbmcgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcblx0XHRcdFx0XHR3aWR0aDogNVxuXHRcdFx0XHR9KSxcblx0XHRcdFx0aW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0XHRcdHJhZGl1czogNixcblx0XHRcdFx0XHRmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XG5cdFx0XHRcdFx0XHRjb2xvcjogdGhpcy5jb2xvcnMuYmx1ZVxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0XHRcdFx0XHRjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG5cdFx0XHRcdFx0XHR3aWR0aDogMixcblx0XHRcdFx0XHRcdGxpbmVEYXNoOiBbM11cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlLFxuXHRcdFx0XHRcdHdpZHRoOiAzLFxuXHRcdFx0XHRcdGxpbmVEYXNoOiBbNV1cblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0XTtcblxuXHRcdHRoaXMudmlld3BvcnQgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlLFxuXHRcdFx0XHRcdHdpZHRoOiAzXG5cdFx0XHRcdH0pLFxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuXHRcdFx0XHRcdGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcblx0XHRcdFx0XHR3aWR0aDogMVxuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHRdO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSB1cmxQYXJhbXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gVGhlIEdFVCBwYXJhbWV0ZXJzIG9mIHRoZSB1cmwuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgndXJsUGFyYW1zJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHN0YXRlID0ge307XG5cblx0XHQvLyB0cmFuc2Zvcm1zIGEgVVJMIHBhcmFtZXRlciBzdHJpbmcgbGlrZSAjYT0xJmI9MiB0byBhbiBvYmplY3Rcblx0XHR2YXIgZGVjb2RlU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gbG9jYXRpb24uaGFzaC5yZXBsYWNlKCcjJywgJycpXG5cdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnJicpO1xuXG5cdFx0XHR2YXIgc3RhdGUgPSB7fTtcblxuXHRcdFx0cGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKHBhcmFtKSB7XG5cdFx0XHRcdC8vIGNhcHR1cmUga2V5LXZhbHVlIHBhaXJzXG5cdFx0XHRcdHZhciBjYXB0dXJlID0gcGFyYW0ubWF0Y2goLyguKylcXD0oLispLyk7XG5cdFx0XHRcdGlmIChjYXB0dXJlICYmIGNhcHR1cmUubGVuZ3RoID09PSAzKSB7XG5cdFx0XHRcdFx0c3RhdGVbY2FwdHVyZVsxXV0gPSBkZWNvZGVVUklDb21wb25lbnQoY2FwdHVyZVsyXSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gc3RhdGU7XG5cdFx0fTtcblxuXHRcdC8vIHRyYW5zZm9ybXMgYW4gb2JqZWN0IHRvIGEgVVJMIHBhcmFtZXRlciBzdHJpbmdcblx0XHR2YXIgZW5jb2RlU3RhdGUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcblx0XHRcdHZhciBwYXJhbXMgPSAnJztcblx0XHRcdGZvciAodmFyIGtleSBpbiBzdGF0ZSkge1xuXHRcdFx0XHRwYXJhbXMgKz0ga2V5ICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0YXRlW2tleV0pICsgJyYnO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHBhcmFtcy5zdWJzdHJpbmcoMCwgcGFyYW1zLmxlbmd0aCAtIDEpO1xuXHRcdH07XG5cblx0XHR0aGlzLnB1c2hTdGF0ZSA9IGZ1bmN0aW9uIChzKSB7XG5cdFx0XHRzdGF0ZS5zbHVnID0gcztcblx0XHRcdGhpc3RvcnkucHVzaFN0YXRlKHN0YXRlLCAnJywgc3RhdGUuc2x1ZyArICcjJyArIGVuY29kZVN0YXRlKHN0YXRlKSk7XG5cdFx0fTtcblxuXHRcdC8vIHNldHMgYSBVUkwgcGFyYW1ldGVyIGFuZCB1cGRhdGVzIHRoZSBoaXN0b3J5IHN0YXRlXG5cdFx0dGhpcy5zZXQgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gcGFyYW1zKSB7XG5cdFx0XHRcdHN0YXRlW2tleV0gPSBwYXJhbXNba2V5XTtcblx0XHRcdH1cblx0XHRcdGhpc3RvcnkucmVwbGFjZVN0YXRlKHN0YXRlLCAnJywgc3RhdGUuc2x1ZyArICcjJyArIGVuY29kZVN0YXRlKHN0YXRlKSk7XG5cdFx0fTtcblxuXHRcdC8vIHJldHVybnMgYSBVUkwgcGFyYW1ldGVyXG5cdFx0dGhpcy5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRyZXR1cm4gc3RhdGVba2V5XTtcblx0XHR9O1xuXG5cdFx0c3RhdGUgPSBoaXN0b3J5LnN0YXRlO1xuXG5cdFx0aWYgKCFzdGF0ZSkge1xuXHRcdFx0c3RhdGUgPSBkZWNvZGVTdGF0ZSgpO1xuXHRcdH1cblx0fVxuKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=