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
            annotations: [
                {
                    id: 1,
                    selected: false,
                    points: {
                        frames: [5.0, 7.5, 10.0],
                        coordinates: [
                            [100, 100],
                            [100, 200],
                            [200, 100],
                        ],
                    },
                    labels: [
                        {id: 1, name: 'label 1', color: 'ff00ff'},
                        {id: 2, name: 'label 2', color: '00ff00'},
                    ],
                },
                {
                    id: 2,
                    selected: false,
                    points: {
                        frames: [2.5],
                        coordinates: [[500, 500]],
                    },
                    labels: [
                        {id: 1, name: 'label 1', color: 'ff00ff'},
                    ],
                },
                {
                    id: 22,
                    selected: false,
                    points: {
                        frames: [3.5],
                        coordinates: [[500, 500]],
                    },
                    labels: [
                        {id: 1, name: 'label 1', color: 'ff00ff'},
                    ],
                },
                {
                    id: 3,
                    selected: false,
                    points: {
                        frames: [9.0, 13.0],
                        coordinates: [
                            [500, 500],
                            [600, 600],
                        ],
                    },
                    labels: [
                        {id: 1, name: 'label 1', color: 'ff00ff'},
                    ],
                },
                {
                    id: 33,
                    selected: false,
                    points: {
                        frames: [2.0, 3.0, 4.0, 5.0, 6.0],
                        coordinates: [
                            [500, 500],
                            [510, 510],
                            [530, 530],
                            [560, 560],
                            [600, 600],
                        ],
                    },
                    labels: [
                        {id: 1, name: 'label 1', color: 'ff00ff'},
                    ],
                },
                {
                    id: 4,
                    selected: false,
                    points: {
                        frames: [1.0, 4.5],
                        coordinates: [
                            [300, 300],
                            [300, 400],
                        ],
                    },
                    labels: [
                        {id: 2, name: 'label 2', color: '00ff00'},
                    ],
                },
                {
                    id: 5,
                    selected: false,
                    points: {
                        frames: [1.0, 4.0],
                        coordinates: [
                            [300, 300],
                            [300, 400],
                        ],
                    },
                    labels: [
                        {id: 2, name: 'label 2', color: '00ff00'},
                    ],
                },
                {
                    id: 6,
                    selected: false,
                    points: {
                        frames: [4.0, 11.0],
                        coordinates: [
                            [600, 600],
                            [600, 500],
                        ],
                    },
                    labels: [
                        {id: 2, name: 'label 2', color: '00ff00'},
                    ],
                },
                {
                    id: 7,
                    selected: false,
                    points: {
                        frames: [10.5, 14.0],
                        coordinates: [
                            [600, 600],
                            [600, 500],
                        ],
                    },
                    labels: [
                        {id: 2, name: 'label 2', color: '00ff00'},
                    ],
                },
                {
                    id: 7,
                    selected: false,
                    points: {
                        frames: [11, 14.0],
                        coordinates: [
                            [600, 600],
                            [600, 500],
                        ],
                    },
                    labels: [
                        {id: 2, name: 'label 2', color: '00ff00'},
                    ],
                },
            ],
        },
        computed: {

        },
        methods: {
            seek: function (time) {
                this.video.currentTime = time;
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
