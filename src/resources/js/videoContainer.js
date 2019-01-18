biigle.$viewModel('video-container', function (element) {
    var VIDEO_ID = biigle.$require('videos.id');
    var VIDEO_SRC = biigle.$require('videos.src');
    var SHAPES = biigle.$require('videos.shapes');
    var ANNOTATION_API = biigle.$require('videos.api.videoAnnotations');
    var MSG = biigle.$require('messages.store');

    new Vue({
        el: element,
        components: {
            videoScreen: biigle.$require('videos.components.videoScreen'),
            videoTimeline: biigle.$require('videos.components.videoTimeline'),
            sidebar: biigle.$require('core.components.sidebar'),
            sidebarTab: biigle.$require('core.components.sidebarTab'),
            labelTrees: biigle.$require('labelTrees.components.labelTrees'),
        },
        data: {
            video: document.createElement('video'),
            labelTrees: biigle.$require('videos.labelTrees'),
            selectedLabel: null,
            bookmarks: [],
            annotations: [],
        },
        computed: {
            shapes: function () {
                var map = {};
                Object.keys(SHAPES).forEach(function (id) {
                    map[SHAPES[id]] = id;
                });

                return map;
            },
        },
        methods: {
            prepareAnnotation: function (annotation) {
                annotation.selected = false;

                return annotation;
            },
            setAnnotations: function (response) {
                this.annotations = response.body.map(this.prepareAnnotation);
            },
            addCreatedAnnotation: function (response) {
                this.annotations.push(this.prepareAnnotation(response.body));
            },
            seek: function (time) {
                this.video.currentTime = time;
            },
            selectAnnotation: function (annotation, time) {
                this.selectAnnotations([annotation], [time]);
            },
            selectAnnotations: function (annotations, times) {
                this.deselectAnnotations();

                annotations.forEach(function (annotation, index) {
                    annotation.selected = times[index];
                });

                // if (times && times.length > 0) {
                //     this.seek(times[0]);
                // }
            },
            deselectAnnotations: function () {
                this.annotations.forEach(function (annotation) {
                    annotation.selected = false;
                });
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
                    shape_id: this.shapes.Point,
                    label_id: this.selectedLabel ? this.selectedLabel.id : 0,
                });

                ANNOTATION_API.save({id: VIDEO_ID}, annotation)
                    .then(this.addCreatedAnnotation, MSG.handleResponseError);
            },
            handleSelectedLabel: function (label) {
                this.selectedLabel = label;
            },
            handleDeselectedLabel: function () {
                this.selectedLabel = null;
            },
        },
        created: function () {
            this.video.muted = true;
            ANNOTATION_API.query({id: VIDEO_ID})
                .then(this.setAnnotations, MSG.handleResponseError);
        },
        mounted: function () {
            // Wait for the sub-components to register their event listeners before
            // loading the video.
            this.video.src = VIDEO_SRC;
        },
    });
});
