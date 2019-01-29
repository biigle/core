/**
 * Annotation model.
 *
 * @type {Object}
 */
biigle.$declare('videos.models.Annotation', function () {
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
            };
        },
        computed: {
            shape: function () {
                return biigle.$require('videos.shapes')[this.shape_id];
            },
        },
        watch: {
            points: function (points) {
                this.revision += 1;
            },
        },
    });
});
