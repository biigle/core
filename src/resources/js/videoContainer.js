biigle.$viewModel('video-container', function (element) {
    var VIDEO_ID = biigle.$require('videos.id');
    var VIDEO_SRC = biigle.$require('videos.src');
    var SHAPES = biigle.$require('videos.shapes');
    var ANNOTATION_API = biigle.$require('videos.api.videoAnnotations');
    var MSG = biigle.$require('messages.store');

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
        },
        data: {
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
        },
        computed: {
            shapes: function () {
                var map = {};
                Object.keys(SHAPES).forEach(function (id) {
                    map[SHAPES[id]] = id;
                });

                return map;
            },
            selectedAnnotations: function () {
                return this.annotations.filter(function (annotation) {
                    return annotation.selected !== false;
                });
            },
            settingsStore: function () {
                return biigle.$require('videos.settings');
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
                annotation.$on('tracking-failed', this.handleFailedTracking);
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
                var index = event.annotation.frames.indexOf(event.time);

                if (index !== -1 && event.annotation.frames.length > 1) {
                    // Delete only the keyframe of the annotation.
                    event.annotation.frames.splice(index, 1);
                    event.annotation.points.splice(index, 1);

                    ANNOTATION_API.update({id: event.annotation.id}, {
                            frames: event.annotation.frames,
                            points: event.annotation.points,
                        })
                        .catch(MSG.handleResponseError);
                } else {
                    // Delete the whole annotation.
                    ANNOTATION_API.delete({id: event.annotation.id})
                        .then(this.deletedAnnotation(event.annotation))
                        .catch(MSG.handleResponseError);
                }
            },
            deletedAnnotation: function (annotation) {
                return (function () {
                    var index = this.annotations.indexOf(annotation);
                    if (index !== -1) {
                        this.annotations.splice(index, 1);
                    }
                }).bind(this);
            },
            handleVideoSeeked: function () {
                this.seeking = false;
            },
            modifyAnnotations: function (event) {
                event.forEach(this.modifyAnnotation);
            },
            modifyAnnotation: function (event) {
                var index = event.annotation.frames.indexOf(event.time);
                if (index !== -1) {
                    // Use splice so Vue can pick up the change.
                    event.annotation.points.splice(index, 1, event.points);
                } else {
                    for (var i = event.annotation.frames.length - 1; i >= 0; i--) {
                        if (event.annotation.frames[i] <= event.time) {
                            break;
                        }
                    }

                    event.annotation.frames.splice(i + 1, 0, event.time);
                    event.annotation.points.splice(i + 1, 0, event.points);
                }

                ANNOTATION_API.update({id: event.annotation.id}, {
                        frames: event.annotation.frames,
                        points: event.annotation.points,
                    })
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
            handleFailedTracking: function (annotation) {
                var index = this.annotations.indexOf(annotation);
                if (index !== -1) {
                    this.annotations.splice(index, 1);
                }
            },
            splitAnnotation: function (annotation, time) {
                ANNOTATION_API.split({id: annotation.id}, {time: time})
                    .then(this.updateSplitAnnotation, MSG.handleResponseError);
            },
            updateSplitAnnotation: function (response) {
                var oldAnnotation = response.body[0];
                for (var i = this.annotations.length - 1; i >= 0; i--) {
                    if (this.annotations[i].id === oldAnnotation.id) {
                        this.annotations[i].frames = oldAnnotation.frames;
                        this.annotations[i].points = oldAnnotation.points;
                    }
                }

                this.annotations.push(this.prepareAnnotation(response.body[1]));
            },
        },
        watch: {
            'settings.playbackRate': function (rate) {
                this.video.playbackRate = rate;
            },
        },
        created: function () {
            this.video.muted = true;
            this.video.addEventListener('error', function () {
                MSG.danger('Error while loading video file.');
            });
            this.video.addEventListener('seeked', this.handleVideoSeeked);
            this.startLoading();
            var self = this;
            var videoPromise = new Vue.Promise(function (resolve, reject) {
                self.video.addEventListener('loadeddata', resolve);
                self.video.addEventListener('error', reject);
            });
            var annotationPromise = ANNOTATION_API.query({id: VIDEO_ID});
            annotationPromise.then(this.setAnnotations, MSG.handleResponseError);

            Vue.Promise.all([videoPromise, annotationPromise]).then(this.finishLoading);

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
