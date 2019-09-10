biigle.$viewModel('video-container', function (element) {
    var VIDEO_ID = biigle.$require('videos.id');
    var VIDEO_SRC = biigle.$require('videos.src');
    var SHAPES = biigle.$require('videos.shapes');
    var ANNOTATION_API = biigle.$require('videos.api.videoAnnotations');
    var MSG = biigle.$require('messages.store');
    var URL_PARAMS = biigle.$require('urlParams');

    var Annotation = biigle.$require('videos.models.Annotation');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        components: {
            videoScreen: biigle.$require('videos.components.videoScreen'),
            videoTimeline: biigle.$require('videos.components.videoTimeline'),
            sidebar: biigle.$require('core.components.sidebar'),
            sidebarTab: biigle.$require('core.components.sidebarTab'),
            labelTrees: biigle.$require('labelTrees.components.labelTrees'),
            settingsTab: biigle.$require('videos.components.settingsTab'),
            annotationsTab: biigle.$require('videos.components.viaAnnotationsTab'),
        },
        data: {
            canEdit: biigle.$require('videos.isEditor'),
            video: document.createElement('video'),
            labelTrees: biigle.$require('videos.labelTrees'),
            selectedLabel: null,
            bookmarks: [],
            annotations: [],
            seeking: false,
            settings: {
                annotationOpacity: 1,
                showMinimap: true,
                autoplayDraw: 0,
                showLabelTooltip: false,
                showMousePosition: false,
                playbackRate: 1.0,
            },
            openTab: '',
            urlParams: {
                x: 0,
                y: 0,
                r: 0,
                t: 0,
            },
            initialCurrentTime: 0,
            initialMapCenter: [0, 0],
            initialMapResolution: 0,
            annotationFilters: [],
            activeAnnotationFilter: null,
        },
        computed: {
            shapes: function () {
                var map = {};
                Object.keys(SHAPES).forEach(function (id) {
                    map[SHAPES[id]] = parseInt(id);
                });

                return map;
            },
            selectedAnnotations: function () {
                return this.filteredAnnotations.filter(function (annotation) {
                    return annotation.isSelected;
                });
            },
            settingsStore: function () {
                return biigle.$require('videos.settings');
            },
            filteredAnnotations: function () {
                if (this.activeAnnotationFilter) {
                    return this.activeAnnotationFilter.filter(this.annotations);
                }

                return this.annotations;
            },
            hasActiveAnnotationFilter: function () {
                return this.activeAnnotationFilter !== null;
            },
        },
        methods: {
            prepareAnnotation: function (annotation) {
                return new Annotation({data: annotation});
            },
            setAnnotations: function (response) {
                this.annotations = response.body.map(this.prepareAnnotation);
            },
            addCreatedAnnotation: function (response) {
                var annotation = this.prepareAnnotation(response.body);
                annotation.$on('tracking-failed', this.removeAnnotation);
                this.annotations.push(annotation);

                return annotation;
            },
            seek: function (time) {
                if (!this.seeking && this.video.currentTime !== time) {
                    this.seeking = true;
                    this.video.currentTime = time;
                }
            },
            selectAnnotation: function (annotation, time, shift) {
                if (shift) {
                    this.selectAnnotations([annotation], [], time);
                } else {
                    this.selectAnnotations([annotation], this.selectedAnnotations, time);
                }
            },
            selectAnnotations: function (selected, deselected, time) {
                // Deselect first because previously selected annotations might be
                // selected again.
                deselected.forEach(function (annotation) {
                    annotation.selected = false;
                });

                var hadSelected = this.selectedAnnotations.length > 0;

                selected.forEach(function (annotation) {
                    annotation.selected = time;
                });

                if (time !== undefined && hadSelected === false) {
                    this.seek(time);
                }
            },
            deselectAnnotation: function (annotation) {
                if (annotation) {
                    annotation.selected = false;
                } else {
                    this.selectedAnnotations.forEach(function (annotation) {
                        annotation.selected = false;
                    });
                }
            },
            createBookmark: function (time) {
                var hasBookmark = this.bookmarks.reduce(function (has, b) {
                    return has || b.time === time;
                }, false);

                if (!hasBookmark) {
                    this.bookmarks.push({time: time});
                }
            },
            createAnnotation: function (pendingAnnotation) {
                var annotation = Object.assign(pendingAnnotation, {
                    shape_id: this.shapes[pendingAnnotation.shape],
                    label_id: this.selectedLabel ? this.selectedLabel.id : 0,
                });
                delete annotation.shape;

                return ANNOTATION_API.save({id: VIDEO_ID}, annotation)
                    .then(this.addCreatedAnnotation, MSG.handleResponseError);
            },
            trackAnnotation: function (pendingAnnotation) {
                pendingAnnotation.track = true;
                this.createAnnotation(pendingAnnotation)
                    .then(this.startPollTrackingAnnotation);
            },
            startPollTrackingAnnotation: function (annotation) {
                if (annotation) {
                    annotation.startPollTracking();
                }
            },
            handleSelectedLabel: function (label) {
                this.selectedLabel = label;
            },
            handleDeselectedLabel: function () {
                this.selectedLabel = null;
            },
            deleteAnnotationsOrKeyframes: function (event) {
                if (confirm('Are you sure that you want to delete all selected annotations/keyframes?')) {
                    event.forEach(this.deleteAnnotationOrKeyframe);
                }
            },
            deleteAnnotationOrKeyframe: function (event) {
                var annotation = event.annotation;
                if (annotation.isClip && annotation.hasKeyframe(event.time)) {
                    annotation.deleteKeyframe(event.time)
                        .catch(MSG.handleResponseError);
                } else {
                    annotation.delete()
                        .then(this.deletedAnnotation(annotation))
                        .catch(MSG.handleResponseError);
                }
            },
            deletedAnnotation: function (annotation) {
                return (function () {
                    this.removeAnnotation(annotation);
                }).bind(this);
            },
            handleVideoSeeked: function () {
                this.seeking = false;
            },
            modifyAnnotations: function (event) {
                event.forEach(this.modifyAnnotation);
            },
            modifyAnnotation: function (event) {
                event.annotation.modify(event.time, event.points)
                    .catch(MSG.handleResponseError);
            },
            handleUpdatedSettings: function (key, value) {
                this.settings[key] = value;
            },
            handleOpenedTab: function (name) {
                this.settingsStore.set('openTab', name);
            },
            handleClosedTab: function () {
                this.settingsStore.delete('openTab');
            },
            removeAnnotation: function (annotation) {
                var index = this.annotations.indexOf(annotation);
                if (index !== -1) {
                    this.annotations.splice(index, 1);
                }
            },
            splitAnnotation: function (annotation, time) {
                annotation.split(time)
                    .then(this.addCreatedAnnotation, MSG.handleResponseError);
            },
            linkAnnotations: function (annotations) {
                annotations[0].link(annotations[1])
                    .then(this.deletedAnnotation(annotations[1]))
                    .catch(MSG.handleResponseError);
            },
            updateMapUrlParams: function (center, resolution) {
                this.urlParams.x = Math.round(center[0]);
                this.urlParams.y = Math.round(center[1]);
                this.urlParams.r = Math.round(resolution * 100);
            },
            updateVideoUrlParams: function () {
                this.urlParams.t = Math.round(this.video.currentTime * 100);
            },
            restoreUrlParams: function () {
                if (URL_PARAMS.get('r') !== undefined) {
                    this.initialMapResolution = parseInt(URL_PARAMS.get('r'), 10) / 100;
                }

                if (URL_PARAMS.get('x') !== undefined && URL_PARAMS.get('y') !== undefined) {
                    this.initialMapCenter = [
                        parseInt(URL_PARAMS.get('x'), 10),
                        parseInt(URL_PARAMS.get('y'), 10),
                    ];
                }

                if (URL_PARAMS.get('t') !== undefined) {
                    this.initialCurrentTime = parseInt(URL_PARAMS.get('t'), 10) / 100;
                }
            },
            maybeInitCurrentTime: function () {
                if (this.initialCurrentTime === 0) {
                    return Vue.Promise.resolve();
                }

                var promise = new Vue.Promise((function (resolve, reject) {
                    this.video.addEventListener('seeked', resolve);
                    this.video.addEventListener('error', reject);
                }).bind(this));
                this.seek(this.initialCurrentTime);

                return promise;
            },
            detachAnnotationLabel: function (annotation, annotationLabel) {
                if (annotation.labels.length > 1) {
                    annotation.detachAnnotationLabel(annotationLabel)
                        .catch(MSG.handleResponseError);
                } else if (confirm('Detaching the last label of an annotation deletes the whole annotation. Do you want to delete the annotation?')) {
                    annotation.delete()
                        .then(this.deletedAnnotation(annotation))
                        .catch(MSG.handleResponseError);
                }
            },
            attachAnnotationLabel: function (annotation, label) {
                annotation.attachAnnotationLabel(label)
                    .catch(MSG.handleResponseError);
            },
            initAnnotationFilters: function () {
                var LabelFilter = biigle.$require('annotations.models.LabelAnnotationFilter');
                var UserFilter = biigle.$require('annotations.models.UserAnnotationFilter');
                var ShapeFilter = biigle.$require('annotations.models.ShapeAnnotationFilter');

                this.annotationFilters = [
                    new LabelFilter({data: {annotations: this.annotations}}),
                    new UserFilter({data: {annotations: this.annotations}}),
                    new ShapeFilter({data: {shapes: SHAPES}}),
                ];
            },
            setActiveAnnotationFilter: function (filter) {
                this.activeAnnotationFilter = filter;
            },
            resetAnnotationFilter: function () {
                if (this.activeAnnotationFilter) {
                    this.activeAnnotationFilter.reset();
                }
                this.activeAnnotationFilter = null;
            },
            handleRequiresSelectedLabel: function () {
                MSG.info('Please select a label first.');
                this.$refs.sidebar.$emit('open', 'labels');
            },
        },
        watch: {
            'settings.playbackRate': function (rate) {
                this.video.playbackRate = rate;
            },
            urlParams: {
                deep: true,
                handler:function (params) {
                    URL_PARAMS.set(params);
                },
            },
        },
        created: function () {
            this.restoreUrlParams();
            this.video.muted = true;
            this.video.addEventListener('error', function () {
                MSG.danger('Error while loading video file.');
            });
            this.video.addEventListener('seeked', this.handleVideoSeeked);
            this.video.addEventListener('pause', this.updateVideoUrlParams);
            this.video.addEventListener('seeked', this.updateVideoUrlParams);
            this.startLoading();
            var self = this;
            var videoPromise = new Vue.Promise(function (resolve, reject) {
                self.video.addEventListener('canplay', resolve);
                self.video.addEventListener('error', reject);
            });
            var annotationPromise = ANNOTATION_API.query({id: VIDEO_ID});
            annotationPromise.then(this.setAnnotations, MSG.handleResponseError)
                .then(this.initAnnotationFilters);

            Vue.Promise.all([videoPromise, annotationPromise])
                .then(this.maybeInitCurrentTime)
                .then(this.finishLoading);

            if (this.settingsStore.has('openTab')) {
                this.openTab = this.settingsStore.get('openTab');
            }
        },
        mounted: function () {
            // Wait for the sub-components to register their event listeners before
            // loading the video.
            this.video.src = VIDEO_SRC;
        },
    });
});
