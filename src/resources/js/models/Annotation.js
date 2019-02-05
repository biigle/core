/**
 * Annotation model.
 *
 * @type {Object}
 */
biigle.$declare('videos.models.Annotation', function () {
    var ANNOTATION_API = biigle.$require('videos.api.videoAnnotations');
    var POLL_INTERVAL = 5000;
    var MSG = biigle.$require('messages.store');

    return Vue.extend({
        data: function () {
            return {
                id: 0,
                frames: [],
                points: [],
                video_id: 0,
                shape_id: 0,
                created_at: '',
                updated_at: '',
                labels: [],
                selected: false,
                revision: 1,
                tracking: false,
            };
        },
        computed: {
            shape: function () {
                return biigle.$require('videos.shapes')[this.shape_id];
            },
        },
        methods: {
            startPollTracking: function () {
                this.tracking = true;
                this.continuePollTracking();
            },
            pollTracking: function () {
                ANNOTATION_API.get({id: this.id})
                    .then(this.maybeFinishPollTracking, this.cancelPollTracking);
            },
            maybeFinishPollTracking: function (response) {
                var annotation = response.body;
                if (annotation.frames.length > 1) {
                    this.tracking = false;
                    this.frames = annotation.frames;
                    this.points = annotation.points;
                } else {
                    this.continuePollTracking();
                }
            },
            continuePollTracking: function () {
                this.pollTimeout = window.setTimeout(this.pollTracking, POLL_INTERVAL);
            },
            cancelPollTracking: function () {
                MSG.danger('Tracking of annotation ' + this.id + ' failed.');
                this.tracking = false;
                this.$emit('tracking-failed', this);
            },
        },
        watch: {
            points: function (points) {
                this.revision += 1;
            },
        },
    });
});
