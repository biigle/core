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
 * @name DrawingControlsController
 * @memberOf dias.annotations
 * @description Controller for the controls bar drawing butons
 */
angular.module('dias.annotations').controller('DrawingControlsController', ["$scope", "mapAnnotations", "labels", "msg", "$attrs", "keyboard", function ($scope, mapAnnotations, labels, msg, $attrs, keyboard) {
		"use strict";

		$scope.selectShape = function (name) {
            if (name !== null && $scope.selectedShape() !== name) {
                if (!labels.hasSelected()) {
                    $scope.$emit('sidebar.foldout.do-open', 'categories');
                    msg.info($attrs.selectCategory);
                    return;
                }
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
 * @name SettingsAnnotationsCyclingController
 * @memberOf dias.annotations
 * @description Controller cycling through annotations
 */
angular.module('dias.annotations').controller('SettingsAnnotationsCyclingController', ["$scope", "mapAnnotations", "labels", "keyboard", function ($scope, mapAnnotations, labels, keyboard) {
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
                mapAnnotations.clearSelection();
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
 * @name SettingsSectionCyclingController
 * @memberOf dias.annotations
 * @description Controller for cycling through image sections
 */
angular.module('dias.annotations').controller('SettingsSectionCyclingController', ["$scope", "map", "mapImage", "keyboard", function ($scope, map, mapImage, keyboard) {
        "use strict";

        // flag to prevent cycling while a new image is loading
        var loading = false;

        var cyclingKey = 'sections';
        var view;

        // view center point of the start position
        var startCenter = [0, 0];
        // number of pixels to proceed in x and y direction for each step
        var stepSize = [0, 0];
        // number of steps in x and y direction -1!
        var stepCount = [0, 0];
        // number of current step in x and y direction -1!
        var currentStep = [0, 0];

        // TODO react on window resize events and foldout open as well as
        // changing the zoom level

        var distance = function (p1, p2) {
            return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
        };

        // if the map size was changed, this function finds the next nearest step
        var findNearestStep = function (center) {
            var nearest = Infinity;
            var current = 0;
            var nearestStep = [0, 0];
            for (var y = 0; y <= stepCount[1]; y++) {
                for (var x = 0; x <= stepCount[0]; x++) {
                    current = distance(center, getStepPosition([x, y]));
                    if (current < nearest) {
                        nearestStep[0] = x;
                        nearestStep[1] = y;
                        nearest = current;
                    }
                }
            }

            return nearestStep;
        };

        // (re-)calculate all needed positions and sizes for cycling through sections
        var updateExtent = function () {
            view = map.getView();
            // set the event listener here in case the view changed
            view.on('change:resolution', handleUserZoom);
            var imageExtent = mapImage.getExtent();
            var viewExtent = view.calculateExtent(map.getSize());

            stepSize[0] = viewExtent[2] - viewExtent[0];
            stepSize[1] = viewExtent[3] - viewExtent[1];

            // set the start center before adjusting the step size with overlap
            startCenter[0] = stepSize[0] / 2;
            startCenter[1] = stepSize[1] / 2;

            // Math.ceil(4.0) - 1 is NOT equivalent to Math.floor(4.0)!
            // - 1 because stepCount begins with 0 so a stepCount of 1 means 2 steps
            stepCount[0] = Math.ceil(imageExtent[2] / stepSize[0]) - 1;
            stepCount[1] = Math.ceil(imageExtent[3] / stepSize[1]) - 1;

            var overlap;
            if (stepCount[0] > 0) {
                // make the sections overlap horizonally so they exactly cover the image
                overlap = (stepSize[0] * (stepCount[0] + 1)) - imageExtent[2];
                stepSize[0] -= overlap / stepCount[0];
            } else {
                stepSize[0] = viewExtent[2];
                // update the start point so the image is centered horizontally
                startCenter[0] = imageExtent[2] / 2;
            }

            if (stepCount[1] > 0) {
                // make the sections overlap vertically so they exactly cover the image
                overlap = (stepSize[1] * (stepCount[1] + 1)) - imageExtent[3];
                stepSize[1] -= overlap / stepCount[1];
            } else {
                stepSize[1] = viewExtent[3];
                // update the start point so the image is centered vertically
                startCenter[1] = imageExtent[3] / 2;
            }
        };

        var handleUserZoom = function () {
            updateExtent();
            // allow the user to pan but go back to the regular prev/next step when they
            // want to continue cycling, not to the currently nearest step
            var step = findNearestStep(getStepPosition(currentStep));
            currentStep[0] = step[0];
            currentStep[1] = step[1];
        };

        var handleMapResize = function () {
            updateExtent();
            goToStep(findNearestStep(view.getCenter()));
        };

        var goToStartStep = function () {
            goToStep([0, 0]);
        };

        var goToEndStep = function () {
            goToStep(stepCount);
        };

        var getStepPosition = function (step) {
            return [
                step[0] * stepSize[0] + startCenter[0],
                step[1] * stepSize[1] + startCenter[1],
            ];
        };

        var goToStep = function (step) {
            // animate stepping
            // var pan = ol.animation.pan({
            //     source: view.getCenter(),
            //     duration: 500
            // });
            // map.beforeRender(pan);
            currentStep[0] = step[0];
            currentStep[1] = step[1];
            view.setCenter(getStepPosition(currentStep));
        };

        var nextStep = function () {
            if (currentStep[0] < stepCount[0]) {
                return [currentStep[0] + 1, currentStep[1]];
            } else {
                return [0, currentStep[1] + 1];
            }
        };

        var prevStep = function () {
            if (currentStep[0] > 0) {
                return [currentStep[0] - 1, currentStep[1]];
            } else {
                return [stepCount[0], currentStep[1] - 1];
            }
        };

        var nextSection = function (e) {
            if (loading || !$scope.cycling()) return;

            if (currentStep[0] < stepCount[0] || currentStep[1] < stepCount[1]) {
                goToStep(nextStep());
            } else {
                $scope.nextImage().then(updateExtent).then(goToStartStep);
                loading = true;
            }

            if (e) {
                // only apply if this was called by the keyboard event
                $scope.$apply();
            }

            // cancel all keyboard events with lower priority
            return false;
        };

        var prevSection = function (e) {
            if (loading || !$scope.cycling()) return;

            if (currentStep[0] > 0 || currentStep[1] > 0) {
                goToStep(prevStep());
            } else {
                $scope.prevImage().then(updateExtent).then(goToEndStep);
                loading = true;
            }

            if (e) {
                // only apply if this was called by the keyboard event
                $scope.$apply();
            }

            // cancel all keyboard events with lower priority
            return false;
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
                map.on('change:size', handleMapResize);
                updateExtent();
                goToStartStep();
                // override previous image on arrow left
                keyboard.on(37, prevSection, 10);
                // override next image on arrow right and space
                keyboard.on(39, nextSection, 10);
                keyboard.on(32, nextSection, 10);

                keyboard.on(27, stopCycling, 10);
            } else if (oldCycle === cyclingKey) {
                map.un('change:size', handleMapResize);
                view.un('change:resolution', handleUserZoom);
                keyboard.off(37, prevSection);
                keyboard.off(39, nextSection);
                keyboard.off(32, nextSection);
                keyboard.off(27, stopCycling);
            }
        });

        $scope.$on('image.shown', function () {
            loading = false;
        });

        $scope.prevSection = prevSection;
        $scope.nextSection = nextSection;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkaXJlY3RpdmVzL2Fubm90YXRpb25MaXN0SXRlbS5qcyIsImRpcmVjdGl2ZXMvbGFiZWxDYXRlZ29yeUl0ZW0uanMiLCJkaXJlY3RpdmVzL2xhYmVsSXRlbS5qcyIsImNvbnRyb2xsZXJzL0Fubm90YXRpb25zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0Fubm90YXRvckNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9DYW52YXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ2F0ZWdvcmllc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Db25maWRlbmNlQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0RyYXdpbmdDb250cm9sc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9FZGl0Q29udHJvbHNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvTWluaW1hcENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TZWxlY3RlZExhYmVsQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NldHRpbmdzQW5ub3RhdGlvbk9wYWNpdHlDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2V0dGluZ3NBbm5vdGF0aW9uc0N5Y2xpbmdDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2V0dGluZ3NDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2V0dGluZ3NTZWN0aW9uQ3ljbGluZ0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TaWRlYmFyQ2F0ZWdvcnlGb2xkb3V0Q29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NpZGViYXJDb250cm9sbGVyLmpzIiwiZmFjdG9yaWVzL2RlYm91bmNlLmpzIiwiZmFjdG9yaWVzL21hcC5qcyIsInNlcnZpY2VzL2Fubm90YXRpb25zLmpzIiwic2VydmljZXMvaW1hZ2VzLmpzIiwic2VydmljZXMva2V5Ym9hcmQuanMiLCJzZXJ2aWNlcy9sYWJlbHMuanMiLCJzZXJ2aWNlcy9tYXBBbm5vdGF0aW9ucy5qcyIsInNlcnZpY2VzL21hcEltYWdlLmpzIiwic2VydmljZXMvc3R5bGVzLmpzIiwic2VydmljZXMvdXJsUGFyYW1zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLG9CQUFBLENBQUEsWUFBQTs7Ozs7Ozs7O0FDR0EsUUFBQSxPQUFBLG9CQUFBLFVBQUEsaUNBQUEsVUFBQSxRQUFBO0VBQ0E7O0VBRUEsT0FBQTtHQUNBLE9BQUE7R0FDQSx1QkFBQSxVQUFBLFFBQUE7SUFDQSxPQUFBLGFBQUEsVUFBQSxPQUFBLFdBQUEsTUFBQTs7SUFFQSxPQUFBLFdBQUEsWUFBQTtLQUNBLE9BQUEsT0FBQSxXQUFBLE9BQUEsV0FBQTs7O0lBR0EsT0FBQSxjQUFBLFlBQUE7S0FDQSxPQUFBLG1CQUFBLE9BQUE7OztJQUdBLE9BQUEsY0FBQSxVQUFBLE9BQUE7S0FDQSxPQUFBLHFCQUFBLE9BQUEsWUFBQTs7O0lBR0EsT0FBQSxpQkFBQSxZQUFBO0tBQ0EsT0FBQSxPQUFBLGNBQUEsT0FBQTs7O0lBR0EsT0FBQSxlQUFBLE9BQUE7O0lBRUEsT0FBQSxvQkFBQSxPQUFBOzs7Ozs7Ozs7Ozs7O0FDMUJBLFFBQUEsT0FBQSxvQkFBQSxVQUFBLGdFQUFBLFVBQUEsVUFBQSxVQUFBLGdCQUFBO1FBQ0E7O1FBRUEsT0FBQTtZQUNBLFVBQUE7O1lBRUEsYUFBQTs7WUFFQSxPQUFBOztZQUVBLE1BQUEsVUFBQSxPQUFBLFNBQUEsT0FBQTs7OztnQkFJQSxJQUFBLFVBQUEsUUFBQSxRQUFBLGVBQUEsSUFBQTtnQkFDQSxTQUFBLFlBQUE7b0JBQ0EsUUFBQSxPQUFBLFNBQUEsU0FBQTs7OztZQUlBLHVCQUFBLFVBQUEsUUFBQTs7Z0JBRUEsT0FBQSxTQUFBOztnQkFFQSxPQUFBLGVBQUEsT0FBQSxRQUFBLENBQUEsQ0FBQSxPQUFBLEtBQUEsT0FBQSxLQUFBOztnQkFFQSxPQUFBLGFBQUE7Ozs7Z0JBSUEsT0FBQSxJQUFBLHVCQUFBLFVBQUEsR0FBQSxVQUFBOzs7b0JBR0EsSUFBQSxPQUFBLEtBQUEsT0FBQSxTQUFBLElBQUE7d0JBQ0EsT0FBQSxTQUFBO3dCQUNBLE9BQUEsYUFBQTs7d0JBRUEsT0FBQSxNQUFBOzJCQUNBO3dCQUNBLE9BQUEsU0FBQTt3QkFDQSxPQUFBLGFBQUE7Ozs7OztnQkFNQSxPQUFBLElBQUEsMEJBQUEsVUFBQSxHQUFBO29CQUNBLE9BQUEsU0FBQTs7b0JBRUEsSUFBQSxPQUFBLEtBQUEsY0FBQSxNQUFBO3dCQUNBLEVBQUE7Ozs7Ozs7Ozs7Ozs7OztBQ2xEQSxRQUFBLE9BQUEsb0JBQUEsVUFBQSxhQUFBLFlBQUE7RUFDQTs7RUFFQSxPQUFBO0dBQ0EsdUJBQUEsVUFBQSxRQUFBO0lBQ0EsSUFBQSxhQUFBLE9BQUEsZ0JBQUE7O0lBRUEsSUFBQSxjQUFBLE1BQUE7S0FDQSxPQUFBLFFBQUE7V0FDQSxJQUFBLGNBQUEsTUFBQTtLQUNBLE9BQUEsUUFBQTtXQUNBLElBQUEsY0FBQSxPQUFBO0tBQ0EsT0FBQSxRQUFBO1dBQ0E7S0FDQSxPQUFBLFFBQUE7Ozs7Ozs7Ozs7Ozs7O0FDZEEsUUFBQSxPQUFBLG9CQUFBLFdBQUEseUZBQUEsVUFBQSxRQUFBLGdCQUFBLFFBQUEsYUFBQSxRQUFBO0VBQ0E7O0VBRUEsT0FBQSxtQkFBQSxlQUFBLHNCQUFBOztFQUVBLElBQUEscUJBQUEsWUFBQTtHQUNBLE9BQUEsY0FBQSxZQUFBOzs7RUFHQSxJQUFBLG1CQUFBLGVBQUE7O0VBRUEsT0FBQSxjQUFBOztFQUVBLE9BQUEsaUJBQUEsZUFBQTs7RUFFQSxPQUFBLG1CQUFBLFVBQUEsR0FBQSxJQUFBOztHQUVBLElBQUEsQ0FBQSxFQUFBLFVBQUE7SUFDQSxPQUFBOztHQUVBLGVBQUEsT0FBQTs7O1FBR0EsT0FBQSxnQkFBQSxlQUFBOztFQUVBLE9BQUEsYUFBQSxVQUFBLElBQUE7R0FDQSxJQUFBLFdBQUE7R0FDQSxpQkFBQSxRQUFBLFVBQUEsU0FBQTtJQUNBLElBQUEsUUFBQSxjQUFBLFFBQUEsV0FBQSxNQUFBLElBQUE7S0FDQSxXQUFBOzs7R0FHQSxPQUFBOzs7RUFHQSxPQUFBLElBQUEsZUFBQTs7Ozs7Ozs7Ozs7QUNuQ0EsUUFBQSxPQUFBLG9CQUFBLFdBQUEsd0ZBQUEsVUFBQSxRQUFBLFFBQUEsV0FBQSxLQUFBLFVBQUEsVUFBQTtRQUNBOztRQUVBLE9BQUEsU0FBQTtRQUNBLE9BQUEsZUFBQTs7O1FBR0EsT0FBQSxXQUFBO1lBQ0EsTUFBQSxVQUFBLElBQUE7WUFDQSxRQUFBLENBQUEsVUFBQSxJQUFBLE1BQUEsVUFBQSxJQUFBOzs7O1FBSUEsSUFBQSxnQkFBQSxZQUFBO1lBQ0EsT0FBQSxlQUFBO1lBQ0EsT0FBQSxXQUFBLGVBQUEsT0FBQSxPQUFBOzs7O1FBSUEsSUFBQSxZQUFBLFlBQUE7WUFDQSxVQUFBLFVBQUEsT0FBQSxPQUFBLGFBQUE7Ozs7UUFJQSxJQUFBLGVBQUEsWUFBQTtZQUNBLE9BQUEsZUFBQTs7OztRQUlBLElBQUEsWUFBQSxVQUFBLElBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQSxLQUFBLFNBQUE7MEJBQ0EsS0FBQTswQkFDQSxNQUFBLElBQUE7Ozs7UUFJQSxPQUFBLFlBQUEsWUFBQTtZQUNBO1lBQ0EsT0FBQSxPQUFBO21CQUNBLEtBQUE7bUJBQ0EsS0FBQTttQkFDQSxNQUFBLElBQUE7Ozs7UUFJQSxPQUFBLFlBQUEsWUFBQTtZQUNBO1lBQ0EsT0FBQSxPQUFBO21CQUNBLEtBQUE7bUJBQ0EsS0FBQTttQkFDQSxNQUFBLElBQUE7Ozs7UUFJQSxPQUFBLElBQUEsa0JBQUEsU0FBQSxHQUFBLFFBQUE7WUFDQSxPQUFBLFNBQUEsT0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQSxLQUFBLE1BQUEsT0FBQSxPQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsS0FBQSxLQUFBLE1BQUEsT0FBQSxPQUFBO1lBQ0EsVUFBQSxJQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBLE9BQUE7Z0JBQ0EsR0FBQSxPQUFBLFNBQUEsT0FBQTs7OztRQUlBLFNBQUEsR0FBQSxJQUFBLFlBQUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLElBQUEsWUFBQTtZQUNBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsSUFBQSxZQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUE7Ozs7UUFJQSxPQUFBLGFBQUEsU0FBQSxHQUFBO1lBQ0EsSUFBQSxRQUFBLEVBQUE7WUFDQSxJQUFBLFNBQUEsTUFBQSxTQUFBLFdBQUE7Z0JBQ0EsVUFBQSxNQUFBOzs7OztRQUtBLE9BQUE7O1FBRUEsVUFBQSxVQUFBLEtBQUE7Ozs7Ozs7Ozs7O0FDNUZBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLDRGQUFBLFVBQUEsUUFBQSxVQUFBLGdCQUFBLEtBQUEsVUFBQSxVQUFBO0VBQ0E7O1FBRUEsSUFBQSxVQUFBLElBQUE7OztFQUdBLElBQUEsR0FBQSxXQUFBLFNBQUEsR0FBQTtZQUNBLElBQUEsT0FBQSxZQUFBO2dCQUNBLE9BQUEsTUFBQSxrQkFBQTtvQkFDQSxRQUFBLFFBQUE7b0JBQ0EsTUFBQSxRQUFBOzs7OztZQUtBLFNBQUEsTUFBQSxLQUFBOzs7UUFHQSxJQUFBLEdBQUEsZUFBQSxZQUFBO1lBQ0EsVUFBQSxJQUFBOzs7RUFHQSxTQUFBLEtBQUE7RUFDQSxlQUFBLEtBQUE7O0VBRUEsSUFBQSxhQUFBLFlBQUE7OztHQUdBLFNBQUEsV0FBQTs7SUFFQSxJQUFBO01BQ0EsSUFBQTs7O0VBR0EsT0FBQSxJQUFBLHdCQUFBO0VBQ0EsT0FBQSxJQUFBLHlCQUFBOzs7Ozs7Ozs7OztBQ25DQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSx5REFBQSxVQUFBLFFBQUEsUUFBQSxVQUFBO1FBQ0E7OztRQUdBLElBQUEsZ0JBQUE7UUFDQSxJQUFBLHVCQUFBOzs7UUFHQSxJQUFBLGtCQUFBLFlBQUE7WUFDQSxJQUFBLE1BQUEsT0FBQSxXQUFBLElBQUEsVUFBQSxNQUFBO2dCQUNBLE9BQUEsS0FBQTs7WUFFQSxPQUFBLGFBQUEsd0JBQUEsS0FBQSxVQUFBOzs7O1FBSUEsSUFBQSxpQkFBQSxZQUFBO1lBQ0EsSUFBQSxPQUFBLGFBQUEsdUJBQUE7Z0JBQ0EsSUFBQSxNQUFBLEtBQUEsTUFBQSxPQUFBLGFBQUE7Z0JBQ0EsT0FBQSxhQUFBLE9BQUEsV0FBQSxPQUFBLFVBQUEsTUFBQTs7b0JBRUEsT0FBQSxJQUFBLFFBQUEsS0FBQSxRQUFBLENBQUE7Ozs7O1FBS0EsSUFBQSxrQkFBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFNBQUEsS0FBQSxRQUFBLE9BQUEsV0FBQSxRQUFBO2dCQUNBLE9BQUEsV0FBQSxPQUFBLFdBQUE7Ozs7UUFJQSxPQUFBLGFBQUEsQ0FBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUE7UUFDQSxPQUFBLGFBQUE7UUFDQSxPQUFBLGFBQUE7UUFDQSxPQUFBLFFBQUEsS0FBQSxVQUFBLEtBQUE7WUFDQSxLQUFBLElBQUEsT0FBQSxLQUFBO2dCQUNBLE9BQUEsYUFBQSxPQUFBLFdBQUEsT0FBQSxJQUFBOztZQUVBOzs7UUFHQSxPQUFBLGlCQUFBLE9BQUE7O1FBRUEsT0FBQSxhQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUEsaUJBQUE7WUFDQSxPQUFBLFdBQUEsdUJBQUE7OztRQUdBLE9BQUEsY0FBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLE9BQUEsV0FBQSxRQUFBLFVBQUEsQ0FBQTs7OztRQUlBLE9BQUEsa0JBQUEsVUFBQSxHQUFBLE1BQUE7WUFDQSxFQUFBO1lBQ0EsSUFBQSxRQUFBLE9BQUEsV0FBQSxRQUFBO1lBQ0EsSUFBQSxVQUFBLENBQUEsS0FBQSxPQUFBLFdBQUEsU0FBQSxlQUFBO2dCQUNBLE9BQUEsV0FBQSxLQUFBO21CQUNBO2dCQUNBLE9BQUEsV0FBQSxPQUFBLE9BQUE7O1lBRUE7Ozs7UUFJQSxPQUFBLGlCQUFBLFlBQUE7WUFDQSxPQUFBLE9BQUEsV0FBQSxTQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsZ0JBQUE7WUFDQSxPQUFBOzs7Ozs7Ozs7Ozs7QUNqSEEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsNkNBQUEsVUFBQSxRQUFBLFFBQUE7RUFDQTs7RUFFQSxPQUFBLGFBQUE7O0VBRUEsT0FBQSxPQUFBLGNBQUEsVUFBQSxZQUFBO0dBQ0EsT0FBQSxxQkFBQSxXQUFBOztHQUVBLElBQUEsY0FBQSxNQUFBO0lBQ0EsT0FBQSxrQkFBQTtVQUNBLElBQUEsY0FBQSxNQUFBO0lBQ0EsT0FBQSxrQkFBQTtVQUNBLElBQUEsY0FBQSxPQUFBO0lBQ0EsT0FBQSxrQkFBQTtVQUNBO0lBQ0EsT0FBQSxrQkFBQTs7Ozs7Ozs7Ozs7OztBQ2ZBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLGlHQUFBLFVBQUEsUUFBQSxnQkFBQSxRQUFBLEtBQUEsUUFBQSxVQUFBO0VBQ0E7O0VBRUEsT0FBQSxjQUFBLFVBQUEsTUFBQTtZQUNBLElBQUEsU0FBQSxRQUFBLE9BQUEsb0JBQUEsTUFBQTtnQkFDQSxJQUFBLENBQUEsT0FBQSxlQUFBO29CQUNBLE9BQUEsTUFBQSwyQkFBQTtvQkFDQSxJQUFBLEtBQUEsT0FBQTtvQkFDQTs7SUFFQSxlQUFBLGFBQUE7VUFDQTtnQkFDQSxlQUFBOzs7O1FBSUEsT0FBQSxnQkFBQSxlQUFBOzs7UUFHQSxTQUFBLEdBQUEsSUFBQSxZQUFBO1lBQ0EsT0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxLQUFBLFlBQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsS0FBQSxZQUFBO1lBQ0EsT0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLE9BQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxLQUFBLFlBQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBOzs7Ozs7Ozs7Ozs7QUM5Q0EsUUFBQSxPQUFBLG9CQUFBLFdBQUEsbUVBQUEsVUFBQSxRQUFBLGdCQUFBLFVBQUE7RUFDQTs7UUFFQSxPQUFBLDRCQUFBLFlBQUE7WUFDQSxJQUFBLGVBQUEsc0JBQUEsY0FBQSxLQUFBLFFBQUEsOERBQUE7Z0JBQ0EsZUFBQTs7OztRQUlBLElBQUEsY0FBQSxZQUFBO1lBQ0EsZUFBQTs7O1FBR0EsSUFBQSxlQUFBLFlBQUE7WUFDQSxlQUFBOzs7UUFHQSxPQUFBLDBCQUFBLFlBQUE7WUFDQSxJQUFBLE9BQUEsWUFBQTtnQkFDQTttQkFDQTtnQkFDQTs7OztRQUlBLE9BQUEsV0FBQSxlQUFBOztRQUVBLFNBQUEsR0FBQSxJQUFBLFVBQUEsR0FBQTtZQUNBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxTQUFBLEdBQUEsSUFBQSxZQUFBO1lBQ0EsSUFBQSxPQUFBLFlBQUE7Z0JBQ0EsT0FBQSxPQUFBOzs7O1FBSUEsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLE9BQUEsT0FBQSxPQUFBOzs7Ozs7Ozs7Ozs7QUN2Q0EsUUFBQSxPQUFBLG9CQUFBLFdBQUEseUVBQUEsVUFBQSxRQUFBLEtBQUEsVUFBQSxVQUFBLFFBQUE7RUFDQTs7UUFFQSxJQUFBLGlCQUFBLElBQUEsR0FBQSxPQUFBOztFQUVBLElBQUEsVUFBQSxJQUFBLEdBQUEsSUFBQTtHQUNBLFFBQUE7O0dBRUEsVUFBQTs7R0FFQSxjQUFBOzs7UUFHQSxJQUFBLFVBQUEsSUFBQTtRQUNBLElBQUEsVUFBQSxJQUFBOzs7RUFHQSxRQUFBLFNBQUEsU0FBQTtRQUNBLFFBQUEsU0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsUUFBQTtZQUNBLE9BQUEsT0FBQTs7O0VBR0EsSUFBQSxXQUFBLElBQUEsR0FBQTtFQUNBLGVBQUEsV0FBQTs7O0VBR0EsT0FBQSxJQUFBLGVBQUEsWUFBQTtHQUNBLFFBQUEsUUFBQSxJQUFBLEdBQUEsS0FBQTtJQUNBLFlBQUEsU0FBQTtJQUNBLFFBQUEsR0FBQSxPQUFBLFVBQUEsU0FBQTtJQUNBLE1BQUE7Ozs7O0VBS0EsSUFBQSxrQkFBQSxZQUFBO0dBQ0EsU0FBQSxZQUFBLEdBQUEsS0FBQSxRQUFBLFdBQUEsUUFBQSxnQkFBQTs7O1FBR0EsSUFBQSxHQUFBLGVBQUEsWUFBQTtZQUNBLFVBQUEsSUFBQTs7O1FBR0EsSUFBQSxHQUFBLGVBQUEsWUFBQTtZQUNBLFVBQUEsSUFBQTs7O0VBR0EsSUFBQSxHQUFBLGVBQUE7O0VBRUEsSUFBQSxlQUFBLFVBQUEsR0FBQTtHQUNBLFFBQUEsVUFBQSxFQUFBOzs7RUFHQSxRQUFBLEdBQUEsZUFBQTs7RUFFQSxTQUFBLEdBQUEsY0FBQSxZQUFBO0dBQ0EsUUFBQSxHQUFBLGVBQUE7OztFQUdBLFNBQUEsR0FBQSxjQUFBLFlBQUE7R0FDQSxRQUFBLEdBQUEsZUFBQTs7Ozs7Ozs7Ozs7O0FDN0RBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLGdEQUFBLFVBQUEsUUFBQSxRQUFBO0VBQ0E7O1FBRUEsT0FBQSxtQkFBQSxPQUFBOztRQUVBLE9BQUEsbUJBQUEsT0FBQTs7Ozs7Ozs7Ozs7QUNMQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSxvRUFBQSxVQUFBLFFBQUEsZ0JBQUE7UUFDQTs7UUFFQSxPQUFBLG1CQUFBLHNCQUFBO1FBQ0EsT0FBQSxPQUFBLCtCQUFBLFVBQUEsU0FBQTtZQUNBLGVBQUEsV0FBQTs7Ozs7Ozs7Ozs7O0FDTEEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsMkZBQUEsVUFBQSxRQUFBLGdCQUFBLFFBQUEsVUFBQTtRQUNBOzs7UUFHQSxJQUFBLFVBQUE7O1FBRUEsSUFBQSxhQUFBOztRQUVBLElBQUEsaUJBQUEsVUFBQSxHQUFBO1lBQ0EsSUFBQSxXQUFBLENBQUEsT0FBQSxXQUFBOztZQUVBLElBQUEsZUFBQSxXQUFBO2dCQUNBLGVBQUE7bUJBQ0E7O2dCQUVBLE9BQUEsWUFBQSxLQUFBLGVBQUE7Z0JBQ0EsVUFBQTs7O1lBR0EsSUFBQSxHQUFBOztnQkFFQSxPQUFBOzs7O1lBSUEsT0FBQTs7O1FBR0EsSUFBQSxpQkFBQSxVQUFBLEdBQUE7WUFDQSxJQUFBLFdBQUEsQ0FBQSxPQUFBLFdBQUE7O1lBRUEsSUFBQSxlQUFBLGVBQUE7Z0JBQ0EsZUFBQTttQkFDQTs7Z0JBRUEsT0FBQSxZQUFBLEtBQUEsZUFBQTtnQkFDQSxVQUFBOzs7WUFHQSxJQUFBLEdBQUE7O2dCQUVBLE9BQUE7Ozs7WUFJQSxPQUFBOzs7UUFHQSxJQUFBLGNBQUEsVUFBQSxHQUFBO1lBQ0EsSUFBQSxTQUFBO1lBQ0EsSUFBQSxHQUFBO2dCQUNBLEVBQUE7OztZQUdBLElBQUEsT0FBQSxhQUFBLE9BQUEsZUFBQTtnQkFDQSxPQUFBLG1CQUFBLGVBQUEsY0FBQSxTQUFBLEtBQUEsWUFBQTtvQkFDQSxlQUFBLFFBQUE7O21CQUVBO2dCQUNBLGVBQUE7Ozs7O1FBS0EsSUFBQSxjQUFBLFVBQUEsR0FBQTtZQUNBLEVBQUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsVUFBQSxZQUFBO1lBQ0EsT0FBQSxPQUFBLG9CQUFBLGFBQUE7OztRQUdBLE9BQUEsZUFBQSxZQUFBO1lBQ0EsT0FBQSxvQkFBQSxTQUFBOzs7UUFHQSxPQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUEsb0JBQUEsU0FBQTs7Ozs7UUFLQSxPQUFBLE9BQUEsMEJBQUEsVUFBQSxPQUFBLFVBQUE7WUFDQSxJQUFBLFVBQUEsWUFBQTs7Z0JBRUEsU0FBQSxHQUFBLElBQUEsZ0JBQUE7O2dCQUVBLFNBQUEsR0FBQSxJQUFBLGdCQUFBO2dCQUNBLFNBQUEsR0FBQSxJQUFBLGdCQUFBOztnQkFFQSxTQUFBLEdBQUEsSUFBQSxhQUFBO2dCQUNBLFNBQUEsR0FBQSxJQUFBLGFBQUE7Z0JBQ0EsZUFBQTttQkFDQSxJQUFBLGFBQUEsWUFBQTtnQkFDQSxTQUFBLElBQUEsSUFBQTtnQkFDQSxTQUFBLElBQUEsSUFBQTtnQkFDQSxTQUFBLElBQUEsSUFBQTtnQkFDQSxTQUFBLElBQUEsSUFBQTtnQkFDQSxTQUFBLElBQUEsSUFBQTtnQkFDQSxlQUFBOzs7O1FBSUEsT0FBQSxJQUFBLGVBQUEsWUFBQTtZQUNBLFVBQUE7OztRQUdBLE9BQUEsaUJBQUE7UUFDQSxPQUFBLGlCQUFBO1FBQ0EsT0FBQSxjQUFBOzs7Ozs7Ozs7OztBQ2hIQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSw2Q0FBQSxVQUFBLFFBQUEsVUFBQTtRQUNBOztRQUVBLElBQUEscUJBQUE7O1FBRUEsSUFBQSxrQkFBQTs7O1FBR0EsT0FBQSxXQUFBOzs7UUFHQSxPQUFBLG1CQUFBOztRQUVBLElBQUEsZ0JBQUEsWUFBQTtZQUNBLElBQUEsV0FBQSxRQUFBLEtBQUEsT0FBQTtZQUNBLEtBQUEsSUFBQSxPQUFBLFVBQUE7Z0JBQ0EsSUFBQSxTQUFBLFNBQUEsZ0JBQUEsTUFBQTs7b0JBRUEsT0FBQSxTQUFBOzs7O1lBSUEsT0FBQSxhQUFBLHNCQUFBLEtBQUEsVUFBQTs7O1FBR0EsSUFBQSx5QkFBQSxZQUFBOzs7WUFHQSxTQUFBLGVBQUEsS0FBQTs7O1FBR0EsSUFBQSxrQkFBQSxZQUFBO1lBQ0EsSUFBQSxXQUFBO1lBQ0EsSUFBQSxPQUFBLGFBQUEscUJBQUE7Z0JBQ0EsV0FBQSxLQUFBLE1BQUEsT0FBQSxhQUFBOzs7WUFHQSxPQUFBLFFBQUEsT0FBQSxVQUFBOzs7UUFHQSxPQUFBLGNBQUEsVUFBQSxLQUFBLE9BQUE7WUFDQSxPQUFBLFNBQUEsT0FBQTs7O1FBR0EsT0FBQSxjQUFBLFVBQUEsS0FBQTtZQUNBLE9BQUEsT0FBQSxTQUFBOzs7UUFHQSxPQUFBLHFCQUFBLFVBQUEsS0FBQSxPQUFBO1lBQ0EsZ0JBQUEsT0FBQTtZQUNBLElBQUEsQ0FBQSxPQUFBLFNBQUEsZUFBQSxNQUFBO2dCQUNBLE9BQUEsWUFBQSxLQUFBOzs7O1FBSUEsT0FBQSxzQkFBQSxVQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUEsaUJBQUEsT0FBQTs7O1FBR0EsT0FBQSxzQkFBQSxVQUFBLEtBQUE7WUFDQSxPQUFBLE9BQUEsaUJBQUE7OztRQUdBLE9BQUEsT0FBQSxZQUFBLHdCQUFBO1FBQ0EsUUFBQSxPQUFBLE9BQUEsVUFBQTs7Ozs7Ozs7Ozs7QUNoRUEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsOEVBQUEsVUFBQSxRQUFBLEtBQUEsVUFBQSxVQUFBO1FBQ0E7OztRQUdBLElBQUEsVUFBQTs7UUFFQSxJQUFBLGFBQUE7UUFDQSxJQUFBOzs7UUFHQSxJQUFBLGNBQUEsQ0FBQSxHQUFBOztRQUVBLElBQUEsV0FBQSxDQUFBLEdBQUE7O1FBRUEsSUFBQSxZQUFBLENBQUEsR0FBQTs7UUFFQSxJQUFBLGNBQUEsQ0FBQSxHQUFBOzs7OztRQUtBLElBQUEsV0FBQSxVQUFBLElBQUEsSUFBQTtZQUNBLE9BQUEsS0FBQSxLQUFBLEtBQUEsSUFBQSxHQUFBLEtBQUEsR0FBQSxJQUFBLEtBQUEsS0FBQSxJQUFBLEdBQUEsS0FBQSxHQUFBLElBQUE7Ozs7UUFJQSxJQUFBLGtCQUFBLFVBQUEsUUFBQTtZQUNBLElBQUEsVUFBQTtZQUNBLElBQUEsVUFBQTtZQUNBLElBQUEsY0FBQSxDQUFBLEdBQUE7WUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLEtBQUEsVUFBQSxJQUFBLEtBQUE7Z0JBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxLQUFBLFVBQUEsSUFBQSxLQUFBO29CQUNBLFVBQUEsU0FBQSxRQUFBLGdCQUFBLENBQUEsR0FBQTtvQkFDQSxJQUFBLFVBQUEsU0FBQTt3QkFDQSxZQUFBLEtBQUE7d0JBQ0EsWUFBQSxLQUFBO3dCQUNBLFVBQUE7Ozs7O1lBS0EsT0FBQTs7OztRQUlBLElBQUEsZUFBQSxZQUFBO1lBQ0EsT0FBQSxJQUFBOztZQUVBLEtBQUEsR0FBQSxxQkFBQTtZQUNBLElBQUEsY0FBQSxTQUFBO1lBQ0EsSUFBQSxhQUFBLEtBQUEsZ0JBQUEsSUFBQTs7WUFFQSxTQUFBLEtBQUEsV0FBQSxLQUFBLFdBQUE7WUFDQSxTQUFBLEtBQUEsV0FBQSxLQUFBLFdBQUE7OztZQUdBLFlBQUEsS0FBQSxTQUFBLEtBQUE7WUFDQSxZQUFBLEtBQUEsU0FBQSxLQUFBOzs7O1lBSUEsVUFBQSxLQUFBLEtBQUEsS0FBQSxZQUFBLEtBQUEsU0FBQSxNQUFBO1lBQ0EsVUFBQSxLQUFBLEtBQUEsS0FBQSxZQUFBLEtBQUEsU0FBQSxNQUFBOztZQUVBLElBQUE7WUFDQSxJQUFBLFVBQUEsS0FBQSxHQUFBOztnQkFFQSxVQUFBLENBQUEsU0FBQSxNQUFBLFVBQUEsS0FBQSxNQUFBLFlBQUE7Z0JBQ0EsU0FBQSxNQUFBLFVBQUEsVUFBQTttQkFDQTtnQkFDQSxTQUFBLEtBQUEsV0FBQTs7Z0JBRUEsWUFBQSxLQUFBLFlBQUEsS0FBQTs7O1lBR0EsSUFBQSxVQUFBLEtBQUEsR0FBQTs7Z0JBRUEsVUFBQSxDQUFBLFNBQUEsTUFBQSxVQUFBLEtBQUEsTUFBQSxZQUFBO2dCQUNBLFNBQUEsTUFBQSxVQUFBLFVBQUE7bUJBQ0E7Z0JBQ0EsU0FBQSxLQUFBLFdBQUE7O2dCQUVBLFlBQUEsS0FBQSxZQUFBLEtBQUE7Ozs7UUFJQSxJQUFBLGlCQUFBLFlBQUE7WUFDQTs7O1lBR0EsSUFBQSxPQUFBLGdCQUFBLGdCQUFBO1lBQ0EsWUFBQSxLQUFBLEtBQUE7WUFDQSxZQUFBLEtBQUEsS0FBQTs7O1FBR0EsSUFBQSxrQkFBQSxZQUFBO1lBQ0E7WUFDQSxTQUFBLGdCQUFBLEtBQUE7OztRQUdBLElBQUEsZ0JBQUEsWUFBQTtZQUNBLFNBQUEsQ0FBQSxHQUFBOzs7UUFHQSxJQUFBLGNBQUEsWUFBQTtZQUNBLFNBQUE7OztRQUdBLElBQUEsa0JBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQTtnQkFDQSxLQUFBLEtBQUEsU0FBQSxLQUFBLFlBQUE7Z0JBQ0EsS0FBQSxLQUFBLFNBQUEsS0FBQSxZQUFBOzs7O1FBSUEsSUFBQSxXQUFBLFVBQUEsTUFBQTs7Ozs7OztZQU9BLFlBQUEsS0FBQSxLQUFBO1lBQ0EsWUFBQSxLQUFBLEtBQUE7WUFDQSxLQUFBLFVBQUEsZ0JBQUE7OztRQUdBLElBQUEsV0FBQSxZQUFBO1lBQ0EsSUFBQSxZQUFBLEtBQUEsVUFBQSxJQUFBO2dCQUNBLE9BQUEsQ0FBQSxZQUFBLEtBQUEsR0FBQSxZQUFBO21CQUNBO2dCQUNBLE9BQUEsQ0FBQSxHQUFBLFlBQUEsS0FBQTs7OztRQUlBLElBQUEsV0FBQSxZQUFBO1lBQ0EsSUFBQSxZQUFBLEtBQUEsR0FBQTtnQkFDQSxPQUFBLENBQUEsWUFBQSxLQUFBLEdBQUEsWUFBQTttQkFDQTtnQkFDQSxPQUFBLENBQUEsVUFBQSxJQUFBLFlBQUEsS0FBQTs7OztRQUlBLElBQUEsY0FBQSxVQUFBLEdBQUE7WUFDQSxJQUFBLFdBQUEsQ0FBQSxPQUFBLFdBQUE7O1lBRUEsSUFBQSxZQUFBLEtBQUEsVUFBQSxNQUFBLFlBQUEsS0FBQSxVQUFBLElBQUE7Z0JBQ0EsU0FBQTttQkFDQTtnQkFDQSxPQUFBLFlBQUEsS0FBQSxjQUFBLEtBQUE7Z0JBQ0EsVUFBQTs7O1lBR0EsSUFBQSxHQUFBOztnQkFFQSxPQUFBOzs7O1lBSUEsT0FBQTs7O1FBR0EsSUFBQSxjQUFBLFVBQUEsR0FBQTtZQUNBLElBQUEsV0FBQSxDQUFBLE9BQUEsV0FBQTs7WUFFQSxJQUFBLFlBQUEsS0FBQSxLQUFBLFlBQUEsS0FBQSxHQUFBO2dCQUNBLFNBQUE7bUJBQ0E7Z0JBQ0EsT0FBQSxZQUFBLEtBQUEsY0FBQSxLQUFBO2dCQUNBLFVBQUE7OztZQUdBLElBQUEsR0FBQTs7Z0JBRUEsT0FBQTs7OztZQUlBLE9BQUE7Ozs7UUFJQSxJQUFBLGNBQUEsVUFBQSxHQUFBO1lBQ0EsRUFBQTtZQUNBLE9BQUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsT0FBQSxVQUFBLFlBQUE7WUFDQSxPQUFBLE9BQUEsb0JBQUEsYUFBQTs7O1FBR0EsT0FBQSxlQUFBLFlBQUE7WUFDQSxPQUFBLG9CQUFBLFNBQUE7OztRQUdBLE9BQUEsY0FBQSxZQUFBO1lBQ0EsT0FBQSxvQkFBQSxTQUFBOzs7OztRQUtBLE9BQUEsT0FBQSwwQkFBQSxVQUFBLE9BQUEsVUFBQTtZQUNBLElBQUEsVUFBQSxZQUFBO2dCQUNBLElBQUEsR0FBQSxlQUFBO2dCQUNBO2dCQUNBOztnQkFFQSxTQUFBLEdBQUEsSUFBQSxhQUFBOztnQkFFQSxTQUFBLEdBQUEsSUFBQSxhQUFBO2dCQUNBLFNBQUEsR0FBQSxJQUFBLGFBQUE7O2dCQUVBLFNBQUEsR0FBQSxJQUFBLGFBQUE7bUJBQ0EsSUFBQSxhQUFBLFlBQUE7Z0JBQ0EsSUFBQSxHQUFBLGVBQUE7Z0JBQ0EsS0FBQSxHQUFBLHFCQUFBO2dCQUNBLFNBQUEsSUFBQSxJQUFBO2dCQUNBLFNBQUEsSUFBQSxJQUFBO2dCQUNBLFNBQUEsSUFBQSxJQUFBO2dCQUNBLFNBQUEsSUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxJQUFBLGVBQUEsWUFBQTtZQUNBLFVBQUE7OztRQUdBLE9BQUEsY0FBQTtRQUNBLE9BQUEsY0FBQTs7Ozs7Ozs7Ozs7O0FDdE9BLFFBQUEsT0FBQSxvQkFBQSxXQUFBLDJEQUFBLFVBQUEsUUFBQSxVQUFBO0VBQ0E7O1FBRUEsU0FBQSxHQUFBLEdBQUEsVUFBQSxHQUFBO1lBQ0EsRUFBQTtZQUNBLE9BQUEsY0FBQTtZQUNBLE9BQUE7Ozs7Ozs7Ozs7OztBQ05BLFFBQUEsT0FBQSxvQkFBQSxXQUFBLDhDQUFBLFVBQUEsUUFBQSxZQUFBO0VBQ0E7O1FBRUEsSUFBQSxvQkFBQTs7UUFFQSxPQUFBLFVBQUE7O0VBRUEsT0FBQSxjQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsYUFBQSxxQkFBQTtZQUNBLE9BQUEsVUFBQTtHQUNBLFdBQUEsV0FBQSx3QkFBQTs7O0VBR0EsT0FBQSxlQUFBLFlBQUE7WUFDQSxPQUFBLGFBQUEsV0FBQTtHQUNBLE9BQUEsVUFBQTtHQUNBLFdBQUEsV0FBQTs7O0VBR0EsT0FBQSxnQkFBQSxVQUFBLE1BQUE7R0FDQSxJQUFBLE9BQUEsWUFBQSxNQUFBO0lBQ0EsT0FBQTtVQUNBO0lBQ0EsT0FBQSxZQUFBOzs7O1FBSUEsV0FBQSxJQUFBLDJCQUFBLFVBQUEsR0FBQSxNQUFBO1lBQ0EsT0FBQSxZQUFBOzs7O1FBSUEsSUFBQSxPQUFBLGFBQUEsb0JBQUE7WUFDQSxPQUFBLFlBQUEsT0FBQSxhQUFBOzs7Ozs7Ozs7Ozs7OztBQy9CQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSwrQkFBQSxVQUFBLFVBQUEsSUFBQTtFQUNBOztFQUVBLElBQUEsV0FBQTs7RUFFQSxPQUFBLFVBQUEsTUFBQSxNQUFBLElBQUE7OztHQUdBLElBQUEsV0FBQSxHQUFBO0dBQ0EsT0FBQSxDQUFBLFdBQUE7SUFDQSxJQUFBLFVBQUEsTUFBQSxPQUFBO0lBQ0EsSUFBQSxRQUFBLFdBQUE7S0FDQSxTQUFBLE1BQUE7S0FDQSxTQUFBLFFBQUEsS0FBQSxNQUFBLFNBQUE7S0FDQSxXQUFBLEdBQUE7O0lBRUEsSUFBQSxTQUFBLEtBQUE7S0FDQSxTQUFBLE9BQUEsU0FBQTs7SUFFQSxTQUFBLE1BQUEsU0FBQSxPQUFBO0lBQ0EsT0FBQSxTQUFBOzs7Ozs7Ozs7Ozs7QUN0QkEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsT0FBQSxZQUFBO0VBQ0E7O0VBRUEsSUFBQSxNQUFBLElBQUEsR0FBQSxJQUFBO0dBQ0EsUUFBQTtZQUNBLFVBQUE7R0FDQSxVQUFBO0lBQ0EsSUFBQSxHQUFBLFFBQUE7SUFDQSxJQUFBLEdBQUEsUUFBQTtJQUNBLElBQUEsR0FBQSxRQUFBOztZQUVBLGNBQUEsR0FBQSxZQUFBLFNBQUE7Z0JBQ0EsVUFBQTs7OztFQUlBLE9BQUE7Ozs7Ozs7Ozs7O0FDaEJBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLCtDQUFBLFVBQUEsWUFBQSxRQUFBLEtBQUE7RUFDQTs7RUFFQSxJQUFBO1FBQ0EsSUFBQTs7RUFFQSxJQUFBLG1CQUFBLFVBQUEsWUFBQTtHQUNBLFdBQUEsUUFBQSxPQUFBLFFBQUEsV0FBQTtHQUNBLE9BQUE7OztFQUdBLElBQUEsZ0JBQUEsVUFBQSxZQUFBO0dBQ0EsWUFBQSxLQUFBO0dBQ0EsT0FBQTs7O0VBR0EsS0FBQSxRQUFBLFVBQUEsUUFBQTtHQUNBLGNBQUEsV0FBQSxNQUFBO1lBQ0EsVUFBQSxZQUFBO0dBQ0EsUUFBQSxLQUFBLFVBQUEsR0FBQTtJQUNBLEVBQUEsUUFBQTs7R0FFQSxPQUFBOzs7RUFHQSxLQUFBLE1BQUEsVUFBQSxRQUFBO0dBQ0EsSUFBQSxDQUFBLE9BQUEsWUFBQSxPQUFBLE9BQUE7SUFDQSxPQUFBLFdBQUEsT0FBQSxNQUFBLE9BQUE7O0dBRUEsSUFBQSxhQUFBLFdBQUEsSUFBQTtHQUNBLFdBQUE7Y0FDQSxLQUFBO2NBQ0EsS0FBQTtjQUNBLE1BQUEsSUFBQTs7R0FFQSxPQUFBOzs7RUFHQSxLQUFBLFNBQUEsVUFBQSxZQUFBOztHQUVBLElBQUEsUUFBQSxZQUFBLFFBQUE7R0FDQSxJQUFBLFFBQUEsQ0FBQSxHQUFBO0lBQ0EsT0FBQSxXQUFBLFFBQUEsWUFBQTs7O0tBR0EsUUFBQSxZQUFBLFFBQUE7S0FDQSxZQUFBLE9BQUEsT0FBQTtPQUNBLElBQUE7Ozs7RUFJQSxLQUFBLFVBQUEsVUFBQSxJQUFBO0dBQ0EsT0FBQSxZQUFBLFFBQUE7OztFQUdBLEtBQUEsVUFBQSxZQUFBO0dBQ0EsT0FBQTs7O1FBR0EsS0FBQSxhQUFBLFlBQUE7WUFDQSxPQUFBOzs7Ozs7Ozs7Ozs7QUM1REEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsc0ZBQUEsVUFBQSxZQUFBLGVBQUEsS0FBQSxJQUFBLGNBQUEsYUFBQTtFQUNBOztFQUVBLElBQUEsUUFBQTs7RUFFQSxJQUFBLFdBQUE7O0VBRUEsSUFBQSxrQkFBQTs7RUFFQSxJQUFBLFNBQUE7OztFQUdBLEtBQUEsZUFBQTs7Ozs7O0VBTUEsSUFBQSxTQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsTUFBQSxNQUFBLGFBQUE7R0FDQSxJQUFBLFFBQUEsU0FBQSxRQUFBO0dBQ0EsT0FBQSxTQUFBLENBQUEsUUFBQSxLQUFBLFNBQUE7Ozs7Ozs7RUFPQSxJQUFBLFNBQUEsVUFBQSxJQUFBO0dBQ0EsS0FBQSxNQUFBLE1BQUEsYUFBQTtHQUNBLElBQUEsUUFBQSxTQUFBLFFBQUE7R0FDQSxJQUFBLFNBQUEsU0FBQTtHQUNBLE9BQUEsU0FBQSxDQUFBLFFBQUEsSUFBQSxVQUFBOzs7Ozs7O0VBT0EsSUFBQSxXQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsTUFBQSxNQUFBLGFBQUE7R0FDQSxLQUFBLElBQUEsSUFBQSxPQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtJQUNBLElBQUEsT0FBQSxHQUFBLE9BQUEsSUFBQSxPQUFBLE9BQUE7OztHQUdBLE9BQUE7Ozs7OztFQU1BLElBQUEsT0FBQSxVQUFBLElBQUE7R0FDQSxNQUFBLGVBQUEsU0FBQTs7Ozs7Ozs7RUFRQSxJQUFBLGFBQUEsVUFBQSxJQUFBO0dBQ0EsSUFBQSxXQUFBLEdBQUE7R0FDQSxJQUFBLE1BQUEsU0FBQTs7R0FFQSxJQUFBLEtBQUE7SUFDQSxTQUFBLFFBQUE7VUFDQTtJQUNBLE1BQUEsU0FBQSxjQUFBO0lBQ0EsSUFBQSxNQUFBO0lBQ0EsSUFBQSxTQUFBLFlBQUE7S0FDQSxPQUFBLEtBQUE7O0tBRUEsSUFBQSxPQUFBLFNBQUEsaUJBQUE7TUFDQSxPQUFBOztLQUVBLFNBQUEsUUFBQTs7SUFFQSxJQUFBLFVBQUEsVUFBQSxLQUFBO0tBQ0EsU0FBQSxPQUFBOztJQUVBLElBQUEsTUFBQSxNQUFBLG9CQUFBLEtBQUE7OztZQUdBLFdBQUEsV0FBQSxrQkFBQTs7R0FFQSxPQUFBLFNBQUE7Ozs7Ozs7RUFPQSxLQUFBLE9BQUEsWUFBQTtHQUNBLFdBQUEsY0FBQSxNQUFBLENBQUEsYUFBQSxjQUFBLFlBQUE7Ozs7O2dCQUtBLElBQUEsaUJBQUEsT0FBQSxhQUFBLG9CQUFBLGNBQUE7Z0JBQ0EsSUFBQSxnQkFBQTtvQkFDQSxpQkFBQSxLQUFBLE1BQUE7Ozs7b0JBSUEsYUFBQSxnQkFBQTs7O29CQUdBLGVBQUEsV0FBQSxTQUFBO29CQUNBLGVBQUEsWUFBQSxTQUFBOzs7b0JBR0EsV0FBQTs7OztHQUlBLE9BQUEsU0FBQTs7Ozs7OztFQU9BLEtBQUEsT0FBQSxVQUFBLElBQUE7R0FDQSxJQUFBLFVBQUEsV0FBQSxJQUFBLEtBQUEsV0FBQTtJQUNBLEtBQUE7Ozs7R0FJQSxTQUFBLFNBQUEsS0FBQSxZQUFBOztJQUVBLFdBQUEsT0FBQTtJQUNBLFdBQUEsT0FBQTs7O0dBR0EsT0FBQTs7Ozs7OztFQU9BLEtBQUEsT0FBQSxZQUFBO0dBQ0EsT0FBQSxNQUFBLEtBQUE7Ozs7Ozs7RUFPQSxLQUFBLE9BQUEsWUFBQTtHQUNBLE9BQUEsTUFBQSxLQUFBOzs7RUFHQSxLQUFBLGVBQUEsWUFBQTtHQUNBLE9BQUEsTUFBQSxhQUFBOzs7Ozs7Ozs7Ozs7QUMxSkEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsWUFBQSxZQUFBO1FBQ0E7OztRQUdBLElBQUEsWUFBQTs7UUFFQSxJQUFBLG1CQUFBLFVBQUEsTUFBQSxHQUFBOztZQUVBLEtBQUEsSUFBQSxJQUFBLEtBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBOztnQkFFQSxJQUFBLEtBQUEsR0FBQSxTQUFBLE9BQUEsT0FBQTs7OztRQUlBLElBQUEsa0JBQUEsVUFBQSxHQUFBO1lBQ0EsSUFBQSxPQUFBLEVBQUE7WUFDQSxJQUFBLFlBQUEsT0FBQSxhQUFBLEVBQUEsU0FBQSxNQUFBOztZQUVBLElBQUEsVUFBQSxPQUFBO2dCQUNBLGlCQUFBLFVBQUEsT0FBQTs7O1lBR0EsSUFBQSxVQUFBLFlBQUE7Z0JBQ0EsaUJBQUEsVUFBQSxZQUFBOzs7O1FBSUEsU0FBQSxpQkFBQSxXQUFBOzs7OztRQUtBLEtBQUEsS0FBQSxVQUFBLFlBQUEsVUFBQSxVQUFBO1lBQ0EsSUFBQSxPQUFBLGVBQUEsWUFBQSxzQkFBQSxRQUFBO2dCQUNBLGFBQUEsV0FBQTs7O1lBR0EsV0FBQSxZQUFBO1lBQ0EsSUFBQSxXQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsVUFBQTs7O1lBR0EsSUFBQSxVQUFBLGFBQUE7Z0JBQ0EsSUFBQSxPQUFBLFVBQUE7Z0JBQ0EsSUFBQTs7Z0JBRUEsS0FBQSxJQUFBLEdBQUEsSUFBQSxLQUFBLFFBQUEsS0FBQTtvQkFDQSxJQUFBLEtBQUEsR0FBQSxZQUFBLFVBQUE7OztnQkFHQSxJQUFBLE1BQUEsS0FBQSxTQUFBLEdBQUE7b0JBQ0EsS0FBQSxLQUFBO3VCQUNBO29CQUNBLEtBQUEsT0FBQSxHQUFBLEdBQUE7OzttQkFHQTtnQkFDQSxVQUFBLGNBQUEsQ0FBQTs7Ozs7UUFLQSxLQUFBLE1BQUEsVUFBQSxZQUFBLFVBQUE7WUFDQSxJQUFBLE9BQUEsZUFBQSxZQUFBLHNCQUFBLFFBQUE7Z0JBQ0EsYUFBQSxXQUFBOzs7WUFHQSxJQUFBLFVBQUEsYUFBQTtnQkFDQSxJQUFBLE9BQUEsVUFBQTtnQkFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxRQUFBLEtBQUE7b0JBQ0EsSUFBQSxLQUFBLEdBQUEsYUFBQSxVQUFBO3dCQUNBLEtBQUEsT0FBQSxHQUFBO3dCQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUN6RUEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsOEZBQUEsVUFBQSxpQkFBQSxPQUFBLGNBQUEsU0FBQSxLQUFBLElBQUEsYUFBQTtRQUNBOztRQUVBLElBQUE7UUFDQSxJQUFBLG9CQUFBOztRQUVBLElBQUEsU0FBQTs7O1FBR0EsS0FBQSxVQUFBOztRQUVBLEtBQUEscUJBQUEsVUFBQSxZQUFBO1lBQ0EsSUFBQSxDQUFBLFlBQUE7OztZQUdBLElBQUEsQ0FBQSxXQUFBLFFBQUE7Z0JBQ0EsV0FBQSxTQUFBLGdCQUFBLE1BQUE7b0JBQ0EsZUFBQSxXQUFBOzs7O1lBSUEsT0FBQSxXQUFBOzs7UUFHQSxLQUFBLHFCQUFBLFVBQUEsWUFBQTtZQUNBLElBQUEsUUFBQSxnQkFBQSxPQUFBO2dCQUNBLGVBQUEsV0FBQTtnQkFDQSxVQUFBLGNBQUE7Z0JBQ0EsWUFBQTs7O1lBR0EsTUFBQSxTQUFBLEtBQUEsWUFBQTtnQkFDQSxXQUFBLE9BQUEsS0FBQTs7O1lBR0EsTUFBQSxTQUFBLE1BQUEsSUFBQTs7WUFFQSxPQUFBOzs7UUFHQSxLQUFBLHVCQUFBLFVBQUEsWUFBQSxPQUFBOztZQUVBLElBQUEsUUFBQSxXQUFBLE9BQUEsUUFBQTtZQUNBLElBQUEsUUFBQSxDQUFBLEdBQUE7Z0JBQ0EsT0FBQSxnQkFBQSxPQUFBLENBQUEsSUFBQSxNQUFBLEtBQUEsWUFBQTs7O29CQUdBLFFBQUEsV0FBQSxPQUFBLFFBQUE7b0JBQ0EsV0FBQSxPQUFBLE9BQUEsT0FBQTttQkFDQSxJQUFBOzs7O1FBSUEsS0FBQSxVQUFBLFlBQUE7WUFDQSxJQUFBLE9BQUE7WUFDQSxJQUFBLE1BQUE7WUFDQSxJQUFBLFFBQUEsVUFBQSxPQUFBO2dCQUNBLElBQUEsU0FBQSxNQUFBO2dCQUNBLElBQUEsS0FBQSxLQUFBLFNBQUE7b0JBQ0EsS0FBQSxLQUFBLFFBQUEsS0FBQTt1QkFDQTtvQkFDQSxLQUFBLEtBQUEsVUFBQSxDQUFBOzs7O1lBSUEsS0FBQSxRQUFBLEtBQUEsVUFBQSxRQUFBO2dCQUNBLEtBQUEsT0FBQSxRQUFBO29CQUNBLEtBQUEsT0FBQTtvQkFDQSxPQUFBLEtBQUEsUUFBQTs7OztZQUlBLE9BQUE7OztRQUdBLEtBQUEsU0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsS0FBQSxjQUFBLFVBQUEsT0FBQTtZQUNBLGdCQUFBOzs7UUFHQSxLQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLEtBQUEsY0FBQSxZQUFBO1lBQ0EsT0FBQSxDQUFBLENBQUE7OztRQUdBLEtBQUEsdUJBQUEsVUFBQSxZQUFBO1lBQ0Esb0JBQUE7OztRQUdBLEtBQUEsdUJBQUEsWUFBQTtZQUNBLE9BQUE7Ozs7UUFJQSxDQUFBLFVBQUEsT0FBQTtZQUNBLElBQUEsV0FBQSxHQUFBO1lBQ0EsTUFBQSxVQUFBLFNBQUE7O1lBRUEsSUFBQSxXQUFBLENBQUE7OztZQUdBLElBQUEsZUFBQSxZQUFBO2dCQUNBLElBQUEsRUFBQSxhQUFBLFlBQUEsUUFBQTtvQkFDQSxTQUFBLFFBQUE7Ozs7WUFJQSxPQUFBLFFBQUEsTUFBQSxNQUFBOztZQUVBLFlBQUEsUUFBQSxVQUFBLElBQUE7Z0JBQ0EsUUFBQSxJQUFBLENBQUEsSUFBQSxLQUFBLFVBQUEsU0FBQTtvQkFDQSxPQUFBLFFBQUEsUUFBQSxhQUFBLE1BQUEsQ0FBQSxZQUFBLEtBQUE7OztXQUdBOzs7Ozs7Ozs7OztBQ3hIQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxnR0FBQSxVQUFBLEtBQUEsUUFBQSxhQUFBLFVBQUEsUUFBQSxXQUFBLFFBQUE7RUFDQTs7UUFFQSxJQUFBLHFCQUFBLElBQUEsR0FBQTtRQUNBLElBQUEsbUJBQUEsSUFBQSxHQUFBLE9BQUEsT0FBQTtZQUNBLFVBQUE7O1FBRUEsSUFBQSxrQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsUUFBQTtZQUNBLE9BQUEsT0FBQTtZQUNBLFFBQUE7Ozs7RUFJQSxJQUFBLFNBQUEsSUFBQSxHQUFBLFlBQUEsT0FBQTtHQUNBLE9BQUEsT0FBQTtZQUNBLFFBQUEsQ0FBQTs7WUFFQSxPQUFBOzs7RUFHQSxJQUFBLG1CQUFBLE9BQUE7O0VBRUEsSUFBQSxTQUFBLElBQUEsR0FBQSxZQUFBLE9BQUE7R0FDQSxVQUFBOzs7O0dBSUEsaUJBQUEsU0FBQSxPQUFBO0lBQ0EsT0FBQSxHQUFBLE9BQUEsVUFBQSxhQUFBLFVBQUEsR0FBQSxPQUFBLFVBQUEsWUFBQTs7OztRQUlBLE9BQUEsVUFBQTs7UUFFQSxJQUFBLFlBQUEsSUFBQSxHQUFBLFlBQUEsVUFBQTtZQUNBLFVBQUE7OztRQUdBLFVBQUEsVUFBQTs7O0VBR0EsSUFBQTs7UUFFQSxJQUFBOzs7O1FBSUEsSUFBQSx5QkFBQTs7UUFFQSxJQUFBLFFBQUE7O1FBRUEsSUFBQSwwQkFBQSxVQUFBLFlBQUE7WUFDQSxNQUFBO1lBQ0EsSUFBQSxZQUFBO2dCQUNBLGlCQUFBLEtBQUE7Z0JBQ0EsSUFBQSxVQUFBLElBQUEsV0FBQSxlQUFBLElBQUEsV0FBQTtvQkFDQSxTQUFBLENBQUEsSUFBQSxJQUFBLElBQUE7Ozs7Ozs7RUFPQSxJQUFBLHFCQUFBLFVBQUEsT0FBQTtHQUNBLE9BQUEsQ0FBQSxHQUFBLE1BQUEsSUFBQSxHQUFBLE9BQUEsYUFBQSxTQUFBLE1BQUE7Ozs7O0VBS0EsSUFBQSxtQkFBQSxVQUFBLE9BQUE7R0FDQSxPQUFBLENBQUEsTUFBQSxHQUFBLE9BQUEsYUFBQSxTQUFBLE1BQUE7Ozs7O0VBS0EsSUFBQSxpQkFBQSxVQUFBLFVBQUE7R0FDQSxRQUFBLFNBQUE7SUFDQSxLQUFBOztLQUVBLE9BQUEsQ0FBQSxTQUFBLGFBQUEsQ0FBQSxTQUFBLGFBQUE7SUFDQSxLQUFBO0lBQ0EsS0FBQTtLQUNBLE9BQUEsU0FBQSxpQkFBQTtJQUNBLEtBQUE7S0FDQSxPQUFBLENBQUEsU0FBQTtJQUNBO0tBQ0EsT0FBQSxTQUFBOzs7OztFQUtBLElBQUEsdUJBQUEsVUFBQSxHQUFBO0dBQ0EsSUFBQSxVQUFBLEVBQUE7R0FDQSxJQUFBLE9BQUEsWUFBQTtJQUNBLElBQUEsY0FBQSxlQUFBLFFBQUE7SUFDQSxRQUFBLFdBQUEsU0FBQSxZQUFBLElBQUE7SUFDQSxRQUFBLFdBQUE7Ozs7R0FJQSxTQUFBLE1BQUEsS0FBQSxRQUFBLFdBQUE7OztFQUdBLElBQUEsZ0JBQUEsVUFBQSxZQUFBO0dBQ0EsSUFBQTtHQUNBLElBQUEsU0FBQSxXQUFBLE9BQUEsSUFBQTs7R0FFQSxRQUFBLFdBQUE7SUFDQSxLQUFBO0tBQ0EsV0FBQSxJQUFBLEdBQUEsS0FBQSxNQUFBLE9BQUE7S0FDQTtJQUNBLEtBQUE7S0FDQSxXQUFBLElBQUEsR0FBQSxLQUFBLFVBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTs7S0FFQSxXQUFBLElBQUEsR0FBQSxLQUFBLFFBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTtLQUNBLFdBQUEsSUFBQSxHQUFBLEtBQUEsV0FBQTtLQUNBO0lBQ0EsS0FBQTs7S0FFQSxXQUFBLElBQUEsR0FBQSxLQUFBLE9BQUEsT0FBQSxJQUFBLE9BQUEsR0FBQTtLQUNBOztnQkFFQTtvQkFDQSxRQUFBLE1BQUEsK0JBQUEsV0FBQTtvQkFDQTs7O0dBR0EsSUFBQSxVQUFBLElBQUEsR0FBQSxRQUFBLEVBQUEsVUFBQTtZQUNBLFFBQUEsYUFBQTtZQUNBLElBQUEsV0FBQSxVQUFBLFdBQUEsT0FBQSxTQUFBLEdBQUE7Z0JBQ0EsUUFBQSxRQUFBLFdBQUEsT0FBQSxHQUFBLE1BQUE7O0dBRUEsUUFBQSxHQUFBLFVBQUE7WUFDQSxpQkFBQSxXQUFBOzs7RUFHQSxJQUFBLHFCQUFBLFVBQUEsR0FBQSxPQUFBOztZQUVBLGlCQUFBO0dBQ0EsTUFBQTs7R0FFQSxZQUFBLE1BQUEsQ0FBQSxJQUFBLE1BQUEsTUFBQSxTQUFBLEtBQUEsWUFBQTtJQUNBLFlBQUEsUUFBQTs7OztFQUlBLElBQUEsbUJBQUEsVUFBQSxHQUFBO0dBQ0EsSUFBQSxXQUFBLEVBQUEsUUFBQTtHQUNBLElBQUEsY0FBQSxlQUFBO1lBQ0EsSUFBQSxRQUFBLE9BQUE7O1lBRUEsRUFBQSxRQUFBLFFBQUEsTUFBQTs7R0FFQSxFQUFBLFFBQUEsYUFBQSxZQUFBLElBQUE7SUFDQSxJQUFBLE9BQUE7SUFDQSxPQUFBLFNBQUE7SUFDQSxRQUFBLFlBQUEsSUFBQTtnQkFDQSxVQUFBLE1BQUE7Z0JBQ0EsWUFBQSxPQUFBOzs7O0dBSUEsRUFBQSxRQUFBLFdBQUEsU0FBQSxNQUFBLFlBQUE7Z0JBQ0EsaUJBQUEsY0FBQSxFQUFBOzs7R0FHQSxFQUFBLFFBQUEsR0FBQSxVQUFBOztZQUVBLE9BQUEsRUFBQSxRQUFBLFdBQUE7OztFQUdBLEtBQUEsT0FBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFNBQUE7R0FDQSxJQUFBLGVBQUE7WUFDQSxJQUFBLGVBQUE7WUFDQSxJQUFBLGVBQUE7R0FDQSxNQUFBLElBQUEsZUFBQTs7R0FFQSxpQkFBQSxHQUFBLGlCQUFBLFlBQUE7O0lBRUEsSUFBQSxDQUFBLE1BQUEsU0FBQTs7S0FFQSxNQUFBOzs7OztFQUtBLEtBQUEsZUFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLFVBQUE7WUFDQSxPQUFBLFVBQUE7WUFDQSxNQUFBOztZQUVBLElBQUEsa0JBQUE7O0dBRUEsY0FBQSxRQUFBO0dBQ0EsT0FBQSxJQUFBLEdBQUEsWUFBQSxLQUFBO2dCQUNBLFFBQUE7SUFDQSxNQUFBO0lBQ0EsT0FBQSxPQUFBOzs7R0FHQSxJQUFBLGVBQUE7R0FDQSxLQUFBLEdBQUEsV0FBQTs7O0VBR0EsS0FBQSxnQkFBQSxZQUFBO0dBQ0EsSUFBQSxrQkFBQTtZQUNBLEtBQUEsVUFBQTtZQUNBLGNBQUE7WUFDQSxPQUFBLFVBQUE7WUFDQSxPQUFBLFVBQUE7O0dBRUEsTUFBQTs7O1FBR0EsS0FBQSxZQUFBLFlBQUE7WUFDQSxPQUFBLFFBQUEsS0FBQTs7O1FBR0EsS0FBQSxjQUFBLFlBQUE7WUFDQSxJQUFBLE1BQUEsYUFBQTtnQkFDQSxNQUFBOztZQUVBLFVBQUEsVUFBQTs7O1FBR0EsS0FBQSxlQUFBLFlBQUE7WUFDQSxVQUFBLFVBQUE7OztRQUdBLEtBQUEsV0FBQSxZQUFBO1lBQ0EsT0FBQSxVQUFBOzs7RUFHQSxLQUFBLGlCQUFBLFlBQUE7R0FDQSxpQkFBQSxRQUFBLFVBQUEsU0FBQTtJQUNBLFlBQUEsT0FBQSxRQUFBLFlBQUEsS0FBQSxZQUFBO0tBQ0EsaUJBQUEsY0FBQTtLQUNBLGlCQUFBLE9BQUE7Ozs7O0VBS0EsS0FBQSxTQUFBLFVBQUEsSUFBQTtHQUNBLElBQUE7R0FDQSxpQkFBQSxlQUFBLFVBQUEsR0FBQTtJQUNBLElBQUEsRUFBQSxXQUFBLE9BQUEsSUFBQTtLQUNBLFVBQUE7Ozs7R0FJQSxJQUFBLENBQUEsaUJBQUEsT0FBQSxVQUFBO0lBQ0EsaUJBQUEsS0FBQTs7Ozs7UUFLQSxLQUFBLE1BQUEsVUFBQSxJQUFBO1lBQ0EsaUJBQUEsZUFBQSxVQUFBLEdBQUE7Z0JBQ0EsSUFBQSxFQUFBLFdBQUEsT0FBQSxJQUFBOztvQkFFQSxJQUFBLE9BQUEsSUFBQTtvQkFDQSxJQUFBLE1BQUEsR0FBQSxVQUFBLElBQUE7d0JBQ0EsUUFBQSxLQUFBOztvQkFFQSxJQUFBLE9BQUEsR0FBQSxVQUFBLEtBQUE7d0JBQ0EsWUFBQSxLQUFBOztvQkFFQSxJQUFBLGFBQUEsS0FBQTtvQkFDQSxLQUFBLElBQUEsRUFBQSxlQUFBLElBQUE7Ozs7O0VBS0EsS0FBQSxpQkFBQSxZQUFBO0dBQ0EsaUJBQUE7OztFQUdBLEtBQUEsc0JBQUEsWUFBQTtHQUNBLE9BQUE7OztRQUdBLEtBQUEseUJBQUEsWUFBQTtZQUNBLE9BQUE7Ozs7UUFJQSxLQUFBLGFBQUEsVUFBQSxTQUFBO1lBQ0EsaUJBQUEsV0FBQTtZQUNBLE9BQUEsaUJBQUEsQ0FBQSxTQUFBOzs7UUFHQSxLQUFBLGFBQUEsVUFBQSxTQUFBO1lBQ0EsZ0JBQUEsV0FBQTs7O1FBR0EsS0FBQSxZQUFBLFlBQUE7WUFDQSx5QkFBQSxDQUFBLHlCQUFBLEtBQUEsbUJBQUE7WUFDQSxNQUFBOzs7UUFHQSxLQUFBLFVBQUEsWUFBQTtZQUNBLE9BQUEsQ0FBQSx5QkFBQSxLQUFBLG1CQUFBOzs7UUFHQSxLQUFBLGdCQUFBLFlBQUE7O1lBRUEseUJBQUEsQ0FBQSx5QkFBQSxtQkFBQSxjQUFBLEtBQUEsbUJBQUE7WUFDQSxNQUFBOzs7UUFHQSxLQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUEseUJBQUE7OztRQUdBLEtBQUEsZ0JBQUEsWUFBQTs7WUFFQSxZQUFBLGFBQUEsS0FBQSxZQUFBO2dCQUNBLHdCQUFBLG1CQUFBLEtBQUE7Ozs7UUFJQSxLQUFBLGNBQUEsWUFBQTtZQUNBLHlCQUFBO1lBQ0EsTUFBQTs7O1FBR0EsS0FBQSxhQUFBLFlBQUE7WUFDQSxZQUFBLGFBQUEsS0FBQSxZQUFBOztnQkFFQSxJQUFBLG1CQUFBLGdCQUFBLEdBQUE7b0JBQ0EseUJBQUEsbUJBQUEsY0FBQTs7Z0JBRUEsTUFBQTs7Ozs7UUFLQSxLQUFBLFVBQUEsVUFBQSxPQUFBO1lBQ0EsSUFBQSxhQUFBLGlCQUFBLEtBQUE7WUFDQSxJQUFBLENBQUEsWUFBQTtZQUNBLFFBQUEsU0FBQTs7WUFFQSxJQUFBLFNBQUEsWUFBQTtnQkFDQSxJQUFBLGlCQUFBLGNBQUEsR0FBQTtvQkFDQSxpQkFBQTt1QkFDQTtvQkFDQSxpQkFBQSxLQUFBOzs7O1lBSUEsVUFBQSxRQUFBLEtBQUEsUUFBQTs7O1FBR0EsS0FBQSxhQUFBLFlBQUE7WUFDQSxPQUFBLG1CQUFBLEtBQUEsd0JBQUE7Ozs7Ozs7Ozs7OztBQ3hXQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxvQkFBQSxVQUFBLEtBQUE7RUFDQTtFQUNBLElBQUEsU0FBQSxDQUFBLEdBQUEsR0FBQSxHQUFBOztFQUVBLElBQUEsYUFBQSxJQUFBLEdBQUEsS0FBQSxXQUFBO0dBQ0EsTUFBQTtHQUNBLE9BQUE7R0FDQSxRQUFBOzs7RUFHQSxJQUFBLGFBQUEsSUFBQSxHQUFBLE1BQUE7O0VBRUEsS0FBQSxPQUFBLFVBQUEsT0FBQTtHQUNBLElBQUEsU0FBQTs7O0dBR0EsTUFBQSxJQUFBLGVBQUEsVUFBQSxHQUFBLE9BQUE7SUFDQSxPQUFBLEtBQUEsTUFBQTtJQUNBLE9BQUEsS0FBQSxNQUFBOztJQUVBLElBQUEsT0FBQSxNQUFBLFNBQUE7O0lBRUEsSUFBQSxTQUFBLE1BQUEsU0FBQTs7SUFFQSxJQUFBLE9BQUEsT0FBQSxhQUFBLE9BQUEsT0FBQSxXQUFBO0tBQ0EsU0FBQSxHQUFBLE9BQUEsVUFBQTs7O0lBR0EsSUFBQSxjQUFBLElBQUEsR0FBQSxPQUFBLFlBQUE7S0FDQSxLQUFBLE1BQUE7S0FDQSxZQUFBO0tBQ0EsYUFBQTs7O0lBR0EsV0FBQSxVQUFBOztJQUVBLElBQUEsUUFBQSxJQUFBLEdBQUEsS0FBQTtLQUNBLFlBQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQTtLQUNBLFlBQUE7O0tBRUEsZUFBQTs7S0FFQSxRQUFBOzs7O0lBSUEsSUFBQSxTQUFBLFdBQUE7S0FDQSxJQUFBLFVBQUEsSUFBQSxRQUFBLElBQUE7Ozs7O0VBS0EsS0FBQSxZQUFBLFlBQUE7R0FDQSxPQUFBOzs7RUFHQSxLQUFBLGdCQUFBLFlBQUE7R0FDQSxPQUFBOzs7UUFHQSxLQUFBLFdBQUEsWUFBQTtZQUNBLE9BQUE7Ozs7Ozs7Ozs7OztBQy9EQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxVQUFBLFlBQUE7RUFDQTs7UUFFQSxJQUFBLFFBQUE7O1FBRUEsS0FBQSxTQUFBO1lBQ0EsT0FBQSxDQUFBLEtBQUEsS0FBQSxLQUFBO1lBQ0EsTUFBQSxDQUFBLEdBQUEsS0FBQSxLQUFBO1lBQ0EsUUFBQTs7O1FBR0EsSUFBQSxzQkFBQTtRQUNBLElBQUEscUJBQUE7O1FBRUEsSUFBQSx1QkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLHdCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsZ0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsSUFBQSxpQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLG9CQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O1FBR0EsSUFBQSxxQkFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7OztRQUdBLElBQUEsc0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsSUFBQSx1QkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLHNCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7WUFDQSxVQUFBLENBQUE7OztRQUdBLElBQUEsZ0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTtZQUNBLFVBQUEsQ0FBQTs7O1FBR0EsSUFBQSxjQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O1FBR0EsSUFBQSxlQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O0VBR0EsS0FBQSxXQUFBLFVBQUEsU0FBQTtZQUNBLElBQUEsUUFBQSxRQUFBLFNBQUEsTUFBQSxRQUFBLFNBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQTtnQkFDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO29CQUNBLFFBQUE7b0JBQ0EsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO3dCQUNBLFFBQUE7d0JBQ0EsTUFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBOzRCQUNBLE9BQUE7O3dCQUVBLFFBQUE7OztnQkFHQSxJQUFBLEdBQUEsTUFBQSxNQUFBO29CQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTt3QkFDQSxPQUFBO3dCQUNBLE9BQUE7Ozs7OztFQU1BLEtBQUEsWUFBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUE7S0FDQSxRQUFBOztnQkFFQSxRQUFBOztHQUVBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBO2dCQUNBLFFBQUE7Ozs7RUFJQSxLQUFBLFVBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLE9BQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLFFBQUE7S0FDQSxNQUFBO0tBQ0EsUUFBQTs7O0dBR0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUE7Ozs7RUFJQSxLQUFBLFdBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQTs7R0FFQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO29CQUNBLE9BQUEsS0FBQSxPQUFBO29CQUNBLE9BQUE7Ozs7Ozs7Ozs7Ozs7O0FDbklBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLGFBQUEsWUFBQTtFQUNBOztFQUVBLElBQUEsUUFBQTs7O0VBR0EsSUFBQSxjQUFBLFlBQUE7R0FDQSxJQUFBLFNBQUEsU0FBQSxLQUFBLFFBQUEsS0FBQTs4QkFDQSxNQUFBOztHQUVBLElBQUEsUUFBQTs7R0FFQSxPQUFBLFFBQUEsVUFBQSxPQUFBOztJQUVBLElBQUEsVUFBQSxNQUFBLE1BQUE7SUFDQSxJQUFBLFdBQUEsUUFBQSxXQUFBLEdBQUE7S0FDQSxNQUFBLFFBQUEsTUFBQSxtQkFBQSxRQUFBOzs7O0dBSUEsT0FBQTs7OztFQUlBLElBQUEsY0FBQSxVQUFBLE9BQUE7R0FDQSxJQUFBLFNBQUE7R0FDQSxLQUFBLElBQUEsT0FBQSxPQUFBO0lBQ0EsVUFBQSxNQUFBLE1BQUEsbUJBQUEsTUFBQSxRQUFBOztHQUVBLE9BQUEsT0FBQSxVQUFBLEdBQUEsT0FBQSxTQUFBOzs7RUFHQSxLQUFBLFlBQUEsVUFBQSxHQUFBO0dBQ0EsTUFBQSxPQUFBO0dBQ0EsUUFBQSxVQUFBLE9BQUEsSUFBQSxNQUFBLE9BQUEsTUFBQSxZQUFBOzs7O0VBSUEsS0FBQSxNQUFBLFVBQUEsUUFBQTtHQUNBLEtBQUEsSUFBQSxPQUFBLFFBQUE7SUFDQSxNQUFBLE9BQUEsT0FBQTs7R0FFQSxRQUFBLGFBQUEsT0FBQSxJQUFBLE1BQUEsT0FBQSxNQUFBLFlBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsVUFBQSxLQUFBO0dBQ0EsT0FBQSxNQUFBOzs7RUFHQSxRQUFBLFFBQUE7O0VBRUEsSUFBQSxDQUFBLE9BQUE7R0FDQSxRQUFBOzs7RUFHQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBhbm5vdGF0aW9ucyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJywgWydkaWFzLmFwaScsICdkaWFzLnVpJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGFubm90YXRpb25MaXN0SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBbiBhbm5vdGF0aW9uIGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5kaXJlY3RpdmUoJ2Fubm90YXRpb25MaXN0SXRlbScsIGZ1bmN0aW9uIChsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRzY29wZTogdHJ1ZSxcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0JHNjb3BlLnNoYXBlQ2xhc3MgPSAnaWNvbi0nICsgJHNjb3BlLmFubm90YXRpb24uc2hhcGUudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0XHQkc2NvcGUuc2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS5pc1NlbGVjdGVkKCRzY29wZS5hbm5vdGF0aW9uLmlkKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuYXR0YWNoTGFiZWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0bGFiZWxzLmF0dGFjaFRvQW5ub3RhdGlvbigkc2NvcGUuYW5ub3RhdGlvbik7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLnJlbW92ZUxhYmVsID0gZnVuY3Rpb24gKGxhYmVsKSB7XG5cdFx0XHRcdFx0bGFiZWxzLnJlbW92ZUZyb21Bbm5vdGF0aW9uKCRzY29wZS5hbm5vdGF0aW9uLCBsYWJlbCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmNhbkF0dGFjaExhYmVsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuc2VsZWN0ZWQoKSAmJiBsYWJlbHMuaGFzU2VsZWN0ZWQoKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudExhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkO1xuXG5cdFx0XHRcdCRzY29wZS5jdXJyZW50Q29uZmlkZW5jZSA9IGxhYmVscy5nZXRDdXJyZW50Q29uZmlkZW5jZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhYmVsQ2F0ZWdvcnlJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgbGFiZWwgY2F0ZWdvcnkgbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmRpcmVjdGl2ZSgnbGFiZWxDYXRlZ29yeUl0ZW0nLCBmdW5jdGlvbiAoJGNvbXBpbGUsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdDJyxcblxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdsYWJlbC1pdGVtLmh0bWwnLFxuXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHdhaXQgZm9yIHRoaXMgZWxlbWVudCB0byBiZSByZW5kZXJlZCB1bnRpbCB0aGUgY2hpbGRyZW4gYXJlXG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kZWQsIG90aGVyd2lzZSB0aGVyZSB3b3VsZCBiZSB0b28gbXVjaCByZWN1cnNpb24gZm9yXG4gICAgICAgICAgICAgICAgLy8gYW5ndWxhclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnbGFiZWwtc3VidHJlZS5odG1sJykpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoY29udGVudCkoc2NvcGUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIHRoZSBzdWJ0cmVlIG9mIHRoaXMgaXRlbVxuICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaGFzIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzRXhwYW5kYWJsZSA9ICRzY29wZS50cmVlICYmICEhJHNjb3BlLnRyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8gaGFuZGxlIHRoaXMgYnkgdGhlIGV2ZW50IHJhdGhlciB0aGFuIGFuIG93biBjbGljayBoYW5kbGVyIHRvXG4gICAgICAgICAgICAgICAgLy8gZGVhbCB3aXRoIGNsaWNrIGFuZCBzZWFyY2ggZmllbGQgYWN0aW9ucyBpbiBhIHVuaWZpZWQgd2F5XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGZ1bmN0aW9uIChlLCBjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbiBpdGVtIGlzIHNlbGVjdGVkLCBpdHMgc3VidHJlZSBhbmQgYWxsIHBhcmVudCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgb3BlbmVkXG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5pZCA9PT0gY2F0ZWdvcnkuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBoaXRzIGFsbCBwYXJlbnQgc2NvcGVzL2l0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGEgY2hpbGQgaXRlbSB3YXMgc2VsZWN0ZWQsIHRoaXMgaXRlbSBzaG91bGQgYmUgb3BlbmVkLCB0b29cbiAgICAgICAgICAgICAgICAvLyBzbyB0aGUgc2VsZWN0ZWQgaXRlbSBiZWNvbWVzIHZpc2libGUgaW4gdGhlIHRyZWVcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3AgcHJvcGFnYXRpb24gaWYgdGhpcyBpcyBhIHJvb3QgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0ucGFyZW50X2lkID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYWJlbEl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQW4gYW5ub3RhdGlvbiBsYWJlbCBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZGlyZWN0aXZlKCdsYWJlbEl0ZW0nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFx0XHR2YXIgY29uZmlkZW5jZSA9ICRzY29wZS5hbm5vdGF0aW9uTGFiZWwuY29uZmlkZW5jZTtcblxuXHRcdFx0XHRpZiAoY29uZmlkZW5jZSA8PSAwLjI1KSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLWRhbmdlcic7XG5cdFx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjUgKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXdhcm5pbmcnO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC43NSApIHtcblx0XHRcdFx0XHQkc2NvcGUuY2xhc3MgPSAnbGFiZWwtc3VjY2Vzcyc7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXByaW1hcnknO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQW5ub3RhdGlvbnNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBhbm5vdGF0aW9ucyBsaXN0IGluIHRoZSBzaWRlYmFyXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQW5ub3RhdGlvbnNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMsIGxhYmVscywgYW5ub3RhdGlvbnMsIHNoYXBlcykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLnNlbGVjdGVkRmVhdHVyZXMgPSBtYXBBbm5vdGF0aW9ucy5nZXRTZWxlY3RlZEZlYXR1cmVzKCkuZ2V0QXJyYXkoKTtcblxuXHRcdHZhciByZWZyZXNoQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuYW5ub3RhdGlvbnMgPSBhbm5vdGF0aW9ucy5jdXJyZW50KCk7XG5cdFx0fTtcblxuXHRcdHZhciBzZWxlY3RlZEZlYXR1cmVzID0gbWFwQW5ub3RhdGlvbnMuZ2V0U2VsZWN0ZWRGZWF0dXJlcygpO1xuXG5cdFx0JHNjb3BlLmFubm90YXRpb25zID0gW107XG5cblx0XHQkc2NvcGUuY2xlYXJTZWxlY3Rpb24gPSBtYXBBbm5vdGF0aW9ucy5jbGVhclNlbGVjdGlvbjtcblxuXHRcdCRzY29wZS5zZWxlY3RBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGUsIGlkKSB7XG5cdFx0XHQvLyBhbGxvdyBtdWx0aXBsZSBzZWxlY3Rpb25zXG5cdFx0XHRpZiAoIWUuc2hpZnRLZXkpIHtcblx0XHRcdFx0JHNjb3BlLmNsZWFyU2VsZWN0aW9uKCk7XG5cdFx0XHR9XG5cdFx0XHRtYXBBbm5vdGF0aW9ucy5zZWxlY3QoaWQpO1xuXHRcdH07XG5cbiAgICAgICAgJHNjb3BlLmZpdEFubm90YXRpb24gPSBtYXBBbm5vdGF0aW9ucy5maXQ7XG5cblx0XHQkc2NvcGUuaXNTZWxlY3RlZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIHNlbGVjdGVkID0gZmFsc2U7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmZvckVhY2goZnVuY3Rpb24gKGZlYXR1cmUpIHtcblx0XHRcdFx0aWYgKGZlYXR1cmUuYW5ub3RhdGlvbiAmJiBmZWF0dXJlLmFubm90YXRpb24uaWQgPT0gaWQpIHtcblx0XHRcdFx0XHRzZWxlY3RlZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIHNlbGVjdGVkO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIHJlZnJlc2hBbm5vdGF0aW9ucyk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEFubm90YXRvckNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFpbiBjb250cm9sbGVyIG9mIHRoZSBBbm5vdGF0b3IgYXBwbGljYXRpb24uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQW5ub3RhdG9yQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGltYWdlcywgdXJsUGFyYW1zLCBtc2csIElNQUdFX0lELCBrZXlib2FyZCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuaW1hZ2VzID0gaW1hZ2VzO1xuICAgICAgICAkc2NvcGUuaW1hZ2VMb2FkaW5nID0gdHJ1ZTtcblxuICAgICAgICAvLyB0aGUgY3VycmVudCBjYW52YXMgdmlld3BvcnQsIHN5bmNlZCB3aXRoIHRoZSBVUkwgcGFyYW1ldGVyc1xuICAgICAgICAkc2NvcGUudmlld3BvcnQgPSB7XG4gICAgICAgICAgICB6b29tOiB1cmxQYXJhbXMuZ2V0KCd6JyksXG4gICAgICAgICAgICBjZW50ZXI6IFt1cmxQYXJhbXMuZ2V0KCd4JyksIHVybFBhcmFtcy5nZXQoJ3knKV1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmaW5pc2ggaW1hZ2UgbG9hZGluZyBwcm9jZXNzXG4gICAgICAgIHZhciBmaW5pc2hMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2ltYWdlLnNob3duJywgJHNjb3BlLmltYWdlcy5jdXJyZW50SW1hZ2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5XG4gICAgICAgIHZhciBwdXNoU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB1cmxQYXJhbXMucHVzaFN0YXRlKCRzY29wZS5pbWFnZXMuY3VycmVudEltYWdlLl9pZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc3RhcnQgaW1hZ2UgbG9hZGluZyBwcm9jZXNzXG4gICAgICAgIHZhciBzdGFydExvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBsb2FkIHRoZSBpbWFnZSBieSBpZC4gZG9lc24ndCBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeSBieSBpdHNlbGZcbiAgICAgICAgdmFyIGxvYWRJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgc3RhcnRMb2FkaW5nKCk7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VzLnNob3cocGFyc2VJbnQoaWQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzaG93IHRoZSBuZXh0IGltYWdlIGFuZCBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeVxuICAgICAgICAkc2NvcGUubmV4dEltYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc3RhcnRMb2FkaW5nKCk7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VzLm5leHQoKVxuICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgIC50aGVuKHB1c2hTdGF0ZSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2hvdyB0aGUgcHJldmlvdXMgaW1hZ2UgYW5kIGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5XG4gICAgICAgICRzY29wZS5wcmV2SW1hZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZXMucHJldigpXG4gICAgICAgICAgICAgICAgICAudGhlbihmaW5pc2hMb2FkaW5nKVxuICAgICAgICAgICAgICAgICAgLnRoZW4ocHVzaFN0YXRlKVxuICAgICAgICAgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyB1cGRhdGUgdGhlIFVSTCBwYXJhbWV0ZXJzIG9mIHRoZSB2aWV3cG9ydFxuICAgICAgICAkc2NvcGUuJG9uKCdjYW52YXMubW92ZWVuZCcsIGZ1bmN0aW9uKGUsIHBhcmFtcykge1xuICAgICAgICAgICAgJHNjb3BlLnZpZXdwb3J0Lnpvb20gPSBwYXJhbXMuem9vbTtcbiAgICAgICAgICAgICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMF0gPSBNYXRoLnJvdW5kKHBhcmFtcy5jZW50ZXJbMF0pO1xuICAgICAgICAgICAgJHNjb3BlLnZpZXdwb3J0LmNlbnRlclsxXSA9IE1hdGgucm91bmQocGFyYW1zLmNlbnRlclsxXSk7XG4gICAgICAgICAgICB1cmxQYXJhbXMuc2V0KHtcbiAgICAgICAgICAgICAgICB6OiAkc2NvcGUudmlld3BvcnQuem9vbSxcbiAgICAgICAgICAgICAgICB4OiAkc2NvcGUudmlld3BvcnQuY2VudGVyWzBdLFxuICAgICAgICAgICAgICAgIHk6ICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMV1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbigzNywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnByZXZJbWFnZSgpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbigzOSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLm5leHRJbWFnZSgpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbigzMiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLm5leHRJbWFnZSgpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBsaXN0ZW4gdG8gdGhlIGJyb3dzZXIgXCJiYWNrXCIgYnV0dG9uXG4gICAgICAgIHdpbmRvdy5vbnBvcHN0YXRlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHN0YXRlID0gZS5zdGF0ZTtcbiAgICAgICAgICAgIGlmIChzdGF0ZSAmJiBzdGF0ZS5zbHVnICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBsb2FkSW1hZ2Uoc3RhdGUuc2x1Zyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSB0aGUgaW1hZ2VzIHNlcnZpY2VcbiAgICAgICAgaW1hZ2VzLmluaXQoKTtcbiAgICAgICAgLy8gZGlzcGxheSB0aGUgZmlyc3QgaW1hZ2VcbiAgICAgICAgbG9hZEltYWdlKElNQUdFX0lEKS50aGVuKHB1c2hTdGF0ZSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQ2FudmFzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBNYWluIGNvbnRyb2xsZXIgZm9yIHRoZSBhbm5vdGF0aW9uIGNhbnZhcyBlbGVtZW50XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQ2FudmFzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEltYWdlLCBtYXBBbm5vdGF0aW9ucywgbWFwLCAkdGltZW91dCwgZGVib3VuY2UpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgbWFwVmlldyA9IG1hcC5nZXRWaWV3KCk7XG5cblx0XHQvLyB1cGRhdGUgdGhlIFVSTCBwYXJhbWV0ZXJzXG5cdFx0bWFwLm9uKCdtb3ZlZW5kJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIGVtaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdjYW52YXMubW92ZWVuZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgY2VudGVyOiBtYXBWaWV3LmdldENlbnRlcigpLFxuICAgICAgICAgICAgICAgICAgICB6b29tOiBtYXBWaWV3LmdldFpvb20oKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gZG9udCB1cGRhdGUgaW1tZWRpYXRlbHkgYnV0IHdhaXQgZm9yIHBvc3NpYmxlIG5ldyBjaGFuZ2VzXG4gICAgICAgICAgICBkZWJvdW5jZShlbWl0LCAxMDAsICdhbm5vdGF0b3IuY2FudmFzLm1vdmVlbmQnKTtcblx0XHR9KTtcblxuICAgICAgICBtYXAub24oJ2NoYW5nZTp2aWV3JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWFwVmlldyA9IG1hcC5nZXRWaWV3KCk7XG4gICAgICAgIH0pO1xuXG5cdFx0bWFwSW1hZ2UuaW5pdCgkc2NvcGUpO1xuXHRcdG1hcEFubm90YXRpb25zLmluaXQoJHNjb3BlKTtcblxuXHRcdHZhciB1cGRhdGVTaXplID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0Ly8gd29ya2Fyb3VuZCwgc28gdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZCAqYWZ0ZXIqIHRoZSBhbmd1bGFyIGRpZ2VzdFxuXHRcdFx0Ly8gYW5kICphZnRlciogdGhlIGZvbGRvdXQgd2FzIHJlbmRlcmVkXG5cdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIG5lZWRzIHRvIGJlIHdyYXBwZWQgaW4gYW4gZXh0cmEgZnVuY3Rpb24gc2luY2UgdXBkYXRlU2l6ZSBhY2NlcHRzIGFyZ3VtZW50c1xuXHRcdFx0XHRtYXAudXBkYXRlU2l6ZSgpO1xuXHRcdFx0fSwgNTAsIGZhbHNlKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiRvbignc2lkZWJhci5mb2xkb3V0Lm9wZW4nLCB1cGRhdGVTaXplKTtcblx0XHQkc2NvcGUuJG9uKCdzaWRlYmFyLmZvbGRvdXQuY2xvc2UnLCB1cGRhdGVTaXplKTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQ2F0ZWdvcmllc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgbGFiZWwgY2F0ZWdvcmllcyBmb2xkb3V0XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQ2F0ZWdvcmllc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBsYWJlbHMsIGtleWJvYXJkKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIG1heGltdW0gbnVtYmVyIG9mIGFsbG93ZWQgZmF2b3VyaXRlc1xuICAgICAgICB2YXIgbWF4RmF2b3VyaXRlcyA9IDk7XG4gICAgICAgIHZhciBmYXZvdXJpdGVzU3RvcmFnZUtleSA9ICdkaWFzLmFubm90YXRpb25zLmxhYmVsLWZhdm91cml0ZXMnO1xuXG4gICAgICAgIC8vIHNhdmVzIHRoZSBJRHMgb2YgdGhlIGZhdm91cml0ZXMgaW4gbG9jYWxTdG9yYWdlXG4gICAgICAgIHZhciBzdG9yZUZhdm91cml0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdG1wID0gJHNjb3BlLmZhdm91cml0ZXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uaWQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbZmF2b3VyaXRlc1N0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkodG1wKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXN0b3JlcyB0aGUgZmF2b3VyaXRlcyBmcm9tIHRoZSBJRHMgaW4gbG9jYWxTdG9yYWdlXG4gICAgICAgIHZhciBsb2FkRmF2b3VyaXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW2Zhdm91cml0ZXNTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgICAgIHZhciB0bXAgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbZmF2b3VyaXRlc1N0b3JhZ2VLZXldKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcyA9ICRzY29wZS5jYXRlZ29yaWVzLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IHRha2UgdGhvc2UgY2F0ZWdvcmllcyBhcyBmYXZvdXJpdGVzIHRoYXQgYXJlIGF2YWlsYWJsZSBmb3IgdGhpcyBpbWFnZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG1wLmluZGV4T2YoaXRlbS5pZCkgIT09IC0xO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBjaG9vc2VGYXZvdXJpdGUgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChpbmRleCA+PSAwICYmIGluZGV4IDwgJHNjb3BlLmZhdm91cml0ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdEl0ZW0oJHNjb3BlLmZhdm91cml0ZXNbaW5kZXhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaG90a2V5c01hcCA9IFsn8J2frScsICfwnZ+uJywgJ/Cdn68nLCAn8J2fsCcsICfwnZ+xJywgJ/Cdn7InLCAn8J2fsycsICfwnZ+0JywgJ/Cdn7UnXTtcbiAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXMgPSBbXTtcbiAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMgPSBbXTtcbiAgICAgICAgbGFiZWxzLnByb21pc2UudGhlbihmdW5jdGlvbiAoYWxsKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gYWxsKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXMgPSAkc2NvcGUuY2F0ZWdvcmllcy5jb25jYXQoYWxsW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbG9hZEZhdm91cml0ZXMoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXNUcmVlID0gbGFiZWxzLmdldFRyZWUoKTtcblxuICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICBsYWJlbHMuc2V0U2VsZWN0ZWQoaXRlbSk7XG4gICAgICAgICAgICAkc2NvcGUuc2VhcmNoQ2F0ZWdvcnkgPSAnJzsgLy8gY2xlYXIgc2VhcmNoIGZpZWxkXG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGl0ZW0pO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0Zhdm91cml0ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmZhdm91cml0ZXMuaW5kZXhPZihpdGVtKSAhPT0gLTE7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gYWRkcyBhIG5ldyBpdGVtIHRvIHRoZSBmYXZvdXJpdGVzIG9yIHJlbW92ZXMgaXQgaWYgaXQgaXMgYWxyZWFkeSBhIGZhdm91cml0ZVxuICAgICAgICAkc2NvcGUudG9nZ2xlRmF2b3VyaXRlID0gZnVuY3Rpb24gKGUsIGl0ZW0pIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSAkc2NvcGUuZmF2b3VyaXRlcy5pbmRleE9mKGl0ZW0pO1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSAmJiAkc2NvcGUuZmF2b3VyaXRlcy5sZW5ndGggPCBtYXhGYXZvdXJpdGVzKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMucHVzaChpdGVtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0b3JlRmF2b3VyaXRlcygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJldHVybnMgd2hldGhlciB0aGUgdXNlciBpcyBzdGlsbCBhbGxvd2VkIHRvIGFkZCBmYXZvdXJpdGVzXG4gICAgICAgICRzY29wZS5mYXZvdXJpdGVzTGVmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuZmF2b3VyaXRlcy5sZW5ndGggPCBtYXhGYXZvdXJpdGVzO1xuICAgICAgICB9O1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCcxJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDApO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignMicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSgxKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoMik7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDMpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignNScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg0KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzYnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoNSk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc3JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDYpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignOCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg3KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoOCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENvbmZpZGVuY2VDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBjb25maWRlbmNlIGNvbnRyb2xcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDb25maWRlbmNlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGxhYmVscykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLmNvbmZpZGVuY2UgPSAxLjA7XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdjb25maWRlbmNlJywgZnVuY3Rpb24gKGNvbmZpZGVuY2UpIHtcblx0XHRcdGxhYmVscy5zZXRDdXJyZW50Q29uZmlkZW5jZShwYXJzZUZsb2F0KGNvbmZpZGVuY2UpKTtcblxuXHRcdFx0aWYgKGNvbmZpZGVuY2UgPD0gMC4yNSkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLWRhbmdlcic7XG5cdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC41ICkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXdhcm5pbmcnO1xuXHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNzUgKSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtc3VjY2Vzcyc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXByaW1hcnknO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBEcmF3aW5nQ29udHJvbHNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBjb250cm9scyBiYXIgZHJhd2luZyBidXRvbnNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdEcmF3aW5nQ29udHJvbHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMsIGxhYmVscywgbXNnLCAkYXR0cnMsIGtleWJvYXJkKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuc2VsZWN0U2hhcGUgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgaWYgKG5hbWUgIT09IG51bGwgJiYgJHNjb3BlLnNlbGVjdGVkU2hhcGUoKSAhPT0gbmFtZSkge1xuICAgICAgICAgICAgICAgIGlmICghbGFiZWxzLmhhc1NlbGVjdGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdzaWRlYmFyLmZvbGRvdXQuZG8tb3BlbicsICdjYXRlZ29yaWVzJyk7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5pbmZvKCRhdHRycy5zZWxlY3RDYXRlZ29yeSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cdFx0XHRcdG1hcEFubm90YXRpb25zLnN0YXJ0RHJhd2luZyhuYW1lKTtcblx0XHRcdH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuZmluaXNoRHJhd2luZygpO1xuICAgICAgICAgICAgfVxuXHRcdH07XG5cbiAgICAgICAgJHNjb3BlLnNlbGVjdGVkU2hhcGUgPSBtYXBBbm5vdGF0aW9ucy5nZXRTZWxlY3RlZERyYXdpbmdUeXBlO1xuXG4gICAgICAgIC8vIGRlc2VsZWN0IGRyYXdpbmcgdG9vbCBvbiBlc2NhcGVcbiAgICAgICAga2V5Ym9hcmQub24oMjcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZShudWxsKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ2EnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ1BvaW50Jyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdSZWN0YW5nbGUnKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ2QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ0NpcmNsZScpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignZicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnTGluZVN0cmluZycpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignZycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnUG9seWdvbicpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgRWRpdENvbnRyb2xzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgY29udHJvbHMgYmFyIGVkaXQgYnV0dG9uc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0VkaXRDb250cm9sc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywga2V5Ym9hcmQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuZGVsZXRlU2VsZWN0ZWRBbm5vdGF0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChtYXBBbm5vdGF0aW9ucy5nZXRTZWxlY3RlZEZlYXR1cmVzKCkuZ2V0TGVuZ3RoKCkgPiAwICYmIGNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgYWxsIHNlbGVjdGVkIGFubm90YXRpb25zPycpKSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuZGVsZXRlU2VsZWN0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgc3RhcnRNb3ZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5zdGFydE1vdmluZygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBmaW5pc2hNb3ZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5maW5pc2hNb3ZpbmcoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUubW92ZVNlbGVjdGVkQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmlzTW92aW5nKCkpIHtcbiAgICAgICAgICAgICAgICBmaW5pc2hNb3ZpbmcoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhcnRNb3ZpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNNb3ZpbmcgPSBtYXBBbm5vdGF0aW9ucy5pc01vdmluZztcblxuICAgICAgICBrZXlib2FyZC5vbig0NiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICRzY29wZS5kZWxldGVTZWxlY3RlZEFubm90YXRpb25zKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDI3LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmlzTW92aW5nKCkpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KGZpbmlzaE1vdmluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgkc2NvcGUubW92ZVNlbGVjdGVkQW5ub3RhdGlvbnMpO1xuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgTWluaW1hcENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIG1pbmltYXAgaW4gdGhlIHNpZGViYXJcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdNaW5pbWFwQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcCwgbWFwSW1hZ2UsICRlbGVtZW50LCBzdHlsZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgdmlld3BvcnRTb3VyY2UgPSBuZXcgb2wuc291cmNlLlZlY3RvcigpO1xuXG5cdFx0dmFyIG1pbmltYXAgPSBuZXcgb2wuTWFwKHtcblx0XHRcdHRhcmdldDogJ21pbmltYXAnLFxuXHRcdFx0Ly8gcmVtb3ZlIGNvbnRyb2xzXG5cdFx0XHRjb250cm9sczogW10sXG5cdFx0XHQvLyBkaXNhYmxlIGludGVyYWN0aW9uc1xuXHRcdFx0aW50ZXJhY3Rpb25zOiBbXVxuXHRcdH0pO1xuXG4gICAgICAgIHZhciBtYXBTaXplID0gbWFwLmdldFNpemUoKTtcbiAgICAgICAgdmFyIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuXG5cdFx0Ly8gZ2V0IHRoZSBzYW1lIGxheWVycyB0aGFuIHRoZSBtYXBcblx0XHRtaW5pbWFwLmFkZExheWVyKG1hcEltYWdlLmdldExheWVyKCkpO1xuICAgICAgICBtaW5pbWFwLmFkZExheWVyKG5ldyBvbC5sYXllci5WZWN0b3Ioe1xuICAgICAgICAgICAgc291cmNlOiB2aWV3cG9ydFNvdXJjZSxcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZXMudmlld3BvcnRcbiAgICAgICAgfSkpO1xuXG5cdFx0dmFyIHZpZXdwb3J0ID0gbmV3IG9sLkZlYXR1cmUoKTtcblx0XHR2aWV3cG9ydFNvdXJjZS5hZGRGZWF0dXJlKHZpZXdwb3J0KTtcblxuXHRcdC8vIHJlZnJlc2ggdGhlIHZpZXcgKHRoZSBpbWFnZSBzaXplIGNvdWxkIGhhdmUgYmVlbiBjaGFuZ2VkKVxuXHRcdCRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC5zZXRWaWV3KG5ldyBvbC5WaWV3KHtcblx0XHRcdFx0cHJvamVjdGlvbjogbWFwSW1hZ2UuZ2V0UHJvamVjdGlvbigpLFxuXHRcdFx0XHRjZW50ZXI6IG9sLmV4dGVudC5nZXRDZW50ZXIobWFwSW1hZ2UuZ2V0RXh0ZW50KCkpLFxuXHRcdFx0XHR6b29tOiAwXG5cdFx0XHR9KSk7XG5cdFx0fSk7XG5cblx0XHQvLyBtb3ZlIHRoZSB2aWV3cG9ydCByZWN0YW5nbGUgb24gdGhlIG1pbmltYXBcblx0XHR2YXIgcmVmcmVzaFZpZXdwb3J0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmlld3BvcnQuc2V0R2VvbWV0cnkob2wuZ2VvbS5Qb2x5Z29uLmZyb21FeHRlbnQobWFwVmlldy5jYWxjdWxhdGVFeHRlbnQobWFwU2l6ZSkpKTtcblx0XHR9O1xuXG4gICAgICAgIG1hcC5vbignY2hhbmdlOnNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBTaXplID0gbWFwLmdldFNpemUoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbWFwLm9uKCdjaGFuZ2U6dmlldycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuICAgICAgICB9KTtcblxuXHRcdG1hcC5vbigncG9zdGNvbXBvc2UnLCByZWZyZXNoVmlld3BvcnQpO1xuXG5cdFx0dmFyIGRyYWdWaWV3cG9ydCA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRtYXBWaWV3LnNldENlbnRlcihlLmNvb3JkaW5hdGUpO1xuXHRcdH07XG5cblx0XHRtaW5pbWFwLm9uKCdwb2ludGVyZHJhZycsIGRyYWdWaWV3cG9ydCk7XG5cblx0XHQkZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdG1pbmltYXAudW4oJ3BvaW50ZXJkcmFnJywgZHJhZ1ZpZXdwb3J0KTtcblx0XHR9KTtcblxuXHRcdCRlbGVtZW50Lm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC5vbigncG9pbnRlcmRyYWcnLCBkcmFnVmlld3BvcnQpO1xuXHRcdH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTZWxlY3RlZExhYmVsQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2VsZWN0ZWQgbGFiZWwgZGlzcGxheSBpbiB0aGUgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2VsZWN0ZWRMYWJlbENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuZ2V0U2VsZWN0ZWRMYWJlbCA9IGxhYmVscy5nZXRTZWxlY3RlZDtcblxuICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWRMYWJlbCA9IGxhYmVscy5oYXNTZWxlY3RlZDtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2V0dGluZ3NBbm5vdGF0aW9uT3BhY2l0eUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgc2V0dGluZ3MgZm9sZG91dFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NldHRpbmdzQW5ub3RhdGlvbk9wYWNpdHlDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLnNldERlZmF1bHRTZXR0aW5ncygnYW5ub3RhdGlvbl9vcGFjaXR5JywgJzEnKTtcbiAgICAgICAgJHNjb3BlLiR3YXRjaCgnc2V0dGluZ3MuYW5ub3RhdGlvbl9vcGFjaXR5JywgZnVuY3Rpb24gKG9wYWNpdHkpIHtcbiAgICAgICAgICAgIG1hcEFubm90YXRpb25zLnNldE9wYWNpdHkob3BhY2l0eSk7XG4gICAgICAgIH0pO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNldHRpbmdzQW5ub3RhdGlvbnNDeWNsaW5nQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGN5Y2xpbmcgdGhyb3VnaCBhbm5vdGF0aW9uc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NldHRpbmdzQW5ub3RhdGlvbnNDeWNsaW5nQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEFubm90YXRpb25zLCBsYWJlbHMsIGtleWJvYXJkKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIGZsYWcgdG8gcHJldmVudCBjeWNsaW5nIHdoaWxlIGEgbmV3IGltYWdlIGlzIGxvYWRpbmdcbiAgICAgICAgdmFyIGxvYWRpbmcgPSBmYWxzZTtcblxuICAgICAgICB2YXIgY3ljbGluZ0tleSA9ICdhbm5vdGF0aW9ucyc7XG5cbiAgICAgICAgdmFyIG5leHRBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmIChsb2FkaW5nIHx8ICEkc2NvcGUuY3ljbGluZygpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmIChtYXBBbm5vdGF0aW9ucy5oYXNOZXh0KCkpIHtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5jeWNsZU5leHQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gbWV0aG9kIGZyb20gQW5ub3RhdG9yQ29udHJvbGxlcjsgbWFwQW5ub3RhdGlvbnMgd2lsbCByZWZyZXNoIGF1dG9tYXRpY2FsbHlcbiAgICAgICAgICAgICAgICAkc2NvcGUubmV4dEltYWdlKCkudGhlbihtYXBBbm5vdGF0aW9ucy5qdW1wVG9GaXJzdCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gb25seSBhcHBseSBpZiB0aGlzIHdhcyBjYWxsZWQgYnkgdGhlIGtleWJvYXJkIGV2ZW50XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjYW5jZWwgYWxsIGtleWJvYXJkIGV2ZW50cyB3aXRoIGxvd2VyIHByaW9yaXR5XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHByZXZBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmIChsb2FkaW5nIHx8ICEkc2NvcGUuY3ljbGluZygpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmIChtYXBBbm5vdGF0aW9ucy5oYXNQcmV2aW91cygpKSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuY3ljbGVQcmV2aW91cygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBtZXRob2QgZnJvbSBBbm5vdGF0b3JDb250cm9sbGVyOyBtYXBBbm5vdGF0aW9ucyB3aWxsIHJlZnJlc2ggYXV0b21hdGljYWxseVxuICAgICAgICAgICAgICAgICRzY29wZS5wcmV2SW1hZ2UoKS50aGVuKG1hcEFubm90YXRpb25zLmp1bXBUb0xhc3QpO1xuICAgICAgICAgICAgICAgIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICAgIC8vIG9ubHkgYXBwbHkgaWYgdGhpcyB3YXMgY2FsbGVkIGJ5IHRoZSBrZXlib2FyZCBldmVudFxuICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY2FuY2VsIGFsbCBrZXlib2FyZCBldmVudHMgd2l0aCBsb3dlciBwcmlvcml0eVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBhdHRhY2hMYWJlbCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAobG9hZGluZykgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgkc2NvcGUuY3ljbGluZygpICYmIGxhYmVscy5oYXNTZWxlY3RlZCgpKSB7XG4gICAgICAgICAgICAgICAgbGFiZWxzLmF0dGFjaFRvQW5ub3RhdGlvbihtYXBBbm5vdGF0aW9ucy5nZXRDdXJyZW50KCkpLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5mbGlja2VyKDEpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5mbGlja2VyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc3RvcCBjeWNsaW5nIHVzaW5nIGEga2V5Ym9hcmQgZXZlbnRcbiAgICAgICAgdmFyIHN0b3BDeWNsaW5nID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICRzY29wZS5zdG9wQ3ljbGluZygpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5jeWNsaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5nZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScpID09PSBjeWNsaW5nS2V5O1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zdGFydEN5Y2xpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0Vm9sYXRpbGVTZXR0aW5ncygnY3ljbGUnLCBjeWNsaW5nS2V5KTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc3RvcEN5Y2xpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0Vm9sYXRpbGVTZXR0aW5ncygnY3ljbGUnLCAnJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdGhlIGN5Y2xlIHNldHRpbmdzIG15IGJlIHNldCBieSBvdGhlciBjb250cm9sbGVycywgdG9vLCBzbyB3YXRjaCBpdFxuICAgICAgICAvLyBpbnN0ZWFkIG9mIHVzaW5nIHRoZSBzdGFydC9zdG9wIGZ1bmN0aW9ucyB0byBhZGQvcmVtb3ZlIGV2ZW50cyBldGMuXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ3ZvbGF0aWxlU2V0dGluZ3MuY3ljbGUnLCBmdW5jdGlvbiAoY3ljbGUsIG9sZEN5Y2xlKSB7XG4gICAgICAgICAgICBpZiAoY3ljbGUgPT09IGN5Y2xpbmdLZXkpIHtcbiAgICAgICAgICAgICAgICAvLyBvdmVycmlkZSBwcmV2aW91cyBpbWFnZSBvbiBhcnJvdyBsZWZ0XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMzcsIHByZXZBbm5vdGF0aW9uLCAxMCk7XG4gICAgICAgICAgICAgICAgLy8gb3ZlcnJpZGUgbmV4dCBpbWFnZSBvbiBhcnJvdyByaWdodCBhbmQgc3BhY2VcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzOSwgbmV4dEFubm90YXRpb24sIDEwKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzMiwgbmV4dEFubm90YXRpb24sIDEwKTtcblxuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDEzLCBhdHRhY2hMYWJlbCwgMTApO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDI3LCBzdG9wQ3ljbGluZywgMTApO1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob2xkQ3ljbGUgPT09IGN5Y2xpbmdLZXkpIHtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMzcsIHByZXZBbm5vdGF0aW9uKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMzksIG5leHRBbm5vdGF0aW9uKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMzIsIG5leHRBbm5vdGF0aW9uKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMTMsIGF0dGFjaExhYmVsKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMjcsIHN0b3BDeWNsaW5nKTtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLnByZXZBbm5vdGF0aW9uID0gcHJldkFubm90YXRpb247XG4gICAgICAgICRzY29wZS5uZXh0QW5ub3RhdGlvbiA9IG5leHRBbm5vdGF0aW9uO1xuICAgICAgICAkc2NvcGUuYXR0YWNoTGFiZWwgPSBhdHRhY2hMYWJlbDtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTZXR0aW5nc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgc2V0dGluZ3MgZm9sZG91dFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NldHRpbmdzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGRlYm91bmNlKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBzZXR0aW5nc1N0b3JhZ2VLZXkgPSAnZGlhcy5hbm5vdGF0aW9ucy5zZXR0aW5ncyc7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IHt9O1xuXG4gICAgICAgIC8vIG1heSBiZSBleHRlbmRlZCBieSBjaGlsZCBjb250cm9sbGVyc1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MgPSB7fTtcblxuICAgICAgICAvLyBtYXkgYmUgZXh0ZW5kZWQgYnkgY2hpbGQgY29udHJvbGxlcnMgYnV0IHdpbGwgbm90IGJlIHBlcm1hbmVudGx5IHN0b3JlZFxuICAgICAgICAkc2NvcGUudm9sYXRpbGVTZXR0aW5ncyA9IHt9O1xuXG4gICAgICAgIHZhciBzdG9yZVNldHRpbmdzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHNldHRpbmdzID0gYW5ndWxhci5jb3B5KCRzY29wZS5zZXR0aW5ncyk7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3Nba2V5XSA9PT0gZGVmYXVsdFNldHRpbmdzW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZG9uJ3Qgc3RvcmUgZGVmYXVsdCBzZXR0aW5ncyB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNldHRpbmdzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW3NldHRpbmdzU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeShzZXR0aW5ncyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHN0b3JlU2V0dGluZ3NEZWJvdW5jZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyB3YWl0IGZvciBxdWljayBjaGFuZ2VzIGFuZCBvbmx5IHN0b3JlIHRoZW0gb25jZSB0aGluZ3MgY2FsbWVkIGRvd24gYWdhaW5cbiAgICAgICAgICAgIC8vIChlLmcuIHdoZW4gdGhlIHVzZXIgZm9vbHMgYXJvdW5kIHdpdGggYSByYW5nZSBzbGlkZXIpXG4gICAgICAgICAgICBkZWJvdW5jZShzdG9yZVNldHRpbmdzLCAyNTAsIHNldHRpbmdzU3RvcmFnZUtleSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHJlc3RvcmVTZXR0aW5ncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHt9O1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgICAgIHNldHRpbmdzID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlW3NldHRpbmdzU3RvcmFnZUtleV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYW5ndWxhci5leHRlbmQoc2V0dGluZ3MsIGRlZmF1bHRTZXR0aW5ncyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNldFNldHRpbmdzID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5nc1trZXldID0gdmFsdWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFNldHRpbmdzID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5zZXR0aW5nc1trZXldO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zZXREZWZhdWx0U2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgZGVmYXVsdFNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIGlmICghJHNjb3BlLnNldHRpbmdzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U2V0dGluZ3Moa2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNldFZvbGF0aWxlU2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgJHNjb3BlLnZvbGF0aWxlU2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRWb2xhdGlsZVNldHRpbmdzID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS52b2xhdGlsZVNldHRpbmdzW2tleV07XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLiR3YXRjaCgnc2V0dGluZ3MnLCBzdG9yZVNldHRpbmdzRGVib3VuY2VkLCB0cnVlKTtcbiAgICAgICAgYW5ndWxhci5leHRlbmQoJHNjb3BlLnNldHRpbmdzLCByZXN0b3JlU2V0dGluZ3MoKSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2V0dGluZ3NTZWN0aW9uQ3ljbGluZ0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgY3ljbGluZyB0aHJvdWdoIGltYWdlIHNlY3Rpb25zXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2V0dGluZ3NTZWN0aW9uQ3ljbGluZ0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXAsIG1hcEltYWdlLCBrZXlib2FyZCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBmbGFnIHRvIHByZXZlbnQgY3ljbGluZyB3aGlsZSBhIG5ldyBpbWFnZSBpcyBsb2FkaW5nXG4gICAgICAgIHZhciBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGN5Y2xpbmdLZXkgPSAnc2VjdGlvbnMnO1xuICAgICAgICB2YXIgdmlldztcblxuICAgICAgICAvLyB2aWV3IGNlbnRlciBwb2ludCBvZiB0aGUgc3RhcnQgcG9zaXRpb25cbiAgICAgICAgdmFyIHN0YXJ0Q2VudGVyID0gWzAsIDBdO1xuICAgICAgICAvLyBudW1iZXIgb2YgcGl4ZWxzIHRvIHByb2NlZWQgaW4geCBhbmQgeSBkaXJlY3Rpb24gZm9yIGVhY2ggc3RlcFxuICAgICAgICB2YXIgc3RlcFNpemUgPSBbMCwgMF07XG4gICAgICAgIC8vIG51bWJlciBvZiBzdGVwcyBpbiB4IGFuZCB5IGRpcmVjdGlvbiAtMSFcbiAgICAgICAgdmFyIHN0ZXBDb3VudCA9IFswLCAwXTtcbiAgICAgICAgLy8gbnVtYmVyIG9mIGN1cnJlbnQgc3RlcCBpbiB4IGFuZCB5IGRpcmVjdGlvbiAtMSFcbiAgICAgICAgdmFyIGN1cnJlbnRTdGVwID0gWzAsIDBdO1xuXG4gICAgICAgIC8vIFRPRE8gcmVhY3Qgb24gd2luZG93IHJlc2l6ZSBldmVudHMgYW5kIGZvbGRvdXQgb3BlbiBhcyB3ZWxsIGFzXG4gICAgICAgIC8vIGNoYW5naW5nIHRoZSB6b29tIGxldmVsXG5cbiAgICAgICAgdmFyIGRpc3RhbmNlID0gZnVuY3Rpb24gKHAxLCBwMikge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhwMVswXSAtIHAyWzBdLCAyKSArIE1hdGgucG93KHAxWzFdIC0gcDJbMV0sIDIpKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpZiB0aGUgbWFwIHNpemUgd2FzIGNoYW5nZWQsIHRoaXMgZnVuY3Rpb24gZmluZHMgdGhlIG5leHQgbmVhcmVzdCBzdGVwXG4gICAgICAgIHZhciBmaW5kTmVhcmVzdFN0ZXAgPSBmdW5jdGlvbiAoY2VudGVyKSB7XG4gICAgICAgICAgICB2YXIgbmVhcmVzdCA9IEluZmluaXR5O1xuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSAwO1xuICAgICAgICAgICAgdmFyIG5lYXJlc3RTdGVwID0gWzAsIDBdO1xuICAgICAgICAgICAgZm9yICh2YXIgeSA9IDA7IHkgPD0gc3RlcENvdW50WzFdOyB5KyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8PSBzdGVwQ291bnRbMF07IHgrKykge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50ID0gZGlzdGFuY2UoY2VudGVyLCBnZXRTdGVwUG9zaXRpb24oW3gsIHldKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50IDwgbmVhcmVzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVhcmVzdFN0ZXBbMF0gPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVhcmVzdFN0ZXBbMV0gPSB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVhcmVzdCA9IGN1cnJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBuZWFyZXN0U3RlcDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyAocmUtKWNhbGN1bGF0ZSBhbGwgbmVlZGVkIHBvc2l0aW9ucyBhbmQgc2l6ZXMgZm9yIGN5Y2xpbmcgdGhyb3VnaCBzZWN0aW9uc1xuICAgICAgICB2YXIgdXBkYXRlRXh0ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmlldyA9IG1hcC5nZXRWaWV3KCk7XG4gICAgICAgICAgICAvLyBzZXQgdGhlIGV2ZW50IGxpc3RlbmVyIGhlcmUgaW4gY2FzZSB0aGUgdmlldyBjaGFuZ2VkXG4gICAgICAgICAgICB2aWV3Lm9uKCdjaGFuZ2U6cmVzb2x1dGlvbicsIGhhbmRsZVVzZXJab29tKTtcbiAgICAgICAgICAgIHZhciBpbWFnZUV4dGVudCA9IG1hcEltYWdlLmdldEV4dGVudCgpO1xuICAgICAgICAgICAgdmFyIHZpZXdFeHRlbnQgPSB2aWV3LmNhbGN1bGF0ZUV4dGVudChtYXAuZ2V0U2l6ZSgpKTtcblxuICAgICAgICAgICAgc3RlcFNpemVbMF0gPSB2aWV3RXh0ZW50WzJdIC0gdmlld0V4dGVudFswXTtcbiAgICAgICAgICAgIHN0ZXBTaXplWzFdID0gdmlld0V4dGVudFszXSAtIHZpZXdFeHRlbnRbMV07XG5cbiAgICAgICAgICAgIC8vIHNldCB0aGUgc3RhcnQgY2VudGVyIGJlZm9yZSBhZGp1c3RpbmcgdGhlIHN0ZXAgc2l6ZSB3aXRoIG92ZXJsYXBcbiAgICAgICAgICAgIHN0YXJ0Q2VudGVyWzBdID0gc3RlcFNpemVbMF0gLyAyO1xuICAgICAgICAgICAgc3RhcnRDZW50ZXJbMV0gPSBzdGVwU2l6ZVsxXSAvIDI7XG5cbiAgICAgICAgICAgIC8vIE1hdGguY2VpbCg0LjApIC0gMSBpcyBOT1QgZXF1aXZhbGVudCB0byBNYXRoLmZsb29yKDQuMCkhXG4gICAgICAgICAgICAvLyAtIDEgYmVjYXVzZSBzdGVwQ291bnQgYmVnaW5zIHdpdGggMCBzbyBhIHN0ZXBDb3VudCBvZiAxIG1lYW5zIDIgc3RlcHNcbiAgICAgICAgICAgIHN0ZXBDb3VudFswXSA9IE1hdGguY2VpbChpbWFnZUV4dGVudFsyXSAvIHN0ZXBTaXplWzBdKSAtIDE7XG4gICAgICAgICAgICBzdGVwQ291bnRbMV0gPSBNYXRoLmNlaWwoaW1hZ2VFeHRlbnRbM10gLyBzdGVwU2l6ZVsxXSkgLSAxO1xuXG4gICAgICAgICAgICB2YXIgb3ZlcmxhcDtcbiAgICAgICAgICAgIGlmIChzdGVwQ291bnRbMF0gPiAwKSB7XG4gICAgICAgICAgICAgICAgLy8gbWFrZSB0aGUgc2VjdGlvbnMgb3ZlcmxhcCBob3Jpem9uYWxseSBzbyB0aGV5IGV4YWN0bHkgY292ZXIgdGhlIGltYWdlXG4gICAgICAgICAgICAgICAgb3ZlcmxhcCA9IChzdGVwU2l6ZVswXSAqIChzdGVwQ291bnRbMF0gKyAxKSkgLSBpbWFnZUV4dGVudFsyXTtcbiAgICAgICAgICAgICAgICBzdGVwU2l6ZVswXSAtPSBvdmVybGFwIC8gc3RlcENvdW50WzBdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGVwU2l6ZVswXSA9IHZpZXdFeHRlbnRbMl07XG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBzdGFydCBwb2ludCBzbyB0aGUgaW1hZ2UgaXMgY2VudGVyZWQgaG9yaXpvbnRhbGx5XG4gICAgICAgICAgICAgICAgc3RhcnRDZW50ZXJbMF0gPSBpbWFnZUV4dGVudFsyXSAvIDI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdGVwQ291bnRbMV0gPiAwKSB7XG4gICAgICAgICAgICAgICAgLy8gbWFrZSB0aGUgc2VjdGlvbnMgb3ZlcmxhcCB2ZXJ0aWNhbGx5IHNvIHRoZXkgZXhhY3RseSBjb3ZlciB0aGUgaW1hZ2VcbiAgICAgICAgICAgICAgICBvdmVybGFwID0gKHN0ZXBTaXplWzFdICogKHN0ZXBDb3VudFsxXSArIDEpKSAtIGltYWdlRXh0ZW50WzNdO1xuICAgICAgICAgICAgICAgIHN0ZXBTaXplWzFdIC09IG92ZXJsYXAgLyBzdGVwQ291bnRbMV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0ZXBTaXplWzFdID0gdmlld0V4dGVudFszXTtcbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIHN0YXJ0IHBvaW50IHNvIHRoZSBpbWFnZSBpcyBjZW50ZXJlZCB2ZXJ0aWNhbGx5XG4gICAgICAgICAgICAgICAgc3RhcnRDZW50ZXJbMV0gPSBpbWFnZUV4dGVudFszXSAvIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZVVzZXJab29tID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdXBkYXRlRXh0ZW50KCk7XG4gICAgICAgICAgICAvLyBhbGxvdyB0aGUgdXNlciB0byBwYW4gYnV0IGdvIGJhY2sgdG8gdGhlIHJlZ3VsYXIgcHJldi9uZXh0IHN0ZXAgd2hlbiB0aGV5XG4gICAgICAgICAgICAvLyB3YW50IHRvIGNvbnRpbnVlIGN5Y2xpbmcsIG5vdCB0byB0aGUgY3VycmVudGx5IG5lYXJlc3Qgc3RlcFxuICAgICAgICAgICAgdmFyIHN0ZXAgPSBmaW5kTmVhcmVzdFN0ZXAoZ2V0U3RlcFBvc2l0aW9uKGN1cnJlbnRTdGVwKSk7XG4gICAgICAgICAgICBjdXJyZW50U3RlcFswXSA9IHN0ZXBbMF07XG4gICAgICAgICAgICBjdXJyZW50U3RlcFsxXSA9IHN0ZXBbMV07XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZU1hcFJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHVwZGF0ZUV4dGVudCgpO1xuICAgICAgICAgICAgZ29Ub1N0ZXAoZmluZE5lYXJlc3RTdGVwKHZpZXcuZ2V0Q2VudGVyKCkpKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZ29Ub1N0YXJ0U3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGdvVG9TdGVwKFswLCAwXSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGdvVG9FbmRTdGVwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZ29Ub1N0ZXAoc3RlcENvdW50KTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZ2V0U3RlcFBvc2l0aW9uID0gZnVuY3Rpb24gKHN0ZXApIHtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgc3RlcFswXSAqIHN0ZXBTaXplWzBdICsgc3RhcnRDZW50ZXJbMF0sXG4gICAgICAgICAgICAgICAgc3RlcFsxXSAqIHN0ZXBTaXplWzFdICsgc3RhcnRDZW50ZXJbMV0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBnb1RvU3RlcCA9IGZ1bmN0aW9uIChzdGVwKSB7XG4gICAgICAgICAgICAvLyBhbmltYXRlIHN0ZXBwaW5nXG4gICAgICAgICAgICAvLyB2YXIgcGFuID0gb2wuYW5pbWF0aW9uLnBhbih7XG4gICAgICAgICAgICAvLyAgICAgc291cmNlOiB2aWV3LmdldENlbnRlcigpLFxuICAgICAgICAgICAgLy8gICAgIGR1cmF0aW9uOiA1MDBcbiAgICAgICAgICAgIC8vIH0pO1xuICAgICAgICAgICAgLy8gbWFwLmJlZm9yZVJlbmRlcihwYW4pO1xuICAgICAgICAgICAgY3VycmVudFN0ZXBbMF0gPSBzdGVwWzBdO1xuICAgICAgICAgICAgY3VycmVudFN0ZXBbMV0gPSBzdGVwWzFdO1xuICAgICAgICAgICAgdmlldy5zZXRDZW50ZXIoZ2V0U3RlcFBvc2l0aW9uKGN1cnJlbnRTdGVwKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIG5leHRTdGVwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRTdGVwWzBdIDwgc3RlcENvdW50WzBdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtjdXJyZW50U3RlcFswXSArIDEsIGN1cnJlbnRTdGVwWzFdXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFswLCBjdXJyZW50U3RlcFsxXSArIDFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBwcmV2U3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50U3RlcFswXSA+IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2N1cnJlbnRTdGVwWzBdIC0gMSwgY3VycmVudFN0ZXBbMV1dO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW3N0ZXBDb3VudFswXSwgY3VycmVudFN0ZXBbMV0gLSAxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbmV4dFNlY3Rpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcgfHwgISRzY29wZS5jeWNsaW5nKCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTdGVwWzBdIDwgc3RlcENvdW50WzBdIHx8IGN1cnJlbnRTdGVwWzFdIDwgc3RlcENvdW50WzFdKSB7XG4gICAgICAgICAgICAgICAgZ29Ub1N0ZXAobmV4dFN0ZXAoKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKS50aGVuKHVwZGF0ZUV4dGVudCkudGhlbihnb1RvU3RhcnRTdGVwKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGFwcGx5IGlmIHRoaXMgd2FzIGNhbGxlZCBieSB0aGUga2V5Ym9hcmQgZXZlbnRcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNhbmNlbCBhbGwga2V5Ym9hcmQgZXZlbnRzIHdpdGggbG93ZXIgcHJpb3JpdHlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcHJldlNlY3Rpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcgfHwgISRzY29wZS5jeWNsaW5nKCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTdGVwWzBdID4gMCB8fCBjdXJyZW50U3RlcFsxXSA+IDApIHtcbiAgICAgICAgICAgICAgICBnb1RvU3RlcChwcmV2U3RlcCgpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnByZXZJbWFnZSgpLnRoZW4odXBkYXRlRXh0ZW50KS50aGVuKGdvVG9FbmRTdGVwKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGFwcGx5IGlmIHRoaXMgd2FzIGNhbGxlZCBieSB0aGUga2V5Ym9hcmQgZXZlbnRcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNhbmNlbCBhbGwga2V5Ym9hcmQgZXZlbnRzIHdpdGggbG93ZXIgcHJpb3JpdHlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzdG9wIGN5Y2xpbmcgdXNpbmcgYSBrZXlib2FyZCBldmVudFxuICAgICAgICB2YXIgc3RvcEN5Y2xpbmcgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgJHNjb3BlLnN0b3BDeWNsaW5nKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmN5Y2xpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmdldFZvbGF0aWxlU2V0dGluZ3MoJ2N5Y2xlJykgPT09IGN5Y2xpbmdLZXk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnN0YXJ0Q3ljbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScsIGN5Y2xpbmdLZXkpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zdG9wQ3ljbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScsICcnKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyB0aGUgY3ljbGUgc2V0dGluZ3MgbXkgYmUgc2V0IGJ5IG90aGVyIGNvbnRyb2xsZXJzLCB0b28sIHNvIHdhdGNoIGl0XG4gICAgICAgIC8vIGluc3RlYWQgb2YgdXNpbmcgdGhlIHN0YXJ0L3N0b3AgZnVuY3Rpb25zIHRvIGFkZC9yZW1vdmUgZXZlbnRzIGV0Yy5cbiAgICAgICAgJHNjb3BlLiR3YXRjaCgndm9sYXRpbGVTZXR0aW5ncy5jeWNsZScsIGZ1bmN0aW9uIChjeWNsZSwgb2xkQ3ljbGUpIHtcbiAgICAgICAgICAgIGlmIChjeWNsZSA9PT0gY3ljbGluZ0tleSkge1xuICAgICAgICAgICAgICAgIG1hcC5vbignY2hhbmdlOnNpemUnLCBoYW5kbGVNYXBSZXNpemUpO1xuICAgICAgICAgICAgICAgIHVwZGF0ZUV4dGVudCgpO1xuICAgICAgICAgICAgICAgIGdvVG9TdGFydFN0ZXAoKTtcbiAgICAgICAgICAgICAgICAvLyBvdmVycmlkZSBwcmV2aW91cyBpbWFnZSBvbiBhcnJvdyBsZWZ0XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMzcsIHByZXZTZWN0aW9uLCAxMCk7XG4gICAgICAgICAgICAgICAgLy8gb3ZlcnJpZGUgbmV4dCBpbWFnZSBvbiBhcnJvdyByaWdodCBhbmQgc3BhY2VcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzOSwgbmV4dFNlY3Rpb24sIDEwKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzMiwgbmV4dFNlY3Rpb24sIDEwKTtcblxuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDI3LCBzdG9wQ3ljbGluZywgMTApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvbGRDeWNsZSA9PT0gY3ljbGluZ0tleSkge1xuICAgICAgICAgICAgICAgIG1hcC51bignY2hhbmdlOnNpemUnLCBoYW5kbGVNYXBSZXNpemUpO1xuICAgICAgICAgICAgICAgIHZpZXcudW4oJ2NoYW5nZTpyZXNvbHV0aW9uJywgaGFuZGxlVXNlclpvb20pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzNywgcHJldlNlY3Rpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzOSwgbmV4dFNlY3Rpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzMiwgbmV4dFNlY3Rpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigyNywgc3RvcEN5Y2xpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLnByZXZTZWN0aW9uID0gcHJldlNlY3Rpb247XG4gICAgICAgICRzY29wZS5uZXh0U2VjdGlvbiA9IG5leHRTZWN0aW9uO1xuICAgIH1cbik7XG5cbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2lkZWJhckNhdGVnb3J5Rm9sZG91dENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgY2F0ZWdvcnkgZm9sZG91dCBidXR0b25cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTaWRlYmFyQ2F0ZWdvcnlGb2xkb3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGtleWJvYXJkKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAga2V5Ym9hcmQub24oOSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICRzY29wZS50b2dnbGVGb2xkb3V0KCdjYXRlZ29yaWVzJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTaWRlYmFyQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NpZGViYXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBmb2xkb3V0U3RvcmFnZUtleSA9ICdkaWFzLmFubm90YXRpb25zLnNpZGViYXItZm9sZG91dCc7XG5cbiAgICAgICAgJHNjb3BlLmZvbGRvdXQgPSAnJztcblxuXHRcdCRzY29wZS5vcGVuRm9sZG91dCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2ZvbGRvdXRTdG9yYWdlS2V5XSA9IG5hbWU7XG4gICAgICAgICAgICAkc2NvcGUuZm9sZG91dCA9IG5hbWU7XG5cdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NpZGViYXIuZm9sZG91dC5vcGVuJywgbmFtZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jbG9zZUZvbGRvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oZm9sZG91dFN0b3JhZ2VLZXkpO1xuXHRcdFx0JHNjb3BlLmZvbGRvdXQgPSAnJztcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2lkZWJhci5mb2xkb3V0LmNsb3NlJyk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVGb2xkb3V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRcdGlmICgkc2NvcGUuZm9sZG91dCA9PT0gbmFtZSkge1xuXHRcdFx0XHQkc2NvcGUuY2xvc2VGb2xkb3V0KCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUub3BlbkZvbGRvdXQobmFtZSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbignc2lkZWJhci5mb2xkb3V0LmRvLW9wZW4nLCBmdW5jdGlvbiAoZSwgbmFtZSkge1xuICAgICAgICAgICAgJHNjb3BlLm9wZW5Gb2xkb3V0KG5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyB0aGUgY3VycmVudGx5IG9wZW5lZCBzaWRlYmFyLSdleHRlbnNpb24nIGlzIHJlbWVtYmVyZWQgdGhyb3VnaCBsb2NhbFN0b3JhZ2VcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICAkc2NvcGUub3BlbkZvbGRvdXQod2luZG93LmxvY2FsU3RvcmFnZVtmb2xkb3V0U3RvcmFnZUtleV0pO1xuICAgICAgICB9XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIGRlYm91bmNlXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgZGVib3VuY2Ugc2VydmljZSB0byBwZXJmb3JtIGFuIGFjdGlvbiBvbmx5IHdoZW4gdGhpcyBmdW5jdGlvblxuICogd2Fzbid0IGNhbGxlZCBhZ2FpbiBpbiBhIHNob3J0IHBlcmlvZCBvZiB0aW1lLlxuICogc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEzMzIwMDE2LzE3OTY1MjNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5mYWN0b3J5KCdkZWJvdW5jZScsIGZ1bmN0aW9uICgkdGltZW91dCwgJHEpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciB0aW1lb3V0cyA9IHt9O1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChmdW5jLCB3YWl0LCBpZCkge1xuXHRcdFx0Ly8gQ3JlYXRlIGEgZGVmZXJyZWQgb2JqZWN0IHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHdlIG5lZWQgdG9cblx0XHRcdC8vIGFjdHVhbGx5IGNhbGwgdGhlIGZ1bmNcblx0XHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0XHRcdHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHRpbWVvdXRzW2lkXSA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncykpO1xuXHRcdFx0XHRcdGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aWYgKHRpbWVvdXRzW2lkXSkge1xuXHRcdFx0XHRcdCR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0c1tpZF0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRpbWVvdXRzW2lkXSA9ICR0aW1lb3V0KGxhdGVyLCB3YWl0KTtcblx0XHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG5cdFx0XHR9KSgpO1xuXHRcdH07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBtYXBcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBmYWN0b3J5IGhhbmRsaW5nIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZmFjdG9yeSgnbWFwJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIG1hcCA9IG5ldyBvbC5NYXAoe1xuXHRcdFx0dGFyZ2V0OiAnY2FudmFzJyxcbiAgICAgICAgICAgIHJlbmRlcmVyOiAnY2FudmFzJyxcblx0XHRcdGNvbnRyb2xzOiBbXG5cdFx0XHRcdG5ldyBvbC5jb250cm9sLlpvb20oKSxcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuWm9vbVRvRXh0ZW50KCksXG5cdFx0XHRcdG5ldyBvbC5jb250cm9sLkZ1bGxTY3JlZW4oKVxuXHRcdFx0XSxcbiAgICAgICAgICAgIGludGVyYWN0aW9uczogb2wuaW50ZXJhY3Rpb24uZGVmYXVsdHMoe1xuICAgICAgICAgICAgICAgIGtleWJvYXJkOiBmYWxzZVxuICAgICAgICAgICAgfSlcblx0XHR9KTtcblxuXHRcdHJldHVybiBtYXA7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGFubm90YXRpb25zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSB0aGUgYW5ub3RhdGlvbnMgdG8gbWFrZSB0aGVtIGF2YWlsYWJsZSBpbiBtdWx0aXBsZSBjb250cm9sbGVycy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdhbm5vdGF0aW9ucycsIGZ1bmN0aW9uIChBbm5vdGF0aW9uLCBzaGFwZXMsIG1zZykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGFubm90YXRpb25zO1xuICAgICAgICB2YXIgcHJvbWlzZTtcblxuXHRcdHZhciByZXNvbHZlU2hhcGVOYW1lID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdGFubm90YXRpb24uc2hhcGUgPSBzaGFwZXMuZ2V0TmFtZShhbm5vdGF0aW9uLnNoYXBlX2lkKTtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR2YXIgYWRkQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHRhbm5vdGF0aW9ucy5wdXNoKGFubm90YXRpb24pO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb247XG5cdFx0fTtcblxuXHRcdHRoaXMucXVlcnkgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRhbm5vdGF0aW9ucyA9IEFubm90YXRpb24ucXVlcnkocGFyYW1zKTtcbiAgICAgICAgICAgIHByb21pc2UgPSBhbm5vdGF0aW9ucy4kcHJvbWlzZTtcblx0XHRcdHByb21pc2UudGhlbihmdW5jdGlvbiAoYSkge1xuXHRcdFx0XHRhLmZvckVhY2gocmVzb2x2ZVNoYXBlTmFtZSk7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9ucztcblx0XHR9O1xuXG5cdFx0dGhpcy5hZGQgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRpZiAoIXBhcmFtcy5zaGFwZV9pZCAmJiBwYXJhbXMuc2hhcGUpIHtcblx0XHRcdFx0cGFyYW1zLnNoYXBlX2lkID0gc2hhcGVzLmdldElkKHBhcmFtcy5zaGFwZSk7XG5cdFx0XHR9XG5cdFx0XHR2YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uYWRkKHBhcmFtcyk7XG5cdFx0XHRhbm5vdGF0aW9uLiRwcm9taXNlXG5cdFx0XHQgICAgICAgICAgLnRoZW4ocmVzb2x2ZVNoYXBlTmFtZSlcblx0XHRcdCAgICAgICAgICAudGhlbihhZGRBbm5vdGF0aW9uKVxuXHRcdFx0ICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG5cblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHQvLyB1c2UgaW5kZXggdG8gc2VlIGlmIHRoZSBhbm5vdGF0aW9uIGV4aXN0cyBpbiB0aGUgYW5ub3RhdGlvbnMgbGlzdFxuXHRcdFx0dmFyIGluZGV4ID0gYW5ub3RhdGlvbnMuaW5kZXhPZihhbm5vdGF0aW9uKTtcblx0XHRcdGlmIChpbmRleCA+IC0xKSB7XG5cdFx0XHRcdHJldHVybiBhbm5vdGF0aW9uLiRkZWxldGUoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdC8vIHVwZGF0ZSB0aGUgaW5kZXggc2luY2UgdGhlIGFubm90YXRpb25zIGxpc3QgbWF5IGhhdmUgYmVlblxuXHRcdFx0XHRcdC8vIG1vZGlmaWVkIGluIHRoZSBtZWFudGltZVxuXHRcdFx0XHRcdGluZGV4ID0gYW5ub3RhdGlvbnMuaW5kZXhPZihhbm5vdGF0aW9uKTtcblx0XHRcdFx0XHRhbm5vdGF0aW9ucy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHR9LCBtc2cucmVzcG9uc2VFcnJvcik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRoaXMuZm9yRWFjaCA9IGZ1bmN0aW9uIChmbikge1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb25zLmZvckVhY2goZm4pO1xuXHRcdH07XG5cblx0XHR0aGlzLmN1cnJlbnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnM7XG5cdFx0fTtcblxuICAgICAgICB0aGlzLmdldFByb21pc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgaW1hZ2VzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1hbmFnZXMgKHByZS0pbG9hZGluZyBvZiB0aGUgaW1hZ2VzIHRvIGFubm90YXRlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2ltYWdlcycsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBUcmFuc2VjdEltYWdlLCBVUkwsICRxLCBmaWx0ZXJTdWJzZXQsIFRSQU5TRUNUX0lEKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXHRcdC8vIGFycmF5IG9mIGFsbCBpbWFnZSBJRHMgb2YgdGhlIHRyYW5zZWN0XG5cdFx0dmFyIGltYWdlSWRzID0gW107XG5cdFx0Ly8gbWF4aW11bSBudW1iZXIgb2YgaW1hZ2VzIHRvIGhvbGQgaW4gYnVmZmVyXG5cdFx0dmFyIE1BWF9CVUZGRVJfU0laRSA9IDEwO1xuXHRcdC8vIGJ1ZmZlciBvZiBhbHJlYWR5IGxvYWRlZCBpbWFnZXNcblx0XHR2YXIgYnVmZmVyID0gW107XG5cblx0XHQvLyB0aGUgY3VycmVudGx5IHNob3duIGltYWdlXG5cdFx0dGhpcy5jdXJyZW50SW1hZ2UgPSB1bmRlZmluZWQ7XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBuZXh0IElEIG9mIHRoZSBzcGVjaWZpZWQgaW1hZ2Ugb3IgdGhlIG5leHQgSUQgb2YgdGhlXG5cdFx0ICogY3VycmVudCBpbWFnZSBpZiBubyBpbWFnZSB3YXMgc3BlY2lmaWVkLlxuXHRcdCAqL1xuXHRcdHZhciBuZXh0SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdHZhciBpbmRleCA9IGltYWdlSWRzLmluZGV4T2YoaWQpO1xuXHRcdFx0cmV0dXJuIGltYWdlSWRzWyhpbmRleCArIDEpICUgaW1hZ2VJZHMubGVuZ3RoXTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgcHJldmlvdXMgSUQgb2YgdGhlIHNwZWNpZmllZCBpbWFnZSBvciB0aGUgcHJldmlvdXMgSUQgb2Zcblx0XHQgKiB0aGUgY3VycmVudCBpbWFnZSBpZiBubyBpbWFnZSB3YXMgc3BlY2lmaWVkLlxuXHRcdCAqL1xuXHRcdHZhciBwcmV2SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdHZhciBpbmRleCA9IGltYWdlSWRzLmluZGV4T2YoaWQpO1xuXHRcdFx0dmFyIGxlbmd0aCA9IGltYWdlSWRzLmxlbmd0aDtcblx0XHRcdHJldHVybiBpbWFnZUlkc1soaW5kZXggLSAxICsgbGVuZ3RoKSAlIGxlbmd0aF07XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIHNwZWNpZmllZCBpbWFnZSBmcm9tIHRoZSBidWZmZXIgb3IgYHVuZGVmaW5lZGAgaWYgaXQgaXNcblx0XHQgKiBub3QgYnVmZmVyZWQuXG5cdFx0ICovXG5cdFx0dmFyIGdldEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRpZCA9IGlkIHx8IF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0XHRmb3IgKHZhciBpID0gYnVmZmVyLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdGlmIChidWZmZXJbaV0uX2lkID09IGlkKSByZXR1cm4gYnVmZmVyW2ldO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTZXRzIHRoZSBzcGVjaWZpZWQgaW1hZ2UgdG8gYXMgdGhlIGN1cnJlbnRseSBzaG93biBpbWFnZS5cblx0XHQgKi9cblx0XHR2YXIgc2hvdyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0X3RoaXMuY3VycmVudEltYWdlID0gZ2V0SW1hZ2UoaWQpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBMb2FkcyB0aGUgc3BlY2lmaWVkIGltYWdlIGVpdGhlciBmcm9tIGJ1ZmZlciBvciBmcm9tIHRoZSBleHRlcm5hbFxuXHRcdCAqIHJlc291cmNlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGdldHMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXNcblx0XHQgKiBsb2FkZWQuXG5cdFx0ICovXG5cdFx0dmFyIGZldGNoSW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0XHR2YXIgaW1nID0gZ2V0SW1hZ2UoaWQpO1xuXG5cdFx0XHRpZiAoaW1nKSB7XG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW1nKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuXHRcdFx0XHRpbWcuX2lkID0gaWQ7XG5cdFx0XHRcdGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0YnVmZmVyLnB1c2goaW1nKTtcblx0XHRcdFx0XHQvLyBjb250cm9sIG1heGltdW0gYnVmZmVyIHNpemVcblx0XHRcdFx0XHRpZiAoYnVmZmVyLmxlbmd0aCA+IE1BWF9CVUZGRVJfU0laRSkge1xuXHRcdFx0XHRcdFx0YnVmZmVyLnNoaWZ0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW1nKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAobXNnKSB7XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KG1zZyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGltZy5zcmMgPSBVUkwgKyBcIi9hcGkvdjEvaW1hZ2VzL1wiICsgaWQgKyBcIi9maWxlXCI7XG5cdFx0XHR9XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnaW1hZ2UuZmV0Y2hpbmcnLCBpbWcpO1xuXG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSW5pdGlhbGl6ZXMgdGhlIHNlcnZpY2UgZm9yIGEgZ2l2ZW4gdHJhbnNlY3QuIFJldHVybnMgYSBwcm9taXNlIHRoYXRcblx0XHQgKiBpcyByZXNvbHZlZCwgd2hlbiB0aGUgc2VydmljZSBpcyBpbml0aWFsaXplZC5cblx0XHQgKi9cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpbWFnZUlkcyA9IFRyYW5zZWN0SW1hZ2UucXVlcnkoe3RyYW5zZWN0X2lkOiBUUkFOU0VDVF9JRH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBsb29rIGZvciBhIHNlcXVlbmNlIG9mIGltYWdlIElEcyBpbiBsb2NhbCBzdG9yYWdlLlxuICAgICAgICAgICAgICAgIC8vIHRoaXMgc2VxdWVuY2UgaXMgcHJvZHVjZXMgYnkgdGhlIHRyYW5zZWN0IGluZGV4IHBhZ2Ugd2hlbiB0aGUgaW1hZ2VzIGFyZVxuICAgICAgICAgICAgICAgIC8vIHNvcnRlZCBvciBmaWx0ZXJlZC4gd2Ugd2FudCB0byByZWZsZWN0IHRoZSBzYW1lIG9yZGVyaW5nIG9yIGZpbHRlcmluZyBoZXJlXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhlIGFubm90YXRvclxuICAgICAgICAgICAgICAgIHZhciBzdG9yZWRTZXF1ZW5jZSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2VbJ2RpYXMudHJhbnNlY3RzLicgKyBUUkFOU0VDVF9JRCArICcuaW1hZ2VzJ107XG4gICAgICAgICAgICAgICAgaWYgKHN0b3JlZFNlcXVlbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlID0gSlNPTi5wYXJzZShzdG9yZWRTZXF1ZW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIHN1Y2ggYSBzdG9yZWQgc2VxdWVuY2UsIGZpbHRlciBvdXQgYW55IGltYWdlIElEcyB0aGF0IGRvIG5vdFxuICAgICAgICAgICAgICAgICAgICAvLyBiZWxvbmcgdG8gdGhlIHRyYW5zZWN0IChhbnkgbW9yZSksIHNpbmNlIHNvbWUgb2YgdGhlbSBtYXkgaGF2ZSBiZWVuIGRlbGV0ZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIG1lYW50aW1lXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclN1YnNldChzdG9yZWRTZXF1ZW5jZSwgaW1hZ2VJZHMpO1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIHByb21pc2UgaXMgbm90IHJlbW92ZWQgd2hlbiBvdmVyd3JpdGluZyBpbWFnZUlkcyBzaW5jZSB3ZVxuICAgICAgICAgICAgICAgICAgICAvLyBuZWVkIGl0IGxhdGVyIG9uLlxuICAgICAgICAgICAgICAgICAgICBzdG9yZWRTZXF1ZW5jZS4kcHJvbWlzZSA9IGltYWdlSWRzLiRwcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICBzdG9yZWRTZXF1ZW5jZS4kcmVzb2x2ZWQgPSBpbWFnZUlkcy4kcmVzb2x2ZWQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZW4gc2V0IHRoZSBzdG9yZWQgc2VxdWVuY2UgYXMgdGhlIHNlcXVlbmNlIG9mIGltYWdlIElEcyBpbnN0ZWFkIG9mIHNpbXBseVxuICAgICAgICAgICAgICAgICAgICAvLyBhbGwgSURzIGJlbG9uZ2luZyB0byB0aGUgdHJhbnNlY3RcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VJZHMgPSBzdG9yZWRTZXF1ZW5jZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuXHRcdFx0cmV0dXJuIGltYWdlSWRzLiRwcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBpbWFnZSB3aXRoIHRoZSBzcGVjaWZpZWQgSUQuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXNcblx0XHQgKiByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpcyBzaG93bi5cblx0XHQgKi9cblx0XHR0aGlzLnNob3cgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBwcm9taXNlID0gZmV0Y2hJbWFnZShpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0c2hvdyhpZCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gd2FpdCBmb3IgaW1hZ2VJZHMgdG8gYmUgbG9hZGVkXG5cdFx0XHRpbWFnZUlkcy4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0Ly8gcHJlLWxvYWQgcHJldmlvdXMgYW5kIG5leHQgaW1hZ2VzIGJ1dCBkb24ndCBkaXNwbGF5IHRoZW1cblx0XHRcdFx0ZmV0Y2hJbWFnZShuZXh0SWQoaWQpKTtcblx0XHRcdFx0ZmV0Y2hJbWFnZShwcmV2SWQoaWQpKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gcHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2hvdyB0aGUgbmV4dCBpbWFnZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMubmV4dCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfdGhpcy5zaG93KG5leHRJZCgpKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2hvdyB0aGUgcHJldmlvdXMgaW1hZ2UuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXNcblx0XHQgKiByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpcyBzaG93bi5cblx0XHQgKi9cblx0XHR0aGlzLnByZXYgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3RoaXMuc2hvdyhwcmV2SWQoKSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0Q3VycmVudElkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUga2V5Ym9hcmRcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSB0byByZWdpc3RlciBhbmQgbWFuYWdlIGtleXByZXNzIGV2ZW50cyB3aXRoIHByaW9yaXRpZXNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdrZXlib2FyZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gbWFwcyBrZXkgY29kZXMvY2hhcmFjdGVycyB0byBhcnJheXMgb2YgbGlzdGVuZXJzXG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB7fTtcblxuICAgICAgICB2YXIgZXhlY3V0ZUNhbGxiYWNrcyA9IGZ1bmN0aW9uIChsaXN0LCBlKSB7XG4gICAgICAgICAgICAvLyBnbyBmcm9tIGhpZ2hlc3QgcHJpb3JpdHkgZG93blxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IGxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAvLyBjYWxsYmFja3MgY2FuIGNhbmNlbCBmdXJ0aGVyIHByb3BhZ2F0aW9uXG4gICAgICAgICAgICAgICAgaWYgKGxpc3RbaV0uY2FsbGJhY2soZSkgPT09IGZhbHNlKSByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZUtleUV2ZW50cyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgY29kZSA9IGUua2V5Q29kZTtcbiAgICAgICAgICAgIHZhciBjaGFyYWN0ZXIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGUud2hpY2ggfHwgY29kZSkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjb2RlXSkge1xuICAgICAgICAgICAgICAgIGV4ZWN1dGVDYWxsYmFja3MobGlzdGVuZXJzW2NvZGVdLCBlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjaGFyYWN0ZXJdKSB7XG4gICAgICAgICAgICAgICAgZXhlY3V0ZUNhbGxiYWNrcyhsaXN0ZW5lcnNbY2hhcmFjdGVyXSwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleUV2ZW50cyk7XG5cbiAgICAgICAgLy8gcmVnaXN0ZXIgYSBuZXcgZXZlbnQgbGlzdGVuZXIgZm9yIHRoZSBrZXkgY29kZSBvciBjaGFyYWN0ZXIgd2l0aCBhbiBvcHRpb25hbCBwcmlvcml0eVxuICAgICAgICAvLyBsaXN0ZW5lcnMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgYXJlIGNhbGxlZCBmaXJzdCBhbmMgY2FuIHJldHVybiAnZmFsc2UnIHRvIHByZXZlbnQgdGhlXG4gICAgICAgIC8vIGxpc3RlbmVycyB3aXRoIGxvd2VyIHByaW9yaXR5IGZyb20gYmVpbmcgY2FsbGVkXG4gICAgICAgIHRoaXMub24gPSBmdW5jdGlvbiAoY2hhck9yQ29kZSwgY2FsbGJhY2ssIHByaW9yaXR5KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNoYXJPckNvZGUgPT09ICdzdHJpbmcnIHx8IGNoYXJPckNvZGUgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBjaGFyT3JDb2RlID0gY2hhck9yQ29kZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcmlvcml0eSA9IHByaW9yaXR5IHx8IDA7XG4gICAgICAgICAgICB2YXIgbGlzdGVuZXIgPSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrLFxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiBwcmlvcml0eVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjaGFyT3JDb2RlXSkge1xuICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gbGlzdGVuZXJzW2NoYXJPckNvZGVdO1xuICAgICAgICAgICAgICAgIHZhciBpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RbaV0ucHJpb3JpdHkgPj0gcHJpb3JpdHkpIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpID09PSBsaXN0Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnNwbGljZShpLCAwLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyc1tjaGFyT3JDb2RlXSA9IFtsaXN0ZW5lcl07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdW5yZWdpc3RlciBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICB0aGlzLm9mZiA9IGZ1bmN0aW9uIChjaGFyT3JDb2RlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjaGFyT3JDb2RlID09PSAnc3RyaW5nJyB8fCBjaGFyT3JDb2RlIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgY2hhck9yQ29kZSA9IGNoYXJPckNvZGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjaGFyT3JDb2RlXSkge1xuICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gbGlzdGVuZXJzW2NoYXJPckNvZGVdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdFtpXS5jYWxsYmFjayA9PT0gY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbGFiZWxzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgYW5ub3RhdGlvbiBsYWJlbHMgdG8gcHJvdmlkZSBzb21lIGNvbnZlbmllbmNlIGZ1bmN0aW9ucy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdsYWJlbHMnLCBmdW5jdGlvbiAoQW5ub3RhdGlvbkxhYmVsLCBMYWJlbCwgUHJvamVjdExhYmVsLCBQcm9qZWN0LCBtc2csICRxLCBQUk9KRUNUX0lEUykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRMYWJlbDtcbiAgICAgICAgdmFyIGN1cnJlbnRDb25maWRlbmNlID0gMS4wO1xuXG4gICAgICAgIHZhciBsYWJlbHMgPSB7fTtcblxuICAgICAgICAvLyB0aGlzIHByb21pc2UgaXMgcmVzb2x2ZWQgd2hlbiBhbGwgbGFiZWxzIHdlcmUgbG9hZGVkXG4gICAgICAgIHRoaXMucHJvbWlzZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5mZXRjaEZvckFubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgaWYgKCFhbm5vdGF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIGRvbid0IGZldGNoIHR3aWNlXG4gICAgICAgICAgICBpZiAoIWFubm90YXRpb24ubGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMgPSBBbm5vdGF0aW9uTGFiZWwucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9uX2lkOiBhbm5vdGF0aW9uLmlkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhbm5vdGF0aW9uLmxhYmVscztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmF0dGFjaFRvQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSBBbm5vdGF0aW9uTGFiZWwuYXR0YWNoKHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uX2lkOiBhbm5vdGF0aW9uLmlkLFxuICAgICAgICAgICAgICAgIGxhYmVsX2lkOiBzZWxlY3RlZExhYmVsLmlkLFxuICAgICAgICAgICAgICAgIGNvbmZpZGVuY2U6IGN1cnJlbnRDb25maWRlbmNlXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGFiZWwuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMucHVzaChsYWJlbCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGFiZWwuJHByb21pc2UuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuXG4gICAgICAgICAgICByZXR1cm4gbGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yZW1vdmVGcm9tQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uLCBsYWJlbCkge1xuICAgICAgICAgICAgLy8gdXNlIGluZGV4IHRvIHNlZSBpZiB0aGUgbGFiZWwgZXhpc3RzIGZvciB0aGUgYW5ub3RhdGlvblxuICAgICAgICAgICAgdmFyIGluZGV4ID0gYW5ub3RhdGlvbi5sYWJlbHMuaW5kZXhPZihsYWJlbCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBbm5vdGF0aW9uTGFiZWwuZGVsZXRlKHtpZDogbGFiZWwuaWR9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaW5kZXggc2luY2UgdGhlIGxhYmVsIGxpc3QgbWF5IGhhdmUgYmVlbiBtb2RpZmllZFxuICAgICAgICAgICAgICAgICAgICAvLyBpbiB0aGUgbWVhbnRpbWVcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBhbm5vdGF0aW9uLmxhYmVscy5pbmRleE9mKGxhYmVsKTtcbiAgICAgICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB9LCBtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRUcmVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7fTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBudWxsO1xuICAgICAgICAgICAgdmFyIGJ1aWxkID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGxhYmVsLnBhcmVudF9pZDtcbiAgICAgICAgICAgICAgICBpZiAodHJlZVtrZXldW3BhcmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZVtrZXldW3BhcmVudF0ucHVzaChsYWJlbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZVtrZXldW3BhcmVudF0gPSBbbGFiZWxdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucHJvbWlzZS50aGVuKGZ1bmN0aW9uIChsYWJlbHMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBsYWJlbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZVtrZXldID0ge307XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsc1trZXldLmZvckVhY2goYnVpbGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJlZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBsYWJlbHM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRTZWxlY3RlZCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgc2VsZWN0ZWRMYWJlbCA9IGxhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0U2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0ZWRMYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc1NlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhc2VsZWN0ZWRMYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldEN1cnJlbnRDb25maWRlbmNlID0gZnVuY3Rpb24gKGNvbmZpZGVuY2UpIHtcbiAgICAgICAgICAgIGN1cnJlbnRDb25maWRlbmNlID0gY29uZmlkZW5jZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEN1cnJlbnRDb25maWRlbmNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRDb25maWRlbmNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGluaXRcbiAgICAgICAgKGZ1bmN0aW9uIChfdGhpcykge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIF90aGlzLnByb21pc2UgPSBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICAgICAgLy8gLTEgYmVjYXVzZSBvZiBnbG9iYWwgbGFiZWxzXG4gICAgICAgICAgICB2YXIgZmluaXNoZWQgPSAtMTtcblxuICAgICAgICAgICAgLy8gY2hlY2sgaWYgYWxsIGxhYmVscyBhcmUgdGhlcmUuIGlmIHllcywgcmVzb2x2ZVxuICAgICAgICAgICAgdmFyIG1heWJlUmVzb2x2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoKytmaW5pc2hlZCA9PT0gUFJPSkVDVF9JRFMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUobGFiZWxzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBsYWJlbHNbbnVsbF0gPSBMYWJlbC5xdWVyeShtYXliZVJlc29sdmUpO1xuXG4gICAgICAgICAgICBQUk9KRUNUX0lEUy5mb3JFYWNoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICAgIFByb2plY3QuZ2V0KHtpZDogaWR9LCBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbHNbcHJvamVjdC5uYW1lXSA9IFByb2plY3RMYWJlbC5xdWVyeSh7cHJvamVjdF9pZDogaWR9LCBtYXliZVJlc29sdmUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKHRoaXMpO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG1hcEFubm90YXRpb25zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBoYW5kbGluZyB0aGUgYW5ub3RhdGlvbnMgbGF5ZXIgb24gdGhlIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnbWFwQW5ub3RhdGlvbnMnLCBmdW5jdGlvbiAobWFwLCBpbWFnZXMsIGFubm90YXRpb25zLCBkZWJvdW5jZSwgc3R5bGVzLCAkaW50ZXJ2YWwsIGxhYmVscykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBhbm5vdGF0aW9uRmVhdHVyZXMgPSBuZXcgb2wuQ29sbGVjdGlvbigpO1xuICAgICAgICB2YXIgYW5ub3RhdGlvblNvdXJjZSA9IG5ldyBvbC5zb3VyY2UuVmVjdG9yKHtcbiAgICAgICAgICAgIGZlYXR1cmVzOiBhbm5vdGF0aW9uRmVhdHVyZXNcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBhbm5vdGF0aW9uTGF5ZXIgPSBuZXcgb2wubGF5ZXIuVmVjdG9yKHtcbiAgICAgICAgICAgIHNvdXJjZTogYW5ub3RhdGlvblNvdXJjZSxcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZXMuZmVhdHVyZXMsXG4gICAgICAgICAgICB6SW5kZXg6IDEwMFxuICAgICAgICB9KTtcblxuXHRcdC8vIHNlbGVjdCBpbnRlcmFjdGlvbiB3b3JraW5nIG9uIFwic2luZ2xlY2xpY2tcIlxuXHRcdHZhciBzZWxlY3QgPSBuZXcgb2wuaW50ZXJhY3Rpb24uU2VsZWN0KHtcblx0XHRcdHN0eWxlOiBzdHlsZXMuaGlnaGxpZ2h0LFxuICAgICAgICAgICAgbGF5ZXJzOiBbYW5ub3RhdGlvbkxheWVyXSxcbiAgICAgICAgICAgIC8vIGVuYWJsZSBzZWxlY3RpbmcgbXVsdGlwbGUgb3ZlcmxhcHBpbmcgZmVhdHVyZXMgYXQgb25jZVxuICAgICAgICAgICAgbXVsdGk6IHRydWVcblx0XHR9KTtcblxuXHRcdHZhciBzZWxlY3RlZEZlYXR1cmVzID0gc2VsZWN0LmdldEZlYXR1cmVzKCk7XG5cblx0XHR2YXIgbW9kaWZ5ID0gbmV3IG9sLmludGVyYWN0aW9uLk1vZGlmeSh7XG5cdFx0XHRmZWF0dXJlczogYW5ub3RhdGlvbkZlYXR1cmVzLFxuXHRcdFx0Ly8gdGhlIFNISUZUIGtleSBtdXN0IGJlIHByZXNzZWQgdG8gZGVsZXRlIHZlcnRpY2VzLCBzb1xuXHRcdFx0Ly8gdGhhdCBuZXcgdmVydGljZXMgY2FuIGJlIGRyYXduIGF0IHRoZSBzYW1lIHBvc2l0aW9uXG5cdFx0XHQvLyBvZiBleGlzdGluZyB2ZXJ0aWNlc1xuXHRcdFx0ZGVsZXRlQ29uZGl0aW9uOiBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRyZXR1cm4gb2wuZXZlbnRzLmNvbmRpdGlvbi5zaGlmdEtleU9ubHkoZXZlbnQpICYmIG9sLmV2ZW50cy5jb25kaXRpb24uc2luZ2xlQ2xpY2soZXZlbnQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG4gICAgICAgIG1vZGlmeS5zZXRBY3RpdmUoZmFsc2UpO1xuXG4gICAgICAgIHZhciB0cmFuc2xhdGUgPSBuZXcgb2wuaW50ZXJhY3Rpb24uVHJhbnNsYXRlKHtcbiAgICAgICAgICAgIGZlYXR1cmVzOiBzZWxlY3RlZEZlYXR1cmVzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyYW5zbGF0ZS5zZXRBY3RpdmUoZmFsc2UpO1xuXG5cdFx0Ly8gZHJhd2luZyBpbnRlcmFjdGlvblxuXHRcdHZhciBkcmF3O1xuICAgICAgICAvLyB0eXBlL3NoYXBlIG9mIHRoZSBkcmF3aW5nIGludGVyYWN0aW9uXG4gICAgICAgIHZhciBkcmF3aW5nVHlwZTtcblxuICAgICAgICAvLyBpbmRleCBvZiB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGFubm90YXRpb24gKGR1cmluZyBjeWNsaW5nIHRocm91Z2ggYW5ub3RhdGlvbnMpXG4gICAgICAgIC8vIGluIHRoZSBhbm5vdGF0aW9uRmVhdHVyZXMgY29sbGVjdGlvblxuICAgICAgICB2YXIgY3VycmVudEFubm90YXRpb25JbmRleCA9IDA7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB2YXIgc2VsZWN0QW5kU2hvd0Fubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIGlmIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRGZWF0dXJlcy5wdXNoKGFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIG1hcC5nZXRWaWV3KCkuZml0KGFubm90YXRpb24uZ2V0R2VvbWV0cnkoKSwgbWFwLmdldFNpemUoKSwge1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiBbNTAsIDUwLCA1MCwgNTBdXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cblx0XHQvLyBjb252ZXJ0IGEgcG9pbnQgYXJyYXkgdG8gYSBwb2ludCBvYmplY3Rcblx0XHQvLyByZS1pbnZlcnQgdGhlIHkgYXhpc1xuXHRcdHZhciBjb252ZXJ0RnJvbU9MUG9pbnQgPSBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdHJldHVybiB7eDogcG9pbnRbMF0sIHk6IGltYWdlcy5jdXJyZW50SW1hZ2UuaGVpZ2h0IC0gcG9pbnRbMV19O1xuXHRcdH07XG5cblx0XHQvLyBjb252ZXJ0IGEgcG9pbnQgb2JqZWN0IHRvIGEgcG9pbnQgYXJyYXlcblx0XHQvLyBpbnZlcnQgdGhlIHkgYXhpc1xuXHRcdHZhciBjb252ZXJ0VG9PTFBvaW50ID0gZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRyZXR1cm4gW3BvaW50LngsIGltYWdlcy5jdXJyZW50SW1hZ2UuaGVpZ2h0IC0gcG9pbnQueV07XG5cdFx0fTtcblxuXHRcdC8vIGFzc2VtYmxlcyB0aGUgY29vcmRpbmF0ZSBhcnJheXMgZGVwZW5kaW5nIG9uIHRoZSBnZW9tZXRyeSB0eXBlXG5cdFx0Ly8gc28gdGhleSBoYXZlIGEgdW5pZmllZCBmb3JtYXRcblx0XHR2YXIgZ2V0Q29vcmRpbmF0ZXMgPSBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcblx0XHRcdHN3aXRjaCAoZ2VvbWV0cnkuZ2V0VHlwZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ0NpcmNsZSc6XG5cdFx0XHRcdFx0Ly8gcmFkaXVzIGlzIHRoZSB4IHZhbHVlIG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGNpcmNsZVxuXHRcdFx0XHRcdHJldHVybiBbZ2VvbWV0cnkuZ2V0Q2VudGVyKCksIFtnZW9tZXRyeS5nZXRSYWRpdXMoKSwgMF1dO1xuXHRcdFx0XHRjYXNlICdQb2x5Z29uJzpcblx0XHRcdFx0Y2FzZSAnUmVjdGFuZ2xlJzpcblx0XHRcdFx0XHRyZXR1cm4gZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKVswXTtcblx0XHRcdFx0Y2FzZSAnUG9pbnQnOlxuXHRcdFx0XHRcdHJldHVybiBbZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKV07XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0cmV0dXJuIGdlb21ldHJ5LmdldENvb3JkaW5hdGVzKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIHNhdmVzIHRoZSB1cGRhdGVkIGdlb21ldHJ5IG9mIGFuIGFubm90YXRpb24gZmVhdHVyZVxuXHRcdHZhciBoYW5kbGVHZW9tZXRyeUNoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgZmVhdHVyZSA9IGUudGFyZ2V0O1xuXHRcdFx0dmFyIHNhdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHZhciBjb29yZGluYXRlcyA9IGdldENvb3JkaW5hdGVzKGZlYXR1cmUuZ2V0R2VvbWV0cnkoKSk7XG5cdFx0XHRcdGZlYXR1cmUuYW5ub3RhdGlvbi5wb2ludHMgPSBjb29yZGluYXRlcy5tYXAoY29udmVydEZyb21PTFBvaW50KTtcblx0XHRcdFx0ZmVhdHVyZS5hbm5vdGF0aW9uLiRzYXZlKCk7XG5cdFx0XHR9O1xuXHRcdFx0Ly8gdGhpcyBldmVudCBpcyByYXBpZGx5IGZpcmVkLCBzbyB3YWl0IHVudGlsIHRoZSBmaXJpbmcgc3RvcHNcblx0XHRcdC8vIGJlZm9yZSBzYXZpbmcgdGhlIGNoYW5nZXNcblx0XHRcdGRlYm91bmNlKHNhdmUsIDUwMCwgZmVhdHVyZS5hbm5vdGF0aW9uLmlkKTtcblx0XHR9O1xuXG5cdFx0dmFyIGNyZWF0ZUZlYXR1cmUgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0dmFyIGdlb21ldHJ5O1xuXHRcdFx0dmFyIHBvaW50cyA9IGFubm90YXRpb24ucG9pbnRzLm1hcChjb252ZXJ0VG9PTFBvaW50KTtcblxuXHRcdFx0c3dpdGNoIChhbm5vdGF0aW9uLnNoYXBlKSB7XG5cdFx0XHRcdGNhc2UgJ1BvaW50Jzpcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlBvaW50KHBvaW50c1swXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ1JlY3RhbmdsZSc6XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5SZWN0YW5nbGUoWyBwb2ludHMgXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ1BvbHlnb24nOlxuXHRcdFx0XHRcdC8vIGV4YW1wbGU6IGh0dHBzOi8vZ2l0aHViLmNvbS9vcGVubGF5ZXJzL29sMy9ibG9iL21hc3Rlci9leGFtcGxlcy9nZW9qc29uLmpzI0wxMjZcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlBvbHlnb24oWyBwb2ludHMgXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0xpbmVTdHJpbmcnOlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uTGluZVN0cmluZyhwb2ludHMpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdDaXJjbGUnOlxuXHRcdFx0XHRcdC8vIHJhZGl1cyBpcyB0aGUgeCB2YWx1ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjaXJjbGVcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLkNpcmNsZShwb2ludHNbMF0sIHBvaW50c1sxXVswXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gdW5zdXBwb3J0ZWQgc2hhcGVzIGFyZSBpZ25vcmVkXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVW5rbm93biBhbm5vdGF0aW9uIHNoYXBlOiAnICsgYW5ub3RhdGlvbi5zaGFwZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGZlYXR1cmUgPSBuZXcgb2wuRmVhdHVyZSh7IGdlb21ldHJ5OiBnZW9tZXRyeSB9KTtcbiAgICAgICAgICAgIGZlYXR1cmUuYW5ub3RhdGlvbiA9IGFubm90YXRpb247XG4gICAgICAgICAgICBpZiAoYW5ub3RhdGlvbi5sYWJlbHMgJiYgYW5ub3RhdGlvbi5sYWJlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGZlYXR1cmUuY29sb3IgPSBhbm5vdGF0aW9uLmxhYmVsc1swXS5sYWJlbC5jb2xvcjtcbiAgICAgICAgICAgIH1cblx0XHRcdGZlYXR1cmUub24oJ2NoYW5nZScsIGhhbmRsZUdlb21ldHJ5Q2hhbmdlKTtcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuYWRkRmVhdHVyZShmZWF0dXJlKTtcblx0XHR9O1xuXG5cdFx0dmFyIHJlZnJlc2hBbm5vdGF0aW9ucyA9IGZ1bmN0aW9uIChlLCBpbWFnZSkge1xuXHRcdFx0Ly8gY2xlYXIgZmVhdHVyZXMgb2YgcHJldmlvdXMgaW1hZ2VcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuY2xlYXIoKTtcblx0XHRcdF90aGlzLmNsZWFyU2VsZWN0aW9uKCk7XG5cblx0XHRcdGFubm90YXRpb25zLnF1ZXJ5KHtpZDogaW1hZ2UuX2lkfSkuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGFubm90YXRpb25zLmZvckVhY2goY3JlYXRlRmVhdHVyZSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dmFyIGhhbmRsZU5ld0ZlYXR1cmUgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIGdlb21ldHJ5ID0gZS5mZWF0dXJlLmdldEdlb21ldHJ5KCk7XG5cdFx0XHR2YXIgY29vcmRpbmF0ZXMgPSBnZXRDb29yZGluYXRlcyhnZW9tZXRyeSk7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSBsYWJlbHMuZ2V0U2VsZWN0ZWQoKTtcblxuICAgICAgICAgICAgZS5mZWF0dXJlLmNvbG9yID0gbGFiZWwuY29sb3I7XG5cblx0XHRcdGUuZmVhdHVyZS5hbm5vdGF0aW9uID0gYW5ub3RhdGlvbnMuYWRkKHtcblx0XHRcdFx0aWQ6IGltYWdlcy5nZXRDdXJyZW50SWQoKSxcblx0XHRcdFx0c2hhcGU6IGdlb21ldHJ5LmdldFR5cGUoKSxcblx0XHRcdFx0cG9pbnRzOiBjb29yZGluYXRlcy5tYXAoY29udmVydEZyb21PTFBvaW50KSxcbiAgICAgICAgICAgICAgICBsYWJlbF9pZDogbGFiZWwuaWQsXG4gICAgICAgICAgICAgICAgY29uZmlkZW5jZTogbGFiZWxzLmdldEN1cnJlbnRDb25maWRlbmNlKClcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBpZiB0aGUgZmVhdHVyZSBjb3VsZG4ndCBiZSBzYXZlZCwgcmVtb3ZlIGl0IGFnYWluXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbi4kcHJvbWlzZS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5yZW1vdmVGZWF0dXJlKGUuZmVhdHVyZSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0ZS5mZWF0dXJlLm9uKCdjaGFuZ2UnLCBoYW5kbGVHZW9tZXRyeUNoYW5nZSk7XG5cbiAgICAgICAgICAgIHJldHVybiBlLmZlYXR1cmUuYW5ub3RhdGlvbi4kcHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBtYXAuYWRkTGF5ZXIoYW5ub3RhdGlvbkxheWVyKTtcblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihzZWxlY3QpO1xuICAgICAgICAgICAgbWFwLmFkZEludGVyYWN0aW9uKHRyYW5zbGF0ZSk7XG4gICAgICAgICAgICBtYXAuYWRkSW50ZXJhY3Rpb24obW9kaWZ5KTtcblx0XHRcdHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCByZWZyZXNoQW5ub3RhdGlvbnMpO1xuXG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLm9uKCdjaGFuZ2U6bGVuZ3RoJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyBpZiBub3QgYWxyZWFkeSBkaWdlc3RpbmcsIGRpZ2VzdFxuXHRcdFx0XHRpZiAoIXNjb3BlLiQkcGhhc2UpIHtcblx0XHRcdFx0XHQvLyBwcm9wYWdhdGUgbmV3IHNlbGVjdGlvbnMgdGhyb3VnaCB0aGUgYW5ndWxhciBhcHBsaWNhdGlvblxuXHRcdFx0XHRcdHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5zdGFydERyYXdpbmcgPSBmdW5jdGlvbiAodHlwZSkge1xuICAgICAgICAgICAgc2VsZWN0LnNldEFjdGl2ZShmYWxzZSk7XG4gICAgICAgICAgICBtb2RpZnkuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICAgICAgX3RoaXMuZmluaXNoTW92aW5nKCk7XG4gICAgICAgICAgICAvLyBhbGxvdyBvbmx5IG9uZSBkcmF3IGludGVyYWN0aW9uIGF0IGEgdGltZVxuICAgICAgICAgICAgbWFwLnJlbW92ZUludGVyYWN0aW9uKGRyYXcpO1xuXG5cdFx0XHRkcmF3aW5nVHlwZSA9IHR5cGUgfHwgJ1BvaW50Jztcblx0XHRcdGRyYXcgPSBuZXcgb2wuaW50ZXJhY3Rpb24uRHJhdyh7XG4gICAgICAgICAgICAgICAgc291cmNlOiBhbm5vdGF0aW9uU291cmNlLFxuXHRcdFx0XHR0eXBlOiBkcmF3aW5nVHlwZSxcblx0XHRcdFx0c3R5bGU6IHN0eWxlcy5lZGl0aW5nXG5cdFx0XHR9KTtcblxuXHRcdFx0bWFwLmFkZEludGVyYWN0aW9uKGRyYXcpO1xuXHRcdFx0ZHJhdy5vbignZHJhd2VuZCcsIGhhbmRsZU5ld0ZlYXR1cmUpO1xuXHRcdH07XG5cblx0XHR0aGlzLmZpbmlzaERyYXdpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtYXAucmVtb3ZlSW50ZXJhY3Rpb24oZHJhdyk7XG4gICAgICAgICAgICBkcmF3LnNldEFjdGl2ZShmYWxzZSk7XG4gICAgICAgICAgICBkcmF3aW5nVHlwZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHNlbGVjdC5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgICAgICBtb2RpZnkuc2V0QWN0aXZlKGZhbHNlKTtcblx0XHRcdC8vIGRvbid0IHNlbGVjdCB0aGUgbGFzdCBkcmF3biBwb2ludFxuXHRcdFx0X3RoaXMuY2xlYXJTZWxlY3Rpb24oKTtcblx0XHR9O1xuXG4gICAgICAgIHRoaXMuaXNEcmF3aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRyYXcgJiYgZHJhdy5nZXRBY3RpdmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnN0YXJ0TW92aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLmlzRHJhd2luZygpKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuZmluaXNoRHJhd2luZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJhbnNsYXRlLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmZpbmlzaE1vdmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRyYW5zbGF0ZS5zZXRBY3RpdmUoZmFsc2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaXNNb3ZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJhbnNsYXRlLmdldEFjdGl2ZSgpO1xuICAgICAgICB9O1xuXG5cdFx0dGhpcy5kZWxldGVTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoZmVhdHVyZSkge1xuXHRcdFx0XHRhbm5vdGF0aW9ucy5kZWxldGUoZmVhdHVyZS5hbm5vdGF0aW9uKS50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRhbm5vdGF0aW9uU291cmNlLnJlbW92ZUZlYXR1cmUoZmVhdHVyZSk7XG5cdFx0XHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5yZW1vdmUoZmVhdHVyZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuc2VsZWN0ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgZmVhdHVyZTtcblx0XHRcdGFubm90YXRpb25Tb3VyY2UuZm9yRWFjaEZlYXR1cmUoZnVuY3Rpb24gKGYpIHtcblx0XHRcdFx0aWYgKGYuYW5ub3RhdGlvbi5pZCA9PT0gaWQpIHtcblx0XHRcdFx0XHRmZWF0dXJlID0gZjtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyByZW1vdmUgc2VsZWN0aW9uIGlmIGZlYXR1cmUgd2FzIGFscmVhZHkgc2VsZWN0ZWQuIG90aGVyd2lzZSBzZWxlY3QuXG5cdFx0XHRpZiAoIXNlbGVjdGVkRmVhdHVyZXMucmVtb3ZlKGZlYXR1cmUpKSB7XG5cdFx0XHRcdHNlbGVjdGVkRmVhdHVyZXMucHVzaChmZWF0dXJlKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIC8vIGZpdHMgdGhlIHZpZXcgdG8gdGhlIGdpdmVuIGZlYXR1cmVcbiAgICAgICAgdGhpcy5maXQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuZm9yRWFjaEZlYXR1cmUoZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgICAgICAgICBpZiAoZi5hbm5vdGF0aW9uLmlkID09PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBhbmltYXRlIGZpdFxuICAgICAgICAgICAgICAgICAgICB2YXIgdmlldyA9IG1hcC5nZXRWaWV3KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYW4gPSBvbC5hbmltYXRpb24ucGFuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogdmlldy5nZXRDZW50ZXIoKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHpvb20gPSBvbC5hbmltYXRpb24uem9vbSh7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHV0aW9uOiB2aWV3LmdldFJlc29sdXRpb24oKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgbWFwLmJlZm9yZVJlbmRlcihwYW4sIHpvb20pO1xuICAgICAgICAgICAgICAgICAgICB2aWV3LmZpdChmLmdldEdlb21ldHJ5KCksIG1hcC5nZXRTaXplKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG5cdFx0dGhpcy5jbGVhclNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuY2xlYXIoKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRTZWxlY3RlZEZlYXR1cmVzID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHNlbGVjdGVkRmVhdHVyZXM7XG5cdFx0fTtcblxuICAgICAgICB0aGlzLmdldFNlbGVjdGVkRHJhd2luZ1R5cGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZHJhd2luZ1R5cGU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gbWFudWFsbHkgYWRkIGEgbmV3IGZlYXR1cmUgKG5vdCB0aHJvdWdoIHRoZSBkcmF3IGludGVyYWN0aW9uKVxuICAgICAgICB0aGlzLmFkZEZlYXR1cmUgPSBmdW5jdGlvbiAoZmVhdHVyZSkge1xuICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5hZGRGZWF0dXJlKGZlYXR1cmUpO1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZU5ld0ZlYXR1cmUoe2ZlYXR1cmU6IGZlYXR1cmV9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldE9wYWNpdHkgPSBmdW5jdGlvbiAob3BhY2l0eSkge1xuICAgICAgICAgICAgYW5ub3RhdGlvbkxheWVyLnNldE9wYWNpdHkob3BhY2l0eSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5jeWNsZU5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjdXJyZW50QW5ub3RhdGlvbkluZGV4ID0gKGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggKyAxKSAlIGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKTtcbiAgICAgICAgICAgIF90aGlzLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc05leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggKyAxKSA8IGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmN5Y2xlUHJldmlvdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyB3ZSB3YW50IG5vIG5lZ2F0aXZlIGluZGV4IGhlcmVcbiAgICAgICAgICAgIGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggPSAoY3VycmVudEFubm90YXRpb25JbmRleCArIGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKSAtIDEpICUgYW5ub3RhdGlvbkZlYXR1cmVzLmdldExlbmd0aCgpO1xuICAgICAgICAgICAgX3RoaXMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzUHJldmlvdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudEFubm90YXRpb25JbmRleCA+IDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5qdW1wVG9DdXJyZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gb25seSBqdW1wIG9uY2UgdGhlIGFubm90YXRpb25zIHdlcmUgbG9hZGVkXG4gICAgICAgICAgICBhbm5vdGF0aW9ucy5nZXRQcm9taXNlKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0QW5kU2hvd0Fubm90YXRpb24oYW5ub3RhdGlvbkZlYXR1cmVzLml0ZW0oY3VycmVudEFubm90YXRpb25JbmRleCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5qdW1wVG9GaXJzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggPSAwO1xuICAgICAgICAgICAgX3RoaXMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuanVtcFRvTGFzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGFubm90YXRpb25zLmdldFByb21pc2UoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyB3YWl0IGZvciB0aGUgbmV3IGFubm90YXRpb25zIHRvIGJlIGxvYWRlZFxuICAgICAgICAgICAgICAgIGlmIChhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCkgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEFubm90YXRpb25JbmRleCA9IGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKSAtIDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF90aGlzLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGZsaWNrZXIgdGhlIGhpZ2hsaWdodGVkIGFubm90YXRpb24gdG8gc2lnbmFsIGFuIGVycm9yXG4gICAgICAgIHRoaXMuZmxpY2tlciA9IGZ1bmN0aW9uIChjb3VudCkge1xuICAgICAgICAgICAgdmFyIGFubm90YXRpb24gPSBzZWxlY3RlZEZlYXR1cmVzLml0ZW0oMCk7XG4gICAgICAgICAgICBpZiAoIWFubm90YXRpb24pIHJldHVybjtcbiAgICAgICAgICAgIGNvdW50ID0gY291bnQgfHwgMztcblxuICAgICAgICAgICAgdmFyIHRvZ2dsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWRGZWF0dXJlcy5nZXRMZW5ndGgoKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRGZWF0dXJlcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkRmVhdHVyZXMucHVzaChhbm5vdGF0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gbnVtYmVyIG9mIHJlcGVhdHMgbXVzdCBiZSBldmVuLCBvdGhlcndpc2UgdGhlIGxheWVyIHdvdWxkIHN0YXkgb252aXNpYmxlXG4gICAgICAgICAgICAkaW50ZXJ2YWwodG9nZ2xlLCAxMDAsIGNvdW50ICogMik7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRDdXJyZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFubm90YXRpb25GZWF0dXJlcy5pdGVtKGN1cnJlbnRBbm5vdGF0aW9uSW5kZXgpLmFubm90YXRpb247XG4gICAgICAgIH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG1hcEltYWdlXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBoYW5kbGluZyB0aGUgaW1hZ2UgbGF5ZXIgb24gdGhlIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnbWFwSW1hZ2UnLCBmdW5jdGlvbiAobWFwKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cdFx0dmFyIGV4dGVudCA9IFswLCAwLCAwLCAwXTtcblxuXHRcdHZhciBwcm9qZWN0aW9uID0gbmV3IG9sLnByb2ouUHJvamVjdGlvbih7XG5cdFx0XHRjb2RlOiAnZGlhcy1pbWFnZScsXG5cdFx0XHR1bml0czogJ3BpeGVscycsXG5cdFx0XHRleHRlbnQ6IGV4dGVudFxuXHRcdH0pO1xuXG5cdFx0dmFyIGltYWdlTGF5ZXIgPSBuZXcgb2wubGF5ZXIuSW1hZ2UoKTtcblxuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uIChzY29wZSkge1xuXHRcdFx0bWFwLmFkZExheWVyKGltYWdlTGF5ZXIpO1xuXG5cdFx0XHQvLyByZWZyZXNoIHRoZSBpbWFnZSBzb3VyY2Vcblx0XHRcdHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCBmdW5jdGlvbiAoZSwgaW1hZ2UpIHtcblx0XHRcdFx0ZXh0ZW50WzJdID0gaW1hZ2Uud2lkdGg7XG5cdFx0XHRcdGV4dGVudFszXSA9IGltYWdlLmhlaWdodDtcblxuXHRcdFx0XHR2YXIgem9vbSA9IHNjb3BlLnZpZXdwb3J0Lnpvb207XG5cblx0XHRcdFx0dmFyIGNlbnRlciA9IHNjb3BlLnZpZXdwb3J0LmNlbnRlcjtcblx0XHRcdFx0Ly8gdmlld3BvcnQgY2VudGVyIGlzIHN0aWxsIHVuaW5pdGlhbGl6ZWRcblx0XHRcdFx0aWYgKGNlbnRlclswXSA9PT0gdW5kZWZpbmVkICYmIGNlbnRlclsxXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0Y2VudGVyID0gb2wuZXh0ZW50LmdldENlbnRlcihleHRlbnQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGltYWdlU3RhdGljID0gbmV3IG9sLnNvdXJjZS5JbWFnZVN0YXRpYyh7XG5cdFx0XHRcdFx0dXJsOiBpbWFnZS5zcmMsXG5cdFx0XHRcdFx0cHJvamVjdGlvbjogcHJvamVjdGlvbixcblx0XHRcdFx0XHRpbWFnZUV4dGVudDogZXh0ZW50XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGltYWdlTGF5ZXIuc2V0U291cmNlKGltYWdlU3RhdGljKTtcblxuXHRcdFx0XHRtYXAuc2V0VmlldyhuZXcgb2wuVmlldyh7XG5cdFx0XHRcdFx0cHJvamVjdGlvbjogcHJvamVjdGlvbixcblx0XHRcdFx0XHRjZW50ZXI6IGNlbnRlcixcblx0XHRcdFx0XHR6b29tOiB6b29tLFxuXHRcdFx0XHRcdHpvb21GYWN0b3I6IDEuNSxcblx0XHRcdFx0XHQvLyBhbGxvdyBhIG1heGltdW0gb2YgNHggbWFnbmlmaWNhdGlvblxuXHRcdFx0XHRcdG1pblJlc29sdXRpb246IDAuMjUsXG5cdFx0XHRcdFx0Ly8gcmVzdHJpY3QgbW92ZW1lbnRcblx0XHRcdFx0XHRleHRlbnQ6IGV4dGVudFxuXHRcdFx0XHR9KSk7XG5cblx0XHRcdFx0Ly8gaWYgem9vbSBpcyBub3QgaW5pdGlhbGl6ZWQsIGZpdCB0aGUgdmlldyB0byB0aGUgaW1hZ2UgZXh0ZW50XG5cdFx0XHRcdGlmICh6b29tID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRtYXAuZ2V0VmlldygpLmZpdChleHRlbnQsIG1hcC5nZXRTaXplKCkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRFeHRlbnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gZXh0ZW50O1xuXHRcdH07XG5cblx0XHR0aGlzLmdldFByb2plY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gcHJvamVjdGlvbjtcblx0XHR9O1xuXG4gICAgICAgIHRoaXMuZ2V0TGF5ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VMYXllcjtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgc3R5bGVzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgdGhlIE9wZW5MYXllcnMgc3R5bGVzXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnc3R5bGVzJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5jb2xvcnMgPSB7XG4gICAgICAgICAgICB3aGl0ZTogWzI1NSwgMjU1LCAyNTUsIDFdLFxuICAgICAgICAgICAgYmx1ZTogWzAsIDE1MywgMjU1LCAxXSxcbiAgICAgICAgICAgIG9yYW5nZTogJyNmZjVlMDAnXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGRlZmF1bHRDaXJjbGVSYWRpdXMgPSA2O1xuICAgICAgICB2YXIgZGVmYXVsdFN0cm9rZVdpZHRoID0gMztcblxuICAgICAgICB2YXIgZGVmYXVsdFN0cm9rZU91dGxpbmUgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcbiAgICAgICAgICAgIHdpZHRoOiA1XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZFN0cm9rZU91dGxpbmUgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcbiAgICAgICAgICAgIHdpZHRoOiA2XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBkZWZhdWx0U3Ryb2tlID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMuYmx1ZSxcbiAgICAgICAgICAgIHdpZHRoOiBkZWZhdWx0U3Ryb2tlV2lkdGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkU3Ryb2tlID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMub3JhbmdlLFxuICAgICAgICAgICAgd2lkdGg6IGRlZmF1bHRTdHJva2VXaWR0aFxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZGVmYXVsdENpcmNsZUZpbGwgPSBuZXcgb2wuc3R5bGUuRmlsbCh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMuYmx1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRDaXJjbGVGaWxsID0gbmV3IG9sLnN0eWxlLkZpbGwoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLm9yYW5nZVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZGVmYXVsdENpcmNsZVN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgd2lkdGg6IDJcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkQ2lyY2xlU3Ryb2tlID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICB3aWR0aDogZGVmYXVsdFN0cm9rZVdpZHRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBlZGl0aW5nQ2lyY2xlU3Ryb2tlID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICB3aWR0aDogMixcbiAgICAgICAgICAgIGxpbmVEYXNoOiBbM11cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGVkaXRpbmdTdHJva2UgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlLFxuICAgICAgICAgICAgd2lkdGg6IGRlZmF1bHRTdHJva2VXaWR0aCxcbiAgICAgICAgICAgIGxpbmVEYXNoOiBbNV1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRGaWxsID0gbmV3IG9sLnN0eWxlLkZpbGwoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLmJsdWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkRmlsbCA9IG5ldyBvbC5zdHlsZS5GaWxsKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5vcmFuZ2VcbiAgICAgICAgfSk7XG5cblx0XHR0aGlzLmZlYXR1cmVzID0gZnVuY3Rpb24gKGZlYXR1cmUpIHtcbiAgICAgICAgICAgIHZhciBjb2xvciA9IGZlYXR1cmUuY29sb3IgPyAoJyMnICsgZmVhdHVyZS5jb2xvcikgOiBfdGhpcy5jb2xvcnMuYmx1ZTtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgbmV3IG9sLnN0eWxlLlN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOiBkZWZhdWx0U3Ryb2tlT3V0bGluZSxcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmFkaXVzOiBkZWZhdWx0Q2lyY2xlUmFkaXVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDogbmV3IG9sLnN0eWxlLkZpbGwoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBjb2xvclxuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJva2U6IGRlZmF1bHRDaXJjbGVTdHJva2VcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgb2wuc3R5bGUuU3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICBzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGNvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDNcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgXTtcbiAgICAgICAgfTtcblxuXHRcdHRoaXMuaGlnaGxpZ2h0ID0gW1xuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBzZWxlY3RlZFN0cm9rZU91dGxpbmUsXG5cdFx0XHRcdGltYWdlOiBuZXcgb2wuc3R5bGUuQ2lyY2xlKHtcblx0XHRcdFx0XHRyYWRpdXM6IGRlZmF1bHRDaXJjbGVSYWRpdXMsXG5cdFx0XHRcdFx0ZmlsbDogc2VsZWN0ZWRDaXJjbGVGaWxsLFxuXHRcdFx0XHRcdHN0cm9rZTogc2VsZWN0ZWRDaXJjbGVTdHJva2Vcblx0XHRcdFx0fSksXG4gICAgICAgICAgICAgICAgekluZGV4OiAyMDBcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBzZWxlY3RlZFN0cm9rZSxcbiAgICAgICAgICAgICAgICB6SW5kZXg6IDIwMFxuXHRcdFx0fSlcblx0XHRdO1xuXG5cdFx0dGhpcy5lZGl0aW5nID0gW1xuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBkZWZhdWx0U3Ryb2tlT3V0bGluZSxcblx0XHRcdFx0aW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0XHRcdHJhZGl1czogZGVmYXVsdENpcmNsZVJhZGl1cyxcblx0XHRcdFx0XHRmaWxsOiBkZWZhdWx0Q2lyY2xlRmlsbCxcblx0XHRcdFx0XHRzdHJva2U6IGVkaXRpbmdDaXJjbGVTdHJva2Vcblx0XHRcdFx0fSlcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBlZGl0aW5nU3Ryb2tlXG5cdFx0XHR9KVxuXHRcdF07XG5cblx0XHR0aGlzLnZpZXdwb3J0ID0gW1xuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBkZWZhdWx0U3Ryb2tlLFxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxXG4gICAgICAgICAgICAgICAgfSlcblx0XHRcdH0pXG5cdFx0XTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgdXJsUGFyYW1zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFRoZSBHRVQgcGFyYW1ldGVycyBvZiB0aGUgdXJsLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ3VybFBhcmFtcycsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBzdGF0ZSA9IHt9O1xuXG5cdFx0Ly8gdHJhbnNmb3JtcyBhIFVSTCBwYXJhbWV0ZXIgc3RyaW5nIGxpa2UgI2E9MSZiPTIgdG8gYW4gb2JqZWN0XG5cdFx0dmFyIGRlY29kZVN0YXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHBhcmFtcyA9IGxvY2F0aW9uLmhhc2gucmVwbGFjZSgnIycsICcnKVxuXHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJyYnKTtcblxuXHRcdFx0dmFyIHN0YXRlID0ge307XG5cblx0XHRcdHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJhbSkge1xuXHRcdFx0XHQvLyBjYXB0dXJlIGtleS12YWx1ZSBwYWlyc1xuXHRcdFx0XHR2YXIgY2FwdHVyZSA9IHBhcmFtLm1hdGNoKC8oLispXFw9KC4rKS8pO1xuXHRcdFx0XHRpZiAoY2FwdHVyZSAmJiBjYXB0dXJlLmxlbmd0aCA9PT0gMykge1xuXHRcdFx0XHRcdHN0YXRlW2NhcHR1cmVbMV1dID0gZGVjb2RlVVJJQ29tcG9uZW50KGNhcHR1cmVbMl0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHN0YXRlO1xuXHRcdH07XG5cblx0XHQvLyB0cmFuc2Zvcm1zIGFuIG9iamVjdCB0byBhIFVSTCBwYXJhbWV0ZXIgc3RyaW5nXG5cdFx0dmFyIGVuY29kZVN0YXRlID0gZnVuY3Rpb24gKHN0YXRlKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gJyc7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gc3RhdGUpIHtcblx0XHRcdFx0cGFyYW1zICs9IGtleSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChzdGF0ZVtrZXldKSArICcmJztcblx0XHRcdH1cblx0XHRcdHJldHVybiBwYXJhbXMuc3Vic3RyaW5nKDAsIHBhcmFtcy5sZW5ndGggLSAxKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5wdXNoU3RhdGUgPSBmdW5jdGlvbiAocykge1xuXHRcdFx0c3RhdGUuc2x1ZyA9IHM7XG5cdFx0XHRoaXN0b3J5LnB1c2hTdGF0ZShzdGF0ZSwgJycsIHN0YXRlLnNsdWcgKyAnIycgKyBlbmNvZGVTdGF0ZShzdGF0ZSkpO1xuXHRcdH07XG5cblx0XHQvLyBzZXRzIGEgVVJMIHBhcmFtZXRlciBhbmQgdXBkYXRlcyB0aGUgaGlzdG9yeSBzdGF0ZVxuXHRcdHRoaXMuc2V0ID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIHBhcmFtcykge1xuXHRcdFx0XHRzdGF0ZVtrZXldID0gcGFyYW1zW2tleV07XG5cdFx0XHR9XG5cdFx0XHRoaXN0b3J5LnJlcGxhY2VTdGF0ZShzdGF0ZSwgJycsIHN0YXRlLnNsdWcgKyAnIycgKyBlbmNvZGVTdGF0ZShzdGF0ZSkpO1xuXHRcdH07XG5cblx0XHQvLyByZXR1cm5zIGEgVVJMIHBhcmFtZXRlclxuXHRcdHRoaXMuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuXHRcdFx0cmV0dXJuIHN0YXRlW2tleV07XG5cdFx0fTtcblxuXHRcdHN0YXRlID0gaGlzdG9yeS5zdGF0ZTtcblxuXHRcdGlmICghc3RhdGUpIHtcblx0XHRcdHN0YXRlID0gZGVjb2RlU3RhdGUoKTtcblx0XHR9XG5cdH1cbik7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9