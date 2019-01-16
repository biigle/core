biigle.$viewModel('video-container', function (element) {
    var VIDEO_SRC = biigle.$require('videoSrc');

    new Vue({
        el: element,
        components: {
            videoScreen: biigle.$require('components.videoScreen'),
            videoTimeline: biigle.$require('components.videoTimeline'),
        },
        data: {
            video: document.createElement('video'),
            bookmarks: [],
            annotations: [],
            // annotations: [
            //     {
            //         id: 1,
            //         selected: false,
            //         points: {
            //             frames: [5.0, 7.5, 10.0],
            //             coordinates: [
            //                 [100, 100],
            //                 [100, 200],
            //                 [200, 100],
            //             ],
            //         },
            //         labels: [
            //             {id: 1, name: 'label 1', color: 'ff00ff'},
            //             {id: 2, name: 'label 2', color: '00ff00'},
            //         ],
            //     },
            //     {
            //         id: 2,
            //         selected: false,
            //         points: {
            //             frames: [2.5],
            //             coordinates: [[500, 500]],
            //         },
            //         labels: [
            //             {id: 1, name: 'label 1', color: 'ff00ff'},
            //         ],
            //     },
            //     {
            //         id: 22,
            //         selected: false,
            //         points: {
            //             frames: [3.5],
            //             coordinates: [[400, 400]],
            //         },
            //         labels: [
            //             {id: 1, name: 'label 1', color: 'ff00ff'},
            //         ],
            //     },
            //     {
            //         id: 3,
            //         selected: false,
            //         points: {
            //             frames: [9.0, 13.0],
            //             coordinates: [
            //                 [300, 300],
            //                 [600, 600],
            //             ],
            //         },
            //         labels: [
            //             {id: 1, name: 'label 1', color: 'ff00ff'},
            //         ],
            //     },
            //     {
            //         id: 33,
            //         selected: false,
            //         points: {
            //             frames: [2.0, 3.0, 4.0, 5.0, 6.0],
            //             coordinates: [
            //                 [510, 510],
            //                 [520, 520],
            //                 [530, 530],
            //                 [560, 560],
            //                 [570, 570],
            //             ],
            //         },
            //         labels: [
            //             {id: 1, name: 'label 1', color: 'ff00ff'},
            //         ],
            //     },
            //     {
            //         id: 4,
            //         selected: false,
            //         points: {
            //             frames: [1.0, 4.5],
            //             coordinates: [
            //                 [110, 110],
            //                 [150, 150],
            //             ],
            //         },
            //         labels: [
            //             {id: 2, name: 'label 2', color: '00ff00'},
            //         ],
            //     },
            //     {
            //         id: 5,
            //         selected: false,
            //         points: {
            //             frames: [1.0, 4.0],
            //             coordinates: [
            //                 [160, 160],
            //                 [170, 170],
            //             ],
            //         },
            //         labels: [
            //             {id: 2, name: 'label 2', color: '00ff00'},
            //         ],
            //     },
            //     {
            //         id: 6,
            //         selected: false,
            //         points: {
            //             frames: [4.0, 11.0],
            //             coordinates: [
            //                 [180, 180],
            //                 [190, 190],
            //             ],
            //         },
            //         labels: [
            //             {id: 2, name: 'label 2', color: '00ff00'},
            //         ],
            //     },
            //     {
            //         id: 7,
            //         selected: false,
            //         points: {
            //             frames: [10.5, 14.0],
            //             coordinates: [
            //                 [610, 610],
            //                 [620, 590],
            //             ],
            //         },
            //         labels: [
            //             {id: 2, name: 'label 2', color: '00ff00'},
            //         ],
            //     },
            //     {
            //         id: 8,
            //         selected: false,
            //         points: {
            //             frames: [11, 14.0],
            //             coordinates: [
            //                 [630, 630],
            //                 [640, 640],
            //             ],
            //         },
            //         labels: [
            //             {id: 2, name: 'label 2', color: '00ff00'},
            //         ],
            //     },
            // ],
        },
        computed: {

        },
        methods: {
            seek: function (time) {
                this.video.currentTime = time;
            },
            selectAnnotation: function (annotation, frameIndex) {
                this.deselectAnnotations();
                annotation.selected = frameIndex;
                this.seek(annotation.points.frames[frameIndex]);
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
        },
        created: function () {
            this.video.muted = true;
        },
        mounted: function () {
            // Wait for the sub-components to register their event listeners before
            // loading the video.
            this.video.src = VIDEO_SRC;
        },
    });
});
