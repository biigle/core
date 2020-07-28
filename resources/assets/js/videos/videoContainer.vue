<script>
import Annotation from './models/Annotation';
import AnnotationsTab from './components/viaAnnotationsTab';
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
import VideoScreen from './components/videoScreen';
import VideoTimeline from './components/videoTimeline';
import {handleErrorResponse} from '../core/messages/store';
import {urlParams as UrlParams} from '../core/utils';

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
    },
    data() {
        return {
            volumeId: null,
            videoId: null,
            videoIds: [],
            videoFileUri: '',
            shapes: [],
            canEdit: false,
            video: null,
            labelTrees: [],
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
            annotationFilters: [],
            activeAnnotationFilter: null,
            resizingTimeline: false,
            timelineOffsetReference: 0,
            timelineHeightReference: 0,
            fixedTimelineOffset: 0,
            currentTimelineOffset: 0,
        };
    },
    computed: {
        selectedAnnotations() {
            return this.filteredAnnotations.filter((a) => a.isSelected);
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
        },
        hasSiblingVideos() {
            return this.videoIds.length > 1;
        },
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

            let promise = new Vue.Promise((resolve, reject) => {
                this.video.addEventListener('seeked', resolve);
                this.video.addEventListener('error', reject);
            });
            this.seek(this.initialCurrentTime);

            return promise;
        },
        detachAnnotationLabel(annotation, annotationLabel) {
            if (annotation.labels.length > 1) {
                annotation.detachAnnotationLabel(annotationLabel)
                    .catch(handleErrorResponse);
            } else if (confirm('Detaching the last label of an annotation deletes the whole annotation. Do you want to delete the annotation?')) {
                annotation.delete()
                    .then(() => this.removeAnnotation(annotation))
                    .catch(handleErrorResponse);
            }
        },
        attachAnnotationLabel(annotation, label) {
            annotation.attachAnnotationLabel(label)
                .catch(handleErrorResponse);
        },
        initAnnotationFilters() {
            this.annotationFilters = [
                new LabelAnnotationFilter({data: {annotations: this.annotations}}),
                new UserAnnotationFilter({data: {annotations: this.annotations}}),
                new ShapeAnnotationFilter({data: {shapes: this.shapes}}),
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
        loadVideo(id) {
            this.videoId = id;
            Events.$emit('video.id', id);
            UrlParams.setSlug(this.videoId, -2);
            this.startLoading();
            let videoPromise = new Vue.Promise((resolve) => {
                this.video.addEventListener('canplay', resolve);
            });
            let annotationPromise = VideoAnnotationApi.query({id: this.videoId});
            let promise = Vue.Promise.all([annotationPromise, videoPromise])
                .then(this.setAnnotations)
                .then(this.updateAnnotationFilters)
                .then(this.maybeInitCurrentTime)
                .catch(handleErrorResponse)
                .finally(this.finishLoading);

            this.video.src = this.videoFileUri.replace(':id', this.videoId);

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
            this.bookmarks = [];
            this.annotations = [];
            this.seeking = false;
            this.initialCurrentTime = 0;
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
        this.volumeId = biigle.$require('videos.volumeId');
        this.videoIds = this.initVideoIds(biigle.$require('videos.videoIds'));
        this.videoFileUri = biigle.$require('videos.videoFileUri');
        this.canEdit = biigle.$require('videos.isEditor');
        this.labelTrees = biigle.$require('videos.labelTrees');

        this.initAnnotationFilters();
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

        if (Settings.has('openTab')) {
            this.openTab = Settings.get('openTab');
        }
    },
    mounted() {
        // Wait for the sub-components to register their event listeners before
        // loading the video.
        this.loadVideo(biigle.$require('videos.id'));
    },
};
</script>
