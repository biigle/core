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

        var lastDrawnFeature;

        var _this = this;

        // scope of the CanvasController
        var _scope;

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
            lastDrawnFeature = null;

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

            lastDrawnFeature = e.feature;

            return e.feature.annotation.$promise;
		};

        var removeFeature = function (feature) {
            if (feature === lastDrawnFeature) {
                lastDrawnFeature = null;
            }

            annotations.delete(feature.annotation).then(function () {
                annotationSource.removeFeature(feature);
                selectedFeatures.remove(feature);
            });
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

        this.hasDrawnAnnotation = function () {
            return !!lastDrawnFeature;
        };

        this.deleteLastDrawnAnnotation = function () {
            removeFeature(lastDrawnFeature);
        };

		this.deleteSelected = function () {
			selectedFeatures.forEach(removeFeature);
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

        this.hasSelectedFeatures = function () {
            return selectedFeatures.getLength() > 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0b3JDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ2FudmFzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NhdGVnb3JpZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ29uZmlkZW5jZUNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9EcmF3aW5nQ29udHJvbHNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvRWRpdENvbnRyb2xzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL01pbmltYXBDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2VsZWN0ZWRMYWJlbENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TZXR0aW5nc0Fubm90YXRpb25PcGFjaXR5Q29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NldHRpbmdzQW5ub3RhdGlvbnNDeWNsaW5nQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NldHRpbmdzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NldHRpbmdzU2VjdGlvbkN5Y2xpbmdDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2lkZWJhckNhdGVnb3J5Rm9sZG91dENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TaWRlYmFyQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvYW5ub3RhdGlvbkxpc3RJdGVtLmpzIiwiZGlyZWN0aXZlcy9sYWJlbENhdGVnb3J5SXRlbS5qcyIsImRpcmVjdGl2ZXMvbGFiZWxJdGVtLmpzIiwiZmFjdG9yaWVzL2RlYm91bmNlLmpzIiwiZmFjdG9yaWVzL21hcC5qcyIsInNlcnZpY2VzL2Fubm90YXRpb25zLmpzIiwic2VydmljZXMvaW1hZ2VzLmpzIiwic2VydmljZXMva2V5Ym9hcmQuanMiLCJzZXJ2aWNlcy9sYWJlbHMuanMiLCJzZXJ2aWNlcy9tYXBBbm5vdGF0aW9ucy5qcyIsInNlcnZpY2VzL21hcEltYWdlLmpzIiwic2VydmljZXMvc3R5bGVzLmpzIiwic2VydmljZXMvdXJsUGFyYW1zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLG9CQUFBLENBQUEsWUFBQTs7Ozs7Ozs7O0FDR0EsUUFBQSxPQUFBLG9CQUFBLFdBQUEseUZBQUEsVUFBQSxRQUFBLGdCQUFBLFFBQUEsYUFBQSxRQUFBO0VBQ0E7O1FBRUEsSUFBQSxtQkFBQSxlQUFBOztFQUVBLE9BQUEsbUJBQUEsaUJBQUE7O0VBRUEsSUFBQSxxQkFBQSxZQUFBO0dBQ0EsT0FBQSxjQUFBLFlBQUE7OztFQUdBLE9BQUEsY0FBQTs7RUFFQSxPQUFBLGlCQUFBLGVBQUE7O0VBRUEsT0FBQSxtQkFBQSxVQUFBLEdBQUEsSUFBQTs7R0FFQSxJQUFBLENBQUEsRUFBQSxVQUFBO0lBQ0EsT0FBQTs7R0FFQSxlQUFBLE9BQUE7OztRQUdBLE9BQUEsZ0JBQUEsZUFBQTs7RUFFQSxPQUFBLGFBQUEsVUFBQSxJQUFBO0dBQ0EsSUFBQSxXQUFBO0dBQ0EsaUJBQUEsUUFBQSxVQUFBLFNBQUE7SUFDQSxJQUFBLFFBQUEsY0FBQSxRQUFBLFdBQUEsTUFBQSxJQUFBO0tBQ0EsV0FBQTs7O0dBR0EsT0FBQTs7O0VBR0EsT0FBQSxJQUFBLGVBQUE7Ozs7Ozs7Ozs7O0FDbkNBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLHdGQUFBLFVBQUEsUUFBQSxRQUFBLFdBQUEsS0FBQSxVQUFBLFVBQUE7UUFDQTs7UUFFQSxPQUFBLFNBQUE7UUFDQSxPQUFBLGVBQUE7OztRQUdBLE9BQUEsV0FBQTtZQUNBLE1BQUEsVUFBQSxJQUFBO1lBQ0EsUUFBQSxDQUFBLFVBQUEsSUFBQSxNQUFBLFVBQUEsSUFBQTs7OztRQUlBLElBQUEsZ0JBQUEsWUFBQTtZQUNBLE9BQUEsZUFBQTtZQUNBLE9BQUEsV0FBQSxlQUFBLE9BQUEsT0FBQTs7OztRQUlBLElBQUEsWUFBQSxZQUFBO1lBQ0EsVUFBQSxVQUFBLE9BQUEsT0FBQSxhQUFBOzs7O1FBSUEsSUFBQSxlQUFBLFlBQUE7WUFDQSxPQUFBLGVBQUE7Ozs7UUFJQSxJQUFBLFlBQUEsVUFBQSxJQUFBO1lBQ0E7WUFDQSxPQUFBLE9BQUEsS0FBQSxTQUFBOzBCQUNBLEtBQUE7MEJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxZQUFBLFlBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQTttQkFDQSxLQUFBO21CQUNBLEtBQUE7bUJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxZQUFBLFlBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQTttQkFDQSxLQUFBO21CQUNBLEtBQUE7bUJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxJQUFBLGtCQUFBLFNBQUEsR0FBQSxRQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsT0FBQTtZQUNBLE9BQUEsU0FBQSxPQUFBLEtBQUEsS0FBQSxNQUFBLE9BQUEsT0FBQTtZQUNBLE9BQUEsU0FBQSxPQUFBLEtBQUEsS0FBQSxNQUFBLE9BQUEsT0FBQTtZQUNBLFVBQUEsSUFBQTtnQkFDQSxHQUFBLE9BQUEsU0FBQTtnQkFDQSxHQUFBLE9BQUEsU0FBQSxPQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBLE9BQUE7Ozs7UUFJQSxTQUFBLEdBQUEsSUFBQSxZQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxJQUFBLFlBQUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLElBQUEsWUFBQTtZQUNBLE9BQUE7WUFDQSxPQUFBOzs7O1FBSUEsT0FBQSxhQUFBLFNBQUEsR0FBQTtZQUNBLElBQUEsUUFBQSxFQUFBO1lBQ0EsSUFBQSxTQUFBLE1BQUEsU0FBQSxXQUFBO2dCQUNBLFVBQUEsTUFBQTs7Ozs7UUFLQSxPQUFBOztRQUVBLFVBQUEsVUFBQSxLQUFBOzs7Ozs7Ozs7OztBQzVGQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSw0RkFBQSxVQUFBLFFBQUEsVUFBQSxnQkFBQSxLQUFBLFVBQUEsVUFBQTtFQUNBOztRQUVBLElBQUEsVUFBQSxJQUFBOzs7RUFHQSxJQUFBLEdBQUEsV0FBQSxTQUFBLEdBQUE7WUFDQSxJQUFBLE9BQUEsWUFBQTtnQkFDQSxPQUFBLE1BQUEsa0JBQUE7b0JBQ0EsUUFBQSxRQUFBO29CQUNBLE1BQUEsUUFBQTs7Ozs7WUFLQSxTQUFBLE1BQUEsS0FBQTs7O1FBR0EsSUFBQSxHQUFBLGVBQUEsWUFBQTtZQUNBLFVBQUEsSUFBQTs7O0VBR0EsU0FBQSxLQUFBO0VBQ0EsZUFBQSxLQUFBOztFQUVBLElBQUEsYUFBQSxZQUFBOzs7R0FHQSxTQUFBLFdBQUE7O0lBRUEsSUFBQTtNQUNBLElBQUE7OztFQUdBLE9BQUEsSUFBQSx3QkFBQTtFQUNBLE9BQUEsSUFBQSx5QkFBQTs7Ozs7Ozs7Ozs7QUNuQ0EsUUFBQSxPQUFBLG9CQUFBLFdBQUEseURBQUEsVUFBQSxRQUFBLFFBQUEsVUFBQTtRQUNBOzs7UUFHQSxJQUFBLGdCQUFBO1FBQ0EsSUFBQSx1QkFBQTs7O1FBR0EsSUFBQSxrQkFBQSxZQUFBO1lBQ0EsSUFBQSxNQUFBLE9BQUEsV0FBQSxJQUFBLFVBQUEsTUFBQTtnQkFDQSxPQUFBLEtBQUE7O1lBRUEsT0FBQSxhQUFBLHdCQUFBLEtBQUEsVUFBQTs7OztRQUlBLElBQUEsaUJBQUEsWUFBQTtZQUNBLElBQUEsT0FBQSxhQUFBLHVCQUFBO2dCQUNBLElBQUEsTUFBQSxLQUFBLE1BQUEsT0FBQSxhQUFBO2dCQUNBLE9BQUEsYUFBQSxPQUFBLFdBQUEsT0FBQSxVQUFBLE1BQUE7O29CQUVBLE9BQUEsSUFBQSxRQUFBLEtBQUEsUUFBQSxDQUFBOzs7OztRQUtBLElBQUEsa0JBQUEsVUFBQSxPQUFBO1lBQ0EsSUFBQSxTQUFBLEtBQUEsUUFBQSxPQUFBLFdBQUEsUUFBQTtnQkFDQSxPQUFBLFdBQUEsT0FBQSxXQUFBOzs7O1FBSUEsT0FBQSxhQUFBLENBQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBO1FBQ0EsT0FBQSxhQUFBO1FBQ0EsT0FBQSxhQUFBO1FBQ0EsT0FBQSxRQUFBLEtBQUEsVUFBQSxLQUFBO1lBQ0EsS0FBQSxJQUFBLE9BQUEsS0FBQTtnQkFDQSxPQUFBLGFBQUEsT0FBQSxXQUFBLE9BQUEsSUFBQTs7WUFFQTs7O1FBR0EsT0FBQSxpQkFBQSxPQUFBOztRQUVBLE9BQUEsYUFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBLGlCQUFBO1lBQ0EsT0FBQSxXQUFBLHVCQUFBOzs7UUFHQSxPQUFBLGNBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxPQUFBLFdBQUEsUUFBQSxVQUFBLENBQUE7Ozs7UUFJQSxPQUFBLGtCQUFBLFVBQUEsR0FBQSxNQUFBO1lBQ0EsRUFBQTtZQUNBLElBQUEsUUFBQSxPQUFBLFdBQUEsUUFBQTtZQUNBLElBQUEsVUFBQSxDQUFBLEtBQUEsT0FBQSxXQUFBLFNBQUEsZUFBQTtnQkFDQSxPQUFBLFdBQUEsS0FBQTttQkFDQTtnQkFDQSxPQUFBLFdBQUEsT0FBQSxPQUFBOztZQUVBOzs7O1FBSUEsT0FBQSxpQkFBQSxZQUFBO1lBQ0EsT0FBQSxPQUFBLFdBQUEsU0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdC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LFVBQUE7O0dBRUEsY0FBQTs7O1FBR0EsSUFBQSxVQUFBLElBQUE7UUFDQSxJQUFBLFVBQUEsSUFBQTs7O0VBR0EsUUFBQSxTQUFBLFNBQUE7UUFDQSxRQUFBLFNBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLFFBQUE7WUFDQSxPQUFBLE9BQUE7OztFQUdBLElBQUEsV0FBQSxJQUFBLEdBQUE7RUFDQSxlQUFBLFdBQUE7OztFQUdBLE9BQUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxRQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7SUFDQSxZQUFBLFNBQUE7SUFDQSxRQUFBLEdBQUEsT0FBQSxVQUFBLFNBQUE7SUFDQSxNQUFBOzs7OztFQUtBLElBQUEsa0JBQUEsWUFBQTtHQUNBLFNBQUEsWUFBQSxHQUFBLEtBQUEsUUFBQSxXQUFBLFFBQUEsZ0JBQUE7OztRQUdBLElBQUEsR0FBQSxlQUFBLFlBQUE7WUFDQSxVQUFBLElBQUE7OztRQUdBLElBQUEsR0FBQSxlQUFBLFlBQUE7WUFDQSxVQUFBLElBQUE7OztFQUdBLElBQUEsR0FBQSxlQUFBOztFQUVBLElBQUEsZUFBQSxVQUFBLEdBQUE7R0FDQSxRQUFBLFVBQUEsRUFBQTs7O0VBR0EsUUFBQSxHQUFBLGVBQUE7O0VBRUEsU0FBQSxHQUFBLGNBQUEsWUFBQTtHQUNBLFFBQUEsR0FBQSxlQUFBOzs7RUFHQSxTQUFBLEdBQUEsY0FBQSxZQUFBO0dBQ0EsUUFBQSxHQUFBLGVBQUE7Ozs7Ozs7Ozs7OztBQzdEQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSxnREFBQSxVQUFBLFFBQUEsUUFBQTtFQUNBOztRQUVBLE9BQUEsbUJBQUEsT0FBQTs7UUFFQSxPQUFBLG1CQUFBLE9BQUE7Ozs7Ozs7Ozs7O0FDTEEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsb0VBQUEsVUFBQSxRQUFBLGdCQUFBO1FBQ0E7O1FBRUEsT0FBQSxtQkFBQSxzQkFBQTtRQUNBLE9BQUEsT0FBQSwrQkFBQSxVQUFBLFNBQUE7WUFDQSxlQUFBLFdBQUE7Ozs7Ozs7Ozs7OztBQ0xBLFFBQUEsT0FBQSxv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QUFBLGVBQUEsWUFBQTtZQUNBLE9BQUEsSUFBQTs7WUFFQSxLQUFBLEdBQUEscUJBQUE7WUFDQSxJQUFBLGNBQUEsU0FBQTtZQUNBLElBQUEsYUFBQSxLQUFBLGdCQUFBLElBQUE7O1lBRUEsU0FBQSxLQUFBLFdBQUEsS0FBQSxXQUFBO1lBQ0EsU0FBQSxLQUFBLFdBQUEsS0FBQSxXQUFBOzs7WUFHQSxZQUFBLEtBQUEsU0FBQSxLQUFBO1lBQ0EsWUFBQSxLQUFBLFNBQUEsS0FBQTs7OztZQUlBLFVBQUEsS0FBQSxLQUFBLEtBQUEsWUFBQSxLQUFBLFNBQUEsTUFBQTtZQUNBLFVBQUEsS0FBQSxLQUFBLEtBQUEsWUFBQSxLQUFBLFNBQUEsTUFBQTs7WUFFQSxJQUFBO1lBQ0EsSUFBQSxVQUFBLEtBQUEsR0FBQTs7Z0JBRUEsVUFBQSxDQUFBLFNBQUEsTUFBQSxVQUFBLEtBQUEsTUFBQSxZQUFBO2dCQUNBLFNBQUEsTUFBQSxVQUFBLFVBQUE7bUJBQ0E7Z0JBQ0EsU0FBQSxLQUFBLFdBQUE7O2dCQUVBLFlBQUEsS0FBQSxZQUFBLEtBQUE7OztZQUdBLElBQUEsVUFBQSxLQUFBLEdBQUE7O2dCQUVBLFVBQUEsQ0FBQSxTQUFBLE1BQUEsVUFBQSxLQUFBLE1BQUEsWUFBQTtnQkFDQSxTQUFBLE1BQUEsVUFBQSxVQUFBO21CQUNBO2dCQUNBLFNBQUEsS0FBQSxXQUFBOztnQkFFQSxZQUFBLEtBQUEsWUFBQSxLQUFBOzs7O1FBSUEsSUFBQSxpQkFBQSxZQUFBO1lBQ0E7OztZQUdBLElBQUEsT0FBQSxnQkFBQSxnQkFBQTtZQUNBLFlBQUEsS0FBQSxLQUFBO1lBQ0EsWUFBQSxLQUFBLEtBQUE7OztRQUdBLElBQUEsa0JBQUEsWUFBQTtZQUNBO1lBQ0EsU0FBQSxnQkFBQSxLQUFBOzs7UUFHQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxTQUFBLENBQUEsR0FBQTs7O1FBR0EsSUFBQSxjQUFBLFlBQUE7WUFDQSxTQUFBOzs7UUFHQSxJQUFBLGtCQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUE7Z0JBQ0EsS0FBQSxLQUFBLFNBQUEsS0FBQSxZQUFBO2dCQUNBLEtBQUEsS0FBQSxTQUFBLEtBQUEsWUFBQTs7OztRQUlBLElBQUEsV0FBQSxVQUFBLE1BQUE7Ozs7Ozs7WUFPQSxZQUFBLEtBQUEsS0FBQTtZQUNBLFlBQUEsS0FBQSxLQUFBO1lBQ0EsS0FBQSxVQUFBLGdCQUFBOzs7UUFHQSxJQUFBLFdBQUEsWUFBQTtZQUNBLElBQUEsWUFBQSxLQUFBLFVBQUEsSUFBQTtnQkFDQSxPQUFBLENBQUEsWUFBQSxLQUFBLEdBQUEsWUFBQTttQkFDQTtnQkFDQSxPQUFBLENBQUEsR0FBQSxZQUFBLEtBQUE7Ozs7UUFJQSxJQUFBLFdBQUEsWUFBQTtZQUNBLElBQUEsWUFBQSxLQUFBLEdBQUE7Z0JBQ0EsT0FBQSxDQUFBLFlBQUEsS0FBQSxHQUFBLFlBQUE7bUJBQ0E7Z0JBQ0EsT0FBQSxDQUFBLFVBQUEsSUFBQSxZQUFBLEtBQUE7Ozs7UUFJQSxJQUFBLGNBQUEsVUFBQSxHQUFBO1lBQ0EsSUFBQSxXQUFBLENBQUEsT0FBQSxXQUFBOztZQUVBLElBQUEsWUFBQSxLQUFBLFVBQUEsTUFBQSxZQUFBLEtBQUEsVUFBQSxJQUFBO2dCQUNBLFNBQUE7bUJBQ0E7Z0JBQ0EsT0FBQSxZQUFBLEtBQUEsY0FBQSxLQUFBO2dCQUNBLFVBQUE7OztZQUdBLElBQUEsR0FBQTs7Z0JBRUEsT0FBQTs7OztZQUlBLE9BQUE7OztRQUdBLElBQUEsY0FBQSxVQUFBLEdBQUE7WUFDQSxJQUFBLFdBQUEsQ0FBQSxPQUFBLFdBQUE7O1lBRUEsSUFBQSxZQUFBLEtBQUEsS0FBQSxZQUFBLEtBQUEsR0FBQTtnQkFDQSxTQUFBO21CQUNBO2dCQUNBLE9BQUEsWUFBQSxLQUFBLGNBQUEsS0FBQTtnQkFDQSxVQUFBOzs7WUFHQSxJQUFBLEdBQUE7O2dCQUVBLE9BQUE7Ozs7WUFJQSxPQUFBOzs7O1FBSUEsSUFBQSxjQUFBLFVBQUEsR0FBQTtZQUNBLEVBQUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsVUFBQSxZQUFBO1lBQ0EsT0FB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QTtFQUNBOztFQUVBLElBQUEsTUFBQSxJQUFBLEdBQUEsSUFBQTtHQUNBLFFBQUE7WUFDQSxVQUFBO0dBQ0EsVUFBQTtJQUNBLElBQUEsR0FBQSxRQUFBO0lBQ0EsSUFBQSxHQUFBLFFBQUE7SUFDQSxJQUFBLEdBQUEsUUFBQTs7WUFFQSxjQUFBLEdBQUEsWUFBQSxTQUFBO2dCQUNBLFVBQUE7Ozs7RUFJQSxPQUFBOzs7Ozs7Ozs7OztBQ2hCQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSwrQ0FBQSxVQUFBLFlBQUEsUUFBQSxLQUFBO0VBQ0E7O0VBRUEsSUFBQTtRQUNBLElBQUE7O0VBRUEsSUFBQSxtQkFBQSxVQUFBLFlBQUE7R0FDQSxXQUFBLFFBQUEsT0FBQSxRQUFBLFdBQUE7R0FDQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBLFVBQUEsWUFBQTtHQUNBLFlBQUEsS0FBQTtHQUNBLE9BQUE7OztFQUdBLEtBQUEsUUFBQSxVQUFBLFFBQUE7R0FDQSxjQUFBLFdBQUEsTUFBQTtZQUNBLFVBQUEsWUFBQTtHQUNBLFFBQUEsS0FBQSxVQUFBLEdBQUE7SUFDQSxFQUFBLFFBQUE7O0dBRUEsT0FBQTs7O0VBR0EsS0FBQSxNQUFBLFVBQUEsUUFBQTtHQUNBLElBQUEsQ0FBQSxPQUFBLFlBQUEsT0FBQSxPQUFBO0lBQ0EsT0FBQSxXQUFBLE9BQUEsTUFBQSxPQUFBOztHQUVBLElBQUEsYUFBQSxXQUFBLElBQUE7R0FDQSxXQUFBO2NBQ0EsS0FBQTtjQUNBLEtBQUE7Y0FDQSxNQUFBLElBQUE7O0dBRUEsT0FBQTs7O0VBR0EsS0FBQSxTQUFBLFVBQUEsWUFBQTs7R0FFQSxJQUFBLFFBQUEsWUFBQSxRQUFBO0dBQ0EsSUFBQSxRQUFBLENBQUEsR0FBQTtJQUNBLE9BQUEsV0FBQSxRQUFBLFlBQUE7OztLQUdBLFFBQUEsWUFBQSxRQUFBO0tBQ0EsWUFBQSxPQUFBLE9BQUE7T0FDQSxJQUFBOzs7O0VBSUEsS0FBQSxVQUFBLFVBQUEsSUFBQTtHQUNBLE9BQUEsWUFBQSxRQUFBOzs7RUFHQSxLQUFBLFVBQUEsWUFBQTtHQUNBLE9BQUE7OztRQUdBLEtBQUEsYUFBQSxZQUFBO1lBQ0EsT0FBQTs7Ozs7Ozs7Ozs7O0FDNURBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLHNGQUFBLFVBQUEsWUFBQSxlQUFBLEtBQUEsSUFBQSxjQUFBLGFBQUE7RUFDQTs7RUFFQSxJQUFBLFFBQUE7O0VBRUEsSUFBQSxXQUFBOztFQUVBLElBQUEsa0JBQUE7O0VBRUEsSUFBQSxTQUFBOzs7RUFHQSxLQUFBLGVBQUE7Ozs7OztFQU1BLElBQUEsU0FBQSxVQUFBLElBQUE7R0FDQSxLQUFBLE1BQUEsTUFBQSxhQUFBO0dBQ0EsSUFBQSxRQUFBLFNBQUEsUUFBQTtHQUNBLE9BQUEsU0FBQSxDQUFBLFFBQUEsS0FBQSxTQUFBOzs7Ozs7O0VBT0EsSUFBQSxTQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsTUFBQSxNQUFBLGFBQUE7R0FDQSxJQUFBLFFBQUEsU0FBQSxRQUFBO0dBQ0EsSUFBQSxTQUFBLFNBQUE7R0FDQSxPQUFBLFNBQUEsQ0FBQSxRQUFBLElBQUEsVUFBQTs7Ozs7OztFQU9BLElBQUEsV0FBQSxVQUFBLElBQUE7R0FDQSxLQUFBLE1BQUEsTUFBQSxhQUFBO0dBQ0EsS0FBQSxJQUFBLElBQUEsT0FBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7SUFDQSxJQUFBLE9BQUEsR0FBQSxPQUFBLElBQUEsT0FBQSxPQUFBOzs7R0FHQSxPQUFBOzs7Ozs7RUFNQSxJQUFBLE9BQUEsVUFBQSxJQUFBO0dBQ0EsTUFBQSxlQUFBLFNBQUE7Ozs7Ozs7O0VBUUEsSUFBQSxhQUFBLFVBQUEsSUFBQTtHQUNBLElBQUEsV0FBQSxHQUFBO0dBQ0EsSUFBQSxNQUFBLFNBQUE7O0dBRUEsSUFBQSxLQUFBO0lBQ0EsU0FBQSxRQUFBO1VBQ0E7SUFDQSxNQUFBLFNBQUEsY0FBQTtJQUNBLElBQUEsTUFBQTtJQUNBLElBQUEsU0FBQSxZQUFBO0tBQ0EsT0FBQSxLQUFBOztLQUVBLElBQUEsT0FBQSxTQUFBLGlCQUFBO01BQ0EsT0FBQTs7S0FFQSxTQUFBLFFBQUE7O0lB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LHFCQUFBLFVBQUEsWUFBQTtZQUNBLElBQUEsQ0FBQSxZQUFBOzs7WUFHQSxJQUFBLENBQUEsV0FBQSxRQUFBO2dCQUNBLFdBQUEsU0FBQSxnQkFBQSxNQUFBO29CQUNBLGVBQUEsV0FBQTs7OztZQUlBLE9BQUEsV0FBQTs7O1FBR0EsS0FBQSxxQkFBQSxVQUFBLFlBQUE7WUFDQSxJQUFBLFFBQUEsZ0JBQUEsT0FBQTtnQkFDQSxlQUFBLFdBQUE7Z0JBQ0EsVUFBQSxjQUFBO2dCQUNBLFlBQUE7OztZQUdBLE1BQUEsU0FBQSxLQUFBLFlBQUE7Z0JBQ0EsV0FBQSxPQUFBLEtBQUE7OztZQUdBLE1BQUEsU0FBQSxNQUFBLElBQUE7O1lBRUEsT0FBQTs7O1FBR0EsS0FBQSx1QkFBQSxVQUFBLFlBQUEsT0FBQTs7WUFFQSxJQUFBLFFBQUEsV0FBQSxPQUFBLFFBQUE7WUFDQSxJQUFBLFFBQUEsQ0FBQSxHQUFBO2dCQUNBLE9BQUEsZ0JBQUEsT0FBQSxDQUFBLElBQUEsTUFBQSxLQUFBLFlBQUE7OztvQkFHQSxRQUFBLFdBQUEsT0FBQSxRQUFBO29CQUNBLFdBQUEsT0FBQSxPQUFBLE9BQUE7bUJBQ0EsSUFBQTs7OztRQUlBLEtBQUEsVUFBQSxZQUFBO1lBQ0EsSUFBQSxPQUFBO1lBQ0EsSUFBQSxNQUFBO1lBQ0EsSUFBQSxRQUFBLFVBQUEsT0FBQTtnQkFDQSxJQUFBLFNBQUEsTUFBQTtnQkFDQSxJQUFBLEtBQUEsS0FBQSxTQUFBO29CQUNBLEtBQUEsS0FBQSxRQUFBLEtBQUE7dUJBQ0E7b0JBQ0EsS0FBQSxLQUFBLFVBQUEsQ0FBQTs7OztZQUlBLEtBQUEsUUFBQSxLQUFBLFVBQUEsUUFBQTtnQkFDQSxLQUFBLE9BQUEsUUFBQTtvQkFDQSxLQUFBLE9BQUE7b0JBQ0EsT0FBQSxLQUFBLFFBQUE7Ozs7WUFJQSxPQUFBOzs7UUFHQSxLQUFBLFNBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLEtBQUEsY0FBQSxVQUFBLE9BQUE7WUFDQSxnQkFBQTs7O1FBR0EsS0FBQSxjQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxLQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUEsQ0FBQSxDQUFBOzs7UUFHQSxLQUFBLHVCQUFBLFVBQUEsWUFBQTtZQUNBLG9CQUFBOzs7UUFHQSxLQUFBLHVCQUFBLFlBQUE7WUFDQSxPQUFBOzs7O1FBSUEsQ0FBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFdBQUEsR0FBQTtZQUNBLE1BQUEsVUFBQSxTQUFBOztZQUVBLElBQUEsV0FBQSxDQUFBOzs7WUFHQSxJQUFBLGVBQUEsWUFBQTtnQkFDQSxJQUFBLEVBQUEsYUFBQSxZQUFBLFFBQUE7b0JBQ0EsU0FBQSxRQUFBOzs7O1lBSUEsT0FBQSxRQUFBLE1BQUEsTUFBQTs7WUFFQSxZQUFBLFFBQUEsVUFBQSxJQUFBO2dCQUNBLFFBQUEsSUFBQSxDQUFBLElBQUEsS0FBQSxVQUFBLFNBQUE7b0JBQ0EsT0FBQSxRQUFBLFFBQUEsYUFBQSxNQUFBLENBQUEsWUFBQSxLQUFBOzs7V0FHQTs7Ozs7Ozs7Ozs7QUN4SEEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsZ0dBQUEsVUFBQSxLQUFBLFFBQUEsYUFBQSxVQUFBLFFBQUEsV0FBQSxRQUFBO0VBQ0E7O1FBRUEsSUFBQSxxQkFBQSxJQUFBLEdBQUE7UUFDQSxJQUFBLG1CQUFBLElBQUEsR0FBQSxPQUFBLE9BQUE7WUFDQSxVQUFBOztRQUVBLElBQUEsa0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLFFBQUE7WUFDQSxPQUFBLE9BQUE7WUFDQSxRQUFBOzs7O0VBSUEsSUFBQSxTQUFBLElBQUEsR0FBQSxZQUFBLE9BQUE7R0FDQSxPQUFBLE9BQUE7WUFDQSxRQUFBLENBQUE7O1lBRUEsT0FBQTs7O0VBR0EsSUFBQSxtQkFBQSxPQUFBOztFQUVBLElBQUEsU0FBQSxJQUFBLEdBQUEsWUFBQSxPQUFBO0dBQ0EsVUFBQTs7OztHQUlBLGlCQUFBLFNBQUEsT0FBQTtJQUNBLE9BQUEsR0FBQSxPQUFBLFVBQUEsYUFBQSxVQUFBLEdBQUEsT0FBQSxVQUFBLFlBQUE7Ozs7UUFJQSxPQUFBLFVBQUE7O1FBRUEsSUFBQSxZQUFBLElBQUEsR0FBQSxZQUFBLFVBQUE7WUFDQSxVQUFBOzs7UUFHQSxVQUFBLFVBQUE7OztFQUdBLElBQUE7O1FBRUEsSUFBQTs7OztRQUlBLElBQUEseUJBQUE7O1FBRUEsSUFBQTs7UUFFQSxJQUFBLFFBQUE7OztRQUdBLElBQUE7O1FBRUEsSUFBQSwwQkFBQSxVQUFBLFlBQUE7WUFDQSxNQUFBO1lBQ0EsSUFBQSxZQUFBO2dCQUNBLGlCQUFBLEtBQUE7Z0JBQ0EsSUFBQSxVQUFBLElBQUEsV0FBQSxlQUFBLElBQUEsV0FBQTtvQkFDQSxTQUFBLENBQUEsSUFBQSxJQUFBLElBQUE7Ozs7Ozs7RUFPQSxJQUFBLHFCQUFBLFVBQUEsT0FBQTtHQUNBLE9BQUEsQ0FBQSxHQUFBLE1BQUEsSUFBQSxHQUFBLE9BQUEsYUFBQSxTQUFBLE1BQUE7Ozs7O0VBS0EsSUFBQSxtQkFBQSxVQUFBLE9BQUE7R0FDQSxPQUFBLENBQUEsTUFBQSxHQUFBLE9BQUEsYUFBQSxTQUFBLE1BQUE7Ozs7O0VBS0EsSUFBQSxpQkFBQSxVQUFBLFVBQUE7R0FDQSxRQUFBLFNBQUE7SUFDQSxLQUFBOztLQUVBLE9BQUEsQ0FBQSxTQUFBLGFBQUEsQ0FBQSxTQUFBLGFBQUE7SUFDQSxLQUFBO0lBQ0EsS0FBQTtLQUNBLE9BQUEsU0FBQSxpQkFBQTtJQUNBLEtBQUE7S0FDQSxPQUFBLENBQUEsU0FBQTtJQUNBO0tBQ0EsT0FBQSxTQUFBOzs7OztFQUtBLElBQUEsdUJBQUEsVUFBQSxHQUFBO0dBQ0EsSUFBQSxVQUFBLEVBQUE7R0FDQSxJQUFBLE9BQUEsWUFBQTtJQUNBLElBQUEsY0FBQSxlQUFBLFFBQUE7SUFDQSxRQUFBLFdBQUEsU0FBQSxZQUFBLElBQUE7SUFDQSxRQUFBLFdBQUE7Ozs7R0FJQSxTQUFBLE1BQUEsS0FBQSxRQUFBLFdBQUE7OztFQUdBLElBQUEsZ0JBQUEsVUFBQSxZQUFBO0dBQ0EsSUFBQTtHQUNBLElBQUEsU0FBQSxXQUFBLE9BQUEsSUFBQTs7R0FFQSxRQUFBLFdBQUE7SUFDQSxLQUFBO0tBQ0EsV0FBQSxJQUFBLEdBQUEsS0FBQSxNQUFBLE9BQUE7S0FDQTtJQUNBLEtBQUE7S0FDQSxXQUFBLElBQUEsR0FBQSxLQUFBLFVBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTs7S0FFQSxXQUFBLElBQUEsR0FBQSxLQUFBLFFBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTtLQUNBLFdBQUEsSUFBQSxHQUFBLEtBQUEsV0FBQTtLQUNBO0lBQ0EsS0FBQTs7S0FFQSxXQUFBLElBQUEsR0FBQSxLQUFBLE9BQUEsT0FBQSxJQUFBLE9BQUEsR0FBQTtLQUNBOztnQkFFQTtvQkFDQSxRQUFBLE1BQUEsK0JBQUEsV0FBQTtvQkFDQTs7O0dBR0EsSUFBQSxVQUFBLElBQUEsR0FBQSxRQUFBLEVBQUEsVUFBQTtZQUNBLFFBQUEsYUFBQTtZQUNBLElBQUEsV0FBQSxVQUFBLFdBQUEsT0FBQSxTQUFBLEdBQUE7Z0JBQ0EsUUFBQSxRQUFBLFdBQUEsT0FBQSxHQUFBLE1BQUE7O0dBRUEsUUFBQSxHQUFBLFVBQUE7WUFDQSxpQkFBQSxXQUFBOzs7RUFHQSxJQUFBLHFCQUFBLFVBQUEsR0FBQSxPQUFBOztZQUVBLGlCQUFBO0dBQ0EsTUFBQTtZQUNBLG1CQUFBOztHQUVBLFlBQUEsTUFBQSxDQUFBLElBQUEsTUFBQSxNQUFBLFNBQUEsS0FBQSxZQUFBO0lBQ0EsWUFBQSxRQUFBOzs7O0VBSUEsSUFBQSxtQkFBQSxVQUFBLEdBQUE7R0FDQSxJQUFBLFdBQUEsRUFBQSxRQUFBO0dBQ0EsSUFBQSxjQUFBLGVBQUE7WUFDQSxJQUFBLFFBQUEsT0FBQTs7WUFFQSxFQUFBLFFBQUEsUUFBQSxNQUFBOztHQUVBLEVBQUEsUUFBQSxhQUFBLFlBQUEsSUFBQTtJQUNBLElBQUEsT0FBQTtJQUNBLE9BQUEsU0FBQTtJQUNBLFFBQUEsWUFBQSxJQUFBO2dCQUNBLFVBQUEsTUFBQTtnQkFDQSxZQUFBLE9BQUE7Ozs7R0FJQSxFQUFBLFFBQUEsV0FBQSxTQUFBLE1BQUEsWUFBQTtnQkFDQSxpQkFBQSxjQUFBLEVBQUE7OztHQUdBLEVBQUEsUUFBQSxHQUFBLFVBQUE7O1lBRUEsbUJBQUEsRUFBQTs7WUFFQSxPQUFBLEVBQUEsUUFBQSxXQUFBOzs7UUFHQSxJQUFBLGdCQUFBLFVBQUEsU0FBQTtZQUNBLElBQUEsWUFBQSxrQkFBQTtnQkFDQSxtQkFBQTs7O1lBR0EsWUFBQSxPQUFBLFFBQUEsWUFBQSxLQUFBLFlBQUE7Z0JBQ0EsaUJBQUEsY0FBQTtnQkFDQSxpQkFBQSxPQUFBOzs7O0VBSUEsS0FBQSxPQUFBLFVBQUEsT0FBQTtZQUNBLFNBQUE7WUFDQSxJQUFBLFNBQUE7R0FDQSxJQUFBLGVBQUE7WUFDQSxJQUFBLGVBQUE7WUFDQSxJQUFBLGVBQUE7R0FDQSxNQUFBLElBQUEsZUFBQTs7WUFFQSxJQUFBLFFBQUEsWUFBQTs7Z0JBRUEsSUFBQSxDQUFBLE1BQUEsU0FBQTs7b0JBRUEsTUFBQTs7OztHQUlBLGlCQUFBLEdBQUEsaUJBQUE7OztFQUdBLEtBQUEsZUFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLFVBQUE7WUFDQSxPQUFBLFVBQUE7WUFDQSxNQUFBOztZQUVBLElBQUEsa0JBQUE7O0dBRUEsY0FBQSxRQUFBO0dBQ0EsT0FBQSxJQUFBLEdBQUEsWUFBQSxLQUFBO2dCQUNBLFFBQUE7SUFDQSxNQUFBO0lBQ0EsT0FBQSxPQUFBOzs7R0FHQSxJQUFBLGVBQUE7R0FDQSxLQUFBLEdBQUEsV0FBQTtZQUNBLEtBQUEsR0FBQSxXQUFBLFVBQUEsR0FBQTtnQkFDQSxPQUFBLFdBQUEscUJBQUEsRUFBQTs7OztFQUlBLEtBQUEsZ0JBQUEsWUFBQTtHQUNBLElBQUEsa0JBQUE7WUFDQSxLQUFBLFVBQUE7WUFDQSxjQUFBO1lBQ0EsT0FBQSxVQUFBO1lBQ0EsT0FBQSxVQUFBOztHQUVBLE1BQUE7OztRQUdBLEtBQUEsWUFBQSxZQUFBO1lBQ0EsT0FBQSxRQUFBLEtBQUE7OztRQUdBLEtBQUEsY0FBQSxZQUFBO1lBQ0EsSUFBQSxNQUFBLGFBQUE7Z0JBQ0EsTUFBQTs7WUFFQSxVQUFBLFVBQUE7OztRQUdBLEtBQUEsZUFBQSxZQUFBO1lBQ0EsVUFBQSxVQUFBOzs7UUFHQSxLQUFBLFdBQUEsWUFBQTtZQUNBLE9BQUEsVUFBQTs7O1FBR0EsS0FBQSxxQkFBQSxZQUFBO1lBQ0EsT0FBQSxDQUFBLENBQUE7OztRQUdBLEtBQUEsNEJBQUEsWUFBQTtZQUNBLGNBQUE7OztFQUdBLEtBQUEsaUJBQUEsWUFBQTtHQUNBLGlCQUFBLFFBQUE7OztFQUdBLEtBQUEsU0FBQSxVQUFBLElBQUE7R0FDQSxJQUFBO0dBQ0EsaUJBQUEsZUFBQSxVQUFBLEdBQUE7SUFDQSxJQUFBLEVBQUEsV0FBQSxPQUFBLElBQUE7S0FDQSxVQUFBOzs7O0dBSUEsSUFBQSxDQUFBLGlCQUFBLE9BQUEsVUFBQTtJQUNBLGlCQUFBLEtBQUE7Ozs7UUFJQSxLQUFBLHNCQUFBLFlBQUE7WUFDQSxPQUFBLGlCQUFBLGNBQUE7Ozs7UUFJQSxLQUFBLE1BQUEsVUFBQSxJQUFBO1lBQ0EsaUJBQUEsZUFBQSxVQUFBLEdBQUE7Z0JBQ0EsSUFBQSxFQUFBLFdBQUEsT0FBQSxJQUFBOztvQkFFQSxJQUFBLE9BQUEsSUFBQTtvQkFDQSxJQUFBLE1BQUEsR0FBQSxVQUFBLElBQUE7d0JBQ0EsUUFBQSxLQUFBOztvQkFFQSxJQUFBLE9BQUEsR0FBQSxVQUFBLEtBQUE7d0JBQ0EsWUFBQSxLQUFBOztvQkFFQSxJQUFBLGFBQUEsS0FBQTtvQkFDQSxLQUFBLElBQUEsRUFBQSxlQUFBLElBQUE7Ozs7O0VBS0EsS0FBQSxpQkFBQSxZQUFBO0dBQ0EsaUJBQUE7OztFQUdBLEtBQUEsc0JBQUEsWUFBQTtHQUNBLE9BQUE7OztRQUdBLEtBQUEseUJBQUEsWUFBQTtZQUNBLE9BQUE7Ozs7UUFJQSxLQUFBLGFBQUEsVUFBQSxTQUFBO1lBQ0EsaUJBQUEsV0FBQTtZQUNBLE9BQUEsaUJBQUEsQ0FBQSxTQUFBOzs7UUFHQSxLQUFBLGFBQUEsVUFBQSxTQUFBO1lBQ0EsZ0JBQUEsV0FBQTs7O1FBR0EsS0FBQSxZQUFBLFlBQUE7WUFDQSx5QkFBQSxDQUFBLHlCQUFBLEtBQUEsbUJBQUE7WUFDQSxNQUFBOzs7UUFHQSxLQUFBLFVBQUEsWUFBQTtZQUNBLE9BQUEsQ0FBQSx5QkFBQSxLQUFBLG1CQUFBOzs7UUFHQSxLQUFBLGdCQUFBLFlBQUE7O1lBRUEseUJBQUEsQ0FBQSx5QkFBQSxtQkFBQSxjQUFBLEtBQUEsbUJBQUE7WUFDQSxNQUFBOzs7UUFHQSxLQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUEseUJBQUE7OztRQUdBLEtBQUEsZ0JBQUEsWUFBQTs7WUFFQSxZQUFBLGFBQUEsS0FBQSxZQUFBO2dCQUNBLHdCQUFBLG1CQUFBLEtBQUE7Ozs7UUFJQSxLQUFBLGNBQUEsWUFBQTtZQUNBLHlCQUFBO1lBQ0EsTUFBQTs7O1FBR0EsS0FBQSxhQUFBLFlBQUE7WUFDQSxZQUFBLGFBQUEsS0FBQSxZQUFBOztnQkFFQSxJQUFBLG1CQUFBLGdCQUFBLEdBQUE7b0JBQ0EseUJBQUEsbUJBQUEsY0FBQTs7Z0JBRUEsTUFBQTs7Ozs7UUFLQSxLQUFBLFVBQUEsVUFBQSxPQUFBO1lBQ0EsSUFBQSxhQUFBLGlCQUFBLEtBQUE7WUFDQSxJQUFBLENBQUEsWUFBQTtZQUNBLFFBQUEsU0FBQTs7WUFFQSxJQUFBLFNBQUEsWUFBQTtnQkFDQSxJQUFBLGlCQUFBLGNBQUEsR0FBQTtvQkFDQSxpQkFBQTt1QkFDQTtvQkFDQSxpQkFBQSxLQUFBOzs7O1lBSUEsVUFBQSxRQUFBLEtBQUEsUUFBQTs7O1FBR0EsS0FBQSxhQUFBLFlBQUE7WUFDQSxPQUFBLG1CQUFBLEtBQUEsd0JBQUE7Ozs7Ozs7Ozs7OztBQ3hZQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxvQkFBQSxVQUFBLEtBQUE7RUFDQTtFQUNBLElBQUEsU0FBQSxDQUFBLEdBQUEsR0FBQSxHQUFBOztFQUVBLElBQUEsYUFBQSxJQUFBLEdBQUEsS0FBQSxXQUFBO0dBQ0EsTUFBQTtHQUNBLE9BQUE7R0FDQSxRQUFBOzs7RUFHQSxJQUFBLGFBQUEsSUFBQSxHQUFBLE1BQUE7O0VBRUEsS0FBQSxPQUFBLFVBQUEsT0FBQTtHQUNBLElBQUEsU0FBQTs7O0dBR0EsTUFBQSxJQUFBLGVBQUEsVUFBQSxHQUFBLE9BQUE7SUFDQSxPQUFBLEtBQUEsTUFBQTtJQUNBLE9BQUEsS0FBQSxNQUFBOztJQUVBLElBQUEsT0FBQSxNQUFBLFNBQUE7O0lBRUEsSUFBQSxTQUFBLE1BQUEsU0FBQTs7SUFFQSxJQUFBLE9BQUEsT0FBQSxhQUFBLE9BQUEsT0FBQSxXQUFBO0tBQ0EsU0FBQSxHQUFBLE9BQUEsVUFBQTs7O0lBR0EsSUFBQSxjQUFBLElBQUEsR0FBQSxPQUFBLFlBQUE7S0FDQSxLQUFBLE1BQUE7S0FDQSxZQUFBO0tBQ0EsYUFBQTs7O0lBR0EsV0FBQSxVQUFBOztJQUVBLElBQUEsUUFBQSxJQUFBLEdBQUEsS0FBQTtLQUNBLFlBQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQTtLQUNBLFlBQUE7O0tBRUEsZUFBQTs7S0FFQSxRQUFBOzs7O0lBSUEsSUFBQSxTQUFBLFdBQUE7S0FDQSxJQUFBLFVBQUEsSUFBQSxRQUFBLElBQUE7Ozs7O0VBS0EsS0FBQSxZQUFBLFlBQUE7R0FDQSxPQUFBOzs7RUFHQSxLQUFBLGdCQUFBLFlBQUE7R0FDQSxPQUFBOzs7UUFHQSxLQUFBLFdBQUEsWUFBQTtZQUNBLE9BQUE7Ozs7Ozs7Ozs7OztBQy9EQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSxVQUFBLFlBQUE7RUFDQTs7UUFFQSxJQUFBLFFBQUE7O1FBRUEsS0FBQSxTQUFBO1lBQ0EsT0FBQSxDQUFBLEtBQUEsS0FBQSxLQUFBO1lBQ0EsTUFBQSxDQUFBLEdBQUEsS0FBQSxLQUFBO1lBQ0EsUUFBQTs7O1FBR0EsSUFBQSxzQkFBQTtRQUNBLElBQUEscUJBQUE7O1FBRUEsSUFBQSx1QkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLHdCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsZ0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsSUFBQSxpQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLG9CQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O1FBR0EsSUFBQSxxQkFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7OztRQUdBLElBQUEsc0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsSUFBQSx1QkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLHNCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7WUFDQSxVQUFBLENBQUE7OztRQUdBLElBQUEsZ0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTtZQUNBLFVBQUEsQ0FBQTs7O1FBR0EsSUFBQSxjQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O1FBR0EsSUFBQSxlQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O0VBR0EsS0FBQSxXQUFBLFVBQUEsU0FBQTtZQUNBLElBQUEsUUFBQSxRQUFBLFNBQUEsTUFBQSxRQUFBLFNBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQTtnQkFDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO29CQUNBLFFBQUE7b0JBQ0EsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO3dCQUNBLFFBQUE7d0JBQ0EsTUFBQSxJQUFBLEdBQUEsTUFBQSxLQUFBOzRCQUNBLE9BQUE7O3dCQUVBLFFBQUE7OztnQkFHQSxJQUFBLEdBQUEsTUFBQSxNQUFBO29CQUNBLFFBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTt3QkFDQSxPQUFBO3dCQUNBLE9BQUE7Ozs7OztFQU1BLEtBQUEsWUFBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUE7S0FDQSxRQUFBOztnQkFFQSxRQUFBOztHQUVBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBO2dCQUNBLFFBQUE7Ozs7RUFJQSxLQUFBLFVBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLE9BQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtLQUNBLFFBQUE7S0FDQSxNQUFBO0tBQ0EsUUFBQTs7O0dBR0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUE7Ozs7RUFJQSxLQUFBLFdBQUE7R0FDQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQTs7R0FFQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO29CQUNBLE9BQUEsS0FBQSxPQUFBO29CQUNBLE9BQUE7Ozs7Ozs7Ozs7Ozs7O0FDbklBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLGFBQUEsWUFBQTtFQUNBOztFQUVBLElBQUEsUUFBQTs7O0VBR0EsSUFBQSxjQUFBLFlBQUE7R0FDQSxJQUFBLFNBQUEsU0FBQSxLQUFBLFFBQUEsS0FBQTs4QkFDQSxNQUFBOztHQUVBLElBQUEsUUFBQTs7R0FFQSxPQUFBLFFBQUEsVUFBQSxPQUFBOztJQUVBLElBQUEsVUFBQSxNQUFBLE1BQUE7SUFDQSxJQUFBLFdBQUEsUUFBQSxXQUFBLEdBQUE7S0FDQSxNQUFBLFFBQUEsTUFBQSxtQkFBQSxRQUFBOzs7O0dBSUEsT0FBQTs7OztFQUlBLElBQUEsY0FBQSxVQUFBLE9BQUE7R0FDQSxJQUFBLFNBQUE7R0FDQSxLQUFBLElBQUEsT0FBQSxPQUFBO0lBQ0EsVUFBQSxNQUFBLE1BQUEsbUJBQUEsTUFBQSxRQUFBOztHQUVBLE9BQUEsT0FBQSxVQUFBLEdBQUEsT0FBQSxTQUFBOzs7RUFHQSxLQUFBLFlBQUEsVUFBQSxHQUFBO0dBQ0EsTUFBQSxPQUFBO0dBQ0EsUUFBQSxVQUFBLE9BQUEsSUFBQSxNQUFBLE9BQUEsTUFBQSxZQUFBOzs7O0VBSUEsS0FBQSxNQUFBLFVBQUEsUUFBQTtHQUNBLEtBQUEsSUFBQSxPQUFBLFFBQUE7SUFDQSxNQUFBLE9BQUEsT0FBQTs7R0FFQSxRQUFBLGFBQUEsT0FBQSxJQUFBLE1BQUEsT0FBQSxNQUFBLFlBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsVUFBQSxLQUFBO0dBQ0EsT0FBQSxNQUFBOzs7RUFHQSxRQUFBLFFBQUE7O0VBRUEsSUFBQSxDQUFBLE9BQUE7R0FDQSxRQUFBOzs7RUFHQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgRElBUyBhbm5vdGF0aW9ucyBtb2R1bGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJywgWydkaWFzLmFwaScsICdkaWFzLnVpJ10pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0aW9uc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGFubm90YXRpb25zIGxpc3QgaW4gdGhlIHNpZGViYXJcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdBbm5vdGF0aW9uc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywgbGFiZWxzLCBhbm5vdGF0aW9ucywgc2hhcGVzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkRmVhdHVyZXMgPSBtYXBBbm5vdGF0aW9ucy5nZXRTZWxlY3RlZEZlYXR1cmVzKCk7XG5cblx0XHQkc2NvcGUuc2VsZWN0ZWRGZWF0dXJlcyA9IHNlbGVjdGVkRmVhdHVyZXMuZ2V0QXJyYXkoKTtcblxuXHRcdHZhciByZWZyZXNoQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuYW5ub3RhdGlvbnMgPSBhbm5vdGF0aW9ucy5jdXJyZW50KCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5hbm5vdGF0aW9ucyA9IFtdO1xuXG5cdFx0JHNjb3BlLmNsZWFyU2VsZWN0aW9uID0gbWFwQW5ub3RhdGlvbnMuY2xlYXJTZWxlY3Rpb247XG5cblx0XHQkc2NvcGUuc2VsZWN0QW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChlLCBpZCkge1xuXHRcdFx0Ly8gYWxsb3cgbXVsdGlwbGUgc2VsZWN0aW9uc1xuXHRcdFx0aWYgKCFlLnNoaWZ0S2V5KSB7XG5cdFx0XHRcdCRzY29wZS5jbGVhclNlbGVjdGlvbigpO1xuXHRcdFx0fVxuXHRcdFx0bWFwQW5ub3RhdGlvbnMuc2VsZWN0KGlkKTtcblx0XHR9O1xuXG4gICAgICAgICRzY29wZS5maXRBbm5vdGF0aW9uID0gbWFwQW5ub3RhdGlvbnMuZml0O1xuXG5cdFx0JHNjb3BlLmlzU2VsZWN0ZWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBzZWxlY3RlZCA9IGZhbHNlO1xuXHRcdFx0c2VsZWN0ZWRGZWF0dXJlcy5mb3JFYWNoKGZ1bmN0aW9uIChmZWF0dXJlKSB7XG5cdFx0XHRcdGlmIChmZWF0dXJlLmFubm90YXRpb24gJiYgZmVhdHVyZS5hbm5vdGF0aW9uLmlkID09IGlkKSB7XG5cdFx0XHRcdFx0c2VsZWN0ZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBzZWxlY3RlZDtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCByZWZyZXNoQW5ub3RhdGlvbnMpO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBBbm5vdGF0b3JDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1haW4gY29udHJvbGxlciBvZiB0aGUgQW5ub3RhdG9yIGFwcGxpY2F0aW9uLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0Fubm90YXRvckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBpbWFnZXMsIHVybFBhcmFtcywgbXNnLCBJTUFHRV9JRCwga2V5Ym9hcmQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLmltYWdlcyA9IGltYWdlcztcbiAgICAgICAgJHNjb3BlLmltYWdlTG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgLy8gdGhlIGN1cnJlbnQgY2FudmFzIHZpZXdwb3J0LCBzeW5jZWQgd2l0aCB0aGUgVVJMIHBhcmFtZXRlcnNcbiAgICAgICAgJHNjb3BlLnZpZXdwb3J0ID0ge1xuICAgICAgICAgICAgem9vbTogdXJsUGFyYW1zLmdldCgneicpLFxuICAgICAgICAgICAgY2VudGVyOiBbdXJsUGFyYW1zLmdldCgneCcpLCB1cmxQYXJhbXMuZ2V0KCd5JyldXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZmluaXNoIGltYWdlIGxvYWRpbmcgcHJvY2Vzc1xuICAgICAgICB2YXIgZmluaXNoTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5pbWFnZUxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdpbWFnZS5zaG93bicsICRzY29wZS5pbWFnZXMuY3VycmVudEltYWdlKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeVxuICAgICAgICB2YXIgcHVzaFN0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdXJsUGFyYW1zLnB1c2hTdGF0ZSgkc2NvcGUuaW1hZ2VzLmN1cnJlbnRJbWFnZS5faWQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHN0YXJ0IGltYWdlIGxvYWRpbmcgcHJvY2Vzc1xuICAgICAgICB2YXIgc3RhcnRMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlTG9hZGluZyA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gbG9hZCB0aGUgaW1hZ2UgYnkgaWQuIGRvZXNuJ3QgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnkgYnkgaXRzZWxmXG4gICAgICAgIHZhciBsb2FkSW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlcy5zaG93KHBhcnNlSW50KGlkKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmaW5pc2hMb2FkaW5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2hvdyB0aGUgbmV4dCBpbWFnZSBhbmQgY3JlYXRlIGEgbmV3IGhpc3RvcnkgZW50cnlcbiAgICAgICAgJHNjb3BlLm5leHRJbWFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHN0YXJ0TG9hZGluZygpO1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlcy5uZXh0KClcbiAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAudGhlbihwdXNoU3RhdGUpXG4gICAgICAgICAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHNob3cgdGhlIHByZXZpb3VzIGltYWdlIGFuZCBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeVxuICAgICAgICAkc2NvcGUucHJldkltYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc3RhcnRMb2FkaW5nKCk7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VzLnByZXYoKVxuICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgIC50aGVuKHB1c2hTdGF0ZSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSBVUkwgcGFyYW1ldGVycyBvZiB0aGUgdmlld3BvcnRcbiAgICAgICAgJHNjb3BlLiRvbignY2FudmFzLm1vdmVlbmQnLCBmdW5jdGlvbihlLCBwYXJhbXMpIHtcbiAgICAgICAgICAgICRzY29wZS52aWV3cG9ydC56b29tID0gcGFyYW1zLnpvb207XG4gICAgICAgICAgICAkc2NvcGUudmlld3BvcnQuY2VudGVyWzBdID0gTWF0aC5yb3VuZChwYXJhbXMuY2VudGVyWzBdKTtcbiAgICAgICAgICAgICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMV0gPSBNYXRoLnJvdW5kKHBhcmFtcy5jZW50ZXJbMV0pO1xuICAgICAgICAgICAgdXJsUGFyYW1zLnNldCh7XG4gICAgICAgICAgICAgICAgejogJHNjb3BlLnZpZXdwb3J0Lnpvb20sXG4gICAgICAgICAgICAgICAgeDogJHNjb3BlLnZpZXdwb3J0LmNlbnRlclswXSxcbiAgICAgICAgICAgICAgICB5OiAkc2NvcGUudmlld3BvcnQuY2VudGVyWzFdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oMzcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5wcmV2SW1hZ2UoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oMzksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oMzIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gbGlzdGVuIHRvIHRoZSBicm93c2VyIFwiYmFja1wiIGJ1dHRvblxuICAgICAgICB3aW5kb3cub25wb3BzdGF0ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBzdGF0ZSA9IGUuc3RhdGU7XG4gICAgICAgICAgICBpZiAoc3RhdGUgJiYgc3RhdGUuc2x1ZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbG9hZEltYWdlKHN0YXRlLnNsdWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGluaXRpYWxpemUgdGhlIGltYWdlcyBzZXJ2aWNlXG4gICAgICAgIGltYWdlcy5pbml0KCk7XG4gICAgICAgIC8vIGRpc3BsYXkgdGhlIGZpcnN0IGltYWdlXG4gICAgICAgIGxvYWRJbWFnZShJTUFHRV9JRCkudGhlbihwdXNoU3RhdGUpO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENhbnZhc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFpbiBjb250cm9sbGVyIGZvciB0aGUgYW5ub3RhdGlvbiBjYW52YXMgZWxlbWVudFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NhbnZhc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBJbWFnZSwgbWFwQW5ub3RhdGlvbnMsIG1hcCwgJHRpbWVvdXQsIGRlYm91bmNlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuXG5cdFx0Ly8gdXBkYXRlIHRoZSBVUkwgcGFyYW1ldGVyc1xuXHRcdG1hcC5vbignbW92ZWVuZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBlbWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnY2FudmFzLm1vdmVlbmQnLCB7XG4gICAgICAgICAgICAgICAgICAgIGNlbnRlcjogbWFwVmlldy5nZXRDZW50ZXIoKSxcbiAgICAgICAgICAgICAgICAgICAgem9vbTogbWFwVmlldy5nZXRab29tKClcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGRvbnQgdXBkYXRlIGltbWVkaWF0ZWx5IGJ1dCB3YWl0IGZvciBwb3NzaWJsZSBuZXcgY2hhbmdlc1xuICAgICAgICAgICAgZGVib3VuY2UoZW1pdCwgMTAwLCAnYW5ub3RhdG9yLmNhbnZhcy5tb3ZlZW5kJyk7XG5cdFx0fSk7XG5cbiAgICAgICAgbWFwLm9uKCdjaGFuZ2U6dmlldycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuICAgICAgICB9KTtcblxuXHRcdG1hcEltYWdlLmluaXQoJHNjb3BlKTtcblx0XHRtYXBBbm5vdGF0aW9ucy5pbml0KCRzY29wZSk7XG5cblx0XHR2YXIgdXBkYXRlU2l6ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdC8vIHdvcmthcm91bmQsIHNvIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQgKmFmdGVyKiB0aGUgYW5ndWxhciBkaWdlc3Rcblx0XHRcdC8vIGFuZCAqYWZ0ZXIqIHRoZSBmb2xkb3V0IHdhcyByZW5kZXJlZFxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBuZWVkcyB0byBiZSB3cmFwcGVkIGluIGFuIGV4dHJhIGZ1bmN0aW9uIHNpbmNlIHVwZGF0ZVNpemUgYWNjZXB0cyBhcmd1bWVudHNcblx0XHRcdFx0bWFwLnVwZGF0ZVNpemUoKTtcblx0XHRcdH0sIDUwLCBmYWxzZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ3NpZGViYXIuZm9sZG91dC5vcGVuJywgdXBkYXRlU2l6ZSk7XG5cdFx0JHNjb3BlLiRvbignc2lkZWJhci5mb2xkb3V0LmNsb3NlJywgdXBkYXRlU2l6ZSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENhdGVnb3JpZXNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyIGxhYmVsIGNhdGVnb3JpZXMgZm9sZG91dFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0NhdGVnb3JpZXNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbGFiZWxzLCBrZXlib2FyZCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBtYXhpbXVtIG51bWJlciBvZiBhbGxvd2VkIGZhdm91cml0ZXNcbiAgICAgICAgdmFyIG1heEZhdm91cml0ZXMgPSA5O1xuICAgICAgICB2YXIgZmF2b3VyaXRlc1N0b3JhZ2VLZXkgPSAnZGlhcy5hbm5vdGF0aW9ucy5sYWJlbC1mYXZvdXJpdGVzJztcblxuICAgICAgICAvLyBzYXZlcyB0aGUgSURzIG9mIHRoZSBmYXZvdXJpdGVzIGluIGxvY2FsU3RvcmFnZVxuICAgICAgICB2YXIgc3RvcmVGYXZvdXJpdGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRtcCA9ICRzY29wZS5mYXZvdXJpdGVzLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLmlkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2Zhdm91cml0ZXNTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KHRtcCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcmVzdG9yZXMgdGhlIGZhdm91cml0ZXMgZnJvbSB0aGUgSURzIGluIGxvY2FsU3RvcmFnZVxuICAgICAgICB2YXIgbG9hZEZhdm91cml0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtmYXZvdXJpdGVzU3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgICAgICB2YXIgdG1wID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlW2Zhdm91cml0ZXNTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMgPSAkc2NvcGUuY2F0ZWdvcmllcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gb25seSB0YWtlIHRob3NlIGNhdGVnb3JpZXMgYXMgZmF2b3VyaXRlcyB0aGF0IGFyZSBhdmFpbGFibGUgZm9yIHRoaXMgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRtcC5pbmRleE9mKGl0ZW0uaWQpICE9PSAtMTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgY2hvb3NlRmF2b3VyaXRlID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gMCAmJiBpbmRleCA8ICRzY29wZS5mYXZvdXJpdGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RJdGVtKCRzY29wZS5mYXZvdXJpdGVzW2luZGV4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmhvdGtleXNNYXAgPSBbJ/Cdn60nLCAn8J2fricsICfwnZ+vJywgJ/Cdn7AnLCAn8J2fsScsICfwnZ+yJywgJ/Cdn7MnLCAn8J2ftCcsICfwnZ+1J107XG4gICAgICAgICRzY29wZS5jYXRlZ29yaWVzID0gW107XG4gICAgICAgICRzY29wZS5mYXZvdXJpdGVzID0gW107XG4gICAgICAgIGxhYmVscy5wcm9taXNlLnRoZW4oZnVuY3Rpb24gKGFsbCkge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGFsbCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5jYXRlZ29yaWVzID0gJHNjb3BlLmNhdGVnb3JpZXMuY29uY2F0KGFsbFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvYWRGYXZvdXJpdGVzKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS5jYXRlZ29yaWVzVHJlZSA9IGxhYmVscy5nZXRUcmVlKCk7XG5cbiAgICAgICAgJHNjb3BlLnNlbGVjdEl0ZW0gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgbGFiZWxzLnNldFNlbGVjdGVkKGl0ZW0pO1xuICAgICAgICAgICAgJHNjb3BlLnNlYXJjaENhdGVnb3J5ID0gJyc7IC8vIGNsZWFyIHNlYXJjaCBmaWVsZFxuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCBpdGVtKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNGYXZvdXJpdGUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5mYXZvdXJpdGVzLmluZGV4T2YoaXRlbSkgIT09IC0xO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGFkZHMgYSBuZXcgaXRlbSB0byB0aGUgZmF2b3VyaXRlcyBvciByZW1vdmVzIGl0IGlmIGl0IGlzIGFscmVhZHkgYSBmYXZvdXJpdGVcbiAgICAgICAgJHNjb3BlLnRvZ2dsZUZhdm91cml0ZSA9IGZ1bmN0aW9uIChlLCBpdGVtKSB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gJHNjb3BlLmZhdm91cml0ZXMuaW5kZXhPZihpdGVtKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEgJiYgJHNjb3BlLmZhdm91cml0ZXMubGVuZ3RoIDwgbWF4RmF2b3VyaXRlcykge1xuICAgICAgICAgICAgICAgICRzY29wZS5mYXZvdXJpdGVzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5mYXZvdXJpdGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdG9yZUZhdm91cml0ZXMoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXR1cm5zIHdoZXRoZXIgdGhlIHVzZXIgaXMgc3RpbGwgYWxsb3dlZCB0byBhZGQgZmF2b3VyaXRlc1xuICAgICAgICAkc2NvcGUuZmF2b3VyaXRlc0xlZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmZhdm91cml0ZXMubGVuZ3RoIDwgbWF4RmF2b3VyaXRlcztcbiAgICAgICAgfTtcblxuICAgICAgICBrZXlib2FyZC5vbignMScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSgwKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoMSk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCczJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDIpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignNCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSgzKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoNCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc2JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDUpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignNycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg2KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoNyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDgpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBDb25maWRlbmNlQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgY29uZmlkZW5jZSBjb250cm9sXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQ29uZmlkZW5jZUNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdCRzY29wZS5jb25maWRlbmNlID0gMS4wO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnY29uZmlkZW5jZScsIGZ1bmN0aW9uIChjb25maWRlbmNlKSB7XG5cdFx0XHRsYWJlbHMuc2V0Q3VycmVudENvbmZpZGVuY2UocGFyc2VGbG9hdChjb25maWRlbmNlKSk7XG5cblx0XHRcdGlmIChjb25maWRlbmNlIDw9IDAuMjUpIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC1kYW5nZXInO1xuXHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNSApIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC13YXJuaW5nJztcblx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjc1ICkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXN1Y2Nlc3MnO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLmNvbmZpZGVuY2VDbGFzcyA9ICdsYWJlbC1wcmltYXJ5Jztcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgRHJhd2luZ0NvbnRyb2xzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgY29udHJvbHMgYmFyIGRyYXdpbmcgYnV0b25zXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignRHJhd2luZ0NvbnRyb2xzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEFubm90YXRpb25zLCBsYWJlbHMsIG1zZywgJGF0dHJzLCBrZXlib2FyZCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLnNlbGVjdFNoYXBlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIGlmIChuYW1lICE9PSBudWxsICYmICRzY29wZS5zZWxlY3RlZFNoYXBlKCkgIT09IG5hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWxhYmVscy5oYXNTZWxlY3RlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnc2lkZWJhci5mb2xkb3V0LmRvLW9wZW4nLCAnY2F0ZWdvcmllcycpO1xuICAgICAgICAgICAgICAgICAgICBtc2cuaW5mbygkYXR0cnMuc2VsZWN0Q2F0ZWdvcnkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXHRcdFx0XHRtYXBBbm5vdGF0aW9ucy5zdGFydERyYXdpbmcobmFtZSk7XG5cdFx0XHR9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmZpbmlzaERyYXdpbmcoKTtcbiAgICAgICAgICAgIH1cblx0XHR9O1xuXG4gICAgICAgICRzY29wZS5zZWxlY3RlZFNoYXBlID0gbWFwQW5ub3RhdGlvbnMuZ2V0U2VsZWN0ZWREcmF3aW5nVHlwZTtcblxuICAgICAgICAvLyBkZXNlbGVjdCBkcmF3aW5nIHRvb2wgb24gZXNjYXBlXG4gICAgICAgIGtleWJvYXJkLm9uKDI3LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUobnVsbCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdhJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdQb2ludCcpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbigncycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnUmVjdGFuZ2xlJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdDaXJjbGUnKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ2YnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ0xpbmVTdHJpbmcnKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ2cnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ1BvbHlnb24nKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEVkaXRDb250cm9sc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIGNvbnRyb2xzIGJhciBlZGl0IGJ1dHRvbnNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdFZGl0Q29udHJvbHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMsIGtleWJvYXJkLCAkdGltZW91dCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIHRoZSB1c2VyIGhhcyBhIGNlcnRhaW4gYW1vdW50IG9mIHRpbWUgdG8gcXVpY2sgZGVsZXRlIHRoZSBsYXN0IGRyYXduXG4gICAgICAgIC8vIGFubm90YXRpb247IHRoaXMgYm9vbCB0ZWxscyB1cyB3aGV0aGVyIHRoZSB0aW1lb3V0IGlzIHN0aWxsIHJ1bm5pbmcuXG4gICAgICAgIHZhciBpc0luRGVsZXRlTGFzdEFubm90YXRpb25UaW1lb3V0ID0gZmFsc2U7XG4gICAgICAgIC8vIHRpbWUgaW4gbXMgaW4gd2hpY2ggdGhlIHVzZXIgaXMgYWxsb3dlZCB0byBxdWljayBkZWxldGUgYW4gYW5ub3RhdGlvblxuICAgICAgICB2YXIgZGVsZXRlTGFzdEFubm90YXRpb25UaW1lb3V0ID0gMTAwMDA7XG4gICAgICAgIHZhciB0aW1lb3V0UHJvbWlzZTtcblxuICAgICAgICAkc2NvcGUuZGVsZXRlU2VsZWN0ZWRBbm5vdGF0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChtYXBBbm5vdGF0aW9ucy5oYXNTZWxlY3RlZEZlYXR1cmVzKCkgJiYgY29uZmlybSgnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSBhbGwgc2VsZWN0ZWQgYW5ub3RhdGlvbnM/JykpIHtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5kZWxldGVTZWxlY3RlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5oYXNTZWxlY3RlZEFubm90YXRpb25zID0gbWFwQW5ub3RhdGlvbnMuaGFzU2VsZWN0ZWRGZWF0dXJlcztcblxuICAgICAgICB2YXIgc3RhcnRNb3ZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5zdGFydE1vdmluZygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBmaW5pc2hNb3ZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5maW5pc2hNb3ZpbmcoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUubW92ZVNlbGVjdGVkQW5ub3RhdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmlzTW92aW5nKCkpIHtcbiAgICAgICAgICAgICAgICBmaW5pc2hNb3ZpbmcoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhcnRNb3ZpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuY2FuRGVsZXRlTGFzdEFubm90YXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaXNJbkRlbGV0ZUxhc3RBbm5vdGF0aW9uVGltZW91dCAmJiBtYXBBbm5vdGF0aW9ucy5oYXNEcmF3bkFubm90YXRpb24oKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZGVsZXRlTGFzdERyYXduQW5ub3RhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICgkc2NvcGUuY2FuRGVsZXRlTGFzdEFubm90YXRpb24oKSkge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmRlbGV0ZUxhc3REcmF3bkFubm90YXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNNb3ZpbmcgPSBtYXBBbm5vdGF0aW9ucy5pc01vdmluZztcblxuICAgICAgICAvLyB0aGUgcXVpY2sgZGVsZXRlIHRpbWVvdXQgYWx3YXlzIHN0YXJ0cyB3aGVuIGEgbmV3IGFubm90YXRpb24gd2FzIGRyYXduXG4gICAgICAgICRzY29wZS4kb24oJ2Fubm90YXRpb25zLmRyYXduJywgZnVuY3Rpb24gKGUsIGZlYXR1cmUpIHtcbiAgICAgICAgICAgIGlzSW5EZWxldGVMYXN0QW5ub3RhdGlvblRpbWVvdXQgPSB0cnVlO1xuICAgICAgICAgICAgJHRpbWVvdXQuY2FuY2VsKHRpbWVvdXRQcm9taXNlKTtcbiAgICAgICAgICAgIHRpbWVvdXRQcm9taXNlID0gJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlzSW5EZWxldGVMYXN0QW5ub3RhdGlvblRpbWVvdXQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIGRlbGV0ZUxhc3RBbm5vdGF0aW9uVGltZW91dCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGRlbCBrZXlcbiAgICAgICAga2V5Ym9hcmQub24oNDYsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAkc2NvcGUuZGVsZXRlU2VsZWN0ZWRBbm5vdGF0aW9ucygpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBlc2Mga2V5XG4gICAgICAgIGtleWJvYXJkLm9uKDI3LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmlzTW92aW5nKCkpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KGZpbmlzaE1vdmluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGJhY2tzcGFjZSBrZXlcbiAgICAgICAga2V5Ym9hcmQub24oOCwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICRzY29wZS5kZWxldGVMYXN0RHJhd25Bbm5vdGF0aW9uKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgkc2NvcGUubW92ZVNlbGVjdGVkQW5ub3RhdGlvbnMpO1xuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgTWluaW1hcENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIG1pbmltYXAgaW4gdGhlIHNpZGViYXJcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdNaW5pbWFwQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcCwgbWFwSW1hZ2UsICRlbGVtZW50LCBzdHlsZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgdmlld3BvcnRTb3VyY2UgPSBuZXcgb2wuc291cmNlLlZlY3RvcigpO1xuXG5cdFx0dmFyIG1pbmltYXAgPSBuZXcgb2wuTWFwKHtcblx0XHRcdHRhcmdldDogJ21pbmltYXAnLFxuXHRcdFx0Ly8gcmVtb3ZlIGNvbnRyb2xzXG5cdFx0XHRjb250cm9sczogW10sXG5cdFx0XHQvLyBkaXNhYmxlIGludGVyYWN0aW9uc1xuXHRcdFx0aW50ZXJhY3Rpb25zOiBbXVxuXHRcdH0pO1xuXG4gICAgICAgIHZhciBtYXBTaXplID0gbWFwLmdldFNpemUoKTtcbiAgICAgICAgdmFyIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuXG5cdFx0Ly8gZ2V0IHRoZSBzYW1lIGxheWVycyB0aGFuIHRoZSBtYXBcblx0XHRtaW5pbWFwLmFkZExheWVyKG1hcEltYWdlLmdldExheWVyKCkpO1xuICAgICAgICBtaW5pbWFwLmFkZExheWVyKG5ldyBvbC5sYXllci5WZWN0b3Ioe1xuICAgICAgICAgICAgc291cmNlOiB2aWV3cG9ydFNvdXJjZSxcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZXMudmlld3BvcnRcbiAgICAgICAgfSkpO1xuXG5cdFx0dmFyIHZpZXdwb3J0ID0gbmV3IG9sLkZlYXR1cmUoKTtcblx0XHR2aWV3cG9ydFNvdXJjZS5hZGRGZWF0dXJlKHZpZXdwb3J0KTtcblxuXHRcdC8vIHJlZnJlc2ggdGhlIHZpZXcgKHRoZSBpbWFnZSBzaXplIGNvdWxkIGhhdmUgYmVlbiBjaGFuZ2VkKVxuXHRcdCRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC5zZXRWaWV3KG5ldyBvbC5WaWV3KHtcblx0XHRcdFx0cHJvamVjdGlvbjogbWFwSW1hZ2UuZ2V0UHJvamVjdGlvbigpLFxuXHRcdFx0XHRjZW50ZXI6IG9sLmV4dGVudC5nZXRDZW50ZXIobWFwSW1hZ2UuZ2V0RXh0ZW50KCkpLFxuXHRcdFx0XHR6b29tOiAwXG5cdFx0XHR9KSk7XG5cdFx0fSk7XG5cblx0XHQvLyBtb3ZlIHRoZSB2aWV3cG9ydCByZWN0YW5nbGUgb24gdGhlIG1pbmltYXBcblx0XHR2YXIgcmVmcmVzaFZpZXdwb3J0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmlld3BvcnQuc2V0R2VvbWV0cnkob2wuZ2VvbS5Qb2x5Z29uLmZyb21FeHRlbnQobWFwVmlldy5jYWxjdWxhdGVFeHRlbnQobWFwU2l6ZSkpKTtcblx0XHR9O1xuXG4gICAgICAgIG1hcC5vbignY2hhbmdlOnNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXBTaXplID0gbWFwLmdldFNpemUoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbWFwLm9uKCdjaGFuZ2U6dmlldycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcFZpZXcgPSBtYXAuZ2V0VmlldygpO1xuICAgICAgICB9KTtcblxuXHRcdG1hcC5vbigncG9zdGNvbXBvc2UnLCByZWZyZXNoVmlld3BvcnQpO1xuXG5cdFx0dmFyIGRyYWdWaWV3cG9ydCA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRtYXBWaWV3LnNldENlbnRlcihlLmNvb3JkaW5hdGUpO1xuXHRcdH07XG5cblx0XHRtaW5pbWFwLm9uKCdwb2ludGVyZHJhZycsIGRyYWdWaWV3cG9ydCk7XG5cblx0XHQkZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdG1pbmltYXAudW4oJ3BvaW50ZXJkcmFnJywgZHJhZ1ZpZXdwb3J0KTtcblx0XHR9KTtcblxuXHRcdCRlbGVtZW50Lm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC5vbigncG9pbnRlcmRyYWcnLCBkcmFnVmlld3BvcnQpO1xuXHRcdH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTZWxlY3RlZExhYmVsQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2VsZWN0ZWQgbGFiZWwgZGlzcGxheSBpbiB0aGUgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2VsZWN0ZWRMYWJlbENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuZ2V0U2VsZWN0ZWRMYWJlbCA9IGxhYmVscy5nZXRTZWxlY3RlZDtcblxuICAgICAgICAkc2NvcGUuaGFzU2VsZWN0ZWRMYWJlbCA9IGxhYmVscy5oYXNTZWxlY3RlZDtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2V0dGluZ3NBbm5vdGF0aW9uT3BhY2l0eUNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgc2V0dGluZ3MgZm9sZG91dFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NldHRpbmdzQW5ub3RhdGlvbk9wYWNpdHlDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgJHNjb3BlLnNldERlZmF1bHRTZXR0aW5ncygnYW5ub3RhdGlvbl9vcGFjaXR5JywgJzEnKTtcbiAgICAgICAgJHNjb3BlLiR3YXRjaCgnc2V0dGluZ3MuYW5ub3RhdGlvbl9vcGFjaXR5JywgZnVuY3Rpb24gKG9wYWNpdHkpIHtcbiAgICAgICAgICAgIG1hcEFubm90YXRpb25zLnNldE9wYWNpdHkob3BhY2l0eSk7XG4gICAgICAgIH0pO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNldHRpbmdzQW5ub3RhdGlvbnNDeWNsaW5nQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGN5Y2xpbmcgdGhyb3VnaCBhbm5vdGF0aW9uc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NldHRpbmdzQW5ub3RhdGlvbnNDeWNsaW5nQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEFubm90YXRpb25zLCBsYWJlbHMsIGtleWJvYXJkKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIGZsYWcgdG8gcHJldmVudCBjeWNsaW5nIHdoaWxlIGEgbmV3IGltYWdlIGlzIGxvYWRpbmdcbiAgICAgICAgdmFyIGxvYWRpbmcgPSBmYWxzZTtcblxuICAgICAgICB2YXIgY3ljbGluZ0tleSA9ICdhbm5vdGF0aW9ucyc7XG5cbiAgICAgICAgdmFyIG5leHRBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmIChsb2FkaW5nIHx8ICEkc2NvcGUuY3ljbGluZygpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmIChtYXBBbm5vdGF0aW9ucy5oYXNOZXh0KCkpIHtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5jeWNsZU5leHQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gbWV0aG9kIGZyb20gQW5ub3RhdG9yQ29udHJvbGxlcjsgbWFwQW5ub3RhdGlvbnMgd2lsbCByZWZyZXNoIGF1dG9tYXRpY2FsbHlcbiAgICAgICAgICAgICAgICAkc2NvcGUubmV4dEltYWdlKCkudGhlbihtYXBBbm5vdGF0aW9ucy5qdW1wVG9GaXJzdCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gb25seSBhcHBseSBpZiB0aGlzIHdhcyBjYWxsZWQgYnkgdGhlIGtleWJvYXJkIGV2ZW50XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjYW5jZWwgYWxsIGtleWJvYXJkIGV2ZW50cyB3aXRoIGxvd2VyIHByaW9yaXR5XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHByZXZBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmIChsb2FkaW5nIHx8ICEkc2NvcGUuY3ljbGluZygpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmIChtYXBBbm5vdGF0aW9ucy5oYXNQcmV2aW91cygpKSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuY3ljbGVQcmV2aW91cygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBtZXRob2QgZnJvbSBBbm5vdGF0b3JDb250cm9sbGVyOyBtYXBBbm5vdGF0aW9ucyB3aWxsIHJlZnJlc2ggYXV0b21hdGljYWxseVxuICAgICAgICAgICAgICAgICRzY29wZS5wcmV2SW1hZ2UoKS50aGVuKG1hcEFubm90YXRpb25zLmp1bXBUb0xhc3QpO1xuICAgICAgICAgICAgICAgIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICAgIC8vIG9ubHkgYXBwbHkgaWYgdGhpcyB3YXMgY2FsbGVkIGJ5IHRoZSBrZXlib2FyZCBldmVudFxuICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY2FuY2VsIGFsbCBrZXlib2FyZCBldmVudHMgd2l0aCBsb3dlciBwcmlvcml0eVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBhdHRhY2hMYWJlbCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAobG9hZGluZykgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgkc2NvcGUuY3ljbGluZygpICYmIGxhYmVscy5oYXNTZWxlY3RlZCgpKSB7XG4gICAgICAgICAgICAgICAgbGFiZWxzLmF0dGFjaFRvQW5ub3RhdGlvbihtYXBBbm5vdGF0aW9ucy5nZXRDdXJyZW50KCkpLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5mbGlja2VyKDEpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5mbGlja2VyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc3RvcCBjeWNsaW5nIHVzaW5nIGEga2V5Ym9hcmQgZXZlbnRcbiAgICAgICAgdmFyIHN0b3BDeWNsaW5nID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICRzY29wZS5zdG9wQ3ljbGluZygpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5jeWNsaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5nZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScpID09PSBjeWNsaW5nS2V5O1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zdGFydEN5Y2xpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0Vm9sYXRpbGVTZXR0aW5ncygnY3ljbGUnLCBjeWNsaW5nS2V5KTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc3RvcEN5Y2xpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2V0Vm9sYXRpbGVTZXR0aW5ncygnY3ljbGUnLCAnJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdGhlIGN5Y2xlIHNldHRpbmdzIG15IGJlIHNldCBieSBvdGhlciBjb250cm9sbGVycywgdG9vLCBzbyB3YXRjaCBpdFxuICAgICAgICAvLyBpbnN0ZWFkIG9mIHVzaW5nIHRoZSBzdGFydC9zdG9wIGZ1bmN0aW9ucyB0byBhZGQvcmVtb3ZlIGV2ZW50cyBldGMuXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ3ZvbGF0aWxlU2V0dGluZ3MuY3ljbGUnLCBmdW5jdGlvbiAoY3ljbGUsIG9sZEN5Y2xlKSB7XG4gICAgICAgICAgICBpZiAoY3ljbGUgPT09IGN5Y2xpbmdLZXkpIHtcbiAgICAgICAgICAgICAgICAvLyBvdmVycmlkZSBwcmV2aW91cyBpbWFnZSBvbiBhcnJvdyBsZWZ0XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMzcsIHByZXZBbm5vdGF0aW9uLCAxMCk7XG4gICAgICAgICAgICAgICAgLy8gb3ZlcnJpZGUgbmV4dCBpbWFnZSBvbiBhcnJvdyByaWdodCBhbmQgc3BhY2VcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzOSwgbmV4dEFubm90YXRpb24sIDEwKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzMiwgbmV4dEFubm90YXRpb24sIDEwKTtcblxuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDEzLCBhdHRhY2hMYWJlbCwgMTApO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDI3LCBzdG9wQ3ljbGluZywgMTApO1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob2xkQ3ljbGUgPT09IGN5Y2xpbmdLZXkpIHtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMzcsIHByZXZBbm5vdGF0aW9uKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMzksIG5leHRBbm5vdGF0aW9uKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMzIsIG5leHRBbm5vdGF0aW9uKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMTMsIGF0dGFjaExhYmVsKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vZmYoMjcsIHN0b3BDeWNsaW5nKTtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLnByZXZBbm5vdGF0aW9uID0gcHJldkFubm90YXRpb247XG4gICAgICAgICRzY29wZS5uZXh0QW5ub3RhdGlvbiA9IG5leHRBbm5vdGF0aW9uO1xuICAgICAgICAkc2NvcGUuYXR0YWNoTGFiZWwgPSBhdHRhY2hMYWJlbDtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTZXR0aW5nc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgc2V0dGluZ3MgZm9sZG91dFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NldHRpbmdzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGRlYm91bmNlKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBzZXR0aW5nc1N0b3JhZ2VLZXkgPSAnZGlhcy5hbm5vdGF0aW9ucy5zZXR0aW5ncyc7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRTZXR0aW5ncyA9IHt9O1xuXG4gICAgICAgIC8vIG1heSBiZSBleHRlbmRlZCBieSBjaGlsZCBjb250cm9sbGVyc1xuICAgICAgICAkc2NvcGUuc2V0dGluZ3MgPSB7fTtcblxuICAgICAgICAvLyBtYXkgYmUgZXh0ZW5kZWQgYnkgY2hpbGQgY29udHJvbGxlcnMgYnV0IHdpbGwgbm90IGJlIHBlcm1hbmVudGx5IHN0b3JlZFxuICAgICAgICAkc2NvcGUudm9sYXRpbGVTZXR0aW5ncyA9IHt9O1xuXG4gICAgICAgIHZhciBzdG9yZVNldHRpbmdzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHNldHRpbmdzID0gYW5ndWxhci5jb3B5KCRzY29wZS5zZXR0aW5ncyk7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3Nba2V5XSA9PT0gZGVmYXVsdFNldHRpbmdzW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZG9uJ3Qgc3RvcmUgZGVmYXVsdCBzZXR0aW5ncyB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNldHRpbmdzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW3NldHRpbmdzU3RvcmFnZUtleV0gPSBKU09OLnN0cmluZ2lmeShzZXR0aW5ncyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHN0b3JlU2V0dGluZ3NEZWJvdW5jZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyB3YWl0IGZvciBxdWljayBjaGFuZ2VzIGFuZCBvbmx5IHN0b3JlIHRoZW0gb25jZSB0aGluZ3MgY2FsbWVkIGRvd24gYWdhaW5cbiAgICAgICAgICAgIC8vIChlLmcuIHdoZW4gdGhlIHVzZXIgZm9vbHMgYXJvdW5kIHdpdGggYSByYW5nZSBzbGlkZXIpXG4gICAgICAgICAgICBkZWJvdW5jZShzdG9yZVNldHRpbmdzLCAyNTAsIHNldHRpbmdzU3RvcmFnZUtleSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHJlc3RvcmVTZXR0aW5ncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHt9O1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgICAgIHNldHRpbmdzID0gSlNPTi5wYXJzZSh3aW5kb3cubG9jYWxTdG9yYWdlW3NldHRpbmdzU3RvcmFnZUtleV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYW5ndWxhci5leHRlbmQoc2V0dGluZ3MsIGRlZmF1bHRTZXR0aW5ncyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNldFNldHRpbmdzID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXR0aW5nc1trZXldID0gdmFsdWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFNldHRpbmdzID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5zZXR0aW5nc1trZXldO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zZXREZWZhdWx0U2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgZGVmYXVsdFNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIGlmICghJHNjb3BlLnNldHRpbmdzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U2V0dGluZ3Moa2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNldFZvbGF0aWxlU2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgJHNjb3BlLnZvbGF0aWxlU2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRWb2xhdGlsZVNldHRpbmdzID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS52b2xhdGlsZVNldHRpbmdzW2tleV07XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLiR3YXRjaCgnc2V0dGluZ3MnLCBzdG9yZVNldHRpbmdzRGVib3VuY2VkLCB0cnVlKTtcbiAgICAgICAgYW5ndWxhci5leHRlbmQoJHNjb3BlLnNldHRpbmdzLCByZXN0b3JlU2V0dGluZ3MoKSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2V0dGluZ3NTZWN0aW9uQ3ljbGluZ0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgY3ljbGluZyB0aHJvdWdoIGltYWdlIHNlY3Rpb25zXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2V0dGluZ3NTZWN0aW9uQ3ljbGluZ0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXAsIG1hcEltYWdlLCBrZXlib2FyZCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBmbGFnIHRvIHByZXZlbnQgY3ljbGluZyB3aGlsZSBhIG5ldyBpbWFnZSBpcyBsb2FkaW5nXG4gICAgICAgIHZhciBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGN5Y2xpbmdLZXkgPSAnc2VjdGlvbnMnO1xuICAgICAgICB2YXIgdmlldztcblxuICAgICAgICAvLyB2aWV3IGNlbnRlciBwb2ludCBvZiB0aGUgc3RhcnQgcG9zaXRpb25cbiAgICAgICAgdmFyIHN0YXJ0Q2VudGVyID0gWzAsIDBdO1xuICAgICAgICAvLyBudW1iZXIgb2YgcGl4ZWxzIHRvIHByb2NlZWQgaW4geCBhbmQgeSBkaXJlY3Rpb24gZm9yIGVhY2ggc3RlcFxuICAgICAgICB2YXIgc3RlcFNpemUgPSBbMCwgMF07XG4gICAgICAgIC8vIG51bWJlciBvZiBzdGVwcyBpbiB4IGFuZCB5IGRpcmVjdGlvbiAtMSFcbiAgICAgICAgdmFyIHN0ZXBDb3VudCA9IFswLCAwXTtcbiAgICAgICAgLy8gbnVtYmVyIG9mIGN1cnJlbnQgc3RlcCBpbiB4IGFuZCB5IGRpcmVjdGlvbiAtMSFcbiAgICAgICAgdmFyIGN1cnJlbnRTdGVwID0gWzAsIDBdO1xuXG4gICAgICAgIC8vIFRPRE8gcmVhY3Qgb24gd2luZG93IHJlc2l6ZSBldmVudHMgYW5kIGZvbGRvdXQgb3BlbiBhcyB3ZWxsIGFzXG4gICAgICAgIC8vIGNoYW5naW5nIHRoZSB6b29tIGxldmVsXG5cbiAgICAgICAgdmFyIGRpc3RhbmNlID0gZnVuY3Rpb24gKHAxLCBwMikge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhwMVswXSAtIHAyWzBdLCAyKSArIE1hdGgucG93KHAxWzFdIC0gcDJbMV0sIDIpKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpZiB0aGUgbWFwIHNpemUgd2FzIGNoYW5nZWQsIHRoaXMgZnVuY3Rpb24gZmluZHMgdGhlIG5leHQgbmVhcmVzdCBzdGVwXG4gICAgICAgIHZhciBmaW5kTmVhcmVzdFN0ZXAgPSBmdW5jdGlvbiAoY2VudGVyKSB7XG4gICAgICAgICAgICB2YXIgbmVhcmVzdCA9IEluZmluaXR5O1xuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSAwO1xuICAgICAgICAgICAgdmFyIG5lYXJlc3RTdGVwID0gWzAsIDBdO1xuICAgICAgICAgICAgZm9yICh2YXIgeSA9IDA7IHkgPD0gc3RlcENvdW50WzFdOyB5KyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8PSBzdGVwQ291bnRbMF07IHgrKykge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50ID0gZGlzdGFuY2UoY2VudGVyLCBnZXRTdGVwUG9zaXRpb24oW3gsIHldKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50IDwgbmVhcmVzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVhcmVzdFN0ZXBbMF0gPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVhcmVzdFN0ZXBbMV0gPSB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVhcmVzdCA9IGN1cnJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBuZWFyZXN0U3RlcDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyAocmUtKWNhbGN1bGF0ZSBhbGwgbmVlZGVkIHBvc2l0aW9ucyBhbmQgc2l6ZXMgZm9yIGN5Y2xpbmcgdGhyb3VnaCBzZWN0aW9uc1xuICAgICAgICB2YXIgdXBkYXRlRXh0ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmlldyA9IG1hcC5nZXRWaWV3KCk7XG4gICAgICAgICAgICAvLyBzZXQgdGhlIGV2ZW50IGxpc3RlbmVyIGhlcmUgaW4gY2FzZSB0aGUgdmlldyBjaGFuZ2VkXG4gICAgICAgICAgICB2aWV3Lm9uKCdjaGFuZ2U6cmVzb2x1dGlvbicsIGhhbmRsZVVzZXJab29tKTtcbiAgICAgICAgICAgIHZhciBpbWFnZUV4dGVudCA9IG1hcEltYWdlLmdldEV4dGVudCgpO1xuICAgICAgICAgICAgdmFyIHZpZXdFeHRlbnQgPSB2aWV3LmNhbGN1bGF0ZUV4dGVudChtYXAuZ2V0U2l6ZSgpKTtcblxuICAgICAgICAgICAgc3RlcFNpemVbMF0gPSB2aWV3RXh0ZW50WzJdIC0gdmlld0V4dGVudFswXTtcbiAgICAgICAgICAgIHN0ZXBTaXplWzFdID0gdmlld0V4dGVudFszXSAtIHZpZXdFeHRlbnRbMV07XG5cbiAgICAgICAgICAgIC8vIHNldCB0aGUgc3RhcnQgY2VudGVyIGJlZm9yZSBhZGp1c3RpbmcgdGhlIHN0ZXAgc2l6ZSB3aXRoIG92ZXJsYXBcbiAgICAgICAgICAgIHN0YXJ0Q2VudGVyWzBdID0gc3RlcFNpemVbMF0gLyAyO1xuICAgICAgICAgICAgc3RhcnRDZW50ZXJbMV0gPSBzdGVwU2l6ZVsxXSAvIDI7XG5cbiAgICAgICAgICAgIC8vIE1hdGguY2VpbCg0LjApIC0gMSBpcyBOT1QgZXF1aXZhbGVudCB0byBNYXRoLmZsb29yKDQuMCkhXG4gICAgICAgICAgICAvLyAtIDEgYmVjYXVzZSBzdGVwQ291bnQgYmVnaW5zIHdpdGggMCBzbyBhIHN0ZXBDb3VudCBvZiAxIG1lYW5zIDIgc3RlcHNcbiAgICAgICAgICAgIHN0ZXBDb3VudFswXSA9IE1hdGguY2VpbChpbWFnZUV4dGVudFsyXSAvIHN0ZXBTaXplWzBdKSAtIDE7XG4gICAgICAgICAgICBzdGVwQ291bnRbMV0gPSBNYXRoLmNlaWwoaW1hZ2VFeHRlbnRbM10gLyBzdGVwU2l6ZVsxXSkgLSAxO1xuXG4gICAgICAgICAgICB2YXIgb3ZlcmxhcDtcbiAgICAgICAgICAgIGlmIChzdGVwQ291bnRbMF0gPiAwKSB7XG4gICAgICAgICAgICAgICAgLy8gbWFrZSB0aGUgc2VjdGlvbnMgb3ZlcmxhcCBob3Jpem9uYWxseSBzbyB0aGV5IGV4YWN0bHkgY292ZXIgdGhlIGltYWdlXG4gICAgICAgICAgICAgICAgb3ZlcmxhcCA9IChzdGVwU2l6ZVswXSAqIChzdGVwQ291bnRbMF0gKyAxKSkgLSBpbWFnZUV4dGVudFsyXTtcbiAgICAgICAgICAgICAgICBzdGVwU2l6ZVswXSAtPSBvdmVybGFwIC8gc3RlcENvdW50WzBdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGVwU2l6ZVswXSA9IHZpZXdFeHRlbnRbMl07XG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBzdGFydCBwb2ludCBzbyB0aGUgaW1hZ2UgaXMgY2VudGVyZWQgaG9yaXpvbnRhbGx5XG4gICAgICAgICAgICAgICAgc3RhcnRDZW50ZXJbMF0gPSBpbWFnZUV4dGVudFsyXSAvIDI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdGVwQ291bnRbMV0gPiAwKSB7XG4gICAgICAgICAgICAgICAgLy8gbWFrZSB0aGUgc2VjdGlvbnMgb3ZlcmxhcCB2ZXJ0aWNhbGx5IHNvIHRoZXkgZXhhY3RseSBjb3ZlciB0aGUgaW1hZ2VcbiAgICAgICAgICAgICAgICBvdmVybGFwID0gKHN0ZXBTaXplWzFdICogKHN0ZXBDb3VudFsxXSArIDEpKSAtIGltYWdlRXh0ZW50WzNdO1xuICAgICAgICAgICAgICAgIHN0ZXBTaXplWzFdIC09IG92ZXJsYXAgLyBzdGVwQ291bnRbMV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0ZXBTaXplWzFdID0gdmlld0V4dGVudFszXTtcbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIHN0YXJ0IHBvaW50IHNvIHRoZSBpbWFnZSBpcyBjZW50ZXJlZCB2ZXJ0aWNhbGx5XG4gICAgICAgICAgICAgICAgc3RhcnRDZW50ZXJbMV0gPSBpbWFnZUV4dGVudFszXSAvIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZVVzZXJab29tID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdXBkYXRlRXh0ZW50KCk7XG4gICAgICAgICAgICAvLyBhbGxvdyB0aGUgdXNlciB0byBwYW4gYnV0IGdvIGJhY2sgdG8gdGhlIHJlZ3VsYXIgcHJldi9uZXh0IHN0ZXAgd2hlbiB0aGV5XG4gICAgICAgICAgICAvLyB3YW50IHRvIGNvbnRpbnVlIGN5Y2xpbmcsIG5vdCB0byB0aGUgY3VycmVudGx5IG5lYXJlc3Qgc3RlcFxuICAgICAgICAgICAgdmFyIHN0ZXAgPSBmaW5kTmVhcmVzdFN0ZXAoZ2V0U3RlcFBvc2l0aW9uKGN1cnJlbnRTdGVwKSk7XG4gICAgICAgICAgICBjdXJyZW50U3RlcFswXSA9IHN0ZXBbMF07XG4gICAgICAgICAgICBjdXJyZW50U3RlcFsxXSA9IHN0ZXBbMV07XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZU1hcFJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHVwZGF0ZUV4dGVudCgpO1xuICAgICAgICAgICAgZ29Ub1N0ZXAoZmluZE5lYXJlc3RTdGVwKHZpZXcuZ2V0Q2VudGVyKCkpKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZ29Ub1N0YXJ0U3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGdvVG9TdGVwKFswLCAwXSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGdvVG9FbmRTdGVwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZ29Ub1N0ZXAoc3RlcENvdW50KTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZ2V0U3RlcFBvc2l0aW9uID0gZnVuY3Rpb24gKHN0ZXApIHtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgc3RlcFswXSAqIHN0ZXBTaXplWzBdICsgc3RhcnRDZW50ZXJbMF0sXG4gICAgICAgICAgICAgICAgc3RlcFsxXSAqIHN0ZXBTaXplWzFdICsgc3RhcnRDZW50ZXJbMV0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBnb1RvU3RlcCA9IGZ1bmN0aW9uIChzdGVwKSB7XG4gICAgICAgICAgICAvLyBhbmltYXRlIHN0ZXBwaW5nXG4gICAgICAgICAgICAvLyB2YXIgcGFuID0gb2wuYW5pbWF0aW9uLnBhbih7XG4gICAgICAgICAgICAvLyAgICAgc291cmNlOiB2aWV3LmdldENlbnRlcigpLFxuICAgICAgICAgICAgLy8gICAgIGR1cmF0aW9uOiA1MDBcbiAgICAgICAgICAgIC8vIH0pO1xuICAgICAgICAgICAgLy8gbWFwLmJlZm9yZVJlbmRlcihwYW4pO1xuICAgICAgICAgICAgY3VycmVudFN0ZXBbMF0gPSBzdGVwWzBdO1xuICAgICAgICAgICAgY3VycmVudFN0ZXBbMV0gPSBzdGVwWzFdO1xuICAgICAgICAgICAgdmlldy5zZXRDZW50ZXIoZ2V0U3RlcFBvc2l0aW9uKGN1cnJlbnRTdGVwKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIG5leHRTdGVwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRTdGVwWzBdIDwgc3RlcENvdW50WzBdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtjdXJyZW50U3RlcFswXSArIDEsIGN1cnJlbnRTdGVwWzFdXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFswLCBjdXJyZW50U3RlcFsxXSArIDFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBwcmV2U3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50U3RlcFswXSA+IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2N1cnJlbnRTdGVwWzBdIC0gMSwgY3VycmVudFN0ZXBbMV1dO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW3N0ZXBDb3VudFswXSwgY3VycmVudFN0ZXBbMV0gLSAxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbmV4dFNlY3Rpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcgfHwgISRzY29wZS5jeWNsaW5nKCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTdGVwWzBdIDwgc3RlcENvdW50WzBdIHx8IGN1cnJlbnRTdGVwWzFdIDwgc3RlcENvdW50WzFdKSB7XG4gICAgICAgICAgICAgICAgZ29Ub1N0ZXAobmV4dFN0ZXAoKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKS50aGVuKHVwZGF0ZUV4dGVudCkudGhlbihnb1RvU3RhcnRTdGVwKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGFwcGx5IGlmIHRoaXMgd2FzIGNhbGxlZCBieSB0aGUga2V5Ym9hcmQgZXZlbnRcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNhbmNlbCBhbGwga2V5Ym9hcmQgZXZlbnRzIHdpdGggbG93ZXIgcHJpb3JpdHlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcHJldlNlY3Rpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcgfHwgISRzY29wZS5jeWNsaW5nKCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTdGVwWzBdID4gMCB8fCBjdXJyZW50U3RlcFsxXSA+IDApIHtcbiAgICAgICAgICAgICAgICBnb1RvU3RlcChwcmV2U3RlcCgpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnByZXZJbWFnZSgpLnRoZW4odXBkYXRlRXh0ZW50KS50aGVuKGdvVG9FbmRTdGVwKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGFwcGx5IGlmIHRoaXMgd2FzIGNhbGxlZCBieSB0aGUga2V5Ym9hcmQgZXZlbnRcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNhbmNlbCBhbGwga2V5Ym9hcmQgZXZlbnRzIHdpdGggbG93ZXIgcHJpb3JpdHlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzdG9wIGN5Y2xpbmcgdXNpbmcgYSBrZXlib2FyZCBldmVudFxuICAgICAgICB2YXIgc3RvcEN5Y2xpbmcgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgJHNjb3BlLnN0b3BDeWNsaW5nKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmN5Y2xpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmdldFZvbGF0aWxlU2V0dGluZ3MoJ2N5Y2xlJykgPT09IGN5Y2xpbmdLZXk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnN0YXJ0Q3ljbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScsIGN5Y2xpbmdLZXkpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zdG9wQ3ljbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScsICcnKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyB0aGUgY3ljbGUgc2V0dGluZ3MgbXkgYmUgc2V0IGJ5IG90aGVyIGNvbnRyb2xsZXJzLCB0b28sIHNvIHdhdGNoIGl0XG4gICAgICAgIC8vIGluc3RlYWQgb2YgdXNpbmcgdGhlIHN0YXJ0L3N0b3AgZnVuY3Rpb25zIHRvIGFkZC9yZW1vdmUgZXZlbnRzIGV0Yy5cbiAgICAgICAgJHNjb3BlLiR3YXRjaCgndm9sYXRpbGVTZXR0aW5ncy5jeWNsZScsIGZ1bmN0aW9uIChjeWNsZSwgb2xkQ3ljbGUpIHtcbiAgICAgICAgICAgIGlmIChjeWNsZSA9PT0gY3ljbGluZ0tleSkge1xuICAgICAgICAgICAgICAgIG1hcC5vbignY2hhbmdlOnNpemUnLCBoYW5kbGVNYXBSZXNpemUpO1xuICAgICAgICAgICAgICAgIHVwZGF0ZUV4dGVudCgpO1xuICAgICAgICAgICAgICAgIGdvVG9TdGFydFN0ZXAoKTtcbiAgICAgICAgICAgICAgICAvLyBvdmVycmlkZSBwcmV2aW91cyBpbWFnZSBvbiBhcnJvdyBsZWZ0XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMzcsIHByZXZTZWN0aW9uLCAxMCk7XG4gICAgICAgICAgICAgICAgLy8gb3ZlcnJpZGUgbmV4dCBpbWFnZSBvbiBhcnJvdyByaWdodCBhbmQgc3BhY2VcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzOSwgbmV4dFNlY3Rpb24sIDEwKTtcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzMiwgbmV4dFNlY3Rpb24sIDEwKTtcblxuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDI3LCBzdG9wQ3ljbGluZywgMTApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvbGRDeWNsZSA9PT0gY3ljbGluZ0tleSkge1xuICAgICAgICAgICAgICAgIG1hcC51bignY2hhbmdlOnNpemUnLCBoYW5kbGVNYXBSZXNpemUpO1xuICAgICAgICAgICAgICAgIHZpZXcudW4oJ2NoYW5nZTpyZXNvbHV0aW9uJywgaGFuZGxlVXNlclpvb20pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzNywgcHJldlNlY3Rpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzOSwgbmV4dFNlY3Rpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzMiwgbmV4dFNlY3Rpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigyNywgc3RvcEN5Y2xpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLnByZXZTZWN0aW9uID0gcHJldlNlY3Rpb247XG4gICAgICAgICRzY29wZS5uZXh0U2VjdGlvbiA9IG5leHRTZWN0aW9uO1xuICAgIH1cbik7XG5cbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2lkZWJhckNhdGVnb3J5Rm9sZG91dENvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgY2F0ZWdvcnkgZm9sZG91dCBidXR0b25cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTaWRlYmFyQ2F0ZWdvcnlGb2xkb3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGtleWJvYXJkKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAga2V5Ym9hcmQub24oOSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICRzY29wZS50b2dnbGVGb2xkb3V0KCdjYXRlZ29yaWVzJyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTaWRlYmFyQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NpZGViYXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBmb2xkb3V0U3RvcmFnZUtleSA9ICdkaWFzLmFubm90YXRpb25zLnNpZGViYXItZm9sZG91dCc7XG5cbiAgICAgICAgJHNjb3BlLmZvbGRvdXQgPSAnJztcblxuXHRcdCRzY29wZS5vcGVuRm9sZG91dCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW2ZvbGRvdXRTdG9yYWdlS2V5XSA9IG5hbWU7XG4gICAgICAgICAgICAkc2NvcGUuZm9sZG91dCA9IG5hbWU7XG5cdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NpZGViYXIuZm9sZG91dC5vcGVuJywgbmFtZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jbG9zZUZvbGRvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oZm9sZG91dFN0b3JhZ2VLZXkpO1xuXHRcdFx0JHNjb3BlLmZvbGRvdXQgPSAnJztcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2lkZWJhci5mb2xkb3V0LmNsb3NlJyk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVGb2xkb3V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcblx0XHRcdGlmICgkc2NvcGUuZm9sZG91dCA9PT0gbmFtZSkge1xuXHRcdFx0XHQkc2NvcGUuY2xvc2VGb2xkb3V0KCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUub3BlbkZvbGRvdXQobmFtZSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbignc2lkZWJhci5mb2xkb3V0LmRvLW9wZW4nLCBmdW5jdGlvbiAoZSwgbmFtZSkge1xuICAgICAgICAgICAgJHNjb3BlLm9wZW5Gb2xkb3V0KG5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyB0aGUgY3VycmVudGx5IG9wZW5lZCBzaWRlYmFyLSdleHRlbnNpb24nIGlzIHJlbWVtYmVyZWQgdGhyb3VnaCBsb2NhbFN0b3JhZ2VcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICAkc2NvcGUub3BlbkZvbGRvdXQod2luZG93LmxvY2FsU3RvcmFnZVtmb2xkb3V0U3RvcmFnZUtleV0pO1xuICAgICAgICB9XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgYW5ub3RhdGlvbkxpc3RJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEFuIGFubm90YXRpb24gbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmRpcmVjdGl2ZSgnYW5ub3RhdGlvbkxpc3RJdGVtJywgZnVuY3Rpb24gKGxhYmVscykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHNjb3BlOiB0cnVlLFxuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcdFx0XHQkc2NvcGUuc2hhcGVDbGFzcyA9ICdpY29uLScgKyAkc2NvcGUuYW5ub3RhdGlvbi5zaGFwZS50b0xvd2VyQ2FzZSgpO1xuXG5cdFx0XHRcdCRzY29wZS5zZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLmlzU2VsZWN0ZWQoJHNjb3BlLmFubm90YXRpb24uaWQpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5hdHRhY2hMYWJlbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRsYWJlbHMuYXR0YWNoVG9Bbm5vdGF0aW9uKCRzY29wZS5hbm5vdGF0aW9uKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUucmVtb3ZlTGFiZWwgPSBmdW5jdGlvbiAobGFiZWwpIHtcblx0XHRcdFx0XHRsYWJlbHMucmVtb3ZlRnJvbUFubm90YXRpb24oJHNjb3BlLmFubm90YXRpb24sIGxhYmVsKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuY2FuQXR0YWNoTGFiZWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS5zZWxlY3RlZCgpICYmIGxhYmVscy5oYXNTZWxlY3RlZCgpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5jdXJyZW50TGFiZWwgPSBsYWJlbHMuZ2V0U2VsZWN0ZWQ7XG5cblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRDb25maWRlbmNlID0gbGFiZWxzLmdldEN1cnJlbnRDb25maWRlbmNlO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgbGFiZWxDYXRlZ29yeUl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQSBsYWJlbCBjYXRlZ29yeSBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZGlyZWN0aXZlKCdsYWJlbENhdGVnb3J5SXRlbScsIGZ1bmN0aW9uICgkY29tcGlsZSwgJHRpbWVvdXQsICR0ZW1wbGF0ZUNhY2hlKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0MnLFxuXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2xhYmVsLWl0ZW0uaHRtbCcsXG5cbiAgICAgICAgICAgIHNjb3BlOiB0cnVlLFxuXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgLy8gd2FpdCBmb3IgdGhpcyBlbGVtZW50IHRvIGJlIHJlbmRlcmVkIHVudGlsIHRoZSBjaGlsZHJlbiBhcmVcbiAgICAgICAgICAgICAgICAvLyBhcHBlbmRlZCwgb3RoZXJ3aXNlIHRoZXJlIHdvdWxkIGJlIHRvbyBtdWNoIHJlY3Vyc2lvbiBmb3JcbiAgICAgICAgICAgICAgICAvLyBhbmd1bGFyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBhbmd1bGFyLmVsZW1lbnQoJHRlbXBsYXRlQ2FjaGUuZ2V0KCdsYWJlbC1zdWJ0cmVlLmh0bWwnKSk7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZCgkY29tcGlsZShjb250ZW50KShzY29wZSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgIC8vIG9wZW4gdGhlIHN1YnRyZWUgb2YgdGhpcyBpdGVtXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXRlbSBoYXMgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNFeHBhbmRhYmxlID0gJHNjb3BlLnRyZWUgJiYgISEkc2NvcGUudHJlZVskc2NvcGUuaXRlbS5pZF07XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpdGVtIGlzIGN1cnJlbnRseSBzZWxlY3RlZFxuICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAvLyBoYW5kbGUgdGhpcyBieSB0aGUgZXZlbnQgcmF0aGVyIHRoYW4gYW4gb3duIGNsaWNrIGhhbmRsZXIgdG9cbiAgICAgICAgICAgICAgICAvLyBkZWFsIHdpdGggY2xpY2sgYW5kIHNlYXJjaCBmaWVsZCBhY3Rpb25zIGluIGEgdW5pZmllZCB3YXlcbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdjYXRlZ29yaWVzLnNlbGVjdGVkJywgZnVuY3Rpb24gKGUsIGNhdGVnb3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGFuIGl0ZW0gaXMgc2VsZWN0ZWQsIGl0cyBzdWJ0cmVlIGFuZCBhbGwgcGFyZW50IGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIC8vIHNob3VsZCBiZSBvcGVuZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5pdGVtLmlkID09PSBjYXRlZ29yeS5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGhpdHMgYWxsIHBhcmVudCBzY29wZXMvaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnY2F0ZWdvcmllcy5vcGVuUGFyZW50cycpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgYSBjaGlsZCBpdGVtIHdhcyBzZWxlY3RlZCwgdGhpcyBpdGVtIHNob3VsZCBiZSBvcGVuZWQsIHRvb1xuICAgICAgICAgICAgICAgIC8vIHNvIHRoZSBzZWxlY3RlZCBpdGVtIGJlY29tZXMgdmlzaWJsZSBpbiB0aGUgdHJlZVxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMub3BlblBhcmVudHMnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gc3RvcCBwcm9wYWdhdGlvbiBpZiB0aGlzIGlzIGEgcm9vdCBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbS5wYXJlbnRfaWQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIGxhYmVsSXRlbVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBbiBhbm5vdGF0aW9uIGxhYmVsIGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5kaXJlY3RpdmUoJ2xhYmVsSXRlbScsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cdFx0XHRcdHZhciBjb25maWRlbmNlID0gJHNjb3BlLmFubm90YXRpb25MYWJlbC5jb25maWRlbmNlO1xuXG5cdFx0XHRcdGlmIChjb25maWRlbmNlIDw9IDAuMjUpIHtcblx0XHRcdFx0XHQkc2NvcGUuY2xhc3MgPSAnbGFiZWwtZGFuZ2VyJztcblx0XHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNSApIHtcblx0XHRcdFx0XHQkc2NvcGUuY2xhc3MgPSAnbGFiZWwtd2FybmluZyc7XG5cdFx0XHRcdH0gZWxzZSBpZiAoY29uZmlkZW5jZSA8PSAwLjc1ICkge1xuXHRcdFx0XHRcdCRzY29wZS5jbGFzcyA9ICdsYWJlbC1zdWNjZXNzJztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQkc2NvcGUuY2xhc3MgPSAnbGFiZWwtcHJpbWFyeSc7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBkZWJvdW5jZVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBIGRlYm91bmNlIHNlcnZpY2UgdG8gcGVyZm9ybSBhbiBhY3Rpb24gb25seSB3aGVuIHRoaXMgZnVuY3Rpb25cbiAqIHdhc24ndCBjYWxsZWQgYWdhaW4gaW4gYSBzaG9ydCBwZXJpb2Qgb2YgdGltZS5cbiAqIHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMzMyMDAxNi8xNzk2NTIzXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZmFjdG9yeSgnZGVib3VuY2UnLCBmdW5jdGlvbiAoJHRpbWVvdXQsICRxKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgdGltZW91dHMgPSB7fTtcblxuXHRcdHJldHVybiBmdW5jdGlvbiAoZnVuYywgd2FpdCwgaWQpIHtcblx0XHRcdC8vIENyZWF0ZSBhIGRlZmVycmVkIG9iamVjdCB0aGF0IHdpbGwgYmUgcmVzb2x2ZWQgd2hlbiB3ZSBuZWVkIHRvXG5cdFx0XHQvLyBhY3R1YWxseSBjYWxsIHRoZSBmdW5jXG5cdFx0XHR2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXHRcdFx0cmV0dXJuIChmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXHRcdFx0XHR2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR0aW1lb3V0c1tpZF0gPSB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpKTtcblx0XHRcdFx0XHRkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGlmICh0aW1lb3V0c1tpZF0pIHtcblx0XHRcdFx0XHQkdGltZW91dC5jYW5jZWwodGltZW91dHNbaWRdKTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aW1lb3V0c1tpZF0gPSAkdGltZW91dChsYXRlciwgd2FpdCk7XG5cdFx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuXHRcdFx0fSkoKTtcblx0XHR9O1xuXHR9XG4pOyIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZmFjdG9yeVxuICogQG5hbWUgbWFwXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgZmFjdG9yeSBoYW5kbGluZyBPcGVuTGF5ZXJzIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmZhY3RvcnkoJ21hcCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBtYXAgPSBuZXcgb2wuTWFwKHtcblx0XHRcdHRhcmdldDogJ2NhbnZhcycsXG4gICAgICAgICAgICByZW5kZXJlcjogJ2NhbnZhcycsXG5cdFx0XHRjb250cm9sczogW1xuXHRcdFx0XHRuZXcgb2wuY29udHJvbC5ab29tKCksXG5cdFx0XHRcdG5ldyBvbC5jb250cm9sLlpvb21Ub0V4dGVudCgpLFxuXHRcdFx0XHRuZXcgb2wuY29udHJvbC5GdWxsU2NyZWVuKClcblx0XHRcdF0sXG4gICAgICAgICAgICBpbnRlcmFjdGlvbnM6IG9sLmludGVyYWN0aW9uLmRlZmF1bHRzKHtcbiAgICAgICAgICAgICAgICBrZXlib2FyZDogZmFsc2VcbiAgICAgICAgICAgIH0pXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gbWFwO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBhbm5vdGF0aW9uc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgdGhlIGFubm90YXRpb25zIHRvIG1ha2UgdGhlbSBhdmFpbGFibGUgaW4gbXVsdGlwbGUgY29udHJvbGxlcnMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnYW5ub3RhdGlvbnMnLCBmdW5jdGlvbiAoQW5ub3RhdGlvbiwgc2hhcGVzLCBtc2cpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciBhbm5vdGF0aW9ucztcbiAgICAgICAgdmFyIHByb21pc2U7XG5cblx0XHR2YXIgcmVzb2x2ZVNoYXBlTmFtZSA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHRhbm5vdGF0aW9uLnNoYXBlID0gc2hhcGVzLmdldE5hbWUoYW5ub3RhdGlvbi5zaGFwZV9pZCk7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbjtcblx0XHR9O1xuXG5cdFx0dmFyIGFkZEFubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0YW5ub3RhdGlvbnMucHVzaChhbm5vdGF0aW9uKTtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR0aGlzLnF1ZXJ5ID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0YW5ub3RhdGlvbnMgPSBBbm5vdGF0aW9uLnF1ZXJ5KHBhcmFtcyk7XG4gICAgICAgICAgICBwcm9taXNlID0gYW5ub3RhdGlvbnMuJHByb21pc2U7XG5cdFx0XHRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKGEpIHtcblx0XHRcdFx0YS5mb3JFYWNoKHJlc29sdmVTaGFwZU5hbWUpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnM7XG5cdFx0fTtcblxuXHRcdHRoaXMuYWRkID0gZnVuY3Rpb24gKHBhcmFtcykge1xuXHRcdFx0aWYgKCFwYXJhbXMuc2hhcGVfaWQgJiYgcGFyYW1zLnNoYXBlKSB7XG5cdFx0XHRcdHBhcmFtcy5zaGFwZV9pZCA9IHNoYXBlcy5nZXRJZChwYXJhbXMuc2hhcGUpO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGFubm90YXRpb24gPSBBbm5vdGF0aW9uLmFkZChwYXJhbXMpO1xuXHRcdFx0YW5ub3RhdGlvbi4kcHJvbWlzZVxuXHRcdFx0ICAgICAgICAgIC50aGVuKHJlc29sdmVTaGFwZU5hbWUpXG5cdFx0XHQgICAgICAgICAgLnRoZW4oYWRkQW5ub3RhdGlvbilcblx0XHRcdCAgICAgICAgICAuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuXG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbjtcblx0XHR9O1xuXG5cdFx0dGhpcy5kZWxldGUgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0Ly8gdXNlIGluZGV4IHRvIHNlZSBpZiB0aGUgYW5ub3RhdGlvbiBleGlzdHMgaW4gdGhlIGFubm90YXRpb25zIGxpc3Rcblx0XHRcdHZhciBpbmRleCA9IGFubm90YXRpb25zLmluZGV4T2YoYW5ub3RhdGlvbik7XG5cdFx0XHRpZiAoaW5kZXggPiAtMSkge1xuXHRcdFx0XHRyZXR1cm4gYW5ub3RhdGlvbi4kZGVsZXRlKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQvLyB1cGRhdGUgdGhlIGluZGV4IHNpbmNlIHRoZSBhbm5vdGF0aW9ucyBsaXN0IG1heSBoYXZlIGJlZW5cblx0XHRcdFx0XHQvLyBtb2RpZmllZCBpbiB0aGUgbWVhbnRpbWVcblx0XHRcdFx0XHRpbmRleCA9IGFubm90YXRpb25zLmluZGV4T2YoYW5ub3RhdGlvbik7XG5cdFx0XHRcdFx0YW5ub3RhdGlvbnMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0fSwgbXNnLnJlc3BvbnNlRXJyb3IpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLmZvckVhY2ggPSBmdW5jdGlvbiAoZm4pIHtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9ucy5mb3JFYWNoKGZuKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5jdXJyZW50ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb25zO1xuXHRcdH07XG5cbiAgICAgICAgdGhpcy5nZXRQcm9taXNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGltYWdlc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBNYW5hZ2VzIChwcmUtKWxvYWRpbmcgb2YgdGhlIGltYWdlcyB0byBhbm5vdGF0ZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdpbWFnZXMnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgVHJhbnNlY3RJbWFnZSwgVVJMLCAkcSwgZmlsdGVyU3Vic2V0LCBUUkFOU0VDVF9JRCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIF90aGlzID0gdGhpcztcblx0XHQvLyBhcnJheSBvZiBhbGwgaW1hZ2UgSURzIG9mIHRoZSB0cmFuc2VjdFxuXHRcdHZhciBpbWFnZUlkcyA9IFtdO1xuXHRcdC8vIG1heGltdW0gbnVtYmVyIG9mIGltYWdlcyB0byBob2xkIGluIGJ1ZmZlclxuXHRcdHZhciBNQVhfQlVGRkVSX1NJWkUgPSAxMDtcblx0XHQvLyBidWZmZXIgb2YgYWxyZWFkeSBsb2FkZWQgaW1hZ2VzXG5cdFx0dmFyIGJ1ZmZlciA9IFtdO1xuXG5cdFx0Ly8gdGhlIGN1cnJlbnRseSBzaG93biBpbWFnZVxuXHRcdHRoaXMuY3VycmVudEltYWdlID0gdW5kZWZpbmVkO1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgbmV4dCBJRCBvZiB0aGUgc3BlY2lmaWVkIGltYWdlIG9yIHRoZSBuZXh0IElEIG9mIHRoZVxuXHRcdCAqIGN1cnJlbnQgaW1hZ2UgaWYgbm8gaW1hZ2Ugd2FzIHNwZWNpZmllZC5cblx0XHQgKi9cblx0XHR2YXIgbmV4dElkID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRpZCA9IGlkIHx8IF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0XHR2YXIgaW5kZXggPSBpbWFnZUlkcy5pbmRleE9mKGlkKTtcblx0XHRcdHJldHVybiBpbWFnZUlkc1soaW5kZXggKyAxKSAlIGltYWdlSWRzLmxlbmd0aF07XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIHByZXZpb3VzIElEIG9mIHRoZSBzcGVjaWZpZWQgaW1hZ2Ugb3IgdGhlIHByZXZpb3VzIElEIG9mXG5cdFx0ICogdGhlIGN1cnJlbnQgaW1hZ2UgaWYgbm8gaW1hZ2Ugd2FzIHNwZWNpZmllZC5cblx0XHQgKi9cblx0XHR2YXIgcHJldklkID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRpZCA9IGlkIHx8IF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0XHR2YXIgaW5kZXggPSBpbWFnZUlkcy5pbmRleE9mKGlkKTtcblx0XHRcdHZhciBsZW5ndGggPSBpbWFnZUlkcy5sZW5ndGg7XG5cdFx0XHRyZXR1cm4gaW1hZ2VJZHNbKGluZGV4IC0gMSArIGxlbmd0aCkgJSBsZW5ndGhdO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBzcGVjaWZpZWQgaW1hZ2UgZnJvbSB0aGUgYnVmZmVyIG9yIGB1bmRlZmluZWRgIGlmIGl0IGlzXG5cdFx0ICogbm90IGJ1ZmZlcmVkLlxuXHRcdCAqL1xuXHRcdHZhciBnZXRJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0aWQgPSBpZCB8fCBfdGhpcy5jdXJyZW50SW1hZ2UuX2lkO1xuXHRcdFx0Zm9yICh2YXIgaSA9IGJ1ZmZlci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRpZiAoYnVmZmVyW2ldLl9pZCA9PSBpZCkgcmV0dXJuIGJ1ZmZlcltpXTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2V0cyB0aGUgc3BlY2lmaWVkIGltYWdlIHRvIGFzIHRoZSBjdXJyZW50bHkgc2hvd24gaW1hZ2UuXG5cdFx0ICovXG5cdFx0dmFyIHNob3cgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdF90aGlzLmN1cnJlbnRJbWFnZSA9IGdldEltYWdlKGlkKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogTG9hZHMgdGhlIHNwZWNpZmllZCBpbWFnZSBlaXRoZXIgZnJvbSBidWZmZXIgb3IgZnJvbSB0aGUgZXh0ZXJuYWxcblx0XHQgKiByZXNvdXJjZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBnZXRzIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzXG5cdFx0ICogbG9hZGVkLlxuXHRcdCAqL1xuXHRcdHZhciBmZXRjaEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXHRcdFx0dmFyIGltZyA9IGdldEltYWdlKGlkKTtcblxuXHRcdFx0aWYgKGltZykge1xuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGltZyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcblx0XHRcdFx0aW1nLl9pZCA9IGlkO1xuXHRcdFx0XHRpbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGJ1ZmZlci5wdXNoKGltZyk7XG5cdFx0XHRcdFx0Ly8gY29udHJvbCBtYXhpbXVtIGJ1ZmZlciBzaXplXG5cdFx0XHRcdFx0aWYgKGJ1ZmZlci5sZW5ndGggPiBNQVhfQlVGRkVSX1NJWkUpIHtcblx0XHRcdFx0XHRcdGJ1ZmZlci5zaGlmdCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGltZyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGltZy5vbmVycm9yID0gZnVuY3Rpb24gKG1zZykge1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlamVjdChtc2cpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRpbWcuc3JjID0gVVJMICsgXCIvYXBpL3YxL2ltYWdlcy9cIiArIGlkICsgXCIvZmlsZVwiO1xuXHRcdFx0fVxuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2ltYWdlLmZldGNoaW5nJywgaW1nKTtcblxuXHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEluaXRpYWxpemVzIHRoZSBzZXJ2aWNlIGZvciBhIGdpdmVuIHRyYW5zZWN0LiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0XG5cdFx0ICogaXMgcmVzb2x2ZWQsIHdoZW4gdGhlIHNlcnZpY2UgaXMgaW5pdGlhbGl6ZWQuXG5cdFx0ICovXG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aW1hZ2VJZHMgPSBUcmFuc2VjdEltYWdlLnF1ZXJ5KHt0cmFuc2VjdF9pZDogVFJBTlNFQ1RfSUR9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gbG9vayBmb3IgYSBzZXF1ZW5jZSBvZiBpbWFnZSBJRHMgaW4gbG9jYWwgc3RvcmFnZS5cbiAgICAgICAgICAgICAgICAvLyB0aGlzIHNlcXVlbmNlIGlzIHByb2R1Y2VzIGJ5IHRoZSB0cmFuc2VjdCBpbmRleCBwYWdlIHdoZW4gdGhlIGltYWdlcyBhcmVcbiAgICAgICAgICAgICAgICAvLyBzb3J0ZWQgb3IgZmlsdGVyZWQuIHdlIHdhbnQgdG8gcmVmbGVjdCB0aGUgc2FtZSBvcmRlcmluZyBvciBmaWx0ZXJpbmcgaGVyZVxuICAgICAgICAgICAgICAgIC8vIGluIHRoZSBhbm5vdGF0b3JcbiAgICAgICAgICAgICAgICB2YXIgc3RvcmVkU2VxdWVuY2UgPSB3aW5kb3cubG9jYWxTdG9yYWdlWydkaWFzLnRyYW5zZWN0cy4nICsgVFJBTlNFQ1RfSUQgKyAnLmltYWdlcyddO1xuICAgICAgICAgICAgICAgIGlmIChzdG9yZWRTZXF1ZW5jZSkge1xuICAgICAgICAgICAgICAgICAgICBzdG9yZWRTZXF1ZW5jZSA9IEpTT04ucGFyc2Uoc3RvcmVkU2VxdWVuY2UpO1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBzdWNoIGEgc3RvcmVkIHNlcXVlbmNlLCBmaWx0ZXIgb3V0IGFueSBpbWFnZSBJRHMgdGhhdCBkbyBub3RcbiAgICAgICAgICAgICAgICAgICAgLy8gYmVsb25nIHRvIHRoZSB0cmFuc2VjdCAoYW55IG1vcmUpLCBzaW5jZSBzb21lIG9mIHRoZW0gbWF5IGhhdmUgYmVlbiBkZWxldGVkXG4gICAgICAgICAgICAgICAgICAgIC8vIGluIHRoZSBtZWFudGltZVxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJTdWJzZXQoc3RvcmVkU2VxdWVuY2UsIGltYWdlSWRzKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHRoZSBwcm9taXNlIGlzIG5vdCByZW1vdmVkIHdoZW4gb3ZlcndyaXRpbmcgaW1hZ2VJZHMgc2luY2Ugd2VcbiAgICAgICAgICAgICAgICAgICAgLy8gbmVlZCBpdCBsYXRlciBvbi5cbiAgICAgICAgICAgICAgICAgICAgc3RvcmVkU2VxdWVuY2UuJHByb21pc2UgPSBpbWFnZUlkcy4kcHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmVkU2VxdWVuY2UuJHJlc29sdmVkID0gaW1hZ2VJZHMuJHJlc29sdmVkO1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGVuIHNldCB0aGUgc3RvcmVkIHNlcXVlbmNlIGFzIHRoZSBzZXF1ZW5jZSBvZiBpbWFnZSBJRHMgaW5zdGVhZCBvZiBzaW1wbHlcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxsIElEcyBiZWxvbmdpbmcgdG8gdGhlIHRyYW5zZWN0XG4gICAgICAgICAgICAgICAgICAgIGltYWdlSWRzID0gc3RvcmVkU2VxdWVuY2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cblx0XHRcdHJldHVybiBpbWFnZUlkcy4kcHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2hvdyB0aGUgaW1hZ2Ugd2l0aCB0aGUgc3BlY2lmaWVkIElELiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzXG5cdFx0ICogcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXMgc2hvd24uXG5cdFx0ICovXG5cdFx0dGhpcy5zaG93ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgcHJvbWlzZSA9IGZldGNoSW1hZ2UoaWQpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHNob3coaWQpO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIHdhaXQgZm9yIGltYWdlSWRzIHRvIGJlIGxvYWRlZFxuXHRcdFx0aW1hZ2VJZHMuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdC8vIHByZS1sb2FkIHByZXZpb3VzIGFuZCBuZXh0IGltYWdlcyBidXQgZG9uJ3QgZGlzcGxheSB0aGVtXG5cdFx0XHRcdGZldGNoSW1hZ2UobmV4dElkKGlkKSk7XG5cdFx0XHRcdGZldGNoSW1hZ2UocHJldklkKGlkKSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHByb21pc2U7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNob3cgdGhlIG5leHQgaW1hZ2UuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXNcblx0XHQgKiByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpcyBzaG93bi5cblx0XHQgKi9cblx0XHR0aGlzLm5leHQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3RoaXMuc2hvdyhuZXh0SWQoKSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNob3cgdGhlIHByZXZpb3VzIGltYWdlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzXG5cdFx0ICogcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXMgc2hvd24uXG5cdFx0ICovXG5cdFx0dGhpcy5wcmV2ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF90aGlzLnNob3cocHJldklkKCkpO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldEN1cnJlbnRJZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfdGhpcy5jdXJyZW50SW1hZ2UuX2lkO1xuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGtleWJvYXJkXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFNlcnZpY2UgdG8gcmVnaXN0ZXIgYW5kIG1hbmFnZSBrZXlwcmVzcyBldmVudHMgd2l0aCBwcmlvcml0aWVzXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgna2V5Ym9hcmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIG1hcHMga2V5IGNvZGVzL2NoYXJhY3RlcnMgdG8gYXJyYXlzIG9mIGxpc3RlbmVyc1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0ge307XG5cbiAgICAgICAgdmFyIGV4ZWN1dGVDYWxsYmFja3MgPSBmdW5jdGlvbiAobGlzdCwgZSkge1xuICAgICAgICAgICAgLy8gZ28gZnJvbSBoaWdoZXN0IHByaW9yaXR5IGRvd25cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgLy8gY2FsbGJhY2tzIGNhbiBjYW5jZWwgZnVydGhlciBwcm9wYWdhdGlvblxuICAgICAgICAgICAgICAgIGlmIChsaXN0W2ldLmNhbGxiYWNrKGUpID09PSBmYWxzZSkgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBoYW5kbGVLZXlFdmVudHMgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIGNvZGUgPSBlLmtleUNvZGU7XG4gICAgICAgICAgICB2YXIgY2hhcmFjdGVyID0gU3RyaW5nLmZyb21DaGFyQ29kZShlLndoaWNoIHx8IGNvZGUpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbY29kZV0pIHtcbiAgICAgICAgICAgICAgICBleGVjdXRlQ2FsbGJhY2tzKGxpc3RlbmVyc1tjb2RlXSwgZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbY2hhcmFjdGVyXSkge1xuICAgICAgICAgICAgICAgIGV4ZWN1dGVDYWxsYmFja3MobGlzdGVuZXJzW2NoYXJhY3Rlcl0sIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlFdmVudHMpO1xuXG4gICAgICAgIC8vIHJlZ2lzdGVyIGEgbmV3IGV2ZW50IGxpc3RlbmVyIGZvciB0aGUga2V5IGNvZGUgb3IgY2hhcmFjdGVyIHdpdGggYW4gb3B0aW9uYWwgcHJpb3JpdHlcbiAgICAgICAgLy8gbGlzdGVuZXJzIHdpdGggaGlnaGVyIHByaW9yaXR5IGFyZSBjYWxsZWQgZmlyc3QgYW5jIGNhbiByZXR1cm4gJ2ZhbHNlJyB0byBwcmV2ZW50IHRoZVxuICAgICAgICAvLyBsaXN0ZW5lcnMgd2l0aCBsb3dlciBwcmlvcml0eSBmcm9tIGJlaW5nIGNhbGxlZFxuICAgICAgICB0aGlzLm9uID0gZnVuY3Rpb24gKGNoYXJPckNvZGUsIGNhbGxiYWNrLCBwcmlvcml0eSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjaGFyT3JDb2RlID09PSAnc3RyaW5nJyB8fCBjaGFyT3JDb2RlIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgY2hhck9yQ29kZSA9IGNoYXJPckNvZGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpb3JpdHkgPSBwcmlvcml0eSB8fCAwO1xuICAgICAgICAgICAgdmFyIGxpc3RlbmVyID0ge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayxcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogcHJpb3JpdHlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbY2hhck9yQ29kZV0pIHtcbiAgICAgICAgICAgICAgICB2YXIgbGlzdCA9IGxpc3RlbmVyc1tjaGFyT3JDb2RlXTtcbiAgICAgICAgICAgICAgICB2YXIgaTtcblxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaXN0W2ldLnByaW9yaXR5ID49IHByaW9yaXR5KSBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gbGlzdC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3QucHVzaChsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoaSwgMCwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnNbY2hhck9yQ29kZV0gPSBbbGlzdGVuZXJdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHVucmVnaXN0ZXIgYW4gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgdGhpcy5vZmYgPSBmdW5jdGlvbiAoY2hhck9yQ29kZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2hhck9yQ29kZSA9PT0gJ3N0cmluZycgfHwgY2hhck9yQ29kZSBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICAgICAgICAgIGNoYXJPckNvZGUgPSBjaGFyT3JDb2RlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbY2hhck9yQ29kZV0pIHtcbiAgICAgICAgICAgICAgICB2YXIgbGlzdCA9IGxpc3RlbmVyc1tjaGFyT3JDb2RlXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RbaV0uY2FsbGJhY2sgPT09IGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGxhYmVsc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgZm9yIGFubm90YXRpb24gbGFiZWxzIHRvIHByb3ZpZGUgc29tZSBjb252ZW5pZW5jZSBmdW5jdGlvbnMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnbGFiZWxzJywgZnVuY3Rpb24gKEFubm90YXRpb25MYWJlbCwgTGFiZWwsIFByb2plY3RMYWJlbCwgUHJvamVjdCwgbXNnLCAkcSwgUFJPSkVDVF9JRFMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkTGFiZWw7XG4gICAgICAgIHZhciBjdXJyZW50Q29uZmlkZW5jZSA9IDEuMDtcblxuICAgICAgICB2YXIgbGFiZWxzID0ge307XG5cbiAgICAgICAgLy8gdGhpcyBwcm9taXNlIGlzIHJlc29sdmVkIHdoZW4gYWxsIGxhYmVscyB3ZXJlIGxvYWRlZFxuICAgICAgICB0aGlzLnByb21pc2UgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZmV0Y2hGb3JBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcbiAgICAgICAgICAgIGlmICghYW5ub3RhdGlvbikgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyBkb24ndCBmZXRjaCB0d2ljZVxuICAgICAgICAgICAgaWYgKCFhbm5vdGF0aW9uLmxhYmVscykge1xuICAgICAgICAgICAgICAgIGFubm90YXRpb24ubGFiZWxzID0gQW5ub3RhdGlvbkxhYmVsLnF1ZXJ5KHtcbiAgICAgICAgICAgICAgICAgICAgYW5ub3RhdGlvbl9pZDogYW5ub3RhdGlvbi5pZFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYW5ub3RhdGlvbi5sYWJlbHM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hdHRhY2hUb0Fubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gQW5ub3RhdGlvbkxhYmVsLmF0dGFjaCh7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbl9pZDogYW5ub3RhdGlvbi5pZCxcbiAgICAgICAgICAgICAgICBsYWJlbF9pZDogc2VsZWN0ZWRMYWJlbC5pZCxcbiAgICAgICAgICAgICAgICBjb25maWRlbmNlOiBjdXJyZW50Q29uZmlkZW5jZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxhYmVsLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGFubm90YXRpb24ubGFiZWxzLnB1c2gobGFiZWwpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxhYmVsLiRwcm9taXNlLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcblxuICAgICAgICAgICAgcmV0dXJuIGxhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucmVtb3ZlRnJvbUFubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbiwgbGFiZWwpIHtcbiAgICAgICAgICAgIC8vIHVzZSBpbmRleCB0byBzZWUgaWYgdGhlIGxhYmVsIGV4aXN0cyBmb3IgdGhlIGFubm90YXRpb25cbiAgICAgICAgICAgIHZhciBpbmRleCA9IGFubm90YXRpb24ubGFiZWxzLmluZGV4T2YobGFiZWwpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQW5ub3RhdGlvbkxhYmVsLmRlbGV0ZSh7aWQ6IGxhYmVsLmlkfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGluZGV4IHNpbmNlIHRoZSBsYWJlbCBsaXN0IG1heSBoYXZlIGJlZW4gbW9kaWZpZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIG1lYW50aW1lXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gYW5ub3RhdGlvbi5sYWJlbHMuaW5kZXhPZihsYWJlbCk7XG4gICAgICAgICAgICAgICAgICAgIGFubm90YXRpb24ubGFiZWxzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgfSwgbXNnLnJlc3BvbnNlRXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0VHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge307XG4gICAgICAgICAgICB2YXIga2V5ID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBidWlsZCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBsYWJlbC5wYXJlbnRfaWQ7XG4gICAgICAgICAgICAgICAgaWYgKHRyZWVba2V5XVtwYXJlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XVtwYXJlbnRdLnB1c2gobGFiZWwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XVtwYXJlbnRdID0gW2xhYmVsXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnByb21pc2UudGhlbihmdW5jdGlvbiAobGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyZWVba2V5XSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBsYWJlbHNba2V5XS5mb3JFYWNoKGJ1aWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbGFiZWxzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2V0U2VsZWN0ZWQgPSBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkTGFiZWwgPSBsYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldFNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGVkTGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIXNlbGVjdGVkTGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRDdXJyZW50Q29uZmlkZW5jZSA9IGZ1bmN0aW9uIChjb25maWRlbmNlKSB7XG4gICAgICAgICAgICBjdXJyZW50Q29uZmlkZW5jZSA9IGNvbmZpZGVuY2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRDdXJyZW50Q29uZmlkZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50Q29uZmlkZW5jZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpbml0XG4gICAgICAgIChmdW5jdGlvbiAoX3RoaXMpIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBfdGhpcy5wcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIC8vIC0xIGJlY2F1c2Ugb2YgZ2xvYmFsIGxhYmVsc1xuICAgICAgICAgICAgdmFyIGZpbmlzaGVkID0gLTE7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFsbCBsYWJlbHMgYXJlIHRoZXJlLiBpZiB5ZXMsIHJlc29sdmVcbiAgICAgICAgICAgIHZhciBtYXliZVJlc29sdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCsrZmluaXNoZWQgPT09IFBST0pFQ1RfSURTLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGxhYmVscyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbGFiZWxzW251bGxdID0gTGFiZWwucXVlcnkobWF5YmVSZXNvbHZlKTtcblxuICAgICAgICAgICAgUFJPSkVDVF9JRFMuZm9yRWFjaChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgICAgICBQcm9qZWN0LmdldCh7aWQ6IGlkfSwgZnVuY3Rpb24gKHByb2plY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxzW3Byb2plY3QubmFtZV0gPSBQcm9qZWN0TGFiZWwucXVlcnkoe3Byb2plY3RfaWQ6IGlkfSwgbWF5YmVSZXNvbHZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSh0aGlzKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBtYXBBbm5vdGF0aW9uc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgaGFuZGxpbmcgdGhlIGFubm90YXRpb25zIGxheWVyIG9uIHRoZSBPcGVuTGF5ZXJzIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ21hcEFubm90YXRpb25zJywgZnVuY3Rpb24gKG1hcCwgaW1hZ2VzLCBhbm5vdGF0aW9ucywgZGVib3VuY2UsIHN0eWxlcywgJGludGVydmFsLCBsYWJlbHMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgYW5ub3RhdGlvbkZlYXR1cmVzID0gbmV3IG9sLkNvbGxlY3Rpb24oKTtcbiAgICAgICAgdmFyIGFubm90YXRpb25Tb3VyY2UgPSBuZXcgb2wuc291cmNlLlZlY3Rvcih7XG4gICAgICAgICAgICBmZWF0dXJlczogYW5ub3RhdGlvbkZlYXR1cmVzXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgYW5ub3RhdGlvbkxheWVyID0gbmV3IG9sLmxheWVyLlZlY3Rvcih7XG4gICAgICAgICAgICBzb3VyY2U6IGFubm90YXRpb25Tb3VyY2UsXG4gICAgICAgICAgICBzdHlsZTogc3R5bGVzLmZlYXR1cmVzLFxuICAgICAgICAgICAgekluZGV4OiAxMDBcbiAgICAgICAgfSk7XG5cblx0XHQvLyBzZWxlY3QgaW50ZXJhY3Rpb24gd29ya2luZyBvbiBcInNpbmdsZWNsaWNrXCJcblx0XHR2YXIgc2VsZWN0ID0gbmV3IG9sLmludGVyYWN0aW9uLlNlbGVjdCh7XG5cdFx0XHRzdHlsZTogc3R5bGVzLmhpZ2hsaWdodCxcbiAgICAgICAgICAgIGxheWVyczogW2Fubm90YXRpb25MYXllcl0sXG4gICAgICAgICAgICAvLyBlbmFibGUgc2VsZWN0aW5nIG11bHRpcGxlIG92ZXJsYXBwaW5nIGZlYXR1cmVzIGF0IG9uY2VcbiAgICAgICAgICAgIG11bHRpOiB0cnVlXG5cdFx0fSk7XG5cblx0XHR2YXIgc2VsZWN0ZWRGZWF0dXJlcyA9IHNlbGVjdC5nZXRGZWF0dXJlcygpO1xuXG5cdFx0dmFyIG1vZGlmeSA9IG5ldyBvbC5pbnRlcmFjdGlvbi5Nb2RpZnkoe1xuXHRcdFx0ZmVhdHVyZXM6IGFubm90YXRpb25GZWF0dXJlcyxcblx0XHRcdC8vIHRoZSBTSElGVCBrZXkgbXVzdCBiZSBwcmVzc2VkIHRvIGRlbGV0ZSB2ZXJ0aWNlcywgc29cblx0XHRcdC8vIHRoYXQgbmV3IHZlcnRpY2VzIGNhbiBiZSBkcmF3biBhdCB0aGUgc2FtZSBwb3NpdGlvblxuXHRcdFx0Ly8gb2YgZXhpc3RpbmcgdmVydGljZXNcblx0XHRcdGRlbGV0ZUNvbmRpdGlvbjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0cmV0dXJuIG9sLmV2ZW50cy5jb25kaXRpb24uc2hpZnRLZXlPbmx5KGV2ZW50KSAmJiBvbC5ldmVudHMuY29uZGl0aW9uLnNpbmdsZUNsaWNrKGV2ZW50KTtcblx0XHRcdH1cblx0XHR9KTtcblxuICAgICAgICBtb2RpZnkuc2V0QWN0aXZlKGZhbHNlKTtcblxuICAgICAgICB2YXIgdHJhbnNsYXRlID0gbmV3IG9sLmludGVyYWN0aW9uLlRyYW5zbGF0ZSh7XG4gICAgICAgICAgICBmZWF0dXJlczogc2VsZWN0ZWRGZWF0dXJlc1xuICAgICAgICB9KTtcblxuICAgICAgICB0cmFuc2xhdGUuc2V0QWN0aXZlKGZhbHNlKTtcblxuXHRcdC8vIGRyYXdpbmcgaW50ZXJhY3Rpb25cblx0XHR2YXIgZHJhdztcbiAgICAgICAgLy8gdHlwZS9zaGFwZSBvZiB0aGUgZHJhd2luZyBpbnRlcmFjdGlvblxuICAgICAgICB2YXIgZHJhd2luZ1R5cGU7XG5cbiAgICAgICAgLy8gaW5kZXggb2YgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBhbm5vdGF0aW9uIChkdXJpbmcgY3ljbGluZyB0aHJvdWdoIGFubm90YXRpb25zKVxuICAgICAgICAvLyBpbiB0aGUgYW5ub3RhdGlvbkZlYXR1cmVzIGNvbGxlY3Rpb25cbiAgICAgICAgdmFyIGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggPSAwO1xuXG4gICAgICAgIHZhciBsYXN0RHJhd25GZWF0dXJlO1xuXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgLy8gc2NvcGUgb2YgdGhlIENhbnZhc0NvbnRyb2xsZXJcbiAgICAgICAgdmFyIF9zY29wZTtcblxuICAgICAgICB2YXIgc2VsZWN0QW5kU2hvd0Fubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIGlmIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRGZWF0dXJlcy5wdXNoKGFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIG1hcC5nZXRWaWV3KCkuZml0KGFubm90YXRpb24uZ2V0R2VvbWV0cnkoKSwgbWFwLmdldFNpemUoKSwge1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiBbNTAsIDUwLCA1MCwgNTBdXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cblx0XHQvLyBjb252ZXJ0IGEgcG9pbnQgYXJyYXkgdG8gYSBwb2ludCBvYmplY3Rcblx0XHQvLyByZS1pbnZlcnQgdGhlIHkgYXhpc1xuXHRcdHZhciBjb252ZXJ0RnJvbU9MUG9pbnQgPSBmdW5jdGlvbiAocG9pbnQpIHtcblx0XHRcdHJldHVybiB7eDogcG9pbnRbMF0sIHk6IGltYWdlcy5jdXJyZW50SW1hZ2UuaGVpZ2h0IC0gcG9pbnRbMV19O1xuXHRcdH07XG5cblx0XHQvLyBjb252ZXJ0IGEgcG9pbnQgb2JqZWN0IHRvIGEgcG9pbnQgYXJyYXlcblx0XHQvLyBpbnZlcnQgdGhlIHkgYXhpc1xuXHRcdHZhciBjb252ZXJ0VG9PTFBvaW50ID0gZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRyZXR1cm4gW3BvaW50LngsIGltYWdlcy5jdXJyZW50SW1hZ2UuaGVpZ2h0IC0gcG9pbnQueV07XG5cdFx0fTtcblxuXHRcdC8vIGFzc2VtYmxlcyB0aGUgY29vcmRpbmF0ZSBhcnJheXMgZGVwZW5kaW5nIG9uIHRoZSBnZW9tZXRyeSB0eXBlXG5cdFx0Ly8gc28gdGhleSBoYXZlIGEgdW5pZmllZCBmb3JtYXRcblx0XHR2YXIgZ2V0Q29vcmRpbmF0ZXMgPSBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcblx0XHRcdHN3aXRjaCAoZ2VvbWV0cnkuZ2V0VHlwZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ0NpcmNsZSc6XG5cdFx0XHRcdFx0Ly8gcmFkaXVzIGlzIHRoZSB4IHZhbHVlIG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGNpcmNsZVxuXHRcdFx0XHRcdHJldHVybiBbZ2VvbWV0cnkuZ2V0Q2VudGVyKCksIFtnZW9tZXRyeS5nZXRSYWRpdXMoKSwgMF1dO1xuXHRcdFx0XHRjYXNlICdQb2x5Z29uJzpcblx0XHRcdFx0Y2FzZSAnUmVjdGFuZ2xlJzpcblx0XHRcdFx0XHRyZXR1cm4gZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKVswXTtcblx0XHRcdFx0Y2FzZSAnUG9pbnQnOlxuXHRcdFx0XHRcdHJldHVybiBbZ2VvbWV0cnkuZ2V0Q29vcmRpbmF0ZXMoKV07XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0cmV0dXJuIGdlb21ldHJ5LmdldENvb3JkaW5hdGVzKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIHNhdmVzIHRoZSB1cGRhdGVkIGdlb21ldHJ5IG9mIGFuIGFubm90YXRpb24gZmVhdHVyZVxuXHRcdHZhciBoYW5kbGVHZW9tZXRyeUNoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgZmVhdHVyZSA9IGUudGFyZ2V0O1xuXHRcdFx0dmFyIHNhdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHZhciBjb29yZGluYXRlcyA9IGdldENvb3JkaW5hdGVzKGZlYXR1cmUuZ2V0R2VvbWV0cnkoKSk7XG5cdFx0XHRcdGZlYXR1cmUuYW5ub3RhdGlvbi5wb2ludHMgPSBjb29yZGluYXRlcy5tYXAoY29udmVydEZyb21PTFBvaW50KTtcblx0XHRcdFx0ZmVhdHVyZS5hbm5vdGF0aW9uLiRzYXZlKCk7XG5cdFx0XHR9O1xuXHRcdFx0Ly8gdGhpcyBldmVudCBpcyByYXBpZGx5IGZpcmVkLCBzbyB3YWl0IHVudGlsIHRoZSBmaXJpbmcgc3RvcHNcblx0XHRcdC8vIGJlZm9yZSBzYXZpbmcgdGhlIGNoYW5nZXNcblx0XHRcdGRlYm91bmNlKHNhdmUsIDUwMCwgZmVhdHVyZS5hbm5vdGF0aW9uLmlkKTtcblx0XHR9O1xuXG5cdFx0dmFyIGNyZWF0ZUZlYXR1cmUgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0dmFyIGdlb21ldHJ5O1xuXHRcdFx0dmFyIHBvaW50cyA9IGFubm90YXRpb24ucG9pbnRzLm1hcChjb252ZXJ0VG9PTFBvaW50KTtcblxuXHRcdFx0c3dpdGNoIChhbm5vdGF0aW9uLnNoYXBlKSB7XG5cdFx0XHRcdGNhc2UgJ1BvaW50Jzpcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlBvaW50KHBvaW50c1swXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ1JlY3RhbmdsZSc6XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5SZWN0YW5nbGUoWyBwb2ludHMgXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ1BvbHlnb24nOlxuXHRcdFx0XHRcdC8vIGV4YW1wbGU6IGh0dHBzOi8vZ2l0aHViLmNvbS9vcGVubGF5ZXJzL29sMy9ibG9iL21hc3Rlci9leGFtcGxlcy9nZW9qc29uLmpzI0wxMjZcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlBvbHlnb24oWyBwb2ludHMgXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0xpbmVTdHJpbmcnOlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uTGluZVN0cmluZyhwb2ludHMpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdDaXJjbGUnOlxuXHRcdFx0XHRcdC8vIHJhZGl1cyBpcyB0aGUgeCB2YWx1ZSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjaXJjbGVcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLkNpcmNsZShwb2ludHNbMF0sIHBvaW50c1sxXVswXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gdW5zdXBwb3J0ZWQgc2hhcGVzIGFyZSBpZ25vcmVkXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVW5rbm93biBhbm5vdGF0aW9uIHNoYXBlOiAnICsgYW5ub3RhdGlvbi5zaGFwZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGZlYXR1cmUgPSBuZXcgb2wuRmVhdHVyZSh7IGdlb21ldHJ5OiBnZW9tZXRyeSB9KTtcbiAgICAgICAgICAgIGZlYXR1cmUuYW5ub3RhdGlvbiA9IGFubm90YXRpb247XG4gICAgICAgICAgICBpZiAoYW5ub3RhdGlvbi5sYWJlbHMgJiYgYW5ub3RhdGlvbi5sYWJlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGZlYXR1cmUuY29sb3IgPSBhbm5vdGF0aW9uLmxhYmVsc1swXS5sYWJlbC5jb2xvcjtcbiAgICAgICAgICAgIH1cblx0XHRcdGZlYXR1cmUub24oJ2NoYW5nZScsIGhhbmRsZUdlb21ldHJ5Q2hhbmdlKTtcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuYWRkRmVhdHVyZShmZWF0dXJlKTtcblx0XHR9O1xuXG5cdFx0dmFyIHJlZnJlc2hBbm5vdGF0aW9ucyA9IGZ1bmN0aW9uIChlLCBpbWFnZSkge1xuXHRcdFx0Ly8gY2xlYXIgZmVhdHVyZXMgb2YgcHJldmlvdXMgaW1hZ2VcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuY2xlYXIoKTtcblx0XHRcdF90aGlzLmNsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICBsYXN0RHJhd25GZWF0dXJlID0gbnVsbDtcblxuXHRcdFx0YW5ub3RhdGlvbnMucXVlcnkoe2lkOiBpbWFnZS5faWR9KS4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0YW5ub3RhdGlvbnMuZm9yRWFjaChjcmVhdGVGZWF0dXJlKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHR2YXIgaGFuZGxlTmV3RmVhdHVyZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgZ2VvbWV0cnkgPSBlLmZlYXR1cmUuZ2V0R2VvbWV0cnkoKTtcblx0XHRcdHZhciBjb29yZGluYXRlcyA9IGdldENvb3JkaW5hdGVzKGdlb21ldHJ5KTtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IGxhYmVscy5nZXRTZWxlY3RlZCgpO1xuXG4gICAgICAgICAgICBlLmZlYXR1cmUuY29sb3IgPSBsYWJlbC5jb2xvcjtcblxuXHRcdFx0ZS5mZWF0dXJlLmFubm90YXRpb24gPSBhbm5vdGF0aW9ucy5hZGQoe1xuXHRcdFx0XHRpZDogaW1hZ2VzLmdldEN1cnJlbnRJZCgpLFxuXHRcdFx0XHRzaGFwZTogZ2VvbWV0cnkuZ2V0VHlwZSgpLFxuXHRcdFx0XHRwb2ludHM6IGNvb3JkaW5hdGVzLm1hcChjb252ZXJ0RnJvbU9MUG9pbnQpLFxuICAgICAgICAgICAgICAgIGxhYmVsX2lkOiBsYWJlbC5pZCxcbiAgICAgICAgICAgICAgICBjb25maWRlbmNlOiBsYWJlbHMuZ2V0Q3VycmVudENvbmZpZGVuY2UoKVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIGlmIHRoZSBmZWF0dXJlIGNvdWxkbid0IGJlIHNhdmVkLCByZW1vdmUgaXQgYWdhaW5cblx0XHRcdGUuZmVhdHVyZS5hbm5vdGF0aW9uLiRwcm9taXNlLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLnJlbW92ZUZlYXR1cmUoZS5mZWF0dXJlKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRlLmZlYXR1cmUub24oJ2NoYW5nZScsIGhhbmRsZUdlb21ldHJ5Q2hhbmdlKTtcblxuICAgICAgICAgICAgbGFzdERyYXduRmVhdHVyZSA9IGUuZmVhdHVyZTtcblxuICAgICAgICAgICAgcmV0dXJuIGUuZmVhdHVyZS5hbm5vdGF0aW9uLiRwcm9taXNlO1xuXHRcdH07XG5cbiAgICAgICAgdmFyIHJlbW92ZUZlYXR1cmUgPSBmdW5jdGlvbiAoZmVhdHVyZSkge1xuICAgICAgICAgICAgaWYgKGZlYXR1cmUgPT09IGxhc3REcmF3bkZlYXR1cmUpIHtcbiAgICAgICAgICAgICAgICBsYXN0RHJhd25GZWF0dXJlID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYW5ub3RhdGlvbnMuZGVsZXRlKGZlYXR1cmUuYW5ub3RhdGlvbikudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5yZW1vdmVGZWF0dXJlKGZlYXR1cmUpO1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkRmVhdHVyZXMucmVtb3ZlKGZlYXR1cmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIF9zY29wZSA9IHNjb3BlO1xuICAgICAgICAgICAgbWFwLmFkZExheWVyKGFubm90YXRpb25MYXllcik7XG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24oc2VsZWN0KTtcbiAgICAgICAgICAgIG1hcC5hZGRJbnRlcmFjdGlvbih0cmFuc2xhdGUpO1xuICAgICAgICAgICAgbWFwLmFkZEludGVyYWN0aW9uKG1vZGlmeSk7XG5cdFx0XHRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgcmVmcmVzaEFubm90YXRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGFwcGx5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGlmIG5vdCBhbHJlYWR5IGRpZ2VzdGluZywgZGlnZXN0XG4gICAgICAgICAgICAgICAgaWYgKCFzY29wZS4kJHBoYXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHByb3BhZ2F0ZSBuZXcgc2VsZWN0aW9ucyB0aHJvdWdoIHRoZSBhbmd1bGFyIGFwcGxpY2F0aW9uXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMub24oJ2NoYW5nZTpsZW5ndGgnLCBhcHBseSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuc3RhcnREcmF3aW5nID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgICAgIHNlbGVjdC5zZXRBY3RpdmUoZmFsc2UpO1xuICAgICAgICAgICAgbW9kaWZ5LnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgICAgIF90aGlzLmZpbmlzaE1vdmluZygpO1xuICAgICAgICAgICAgLy8gYWxsb3cgb25seSBvbmUgZHJhdyBpbnRlcmFjdGlvbiBhdCBhIHRpbWVcbiAgICAgICAgICAgIG1hcC5yZW1vdmVJbnRlcmFjdGlvbihkcmF3KTtcblxuXHRcdFx0ZHJhd2luZ1R5cGUgPSB0eXBlIHx8ICdQb2ludCc7XG5cdFx0XHRkcmF3ID0gbmV3IG9sLmludGVyYWN0aW9uLkRyYXcoe1xuICAgICAgICAgICAgICAgIHNvdXJjZTogYW5ub3RhdGlvblNvdXJjZSxcblx0XHRcdFx0dHlwZTogZHJhd2luZ1R5cGUsXG5cdFx0XHRcdHN0eWxlOiBzdHlsZXMuZWRpdGluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihkcmF3KTtcblx0XHRcdGRyYXcub24oJ2RyYXdlbmQnLCBoYW5kbGVOZXdGZWF0dXJlKTtcbiAgICAgICAgICAgIGRyYXcub24oJ2RyYXdlbmQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIF9zY29wZS4kYnJvYWRjYXN0KCdhbm5vdGF0aW9ucy5kcmF3bicsIGUuZmVhdHVyZSk7XG4gICAgICAgICAgICB9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5maW5pc2hEcmF3aW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0bWFwLnJlbW92ZUludGVyYWN0aW9uKGRyYXcpO1xuICAgICAgICAgICAgZHJhdy5zZXRBY3RpdmUoZmFsc2UpO1xuICAgICAgICAgICAgZHJhd2luZ1R5cGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBzZWxlY3Quc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICAgICAgbW9kaWZ5LnNldEFjdGl2ZShmYWxzZSk7XG5cdFx0XHQvLyBkb24ndCBzZWxlY3QgdGhlIGxhc3QgZHJhd24gcG9pbnRcblx0XHRcdF90aGlzLmNsZWFyU2VsZWN0aW9uKCk7XG5cdFx0fTtcblxuICAgICAgICB0aGlzLmlzRHJhd2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBkcmF3ICYmIGRyYXcuZ2V0QWN0aXZlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zdGFydE1vdmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5pc0RyYXdpbmcoKSkge1xuICAgICAgICAgICAgICAgIF90aGlzLmZpbmlzaERyYXdpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyYW5zbGF0ZS5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5maW5pc2hNb3ZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0cmFuc2xhdGUuc2V0QWN0aXZlKGZhbHNlKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmlzTW92aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRyYW5zbGF0ZS5nZXRBY3RpdmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc0RyYXduQW5ub3RhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIWxhc3REcmF3bkZlYXR1cmU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZWxldGVMYXN0RHJhd25Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVtb3ZlRmVhdHVyZShsYXN0RHJhd25GZWF0dXJlKTtcbiAgICAgICAgfTtcblxuXHRcdHRoaXMuZGVsZXRlU2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmZvckVhY2gocmVtb3ZlRmVhdHVyZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuc2VsZWN0ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgZmVhdHVyZTtcblx0XHRcdGFubm90YXRpb25Tb3VyY2UuZm9yRWFjaEZlYXR1cmUoZnVuY3Rpb24gKGYpIHtcblx0XHRcdFx0aWYgKGYuYW5ub3RhdGlvbi5pZCA9PT0gaWQpIHtcblx0XHRcdFx0XHRmZWF0dXJlID0gZjtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyByZW1vdmUgc2VsZWN0aW9uIGlmIGZlYXR1cmUgd2FzIGFscmVhZHkgc2VsZWN0ZWQuIG90aGVyd2lzZSBzZWxlY3QuXG5cdFx0XHRpZiAoIXNlbGVjdGVkRmVhdHVyZXMucmVtb3ZlKGZlYXR1cmUpKSB7XG5cdFx0XHRcdHNlbGVjdGVkRmVhdHVyZXMucHVzaChmZWF0dXJlKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIHRoaXMuaGFzU2VsZWN0ZWRGZWF0dXJlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZEZlYXR1cmVzLmdldExlbmd0aCgpID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmaXRzIHRoZSB2aWV3IHRvIHRoZSBnaXZlbiBmZWF0dXJlXG4gICAgICAgIHRoaXMuZml0ID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLmZvckVhY2hGZWF0dXJlKGZ1bmN0aW9uIChmKSB7XG4gICAgICAgICAgICAgICAgaWYgKGYuYW5ub3RhdGlvbi5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYW5pbWF0ZSBmaXRcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZpZXcgPSBtYXAuZ2V0VmlldygpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFuID0gb2wuYW5pbWF0aW9uLnBhbih7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IHZpZXcuZ2V0Q2VudGVyKClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB6b29tID0gb2wuYW5pbWF0aW9uLnpvb20oe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x1dGlvbjogdmlldy5nZXRSZXNvbHV0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIG1hcC5iZWZvcmVSZW5kZXIocGFuLCB6b29tKTtcbiAgICAgICAgICAgICAgICAgICAgdmlldy5maXQoZi5nZXRHZW9tZXRyeSgpLCBtYXAuZ2V0U2l6ZSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuXHRcdHRoaXMuY2xlYXJTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmNsZWFyKCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0U2VsZWN0ZWRGZWF0dXJlcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBzZWxlY3RlZEZlYXR1cmVzO1xuXHRcdH07XG5cbiAgICAgICAgdGhpcy5nZXRTZWxlY3RlZERyYXdpbmdUeXBlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRyYXdpbmdUeXBlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIG1hbnVhbGx5IGFkZCBhIG5ldyBmZWF0dXJlIChub3QgdGhyb3VnaCB0aGUgZHJhdyBpbnRlcmFjdGlvbilcbiAgICAgICAgdGhpcy5hZGRGZWF0dXJlID0gZnVuY3Rpb24gKGZlYXR1cmUpIHtcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuYWRkRmVhdHVyZShmZWF0dXJlKTtcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVOZXdGZWF0dXJlKHtmZWF0dXJlOiBmZWF0dXJlfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRPcGFjaXR5ID0gZnVuY3Rpb24gKG9wYWNpdHkpIHtcbiAgICAgICAgICAgIGFubm90YXRpb25MYXllci5zZXRPcGFjaXR5KG9wYWNpdHkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuY3ljbGVOZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY3VycmVudEFubm90YXRpb25JbmRleCA9IChjdXJyZW50QW5ub3RhdGlvbkluZGV4ICsgMSkgJSBhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCk7XG4gICAgICAgICAgICBfdGhpcy5qdW1wVG9DdXJyZW50KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNOZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIChjdXJyZW50QW5ub3RhdGlvbkluZGV4ICsgMSkgPCBhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5jeWNsZVByZXZpb3VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gd2Ugd2FudCBubyBuZWdhdGl2ZSBpbmRleCBoZXJlXG4gICAgICAgICAgICBjdXJyZW50QW5ub3RhdGlvbkluZGV4ID0gKGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggKyBhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCkgLSAxKSAlIGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKTtcbiAgICAgICAgICAgIF90aGlzLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc1ByZXZpb3VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggPiAwO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuanVtcFRvQ3VycmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIG9ubHkganVtcCBvbmNlIHRoZSBhbm5vdGF0aW9ucyB3ZXJlIGxvYWRlZFxuICAgICAgICAgICAgYW5ub3RhdGlvbnMuZ2V0UHJvbWlzZSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGVjdEFuZFNob3dBbm5vdGF0aW9uKGFubm90YXRpb25GZWF0dXJlcy5pdGVtKGN1cnJlbnRBbm5vdGF0aW9uSW5kZXgpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuanVtcFRvRmlyc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjdXJyZW50QW5ub3RhdGlvbkluZGV4ID0gMDtcbiAgICAgICAgICAgIF90aGlzLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmp1bXBUb0xhc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9ucy5nZXRQcm9taXNlKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gd2FpdCBmb3IgdGhlIG5ldyBhbm5vdGF0aW9ucyB0byBiZSBsb2FkZWRcbiAgICAgICAgICAgICAgICBpZiAoYW5ub3RhdGlvbkZlYXR1cmVzLmdldExlbmd0aCgpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggPSBhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCkgLSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfdGhpcy5qdW1wVG9DdXJyZW50KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmbGlja2VyIHRoZSBoaWdobGlnaHRlZCBhbm5vdGF0aW9uIHRvIHNpZ25hbCBhbiBlcnJvclxuICAgICAgICB0aGlzLmZsaWNrZXIgPSBmdW5jdGlvbiAoY291bnQpIHtcbiAgICAgICAgICAgIHZhciBhbm5vdGF0aW9uID0gc2VsZWN0ZWRGZWF0dXJlcy5pdGVtKDApO1xuICAgICAgICAgICAgaWYgKCFhbm5vdGF0aW9uKSByZXR1cm47XG4gICAgICAgICAgICBjb3VudCA9IGNvdW50IHx8IDM7XG5cbiAgICAgICAgICAgIHZhciB0b2dnbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkRmVhdHVyZXMuZ2V0TGVuZ3RoKCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkRmVhdHVyZXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZEZlYXR1cmVzLnB1c2goYW5ub3RhdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIG51bWJlciBvZiByZXBlYXRzIG11c3QgYmUgZXZlbiwgb3RoZXJ3aXNlIHRoZSBsYXllciB3b3VsZCBzdGF5IG9udmlzaWJsZVxuICAgICAgICAgICAgJGludGVydmFsKHRvZ2dsZSwgMTAwLCBjb3VudCAqIDIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0Q3VycmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhbm5vdGF0aW9uRmVhdHVyZXMuaXRlbShjdXJyZW50QW5ub3RhdGlvbkluZGV4KS5hbm5vdGF0aW9uO1xuICAgICAgICB9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBtYXBJbWFnZVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgaGFuZGxpbmcgdGhlIGltYWdlIGxheWVyIG9uIHRoZSBPcGVuTGF5ZXJzIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ21hcEltYWdlJywgZnVuY3Rpb24gKG1hcCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXHRcdHZhciBleHRlbnQgPSBbMCwgMCwgMCwgMF07XG5cblx0XHR2YXIgcHJvamVjdGlvbiA9IG5ldyBvbC5wcm9qLlByb2plY3Rpb24oe1xuXHRcdFx0Y29kZTogJ2RpYXMtaW1hZ2UnLFxuXHRcdFx0dW5pdHM6ICdwaXhlbHMnLFxuXHRcdFx0ZXh0ZW50OiBleHRlbnRcblx0XHR9KTtcblxuXHRcdHZhciBpbWFnZUxheWVyID0gbmV3IG9sLmxheWVyLkltYWdlKCk7XG5cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoc2NvcGUpIHtcblx0XHRcdG1hcC5hZGRMYXllcihpbWFnZUxheWVyKTtcblxuXHRcdFx0Ly8gcmVmcmVzaCB0aGUgaW1hZ2Ugc291cmNlXG5cdFx0XHRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgZnVuY3Rpb24gKGUsIGltYWdlKSB7XG5cdFx0XHRcdGV4dGVudFsyXSA9IGltYWdlLndpZHRoO1xuXHRcdFx0XHRleHRlbnRbM10gPSBpbWFnZS5oZWlnaHQ7XG5cblx0XHRcdFx0dmFyIHpvb20gPSBzY29wZS52aWV3cG9ydC56b29tO1xuXG5cdFx0XHRcdHZhciBjZW50ZXIgPSBzY29wZS52aWV3cG9ydC5jZW50ZXI7XG5cdFx0XHRcdC8vIHZpZXdwb3J0IGNlbnRlciBpcyBzdGlsbCB1bmluaXRpYWxpemVkXG5cdFx0XHRcdGlmIChjZW50ZXJbMF0gPT09IHVuZGVmaW5lZCAmJiBjZW50ZXJbMV0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGNlbnRlciA9IG9sLmV4dGVudC5nZXRDZW50ZXIoZXh0ZW50KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBpbWFnZVN0YXRpYyA9IG5ldyBvbC5zb3VyY2UuSW1hZ2VTdGF0aWMoe1xuXHRcdFx0XHRcdHVybDogaW1hZ2Uuc3JjLFxuXHRcdFx0XHRcdHByb2plY3Rpb246IHByb2plY3Rpb24sXG5cdFx0XHRcdFx0aW1hZ2VFeHRlbnQ6IGV4dGVudFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpbWFnZUxheWVyLnNldFNvdXJjZShpbWFnZVN0YXRpYyk7XG5cblx0XHRcdFx0bWFwLnNldFZpZXcobmV3IG9sLlZpZXcoe1xuXHRcdFx0XHRcdHByb2plY3Rpb246IHByb2plY3Rpb24sXG5cdFx0XHRcdFx0Y2VudGVyOiBjZW50ZXIsXG5cdFx0XHRcdFx0em9vbTogem9vbSxcblx0XHRcdFx0XHR6b29tRmFjdG9yOiAxLjUsXG5cdFx0XHRcdFx0Ly8gYWxsb3cgYSBtYXhpbXVtIG9mIDR4IG1hZ25pZmljYXRpb25cblx0XHRcdFx0XHRtaW5SZXNvbHV0aW9uOiAwLjI1LFxuXHRcdFx0XHRcdC8vIHJlc3RyaWN0IG1vdmVtZW50XG5cdFx0XHRcdFx0ZXh0ZW50OiBleHRlbnRcblx0XHRcdFx0fSkpO1xuXG5cdFx0XHRcdC8vIGlmIHpvb20gaXMgbm90IGluaXRpYWxpemVkLCBmaXQgdGhlIHZpZXcgdG8gdGhlIGltYWdlIGV4dGVudFxuXHRcdFx0XHRpZiAoem9vbSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0bWFwLmdldFZpZXcoKS5maXQoZXh0ZW50LCBtYXAuZ2V0U2l6ZSgpKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0RXh0ZW50ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGV4dGVudDtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRQcm9qZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHByb2plY3Rpb247XG5cdFx0fTtcblxuICAgICAgICB0aGlzLmdldExheWVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlTGF5ZXI7XG4gICAgICAgIH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIHN0eWxlc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgZm9yIHRoZSBPcGVuTGF5ZXJzIHN0eWxlc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ3N0eWxlcycsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuY29sb3JzID0ge1xuICAgICAgICAgICAgd2hpdGU6IFsyNTUsIDI1NSwgMjU1LCAxXSxcbiAgICAgICAgICAgIGJsdWU6IFswLCAxNTMsIDI1NSwgMV0sXG4gICAgICAgICAgICBvcmFuZ2U6ICcjZmY1ZTAwJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBkZWZhdWx0Q2lyY2xlUmFkaXVzID0gNjtcbiAgICAgICAgdmFyIGRlZmF1bHRTdHJva2VXaWR0aCA9IDM7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRTdHJva2VPdXRsaW5lID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICB3aWR0aDogNVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRTdHJva2VPdXRsaW5lID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICB3aWR0aDogNlxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZGVmYXVsdFN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLmJsdWUsXG4gICAgICAgICAgICB3aWR0aDogZGVmYXVsdFN0cm9rZVdpZHRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZFN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLm9yYW5nZSxcbiAgICAgICAgICAgIHdpZHRoOiBkZWZhdWx0U3Ryb2tlV2lkdGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRDaXJjbGVGaWxsID0gbmV3IG9sLnN0eWxlLkZpbGwoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLmJsdWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkQ2lyY2xlRmlsbCA9IG5ldyBvbC5zdHlsZS5GaWxsKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5vcmFuZ2VcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRDaXJjbGVTdHJva2UgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcbiAgICAgICAgICAgIHdpZHRoOiAyXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZENpcmNsZVN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgd2lkdGg6IGRlZmF1bHRTdHJva2VXaWR0aFxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZWRpdGluZ0NpcmNsZVN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgd2lkdGg6IDIsXG4gICAgICAgICAgICBsaW5lRGFzaDogWzNdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBlZGl0aW5nU3Ryb2tlID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMuYmx1ZSxcbiAgICAgICAgICAgIHdpZHRoOiBkZWZhdWx0U3Ryb2tlV2lkdGgsXG4gICAgICAgICAgICBsaW5lRGFzaDogWzVdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBkZWZhdWx0RmlsbCA9IG5ldyBvbC5zdHlsZS5GaWxsKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZEZpbGwgPSBuZXcgb2wuc3R5bGUuRmlsbCh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMub3JhbmdlXG4gICAgICAgIH0pO1xuXG5cdFx0dGhpcy5mZWF0dXJlcyA9IGZ1bmN0aW9uIChmZWF0dXJlKSB7XG4gICAgICAgICAgICB2YXIgY29sb3IgPSBmZWF0dXJlLmNvbG9yID8gKCcjJyArIGZlYXR1cmUuY29sb3IpIDogX3RoaXMuY29sb3JzLmJsdWU7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIG5ldyBvbC5zdHlsZS5TdHlsZSh7XG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZTogZGVmYXVsdFN0cm9rZU91dGxpbmUsXG4gICAgICAgICAgICAgICAgICAgIGltYWdlOiBuZXcgb2wuc3R5bGUuQ2lyY2xlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhZGl1czogZGVmYXVsdENpcmNsZVJhZGl1cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGw6IG5ldyBvbC5zdHlsZS5GaWxsKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogY29sb3JcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOiBkZWZhdWx0Q2lyY2xlU3Ryb2tlXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IG9sLnN0eWxlLlN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBjb2xvcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAzXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIF07XG4gICAgICAgIH07XG5cblx0XHR0aGlzLmhpZ2hsaWdodCA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogc2VsZWN0ZWRTdHJva2VPdXRsaW5lLFxuXHRcdFx0XHRpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG5cdFx0XHRcdFx0cmFkaXVzOiBkZWZhdWx0Q2lyY2xlUmFkaXVzLFxuXHRcdFx0XHRcdGZpbGw6IHNlbGVjdGVkQ2lyY2xlRmlsbCxcblx0XHRcdFx0XHRzdHJva2U6IHNlbGVjdGVkQ2lyY2xlU3Ryb2tlXG5cdFx0XHRcdH0pLFxuICAgICAgICAgICAgICAgIHpJbmRleDogMjAwXG5cdFx0XHR9KSxcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogc2VsZWN0ZWRTdHJva2UsXG4gICAgICAgICAgICAgICAgekluZGV4OiAyMDBcblx0XHRcdH0pXG5cdFx0XTtcblxuXHRcdHRoaXMuZWRpdGluZyA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogZGVmYXVsdFN0cm9rZU91dGxpbmUsXG5cdFx0XHRcdGltYWdlOiBuZXcgb2wuc3R5bGUuQ2lyY2xlKHtcblx0XHRcdFx0XHRyYWRpdXM6IGRlZmF1bHRDaXJjbGVSYWRpdXMsXG5cdFx0XHRcdFx0ZmlsbDogZGVmYXVsdENpcmNsZUZpbGwsXG5cdFx0XHRcdFx0c3Ryb2tlOiBlZGl0aW5nQ2lyY2xlU3Ryb2tlXG5cdFx0XHRcdH0pXG5cdFx0XHR9KSxcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogZWRpdGluZ1N0cm9rZVxuXHRcdFx0fSlcblx0XHRdO1xuXG5cdFx0dGhpcy52aWV3cG9ydCA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogZGVmYXVsdFN0cm9rZSxcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogMVxuICAgICAgICAgICAgICAgIH0pXG5cdFx0XHR9KVxuXHRcdF07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIHVybFBhcmFtc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgR0VUIHBhcmFtZXRlcnMgb2YgdGhlIHVybC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCd1cmxQYXJhbXMnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgc3RhdGUgPSB7fTtcblxuXHRcdC8vIHRyYW5zZm9ybXMgYSBVUkwgcGFyYW1ldGVyIHN0cmluZyBsaWtlICNhPTEmYj0yIHRvIGFuIG9iamVjdFxuXHRcdHZhciBkZWNvZGVTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBwYXJhbXMgPSBsb2NhdGlvbi5oYXNoLnJlcGxhY2UoJyMnLCAnJylcblx0XHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCcmJyk7XG5cblx0XHRcdHZhciBzdGF0ZSA9IHt9O1xuXG5cdFx0XHRwYXJhbXMuZm9yRWFjaChmdW5jdGlvbiAocGFyYW0pIHtcblx0XHRcdFx0Ly8gY2FwdHVyZSBrZXktdmFsdWUgcGFpcnNcblx0XHRcdFx0dmFyIGNhcHR1cmUgPSBwYXJhbS5tYXRjaCgvKC4rKVxcPSguKykvKTtcblx0XHRcdFx0aWYgKGNhcHR1cmUgJiYgY2FwdHVyZS5sZW5ndGggPT09IDMpIHtcblx0XHRcdFx0XHRzdGF0ZVtjYXB0dXJlWzFdXSA9IGRlY29kZVVSSUNvbXBvbmVudChjYXB0dXJlWzJdKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBzdGF0ZTtcblx0XHR9O1xuXG5cdFx0Ly8gdHJhbnNmb3JtcyBhbiBvYmplY3QgdG8gYSBVUkwgcGFyYW1ldGVyIHN0cmluZ1xuXHRcdHZhciBlbmNvZGVTdGF0ZSA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuXHRcdFx0dmFyIHBhcmFtcyA9ICcnO1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIHN0YXRlKSB7XG5cdFx0XHRcdHBhcmFtcyArPSBrZXkgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQoc3RhdGVba2V5XSkgKyAnJic7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcGFyYW1zLnN1YnN0cmluZygwLCBwYXJhbXMubGVuZ3RoIC0gMSk7XG5cdFx0fTtcblxuXHRcdHRoaXMucHVzaFN0YXRlID0gZnVuY3Rpb24gKHMpIHtcblx0XHRcdHN0YXRlLnNsdWcgPSBzO1xuXHRcdFx0aGlzdG9yeS5wdXNoU3RhdGUoc3RhdGUsICcnLCBzdGF0ZS5zbHVnICsgJyMnICsgZW5jb2RlU3RhdGUoc3RhdGUpKTtcblx0XHR9O1xuXG5cdFx0Ly8gc2V0cyBhIFVSTCBwYXJhbWV0ZXIgYW5kIHVwZGF0ZXMgdGhlIGhpc3Rvcnkgc3RhdGVcblx0XHR0aGlzLnNldCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcblx0XHRcdGZvciAodmFyIGtleSBpbiBwYXJhbXMpIHtcblx0XHRcdFx0c3RhdGVba2V5XSA9IHBhcmFtc1trZXldO1xuXHRcdFx0fVxuXHRcdFx0aGlzdG9yeS5yZXBsYWNlU3RhdGUoc3RhdGUsICcnLCBzdGF0ZS5zbHVnICsgJyMnICsgZW5jb2RlU3RhdGUoc3RhdGUpKTtcblx0XHR9O1xuXG5cdFx0Ly8gcmV0dXJucyBhIFVSTCBwYXJhbWV0ZXJcblx0XHR0aGlzLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcblx0XHRcdHJldHVybiBzdGF0ZVtrZXldO1xuXHRcdH07XG5cblx0XHRzdGF0ZSA9IGhpc3Rvcnkuc3RhdGU7XG5cblx0XHRpZiAoIXN0YXRlKSB7XG5cdFx0XHRzdGF0ZSA9IGRlY29kZVN0YXRlKCk7XG5cdFx0fVxuXHR9XG4pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==