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
 * @name DrawingControlsController
 * @memberOf dias.annotations
 * @description Controller for the controls bar drawing butons
 */
angular.module('dias.annotations').controller('DrawingControlsController', ["$scope", "mapAnnotations", "labels", "msg", "$attrs", "keyboard", function ($scope, mapAnnotations, labels, msg, $attrs, keyboard) {
		"use strict";

		$scope.selectShape = function (name) {
			if (!labels.hasSelected()) {
                $scope.$emit('sidebar.foldout.do-open', 'categories');
				msg.info($attrs.selectCategory);
				return;
			}

            if (name !== null && $scope.selectedShape() !== name) {
				mapAnnotations.startDrawing(name);
			} else {
                mapAnnotations.finishDrawing();
            }
		};

        $scope.selectedShape = mapAnnotations.getSelectedDrawingType;

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
 * @name EditControlsController
 * @memberOf dias.annotations
 * @description Controller for the controls bar edit buttons
 */
angular.module('dias.annotations').controller('EditControlsController', ["$scope", "mapAnnotations", "keyboard", function ($scope, mapAnnotations, keyboard) {
		"use strict";

        $scope.deleteSelectedAnnotations = function () {
            if (mapAnnotations.getSelectedFeatures().getLength() > 0 && confirm('Are you sure you want to delete all selected annotations?')) {
                mapAnnotations.deleteSelected();
            }
        };

        var startMoving = function () {
            mapAnnotations.startMoving();
        };

        var finishMoving = function () {
            mapAnnotations.finishMoving();
        };

        $scope.moveSelectedAnnotations = function () {
            if ($scope.isMoving()) {
                finishMoving();
            } else {
                startMoving();
            }
        };

        $scope.isMoving = mapAnnotations.isMoving;

        keyboard.on(46, function (e) {
            $scope.deleteSelectedAnnotations();
            $scope.$apply();
        });

        keyboard.on(27, function () {
            if ($scope.isMoving()) {
                $scope.$apply(finishMoving);
            }
        });

        keyboard.on('m', function () {
            $scope.$apply($scope.moveSelectedAnnotations);
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

        $scope.hasSelectedLabel = labels.hasSelected;
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

        modify.setActive(false);

        var translate = new ol.interaction.Translate({
            features: selectedFeatures
        });

        translate.setActive(false);

		// drawing interaction
		var draw;
        // type/shape of the drawing interaction
        var drawingType;

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
            map.addInteraction(translate);
            map.addInteraction(modify);
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
            modify.setActive(true);
            _this.finishMoving();
            // allow only one draw interaction at a time
            map.removeInteraction(draw);

			drawingType = type || 'Point';
			draw = new ol.interaction.Draw({
                source: annotationSource,
				type: drawingType,
				style: styles.editing
			});

			map.addInteraction(draw);
			draw.on('drawend', handleNewFeature);
		};

		this.finishDrawing = function () {
			map.removeInteraction(draw);
            draw.setActive(false);
            drawingType = undefined;
            select.setActive(true);
            modify.setActive(false);
			// don't select the last drawn point
			_this.clearSelection();
		};

        this.isDrawing = function () {
            return draw && draw.getActive();
        };

        this.startMoving = function () {
            if (_this.isDrawing()) {
                _this.finishDrawing();
            }
            translate.setActive(true);
        };

        this.finishMoving = function () {
            translate.setActive(false);
        };

        this.isMoving = function () {
            return translate.getActive();
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

        this.getSelectedDrawingType = function () {
            return drawingType;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0N5Y2xpbmdDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQW5ub3RhdG9yQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NhbnZhc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9DYXRlZ29yaWVzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NvbmZpZGVuY2VDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvRHJhd2luZ0NvbnRyb2xzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0VkaXRDb250cm9sc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9NaW5pbWFwQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NlbGVjdGVkTGFiZWxDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2V0dGluZ3NBbm5vdGF0aW9uT3BhY2l0eUNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TZXR0aW5nc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TaWRlYmFyQ2F0ZWdvcnlGb2xkb3V0Q29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NpZGViYXJDb250cm9sbGVyLmpzIiwiZGlyZWN0aXZlcy9hbm5vdGF0aW9uTGlzdEl0ZW0uanMiLCJkaXJlY3RpdmVzL2xhYmVsQ2F0ZWdvcnlJdGVtLmpzIiwiZGlyZWN0aXZlcy9sYWJlbEl0ZW0uanMiLCJmYWN0b3JpZXMvZGVib3VuY2UuanMiLCJmYWN0b3JpZXMvbWFwLmpzIiwic2VydmljZXMvYW5ub3RhdGlvbnMuanMiLCJzZXJ2aWNlcy9pbWFnZXMuanMiLCJzZXJ2aWNlcy9rZXlib2FyZC5qcyIsInNlcnZpY2VzL2xhYmVscy5qcyIsInNlcnZpY2VzL21hcEFubm90YXRpb25zLmpzIiwic2VydmljZXMvbWFwSW1hZ2UuanMiLCJzZXJ2aWNlcy9zdHlsZXMuanMiLCJzZXJ2aWNlcy91cmxQYXJhbXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJQSxRQUFBLE9BQUEsb0JBQUEsQ0FBQSxZQUFBOzs7Ozs7Ozs7QUNHQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSx5RkFBQSxVQUFBLFFBQUEsZ0JBQUEsUUFBQSxhQUFBLFFBQUE7RUFDQTs7RUFFQSxPQUFBLG1CQUFBLGVBQUEsc0JBQUE7O0VBRUEsSUFBQSxxQkFBQSxZQUFBO0dBQ0EsT0FBQSxjQUFBLFlBQUE7OztFQUdBLElBQUEsbUJBQUEsZUFBQTs7RUFFQSxPQUFBLGNBQUE7O0VBRUEsT0FBQSxpQkFBQSxlQUFBOztFQUVBLE9BQUEsbUJBQUEsVUFBQSxHQUFBLElBQUE7O0dBRUEsSUFBQSxDQUFBLEVBQUEsVUFBQTtJQUNBLE9BQUE7O0dBRUEsZUFBQSxPQUFBOzs7UUFHQSxPQUFBLGdCQUFBLGVBQUE7O0VBRUEsT0FBQSxhQUFBLFVBQUEsSUFBQTtHQUNBLElBQUEsV0FBQTtHQUNBLGlCQUFBLFFBQUEsVUFBQSxTQUFBO0lBQ0EsSUFBQSxRQUFBLGNBQUEsUUFBQSxXQUFBLE1BQUEsSUFBQTtLQUNBLFdBQUE7OztHQUdBLE9BQUE7OztFQUdBLE9BQUEsSUFBQSxlQUFBOzs7Ozs7Ozs7OztBQ25DQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSxtRkFBQSxVQUFBLFFBQUEsZ0JBQUEsUUFBQSxVQUFBO1FBQ0E7OztRQUdBLElBQUEsVUFBQTs7UUFFQSxJQUFBLGFBQUE7O1FBRUEsSUFBQSxpQkFBQSxVQUFBLEdBQUE7WUFDQSxJQUFBLFdBQUEsQ0FBQSxPQUFBLFdBQUE7O1lBRUEsSUFBQSxlQUFBLFdBQUE7Z0JBQ0EsZUFBQTttQkFDQTs7Z0JBRUEsT0FBQSxZQUFBLEtBQUEsZUFBQTtnQkFDQSxVQUFBOzs7WUFHQSxJQUFBLEdBQUE7O2dCQUVBLE9BQUE7Ozs7WUFJQSxPQUFBOzs7UUFHQSxJQUFBLGlCQUFBLFVBQUEsR0FBQTtZQUNBLElBQUEsV0FBQSxDQUFBLE9BQUEsV0FBQTs7WUFFQSxJQUFBLGVBQUEsZUFBQTtnQkFDQSxlQUFBO21CQUNBOztnQkFFQSxPQUFBLFlBQUEsS0FBQSxlQUFBO2dCQUNBLFVBQUE7OztZQUdBLElBQUEsR0FBQTs7Z0JBRUEsT0FBQTs7OztZQUlBLE9BQUE7OztRQUdBLElBQUEsY0FBQSxVQUFBLEdBQUE7WUFDQSxJQUFBLFNBQUE7WUFDQSxJQUFBLEdBQUE7Z0JBQ0EsRUFBQTs7O1lBR0EsSUFBQSxPQUFBLGFBQUEsT0FBQSxlQUFBO2dCQUNBLE9BQUEsbUJBQUEsZUFBQSxjQUFBLFNBQUEsS0FBQSxZQUFBO29CQUNBLGVBQUEsUUFBQTs7bUJBRUE7Z0JBQ0EsZUFBQTs7Ozs7UUFLQSxJQUFBLGNBQUEsVUFBQSxHQUFBO1lBQ0EsRUFBQTtZQUNBLE9BQUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxVQUFBLFlBQUE7WUFDQSxPQUFBLE9BQUEsb0JBQUEsYUFBQTs7O1FBR0EsT0FBQSxlQUFBLFlBQUE7WUFDQSxPQUFBLG9CQUFBLFNBQUE7OztRQUdBLE9BQUEsY0FBQSxZQUFBO1lBQ0EsT0FBQSxvQkFBQSxTQUFBOzs7OztRQUtBLE9BQUEsT0FBQSwwQkFBQSxVQUFBLE9BQUEsVUFBQTtZQUNBLElBQUEsVUFBQSxZQUFBOztnQkFFQSxTQUFBLEdBQUEsSUFBQSxnQkFBQTs7Z0JBRUEsU0FBQSxHQUFBLElBQUEsZ0JBQUE7Z0JBQ0EsU0FBQSxHQUFBLElBQUEsZ0JBQUE7O2dCQUVBLFNBQUEsR0FBQSxJQUFBLGFBQUE7Z0JBQ0EsU0FBQSxHQUFBLElBQUEsYUFBQTtnQkFDQSxlQUFBO21CQUNBLElBQUEsYUFBQSxZQUFBO2dCQUNBLFNBQUEsSUFBQSxJQUFBO2dCQUNBLFNBQUEsSUFBQSxJQUFBO2dCQUNBLFNBQUEsSUFBQSxJQUFBO2dCQUNBLFNBQUEsSUFBQSxJQUFBO2dCQUNBLFNBQUEsSUFBQSxJQUFBO2dCQUNBLGVBQUE7Ozs7UUFJQSxPQUFBLElBQUEsZUFBQSxZQUFBO1lBQ0EsVUFBQTs7O1FBR0EsT0FBQSxpQkFBQTtRQUNBLE9BQUEsaUJBQUE7UUFDQSxPQUFBLGNBQUE7Ozs7Ozs7Ozs7O0FDaEhBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLHdGQUFBLFVBQUEsUUFBQSxRQUFBLFdBQUEsS0FBQSxVQUFBLFVBQUE7UUFDQTs7UUFFQSxPQUFBLFNBQUE7UUFDQSxPQUFBLGVBQUE7OztRQUdBLE9BQUEsV0FBQTtZQUNBLE1BQUEsVUFBQSxJQUFBO1lBQ0EsUUFBQSxDQUFBLFVBQUEsSUFBQSxNQUFBLFVBQUEsSUFBQTs7OztRQUlBLElBQUEsZ0JBQUEsWUFBQTtZQUNBLE9BQUEsZUFBQTtZQUNBLE9BQUEsV0FBQSxlQUFBLE9BQUEsT0FBQTs7OztRQUlBLElBQUEsWUFBQSxZQUFBO1lBQ0EsVUFBQSxVQUFBLE9BQUEsT0FBQSxhQUFBOzs7O1FBSUEsSUFBQSxlQUFBLFlBQUE7WUFDQSxPQUFBLGVBQUE7Ozs7UUFJQSxJQUFBLFlBQUEsVUFBQSxJQUFBO1lBQ0E7WUFDQSxPQUFBLE9BQUEsS0FBQSxTQUFBOzBCQUNBLEtBQUE7MEJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxZQUFBLFlBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQTttQkFDQSxLQUFBO21CQUNBLEtBQUE7bUJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxZQUFBLFlBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQTttQkFDQSxLQUFBO21CQUNBLEtBQUE7bUJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxJQUFBLGtCQUFBLFNBQUEsR0FBQSxRQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsT0FBQTtZQUNBLE9BQUEsU0FBQSxPQUFBLEtBQUEsS0FBQSxNQUFBLE9BQUEsT0FBQTtZQUNBLE9BQUEsU0FBQSxPQUFBLEtBQUEsS0FBQSxNQUFBLE9BQUEsT0FBQTtZQUNBLFVBQUEsSUFBQTtnQkFDQSxHQUFBLE9BQUEsU0FBQTtnQkFDQSxHQUFBLE9BQUEsU0FBQSxPQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBLE9BQUE7Ozs7UUFJQSxTQUFBLEdBQUEsSUFBQSxZQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxJQUFBLFlBQUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLElBQUEsWUFBQTtZQUNBLE9BQUE7WUFDQSxPQUFBOzs7O1FBSUEsT0FBQSxhQUFBLFNBQUEsR0FBQTtZQUNBLElBQUEsUUFBQSxFQUFBO1lBQ0EsSUFBQSxTQUFBLE1BQUEsU0FBQSxXQUFBO2dCQUNBLFVBQUEsTUFBQTs7Ozs7UUFLQSxPQUFBOztRQUVBLFVBQUEsVUFBQSxLQUFBOzs7Ozs7Ozs7OztBQzVGQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSw0RkFBQSxVQUFBLFFBQUEsVUFBQSxnQkFBQSxLQUFBLFVBQUEsVUFBQTtFQUNBOztRQUVBLElBQUEsVUFBQSxJQUFBOzs7RUFHQSxJQUFBLEdBQUEsV0FBQSxTQUFBLEdBQUE7WUFDQSxJQUFBLE9BQUEsWUFBQTtnQkFDQSxPQUFBLE1BQUEsa0JBQUE7b0JBQ0EsUUFBQSxRQUFBO29CQUNBLE1BQUEsUUFBQTs7Ozs7WUFLQSxTQUFBLE1BQUEsS0FBQTs7O1FBR0EsSUFBQSxHQUFBLGVBQUEsWUFBQTtZQUNBLFVBQUEsSUFBQTs7O0VBR0EsU0FBQSxLQUFBO0VBQ0EsZUFBQSxLQUFBOztFQUVBLElBQUEsYUFBQSxZQUFBOzs7R0FHQSxTQUFBLFdBQUE7O0lBRUEsSUFBQTtNQUNBLElBQUE7OztFQUdBLE9BQUEsSUFBQSx3QkFBQTtFQUNBLE9BQUEsSUFBQSx5QkFBQTs7Ozs7Ozs7Ozs7QUNuQ0EsUUFBQSxPQUFBLG9CQUFBLFdBQUEseURBQUEsVUFBQSxRQUFBLFFBQUEsVUFBQTtRQUNBOzs7UUFHQSxJQUFBLGdCQUFBO1FBQ0EsSUFBQSx1QkFBQTs7O1FBR0EsSUFBQSxrQkFBQSxZQUFBO1lBQ0EsSUFBQSxNQUFBLE9BQUEsV0FBQSxJQUFBLFVBQUEsTUFBQTtnQkFDQSxPQUFBLEtBQUE7O1lBRUEsT0FBQSxhQUFBLHdCQUFBLEtBQUEsVUFBQTs7OztRQUlBLElBQUEsaUJBQUEsWUFBQTtZQUNBLElBQUEsT0FBQSxhQUFBLHVCQUFBO2dCQUNBLElBQUEsTUFBQSxLQUFBLE1BQUEsT0FBQSxhQUFBO2dCQUNBLE9BQUEsYUFBQSxPQUFBLFdBQUEsT0FBQSxVQUFBLE1BQUE7O29CQUVBLE9BQUEsSUFBQSxRQUFBLEtBQUEsUUFBQSxDQUFBOzs7OztRQUtBLElBQUEsa0JBQUEsVUFBQSxPQUFBO1lBQ0EsSUFBQSxTQUFBLEtBQUEsUUFBQSxPQUFBLFdBQUEsUUFBQTtnQkFDQSxPQUFBLFdBQUEsT0FBQSxXQUFBOzs7O1FBSUEsT0FBQSxhQUFBLENBQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBO1FBQ0EsT0FBQSxhQUFBO1FBQ0EsT0FBQSxhQUFBO1FBQ0EsT0FBQSxRQUFBLEtBQUEsVUFBQSxLQUFBO1lBQ0EsS0FBQSxJQUFBLE9BQUEsS0FBQTtnQkFDQSxPQUFBLGFBQUEsT0FBQSxXQUFBLE9BQUEsSUFBQTs7WUFFQTs7O1FBR0EsT0FBQSxpQkFBQSxPQUFBOztRQUVBLE9BQUEsYUFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBLGlCQUFBO1lBQ0EsT0FBQSxXQUFBLHVCQUFBOzs7UUFHQSxPQUFBLGNBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxPQUFBLFdBQUEsUUFBQSxVQUFBLENBQUE7Ozs7UUFJQSxPQUFBLGtCQUFBLFVBQUEsR0FBQSxNQUFBO1lBQ0EsRUFBQTtZQUNBLElBQUEsUUFBQSxPQUFBLFdBQUEsUUFBQTtZQUNBLElBQUEsVUFBQSxDQUFBLEtBQUEsT0FBQSxXQUFBLFNBQUEsZUFBQTtnQkFDQSxPQUFBLFdBQUEsS0FBQTttQkFDQTtnQkFDQSxPQUFBLFdBQUEsT0FBQSxPQUFBOztZQUVBOzs7O1FBSUEsT0FBQSxpQkFBQSxZQUFBO1lBQ0EsT0FBQSxPQUFBLFdBQUEsU0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0Es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QUFBLEdBQUE7R0FDQSxPQUFBLENBQUEsV0FBQTtJQUNBLElBQUEsVUFBQSxNQUFBLE9BQUE7SUFDQSxJQUFBLFFBQUEsV0FBQTtLQUNBLFNBQUEsTUFBQTtLQUNBLFNBQUEsUUFBQSxLQUFBLE1BQUEsU0FBQTtLQUNBLFdBQUEsR0FBQTs7SUFFQSxJQUFBLFNBQUEsS0FBQTtLQUNBLFNBQUEsT0FBQSxTQUFBOztJQUVBLFNBQUEsTUFBQSxTQUFBLE9BQUE7SUFDQSxPQUFBLFNBQUE7Ozs7Ozs7Ozs7OztBQ3RCQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxPQUFBLFlBQUE7RUFDQTs7RUFFQSxJQUFBLE1BQUEsSUFBQSxHQUFBLElBQUE7R0FDQSxRQUFBO1lBQ0EsVUFBQTtHQUNBLFVBQUE7SUFDQSxJQUFBLEdBQUEsUUFBQTtJQUNBLElBQUEsR0FBQSxRQUFBO0lBQ0EsSUFBQSxHQUFBLFFBQUE7O1lBRUEsY0FBQSxHQUFBLFlBQUEsU0FBQTtnQkFDQSxVQUFBOzs7O0VBSUEsT0FBQTs7Ozs7Ozs7Ozs7QUNoQkEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsK0NBQUEsVUFBQSxZQUFBLFFBQUEsS0FBQTtFQUNBOztFQUVBLElBQUE7UUFDQSxJQUFBOztFQUVBLElBQUEsbUJBQUEsVUFBQSxZQUFBO0dBQ0EsV0FBQSxRQUFBLE9BQUEsUUFBQSxXQUFBO0dBQ0EsT0FBQTs7O0VBR0EsSUFBQSxnQkFBQSxVQUFBLFlBQUE7R0FDQSxZQUFBLEtBQUE7R0FDQSxPQUFBOzs7RUFHQSxLQUFBLFFBQUEsVUFBQSxRQUFBO0dBQ0EsY0FBQSxXQUFBLE1BQUE7WUFDQSxVQUFBLFlBQUE7R0FDQSxRQUFBLEtBQUEsVUFBQSxHQUFBO0lBQ0EsRUFBQSxRQUFBOztHQUVBLE9BQUE7OztFQUdBLEtBQUEsTUFBQSxVQUFBLFFBQUE7R0FDQSxJQUFBLENBQUEsT0FBQSxZQUFBLE9BQUEsT0FBQTtJQUNBLE9BQUEsV0FBQSxPQUFBLE1BQUEsT0FBQTs7R0FFQSxJQUFBLGFBQUEsV0FBQSxJQUFBO0dBQ0EsV0FBQTtjQUNBLEtBQUE7Y0FDQSxLQUFBO2NBQ0EsTUFBQSxJQUFBOztHQUVBLE9BQUE7OztFQUdBLEtBQUEsU0FBQSxVQUFBLFlBQUE7O0dBRUEsSUFBQSxRQUFBLFlBQUEsUUFBQTtHQUNBLElBQUEsUUFBQSxDQUFBLEdBQUE7SUFDQSxPQUFBLFdBQUEsUUFBQSxZQUFBOzs7S0FHQSxRQUFBLFlBQUEsUUFBQTtLQUNBLFlBQUEsT0FBQSxPQUFBO09BQ0EsSUFBQTs7OztFQUlBLEtBQUEsVUFBQSxVQUFBLElBQUE7R0FDQSxPQUFBLFlBQUEsUUFBQTs7O0VBR0EsS0FBQSxVQUFBLFlBQUE7R0FDQSxPQUFBOzs7UUFHQSxLQUFBLGFBQUEsWUFBQTtZQUNBLE9BQUE7Ozs7Ozs7Ozs7OztBQzVEQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxzRkFBQSxVQUFBLFlBQUEsZUFBQSxLQUFBLElBQUEsY0FBQSxhQUFBO0VBQ0E7O0VBRUEsSUFBQSxRQUFBOztFQUVBLElBQUEsV0FBQTs7RUFFQSxJQUFBLGtCQUFBOztFQUVBLElBQUEsU0FBQTs7O0VBR0EsS0FBQSxlQUFBOzs7Ozs7RUFNQSxJQUFBLFNBQUEsVUFBQSxJQUFBO0dBQ0EsS0FBQSxNQUFBLE1BQUEsYUFBQTtHQUNBLElBQUEsUUFBQSxTQUFBLFFBQUE7R0FDQSxPQUFBLFNBQUEsQ0FBQSxRQUFBLEtBQUEsU0FBQTs7Ozs7OztFQU9BLElBQUEsU0FBQSxVQUFBLElBQUE7R0FDQSxLQUFBLE1BQUEsTUFBQSxhQUFBO0dBQ0EsSUFBQSxRQUFBLFNBQUEsUUFBQTtHQUNBLElBQUEsU0FBQSxTQUFBO0dBQ0EsT0FBQSxTQUFBLENBQUEsUUFBQSxJQUFBLFVBQUE7Ozs7Ozs7RUFPQSxJQUFBLFdBQUEsVUFBQSxJQUFBO0dBQ0EsS0FBQSxNQUFBLE1BQUEsYUFBQTtHQUNBLEtBQUEsSUFBQSxJQUFBLE9BQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBO0lBQ0EsSUFBQSxPQUFBLEdBQUEsT0FBQSxJQUFBLE9BQUEsT0FBQTs7O0dBR0EsT0FBQTs7Ozs7O0VBTUEsSUFBQSxPQUFBLFVB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QSxPQUFBLE1BQUEsU0FBQTs7SUFFQSxJQUFBLFNBQUEsTUFBQSxTQUFBOztJQUVBLElBQUEsT0FBQSxPQUFBLGFBQUEsT0FBQSxPQUFBLFdBQUE7S0FDQSxTQUFBLEdBQUEsT0FBQSxVQUFBOzs7SUFHQSxJQUFBLGNBQUEsSUFBQSxHQUFBLE9BQUEsWUFBQTtLQUNBLEtBQUEsTUFBQTtLQUNBLFlBQUE7S0FDQSxhQUFBOzs7SUFHQSxXQUFBLFVBQUE7O0lBRUEsSUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO0tBQ0EsWUFBQTtLQUNBLFFBQUE7S0FDQSxNQUFBO0tBQ0EsWUFBQTs7S0FFQSxlQUFBOztLQUVBLFFBQUE7Ozs7SUFJQSxJQUFBLFNBQUEsV0FBQTtLQUNBLElBQUEsVUFBQSxJQUFBLFFBQUEsSUFBQTs7Ozs7RUFLQSxLQUFBLFlBQUEsWUFBQTtHQUNBLE9BQUE7OztFQUdBLEtBQUEsZ0JBQUEsWUFBQTtHQUNBLE9BQUE7OztRQUdBLEtBQUEsV0FBQSxZQUFBO1lBQ0EsT0FBQTs7Ozs7Ozs7Ozs7O0FDL0RBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLFVBQUEsWUFBQTtFQUNBOztRQUVBLElBQUEsUUFBQTs7UUFFQSxLQUFBLFNBQUE7WUFDQSxPQUFBLENBQUEsS0FBQSxLQUFBLEtBQUE7WUFDQSxNQUFBLENBQUEsR0FBQSxLQUFBLEtBQUE7WUFDQSxRQUFBOzs7UUFHQSxJQUFBLHNCQUFBO1FBQ0EsSUFBQSxxQkFBQTs7UUFFQSxJQUFBLHVCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsd0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsSUFBQSxnQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLGlCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsb0JBQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBOzs7UUFHQSxJQUFBLHFCQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O1FBR0EsSUFBQSxzQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLHVCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsc0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTtZQUNBLFVBQUEsQ0FBQTs7O1FBR0EsSUFBQSxnQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBO1lBQ0EsVUFBQSxDQUFBOzs7UUFHQSxJQUFBLGNBQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBOzs7UUFHQSxJQUFBLGVBQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBOzs7RUFHQSxLQUFBLFdBQUEsVUFBQSxTQUFBO1lBQ0EsSUFBQSxRQUFBLFFBQUEsU0FBQSxNQUFBLFFBQUEsU0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBO2dCQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7b0JBQ0EsUUFBQTtvQkFDQSxPQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7d0JBQ0EsUUFBQTt3QkFDQSxNQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7NEJBQ0EsT0FBQTs7d0JBRUEsUUFBQTs7O2dCQUdBLElBQUEsR0FBQSxNQUFBLE1BQUE7b0JBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO3dCQUNBLE9BQUE7d0JBQ0EsT0FBQTs7Ozs7O0VBTUEsS0FBQSxZQUFBO0dBQ0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxPQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQTtLQUNBLFFBQUE7O2dCQUVBLFFBQUE7O0dBRUEsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUE7Z0JBQ0EsUUFBQTs7OztFQUlBLEtBQUEsVUFBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUE7S0FDQSxRQUFBOzs7R0FHQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQTs7OztFQUlBLEtBQUEsV0FBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBOztHQUVBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7b0JBQ0EsT0FBQSxLQUFBLE9BQUE7b0JBQ0EsT0FBQTs7Ozs7Ozs7Ozs7Ozs7QUNuSUEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsYUFBQSxZQUFBO0VBQ0E7O0VBRUEsSUFBQSxRQUFBOzs7RUFHQSxJQUFBLGNBQUEsWUFBQTtHQUNBLElBQUEsU0FBQSxTQUFBLEtBQUEsUUFBQSxLQUFBOzhCQUNBLE1BQUE7O0dBRUEsSUFBQSxRQUFBOztHQUVBLE9BQUEsUUFBQSxVQUFBLE9BQUE7O0lBRUEsSUFBQSxVQUFBLE1BQUEsTUFBQTtJQUNBLElBQUEsV0FBQSxRQUFBLFdBQUEsR0FBQTtLQUNBLE1BQUEsUUFBQSxNQUFBLG1CQUFBLFFBQUE7Ozs7R0FJQSxPQUFBOzs7O0VBSUEsSUFBQSxjQUFBLFVBQUEsT0FBQTtHQUNBLElBQUEsU0FBQTtHQUNBLEtBQUEsSUFBQSxPQUFBLE9BQUE7SUFDQSxVQUFBLE1BQUEsTUFBQSxtQkFBQSxNQUFBLFFBQUE7O0dBRUEsT0FBQSxPQUFBLFVBQUEsR0FBQSxPQUFBLFNBQUE7OztFQUdBLEtBQUEsWUFBQSxVQUFBLEdBQUE7R0FDQSxNQUFBLE9BQUE7R0FDQSxRQUFBLFVBQUEsT0FBQSxJQUFBLE1BQUEsT0FBQSxNQUFBLFlBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsVUFBQSxRQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsUUFBQTtJQUNBLE1BQUEsT0FBQSxPQUFBOztHQUVBLFFBQUEsYUFBQSxPQUFBLElBQUEsTUFBQSxPQUFBLE1BQUEsWUFBQTs7OztFQUlBLEtBQUEsTUFBQSxVQUFBLEtBQUE7R0FDQSxPQUFBLE1BQUE7OztFQUdBLFFBQUEsUUFBQTs7RUFFQSxJQUFBLENBQUEsT0FBQTtHQUNBLFFBQUE7OztFQUdBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIGFubm90YXRpb25zIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnLCBbJ2RpYXMuYXBpJywgJ2RpYXMudWknXSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEFubm90YXRpb25zQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgYW5ub3RhdGlvbnMgbGlzdCBpbiB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0Fubm90YXRpb25zQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEFubm90YXRpb25zLCBsYWJlbHMsIGFubm90YXRpb25zLCBzaGFwZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5zZWxlY3RlZEZlYXR1cmVzID0gbWFwQW5ub3RhdGlvbnMuZ2V0U2VsZWN0ZWRGZWF0dXJlcygpLmdldEFycmF5KCk7XG5cblx0XHR2YXIgcmVmcmVzaEFubm90YXRpb25zID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmFubm90YXRpb25zID0gYW5ub3RhdGlvbnMuY3VycmVudCgpO1xuXHRcdH07XG5cblx0XHR2YXIgc2VsZWN0ZWRGZWF0dXJlcyA9IG1hcEFubm90YXRpb25zLmdldFNlbGVjdGVkRmVhdHVyZXMoKTtcblxuXHRcdCRzY29wZS5hbm5vdGF0aW9ucyA9IFtdO1xuXG5cdFx0JHNjb3BlLmNsZWFyU2VsZWN0aW9uID0gbWFwQW5ub3RhdGlvbnMuY2xlYXJTZWxlY3Rpb247XG5cblx0XHQkc2NvcGUuc2VsZWN0QW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChlLCBpZCkge1xuXHRcdFx0Ly8gYWxsb3cgbXVsdGlwbGUgc2VsZWN0aW9uc1xuXHRcdFx0aWYgKCFlLnNoaWZ0S2V5KSB7XG5cdFx0XHRcdCRzY29wZS5jbGVhclNlbGVjdGlvbigpO1xuXHRcdFx0fVxuXHRcdFx0bWFwQW5ub3RhdGlvbnMuc2VsZWN0KGlkKTtcblx0XHR9O1xuXG4gICAgICAgICRzY29wZS5maXRBbm5vdGF0aW9uID0gbWFwQW5ub3RhdGlvbnMuZml0O1xuXG5cdFx0JHNjb3BlLmlzU2VsZWN0ZWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBzZWxlY3RlZCA9IGZhbHNlO1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5mb3JFYWNoKGZ1bmN0aW9uIChmZWF0dXJlKSB7XG5cdFx0XHRcdGlmIChmZWF0dXJlLmFubm90YXRpb24gJiYgZmVhdHVyZS5hbm5vdGF0aW9uLmlkID09IGlkKSB7XG5cdFx0XHRcdFx0c2VsZWN0ZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBzZWxlY3RlZDtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCByZWZyZXNoQW5ub3RhdGlvbnMpO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0aW9uc0N5Y2xpbmdDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBiYWNrZ3JvdW5kIHNlZ21lbnRhdGlvbiBST0kgb3BhY2l0eSBzZXR0aW5nc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0Fubm90YXRpb25zQ3ljbGluZ0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywgbGFiZWxzLCBrZXlib2FyZCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBmbGFnIHRvIHByZXZlbnQgY3ljbGluZyB3aGlsZSBhIG5ldyBpbWFnZSBpcyBsb2FkaW5nXG4gICAgICAgIHZhciBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGN5Y2xpbmdLZXkgPSAnYW5ub3RhdGlvbnMnO1xuXG4gICAgICAgIHZhciBuZXh0QW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAobG9hZGluZyB8fCAhJHNjb3BlLmN5Y2xpbmcoKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAobWFwQW5ub3RhdGlvbnMuaGFzTmV4dCgpKSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuY3ljbGVOZXh0KCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG1ldGhvZCBmcm9tIEFubm90YXRvckNvbnRyb2xsZXI7IG1hcEFubm90YXRpb25zIHdpbGwgcmVmcmVzaCBhdXRvbWF0aWNhbGx5XG4gICAgICAgICAgICAgICAgJHNjb3BlLm5leHRJbWFnZSgpLnRoZW4obWFwQW5ub3RhdGlvbnMuanVtcFRvRmlyc3QpO1xuICAgICAgICAgICAgICAgIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICAgIC8vIG9ubHkgYXBwbHkgaWYgdGhpcyB3YXMgY2FsbGVkIGJ5IHRoZSBrZXlib2FyZCBldmVudFxuICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY2FuY2VsIGFsbCBrZXlib2FyZCBldmVudHMgd2l0aCBsb3dlciBwcmlvcml0eVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBwcmV2QW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAobG9hZGluZyB8fCAhJHNjb3BlLmN5Y2xpbmcoKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAobWFwQW5ub3RhdGlvbnMuaGFzUHJldmlvdXMoKSkge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmN5Y2xlUHJldmlvdXMoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gbWV0aG9kIGZyb20gQW5ub3RhdG9yQ29udHJvbGxlcjsgbWFwQW5ub3RhdGlvbnMgd2lsbCByZWZyZXNoIGF1dG9tYXRpY2FsbHlcbiAgICAgICAgICAgICAgICAkc2NvcGUucHJldkltYWdlKCkudGhlbihtYXBBbm5vdGF0aW9ucy5qdW1wVG9MYXN0KTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGFwcGx5IGlmIHRoaXMgd2FzIGNhbGxlZCBieSB0aGUga2V5Ym9hcmQgZXZlbnRcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNhbmNlbCBhbGwga2V5Ym9hcmQgZXZlbnRzIHdpdGggbG93ZXIgcHJpb3JpdHlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgYXR0YWNoTGFiZWwgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcpIHJldHVybjtcbiAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoJHNjb3BlLmN5Y2xpbmcoKSAmJiBsYWJlbHMuaGFzU2VsZWN0ZWQoKSkge1xuICAgICAgICAgICAgICAgIGxhYmVscy5hdHRhY2hUb0Fubm90YXRpb24obWFwQW5ub3RhdGlvbnMuZ2V0Q3VycmVudCgpKS4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuZmxpY2tlcigxKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuZmxpY2tlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHN0b3AgY3ljbGluZyB1c2luZyBhIGtleWJvYXJkIGV2ZW50XG4gICAgICAgIHZhciBzdG9wQ3ljbGluZyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAkc2NvcGUuc3RvcEN5Y2xpbmcoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuY3ljbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuZ2V0Vm9sYXRpbGVTZXR0aW5ncygnY3ljbGUnKSA9PT0gY3ljbGluZ0tleTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc3RhcnRDeWNsaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNldFZvbGF0aWxlU2V0dGluZ3MoJ2N5Y2xlJywgY3ljbGluZ0tleSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnN0b3BDeWNsaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNldFZvbGF0aWxlU2V0dGluZ3MoJ2N5Y2xlJywgJycpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHRoZSBjeWNsZSBzZXR0aW5ncyBteSBiZSBzZXQgYnkgb3RoZXIgY29udHJvbGxlcnMsIHRvbywgc28gd2F0Y2ggaXRcbiAgICAgICAgLy8gaW5zdGVhZCBvZiB1c2luZyB0aGUgc3RhcnQvc3RvcCBmdW5jdGlvbnMgdG8gYWRkL3JlbW92ZSBldmVudHMgZXRjLlxuICAgICAgICAkc2NvcGUuJHdhdGNoKCd2b2xhdGlsZVNldHRpbmdzLmN5Y2xlJywgZnVuY3Rpb24gKGN5Y2xlLCBvbGRDeWNsZSkge1xuICAgICAgICAgICAgaWYgKGN5Y2xlID09PSBjeWNsaW5nS2V5KSB7XG4gICAgICAgICAgICAgICAgLy8gb3ZlcnJpZGUgcHJldmlvdXMgaW1hZ2Ugb24gYXJyb3cgbGVmdFxuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDM3LCBwcmV2QW5ub3RhdGlvbiwgMTApO1xuICAgICAgICAgICAgICAgIC8vIG92ZXJyaWRlIG5leHQgaW1hZ2Ugb24gYXJyb3cgcmlnaHQgYW5kIHNwYWNlXG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMzksIG5leHRBbm5vdGF0aW9uLCAxMCk7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMzIsIG5leHRBbm5vdGF0aW9uLCAxMCk7XG5cbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigxMywgYXR0YWNoTGFiZWwsIDEwKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigyNywgc3RvcEN5Y2xpbmcsIDEwKTtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5qdW1wVG9DdXJyZW50KCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9sZEN5Y2xlID09PSBjeWNsaW5nS2V5KSB7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDM3LCBwcmV2QW5ub3RhdGlvbik7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDM5LCBuZXh0QW5ub3RhdGlvbik7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDMyLCBuZXh0QW5ub3RhdGlvbik7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDEzLCBhdHRhY2hMYWJlbCk7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDI3LCBzdG9wQ3ljbGluZyk7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuY2xlYXJTZWxlY3RlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLnByZXZBbm5vdGF0aW9uID0gcHJldkFubm90YXRpb247XG4gICAgICAgICRzY29wZS5uZXh0QW5ub3RhdGlvbiA9IG5leHRBbm5vdGF0aW9uO1xuICAgICAgICAkc2NvcGUuYXR0YWNoTGFiZWwgPSBhdHRhY2hMYWJlbDtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0b3JDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1haW4gY29udHJvbGxlciBvZiB0aGUgQW5ub3RhdG9yIGFwcGxpY2F0aW9uLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0Fubm90YXRvckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBpbWFnZXMsIHVybFBhcmFtcywgbXNnLCBJTUFHRV9JRCwga2V5Ym9hcmQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLmltYWdlcyA9IGltYWdlcztcbiAgICAgICAgJHNjb3BlLmltYWdlTG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgLy8gdGhlIGN1cnJlbnQgY2FudmFzIHZpZXdwb3J0LCBzeW5jZWQgd2l0aCB0aGUgVVJMIHBhcmFtZXRlcnNcbiAgICAgICAgJHNjb3BlLnZpZXdwb3J0ID0ge1xuICAgICAgICAgICAgem9vbTogdXJsUGFyYW1zLmdldCgneicpLFxuICAgICAgICAgICAgY2VudGVyOiBbdXJsUGFyYW1zLmdldCgneCcpLCB1cmxQYXJhbXMuZ2V0KCd5JyldXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZmluaXNoIGltYWdlIGxvYWRpbmcgcHJvY2Vzc1xuICAgICAgICB2YXIgZmluaXNoTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdpbWFnZS5zaG93bicsICRzY29wZS5pbWFnZXMuY3VycmVudEltYWdlKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeVxuICAgICAgICB2YXIgcHVzaFN0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdXJsUGFyYW1zLnB1c2hTdGF0ZSgkc2NvcGUuaW1hZ2VzLmN1cnJlbnRJbWFnZS5faWQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHN0YXJ0IGltYWdlIGxvYWRpbmcgcHJvY2Vzc1xuICAgICAgICB2YXIgc3RhcnRMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlTG9hZGluZyA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gbG9hZCB0aGUgaW1hZ2UgYnkgaWQuIGRvZXNuJ3QgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnkgYnkgaXRzZWxmXG4gICAgICAgIHZhciBsb2FkSW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlcy5zaG93KHBhcnNlSW50KGlkKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmaW5pc2hMb2FkaW5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2hvdyB0aGUgbmV4dCBpbWFnZSBhbmQgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgJHNjb3BlLm5leHRJbWFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlcy5uZXh0KClcbiAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAudGhlbihwdXNoU3RhdGUpXG4gICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHNob3cgdGhlIHByZXZpb3VzIGltYWdlIGFuZCBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeVxuICAgICAgICAkc2NvcGUucHJldkltYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc3RhcnRMb2FkaW5nKCk7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VzLnByZXYoKVxuICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgIC50aGVuKHB1c2hTdGF0ZSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSBVUkwgcGFyYW1ldGVycyBvZiB0aGUgdmlld3BvcnRcbiAgICAgICAgJHNjb3BlLiRvbignY2FudmFzLm1vdmVlbmQnLCBmdW5jdGlvbihlLCBwYXJhbXMpIHtcbiAgICAgICAgICAgICRzY29wZS52aWV3cG9ydC56b29tID0gcGFyYW1zLnpvb207XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuY2VudGVyWzBdID0gTWF0aC5yb3VuZChwYXJhbXMuY2VudGVyWzBdKTtcbiAgICAgICAgICAgICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMV0gPSBNYXRoLnJvdW5kKHBhcmFtcy5jZW50ZXJbMV0pO1xuICAgICAgICAgICAgdXJsUGFyYW1zLnNldCh7XG4gICAgICAgICAgICAgICAgejogJHNjb3BlLnZpZXdwb3J0Lnpvb20sXG4gICAgICAgICAgICAgICAgeDogJHNjb3BlLnZpZXdwb3J0LmNlbnRlclswXSxcbiAgICAgICAgICAgICAgICB5OiAkc2NvcGUudmlld3BvcnQuY2VudGVyWzFdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oMzcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5wcmV2SW1hZ2UoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oMzksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oMzIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gbGlzdGVuIHRvIHRoZSBicm93c2VyIFwiYmFja1wiIGJ1dHRvblxuICAgICAgICB3aW5kb3cub25wb3BzdGF0ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBzdGF0ZSA9IGUuc3RhdGU7XG4gICAgICAgICAgICBpZiAoc3RhdGUgJiYgc3RhdGUuc2x1ZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbG9hZEltYWdlKHN0YXRlLnNsdWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGluaXRpYWxpemUgdGhlIGltYWdlcyBzZXJ2aWNlXG4gICAgICAgIGltYWdlcy5pbml0KCk7XG4gICAgICAgIC8vIGRpc3BsYXkgdGhlIGZpcnN0IGltYWdlXG4gICAgICAgIGxvYWRJbWFnZShJTUFHRV9JRCkudGhlbihwdXNoU3RhdGUpO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENhbnZhc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFpbiBjb250cm9sbGVyIGZvciB0aGUgYW5ub3RhdGlvbiBjYW52YXMgZWxlbWVudFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NhbnZhc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBJbWFnZSwgbWFwQW5ub3RhdGlvbnMsIG1hcCwgJHRpbWVvdXQsIGRlYm91bmNlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuXG5cdFx0Ly8gdXBkYXRlIHRoZSBVUkwgcGFyYW1ldGVyc1xuXHRcdG1hcC5vbignbW92ZWVuZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBlbWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnY2FudmFzLm1vdmVlbmQnLCB7XG4gICAgICAgICAgICAgICAgICAgIGNlbnRlcjogbWFwVmlldy5nZXRDZW50ZXIoKSxcbiAgICAgICAgICAgICAgICAgICAgem9vbTogbWFwVmlldy5nZXRab29tKClcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGRvbnQgdXBkYXRlIGltbWVkaWF0ZWx5IGJ1dCB3YWl0IGZvciBwb3NzaWJsZSBuZXcgY2hhbmdlc1xuICAgICAgICAgICAgZGVib3VuY2UoZW1pdCwgMTAwLCAnYW5ub3RhdG9yLmNhbnZhcy5tb3ZlZW5kJyk7XG5cdFx0fSk7XG5cbiAgICAgICAgbWFwLm9uKCdjaGFuZ2U6dmlldycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuICAgICAgICB9KTtcblxuXHRcdG1hcEltYWdlLmluaXQoJHNjb3BlKTtcblx0XHRtYXBBbm5vdGF0aW9ucy5pbml0KCRzY29wZSk7XG5cblx0XHR2YXIgdXBkYXRlU2l6ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdC8vIHdvcmthcm91bmQsIHNvIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQgKmFmdGVyKiB0aGUgYW5ndWxhciBkaWdlc3Rcblx0XHRcdC8vIGFuZCAqYWZ0ZXIqIHRoZSBmb2xkb3V0IHdhcyByZW5kZXJlZFxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBuZWVkcyB0byBiZSB3cmFwcGVkIGluIGFuIGV4dHJhIGZ1bmN0aW9uIHNpbmNlIHVwZGF0ZVNpemUgYWNjZXB0cyBhcmd1bWVudHNcblx0XHRcdFx0bWFwLnVwZGF0ZVNpemUoKTtcblx0XHRcdH0sIDUwLCBmYWxzZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5vcGVuJywgdXBkYXRlU2l6ZSk7XG5cdFx0JHNjb3BlLiRvbignc2lkZWJhci5mb2xkb3V0LmNsb3NlJywgdXBkYXRlU2l6ZSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENhdGVnb3JpZXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyIGxhYmVsIGNhdGVnb3JpZXMgZm9sZG91dFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NhdGVnb3JpZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbGFiZWxzLCBrZXlib2FyZCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBtYXhpbXVtIG51bWJlciBvZiBhbGxvd2VkIGZhdm91cml0ZXNcbiAgICAgICAgdmFyIG1heEZhdm91cml0ZXMgPSA5O1xuICAgICAgICB2YXIgZmF2b3VyaXRlc1N0b3JhZ2VLZXkgPSAnZGlhcy5hbm5vdGF0aW9ucy5sYWJlbC1mYXZvdXJpdGVzJztcblxuICAgICAgICAvLyBzYXZlcyB0aGUgSURzIG9mIHRoZSBmYXZvdXJpdGVzIGluIGxvY2FsU3RvcmFnZVxuICAgICAgICB2YXIgc3RvcmVGYXZvdXJpdGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRtcCA9ICRzY29wZS5mYXZvdXJpdGVzLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmlkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2Zhdm91cml0ZXNTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KHRtcCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmVzdG9yZXMgdGhlIGZhdm91cml0ZXMgZnJvbSB0aGUgSURzIGluIGxvY2FsU3RvcmFnZVxuICAgICAgICB2YXIgbG9hZEZhdm91cml0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtmYXZvdXJpdGVzU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgICAgICB2YXIgdG1wID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlW2Zhdm91cml0ZXNTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMgPSAkc2NvcGUuY2F0ZWdvcmllcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gb25seSB0YWtlIHRob3NlIGNhdGVnb3JpZXMgYXMgZmF2b3VyaXRlcyB0aGF0IGFyZSBhdmFpbGFibGUgZm9yIHRoaXMgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRtcC5pbmRleE9mKGl0ZW0uaWQpICE9PSAtMTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgY2hvb3NlRmF2b3VyaXRlID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gMCAmJiBpbmRleCA8ICRzY29wZS5mYXZvdXJpdGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RJdGVtKCRzY29wZS5mYXZvdXJpdGVzW2luZGV4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmhvdGtleXNNYXAgPSBbJ/Cdn60nLCAn8J2fricsICfwnZ+vJywgJ/Cdn7AnLCAn8J2fsScsICfwnZ+yJywgJ/Cdn7MnLCAn8J2ftCcsICfwnZ+1J107XG4gICAgICAgICRzY29wZS5jYXRlZ29yaWVzID0gW107XG4gICAgICAgICRzY29wZS5mYXZvdXJpdGVzID0gW107XG4gICAgICAgIGxhYmVscy5wcm9taXNlLnRoZW4oZnVuY3Rpb24gKGFsbCkge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGFsbCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5jYXRlZ29yaWVzID0gJHNjb3BlLmNhdGVnb3JpZXMuY29uY2F0KGFsbFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvYWRGYXZvdXJpdGVzKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS5jYXRlZ29yaWVzVHJlZSA9IGxhYmVscy5nZXRUcmVlKCk7XG5cbiAgICAgICAgJHNjb3BlLnNlbGVjdEl0ZW0gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgbGFiZWxzLnNldFNlbGVjdGVkKGl0ZW0pO1xuICAgICAgICAgICAgJHNjb3BlLnNlYXJjaENhdGVnb3J5ID0gJyc7IC8vIGNsZWFyIHNlYXJjaCBmaWVsZFxuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCBpdGVtKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNGYXZvdXJpdGUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5mYXZvdXJpdGVzLmluZGV4T2YoaXRlbSkgIT09IC0xO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGFkZHMgYSBuZXcgaXRlbSB0byB0aGUgZmF2b3VyaXRlcyBvciByZW1vdmVzIGl0IGlmIGl0IGlzIGFscmVhZHkgYSBmYXZvdXJpdGVcbiAgICAgICAgJHNjb3BlLnRvZ2dsZUZhdm91cml0ZSA9IGZ1bmN0aW9uIChlLCBpdGVtKSB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gJHNjb3BlLmZhdm91cml0ZXMuaW5kZXhPZihpdGVtKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEgJiYgJHNjb3BlLmZhdm91cml0ZXMubGVuZ3RoIDwgbWF4RmF2b3VyaXRlcykge1xuICAgICAgICAgICAgICAgICRzY29wZS5mYXZvdXJpdGVzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5mYXZvdXJpdGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdG9yZUZhdm91cml0ZXMoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXR1cm5zIHdoZXRoZXIgdGhlIHVzZXIgaXMgc3RpbGwgYWxsb3dlZCB0byBhZGQgZmF2b3VyaXRlc1xuICAgICAgICAkc2NvcGUuZmF2b3VyaXRlc0xlZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmZhdm91cml0ZXMubGVuZ3RoIDwgbWF4RmF2b3VyaXRlcztcbiAgICAgICAgfTtcblxuICAgICAgICBrZXlib2FyZC5vbignMScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSgwKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoMSk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCczJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDIpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignNCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSgzKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoNCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc2JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDUpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignNycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg2KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoNyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDgpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDb25maWRlbmNlQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgY29uZmlkZW5jZSBjb250cm9sXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQ29uZmlkZW5jZUNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5jb25maWRlbmNlID0gMS4wO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnY29uZmlkZW5jZScsIGZ1bmN0aW9uIChjb25maWRlbmNlKSB7XG5cdFx0XHRsYWJlbHMuc2V0Q3VycmVudENvbmZpZGVuY2UocGFyc2VGbG9hdChjb25maWRlbmNlKSk7XG5cblx0XHRcdGlmIChjb25maWRlbmNlIDw9IDAuMjUpIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC1kYW5nZXInO1xuXHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNSApIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC13YXJuaW5nJztcblx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjc1ICkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXN1Y2Nlc3MnO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC1wcmltYXJ5Jztcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgRHJhd2luZ0NvbnRyb2xzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgY29udHJvbHMgYmFyIGRyYXdpbmcgYnV0b25zXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignRHJhd2luZ0NvbnRyb2xzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEFubm90YXRpb25zLCBsYWJlbHMsIG1zZywgJGF0dHJzLCBrZXlib2FyZCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLnNlbGVjdFNoYXBlID0gZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRcdGlmICghbGFiZWxzLmhhc1NlbGVjdGVkKCkpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ3NpZGViYXIuZm9sZG91dC5kby1vcGVuJywgJ2NhdGVnb3JpZXMnKTtcblx0XHRcdFx0bXNnLmluZm8oJGF0dHJzLnNlbGVjdENhdGVnb3J5KTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG4gICAgICAgICAgICBpZiAobmFtZSAhPT0gbnVsbCAmJiAkc2NvcGUuc2VsZWN0ZWRTaGFwZSgpICE9PSBuYW1lKSB7XG5cdFx0XHRcdG1hcEFubm90YXRpb25zLnN0YXJ0RHJhd2luZyhuYW1lKTtcblx0XHRcdH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuZmluaXNoRHJhd2luZygpO1xuICAgICAgICAgICAgfVxuXHRcdH07XG5cbiAgICAgICAgJHNjb3BlLnNlbGVjdGVkU2hhcGUgPSBtYXBBbm5vdGF0aW9ucy5nZXRTZWxlY3RlZERyYXdpbmdUeXBlO1xuXG4gICAgICAgIC8vIGRlc2VsZWN0IGRyYXdpbmcgdG9vbCBvbiBlc2NhcGVcbiAgICAgICAga2V5Ym9hcmQub24oMjcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZShudWxsKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ2EnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ1BvaW50Jyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdSZWN0YW5nbGUnKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ2QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ0NpcmNsZScpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignZicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnTGluZVN0cmluZycpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignZycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnUG9seWdvbicpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgRWRpdENvbnRyb2xzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgY29udHJvbHMgYmFyIGVkaXQgYnV0dG9uc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0VkaXRDb250cm9sc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywga2V5Ym9hcmQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuZGVsZXRlU2VsZWN0ZWRBbm5vdGF0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChtYXBBbm5vdGF0aW9ucy5nZXRTZWxlY3RlZEZlYXR1cmVzKCkuZ2V0TGVuZ3RoKCkgPiAwICYmIGNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgYWxsIHNlbGVjdGVkIGFubm90YXRpb25zPycpKSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuZGVsZXRlU2VsZWN0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgc3RhcnRNb3ZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5zdGFydE1vdmluZygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBmaW5pc2hNb3ZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5maW5pc2hNb3ZpbmcoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUubW92ZVNlbGVjdGVkQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmlzTW92aW5nKCkpIHtcbiAgICAgICAgICAgICAgICBmaW5pc2hNb3ZpbmcoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhcnRNb3ZpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNNb3ZpbmcgPSBtYXBBbm5vdGF0aW9ucy5pc01vdmluZztcblxuICAgICAgICBrZXlib2FyZC5vbig0NiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICRzY29wZS5kZWxldGVTZWxlY3RlZEFubm90YXRpb25zKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDI3LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmlzTW92aW5nKCkpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KGZpbmlzaE1vdmluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgkc2NvcGUubW92ZVNlbGVjdGVkQW5ub3RhdGlvbnMpO1xuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgTWluaW1hcENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIG1pbmltYXAgaW4gdGhlIHNpZGViYXJcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdNaW5pbWFwQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcCwgbWFwSW1hZ2UsICRlbGVtZW50LCBzdHlsZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgdmlld3BvcnRTb3VyY2UgPSBuZXcgb2wuc291cmNlLlZlY3RvcigpO1xuXG5cdFx0dmFyIG1pbmltYXAgPSBuZXcgb2wuTWFwKHtcblx0XHRcdHRhcmdldDogJ21pbmltYXAnLFxuXHRcdFx0Ly8gcmVtb3ZlIGNvbnRyb2xzXG5cdFx0XHRjb250cm9sczogW10sXG5cdFx0XHQvLyBkaXNhYmxlIGludGVyYWN0aW9uc1xuXHRcdFx0aW50ZXJhY3Rpb25zOiBbXVxuXHRcdH0pO1xuXG4gICAgICAgIHZhciBtYXBTaXplID0gbWFwLmdldFNpemUoKTtcbiAgICAgICAgdmFyIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuXG5cdFx0Ly8gZ2V0IHRoZSBzYW1lIGxheWVycyB0aGFuIHRoZSBtYXBcblx0XHRtaW5pbWFwLmFkZExheWVyKG1hcEltYWdlLmdldExheWVyKCkpO1xuICAgICAgICBtaW5pbWFwLmFkZExheWVyKG5ldyBvbC5sYXllci5WZWN0b3Ioe1xuICAgICAgICAgICAgc291cmNlOiB2aWV3cG9ydFNvdXJjZSxcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZXMudmlld3BvcnRcbiAgICAgICAgfSkpO1xuXG5cdFx0dmFyIHZpZXdwb3J0ID0gbmV3IG9sLkZlYXR1cmUoKTtcblx0XHR2aWV3cG9ydFNvdXJjZS5hZGRGZWF0dXJlKHZpZXdwb3J0KTtcblxuXHRcdC8vIHJlZnJlc2ggdGhlIHZpZXcgKHRoZSBpbWFnZSBzaXplIGNvdWxkIGhhdmUgYmVlbiBjaGFuZ2VkKVxuXHRcdCRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC5zZXRWaWV3KG5ldyBvbC5WaWV3KHtcblx0XHRcdFx0cHJvamVjdGlvbjogbWFwSW1hZ2UuZ2V0UHJvamVjdGlvbigpLFxuXHRcdFx0XHRjZW50ZXI6IG9sLmV4dGVudC5nZXRDZW50ZXIobWFwSW1hZ2UuZ2V0RXh0ZW50KCkpLFxuXHRcdFx0XHR6b29tOiAwXG5cdFx0XHR9KSk7XG5cdFx0fSk7XG5cblx0XHQvLyBtb3ZlIHRoZSB2aWV3cG9ydCByZWN0YW5nbGUgb24gdGhlIG1pbmltYXBcblx0XHR2YXIgcmVmcmVzaFZpZXdwb3J0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmlld3BvcnQuc2V0R2VvbWV0cnkob2wuZ2VvbS5Qb2x5Z29uLmZyb21FeHRlbnQobWFwVmlldy5jYWxjdWxhdGVFeHRlbnQobWFwU2l6ZSkpKTtcblx0XHR9O1xuXG4gICAgICAgIG1hcC5vbignY2hhbmdlOnNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBTaXplID0gbWFwLmdldFNpemUoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbWFwLm9uKCdjaGFuZ2U6dmlldycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuICAgICAgICB9KTtcblxuXHRcdG1hcC5vbigncG9zdGNvbXBvc2UnLCByZWZyZXNoVmlld3BvcnQpO1xuXG5cdFx0dmFyIGRyYWdWaWV3cG9ydCA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRtYXBWaWV3LnNldENlbnRlcihlLmNvb3JkaW5hdGUpO1xuXHRcdH07XG5cblx0XHRtaW5pbWFwLm9uKCdwb2ludGVyZHJhZycsIGRyYWdWaWV3cG9ydCk7XG5cblx0XHQkZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdG1pbmltYXAudW4oJ3BvaW50ZXJkcmFnJywgZHJhZ1ZpZXdwb3J0KTtcblx0XHR9KTtcblxuXHRcdCRlbGVtZW50Lm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC5vbigncG9pbnRlcmRyYWcnLCBkcmFnVmlld3BvcnQpO1xuXHRcdH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTZWxlY3RlZExhYmVsQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2VsZWN0ZWQgbGFiZWwgZGlzcGxheSBpbiB0aGUgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2VsZWN0ZWRMYWJlbENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuZ2V0U2VsZWN0ZWRMYWJlbCA9IGxhYmVscy5nZXRTZWxlY3RlZDtcblxuICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWRMYWJlbCA9IGxhYmVscy5oYXNTZWxlY3RlZDtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2V0dGluZ3NBbm5vdGF0aW9uT3BhY2l0eUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgc2V0dGluZ3MgZm9sZG91dFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NldHRpbmdzQW5ub3RhdGlvbk9wYWNpdHlDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLnNldERlZmF1bHRTZXR0aW5ncygnYW5ub3RhdGlvbl9vcGFjaXR5JywgJzEnKTtcbiAgICAgICAgJHNjb3BlLiR3YXRjaCgnc2V0dGluZ3MuYW5ub3RhdGlvbl9vcGFjaXR5JywgZnVuY3Rpb24gKG9wYWNpdHkpIHtcbiAgICAgICAgICAgIG1hcEFubm90YXRpb25zLnNldE9wYWNpdHkob3BhY2l0eSk7XG4gICAgICAgIH0pO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNldHRpbmdzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBzZXR0aW5ncyBmb2xkb3V0XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2V0dGluZ3NDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgZGVib3VuY2UpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIHNldHRpbmdzU3RvcmFnZUtleSA9ICdkaWFzLmFubm90YXRpb25zLnNldHRpbmdzJztcblxuICAgICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0ge307XG5cbiAgICAgICAgLy8gbWF5IGJlIGV4dGVuZGVkIGJ5IGNoaWxkIGNvbnRyb2xsZXJzXG4gICAgICAgICRzY29wZS5zZXR0aW5ncyA9IHt9O1xuXG4gICAgICAgIC8vIG1heSBiZSBleHRlbmRlZCBieSBjaGlsZCBjb250cm9sbGVycyBidXQgd2lsbCBub3QgYmUgcGVybWFuZW50bHkgc3RvcmVkXG4gICAgICAgICRzY29wZS52b2xhdGlsZVNldHRpbmdzID0ge307XG5cbiAgICAgICAgdmFyIHN0b3JlU2V0dGluZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc2V0dGluZ3MgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnNldHRpbmdzKTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5nc1trZXldID09PSBkZWZhdWx0U2V0dGluZ3Nba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBkb24ndCBzdG9yZSBkZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2V0dGluZ3Nba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KHNldHRpbmdzKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgc3RvcmVTZXR0aW5nc0RlYm91bmNlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIHdhaXQgZm9yIHF1aWNrIGNoYW5nZXMgYW5kIG9ubHkgc3RvcmUgdGhlbSBvbmNlIHRoaW5ncyBjYWxtZWQgZG93biBhZ2FpblxuICAgICAgICAgICAgLy8gKGUuZy4gd2hlbiB0aGUgdXNlciBmb29scyBhcm91bmQgd2l0aCBhIHJhbmdlIHNsaWRlcilcbiAgICAgICAgICAgIGRlYm91bmNlKHN0b3JlU2V0dGluZ3MsIDI1MCwgc2V0dGluZ3NTdG9yYWdlS2V5KTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmVzdG9yZVNldHRpbmdzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHNldHRpbmdzID0ge307XG4gICAgICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc1N0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmV4dGVuZChzZXR0aW5ncywgZGVmYXVsdFNldHRpbmdzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2V0U2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0U2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnNldHRpbmdzW2tleV07XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNldERlZmF1bHRTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBkZWZhdWx0U2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgaWYgKCEkc2NvcGUuc2V0dGluZ3MuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zZXRTZXR0aW5ncyhrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2V0Vm9sYXRpbGVTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAkc2NvcGUudm9sYXRpbGVTZXR0aW5nc1trZXldID0gdmFsdWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFZvbGF0aWxlU2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnZvbGF0aWxlU2V0dGluZ3Nba2V5XTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuJHdhdGNoKCdzZXR0aW5ncycsIHN0b3JlU2V0dGluZ3NEZWJvdW5jZWQsIHRydWUpO1xuICAgICAgICBhbmd1bGFyLmV4dGVuZCgkc2NvcGUuc2V0dGluZ3MsIHJlc3RvcmVTZXR0aW5ncygpKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTaWRlYmFyQ2F0ZWdvcnlGb2xkb3V0Q29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBjYXRlZ29yeSBmb2xkb3V0IGJ1dHRvblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NpZGViYXJDYXRlZ29yeUZvbGRvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwga2V5Ym9hcmQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICBrZXlib2FyZC5vbig5LCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZUZvbGRvdXQoJ2NhdGVnb3JpZXMnKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNpZGViYXJDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2lkZWJhckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkcm9vdFNjb3BlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGZvbGRvdXRTdG9yYWdlS2V5ID0gJ2RpYXMuYW5ub3RhdGlvbnMuc2lkZWJhci1mb2xkb3V0JztcblxuICAgICAgICAkc2NvcGUuZm9sZG91dCA9ICcnO1xuXG5cdFx0JHNjb3BlLm9wZW5Gb2xkb3V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldID0gbmFtZTtcbiAgICAgICAgICAgICRzY29wZS5mb2xkb3V0ID0gbmFtZTtcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2lkZWJhci5mb2xkb3V0Lm9wZW4nLCBuYW1lKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNsb3NlRm9sZG91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShmb2xkb3V0U3RvcmFnZUtleSk7XG5cdFx0XHQkc2NvcGUuZm9sZG91dCA9ICcnO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzaWRlYmFyLmZvbGRvdXQuY2xvc2UnKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUZvbGRvdXQgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0aWYgKCRzY29wZS5mb2xkb3V0ID09PSBuYW1lKSB7XG5cdFx0XHRcdCRzY29wZS5jbG9zZUZvbGRvdXQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5vcGVuRm9sZG91dChuYW1lKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKCdzaWRlYmFyLmZvbGRvdXQuZG8tb3BlbicsIGZ1bmN0aW9uIChlLCBuYW1lKSB7XG4gICAgICAgICAgICAkc2NvcGUub3BlbkZvbGRvdXQobmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHRoZSBjdXJyZW50bHkgb3BlbmVkIHNpZGViYXItJ2V4dGVuc2lvbicgaXMgcmVtZW1iZXJlZCB0aHJvdWdoIGxvY2FsU3RvcmFnZVxuICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtmb2xkb3V0U3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgICRzY29wZS5vcGVuRm9sZG91dCh3aW5kb3cubG9jYWxTdG9yYWdlW2ZvbGRvdXRTdG9yYWdlS2V5XSk7XG4gICAgICAgIH1cblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBhbm5vdGF0aW9uTGlzdEl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQW4gYW5ub3RhdGlvbiBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZGlyZWN0aXZlKCdhbm5vdGF0aW9uTGlzdEl0ZW0nLCBmdW5jdGlvbiAobGFiZWxzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0c2NvcGU6IHRydWUsXG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cdFx0XHRcdCRzY29wZS5zaGFwZUNsYXNzID0gJ2ljb24tJyArICRzY29wZS5hbm5vdGF0aW9uLnNoYXBlLnRvTG93ZXJDYXNlKCk7XG5cblx0XHRcdFx0JHNjb3BlLnNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuaXNTZWxlY3RlZCgkc2NvcGUuYW5ub3RhdGlvbi5pZCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmF0dGFjaExhYmVsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGxhYmVscy5hdHRhY2hUb0Fubm90YXRpb24oJHNjb3BlLmFubm90YXRpb24pO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5yZW1vdmVMYWJlbCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuXHRcdFx0XHRcdGxhYmVscy5yZW1vdmVGcm9tQW5ub3RhdGlvbigkc2NvcGUuYW5ub3RhdGlvbiwgbGFiZWwpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5jYW5BdHRhY2hMYWJlbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLnNlbGVjdGVkKCkgJiYgbGFiZWxzLmhhc1NlbGVjdGVkKCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRMYWJlbCA9IGxhYmVscy5nZXRTZWxlY3RlZDtcblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudENvbmZpZGVuY2UgPSBsYWJlbHMuZ2V0Q3VycmVudENvbmZpZGVuY2U7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYWJlbENhdGVnb3J5SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBIGxhYmVsIGNhdGVnb3J5IGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5kaXJlY3RpdmUoJ2xhYmVsQ2F0ZWdvcnlJdGVtJywgZnVuY3Rpb24gKCRjb21waWxlLCAkdGltZW91dCwgJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQycsXG5cbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnbGFiZWwtaXRlbS5odG1sJyxcblxuICAgICAgICAgICAgc2NvcGU6IHRydWUsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyB3YWl0IGZvciB0aGlzIGVsZW1lbnQgdG8gYmUgcmVuZGVyZWQgdW50aWwgdGhlIGNoaWxkcmVuIGFyZVxuICAgICAgICAgICAgICAgIC8vIGFwcGVuZGVkLCBvdGhlcndpc2UgdGhlcmUgd291bGQgYmUgdG9vIG11Y2ggcmVjdXJzaW9uIGZvclxuICAgICAgICAgICAgICAgIC8vIGFuZ3VsYXJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoJ2xhYmVsLXN1YnRyZWUuaHRtbCcpKTtcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKCRjb21waWxlKGNvbnRlbnQpKHNjb3BlKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgLy8gb3BlbiB0aGUgc3VidHJlZSBvZiB0aGlzIGl0ZW1cbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpdGVtIGhhcyBjaGlsZHJlblxuICAgICAgICAgICAgICAgICRzY29wZS5pc0V4cGFuZGFibGUgPSAkc2NvcGUudHJlZSAmJiAhISRzY29wZS50cmVlWyRzY29wZS5pdGVtLmlkXTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaXMgY3VycmVudGx5IHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIC8vIGhhbmRsZSB0aGlzIGJ5IHRoZSBldmVudCByYXRoZXIgdGhhbiBhbiBvd24gY2xpY2sgaGFuZGxlciB0b1xuICAgICAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBjbGljayBhbmQgc2VhcmNoIGZpZWxkIGFjdGlvbnMgaW4gYSB1bmlmaWVkIHdheVxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZSwgY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgYW4gaXRlbSBpcyBzZWxlY3RlZCwgaXRzIHN1YnRyZWUgYW5kIGFsbCBwYXJlbnQgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIG9wZW5lZFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0uaWQgPT09IGNhdGVnb3J5LmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgaGl0cyBhbGwgcGFyZW50IHNjb3Blcy9pdGVtc1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiBhIGNoaWxkIGl0ZW0gd2FzIHNlbGVjdGVkLCB0aGlzIGl0ZW0gc2hvdWxkIGJlIG9wZW5lZCwgdG9vXG4gICAgICAgICAgICAgICAgLy8gc28gdGhlIHNlbGVjdGVkIGl0ZW0gYmVjb21lcyB2aXNpYmxlIGluIHRoZSB0cmVlXG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5vcGVuUGFyZW50cycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAvLyBzdG9wIHByb3BhZ2F0aW9uIGlmIHRoaXMgaXMgYSByb290IGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5pdGVtLnBhcmVudF9pZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgbGFiZWxJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEFuIGFubm90YXRpb24gbGFiZWwgbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmRpcmVjdGl2ZSgnbGFiZWxJdGVtJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0dmFyIGNvbmZpZGVuY2UgPSAkc2NvcGUuYW5ub3RhdGlvbkxhYmVsLmNvbmZpZGVuY2U7XG5cblx0XHRcdFx0aWYgKGNvbmZpZGVuY2UgPD0gMC4yNSkge1xuXHRcdFx0XHRcdCRzY29wZS5jbGFzcyA9ICdsYWJlbC1kYW5nZXInO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC41ICkge1xuXHRcdFx0XHRcdCRzY29wZS5jbGFzcyA9ICdsYWJlbC13YXJuaW5nJztcblx0XHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNzUgKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXN1Y2Nlc3MnO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCRzY29wZS5jbGFzcyA9ICdsYWJlbC1wcmltYXJ5Jztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIGRlYm91bmNlXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgZGVib3VuY2Ugc2VydmljZSB0byBwZXJmb3JtIGFuIGFjdGlvbiBvbmx5IHdoZW4gdGhpcyBmdW5jdGlvblxuICogd2Fzbid0IGNhbGxlZCBhZ2FpbiBpbiBhIHNob3J0IHBlcmlvZCBvZiB0aW1lLlxuICogc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEzMzIwMDE2LzE3OTY1MjNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5mYWN0b3J5KCdkZWJvdW5jZScsIGZ1bmN0aW9uICgkdGltZW91dCwgJHEpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciB0aW1lb3V0cyA9IHt9O1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChmdW5jLCB3YWl0LCBpZCkge1xuXHRcdFx0Ly8gQ3JlYXRlIGEgZGVmZXJyZWQgb2JqZWN0IHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHdlIG5lZWQgdG9cblx0XHRcdC8vIGFjdHVhbGx5IGNhbGwgdGhlIGZ1bmNcblx0XHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0XHRcdHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHRpbWVvdXRzW2lkXSA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncykpO1xuXHRcdFx0XHRcdGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aWYgKHRpbWVvdXRzW2lkXSkge1xuXHRcdFx0XHRcdCR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0c1tpZF0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRpbWVvdXRzW2lkXSA9ICR0aW1lb3V0KGxhdGVyLCB3YWl0KTtcblx0XHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG5cdFx0XHR9KSgpO1xuXHRcdH07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBtYXBcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBmYWN0b3J5IGhhbmRsaW5nIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZmFjdG9yeSgnbWFwJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIG1hcCA9IG5ldyBvbC5NYXAoe1xuXHRcdFx0dGFyZ2V0OiAnY2FudmFzJyxcbiAgICAgICAgICAgIHJlbmRlcmVyOiAnY2FudmFzJyxcblx0XHRcdGNvbnRyb2xzOiBbXG5cdFx0XHRcdG5ldyBvbC5jb250cm9sLlpvb20oKSxcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuWm9vbVRvRXh0ZW50KCksXG5cdFx0XHRcdG5ldyBvbC5jb250cm9sLkZ1bGxTY3JlZW4oKVxuXHRcdFx0XSxcbiAgICAgICAgICAgIGludGVyYWN0aW9uczogb2wuaW50ZXJhY3Rpb24uZGVmYXVsdHMoe1xuICAgICAgICAgICAgICAgIGtleWJvYXJkOiBmYWxzZVxuICAgICAgICAgICAgfSlcblx0XHR9KTtcblxuXHRcdHJldHVybiBtYXA7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGFubm90YXRpb25zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSB0aGUgYW5ub3RhdGlvbnMgdG8gbWFrZSB0aGVtIGF2YWlsYWJsZSBpbiBtdWx0aXBsZSBjb250cm9sbGVycy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdhbm5vdGF0aW9ucycsIGZ1bmN0aW9uIChBbm5vdGF0aW9uLCBzaGFwZXMsIG1zZykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGFubm90YXRpb25zO1xuICAgICAgICB2YXIgcHJvbWlzZTtcblxuXHRcdHZhciByZXNvbHZlU2hhcGVOYW1lID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdGFubm90YXRpb24uc2hhcGUgPSBzaGFwZXMuZ2V0TmFtZShhbm5vdGF0aW9uLnNoYXBlX2lkKTtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR2YXIgYWRkQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHRhbm5vdGF0aW9ucy5wdXNoKGFubm90YXRpb24pO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb247XG5cdFx0fTtcblxuXHRcdHRoaXMucXVlcnkgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRhbm5vdGF0aW9ucyA9IEFubm90YXRpb24ucXVlcnkocGFyYW1zKTtcbiAgICAgICAgICAgIHByb21pc2UgPSBhbm5vdGF0aW9ucy4kcHJvbWlzZTtcblx0XHRcdHByb21pc2UudGhlbihmdW5jdGlvbiAoYSkge1xuXHRcdFx0XHRhLmZvckVhY2gocmVzb2x2ZVNoYXBlTmFtZSk7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9ucztcblx0XHR9O1xuXG5cdFx0dGhpcy5hZGQgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRpZiAoIXBhcmFtcy5zaGFwZV9pZCAmJiBwYXJhbXMuc2hhcGUpIHtcblx0XHRcdFx0cGFyYW1zLnNoYXBlX2lkID0gc2hhcGVzLmdldElkKHBhcmFtcy5zaGFwZSk7XG5cdFx0XHR9XG5cdFx0XHR2YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uYWRkKHBhcmFtcyk7XG5cdFx0XHRhbm5vdGF0aW9uLiRwcm9taXNlXG5cdFx0XHQgICAgICAgICAgLnRoZW4ocmVzb2x2ZVNoYXBlTmFtZSlcblx0XHRcdCAgICAgICAgICAudGhlbihhZGRBbm5vdGF0aW9uKVxuXHRcdFx0ICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG5cblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHQvLyB1c2UgaW5kZXggdG8gc2VlIGlmIHRoZSBhbm5vdGF0aW9uIGV4aXN0cyBpbiB0aGUgYW5ub3RhdGlvbnMgbGlzdFxuXHRcdFx0dmFyIGluZGV4ID0gYW5ub3RhdGlvbnMuaW5kZXhPZihhbm5vdGF0aW9uKTtcblx0XHRcdGlmIChpbmRleCA+IC0xKSB7XG5cdFx0XHRcdHJldHVybiBhbm5vdGF0aW9uLiRkZWxldGUoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdC8vIHVwZGF0ZSB0aGUgaW5kZXggc2luY2UgdGhlIGFubm90YXRpb25zIGxpc3QgbWF5IGhhdmUgYmVlblxuXHRcdFx0XHRcdC8vIG1vZGlmaWVkIGluIHRoZSBtZWFudGltZVxuXHRcdFx0XHRcdGluZGV4ID0gYW5ub3RhdGlvbnMuaW5kZXhPZihhbm5vdGF0aW9uKTtcblx0XHRcdFx0XHRhbm5vdGF0aW9ucy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHR9LCBtc2cucmVzcG9uc2VFcnJvcik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRoaXMuZm9yRWFjaCA9IGZ1bmN0aW9uIChmbikge1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb25zLmZvckVhY2goZm4pO1xuXHRcdH07XG5cblx0XHR0aGlzLmN1cnJlbnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnM7XG5cdFx0fTtcblxuICAgICAgICB0aGlzLmdldFByb21pc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgaW1hZ2VzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1hbmFnZXMgKHByZS0pbG9hZGluZyBvZiB0aGUgaW1hZ2VzIHRvIGFubm90YXRlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2ltYWdlcycsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBUcmFuc2VjdEltYWdlLCBVUkwsICRxLCBmaWx0ZXJTdWJzZXQsIFRSQU5TRUNUX0lEKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXHRcdC8vIGFycmF5IG9mIGFsbCBpbWFnZSBJRHMgb2YgdGhlIHRyYW5zZWN0XG5cdFx0dmFyIGltYWdlSWRzID0gW107XG5cdFx0Ly8gbWF4aW11bSBudW1iZXIgb2YgaW1hZ2VzIHRvIGhvbGQgaW4gYnVmZmVyXG5cdFx0dmFyIE1BWF9CVUZGRVJfU0laRSA9IDEwO1xuXHRcdC8vIGJ1ZmZlciBvZiBhbHJlYWR5IGxvYWRlZCBpbWFnZXNcblx0XHR2YXIgYnVmZmVyID0gW107XG5cblx0XHQvLyB0aGUgY3VycmVudGx5IHNob3duIGltYWdlXG5cdFx0dGhpcy5jdXJyZW50SW1hZ2UgPSB1bmRlZmluZWQ7XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBuZXh0IElEIG9mIHRoZSBzcGVjaWZpZWQgaW1hZ2Ugb3IgdGhlIG5leHQgSUQgb2YgdGhlXG5cdFx0ICogY3VycmVudCBpbWFnZSBpZiBubyBpbWFnZSB3YXMgc3BlY2lmaWVkLlxuXHRcdCAqL1xuXHRcdHZhciBuZXh0SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdHZhciBpbmRleCA9IGltYWdlSWRzLmluZGV4T2YoaWQpO1xuXHRcdFx0cmV0dXJuIGltYWdlSWRzWyhpbmRleCArIDEpICUgaW1hZ2VJZHMubGVuZ3RoXTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgcHJldmlvdXMgSUQgb2YgdGhlIHNwZWNpZmllZCBpbWFnZSBvciB0aGUgcHJldmlvdXMgSUQgb2Zcblx0XHQgKiB0aGUgY3VycmVudCBpbWFnZSBpZiBubyBpbWFnZSB3YXMgc3BlY2lmaWVkLlxuXHRcdCAqL1xuXHRcdHZhciBwcmV2SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdHZhciBpbmRleCA9IGltYWdlSWRzLmluZGV4T2YoaWQpO1xuXHRcdFx0dmFyIGxlbmd0aCA9IGltYWdlSWRzLmxlbmd0aDtcblx0XHRcdHJldHVybiBpbWFnZUlkc1soaW5kZXggLSAxICsgbGVuZ3RoKSAlIGxlbmd0aF07XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIHNwZWNpZmllZCBpbWFnZSBmcm9tIHRoZSBidWZmZXIgb3IgYHVuZGVmaW5lZGAgaWYgaXQgaXNcblx0XHQgKiBub3QgYnVmZmVyZWQuXG5cdFx0ICovXG5cdFx0dmFyIGdldEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRpZCA9IGlkIHx8IF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0XHRmb3IgKHZhciBpID0gYnVmZmVyLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdGlmIChidWZmZXJbaV0uX2lkID09IGlkKSByZXR1cm4gYnVmZmVyW2ldO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTZXRzIHRoZSBzcGVjaWZpZWQgaW1hZ2UgdG8gYXMgdGhlIGN1cnJlbnRseSBzaG93biBpbWFnZS5cblx0XHQgKi9cblx0XHR2YXIgc2hvdyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0X3RoaXMuY3VycmVudEltYWdlID0gZ2V0SW1hZ2UoaWQpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBMb2FkcyB0aGUgc3BlY2lmaWVkIGltYWdlIGVpdGhlciBmcm9tIGJ1ZmZlciBvciBmcm9tIHRoZSBleHRlcm5hbFxuXHRcdCAqIHJlc291cmNlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGdldHMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXNcblx0XHQgKiBsb2FkZWQuXG5cdFx0ICovXG5cdFx0dmFyIGZldGNoSW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0XHR2YXIgaW1nID0gZ2V0SW1hZ2UoaWQpO1xuXG5cdFx0XHRpZiAoaW1nKSB7XG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW1nKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuXHRcdFx0XHRpbWcuX2lkID0gaWQ7XG5cdFx0XHRcdGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0YnVmZmVyLnB1c2goaW1nKTtcblx0XHRcdFx0XHQvLyBjb250cm9sIG1heGltdW0gYnVmZmVyIHNpemVcblx0XHRcdFx0XHRpZiAoYnVmZmVyLmxlbmd0aCA+IE1BWF9CVUZGRVJfU0laRSkge1xuXHRcdFx0XHRcdFx0YnVmZmVyLnNoaWZ0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW1nKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAobXNnKSB7XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KG1zZyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGltZy5zcmMgPSBVUkwgKyBcIi9hcGkvdjEvaW1hZ2VzL1wiICsgaWQgKyBcIi9maWxlXCI7XG5cdFx0XHR9XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnaW1hZ2UuZmV0Y2hpbmcnLCBpbWcpO1xuXG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSW5pdGlhbGl6ZXMgdGhlIHNlcnZpY2UgZm9yIGEgZ2l2ZW4gdHJhbnNlY3QuIFJldHVybnMgYSBwcm9taXNlIHRoYXRcblx0XHQgKiBpcyByZXNvbHZlZCwgd2hlbiB0aGUgc2VydmljZSBpcyBpbml0aWFsaXplZC5cblx0XHQgKi9cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpbWFnZUlkcyA9IFRyYW5zZWN0SW1hZ2UucXVlcnkoe3RyYW5zZWN0X2lkOiBUUkFOU0VDVF9JRH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBsb29rIGZvciBhIHNlcXVlbmNlIG9mIGltYWdlIElEcyBpbiBsb2NhbCBzdG9yYWdlLlxuICAgICAgICAgICAgICAgIC8vIHRoaXMgc2VxdWVuY2UgaXMgcHJvZHVjZXMgYnkgdGhlIHRyYW5zZWN0IGluZGV4IHBhZ2Ugd2hlbiB0aGUgaW1hZ2VzIGFyZVxuICAgICAgICAgICAgICAgIC8vIHNvcnRlZCBvciBmaWx0ZXJlZC4gd2Ugd2FudCB0byByZWZsZWN0IHRoZSBzYW1lIG9yZGVyaW5nIG9yIGZpbHRlcmluZyBoZXJlXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhlIGFubm90YXRvclxuICAgICAgICAgICAgICAgIHZhciBzdG9yZWRTZXF1ZW5jZSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2VbJ2RpYXMudHJhbnNlY3RzLicgKyBUUkFOU0VDVF9JRCArICcuaW1hZ2VzJ107XG4gICAgICAgICAgICAgICAgaWYgKHN0b3JlZFNlcXVlbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlID0gSlNPTi5wYXJzZShzdG9yZWRTZXF1ZW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIHN1Y2ggYSBzdG9yZWQgc2VxdWVuY2UsIGZpbHRlciBvdXQgYW55IGltYWdlIElEcyB0aGF0IGRvIG5vdFxuICAgICAgICAgICAgICAgICAgICAvLyBiZWxvbmcgdG8gdGhlIHRyYW5zZWN0IChhbnkgbW9yZSksIHNpbmNlIHNvbWUgb2YgdGhlbSBtYXkgaGF2ZSBiZWVuIGRlbGV0ZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIG1lYW50aW1lXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclN1YnNldChzdG9yZWRTZXF1ZW5jZSwgaW1hZ2VJZHMpO1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIHByb21pc2UgaXMgbm90IHJlbW92ZWQgd2hlbiBvdmVyd3JpdGluZyBpbWFnZUlkcyBzaW5jZSB3ZVxuICAgICAgICAgICAgICAgICAgICAvLyBuZWVkIGl0IGxhdGVyIG9uLlxuICAgICAgICAgICAgICAgICAgICBzdG9yZWRTZXF1ZW5jZS4kcHJvbWlzZSA9IGltYWdlSWRzLiRwcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICBzdG9yZWRTZXF1ZW5jZS4kcmVzb2x2ZWQgPSBpbWFnZUlkcy4kcmVzb2x2ZWQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZW4gc2V0IHRoZSBzdG9yZWQgc2VxdWVuY2UgYXMgdGhlIHNlcXVlbmNlIG9mIGltYWdlIElEcyBpbnN0ZWFkIG9mIHNpbXBseVxuICAgICAgICAgICAgICAgICAgICAvLyBhbGwgSURzIGJlbG9uZ2luZyB0byB0aGUgdHJhbnNlY3RcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VJZHMgPSBzdG9yZWRTZXF1ZW5jZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuXHRcdFx0cmV0dXJuIGltYWdlSWRzLiRwcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBpbWFnZSB3aXRoIHRoZSBzcGVjaWZpZWQgSUQuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXNcblx0XHQgKiByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpcyBzaG93bi5cblx0XHQgKi9cblx0XHR0aGlzLnNob3cgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBwcm9taXNlID0gZmV0Y2hJbWFnZShpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0c2hvdyhpZCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gd2FpdCBmb3IgaW1hZ2VJZHMgdG8gYmUgbG9hZGVkXG5cdFx0XHRpbWFnZUlkcy4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0Ly8gcHJlLWxvYWQgcHJldmlvdXMgYW5kIG5leHQgaW1hZ2VzIGJ1dCBkb24ndCBkaXNwbGF5IHRoZW1cblx0XHRcdFx0ZmV0Y2hJbWFnZShuZXh0SWQoaWQpKTtcblx0XHRcdFx0ZmV0Y2hJbWFnZShwcmV2SWQoaWQpKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gcHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2hvdyB0aGUgbmV4dCBpbWFnZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMubmV4dCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfdGhpcy5zaG93KG5leHRJZCgpKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2hvdyB0aGUgcHJldmlvdXMgaW1hZ2UuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXNcblx0XHQgKiByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpcyBzaG93bi5cblx0XHQgKi9cblx0XHR0aGlzLnByZXYgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3RoaXMuc2hvdyhwcmV2SWQoKSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0Q3VycmVudElkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUga2V5Ym9hcmRcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSB0byByZWdpc3RlciBhbmQgbWFuYWdlIGtleXByZXNzIGV2ZW50cyB3aXRoIHByaW9yaXRpZXNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdrZXlib2FyZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gbWFwcyBrZXkgY29kZXMvY2hhcmFjdGVycyB0byBhcnJheXMgb2YgbGlzdGVuZXJzXG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB7fTtcblxuICAgICAgICB2YXIgZXhlY3V0ZUNhbGxiYWNrcyA9IGZ1bmN0aW9uIChsaXN0LCBlKSB7XG4gICAgICAgICAgICAvLyBnbyBmcm9tIGhpZ2hlc3QgcHJpb3JpdHkgZG93blxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IGxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAvLyBjYWxsYmFja3MgY2FuIGNhbmNlbCBmdXJ0aGVyIHByb3BhZ2F0aW9uXG4gICAgICAgICAgICAgICAgaWYgKGxpc3RbaV0uY2FsbGJhY2soZSkgPT09IGZhbHNlKSByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZUtleUV2ZW50cyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgY29kZSA9IGUua2V5Q29kZTtcbiAgICAgICAgICAgIHZhciBjaGFyYWN0ZXIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGUud2hpY2ggfHwgY29kZSkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjb2RlXSkge1xuICAgICAgICAgICAgICAgIGV4ZWN1dGVDYWxsYmFja3MobGlzdGVuZXJzW2NvZGVdLCBlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjaGFyYWN0ZXJdKSB7XG4gICAgICAgICAgICAgICAgZXhlY3V0ZUNhbGxiYWNrcyhsaXN0ZW5lcnNbY2hhcmFjdGVyXSwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleUV2ZW50cyk7XG5cbiAgICAgICAgLy8gcmVnaXN0ZXIgYSBuZXcgZXZlbnQgbGlzdGVuZXIgZm9yIHRoZSBrZXkgY29kZSBvciBjaGFyYWN0ZXIgd2l0aCBhbiBvcHRpb25hbCBwcmlvcml0eVxuICAgICAgICAvLyBsaXN0ZW5lcnMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgYXJlIGNhbGxlZCBmaXJzdCBhbmMgY2FuIHJldHVybiAnZmFsc2UnIHRvIHByZXZlbnQgdGhlXG4gICAgICAgIC8vIGxpc3RlbmVycyB3aXRoIGxvd2VyIHByaW9yaXR5IGZyb20gYmVpbmcgY2FsbGVkXG4gICAgICAgIHRoaXMub24gPSBmdW5jdGlvbiAoY2hhck9yQ29kZSwgY2FsbGJhY2ssIHByaW9yaXR5KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNoYXJPckNvZGUgPT09ICdzdHJpbmcnIHx8IGNoYXJPckNvZGUgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBjaGFyT3JDb2RlID0gY2hhck9yQ29kZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcmlvcml0eSA9IHByaW9yaXR5IHx8IDA7XG4gICAgICAgICAgICB2YXIgbGlzdGVuZXIgPSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrLFxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiBwcmlvcml0eVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjaGFyT3JDb2RlXSkge1xuICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gbGlzdGVuZXJzW2NoYXJPckNvZGVdO1xuICAgICAgICAgICAgICAgIHZhciBpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RbaV0ucHJpb3JpdHkgPj0gcHJpb3JpdHkpIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpID09PSBsaXN0Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnNwbGljZShpLCAwLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyc1tjaGFyT3JDb2RlXSA9IFtsaXN0ZW5lcl07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdW5yZWdpc3RlciBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICB0aGlzLm9mZiA9IGZ1bmN0aW9uIChjaGFyT3JDb2RlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjaGFyT3JDb2RlID09PSAnc3RyaW5nJyB8fCBjaGFyT3JDb2RlIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgY2hhck9yQ29kZSA9IGNoYXJPckNvZGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjaGFyT3JDb2RlXSkge1xuICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gbGlzdGVuZXJzW2NoYXJPckNvZGVdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdFtpXS5jYWxsYmFjayA9PT0gY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbGFiZWxzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgYW5ub3RhdGlvbiBsYWJlbHMgdG8gcHJvdmlkZSBzb21lIGNvbnZlbmllbmNlIGZ1bmN0aW9ucy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdsYWJlbHMnLCBmdW5jdGlvbiAoQW5ub3RhdGlvbkxhYmVsLCBMYWJlbCwgUHJvamVjdExhYmVsLCBQcm9qZWN0LCBtc2csICRxLCBQUk9KRUNUX0lEUykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRMYWJlbDtcbiAgICAgICAgdmFyIGN1cnJlbnRDb25maWRlbmNlID0gMS4wO1xuXG4gICAgICAgIHZhciBsYWJlbHMgPSB7fTtcblxuICAgICAgICAvLyB0aGlzIHByb21pc2UgaXMgcmVzb2x2ZWQgd2hlbiBhbGwgbGFiZWxzIHdlcmUgbG9hZGVkXG4gICAgICAgIHRoaXMucHJvbWlzZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5mZXRjaEZvckFubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgaWYgKCFhbm5vdGF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIGRvbid0IGZldGNoIHR3aWNlXG4gICAgICAgICAgICBpZiAoIWFubm90YXRpb24ubGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMgPSBBbm5vdGF0aW9uTGFiZWwucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9uX2lkOiBhbm5vdGF0aW9uLmlkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhbm5vdGF0aW9uLmxhYmVscztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmF0dGFjaFRvQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSBBbm5vdGF0aW9uTGFiZWwuYXR0YWNoKHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uX2lkOiBhbm5vdGF0aW9uLmlkLFxuICAgICAgICAgICAgICAgIGxhYmVsX2lkOiBzZWxlY3RlZExhYmVsLmlkLFxuICAgICAgICAgICAgICAgIGNvbmZpZGVuY2U6IGN1cnJlbnRDb25maWRlbmNlXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGFiZWwuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMucHVzaChsYWJlbCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGFiZWwuJHByb21pc2UuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuXG4gICAgICAgICAgICByZXR1cm4gbGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yZW1vdmVGcm9tQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uLCBsYWJlbCkge1xuICAgICAgICAgICAgLy8gdXNlIGluZGV4IHRvIHNlZSBpZiB0aGUgbGFiZWwgZXhpc3RzIGZvciB0aGUgYW5ub3RhdGlvblxuICAgICAgICAgICAgdmFyIGluZGV4ID0gYW5ub3RhdGlvbi5sYWJlbHMuaW5kZXhPZihsYWJlbCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBbm5vdGF0aW9uTGFiZWwuZGVsZXRlKHtpZDogbGFiZWwuaWR9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaW5kZXggc2luY2UgdGhlIGxhYmVsIGxpc3QgbWF5IGhhdmUgYmVlbiBtb2RpZmllZFxuICAgICAgICAgICAgICAgICAgICAvLyBpbiB0aGUgbWVhbnRpbWVcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBhbm5vdGF0aW9uLmxhYmVscy5pbmRleE9mKGxhYmVsKTtcbiAgICAgICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB9LCBtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRUcmVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7fTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBudWxsO1xuICAgICAgICAgICAgdmFyIGJ1aWxkID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGxhYmVsLnBhcmVudF9pZDtcbiAgICAgICAgICAgICAgICBpZiAodHJlZVtrZXldW3BhcmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZVtrZXldW3BhcmVudF0ucHVzaChsYWJlbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZVtrZXldW3BhcmVudF0gPSBbbGFiZWxdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucHJvbWlzZS50aGVuKGZ1bmN0aW9uIChsYWJlbHMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBsYWJlbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZVtrZXldID0ge307XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsc1trZXldLmZvckVhY2goYnVpbGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJlZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBsYWJlbHM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRTZWxlY3RlZCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgc2VsZWN0ZWRMYWJlbCA9IGxhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0U2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0ZWRMYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc1NlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhc2VsZWN0ZWRMYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldEN1cnJlbnRDb25maWRlbmNlID0gZnVuY3Rpb24gKGNvbmZpZGVuY2UpIHtcbiAgICAgICAgICAgIGN1cnJlbnRDb25maWRlbmNlID0gY29uZmlkZW5jZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEN1cnJlbnRDb25maWRlbmNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRDb25maWRlbmNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGluaXRcbiAgICAgICAgKGZ1bmN0aW9uIChfdGhpcykge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIF90aGlzLnByb21pc2UgPSBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICAgICAgLy8gLTEgYmVjYXVzZSBvZiBnbG9iYWwgbGFiZWxzXG4gICAgICAgICAgICB2YXIgZmluaXNoZWQgPSAtMTtcblxuICAgICAgICAgICAgLy8gY2hlY2sgaWYgYWxsIGxhYmVscyBhcmUgdGhlcmUuIGlmIHllcywgcmVzb2x2ZVxuICAgICAgICAgICAgdmFyIG1heWJlUmVzb2x2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoKytmaW5pc2hlZCA9PT0gUFJPSkVDVF9JRFMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUobGFiZWxzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBsYWJlbHNbbnVsbF0gPSBMYWJlbC5xdWVyeShtYXliZVJlc29sdmUpO1xuXG4gICAgICAgICAgICBQUk9KRUNUX0lEUy5mb3JFYWNoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICAgIFByb2plY3QuZ2V0KHtpZDogaWR9LCBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbHNbcHJvamVjdC5uYW1lXSA9IFByb2plY3RMYWJlbC5xdWVyeSh7cHJvamVjdF9pZDogaWR9LCBtYXliZVJlc29sdmUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKHRoaXMpO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG1hcEFubm90YXRpb25zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBoYW5kbGluZyB0aGUgYW5ub3RhdGlvbnMgbGF5ZXIgb24gdGhlIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnbWFwQW5ub3RhdGlvbnMnLCBmdW5jdGlvbiAobWFwLCBpbWFnZXMsIGFubm90YXRpb25zLCBkZWJvdW5jZSwgc3R5bGVzLCAkaW50ZXJ2YWwsIGxhYmVscykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBhbm5vdGF0aW9uRmVhdHVyZXMgPSBuZXcgb2wuQ29sbGVjdGlvbigpO1xuICAgICAgICB2YXIgYW5ub3RhdGlvblNvdXJjZSA9IG5ldyBvbC5zb3VyY2UuVmVjdG9yKHtcbiAgICAgICAgICAgIGZlYXR1cmVzOiBhbm5vdGF0aW9uRmVhdHVyZXNcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBhbm5vdGF0aW9uTGF5ZXIgPSBuZXcgb2wubGF5ZXIuVmVjdG9yKHtcbiAgICAgICAgICAgIHNvdXJjZTogYW5ub3RhdGlvblNvdXJjZSxcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZXMuZmVhdHVyZXMsXG4gICAgICAgICAgICB6SW5kZXg6IDEwMFxuICAgICAgICB9KTtcblxuXHRcdC8vIHNlbGVjdCBpbnRlcmFjdGlvbiB3b3JraW5nIG9uIFwic2luZ2xlY2xpY2tcIlxuXHRcdHZhciBzZWxlY3QgPSBuZXcgb2wuaW50ZXJhY3Rpb24uU2VsZWN0KHtcblx0XHRcdHN0eWxlOiBzdHlsZXMuaGlnaGxpZ2h0LFxuICAgICAgICAgICAgbGF5ZXJzOiBbYW5ub3RhdGlvbkxheWVyXSxcbiAgICAgICAgICAgIC8vIGVuYWJsZSBzZWxlY3RpbmcgbXVsdGlwbGUgb3ZlcmxhcHBpbmcgZmVhdHVyZXMgYXQgb25jZVxuICAgICAgICAgICAgbXVsdGk6IHRydWVcblx0XHR9KTtcblxuXHRcdHZhciBzZWxlY3RlZEZlYXR1cmVzID0gc2VsZWN0LmdldEZlYXR1cmVzKCk7XG5cblx0XHR2YXIgbW9kaWZ5ID0gbmV3IG9sLmludGVyYWN0aW9uLk1vZGlmeSh7XG5cdFx0XHRmZWF0dXJlczogYW5ub3RhdGlvbkZlYXR1cmVzLFxuXHRcdFx0Ly8gdGhlIFNISUZUIGtleSBtdXN0IGJlIHByZXNzZWQgdG8gZGVsZXRlIHZlcnRpY2VzLCBzb1xuXHRcdFx0Ly8gdGhhdCBuZXcgdmVydGljZXMgY2FuIGJlIGRyYXduIGF0IHRoZSBzYW1lIHBvc2l0aW9uXG5cdFx0XHQvLyBvZiBleGlzdGluZyB2ZXJ0aWNlc1xuXHRcdFx0ZGVsZXRlQ29uZGl0aW9uOiBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRyZXR1cm4gb2wuZXZlbnRzLmNvbmRpdGlvbi5zaGlmdEtleU9ubHkoZXZlbnQpICYmIG9sLmV2ZW50cy5jb25kaXRpb24uc2luZ2xlQ2xpY2soZXZlbnQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG4gICAgICAgIG1vZGlmeS5zZXRBY3RpdmUoZmFsc2UpO1xuXG4gICAgICAgIHZhciB0cmFuc2xhdGUgPSBuZXcgb2wuaW50ZXJhY3Rpb24uVHJhbnNsYXRlKHtcbiAgICAgICAgICAgIGZlYXR1cmVzOiBzZWxlY3RlZEZlYXR1cmVzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyYW5zbGF0ZS5zZXRBY3RpdmUoZmFsc2UpO1xuXG5cdFx0Ly8gZHJhd2luZyBpbnRlcmFjdGlvblxuXHRcdHZhciBkcmF3O1xuICAgICAgICAvLyB0eXBlL3NoYXBlIG9mIHRoZSBkcmF3aW5nIGludGVyYWN0aW9uXG4gICAgICAgIHZhciBkcmF3aW5nVHlwZTtcblxuICAgICAgICAvLyBpbmRleCBvZiB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGFubm90YXRpb24gKGR1cmluZyBjeWNsaW5nIHRocm91Z2ggYW5ub3RhdGlvbnMpXG4gICAgICAgIC8vIGluIHRoZSBhbm5vdGF0aW9uRmVhdHVyZXMgY29sbGVjdGlvblxuICAgICAgICB2YXIgY3VycmVudEFubm90YXRpb25JbmRleCA9IDA7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB2YXIgc2VsZWN0QW5kU2hvd0Fubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIGlmIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRGZWF0dXJlcy5wdXNoKGFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIG1hcC5nZXRWaWV3KCkuZml0KGFubm90YXRpb24uZ2V0R2VvbWV0cnkoKSwgbWFwLmdldFNpemUoKSwge1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiBbNTAsIDUwLCA1MCwgNTBdXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cblx0XHQvLyBjb252ZXJ0IGEgcG9pbnQgYXJyYXkgdG8gYSBwb2ludCBvYmplY3Rcblx0XHQvLyByZS1pbnZlcnQgdGhlIHkgYXhpc1xuXHRcdHZhciBjb252ZXJ0RnJvbU9MUG9pbnQgPSBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdHJldHVybiB7eDogcG9pbnRbMF0sIHk6IGltYWdlcy5jdXJyZW50SW1hZ2UuaGVpZ2h0IC0gcG9pbnRbMV19O1xuXHRcdH07XG5cblx0XHQvLyBjb252ZXJ0IGEgcG9pbnQgb2JqZWN0IHRvIGEgcG9pbnQgYXJyYXlcblx0XHQvLyBpbnZlcnQgdGhlIHkgYXhpc1xuXHRcdHZhciBjb252ZXJ0VG9PTFBvaW50ID0gZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRyZXR1cm4gW3BvaW50LngsIGltYWdlcy5jdXJyZW50SW1hZ2UuaGVpZ2h0IC0gcG9pbnQueV07XG5cdFx0fTtcblxuXHRcdC8vIGFzc2VtYmxlcyB0aGUgY29vcmRpbmF0ZSBhcnJheXMgZGVwZW5kaW5nIG9uIHRoZSBnZW9tZXRyeSB0eXBlXG5cdFx0Ly8gc28gdGhleSBoYXZlIGEgdW5pZmllZCBmb3JtYXRcblx0XHR2YXIgZ2V0Q29vcmRpbmF0ZXMgPSBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcblx0XHRcdHN3aXRjaCAoZ2VvbWV0cnkuZ2V0VHlwZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ0NpcmNsZSc6XG5cdFx0XHRcdFx0Ly8gcmFkaXVzIGlzIHRoZSB4IHZhbHVlIG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGNpcmNsZVxuXHRcdFx0XHRcdHJldHVybiBbZ2VvbWV0cnkuZ2V0Q2VudGVyKCksIFtnZW9tZXRyeS5nZXRSYWRpdXMoKSwgMF1dO1xuXHRcdFx0XHRjYXNlICdQb2x5Z29uJzpcblx0XHRcdFx0Y2FzZSAnUmVjdGFuZ2xlJzpcblx0XHRcdFx0XHRyZXR1cm4gZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKVswXTtcblx0XHRcdFx0Y2FzZSAnUG9pbnQnOlxuXHRcdFx0XHRcdHJldHVybiBbZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKV07XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0cmV0dXJuIGdlb21ldHJ5LmdldENvb3JkaW5hdGVzKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIHNhdmVzIHRoZSB1cGRhdGVkIGdlb21ldHJ5IG9mIGFuIGFubm90YXRpb24gZmVhdHVyZVxuXHRcdHZhciBoYW5kbGVHZW9tZXRyeUNoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgZmVhdHVyZSA9IGUudGFyZ2V0O1xuXHRcdFx0dmFyIHNhdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHZhciBjb29yZGluYXRlcyA9IGdldENvb3JkaW5hdGVzKGZlYXR1cmUuZ2V0R2VvbWV0cnkoKSk7XG5cdFx0XHRcdGZlYXR1cmUuYW5ub3RhdGlvbi5wb2ludHMgPSBjb29yZGluYXRlcy5tYXAoY29udmVydEZyb21PTFBvaW50KTtcblx0XHRcdFx0ZmVhdHVyZS5hbm5vdGF0aW9uLiRzYXZlKCk7XG5cdFx0XHR9O1xuXHRcdFx0Ly8gdGhpcyBldmVudCBpcyByYXBpZGx5IGZpcmVkLCBzbyB3YWl0IHVudGlsIHRoZSBmaXJpbmcgc3RvcHNcblx0XHRcdC8vIGJlZm9yZSBzYXZpbmcgdGhlIGNoYW5nZXNcblx0XHRcdGRlYm91bmNlKHNhdmUsIDUwMCwgZmVhdHVyZS5hbm5vdGF0aW9uLmlkKTtcblx0XHR9O1xuXG5cdFx0dmFyIGNyZWF0ZUZlYXR1cmUgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0dmFyIGdlb21ldHJ5O1xuXHRcdFx0dmFyIHBvaW50cyA9IGFubm90YXRpb24ucG9pbnRzLm1hcChjb252ZXJ0VG9PTFBvaW50KTtcblxuXHRcdFx0c3dpdGNoIChhbm5vdGF0aW9uLnNoYXBlKSB7XG5cdFx0XHRcdGNhc2UgJ1BvaW50Jzpcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlBvaW50KHBvaW50c1swXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ1JlY3RhbmdsZSc6XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5SZWN0YW5nbGUoWyBwb2ludHMgXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ1BvbHlnb24nOlxuXHRcdFx0XHRcdC8vIGV4YW1wbGU6IGh0dHBzOi8vZ2l0aHViLmNvbS9vcGVubGF5ZXJzL29sMy9ibG9iL21hc3Rlci9leGFtcGxlcy9nZW9qc29uLmpzI0wxMjZcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlBvbHlnb24oWyBwb2ludHMgXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0xpbmVTdHJpbmcnOlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uTGluZVN0cmluZyhwb2ludHMpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdDaXJjbGUnOlxuXHRcdFx0XHRcdC8vIHJhZGl1cyBpcyB0aGUgeCB2YWx1ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjaXJjbGVcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLkNpcmNsZShwb2ludHNbMF0sIHBvaW50c1sxXVswXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gdW5zdXBwb3J0ZWQgc2hhcGVzIGFyZSBpZ25vcmVkXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVW5rbm93biBhbm5vdGF0aW9uIHNoYXBlOiAnICsgYW5ub3RhdGlvbi5zaGFwZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGZlYXR1cmUgPSBuZXcgb2wuRmVhdHVyZSh7IGdlb21ldHJ5OiBnZW9tZXRyeSB9KTtcbiAgICAgICAgICAgIGZlYXR1cmUuYW5ub3RhdGlvbiA9IGFubm90YXRpb247XG4gICAgICAgICAgICBpZiAoYW5ub3RhdGlvbi5sYWJlbHMgJiYgYW5ub3RhdGlvbi5sYWJlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGZlYXR1cmUuY29sb3IgPSBhbm5vdGF0aW9uLmxhYmVsc1swXS5sYWJlbC5jb2xvcjtcbiAgICAgICAgICAgIH1cblx0XHRcdGZlYXR1cmUub24oJ2NoYW5nZScsIGhhbmRsZUdlb21ldHJ5Q2hhbmdlKTtcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuYWRkRmVhdHVyZShmZWF0dXJlKTtcblx0XHR9O1xuXG5cdFx0dmFyIHJlZnJlc2hBbm5vdGF0aW9ucyA9IGZ1bmN0aW9uIChlLCBpbWFnZSkge1xuXHRcdFx0Ly8gY2xlYXIgZmVhdHVyZXMgb2YgcHJldmlvdXMgaW1hZ2VcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuY2xlYXIoKTtcblx0XHRcdF90aGlzLmNsZWFyU2VsZWN0aW9uKCk7XG5cblx0XHRcdGFubm90YXRpb25zLnF1ZXJ5KHtpZDogaW1hZ2UuX2lkfSkuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGFubm90YXRpb25zLmZvckVhY2goY3JlYXRlRmVhdHVyZSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dmFyIGhhbmRsZU5ld0ZlYXR1cmUgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIGdlb21ldHJ5ID0gZS5mZWF0dXJlLmdldEdlb21ldHJ5KCk7XG5cdFx0XHR2YXIgY29vcmRpbmF0ZXMgPSBnZXRDb29yZGluYXRlcyhnZW9tZXRyeSk7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSBsYWJlbHMuZ2V0U2VsZWN0ZWQoKTtcblxuICAgICAgICAgICAgZS5mZWF0dXJlLmNvbG9yID0gbGFiZWwuY29sb3I7XG5cblx0XHRcdGUuZmVhdHVyZS5hbm5vdGF0aW9uID0gYW5ub3RhdGlvbnMuYWRkKHtcblx0XHRcdFx0aWQ6IGltYWdlcy5nZXRDdXJyZW50SWQoKSxcblx0XHRcdFx0c2hhcGU6IGdlb21ldHJ5LmdldFR5cGUoKSxcblx0XHRcdFx0cG9pbnRzOiBjb29yZGluYXRlcy5tYXAoY29udmVydEZyb21PTFBvaW50KSxcbiAgICAgICAgICAgICAgICBsYWJlbF9pZDogbGFiZWwuaWQsXG4gICAgICAgICAgICAgICAgY29uZmlkZW5jZTogbGFiZWxzLmdldEN1cnJlbnRDb25maWRlbmNlKClcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBpZiB0aGUgZmVhdHVyZSBjb3VsZG4ndCBiZSBzYXZlZCwgcmVtb3ZlIGl0IGFnYWluXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbi4kcHJvbWlzZS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5yZW1vdmVGZWF0dXJlKGUuZmVhdHVyZSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0ZS5mZWF0dXJlLm9uKCdjaGFuZ2UnLCBoYW5kbGVHZW9tZXRyeUNoYW5nZSk7XG5cbiAgICAgICAgICAgIHJldHVybiBlLmZlYXR1cmUuYW5ub3RhdGlvbi4kcHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBtYXAuYWRkTGF5ZXIoYW5ub3RhdGlvbkxheWVyKTtcblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihzZWxlY3QpO1xuICAgICAgICAgICAgbWFwLmFkZEludGVyYWN0aW9uKHRyYW5zbGF0ZSk7XG4gICAgICAgICAgICBtYXAuYWRkSW50ZXJhY3Rpb24obW9kaWZ5KTtcblx0XHRcdHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCByZWZyZXNoQW5ub3RhdGlvbnMpO1xuXG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLm9uKCdjaGFuZ2U6bGVuZ3RoJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyBpZiBub3QgYWxyZWFkeSBkaWdlc3RpbmcsIGRpZ2VzdFxuXHRcdFx0XHRpZiAoIXNjb3BlLiQkcGhhc2UpIHtcblx0XHRcdFx0XHQvLyBwcm9wYWdhdGUgbmV3IHNlbGVjdGlvbnMgdGhyb3VnaCB0aGUgYW5ndWxhciBhcHBsaWNhdGlvblxuXHRcdFx0XHRcdHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5zdGFydERyYXdpbmcgPSBmdW5jdGlvbiAodHlwZSkge1xuICAgICAgICAgICAgc2VsZWN0LnNldEFjdGl2ZShmYWxzZSk7XG4gICAgICAgICAgICBtb2RpZnkuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICAgICAgX3RoaXMuZmluaXNoTW92aW5nKCk7XG4gICAgICAgICAgICAvLyBhbGxvdyBvbmx5IG9uZSBkcmF3IGludGVyYWN0aW9uIGF0IGEgdGltZVxuICAgICAgICAgICAgbWFwLnJlbW92ZUludGVyYWN0aW9uKGRyYXcpO1xuXG5cdFx0XHRkcmF3aW5nVHlwZSA9IHR5cGUgfHwgJ1BvaW50Jztcblx0XHRcdGRyYXcgPSBuZXcgb2wuaW50ZXJhY3Rpb24uRHJhdyh7XG4gICAgICAgICAgICAgICAgc291cmNlOiBhbm5vdGF0aW9uU291cmNlLFxuXHRcdFx0XHR0eXBlOiBkcmF3aW5nVHlwZSxcblx0XHRcdFx0c3R5bGU6IHN0eWxlcy5lZGl0aW5nXG5cdFx0XHR9KTtcblxuXHRcdFx0bWFwLmFkZEludGVyYWN0aW9uKGRyYXcpO1xuXHRcdFx0ZHJhdy5vbignZHJhd2VuZCcsIGhhbmRsZU5ld0ZlYXR1cmUpO1xuXHRcdH07XG5cblx0XHR0aGlzLmZpbmlzaERyYXdpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtYXAucmVtb3ZlSW50ZXJhY3Rpb24oZHJhdyk7XG4gICAgICAgICAgICBkcmF3LnNldEFjdGl2ZShmYWxzZSk7XG4gICAgICAgICAgICBkcmF3aW5nVHlwZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHNlbGVjdC5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgICAgICBtb2RpZnkuc2V0QWN0aXZlKGZhbHNlKTtcblx0XHRcdC8vIGRvbid0IHNlbGVjdCB0aGUgbGFzdCBkcmF3biBwb2ludFxuXHRcdFx0X3RoaXMuY2xlYXJTZWxlY3Rpb24oKTtcblx0XHR9O1xuXG4gICAgICAgIHRoaXMuaXNEcmF3aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRyYXcgJiYgZHJhdy5nZXRBY3RpdmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnN0YXJ0TW92aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLmlzRHJhd2luZygpKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuZmluaXNoRHJhd2luZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJhbnNsYXRlLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmZpbmlzaE1vdmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRyYW5zbGF0ZS5zZXRBY3RpdmUoZmFsc2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaXNNb3ZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJhbnNsYXRlLmdldEFjdGl2ZSgpO1xuICAgICAgICB9O1xuXG5cdFx0dGhpcy5kZWxldGVTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoZmVhdHVyZSkge1xuXHRcdFx0XHRhbm5vdGF0aW9ucy5kZWxldGUoZmVhdHVyZS5hbm5vdGF0aW9uKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRhbm5vdGF0aW9uU291cmNlLnJlbW92ZUZlYXR1cmUoZmVhdHVyZSk7XG5cdFx0XHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5yZW1vdmUoZmVhdHVyZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuc2VsZWN0ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgZmVhdHVyZTtcblx0XHRcdGFubm90YXRpb25Tb3VyY2UuZm9yRWFjaEZlYXR1cmUoZnVuY3Rpb24gKGYpIHtcblx0XHRcdFx0aWYgKGYuYW5ub3RhdGlvbi5pZCA9PT0gaWQpIHtcblx0XHRcdFx0XHRmZWF0dXJlID0gZjtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyByZW1vdmUgc2VsZWN0aW9uIGlmIGZlYXR1cmUgd2FzIGFscmVhZHkgc2VsZWN0ZWQuIG90aGVyd2lzZSBzZWxlY3QuXG5cdFx0XHRpZiAoIXNlbGVjdGVkRmVhdHVyZXMucmVtb3ZlKGZlYXR1cmUpKSB7XG5cdFx0XHRcdHNlbGVjdGVkRmVhdHVyZXMucHVzaChmZWF0dXJlKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIC8vIGZpdHMgdGhlIHZpZXcgdG8gdGhlIGdpdmVuIGZlYXR1cmVcbiAgICAgICAgdGhpcy5maXQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuZm9yRWFjaEZlYXR1cmUoZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgICAgICAgICBpZiAoZi5hbm5vdGF0aW9uLmlkID09PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBhbmltYXRlIGZpdFxuICAgICAgICAgICAgICAgICAgICB2YXIgdmlldyA9IG1hcC5nZXRWaWV3KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYW4gPSBvbC5hbmltYXRpb24ucGFuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogdmlldy5nZXRDZW50ZXIoKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHpvb20gPSBvbC5hbmltYXRpb24uem9vbSh7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHV0aW9uOiB2aWV3LmdldFJlc29sdXRpb24oKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgbWFwLmJlZm9yZVJlbmRlcihwYW4sIHpvb20pO1xuICAgICAgICAgICAgICAgICAgICB2aWV3LmZpdChmLmdldEdlb21ldHJ5KCksIG1hcC5nZXRTaXplKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG5cdFx0dGhpcy5jbGVhclNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuY2xlYXIoKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRTZWxlY3RlZEZlYXR1cmVzID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHNlbGVjdGVkRmVhdHVyZXM7XG5cdFx0fTtcblxuICAgICAgICB0aGlzLmdldFNlbGVjdGVkRHJhd2luZ1R5cGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZHJhd2luZ1R5cGU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gbWFudWFsbHkgYWRkIGEgbmV3IGZlYXR1cmUgKG5vdCB0aHJvdWdoIHRoZSBkcmF3IGludGVyYWN0aW9uKVxuICAgICAgICB0aGlzLmFkZEZlYXR1cmUgPSBmdW5jdGlvbiAoZmVhdHVyZSkge1xuICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5hZGRGZWF0dXJlKGZlYXR1cmUpO1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZU5ld0ZlYXR1cmUoe2ZlYXR1cmU6IGZlYXR1cmV9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldE9wYWNpdHkgPSBmdW5jdGlvbiAob3BhY2l0eSkge1xuICAgICAgICAgICAgYW5ub3RhdGlvbkxheWVyLnNldE9wYWNpdHkob3BhY2l0eSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5jeWNsZU5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjdXJyZW50QW5ub3RhdGlvbkluZGV4ID0gKGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggKyAxKSAlIGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKTtcbiAgICAgICAgICAgIF90aGlzLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc05leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggKyAxKSA8IGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmN5Y2xlUHJldmlvdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyB3ZSB3YW50IG5vIG5lZ2F0aXZlIGluZGV4IGhlcmVcbiAgICAgICAgICAgIGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggPSAoY3VycmVudEFubm90YXRpb25JbmRleCArIGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKSAtIDEpICUgYW5ub3RhdGlvbkZlYXR1cmVzLmdldExlbmd0aCgpO1xuICAgICAgICAgICAgX3RoaXMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzUHJldmlvdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudEFubm90YXRpb25JbmRleCA+IDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5qdW1wVG9DdXJyZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gb25seSBqdW1wIG9uY2UgdGhlIGFubm90YXRpb25zIHdlcmUgbG9hZGVkXG4gICAgICAgICAgICBhbm5vdGF0aW9ucy5nZXRQcm9taXNlKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0QW5kU2hvd0Fubm90YXRpb24oYW5ub3RhdGlvbkZlYXR1cmVzLml0ZW0oY3VycmVudEFubm90YXRpb25JbmRleCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5qdW1wVG9GaXJzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggPSAwO1xuICAgICAgICAgICAgX3RoaXMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuanVtcFRvTGFzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFubm90YXRpb25zLmdldFByb21pc2UoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyB3YWl0IGZvciB0aGUgbmV3IGFubm90YXRpb25zIHRvIGJlIGxvYWRlZFxuICAgICAgICAgICAgICAgIGlmIChhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCkgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEFubm90YXRpb25JbmRleCA9IGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKSAtIDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF90aGlzLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGZsaWNrZXIgdGhlIGhpZ2hsaWdodGVkIGFubm90YXRpb24gdG8gc2lnbmFsIGFuIGVycm9yXG4gICAgICAgIHRoaXMuZmxpY2tlciA9IGZ1bmN0aW9uIChjb3VudCkge1xuICAgICAgICAgICAgdmFyIGFubm90YXRpb24gPSBzZWxlY3RlZEZlYXR1cmVzLml0ZW0oMCk7XG4gICAgICAgICAgICBpZiAoIWFubm90YXRpb24pIHJldHVybjtcbiAgICAgICAgICAgIGNvdW50ID0gY291bnQgfHwgMztcblxuICAgICAgICAgICAgdmFyIHRvZ2dsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWRGZWF0dXJlcy5nZXRMZW5ndGgoKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRGZWF0dXJlcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkRmVhdHVyZXMucHVzaChhbm5vdGF0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gbnVtYmVyIG9mIHJlcGVhdHMgbXVzdCBiZSBldmVuLCBvdGhlcndpc2UgdGhlIGxheWVyIHdvdWxkIHN0YXkgb252aXNpYmxlXG4gICAgICAgICAgICAkaW50ZXJ2YWwodG9nZ2xlLCAxMDAsIGNvdW50ICogMik7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRDdXJyZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFubm90YXRpb25GZWF0dXJlcy5pdGVtKGN1cnJlbnRBbm5vdGF0aW9uSW5kZXgpLmFubm90YXRpb247XG4gICAgICAgIH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG1hcEltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBoYW5kbGluZyB0aGUgaW1hZ2UgbGF5ZXIgb24gdGhlIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnbWFwSW1hZ2UnLCBmdW5jdGlvbiAobWFwKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cdFx0dmFyIGV4dGVudCA9IFswLCAwLCAwLCAwXTtcblxuXHRcdHZhciBwcm9qZWN0aW9uID0gbmV3IG9sLnByb2ouUHJvamVjdGlvbih7XG5cdFx0XHRjb2RlOiAnZGlhcy1pbWFnZScsXG5cdFx0XHR1bml0czogJ3BpeGVscycsXG5cdFx0XHRleHRlbnQ6IGV4dGVudFxuXHRcdH0pO1xuXG5cdFx0dmFyIGltYWdlTGF5ZXIgPSBuZXcgb2wubGF5ZXIuSW1hZ2UoKTtcblxuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uIChzY29wZSkge1xuXHRcdFx0bWFwLmFkZExheWVyKGltYWdlTGF5ZXIpO1xuXG5cdFx0XHQvLyByZWZyZXNoIHRoZSBpbWFnZSBzb3VyY2Vcblx0XHRcdHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCBmdW5jdGlvbiAoZSwgaW1hZ2UpIHtcblx0XHRcdFx0ZXh0ZW50WzJdID0gaW1hZ2Uud2lkdGg7XG5cdFx0XHRcdGV4dGVudFszXSA9IGltYWdlLmhlaWdodDtcblxuXHRcdFx0XHR2YXIgem9vbSA9IHNjb3BlLnZpZXdwb3J0Lnpvb207XG5cblx0XHRcdFx0dmFyIGNlbnRlciA9IHNjb3BlLnZpZXdwb3J0LmNlbnRlcjtcblx0XHRcdFx0Ly8gdmlld3BvcnQgY2VudGVyIGlzIHN0aWxsIHVuaW5pdGlhbGl6ZWRcblx0XHRcdFx0aWYgKGNlbnRlclswXSA9PT0gdW5kZWZpbmVkICYmIGNlbnRlclsxXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0Y2VudGVyID0gb2wuZXh0ZW50LmdldENlbnRlcihleHRlbnQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGltYWdlU3RhdGljID0gbmV3IG9sLnNvdXJjZS5JbWFnZVN0YXRpYyh7XG5cdFx0XHRcdFx0dXJsOiBpbWFnZS5zcmMsXG5cdFx0XHRcdFx0cHJvamVjdGlvbjogcHJvamVjdGlvbixcblx0XHRcdFx0XHRpbWFnZUV4dGVudDogZXh0ZW50XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGltYWdlTGF5ZXIuc2V0U291cmNlKGltYWdlU3RhdGljKTtcblxuXHRcdFx0XHRtYXAuc2V0VmlldyhuZXcgb2wuVmlldyh7XG5cdFx0XHRcdFx0cHJvamVjdGlvbjogcHJvamVjdGlvbixcblx0XHRcdFx0XHRjZW50ZXI6IGNlbnRlcixcblx0XHRcdFx0XHR6b29tOiB6b29tLFxuXHRcdFx0XHRcdHpvb21GYWN0b3I6IDEuNSxcblx0XHRcdFx0XHQvLyBhbGxvdyBhIG1heGltdW0gb2YgNHggbWFnbmlmaWNhdGlvblxuXHRcdFx0XHRcdG1pblJlc29sdXRpb246IDAuMjUsXG5cdFx0XHRcdFx0Ly8gcmVzdHJpY3QgbW92ZW1lbnRcblx0XHRcdFx0XHRleHRlbnQ6IGV4dGVudFxuXHRcdFx0XHR9KSk7XG5cblx0XHRcdFx0Ly8gaWYgem9vbSBpcyBub3QgaW5pdGlhbGl6ZWQsIGZpdCB0aGUgdmlldyB0byB0aGUgaW1hZ2UgZXh0ZW50XG5cdFx0XHRcdGlmICh6b29tID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRtYXAuZ2V0VmlldygpLmZpdChleHRlbnQsIG1hcC5nZXRTaXplKCkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRFeHRlbnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gZXh0ZW50O1xuXHRcdH07XG5cblx0XHR0aGlzLmdldFByb2plY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gcHJvamVjdGlvbjtcblx0XHR9O1xuXG4gICAgICAgIHRoaXMuZ2V0TGF5ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VMYXllcjtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgc3R5bGVzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgdGhlIE9wZW5MYXllcnMgc3R5bGVzXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnc3R5bGVzJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5jb2xvcnMgPSB7XG4gICAgICAgICAgICB3aGl0ZTogWzI1NSwgMjU1LCAyNTUsIDFdLFxuICAgICAgICAgICAgYmx1ZTogWzAsIDE1MywgMjU1LCAxXSxcbiAgICAgICAgICAgIG9yYW5nZTogJyNmZjVlMDAnXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGRlZmF1bHRDaXJjbGVSYWRpdXMgPSA2O1xuICAgICAgICB2YXIgZGVmYXVsdFN0cm9rZVdpZHRoID0gMztcblxuICAgICAgICB2YXIgZGVmYXVsdFN0cm9rZU91dGxpbmUgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcbiAgICAgICAgICAgIHdpZHRoOiA1XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZFN0cm9rZU91dGxpbmUgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcbiAgICAgICAgICAgIHdpZHRoOiA2XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBkZWZhdWx0U3Ryb2tlID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMuYmx1ZSxcbiAgICAgICAgICAgIHdpZHRoOiBkZWZhdWx0U3Ryb2tlV2lkdGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkU3Ryb2tlID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMub3JhbmdlLFxuICAgICAgICAgICAgd2lkdGg6IGRlZmF1bHRTdHJva2VXaWR0aFxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZGVmYXVsdENpcmNsZUZpbGwgPSBuZXcgb2wuc3R5bGUuRmlsbCh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMuYmx1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRDaXJjbGVGaWxsID0gbmV3IG9sLnN0eWxlLkZpbGwoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLm9yYW5nZVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZGVmYXVsdENpcmNsZVN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgd2lkdGg6IDJcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkQ2lyY2xlU3Ryb2tlID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICB3aWR0aDogZGVmYXVsdFN0cm9rZVdpZHRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBlZGl0aW5nQ2lyY2xlU3Ryb2tlID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICB3aWR0aDogMixcbiAgICAgICAgICAgIGxpbmVEYXNoOiBbM11cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGVkaXRpbmdTdHJva2UgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlLFxuICAgICAgICAgICAgd2lkdGg6IGRlZmF1bHRTdHJva2VXaWR0aCxcbiAgICAgICAgICAgIGxpbmVEYXNoOiBbNV1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRGaWxsID0gbmV3IG9sLnN0eWxlLkZpbGwoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLmJsdWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkRmlsbCA9IG5ldyBvbC5zdHlsZS5GaWxsKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5vcmFuZ2VcbiAgICAgICAgfSk7XG5cblx0XHR0aGlzLmZlYXR1cmVzID0gZnVuY3Rpb24gKGZlYXR1cmUpIHtcbiAgICAgICAgICAgIHZhciBjb2xvciA9IGZlYXR1cmUuY29sb3IgPyAoJyMnICsgZmVhdHVyZS5jb2xvcikgOiBfdGhpcy5jb2xvcnMuYmx1ZTtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgbmV3IG9sLnN0eWxlLlN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOiBkZWZhdWx0U3Ryb2tlT3V0bGluZSxcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmFkaXVzOiBkZWZhdWx0Q2lyY2xlUmFkaXVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDogbmV3IG9sLnN0eWxlLkZpbGwoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBjb2xvclxuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJva2U6IGRlZmF1bHRDaXJjbGVTdHJva2VcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgb2wuc3R5bGUuU3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICBzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGNvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDNcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgXTtcbiAgICAgICAgfTtcblxuXHRcdHRoaXMuaGlnaGxpZ2h0ID0gW1xuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBzZWxlY3RlZFN0cm9rZU91dGxpbmUsXG5cdFx0XHRcdGltYWdlOiBuZXcgb2wuc3R5bGUuQ2lyY2xlKHtcblx0XHRcdFx0XHRyYWRpdXM6IGRlZmF1bHRDaXJjbGVSYWRpdXMsXG5cdFx0XHRcdFx0ZmlsbDogc2VsZWN0ZWRDaXJjbGVGaWxsLFxuXHRcdFx0XHRcdHN0cm9rZTogc2VsZWN0ZWRDaXJjbGVTdHJva2Vcblx0XHRcdFx0fSksXG4gICAgICAgICAgICAgICAgekluZGV4OiAyMDBcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBzZWxlY3RlZFN0cm9rZSxcbiAgICAgICAgICAgICAgICB6SW5kZXg6IDIwMFxuXHRcdFx0fSlcblx0XHRdO1xuXG5cdFx0dGhpcy5lZGl0aW5nID0gW1xuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBkZWZhdWx0U3Ryb2tlT3V0bGluZSxcblx0XHRcdFx0aW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0XHRcdHJhZGl1czogZGVmYXVsdENpcmNsZVJhZGl1cyxcblx0XHRcdFx0XHRmaWxsOiBkZWZhdWx0Q2lyY2xlRmlsbCxcblx0XHRcdFx0XHRzdHJva2U6IGVkaXRpbmdDaXJjbGVTdHJva2Vcblx0XHRcdFx0fSlcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBlZGl0aW5nU3Ryb2tlXG5cdFx0XHR9KVxuXHRcdF07XG5cblx0XHR0aGlzLnZpZXdwb3J0ID0gW1xuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBkZWZhdWx0U3Ryb2tlLFxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxXG4gICAgICAgICAgICAgICAgfSlcblx0XHRcdH0pXG5cdFx0XTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgdXJsUGFyYW1zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFRoZSBHRVQgcGFyYW1ldGVycyBvZiB0aGUgdXJsLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ3VybFBhcmFtcycsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBzdGF0ZSA9IHt9O1xuXG5cdFx0Ly8gdHJhbnNmb3JtcyBhIFVSTCBwYXJhbWV0ZXIgc3RyaW5nIGxpa2UgI2E9MSZiPTIgdG8gYW4gb2JqZWN0XG5cdFx0dmFyIGRlY29kZVN0YXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHBhcmFtcyA9IGxvY2F0aW9uLmhhc2gucmVwbGFjZSgnIycsICcnKVxuXHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJyYnKTtcblxuXHRcdFx0dmFyIHN0YXRlID0ge307XG5cblx0XHRcdHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJhbSkge1xuXHRcdFx0XHQvLyBjYXB0dXJlIGtleS12YWx1ZSBwYWlyc1xuXHRcdFx0XHR2YXIgY2FwdHVyZSA9IHBhcmFtLm1hdGNoKC8oLispXFw9KC4rKS8pO1xuXHRcdFx0XHRpZiAoY2FwdHVyZSAmJiBjYXB0dXJlLmxlbmd0aCA9PT0gMykge1xuXHRcdFx0XHRcdHN0YXRlW2NhcHR1cmVbMV1dID0gZGVjb2RlVVJJQ29tcG9uZW50KGNhcHR1cmVbMl0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHN0YXRlO1xuXHRcdH07XG5cblx0XHQvLyB0cmFuc2Zvcm1zIGFuIG9iamVjdCB0byBhIFVSTCBwYXJhbWV0ZXIgc3RyaW5nXG5cdFx0dmFyIGVuY29kZVN0YXRlID0gZnVuY3Rpb24gKHN0YXRlKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gJyc7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gc3RhdGUpIHtcblx0XHRcdFx0cGFyYW1zICs9IGtleSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChzdGF0ZVtrZXldKSArICcmJztcblx0XHRcdH1cblx0XHRcdHJldHVybiBwYXJhbXMuc3Vic3RyaW5nKDAsIHBhcmFtcy5sZW5ndGggLSAxKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5wdXNoU3RhdGUgPSBmdW5jdGlvbiAocykge1xuXHRcdFx0c3RhdGUuc2x1ZyA9IHM7XG5cdFx0XHRoaXN0b3J5LnB1c2hTdGF0ZShzdGF0ZSwgJycsIHN0YXRlLnNsdWcgKyAnIycgKyBlbmNvZGVTdGF0ZShzdGF0ZSkpO1xuXHRcdH07XG5cblx0XHQvLyBzZXRzIGEgVVJMIHBhcmFtZXRlciBhbmQgdXBkYXRlcyB0aGUgaGlzdG9yeSBzdGF0ZVxuXHRcdHRoaXMuc2V0ID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIHBhcmFtcykge1xuXHRcdFx0XHRzdGF0ZVtrZXldID0gcGFyYW1zW2tleV07XG5cdFx0XHR9XG5cdFx0XHRoaXN0b3J5LnJlcGxhY2VTdGF0ZShzdGF0ZSwgJycsIHN0YXRlLnNsdWcgKyAnIycgKyBlbmNvZGVTdGF0ZShzdGF0ZSkpO1xuXHRcdH07XG5cblx0XHQvLyByZXR1cm5zIGEgVVJMIHBhcmFtZXRlclxuXHRcdHRoaXMuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuXHRcdFx0cmV0dXJuIHN0YXRlW2tleV07XG5cdFx0fTtcblxuXHRcdHN0YXRlID0gaGlzdG9yeS5zdGF0ZTtcblxuXHRcdGlmICghc3RhdGUpIHtcblx0XHRcdHN0YXRlID0gZGVjb2RlU3RhdGUoKTtcblx0XHR9XG5cdH1cbik7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9