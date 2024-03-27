<script>
import Annotation from './models/Annotation';
import AnnotationsTab from './components/viaAnnotationsTab';
import Echo from '../core/echo';
import Events from '../core/events';
import LabelAnnotationFilter from '../annotations/models/LabelAnnotationFilter';
import LabelTrees from '../label-trees/components/labelTrees';
import LoaderMixin from '../core/mixins/loader';
import Messages from '../core/messages/store';
import Settings from './stores/settings';
import SettingsTab from './components/settingsTab';
import ShapeAnnotationFilter from '../annotations/models/ShapeAnnotationFilter';
import Sidebar from '../core/components/sidebar';
import SidebarTab from '../core/components/sidebarTab';
import UserAnnotationFilter from '../annotations/models/UserAnnotationFilter';
import VideoAnnotationApi from './api/videoAnnotations';
import VideoApi from './api/videos';
import VideoLabelsTab from './components/videoLabelsTab';
import VideoScreen from './components/videoScreen';
import VideoTimeline from './components/videoTimeline';
import {handleErrorResponse} from '../core/messages/store';
import {urlParams as UrlParams} from '../core/utils';

class VideoError extends Error {}
class VideoNotProcessedError extends VideoError {}
class VideoNotFoundError extends VideoError {}
class VideoMimeTypeError extends VideoError {}
class VideoCodecError extends VideoError {}
class VideoMalformedError extends VideoError {}
class VideoTooLargeError extends VideoError {}

// Used to round and parse the video current time from the URL, as it is stored as an int
// there (without decimal dot).
const URL_CURRENT_TIME_DIVISOR = 1e4

export default {
    mixins: [LoaderMixin],
    components: {
        videoScreen: VideoScreen,
        videoTimeline: VideoTimeline,
        sidebar: Sidebar,
        sidebarTab: SidebarTab,
        labelTrees: LabelTrees,
        settingsTab: SettingsTab,
        annotationsTab: AnnotationsTab,
        videoLabelsTab: VideoLabelsTab,
    },
    data() {
        return {
            volumeId: null,
            videoId: null,
            videoDuration: 0,
            videoIds: [],
            videoFileUri: '',
            shapes: [],
            canEdit: false,
            video: null,
            labelTrees: [],
            selectedLabel: null,
            pendingAnnotation: null,
            annotations: [],
            seeking: false,
            settings: {
                annotationOpacity: 1,
                showMinimap: true,
                autoplayDraw: 0,
                showLabelTooltip: false,
                showMousePosition: false,
                playbackRate: 1.0,
                showProgressIndicator: true,
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
            initialFocussedAnnotation: 0,
            annotationFilters: [],
            activeAnnotationFilter: null,
            resizingTimeline: false,
            timelineOffsetReference: 0,
            timelineHeightReference: 0,
            fixedTimelineOffset: 0,
            currentTimelineOffset: 0,
            errors: {},
            error: null,
            user: null,
            attachingLabel: false,
            swappingLabel: false,
            disableJobTracking: false,
        };
    },
    computed: {
        selectedAnnotations() {
            return this.filteredAnnotations.filter((a) => a.isSelected);
        },
        filteredAnnotations() {
            if (this.hasActiveAnnotationFilter) {
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
        },
        hasSiblingVideos() {
            return this.videoIds.length > 1;
        },
        hasError() {
            return this.error !== null;
        },
        hasVideoError() {
            return this.error instanceof VideoError;
        },
        hasNotProcessedError() {
            return this.error instanceof VideoNotProcessedError;
        },
        hasNotFoundError() {
            return this.error instanceof VideoNotFoundError;
        },
        hasMimeTypeError() {
            return this.error instanceof VideoMimeTypeError;
        },
        hasCodecError() {
            return this.error instanceof VideoCodecError;
        },
        hasMalformedError() {
            return this.error instanceof VideoMalformedError;
        },
        hasTooLargeError() {
            return this.error instanceof VideoTooLargeError;
        },
        errorClass() {
            if (this.hasVideoError) {
                if (this.error instanceof VideoNotProcessedError) {
                    return 'panel-warning text-warning';
                } else {
                    return 'panel-danger text-danger';
                }
            }

            return '';
        },
        annotationsHiddenByFilter() {
            return this.annotations.length !== this.filteredAnnotations.length;
        },
        annotationCount() {
            return this.annotations.length;
        },
        reachedTrackedAnnotationLimit() {
            return this.disableJobTracking;
        }
    },
    methods: {
        prepareAnnotation(annotation) {
            return new Annotation({data: annotation});
        },
        setAnnotations(args) {
            this.annotations = args[0].body.map(this.prepareAnnotation);
        },
        addCreatedAnnotation(response) {
            let annotation = this.prepareAnnotation(response.body);
            this.annotations.push(annotation);

            return annotation;
        },
        seek(time, force) {
            if (this.seeking) {
                return Vue.Promise.resolve();
            }

            if (this.video.currentTime === time && force !== true) {
                return Vue.Promise.resolve();
            }

            let promise = new Vue.Promise((resolve, reject) => {
                this.video.addEventListener('seeked', resolve);
                this.video.addEventListener('error', reject);
            });
            this.seeking = true;
            this.video.currentTime = time;

            return promise;
        },
        selectAnnotation(annotation, time, shift) {
            if (this.attachingLabel) {
                this.attachAnnotationLabel(annotation);

                return Vue.Promise.resolve();
            } else if (this.swappingLabel) {
                this.swapAnnotationLabel(annotation);

                return Vue.Promise.resolve();
            }

            if (shift) {
                return this.selectAnnotations([annotation], [], time);
            } else {
                return this.selectAnnotations([annotation], this.selectedAnnotations, time);
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
                return this.seek(time);
            }

            return Vue.Promise.resolve();
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
        updatePendingAnnotation(pendingAnnotation) {
            if (pendingAnnotation) {
                let data = Object.assign({}, pendingAnnotation, {
                    shape_id: this.shapes[pendingAnnotation.shape],
                    labels: [{
                        label_id: this.selectedLabel.id,
                        label: this.selectedLabel,
                        user: this.user,
                    }],
                    pending: true,
                });

                this.pendingAnnotation = new Annotation({data});
            } else {
                this.pendingAnnotation = null;
            }
        },
        createAnnotation(pendingAnnotation) {
            this.updatePendingAnnotation(pendingAnnotation);
            let tmpAnnotation = this.pendingAnnotation;
            this.annotations.push(tmpAnnotation);

            // Catch an edge case where the time of the last key frame is greater than
            // the actual video duration.
            // See: https://github.com/biigle/core/issues/305
            let frameCount = tmpAnnotation.frames.length;
            if (this.videoDuration > 0 && frameCount > 0 && tmpAnnotation.frames[frameCount - 1] > this.videoDuration) {
                tmpAnnotation.frames[frameCount - 1] = this.videoDuration;
            }

            let annotation = Object.assign({}, pendingAnnotation, {
                shape_id: this.shapes[pendingAnnotation.shape],
                label_id: this.selectedLabel ? this.selectedLabel.id : 0,
            });

            delete annotation.shape;

            return VideoAnnotationApi.save({id: this.videoId}, annotation)
                .then((res) => {
                    if (tmpAnnotation.track) {
                        this.disableJobTracking = res.body.trackingJobLimitReached;
                    }
                    return this.addCreatedAnnotation(res);
                }, (res) => {
                    handleErrorResponse(res);
                    this.disableJobTracking = res.status === 429;
                })
                .finally(() => {
                    let index = this.annotations.indexOf(tmpAnnotation);
                    if (index !== -1) {
                        this.annotations.splice(index, 1);
                    }
                });
        },
        trackAnnotation(pendingAnnotation) {
            pendingAnnotation.track = true;
            this.createAnnotation(pendingAnnotation)
                .then(this.setAnnotationTrackingState);
        },
        setAnnotationTrackingState(annotation) {
            if (annotation) {
                annotation.startTracking();
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
                    .then(() => this.removeAnnotation(annotation))
                    .catch(handleErrorResponse);
            }
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
            Settings.set('openTab', name);
        },
        handleClosedTab() {
            Settings.delete('openTab');
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
            annotation.split(time).then(this.addCreatedAnnotation, handleErrorResponse);
        },
        linkAnnotations(annotations) {
            annotations[0].link(annotations[1])
                .then(() => this.removeAnnotation(annotations[1]))
                .catch(handleErrorResponse);
        },
        updateMapUrlParams(center, resolution) {
            this.urlParams.x = Math.round(center[0]);
            this.urlParams.y = Math.round(center[1]);
            this.urlParams.r = Math.round(resolution * 100);
        },
        updateVideoUrlParams() {
            this.urlParams.t = Math.round(this.video.currentTime * URL_CURRENT_TIME_DIVISOR);
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
                this.initialCurrentTime = parseInt(UrlParams.get('t'), 10) / URL_CURRENT_TIME_DIVISOR;
            }

            if (UrlParams.get('annotation') !== undefined) {
                this.initialFocussedAnnotation = parseInt(UrlParams.get('annotation'), 10);
            }
        },
        maybeInitCurrentTime() {
            // Ignore initial time if an initial annotation is selected.
            if (this.initialCurrentTime === 0 || this.selectedAnnotations.length > 0) {
                return Vue.Promise.resolve();
            }

            return this.seek(this.initialCurrentTime);
        },
        maybeFocusInitialAnnotation() {
            if (this.initialFocussedAnnotation) {
                let annotation = this.annotations.find(annotation => annotation.id === this.initialFocussedAnnotation);
                if (annotation) {
                    return this.selectAnnotation(annotation, annotation.startFrame)
                        .then(() => this.$refs.videoScreen.focusAnnotation(annotation));
                }
            }

            return Vue.Promise.resolve();
        },
        detachAnnotationLabel(annotation, annotationLabel) {
            if (annotation.labels.length > 1) {
                annotation.detachAnnotationLabel(annotationLabel)
                    .then(() => {
                        // don't refresh whole frame annotations due to missing shape
                        if (annotation.points.length > 0) {
                            this.refreshSingleAnnotation(annotation);
                        }
                    })
                    .catch(handleErrorResponse);
            } else if (confirm('Detaching the last label of an annotation deletes the whole annotation. Do you want to delete the annotation?')) {
                annotation.delete()
                    .then(() => this.removeAnnotation(annotation))
                    .catch(handleErrorResponse);
            }
        },
        attachAnnotationLabel(annotation) {
            let promise = annotation.attachAnnotationLabel(this.selectedLabel);
            promise.catch(handleErrorResponse);

            return promise;
        },
        swapAnnotationLabel(annotation) {
            let lastLabel = annotation.labels
                .filter(l => l.user_id === this.user.id)
                .sort((a, b) => a.id - b.id)
                .pop();

            this.attachAnnotationLabel(annotation)
                .then(() => {
                    if (lastLabel) {
                        this.detachAnnotationLabel(annotation, lastLabel);
                    }
                })
                .catch(handleErrorResponse);
        },
        refreshSingleAnnotation(annotation) {
            this.$refs.videoScreen.refreshSingleAnnotation(annotation);
        },
        initAnnotationFilters() {
            let reverseShapes = {};
            for (let name in this.shapes) {
                reverseShapes[this.shapes[name]] = name;
            }

            this.annotationFilters = [
                new LabelAnnotationFilter({data: {annotations: this.annotations}}),
                new UserAnnotationFilter({data: {annotations: this.annotations}}),
                new ShapeAnnotationFilter({data: {shapes: reverseShapes}}),
            ];
        },
        updateAnnotationFilters() {
            this.annotationFilters[0].annotations = this.annotations;
            this.annotationFilters[1].annotations = this.annotations;
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
        finishUpdateTimelineHeight() {
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
        handleVideoInformationResponse(response) {
            let video = response.body;

            if (video.error === this.errors['not-found']) {
                throw new VideoNotFoundError();
            } else if (video.error === this.errors['mimetype']) {
                throw new VideoMimeTypeError();
            } else if (video.error === this.errors['codec']) {
                throw new VideoCodecError();
            } else if (video.error === this.errors['malformed']) {
                throw new VideoMalformedError();
            } else if (video.error === this.errors['too-large']) {
                throw new VideoTooLargeError();
            } else if (video.size === null) {
                throw new VideoNotProcessedError();
            }

            this.error = null;
            this.videoDuration = video.duration;

            return video;
        },
        handleVideoError(error) {
            if (error instanceof VideoError) {
                this.error = error;
            } else {
                this.error = true;
                handleErrorResponse(error);
            }
        },
        fetchVideoContent(video) {
            let videoPromise = new Vue.Promise((resolve) => {
                this.video.addEventListener('canplay', resolve);
            });
            let annotationPromise = VideoAnnotationApi.query({id: video.id});
            let promise = Vue.Promise.all([annotationPromise, videoPromise])
                .then(this.setAnnotations)
                .then(this.updateAnnotationFilters)
                .then(this.maybeFocusInitialAnnotation)
                .then(this.maybeInitCurrentTime);

            this.video.src = this.videoFileUri.replace(':id', video.id);

            return promise;
        },
        loadVideo(id) {
            this.videoId = id;
            Events.$emit('video.id', id);
            UrlParams.setSlug(id, -2);
            this.startLoading();

            let promise = VideoApi.get({id})
                .then(this.handleVideoInformationResponse)
                .then(this.fetchVideoContent)
                .catch(this.handleVideoError)
                .finally(() => {
                    this.finishLoading();
                    // Avoid spinning wheel continuing to be displayed after moving fast through videos
                    this.seeking = false;
                });

            return promise;
        },
        showPreviousVideo() {
            this.reset();
            let length = this.videoIds.length;
            let index = (this.videoIds.indexOf(this.videoId) + length - 1) % length;

            this.loadVideo(this.videoIds[index]).then(this.updateVideoUrlParams);
        },
        showNextVideo() {
            this.reset();
            let length = this.videoIds.length;
            let index = (this.videoIds.indexOf(this.videoId) + length + 1) % length;

            this.loadVideo(this.videoIds[index]).then(this.updateVideoUrlParams);
        },
        reset() {
            this.annotations = [];
            this.seeking = false;
            this.initialCurrentTime = 0;
            this.initialFocussedAnnotation = 0;
            this.$refs.videoTimeline.reset();
            this.$refs.videoScreen.reset();
        },
        initVideoIds(ids) {
            // Look for a sequence of video IDs in local storage. This sequence is
            // produced by the volume overview page when the files are sorted or
            // filtered. We want to reflect the same ordering or filtering here
            // in the annotation tool.
            let storedSequence = window.localStorage.getItem(`biigle.volumes.${this.volumeId}.files`);
            if (storedSequence) {
                // If there is such a stored sequence, filter out any image IDs that
                // do not belong to the volume (any more), since some of them may
                // have been deleted in the meantime.
                let map = {};
                ids.forEach(function (id) {
                    map[id] = null;
                });
                return JSON.parse(storedSequence).filter((id) => map.hasOwnProperty(id));
            }

            return ids;
        },
        handleAttachingLabelActive(attaching) {
            this.swappingLabel = false;
            this.attachingLabel = attaching;
        },
        handleSwappingLabelActive(swapping) {
            this.attachingLabel = false;
            this.swappingLabel = swapping;
        },
        initializeEcho() {
            // Use the websocket connection to get events on object tracking.
            // Previously this was done with XHR polling.
            Echo.getInstance().private(`user-${this.user.id}`)
                .listen('.Biigle\\Events\\ObjectTrackingSucceeded', this.handleSucceededTracking)
                .listen('.Biigle\\Events\\ObjectTrackingFailed', this.handleFailedTracking);
        },
        handleSucceededTracking(event) {
            let annotation = this.annotations.find(a => a.id === event.annotation.id);
            if (annotation) {
                this.disableJobTracking = false;
                annotation.finishTracking(event.annotation);
            }
        },
        handleFailedTracking(event) {
            let annotation = this.annotations.find(a => a.id === event.annotation.id);
            if (annotation) {
                this.disableJobTracking = false;
                annotation.failTracking();
            }
        },
        handleInvalidShape(shape) {
            let count;
            switch (shape) {
                case 'Circle':
                    Messages.danger('Invalid shape. Circle needs non-zero radius');
                    return;
                case 'LineString':
                    shape = 'Line'
                    count = 2;
                    break;
                case 'Polygon':
                    count = 'at least 3';
                    break;
                case 'Rectangle':
                case 'Ellipse':
                    count = 4;
                    break;
                default:
                    return;
            }
            Messages.danger(`Invalid shape. ${shape} needs ${count} different points.`);
        },
    },
    watch: {
        'settings.playbackRate'(rate) {
            this.video.playbackRate = rate;
        },
        urlParams: {
            deep: true,
            handler(params) {
                UrlParams.set(params);
            },
        },
    },
    created() {
        let shapes = biigle.$require('videos.shapes');
        let map = {};
        Object.keys(shapes).forEach((id) => {
            map[shapes[id]] = parseInt(id);
        });
        this.shapes = map;
        this.video = document.createElement('video');
        this.videoId = biigle.$require('videos.id');
        this.volumeId = biigle.$require('videos.volumeId');
        this.videoIds = this.initVideoIds(biigle.$require('videos.videoIds'));
        this.videoFileUri = biigle.$require('videos.videoFileUri');
        this.canEdit = biigle.$require('videos.isEditor');
        this.labelTrees = biigle.$require('videos.labelTrees');
        this.errors = biigle.$require('videos.errors');
        this.user = biigle.$require('videos.user');

        this.initAnnotationFilters();
        this.restoreUrlParams();
        this.video.muted = true;
        this.video.preload = 'auto';
        this.video.addEventListener('error', function (e) {
            if (e.target.error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                if (e.target.error.message.startsWith('404') || e.target.error.message.startsWith('403')) {
                    Messages.danger('Unable to access the video file.');
                } else {
                    Messages.danger('The video file could not be accessed or the codec is not supported by your browser.');
                }
            } else if (e.target.error.code !== MediaError.MEDIA_ERR_ABORTED) {
                Messages.danger('Error while loading video file.');
            }
        });
        this.video.addEventListener('seeked', this.handleVideoSeeked);
        this.video.addEventListener('pause', this.updateVideoUrlParams);
        this.video.addEventListener('seeked', this.updateVideoUrlParams);

        if (Settings.has('openTab')) {
            this.openTab = Settings.get('openTab');
        }

        if (this.canEdit) {
            this.initializeEcho();
        }
    },
    mounted() {
        // Wait for the sub-components to register their event listeners before
        // loading the video.
        this.loadVideo(this.videoId);

        // See: https://github.com/biigle/core/issues/391
        if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
            Messages.danger('Current versions of the Firefox browser may not show the correct video frame for a given time. Annotations may be placed incorrectly. Please consider using Chrome until the issue is fixed in Firefox. Learn more on https://github.com/biigle/core/issues/391.');
        }
    },
};
</script>
