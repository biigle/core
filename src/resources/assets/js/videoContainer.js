import VideoAnnotationApi from './api/videoAnnotations';
import {handleErrorResponse} from './import';
import {Messages} from './import';
import {LoaderMixin} from './import';
import {UrlParams} from './import';
import Annotation from './models/Annotation';
import VideoScreen from './components/videoScreen';

export default {
    mixins: [LoaderMixin],
    components: {
        videoScreen: VideoScreen,
        videoTimeline: biigle.$require('videos.components.videoTimeline'),
        sidebar: biigle.$require('core.components.sidebar'),
        sidebarTab: biigle.$require('core.components.sidebarTab'),
        labelTrees: biigle.$require('labelTrees.components.labelTrees'),
        settingsTab: biigle.$require('videos.components.settingsTab'),
        annotationsTab: biigle.$require('videos.components.viaAnnotationsTab'),
    },
    data: {
        videoId: null,
        shapes: [],
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
        resizingTimeline: false,
        timelineOffsetReference: 0,
        timelineHeightReference: 0,
        fixedTimelineOffset: 0,
        currentTimelineOffset: 0,
    },
    computed: {
        shapes() {
            let map = {};
            Object.keys(this.shapes).forEach((id) => {
                map[this.shapes[id]] = parseInt(id);
            });

            return map;
        },
        selectedAnnotations() {
            return this.filteredAnnotations.filter(function (annotation) {
                return annotation.isSelected;
            });
        },
        settingsStore() {
            return biigle.$require('videos.stores.settings');
        },
        filteredAnnotations() {
            if (this.activeAnnotationFilter) {
                return this.activeAnnotationFilter.filter(this.annotations);
            }

            return this.annotations;
        },
        hasActiveAnnotationFilter() {
            return this.activeAnnotationFilter !== null;
        },
        timelineHeightOffset() {
            return this.fixedTimelineOffset + this.currentTimelineOffset;
        },
        screenHeightOffset() {
            return -1 * this.timelineHeightOffset;
        },
        classObject() {
            if (this.resizingTimeline) {
                return 'resizing-timeline';
            }

            return '';
        }
    },
    methods: {
        prepareAnnotation(annotation) {
            return new Annotation({data: annotation});
        },
        setAnnotations(response) {
            this.annotations = response.body.map(this.prepareAnnotation);
        },
        addCreatedAnnotation(response) {
            let annotation = this.prepareAnnotation(response.body);
            annotation.$on('tracking-failed', this.removeAnnotation);
            this.annotations.push(annotation);

            return annotation;
        },
        seek(time) {
            if (!this.seeking && this.video.currentTime !== time) {
                this.seeking = true;
                this.video.currentTime = time;
            }
        },
        selectAnnotation(annotation, time, shift) {
            if (shift) {
                this.selectAnnotations([annotation], [], time);
            } else {
                this.selectAnnotations([annotation], this.selectedAnnotations, time);
            }
        },
        selectAnnotations(selected, deselected, time) {
            // Deselect first because previously selected annotations might be
            // selected again.
            deselected.forEach(function (annotation) {
                annotation.selected = false;
            });

            let hadSelected = this.selectedAnnotations.length > 0;

            selected.forEach(function (annotation) {
                annotation.selected = time;
            });

            if (time !== undefined && hadSelected === false) {
                this.seek(time);
            }
        },
        deselectAnnotation(annotation) {
            if (annotation) {
                annotation.selected = false;
            } else {
                this.selectedAnnotations.forEach(function (annotation) {
                    annotation.selected = false;
                });
            }
        },
        createBookmark(time) {
            let hasBookmark = this.bookmarks.reduce(function (has, b) {
                return has || b.time === time;
            }, false);

            if (!hasBookmark) {
                this.bookmarks.push({time: time});
            }
        },
        createAnnotation(pendingAnnotation) {
            let annotation = Object.assign(pendingAnnotation, {
                shape_id: this.shapes[pendingAnnotation.shape],
                label_id: this.selectedLabel ? this.selectedLabel.id : 0,
            });
            delete annotation.shape;

            return VideoAnnotationApi.save({id: this.videoId}, annotation)
                .then(this.addCreatedAnnotation, handleErrorResponse);
        },
        trackAnnotation(pendingAnnotation) {
            pendingAnnotation.track = true;
            this.createAnnotation(pendingAnnotation)
                .then(this.startPollTrackingAnnotation);
        },
        startPollTrackingAnnotation(annotation) {
            if (annotation) {
                annotation.startPollTracking();
            }
        },
        handleSelectedLabel(label) {
            this.selectedLabel = label;
        },
        handleDeselectedLabel() {
            this.selectedLabel = null;
        },
        deleteAnnotationsOrKeyframes(event) {
            if (confirm('Are you sure that you want to delete all selected annotations/keyframes?')) {
                event.forEach(this.deleteAnnotationOrKeyframe);
            }
        },
        deleteAnnotationOrKeyframe(event) {
            let annotation = event.annotation;
            if (annotation.isClip && annotation.hasKeyframe(event.time)) {
                annotation.deleteKeyframe(event.time)
                    .catch(handleErrorResponse);
            } else {
                annotation.delete()
                    .then(this.deletedAnnotation(annotation))
                    .catch(handleErrorResponse);
            }
        },
        deletedAnnotation(annotation) {
            return (function () {
                this.removeAnnotation(annotation);
            }).bind(this);
        },
        handleVideoSeeked() {
            this.seeking = false;
        },
        modifyAnnotations(event) {
            event.forEach(this.modifyAnnotation);
        },
        modifyAnnotation(event) {
            event.annotation.modify(event.time, event.points)
                .catch(handleErrorResponse);
        },
        handleUpdatedSettings(key, value) {
            this.settings[key] = value;
        },
        handleOpenedTab(name) {
            this.settingsStore.set('openTab', name);
        },
        handleClosedTab() {
            this.settingsStore.delete('openTab');
        },
        handleToggledTab() {
            this.$refs.videoScreen.updateSize();
        },
        removeAnnotation(annotation) {
            let index = this.annotations.indexOf(annotation);
            if (index !== -1) {
                this.annotations.splice(index, 1);
            }
        },
        splitAnnotation(annotation, time) {
            annotation.split(time)
                .then(this.addCreatedAnnotation, handleErrorResponse);
        },
        linkAnnotations(annotations) {
            annotations[0].link(annotations[1])
                .then(this.deletedAnnotation(annotations[1]))
                .catch(handleErrorResponse);
        },
        updateMapUrlParams(center, resolution) {
            this.urlParams.x = Math.round(center[0]);
            this.urlParams.y = Math.round(center[1]);
            this.urlParams.r = Math.round(resolution * 100);
        },
        updateVideoUrlParams() {
            this.urlParams.t = Math.round(this.video.currentTime * 100);
        },
        restoreUrlParams() {
            if (UrlParams.get('r') !== undefined) {
                this.initialMapResolution = parseInt(UrlParams.get('r'), 10) / 100;
            }

            if (UrlParams.get('x') !== undefined && UrlParams.get('y') !== undefined) {
                this.initialMapCenter = [
                    parseInt(UrlParams.get('x'), 10),
                    parseInt(UrlParams.get('y'), 10),
                ];
            }

            if (UrlParams.get('t') !== undefined) {
                this.initialCurrentTime = parseInt(UrlParams.get('t'), 10) / 100;
            }
        },
        maybeInitCurrentTime() {
            if (this.initialCurrentTime === 0) {
                return Vue.Promise.resolve();
            }

            let promise = new Vue.Promise((function (resolve, reject) {
                this.video.addEventListener('seeked', resolve);
                this.video.addEventListener('error', reject);
            }).bind(this));
            this.seek(this.initialCurrentTime);

            return promise;
        },
        detachAnnotationLabel(annotation, annotationLabel) {
            if (annotation.labels.length > 1) {
                annotation.detachAnnotationLabel(annotationLabel)
                    .catch(handleErrorResponse);
            } else if (confirm('Detaching the last label of an annotation deletes the whole annotation. Do you want to delete the annotation?')) {
                annotation.delete()
                    .then(this.deletedAnnotation(annotation))
                    .catch(handleErrorResponse);
            }
        },
        attachAnnotationLabel(annotation, label) {
            annotation.attachAnnotationLabel(label)
                .catch(handleErrorResponse);
        },
        initAnnotationFilters() {
            let LabelFilter = biigle.$require('annotations.models.LabelAnnotationFilter');
            let UserFilter = biigle.$require('annotations.models.UserAnnotationFilter');
            let ShapeFilter = biigle.$require('annotations.models.ShapeAnnotationFilter');

            this.annotationFilters = [
                new LabelFilter({data: {annotations: this.annotations}}),
                new UserFilter({data: {annotations: this.annotations}}),
                new ShapeFilter({data: {shapes: this.shapes}}),
            ];
        },
        setActiveAnnotationFilter(filter) {
            this.activeAnnotationFilter = filter;
        },
        resetAnnotationFilter() {
            if (this.activeAnnotationFilter) {
                this.activeAnnotationFilter.reset();
            }
            this.activeAnnotationFilter = null;
        },
        handleRequiresSelectedLabel() {
            Messages.info('Please select a label first.');
            this.$refs.sidebar.$emit('open', 'labels');
        },
        startUpdateTimelineHeight(e) {
            e.preventDefault();
            this.resizingTimeline = true;
            this.timelineOffsetReference = e.clientY;
            this.timelineHeightReference = this.$refs.videoTimeline.$el.offsetHeight;
        },
        updateTimelineHeight(e) {
            if (this.resizingTimeline) {
                e.preventDefault();
                this.currentTimelineOffset = this.timelineOffsetReference - e.clientY;
            }
        },
        finishUpdateTimelineHeight(e) {
            if (this.resizingTimeline) {
                this.resizingTimeline = false;
                // Use the actual element height to calculate the new offset because
                // the height is restricted with percent values in CSS. The value in
                // currentTimelineOffset is not restricted. Even if the element
                // height would be correct, the next resize attempt may not work as
                // expected because fixedTimelineOffset is too small/large and the
                // mouse would have to move a bit to reach the threshold that is set
                // via CSS.
                this.fixedTimelineOffset = this.fixedTimelineOffset + this.$refs.videoTimeline.$el.offsetHeight - this.timelineHeightReference;
                this.currentTimelineOffset = 0;
            }
        },
    },
    watch: {
        'settings.playbackRate'(rate) {
            this.video.playbackRate = rate;
        },
        urlParams: {
            deep: true,
            handler:function (params) {
                UrlParams.set(params);
            },
        },
    },
    created() {
        this.videoId = biigle.$require('videos.id');
        this.shapes = biigle.$require('videos.shapes');

        this.restoreUrlParams();
        this.video.muted = true;
        this.video.addEventListener('error', function (e) {
            if (e.target.error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                Messages.danger('The video codec is not supported by your browser.');
            } else if (e.target.error.code !== MediaError.MEDIA_ERR_ABORTED) {
                Messages.danger('Error while loading video file.');
            }
        });
        this.video.addEventListener('seeked', this.handleVideoSeeked);
        this.video.addEventListener('pause', this.updateVideoUrlParams);
        this.video.addEventListener('seeked', this.updateVideoUrlParams);
        this.startLoading();
        let self = this;
        let videoPromise = new Vue.Promise(function (resolve, reject) {
            self.video.addEventListener('canplay', resolve);
        });
        let annotationPromise = VideoAnnotationApi.query({id: this.videoId});
        annotationPromise.then(this.setAnnotations, handleErrorResponse)
            .then(this.initAnnotationFilters);

        Vue.Promise.all([videoPromise, annotationPromise])
            .then(this.maybeInitCurrentTime)
            .then(this.finishLoading);

        if (this.settingsStore.has('openTab')) {
            this.openTab = this.settingsStore.get('openTab');
        }
    },
    mounted() {
        // Wait for the sub-components to register their event listeners before
        // loading the video.
        this.video.src = biigle.$require('videos.src');
    },
};
