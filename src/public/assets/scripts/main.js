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

        // invert all y coordinates
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJjb250cm9sbGVycy9Bbm5vdGF0aW9uc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9Bbm5vdGF0b3JDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ2FudmFzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0NhdGVnb3JpZXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvQ29uZmlkZW5jZUNvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9EcmF3aW5nQ29udHJvbHNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvRWRpdENvbnRyb2xzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL01pbmltYXBDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2VsZWN0ZWRMYWJlbENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TZXR0aW5nc0Fubm90YXRpb25PcGFjaXR5Q29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NldHRpbmdzQW5ub3RhdGlvbnNDeWNsaW5nQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NldHRpbmdzQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL1NldHRpbmdzU2VjdGlvbkN5Y2xpbmdDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvU2lkZWJhckNhdGVnb3J5Rm9sZG91dENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9TaWRlYmFyQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvYW5ub3RhdGlvbkxpc3RJdGVtLmpzIiwiZGlyZWN0aXZlcy9sYWJlbENhdGVnb3J5SXRlbS5qcyIsImRpcmVjdGl2ZXMvbGFiZWxJdGVtLmpzIiwiZmFjdG9yaWVzL2RlYm91bmNlLmpzIiwiZmFjdG9yaWVzL21hcC5qcyIsInNlcnZpY2VzL2Fubm90YXRpb25zLmpzIiwic2VydmljZXMvaW1hZ2VzLmpzIiwic2VydmljZXMva2V5Ym9hcmQuanMiLCJzZXJ2aWNlcy9sYWJlbHMuanMiLCJzZXJ2aWNlcy9tYXBBbm5vdGF0aW9ucy5qcyIsInNlcnZpY2VzL21hcEltYWdlLmpzIiwic2VydmljZXMvc3R5bGVzLmpzIiwic2VydmljZXMvdXJsUGFyYW1zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUEsUUFBQSxPQUFBLG9CQUFBLENBQUEsWUFBQTs7Ozs7Ozs7O0FDR0EsUUFBQSxPQUFBLG9CQUFBLFdBQUEseUZBQUEsVUFBQSxRQUFBLGdCQUFBLFFBQUEsYUFBQSxRQUFBO0VBQ0E7O1FBRUEsSUFBQSxtQkFBQSxlQUFBOztFQUVBLE9BQUEsbUJBQUEsaUJBQUE7O0VBRUEsSUFBQSxxQkFBQSxZQUFBO0dBQ0EsT0FBQSxjQUFBLFlBQUE7OztFQUdBLE9BQUEsY0FBQTs7RUFFQSxPQUFBLGlCQUFBLGVBQUE7O0VBRUEsT0FBQSxtQkFBQSxVQUFBLEdBQUEsSUFBQTs7R0FFQSxJQUFBLENBQUEsRUFBQSxVQUFBO0lBQ0EsT0FBQTs7R0FFQSxlQUFBLE9BQUE7OztRQUdBLE9BQUEsZ0JBQUEsZUFBQTs7RUFFQSxPQUFBLGFBQUEsVUFBQSxJQUFBO0dBQ0EsSUFBQSxXQUFBO0dBQ0EsaUJBQUEsUUFBQSxVQUFBLFNBQUE7SUFDQSxJQUFBLFFBQUEsY0FBQSxRQUFBLFdBQUEsTUFBQSxJQUFBO0tBQ0EsV0FBQTs7O0dBR0EsT0FBQTs7O0VBR0EsT0FBQSxJQUFBLGVBQUE7Ozs7Ozs7Ozs7O0FDbkNBLFFBQUEsT0FBQSxvQkFBQSxXQUFBLHdGQUFBLFVBQUEsUUFBQSxRQUFBLFdBQUEsS0FBQSxVQUFBLFVBQUE7UUFDQTs7UUFFQSxPQUFBLFNBQUE7UUFDQSxPQUFBLGVBQUE7OztRQUdBLE9BQUEsV0FBQTtZQUNBLE1BQUEsVUFBQSxJQUFBO1lBQ0EsUUFBQSxDQUFBLFVBQUEsSUFBQSxNQUFBLFVBQUEsSUFBQTs7OztRQUlBLElBQUEsZ0JBQUEsWUFBQTtZQUNBLE9BQUEsZUFBQTtZQUNBLE9BQUEsV0FBQSxlQUFBLE9BQUEsT0FBQTs7OztRQUlBLElBQUEsWUFBQSxZQUFBO1lBQ0EsVUFBQSxVQUFBLE9BQUEsT0FBQSxhQUFBOzs7O1FBSUEsSUFBQSxlQUFBLFlBQUE7WUFDQSxPQUFBLGVBQUE7Ozs7UUFJQSxJQUFBLFlBQUEsVUFBQSxJQUFBO1lBQ0E7WUFDQSxPQUFBLE9BQUEsS0FBQSxTQUFBOzBCQUNBLEtBQUE7MEJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxZQUFBLFlBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQTttQkFDQSxLQUFBO21CQUNBLEtBQUE7bUJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxZQUFBLFlBQUE7WUFDQTtZQUNBLE9BQUEsT0FBQTttQkFDQSxLQUFBO21CQUNBLEtBQUE7bUJBQ0EsTUFBQSxJQUFBOzs7O1FBSUEsT0FBQSxJQUFBLGtCQUFBLFNBQUEsR0FBQSxRQUFBO1lBQ0EsT0FBQSxTQUFBLE9BQUEsT0FBQTtZQUNBLE9BQUEsU0FBQSxPQUFBLEtBQUEsS0FBQSxNQUFBLE9BQUEsT0FBQTtZQUNBLE9BQUEsU0FBQSxPQUFBLEtBQUEsS0FBQSxNQUFBLE9BQUEsT0FBQTtZQUNBLFVBQUEsSUFBQTtnQkFDQSxHQUFBLE9BQUEsU0FBQTtnQkFDQSxHQUFBLE9BQUEsU0FBQSxPQUFBO2dCQUNBLEdBQUEsT0FBQSxTQUFBLE9BQUE7Ozs7UUFJQSxTQUFBLEdBQUEsSUFBQSxZQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUE7OztRQUdBLFNBQUEsR0FBQSxJQUFBLFlBQUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLElBQUEsWUFBQTtZQUNBLE9BQUE7WUFDQSxPQUFBOzs7O1FBSUEsT0FBQSxhQUFBLFNBQUEsR0FBQTtZQUNBLElBQUEsUUFBQSxFQUFBO1lBQ0EsSUFBQSxTQUFBLE1BQUEsU0FBQSxXQUFBO2dCQUNBLFVBQUEsTUFBQTs7Ozs7UUFLQSxPQUFBOztRQUVBLFVBQUEsVUFBQSxLQUFBOzs7Ozs7Ozs7OztBQzVGQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSw0RkFBQSxVQUFBLFFBQUEsVUFBQSxnQkFBQSxLQUFBLFVBQUEsVUFBQTtFQUNBOztRQUVBLElBQUEsVUFBQSxJQUFBOzs7RUFHQSxJQUFBLEdBQUEsV0FBQSxTQUFBLEdBQUE7WUFDQSxJQUFBLE9BQUEsWUFBQTtnQkFDQSxPQUFBLE1BQUEsa0JBQUE7b0JBQ0EsUUFBQSxRQUFBO29CQUNBLE1BQUEsUUFBQTs7Ozs7WUFLQSxTQUFBLE1BQUEsS0FBQTs7O1FBR0EsSUFBQSxHQUFBLGVBQUEsWUFBQTtZQUNBLFVBQUEsSUFBQTs7O0VBR0EsU0FBQSxLQUFBO0VBQ0EsZUFBQSxLQUFBOztFQUVBLElBQUEsYUFBQSxZQUFBOzs7R0FHQSxTQUFBLFdBQUE7O0lBRUEsSUFBQTtNQUNBLElBQUE7OztFQUdBLE9BQUEsSUFBQSx3QkFBQTtFQUNBLE9BQUEsSUFBQSx5QkFBQTs7Ozs7Ozs7Ozs7QUNuQ0EsUUFBQSxPQUFBLG9CQUFBLFdBQUEseURBQUEsVUFBQSxRQUFBLFFBQUEsVUFBQTtRQUNBOzs7UUFHQSxJQUFBLGdCQUFBO1FBQ0EsSUFBQSx1QkFBQTs7O1FBR0EsSUFBQSxrQkFBQSxZQUFBO1lBQ0EsSUFBQSxNQUFBLE9BQUEsV0FBQSxJQUFBLFVBQUEsTUFBQTtnQkFDQSxPQUFBLEtBQUE7O1lBRUEsT0FBQSxhQUFBLHdCQUFBLEtBQUEsVUFBQTs7OztRQUlBLElBQUEsaUJBQUEsWUFBQTtZQUNBLElBQUEsT0FBQSxhQUFBLHVCQUFBO2dCQUNBLElBQUEsTUFBQSxLQUFBLE1BQUEsT0FBQSxhQUFBO2dCQUNBLE9BQUEsYUFBQSxPQUFBLFdBQUEsT0FBQSxVQUFBLE1BQUE7O29CQUVBLE9BQUEsSUFBQSxRQUFBLEtBQUEsUUFBQSxDQUFBOzs7OztRQUtBLElBQUEsa0JBQUEsVUFBQSxPQUFBO1lBQ0EsSUFBQSxTQUFBLEtBQUEsUUFBQSxPQUFBLFdBQUEsUUFBQTtnQkFDQSxPQUFBLFdBQUEsT0FBQSxXQUFBOzs7O1FBSUEsT0FBQSxhQUFBLENBQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUEsTUFBQSxNQUFBO1FBQ0EsT0FBQSxhQUFBO1FBQ0EsT0FBQSxhQUFBO1FBQ0EsT0FBQSxRQUFBLEtBQUEsVUFBQSxLQUFBO1lBQ0EsS0FBQSxJQUFBLE9BQUEsS0FBQTtnQkFDQSxPQUFBLGFBQUEsT0FBQSxXQUFBLE9BQUEsSUFBQTs7WUFFQTs7O1FBR0EsT0FBQSxpQkFBQSxPQUFBOztRQUVBLE9BQUEsYUFBQSxVQUFBLE1BQUE7WUFDQSxPQUFBLFlBQUE7WUFDQSxPQUFBLGlCQUFBO1lBQ0EsT0FBQSxXQUFBLHVCQUFBOzs7UUFHQSxPQUFBLGNBQUEsVUFBQSxNQUFBO1lBQ0EsT0FBQSxPQUFBLFdBQUEsUUFBQSxVQUFBLENBQUE7Ozs7UUFJQSxPQUFBLGtCQUFBLFVBQUEsR0FBQSxNQUFBO1lBQ0EsRUFBQTtZQUNBLElBQUEsUUFBQSxPQUFBLFdBQUEsUUFBQTtZQUNBLElBQUEsVUFBQSxDQUFBLEtBQUEsT0FBQSxXQUFBLFNBQUEsZUFBQTtnQkFDQSxPQUFBLFdBQUEsS0FBQTttQkFDQTtnQkFDQSxPQUFBLFdBQUEsT0FBQSxPQUFBOztZQUVBOzs7O1FBSUEsT0FBQSxpQkFBQSxZQUFBO1lBQ0EsT0FBQSxPQUFBLFdBQUEsU0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdCQUFBO1lBQ0EsT0FBQTs7O1FBR0EsU0FBQSxHQUFBLEtBQUEsWUFBQTtZQUNBLGdC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LFVBQUE7O0dBRUEsY0FBQTs7O1FBR0EsSUFBQSxVQUFBLElBQUE7UUFDQSxJQUFBLFVBQUEsSUFBQTs7O0VBR0EsUUFBQSxTQUFBLFNBQUE7UUFDQSxRQUFBLFNBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLFFBQUE7WUFDQSxPQUFBLE9BQUE7OztFQUdBLElBQUEsV0FBQSxJQUFBLEdBQUE7RUFDQSxlQUFBLFdBQUE7OztFQUdBLE9BQUEsSUFBQSxlQUFBLFlBQUE7R0FDQSxRQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7SUFDQSxZQUFBLFNBQUE7SUFDQSxRQUFBLEdBQUEsT0FBQSxVQUFBLFNBQUE7SUFDQSxNQUFBOzs7OztFQUtBLElBQUEsa0JBQUEsWUFBQTtHQUNBLFNBQUEsWUFBQSxHQUFBLEtBQUEsUUFBQSxXQUFBLFFBQUEsZ0JBQUE7OztRQUdBLElBQUEsR0FBQSxlQUFBLFlBQUE7WUFDQSxVQUFBLElBQUE7OztRQUdBLElBQUEsR0FBQSxlQUFBLFlBQUE7WUFDQSxVQUFBLElBQUE7OztFQUdBLElBQUEsR0FBQSxlQUFBOztFQUVBLElBQUEsZUFBQSxVQUFBLEdBQUE7R0FDQSxRQUFBLFVBQUEsRUFBQTs7O0VBR0EsUUFBQSxHQUFBLGVBQUE7O0VBRUEsU0FBQSxHQUFBLGNBQUEsWUFBQTtHQUNBLFFBQUEsR0FBQSxlQUFBOzs7RUFHQSxTQUFBLEdBQUEsY0FBQSxZQUFBO0dBQ0EsUUFBQSxHQUFBLGVBQUE7Ozs7Ozs7Ozs7OztBQzdEQSxRQUFBLE9BQUEsb0JBQUEsV0FBQSxnREFBQSxVQUFBLFFBQUEsUUFBQTtFQUNBOztRQUVBLE9BQUEsbUJBQUEsT0FBQTs7UUFFQSxPQUFBLG1CQUFBLE9BQUE7Ozs7Ozs7Ozs7O0FDTEEsUUFBQSxPQUFBLG9CQUFBLFdBQUEsb0VBQUEsVUFBQSxRQUFBLGdCQUFBO1FBQ0E7O1FBRUEsT0FBQSxtQkFBQSxzQkFBQTtRQUNBLE9BQUEsT0FBQSwrQkFBQSxVQUFBLFNBQUE7WUFDQSxlQUFBLFdBQUE7Ozs7Ozs7Ozs7OztBQ0xBLFFBQUEsT0FBQSxv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QUFBLGVBQUEsWUFBQTtZQUNBLE9BQUEsSUFBQTs7WUFFQSxLQUFBLEdBQUEscUJBQUE7WUFDQSxJQUFBLGNBQUEsU0FBQTtZQUNBLElBQUEsYUFBQSxLQUFBLGdCQUFBLElBQUE7O1lBRUEsU0FBQSxLQUFBLFdBQUEsS0FBQSxXQUFBO1lBQ0EsU0FBQSxLQUFBLFdBQUEsS0FBQSxXQUFBOzs7WUFHQSxZQUFBLEtBQUEsU0FBQSxLQUFBO1lBQ0EsWUFBQSxLQUFBLFNBQUEsS0FBQTs7OztZQUlBLFVBQUEsS0FBQSxLQUFBLEtBQUEsWUFBQSxLQUFBLFNBQUEsTUFBQTtZQUNBLFVBQUEsS0FBQSxLQUFBLEtBQUEsWUFBQSxLQUFBLFNBQUEsTUFBQTs7WUFFQSxJQUFBO1lBQ0EsSUFBQSxVQUFBLEtBQUEsR0FBQTs7Z0JBRUEsVUFBQSxDQUFBLFNBQUEsTUFBQSxVQUFBLEtBQUEsTUFBQSxZQUFBO2dCQUNBLFNBQUEsTUFBQSxVQUFBLFVBQUE7bUJBQ0E7Z0JBQ0EsU0FBQSxLQUFBLFdBQUE7O2dCQUVBLFlBQUEsS0FBQSxZQUFBLEtBQUE7OztZQUdBLElBQUEsVUFBQSxLQUFBLEdBQUE7O2dCQUVBLFVBQUEsQ0FBQSxTQUFBLE1BQUEsVUFBQSxLQUFBLE1BQUEsWUFBQTtnQkFDQSxTQUFBLE1BQUEsVUFBQSxVQUFBO21CQUNBO2dCQUNBLFNBQUEsS0FBQSxXQUFBOztnQkFFQSxZQUFBLEtBQUEsWUFBQSxLQUFBOzs7O1FBSUEsSUFBQSxpQkFBQSxZQUFBO1lBQ0E7OztZQUdBLElBQUEsT0FBQSxnQkFBQSxnQkFBQTtZQUNBLFlBQUEsS0FBQSxLQUFBO1lBQ0EsWUFBQSxLQUFBLEtBQUE7OztRQUdBLElBQUEsa0JBQUEsWUFBQTtZQUNBO1lBQ0EsU0FBQSxnQkFBQSxLQUFBOzs7UUFHQSxJQUFBLGdCQUFBLFlBQUE7WUFDQSxTQUFBLENBQUEsR0FBQTs7O1FBR0EsSUFBQSxjQUFBLFlBQUE7WUFDQSxTQUFBOzs7UUFHQSxJQUFBLGtCQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUE7Z0JBQ0EsS0FBQSxLQUFBLFNBQUEsS0FBQSxZQUFBO2dCQUNBLEtBQUEsS0FBQSxTQUFBLEtBQUEsWUFBQTs7OztRQUlBLElBQUEsV0FBQSxVQUFBLE1BQUE7Ozs7Ozs7WUFPQSxZQUFBLEtBQUEsS0FBQTtZQUNBLFlBQUEsS0FBQSxLQUFBO1lBQ0EsS0FBQSxVQUFBLGdCQUFBOzs7UUFHQSxJQUFBLFdBQUEsWUFBQTtZQUNBLElBQUEsWUFBQSxLQUFBLFVBQUEsSUFBQTtnQkFDQSxPQUFBLENBQUEsWUFBQSxLQUFBLEdBQUEsWUFBQTttQkFDQTtnQkFDQSxPQUFBLENBQUEsR0FBQSxZQUFBLEtBQUE7Ozs7UUFJQSxJQUFBLFdBQUEsWUFBQTtZQUNBLElBQUEsWUFBQSxLQUFBLEdBQUE7Z0JBQ0EsT0FBQSxDQUFBLFlBQUEsS0FBQSxHQUFBLFlBQUE7bUJBQ0E7Z0JBQ0EsT0FBQSxDQUFBLFVBQUEsSUFBQSxZQUFBLEtBQUE7Ozs7UUFJQSxJQUFBLGNBQUEsVUFBQSxHQUFBO1lBQ0EsSUFBQSxXQUFBLENBQUEsT0FBQSxXQUFBOztZQUVBLElBQUEsWUFBQSxLQUFBLFVBQUEsTUFBQSxZQUFBLEtBQUEsVUFBQSxJQUFBO2dCQUNBLFNBQUE7bUJBQ0E7Z0JBQ0EsT0FBQSxZQUFBLEtBQUEsY0FBQSxLQUFBO2dCQUNBLFVBQUE7OztZQUdBLElBQUEsR0FBQTs7Z0JBRUEsT0FBQTs7OztZQUlBLE9BQUE7OztRQUdBLElBQUEsY0FBQSxVQUFBLEdBQUE7WUFDQSxJQUFBLFdBQUEsQ0FBQSxPQUFBLFdBQUE7O1lBRUEsSUFBQSxZQUFBLEtBQUEsS0FBQSxZQUFBLEtBQUEsR0FBQTtnQkFDQSxTQUFBO21CQUNBO2dCQUNBLE9BQUEsWUFBQSxLQUFBLGNBQUEsS0FBQTtnQkFDQSxVQUFBOzs7WUFHQSxJQUFBLEdBQUE7O2dCQUVBLE9BQUE7Ozs7WUFJQSxPQUFBOzs7O1FBSUEsSUFBQSxjQUFBLFVBQUEsR0FBQTtZQUNBLEVBQUE7WUFDQSxPQUFBO1lBQ0EsT0FBQTtZQUNBLE9BQUE7OztRQUdBLE9BQUEsVUFBQSxZQUFBO1lBQ0EsT0FB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QTtFQUNBOztFQUVBLElBQUEsTUFBQSxJQUFBLEdBQUEsSUFBQTtHQUNBLFFBQUE7WUFDQSxVQUFBO0dBQ0EsVUFBQTtJQUNBLElBQUEsR0FBQSxRQUFBO0lBQ0EsSUFBQSxHQUFBLFFBQUE7SUFDQSxJQUFBLEdBQUEsUUFBQTs7WUFFQSxjQUFBLEdBQUEsWUFBQSxTQUFBO2dCQUNBLFVBQUE7Ozs7RUFJQSxPQUFBOzs7Ozs7Ozs7OztBQ2hCQSxRQUFBLE9BQUEsb0JBQUEsUUFBQSwrQ0FBQSxVQUFBLFlBQUEsUUFBQSxLQUFBO0VBQ0E7O0VBRUEsSUFBQTtRQUNBLElBQUE7O0VBRUEsSUFBQSxtQkFBQSxVQUFBLFlBQUE7R0FDQSxXQUFBLFFBQUEsT0FBQSxRQUFBLFdBQUE7R0FDQSxPQUFBOzs7RUFHQSxJQUFBLGdCQUFBLFVBQUEsWUFBQTtHQUNBLFlBQUEsS0FBQTtHQUNBLE9BQUE7OztFQUdBLEtBQUEsUUFBQSxVQUFBLFFBQUE7R0FDQSxjQUFBLFdBQUEsTUFBQTtZQUNBLFVBQUEsWUFBQTtHQUNBLFFBQUEsS0FBQSxVQUFBLEdBQUE7SUFDQSxFQUFBLFFBQUE7O0dBRUEsT0FBQTs7O0VBR0EsS0FBQSxNQUFBLFVBQUEsUUFBQTtHQUNBLElBQUEsQ0FBQSxPQUFBLFlBQUEsT0FBQSxPQUFBO0lBQ0EsT0FBQSxXQUFBLE9BQUEsTUFBQSxPQUFBOztHQUVBLElBQUEsYUFBQSxXQUFBLElBQUE7R0FDQSxXQUFBO2NBQ0EsS0FBQTtjQUNBLEtBQUE7Y0FDQSxNQUFBLElBQUE7O0dBRUEsT0FBQTs7O0VBR0EsS0FBQSxTQUFBLFVBQUEsWUFBQTs7R0FFQSxJQUFBLFFBQUEsWUFBQSxRQUFBO0dBQ0EsSUFBQSxRQUFBLENBQUEsR0FBQTtJQUNBLE9BQUEsV0FBQSxRQUFBLFlBQUE7OztLQUdBLFFBQUEsWUFBQSxRQUFBO0tBQ0EsWUFBQSxPQUFBLE9BQUE7T0FDQSxJQUFBOzs7O0VBSUEsS0FBQSxVQUFBLFVBQUEsSUFBQTtHQUNBLE9BQUEsWUFBQSxRQUFBOzs7RUFHQSxLQUFBLFVBQUEsWUFBQTtHQUNBLE9BQUE7OztRQUdBLEtBQUEsYUFBQSxZQUFBO1lBQ0EsT0FBQTs7Ozs7Ozs7Ozs7O0FDNURBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLHNGQUFBLFVBQUEsWUFBQSxlQUFBLEtBQUEsSUFBQSxjQUFBLGFBQUE7RUFDQTs7RUFFQSxJQUFBLFFBQUE7O0VBRUEsSUFBQSxXQUFBOztFQUVBLElBQUEsa0JBQUE7O0VBRUEsSUFBQSxTQUFBOzs7RUFHQSxLQUFBLGVBQUE7Ozs7OztFQU1BLElBQUEsU0FBQSxVQUFBLElBQUE7R0FDQSxLQUFBLE1BQUEsTUFBQSxhQUFBO0dBQ0EsSUFBQSxRQUFBLFNBQUEsUUFBQTtHQUNBLE9BQUEsU0FBQSxDQUFBLFFBQUEsS0FBQSxTQUFBOzs7Ozs7O0VBT0EsSUFBQSxTQUFBLFVBQUEsSUFBQTtHQUNBLEtBQUEsTUFBQSxNQUFBLGFBQUE7R0FDQSxJQUFBLFFBQUEsU0FBQSxRQUFBO0dBQ0EsSUFBQSxTQUFBLFNBQUE7R0FDQSxPQUFBLFNBQUEsQ0FBQSxRQUFBLElBQUEsVUFBQTs7Ozs7OztFQU9BLElBQUEsV0FBQSxVQUFBLElBQUE7R0FDQSxLQUFBLE1BQUEsTUFBQSxhQUFBO0dBQ0EsS0FBQSxJQUFBLElBQUEsT0FBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7SUFDQSxJQUFBLE9BQUEsR0FBQSxPQUFBLElBQUEsT0FBQSxPQUFBOzs7R0FHQSxPQUFBOzs7Ozs7RUFNQSxJQUFBLE9BQUEsVUFBQSxJQUFBO0dBQ0EsTUFBQSxlQUFBLFNBQUE7Ozs7Ozs7O0VBUUEsSUFBQSxhQUFBLFVBQUEsSUFBQTtHQUNBLElBQUEsV0FBQSxHQUFBO0dBQ0EsSUFBQSxNQUFBLFNBQUE7O0dBRUEsSUFBQSxLQUFBO0lBQ0EsU0FBQSxRQUFBO1VBQ0E7SUFDQSxNQUFBLFNBQUEsY0FBQTtJQUNBLElBQUEsTUFBQTtJQUNBLElBQUEsU0FBQSxZQUFBO0tBQ0EsT0FBQSxLQUFBOztLQUVBLElBQUEsT0FBQSxTQUFBLGlCQUFBO01BQ0EsT0FBQTs7S0FFQSxTQUFBLFFBQUE7O0lB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LHFCQUFBLFVBQUEsWUFBQTtZQUNBLElBQUEsQ0FBQSxZQUFBOzs7WUFHQSxJQUFBLENBQUEsV0FBQSxRQUFBO2dCQUNBLFdBQUEsU0FBQSxnQkFBQSxNQUFBO29CQUNBLGVBQUEsV0FBQTs7OztZQUlBLE9BQUEsV0FBQTs7O1FBR0EsS0FBQSxxQkFBQSxVQUFBLFlBQUE7WUFDQSxJQUFBLFFBQUEsZ0JBQUEsT0FBQTtnQkFDQSxlQUFBLFdBQUE7Z0JBQ0EsVUFBQSxjQUFBO2dCQUNBLFlBQUE7OztZQUdBLE1BQUEsU0FBQSxLQUFBLFlBQUE7Z0JBQ0EsV0FBQSxPQUFBLEtBQUE7OztZQUdBLE1BQUEsU0FBQSxNQUFBLElBQUE7O1lBRUEsT0FBQTs7O1FBR0EsS0FBQSx1QkFBQSxVQUFBLFlBQUEsT0FBQTs7WUFFQSxJQUFBLFFBQUEsV0FBQSxPQUFBLFFBQUE7WUFDQSxJQUFBLFFBQUEsQ0FBQSxHQUFBO2dCQUNBLE9BQUEsZ0JBQUEsT0FBQSxDQUFBLElBQUEsTUFBQSxLQUFBLFlBQUE7OztvQkFHQSxRQUFBLFdBQUEsT0FBQSxRQUFBO29CQUNBLFdBQUEsT0FBQSxPQUFBLE9BQUE7bUJBQ0EsSUFBQTs7OztRQUlBLEtBQUEsVUFBQSxZQUFBO1lBQ0EsSUFBQSxPQUFBO1lBQ0EsSUFBQSxNQUFBO1lBQ0EsSUFBQSxRQUFBLFVBQUEsT0FBQTtnQkFDQSxJQUFBLFNBQUEsTUFBQTtnQkFDQSxJQUFBLEtBQUEsS0FBQSxTQUFBO29CQUNBLEtBQUEsS0FBQSxRQUFBLEtBQUE7dUJBQ0E7b0JBQ0EsS0FBQSxLQUFBLFVBQUEsQ0FBQTs7OztZQUlBLEtBQUEsUUFBQSxLQUFBLFVBQUEsUUFBQTtnQkFDQSxLQUFBLE9BQUEsUUFBQTtvQkFDQSxLQUFBLE9BQUE7b0JBQ0EsT0FBQSxLQUFBLFFBQUE7Ozs7WUFJQSxPQUFBOzs7UUFHQSxLQUFBLFNBQUEsWUFBQTtZQUNBLE9BQUE7OztRQUdBLEtBQUEsY0FBQSxVQUFBLE9BQUE7WUFDQSxnQkFBQTs7O1FBR0EsS0FBQSxjQUFBLFlBQUE7WUFDQSxPQUFBOzs7UUFHQSxLQUFBLGNBQUEsWUFBQTtZQUNBLE9BQUEsQ0FBQSxDQUFBOzs7UUFHQSxLQUFBLHVCQUFBLFVBQUEsWUFBQTtZQUNBLG9CQUFBOzs7UUFHQSxLQUFBLHVCQUFBLFlBQUE7WUFDQSxPQUFBOzs7O1FBSUEsQ0FBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLFdBQUEsR0FBQTtZQUNBLE1BQUEsVUFBQSxTQUFBOztZQUVBLElBQUEsV0FBQSxDQUFBOzs7WUFHQSxJQUFBLGVBQUEsWUFBQTtnQkFDQSxJQUFBLEVBQUEsYUFBQSxZQUFBLFFBQUE7b0JBQ0EsU0FBQSxRQUFBOzs7O1lBSUEsT0FBQSxRQUFBLE1BQUEsTUFBQTs7WUFFQSxZQUFBLFFBQUEsVUFBQSxJQUFBO2dCQUNBLFFBQUEsSUFBQSxDQUFBLElBQUEsS0FBQSxVQUFBLFNBQUE7b0JBQ0EsT0FBQSxRQUFBLFFBQUEsYUFBQSxNQUFBLENBQUEsWUFBQSxLQUFBOzs7V0FHQTs7Ozs7Ozs7Ozs7QUN4SEEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsZ0dBQUEsVUFBQSxLQUFBLFFBQUEsYUFBQSxVQUFBLFFBQUEsV0FBQSxRQUFBO0VBQ0E7O1FBRUEsSUFBQSxxQkFBQSxJQUFBLEdBQUE7UUFDQSxJQUFBLG1CQUFBLElBQUEsR0FBQSxPQUFBLE9BQUE7WUFDQSxVQUFBOztRQUVBLElBQUEsa0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLFFBQUE7WUFDQSxPQUFBLE9BQUE7WUFDQSxRQUFBOzs7O0VBSUEsSUFBQSxTQUFBLElBQUEsR0FBQSxZQUFBLE9BQUE7R0FDQSxPQUFBLE9BQUE7WUFDQSxRQUFBLENBQUE7O1lBRUEsT0FBQTs7O0VBR0EsSUFBQSxtQkFBQSxPQUFBOztFQUVBLElBQUEsU0FBQSxJQUFBLEdBQUEsWUFBQSxPQUFBO0dBQ0EsVUFBQTs7OztHQUlBLGlCQUFBLFNBQUEsT0FBQTtJQUNBLE9BQUEsR0FBQSxPQUFBLFVBQUEsYUFBQSxVQUFBLEdBQUEsT0FBQSxVQUFBLFlBQUE7Ozs7UUFJQSxPQUFBLFVBQUE7O1FBRUEsSUFBQSxZQUFBLElBQUEsR0FBQSxZQUFBLFVBQUE7WUFDQSxVQUFBOzs7UUFHQSxVQUFBLFVBQUE7OztFQUdBLElBQUE7O1FBRUEsSUFBQTs7OztRQUlBLElBQUEseUJBQUE7O1FBRUEsSUFBQTs7UUFFQSxJQUFBLFFBQUE7OztRQUdBLElBQUE7O1FBRUEsSUFBQSwwQkFBQSxVQUFBLFlBQUE7WUFDQSxNQUFBO1lBQ0EsSUFBQSxZQUFBO2dCQUNBLGlCQUFBLEtBQUE7Z0JBQ0EsSUFBQSxVQUFBLElBQUEsV0FBQSxlQUFBLElBQUEsV0FBQTtvQkFDQSxTQUFBLENBQUEsSUFBQSxJQUFBLElBQUE7Ozs7OztRQU1BLElBQUEscUJBQUEsVUFBQSxPQUFBLE9BQUE7WUFDQSxPQUFBLENBQUEsUUFBQSxNQUFBLE1BQUEsT0FBQSxhQUFBLFNBQUEsU0FBQTs7Ozs7RUFLQSxJQUFBLGlCQUFBLFVBQUEsVUFBQTtZQUNBLElBQUE7R0FDQSxRQUFBLFNBQUE7SUFDQSxLQUFBOztLQUVBLGNBQUEsQ0FBQSxTQUFBLGFBQUEsQ0FBQSxTQUFBO29CQUNBO0lBQ0EsS0FBQTtJQUNBLEtBQUE7S0FDQSxjQUFBLFNBQUEsaUJBQUE7b0JBQ0E7SUFDQSxLQUFBO0tBQ0EsY0FBQSxDQUFBLFNBQUE7b0JBQ0E7SUFDQTtLQUNBLGNBQUEsU0FBQTs7Ozs7WUFLQSxPQUFBLEdBQUEsT0FBQSxNQUFBLElBQUE7aUJBQ0EsSUFBQSxLQUFBO2lCQUNBLElBQUE7Ozs7RUFJQSxJQUFBLHVCQUFBLFVBQUEsR0FBQTtHQUNBLElBQUEsVUFBQSxFQUFBO0dBQ0EsSUFBQSxPQUFBLFlBQUE7SUFDQSxRQUFBLFdBQUEsU0FBQSxlQUFBLFFBQUE7SUFDQSxRQUFBLFdBQUE7Ozs7R0FJQSxTQUFBLE1BQUEsS0FBQSxRQUFBLFdBQUE7OztFQUdBLElBQUEsZ0JBQUEsVUFBQSxZQUFBO0dBQ0EsSUFBQTtHQUNBLElBQUEsU0FBQSxXQUFBO1lBQ0EsSUFBQSxZQUFBO1lBQ0EsSUFBQSxTQUFBLE9BQUEsYUFBQTs7WUFFQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsT0FBQSxRQUFBLEtBQUEsR0FBQTtnQkFDQSxVQUFBLEtBQUE7b0JBQ0EsT0FBQTs7O29CQUdBLFVBQUEsT0FBQSxJQUFBLE1BQUE7Ozs7R0FJQSxRQUFBLFdBQUE7SUFDQSxLQUFBO0tBQ0EsV0FBQSxJQUFBLEdBQUEsS0FBQSxNQUFBLFVBQUE7S0FDQTtJQUNBLEtBQUE7S0FDQSxXQUFBLElBQUEsR0FBQSxLQUFBLFVBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTs7S0FFQSxXQUFBLElBQUEsR0FBQSxLQUFBLFFBQUEsRUFBQTtLQUNBO0lBQ0EsS0FBQTtLQUNBLFdBQUEsSUFBQSxHQUFBLEtBQUEsV0FBQTtLQUNBO0lBQ0EsS0FBQTs7S0FFQSxXQUFBLElBQUEsR0FBQSxLQUFBLE9BQUEsVUFBQSxJQUFBLFVBQUEsR0FBQTtLQUNBOztnQkFFQTtvQkFDQSxRQUFBLE1BQUEsK0JBQUEsV0FBQTtvQkFDQTs7O0dBR0EsSUFBQSxVQUFBLElBQUEsR0FBQSxRQUFBLEVBQUEsVUFBQTtZQUNBLFFBQUEsYUFBQTtZQUNBLElBQUEsV0FBQSxVQUFBLFdBQUEsT0FBQSxTQUFBLEdBQUE7Z0JBQ0EsUUFBQSxRQUFBLFdBQUEsT0FBQSxHQUFBLE1BQUE7O0dBRUEsUUFBQSxHQUFBLFVBQUE7WUFDQSxpQkFBQSxXQUFBOzs7RUFHQSxJQUFBLHFCQUFBLFVBQUEsR0FBQSxPQUFBOztZQUVBLGlCQUFBO0dBQ0EsTUFBQTtZQUNBLG1CQUFBOztHQUVBLFlBQUEsTUFBQSxDQUFBLElBQUEsTUFBQSxNQUFBLFNBQUEsS0FBQSxZQUFBO0lBQ0EsWUFBQSxRQUFBOzs7O0VBSUEsSUFBQSxtQkFBQSxVQUFBLEdBQUE7R0FDQSxJQUFBLFdBQUEsRUFBQSxRQUFBO1lBQ0EsSUFBQSxRQUFBLE9BQUE7O1lBRUEsRUFBQSxRQUFBLFFBQUEsTUFBQTs7R0FFQSxFQUFBLFFBQUEsYUFBQSxZQUFBLElBQUE7SUFDQSxJQUFBLE9BQUE7SUFDQSxPQUFBLFNBQUE7SUFDQSxRQUFBLGVBQUE7Z0JBQ0EsVUFBQSxNQUFBO2dCQUNBLFlBQUEsT0FBQTs7OztHQUlBLEVBQUEsUUFBQSxXQUFBLFNBQUEsTUFBQSxZQUFBO2dCQUNBLGlCQUFBLGNBQUEsRUFBQTs7O0dBR0EsRUFBQSxRQUFBLEdBQUEsVUFBQTs7WUFFQSxtQkFBQSxFQUFBOztZQUVBLE9BQUEsRUFBQSxRQUFBLFdBQUE7OztRQUdBLElBQUEsZ0JBQUEsVUFBQSxTQUFBO1lBQ0EsSUFBQSxZQUFBLGtCQUFBO2dCQUNBLG1CQUFBOzs7WUFHQSxZQUFBLE9BQUEsUUFBQSxZQUFBLEtBQUEsWUFBQTtnQkFDQSxpQkFBQSxjQUFBO2dCQUNBLGlCQUFBLE9BQUE7Ozs7RUFJQSxLQUFBLE9BQUEsVUFBQSxPQUFBO1lBQ0EsU0FBQTtZQUNBLElBQUEsU0FBQTtHQUNBLElBQUEsZUFBQTtZQUNBLElBQUEsZUFBQTtZQUNBLElBQUEsZUFBQTtHQUNBLE1BQUEsSUFBQSxlQUFBOztZQUVBLElBQUEsUUFBQSxZQUFBOztnQkFFQSxJQUFBLENBQUEsTUFBQSxTQUFBOztvQkFFQSxNQUFBOzs7O0dBSUEsaUJBQUEsR0FBQSxpQkFBQTs7O0VBR0EsS0FBQSxlQUFBLFVBQUEsTUFBQTtZQUNBLE9BQUEsVUFBQTtZQUNBLE9BQUEsVUFBQTtZQUNBLE1BQUE7O1lBRUEsSUFBQSxrQkFBQTs7R0FFQSxjQUFBLFFBQUE7R0FDQSxPQUFBLElBQUEsR0FBQSxZQUFBLEtBQUE7Z0JBQ0EsUUFBQTtJQUNBLE1BQUE7SUFDQSxPQUFBLE9BQUE7OztHQUdBLElBQUEsZUFBQTtHQUNBLEtBQUEsR0FBQSxXQUFBO1lBQ0EsS0FBQSxHQUFBLFdBQUEsVUFBQSxHQUFBO2dCQUNBLE9BQUEsV0FBQSxxQkFBQSxFQUFBOzs7O0VBSUEsS0FBQSxnQkFBQSxZQUFBO0dBQ0EsSUFBQSxrQkFBQTtZQUNBLEtBQUEsVUFBQTtZQUNBLGNBQUE7WUFDQSxPQUFBLFVBQUE7WUFDQSxPQUFBLFVBQUE7O0dBRUEsTUFBQTs7O1FBR0EsS0FBQSxZQUFBLFlBQUE7WUFDQSxPQUFBLFFBQUEsS0FBQTs7O1FBR0EsS0FBQSxj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QSxJQUFBLEdBQUEsTUFBQTs7RUFFQSxLQUFBLE9BQUEsVUFBQSxPQUFBO0dBQ0EsSUFBQSxTQUFBOzs7R0FHQSxNQUFBLElBQUEsZUFBQSxVQUFBLEdBQUEsT0FBQTtJQUNBLE9BQUEsS0FBQSxNQUFBO0lBQ0EsT0FBQSxLQUFBLE1BQUE7O0lBRUEsSUFBQSxPQUFBLE1BQUEsU0FBQTs7SUFFQSxJQUFBLFNBQUEsTUFBQSxTQUFBOztJQUVBLElBQUEsT0FBQSxPQUFBLGFBQUEsT0FBQSxPQUFBLFdBQUE7S0FDQSxTQUFBLEdBQUEsT0FBQSxVQUFBOzs7SUFHQSxJQUFBLGNBQUEsSUFBQSxHQUFBLE9BQUEsWUFBQTtLQUNBLEtBQUEsTUFBQTtLQUNBLFlBQUE7S0FDQSxhQUFBOzs7SUFHQSxXQUFBLFVBQUE7O0lBRUEsSUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO0tBQ0EsWUFBQTtLQUNBLFFBQUE7S0FDQSxNQUFBO0tBQ0EsWUFBQTs7S0FFQSxlQUFBOztLQUVBLFFBQUE7Ozs7SUFJQSxJQUFBLFNBQUEsV0FBQTtLQUNBLElBQUEsVUFBQSxJQUFBLFFBQUEsSUFBQTs7Ozs7RUFLQSxLQUFBLFlBQUEsWUFBQTtHQUNBLE9BQUE7OztFQUdBLEtBQUEsZ0JBQUEsWUFBQTtHQUNBLE9BQUE7OztRQUdBLEtBQUEsV0FBQSxZQUFBO1lBQ0EsT0FBQTs7Ozs7Ozs7Ozs7O0FDL0RBLFFBQUEsT0FBQSxvQkFBQSxRQUFBLFVBQUEsWUFBQTtFQUNBOztRQUVBLElBQUEsUUFBQTs7UUFFQSxLQUFBLFNBQUE7WUFDQSxPQUFBLENBQUEsS0FBQSxLQUFBLEtBQUE7WUFDQSxNQUFBLENBQUEsR0FBQSxLQUFBLEtBQUE7WUFDQSxRQUFBOzs7UUFHQSxJQUFBLHNCQUFBO1FBQ0EsSUFBQSxxQkFBQTs7UUFFQSxJQUFBLHVCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsd0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTs7O1FBR0EsSUFBQSxnQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLGlCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsb0JBQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBOzs7UUFHQSxJQUFBLHFCQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTs7O1FBR0EsSUFBQSxzQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLHVCQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBLEtBQUEsT0FBQTtZQUNBLE9BQUE7OztRQUdBLElBQUEsc0JBQUEsSUFBQSxHQUFBLE1BQUEsT0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBO1lBQ0EsT0FBQTtZQUNBLFVBQUEsQ0FBQTs7O1FBR0EsSUFBQSxnQkFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO1lBQ0EsT0FBQSxLQUFBLE9BQUE7WUFDQSxPQUFBO1lBQ0EsVUFBQSxDQUFBOzs7UUFHQSxJQUFBLGNBQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBOzs7UUFHQSxJQUFBLGVBQUEsSUFBQSxHQUFBLE1BQUEsS0FBQTtZQUNBLE9BQUEsS0FBQSxPQUFBOzs7RUFHQSxLQUFBLFdBQUEsVUFBQSxTQUFBO1lBQ0EsSUFBQSxRQUFBLFFBQUEsU0FBQSxNQUFBLFFBQUEsU0FBQSxNQUFBLE9BQUE7WUFDQSxPQUFBO2dCQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7b0JBQ0EsUUFBQTtvQkFDQSxPQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7d0JBQ0EsUUFBQTt3QkFDQSxNQUFBLElBQUEsR0FBQSxNQUFBLEtBQUE7NEJBQ0EsT0FBQTs7d0JBRUEsUUFBQTs7O2dCQUdBLElBQUEsR0FBQSxNQUFBLE1BQUE7b0JBQ0EsUUFBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO3dCQUNBLE9BQUE7d0JBQ0EsT0FBQTs7Ozs7O0VBTUEsS0FBQSxZQUFBO0dBQ0EsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxPQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7S0FDQSxRQUFBO0tBQ0EsTUFBQTtLQUNBLFFBQUE7O2dCQUVBLFFBQUE7O0dBRUEsSUFBQSxHQUFBLE1BQUEsTUFBQTtJQUNBLFFBQUE7Z0JBQ0EsUUFBQTs7OztFQUlBLEtBQUEsVUFBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsT0FBQSxJQUFBLEdBQUEsTUFBQSxPQUFBO0tBQ0EsUUFBQTtLQUNBLE1BQUE7S0FDQSxRQUFBOzs7R0FHQSxJQUFBLEdBQUEsTUFBQSxNQUFBO0lBQ0EsUUFBQTs7OztFQUlBLEtBQUEsV0FBQTtHQUNBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBOztHQUVBLElBQUEsR0FBQSxNQUFBLE1BQUE7SUFDQSxRQUFBLElBQUEsR0FBQSxNQUFBLE9BQUE7b0JBQ0EsT0FBQSxLQUFBLE9BQUE7b0JBQ0EsT0FBQTs7Ozs7Ozs7Ozs7Ozs7QUNuSUEsUUFBQSxPQUFBLG9CQUFBLFFBQUEsYUFBQSxZQUFBO0VBQ0E7O0VBRUEsSUFBQSxRQUFBOzs7RUFHQSxJQUFBLGNBQUEsWUFBQTtHQUNBLElBQUEsU0FBQSxTQUFBLEtBQUEsUUFBQSxLQUFBOzhCQUNBLE1BQUE7O0dBRUEsSUFBQSxRQUFBOztHQUVBLE9BQUEsUUFBQSxVQUFBLE9BQUE7O0lBRUEsSUFBQSxVQUFBLE1BQUEsTUFBQTtJQUNBLElBQUEsV0FBQSxRQUFBLFdBQUEsR0FBQTtLQUNBLE1BQUEsUUFBQSxNQUFBLG1CQUFBLFFBQUE7Ozs7R0FJQSxPQUFBOzs7O0VBSUEsSUFBQSxjQUFBLFVBQUEsT0FBQTtHQUNBLElBQUEsU0FBQTtHQUNBLEtBQUEsSUFBQSxPQUFBLE9BQUE7SUFDQSxVQUFBLE1BQUEsTUFBQSxtQkFBQSxNQUFBLFFBQUE7O0dBRUEsT0FBQSxPQUFBLFVBQUEsR0FBQSxPQUFBLFNBQUE7OztFQUdBLEtBQUEsWUFBQSxVQUFBLEdBQUE7R0FDQSxNQUFBLE9BQUE7R0FDQSxRQUFBLFVBQUEsT0FBQSxJQUFBLE1BQUEsT0FBQSxNQUFBLFlBQUE7Ozs7RUFJQSxLQUFBLE1BQUEsVUFBQSxRQUFBO0dBQ0EsS0FBQSxJQUFBLE9BQUEsUUFBQTtJQUNBLE1BQUEsT0FBQSxPQUFBOztHQUVBLFFBQUEsYUFBQSxPQUFBLElBQUEsTUFBQSxPQUFBLE1BQUEsWUFBQTs7OztFQUlBLEtBQUEsTUFBQSxVQUFBLEtBQUE7R0FDQSxPQUFBLE1BQUE7OztFQUdBLFFBQUEsUUFBQTs7RUFFQSxJQUFBLENBQUEsT0FBQTtHQUNBLFFBQUE7OztFQUdBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFRoZSBESUFTIGFubm90YXRpb25zIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnLCBbJ2RpYXMuYXBpJywgJ2RpYXMudWknXSk7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEFubm90YXRpb25zQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgYW5ub3RhdGlvbnMgbGlzdCBpbiB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0Fubm90YXRpb25zQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEFubm90YXRpb25zLCBsYWJlbHMsIGFubm90YXRpb25zLCBzaGFwZXMpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRGZWF0dXJlcyA9IG1hcEFubm90YXRpb25zLmdldFNlbGVjdGVkRmVhdHVyZXMoKTtcblxuXHRcdCRzY29wZS5zZWxlY3RlZEZlYXR1cmVzID0gc2VsZWN0ZWRGZWF0dXJlcy5nZXRBcnJheSgpO1xuXG5cdFx0dmFyIHJlZnJlc2hBbm5vdGF0aW9ucyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS5hbm5vdGF0aW9ucyA9IGFubm90YXRpb25zLmN1cnJlbnQoKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmFubm90YXRpb25zID0gW107XG5cblx0XHQkc2NvcGUuY2xlYXJTZWxlY3Rpb24gPSBtYXBBbm5vdGF0aW9ucy5jbGVhclNlbGVjdGlvbjtcblxuXHRcdCRzY29wZS5zZWxlY3RBbm5vdGF0aW9uID0gZnVuY3Rpb24gKGUsIGlkKSB7XG5cdFx0XHQvLyBhbGxvdyBtdWx0aXBsZSBzZWxlY3Rpb25zXG5cdFx0XHRpZiAoIWUuc2hpZnRLZXkpIHtcblx0XHRcdFx0JHNjb3BlLmNsZWFyU2VsZWN0aW9uKCk7XG5cdFx0XHR9XG5cdFx0XHRtYXBBbm5vdGF0aW9ucy5zZWxlY3QoaWQpO1xuXHRcdH07XG5cbiAgICAgICAgJHNjb3BlLmZpdEFubm90YXRpb24gPSBtYXBBbm5vdGF0aW9ucy5maXQ7XG5cblx0XHQkc2NvcGUuaXNTZWxlY3RlZCA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0dmFyIHNlbGVjdGVkID0gZmFsc2U7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmZvckVhY2goZnVuY3Rpb24gKGZlYXR1cmUpIHtcblx0XHRcdFx0aWYgKGZlYXR1cmUuYW5ub3RhdGlvbiAmJiBmZWF0dXJlLmFubm90YXRpb24uaWQgPT0gaWQpIHtcblx0XHRcdFx0XHRzZWxlY3RlZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIHNlbGVjdGVkO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJG9uKCdpbWFnZS5zaG93bicsIHJlZnJlc2hBbm5vdGF0aW9ucyk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIEFubm90YXRvckNvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gTWFpbiBjb250cm9sbGVyIG9mIHRoZSBBbm5vdGF0b3IgYXBwbGljYXRpb24uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQW5ub3RhdG9yQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGltYWdlcywgdXJsUGFyYW1zLCBtc2csIElNQUdFX0lELCBrZXlib2FyZCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuaW1hZ2VzID0gaW1hZ2VzO1xuICAgICAgICAkc2NvcGUuaW1hZ2VMb2FkaW5nID0gdHJ1ZTtcblxuICAgICAgICAvLyB0aGUgY3VycmVudCBjYW52YXMgdmlld3BvcnQsIHN5bmNlZCB3aXRoIHRoZSBVUkwgcGFyYW1ldGVyc1xuICAgICAgICAkc2NvcGUudmlld3BvcnQgPSB7XG4gICAgICAgICAgICB6b29tOiB1cmxQYXJhbXMuZ2V0KCd6JyksXG4gICAgICAgICAgICBjZW50ZXI6IFt1cmxQYXJhbXMuZ2V0KCd4JyksIHVybFBhcmFtcy5nZXQoJ3knKV1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmaW5pc2ggaW1hZ2UgbG9hZGluZyBwcm9jZXNzXG4gICAgICAgIHZhciBmaW5pc2hMb2FkaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmltYWdlTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2ltYWdlLnNob3duJywgJHNjb3BlLmltYWdlcy5jdXJyZW50SW1hZ2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5XG4gICAgICAgIHZhciBwdXNoU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB1cmxQYXJhbXMucHVzaFN0YXRlKCRzY29wZS5pbWFnZXMuY3VycmVudEltYWdlLl9pZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc3RhcnQgaW1hZ2UgbG9hZGluZyBwcm9jZXNzXG4gICAgICAgIHZhciBzdGFydExvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuaW1hZ2VMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBsb2FkIHRoZSBpbWFnZSBieSBpZC4gZG9lc24ndCBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeSBieSBpdHNlbGZcbiAgICAgICAgdmFyIGxvYWRJbWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgc3RhcnRMb2FkaW5nKCk7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VzLnNob3cocGFyc2VJbnQoaWQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZpbmlzaExvYWRpbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzaG93IHRoZSBuZXh0IGltYWdlIGFuZCBjcmVhdGUgYSBuZXcgaGlzdG9yeSBlbnRyeVxuICAgICAgICAkc2NvcGUubmV4dEltYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc3RhcnRMb2FkaW5nKCk7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VzLm5leHQoKVxuICAgICAgICAgICAgICAgICAgLnRoZW4oZmluaXNoTG9hZGluZylcbiAgICAgICAgICAgICAgICAgIC50aGVuKHB1c2hTdGF0ZSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gc2hvdyB0aGUgcHJldmlvdXMgaW1hZ2UgYW5kIGNyZWF0ZSBhIG5ldyBoaXN0b3J5IGVudHJ5XG4gICAgICAgICRzY29wZS5wcmV2SW1hZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzdGFydExvYWRpbmcoKTtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZXMucHJldigpXG4gICAgICAgICAgICAgICAgICAudGhlbihmaW5pc2hMb2FkaW5nKVxuICAgICAgICAgICAgICAgICAgLnRoZW4ocHVzaFN0YXRlKVxuICAgICAgICAgICAgICAgICAgLmNhdGNoKG1zZy5yZXNwb25zZUVycm9yKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyB1cGRhdGUgdGhlIFVSTCBwYXJhbWV0ZXJzIG9mIHRoZSB2aWV3cG9ydFxuICAgICAgICAkc2NvcGUuJG9uKCdjYW52YXMubW92ZWVuZCcsIGZ1bmN0aW9uKGUsIHBhcmFtcykge1xuICAgICAgICAgICAgJHNjb3BlLnZpZXdwb3J0Lnpvb20gPSBwYXJhbXMuem9vbTtcbiAgICAgICAgICAgICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMF0gPSBNYXRoLnJvdW5kKHBhcmFtcy5jZW50ZXJbMF0pO1xuICAgICAgICAgICAgJHNjb3BlLnZpZXdwb3J0LmNlbnRlclsxXSA9IE1hdGgucm91bmQocGFyYW1zLmNlbnRlclsxXSk7XG4gICAgICAgICAgICB1cmxQYXJhbXMuc2V0KHtcbiAgICAgICAgICAgICAgICB6OiAkc2NvcGUudmlld3BvcnQuem9vbSxcbiAgICAgICAgICAgICAgICB4OiAkc2NvcGUudmlld3BvcnQuY2VudGVyWzBdLFxuICAgICAgICAgICAgICAgIHk6ICRzY29wZS52aWV3cG9ydC5jZW50ZXJbMV1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbigzNywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnByZXZJbWFnZSgpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbigzOSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLm5leHRJbWFnZSgpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbigzMiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLm5leHRJbWFnZSgpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBsaXN0ZW4gdG8gdGhlIGJyb3dzZXIgXCJiYWNrXCIgYnV0dG9uXG4gICAgICAgIHdpbmRvdy5vbnBvcHN0YXRlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHN0YXRlID0gZS5zdGF0ZTtcbiAgICAgICAgICAgIGlmIChzdGF0ZSAmJiBzdGF0ZS5zbHVnICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBsb2FkSW1hZ2Uoc3RhdGUuc2x1Zyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSB0aGUgaW1hZ2VzIHNlcnZpY2VcbiAgICAgICAgaW1hZ2VzLmluaXQoKTtcbiAgICAgICAgLy8gZGlzcGxheSB0aGUgZmlyc3QgaW1hZ2VcbiAgICAgICAgbG9hZEltYWdlKElNQUdFX0lEKS50aGVuKHB1c2hTdGF0ZSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQ2FudmFzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBNYWluIGNvbnRyb2xsZXIgZm9yIHRoZSBhbm5vdGF0aW9uIGNhbnZhcyBlbGVtZW50XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQ2FudmFzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcEltYWdlLCBtYXBBbm5vdGF0aW9ucywgbWFwLCAkdGltZW91dCwgZGVib3VuY2UpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgbWFwVmlldyA9IG1hcC5nZXRWaWV3KCk7XG5cblx0XHQvLyB1cGRhdGUgdGhlIFVSTCBwYXJhbWV0ZXJzXG5cdFx0bWFwLm9uKCdtb3ZlZW5kJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIGVtaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdjYW52YXMubW92ZWVuZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgY2VudGVyOiBtYXBWaWV3LmdldENlbnRlcigpLFxuICAgICAgICAgICAgICAgICAgICB6b29tOiBtYXBWaWV3LmdldFpvb20oKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gZG9udCB1cGRhdGUgaW1tZWRpYXRlbHkgYnV0IHdhaXQgZm9yIHBvc3NpYmxlIG5ldyBjaGFuZ2VzXG4gICAgICAgICAgICBkZWJvdW5jZShlbWl0LCAxMDAsICdhbm5vdGF0b3IuY2FudmFzLm1vdmVlbmQnKTtcblx0XHR9KTtcblxuICAgICAgICBtYXAub24oJ2NoYW5nZTp2aWV3JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWFwVmlldyA9IG1hcC5nZXRWaWV3KCk7XG4gICAgICAgIH0pO1xuXG5cdFx0bWFwSW1hZ2UuaW5pdCgkc2NvcGUpO1xuXHRcdG1hcEFubm90YXRpb25zLmluaXQoJHNjb3BlKTtcblxuXHRcdHZhciB1cGRhdGVTaXplID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0Ly8gd29ya2Fyb3VuZCwgc28gdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZCAqYWZ0ZXIqIHRoZSBhbmd1bGFyIGRpZ2VzdFxuXHRcdFx0Ly8gYW5kICphZnRlciogdGhlIGZvbGRvdXQgd2FzIHJlbmRlcmVkXG5cdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIG5lZWRzIHRvIGJlIHdyYXBwZWQgaW4gYW4gZXh0cmEgZnVuY3Rpb24gc2luY2UgdXBkYXRlU2l6ZSBhY2NlcHRzIGFyZ3VtZW50c1xuXHRcdFx0XHRtYXAudXBkYXRlU2l6ZSgpO1xuXHRcdFx0fSwgNTAsIGZhbHNlKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiRvbignc2lkZWJhci5mb2xkb3V0Lm9wZW4nLCB1cGRhdGVTaXplKTtcblx0XHQkc2NvcGUuJG9uKCdzaWRlYmFyLmZvbGRvdXQuY2xvc2UnLCB1cGRhdGVTaXplKTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgQ2F0ZWdvcmllc0NvbnRyb2xsZXJcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQ29udHJvbGxlciBmb3IgdGhlIHNpZGViYXIgbGFiZWwgY2F0ZWdvcmllcyBmb2xkb3V0XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignQ2F0ZWdvcmllc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBsYWJlbHMsIGtleWJvYXJkKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIG1heGltdW0gbnVtYmVyIG9mIGFsbG93ZWQgZmF2b3VyaXRlc1xuICAgICAgICB2YXIgbWF4RmF2b3VyaXRlcyA9IDk7XG4gICAgICAgIHZhciBmYXZvdXJpdGVzU3RvcmFnZUtleSA9ICdkaWFzLmFubm90YXRpb25zLmxhYmVsLWZhdm91cml0ZXMnO1xuXG4gICAgICAgIC8vIHNhdmVzIHRoZSBJRHMgb2YgdGhlIGZhdm91cml0ZXMgaW4gbG9jYWxTdG9yYWdlXG4gICAgICAgIHZhciBzdG9yZUZhdm91cml0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdG1wID0gJHNjb3BlLmZhdm91cml0ZXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uaWQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbZmF2b3VyaXRlc1N0b3JhZ2VLZXldID0gSlNPTi5zdHJpbmdpZnkodG1wKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyByZXN0b3JlcyB0aGUgZmF2b3VyaXRlcyBmcm9tIHRoZSBJRHMgaW4gbG9jYWxTdG9yYWdlXG4gICAgICAgIHZhciBsb2FkRmF2b3VyaXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlW2Zhdm91cml0ZXNTdG9yYWdlS2V5XSkge1xuICAgICAgICAgICAgICAgIHZhciB0bXAgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2VbZmF2b3VyaXRlc1N0b3JhZ2VLZXldKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmF2b3VyaXRlcyA9ICRzY29wZS5jYXRlZ29yaWVzLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IHRha2UgdGhvc2UgY2F0ZWdvcmllcyBhcyBmYXZvdXJpdGVzIHRoYXQgYXJlIGF2YWlsYWJsZSBmb3IgdGhpcyBpbWFnZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG1wLmluZGV4T2YoaXRlbS5pZCkgIT09IC0xO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBjaG9vc2VGYXZvdXJpdGUgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChpbmRleCA+PSAwICYmIGluZGV4IDwgJHNjb3BlLmZhdm91cml0ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdEl0ZW0oJHNjb3BlLmZhdm91cml0ZXNbaW5kZXhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaG90a2V5c01hcCA9IFsn8J2frScsICfwnZ+uJywgJ/Cdn68nLCAn8J2fsCcsICfwnZ+xJywgJ/Cdn7InLCAn8J2fsycsICfwnZ+0JywgJ/Cdn7UnXTtcbiAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXMgPSBbXTtcbiAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMgPSBbXTtcbiAgICAgICAgbGFiZWxzLnByb21pc2UudGhlbihmdW5jdGlvbiAoYWxsKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gYWxsKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXMgPSAkc2NvcGUuY2F0ZWdvcmllcy5jb25jYXQoYWxsW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbG9hZEZhdm91cml0ZXMoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLmNhdGVnb3JpZXNUcmVlID0gbGFiZWxzLmdldFRyZWUoKTtcblxuICAgICAgICAkc2NvcGUuc2VsZWN0SXRlbSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICBsYWJlbHMuc2V0U2VsZWN0ZWQoaXRlbSk7XG4gICAgICAgICAgICAkc2NvcGUuc2VhcmNoQ2F0ZWdvcnkgPSAnJzsgLy8gY2xlYXIgc2VhcmNoIGZpZWxkXG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnY2F0ZWdvcmllcy5zZWxlY3RlZCcsIGl0ZW0pO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0Zhdm91cml0ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmZhdm91cml0ZXMuaW5kZXhPZihpdGVtKSAhPT0gLTE7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gYWRkcyBhIG5ldyBpdGVtIHRvIHRoZSBmYXZvdXJpdGVzIG9yIHJlbW92ZXMgaXQgaWYgaXQgaXMgYWxyZWFkeSBhIGZhdm91cml0ZVxuICAgICAgICAkc2NvcGUudG9nZ2xlRmF2b3VyaXRlID0gZnVuY3Rpb24gKGUsIGl0ZW0pIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSAkc2NvcGUuZmF2b3VyaXRlcy5pbmRleE9mKGl0ZW0pO1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSAmJiAkc2NvcGUuZmF2b3VyaXRlcy5sZW5ndGggPCBtYXhGYXZvdXJpdGVzKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMucHVzaChpdGVtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmZhdm91cml0ZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0b3JlRmF2b3VyaXRlcygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHJldHVybnMgd2hldGhlciB0aGUgdXNlciBpcyBzdGlsbCBhbGxvd2VkIHRvIGFkZCBmYXZvdXJpdGVzXG4gICAgICAgICRzY29wZS5mYXZvdXJpdGVzTGVmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuZmF2b3VyaXRlcy5sZW5ndGggPCBtYXhGYXZvdXJpdGVzO1xuICAgICAgICB9O1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCcxJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDApO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignMicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSgxKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoMik7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDMpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignNScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg0KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzYnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoNSk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCc3JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2hvb3NlRmF2b3VyaXRlKDYpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignOCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNob29zZUZhdm91cml0ZSg3KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJzknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjaG9vc2VGYXZvdXJpdGUoOCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIENvbmZpZGVuY2VDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBjb25maWRlbmNlIGNvbnRyb2xcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdDb25maWRlbmNlQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGxhYmVscykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0JHNjb3BlLmNvbmZpZGVuY2UgPSAxLjA7XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdjb25maWRlbmNlJywgZnVuY3Rpb24gKGNvbmZpZGVuY2UpIHtcblx0XHRcdGxhYmVscy5zZXRDdXJyZW50Q29uZmlkZW5jZShwYXJzZUZsb2F0KGNvbmZpZGVuY2UpKTtcblxuXHRcdFx0aWYgKGNvbmZpZGVuY2UgPD0gMC4yNSkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLWRhbmdlcic7XG5cdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC41ICkge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXdhcm5pbmcnO1xuXHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNzUgKSB7XG5cdFx0XHRcdCRzY29wZS5jb25maWRlbmNlQ2xhc3MgPSAnbGFiZWwtc3VjY2Vzcyc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUuY29uZmlkZW5jZUNsYXNzID0gJ2xhYmVsLXByaW1hcnknO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBEcmF3aW5nQ29udHJvbHNDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBjb250cm9scyBiYXIgZHJhd2luZyBidXRvbnNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdEcmF3aW5nQ29udHJvbHNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMsIGxhYmVscywgbXNnLCAkYXR0cnMsIGtleWJvYXJkKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHQkc2NvcGUuc2VsZWN0U2hhcGUgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgaWYgKG5hbWUgIT09IG51bGwgJiYgJHNjb3BlLnNlbGVjdGVkU2hhcGUoKSAhPT0gbmFtZSkge1xuICAgICAgICAgICAgICAgIGlmICghbGFiZWxzLmhhc1NlbGVjdGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdzaWRlYmFyLmZvbGRvdXQuZG8tb3BlbicsICdjYXRlZ29yaWVzJyk7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5pbmZvKCRhdHRycy5zZWxlY3RDYXRlZ29yeSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cdFx0XHRcdG1hcEFubm90YXRpb25zLnN0YXJ0RHJhd2luZyhuYW1lKTtcblx0XHRcdH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuZmluaXNoRHJhd2luZygpO1xuICAgICAgICAgICAgfVxuXHRcdH07XG5cbiAgICAgICAgJHNjb3BlLnNlbGVjdGVkU2hhcGUgPSBtYXBBbm5vdGF0aW9ucy5nZXRTZWxlY3RlZERyYXdpbmdUeXBlO1xuXG4gICAgICAgIC8vIGRlc2VsZWN0IGRyYXdpbmcgdG9vbCBvbiBlc2NhcGVcbiAgICAgICAga2V5Ym9hcmQub24oMjcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZShudWxsKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ2EnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ1BvaW50Jyk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGtleWJvYXJkLm9uKCdzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNoYXBlKCdSZWN0YW5nbGUnKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ2QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2hhcGUoJ0NpcmNsZScpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignZicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnTGluZVN0cmluZycpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBrZXlib2FyZC5vbignZycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RTaGFwZSgnUG9seWdvbicpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgRWRpdENvbnRyb2xzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgY29udHJvbHMgYmFyIGVkaXQgYnV0dG9uc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ0VkaXRDb250cm9sc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucywga2V5Ym9hcmQsICR0aW1lb3V0KSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gdGhlIHVzZXIgaGFzIGEgY2VydGFpbiBhbW91bnQgb2YgdGltZSB0byBxdWljayBkZWxldGUgdGhlIGxhc3QgZHJhd25cbiAgICAgICAgLy8gYW5ub3RhdGlvbjsgdGhpcyBib29sIHRlbGxzIHVzIHdoZXRoZXIgdGhlIHRpbWVvdXQgaXMgc3RpbGwgcnVubmluZy5cbiAgICAgICAgdmFyIGlzSW5EZWxldGVMYXN0QW5ub3RhdGlvblRpbWVvdXQgPSBmYWxzZTtcbiAgICAgICAgLy8gdGltZSBpbiBtcyBpbiB3aGljaCB0aGUgdXNlciBpcyBhbGxvd2VkIHRvIHF1aWNrIGRlbGV0ZSBhbiBhbm5vdGF0aW9uXG4gICAgICAgIHZhciBkZWxldGVMYXN0QW5ub3RhdGlvblRpbWVvdXQgPSAxMDAwMDtcbiAgICAgICAgdmFyIHRpbWVvdXRQcm9taXNlO1xuXG4gICAgICAgICRzY29wZS5kZWxldGVTZWxlY3RlZEFubm90YXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKG1hcEFubm90YXRpb25zLmhhc1NlbGVjdGVkRmVhdHVyZXMoKSAmJiBjb25maXJtKCdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIGFsbCBzZWxlY3RlZCBhbm5vdGF0aW9ucz8nKSkge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmRlbGV0ZVNlbGVjdGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmhhc1NlbGVjdGVkQW5ub3RhdGlvbnMgPSBtYXBBbm5vdGF0aW9ucy5oYXNTZWxlY3RlZEZlYXR1cmVzO1xuXG4gICAgICAgIHZhciBzdGFydE1vdmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcEFubm90YXRpb25zLnN0YXJ0TW92aW5nKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGZpbmlzaE1vdmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmZpbmlzaE1vdmluZygpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5tb3ZlU2VsZWN0ZWRBbm5vdGF0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICgkc2NvcGUuaXNNb3ZpbmcoKSkge1xuICAgICAgICAgICAgICAgIGZpbmlzaE1vdmluZygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGFydE1vdmluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5jYW5EZWxldGVMYXN0QW5ub3RhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBpc0luRGVsZXRlTGFzdEFubm90YXRpb25UaW1lb3V0ICYmIG1hcEFubm90YXRpb25zLmhhc0RyYXduQW5ub3RhdGlvbigpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5kZWxldGVMYXN0RHJhd25Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCRzY29wZS5jYW5EZWxldGVMYXN0QW5ub3RhdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuZGVsZXRlTGFzdERyYXduQW5ub3RhdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc01vdmluZyA9IG1hcEFubm90YXRpb25zLmlzTW92aW5nO1xuXG4gICAgICAgIC8vIHRoZSBxdWljayBkZWxldGUgdGltZW91dCBhbHdheXMgc3RhcnRzIHdoZW4gYSBuZXcgYW5ub3RhdGlvbiB3YXMgZHJhd25cbiAgICAgICAgJHNjb3BlLiRvbignYW5ub3RhdGlvbnMuZHJhd24nLCBmdW5jdGlvbiAoZSwgZmVhdHVyZSkge1xuICAgICAgICAgICAgaXNJbkRlbGV0ZUxhc3RBbm5vdGF0aW9uVGltZW91dCA9IHRydWU7XG4gICAgICAgICAgICAkdGltZW91dC5jYW5jZWwodGltZW91dFByb21pc2UpO1xuICAgICAgICAgICAgdGltZW91dFByb21pc2UgPSAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaXNJbkRlbGV0ZUxhc3RBbm5vdGF0aW9uVGltZW91dCA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgZGVsZXRlTGFzdEFubm90YXRpb25UaW1lb3V0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gZGVsIGtleVxuICAgICAgICBrZXlib2FyZC5vbig0NiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICRzY29wZS5kZWxldGVTZWxlY3RlZEFubm90YXRpb25zKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGVzYyBrZXlcbiAgICAgICAga2V5Ym9hcmQub24oMjcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICgkc2NvcGUuaXNNb3ZpbmcoKSkge1xuICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoZmluaXNoTW92aW5nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gYmFja3NwYWNlIGtleVxuICAgICAgICBrZXlib2FyZC5vbig4LCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZUxhc3REcmF3bkFubm90YXRpb24oKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAga2V5Ym9hcmQub24oJ20nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCRzY29wZS5tb3ZlU2VsZWN0ZWRBbm5vdGF0aW9ucyk7XG4gICAgICAgIH0pO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBNaW5pbWFwQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgbWluaW1hcCBpbiB0aGUgc2lkZWJhclxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ01pbmltYXBDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwLCBtYXBJbWFnZSwgJGVsZW1lbnQsIHN0eWxlcykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciB2aWV3cG9ydFNvdXJjZSA9IG5ldyBvbC5zb3VyY2UuVmVjdG9yKCk7XG5cblx0XHR2YXIgbWluaW1hcCA9IG5ldyBvbC5NYXAoe1xuXHRcdFx0dGFyZ2V0OiAnbWluaW1hcCcsXG5cdFx0XHQvLyByZW1vdmUgY29udHJvbHNcblx0XHRcdGNvbnRyb2xzOiBbXSxcblx0XHRcdC8vIGRpc2FibGUgaW50ZXJhY3Rpb25zXG5cdFx0XHRpbnRlcmFjdGlvbnM6IFtdXG5cdFx0fSk7XG5cbiAgICAgICAgdmFyIG1hcFNpemUgPSBtYXAuZ2V0U2l6ZSgpO1xuICAgICAgICB2YXIgbWFwVmlldyA9IG1hcC5nZXRWaWV3KCk7XG5cblx0XHQvLyBnZXQgdGhlIHNhbWUgbGF5ZXJzIHRoYW4gdGhlIG1hcFxuXHRcdG1pbmltYXAuYWRkTGF5ZXIobWFwSW1hZ2UuZ2V0TGF5ZXIoKSk7XG4gICAgICAgIG1pbmltYXAuYWRkTGF5ZXIobmV3IG9sLmxheWVyLlZlY3Rvcih7XG4gICAgICAgICAgICBzb3VyY2U6IHZpZXdwb3J0U291cmNlLFxuICAgICAgICAgICAgc3R5bGU6IHN0eWxlcy52aWV3cG9ydFxuICAgICAgICB9KSk7XG5cblx0XHR2YXIgdmlld3BvcnQgPSBuZXcgb2wuRmVhdHVyZSgpO1xuXHRcdHZpZXdwb3J0U291cmNlLmFkZEZlYXR1cmUodmlld3BvcnQpO1xuXG5cdFx0Ly8gcmVmcmVzaCB0aGUgdmlldyAodGhlIGltYWdlIHNpemUgY291bGQgaGF2ZSBiZWVuIGNoYW5nZWQpXG5cdFx0JHNjb3BlLiRvbignaW1hZ2Uuc2hvd24nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtaW5pbWFwLnNldFZpZXcobmV3IG9sLlZpZXcoe1xuXHRcdFx0XHRwcm9qZWN0aW9uOiBtYXBJbWFnZS5nZXRQcm9qZWN0aW9uKCksXG5cdFx0XHRcdGNlbnRlcjogb2wuZXh0ZW50LmdldENlbnRlcihtYXBJbWFnZS5nZXRFeHRlbnQoKSksXG5cdFx0XHRcdHpvb206IDBcblx0XHRcdH0pKTtcblx0XHR9KTtcblxuXHRcdC8vIG1vdmUgdGhlIHZpZXdwb3J0IHJlY3RhbmdsZSBvbiB0aGUgbWluaW1hcFxuXHRcdHZhciByZWZyZXNoVmlld3BvcnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2aWV3cG9ydC5zZXRHZW9tZXRyeShvbC5nZW9tLlBvbHlnb24uZnJvbUV4dGVudChtYXBWaWV3LmNhbGN1bGF0ZUV4dGVudChtYXBTaXplKSkpO1xuXHRcdH07XG5cbiAgICAgICAgbWFwLm9uKCdjaGFuZ2U6c2l6ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1hcFNpemUgPSBtYXAuZ2V0U2l6ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBtYXAub24oJ2NoYW5nZTp2aWV3JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWFwVmlldyA9IG1hcC5nZXRWaWV3KCk7XG4gICAgICAgIH0pO1xuXG5cdFx0bWFwLm9uKCdwb3N0Y29tcG9zZScsIHJlZnJlc2hWaWV3cG9ydCk7XG5cblx0XHR2YXIgZHJhZ1ZpZXdwb3J0ID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdG1hcFZpZXcuc2V0Q2VudGVyKGUuY29vcmRpbmF0ZSk7XG5cdFx0fTtcblxuXHRcdG1pbmltYXAub24oJ3BvaW50ZXJkcmFnJywgZHJhZ1ZpZXdwb3J0KTtcblxuXHRcdCRlbGVtZW50Lm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bWluaW1hcC51bigncG9pbnRlcmRyYWcnLCBkcmFnVmlld3BvcnQpO1xuXHRcdH0pO1xuXG5cdFx0JGVsZW1lbnQub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRtaW5pbWFwLm9uKCdwb2ludGVyZHJhZycsIGRyYWdWaWV3cG9ydCk7XG5cdFx0fSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNlbGVjdGVkTGFiZWxDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzZWxlY3RlZCBsYWJlbCBkaXNwbGF5IGluIHRoZSBtYXBcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTZWxlY3RlZExhYmVsQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIGxhYmVscykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgICRzY29wZS5nZXRTZWxlY3RlZExhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkO1xuXG4gICAgICAgICRzY29wZS5oYXNTZWxlY3RlZExhYmVsID0gbGFiZWxzLmhhc1NlbGVjdGVkO1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTZXR0aW5nc0Fubm90YXRpb25PcGFjaXR5Q29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBzZXR0aW5ncyBmb2xkb3V0XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2V0dGluZ3NBbm5vdGF0aW9uT3BhY2l0eUNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBtYXBBbm5vdGF0aW9ucykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAkc2NvcGUuc2V0RGVmYXVsdFNldHRpbmdzKCdhbm5vdGF0aW9uX29wYWNpdHknLCAnMScpO1xuICAgICAgICAkc2NvcGUuJHdhdGNoKCdzZXR0aW5ncy5hbm5vdGF0aW9uX29wYWNpdHknLCBmdW5jdGlvbiAob3BhY2l0eSkge1xuICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuc2V0T3BhY2l0eShvcGFjaXR5KTtcbiAgICAgICAgfSk7XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgU2V0dGluZ3NBbm5vdGF0aW9uc0N5Y2xpbmdDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgY3ljbGluZyB0aHJvdWdoIGFubm90YXRpb25zXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2V0dGluZ3NBbm5vdGF0aW9uc0N5Y2xpbmdDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbWFwQW5ub3RhdGlvbnMsIGxhYmVscywga2V5Ym9hcmQpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gZmxhZyB0byBwcmV2ZW50IGN5Y2xpbmcgd2hpbGUgYSBuZXcgaW1hZ2UgaXMgbG9hZGluZ1xuICAgICAgICB2YXIgbG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBjeWNsaW5nS2V5ID0gJ2Fubm90YXRpb25zJztcblxuICAgICAgICB2YXIgbmV4dEFubm90YXRpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcgfHwgISRzY29wZS5jeWNsaW5nKCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKG1hcEFubm90YXRpb25zLmhhc05leHQoKSkge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmN5Y2xlTmV4dCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBtZXRob2QgZnJvbSBBbm5vdGF0b3JDb250cm9sbGVyOyBtYXBBbm5vdGF0aW9ucyB3aWxsIHJlZnJlc2ggYXV0b21hdGljYWxseVxuICAgICAgICAgICAgICAgICRzY29wZS5uZXh0SW1hZ2UoKS50aGVuKG1hcEFubm90YXRpb25zLmp1bXBUb0ZpcnN0KTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBvbmx5IGFwcGx5IGlmIHRoaXMgd2FzIGNhbGxlZCBieSB0aGUga2V5Ym9hcmQgZXZlbnRcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNhbmNlbCBhbGwga2V5Ym9hcmQgZXZlbnRzIHdpdGggbG93ZXIgcHJpb3JpdHlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcHJldkFubm90YXRpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmcgfHwgISRzY29wZS5jeWNsaW5nKCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKG1hcEFubm90YXRpb25zLmhhc1ByZXZpb3VzKCkpIHtcbiAgICAgICAgICAgICAgICBtYXBBbm5vdGF0aW9ucy5jeWNsZVByZXZpb3VzKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG1ldGhvZCBmcm9tIEFubm90YXRvckNvbnRyb2xsZXI7IG1hcEFubm90YXRpb25zIHdpbGwgcmVmcmVzaCBhdXRvbWF0aWNhbGx5XG4gICAgICAgICAgICAgICAgJHNjb3BlLnByZXZJbWFnZSgpLnRoZW4obWFwQW5ub3RhdGlvbnMuanVtcFRvTGFzdCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gb25seSBhcHBseSBpZiB0aGlzIHdhcyBjYWxsZWQgYnkgdGhlIGtleWJvYXJkIGV2ZW50XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjYW5jZWwgYWxsIGtleWJvYXJkIGV2ZW50cyB3aXRoIGxvd2VyIHByaW9yaXR5XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGF0dGFjaExhYmVsID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmIChsb2FkaW5nKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCRzY29wZS5jeWNsaW5nKCkgJiYgbGFiZWxzLmhhc1NlbGVjdGVkKCkpIHtcbiAgICAgICAgICAgICAgICBsYWJlbHMuYXR0YWNoVG9Bbm5vdGF0aW9uKG1hcEFubm90YXRpb25zLmdldEN1cnJlbnQoKSkuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmZsaWNrZXIoMSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmZsaWNrZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzdG9wIGN5Y2xpbmcgdXNpbmcgYSBrZXlib2FyZCBldmVudFxuICAgICAgICB2YXIgc3RvcEN5Y2xpbmcgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgJHNjb3BlLnN0b3BDeWNsaW5nKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmN5Y2xpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmdldFZvbGF0aWxlU2V0dGluZ3MoJ2N5Y2xlJykgPT09IGN5Y2xpbmdLZXk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnN0YXJ0Q3ljbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScsIGN5Y2xpbmdLZXkpO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zdG9wQ3ljbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5zZXRWb2xhdGlsZVNldHRpbmdzKCdjeWNsZScsICcnKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyB0aGUgY3ljbGUgc2V0dGluZ3MgbXkgYmUgc2V0IGJ5IG90aGVyIGNvbnRyb2xsZXJzLCB0b28sIHNvIHdhdGNoIGl0XG4gICAgICAgIC8vIGluc3RlYWQgb2YgdXNpbmcgdGhlIHN0YXJ0L3N0b3AgZnVuY3Rpb25zIHRvIGFkZC9yZW1vdmUgZXZlbnRzIGV0Yy5cbiAgICAgICAgJHNjb3BlLiR3YXRjaCgndm9sYXRpbGVTZXR0aW5ncy5jeWNsZScsIGZ1bmN0aW9uIChjeWNsZSwgb2xkQ3ljbGUpIHtcbiAgICAgICAgICAgIGlmIChjeWNsZSA9PT0gY3ljbGluZ0tleSkge1xuICAgICAgICAgICAgICAgIC8vIG92ZXJyaWRlIHByZXZpb3VzIGltYWdlIG9uIGFycm93IGxlZnRcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzNywgcHJldkFubm90YXRpb24sIDEwKTtcbiAgICAgICAgICAgICAgICAvLyBvdmVycmlkZSBuZXh0IGltYWdlIG9uIGFycm93IHJpZ2h0IGFuZCBzcGFjZVxuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDM5LCBuZXh0QW5ub3RhdGlvbiwgMTApO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDMyLCBuZXh0QW5ub3RhdGlvbiwgMTApO1xuXG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMTMsIGF0dGFjaExhYmVsLCAxMCk7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMjcsIHN0b3BDeWNsaW5nLCAxMCk7XG4gICAgICAgICAgICAgICAgbWFwQW5ub3RhdGlvbnMuanVtcFRvQ3VycmVudCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvbGRDeWNsZSA9PT0gY3ljbGluZ0tleSkge1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzNywgcHJldkFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzOSwgbmV4dEFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigzMiwgbmV4dEFubm90YXRpb24pO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigxMywgYXR0YWNoTGFiZWwpO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9mZigyNywgc3RvcEN5Y2xpbmcpO1xuICAgICAgICAgICAgICAgIG1hcEFubm90YXRpb25zLmNsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUucHJldkFubm90YXRpb24gPSBwcmV2QW5ub3RhdGlvbjtcbiAgICAgICAgJHNjb3BlLm5leHRBbm5vdGF0aW9uID0gbmV4dEFubm90YXRpb247XG4gICAgICAgICRzY29wZS5hdHRhY2hMYWJlbCA9IGF0dGFjaExhYmVsO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNldHRpbmdzQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBzZXR0aW5ncyBmb2xkb3V0XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2V0dGluZ3NDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgZGVib3VuY2UpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIHNldHRpbmdzU3RvcmFnZUtleSA9ICdkaWFzLmFubm90YXRpb25zLnNldHRpbmdzJztcblxuICAgICAgICB2YXIgZGVmYXVsdFNldHRpbmdzID0ge307XG5cbiAgICAgICAgLy8gbWF5IGJlIGV4dGVuZGVkIGJ5IGNoaWxkIGNvbnRyb2xsZXJzXG4gICAgICAgICRzY29wZS5zZXR0aW5ncyA9IHt9O1xuXG4gICAgICAgIC8vIG1heSBiZSBleHRlbmRlZCBieSBjaGlsZCBjb250cm9sbGVycyBidXQgd2lsbCBub3QgYmUgcGVybWFuZW50bHkgc3RvcmVkXG4gICAgICAgICRzY29wZS52b2xhdGlsZVNldHRpbmdzID0ge307XG5cbiAgICAgICAgdmFyIHN0b3JlU2V0dGluZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc2V0dGluZ3MgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnNldHRpbmdzKTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5nc1trZXldID09PSBkZWZhdWx0U2V0dGluZ3Nba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBkb24ndCBzdG9yZSBkZWZhdWx0IHNldHRpbmdzIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2V0dGluZ3Nba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NTdG9yYWdlS2V5XSA9IEpTT04uc3RyaW5naWZ5KHNldHRpbmdzKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgc3RvcmVTZXR0aW5nc0RlYm91bmNlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIHdhaXQgZm9yIHF1aWNrIGNoYW5nZXMgYW5kIG9ubHkgc3RvcmUgdGhlbSBvbmNlIHRoaW5ncyBjYWxtZWQgZG93biBhZ2FpblxuICAgICAgICAgICAgLy8gKGUuZy4gd2hlbiB0aGUgdXNlciBmb29scyBhcm91bmQgd2l0aCBhIHJhbmdlIHNsaWRlcilcbiAgICAgICAgICAgIGRlYm91bmNlKHN0b3JlU2V0dGluZ3MsIDI1MCwgc2V0dGluZ3NTdG9yYWdlS2V5KTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmVzdG9yZVNldHRpbmdzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHNldHRpbmdzID0ge307XG4gICAgICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtzZXR0aW5nc1N0b3JhZ2VLZXldKSB7XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MgPSBKU09OLnBhcnNlKHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc2V0dGluZ3NTdG9yYWdlS2V5XSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmV4dGVuZChzZXR0aW5ncywgZGVmYXVsdFNldHRpbmdzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2V0U2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgJHNjb3BlLnNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZ2V0U2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnNldHRpbmdzW2tleV07XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnNldERlZmF1bHRTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBkZWZhdWx0U2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgaWYgKCEkc2NvcGUuc2V0dGluZ3MuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zZXRTZXR0aW5ncyhrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc2V0Vm9sYXRpbGVTZXR0aW5ncyA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAkc2NvcGUudm9sYXRpbGVTZXR0aW5nc1trZXldID0gdmFsdWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmdldFZvbGF0aWxlU2V0dGluZ3MgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLnZvbGF0aWxlU2V0dGluZ3Nba2V5XTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuJHdhdGNoKCdzZXR0aW5ncycsIHN0b3JlU2V0dGluZ3NEZWJvdW5jZWQsIHRydWUpO1xuICAgICAgICBhbmd1bGFyLmV4dGVuZCgkc2NvcGUuc2V0dGluZ3MsIHJlc3RvcmVTZXR0aW5ncygpKTtcbiAgICB9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTZXR0aW5nc1NlY3Rpb25DeWNsaW5nQ29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciBjeWNsaW5nIHRocm91Z2ggaW1hZ2Ugc2VjdGlvbnNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5jb250cm9sbGVyKCdTZXR0aW5nc1NlY3Rpb25DeWNsaW5nQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIG1hcCwgbWFwSW1hZ2UsIGtleWJvYXJkKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIC8vIGZsYWcgdG8gcHJldmVudCBjeWNsaW5nIHdoaWxlIGEgbmV3IGltYWdlIGlzIGxvYWRpbmdcbiAgICAgICAgdmFyIGxvYWRpbmcgPSBmYWxzZTtcblxuICAgICAgICB2YXIgY3ljbGluZ0tleSA9ICdzZWN0aW9ucyc7XG4gICAgICAgIHZhciB2aWV3O1xuXG4gICAgICAgIC8vIHZpZXcgY2VudGVyIHBvaW50IG9mIHRoZSBzdGFydCBwb3NpdGlvblxuICAgICAgICB2YXIgc3RhcnRDZW50ZXIgPSBbMCwgMF07XG4gICAgICAgIC8vIG51bWJlciBvZiBwaXhlbHMgdG8gcHJvY2VlZCBpbiB4IGFuZCB5IGRpcmVjdGlvbiBmb3IgZWFjaCBzdGVwXG4gICAgICAgIHZhciBzdGVwU2l6ZSA9IFswLCAwXTtcbiAgICAgICAgLy8gbnVtYmVyIG9mIHN0ZXBzIGluIHggYW5kIHkgZGlyZWN0aW9uIC0xIVxuICAgICAgICB2YXIgc3RlcENvdW50ID0gWzAsIDBdO1xuICAgICAgICAvLyBudW1iZXIgb2YgY3VycmVudCBzdGVwIGluIHggYW5kIHkgZGlyZWN0aW9uIC0xIVxuICAgICAgICB2YXIgY3VycmVudFN0ZXAgPSBbMCwgMF07XG5cbiAgICAgICAgLy8gVE9ETyByZWFjdCBvbiB3aW5kb3cgcmVzaXplIGV2ZW50cyBhbmQgZm9sZG91dCBvcGVuIGFzIHdlbGwgYXNcbiAgICAgICAgLy8gY2hhbmdpbmcgdGhlIHpvb20gbGV2ZWxcblxuICAgICAgICB2YXIgZGlzdGFuY2UgPSBmdW5jdGlvbiAocDEsIHAyKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHAxWzBdIC0gcDJbMF0sIDIpICsgTWF0aC5wb3cocDFbMV0gLSBwMlsxXSwgMikpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGlmIHRoZSBtYXAgc2l6ZSB3YXMgY2hhbmdlZCwgdGhpcyBmdW5jdGlvbiBmaW5kcyB0aGUgbmV4dCBuZWFyZXN0IHN0ZXBcbiAgICAgICAgdmFyIGZpbmROZWFyZXN0U3RlcCA9IGZ1bmN0aW9uIChjZW50ZXIpIHtcbiAgICAgICAgICAgIHZhciBuZWFyZXN0ID0gSW5maW5pdHk7XG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IDA7XG4gICAgICAgICAgICB2YXIgbmVhcmVzdFN0ZXAgPSBbMCwgMF07XG4gICAgICAgICAgICBmb3IgKHZhciB5ID0gMDsgeSA8PSBzdGVwQ291bnRbMV07IHkrKykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHggPSAwOyB4IDw9IHN0ZXBDb3VudFswXTsgeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBkaXN0YW5jZShjZW50ZXIsIGdldFN0ZXBQb3NpdGlvbihbeCwgeV0pKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQgPCBuZWFyZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWFyZXN0U3RlcFswXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWFyZXN0U3RlcFsxXSA9IHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWFyZXN0ID0gY3VycmVudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG5lYXJlc3RTdGVwO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIChyZS0pY2FsY3VsYXRlIGFsbCBuZWVkZWQgcG9zaXRpb25zIGFuZCBzaXplcyBmb3IgY3ljbGluZyB0aHJvdWdoIHNlY3Rpb25zXG4gICAgICAgIHZhciB1cGRhdGVFeHRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2aWV3ID0gbWFwLmdldFZpZXcoKTtcbiAgICAgICAgICAgIC8vIHNldCB0aGUgZXZlbnQgbGlzdGVuZXIgaGVyZSBpbiBjYXNlIHRoZSB2aWV3IGNoYW5nZWRcbiAgICAgICAgICAgIHZpZXcub24oJ2NoYW5nZTpyZXNvbHV0aW9uJywgaGFuZGxlVXNlclpvb20pO1xuICAgICAgICAgICAgdmFyIGltYWdlRXh0ZW50ID0gbWFwSW1hZ2UuZ2V0RXh0ZW50KCk7XG4gICAgICAgICAgICB2YXIgdmlld0V4dGVudCA9IHZpZXcuY2FsY3VsYXRlRXh0ZW50KG1hcC5nZXRTaXplKCkpO1xuXG4gICAgICAgICAgICBzdGVwU2l6ZVswXSA9IHZpZXdFeHRlbnRbMl0gLSB2aWV3RXh0ZW50WzBdO1xuICAgICAgICAgICAgc3RlcFNpemVbMV0gPSB2aWV3RXh0ZW50WzNdIC0gdmlld0V4dGVudFsxXTtcblxuICAgICAgICAgICAgLy8gc2V0IHRoZSBzdGFydCBjZW50ZXIgYmVmb3JlIGFkanVzdGluZyB0aGUgc3RlcCBzaXplIHdpdGggb3ZlcmxhcFxuICAgICAgICAgICAgc3RhcnRDZW50ZXJbMF0gPSBzdGVwU2l6ZVswXSAvIDI7XG4gICAgICAgICAgICBzdGFydENlbnRlclsxXSA9IHN0ZXBTaXplWzFdIC8gMjtcblxuICAgICAgICAgICAgLy8gTWF0aC5jZWlsKDQuMCkgLSAxIGlzIE5PVCBlcXVpdmFsZW50IHRvIE1hdGguZmxvb3IoNC4wKSFcbiAgICAgICAgICAgIC8vIC0gMSBiZWNhdXNlIHN0ZXBDb3VudCBiZWdpbnMgd2l0aCAwIHNvIGEgc3RlcENvdW50IG9mIDEgbWVhbnMgMiBzdGVwc1xuICAgICAgICAgICAgc3RlcENvdW50WzBdID0gTWF0aC5jZWlsKGltYWdlRXh0ZW50WzJdIC8gc3RlcFNpemVbMF0pIC0gMTtcbiAgICAgICAgICAgIHN0ZXBDb3VudFsxXSA9IE1hdGguY2VpbChpbWFnZUV4dGVudFszXSAvIHN0ZXBTaXplWzFdKSAtIDE7XG5cbiAgICAgICAgICAgIHZhciBvdmVybGFwO1xuICAgICAgICAgICAgaWYgKHN0ZXBDb3VudFswXSA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyBtYWtlIHRoZSBzZWN0aW9ucyBvdmVybGFwIGhvcml6b25hbGx5IHNvIHRoZXkgZXhhY3RseSBjb3ZlciB0aGUgaW1hZ2VcbiAgICAgICAgICAgICAgICBvdmVybGFwID0gKHN0ZXBTaXplWzBdICogKHN0ZXBDb3VudFswXSArIDEpKSAtIGltYWdlRXh0ZW50WzJdO1xuICAgICAgICAgICAgICAgIHN0ZXBTaXplWzBdIC09IG92ZXJsYXAgLyBzdGVwQ291bnRbMF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0ZXBTaXplWzBdID0gdmlld0V4dGVudFsyXTtcbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIHN0YXJ0IHBvaW50IHNvIHRoZSBpbWFnZSBpcyBjZW50ZXJlZCBob3Jpem9udGFsbHlcbiAgICAgICAgICAgICAgICBzdGFydENlbnRlclswXSA9IGltYWdlRXh0ZW50WzJdIC8gMjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN0ZXBDb3VudFsxXSA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyBtYWtlIHRoZSBzZWN0aW9ucyBvdmVybGFwIHZlcnRpY2FsbHkgc28gdGhleSBleGFjdGx5IGNvdmVyIHRoZSBpbWFnZVxuICAgICAgICAgICAgICAgIG92ZXJsYXAgPSAoc3RlcFNpemVbMV0gKiAoc3RlcENvdW50WzFdICsgMSkpIC0gaW1hZ2VFeHRlbnRbM107XG4gICAgICAgICAgICAgICAgc3RlcFNpemVbMV0gLT0gb3ZlcmxhcCAvIHN0ZXBDb3VudFsxXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RlcFNpemVbMV0gPSB2aWV3RXh0ZW50WzNdO1xuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgc3RhcnQgcG9pbnQgc28gdGhlIGltYWdlIGlzIGNlbnRlcmVkIHZlcnRpY2FsbHlcbiAgICAgICAgICAgICAgICBzdGFydENlbnRlclsxXSA9IGltYWdlRXh0ZW50WzNdIC8gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlVXNlclpvb20gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB1cGRhdGVFeHRlbnQoKTtcbiAgICAgICAgICAgIC8vIGFsbG93IHRoZSB1c2VyIHRvIHBhbiBidXQgZ28gYmFjayB0byB0aGUgcmVndWxhciBwcmV2L25leHQgc3RlcCB3aGVuIHRoZXlcbiAgICAgICAgICAgIC8vIHdhbnQgdG8gY29udGludWUgY3ljbGluZywgbm90IHRvIHRoZSBjdXJyZW50bHkgbmVhcmVzdCBzdGVwXG4gICAgICAgICAgICB2YXIgc3RlcCA9IGZpbmROZWFyZXN0U3RlcChnZXRTdGVwUG9zaXRpb24oY3VycmVudFN0ZXApKTtcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwWzBdID0gc3RlcFswXTtcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwWzFdID0gc3RlcFsxXTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlTWFwUmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdXBkYXRlRXh0ZW50KCk7XG4gICAgICAgICAgICBnb1RvU3RlcChmaW5kTmVhcmVzdFN0ZXAodmlldy5nZXRDZW50ZXIoKSkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBnb1RvU3RhcnRTdGVwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZ29Ub1N0ZXAoWzAsIDBdKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZ29Ub0VuZFN0ZXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBnb1RvU3RlcChzdGVwQ291bnQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBnZXRTdGVwUG9zaXRpb24gPSBmdW5jdGlvbiAoc3RlcCkge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBzdGVwWzBdICogc3RlcFNpemVbMF0gKyBzdGFydENlbnRlclswXSxcbiAgICAgICAgICAgICAgICBzdGVwWzFdICogc3RlcFNpemVbMV0gKyBzdGFydENlbnRlclsxXSxcbiAgICAgICAgICAgIF07XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGdvVG9TdGVwID0gZnVuY3Rpb24gKHN0ZXApIHtcbiAgICAgICAgICAgIC8vIGFuaW1hdGUgc3RlcHBpbmdcbiAgICAgICAgICAgIC8vIHZhciBwYW4gPSBvbC5hbmltYXRpb24ucGFuKHtcbiAgICAgICAgICAgIC8vICAgICBzb3VyY2U6IHZpZXcuZ2V0Q2VudGVyKCksXG4gICAgICAgICAgICAvLyAgICAgZHVyYXRpb246IDUwMFxuICAgICAgICAgICAgLy8gfSk7XG4gICAgICAgICAgICAvLyBtYXAuYmVmb3JlUmVuZGVyKHBhbik7XG4gICAgICAgICAgICBjdXJyZW50U3RlcFswXSA9IHN0ZXBbMF07XG4gICAgICAgICAgICBjdXJyZW50U3RlcFsxXSA9IHN0ZXBbMV07XG4gICAgICAgICAgICB2aWV3LnNldENlbnRlcihnZXRTdGVwUG9zaXRpb24oY3VycmVudFN0ZXApKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbmV4dFN0ZXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFN0ZXBbMF0gPCBzdGVwQ291bnRbMF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2N1cnJlbnRTdGVwWzBdICsgMSwgY3VycmVudFN0ZXBbMV1dO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gWzAsIGN1cnJlbnRTdGVwWzFdICsgMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHByZXZTdGVwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRTdGVwWzBdID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbY3VycmVudFN0ZXBbMF0gLSAxLCBjdXJyZW50U3RlcFsxXV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBbc3RlcENvdW50WzBdLCBjdXJyZW50U3RlcFsxXSAtIDFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBuZXh0U2VjdGlvbiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAobG9hZGluZyB8fCAhJHNjb3BlLmN5Y2xpbmcoKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoY3VycmVudFN0ZXBbMF0gPCBzdGVwQ291bnRbMF0gfHwgY3VycmVudFN0ZXBbMV0gPCBzdGVwQ291bnRbMV0pIHtcbiAgICAgICAgICAgICAgICBnb1RvU3RlcChuZXh0U3RlcCgpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLm5leHRJbWFnZSgpLnRoZW4odXBkYXRlRXh0ZW50KS50aGVuKGdvVG9TdGFydFN0ZXApO1xuICAgICAgICAgICAgICAgIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICAgIC8vIG9ubHkgYXBwbHkgaWYgdGhpcyB3YXMgY2FsbGVkIGJ5IHRoZSBrZXlib2FyZCBldmVudFxuICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY2FuY2VsIGFsbCBrZXlib2FyZCBldmVudHMgd2l0aCBsb3dlciBwcmlvcml0eVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBwcmV2U2VjdGlvbiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAobG9hZGluZyB8fCAhJHNjb3BlLmN5Y2xpbmcoKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoY3VycmVudFN0ZXBbMF0gPiAwIHx8IGN1cnJlbnRTdGVwWzFdID4gMCkge1xuICAgICAgICAgICAgICAgIGdvVG9TdGVwKHByZXZTdGVwKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUucHJldkltYWdlKCkudGhlbih1cGRhdGVFeHRlbnQpLnRoZW4oZ29Ub0VuZFN0ZXApO1xuICAgICAgICAgICAgICAgIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICAgIC8vIG9ubHkgYXBwbHkgaWYgdGhpcyB3YXMgY2FsbGVkIGJ5IHRoZSBrZXlib2FyZCBldmVudFxuICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY2FuY2VsIGFsbCBrZXlib2FyZCBldmVudHMgd2l0aCBsb3dlciBwcmlvcml0eVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHN0b3AgY3ljbGluZyB1c2luZyBhIGtleWJvYXJkIGV2ZW50XG4gICAgICAgIHZhciBzdG9wQ3ljbGluZyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAkc2NvcGUuc3RvcEN5Y2xpbmcoKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuY3ljbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2NvcGUuZ2V0Vm9sYXRpbGVTZXR0aW5ncygnY3ljbGUnKSA9PT0gY3ljbGluZ0tleTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuc3RhcnRDeWNsaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNldFZvbGF0aWxlU2V0dGluZ3MoJ2N5Y2xlJywgY3ljbGluZ0tleSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnN0b3BDeWNsaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnNldFZvbGF0aWxlU2V0dGluZ3MoJ2N5Y2xlJywgJycpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHRoZSBjeWNsZSBzZXR0aW5ncyBteSBiZSBzZXQgYnkgb3RoZXIgY29udHJvbGxlcnMsIHRvbywgc28gd2F0Y2ggaXRcbiAgICAgICAgLy8gaW5zdGVhZCBvZiB1c2luZyB0aGUgc3RhcnQvc3RvcCBmdW5jdGlvbnMgdG8gYWRkL3JlbW92ZSBldmVudHMgZXRjLlxuICAgICAgICAkc2NvcGUuJHdhdGNoKCd2b2xhdGlsZVNldHRpbmdzLmN5Y2xlJywgZnVuY3Rpb24gKGN5Y2xlLCBvbGRDeWNsZSkge1xuICAgICAgICAgICAgaWYgKGN5Y2xlID09PSBjeWNsaW5nS2V5KSB7XG4gICAgICAgICAgICAgICAgbWFwLm9uKCdjaGFuZ2U6c2l6ZScsIGhhbmRsZU1hcFJlc2l6ZSk7XG4gICAgICAgICAgICAgICAgdXBkYXRlRXh0ZW50KCk7XG4gICAgICAgICAgICAgICAgZ29Ub1N0YXJ0U3RlcCgpO1xuICAgICAgICAgICAgICAgIC8vIG92ZXJyaWRlIHByZXZpb3VzIGltYWdlIG9uIGFycm93IGxlZnRcbiAgICAgICAgICAgICAgICBrZXlib2FyZC5vbigzNywgcHJldlNlY3Rpb24sIDEwKTtcbiAgICAgICAgICAgICAgICAvLyBvdmVycmlkZSBuZXh0IGltYWdlIG9uIGFycm93IHJpZ2h0IGFuZCBzcGFjZVxuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDM5LCBuZXh0U2VjdGlvbiwgMTApO1xuICAgICAgICAgICAgICAgIGtleWJvYXJkLm9uKDMyLCBuZXh0U2VjdGlvbiwgMTApO1xuXG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub24oMjcsIHN0b3BDeWNsaW5nLCAxMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9sZEN5Y2xlID09PSBjeWNsaW5nS2V5KSB7XG4gICAgICAgICAgICAgICAgbWFwLnVuKCdjaGFuZ2U6c2l6ZScsIGhhbmRsZU1hcFJlc2l6ZSk7XG4gICAgICAgICAgICAgICAgdmlldy51bignY2hhbmdlOnJlc29sdXRpb24nLCBoYW5kbGVVc2VyWm9vbSk7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDM3LCBwcmV2U2VjdGlvbik7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDM5LCBuZXh0U2VjdGlvbik7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDMyLCBuZXh0U2VjdGlvbik7XG4gICAgICAgICAgICAgICAga2V5Ym9hcmQub2ZmKDI3LCBzdG9wQ3ljbGluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUucHJldlNlY3Rpb24gPSBwcmV2U2VjdGlvbjtcbiAgICAgICAgJHNjb3BlLm5leHRTZWN0aW9uID0gbmV4dFNlY3Rpb247XG4gICAgfVxuKTtcblxuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBjb250cm9sbGVyXG4gKiBAbmFtZSBTaWRlYmFyQ2F0ZWdvcnlGb2xkb3V0Q29udHJvbGxlclxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBDb250cm9sbGVyIGZvciB0aGUgc2lkZWJhciBjYXRlZ29yeSBmb2xkb3V0IGJ1dHRvblxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmNvbnRyb2xsZXIoJ1NpZGViYXJDYXRlZ29yeUZvbGRvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwga2V5Ym9hcmQpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICBrZXlib2FyZC5vbig5LCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZUZvbGRvdXQoJ2NhdGVnb3JpZXMnKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGNvbnRyb2xsZXJcbiAqIEBuYW1lIFNpZGViYXJDb250cm9sbGVyXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIENvbnRyb2xsZXIgZm9yIHRoZSBzaWRlYmFyXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuY29udHJvbGxlcignU2lkZWJhckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkcm9vdFNjb3BlKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgdmFyIGZvbGRvdXRTdG9yYWdlS2V5ID0gJ2RpYXMuYW5ub3RhdGlvbnMuc2lkZWJhci1mb2xkb3V0JztcblxuICAgICAgICAkc2NvcGUuZm9sZG91dCA9ICcnO1xuXG5cdFx0JHNjb3BlLm9wZW5Gb2xkb3V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2VbZm9sZG91dFN0b3JhZ2VLZXldID0gbmFtZTtcbiAgICAgICAgICAgICRzY29wZS5mb2xkb3V0ID0gbmFtZTtcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2lkZWJhci5mb2xkb3V0Lm9wZW4nLCBuYW1lKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNsb3NlRm9sZG91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShmb2xkb3V0U3RvcmFnZUtleSk7XG5cdFx0XHQkc2NvcGUuZm9sZG91dCA9ICcnO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzaWRlYmFyLmZvbGRvdXQuY2xvc2UnKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUZvbGRvdXQgPSBmdW5jdGlvbiAobmFtZSkge1xuXHRcdFx0aWYgKCRzY29wZS5mb2xkb3V0ID09PSBuYW1lKSB7XG5cdFx0XHRcdCRzY29wZS5jbG9zZUZvbGRvdXQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5vcGVuRm9sZG91dChuYW1lKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKCdzaWRlYmFyLmZvbGRvdXQuZG8tb3BlbicsIGZ1bmN0aW9uIChlLCBuYW1lKSB7XG4gICAgICAgICAgICAkc2NvcGUub3BlbkZvbGRvdXQobmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHRoZSBjdXJyZW50bHkgb3BlbmVkIHNpZGViYXItJ2V4dGVuc2lvbicgaXMgcmVtZW1iZXJlZCB0aHJvdWdoIGxvY2FsU3RvcmFnZVxuICAgICAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZVtmb2xkb3V0U3RvcmFnZUtleV0pIHtcbiAgICAgICAgICAgICRzY29wZS5vcGVuRm9sZG91dCh3aW5kb3cubG9jYWxTdG9yYWdlW2ZvbGRvdXRTdG9yYWdlS2V5XSk7XG4gICAgICAgIH1cblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBhbm5vdGF0aW9uTGlzdEl0ZW1cbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gQW4gYW5ub3RhdGlvbiBsaXN0IGl0ZW0uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZGlyZWN0aXZlKCdhbm5vdGF0aW9uTGlzdEl0ZW0nLCBmdW5jdGlvbiAobGFiZWxzKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0c2NvcGU6IHRydWUsXG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cdFx0XHRcdCRzY29wZS5zaGFwZUNsYXNzID0gJ2ljb24tJyArICRzY29wZS5hbm5vdGF0aW9uLnNoYXBlLnRvTG93ZXJDYXNlKCk7XG5cblx0XHRcdFx0JHNjb3BlLnNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuaXNTZWxlY3RlZCgkc2NvcGUuYW5ub3RhdGlvbi5pZCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmF0dGFjaExhYmVsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGxhYmVscy5hdHRhY2hUb0Fubm90YXRpb24oJHNjb3BlLmFubm90YXRpb24pO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5yZW1vdmVMYWJlbCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuXHRcdFx0XHRcdGxhYmVscy5yZW1vdmVGcm9tQW5ub3RhdGlvbigkc2NvcGUuYW5ub3RhdGlvbiwgbGFiZWwpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS5jYW5BdHRhY2hMYWJlbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLnNlbGVjdGVkKCkgJiYgbGFiZWxzLmhhc1NlbGVjdGVkKCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRMYWJlbCA9IGxhYmVscy5nZXRTZWxlY3RlZDtcblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudENvbmZpZGVuY2UgPSBsYWJlbHMuZ2V0Q3VycmVudENvbmZpZGVuY2U7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBsYWJlbENhdGVnb3J5SXRlbVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBBIGxhYmVsIGNhdGVnb3J5IGxpc3QgaXRlbS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5kaXJlY3RpdmUoJ2xhYmVsQ2F0ZWdvcnlJdGVtJywgZnVuY3Rpb24gKCRjb21waWxlLCAkdGltZW91dCwgJHRlbXBsYXRlQ2FjaGUpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQycsXG5cbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnbGFiZWwtaXRlbS5odG1sJyxcblxuICAgICAgICAgICAgc2NvcGU6IHRydWUsXG5cbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAvLyB3YWl0IGZvciB0aGlzIGVsZW1lbnQgdG8gYmUgcmVuZGVyZWQgdW50aWwgdGhlIGNoaWxkcmVuIGFyZVxuICAgICAgICAgICAgICAgIC8vIGFwcGVuZGVkLCBvdGhlcndpc2UgdGhlcmUgd291bGQgYmUgdG9vIG11Y2ggcmVjdXJzaW9uIGZvclxuICAgICAgICAgICAgICAgIC8vIGFuZ3VsYXJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IGFuZ3VsYXIuZWxlbWVudCgkdGVtcGxhdGVDYWNoZS5nZXQoJ2xhYmVsLXN1YnRyZWUuaHRtbCcpKTtcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKCRjb21waWxlKGNvbnRlbnQpKHNjb3BlKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgLy8gb3BlbiB0aGUgc3VidHJlZSBvZiB0aGlzIGl0ZW1cbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpdGVtIGhhcyBjaGlsZHJlblxuICAgICAgICAgICAgICAgICRzY29wZS5pc0V4cGFuZGFibGUgPSAkc2NvcGUudHJlZSAmJiAhISRzY29wZS50cmVlWyRzY29wZS5pdGVtLmlkXTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGl0ZW0gaXMgY3VycmVudGx5IHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzU2VsZWN0ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIC8vIGhhbmRsZSB0aGlzIGJ5IHRoZSBldmVudCByYXRoZXIgdGhhbiBhbiBvd24gY2xpY2sgaGFuZGxlciB0b1xuICAgICAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBjbGljayBhbmQgc2VhcmNoIGZpZWxkIGFjdGlvbnMgaW4gYSB1bmlmaWVkIHdheVxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NhdGVnb3JpZXMuc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZSwgY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgYW4gaXRlbSBpcyBzZWxlY3RlZCwgaXRzIHN1YnRyZWUgYW5kIGFsbCBwYXJlbnQgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIG9wZW5lZFxuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW0uaWQgPT09IGNhdGVnb3J5LmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgaGl0cyBhbGwgcGFyZW50IHNjb3Blcy9pdGVtc1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdjYXRlZ29yaWVzLm9wZW5QYXJlbnRzJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiBhIGNoaWxkIGl0ZW0gd2FzIHNlbGVjdGVkLCB0aGlzIGl0ZW0gc2hvdWxkIGJlIG9wZW5lZCwgdG9vXG4gICAgICAgICAgICAgICAgLy8gc28gdGhlIHNlbGVjdGVkIGl0ZW0gYmVjb21lcyB2aXNpYmxlIGluIHRoZSB0cmVlXG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignY2F0ZWdvcmllcy5vcGVuUGFyZW50cycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAvLyBzdG9wIHByb3BhZ2F0aW9uIGlmIHRoaXMgaXMgYSByb290IGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5pdGVtLnBhcmVudF9pZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgbGFiZWxJdGVtXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEFuIGFubm90YXRpb24gbGFiZWwgbGlzdCBpdGVtLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLmRpcmVjdGl2ZSgnbGFiZWxJdGVtJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0XHRcdFx0dmFyIGNvbmZpZGVuY2UgPSAkc2NvcGUuYW5ub3RhdGlvbkxhYmVsLmNvbmZpZGVuY2U7XG5cblx0XHRcdFx0aWYgKGNvbmZpZGVuY2UgPD0gMC4yNSkge1xuXHRcdFx0XHRcdCRzY29wZS5jbGFzcyA9ICdsYWJlbC1kYW5nZXInO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvbmZpZGVuY2UgPD0gMC41ICkge1xuXHRcdFx0XHRcdCRzY29wZS5jbGFzcyA9ICdsYWJlbC13YXJuaW5nJztcblx0XHRcdFx0fSBlbHNlIGlmIChjb25maWRlbmNlIDw9IDAuNzUgKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNsYXNzID0gJ2xhYmVsLXN1Y2Nlc3MnO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCRzY29wZS5jbGFzcyA9ICdsYWJlbC1wcmltYXJ5Jztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIGZhY3RvcnlcbiAqIEBuYW1lIGRlYm91bmNlXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIEEgZGVib3VuY2Ugc2VydmljZSB0byBwZXJmb3JtIGFuIGFjdGlvbiBvbmx5IHdoZW4gdGhpcyBmdW5jdGlvblxuICogd2Fzbid0IGNhbGxlZCBhZ2FpbiBpbiBhIHNob3J0IHBlcmlvZCBvZiB0aW1lLlxuICogc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEzMzIwMDE2LzE3OTY1MjNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5mYWN0b3J5KCdkZWJvdW5jZScsIGZ1bmN0aW9uICgkdGltZW91dCwgJHEpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuXHRcdHZhciB0aW1lb3V0cyA9IHt9O1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChmdW5jLCB3YWl0LCBpZCkge1xuXHRcdFx0Ly8gQ3JlYXRlIGEgZGVmZXJyZWQgb2JqZWN0IHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHdlIG5lZWQgdG9cblx0XHRcdC8vIGFjdHVhbGx5IGNhbGwgdGhlIGZ1bmNcblx0XHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0XHRyZXR1cm4gKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0XHRcdHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHRpbWVvdXRzW2lkXSA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncykpO1xuXHRcdFx0XHRcdGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aWYgKHRpbWVvdXRzW2lkXSkge1xuXHRcdFx0XHRcdCR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0c1tpZF0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRpbWVvdXRzW2lkXSA9ICR0aW1lb3V0KGxhdGVyLCB3YWl0KTtcblx0XHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG5cdFx0XHR9KSgpO1xuXHRcdH07XG5cdH1cbik7IiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBmYWN0b3J5XG4gKiBAbmFtZSBtYXBcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gV3JhcHBlciBmYWN0b3J5IGhhbmRsaW5nIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuZmFjdG9yeSgnbWFwJywgZnVuY3Rpb24gKCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIG1hcCA9IG5ldyBvbC5NYXAoe1xuXHRcdFx0dGFyZ2V0OiAnY2FudmFzJyxcbiAgICAgICAgICAgIHJlbmRlcmVyOiAnY2FudmFzJyxcblx0XHRcdGNvbnRyb2xzOiBbXG5cdFx0XHRcdG5ldyBvbC5jb250cm9sLlpvb20oKSxcblx0XHRcdFx0bmV3IG9sLmNvbnRyb2wuWm9vbVRvRXh0ZW50KCksXG5cdFx0XHRcdG5ldyBvbC5jb250cm9sLkZ1bGxTY3JlZW4oKVxuXHRcdFx0XSxcbiAgICAgICAgICAgIGludGVyYWN0aW9uczogb2wuaW50ZXJhY3Rpb24uZGVmYXVsdHMoe1xuICAgICAgICAgICAgICAgIGtleWJvYXJkOiBmYWxzZVxuICAgICAgICAgICAgfSlcblx0XHR9KTtcblxuXHRcdHJldHVybiBtYXA7XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGFubm90YXRpb25zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSB0aGUgYW5ub3RhdGlvbnMgdG8gbWFrZSB0aGVtIGF2YWlsYWJsZSBpbiBtdWx0aXBsZSBjb250cm9sbGVycy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdhbm5vdGF0aW9ucycsIGZ1bmN0aW9uIChBbm5vdGF0aW9uLCBzaGFwZXMsIG1zZykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG5cdFx0dmFyIGFubm90YXRpb25zO1xuICAgICAgICB2YXIgcHJvbWlzZTtcblxuXHRcdHZhciByZXNvbHZlU2hhcGVOYW1lID0gZnVuY3Rpb24gKGFubm90YXRpb24pIHtcblx0XHRcdGFubm90YXRpb24uc2hhcGUgPSBzaGFwZXMuZ2V0TmFtZShhbm5vdGF0aW9uLnNoYXBlX2lkKTtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR2YXIgYWRkQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHRhbm5vdGF0aW9ucy5wdXNoKGFubm90YXRpb24pO1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb247XG5cdFx0fTtcblxuXHRcdHRoaXMucXVlcnkgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRhbm5vdGF0aW9ucyA9IEFubm90YXRpb24ucXVlcnkocGFyYW1zKTtcbiAgICAgICAgICAgIHByb21pc2UgPSBhbm5vdGF0aW9ucy4kcHJvbWlzZTtcblx0XHRcdHByb21pc2UudGhlbihmdW5jdGlvbiAoYSkge1xuXHRcdFx0XHRhLmZvckVhY2gocmVzb2x2ZVNoYXBlTmFtZSk7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBhbm5vdGF0aW9ucztcblx0XHR9O1xuXG5cdFx0dGhpcy5hZGQgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdFx0XHRpZiAoIXBhcmFtcy5zaGFwZV9pZCAmJiBwYXJhbXMuc2hhcGUpIHtcblx0XHRcdFx0cGFyYW1zLnNoYXBlX2lkID0gc2hhcGVzLmdldElkKHBhcmFtcy5zaGFwZSk7XG5cdFx0XHR9XG5cdFx0XHR2YXIgYW5ub3RhdGlvbiA9IEFubm90YXRpb24uYWRkKHBhcmFtcyk7XG5cdFx0XHRhbm5vdGF0aW9uLiRwcm9taXNlXG5cdFx0XHQgICAgICAgICAgLnRoZW4ocmVzb2x2ZVNoYXBlTmFtZSlcblx0XHRcdCAgICAgICAgICAudGhlbihhZGRBbm5vdGF0aW9uKVxuXHRcdFx0ICAgICAgICAgIC5jYXRjaChtc2cucmVzcG9uc2VFcnJvcik7XG5cblx0XHRcdHJldHVybiBhbm5vdGF0aW9uO1xuXHRcdH07XG5cblx0XHR0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG5cdFx0XHQvLyB1c2UgaW5kZXggdG8gc2VlIGlmIHRoZSBhbm5vdGF0aW9uIGV4aXN0cyBpbiB0aGUgYW5ub3RhdGlvbnMgbGlzdFxuXHRcdFx0dmFyIGluZGV4ID0gYW5ub3RhdGlvbnMuaW5kZXhPZihhbm5vdGF0aW9uKTtcblx0XHRcdGlmIChpbmRleCA+IC0xKSB7XG5cdFx0XHRcdHJldHVybiBhbm5vdGF0aW9uLiRkZWxldGUoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdC8vIHVwZGF0ZSB0aGUgaW5kZXggc2luY2UgdGhlIGFubm90YXRpb25zIGxpc3QgbWF5IGhhdmUgYmVlblxuXHRcdFx0XHRcdC8vIG1vZGlmaWVkIGluIHRoZSBtZWFudGltZVxuXHRcdFx0XHRcdGluZGV4ID0gYW5ub3RhdGlvbnMuaW5kZXhPZihhbm5vdGF0aW9uKTtcblx0XHRcdFx0XHRhbm5vdGF0aW9ucy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHR9LCBtc2cucmVzcG9uc2VFcnJvcik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRoaXMuZm9yRWFjaCA9IGZ1bmN0aW9uIChmbikge1xuXHRcdFx0cmV0dXJuIGFubm90YXRpb25zLmZvckVhY2goZm4pO1xuXHRcdH07XG5cblx0XHR0aGlzLmN1cnJlbnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gYW5ub3RhdGlvbnM7XG5cdFx0fTtcblxuICAgICAgICB0aGlzLmdldFByb21pc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgaW1hZ2VzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIE1hbmFnZXMgKHByZS0pbG9hZGluZyBvZiB0aGUgaW1hZ2VzIHRvIGFubm90YXRlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ2ltYWdlcycsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBUcmFuc2VjdEltYWdlLCBVUkwsICRxLCBmaWx0ZXJTdWJzZXQsIFRSQU5TRUNUX0lEKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXHRcdC8vIGFycmF5IG9mIGFsbCBpbWFnZSBJRHMgb2YgdGhlIHRyYW5zZWN0XG5cdFx0dmFyIGltYWdlSWRzID0gW107XG5cdFx0Ly8gbWF4aW11bSBudW1iZXIgb2YgaW1hZ2VzIHRvIGhvbGQgaW4gYnVmZmVyXG5cdFx0dmFyIE1BWF9CVUZGRVJfU0laRSA9IDEwO1xuXHRcdC8vIGJ1ZmZlciBvZiBhbHJlYWR5IGxvYWRlZCBpbWFnZXNcblx0XHR2YXIgYnVmZmVyID0gW107XG5cblx0XHQvLyB0aGUgY3VycmVudGx5IHNob3duIGltYWdlXG5cdFx0dGhpcy5jdXJyZW50SW1hZ2UgPSB1bmRlZmluZWQ7XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBuZXh0IElEIG9mIHRoZSBzcGVjaWZpZWQgaW1hZ2Ugb3IgdGhlIG5leHQgSUQgb2YgdGhlXG5cdFx0ICogY3VycmVudCBpbWFnZSBpZiBubyBpbWFnZSB3YXMgc3BlY2lmaWVkLlxuXHRcdCAqL1xuXHRcdHZhciBuZXh0SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdHZhciBpbmRleCA9IGltYWdlSWRzLmluZGV4T2YoaWQpO1xuXHRcdFx0cmV0dXJuIGltYWdlSWRzWyhpbmRleCArIDEpICUgaW1hZ2VJZHMubGVuZ3RoXTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgcHJldmlvdXMgSUQgb2YgdGhlIHNwZWNpZmllZCBpbWFnZSBvciB0aGUgcHJldmlvdXMgSUQgb2Zcblx0XHQgKiB0aGUgY3VycmVudCBpbWFnZSBpZiBubyBpbWFnZSB3YXMgc3BlY2lmaWVkLlxuXHRcdCAqL1xuXHRcdHZhciBwcmV2SWQgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdGlkID0gaWQgfHwgX3RoaXMuY3VycmVudEltYWdlLl9pZDtcblx0XHRcdHZhciBpbmRleCA9IGltYWdlSWRzLmluZGV4T2YoaWQpO1xuXHRcdFx0dmFyIGxlbmd0aCA9IGltYWdlSWRzLmxlbmd0aDtcblx0XHRcdHJldHVybiBpbWFnZUlkc1soaW5kZXggLSAxICsgbGVuZ3RoKSAlIGxlbmd0aF07XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIHNwZWNpZmllZCBpbWFnZSBmcm9tIHRoZSBidWZmZXIgb3IgYHVuZGVmaW5lZGAgaWYgaXQgaXNcblx0XHQgKiBub3QgYnVmZmVyZWQuXG5cdFx0ICovXG5cdFx0dmFyIGdldEltYWdlID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRpZCA9IGlkIHx8IF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0XHRmb3IgKHZhciBpID0gYnVmZmVyLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdGlmIChidWZmZXJbaV0uX2lkID09IGlkKSByZXR1cm4gYnVmZmVyW2ldO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTZXRzIHRoZSBzcGVjaWZpZWQgaW1hZ2UgdG8gYXMgdGhlIGN1cnJlbnRseSBzaG93biBpbWFnZS5cblx0XHQgKi9cblx0XHR2YXIgc2hvdyA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0X3RoaXMuY3VycmVudEltYWdlID0gZ2V0SW1hZ2UoaWQpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBMb2FkcyB0aGUgc3BlY2lmaWVkIGltYWdlIGVpdGhlciBmcm9tIGJ1ZmZlciBvciBmcm9tIHRoZSBleHRlcm5hbFxuXHRcdCAqIHJlc291cmNlLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGdldHMgcmVzb2x2ZWQgd2hlbiB0aGUgaW1hZ2UgaXNcblx0XHQgKiBsb2FkZWQuXG5cdFx0ICovXG5cdFx0dmFyIGZldGNoSW1hZ2UgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cdFx0XHR2YXIgaW1nID0gZ2V0SW1hZ2UoaWQpO1xuXG5cdFx0XHRpZiAoaW1nKSB7XG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW1nKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuXHRcdFx0XHRpbWcuX2lkID0gaWQ7XG5cdFx0XHRcdGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0YnVmZmVyLnB1c2goaW1nKTtcblx0XHRcdFx0XHQvLyBjb250cm9sIG1heGltdW0gYnVmZmVyIHNpemVcblx0XHRcdFx0XHRpZiAoYnVmZmVyLmxlbmd0aCA+IE1BWF9CVUZGRVJfU0laRSkge1xuXHRcdFx0XHRcdFx0YnVmZmVyLnNoaWZ0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW1nKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAobXNnKSB7XG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KG1zZyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGltZy5zcmMgPSBVUkwgKyBcIi9hcGkvdjEvaW1hZ2VzL1wiICsgaWQgKyBcIi9maWxlXCI7XG5cdFx0XHR9XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnaW1hZ2UuZmV0Y2hpbmcnLCBpbWcpO1xuXG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSW5pdGlhbGl6ZXMgdGhlIHNlcnZpY2UgZm9yIGEgZ2l2ZW4gdHJhbnNlY3QuIFJldHVybnMgYSBwcm9taXNlIHRoYXRcblx0XHQgKiBpcyByZXNvbHZlZCwgd2hlbiB0aGUgc2VydmljZSBpcyBpbml0aWFsaXplZC5cblx0XHQgKi9cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpbWFnZUlkcyA9IFRyYW5zZWN0SW1hZ2UucXVlcnkoe3RyYW5zZWN0X2lkOiBUUkFOU0VDVF9JRH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBsb29rIGZvciBhIHNlcXVlbmNlIG9mIGltYWdlIElEcyBpbiBsb2NhbCBzdG9yYWdlLlxuICAgICAgICAgICAgICAgIC8vIHRoaXMgc2VxdWVuY2UgaXMgcHJvZHVjZXMgYnkgdGhlIHRyYW5zZWN0IGluZGV4IHBhZ2Ugd2hlbiB0aGUgaW1hZ2VzIGFyZVxuICAgICAgICAgICAgICAgIC8vIHNvcnRlZCBvciBmaWx0ZXJlZC4gd2Ugd2FudCB0byByZWZsZWN0IHRoZSBzYW1lIG9yZGVyaW5nIG9yIGZpbHRlcmluZyBoZXJlXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhlIGFubm90YXRvclxuICAgICAgICAgICAgICAgIHZhciBzdG9yZWRTZXF1ZW5jZSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2VbJ2RpYXMudHJhbnNlY3RzLicgKyBUUkFOU0VDVF9JRCArICcuaW1hZ2VzJ107XG4gICAgICAgICAgICAgICAgaWYgKHN0b3JlZFNlcXVlbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFNlcXVlbmNlID0gSlNPTi5wYXJzZShzdG9yZWRTZXF1ZW5jZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIHN1Y2ggYSBzdG9yZWQgc2VxdWVuY2UsIGZpbHRlciBvdXQgYW55IGltYWdlIElEcyB0aGF0IGRvIG5vdFxuICAgICAgICAgICAgICAgICAgICAvLyBiZWxvbmcgdG8gdGhlIHRyYW5zZWN0IChhbnkgbW9yZSksIHNpbmNlIHNvbWUgb2YgdGhlbSBtYXkgaGF2ZSBiZWVuIGRlbGV0ZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIG1lYW50aW1lXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclN1YnNldChzdG9yZWRTZXF1ZW5jZSwgaW1hZ2VJZHMpO1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIHByb21pc2UgaXMgbm90IHJlbW92ZWQgd2hlbiBvdmVyd3JpdGluZyBpbWFnZUlkcyBzaW5jZSB3ZVxuICAgICAgICAgICAgICAgICAgICAvLyBuZWVkIGl0IGxhdGVyIG9uLlxuICAgICAgICAgICAgICAgICAgICBzdG9yZWRTZXF1ZW5jZS4kcHJvbWlzZSA9IGltYWdlSWRzLiRwcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICBzdG9yZWRTZXF1ZW5jZS4kcmVzb2x2ZWQgPSBpbWFnZUlkcy4kcmVzb2x2ZWQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZW4gc2V0IHRoZSBzdG9yZWQgc2VxdWVuY2UgYXMgdGhlIHNlcXVlbmNlIG9mIGltYWdlIElEcyBpbnN0ZWFkIG9mIHNpbXBseVxuICAgICAgICAgICAgICAgICAgICAvLyBhbGwgSURzIGJlbG9uZ2luZyB0byB0aGUgdHJhbnNlY3RcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VJZHMgPSBzdG9yZWRTZXF1ZW5jZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuXHRcdFx0cmV0dXJuIGltYWdlSWRzLiRwcm9taXNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTaG93IHRoZSBpbWFnZSB3aXRoIHRoZSBzcGVjaWZpZWQgSUQuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXNcblx0XHQgKiByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpcyBzaG93bi5cblx0XHQgKi9cblx0XHR0aGlzLnNob3cgPSBmdW5jdGlvbiAoaWQpIHtcblx0XHRcdHZhciBwcm9taXNlID0gZmV0Y2hJbWFnZShpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0c2hvdyhpZCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gd2FpdCBmb3IgaW1hZ2VJZHMgdG8gYmUgbG9hZGVkXG5cdFx0XHRpbWFnZUlkcy4kcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0Ly8gcHJlLWxvYWQgcHJldmlvdXMgYW5kIG5leHQgaW1hZ2VzIGJ1dCBkb24ndCBkaXNwbGF5IHRoZW1cblx0XHRcdFx0ZmV0Y2hJbWFnZShuZXh0SWQoaWQpKTtcblx0XHRcdFx0ZmV0Y2hJbWFnZShwcmV2SWQoaWQpKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gcHJvbWlzZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2hvdyB0aGUgbmV4dCBpbWFnZS4gUmV0dXJucyBhIHByb21pc2UgdGhhdCBpc1xuXHRcdCAqIHJlc29sdmVkIHdoZW4gdGhlIGltYWdlIGlzIHNob3duLlxuXHRcdCAqL1xuXHRcdHRoaXMubmV4dCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfdGhpcy5zaG93KG5leHRJZCgpKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2hvdyB0aGUgcHJldmlvdXMgaW1hZ2UuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXNcblx0XHQgKiByZXNvbHZlZCB3aGVuIHRoZSBpbWFnZSBpcyBzaG93bi5cblx0XHQgKi9cblx0XHR0aGlzLnByZXYgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3RoaXMuc2hvdyhwcmV2SWQoKSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0Q3VycmVudElkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF90aGlzLmN1cnJlbnRJbWFnZS5faWQ7XG5cdFx0fTtcblx0fVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUga2V5Ym9hcmRcbiAqIEBtZW1iZXJPZiBkaWFzLmFubm90YXRpb25zXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSB0byByZWdpc3RlciBhbmQgbWFuYWdlIGtleXByZXNzIGV2ZW50cyB3aXRoIHByaW9yaXRpZXNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdrZXlib2FyZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gbWFwcyBrZXkgY29kZXMvY2hhcmFjdGVycyB0byBhcnJheXMgb2YgbGlzdGVuZXJzXG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB7fTtcblxuICAgICAgICB2YXIgZXhlY3V0ZUNhbGxiYWNrcyA9IGZ1bmN0aW9uIChsaXN0LCBlKSB7XG4gICAgICAgICAgICAvLyBnbyBmcm9tIGhpZ2hlc3QgcHJpb3JpdHkgZG93blxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IGxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAvLyBjYWxsYmFja3MgY2FuIGNhbmNlbCBmdXJ0aGVyIHByb3BhZ2F0aW9uXG4gICAgICAgICAgICAgICAgaWYgKGxpc3RbaV0uY2FsbGJhY2soZSkgPT09IGZhbHNlKSByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZUtleUV2ZW50cyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgY29kZSA9IGUua2V5Q29kZTtcbiAgICAgICAgICAgIHZhciBjaGFyYWN0ZXIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGUud2hpY2ggfHwgY29kZSkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjb2RlXSkge1xuICAgICAgICAgICAgICAgIGV4ZWN1dGVDYWxsYmFja3MobGlzdGVuZXJzW2NvZGVdLCBlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjaGFyYWN0ZXJdKSB7XG4gICAgICAgICAgICAgICAgZXhlY3V0ZUNhbGxiYWNrcyhsaXN0ZW5lcnNbY2hhcmFjdGVyXSwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleUV2ZW50cyk7XG5cbiAgICAgICAgLy8gcmVnaXN0ZXIgYSBuZXcgZXZlbnQgbGlzdGVuZXIgZm9yIHRoZSBrZXkgY29kZSBvciBjaGFyYWN0ZXIgd2l0aCBhbiBvcHRpb25hbCBwcmlvcml0eVxuICAgICAgICAvLyBsaXN0ZW5lcnMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgYXJlIGNhbGxlZCBmaXJzdCBhbmMgY2FuIHJldHVybiAnZmFsc2UnIHRvIHByZXZlbnQgdGhlXG4gICAgICAgIC8vIGxpc3RlbmVycyB3aXRoIGxvd2VyIHByaW9yaXR5IGZyb20gYmVpbmcgY2FsbGVkXG4gICAgICAgIHRoaXMub24gPSBmdW5jdGlvbiAoY2hhck9yQ29kZSwgY2FsbGJhY2ssIHByaW9yaXR5KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNoYXJPckNvZGUgPT09ICdzdHJpbmcnIHx8IGNoYXJPckNvZGUgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBjaGFyT3JDb2RlID0gY2hhck9yQ29kZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcmlvcml0eSA9IHByaW9yaXR5IHx8IDA7XG4gICAgICAgICAgICB2YXIgbGlzdGVuZXIgPSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrLFxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiBwcmlvcml0eVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjaGFyT3JDb2RlXSkge1xuICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gbGlzdGVuZXJzW2NoYXJPckNvZGVdO1xuICAgICAgICAgICAgICAgIHZhciBpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RbaV0ucHJpb3JpdHkgPj0gcHJpb3JpdHkpIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpID09PSBsaXN0Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnNwbGljZShpLCAwLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyc1tjaGFyT3JDb2RlXSA9IFtsaXN0ZW5lcl07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gdW5yZWdpc3RlciBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICB0aGlzLm9mZiA9IGZ1bmN0aW9uIChjaGFyT3JDb2RlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjaGFyT3JDb2RlID09PSAnc3RyaW5nJyB8fCBjaGFyT3JDb2RlIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgY2hhck9yQ29kZSA9IGNoYXJPckNvZGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tjaGFyT3JDb2RlXSkge1xuICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gbGlzdGVuZXJzW2NoYXJPckNvZGVdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdFtpXS5jYWxsYmFjayA9PT0gY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBkaWFzLmFubm90YXRpb25zXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgbGFiZWxzXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBmb3IgYW5ub3RhdGlvbiBsYWJlbHMgdG8gcHJvdmlkZSBzb21lIGNvbnZlbmllbmNlIGZ1bmN0aW9ucy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCdsYWJlbHMnLCBmdW5jdGlvbiAoQW5ub3RhdGlvbkxhYmVsLCBMYWJlbCwgUHJvamVjdExhYmVsLCBQcm9qZWN0LCBtc2csICRxLCBQUk9KRUNUX0lEUykge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRMYWJlbDtcbiAgICAgICAgdmFyIGN1cnJlbnRDb25maWRlbmNlID0gMS4wO1xuXG4gICAgICAgIHZhciBsYWJlbHMgPSB7fTtcblxuICAgICAgICAvLyB0aGlzIHByb21pc2UgaXMgcmVzb2x2ZWQgd2hlbiBhbGwgbGFiZWxzIHdlcmUgbG9hZGVkXG4gICAgICAgIHRoaXMucHJvbWlzZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5mZXRjaEZvckFubm90YXRpb24gPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuICAgICAgICAgICAgaWYgKCFhbm5vdGF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIGRvbid0IGZldGNoIHR3aWNlXG4gICAgICAgICAgICBpZiAoIWFubm90YXRpb24ubGFiZWxzKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMgPSBBbm5vdGF0aW9uTGFiZWwucXVlcnkoe1xuICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9uX2lkOiBhbm5vdGF0aW9uLmlkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhbm5vdGF0aW9uLmxhYmVscztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmF0dGFjaFRvQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSBBbm5vdGF0aW9uTGFiZWwuYXR0YWNoKHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uX2lkOiBhbm5vdGF0aW9uLmlkLFxuICAgICAgICAgICAgICAgIGxhYmVsX2lkOiBzZWxlY3RlZExhYmVsLmlkLFxuICAgICAgICAgICAgICAgIGNvbmZpZGVuY2U6IGN1cnJlbnRDb25maWRlbmNlXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGFiZWwuJHByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMucHVzaChsYWJlbCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGFiZWwuJHByb21pc2UuY2F0Y2gobXNnLnJlc3BvbnNlRXJyb3IpO1xuXG4gICAgICAgICAgICByZXR1cm4gbGFiZWw7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yZW1vdmVGcm9tQW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uLCBsYWJlbCkge1xuICAgICAgICAgICAgLy8gdXNlIGluZGV4IHRvIHNlZSBpZiB0aGUgbGFiZWwgZXhpc3RzIGZvciB0aGUgYW5ub3RhdGlvblxuICAgICAgICAgICAgdmFyIGluZGV4ID0gYW5ub3RhdGlvbi5sYWJlbHMuaW5kZXhPZihsYWJlbCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBbm5vdGF0aW9uTGFiZWwuZGVsZXRlKHtpZDogbGFiZWwuaWR9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaW5kZXggc2luY2UgdGhlIGxhYmVsIGxpc3QgbWF5IGhhdmUgYmVlbiBtb2RpZmllZFxuICAgICAgICAgICAgICAgICAgICAvLyBpbiB0aGUgbWVhbnRpbWVcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBhbm5vdGF0aW9uLmxhYmVscy5pbmRleE9mKGxhYmVsKTtcbiAgICAgICAgICAgICAgICAgICAgYW5ub3RhdGlvbi5sYWJlbHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB9LCBtc2cucmVzcG9uc2VFcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRUcmVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7fTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBudWxsO1xuICAgICAgICAgICAgdmFyIGJ1aWxkID0gZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGxhYmVsLnBhcmVudF9pZDtcbiAgICAgICAgICAgICAgICBpZiAodHJlZVtrZXldW3BhcmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZVtrZXldW3BhcmVudF0ucHVzaChsYWJlbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZVtrZXldW3BhcmVudF0gPSBbbGFiZWxdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucHJvbWlzZS50aGVuKGZ1bmN0aW9uIChsYWJlbHMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBsYWJlbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZVtrZXldID0ge307XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsc1trZXldLmZvckVhY2goYnVpbGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJlZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBsYWJlbHM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRTZWxlY3RlZCA9IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgc2VsZWN0ZWRMYWJlbCA9IGxhYmVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0U2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0ZWRMYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc1NlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhc2VsZWN0ZWRMYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNldEN1cnJlbnRDb25maWRlbmNlID0gZnVuY3Rpb24gKGNvbmZpZGVuY2UpIHtcbiAgICAgICAgICAgIGN1cnJlbnRDb25maWRlbmNlID0gY29uZmlkZW5jZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEN1cnJlbnRDb25maWRlbmNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRDb25maWRlbmNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGluaXRcbiAgICAgICAgKGZ1bmN0aW9uIChfdGhpcykge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIF90aGlzLnByb21pc2UgPSBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICAgICAgLy8gLTEgYmVjYXVzZSBvZiBnbG9iYWwgbGFiZWxzXG4gICAgICAgICAgICB2YXIgZmluaXNoZWQgPSAtMTtcblxuICAgICAgICAgICAgLy8gY2hlY2sgaWYgYWxsIGxhYmVscyBhcmUgdGhlcmUuIGlmIHllcywgcmVzb2x2ZVxuICAgICAgICAgICAgdmFyIG1heWJlUmVzb2x2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoKytmaW5pc2hlZCA9PT0gUFJPSkVDVF9JRFMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUobGFiZWxzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBsYWJlbHNbbnVsbF0gPSBMYWJlbC5xdWVyeShtYXliZVJlc29sdmUpO1xuXG4gICAgICAgICAgICBQUk9KRUNUX0lEUy5mb3JFYWNoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICAgIFByb2plY3QuZ2V0KHtpZDogaWR9LCBmdW5jdGlvbiAocHJvamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbHNbcHJvamVjdC5uYW1lXSA9IFByb2plY3RMYWJlbC5xdWVyeSh7cHJvamVjdF9pZDogaWR9LCBtYXliZVJlc29sdmUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKHRoaXMpO1xuICAgIH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG1hcEFubm90YXRpb25zXG4gKiBAbWVtYmVyT2YgZGlhcy5hbm5vdGF0aW9uc1xuICogQGRlc2NyaXB0aW9uIFdyYXBwZXIgc2VydmljZSBoYW5kbGluZyB0aGUgYW5ub3RhdGlvbnMgbGF5ZXIgb24gdGhlIE9wZW5MYXllcnMgbWFwXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdkaWFzLmFubm90YXRpb25zJykuc2VydmljZSgnbWFwQW5ub3RhdGlvbnMnLCBmdW5jdGlvbiAobWFwLCBpbWFnZXMsIGFubm90YXRpb25zLCBkZWJvdW5jZSwgc3R5bGVzLCAkaW50ZXJ2YWwsIGxhYmVscykge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXG4gICAgICAgIHZhciBhbm5vdGF0aW9uRmVhdHVyZXMgPSBuZXcgb2wuQ29sbGVjdGlvbigpO1xuICAgICAgICB2YXIgYW5ub3RhdGlvblNvdXJjZSA9IG5ldyBvbC5zb3VyY2UuVmVjdG9yKHtcbiAgICAgICAgICAgIGZlYXR1cmVzOiBhbm5vdGF0aW9uRmVhdHVyZXNcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBhbm5vdGF0aW9uTGF5ZXIgPSBuZXcgb2wubGF5ZXIuVmVjdG9yKHtcbiAgICAgICAgICAgIHNvdXJjZTogYW5ub3RhdGlvblNvdXJjZSxcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZXMuZmVhdHVyZXMsXG4gICAgICAgICAgICB6SW5kZXg6IDEwMFxuICAgICAgICB9KTtcblxuXHRcdC8vIHNlbGVjdCBpbnRlcmFjdGlvbiB3b3JraW5nIG9uIFwic2luZ2xlY2xpY2tcIlxuXHRcdHZhciBzZWxlY3QgPSBuZXcgb2wuaW50ZXJhY3Rpb24uU2VsZWN0KHtcblx0XHRcdHN0eWxlOiBzdHlsZXMuaGlnaGxpZ2h0LFxuICAgICAgICAgICAgbGF5ZXJzOiBbYW5ub3RhdGlvbkxheWVyXSxcbiAgICAgICAgICAgIC8vIGVuYWJsZSBzZWxlY3RpbmcgbXVsdGlwbGUgb3ZlcmxhcHBpbmcgZmVhdHVyZXMgYXQgb25jZVxuICAgICAgICAgICAgbXVsdGk6IHRydWVcblx0XHR9KTtcblxuXHRcdHZhciBzZWxlY3RlZEZlYXR1cmVzID0gc2VsZWN0LmdldEZlYXR1cmVzKCk7XG5cblx0XHR2YXIgbW9kaWZ5ID0gbmV3IG9sLmludGVyYWN0aW9uLk1vZGlmeSh7XG5cdFx0XHRmZWF0dXJlczogYW5ub3RhdGlvbkZlYXR1cmVzLFxuXHRcdFx0Ly8gdGhlIFNISUZUIGtleSBtdXN0IGJlIHByZXNzZWQgdG8gZGVsZXRlIHZlcnRpY2VzLCBzb1xuXHRcdFx0Ly8gdGhhdCBuZXcgdmVydGljZXMgY2FuIGJlIGRyYXduIGF0IHRoZSBzYW1lIHBvc2l0aW9uXG5cdFx0XHQvLyBvZiBleGlzdGluZyB2ZXJ0aWNlc1xuXHRcdFx0ZGVsZXRlQ29uZGl0aW9uOiBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRyZXR1cm4gb2wuZXZlbnRzLmNvbmRpdGlvbi5zaGlmdEtleU9ubHkoZXZlbnQpICYmIG9sLmV2ZW50cy5jb25kaXRpb24uc2luZ2xlQ2xpY2soZXZlbnQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG4gICAgICAgIG1vZGlmeS5zZXRBY3RpdmUoZmFsc2UpO1xuXG4gICAgICAgIHZhciB0cmFuc2xhdGUgPSBuZXcgb2wuaW50ZXJhY3Rpb24uVHJhbnNsYXRlKHtcbiAgICAgICAgICAgIGZlYXR1cmVzOiBzZWxlY3RlZEZlYXR1cmVzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyYW5zbGF0ZS5zZXRBY3RpdmUoZmFsc2UpO1xuXG5cdFx0Ly8gZHJhd2luZyBpbnRlcmFjdGlvblxuXHRcdHZhciBkcmF3O1xuICAgICAgICAvLyB0eXBlL3NoYXBlIG9mIHRoZSBkcmF3aW5nIGludGVyYWN0aW9uXG4gICAgICAgIHZhciBkcmF3aW5nVHlwZTtcblxuICAgICAgICAvLyBpbmRleCBvZiB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGFubm90YXRpb24gKGR1cmluZyBjeWNsaW5nIHRocm91Z2ggYW5ub3RhdGlvbnMpXG4gICAgICAgIC8vIGluIHRoZSBhbm5vdGF0aW9uRmVhdHVyZXMgY29sbGVjdGlvblxuICAgICAgICB2YXIgY3VycmVudEFubm90YXRpb25JbmRleCA9IDA7XG5cbiAgICAgICAgdmFyIGxhc3REcmF3bkZlYXR1cmU7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICAvLyBzY29wZSBvZiB0aGUgQ2FudmFzQ29udHJvbGxlclxuICAgICAgICB2YXIgX3Njb3BlO1xuXG4gICAgICAgIHZhciBzZWxlY3RBbmRTaG93QW5ub3RhdGlvbiA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uKSB7XG4gICAgICAgICAgICBfdGhpcy5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgaWYgKGFubm90YXRpb24pIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZEZlYXR1cmVzLnB1c2goYW5ub3RhdGlvbik7XG4gICAgICAgICAgICAgICAgbWFwLmdldFZpZXcoKS5maXQoYW5ub3RhdGlvbi5nZXRHZW9tZXRyeSgpLCBtYXAuZ2V0U2l6ZSgpLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IFs1MCwgNTAsIDUwLCA1MF1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBpbnZlcnQgYWxsIHkgY29vcmRpbmF0ZXNcbiAgICAgICAgdmFyIGNvbnZlcnRGcm9tT0xQb2ludCA9IGZ1bmN0aW9uIChwb2ludCwgaW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiAoaW5kZXggJSAyID09PSAxKSA/IChpbWFnZXMuY3VycmVudEltYWdlLmhlaWdodCAtIHBvaW50KSA6IHBvaW50O1xuICAgICAgICB9O1xuXG5cdFx0Ly8gYXNzZW1ibGVzIHRoZSBjb29yZGluYXRlIGFycmF5cyBkZXBlbmRpbmcgb24gdGhlIGdlb21ldHJ5IHR5cGVcblx0XHQvLyBzbyB0aGV5IGhhdmUgYSB1bmlmaWVkIGZvcm1hdFxuXHRcdHZhciBnZXRDb29yZGluYXRlcyA9IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xuICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzO1xuXHRcdFx0c3dpdGNoIChnZW9tZXRyeS5nZXRUeXBlKCkpIHtcblx0XHRcdFx0Y2FzZSAnQ2lyY2xlJzpcblx0XHRcdFx0XHQvLyByYWRpdXMgaXMgdGhlIHggdmFsdWUgb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY2lyY2xlXG5cdFx0XHRcdFx0Y29vcmRpbmF0ZXMgPSBbZ2VvbWV0cnkuZ2V0Q2VudGVyKCksIFtnZW9tZXRyeS5nZXRSYWRpdXMoKV1dO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0XHRcdFx0Y2FzZSAnUG9seWdvbic6XG5cdFx0XHRcdGNhc2UgJ1JlY3RhbmdsZSc6XG5cdFx0XHRcdFx0Y29vcmRpbmF0ZXMgPSBnZW9tZXRyeS5nZXRDb29yZGluYXRlcygpWzBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0XHRcdFx0Y2FzZSAnUG9pbnQnOlxuXHRcdFx0XHRcdGNvb3JkaW5hdGVzID0gW2dlb21ldHJ5LmdldENvb3JkaW5hdGVzKCldO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRjb29yZGluYXRlcyA9IGdlb21ldHJ5LmdldENvb3JkaW5hdGVzKCk7XG5cdFx0XHR9XG5cbiAgICAgICAgICAgIC8vIG1lcmdlIHRoZSBpbmRpdmlkdWFsIHBvaW50IGFycmF5cyB0byBhIHNpbmdsZSBhcnJheVxuICAgICAgICAgICAgLy8gcm91bmQgdGhlIGNvb3JkaW5hdGVzIHRvIGludGVnZXJzXG4gICAgICAgICAgICByZXR1cm4gW10uY29uY2F0LmFwcGx5KFtdLCBjb29yZGluYXRlcylcbiAgICAgICAgICAgICAgICAubWFwKE1hdGgucm91bmQpXG4gICAgICAgICAgICAgICAgLm1hcChjb252ZXJ0RnJvbU9MUG9pbnQpO1xuXHRcdH07XG5cblx0XHQvLyBzYXZlcyB0aGUgdXBkYXRlZCBnZW9tZXRyeSBvZiBhbiBhbm5vdGF0aW9uIGZlYXR1cmVcblx0XHR2YXIgaGFuZGxlR2VvbWV0cnlDaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIGZlYXR1cmUgPSBlLnRhcmdldDtcblx0XHRcdHZhciBzYXZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRmZWF0dXJlLmFubm90YXRpb24ucG9pbnRzID0gZ2V0Q29vcmRpbmF0ZXMoZmVhdHVyZS5nZXRHZW9tZXRyeSgpKTtcblx0XHRcdFx0ZmVhdHVyZS5hbm5vdGF0aW9uLiRzYXZlKCk7XG5cdFx0XHR9O1xuXHRcdFx0Ly8gdGhpcyBldmVudCBpcyByYXBpZGx5IGZpcmVkLCBzbyB3YWl0IHVudGlsIHRoZSBmaXJpbmcgc3RvcHNcblx0XHRcdC8vIGJlZm9yZSBzYXZpbmcgdGhlIGNoYW5nZXNcblx0XHRcdGRlYm91bmNlKHNhdmUsIDUwMCwgZmVhdHVyZS5hbm5vdGF0aW9uLmlkKTtcblx0XHR9O1xuXG5cdFx0dmFyIGNyZWF0ZUZlYXR1cmUgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbikge1xuXHRcdFx0dmFyIGdlb21ldHJ5O1xuXHRcdFx0dmFyIHBvaW50cyA9IGFubm90YXRpb24ucG9pbnRzO1xuICAgICAgICAgICAgdmFyIG5ld1BvaW50cyA9IFtdO1xuICAgICAgICAgICAgdmFyIGhlaWdodCA9IGltYWdlcy5jdXJyZW50SW1hZ2UuaGVpZ2h0O1xuICAgICAgICAgICAgLy8gY29udmVydCBwb2ludHMgYXJyYXkgdG8gT0wgcG9pbnRzXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICAgICAgICAgIG5ld1BvaW50cy5wdXNoKFtcbiAgICAgICAgICAgICAgICAgICAgcG9pbnRzW2ldLFxuICAgICAgICAgICAgICAgICAgICAvLyBpbnZlcnQgdGhlIHkgYXhpcyB0byBPTCBjb29yZGluYXRlc1xuICAgICAgICAgICAgICAgICAgICAvLyBjaXJjbGVzIGhhdmUgbm8gZm91cnRoIHBvaW50IHNvIHdlIHRha2UgMFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgLSAocG9pbnRzW2kgKyAxXSB8fCAwKVxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgfVxuXG5cdFx0XHRzd2l0Y2ggKGFubm90YXRpb24uc2hhcGUpIHtcblx0XHRcdFx0Y2FzZSAnUG9pbnQnOlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uUG9pbnQobmV3UG9pbnRzWzBdKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnUmVjdGFuZ2xlJzpcblx0XHRcdFx0XHRnZW9tZXRyeSA9IG5ldyBvbC5nZW9tLlJlY3RhbmdsZShbIG5ld1BvaW50cyBdKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnUG9seWdvbic6XG5cdFx0XHRcdFx0Ly8gZXhhbXBsZTogaHR0cHM6Ly9naXRodWIuY29tL29wZW5sYXllcnMvb2wzL2Jsb2IvbWFzdGVyL2V4YW1wbGVzL2dlb2pzb24uanMjTDEyNlxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uUG9seWdvbihbIG5ld1BvaW50cyBdKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnTGluZVN0cmluZyc6XG5cdFx0XHRcdFx0Z2VvbWV0cnkgPSBuZXcgb2wuZ2VvbS5MaW5lU3RyaW5nKG5ld1BvaW50cyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0NpcmNsZSc6XG5cdFx0XHRcdFx0Ly8gcmFkaXVzIGlzIHRoZSB4IHZhbHVlIG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGNpcmNsZVxuXHRcdFx0XHRcdGdlb21ldHJ5ID0gbmV3IG9sLmdlb20uQ2lyY2xlKG5ld1BvaW50c1swXSwgbmV3UG9pbnRzWzFdWzBdKTtcblx0XHRcdFx0XHRicmVhaztcbiAgICAgICAgICAgICAgICAvLyB1bnN1cHBvcnRlZCBzaGFwZXMgYXJlIGlnbm9yZWRcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdVbmtub3duIGFubm90YXRpb24gc2hhcGU6ICcgKyBhbm5vdGF0aW9uLnNoYXBlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgZmVhdHVyZSA9IG5ldyBvbC5GZWF0dXJlKHsgZ2VvbWV0cnk6IGdlb21ldHJ5IH0pO1xuICAgICAgICAgICAgZmVhdHVyZS5hbm5vdGF0aW9uID0gYW5ub3RhdGlvbjtcbiAgICAgICAgICAgIGlmIChhbm5vdGF0aW9uLmxhYmVscyAmJiBhbm5vdGF0aW9uLmxhYmVscy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgZmVhdHVyZS5jb2xvciA9IGFubm90YXRpb24ubGFiZWxzWzBdLmxhYmVsLmNvbG9yO1xuICAgICAgICAgICAgfVxuXHRcdFx0ZmVhdHVyZS5vbignY2hhbmdlJywgaGFuZGxlR2VvbWV0cnlDaGFuZ2UpO1xuICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5hZGRGZWF0dXJlKGZlYXR1cmUpO1xuXHRcdH07XG5cblx0XHR2YXIgcmVmcmVzaEFubm90YXRpb25zID0gZnVuY3Rpb24gKGUsIGltYWdlKSB7XG5cdFx0XHQvLyBjbGVhciBmZWF0dXJlcyBvZiBwcmV2aW91cyBpbWFnZVxuICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5jbGVhcigpO1xuXHRcdFx0X3RoaXMuY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIGxhc3REcmF3bkZlYXR1cmUgPSBudWxsO1xuXG5cdFx0XHRhbm5vdGF0aW9ucy5xdWVyeSh7aWQ6IGltYWdlLl9pZH0pLiRwcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRhbm5vdGF0aW9ucy5mb3JFYWNoKGNyZWF0ZUZlYXR1cmUpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHZhciBoYW5kbGVOZXdGZWF0dXJlID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciBnZW9tZXRyeSA9IGUuZmVhdHVyZS5nZXRHZW9tZXRyeSgpO1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gbGFiZWxzLmdldFNlbGVjdGVkKCk7XG5cbiAgICAgICAgICAgIGUuZmVhdHVyZS5jb2xvciA9IGxhYmVsLmNvbG9yO1xuXG5cdFx0XHRlLmZlYXR1cmUuYW5ub3RhdGlvbiA9IGFubm90YXRpb25zLmFkZCh7XG5cdFx0XHRcdGlkOiBpbWFnZXMuZ2V0Q3VycmVudElkKCksXG5cdFx0XHRcdHNoYXBlOiBnZW9tZXRyeS5nZXRUeXBlKCksXG5cdFx0XHRcdHBvaW50czogZ2V0Q29vcmRpbmF0ZXMoZ2VvbWV0cnkpLFxuICAgICAgICAgICAgICAgIGxhYmVsX2lkOiBsYWJlbC5pZCxcbiAgICAgICAgICAgICAgICBjb25maWRlbmNlOiBsYWJlbHMuZ2V0Q3VycmVudENvbmZpZGVuY2UoKVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIGlmIHRoZSBmZWF0dXJlIGNvdWxkbid0IGJlIHNhdmVkLCByZW1vdmUgaXQgYWdhaW5cblx0XHRcdGUuZmVhdHVyZS5hbm5vdGF0aW9uLiRwcm9taXNlLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLnJlbW92ZUZlYXR1cmUoZS5mZWF0dXJlKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRlLmZlYXR1cmUub24oJ2NoYW5nZScsIGhhbmRsZUdlb21ldHJ5Q2hhbmdlKTtcblxuICAgICAgICAgICAgbGFzdERyYXduRmVhdHVyZSA9IGUuZmVhdHVyZTtcblxuICAgICAgICAgICAgcmV0dXJuIGUuZmVhdHVyZS5hbm5vdGF0aW9uLiRwcm9taXNlO1xuXHRcdH07XG5cbiAgICAgICAgdmFyIHJlbW92ZUZlYXR1cmUgPSBmdW5jdGlvbiAoZmVhdHVyZSkge1xuICAgICAgICAgICAgaWYgKGZlYXR1cmUgPT09IGxhc3REcmF3bkZlYXR1cmUpIHtcbiAgICAgICAgICAgICAgICBsYXN0RHJhd25GZWF0dXJlID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYW5ub3RhdGlvbnMuZGVsZXRlKGZlYXR1cmUuYW5ub3RhdGlvbikudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvblNvdXJjZS5yZW1vdmVGZWF0dXJlKGZlYXR1cmUpO1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkRmVhdHVyZXMucmVtb3ZlKGZlYXR1cmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIF9zY29wZSA9IHNjb3BlO1xuICAgICAgICAgICAgbWFwLmFkZExheWVyKGFubm90YXRpb25MYXllcik7XG5cdFx0XHRtYXAuYWRkSW50ZXJhY3Rpb24oc2VsZWN0KTtcbiAgICAgICAgICAgIG1hcC5hZGRJbnRlcmFjdGlvbih0cmFuc2xhdGUpO1xuICAgICAgICAgICAgbWFwLmFkZEludGVyYWN0aW9uKG1vZGlmeSk7XG5cdFx0XHRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgcmVmcmVzaEFubm90YXRpb25zKTtcblxuICAgICAgICAgICAgdmFyIGFwcGx5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGlmIG5vdCBhbHJlYWR5IGRpZ2VzdGluZywgZGlnZXN0XG4gICAgICAgICAgICAgICAgaWYgKCFzY29wZS4kJHBoYXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHByb3BhZ2F0ZSBuZXcgc2VsZWN0aW9ucyB0aHJvdWdoIHRoZSBhbmd1bGFyIGFwcGxpY2F0aW9uXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cblx0XHRcdHNlbGVjdGVkRmVhdHVyZXMub24oJ2NoYW5nZTpsZW5ndGgnLCBhcHBseSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuc3RhcnREcmF3aW5nID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgICAgIHNlbGVjdC5zZXRBY3RpdmUoZmFsc2UpO1xuICAgICAgICAgICAgbW9kaWZ5LnNldEFjdGl2ZSh0cnVlKTtcbiAgICAgICAgICAgIF90aGlzLmZpbmlzaE1vdmluZygpO1xuICAgICAgICAgICAgLy8gYWxsb3cgb25seSBvbmUgZHJhdyBpbnRlcmFjdGlvbiBhdCBhIHRpbWVcbiAgICAgICAgICAgIG1hcC5yZW1vdmVJbnRlcmFjdGlvbihkcmF3KTtcblxuXHRcdFx0ZHJhd2luZ1R5cGUgPSB0eXBlIHx8ICdQb2ludCc7XG5cdFx0XHRkcmF3ID0gbmV3IG9sLmludGVyYWN0aW9uLkRyYXcoe1xuICAgICAgICAgICAgICAgIHNvdXJjZTogYW5ub3RhdGlvblNvdXJjZSxcblx0XHRcdFx0dHlwZTogZHJhd2luZ1R5cGUsXG5cdFx0XHRcdHN0eWxlOiBzdHlsZXMuZWRpdGluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihkcmF3KTtcblx0XHRcdGRyYXcub24oJ2RyYXdlbmQnLCBoYW5kbGVOZXdGZWF0dXJlKTtcbiAgICAgICAgICAgIGRyYXcub24oJ2RyYXdlbmQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIF9zY29wZS4kYnJvYWRjYXN0KCdhbm5vdGF0aW9ucy5kcmF3bicsIGUuZmVhdHVyZSk7XG4gICAgICAgICAgICB9KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5maW5pc2hEcmF3aW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0bWFwLnJlbW92ZUludGVyYWN0aW9uKGRyYXcpO1xuICAgICAgICAgICAgZHJhdy5zZXRBY3RpdmUoZmFsc2UpO1xuICAgICAgICAgICAgZHJhd2luZ1R5cGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBzZWxlY3Quc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICAgICAgbW9kaWZ5LnNldEFjdGl2ZShmYWxzZSk7XG5cdFx0XHQvLyBkb24ndCBzZWxlY3QgdGhlIGxhc3QgZHJhd24gcG9pbnRcblx0XHRcdF90aGlzLmNsZWFyU2VsZWN0aW9uKCk7XG5cdFx0fTtcblxuICAgICAgICB0aGlzLmlzRHJhd2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBkcmF3ICYmIGRyYXcuZ2V0QWN0aXZlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zdGFydE1vdmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5pc0RyYXdpbmcoKSkge1xuICAgICAgICAgICAgICAgIF90aGlzLmZpbmlzaERyYXdpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyYW5zbGF0ZS5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5maW5pc2hNb3ZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0cmFuc2xhdGUuc2V0QWN0aXZlKGZhbHNlKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmlzTW92aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRyYW5zbGF0ZS5nZXRBY3RpdmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc0RyYXduQW5ub3RhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIWxhc3REcmF3bkZlYXR1cmU7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZWxldGVMYXN0RHJhd25Bbm5vdGF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVtb3ZlRmVhdHVyZShsYXN0RHJhd25GZWF0dXJlKTtcbiAgICAgICAgfTtcblxuXHRcdHRoaXMuZGVsZXRlU2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmZvckVhY2gocmVtb3ZlRmVhdHVyZSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuc2VsZWN0ID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHR2YXIgZmVhdHVyZTtcblx0XHRcdGFubm90YXRpb25Tb3VyY2UuZm9yRWFjaEZlYXR1cmUoZnVuY3Rpb24gKGYpIHtcblx0XHRcdFx0aWYgKGYuYW5ub3RhdGlvbi5pZCA9PT0gaWQpIHtcblx0XHRcdFx0XHRmZWF0dXJlID0gZjtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyByZW1vdmUgc2VsZWN0aW9uIGlmIGZlYXR1cmUgd2FzIGFscmVhZHkgc2VsZWN0ZWQuIG90aGVyd2lzZSBzZWxlY3QuXG5cdFx0XHRpZiAoIXNlbGVjdGVkRmVhdHVyZXMucmVtb3ZlKGZlYXR1cmUpKSB7XG5cdFx0XHRcdHNlbGVjdGVkRmVhdHVyZXMucHVzaChmZWF0dXJlKTtcblx0XHRcdH1cblx0XHR9O1xuXG4gICAgICAgIHRoaXMuaGFzU2VsZWN0ZWRGZWF0dXJlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZEZlYXR1cmVzLmdldExlbmd0aCgpID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmaXRzIHRoZSB2aWV3IHRvIHRoZSBnaXZlbiBmZWF0dXJlXG4gICAgICAgIHRoaXMuZml0ID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9uU291cmNlLmZvckVhY2hGZWF0dXJlKGZ1bmN0aW9uIChmKSB7XG4gICAgICAgICAgICAgICAgaWYgKGYuYW5ub3RhdGlvbi5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYW5pbWF0ZSBmaXRcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZpZXcgPSBtYXAuZ2V0VmlldygpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFuID0gb2wuYW5pbWF0aW9uLnBhbih7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IHZpZXcuZ2V0Q2VudGVyKClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB6b29tID0gb2wuYW5pbWF0aW9uLnpvb20oe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x1dGlvbjogdmlldy5nZXRSZXNvbHV0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIG1hcC5iZWZvcmVSZW5kZXIocGFuLCB6b29tKTtcbiAgICAgICAgICAgICAgICAgICAgdmlldy5maXQoZi5nZXRHZW9tZXRyeSgpLCBtYXAuZ2V0U2l6ZSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuXHRcdHRoaXMuY2xlYXJTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxlY3RlZEZlYXR1cmVzLmNsZWFyKCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0U2VsZWN0ZWRGZWF0dXJlcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBzZWxlY3RlZEZlYXR1cmVzO1xuXHRcdH07XG5cbiAgICAgICAgdGhpcy5nZXRTZWxlY3RlZERyYXdpbmdUeXBlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRyYXdpbmdUeXBlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIG1hbnVhbGx5IGFkZCBhIG5ldyBmZWF0dXJlIChub3QgdGhyb3VnaCB0aGUgZHJhdyBpbnRlcmFjdGlvbilcbiAgICAgICAgdGhpcy5hZGRGZWF0dXJlID0gZnVuY3Rpb24gKGZlYXR1cmUpIHtcbiAgICAgICAgICAgIGFubm90YXRpb25Tb3VyY2UuYWRkRmVhdHVyZShmZWF0dXJlKTtcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVOZXdGZWF0dXJlKHtmZWF0dXJlOiBmZWF0dXJlfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZXRPcGFjaXR5ID0gZnVuY3Rpb24gKG9wYWNpdHkpIHtcbiAgICAgICAgICAgIGFubm90YXRpb25MYXllci5zZXRPcGFjaXR5KG9wYWNpdHkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuY3ljbGVOZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY3VycmVudEFubm90YXRpb25JbmRleCA9IChjdXJyZW50QW5ub3RhdGlvbkluZGV4ICsgMSkgJSBhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCk7XG4gICAgICAgICAgICBfdGhpcy5qdW1wVG9DdXJyZW50KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5oYXNOZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIChjdXJyZW50QW5ub3RhdGlvbkluZGV4ICsgMSkgPCBhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5jeWNsZVByZXZpb3VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gd2Ugd2FudCBubyBuZWdhdGl2ZSBpbmRleCBoZXJlXG4gICAgICAgICAgICBjdXJyZW50QW5ub3RhdGlvbkluZGV4ID0gKGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggKyBhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCkgLSAxKSAlIGFubm90YXRpb25GZWF0dXJlcy5nZXRMZW5ndGgoKTtcbiAgICAgICAgICAgIF90aGlzLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhhc1ByZXZpb3VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggPiAwO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuanVtcFRvQ3VycmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIG9ubHkganVtcCBvbmNlIHRoZSBhbm5vdGF0aW9ucyB3ZXJlIGxvYWRlZFxuICAgICAgICAgICAgYW5ub3RhdGlvbnMuZ2V0UHJvbWlzZSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGVjdEFuZFNob3dBbm5vdGF0aW9uKGFubm90YXRpb25GZWF0dXJlcy5pdGVtKGN1cnJlbnRBbm5vdGF0aW9uSW5kZXgpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuanVtcFRvRmlyc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjdXJyZW50QW5ub3RhdGlvbkluZGV4ID0gMDtcbiAgICAgICAgICAgIF90aGlzLmp1bXBUb0N1cnJlbnQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmp1bXBUb0xhc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9ucy5nZXRQcm9taXNlKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gd2FpdCBmb3IgdGhlIG5ldyBhbm5vdGF0aW9ucyB0byBiZSBsb2FkZWRcbiAgICAgICAgICAgICAgICBpZiAoYW5ub3RhdGlvbkZlYXR1cmVzLmdldExlbmd0aCgpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRBbm5vdGF0aW9uSW5kZXggPSBhbm5vdGF0aW9uRmVhdHVyZXMuZ2V0TGVuZ3RoKCkgLSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfdGhpcy5qdW1wVG9DdXJyZW50KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmbGlja2VyIHRoZSBoaWdobGlnaHRlZCBhbm5vdGF0aW9uIHRvIHNpZ25hbCBhbiBlcnJvclxuICAgICAgICB0aGlzLmZsaWNrZXIgPSBmdW5jdGlvbiAoY291bnQpIHtcbiAgICAgICAgICAgIHZhciBhbm5vdGF0aW9uID0gc2VsZWN0ZWRGZWF0dXJlcy5pdGVtKDApO1xuICAgICAgICAgICAgaWYgKCFhbm5vdGF0aW9uKSByZXR1cm47XG4gICAgICAgICAgICBjb3VudCA9IGNvdW50IHx8IDM7XG5cbiAgICAgICAgICAgIHZhciB0b2dnbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkRmVhdHVyZXMuZ2V0TGVuZ3RoKCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkRmVhdHVyZXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZEZlYXR1cmVzLnB1c2goYW5ub3RhdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIG51bWJlciBvZiByZXBlYXRzIG11c3QgYmUgZXZlbiwgb3RoZXJ3aXNlIHRoZSBsYXllciB3b3VsZCBzdGF5IG9udmlzaWJsZVxuICAgICAgICAgICAgJGludGVydmFsKHRvZ2dsZSwgMTAwLCBjb3VudCAqIDIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0Q3VycmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhbm5vdGF0aW9uRmVhdHVyZXMuaXRlbShjdXJyZW50QW5ub3RhdGlvbkluZGV4KS5hbm5vdGF0aW9uO1xuICAgICAgICB9O1xuXHR9XG4pO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBtYXBJbWFnZVxuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgaGFuZGxpbmcgdGhlIGltYWdlIGxheWVyIG9uIHRoZSBPcGVuTGF5ZXJzIG1hcFxuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ21hcEltYWdlJywgZnVuY3Rpb24gKG1hcCkge1xuXHRcdFwidXNlIHN0cmljdFwiO1xuXHRcdHZhciBleHRlbnQgPSBbMCwgMCwgMCwgMF07XG5cblx0XHR2YXIgcHJvamVjdGlvbiA9IG5ldyBvbC5wcm9qLlByb2plY3Rpb24oe1xuXHRcdFx0Y29kZTogJ2RpYXMtaW1hZ2UnLFxuXHRcdFx0dW5pdHM6ICdwaXhlbHMnLFxuXHRcdFx0ZXh0ZW50OiBleHRlbnRcblx0XHR9KTtcblxuXHRcdHZhciBpbWFnZUxheWVyID0gbmV3IG9sLmxheWVyLkltYWdlKCk7XG5cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoc2NvcGUpIHtcblx0XHRcdG1hcC5hZGRMYXllcihpbWFnZUxheWVyKTtcblxuXHRcdFx0Ly8gcmVmcmVzaCB0aGUgaW1hZ2Ugc291cmNlXG5cdFx0XHRzY29wZS4kb24oJ2ltYWdlLnNob3duJywgZnVuY3Rpb24gKGUsIGltYWdlKSB7XG5cdFx0XHRcdGV4dGVudFsyXSA9IGltYWdlLndpZHRoO1xuXHRcdFx0XHRleHRlbnRbM10gPSBpbWFnZS5oZWlnaHQ7XG5cblx0XHRcdFx0dmFyIHpvb20gPSBzY29wZS52aWV3cG9ydC56b29tO1xuXG5cdFx0XHRcdHZhciBjZW50ZXIgPSBzY29wZS52aWV3cG9ydC5jZW50ZXI7XG5cdFx0XHRcdC8vIHZpZXdwb3J0IGNlbnRlciBpcyBzdGlsbCB1bmluaXRpYWxpemVkXG5cdFx0XHRcdGlmIChjZW50ZXJbMF0gPT09IHVuZGVmaW5lZCAmJiBjZW50ZXJbMV0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGNlbnRlciA9IG9sLmV4dGVudC5nZXRDZW50ZXIoZXh0ZW50KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBpbWFnZVN0YXRpYyA9IG5ldyBvbC5zb3VyY2UuSW1hZ2VTdGF0aWMoe1xuXHRcdFx0XHRcdHVybDogaW1hZ2Uuc3JjLFxuXHRcdFx0XHRcdHByb2plY3Rpb246IHByb2plY3Rpb24sXG5cdFx0XHRcdFx0aW1hZ2VFeHRlbnQ6IGV4dGVudFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpbWFnZUxheWVyLnNldFNvdXJjZShpbWFnZVN0YXRpYyk7XG5cblx0XHRcdFx0bWFwLnNldFZpZXcobmV3IG9sLlZpZXcoe1xuXHRcdFx0XHRcdHByb2plY3Rpb246IHByb2plY3Rpb24sXG5cdFx0XHRcdFx0Y2VudGVyOiBjZW50ZXIsXG5cdFx0XHRcdFx0em9vbTogem9vbSxcblx0XHRcdFx0XHR6b29tRmFjdG9yOiAxLjUsXG5cdFx0XHRcdFx0Ly8gYWxsb3cgYSBtYXhpbXVtIG9mIDR4IG1hZ25pZmljYXRpb25cblx0XHRcdFx0XHRtaW5SZXNvbHV0aW9uOiAwLjI1LFxuXHRcdFx0XHRcdC8vIHJlc3RyaWN0IG1vdmVtZW50XG5cdFx0XHRcdFx0ZXh0ZW50OiBleHRlbnRcblx0XHRcdFx0fSkpO1xuXG5cdFx0XHRcdC8vIGlmIHpvb20gaXMgbm90IGluaXRpYWxpemVkLCBmaXQgdGhlIHZpZXcgdG8gdGhlIGltYWdlIGV4dGVudFxuXHRcdFx0XHRpZiAoem9vbSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0bWFwLmdldFZpZXcoKS5maXQoZXh0ZW50LCBtYXAuZ2V0U2l6ZSgpKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0RXh0ZW50ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGV4dGVudDtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRQcm9qZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHByb2plY3Rpb247XG5cdFx0fTtcblxuICAgICAgICB0aGlzLmdldExheWVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGltYWdlTGF5ZXI7XG4gICAgICAgIH07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIHN0eWxlc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIHNlcnZpY2UgZm9yIHRoZSBPcGVuTGF5ZXJzIHN0eWxlc1xuICovXG5hbmd1bGFyLm1vZHVsZSgnZGlhcy5hbm5vdGF0aW9ucycpLnNlcnZpY2UoJ3N0eWxlcycsIGZ1bmN0aW9uICgpIHtcblx0XHRcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuY29sb3JzID0ge1xuICAgICAgICAgICAgd2hpdGU6IFsyNTUsIDI1NSwgMjU1LCAxXSxcbiAgICAgICAgICAgIGJsdWU6IFswLCAxNTMsIDI1NSwgMV0sXG4gICAgICAgICAgICBvcmFuZ2U6ICcjZmY1ZTAwJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBkZWZhdWx0Q2lyY2xlUmFkaXVzID0gNjtcbiAgICAgICAgdmFyIGRlZmF1bHRTdHJva2VXaWR0aCA9IDM7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRTdHJva2VPdXRsaW5lID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICB3aWR0aDogNVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRTdHJva2VPdXRsaW5lID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMud2hpdGUsXG4gICAgICAgICAgICB3aWR0aDogNlxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZGVmYXVsdFN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLmJsdWUsXG4gICAgICAgICAgICB3aWR0aDogZGVmYXVsdFN0cm9rZVdpZHRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZFN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLm9yYW5nZSxcbiAgICAgICAgICAgIHdpZHRoOiBkZWZhdWx0U3Ryb2tlV2lkdGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRDaXJjbGVGaWxsID0gbmV3IG9sLnN0eWxlLkZpbGwoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLmJsdWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkQ2lyY2xlRmlsbCA9IG5ldyBvbC5zdHlsZS5GaWxsKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5vcmFuZ2VcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRDaXJjbGVTdHJva2UgPSBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy53aGl0ZSxcbiAgICAgICAgICAgIHdpZHRoOiAyXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZENpcmNsZVN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgd2lkdGg6IGRlZmF1bHRTdHJva2VXaWR0aFxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZWRpdGluZ0NpcmNsZVN0cm9rZSA9IG5ldyBvbC5zdHlsZS5TdHJva2Uoe1xuICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgd2lkdGg6IDIsXG4gICAgICAgICAgICBsaW5lRGFzaDogWzNdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBlZGl0aW5nU3Ryb2tlID0gbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMuYmx1ZSxcbiAgICAgICAgICAgIHdpZHRoOiBkZWZhdWx0U3Ryb2tlV2lkdGgsXG4gICAgICAgICAgICBsaW5lRGFzaDogWzVdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBkZWZhdWx0RmlsbCA9IG5ldyBvbC5zdHlsZS5GaWxsKHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9ycy5ibHVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZEZpbGwgPSBuZXcgb2wuc3R5bGUuRmlsbCh7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnMub3JhbmdlXG4gICAgICAgIH0pO1xuXG5cdFx0dGhpcy5mZWF0dXJlcyA9IGZ1bmN0aW9uIChmZWF0dXJlKSB7XG4gICAgICAgICAgICB2YXIgY29sb3IgPSBmZWF0dXJlLmNvbG9yID8gKCcjJyArIGZlYXR1cmUuY29sb3IpIDogX3RoaXMuY29sb3JzLmJsdWU7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIG5ldyBvbC5zdHlsZS5TdHlsZSh7XG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZTogZGVmYXVsdFN0cm9rZU91dGxpbmUsXG4gICAgICAgICAgICAgICAgICAgIGltYWdlOiBuZXcgb2wuc3R5bGUuQ2lyY2xlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhZGl1czogZGVmYXVsdENpcmNsZVJhZGl1cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGw6IG5ldyBvbC5zdHlsZS5GaWxsKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogY29sb3JcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOiBkZWZhdWx0Q2lyY2xlU3Ryb2tlXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IG9sLnN0eWxlLlN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBjb2xvcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAzXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIF07XG4gICAgICAgIH07XG5cblx0XHR0aGlzLmhpZ2hsaWdodCA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogc2VsZWN0ZWRTdHJva2VPdXRsaW5lLFxuXHRcdFx0XHRpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG5cdFx0XHRcdFx0cmFkaXVzOiBkZWZhdWx0Q2lyY2xlUmFkaXVzLFxuXHRcdFx0XHRcdGZpbGw6IHNlbGVjdGVkQ2lyY2xlRmlsbCxcblx0XHRcdFx0XHRzdHJva2U6IHNlbGVjdGVkQ2lyY2xlU3Ryb2tlXG5cdFx0XHRcdH0pLFxuICAgICAgICAgICAgICAgIHpJbmRleDogMjAwXG5cdFx0XHR9KSxcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogc2VsZWN0ZWRTdHJva2UsXG4gICAgICAgICAgICAgICAgekluZGV4OiAyMDBcblx0XHRcdH0pXG5cdFx0XTtcblxuXHRcdHRoaXMuZWRpdGluZyA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogZGVmYXVsdFN0cm9rZU91dGxpbmUsXG5cdFx0XHRcdGltYWdlOiBuZXcgb2wuc3R5bGUuQ2lyY2xlKHtcblx0XHRcdFx0XHRyYWRpdXM6IGRlZmF1bHRDaXJjbGVSYWRpdXMsXG5cdFx0XHRcdFx0ZmlsbDogZGVmYXVsdENpcmNsZUZpbGwsXG5cdFx0XHRcdFx0c3Ryb2tlOiBlZGl0aW5nQ2lyY2xlU3Ryb2tlXG5cdFx0XHRcdH0pXG5cdFx0XHR9KSxcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogZWRpdGluZ1N0cm9rZVxuXHRcdFx0fSlcblx0XHRdO1xuXG5cdFx0dGhpcy52aWV3cG9ydCA9IFtcblx0XHRcdG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHRcdHN0cm9rZTogZGVmYXVsdFN0cm9rZSxcblx0XHRcdH0pLFxuXHRcdFx0bmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHRcdFx0c3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzLndoaXRlLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogMVxuICAgICAgICAgICAgICAgIH0pXG5cdFx0XHR9KVxuXHRcdF07XG5cdH1cbik7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgZGlhcy5hbm5vdGF0aW9uc1xuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIHVybFBhcmFtc1xuICogQG1lbWJlck9mIGRpYXMuYW5ub3RhdGlvbnNcbiAqIEBkZXNjcmlwdGlvbiBUaGUgR0VUIHBhcmFtZXRlcnMgb2YgdGhlIHVybC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RpYXMuYW5ub3RhdGlvbnMnKS5zZXJ2aWNlKCd1cmxQYXJhbXMnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHR2YXIgc3RhdGUgPSB7fTtcblxuXHRcdC8vIHRyYW5zZm9ybXMgYSBVUkwgcGFyYW1ldGVyIHN0cmluZyBsaWtlICNhPTEmYj0yIHRvIGFuIG9iamVjdFxuXHRcdHZhciBkZWNvZGVTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBwYXJhbXMgPSBsb2NhdGlvbi5oYXNoLnJlcGxhY2UoJyMnLCAnJylcblx0XHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCcmJyk7XG5cblx0XHRcdHZhciBzdGF0ZSA9IHt9O1xuXG5cdFx0XHRwYXJhbXMuZm9yRWFjaChmdW5jdGlvbiAocGFyYW0pIHtcblx0XHRcdFx0Ly8gY2FwdHVyZSBrZXktdmFsdWUgcGFpcnNcblx0XHRcdFx0dmFyIGNhcHR1cmUgPSBwYXJhbS5tYXRjaCgvKC4rKVxcPSguKykvKTtcblx0XHRcdFx0aWYgKGNhcHR1cmUgJiYgY2FwdHVyZS5sZW5ndGggPT09IDMpIHtcblx0XHRcdFx0XHRzdGF0ZVtjYXB0dXJlWzFdXSA9IGRlY29kZVVSSUNvbXBvbmVudChjYXB0dXJlWzJdKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBzdGF0ZTtcblx0XHR9O1xuXG5cdFx0Ly8gdHJhbnNmb3JtcyBhbiBvYmplY3QgdG8gYSBVUkwgcGFyYW1ldGVyIHN0cmluZ1xuXHRcdHZhciBlbmNvZGVTdGF0ZSA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuXHRcdFx0dmFyIHBhcmFtcyA9ICcnO1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIHN0YXRlKSB7XG5cdFx0XHRcdHBhcmFtcyArPSBrZXkgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQoc3RhdGVba2V5XSkgKyAnJic7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcGFyYW1zLnN1YnN0cmluZygwLCBwYXJhbXMubGVuZ3RoIC0gMSk7XG5cdFx0fTtcblxuXHRcdHRoaXMucHVzaFN0YXRlID0gZnVuY3Rpb24gKHMpIHtcblx0XHRcdHN0YXRlLnNsdWcgPSBzO1xuXHRcdFx0aGlzdG9yeS5wdXNoU3RhdGUoc3RhdGUsICcnLCBzdGF0ZS5zbHVnICsgJyMnICsgZW5jb2RlU3RhdGUoc3RhdGUpKTtcblx0XHR9O1xuXG5cdFx0Ly8gc2V0cyBhIFVSTCBwYXJhbWV0ZXIgYW5kIHVwZGF0ZXMgdGhlIGhpc3Rvcnkgc3RhdGVcblx0XHR0aGlzLnNldCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcblx0XHRcdGZvciAodmFyIGtleSBpbiBwYXJhbXMpIHtcblx0XHRcdFx0c3RhdGVba2V5XSA9IHBhcmFtc1trZXldO1xuXHRcdFx0fVxuXHRcdFx0aGlzdG9yeS5yZXBsYWNlU3RhdGUoc3RhdGUsICcnLCBzdGF0ZS5zbHVnICsgJyMnICsgZW5jb2RlU3RhdGUoc3RhdGUpKTtcblx0XHR9O1xuXG5cdFx0Ly8gcmV0dXJucyBhIFVSTCBwYXJhbWV0ZXJcblx0XHR0aGlzLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcblx0XHRcdHJldHVybiBzdGF0ZVtrZXldO1xuXHRcdH07XG5cblx0XHRzdGF0ZSA9IGhpc3Rvcnkuc3RhdGU7XG5cblx0XHRpZiAoIXN0YXRlKSB7XG5cdFx0XHRzdGF0ZSA9IGRlY29kZVN0YXRlKCk7XG5cdFx0fVxuXHR9XG4pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
