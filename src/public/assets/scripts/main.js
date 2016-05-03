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

        var selectedFeatures = mapAnnotations.getSelectedFeatures();

		$scope.selectedFeatures = selectedFeatures.getArray();

		var refreshAnnotations = function () {
			$scope.annotations = annotations.current();
		};

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
angular.module('dias.annotations').controller('EditControlsController', ["$scope", "mapAnnotations", "keyboard", "$timeout", function ($scope, mapAnnotations, keyboard, $timeout) {
		"use strict";

        // the user has a certain amount of time to quick delete the last drawn
        // annotation; this bool tells us whether the timeout is still running.
        var isInDeleteLastAnnotationTimeout = false;
        // time in ms in which the user is allowed to quick delete an annotation
        var deleteLastAnnotationTimeout = 10000;
        var timeoutPromise;

        $scope.deleteSelectedAnnotations = function () {
            if (mapAnnotations.hasSelectedFeatures() && confirm('Are you sure you want to delete all selected annotations?')) {
                mapAnnotations.deleteSelected();
            }
        };

        $scope.hasSelectedAnnotations = mapAnnotations.hasSelectedFeatures;

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

        $scope.canDeleteLastAnnotation = function () {
            return isInDeleteLastAnnotationTimeout && mapAnnotations.hasDrawnAnnotation();
        };

        $scope.deleteLastDrawnAnnotation = function () {
            if ($scope.canDeleteLastAnnotation()) {
                mapAnnotations.deleteLastDrawnAnnotation();
            }
        };

        $scope.isMoving = mapAnnotations.isMoving;

        // the quick delete timeout always starts when a new annotation was drawn
        $scope.$on('annotations.drawn', function (e, feature) {
            isInDeleteLastAnnotationTimeout = true;
            $timeout.cancel(timeoutPromise);
            timeoutPromise = $timeout(function () {
                isInDeleteLastAnnotationTimeout = false;
            }, deleteLastAnnotationTimeout);
        });

        // del key
        keyboard.on(46, function (e) {
            $scope.deleteSelectedAnnotations();
            $scope.$apply();
        });

        // esc key
        keyboard.on(27, function () {
            if ($scope.isMoving()) {
                $scope.$apply(finishMoving);
            }
        });

        // backspace key
        keyboard.on(8, function (e) {
            $scope.deleteLastDrawnAnnotation();
            $scope.$apply();
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
        // identifier for this cycling variant (there are others, too)
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

        $scope.attributes = {
            // restrict cycling of annotations to the currently selected label category
            restrict: false
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

        var unwatchSelectedLabel;

        var watchSelectedLabel = function () {
            if (unwatchSelectedLabel) unwatchSelectedLabel();
            unwatchSelectedLabel = $scope.$watch(labels.getSelected, function () {
                if ($scope.cycling()) {
                    mapAnnotations.jumpToFirst();
                }
            });
        };

        $scope.$watch('attributes.restrict', function (restrict) {
            mapAnnotations.setRestrictLabelCategory(restrict);
            if ($scope.cycling()) {
                mapAnnotations.jumpToFirst();
            }

            if (restrict) {
                watchSelectedLabel();
            } else if (unwatchSelectedLabel) {
                unwatchSelectedLabel();
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

        this.getSelectedId = function () {
            return selectedLabel ? selectedLabel.id : null;
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

        // the geometric features of the annotations on the map
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

        // all annotations that are currently selected
		var selectedFeatures = select.getFeatures();

        // interaction for modifying annotations
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

        // interaction for moving annotations
        var translate = new ol.interaction.Translate({
            features: selectedFeatures
        });

        translate.setActive(false);

		// drawing interaction, will be a new one for each drawing tool
		var draw;
        // type/shape of the drawing interaction
        var drawingType;

        // index of the currently selected annotation (during cycling through annotations)
        // in the annotationFeatures collection
        var currentAnnotationIndex = 0;

        // the annotation that was drawn last during the current session
        var lastDrawnFeature;

        // restrict cycling through annotations to those having the currently selected
        // label category
        var restrictLabelCategory = false;

        var _this = this;

        // scope of the CanvasController
        var _scope;

        // selects a single annotation and moves the viewport to it
        var selectAndShowAnnotation = function (annotation) {
            _this.clearSelection();
            if (annotation) {
                selectedFeatures.push(annotation);
                map.getView().fit(annotation.getGeometry(), map.getSize(), {
                    padding: [50, 50, 50, 50]
                });
            }
        };

        // invert y coordinates of a points array
        var convertFromOLPoint = function (point, index) {
            return (index % 2 === 1) ? (images.currentImage.height - point) : point;
        };

		// assembles the coordinate arrays depending on the geometry type
		// so they have a unified format
		var getCoordinates = function (geometry) {
            var coordinates;
			switch (geometry.getType()) {
				case 'Circle':
					// radius is the x value of the second point of the circle
					coordinates = [geometry.getCenter(), [geometry.getRadius()]];
                    break;
				case 'Polygon':
				case 'Rectangle':
					coordinates = geometry.getCoordinates()[0];
                    break;
				case 'Point':
					coordinates = [geometry.getCoordinates()];
                    break;
				default:
					coordinates = geometry.getCoordinates();
			}

            // merge the individual point arrays to a single array
            // round the coordinates to integers
            return [].concat.apply([], coordinates)
                .map(Math.round)
                .map(convertFromOLPoint);
		};

		// saves the updated geometry of an annotation feature
		var handleGeometryChange = function (e) {
			var feature = e.target;
			var save = function () {
				feature.annotation.points = getCoordinates(feature.getGeometry());
				feature.annotation.$save();
			};
			// this event is rapidly fired, so wait until the firing stops
			// before saving the changes
			debounce(save, 500, feature.annotation.id);
		};

        // create a new OL feature on the map based on an annotation object
		var createFeature = function (annotation) {
			var geometry;
			var points = annotation.points;
            var newPoints = [];
            var height = images.currentImage.height;
            // convert points array to OL points
            for (var i = 0; i < points.length; i += 2) {
                newPoints.push([
                    points[i],
                    // invert the y axis to OL coordinates
                    // circles have no fourth point so we take 0
                    height - (points[i + 1] || 0)
                ]);
            }

			switch (annotation.shape) {
				case 'Point':
					geometry = new ol.geom.Point(newPoints[0]);
					break;
				case 'Rectangle':
					geometry = new ol.geom.Rectangle([ newPoints ]);
					break;
				case 'Polygon':
					// example: https://github.com/openlayers/ol3/blob/master/examples/geojson.js#L126
					geometry = new ol.geom.Polygon([ newPoints ]);
					break;
				case 'LineString':
					geometry = new ol.geom.LineString(newPoints);
					break;
				case 'Circle':
					// radius is the x value of the second point of the circle
					geometry = new ol.geom.Circle(newPoints[0], newPoints[1][0]);
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

        // redraw all features with those belonging to the specified image
		var refreshAnnotations = function (e, image) {
			// clear features of previous image
            annotationSource.clear();
			_this.clearSelection();
            lastDrawnFeature = null;

			annotations.query({id: image._id}).$promise.then(function () {
				annotations.forEach(createFeature);
			});
		};

        // handle a newly drawn annotation
		var handleNewFeature = function (e) {
			var geometry = e.feature.getGeometry();
            var label = labels.getSelected();

            e.feature.color = label.color;

			e.feature.annotation = annotations.add({
				id: images.getCurrentId(),
				shape: geometry.getType(),
				points: getCoordinates(geometry),
                label_id: label.id,
                confidence: labels.getCurrentConfidence()
			});

			// if the feature couldn't be saved, remove it again
			e.feature.annotation.$promise.catch(function () {
                annotationSource.removeFeature(e.feature);
			});

			e.feature.on('change', handleGeometryChange);

            lastDrawnFeature = e.feature;

            return e.feature.annotation.$promise;
		};

        // handle the removal of an annotation
        var removeFeature = function (feature) {
            if (feature === lastDrawnFeature) {
                lastDrawnFeature = null;
            }

            annotations.delete(feature.annotation).then(function () {
                annotationSource.removeFeature(feature);
                selectedFeatures.remove(feature);
            });
        };

        // returns true if the supplied annotation has a label of the same category than
        // the currently selected category
        var annotationHasCurrentLabel = function (annotation) {
            if (!annotation.labels) return false;
            var id = labels.getSelectedId();
            for (var i = 0; i < annotation.labels.length; i++) {
                if (!annotation.labels[i].label) continue;
                if (annotation.labels[i].label.id === id) {
                    return true;
                }
            }

            return false;
        };

        // filters out any annotation that does
        var filterAnnotationsLabelCategory = function (feature) {
            return !restrictLabelCategory || annotationHasCurrentLabel(feature.annotation);
        };

        var getFilteredAnnotationFeatures = function () {
            return annotationFeatures.getArray().filter(filterAnnotationsLabelCategory);
        };

		this.init = function (scope) {
            _scope = scope;
            map.addLayer(annotationLayer);
			map.addInteraction(select);
            map.addInteraction(translate);
            map.addInteraction(modify);
			scope.$on('image.shown', refreshAnnotations);

            var apply = function () {
                // if not already digesting, digest
                if (!scope.$$phase) {
                    // propagate new selections through the angular application
                    scope.$apply();
                }
            };

			selectedFeatures.on('change:length', apply);
		};

        // put the map into drawing mode
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
            draw.on('drawend', function (e) {
                _scope.$broadcast('annotations.drawn', e.feature);
            });
		};

        // put the map out of drawing mode
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

        // put the map into moving mode (of an annotation)
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

        this.hasDrawnAnnotation = function () {
            return !!lastDrawnFeature;
        };

        this.deleteLastDrawnAnnotation = function () {
            removeFeature(lastDrawnFeature);
        };

		this.deleteSelected = function () {
			selectedFeatures.forEach(removeFeature);
		};

        // programmatically select an annotation (not through the select interaction)
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

        this.hasSelectedFeatures = function () {
            return selectedFeatures.getLength() > 0;
        };

        // fits the view to the given feature (id)
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

        // programatically add a new feature (not through the draw interaction)
        this.addFeature = function (feature) {
            annotationSource.addFeature(feature);
            return handleNewFeature({feature: feature});
        };

        this.setOpacity = function (opacity) {
            annotationLayer.setOpacity(opacity);
        };

        // move the viewport to the next annotation
        this.cycleNext = function () {
            currentAnnotationIndex = (currentAnnotationIndex + 1) % getFilteredAnnotationFeatures().length;
            _this.jumpToCurrent();
        };

        this.hasNext = function () {
            return (currentAnnotationIndex + 1) < getFilteredAnnotationFeatures().length;
        };

        // move the viewport to the previous annotation
        this.cyclePrevious = function () {
            // we want no negative index here
            var length = getFilteredAnnotationFeatures().length;
            currentAnnotationIndex = (currentAnnotationIndex + length - 1) % length;
            _this.jumpToCurrent();
        };

        this.hasPrevious = function () {
            return currentAnnotationIndex > 0;
        };

        // move the viewport to the current annotation
        this.jumpToCurrent = function () {
            // only jump once the annotations were loaded
            annotations.getPromise().then(function () {
                selectAndShowAnnotation(getFilteredAnnotationFeatures()[currentAnnotationIndex]);
            });
        };

        this.jumpToFirst = function () {
            currentAnnotationIndex = 0;
            _this.jumpToCurrent();
        };

        this.jumpToLast = function () {
            annotations.getPromise().then(function () {
                var length = getFilteredAnnotationFeatures().length;
                // wait for the new annotations to be loaded
                if (length !== 0) {
                    currentAnnotationIndex = length - 1;
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
            return getFilteredAnnotationFeatures()[currentAnnotationIndex].annotation;
        };

        this.setRestrictLabelCategory = function (restrict) {
            restrictLabelCategory = restrict;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0b3JDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ2FudmFzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NhdGVnb3JpZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ29uZmlkZW5jZUNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9EcmF3aW5nQ29udHJvbHNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvRWRpdENvbnRyb2xzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL01pbmltYXBDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2VsZWN0ZWRMYWJlbENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TZXR0aW5nc0Fubm90YXRpb25PcGFjaXR5Q29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NldHRpbmdzQW5ub3RhdGlvbnNDeWNsaW5nQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NldHRpbmdzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NldHRpbmdzU2VjdGlvbkN5Y2xpbmdDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2lkZWJhckNhdGVnb3J5Rm9sZG91dENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TaWRlYmFyQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvYW5ub3RhdGlvbkxpc3RJdGVtLmpzIiwiZGlyZWN0aXZlcy9sYWJlbENhdGVnb3J5SXRlbS5qcyIsImRpcmVjdGl2ZXMvbGFiZWxJdGVtLmpzIiwic2VydmljZXMvYW5ub3RhdGlvbnMuanMiLCJzZXJ2aWNlcy9pbWFnZXMuanMiLCJzZXJ2aWNlcy9rZXlib2FyZC5qcyIsInNlcnZpY2VzL2xhYmVscy5qcyIsInNlcnZpY2VzL21hcEFubm90YXRpb25zLmpzIiwic2VydmljZXMvbWFwSW1hZ2UuanMiLCJzZXJ2aWNlcy9zdHlsZXMuanMiLCJzZXJ2aWNlcy91cmxQYXJhbXMuanMiLCJmYWN0b3JpZXMvZGVib3VuY2UuanMiLCJmYWN0b3JpZXMvbWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLG9CQUFBLENBQUEsWUFBQTs7Ozs7Ozs7O0FDR0EsUUFBQSxPQUFBLG9CQUFBLFdBQUEseUZBQUEsVUFBQSxRQUFBLGdCQUFBLFFBQUEsYUFBQSxRQUFBO0VBQ0E7O1FBRUEsSUFBQSxtQkFBQSxlQUFBOztFQUVBLE9BQUEsbUJBQUEsaUJBQUE7O0VBRUEsSUFBQSxxQkFBQSxZQUFBO0dBQ0EsT0FBQSxjQUFBLFlBQUE7OztFQUdBLE9BQUEsY0FBQTs7RUFFQSxPQUFBLGlCQUFBLGVBQUE7O0VBRUEsT0FBQSxtQkFBQSxVQUFBLEdBQUEsSUFBQTs7R0FFQSxJQUFBLENBQUEsRUFBQSxVQUFBO0lBQ0EsT0FBQTs7R0FFQSxlQUFBLE9BQUE7OztRQUdBLE9BQUEsZ0JBQUEsZUFBQTs7RUFFQSxPQUFBLGFBQUEsVUFBQSxJQUFBO0dBQ0EsSUFBQSxXQUFBO0dBQ0EsaUJBQUEsUUFBQSxVQUFBLFNBQUE7SUFDQSxJQUFBLFFBQUEsY0FBQSxRQUFBLFdBQUEsTUFBQSxJQUFBO0tBQ0EsV0FBQTs7O0dBR0EsT0FBQTs7O0VBR0EsT0FBQSxJQUFBLGVBQUE7Ozs7Ozs7Ozs7O0FDbkNBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLHdGQUFBLFVBQUEsUUFBQSxRQUFBLFdBQUEsS0FBQSxVQUFBLFVBQUE7UUFDQTs7UUFFQSxPQUFBLFNBQUE7UUFDQSxPQUFBLGVBQUE7OztRQUdBLE9BQUEsV0FBQTtZQUNBLE1BQUEsVUFBQSxJQUFBO1lBQ0EsUUFBQSxDQUFBLFVBQUEsSUFBQSxNQUFBLFVBQUEsSUFBQTs7OztRQUlBLElBQUEsZ0JBQUEsWUFBQTtZQUNBLE9BQUEsZUFBQTtZQUNBLE9BQUEsV0FBQSxlQUFBLE9BQUEsT0FBQTs7OztRQUlBLElBQUEsWUFBQSxZQUFBO1lBQ0EsVUFBQSxVQUFBLE9BQUEsT0FBQSxhQUFBOzs7O1FBSUEsSUFBQSxlQUFBLFlBQUE7WUFDQSxPQUFBLGVBQUE7Ozs7UUFJQSxJQUFBLFlBQUEsVUFBQSxJQUFBO1lBQ0E7WUFDQSxPQUFBLE9BQUEsS0FBQSxTQUFBOzBCQUNBLEtBQUE7MEJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxZQUFBLFlBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQTttQkFDQSxLQUFBO21CQUNBLEtBQUE7bUJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxZQUFBLFlBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQTttQkFDQSxLQUFBO21CQUNBLEtBQUE7bUJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxJQUFBLGtCQUFBLFNBQUEsR0FBQSxRQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsT0FBQTtZQUNBLE9BQUEsU0FBQSxPQUFBLEtBQUEsS0FBQSxNQUFBLE9BQUEsT0FBQTtZQUNBLE9BQUEsU0FBQSxPQUFBLEtBQUEsS0FBQSxNQUFBLE9BQUEsT0FBQTtZQUNBLFVBQUEsSUFBQTtnQkFDQSxHQUFBLE9BQUEsU0FBQTtnQkFDQSxHQUFBLE9BQUEsU0FBQSxPQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBLE9BQUE7Ozs7UUFJQSxTQUFBLEdBQUEsSUFBQSxZQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxJQUFBLFlBQUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLElBQUEsWUFBQTtZQUNBLE9BQUE7WUFDQSxPQUFBOzs7O1FBSUEsT0FBQSxhQUFBLFNBQUEsR0FBQTtZQUNBLElBQUEsUUFBQSxFQUFBO1lBQ0EsSUFBQSxTQUFBLE1BQUEsU0FBQSxXQUFBO2dCQUNBLFVBQUEsTUFBQTs7Ozs7UUFLQSxPQUFBOztRQUVBLFVBQUEsVUFBQSxLQUFBOzs7Ozs7Ozs7OztBQzVGQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSw0RkFBQSxVQUFBLFFBQUEsVUFBQSxnQkFBQSxLQUFBLFVBQUEsVUFBQTtFQUNBOztRQUVBLElBQUEsVUFBQSxJQUFBOzs7RUFHQSxJQUFBLEdBQUEsV0FBQSxTQUFBLEdBQUE7WUFDQSxJQUFBLE9BQUEsWUFBQTtnQkFDQSxPQUFBLE1BQUEsa0JBQUE7b0JBQ0EsUUFBQSxRQUFBO29CQUNBLE1BQUEsUUFBQTs7Ozs7WUFLQSxTQUFBLE1BQUEsS0FBQTs7O1FBR0EsSUFBQSxHQUFBLGVBQUEsWUFBQTtZQUNBLFVBQUEsSUFBQTs7O0VBR0EsU0FBQSxLQUFBO0VBQ0EsZUFBQSxLQUFBOztFQUVBLElBQUEsYUFBQSxZQUFBOzs7R0FHQSxTQUFBLFdBQUE7O0lBRUEsSUFBQTtNQUNBLElBQUE7OztFQUdBLE9BQUEsSUFBQSx3QkFBQTtFQUNBLE9BQUEsSUFBQSx5QkFBQTs7Ozs7Ozs7Ozs7QUNuQ0EsUUFBQSxPQUFBLG9CQUFBLFdBQUEseURBQUEsVUFBQSxRQUFBLFFBQUEsVUFBQTtRQUNBOzs7UUFHQSxJQUFBLGdCQUFBO1FBQ0EsSUFBQSx1QkFBQTs7O1FBR0EsSUFBQSxrQkFBQSxZQUFBO1lBQ0EsSUFBQSxNQUFBLE9BQUEsV0FBQSxJQUFBLFVBQUEsTUFBQTtnQkFDQSxPQUFBLEtBQUE7O1lBRUEsT0FBQSxhQUFBLHdCQUFBLEtBQUEsVUFBQTs7OztRQUlBLElBQUEsaUJBQUEsWUFBQTtZQUNBLElBQUEsT0FBQSxhQUFBLHVCQUFBO2dCQUNBLElBQUEsTUFBQSxLQUFBLE1BQUEsT0FBQSxhQUFBO2dCQUNBLE9BQUEsYUFBQSxPQUFBLFdBQUEsT0FBQSxVQUFBLE1BQUE7O29CQUVBLE9BQUEsSUFBQSxRQUFBLEtBQUEsUUFBQSxDQUFBOzs7OztRQUtBLElBQUEsa0JBQUEsVUFBQSxPQUFBO1lBQ0EsSUFBQSxTQUFBLEtBQUEsUUFBQSxPQUFBLFdBQUEsUUFBQTtnQkFDQSxPQUFBLFdBQUEsT0FBQSxXQUFBOzs7O1FBSUEsT0FBQSxhQUFBLENBQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBO1FBQ0EsT0FBQSxhQUFBO1FBQ0EsT0FBQSxhQUFBO1FBQ0EsT0FBQSxRQUFBLEtBQUEsVUFBQSxLQUFBO1lBQ0EsS0FBQSxJQUFBLE9BQUEsS0FBQTtnQkFDQSxPQUFBLGFBQUEsT0FBQSxXQUFBLE9BQUEsSUFBQTs7WUFFQTs7O1FBR0EsT0FBQSxpQkFBQSxPQUFBOztRQUVBLE9BQUEsYUFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBLGlCQUFBO1lBQ0EsT0FBQSxXQUFBLHVCQUFBOzs7UUFHQSxPQUFBLGNBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxPQUFBLFdBQUEsUUFBQSxVQUFBLENBQUE7Ozs7UUFJQSxPQUFBLGtCQUFBLFVBQUEsR0FBQSxNQUFBO1lBQ0EsRUFBQTtZQUNBLElBQUEsUUFBQSxPQUFBLFdBQUEsUUFBQTtZQUNBLElBQUEsVUFBQSxDQUFBLEtBQUEsT0FBQSxXQUFBLFNBQUEsZUFBQTtnQkFDQSxPQUFBLFdBQUEsS0FBQTttQkFDQTtnQkFDQSxPQUFBLFdBQUEsT0FBQSxPQUFBOztZQUVBOzs7O1FBSUEsT0FBQSxpQkFBQSxZQUFBO1lBQ0EsT0FBQSxPQUFBLFdBQUEsU0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdC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LFVBQUE7O0dBRUEsY0FBQTs7O1FBR0EsSUFBQSxVQUFBLElBQUE7UUFDQSxJQUFBLFVBQUEsSUFBQTs7O0VBR0EsUUFBQSxTQUFBLFNBQUE7UUFDQSxRQUFBLFNBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLFFBQUE7WUFDQSxPQUFBLE9BQUE7OztFQUdBLElBQUEsV0FBQSxJQUFBLEdBQUE7RUFDQSxlQUFBLFdBQUE7OztFQUdBLE9BQUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxRQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7SUFDQSxZQUFBLFNBQUE7SUFDQSxRQUFBLEdBQUEsT0FBQSxVQUFBLFNBQUE7SUFDQSxNQUFBOzs7OztFQUtBLElBQUEsa0JBQUEsWUFBQTtHQUNBLFNBQUEsWUFBQSxHQUFBLEtBQUEsUUFBQSxXQUFBLFFBQUEsZ0JBQUE7OztRQUdBLElBQUEsR0FBQSxlQUFBLFlBQUE7WUFDQSxVQUFBLElBQUE7OztRQUdBLElBQUEsR0FBQSxlQUFBLFlBQUE7WUFDQSxVQUFBLElBQUE7OztFQUdBLElBQUEsR0FBQSxlQUFBOztFQUVBLElBQUEsZUFBQSxVQUFBLEdBQUE7R0FDQSxRQUFBLFVBQUEsRUFBQTs7O0VBR0EsUUFBQSxHQUFBLGVBQUE7O0VBRUEsU0FBQSxHQUFBLGNBQUEsWUFBQTtHQUNBLFFBQUEsR0FBQSxlQUFBOzs7RUFHQSxTQUFBLEdBQUEsY0FBQSxZQUFBO0dBQ0EsUUFBQSxHQUFBLGVBQUE7Ozs7Ozs7Ozs7OztBQzdEQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSxnREFBQSxVQUFBLFFBQUEsUUFBQTtFQUNBOztRQUVBLE9BQUEsbUJBQUEsT0FBQTs7UUFFQSxPQUFBLG1CQUFBLE9BQUE7Ozs7Ozs7Ozs7O0FDTEEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsb0VBQUEsVUFBQSxRQUFBLGdCQUFBO1FBQ0E7O1FBRUEsT0FBQSxtQkFBQSxzQkFBQTtRQUNBLE9BQUEsT0FBQSwrQkFBQSxVQUFBLFNBQUE7WUFDQSxlQUFBLFdBQUE7Ozs7Ozs7Ozs7OztBQ0xBLFFBQUEsT0FBQSxv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LFFBQUE7WUFDQSxJQUFBLFVBQUE7WUFDQSxJQUFBLFVBQUE7WUFDQSxJQUFBLGNBQUEsQ0FBQSxHQUFBO1lBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxLQUFBLFVBQUEsSUFBQSxLQUFBO2dCQUNBLEtBQUEsSUFBQSxJQUFBLEdBQUEsS0FBQSxVQUFBLElBQUEsS0FBQTtvQkFDQSxVQUFBLFNBQUEsUUFBQSxnQkFBQSxDQUFBLEdBQUE7b0JBQ0EsSUFBQSxVQUFBLFNBQUE7d0JBQ0EsWUFBQSxLQUFBO3dCQUNBLFlBQUEsS0FBQTt3QkFDQSxVQUFBOzs7OztZQUtBLE9BQUE7Ozs7UUFJQSxJQUFBLGVBQUEsWUFBQTtZQUNBLE9BQUEsSUFBQTs7WUFFQSxLQUFBLEdBQUEscUJBQUE7WUFDQSxJQUFBLGNBQUEsU0FBQTtZQUNBLElBQUEsYUFBQSxLQUFBLGdCQUFBLElBQUE7O1lBRUEsU0FBQSxLQUFBLFdBQUEsS0FBQSxXQUFBO1lBQ0EsU0FBQSxLQUFBLFdBQUEsS0FBQSxXQUFBOzs7WUFHQSxZQUFBLEtBQUEsU0FBQSxLQUFBO1lBQ0EsWUFBQSxLQUFBLFNBQUEsS0FBQTs7OztZQUlBLFVBQUEsS0FBQSxLQUFBLEtBQUEsWUFBQSxLQUFBLFNBQUEsTUFBQTtZQUNBLFVBQUEsS0FBQSxLQUFBLEtBQUEsWUFBQSxLQUFBLFNBQUEsTUFBQTs7WUFFQSxJQUFBO1lBQ0EsSUFBQSxVQUFBLEtBQUEsR0FBQTs7Z0JBRUEsVUFBQSxDQUFBLFNBQUEsTUFBQSxVQUFBLEtBQUEsTUFBQSxZQUFBO2dCQUNBLFNBQUEsTUFBQSxVQUFBLFVBQUE7bUJBQ0E7Z0JBQ0EsU0FBQSxLQUFBLFdBQUE7O2dCQUVBLFlBQUEsS0FBQSxZQUFBLEtBQUE7OztZQUdBLElBQUEsVUFBQSxLQUFBLEdBQUE7O2dCQUVBLFVBQUEsQ0FBQSxTQUFBLE1BQUEsVUFBQSxLQUFBLE1BQUEsWUFBQTtnQkFDQSxTQUFBLE1BQUEsVUFBQSxVQUFBO21CQUNBO2dCQUNBLFNBQUEsS0FBQSxXQUFBOztnQkFFQSxZQUFBLEtBQUEsWUFBQSxLQUFBOzs7O1FBSUEsSUFBQSxpQkFBQSxZQUFBO1lBQ0E7OztZQUdBLElBQUEsT0FBQSxnQkFBQSxnQkFBQTtZQUNBLFlBQUEsS0FBQSxLQUFBO1lBQ0EsWUFBQSxLQUFBLEtBQUE7OztRQUdBLElBQUEsa0JBQUEsWUFBQTtZQUNBO1lBQ0EsU0FBQSxnQkFBQSxLQUFBOzs7UUFHQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxTQUFBLENBQUEsR0FBQTs7O1FBR0EsSUFBQSxjQUFBLFlBQUE7WUFDQSxTQUFBOzs7UUFHQSxJQUFBLGtCQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUE7Z0JBQ0EsS0FBQSxLQUFBLFNBQUEsS0FBQSxZQUFBO2dCQUNBLEtBQUEsS0FBQSxTQUFBLEtBQUEsWUFBQTs7OztRQUlBLElBQUEsV0FBQSxVQUFBLE1BQUE7Ozs7Ozs7WUFPQSxZQUFBLEtBQUEsS0FBQTtZQUNBLFlBQUEsS0FBQSxLQUFBO1lBQ0EsS0FBQSxVQUFBLGdCQUFBOzs7UUFHQSxJQUFBLFdBQUEsWUFBQTtZQUNBLElBQUEsWUFBQSxLQUFBLFVBQUEsSUFBQTtnQkFDQSxPQUFBLENBQUEsWUFBQSxLQUFBLEdBQUEsWUFBQTttQkFDQTtnQkFDQSxPQUFBLENBQUEsR0FBQSxZQUFBLEtBQUE7Ozs7UUFJQSxJQUFBLFdBQUEsWUFBQTtZQUNBLElBQUEsWUFBQSxLQUFBLEdBQUE7Z0JBQ0EsT0FBQSxDQUFBLFlBQUEsS0FBQSxHQUFBLFlBQUE7bUJBQ0E7Z0JBQ0EsT0FBQSxDQUFBLFVBQUEsSUFBQSxZQUFBLEtBQUE7Ozs7UUFJQSxJQUFBLGNBQUEsVUFBQSxHQUFBO1lBQ0EsSUFBQSxXQUFBLENBQUEsT0FBQSxXQUFBOztZQUVBLElBQUEsWUFBQSxLQUFBLFVBQUEsTUFBQSxZQUFBLEtBQUEsVUFBQSxJQUFBO2dCQUNBLFNBQUE7bUJBQ0E7Z0JBQ0EsT0FBQSxZQUFBLEtBQUEsY0FBQSxLQUFBO2dCQUNBLFVBQUE7OztZQUdBLElBQUEsR0FBQTs7Z0JBRUEsT0FBQTs7OztZQUlBLE9BQUE7OztRQUdBLElBQUEsY0FBQSxVQUFB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WUFBQTtHQUNBLFdBQUEsUUFBQSxPQUFBLFFBQUEsV0FBQTtHQUNBLE9BQUE7OztFQUdBLElBQUEsZ0JBQUEsVUFBQSxZQUFBO0dBQ0EsWUFBQSxLQUFBO0dBQ0EsT0FBQTs7O0VBR0EsS0FBQSxRQUFBLFVBQUEsUUFBQTtHQUNBLGNBQUEsV0FBQSxNQUFBO1lBQ0EsVUFBQSxZQUFBO0dBQ0EsUUFBQSxLQUFBLFVBQUEsR0FBQTtJQUNBLEVBQUEsUUFBQTs7R0FFQSxPQUFBOzs7RUFHQSxLQUFBLE1BQUEsVUFBQSxRQUFBO0dBQ0EsSUFBQSxDQUFBLE9BQUEsWUFBQSxPQUFBLE9BQUE7SUFDQSxPQUFBLFdBQUEsT0FBQSxNQUFBLE9BQUE7O0dBRUEsSUFBQSxhQUFBLFdBQUEsSUFBQTtHQUNBLFdBQUE7Y0FDQSxLQUFBO2NBQ0EsS0FBQTtjQUNBLE1BQUEsSUFBQTs7R0FFQSxPQUFBOzs7RUFHQSxLQUFBLFNBQUEsVUFBQSxZQUFBOztHQUVBLElBQUEsUUFBQSxZQUFBLFFBQUE7R0FDQSxJQUFBLFFBQUEsQ0FBQSxHQUFBO0lBQ0EsT0FBQSxXQUFBLFFBQUEsWUFBQTs7O0tBR0EsUUFBQSxZQUFBLFFBQUE7S0FDQSxZQUFBLE9BQUEsT0FBQTtPQUNBLElBQUE7Ozs7RUFJQSxLQUFBLFVBQUEsVUFBQSxJQUFBO0dBQ0EsT0FBQSxZQUFBLFFBQUE7OztFQUdBLEtBQUEsVUFBQSxZQUFBO0dBQ0EsT0FBQTs7O1FBR0EsS0FBQSxhQUFBLFlBQUE7WUFDQSxPQUFBOzs7Ozs7Ozs7Ozs7QUM1REEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsc0ZBQUEsVUFBQSxZQUFBLGVBQUEsS0FBQSxJQUFBLGNBQUEsYUFBQTtFQUNBOztFQUVBLElBQUEsUUFBQTs7RUFFQSxJQUFBLFdBQUE7O0VBRUEsSUFBQSxrQkFBQTs7RUFFQSxJQUFBLFNBQUE7OztFQUdBLEtBQUEsZUFBQTs7Ozs7O0VBTUEsSUFBQSxTQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsTUFBQSxNQUFBLGFBQUE7R0FDQSxJQUFBLFFBQUEsU0FBQSxRQUFBO0dBQ0EsT0FBQSxTQUFBLENBQUEsUUFBQSxLQUFBLFNBQUE7Ozs7Ozs7RUFPQSxJQUFBLFNBQUEsVUFBQSxJQUFBO0dBQ0EsS0FBQSxNQUFBLE1BQUEsYUFBQTtHQUNBLElBQUEsUUFBQSxTQUFBLFFBQUE7R0FDQSxJQUFBLFNBQUEsU0FBQTtHQUNBLE9BQUEsU0FBQSxDQUFBLFFBQUEsSUFBQSxVQUFBOzs7Ozs7O0VBT0EsSUFBQSxXQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsTUFBQSxNQUFBLGFBQUE7R0FDQSxLQUFBLElBQUEsSUFBQSxPQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtJQUNBLElBQUEsT0FBQSxHQUFBLE9BQUEsSUFBQSxPQUFBLE9BQUE7OztHQUdBLE9BQUE7Ozs7OztFQU1BLElBQUEsT0FBQSxVQUFBLElBQUE7R0FDQSxNQUFBLGVBQUEsU0FBQTs7Ozs7Ozs7RUFRQSxJQUFBLGFBQUEsVUFBQSxJQUFBO0dBQ0EsSUFBQSxXQUFBLEdBQUE7R0FDQSxJQUFBLE1BQUEsU0FBQTs7R0FFQSxJQUFBLEtBQUE7SUFDQSxTQUFBLFFBQUE7VUFDQTtJQUNBLE1BQUEsU0FBQSxjQUFBO0lBQ0EsSUFBQSxNQUFBO0lBQ0EsSUFBQSxTQUFBLFlBQUE7S0FDQSxPQUFBLEtBQUE7O0tBRUEsSUFBQSxPQUFBLFNBQUEsaUJBQUE7TUFDQSxPQUFBOztLQUVBLFNBQUEsUUFBQTs7SUFFQSxJQUFBLFVBQUEsVUFBQSxLQUFBO0tBQ0EsU0FBQSxPQUFBOztJQUVBLElBQUEsTUFBQSxNQUFBLG9CQUFBLEtBQUE7OztZQUdBLFdBQUEsV0FBQSxrQkFBQTs7R0FFQSxPQUFBLFNBQUE7Ozs7Ozs7RUFPQSxLQUFBLE9BQUEsWUFBQTtHQUNBLFdBQUEsY0FBQSxNQUFBLENBQUEsYUFBQSxjQUFBLFlBQUE7Ozs7O2dCQUtBLElBQUEsaUJBQUEsT0FBQSxhQUFBLG9CQUFBLGNBQUE7Z0JBQ0EsSUFBQSxnQkFBQTtvQkFDQSxpQkFBQSxLQUFBLE1BQUE7Ozs7b0JBSUEsYUFBQSxnQkFBQTs7O29CQUdBLGVBQUEsV0FBQSxTQUFBO29CQUNBLGVBQUEsWUFBQSxTQUFBOzs7b0JBR0EsV0FBQTs7OztHQUlBLE9BQUEsU0FBQTs7Ozs7OztFQU9BLEtBQUEsT0FBQSxVQUFBLElBQUE7R0FDQSxJQUFBLFVBQUEsV0FBQSxJQUFBLEtBQUEsV0FBQTtJQUNBLEtBQUE7Ozs7R0FJQSxTQUFBLFNBQUEsS0FBQSxZQUFBOztJQUVBLFdBQUEsT0FBQTtJQUNBLFdBQUEsT0FBQTs7O0dBR0EsT0FBQTs7Ozs7OztFQU9BLEtBQUEsT0FBQSxZQUFBO0dBQ0EsT0FBQSxNQUFBLEtBQUE7Ozs7Ozs7RUFPQSxLQUFBLE9BQUEsWUFBQTtHQUNBLE9BQUEsTUFBQSxLQUFBOzs7RUFHQSxLQUFBLGVBQUEsWUFBQTtHQUNBLE9BQUEsTUFBQSxhQUFBOzs7Ozs7Ozs7Ozs7QUMxSkEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsWUFBQSxZQUFBO1FBQ0E7OztRQUdBLElBQUEsWUFBQTs7UUFFQSxJQUFBLG1CQUFBLFVBQUEsTUFBQSxHQUFBOztZQUVBLEtBQUEsSUFBQSxJQUFBLEtBQUEsU0FBQSxHQUFBLEtBQUEsR0FBQSxLQUFBOztnQkFFQSxJQUFBLEtBQUEsR0FBQSxTQUFBLE9BQUEsT0FBQTs7OztRQUlBLElBQUEsa0JBQUEsVUFBQSxHQUFBO1lBQ0EsSUFBQSxPQUFBLEVBQUE7WUFDQSxJQUFBLFlBQUEsT0FBQSxhQUFBLEVBQUEsU0FBQSxNQUFBOztZQUVBLElBQUEsVUFBQSxPQUFBO2dCQUNBLGlCQUFBLFVBQUEsT0FBQTs7O1lBR0EsSUFBQSxVQUFBLFlBQUE7Z0JBQ0EsaUJBQUEsVUFBQSxZQUFBOzs7O1FBSUEsU0FBQSxpQkFBQSxXQUFBOzs7OztRQUtBLEtBQUEsS0FBQSxVQUFBLFlBQUEsVUFBQSxVQUFBO1lBQ0EsSUFBQSxPQUFBLGVBQUEsWUFBQSxzQkFBQSxRQUFBO2dCQUNBLGFBQUEsV0FBQTs7O1lBR0EsV0FBQSxZQUFBO1lBQ0EsSUFBQSxXQUFBO2dCQUNBLFVBQUE7Z0JBQ0EsVUFBQTs7O1lBR0EsSUFBQSxVQUFBLGFBQUE7Z0JBQ0EsSUFBQSxPQUFBLFVBQUE7Z0JBQ0EsSUFBQTs7Z0JBRUEsS0FBQSxJQUFBLEdBQUEsSUFBQSxLQUFBLFFBQUEsS0FBQTtvQkFDQSxJQUFBLEtBQUEsR0FBQSxZQUFBLFVBQUE7OztnQkFHQSxJQUFBLE1BQUEsS0FBQSxTQUFBLEdBQUE7b0JBQ0EsS0FBQSxLQUFBO3VCQUNBO29CQUNBLEtBQUEsT0FBQSxHQUFBLEdBQUE7OzttQkFHQTtnQkFDQSxVQUFBLGNBQUEsQ0FBQTs7Ozs7UUFLQSxLQUFBLE1BQUEsVUFBQSxZQUFBLFVBQUE7WUFDQSxJQUFBLE9BQUEsZUFBQSxZQUFBLHNCQUFBLFFBQUE7Z0JBQ0EsYUFBQSxXQUFBOzs7WUFHQSxJQUFBLFVBQUEsYUFBQTtnQkFDQSxJQUFBLE9BQUEsVUFBQTtnQkFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxRQUFBLEtBQUE7b0JBQ0EsSUFBQSxLQUFBLEdBQUEsYUFBQSxVQUFBO3dCQUNBLEtBQUEsT0FBQSxHQUFBO3dCQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUN6RUEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsOEZBQUEsVUFBQSxpQkFBQSxPQUFBLGNBQUEsU0FBQSxLQUFBLElBQUEsYUFBQTtRQUNBOztRQUVBLElBQUE7UUFDQSxJQUFBLG9CQUFBOztRQUVBLElBQUEsU0FBQTs7O1FBR0EsS0FBQSxVQUFBOztRQUVBLEtBQUEscUJBQUEsVUFBQSxZQUFBO1lBQ0EsSUFBQSxDQUFBLFlBQUE7OztZQUdBLElBQUEsQ0FBQSxXQUFBLFFBQUE7Z0JBQ0EsV0FBQSxTQUFBLGdCQUFBLE1BQUE7b0JBQ0EsZUFBQSxXQUFBOzs7O1lBSUEsT0FBQSxXQUFBOzs7UUFHQSxLQUFBLHFCQUFBLFVBQUEsWUFBQTtZQUNBLElBQUEsUUFBQSxnQkFBQSxPQUFBO2dCQUNBLGVBQUEsV0FBQTtnQkFDQSxVQUFBLGNBQUE7Z0JBQ0EsWUFBQTs7O1lBR0EsTUFBQSxTQUFBLEtBQUEsWUFBQTtnQkFDQSxXQUFBLE9BQUEsS0FBQTs7O1lBR0EsTUFBQSxTQUFBLE1BQUEsSUFBQTs7WUFFQSxPQUFBOzs7UUFHQSxLQUFBLHVCQUFBLFVBQUEsWUFBQSxPQUFBOztZQUVBLElBQUEsUUFBQSxXQUFBLE9BQUEsUUFBQTtZQUNBLElBQUEsUUFBQSxDQUFBLEdBQUE7Z0JBQ0EsT0FBQSxnQkFBQSxPQUFBLENBQUEsSUFBQSxNQUFBLEtBQUEsWUFBQTs7O29CQUdBLFFBQUEsV0FBQSxPQUFBLFFBQUE7b0JBQ0EsV0FBQSxPQUFBLE9BQUEsT0FBQTttQkFDQSxJQUFBOzs7O1FBSUEsS0FBQSxVQUFBLFlBQUE7WUFDQSxJQUFBLE9BQUE7WUFDQSxJQUFBLE1BQUE7WUFDQSxJQUFBLFFBQUEsVUFBQSxPQUFBO2dCQUNBLElBQUEsU0FBQSxNQUFBO2dCQUNBLElBQUEsS0FBQSxLQUFBLFNBQUE7b0JBQ0EsS0FBQSxLQUFBLFFBQUEsS0FBQTt1QkFDQTtvQkFDQSxLQUFBLEtBQUEsVUFBQSxDQUFBOzs7O1lBSUEsS0FBQSxRQUFBLEtBQUEsVUFBQSxRQUFBO2dCQUNBLEtBQUEsT0FBQSxRQUFBO29CQUNBLEtBQUEsT0FBQTtvQkFDQSxPQUFBLEtBQUEsUUFBQTs7OztZQUlBLE9BQUE7OztRQUdBLEtBQUEsU0FBQSxZQUFBO1lBQ0EsT0FBQTs7O1FBR0EsS0FBQSxjQUFBLFVBQUEsT0FBQTtZQUNBLGdCQUFBOzs7UUFHQSxLQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLEtBQUEsY0FBQSxZQUFBO1lBQ0EsT0FBQSxDQUFBLENBQUE7OztRQUdBLEtBQUEsZ0JBQUEsWUFBQTtZQUNBLE9BQUEsZ0JBQUEsY0FBQSxLQUFBOzs7UUFHQSxLQUFBLHVCQUFBLFVBQUEsWUFBQTtZQUNBLG9CQUFBOzs7UUFHQSxLQUFBLHVCQUFBLFlBQUE7WUFDQSxPQUFBOzs7O1FBSUEsQ0FBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFdBQUEsR0FBQTtZQUNBLE1BQUEsVUFBQSxTQUFBOztZQUVBLElBQUEsV0FBQSxDQUFBOzs7WUFHQSxJQUFBLGVBQUEsWUFBQTtnQkFDQSxJQUFBLEVBQUEsYUFBQSxZQUFBLFFBQUE7b0JBQ0EsU0FBQSxRQUFBOzs7O1lBSUEsT0FBQSxRQUFBLE1BQUEsTUFBQTs7WUFFQSxZQUFBLFFBQUEsVUFBQSxJQUFBO2dCQUNBLFFBQUEsSUFBQSxDQUFBLElBQUEsS0FBQSxVQUFBLFNBQUE7b0JBQ0EsT0FBQSxRQUFBLFFBQUEsYUFBQSxNQUFBLENBQUEsWUFBQSxLQUFBOzs7V0FHQTs7Ozs7Ozs7Ozs7QUM1SEEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsZ0dBQUEsVUFBQSxLQUFBLFFBQUEsYUFBQSxVQUFBLFFBQUEsV0FBQSxRQUFBO0VBQ0E7OztRQUdBLElBQUEscUJBQUEsSUFBQSxHQUFBO1FBQ0EsSUFBQSxtQkFBQSxJQUFBLEdBQUEsT0FBQSxPQUFBO1lBQ0EsVUFBQTs7UUFFQSxJQUFBLGtCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxRQUFBO1lBQ0EsT0FBQSxPQUFBO1lBQ0EsUUFBQTs7OztFQUlBLElBQUEsU0FBQSxJQUFBLEdBQUEsWUFBQSxPQUFBO0dBQ0EsT0FBQSxPQUFBO1lBQ0EsUUFBQSxDQUFBOztZQUVBLE9BQUE7Ozs7RUFJQSxJQUFBLG1CQUFBLE9BQUE7OztFQUdBLElBQUEsU0FBQSxJQUFBLEdBQUEsWUFBQSxPQUFBO0dBQ0EsVUFBQTs7OztHQUlBLGlCQUFBLFNBQUEsT0FBQTtJQUNBLE9BQUEsR0FBQSxPQUFBLFVBQUEsYUFBQSxVQUFBLEdBQUEsT0FBQSxVQUFBLFlBQUE7Ozs7UUFJQSxPQUFBLFVBQUE7OztRQUdBLElBQUEsWUFBQSxJQUFBLEdBQUEsWUFBQSxVQUFBO1lBQ0EsVUFBQTs7O1FBR0EsVUFBQSxVQUFBOzs7RUFHQSxJQUFBOztRQUVBLElBQUE7Ozs7UUFJQSxJQUFBLHlCQUFBOzs7UUFHQSxJQUFBOzs7O1FBSUEsSUFBQSx3QkFBQTs7UUFFQSxJQUFBLFFBQUE7OztRQUdBLElBQUE7OztRQUdBLElBQUEsMEJBQUEsVUFBQSxZQUFBO1lBQ0EsTUFBQTtZQUNBLElBQUEsWUFBQTtnQkFDQSxpQkFBQSxLQUFBO2dCQUNBLElBQUEs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LFlBQUEsT0FBQSxRQUFBLFlBQUEsS0FBQSxZQUFBO2dCQUNBLGlCQUFBLGNBQUE7Z0JBQ0EsaUJBQUEsT0FBQTs7Ozs7O1FBTUEsSUFBQSw0QkFBQSxVQUFBLFlBQUE7WUFDQSxJQUFBLENBQUEsV0FBQSxRQUFBLE9BQUE7WUFDQSxJQUFBLEtBQUEsT0FBQTtZQUNBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxXQUFBLE9BQUEsUUFBQSxLQUFBO2dCQUNBLElBQUEsQ0FBQSxXQUFBLE9BQUEsR0FBQSxPQUFBO2dCQUNBLElBQUEsV0FBQSxPQUFBLEdBQUEsTUFBQSxPQUFBLElBQUE7b0JBQ0EsT0FBQTs7OztZQUlBLE9BQUE7Ozs7UUFJQSxJQUFBLGlDQUFBLFVBQUEsU0FBQTtZQUNBLE9BQUEsQ0FBQSx5QkFBQSwwQkFBQSxRQUFBOzs7UUFHQSxJQUFBLGdDQUFBLFlBQUE7WUFDQSxPQUFBLG1CQUFBLFdBQUEsT0FBQTs7O0VBR0EsS0FBQSxPQUFBLFVBQUEsT0FBQTtZQUNBLFNBQUE7WUFDQSxJQUFBLFNBQUE7R0FDQSxJQUFBLGVBQUE7WUFDQSxJQUFBLGVBQUE7WUFDQSxJQUFBLGVBQUE7R0FDQSxNQUFBLElBQUEsZUFBQTs7WUFFQSxJQUFBLFFBQUEsWUFBQTs7Z0JBRUEsSUFBQSxDQUFBLE1BQUEsU0FBQTs7b0JBRUEsTUFBQTs7OztHQUlBLGlCQUFBLEdBQUEsaUJBQUE7Ozs7RUFJQSxLQUFBLGVBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxVQUFBO1lBQ0EsT0FBQSxVQUFBO1lBQ0EsTUFBQTs7WUFFQSxJQUFBLGtCQUFBOztHQUVBLGNBQUEsUUFBQTtHQUNBLE9BQUEsSUFBQSxHQUFBLFlBQUEsS0FBQTtnQkFDQSxRQUFBO0lBQ0EsTUFBQTtJQUNBLE9BQUEsT0FBQTs7O0dBR0EsSUFBQSxlQUFBO0dBQ0EsS0FBQSxHQUFBLFdBQUE7WUFDQSxLQUFBLEdBQUEsV0FBQSxVQUFBLEdBQUE7Z0JBQ0EsT0FBQSxXQUFBLHFCQUFBLEVBQUE7Ozs7O0VBS0EsS0FBQSxnQkFBQSxZQUFBO0dBQ0Es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Q0Esd0JBQUE7Ozs7Ozs7Ozs7OztBQ3ZjQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxvQkFBQSxVQUFBLEtBQUE7RUFDQTtFQUNBLElBQUEsU0FBQSxDQUFBLEdBQUEsR0FBQSxHQUFBOztFQUVBLElBQUEsYUFBQSxJQUFBLEdBQUEsS0FBQSxXQUFBO0dBQ0EsTUFBQTtHQUNBLE9BQUE7R0FDQSxRQUFBOzs7RUFHQSxJQUFBLGFBQUEsSUFBQSxHQUFBLE1BQUE7O0VBRUEsS0FBQSxPQUFBLFVBQUEsT0FBQTtHQUNBLElBQUEsU0FBQTs7O0dBR0EsTUFBQSxJQUFBLGVBQUEsVUFBQSxHQUFBLE9BQUE7SUFDQSxPQUFBLEtBQUEsTUFBQTtJQUNBLE9BQUEsS0FBQSxNQUFBOztJQUVBLElBQUEsT0FBQSxNQUFBLFNBQUE7O0lBRUEsSUFBQSxTQUFBLE1BQUEsU0FBQTs7SUFFQSxJQUFBLE9BQUEsT0FBQSxhQUFBLE9BQUEsT0FBQSxXQUFBO0tBQ0EsU0FBQSxHQUFBLE9BQUEsVUFBQTs7O0lBR0EsSUFBQSxjQUFBLElBQUEsR0FBQSxPQUFBLFlBQUE7S0FDQSxLQUFBLE1BQUE7S0FDQSxZQUFBO0tBQ0EsYUFBQTs7O0lBR0EsV0FBQSxVQUFBOztJQUVBLElBQUEsUUFBQSxJQUFBLEdBQUEsS0FBQTtLQUNBLFlBQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQTtLQUNBLFlBQUE7O0tBRUEsZUFBQTs7S0FFQSxRQUFBOzs7O0lBSUEsSUFBQSxTQUFBLFdBQUE7S0FDQSxJQUFBLFVBQUEsSUFBQSxRQUFBLElBQUE7Ozs7O0VBS0EsS0FBQSxZQUFBLFlBQUE7R0FDQSxPQUFBOzs7RUFHQSxLQUFBLGdCQUFBLFlBQUE7R0FDQSxPQUFBOzs7UUFHQSxLQUFBLFdBQUEsWUFBQTtZQUNBLE9BQUE7Ozs7Ozs7Ozs7OztBQy9EQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxVQUFBLFlBQUE7RUFDQTs7UUFFQSxJQUFBLFFBQUE7O1FBRUEsS0FBQSxTQUFBO1lBQ0EsT0FBQSxDQUFBLEtBQUEsS0FBQSxLQUFBO1lBQ0EsTUFBQSxDQUFBLEdBQUEsS0FBQSxLQUFBO1lBQ0EsUUFBQTs7O1FBR0EsSUFBQSxzQkFBQTtRQUNBLElBQUEscUJBQUE7O1FBRUEsSUFBQSx1QkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLHdCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsZ0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsSUFBQSxpQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLG9CQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O1FBR0EsSUFBQSxxQkFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7OztRQUdBLElBQUEsc0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsSUFBQSx1QkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLHNCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7WUFDQSxVQUFBLENBQUE7OztRQUdBLElBQUEsZ0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTtZQUNBLFVBQUEsQ0FBQTs7O1FBR0EsSUFBQSxjQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O1FBR0EsSUFBQSxlQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O0VBR0EsS0FBQSxXQUFBLFVBQUEsU0FBQTtZQUNBLElBQUEsUUFBQSxRQUFBLFNBQUEsTUFBQSxRQUFBLFNBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQTtnQkFDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO29CQUNBLFFBQUE7b0JBQ0EsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO3dCQUNBLFFBQUE7d0JBQ0EsTUFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBOzRCQUNBLE9BQUE7O3dCQUVBLFFBQUE7OztnQkFHQSxJQUFBLEdBQUEsTUFBQSxNQUFBO29CQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTt3QkFDQSxPQUFBO3dCQUNBLE9BQUE7Ozs7OztFQU1BLEtBQUEsWUFBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUE7S0FDQSxRQUFBOztnQkFFQSxRQUFBOztHQUVBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBO2dCQUNBLFFBQUE7Ozs7RUFJQSxLQUFBLFVBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLE9BQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLFFBQUE7S0FDQSxNQUFBO0tBQ0EsUUFBQTs7O0dBR0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUE7Ozs7RUFJQSxLQUFBLFdBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQTs7R0FFQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO29CQUNBLE9BQUEsS0FBQSxPQUFBO29CQUNBLE9BQUE7Ozs7Ozs7Ozs7Ozs7O0FDbklBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLGFBQUEsWUFBQTtFQUNBOztFQUVBLElBQUEsUUFBQTs7O0VBR0EsSUFBQSxjQUFBLFlBQUE7R0FDQSxJQUFBLFNBQUEsU0FBQSxLQUFBLFFBQUEsS0FBQTs4QkFDQSxNQUFBOztHQUVBLElBQUEsUUFBQTs7R0FFQSxPQUFBLFFBQUEsVUFBQSxPQUFBOztJQUVBLElBQUEsVUFBQSxNQUFBLE1BQUE7SUFDQSxJQUFBLFdBQUEsUUFBQSxXQUFBLEdBQUE7S0FDQSxNQUFBLFFBQUEsTUFBQSxtQkFBQSxRQUFBOzs7O0dBSUEsT0FBQTs7OztFQUlBLElBQUEsY0FBQSxVQUFBLE9BQUE7R0FDQSxJQUFBLFNBQUE7R0FDQSxLQUFBLElBQUEsT0FBQSxPQUFBO0lBQ0EsVUFBQSxNQUFBLE1BQUEsbUJBQUEsTUFBQSxRQUFBOztHQUVBLE9BQUEsT0FBQSxVQUFBLEdBQUEsT0FBQSxTQUFBOzs7RUFHQSxLQUFBLFlBQUEsVUFBQSxHQUFBO0dBQ0EsTUFBQSxPQUFBO0dBQ0EsUUFBQSxVQUFBLE9BQUEsSUFBQSxNQUFBLE9BQUEsTUFBQSxZQUFBOzs7O0VBSUEsS0FBQSxNQUFBLFVBQUEsUUFBQTtHQUNBLEtBQUEsSUFBQSxPQUFBLFFBQUE7SUFDQSxNQUFBLE9BQUEsT0FBQTs7R0FFQSxRQUFBLGFBQUEsT0FBQSxJQUFBLE1BQUEsT0FBQSxNQUFBLFlBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsVUFBQSxLQUFBO0dBQ0EsT0FBQSxNQUFBOzs7RUFHQSxRQUFBLFFBQUE7O0VBRUEsSUFBQSxDQUFBLE9BQUE7R0FDQSxRQUFBOzs7Ozs7Ozs7Ozs7O0FDbkRBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLCtCQUFBLFVBQUEsVUFBQSxJQUFBO0VBQ0E7O0VBRUEsSUFBQSxXQUFBOztFQUVBLE9BQUEsVUFBQSxNQUFBLE1BQUEsSUFBQTs7O0dBR0EsSUFBQSxXQUFBLEdBQUE7R0FDQSxPQUFBLENBQUEsV0FBQTtJQUNBLElBQUEsVUFBQSxNQUFBLE9BQUE7SUFDQSxJQUFBLFFBQUEsV0FBQTtLQUNBLFNBQUEsTUFBQTtLQUNBLFNBQUEsUUFBQSxLQUFBLE1BQUEsU0FBQTtLQUNBLFdBQUEsR0FBQTs7SUFFQSxJQUFBLFNBQUEsS0FBQTtLQUNBLFNBQUEsT0FBQSxTQUFBOztJQUVBLFNBQUEsTUFBQSxTQUFBLE9BQUE7SUFDQSxPQUFBLFNBQUE7Ozs7Ozs7Ozs7OztBQ3RCQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxPQUFBLFlBQUE7RUFDQTs7RUFFQSxJQUFBLE1BQUEsSUFBQSxHQUFBLElBQUE7R0FDQSxRQUFBO1lBQ0EsVUFBQTtHQUNBLFVBQUE7SUFDQSxJQUFBLEdBQUEsUUFBQTtJQUNBLElBQUEsR0FBQSxRQUFBO0lBQ0EsSUFBQSxHQUFBLFFBQUE7O1lBRUEsY0FBQSxHQUFBLFlBQUEsU0FBQTtnQkFDQSxVQUFBOzs7O0VBSUEsT0FBQTs7O0FBR0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gVGhlIERJQVMgYW5ub3RhdGlvbnMgbW9kdWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycsIFsnZGlhcy5hcGknLCAnZGlhcy51aSddKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQW5ub3RhdGlvbnNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBhbm5vdGF0aW9ucyBsaXN0IGluIHRoZSBzaWRlYmFyXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQW5ub3RhdGlvbnNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMsIGxhYmVscywgYW5ub3RhdGlvbnMsIHNoYXBlcykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZEZlYXR1cmVzID0gbWFwQW5ub3RhdGlvbnMuZ2V0U2VsZWN0ZWRGZWF0dXJlcygpO1xuXG5cdFx0JHNjb3BlLnNlbGVjdGVkRmVhdHVyZXMgPSBzZWxlY3RlZEZlYXR1cmVzLmdldEFycmF5KCk7XG5cblx0XHR2YXIgcmVmcmVzaEFubm90YXRpb25zID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLmFubm90YXRpb25zID0gYW5ub3RhdGlvbnMuY3VycmVudCgpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuYW5ub3RhdGlvbnMgPSBbXTtcblxuXHRcdCRzY29wZS5jbGVhclNlbGVjdGlvbiA9IG1hcEFubm90YXRpb25zLmNsZWFyU2VsZWN0aW9uO1xuXG5cdFx0JHNjb3BlLnNlbGVjdEFubm90YXRpb24gPSBmdW5jdGlvbiAoZSwgaWQpIHtcblx0XHRcdC8vIGFsbG93IG11bHRpcGxlIHNlbGVjdGlvbnNcblx0XHRcdGlmICghZS5zaGlmdEtleSkge1xuXHRcdFx0XHQkc2NvcGUuY2xlYXJTZWxlY3Rpb24oKTtcblx0XHRcdH1cblx0XHRcdG1hcEFubm90YXRpb25zLnNlbGVjdChpZCk7XG5cdFx0fTtcblxuICAgICAgICAkc2NvcGUuZml0QW5ub3RhdGlvbiA9IG1hcEFubm90YXRpb25zLmZpdDtcblxuXHRcdCRzY29wZS5pc1NlbGVjdGVkID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgc2VsZWN0ZWQgPSBmYWxzZTtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuZm9yRWFjaChmdW5jdGlvbiAoZmVhdHVyZSkge1xuXHRcdFx0XHRpZiAoZmVhdHVyZS5hbm5vdGF0aW9uICYmIGZlYXR1cmUuYW5ub3RhdGlvbi5pZCA9PSBpZCkge1xuXHRcdFx0XHRcdHNlbGVjdGVkID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gc2VsZWN0ZWQ7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgcmVmcmVzaEFubm90YXRpb25zKTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQW5ub3RhdG9yQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBNYWluIGNvbnRyb2xsZXIgb2YgdGhlIEFubm90YXRvciBhcHBsaWNhdGlvbi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdBbm5vdGF0b3JDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgaW1hZ2VzLCB1cmxQYXJhbXMsIG1zZywgSU1BR0VfSUQsIGtleWJvYXJkKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5pbWFnZXMgPSBpbWFnZXM7XG4gICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgIC8vIHRoZSBjdXJyZW50IGNhbnZhcyB2aWV3cG9ydCwgc3luY2VkIHdpdGggdGhlIFVSTCBwYXJhbWV0ZXJzXG4gICAgICAgICRzY29wZS52aWV3cG9ydCA9IHtcbiAgICAgICAgICAgIHpvb206IHVybFBhcmFtcy5nZXQoJ3onKSxcbiAgICAgICAgICAgIGNlbnRlcjogW3VybFBhcmFtcy5nZXQoJ3gnKSwgdXJsUGFyYW1zLmdldCgneScpXVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGZpbmlzaCBpbWFnZSBsb2FkaW5nIHByb2Nlc3NcbiAgICAgICAgdmFyIGZpbmlzaExvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnaW1hZ2Uuc2hvd24nLCAkc2NvcGUuaW1hZ2VzLmN1cnJlbnRJbWFnZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgdmFyIHB1c2hTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHVybFBhcmFtcy5wdXNoU3RhdGUoJHNjb3BlLmltYWdlcy5jdXJyZW50SW1hZ2UuX2lkKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzdGFydCBpbWFnZSBsb2FkaW5nIHByb2Nlc3NcbiAgICAgICAgdmFyIHN0YXJ0TG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGxvYWQgdGhlIGltYWdlIGJ5IGlkLiBkb2Vzbid0IGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5IGJ5IGl0c2VsZlxuICAgICAgICB2YXIgbG9hZEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBzdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZXMuc2hvdyhwYXJzZUludChpZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHNob3cgdGhlIG5leHQgaW1hZ2UgYW5kIGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5XG4gICAgICAgICRzY29wZS5uZXh0SW1hZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZXMubmV4dCgpXG4gICAgICAgICAgICAgICAgICAudGhlbihmaW5pc2hMb2FkaW5nKVxuICAgICAgICAgICAgICAgICAgLnRoZW4ocHVzaFN0YXRlKVxuICAgICAgICAgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzaG93IHRoZSBwcmV2aW91cyBpbWFnZSBhbmQgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgJHNjb3BlLnByZXZJbWFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlcy5wcmV2KClcbiAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAudGhlbihwdXNoU3RhdGUpXG4gICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgVVJMIHBhcmFtZXRlcnMgb2YgdGhlIHZpZXdwb3J0XG4gICAgICAgICRzY29wZS4kb24oJ2NhbnZhcy5tb3ZlZW5kJywgZnVuY3Rpb24oZSwgcGFyYW1zKSB7XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuem9vbSA9IHBhcmFtcy56b29tO1xuICAgICAgICAgICAgJHNjb3BlLnZpZXdwb3J0LmNlbnRlclswXSA9IE1hdGgucm91bmQocGFyYW1zLmNlbnRlclswXSk7XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuY2VudGVyWzFdID0gTWF0aC5yb3VuZChwYXJhbXMuY2VudGVyWzFdKTtcbiAgICAgICAgICAgIHVybFBhcmFtcy5zZXQoe1xuICAgICAgICAgICAgICAgIHo6ICRzY29wZS52aWV3cG9ydC56b29tLFxuICAgICAgICAgICAgICAgIHg6ICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMF0sXG4gICAgICAgICAgICAgICAgeTogJHNjb3BlLnZpZXdwb3J0LmNlbnRlclsxXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDM3LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUucHJldkltYWdlKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDM5LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUubmV4dEltYWdlKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDMyLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUubmV4dEltYWdlKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGxpc3RlbiB0byB0aGUgYnJvd3NlciBcImJhY2tcIiBidXR0b25cbiAgICAgICAgd2luZG93Lm9ucG9wc3RhdGUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSBlLnN0YXRlO1xuICAgICAgICAgICAgaWYgKHN0YXRlICYmIHN0YXRlLnNsdWcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGxvYWRJbWFnZShzdGF0ZS5zbHVnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpbml0aWFsaXplIHRoZSBpbWFnZXMgc2VydmljZVxuICAgICAgICBpbWFnZXMuaW5pdCgpO1xuICAgICAgICAvLyBkaXNwbGF5IHRoZSBmaXJzdCBpbWFnZVxuICAgICAgICBsb2FkSW1hZ2UoSU1BR0VfSUQpLnRoZW4ocHVzaFN0YXRlKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDYW52YXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1haW4gY29udHJvbGxlciBmb3IgdGhlIGFubm90YXRpb24gY2FudmFzIGVsZW1lbnRcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDYW52YXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwSW1hZ2UsIG1hcEFubm90YXRpb25zLCBtYXAsICR0aW1lb3V0LCBkZWJvdW5jZSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBtYXBWaWV3ID0gbWFwLmdldFZpZXcoKTtcblxuXHRcdC8vIHVwZGF0ZSB0aGUgVVJMIHBhcmFtZXRlcnNcblx0XHRtYXAub24oJ21vdmVlbmQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgZW1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhbnZhcy5tb3ZlZW5kJywge1xuICAgICAgICAgICAgICAgICAgICBjZW50ZXI6IG1hcFZpZXcuZ2V0Q2VudGVyKCksXG4gICAgICAgICAgICAgICAgICAgIHpvb206IG1hcFZpZXcuZ2V0Wm9vbSgpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBkb250IHVwZGF0ZSBpbW1lZGlhdGVseSBidXQgd2FpdCBmb3IgcG9zc2libGUgbmV3IGNoYW5nZXNcbiAgICAgICAgICAgIGRlYm91bmNlKGVtaXQsIDEwMCwgJ2Fubm90YXRvci5jYW52YXMubW92ZWVuZCcpO1xuXHRcdH0pO1xuXG4gICAgICAgIG1hcC5vbignY2hhbmdlOnZpZXcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBWaWV3ID0gbWFwLmdldFZpZXcoKTtcbiAgICAgICAgfSk7XG5cblx0XHRtYXBJbWFnZS5pbml0KCRzY29wZSk7XG5cdFx0bWFwQW5ub3RhdGlvbnMuaW5pdCgkc2NvcGUpO1xuXG5cdFx0dmFyIHVwZGF0ZVNpemUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQvLyB3b3JrYXJvdW5kLCBzbyB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkICphZnRlciogdGhlIGFuZ3VsYXIgZGlnZXN0XG5cdFx0XHQvLyBhbmQgKmFmdGVyKiB0aGUgZm9sZG91dCB3YXMgcmVuZGVyZWRcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgbmVlZHMgdG8gYmUgd3JhcHBlZCBpbiBhbiBleHRyYSBmdW5jdGlvbiBzaW5jZSB1cGRhdGVTaXplIGFjY2VwdHMgYXJndW1lbnRzXG5cdFx0XHRcdG1hcC51cGRhdGVTaXplKCk7XG5cdFx0XHR9LCA1MCwgZmFsc2UpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJG9uKCdzaWRlYmFyLmZvbGRvdXQub3BlbicsIHVwZGF0ZVNpemUpO1xuXHRcdCRzY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5jbG9zZScsIHVwZGF0ZVNpemUpO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDYXRlZ29yaWVzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBsYWJlbCBjYXRlZ29yaWVzIGZvbGRvdXRcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDYXRlZ29yaWVzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGxhYmVscywga2V5Ym9hcmQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gbWF4aW11bSBudW1iZXIgb2YgYWxsb3dlZCBmYXZvdXJpdGVzXG4gICAgICAgIHZhciBtYXhGYXZvdXJpdGVzID0gOTtcbiAgICAgICAgdmFyIGZhdm91cml0ZXNTdG9yYWdlS2V5ID0gJ2RpYXMuYW5ub3RhdGlvbnMubGFiZWwtZmF2b3VyaXRlcyc7XG5cbiAgICAgICAgLy8gc2F2ZXMgdGhlIElEcyBvZiB0aGUgZmF2b3VyaXRlcyBpbiBsb2NhbFN0b3JhZ2VcbiAgICAgICAgdmFyIHN0b3JlRmF2b3VyaXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0bXAgPSAkc2NvcGUuZmF2b3VyaXRlcy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5pZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVtmYXZvdXJpdGVzU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeSh0bXApO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJlc3RvcmVzIHRoZSBmYXZvdXJpdGVzIGZyb20gdGhlIElEcyBpbiBsb2NhbFN0b3JhZ2VcbiAgICAgICAgdmFyIGxvYWRGYXZvdXJpdGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbZmF2b3VyaXRlc1N0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRtcCA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtmYXZvdXJpdGVzU3RvcmFnZUtleV0pO1xuICAgICAgICAgICAgICAgICRzY29wZS5mYXZvdXJpdGVzID0gJHNjb3BlLmNhdGVnb3JpZXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgdGFrZSB0aG9zZSBjYXRlZ29yaWVzIGFzIGZhdm91cml0ZXMgdGhhdCBhcmUgYXZhaWxhYmxlIGZvciB0aGlzIGltYWdlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0bXAuaW5kZXhPZihpdGVtLmlkKSAhPT0gLTE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGNob29zZUZhdm91cml0ZSA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgaWYgKGluZGV4ID49IDAgJiYgaW5kZXggPCAkc2NvcGUuZmF2b3VyaXRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbSgkc2NvcGUuZmF2b3VyaXRlc1tpbmRleF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5ob3RrZXlzTWFwID0gWyfwnZ+tJywgJ/Cdn64nLCAn8J2frycsICfwnZ+wJywgJ/Cdn7EnLCAn8J2fsicsICfwnZ+zJywgJ/Cdn7QnLCAn8J2ftSddO1xuICAgICAgICAkc2NvcGUuY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcyA9IFtdO1xuICAgICAgICBsYWJlbHMucHJvbWlzZS50aGVuKGZ1bmN0aW9uIChhbGwpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBhbGwpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY2F0ZWdvcmllcyA9ICRzY29wZS5jYXRlZ29yaWVzLmNvbmNhdChhbGxba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2FkRmF2b3VyaXRlcygpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuY2F0ZWdvcmllc1RyZWUgPSBsYWJlbHMuZ2V0VHJlZSgpO1xuXG4gICAgICAgICRzY29wZS5zZWxlY3RJdGVtID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIGxhYmVscy5zZXRTZWxlY3RlZChpdGVtKTtcbiAgICAgICAgICAgICRzY29wZS5zZWFyY2hDYXRlZ29yeSA9ICcnOyAvLyBjbGVhciBzZWFyY2ggZmllbGRcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdjYXRlZ29yaWVzLnNlbGVjdGVkJywgaXRlbSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzRmF2b3VyaXRlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuZmF2b3VyaXRlcy5pbmRleE9mKGl0ZW0pICE9PSAtMTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBhZGRzIGEgbmV3IGl0ZW0gdG8gdGhlIGZhdm91cml0ZXMgb3IgcmVtb3ZlcyBpdCBpZiBpdCBpcyBhbHJlYWR5IGEgZmF2b3VyaXRlXG4gICAgICAgICRzY29wZS50b2dnbGVGYXZvdXJpdGUgPSBmdW5jdGlvbiAoZSwgaXRlbSkge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIHZhciBpbmRleCA9ICRzY29wZS5mYXZvdXJpdGVzLmluZGV4T2YoaXRlbSk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xICYmICRzY29wZS5mYXZvdXJpdGVzLmxlbmd0aCA8IG1heEZhdm91cml0ZXMpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RvcmVGYXZvdXJpdGVzKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmV0dXJucyB3aGV0aGVyIHRoZSB1c2VyIGlzIHN0aWxsIGFsbG93ZWQgdG8gYWRkIGZhdm91cml0ZXNcbiAgICAgICAgJHNjb3BlLmZhdm91cml0ZXNMZWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5mYXZvdXJpdGVzLmxlbmd0aCA8IG1heEZhdm91cml0ZXM7XG4gICAgICAgIH07XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzEnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoMCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCcyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDEpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignMycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSgyKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoMyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc1JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDQpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignNicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg1KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoNik7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc4JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDcpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignOScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg4KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQ29uZmlkZW5jZUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGNvbmZpZGVuY2UgY29udHJvbFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NvbmZpZGVuY2VDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbGFiZWxzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuY29uZmlkZW5jZSA9IDEuMDtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ2NvbmZpZGVuY2UnLCBmdW5jdGlvbiAoY29uZmlkZW5jZSkge1xuXHRcdFx0bGFiZWxzLnNldEN1cnJlbnRDb25maWRlbmNlKHBhcnNlRmxvYXQoY29uZmlkZW5jZSkpO1xuXG5cdFx0XHRpZiAoY29uZmlkZW5jZSA8PSAwLjI1KSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtZGFuZ2VyJztcblx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjUgKSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtd2FybmluZyc7XG5cdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC43NSApIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC1zdWNjZXNzJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtcHJpbWFyeSc7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIERyYXdpbmdDb250cm9sc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGNvbnRyb2xzIGJhciBkcmF3aW5nIGJ1dG9uc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0RyYXdpbmdDb250cm9sc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywgbGFiZWxzLCBtc2csICRhdHRycywga2V5Ym9hcmQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5zZWxlY3RTaGFwZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICBpZiAobmFtZSAhPT0gbnVsbCAmJiAkc2NvcGUuc2VsZWN0ZWRTaGFwZSgpICE9PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFsYWJlbHMuaGFzU2VsZWN0ZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ3NpZGViYXIuZm9sZG91dC5kby1vcGVuJywgJ2NhdGVnb3JpZXMnKTtcbiAgICAgICAgICAgICAgICAgICAgbXNnLmluZm8oJGF0dHJzLnNlbGVjdENhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblx0XHRcdFx0bWFwQW5ub3RhdGlvbnMuc3RhcnREcmF3aW5nKG5hbWUpO1xuXHRcdFx0fSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5maW5pc2hEcmF3aW5nKCk7XG4gICAgICAgICAgICB9XG5cdFx0fTtcblxuICAgICAgICAkc2NvcGUuc2VsZWN0ZWRTaGFwZSA9IG1hcEFubm90YXRpb25zLmdldFNlbGVjdGVkRHJhd2luZ1R5cGU7XG5cbiAgICAgICAgLy8gZGVzZWxlY3QgZHJhd2luZyB0b29sIG9uIGVzY2FwZVxuICAgICAgICBrZXlib2FyZC5vbigyNywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKG51bGwpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignYScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnUG9pbnQnKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ1JlY3RhbmdsZScpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnQ2lyY2xlJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdmJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdMaW5lU3RyaW5nJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdnJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdQb2x5Z29uJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBFZGl0Q29udHJvbHNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBjb250cm9scyBiYXIgZWRpdCBidXR0b25zXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignRWRpdENvbnRyb2xzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEFubm90YXRpb25zLCBrZXlib2FyZCwgJHRpbWVvdXQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyB0aGUgdXNlciBoYXMgYSBjZXJ0YWluIGFtb3VudCBvZiB0aW1lIHRvIHF1aWNrIGRlbGV0ZSB0aGUgbGFzdCBkcmF3blxuICAgICAgICAvLyBhbm5vdGF0aW9uOyB0aGlzIGJvb2wgdGVsbHMgdXMgd2hldGhlciB0aGUgdGltZW91dCBpcyBzdGlsbCBydW5uaW5nLlxuICAgICAgICB2YXIgaXNJbkRlbGV0ZUxhc3RBbm5vdGF0aW9uVGltZW91dCA9IGZhbHNlO1xuICAgICAgICAvLyB0aW1lIGluIG1zIGluIHdoaWNoIHRoZSB1c2VyIGlzIGFsbG93ZWQgdG8gcXVpY2sgZGVsZXRlIGFuIGFubm90YXRpb25cbiAgICAgICAgdmFyIGRlbGV0ZUxhc3RBbm5vdGF0aW9uVGltZW91dCA9IDEwMDAwO1xuICAgICAgICB2YXIgdGltZW91dFByb21pc2U7XG5cbiAgICAgICAgJHNjb3BlLmRlbGV0ZVNlbGVjdGVkQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAobWFwQW5ub3RhdGlvbnMuaGFzU2VsZWN0ZWRGZWF0dXJlcygpICYmIGNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgYWxsIHNlbGVjdGVkIGFubm90YXRpb25zPycpKSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuZGVsZXRlU2VsZWN0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWRBbm5vdGF0aW9ucyA9IG1hcEFubm90YXRpb25zLmhhc1NlbGVjdGVkRmVhdHVyZXM7XG5cbiAgICAgICAgdmFyIHN0YXJ0TW92aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuc3RhcnRNb3ZpbmcoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZmluaXNoTW92aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuZmluaXNoTW92aW5nKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLm1vdmVTZWxlY3RlZEFubm90YXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCRzY29wZS5pc01vdmluZygpKSB7XG4gICAgICAgICAgICAgICAgZmluaXNoTW92aW5nKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXJ0TW92aW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmNhbkRlbGV0ZUxhc3RBbm5vdGF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGlzSW5EZWxldGVMYXN0QW5ub3RhdGlvblRpbWVvdXQgJiYgbWFwQW5ub3RhdGlvbnMuaGFzRHJhd25Bbm5vdGF0aW9uKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmRlbGV0ZUxhc3REcmF3bkFubm90YXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmNhbkRlbGV0ZUxhc3RBbm5vdGF0aW9uKCkpIHtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5kZWxldGVMYXN0RHJhd25Bbm5vdGF0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzTW92aW5nID0gbWFwQW5ub3RhdGlvbnMuaXNNb3Zpbmc7XG5cbiAgICAgICAgLy8gdGhlIHF1aWNrIGRlbGV0ZSB0aW1lb3V0IGFsd2F5cyBzdGFydHMgd2hlbiBhIG5ldyBhbm5vdGF0aW9uIHdhcyBkcmF3blxuICAgICAgICAkc2NvcGUuJG9uKCdhbm5vdGF0aW9ucy5kcmF3bicsIGZ1bmN0aW9uIChlLCBmZWF0dXJlKSB7XG4gICAgICAgICAgICBpc0luRGVsZXRlTGFzdEFubm90YXRpb25UaW1lb3V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0UHJvbWlzZSk7XG4gICAgICAgICAgICB0aW1lb3V0UHJvbWlzZSA9ICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpc0luRGVsZXRlTGFzdEFubm90YXRpb25UaW1lb3V0ID0gZmFsc2U7XG4gICAgICAgICAgICB9LCBkZWxldGVMYXN0QW5ub3RhdGlvblRpbWVvdXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBkZWwga2V5XG4gICAgICAgIGtleWJvYXJkLm9uKDQ2LCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZVNlbGVjdGVkQW5ub3RhdGlvbnMoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gZXNjIGtleVxuICAgICAgICBrZXlib2FyZC5vbigyNywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCRzY29wZS5pc01vdmluZygpKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseShmaW5pc2hNb3ZpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBiYWNrc3BhY2Uga2V5XG4gICAgICAgIGtleWJvYXJkLm9uKDgsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAkc2NvcGUuZGVsZXRlTGFzdERyYXduQW5ub3RhdGlvbigpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignbScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoJHNjb3BlLm1vdmVTZWxlY3RlZEFubm90YXRpb25zKTtcbiAgICAgICAgfSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIE1pbmltYXBDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBtaW5pbWFwIGluIHRoZSBzaWRlYmFyXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignTWluaW1hcENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXAsIG1hcEltYWdlLCAkZWxlbWVudCwgc3R5bGVzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIHZpZXdwb3J0U291cmNlID0gbmV3IG9sLnNvdXJjZS5WZWN0b3IoKTtcblxuXHRcdHZhciBtaW5pbWFwID0gbmV3IG9sLk1hcCh7XG5cdFx0XHR0YXJnZXQ6ICdtaW5pbWFwJyxcblx0XHRcdC8vIHJlbW92ZSBjb250cm9sc1xuXHRcdFx0Y29udHJvbHM6IFtdLFxuXHRcdFx0Ly8gZGlzYWJsZSBpbnRlcmFjdGlvbnNcblx0XHRcdGludGVyYWN0aW9uczogW11cblx0XHR9KTtcblxuICAgICAgICB2YXIgbWFwU2l6ZSA9IG1hcC5nZXRTaXplKCk7XG4gICAgICAgIHZhciBtYXBWaWV3ID0gbWFwLmdldFZpZXcoKTtcblxuXHRcdC8vIGdldCB0aGUgc2FtZSBsYXllcnMgdGhhbiB0aGUgbWFwXG5cdFx0bWluaW1hcC5hZGRMYXllcihtYXBJbWFnZS5nZXRMYXllcigpKTtcbiAgICAgICAgbWluaW1hcC5hZGRMYXllcihuZXcgb2wubGF5ZXIuVmVjdG9yKHtcbiAgICAgICAgICAgIHNvdXJjZTogdmlld3BvcnRTb3VyY2UsXG4gICAgICAgICAgICBzdHlsZTogc3R5bGVzLnZpZXdwb3J0XG4gICAgICAgIH0pKTtcblxuXHRcdHZhciB2aWV3cG9ydCA9IG5ldyBvbC5GZWF0dXJlKCk7XG5cdFx0dmlld3BvcnRTb3VyY2UuYWRkRmVhdHVyZSh2aWV3cG9ydCk7XG5cblx0XHQvLyByZWZyZXNoIHRoZSB2aWV3ICh0aGUgaW1hZ2Ugc2l6ZSBjb3VsZCBoYXZlIGJlZW4gY2hhbmdlZClcblx0XHQkc2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIGZ1bmN0aW9uICgpIHtcblx0XHRcdG1pbmltYXAuc2V0VmlldyhuZXcgb2wuVmlldyh7XG5cdFx0XHRcdHByb2plY3Rpb246IG1hcEltYWdlLmdldFByb2plY3Rpb24oKSxcblx0XHRcdFx0Y2VudGVyOiBvbC5leHRlbnQuZ2V0Q2VudGVyKG1hcEltYWdlLmdldEV4dGVudCgpKSxcblx0XHRcdFx0em9vbTogMFxuXHRcdFx0fSkpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gbW92ZSB0aGUgdmlld3BvcnQgcmVjdGFuZ2xlIG9uIHRoZSBtaW5pbWFwXG5cdFx0dmFyIHJlZnJlc2hWaWV3cG9ydCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZpZXdwb3J0LnNldEdlb21ldHJ5KG9sLmdlb20uUG9seWdvbi5mcm9tRXh0ZW50KG1hcFZpZXcuY2FsY3VsYXRlRXh0ZW50KG1hcFNpemUpKSk7XG5cdFx0fTtcblxuICAgICAgICBtYXAub24oJ2NoYW5nZTpzaXplJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWFwU2l6ZSA9IG1hcC5nZXRTaXplKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1hcC5vbignY2hhbmdlOnZpZXcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBWaWV3ID0gbWFwLmdldFZpZXcoKTtcbiAgICAgICAgfSk7XG5cblx0XHRtYXAub24oJ3Bvc3Rjb21wb3NlJywgcmVmcmVzaFZpZXdwb3J0KTtcblxuXHRcdHZhciBkcmFnVmlld3BvcnQgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0bWFwVmlldy5zZXRDZW50ZXIoZS5jb29yZGluYXRlKTtcblx0XHR9O1xuXG5cdFx0bWluaW1hcC5vbigncG9pbnRlcmRyYWcnLCBkcmFnVmlld3BvcnQpO1xuXG5cdFx0JGVsZW1lbnQub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtaW5pbWFwLnVuKCdwb2ludGVyZHJhZycsIGRyYWdWaWV3cG9ydCk7XG5cdFx0fSk7XG5cblx0XHQkZWxlbWVudC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uICgpIHtcblx0XHRcdG1pbmltYXAub24oJ3BvaW50ZXJkcmFnJywgZHJhZ1ZpZXdwb3J0KTtcblx0XHR9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2VsZWN0ZWRMYWJlbENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNlbGVjdGVkIGxhYmVsIGRpc3BsYXkgaW4gdGhlIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NlbGVjdGVkTGFiZWxDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbGFiZWxzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLmdldFNlbGVjdGVkTGFiZWwgPSBsYWJlbHMuZ2V0U2VsZWN0ZWQ7XG5cbiAgICAgICAgJHNjb3BlLmhhc1NlbGVjdGVkTGFiZWwgPSBsYWJlbHMuaGFzU2VsZWN0ZWQ7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNldHRpbmdzQW5ub3RhdGlvbk9wYWNpdHlDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyIHNldHRpbmdzIGZvbGRvdXRcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTZXR0aW5nc0Fubm90YXRpb25PcGFjaXR5Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEFubm90YXRpb25zKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5zZXREZWZhdWx0U2V0dGluZ3MoJ2Fubm90YXRpb25fb3BhY2l0eScsICcxJyk7XG4gICAgICAgICRzY29wZS4kd2F0Y2goJ3NldHRpbmdzLmFubm90YXRpb25fb3BhY2l0eScsIGZ1bmN0aW9uIChvcGFjaXR5KSB7XG4gICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5zZXRPcGFjaXR5KG9wYWNpdHkpO1xuICAgICAgICB9KTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTZXR0aW5nc0Fubm90YXRpb25zQ3ljbGluZ0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBjeWNsaW5nIHRocm91Z2ggYW5ub3RhdGlvbnNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTZXR0aW5nc0Fubm90YXRpb25zQ3ljbGluZ0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywgbGFiZWxzLCBrZXlib2FyZCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBmbGFnIHRvIHByZXZlbnQgY3ljbGluZyB3aGlsZSBhIG5ldyBpbWFnZSBpcyBsb2FkaW5nXG4gICAgICAgIHZhciBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIC8vIGlkZW50aWZpZXIgZm9yIHRoaXMgY3ljbGluZyB2YXJpYW50ICh0aGVyZSBhcmUgb3RoZXJzLCB0b28pXG4gICAgICAgIHZhciBjeWNsaW5nS2V5ID0gJ2Fubm90YXRpb25zJztcblxuICAgICAgICB2YXIgbmV4dEFubm90YXRpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcgfHwgISRzY29wZS5jeWNsaW5nKCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKG1hcEFubm90YXRpb25zLmhhc05leHQoKSkge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmN5Y2xlTmV4dCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBtZXRob2QgZnJvbSBBbm5vdGF0b3JDb250cm9sbGVyOyBtYXBBbm5vdGF0aW9ucyB3aWxsIHJlZnJlc2ggYXV0b21hdGljYWxseVxuICAgICAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKS50aGVuKG1hcEFubm90YXRpb25zLmp1bXBUb0ZpcnN0KTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGFwcGx5IGlmIHRoaXMgd2FzIGNhbGxlZCBieSB0aGUga2V5Ym9hcmQgZXZlbnRcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNhbmNlbCBhbGwga2V5Ym9hcmQgZXZlbnRzIHdpdGggbG93ZXIgcHJpb3JpdHlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcHJldkFubm90YXRpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcgfHwgISRzY29wZS5jeWNsaW5nKCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKG1hcEFubm90YXRpb25zLmhhc1ByZXZpb3VzKCkpIHtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5jeWNsZVByZXZpb3VzKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG1ldGhvZCBmcm9tIEFubm90YXRvckNvbnRyb2xsZXI7IG1hcEFubm90YXRpb25zIHdpbGwgcmVmcmVzaCBhdXRvbWF0aWNhbGx5XG4gICAgICAgICAgICAgICAgJHNjb3BlLnByZXZJbWFnZSgpLnRoZW4obWFwQW5ub3RhdGlvbnMuanVtcFRvTGFzdCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gb25seSBhcHBseSBpZiB0aGlzIHdhcyBjYWxsZWQgYnkgdGhlIGtleWJvYXJkIGV2ZW50XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjYW5jZWwgYWxsIGtleWJvYXJkIGV2ZW50cyB3aXRoIGxvd2VyIHByaW9yaXR5XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGF0dGFjaExhYmVsID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmIChsb2FkaW5nKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCRzY29wZS5jeWNsaW5nKCkgJiYgbGFiZWxzLmhhc1NlbGVjdGVkKCkpIHtcbiAgICAgICAgICAgICAgICBsYWJlbHMuYXR0YWNoVG9Bbm5vdGF0aW9uKG1hcEFubm90YXRpb25zLmdldEN1cnJlbnQoKSkuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmZsaWNrZXIoMSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmZsaWNrZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzdG9wIGN5Y2xpbmcgdXNpbmcgYSBrZXlib2FyZCBldmVudFxuICAgICAgICB2YXIgc3RvcEN5Y2xpbmcgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgJHNjb3BlLnN0b3BDeWNsaW5nKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmF0dHJpYnV0ZXMgPSB7XG4gICAgICAgICAgICAvLyByZXN0cmljdCBjeWNsaW5nIG9mIGFubm90YXRpb25zIHRvIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgbGFiZWwgY2F0ZWdvcnlcbiAgICAgICAgICAgIHJlc3RyaWN0OiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5jeWNsaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5nZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScpID09PSBjeWNsaW5nS2V5O1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zdGFydEN5Y2xpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0Vm9sYXRpbGVTZXR0aW5ncygnY3ljbGUnLCBjeWNsaW5nS2V5KTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc3RvcEN5Y2xpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0Vm9sYXRpbGVTZXR0aW5ncygnY3ljbGUnLCAnJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdGhlIGN5Y2xlIHNldHRpbmdzIG15IGJlIHNldCBieSBvdGhlciBjb250cm9sbGVycywgdG9vLCBzbyB3YXRjaCBpdFxuICAgICAgICAvLyBpbnN0ZWFkIG9mIHVzaW5nIHRoZSBzdGFydC9zdG9wIGZ1bmN0aW9ucyB0byBhZGQvcmVtb3ZlIGV2ZW50cyBldGMuXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ3ZvbGF0aWxlU2V0dGluZ3MuY3ljbGUnLCBmdW5jdGlvbiAoY3ljbGUsIG9sZEN5Y2xlKSB7XG4gICAgICAgICAgICBpZiAoY3ljbGUgPT09IGN5Y2xpbmdLZXkpIHtcbiAgICAgICAgICAgICAgICAvLyBvdmVycmlkZSBwcmV2aW91cyBpbWFnZSBvbiBhcnJvdyBsZWZ0XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMzcsIHByZXZBbm5vdGF0aW9uLCAxMCk7XG4gICAgICAgICAgICAgICAgLy8gb3ZlcnJpZGUgbmV4dCBpbWFnZSBvbiBhcnJvdyByaWdodCBhbmQgc3BhY2VcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzOSwgbmV4dEFubm90YXRpb24sIDEwKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzMiwgbmV4dEFubm90YXRpb24sIDEwKTtcblxuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDEzLCBhdHRhY2hMYWJlbCwgMTApO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDI3LCBzdG9wQ3ljbGluZywgMTApO1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob2xkQ3ljbGUgPT09IGN5Y2xpbmdLZXkpIHtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMzcsIHByZXZBbm5vdGF0aW9uKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMzksIG5leHRBbm5vdGF0aW9uKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMzIsIG5leHRBbm5vdGF0aW9uKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMTMsIGF0dGFjaExhYmVsKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMjcsIHN0b3BDeWNsaW5nKTtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgdW53YXRjaFNlbGVjdGVkTGFiZWw7XG5cbiAgICAgICAgdmFyIHdhdGNoU2VsZWN0ZWRMYWJlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh1bndhdGNoU2VsZWN0ZWRMYWJlbCkgdW53YXRjaFNlbGVjdGVkTGFiZWwoKTtcbiAgICAgICAgICAgIHVud2F0Y2hTZWxlY3RlZExhYmVsID0gJHNjb3BlLiR3YXRjaChsYWJlbHMuZ2V0U2VsZWN0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmN5Y2xpbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5qdW1wVG9GaXJzdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ2F0dHJpYnV0ZXMucmVzdHJpY3QnLCBmdW5jdGlvbiAocmVzdHJpY3QpIHtcbiAgICAgICAgICAgIG1hcEFubm90YXRpb25zLnNldFJlc3RyaWN0TGFiZWxDYXRlZ29yeShyZXN0cmljdCk7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmN5Y2xpbmcoKSkge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmp1bXBUb0ZpcnN0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXN0cmljdCkge1xuICAgICAgICAgICAgICAgIHdhdGNoU2VsZWN0ZWRMYWJlbCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh1bndhdGNoU2VsZWN0ZWRMYWJlbCkge1xuICAgICAgICAgICAgICAgIHVud2F0Y2hTZWxlY3RlZExhYmVsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgJHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS5wcmV2QW5ub3RhdGlvbiA9IHByZXZBbm5vdGF0aW9uO1xuICAgICAgICAkc2NvcGUubmV4dEFubm90YXRpb24gPSBuZXh0QW5ub3RhdGlvbjtcbiAgICAgICAgJHNjb3BlLmF0dGFjaExhYmVsID0gYXR0YWNoTGFiZWw7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2V0dGluZ3NDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyIHNldHRpbmdzIGZvbGRvdXRcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTZXR0aW5nc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBkZWJvdW5jZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgc2V0dGluZ3NTdG9yYWdlS2V5ID0gJ2RpYXMuYW5ub3RhdGlvbnMuc2V0dGluZ3MnO1xuXG4gICAgICAgIHZhciBkZWZhdWx0U2V0dGluZ3MgPSB7fTtcblxuICAgICAgICAvLyBtYXkgYmUgZXh0ZW5kZWQgYnkgY2hpbGQgY29udHJvbGxlcnNcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzID0ge307XG5cbiAgICAgICAgLy8gbWF5IGJlIGV4dGVuZGVkIGJ5IGNoaWxkIGNvbnRyb2xsZXJzIGJ1dCB3aWxsIG5vdCBiZSBwZXJtYW5lbnRseSBzdG9yZWRcbiAgICAgICAgJHNjb3BlLnZvbGF0aWxlU2V0dGluZ3MgPSB7fTtcblxuICAgICAgICB2YXIgc3RvcmVTZXR0aW5ncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzZXR0aW5ncyA9IGFuZ3VsYXIuY29weSgkc2NvcGUuc2V0dGluZ3MpO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzW2tleV0gPT09IGRlZmF1bHRTZXR0aW5nc1trZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGRvbid0IHN0b3JlIGRlZmF1bHQgc2V0dGluZ3MgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzZXR0aW5nc1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc1N0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBzdG9yZVNldHRpbmdzRGVib3VuY2VkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gd2FpdCBmb3IgcXVpY2sgY2hhbmdlcyBhbmQgb25seSBzdG9yZSB0aGVtIG9uY2UgdGhpbmdzIGNhbG1lZCBkb3duIGFnYWluXG4gICAgICAgICAgICAvLyAoZS5nLiB3aGVuIHRoZSB1c2VyIGZvb2xzIGFyb3VuZCB3aXRoIGEgcmFuZ2Ugc2xpZGVyKVxuICAgICAgICAgICAgZGVib3VuY2Uoc3RvcmVTZXR0aW5ncywgMjUwLCBzZXR0aW5nc1N0b3JhZ2VLZXkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByZXN0b3JlU2V0dGluZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc2V0dGluZ3MgPSB7fTtcbiAgICAgICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW3NldHRpbmdzU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgICAgICBzZXR0aW5ncyA9IEpTT04ucGFyc2Uod2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc1N0b3JhZ2VLZXldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuZXh0ZW5kKHNldHRpbmdzLCBkZWZhdWx0U2V0dGluZ3MpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zZXRTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuc2V0dGluZ3Nba2V5XTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2V0RGVmYXVsdFNldHRpbmdzID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIGRlZmF1bHRTZXR0aW5nc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgICBpZiAoISRzY29wZS5zZXR0aW5ncy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnNldFNldHRpbmdzKGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zZXRWb2xhdGlsZVNldHRpbmdzID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICRzY29wZS52b2xhdGlsZVNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0Vm9sYXRpbGVTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUudm9sYXRpbGVTZXR0aW5nc1trZXldO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ3NldHRpbmdzJywgc3RvcmVTZXR0aW5nc0RlYm91bmNlZCwgdHJ1ZSk7XG4gICAgICAgIGFuZ3VsYXIuZXh0ZW5kKCRzY29wZS5zZXR0aW5ncywgcmVzdG9yZVNldHRpbmdzKCkpO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNldHRpbmdzU2VjdGlvbkN5Y2xpbmdDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIGN5Y2xpbmcgdGhyb3VnaCBpbWFnZSBzZWN0aW9uc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NldHRpbmdzU2VjdGlvbkN5Y2xpbmdDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwLCBtYXBJbWFnZSwga2V5Ym9hcmQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gZmxhZyB0byBwcmV2ZW50IGN5Y2xpbmcgd2hpbGUgYSBuZXcgaW1hZ2UgaXMgbG9hZGluZ1xuICAgICAgICB2YXIgbG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBjeWNsaW5nS2V5ID0gJ3NlY3Rpb25zJztcbiAgICAgICAgdmFyIHZpZXc7XG5cbiAgICAgICAgLy8gdmlldyBjZW50ZXIgcG9pbnQgb2YgdGhlIHN0YXJ0IHBvc2l0aW9uXG4gICAgICAgIHZhciBzdGFydENlbnRlciA9IFswLCAwXTtcbiAgICAgICAgLy8gbnVtYmVyIG9mIHBpeGVscyB0byBwcm9jZWVkIGluIHggYW5kIHkgZGlyZWN0aW9uIGZvciBlYWNoIHN0ZXBcbiAgICAgICAgdmFyIHN0ZXBTaXplID0gWzAsIDBdO1xuICAgICAgICAvLyBudW1iZXIgb2Ygc3RlcHMgaW4geCBhbmQgeSBkaXJlY3Rpb24gLTEhXG4gICAgICAgIHZhciBzdGVwQ291bnQgPSBbMCwgMF07XG4gICAgICAgIC8vIG51bWJlciBvZiBjdXJyZW50IHN0ZXAgaW4geCBhbmQgeSBkaXJlY3Rpb24gLTEhXG4gICAgICAgIHZhciBjdXJyZW50U3RlcCA9IFswLCAwXTtcblxuICAgICAgICAvLyBUT0RPIHJlYWN0IG9uIHdpbmRvdyByZXNpemUgZXZlbnRzIGFuZCBmb2xkb3V0IG9wZW4gYXMgd2VsbCBhc1xuICAgICAgICAvLyBjaGFuZ2luZyB0aGUgem9vbSBsZXZlbFxuXG4gICAgICAgIHZhciBkaXN0YW5jZSA9IGZ1bmN0aW9uIChwMSwgcDIpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocDFbMF0gLSBwMlswXSwgMikgKyBNYXRoLnBvdyhwMVsxXSAtIHAyWzFdLCAyKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gaWYgdGhlIG1hcCBzaXplIHdhcyBjaGFuZ2VkLCB0aGlzIGZ1bmN0aW9uIGZpbmRzIHRoZSBuZXh0IG5lYXJlc3Qgc3RlcFxuICAgICAgICB2YXIgZmluZE5lYXJlc3RTdGVwID0gZnVuY3Rpb24gKGNlbnRlcikge1xuICAgICAgICAgICAgdmFyIG5lYXJlc3QgPSBJbmZpbml0eTtcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gMDtcbiAgICAgICAgICAgIHZhciBuZWFyZXN0U3RlcCA9IFswLCAwXTtcbiAgICAgICAgICAgIGZvciAodmFyIHkgPSAwOyB5IDw9IHN0ZXBDb3VudFsxXTsgeSsrKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPD0gc3RlcENvdW50WzBdOyB4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IGRpc3RhbmNlKGNlbnRlciwgZ2V0U3RlcFBvc2l0aW9uKFt4LCB5XSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudCA8IG5lYXJlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5lYXJlc3RTdGVwWzBdID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5lYXJlc3RTdGVwWzFdID0geTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5lYXJlc3QgPSBjdXJyZW50O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmVhcmVzdFN0ZXA7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gKHJlLSljYWxjdWxhdGUgYWxsIG5lZWRlZCBwb3NpdGlvbnMgYW5kIHNpemVzIGZvciBjeWNsaW5nIHRocm91Z2ggc2VjdGlvbnNcbiAgICAgICAgdmFyIHVwZGF0ZUV4dGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZpZXcgPSBtYXAuZ2V0VmlldygpO1xuICAgICAgICAgICAgLy8gc2V0IHRoZSBldmVudCBsaXN0ZW5lciBoZXJlIGluIGNhc2UgdGhlIHZpZXcgY2hhbmdlZFxuICAgICAgICAgICAgdmlldy5vbignY2hhbmdlOnJlc29sdXRpb24nLCBoYW5kbGVVc2VyWm9vbSk7XG4gICAgICAgICAgICB2YXIgaW1hZ2VFeHRlbnQgPSBtYXBJbWFnZS5nZXRFeHRlbnQoKTtcbiAgICAgICAgICAgIHZhciB2aWV3RXh0ZW50ID0gdmlldy5jYWxjdWxhdGVFeHRlbnQobWFwLmdldFNpemUoKSk7XG5cbiAgICAgICAgICAgIHN0ZXBTaXplWzBdID0gdmlld0V4dGVudFsyXSAtIHZpZXdFeHRlbnRbMF07XG4gICAgICAgICAgICBzdGVwU2l6ZVsxXSA9IHZpZXdFeHRlbnRbM10gLSB2aWV3RXh0ZW50WzFdO1xuXG4gICAgICAgICAgICAvLyBzZXQgdGhlIHN0YXJ0IGNlbnRlciBiZWZvcmUgYWRqdXN0aW5nIHRoZSBzdGVwIHNpemUgd2l0aCBvdmVybGFwXG4gICAgICAgICAgICBzdGFydENlbnRlclswXSA9IHN0ZXBTaXplWzBdIC8gMjtcbiAgICAgICAgICAgIHN0YXJ0Q2VudGVyWzFdID0gc3RlcFNpemVbMV0gLyAyO1xuXG4gICAgICAgICAgICAvLyBNYXRoLmNlaWwoNC4wKSAtIDEgaXMgTk9UIGVxdWl2YWxlbnQgdG8gTWF0aC5mbG9vcig0LjApIVxuICAgICAgICAgICAgLy8gLSAxIGJlY2F1c2Ugc3RlcENvdW50IGJlZ2lucyB3aXRoIDAgc28gYSBzdGVwQ291bnQgb2YgMSBtZWFucyAyIHN0ZXBzXG4gICAgICAgICAgICBzdGVwQ291bnRbMF0gPSBNYXRoLmNlaWwoaW1hZ2VFeHRlbnRbMl0gLyBzdGVwU2l6ZVswXSkgLSAxO1xuICAgICAgICAgICAgc3RlcENvdW50WzFdID0gTWF0aC5jZWlsKGltYWdlRXh0ZW50WzNdIC8gc3RlcFNpemVbMV0pIC0gMTtcblxuICAgICAgICAgICAgdmFyIG92ZXJsYXA7XG4gICAgICAgICAgICBpZiAoc3RlcENvdW50WzBdID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIG1ha2UgdGhlIHNlY3Rpb25zIG92ZXJsYXAgaG9yaXpvbmFsbHkgc28gdGhleSBleGFjdGx5IGNvdmVyIHRoZSBpbWFnZVxuICAgICAgICAgICAgICAgIG92ZXJsYXAgPSAoc3RlcFNpemVbMF0gKiAoc3RlcENvdW50WzBdICsgMSkpIC0gaW1hZ2VFeHRlbnRbMl07XG4gICAgICAgICAgICAgICAgc3RlcFNpemVbMF0gLT0gb3ZlcmxhcCAvIHN0ZXBDb3VudFswXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RlcFNpemVbMF0gPSB2aWV3RXh0ZW50WzJdO1xuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgc3RhcnQgcG9pbnQgc28gdGhlIGltYWdlIGlzIGNlbnRlcmVkIGhvcml6b250YWxseVxuICAgICAgICAgICAgICAgIHN0YXJ0Q2VudGVyWzBdID0gaW1hZ2VFeHRlbnRbMl0gLyAyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc3RlcENvdW50WzFdID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIG1ha2UgdGhlIHNlY3Rpb25zIG92ZXJsYXAgdmVydGljYWxseSBzbyB0aGV5IGV4YWN0bHkgY292ZXIgdGhlIGltYWdlXG4gICAgICAgICAgICAgICAgb3ZlcmxhcCA9IChzdGVwU2l6ZVsxXSAqIChzdGVwQ291bnRbMV0gKyAxKSkgLSBpbWFnZUV4dGVudFszXTtcbiAgICAgICAgICAgICAgICBzdGVwU2l6ZVsxXSAtPSBvdmVybGFwIC8gc3RlcENvdW50WzFdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGVwU2l6ZVsxXSA9IHZpZXdFeHRlbnRbM107XG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBzdGFydCBwb2ludCBzbyB0aGUgaW1hZ2UgaXMgY2VudGVyZWQgdmVydGljYWxseVxuICAgICAgICAgICAgICAgIHN0YXJ0Q2VudGVyWzFdID0gaW1hZ2VFeHRlbnRbM10gLyAyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVVc2VyWm9vbSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHVwZGF0ZUV4dGVudCgpO1xuICAgICAgICAgICAgLy8gYWxsb3cgdGhlIHVzZXIgdG8gcGFuIGJ1dCBnbyBiYWNrIHRvIHRoZSByZWd1bGFyIHByZXYvbmV4dCBzdGVwIHdoZW4gdGhleVxuICAgICAgICAgICAgLy8gd2FudCB0byBjb250aW51ZSBjeWNsaW5nLCBub3QgdG8gdGhlIGN1cnJlbnRseSBuZWFyZXN0IHN0ZXBcbiAgICAgICAgICAgIHZhciBzdGVwID0gZmluZE5lYXJlc3RTdGVwKGdldFN0ZXBQb3NpdGlvbihjdXJyZW50U3RlcCkpO1xuICAgICAgICAgICAgY3VycmVudFN0ZXBbMF0gPSBzdGVwWzBdO1xuICAgICAgICAgICAgY3VycmVudFN0ZXBbMV0gPSBzdGVwWzFdO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVNYXBSZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB1cGRhdGVFeHRlbnQoKTtcbiAgICAgICAgICAgIGdvVG9TdGVwKGZpbmROZWFyZXN0U3RlcCh2aWV3LmdldENlbnRlcigpKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGdvVG9TdGFydFN0ZXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBnb1RvU3RlcChbMCwgMF0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBnb1RvRW5kU3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGdvVG9TdGVwKHN0ZXBDb3VudCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGdldFN0ZXBQb3NpdGlvbiA9IGZ1bmN0aW9uIChzdGVwKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIHN0ZXBbMF0gKiBzdGVwU2l6ZVswXSArIHN0YXJ0Q2VudGVyWzBdLFxuICAgICAgICAgICAgICAgIHN0ZXBbMV0gKiBzdGVwU2l6ZVsxXSArIHN0YXJ0Q2VudGVyWzFdLFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZ29Ub1N0ZXAgPSBmdW5jdGlvbiAoc3RlcCkge1xuICAgICAgICAgICAgLy8gYW5pbWF0ZSBzdGVwcGluZ1xuICAgICAgICAgICAgLy8gdmFyIHBhbiA9IG9sLmFuaW1hdGlvbi5wYW4oe1xuICAgICAgICAgICAgLy8gICAgIHNvdXJjZTogdmlldy5nZXRDZW50ZXIoKSxcbiAgICAgICAgICAgIC8vICAgICBkdXJhdGlvbjogNTAwXG4gICAgICAgICAgICAvLyB9KTtcbiAgICAgICAgICAgIC8vIG1hcC5iZWZvcmVSZW5kZXIocGFuKTtcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwWzBdID0gc3RlcFswXTtcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwWzFdID0gc3RlcFsxXTtcbiAgICAgICAgICAgIHZpZXcuc2V0Q2VudGVyKGdldFN0ZXBQb3NpdGlvbihjdXJyZW50U3RlcCkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBuZXh0U3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50U3RlcFswXSA8IHN0ZXBDb3VudFswXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbY3VycmVudFN0ZXBbMF0gKyAxLCBjdXJyZW50U3RlcFsxXV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBbMCwgY3VycmVudFN0ZXBbMV0gKyAxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcHJldlN0ZXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFN0ZXBbMF0gPiAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtjdXJyZW50U3RlcFswXSAtIDEsIGN1cnJlbnRTdGVwWzFdXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtzdGVwQ291bnRbMF0sIGN1cnJlbnRTdGVwWzFdIC0gMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIG5leHRTZWN0aW9uID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmIChsb2FkaW5nIHx8ICEkc2NvcGUuY3ljbGluZygpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmIChjdXJyZW50U3RlcFswXSA8IHN0ZXBDb3VudFswXSB8fCBjdXJyZW50U3RlcFsxXSA8IHN0ZXBDb3VudFsxXSkge1xuICAgICAgICAgICAgICAgIGdvVG9TdGVwKG5leHRTdGVwKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUubmV4dEltYWdlKCkudGhlbih1cGRhdGVFeHRlbnQpLnRoZW4oZ29Ub1N0YXJ0U3RlcCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gb25seSBhcHBseSBpZiB0aGlzIHdhcyBjYWxsZWQgYnkgdGhlIGtleWJvYXJkIGV2ZW50XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjYW5jZWwgYWxsIGtleWJvYXJkIGV2ZW50cyB3aXRoIGxvd2VyIHByaW9yaXR5XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHByZXZTZWN0aW9uID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmIChsb2FkaW5nIHx8ICEkc2NvcGUuY3ljbGluZygpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmIChjdXJyZW50U3RlcFswXSA+IDAgfHwgY3VycmVudFN0ZXBbMV0gPiAwKSB7XG4gICAgICAgICAgICAgICAgZ29Ub1N0ZXAocHJldlN0ZXAoKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5wcmV2SW1hZ2UoKS50aGVuKHVwZGF0ZUV4dGVudCkudGhlbihnb1RvRW5kU3RlcCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gb25seSBhcHBseSBpZiB0aGlzIHdhcyBjYWxsZWQgYnkgdGhlIGtleWJvYXJkIGV2ZW50XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjYW5jZWwgYWxsIGtleWJvYXJkIGV2ZW50cyB3aXRoIGxvd2VyIHByaW9yaXR5XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc3RvcCBjeWNsaW5nIHVzaW5nIGEga2V5Ym9hcmQgZXZlbnRcbiAgICAgICAgdmFyIHN0b3BDeWNsaW5nID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICRzY29wZS5zdG9wQ3ljbGluZygpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5jeWNsaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5nZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScpID09PSBjeWNsaW5nS2V5O1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zdGFydEN5Y2xpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0Vm9sYXRpbGVTZXR0aW5ncygnY3ljbGUnLCBjeWNsaW5nS2V5KTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc3RvcEN5Y2xpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0Vm9sYXRpbGVTZXR0aW5ncygnY3ljbGUnLCAnJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdGhlIGN5Y2xlIHNldHRpbmdzIG15IGJlIHNldCBieSBvdGhlciBjb250cm9sbGVycywgdG9vLCBzbyB3YXRjaCBpdFxuICAgICAgICAvLyBpbnN0ZWFkIG9mIHVzaW5nIHRoZSBzdGFydC9zdG9wIGZ1bmN0aW9ucyB0byBhZGQvcmVtb3ZlIGV2ZW50cyBldGMuXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ3ZvbGF0aWxlU2V0dGluZ3MuY3ljbGUnLCBmdW5jdGlvbiAoY3ljbGUsIG9sZEN5Y2xlKSB7XG4gICAgICAgICAgICBpZiAoY3ljbGUgPT09IGN5Y2xpbmdLZXkpIHtcbiAgICAgICAgICAgICAgICBtYXAub24oJ2NoYW5nZTpzaXplJywgaGFuZGxlTWFwUmVzaXplKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVFeHRlbnQoKTtcbiAgICAgICAgICAgICAgICBnb1RvU3RhcnRTdGVwKCk7XG4gICAgICAgICAgICAgICAgLy8gb3ZlcnJpZGUgcHJldmlvdXMgaW1hZ2Ugb24gYXJyb3cgbGVmdFxuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDM3LCBwcmV2U2VjdGlvbiwgMTApO1xuICAgICAgICAgICAgICAgIC8vIG92ZXJyaWRlIG5leHQgaW1hZ2Ugb24gYXJyb3cgcmlnaHQgYW5kIHNwYWNlXG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMzksIG5leHRTZWN0aW9uLCAxMCk7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMzIsIG5leHRTZWN0aW9uLCAxMCk7XG5cbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigyNywgc3RvcEN5Y2xpbmcsIDEwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob2xkQ3ljbGUgPT09IGN5Y2xpbmdLZXkpIHtcbiAgICAgICAgICAgICAgICBtYXAudW4oJ2NoYW5nZTpzaXplJywgaGFuZGxlTWFwUmVzaXplKTtcbiAgICAgICAgICAgICAgICB2aWV3LnVuKCdjaGFuZ2U6cmVzb2x1dGlvbicsIGhhbmRsZVVzZXJab29tKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMzcsIHByZXZTZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMzksIG5leHRTZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMzIsIG5leHRTZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMjcsIHN0b3BDeWNsaW5nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS5wcmV2U2VjdGlvbiA9IHByZXZTZWN0aW9uO1xuICAgICAgICAkc2NvcGUubmV4dFNlY3Rpb24gPSBuZXh0U2VjdGlvbjtcbiAgICB9XG4pO1xuXG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNpZGViYXJDYXRlZ29yeUZvbGRvdXRDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyIGNhdGVnb3J5IGZvbGRvdXQgYnV0dG9uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2lkZWJhckNhdGVnb3J5Rm9sZG91dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBrZXlib2FyZCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKDksIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAkc2NvcGUudG9nZ2xlRm9sZG91dCgnY2F0ZWdvcmllcycpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2lkZWJhckNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXJcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTaWRlYmFyQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRyb290U2NvcGUpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgZm9sZG91dFN0b3JhZ2VLZXkgPSAnZGlhcy5hbm5vdGF0aW9ucy5zaWRlYmFyLWZvbGRvdXQnO1xuXG4gICAgICAgICRzY29wZS5mb2xkb3V0ID0gJyc7XG5cblx0XHQkc2NvcGUub3BlbkZvbGRvdXQgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZVtmb2xkb3V0U3RvcmFnZUtleV0gPSBuYW1lO1xuICAgICAgICAgICAgJHNjb3BlLmZvbGRvdXQgPSBuYW1lO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzaWRlYmFyLmZvbGRvdXQub3BlbicsIG5hbWUpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuY2xvc2VGb2xkb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGZvbGRvdXRTdG9yYWdlS2V5KTtcblx0XHRcdCRzY29wZS5mb2xkb3V0ID0gJyc7XG5cdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NpZGViYXIuZm9sZG91dC5jbG9zZScpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlRm9sZG91dCA9IGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmZvbGRvdXQgPT09IG5hbWUpIHtcblx0XHRcdFx0JHNjb3BlLmNsb3NlRm9sZG91dCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLm9wZW5Gb2xkb3V0KG5hbWUpO1xuXHRcdFx0fVxuXHRcdH07XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5kby1vcGVuJywgZnVuY3Rpb24gKGUsIG5hbWUpIHtcbiAgICAgICAgICAgICRzY29wZS5vcGVuRm9sZG91dChuYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gdGhlIGN1cnJlbnRseSBvcGVuZWQgc2lkZWJhci0nZXh0ZW5zaW9uJyBpcyByZW1lbWJlcmVkIHRocm91Z2ggbG9jYWxTdG9yYWdlXG4gICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW2ZvbGRvdXRTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgJHNjb3BlLm9wZW5Gb2xkb3V0KHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldKTtcbiAgICAgICAgfVxuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGFubm90YXRpb25MaXN0SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBbiBhbm5vdGF0aW9uIGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5kaXJlY3RpdmUoJ2Fubm90YXRpb25MaXN0SXRlbScsIGZ1bmN0aW9uIChsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRzY29wZTogdHJ1ZSxcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0JHNjb3BlLnNoYXBlQ2xhc3MgPSAnaWNvbi0nICsgJHNjb3BlLmFubm90YXRpb24uc2hhcGUudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0XHQkc2NvcGUuc2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS5pc1NlbGVjdGVkKCRzY29wZS5hbm5vdGF0aW9uLmlkKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuYXR0YWNoTGFiZWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0bGFiZWxzLmF0dGFjaFRvQW5ub3RhdGlvbigkc2NvcGUuYW5ub3RhdGlvbik7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLnJlbW92ZUxhYmVsID0gZnVuY3Rpb24gKGxhYmVsKSB7XG5cdFx0XHRcdFx0bGFiZWxzLnJlbW92ZUZyb21Bbm5vdGF0aW9uKCRzY29wZS5hbm5vdGF0aW9uLCBsYWJlbCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmNhbkF0dGFjaExhYmVsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuc2VsZWN0ZWQoKSAmJiBsYWJlbHMuaGFzU2VsZWN0ZWQoKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudExhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkO1xuXG5cdFx0XHRcdCRzY29wZS5jdXJyZW50Q29uZmlkZW5jZSA9IGxhYmVscy5nZXRDdXJyZW50Q29uZmlkZW5jZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhYmVsQ2F0ZWdvcnlJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgbGFiZWwgY2F0ZWdvcnkgbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmRpcmVjdGl2ZSgnbGFiZWxDYXRlZ29yeUl0ZW0nLCBmdW5jdGlvbiAoJGNvbXBpbGUsICR0aW1lb3V0LCAkdGVtcGxhdGVDYWNoZSkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdDJyxcblxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdsYWJlbC1pdGVtLmh0bWwnLFxuXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcblxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIHdhaXQgZm9yIHRoaXMgZWxlbWVudCB0byBiZSByZW5kZXJlZCB1bnRpbCB0aGUgY2hpbGRyZW4gYXJlXG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kZWQsIG90aGVyd2lzZSB0aGVyZSB3b3VsZCBiZSB0b28gbXVjaCByZWN1cnNpb24gZm9yXG4gICAgICAgICAgICAgICAgLy8gYW5ndWxhclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gYW5ndWxhci5lbGVtZW50KCR0ZW1wbGF0ZUNhY2hlLmdldCgnbGFiZWwtc3VidHJlZS5odG1sJykpO1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoY29udGVudCkoc2NvcGUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIHRoZSBzdWJ0cmVlIG9mIHRoaXMgaXRlbVxuICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaGFzIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzRXhwYW5kYWJsZSA9ICRzY29wZS50cmVlICYmICEhJHNjb3BlLnRyZWVbJHNjb3BlLml0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8gaGFuZGxlIHRoaXMgYnkgdGhlIGV2ZW50IHJhdGhlciB0aGFuIGFuIG93biBjbGljayBoYW5kbGVyIHRvXG4gICAgICAgICAgICAgICAgLy8gZGVhbCB3aXRoIGNsaWNrIGFuZCBzZWFyY2ggZmllbGQgYWN0aW9ucyBpbiBhIHVuaWZpZWQgd2F5XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGZ1bmN0aW9uIChlLCBjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhbiBpdGVtIGlzIHNlbGVjdGVkLCBpdHMgc3VidHJlZSBhbmQgYWxsIHBhcmVudCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgb3BlbmVkXG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5pZCA9PT0gY2F0ZWdvcnkuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBoaXRzIGFsbCBwYXJlbnQgc2NvcGVzL2l0ZW1zXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGEgY2hpbGQgaXRlbSB3YXMgc2VsZWN0ZWQsIHRoaXMgaXRlbSBzaG91bGQgYmUgb3BlbmVkLCB0b29cbiAgICAgICAgICAgICAgICAvLyBzbyB0aGUgc2VsZWN0ZWQgaXRlbSBiZWNvbWVzIHZpc2libGUgaW4gdGhlIHRyZWVcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3AgcHJvcGFnYXRpb24gaWYgdGhpcyBpcyBhIHJvb3QgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0ucGFyZW50X2lkID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYWJlbEl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQW4gYW5ub3RhdGlvbiBsYWJlbCBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZGlyZWN0aXZlKCdsYWJlbEl0ZW0nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFx0XHR2YXIgY29uZmlkZW5jZSA9ICRzY29wZS5hbm5vdGF0aW9uTGFiZWwuY29uZmlkZW5jZTtcblxuXHRcdFx0XHRpZiAoY29uZmlkZW5jZSA8PSAwLjI1KSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLWRhbmdlcic7XG5cdFx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjUgKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXdhcm5pbmcnO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC43NSApIHtcblx0XHRcdFx0XHQkc2NvcGUuY2xhc3MgPSAnbGFiZWwtc3VjY2Vzcyc7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXByaW1hcnknO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgYW5ub3RhdGlvbnNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIHRoZSBhbm5vdGF0aW9ucyB0byBtYWtlIHRoZW0gYXZhaWxhYmxlIGluIG11bHRpcGxlIGNvbnRyb2xsZXJzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2Fubm90YXRpb25zJywgZnVuY3Rpb24gKEFubm90YXRpb24sIHNoYXBlcywgbXNnKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgYW5ub3RhdGlvbnM7XG4gICAgICAgIHZhciBwcm9taXNlO1xuXG5cdFx0dmFyIHJlc29sdmVTaGFwZU5hbWUgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0YW5ub3RhdGlvbi5zaGFwZSA9IHNoYXBlcy5nZXROYW1lKGFubm90YXRpb24uc2hhcGVfaWQpO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb247XG5cdFx0fTtcblxuXHRcdHZhciBhZGRBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdGFubm90YXRpb25zLnB1c2goYW5ub3RhdGlvbik7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbjtcblx0XHR9O1xuXG5cdFx0dGhpcy5xdWVyeSA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcblx0XHRcdGFubm90YXRpb25zID0gQW5ub3RhdGlvbi5xdWVyeShwYXJhbXMpO1xuICAgICAgICAgICAgcHJvbWlzZSA9IGFubm90YXRpb25zLiRwcm9taXNlO1xuXHRcdFx0cHJvbWlzZS50aGVuKGZ1bmN0aW9uIChhKSB7XG5cdFx0XHRcdGEuZm9yRWFjaChyZXNvbHZlU2hhcGVOYW1lKTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb25zO1xuXHRcdH07XG5cblx0XHR0aGlzLmFkZCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcblx0XHRcdGlmICghcGFyYW1zLnNoYXBlX2lkICYmIHBhcmFtcy5zaGFwZSkge1xuXHRcdFx0XHRwYXJhbXMuc2hhcGVfaWQgPSBzaGFwZXMuZ2V0SWQocGFyYW1zLnNoYXBlKTtcblx0XHRcdH1cblx0XHRcdHZhciBhbm5vdGF0aW9uID0gQW5ub3RhdGlvbi5hZGQocGFyYW1zKTtcblx0XHRcdGFubm90YXRpb24uJHByb21pc2Vcblx0XHRcdCAgICAgICAgICAudGhlbihyZXNvbHZlU2hhcGVOYW1lKVxuXHRcdFx0ICAgICAgICAgIC50aGVuKGFkZEFubm90YXRpb24pXG5cdFx0XHQgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcblxuXHRcdFx0cmV0dXJuIGFubm90YXRpb247XG5cdFx0fTtcblxuXHRcdHRoaXMuZGVsZXRlID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdC8vIHVzZSBpbmRleCB0byBzZWUgaWYgdGhlIGFubm90YXRpb24gZXhpc3RzIGluIHRoZSBhbm5vdGF0aW9ucyBsaXN0XG5cdFx0XHR2YXIgaW5kZXggPSBhbm5vdGF0aW9ucy5pbmRleE9mKGFubm90YXRpb24pO1xuXHRcdFx0aWYgKGluZGV4ID4gLTEpIHtcblx0XHRcdFx0cmV0dXJuIGFubm90YXRpb24uJGRlbGV0ZShmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0Ly8gdXBkYXRlIHRoZSBpbmRleCBzaW5jZSB0aGUgYW5ub3RhdGlvbnMgbGlzdCBtYXkgaGF2ZSBiZWVuXG5cdFx0XHRcdFx0Ly8gbW9kaWZpZWQgaW4gdGhlIG1lYW50aW1lXG5cdFx0XHRcdFx0aW5kZXggPSBhbm5vdGF0aW9ucy5pbmRleE9mKGFubm90YXRpb24pO1xuXHRcdFx0XHRcdGFubm90YXRpb25zLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdH0sIG1zZy5yZXNwb25zZUVycm9yKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5mb3JFYWNoID0gZnVuY3Rpb24gKGZuKSB7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnMuZm9yRWFjaChmbik7XG5cdFx0fTtcblxuXHRcdHRoaXMuY3VycmVudCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9ucztcblx0XHR9O1xuXG4gICAgICAgIHRoaXMuZ2V0UHJvbWlzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBpbWFnZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFuYWdlcyAocHJlLSlsb2FkaW5nIG9mIHRoZSBpbWFnZXMgdG8gYW5ub3RhdGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnaW1hZ2VzJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIFRyYW5zZWN0SW1hZ2UsIFVSTCwgJHEsIGZpbHRlclN1YnNldCwgVFJBTlNFQ1RfSUQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cdFx0Ly8gYXJyYXkgb2YgYWxsIGltYWdlIElEcyBvZiB0aGUgdHJhbnNlY3Rcblx0XHR2YXIgaW1hZ2VJZHMgPSBbXTtcblx0XHQvLyBtYXhpbXVtIG51bWJlciBvZiBpbWFnZXMgdG8gaG9sZCBpbiBidWZmZXJcblx0XHR2YXIgTUFYX0JVRkZFUl9TSVpFID0gMTA7XG5cdFx0Ly8gYnVmZmVyIG9mIGFscmVhZHkgbG9hZGVkIGltYWdlc1xuXHRcdHZhciBidWZmZXIgPSBbXTtcblxuXHRcdC8vIHRoZSBjdXJyZW50bHkgc2hvd24gaW1hZ2Vcblx0XHR0aGlzLmN1cnJlbnRJbWFnZSA9IHVuZGVmaW5lZDtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIG5leHQgSUQgb2YgdGhlIHNwZWNpZmllZCBpbWFnZSBvciB0aGUgbmV4dCBJRCBvZiB0aGVcblx0XHQgKiBjdXJyZW50IGltYWdlIGlmIG5vIGltYWdlIHdhcyBzcGVjaWZpZWQuXG5cdFx0ICovXG5cdFx0dmFyIG5leHRJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0aWQgPSBpZCB8fCBfdGhpcy5jdXJyZW50SW1hZ2UuX2lkO1xuXHRcdFx0dmFyIGluZGV4ID0gaW1hZ2VJZHMuaW5kZXhPZihpZCk7XG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHNbKGluZGV4ICsgMSkgJSBpbWFnZUlkcy5sZW5ndGhdO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBwcmV2aW91cyBJRCBvZiB0aGUgc3BlY2lmaWVkIGltYWdlIG9yIHRoZSBwcmV2aW91cyBJRCBvZlxuXHRcdCAqIHRoZSBjdXJyZW50IGltYWdlIGlmIG5vIGltYWdlIHdhcyBzcGVjaWZpZWQuXG5cdFx0ICovXG5cdFx0dmFyIHByZXZJZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0aWQgPSBpZCB8fCBfdGhpcy5jdXJyZW50SW1hZ2UuX2lkO1xuXHRcdFx0dmFyIGluZGV4ID0gaW1hZ2VJZHMuaW5kZXhPZihpZCk7XG5cdFx0XHR2YXIgbGVuZ3RoID0gaW1hZ2VJZHMubGVuZ3RoO1xuXHRcdFx0cmV0dXJuIGltYWdlSWRzWyhpbmRleCAtIDEgKyBsZW5ndGgpICUgbGVuZ3RoXTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgc3BlY2lmaWVkIGltYWdlIGZyb20gdGhlIGJ1ZmZlciBvciBgdW5kZWZpbmVkYCBpZiBpdCBpc1xuXHRcdCAqIG5vdCBidWZmZXJlZC5cblx0XHQgKi9cblx0XHR2YXIgZ2V0SW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdGZvciAodmFyIGkgPSBidWZmZXIubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0aWYgKGJ1ZmZlcltpXS5faWQgPT0gaWQpIHJldHVybiBidWZmZXJbaV07XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNldHMgdGhlIHNwZWNpZmllZCBpbWFnZSB0byBhcyB0aGUgY3VycmVudGx5IHNob3duIGltYWdlLlxuXHRcdCAqL1xuXHRcdHZhciBzaG93ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRfdGhpcy5jdXJyZW50SW1hZ2UgPSBnZXRJbWFnZShpZCk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIExvYWRzIHRoZSBzcGVjaWZpZWQgaW1hZ2UgZWl0aGVyIGZyb20gYnVmZmVyIG9yIGZyb20gdGhlIGV4dGVybmFsXG5cdFx0ICogcmVzb3VyY2UuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgZ2V0cyByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpc1xuXHRcdCAqIGxvYWRlZC5cblx0XHQgKi9cblx0XHR2YXIgZmV0Y2hJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdHZhciBpbWcgPSBnZXRJbWFnZShpZCk7XG5cblx0XHRcdGlmIChpbWcpIHtcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbWcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG5cdFx0XHRcdGltZy5faWQgPSBpZDtcblx0XHRcdFx0aW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRidWZmZXIucHVzaChpbWcpO1xuXHRcdFx0XHRcdC8vIGNvbnRyb2wgbWF4aW11bSBidWZmZXIgc2l6ZVxuXHRcdFx0XHRcdGlmIChidWZmZXIubGVuZ3RoID4gTUFYX0JVRkZFUl9TSVpFKSB7XG5cdFx0XHRcdFx0XHRidWZmZXIuc2hpZnQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbWcpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpbWcub25lcnJvciA9IGZ1bmN0aW9uIChtc2cpIHtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3QobXNnKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aW1nLnNyYyA9IFVSTCArIFwiL2FwaS92MS9pbWFnZXMvXCIgKyBpZCArIFwiL2ZpbGVcIjtcblx0XHRcdH1cblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdpbWFnZS5mZXRjaGluZycsIGltZyk7XG5cblx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBJbml0aWFsaXplcyB0aGUgc2VydmljZSBmb3IgYSBnaXZlbiB0cmFuc2VjdC4gUmV0dXJucyBhIHByb21pc2UgdGhhdFxuXHRcdCAqIGlzIHJlc29sdmVkLCB3aGVuIHRoZSBzZXJ2aWNlIGlzIGluaXRpYWxpemVkLlxuXHRcdCAqL1xuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGltYWdlSWRzID0gVHJhbnNlY3RJbWFnZS5xdWVyeSh7dHJhbnNlY3RfaWQ6IFRSQU5TRUNUX0lEfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGxvb2sgZm9yIGEgc2VxdWVuY2Ugb2YgaW1hZ2UgSURzIGluIGxvY2FsIHN0b3JhZ2UuXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBzZXF1ZW5jZSBpcyBwcm9kdWNlcyBieSB0aGUgdHJhbnNlY3QgaW5kZXggcGFnZSB3aGVuIHRoZSBpbWFnZXMgYXJlXG4gICAgICAgICAgICAgICAgLy8gc29ydGVkIG9yIGZpbHRlcmVkLiB3ZSB3YW50IHRvIHJlZmxlY3QgdGhlIHNhbWUgb3JkZXJpbmcgb3IgZmlsdGVyaW5nIGhlcmVcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGUgYW5ub3RhdG9yXG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlZFNlcXVlbmNlID0gd2luZG93LmxvY2FsU3RvcmFnZVsnZGlhcy50cmFuc2VjdHMuJyArIFRSQU5TRUNUX0lEICsgJy5pbWFnZXMnXTtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmVkU2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmVkU2VxdWVuY2UgPSBKU09OLnBhcnNlKHN0b3JlZFNlcXVlbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgc3VjaCBhIHN0b3JlZCBzZXF1ZW5jZSwgZmlsdGVyIG91dCBhbnkgaW1hZ2UgSURzIHRoYXQgZG8gbm90XG4gICAgICAgICAgICAgICAgICAgIC8vIGJlbG9uZyB0byB0aGUgdHJhbnNlY3QgKGFueSBtb3JlKSwgc2luY2Ugc29tZSBvZiB0aGVtIG1heSBoYXZlIGJlZW4gZGVsZXRlZFxuICAgICAgICAgICAgICAgICAgICAvLyBpbiB0aGUgbWVhbnRpbWVcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyU3Vic2V0KHN0b3JlZFNlcXVlbmNlLCBpbWFnZUlkcyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgcHJvbWlzZSBpcyBub3QgcmVtb3ZlZCB3aGVuIG92ZXJ3cml0aW5nIGltYWdlSWRzIHNpbmNlIHdlXG4gICAgICAgICAgICAgICAgICAgIC8vIG5lZWQgaXQgbGF0ZXIgb24uXG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlLiRwcm9taXNlID0gaW1hZ2VJZHMuJHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlLiRyZXNvbHZlZCA9IGltYWdlSWRzLiRyZXNvbHZlZDtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlbiBzZXQgdGhlIHN0b3JlZCBzZXF1ZW5jZSBhcyB0aGUgc2VxdWVuY2Ugb2YgaW1hZ2UgSURzIGluc3RlYWQgb2Ygc2ltcGx5XG4gICAgICAgICAgICAgICAgICAgIC8vIGFsbCBJRHMgYmVsb25naW5nIHRvIHRoZSB0cmFuc2VjdFxuICAgICAgICAgICAgICAgICAgICBpbWFnZUlkcyA9IHN0b3JlZFNlcXVlbmNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHMuJHByb21pc2U7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNob3cgdGhlIGltYWdlIHdpdGggdGhlIHNwZWNpZmllZCBJRC4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMuc2hvdyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIHByb21pc2UgPSBmZXRjaEltYWdlKGlkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzaG93KGlkKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyB3YWl0IGZvciBpbWFnZUlkcyB0byBiZSBsb2FkZWRcblx0XHRcdGltYWdlSWRzLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyBwcmUtbG9hZCBwcmV2aW91cyBhbmQgbmV4dCBpbWFnZXMgYnV0IGRvbid0IGRpc3BsYXkgdGhlbVxuXHRcdFx0XHRmZXRjaEltYWdlKG5leHRJZChpZCkpO1xuXHRcdFx0XHRmZXRjaEltYWdlKHByZXZJZChpZCkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBwcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBuZXh0IGltYWdlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzXG5cdFx0ICogcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXMgc2hvd24uXG5cdFx0ICovXG5cdFx0dGhpcy5uZXh0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF90aGlzLnNob3cobmV4dElkKCkpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBwcmV2aW91cyBpbWFnZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMucHJldiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfdGhpcy5zaG93KHByZXZJZCgpKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRDdXJyZW50SWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBrZXlib2FyZFxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIHRvIHJlZ2lzdGVyIGFuZCBtYW5hZ2Uga2V5cHJlc3MgZXZlbnRzIHdpdGggcHJpb3JpdGllc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2tleWJvYXJkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBtYXBzIGtleSBjb2Rlcy9jaGFyYWN0ZXJzIHRvIGFycmF5cyBvZiBsaXN0ZW5lcnNcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHt9O1xuXG4gICAgICAgIHZhciBleGVjdXRlQ2FsbGJhY2tzID0gZnVuY3Rpb24gKGxpc3QsIGUpIHtcbiAgICAgICAgICAgIC8vIGdvIGZyb20gaGlnaGVzdCBwcmlvcml0eSBkb3duXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gbGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrcyBjYW4gY2FuY2VsIGZ1cnRoZXIgcHJvcGFnYXRpb25cbiAgICAgICAgICAgICAgICBpZiAobGlzdFtpXS5jYWxsYmFjayhlKSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlS2V5RXZlbnRzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHZhciBjb2RlID0gZS5rZXlDb2RlO1xuICAgICAgICAgICAgdmFyIGNoYXJhY3RlciA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZS53aGljaCB8fCBjb2RlKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NvZGVdKSB7XG4gICAgICAgICAgICAgICAgZXhlY3V0ZUNhbGxiYWNrcyhsaXN0ZW5lcnNbY29kZV0sIGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NoYXJhY3Rlcl0pIHtcbiAgICAgICAgICAgICAgICBleGVjdXRlQ2FsbGJhY2tzKGxpc3RlbmVyc1tjaGFyYWN0ZXJdLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5RXZlbnRzKTtcblxuICAgICAgICAvLyByZWdpc3RlciBhIG5ldyBldmVudCBsaXN0ZW5lciBmb3IgdGhlIGtleSBjb2RlIG9yIGNoYXJhY3RlciB3aXRoIGFuIG9wdGlvbmFsIHByaW9yaXR5XG4gICAgICAgIC8vIGxpc3RlbmVycyB3aXRoIGhpZ2hlciBwcmlvcml0eSBhcmUgY2FsbGVkIGZpcnN0IGFuYyBjYW4gcmV0dXJuICdmYWxzZScgdG8gcHJldmVudCB0aGVcbiAgICAgICAgLy8gbGlzdGVuZXJzIHdpdGggbG93ZXIgcHJpb3JpdHkgZnJvbSBiZWluZyBjYWxsZWRcbiAgICAgICAgdGhpcy5vbiA9IGZ1bmN0aW9uIChjaGFyT3JDb2RlLCBjYWxsYmFjaywgcHJpb3JpdHkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2hhck9yQ29kZSA9PT0gJ3N0cmluZycgfHwgY2hhck9yQ29kZSBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICAgICAgICAgIGNoYXJPckNvZGUgPSBjaGFyT3JDb2RlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcbiAgICAgICAgICAgIHZhciBsaXN0ZW5lciA9IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IHByaW9yaXR5XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NoYXJPckNvZGVdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBsaXN0ZW5lcnNbY2hhck9yQ29kZV07XG4gICAgICAgICAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdFtpXS5wcmlvcml0eSA+PSBwcmlvcml0eSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IGxpc3QubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3Quc3BsaWNlKGksIDAsIGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzW2NoYXJPckNvZGVdID0gW2xpc3RlbmVyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyB1bnJlZ2lzdGVyIGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIHRoaXMub2ZmID0gZnVuY3Rpb24gKGNoYXJPckNvZGUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNoYXJPckNvZGUgPT09ICdzdHJpbmcnIHx8IGNoYXJPckNvZGUgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBjaGFyT3JDb2RlID0gY2hhck9yQ29kZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2NoYXJPckNvZGVdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBsaXN0ZW5lcnNbY2hhck9yQ29kZV07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaXN0W2ldLmNhbGxiYWNrID09PSBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBsYWJlbHNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGZvciBhbm5vdGF0aW9uIGxhYmVscyB0byBwcm92aWRlIHNvbWUgY29udmVuaWVuY2UgZnVuY3Rpb25zLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2xhYmVscycsIGZ1bmN0aW9uIChBbm5vdGF0aW9uTGFiZWwsIExhYmVsLCBQcm9qZWN0TGFiZWwsIFByb2plY3QsIG1zZywgJHEsIFBST0pFQ1RfSURTKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZExhYmVsO1xuICAgICAgICB2YXIgY3VycmVudENvbmZpZGVuY2UgPSAxLjA7XG5cbiAgICAgICAgdmFyIGxhYmVscyA9IHt9O1xuXG4gICAgICAgIC8vIHRoaXMgcHJvbWlzZSBpcyByZXNvbHZlZCB3aGVuIGFsbCBsYWJlbHMgd2VyZSBsb2FkZWRcbiAgICAgICAgdGhpcy5wcm9taXNlID0gbnVsbDtcblxuICAgICAgICB0aGlzLmZldGNoRm9yQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICBpZiAoIWFubm90YXRpb24pIHJldHVybjtcblxuICAgICAgICAgICAgLy8gZG9uJ3QgZmV0Y2ggdHdpY2VcbiAgICAgICAgICAgIGlmICghYW5ub3RhdGlvbi5sYWJlbHMpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscyA9IEFubm90YXRpb25MYWJlbC5xdWVyeSh7XG4gICAgICAgICAgICAgICAgICAgIGFubm90YXRpb25faWQ6IGFubm90YXRpb24uaWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFubm90YXRpb24ubGFiZWxzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuYXR0YWNoVG9Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IEFubm90YXRpb25MYWJlbC5hdHRhY2goe1xuICAgICAgICAgICAgICAgIGFubm90YXRpb25faWQ6IGFubm90YXRpb24uaWQsXG4gICAgICAgICAgICAgICAgbGFiZWxfaWQ6IHNlbGVjdGVkTGFiZWwuaWQsXG4gICAgICAgICAgICAgICAgY29uZmlkZW5jZTogY3VycmVudENvbmZpZGVuY2VcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsYWJlbC4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscy5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsYWJlbC4kcHJvbWlzZS5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG5cbiAgICAgICAgICAgIHJldHVybiBsYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJlbW92ZUZyb21Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24sIGxhYmVsKSB7XG4gICAgICAgICAgICAvLyB1c2UgaW5kZXggdG8gc2VlIGlmIHRoZSBsYWJlbCBleGlzdHMgZm9yIHRoZSBhbm5vdGF0aW9uXG4gICAgICAgICAgICB2YXIgaW5kZXggPSBhbm5vdGF0aW9uLmxhYmVscy5pbmRleE9mKGxhYmVsKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFubm90YXRpb25MYWJlbC5kZWxldGUoe2lkOiBsYWJlbC5pZH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBpbmRleCBzaW5jZSB0aGUgbGFiZWwgbGlzdCBtYXkgaGF2ZSBiZWVuIG1vZGlmaWVkXG4gICAgICAgICAgICAgICAgICAgIC8vIGluIHRoZSBtZWFudGltZVxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGFubm90YXRpb24ubGFiZWxzLmluZGV4T2YobGFiZWwpO1xuICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9uLmxhYmVscy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIH0sIG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldFRyZWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHt9O1xuICAgICAgICAgICAgdmFyIGtleSA9IG51bGw7XG4gICAgICAgICAgICB2YXIgYnVpbGQgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gbGFiZWwucGFyZW50X2lkO1xuICAgICAgICAgICAgICAgIGlmICh0cmVlW2tleV1bcGFyZW50XSkge1xuICAgICAgICAgICAgICAgICAgICB0cmVlW2tleV1bcGFyZW50XS5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cmVlW2tleV1bcGFyZW50XSA9IFtsYWJlbF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5wcm9taXNlLnRoZW4oZnVuY3Rpb24gKGxhYmVscykge1xuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGxhYmVscykge1xuICAgICAgICAgICAgICAgICAgICB0cmVlW2tleV0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxzW2tleV0uZm9yRWFjaChidWlsZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cmVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxhYmVscztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldFNlbGVjdGVkID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICBzZWxlY3RlZExhYmVsID0gbGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZExhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzU2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFzZWxlY3RlZExhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0U2VsZWN0ZWRJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZExhYmVsID8gc2VsZWN0ZWRMYWJlbC5pZCA6IG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRDdXJyZW50Q29uZmlkZW5jZSA9IGZ1bmN0aW9uIChjb25maWRlbmNlKSB7XG4gICAgICAgICAgICBjdXJyZW50Q29uZmlkZW5jZSA9IGNvbmZpZGVuY2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRDdXJyZW50Q29uZmlkZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50Q29uZmlkZW5jZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpbml0XG4gICAgICAgIChmdW5jdGlvbiAoX3RoaXMpIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBfdGhpcy5wcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIC8vIC0xIGJlY2F1c2Ugb2YgZ2xvYmFsIGxhYmVsc1xuICAgICAgICAgICAgdmFyIGZpbmlzaGVkID0gLTE7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFsbCBsYWJlbHMgYXJlIHRoZXJlLiBpZiB5ZXMsIHJlc29sdmVcbiAgICAgICAgICAgIHZhciBtYXliZVJlc29sdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCsrZmluaXNoZWQgPT09IFBST0pFQ1RfSURTLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGxhYmVscyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbGFiZWxzW251bGxdID0gTGFiZWwucXVlcnkobWF5YmVSZXNvbHZlKTtcblxuICAgICAgICAgICAgUFJPSkVDVF9JRFMuZm9yRWFjaChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgICAgICBQcm9qZWN0LmdldCh7aWQ6IGlkfSwgZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxzW3Byb2plY3QubmFtZV0gPSBQcm9qZWN0TGFiZWwucXVlcnkoe3Byb2plY3RfaWQ6IGlkfSwgbWF5YmVSZXNvbHZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSh0aGlzKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBtYXBBbm5vdGF0aW9uc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgaGFuZGxpbmcgdGhlIGFubm90YXRpb25zIGxheWVyIG9uIHRoZSBPcGVuTGF5ZXJzIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ21hcEFubm90YXRpb25zJywgZnVuY3Rpb24gKG1hcCwgaW1hZ2VzLCBhbm5vdGF0aW9ucywgZGVib3VuY2UsIHN0eWxlcywgJGludGVydmFsLCBsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyB0aGUgZ2VvbWV0cmljIGZlYXR1cmVzIG9mIHRoZSBhbm5vdGF0aW9ucyBvbiB0aGUgbWFwXG4gICAgICAgIHZhciBhbm5vdGF0aW9uRmVhdHVyZXMgPSBuZXcgb2wuQ29sbGVjdGlvbigpO1xuICAgICAgICB2YXIgYW5ub3RhdGlvblNvdXJjZSA9IG5ldyBvbC5zb3VyY2UuVmVjdG9yKHtcbiAgICAgICAgICAgIGZlYXR1cmVzOiBhbm5vdGF0aW9uRmVhdHVyZXNcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBhbm5vdGF0aW9uTGF5ZXIgPSBuZXcgb2wubGF5ZXIuVmVjdG9yKHtcbiAgICAgICAgICAgIHNvdXJjZTogYW5ub3RhdGlvblNvdXJjZSxcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZXMuZmVhdHVyZXMsXG4gICAgICAgICAgICB6SW5kZXg6IDEwMFxuICAgICAgICB9KTtcblxuXHRcdC8vIHNlbGVjdCBpbnRlcmFjdGlvbiB3b3JraW5nIG9uIFwic2luZ2xlY2xpY2tcIlxuXHRcdHZhciBzZWxlY3QgPSBuZXcgb2wuaW50ZXJhY3Rpb24uU2VsZWN0KHtcblx0XHRcdHN0eWxlOiBzdHlsZXMuaGlnaGxpZ2h0LFxuICAgICAgICAgICAgbGF5ZXJzOiBbYW5ub3RhdGlvbkxheWVyXSxcbiAgICAgICAgICAgIC8vIGVuYWJsZSBzZWxlY3RpbmcgbXVsdGlwbGUgb3ZlcmxhcHBpbmcgZmVhdHVyZXMgYXQgb25jZVxuICAgICAgICAgICAgbXVsdGk6IHRydWVcblx0XHR9KTtcblxuICAgICAgICAvLyBhbGwgYW5ub3RhdGlvbnMgdGhhdCBhcmUgY3VycmVudGx5IHNlbGVjdGVkXG5cdFx0dmFyIHNlbGVjdGVkRmVhdHVyZXMgPSBzZWxlY3QuZ2V0RmVhdHVyZXMoKTtcblxuICAgICAgICAvLyBpbnRlcmFjdGlvbiBmb3IgbW9kaWZ5aW5nIGFubm90YXRpb25zXG5cdFx0dmFyIG1vZGlmeSA9IG5ldyBvbC5pbnRlcmFjdGlvbi5Nb2RpZnkoe1xuXHRcdFx0ZmVhdHVyZXM6IGFubm90YXRpb25GZWF0dXJlcyxcblx0XHRcdC8vIHRoZSBTSElGVCBrZXkgbXVzdCBiZSBwcmVzc2VkIHRvIGRlbGV0ZSB2ZXJ0aWNlcywgc29cblx0XHRcdC8vIHRoYXQgbmV3IHZlcnRpY2VzIGNhbiBiZSBkcmF3biBhdCB0aGUgc2FtZSBwb3NpdGlvblxuXHRcdFx0Ly8gb2YgZXhpc3RpbmcgdmVydGljZXNcblx0XHRcdGRlbGV0ZUNvbmRpdGlvbjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0cmV0dXJuIG9sLmV2ZW50cy5jb25kaXRpb24uc2hpZnRLZXlPbmx5KGV2ZW50KSAmJiBvbC5ldmVudHMuY29uZGl0aW9uLnNpbmdsZUNsaWNrKGV2ZW50KTtcblx0XHRcdH1cblx0XHR9KTtcblxuICAgICAgICBtb2RpZnkuc2V0QWN0aXZlKGZhbHNlKTtcblxuICAgICAgICAvLyBpbnRlcmFjdGlvbiBmb3IgbW92aW5nIGFubm90YXRpb25zXG4gICAgICAgIHZhciB0cmFuc2xhdGUgPSBuZXcgb2wuaW50ZXJhY3Rpb24uVHJhbnNsYXRlKHtcbiAgICAgICAgICAgIGZlYXR1cmVzOiBzZWxlY3RlZEZlYXR1cmVzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyYW5zbGF0ZS5zZXRBY3RpdmUoZmFsc2UpO1xuXG5cdFx0Ly8gZHJhd2luZyBpbnRlcmFjdGlvbiwgd2lsbCBiZSBhIG5ldyBvbmUgZm9yIGVhY2ggZHJhd2luZyB0b29sXG5cdFx0dmFyIGRyYXc7XG4gICAgICAgIC8vIHR5cGUvc2hhcGUgb2YgdGhlIGRyYXdpbmcgaW50ZXJhY3Rpb25cbiAgICAgICAgdmFyIGRyYXdpbmdUeXBlO1xuXG4gICAgICAgIC8vIGluZGV4IG9mIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgYW5ub3RhdGlvbiAoZHVyaW5nIGN5Y2xpbmcgdGhyb3VnaCBhbm5vdGF0aW9ucylcbiAgICAgICAgLy8gaW4gdGhlIGFubm90YXRpb25GZWF0dXJlcyBjb2xsZWN0aW9uXG4gICAgICAgIHZhciBjdXJyZW50QW5ub3RhdGlvbkluZGV4ID0gMDtcblxuICAgICAgICAvLyB0aGUgYW5ub3RhdGlvbiB0aGF0IHdhcyBkcmF3biBsYXN0IGR1cmluZyB0aGUgY3VycmVudCBzZXNzaW9uXG4gICAgICAgIHZhciBsYXN0RHJhd25GZWF0dXJlO1xuXG4gICAgICAgIC8vIHJlc3RyaWN0IGN5Y2xpbmcgdGhyb3VnaCBhbm5vdGF0aW9ucyB0byB0aG9zZSBoYXZpbmcgdGhlIGN1cnJlbnRseSBzZWxlY3RlZFxuICAgICAgICAvLyBsYWJlbCBjYXRlZ29yeVxuICAgICAgICB2YXIgcmVzdHJpY3RMYWJlbENhdGVnb3J5ID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICAvLyBzY29wZSBvZiB0aGUgQ2FudmFzQ29udHJvbGxlclxuICAgICAgICB2YXIgX3Njb3BlO1xuXG4gICAgICAgIC8vIHNlbGVjdHMgYSBzaW5nbGUgYW5ub3RhdGlvbiBhbmQgbW92ZXMgdGhlIHZpZXdwb3J0IHRvIGl0XG4gICAgICAgIHZhciBzZWxlY3RBbmRTaG93QW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICBfdGhpcy5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgaWYgKGFubm90YXRpb24pIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZEZlYXR1cmVzLnB1c2goYW5ub3RhdGlvbik7XG4gICAgICAgICAgICAgICAgbWFwLmdldFZpZXcoKS5maXQoYW5ub3RhdGlvbi5nZXRHZW9tZXRyeSgpLCBtYXAuZ2V0U2l6ZSgpLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IFs1MCwgNTAsIDUwLCA1MF1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpbnZlcnQgeSBjb29yZGluYXRlcyBvZiBhIHBvaW50cyBhcnJheVxuICAgICAgICB2YXIgY29udmVydEZyb21PTFBvaW50ID0gZnVuY3Rpb24gKHBvaW50LCBpbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIChpbmRleCAlIDIgPT09IDEpID8gKGltYWdlcy5jdXJyZW50SW1hZ2UuaGVpZ2h0IC0gcG9pbnQpIDogcG9pbnQ7XG4gICAgICAgIH07XG5cblx0XHQvLyBhc3NlbWJsZXMgdGhlIGNvb3JkaW5hdGUgYXJyYXlzIGRlcGVuZGluZyBvbiB0aGUgZ2VvbWV0cnkgdHlwZVxuXHRcdC8vIHNvIHRoZXkgaGF2ZSBhIHVuaWZpZWQgZm9ybWF0XG5cdFx0dmFyIGdldENvb3JkaW5hdGVzID0gZnVuY3Rpb24gKGdlb21ldHJ5KSB7XG4gICAgICAgICAgICB2YXIgY29vcmRpbmF0ZXM7XG5cdFx0XHRzd2l0Y2ggKGdlb21ldHJ5LmdldFR5cGUoKSkge1xuXHRcdFx0XHRjYXNlICdDaXJjbGUnOlxuXHRcdFx0XHRcdC8vIHJhZGl1cyBpcyB0aGUgeCB2YWx1ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjaXJjbGVcblx0XHRcdFx0XHRjb29yZGluYXRlcyA9IFtnZW9tZXRyeS5nZXRDZW50ZXIoKSwgW2dlb21ldHJ5LmdldFJhZGl1cygpXV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHRcdFx0XHRjYXNlICdQb2x5Z29uJzpcblx0XHRcdFx0Y2FzZSAnUmVjdGFuZ2xlJzpcblx0XHRcdFx0XHRjb29yZGluYXRlcyA9IGdlb21ldHJ5LmdldENvb3JkaW5hdGVzKClbMF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHRcdFx0XHRjYXNlICdQb2ludCc6XG5cdFx0XHRcdFx0Y29vcmRpbmF0ZXMgPSBbZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdGNvb3JkaW5hdGVzID0gZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKTtcblx0XHRcdH1cblxuICAgICAgICAgICAgLy8gbWVyZ2UgdGhlIGluZGl2aWR1YWwgcG9pbnQgYXJyYXlzIHRvIGEgc2luZ2xlIGFycmF5XG4gICAgICAgICAgICAvLyByb3VuZCB0aGUgY29vcmRpbmF0ZXMgdG8gaW50ZWdlcnNcbiAgICAgICAgICAgIHJldHVybiBbXS5jb25jYXQuYXBwbHkoW10sIGNvb3JkaW5hdGVzKVxuICAgICAgICAgICAgICAgIC5tYXAoTWF0aC5yb3VuZClcbiAgICAgICAgICAgICAgICAubWFwKGNvbnZlcnRGcm9tT0xQb2ludCk7XG5cdFx0fTtcblxuXHRcdC8vIHNhdmVzIHRoZSB1cGRhdGVkIGdlb21ldHJ5IG9mIGFuIGFubm90YXRpb24gZmVhdHVyZVxuXHRcdHZhciBoYW5kbGVHZW9tZXRyeUNoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgZmVhdHVyZSA9IGUudGFyZ2V0O1xuXHRcdFx0dmFyIHNhdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGZlYXR1cmUuYW5ub3RhdGlvbi5wb2ludHMgPSBnZXRDb29yZGluYXRlcyhmZWF0dXJlLmdldEdlb21ldHJ5KCkpO1xuXHRcdFx0XHRmZWF0dXJlLmFubm90YXRpb24uJHNhdmUoKTtcblx0XHRcdH07XG5cdFx0XHQvLyB0aGlzIGV2ZW50IGlzIHJhcGlkbHkgZmlyZWQsIHNvIHdhaXQgdW50aWwgdGhlIGZpcmluZyBzdG9wc1xuXHRcdFx0Ly8gYmVmb3JlIHNhdmluZyB0aGUgY2hhbmdlc1xuXHRcdFx0ZGVib3VuY2Uoc2F2ZSwgNTAwLCBmZWF0dXJlLmFubm90YXRpb24uaWQpO1xuXHRcdH07XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgbmV3IE9MIGZlYXR1cmUgb24gdGhlIG1hcCBiYXNlZCBvbiBhbiBhbm5vdGF0aW9uIG9iamVjdFxuXHRcdHZhciBjcmVhdGVGZWF0dXJlID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdHZhciBnZW9tZXRyeTtcblx0XHRcdHZhciBwb2ludHMgPSBhbm5vdGF0aW9uLnBvaW50cztcbiAgICAgICAgICAgIHZhciBuZXdQb2ludHMgPSBbXTtcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSBpbWFnZXMuY3VycmVudEltYWdlLmhlaWdodDtcbiAgICAgICAgICAgIC8vIGNvbnZlcnQgcG9pbnRzIGFycmF5IHRvIE9MIHBvaW50c1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICBuZXdQb2ludHMucHVzaChbXG4gICAgICAgICAgICAgICAgICAgIHBvaW50c1tpXSxcbiAgICAgICAgICAgICAgICAgICAgLy8gaW52ZXJ0IHRoZSB5IGF4aXMgdG8gT0wgY29vcmRpbmF0ZXNcbiAgICAgICAgICAgICAgICAgICAgLy8gY2lyY2xlcyBoYXZlIG5vIGZvdXJ0aCBwb2ludCBzbyB3ZSB0YWtlIDBcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IC0gKHBvaW50c1tpICsgMV0gfHwgMClcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIH1cblxuXHRcdFx0c3dpdGNoIChhbm5vdGF0aW9uLnNoYXBlKSB7XG5cdFx0XHRcdGNhc2UgJ1BvaW50Jzpcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlBvaW50KG5ld1BvaW50c1swXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ1JlY3RhbmdsZSc6XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5SZWN0YW5nbGUoWyBuZXdQb2ludHMgXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ1BvbHlnb24nOlxuXHRcdFx0XHRcdC8vIGV4YW1wbGU6IGh0dHBzOi8vZ2l0aHViLmNvbS9vcGVubGF5ZXJzL29sMy9ibG9iL21hc3Rlci9leGFtcGxlcy9nZW9qc29uLmpzI0wxMjZcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlBvbHlnb24oWyBuZXdQb2ludHMgXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0xpbmVTdHJpbmcnOlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uTGluZVN0cmluZyhuZXdQb2ludHMpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdDaXJjbGUnOlxuXHRcdFx0XHRcdC8vIHJhZGl1cyBpcyB0aGUgeCB2YWx1ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjaXJjbGVcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLkNpcmNsZShuZXdQb2ludHNbMF0sIG5ld1BvaW50c1sxXVswXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gdW5zdXBwb3J0ZWQgc2hhcGVzIGFyZSBpZ25vcmVkXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVW5rbm93biBhbm5vdGF0aW9uIHNoYXBlOiAnICsgYW5ub3RhdGlvbi5zaGFwZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGZlYXR1cmUgPSBuZXcgb2wuRmVhdHVyZSh7IGdlb21ldHJ5OiBnZW9tZXRyeSB9KTtcbiAgICAgICAgICAgIGZlYXR1cmUuYW5ub3RhdGlvbiA9IGFubm90YXRpb247XG4gICAgICAgICAgICBpZiAoYW5ub3RhdGlvbi5sYWJlbHMgJiYgYW5ub3RhdGlvbi5sYWJlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGZlYXR1cmUuY29sb3IgPSBhbm5vdGF0aW9uLmxhYmVsc1swXS5sYWJlbC5jb2xvcjtcbiAgICAgICAgICAgIH1cblx0XHRcdGZlYXR1cmUub24oJ2NoYW5nZScsIGhhbmRsZUdlb21ldHJ5Q2hhbmdlKTtcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuYWRkRmVhdHVyZShmZWF0dXJlKTtcblx0XHR9O1xuXG4gICAgICAgIC8vIHJlZHJhdyBhbGwgZmVhdHVyZXMgd2l0aCB0aG9zZSBiZWxvbmdpbmcgdG8gdGhlIHNwZWNpZmllZCBpbWFnZVxuXHRcdHZhciByZWZyZXNoQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoZSwgaW1hZ2UpIHtcblx0XHRcdC8vIGNsZWFyIGZlYXR1cmVzIG9mIHByZXZpb3VzIGltYWdlXG4gICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLmNsZWFyKCk7XG5cdFx0XHRfdGhpcy5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgbGFzdERyYXduRmVhdHVyZSA9IG51bGw7XG5cblx0XHRcdGFubm90YXRpb25zLnF1ZXJ5KHtpZDogaW1hZ2UuX2lkfSkuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGFubm90YXRpb25zLmZvckVhY2goY3JlYXRlRmVhdHVyZSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG4gICAgICAgIC8vIGhhbmRsZSBhIG5ld2x5IGRyYXduIGFubm90YXRpb25cblx0XHR2YXIgaGFuZGxlTmV3RmVhdHVyZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgZ2VvbWV0cnkgPSBlLmZlYXR1cmUuZ2V0R2VvbWV0cnkoKTtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IGxhYmVscy5nZXRTZWxlY3RlZCgpO1xuXG4gICAgICAgICAgICBlLmZlYXR1cmUuY29sb3IgPSBsYWJlbC5jb2xvcjtcblxuXHRcdFx0ZS5mZWF0dXJlLmFubm90YXRpb24gPSBhbm5vdGF0aW9ucy5hZGQoe1xuXHRcdFx0XHRpZDogaW1hZ2VzLmdldEN1cnJlbnRJZCgpLFxuXHRcdFx0XHRzaGFwZTogZ2VvbWV0cnkuZ2V0VHlwZSgpLFxuXHRcdFx0XHRwb2ludHM6IGdldENvb3JkaW5hdGVzKGdlb21ldHJ5KSxcbiAgICAgICAgICAgICAgICBsYWJlbF9pZDogbGFiZWwuaWQsXG4gICAgICAgICAgICAgICAgY29uZmlkZW5jZTogbGFiZWxzLmdldEN1cnJlbnRDb25maWRlbmNlKClcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBpZiB0aGUgZmVhdHVyZSBjb3VsZG4ndCBiZSBzYXZlZCwgcmVtb3ZlIGl0IGFnYWluXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbi4kcHJvbWlzZS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5yZW1vdmVGZWF0dXJlKGUuZmVhdHVyZSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0ZS5mZWF0dXJlLm9uKCdjaGFuZ2UnLCBoYW5kbGVHZW9tZXRyeUNoYW5nZSk7XG5cbiAgICAgICAgICAgIGxhc3REcmF3bkZlYXR1cmUgPSBlLmZlYXR1cmU7XG5cbiAgICAgICAgICAgIHJldHVybiBlLmZlYXR1cmUuYW5ub3RhdGlvbi4kcHJvbWlzZTtcblx0XHR9O1xuXG4gICAgICAgIC8vIGhhbmRsZSB0aGUgcmVtb3ZhbCBvZiBhbiBhbm5vdGF0aW9uXG4gICAgICAgIHZhciByZW1vdmVGZWF0dXJlID0gZnVuY3Rpb24gKGZlYXR1cmUpIHtcbiAgICAgICAgICAgIGlmIChmZWF0dXJlID09PSBsYXN0RHJhd25GZWF0dXJlKSB7XG4gICAgICAgICAgICAgICAgbGFzdERyYXduRmVhdHVyZSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFubm90YXRpb25zLmRlbGV0ZShmZWF0dXJlLmFubm90YXRpb24pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UucmVtb3ZlRmVhdHVyZShmZWF0dXJlKTtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZEZlYXR1cmVzLnJlbW92ZShmZWF0dXJlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJldHVybnMgdHJ1ZSBpZiB0aGUgc3VwcGxpZWQgYW5ub3RhdGlvbiBoYXMgYSBsYWJlbCBvZiB0aGUgc2FtZSBjYXRlZ29yeSB0aGFuXG4gICAgICAgIC8vIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgY2F0ZWdvcnlcbiAgICAgICAgdmFyIGFubm90YXRpb25IYXNDdXJyZW50TGFiZWwgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgaWYgKCFhbm5vdGF0aW9uLmxhYmVscykgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgdmFyIGlkID0gbGFiZWxzLmdldFNlbGVjdGVkSWQoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5ub3RhdGlvbi5sYWJlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIWFubm90YXRpb24ubGFiZWxzW2ldLmxhYmVsKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBpZiAoYW5ub3RhdGlvbi5sYWJlbHNbaV0ubGFiZWwuaWQgPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGZpbHRlcnMgb3V0IGFueSBhbm5vdGF0aW9uIHRoYXQgZG9lc1xuICAgICAgICB2YXIgZmlsdGVyQW5ub3RhdGlvbnNMYWJlbENhdGVnb3J5ID0gZnVuY3Rpb24gKGZlYXR1cmUpIHtcbiAgICAgICAgICAgIHJldHVybiAhcmVzdHJpY3RMYWJlbENhdGVnb3J5IHx8IGFubm90YXRpb25IYXNDdXJyZW50TGFiZWwoZmVhdHVyZS5hbm5vdGF0aW9uKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZ2V0RmlsdGVyZWRBbm5vdGF0aW9uRmVhdHVyZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYW5ub3RhdGlvbkZlYXR1cmVzLmdldEFycmF5KCkuZmlsdGVyKGZpbHRlckFubm90YXRpb25zTGFiZWxDYXRlZ29yeSk7XG4gICAgICAgIH07XG5cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIF9zY29wZSA9IHNjb3BlO1xuICAgICAgICAgICAgbWFwLmFkZExheWVyKGFubm90YXRpb25MYXllcik7XG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24oc2VsZWN0KTtcbiAgICAgICAgICAgIG1hcC5hZGRJbnRlcmFjdGlvbih0cmFuc2xhdGUpO1xuICAgICAgICAgICAgbWFwLmFkZEludGVyYWN0aW9uKG1vZGlmeSk7XG5cdFx0XHRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgcmVmcmVzaEFubm90YXRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGFwcGx5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGlmIG5vdCBhbHJlYWR5IGRpZ2VzdGluZywgZGlnZXN0XG4gICAgICAgICAgICAgICAgaWYgKCFzY29wZS4kJHBoYXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHByb3BhZ2F0ZSBuZXcgc2VsZWN0aW9ucyB0aHJvdWdoIHRoZSBhbmd1bGFyIGFwcGxpY2F0aW9uXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMub24oJ2NoYW5nZTpsZW5ndGgnLCBhcHBseSk7XG5cdFx0fTtcblxuICAgICAgICAvLyBwdXQgdGhlIG1hcCBpbnRvIGRyYXdpbmcgbW9kZVxuXHRcdHRoaXMuc3RhcnREcmF3aW5nID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgICAgIHNlbGVjdC5zZXRBY3RpdmUoZmFsc2UpO1xuICAgICAgICAgICAgbW9kaWZ5LnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgICAgIF90aGlzLmZpbmlzaE1vdmluZygpO1xuICAgICAgICAgICAgLy8gYWxsb3cgb25seSBvbmUgZHJhdyBpbnRlcmFjdGlvbiBhdCBhIHRpbWVcbiAgICAgICAgICAgIG1hcC5yZW1vdmVJbnRlcmFjdGlvbihkcmF3KTtcblxuXHRcdFx0ZHJhd2luZ1R5cGUgPSB0eXBlIHx8ICdQb2ludCc7XG5cdFx0XHRkcmF3ID0gbmV3IG9sLmludGVyYWN0aW9uLkRyYXcoe1xuICAgICAgICAgICAgICAgIHNvdXJjZTogYW5ub3RhdGlvblNvdXJjZSxcblx0XHRcdFx0dHlwZTogZHJhd2luZ1R5cGUsXG5cdFx0XHRcdHN0eWxlOiBzdHlsZXMuZWRpdGluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihkcmF3KTtcblx0XHRcdGRyYXcub24oJ2RyYXdlbmQnLCBoYW5kbGVOZXdGZWF0dXJlKTtcbiAgICAgICAgICAgIGRyYXcub24oJ2RyYXdlbmQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIF9zY29wZS4kYnJvYWRjYXN0KCdhbm5vdGF0aW9ucy5kcmF3bicsIGUuZmVhdHVyZSk7XG4gICAgICAgICAgICB9KTtcblx0XHR9O1xuXG4gICAgICAgIC8vIHB1dCB0aGUgbWFwIG91dCBvZiBkcmF3aW5nIG1vZGVcblx0XHR0aGlzLmZpbmlzaERyYXdpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtYXAucmVtb3ZlSW50ZXJhY3Rpb24oZHJhdyk7XG4gICAgICAgICAgICBkcmF3LnNldEFjdGl2ZShmYWxzZSk7XG4gICAgICAgICAgICBkcmF3aW5nVHlwZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHNlbGVjdC5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgICAgICBtb2RpZnkuc2V0QWN0aXZlKGZhbHNlKTtcblx0XHRcdC8vIGRvbid0IHNlbGVjdCB0aGUgbGFzdCBkcmF3biBwb2ludFxuXHRcdFx0X3RoaXMuY2xlYXJTZWxlY3Rpb24oKTtcblx0XHR9O1xuXG4gICAgICAgIHRoaXMuaXNEcmF3aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRyYXcgJiYgZHJhdy5nZXRBY3RpdmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBwdXQgdGhlIG1hcCBpbnRvIG1vdmluZyBtb2RlIChvZiBhbiBhbm5vdGF0aW9uKVxuICAgICAgICB0aGlzLnN0YXJ0TW92aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLmlzRHJhd2luZygpKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuZmluaXNoRHJhd2luZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJhbnNsYXRlLnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmZpbmlzaE1vdmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRyYW5zbGF0ZS5zZXRBY3RpdmUoZmFsc2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaXNNb3ZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJhbnNsYXRlLmdldEFjdGl2ZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzRHJhd25Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhbGFzdERyYXduRmVhdHVyZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlbGV0ZUxhc3REcmF3bkFubm90YXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZW1vdmVGZWF0dXJlKGxhc3REcmF3bkZlYXR1cmUpO1xuICAgICAgICB9O1xuXG5cdFx0dGhpcy5kZWxldGVTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMuZm9yRWFjaChyZW1vdmVGZWF0dXJlKTtcblx0XHR9O1xuXG4gICAgICAgIC8vIHByb2dyYW1tYXRpY2FsbHkgc2VsZWN0IGFuIGFubm90YXRpb24gKG5vdCB0aHJvdWdoIHRoZSBzZWxlY3QgaW50ZXJhY3Rpb24pXG5cdFx0dGhpcy5zZWxlY3QgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBmZWF0dXJlO1xuXHRcdFx0YW5ub3RhdGlvblNvdXJjZS5mb3JFYWNoRmVhdHVyZShmdW5jdGlvbiAoZikge1xuXHRcdFx0XHRpZiAoZi5hbm5vdGF0aW9uLmlkID09PSBpZCkge1xuXHRcdFx0XHRcdGZlYXR1cmUgPSBmO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIHJlbW92ZSBzZWxlY3Rpb24gaWYgZmVhdHVyZSB3YXMgYWxyZWFkeSBzZWxlY3RlZC4gb3RoZXJ3aXNlIHNlbGVjdC5cblx0XHRcdGlmICghc2VsZWN0ZWRGZWF0dXJlcy5yZW1vdmUoZmVhdHVyZSkpIHtcblx0XHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5wdXNoKGZlYXR1cmUpO1xuXHRcdFx0fVxuXHRcdH07XG5cbiAgICAgICAgdGhpcy5oYXNTZWxlY3RlZEZlYXR1cmVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGVkRmVhdHVyZXMuZ2V0TGVuZ3RoKCkgPiAwO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGZpdHMgdGhlIHZpZXcgdG8gdGhlIGdpdmVuIGZlYXR1cmUgKGlkKVxuICAgICAgICB0aGlzLmZpdCA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5mb3JFYWNoRmVhdHVyZShmdW5jdGlvbiAoZikge1xuICAgICAgICAgICAgICAgIGlmIChmLmFubm90YXRpb24uaWQgPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFuaW1hdGUgZml0XG4gICAgICAgICAgICAgICAgICAgIHZhciB2aWV3ID0gbWFwLmdldFZpZXcoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhbiA9IG9sLmFuaW1hdGlvbi5wYW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiB2aWV3LmdldENlbnRlcigpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgem9vbSA9IG9sLmFuaW1hdGlvbi56b29tKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdXRpb246IHZpZXcuZ2V0UmVzb2x1dGlvbigpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBtYXAuYmVmb3JlUmVuZGVyKHBhbiwgem9vbSk7XG4gICAgICAgICAgICAgICAgICAgIHZpZXcuZml0KGYuZ2V0R2VvbWV0cnkoKSwgbWFwLmdldFNpemUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cblx0XHR0aGlzLmNsZWFyU2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5jbGVhcigpO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldFNlbGVjdGVkRmVhdHVyZXMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gc2VsZWN0ZWRGZWF0dXJlcztcblx0XHR9O1xuXG4gICAgICAgIHRoaXMuZ2V0U2VsZWN0ZWREcmF3aW5nVHlwZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBkcmF3aW5nVHlwZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBwcm9ncmFtYXRpY2FsbHkgYWRkIGEgbmV3IGZlYXR1cmUgKG5vdCB0aHJvdWdoIHRoZSBkcmF3IGludGVyYWN0aW9uKVxuICAgICAgICB0aGlzLmFkZEZlYXR1cmUgPSBmdW5jdGlvbiAoZmVhdHVyZSkge1xuICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5hZGRGZWF0dXJlKGZlYXR1cmUpO1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZU5ld0ZlYXR1cmUoe2ZlYXR1cmU6IGZlYXR1cmV9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldE9wYWNpdHkgPSBmdW5jdGlvbiAob3BhY2l0eSkge1xuICAgICAgICAgICAgYW5ub3RhdGlvbkxheWVyLnNldE9wYWNpdHkob3BhY2l0eSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gbW92ZSB0aGUgdmlld3BvcnQgdG8gdGhlIG5leHQgYW5ub3RhdGlvblxuICAgICAgICB0aGlzLmN5Y2xlTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggPSAoY3VycmVudEFubm90YXRpb25JbmRleCArIDEpICUgZ2V0RmlsdGVyZWRBbm5vdGF0aW9uRmVhdHVyZXMoKS5sZW5ndGg7XG4gICAgICAgICAgICBfdGhpcy5qdW1wVG9DdXJyZW50KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNOZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIChjdXJyZW50QW5ub3RhdGlvbkluZGV4ICsgMSkgPCBnZXRGaWx0ZXJlZEFubm90YXRpb25GZWF0dXJlcygpLmxlbmd0aDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBtb3ZlIHRoZSB2aWV3cG9ydCB0byB0aGUgcHJldmlvdXMgYW5ub3RhdGlvblxuICAgICAgICB0aGlzLmN5Y2xlUHJldmlvdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyB3ZSB3YW50IG5vIG5lZ2F0aXZlIGluZGV4IGhlcmVcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBnZXRGaWx0ZXJlZEFubm90YXRpb25GZWF0dXJlcygpLmxlbmd0aDtcbiAgICAgICAgICAgIGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggPSAoY3VycmVudEFubm90YXRpb25JbmRleCArIGxlbmd0aCAtIDEpICUgbGVuZ3RoO1xuICAgICAgICAgICAgX3RoaXMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzUHJldmlvdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudEFubm90YXRpb25JbmRleCA+IDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gbW92ZSB0aGUgdmlld3BvcnQgdG8gdGhlIGN1cnJlbnQgYW5ub3RhdGlvblxuICAgICAgICB0aGlzLmp1bXBUb0N1cnJlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBvbmx5IGp1bXAgb25jZSB0aGUgYW5ub3RhdGlvbnMgd2VyZSBsb2FkZWRcbiAgICAgICAgICAgIGFubm90YXRpb25zLmdldFByb21pc2UoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RBbmRTaG93QW5ub3RhdGlvbihnZXRGaWx0ZXJlZEFubm90YXRpb25GZWF0dXJlcygpW2N1cnJlbnRBbm5vdGF0aW9uSW5kZXhdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuanVtcFRvRmlyc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjdXJyZW50QW5ub3RhdGlvbkluZGV4ID0gMDtcbiAgICAgICAgICAgIF90aGlzLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmp1bXBUb0xhc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9ucy5nZXRQcm9taXNlKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGdldEZpbHRlcmVkQW5ub3RhdGlvbkZlYXR1cmVzKCkubGVuZ3RoO1xuICAgICAgICAgICAgICAgIC8vIHdhaXQgZm9yIHRoZSBuZXcgYW5ub3RhdGlvbnMgdG8gYmUgbG9hZGVkXG4gICAgICAgICAgICAgICAgaWYgKGxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50QW5ub3RhdGlvbkluZGV4ID0gbGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX3RoaXMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZmxpY2tlciB0aGUgaGlnaGxpZ2h0ZWQgYW5ub3RhdGlvbiB0byBzaWduYWwgYW4gZXJyb3JcbiAgICAgICAgdGhpcy5mbGlja2VyID0gZnVuY3Rpb24gKGNvdW50KSB7XG4gICAgICAgICAgICB2YXIgYW5ub3RhdGlvbiA9IHNlbGVjdGVkRmVhdHVyZXMuaXRlbSgwKTtcbiAgICAgICAgICAgIGlmICghYW5ub3RhdGlvbikgcmV0dXJuO1xuICAgICAgICAgICAgY291bnQgPSBjb3VudCB8fCAzO1xuXG4gICAgICAgICAgICB2YXIgdG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZEZlYXR1cmVzLmdldExlbmd0aCgpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZEZlYXR1cmVzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRGZWF0dXJlcy5wdXNoKGFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBudW1iZXIgb2YgcmVwZWF0cyBtdXN0IGJlIGV2ZW4sIG90aGVyd2lzZSB0aGUgbGF5ZXIgd291bGQgc3RheSBvbnZpc2libGVcbiAgICAgICAgICAgICRpbnRlcnZhbCh0b2dnbGUsIDEwMCwgY291bnQgKiAyKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEN1cnJlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RmlsdGVyZWRBbm5vdGF0aW9uRmVhdHVyZXMoKVtjdXJyZW50QW5ub3RhdGlvbkluZGV4XS5hbm5vdGF0aW9uO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2V0UmVzdHJpY3RMYWJlbENhdGVnb3J5ID0gZnVuY3Rpb24gKHJlc3RyaWN0KSB7XG4gICAgICAgICAgICByZXN0cmljdExhYmVsQ2F0ZWdvcnkgPSByZXN0cmljdDtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbWFwSW1hZ2VcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGhhbmRsaW5nIHRoZSBpbWFnZSBsYXllciBvbiB0aGUgT3BlbkxheWVycyBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdtYXBJbWFnZScsIGZ1bmN0aW9uIChtYXApIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblx0XHR2YXIgZXh0ZW50ID0gWzAsIDAsIDAsIDBdO1xuXG5cdFx0dmFyIHByb2plY3Rpb24gPSBuZXcgb2wucHJvai5Qcm9qZWN0aW9uKHtcblx0XHRcdGNvZGU6ICdkaWFzLWltYWdlJyxcblx0XHRcdHVuaXRzOiAncGl4ZWxzJyxcblx0XHRcdGV4dGVudDogZXh0ZW50XG5cdFx0fSk7XG5cblx0XHR2YXIgaW1hZ2VMYXllciA9IG5ldyBvbC5sYXllci5JbWFnZSgpO1xuXG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKHNjb3BlKSB7XG5cdFx0XHRtYXAuYWRkTGF5ZXIoaW1hZ2VMYXllcik7XG5cblx0XHRcdC8vIHJlZnJlc2ggdGhlIGltYWdlIHNvdXJjZVxuXHRcdFx0c2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIGZ1bmN0aW9uIChlLCBpbWFnZSkge1xuXHRcdFx0XHRleHRlbnRbMl0gPSBpbWFnZS53aWR0aDtcblx0XHRcdFx0ZXh0ZW50WzNdID0gaW1hZ2UuaGVpZ2h0O1xuXG5cdFx0XHRcdHZhciB6b29tID0gc2NvcGUudmlld3BvcnQuem9vbTtcblxuXHRcdFx0XHR2YXIgY2VudGVyID0gc2NvcGUudmlld3BvcnQuY2VudGVyO1xuXHRcdFx0XHQvLyB2aWV3cG9ydCBjZW50ZXIgaXMgc3RpbGwgdW5pbml0aWFsaXplZFxuXHRcdFx0XHRpZiAoY2VudGVyWzBdID09PSB1bmRlZmluZWQgJiYgY2VudGVyWzFdID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRjZW50ZXIgPSBvbC5leHRlbnQuZ2V0Q2VudGVyKGV4dGVudCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgaW1hZ2VTdGF0aWMgPSBuZXcgb2wuc291cmNlLkltYWdlU3RhdGljKHtcblx0XHRcdFx0XHR1cmw6IGltYWdlLnNyYyxcblx0XHRcdFx0XHRwcm9qZWN0aW9uOiBwcm9qZWN0aW9uLFxuXHRcdFx0XHRcdGltYWdlRXh0ZW50OiBleHRlbnRcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aW1hZ2VMYXllci5zZXRTb3VyY2UoaW1hZ2VTdGF0aWMpO1xuXG5cdFx0XHRcdG1hcC5zZXRWaWV3KG5ldyBvbC5WaWV3KHtcblx0XHRcdFx0XHRwcm9qZWN0aW9uOiBwcm9qZWN0aW9uLFxuXHRcdFx0XHRcdGNlbnRlcjogY2VudGVyLFxuXHRcdFx0XHRcdHpvb206IHpvb20sXG5cdFx0XHRcdFx0em9vbUZhY3RvcjogMS41LFxuXHRcdFx0XHRcdC8vIGFsbG93IGEgbWF4aW11bSBvZiA0eCBtYWduaWZpY2F0aW9uXG5cdFx0XHRcdFx0bWluUmVzb2x1dGlvbjogMC4yNSxcblx0XHRcdFx0XHQvLyByZXN0cmljdCBtb3ZlbWVudFxuXHRcdFx0XHRcdGV4dGVudDogZXh0ZW50XG5cdFx0XHRcdH0pKTtcblxuXHRcdFx0XHQvLyBpZiB6b29tIGlzIG5vdCBpbml0aWFsaXplZCwgZml0IHRoZSB2aWV3IHRvIHRoZSBpbWFnZSBleHRlbnRcblx0XHRcdFx0aWYgKHpvb20gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdG1hcC5nZXRWaWV3KCkuZml0KGV4dGVudCwgbWFwLmdldFNpemUoKSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldEV4dGVudCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBleHRlbnQ7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0UHJvamVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBwcm9qZWN0aW9uO1xuXHRcdH07XG5cbiAgICAgICAgdGhpcy5nZXRMYXllciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZUxheWVyO1xuICAgICAgICB9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBzdHlsZXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBzZXJ2aWNlIGZvciB0aGUgT3BlbkxheWVycyBzdHlsZXNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdzdHlsZXMnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB0aGlzLmNvbG9ycyA9IHtcbiAgICAgICAgICAgIHdoaXRlOiBbMjU1LCAyNTUsIDI1NSwgMV0sXG4gICAgICAgICAgICBibHVlOiBbMCwgMTUzLCAyNTUsIDFdLFxuICAgICAgICAgICAgb3JhbmdlOiAnI2ZmNWUwMCdcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZGVmYXVsdENpcmNsZVJhZGl1cyA9IDY7XG4gICAgICAgIHZhciBkZWZhdWx0U3Ryb2tlV2lkdGggPSAzO1xuXG4gICAgICAgIHZhciBkZWZhdWx0U3Ryb2tlT3V0bGluZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgd2lkdGg6IDVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkU3Ryb2tlT3V0bGluZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgd2lkdGg6IDZcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRTdHJva2UgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlLFxuICAgICAgICAgICAgd2lkdGg6IGRlZmF1bHRTdHJva2VXaWR0aFxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRTdHJva2UgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5vcmFuZ2UsXG4gICAgICAgICAgICB3aWR0aDogZGVmYXVsdFN0cm9rZVdpZHRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBkZWZhdWx0Q2lyY2xlRmlsbCA9IG5ldyBvbC5zdHlsZS5GaWxsKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZENpcmNsZUZpbGwgPSBuZXcgb2wuc3R5bGUuRmlsbCh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMub3JhbmdlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBkZWZhdWx0Q2lyY2xlU3Ryb2tlID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICB3aWR0aDogMlxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRDaXJjbGVTdHJva2UgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcbiAgICAgICAgICAgIHdpZHRoOiBkZWZhdWx0U3Ryb2tlV2lkdGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGVkaXRpbmdDaXJjbGVTdHJva2UgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcbiAgICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgICAgbGluZURhc2g6IFszXVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZWRpdGluZ1N0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLmJsdWUsXG4gICAgICAgICAgICB3aWR0aDogZGVmYXVsdFN0cm9rZVdpZHRoLFxuICAgICAgICAgICAgbGluZURhc2g6IFs1XVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZGVmYXVsdEZpbGwgPSBuZXcgb2wuc3R5bGUuRmlsbCh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMuYmx1ZVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRGaWxsID0gbmV3IG9sLnN0eWxlLkZpbGwoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLm9yYW5nZVxuICAgICAgICB9KTtcblxuXHRcdHRoaXMuZmVhdHVyZXMgPSBmdW5jdGlvbiAoZmVhdHVyZSkge1xuICAgICAgICAgICAgdmFyIGNvbG9yID0gZmVhdHVyZS5jb2xvciA/ICgnIycgKyBmZWF0dXJlLmNvbG9yKSA6IF90aGlzLmNvbG9ycy5ibHVlO1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBuZXcgb2wuc3R5bGUuU3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICBzdHJva2U6IGRlZmF1bHRTdHJva2VPdXRsaW5lLFxuICAgICAgICAgICAgICAgICAgICBpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICByYWRpdXM6IGRlZmF1bHRDaXJjbGVSYWRpdXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGNvbG9yXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZTogZGVmYXVsdENpcmNsZVN0cm9rZVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBvbC5zdHlsZS5TdHlsZSh7XG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogY29sb3IsXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogM1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBdO1xuICAgICAgICB9O1xuXG5cdFx0dGhpcy5oaWdobGlnaHQgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IHNlbGVjdGVkU3Ryb2tlT3V0bGluZSxcblx0XHRcdFx0aW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0XHRcdHJhZGl1czogZGVmYXVsdENpcmNsZVJhZGl1cyxcblx0XHRcdFx0XHRmaWxsOiBzZWxlY3RlZENpcmNsZUZpbGwsXG5cdFx0XHRcdFx0c3Ryb2tlOiBzZWxlY3RlZENpcmNsZVN0cm9rZVxuXHRcdFx0XHR9KSxcbiAgICAgICAgICAgICAgICB6SW5kZXg6IDIwMFxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IHNlbGVjdGVkU3Ryb2tlLFxuICAgICAgICAgICAgICAgIHpJbmRleDogMjAwXG5cdFx0XHR9KVxuXHRcdF07XG5cblx0XHR0aGlzLmVkaXRpbmcgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IGRlZmF1bHRTdHJva2VPdXRsaW5lLFxuXHRcdFx0XHRpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG5cdFx0XHRcdFx0cmFkaXVzOiBkZWZhdWx0Q2lyY2xlUmFkaXVzLFxuXHRcdFx0XHRcdGZpbGw6IGRlZmF1bHRDaXJjbGVGaWxsLFxuXHRcdFx0XHRcdHN0cm9rZTogZWRpdGluZ0NpcmNsZVN0cm9rZVxuXHRcdFx0XHR9KVxuXHRcdFx0fSksXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IGVkaXRpbmdTdHJva2Vcblx0XHRcdH0pXG5cdFx0XTtcblxuXHRcdHRoaXMudmlld3BvcnQgPSBbXG5cdFx0XHRuZXcgb2wuc3R5bGUuU3R5bGUoe1xuXHRcdFx0XHRzdHJva2U6IGRlZmF1bHRTdHJva2UsXG5cdFx0XHR9KSxcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDFcbiAgICAgICAgICAgICAgICB9KVxuXHRcdFx0fSlcblx0XHRdO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSB1cmxQYXJhbXNcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gVGhlIEdFVCBwYXJhbWV0ZXJzIG9mIHRoZSB1cmwuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgndXJsUGFyYW1zJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIHN0YXRlID0ge307XG5cblx0XHQvLyB0cmFuc2Zvcm1zIGEgVVJMIHBhcmFtZXRlciBzdHJpbmcgbGlrZSAjYT0xJmI9MiB0byBhbiBvYmplY3Rcblx0XHR2YXIgZGVjb2RlU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgcGFyYW1zID0gbG9jYXRpb24uaGFzaC5yZXBsYWNlKCcjJywgJycpXG5cdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnJicpO1xuXG5cdFx0XHR2YXIgc3RhdGUgPSB7fTtcblxuXHRcdFx0cGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKHBhcmFtKSB7XG5cdFx0XHRcdC8vIGNhcHR1cmUga2V5LXZhbHVlIHBhaXJzXG5cdFx0XHRcdHZhciBjYXB0dXJlID0gcGFyYW0ubWF0Y2goLyguKylcXD0oLispLyk7XG5cdFx0XHRcdGlmIChjYXB0dXJlICYmIGNhcHR1cmUubGVuZ3RoID09PSAzKSB7XG5cdFx0XHRcdFx0c3RhdGVbY2FwdHVyZVsxXV0gPSBkZWNvZGVVUklDb21wb25lbnQoY2FwdHVyZVsyXSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gc3RhdGU7XG5cdFx0fTtcblxuXHRcdC8vIHRyYW5zZm9ybXMgYW4gb2JqZWN0IHRvIGEgVVJMIHBhcmFtZXRlciBzdHJpbmdcblx0XHR2YXIgZW5jb2RlU3RhdGUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcblx0XHRcdHZhciBwYXJhbXMgPSAnJztcblx0XHRcdGZvciAodmFyIGtleSBpbiBzdGF0ZSkge1xuXHRcdFx0XHRwYXJhbXMgKz0ga2V5ICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0YXRlW2tleV0pICsgJyYnO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHBhcmFtcy5zdWJzdHJpbmcoMCwgcGFyYW1zLmxlbmd0aCAtIDEpO1xuXHRcdH07XG5cblx0XHR0aGlzLnB1c2hTdGF0ZSA9IGZ1bmN0aW9uIChzKSB7XG5cdFx0XHRzdGF0ZS5zbHVnID0gcztcblx0XHRcdGhpc3RvcnkucHVzaFN0YXRlKHN0YXRlLCAnJywgc3RhdGUuc2x1ZyArICcjJyArIGVuY29kZVN0YXRlKHN0YXRlKSk7XG5cdFx0fTtcblxuXHRcdC8vIHNldHMgYSBVUkwgcGFyYW1ldGVyIGFuZCB1cGRhdGVzIHRoZSBoaXN0b3J5IHN0YXRlXG5cdFx0dGhpcy5zZXQgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gcGFyYW1zKSB7XG5cdFx0XHRcdHN0YXRlW2tleV0gPSBwYXJhbXNba2V5XTtcblx0XHRcdH1cblx0XHRcdGhpc3RvcnkucmVwbGFjZVN0YXRlKHN0YXRlLCAnJywgc3RhdGUuc2x1ZyArICcjJyArIGVuY29kZVN0YXRlKHN0YXRlKSk7XG5cdFx0fTtcblxuXHRcdC8vIHJldHVybnMgYSBVUkwgcGFyYW1ldGVyXG5cdFx0dGhpcy5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRyZXR1cm4gc3RhdGVba2V5XTtcblx0XHR9O1xuXG5cdFx0c3RhdGUgPSBoaXN0b3J5LnN0YXRlO1xuXG5cdFx0aWYgKCFzdGF0ZSkge1xuXHRcdFx0c3RhdGUgPSBkZWNvZGVTdGF0ZSgpO1xuXHRcdH1cblx0fVxuKTsiLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIGRlYm91bmNlXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgZGVib3VuY2Ugc2VydmljZSB0byBwZXJmb3JtIGFuIGFjdGlvbiBvbmx5IHdoZW4gdGhpcyBmdW5jdGlvblxuICogd2Fzbid0IGNhbGxlZCBhZ2FpbiBpbiBhIHNob3J0IHBlcmlvZCBvZiB0aW1lLlxuICogc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEzMzIwMDE2LzE3OTY1MjNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5mYWN0b3J5KCdkZWJvdW5jZScsIGZ1bmN0aW9uICgkdGltZW91dCwgJHEpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciB0aW1lb3V0cyA9IHt9O1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChmdW5jLCB3YWl0LCBpZCkge1xuXHRcdFx0Ly8gQ3JlYXRlIGEgZGVmZXJyZWQgb2JqZWN0IHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHdlIG5lZWQgdG9cblx0XHRcdC8vIGFjdHVhbGx5IGNhbGwgdGhlIGZ1bmNcblx0XHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0XHRcdHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHRpbWVvdXRzW2lkXSA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncykpO1xuXHRcdFx0XHRcdGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aWYgKHRpbWVvdXRzW2lkXSkge1xuXHRcdFx0XHRcdCR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0c1tpZF0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRpbWVvdXRzW2lkXSA9ICR0aW1lb3V0KGxhdGVyLCB3YWl0KTtcblx0XHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG5cdFx0XHR9KSgpO1xuXHRcdH07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBtYXBcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBmYWN0b3J5IGhhbmRsaW5nIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZmFjdG9yeSgnbWFwJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIG1hcCA9IG5ldyBvbC5NYXAoe1xuXHRcdFx0dGFyZ2V0OiAnY2FudmFzJyxcbiAgICAgICAgICAgIHJlbmRlcmVyOiAnY2FudmFzJyxcblx0XHRcdGNvbnRyb2xzOiBbXG5cdFx0XHRcdG5ldyBvbC5jb250cm9sLlpvb20oKSxcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuWm9vbVRvRXh0ZW50KCksXG5cdFx0XHRcdG5ldyBvbC5jb250cm9sLkZ1bGxTY3JlZW4oKVxuXHRcdFx0XSxcbiAgICAgICAgICAgIGludGVyYWN0aW9uczogb2wuaW50ZXJhY3Rpb24uZGVmYXVsdHMoe1xuICAgICAgICAgICAgICAgIGtleWJvYXJkOiBmYWxzZVxuICAgICAgICAgICAgfSlcblx0XHR9KTtcblxuXHRcdHJldHVybiBtYXA7XG5cdH1cbik7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
