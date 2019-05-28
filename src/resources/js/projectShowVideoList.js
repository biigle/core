/**
 * The video list on the project show view.
 */
biigle.$viewModel('projects-show-video-list', function (element) {
    var VIDEOS_API = biigle.$require('videos.api.videos');
    var MSG = biigle.$require('messages.store');

    new Vue({
        el: element,
        mixins: [
            biigle.$require('core.mixins.loader'),
            biigle.$require('core.mixins.editor'),
        ],
        components: {
            previewThumbnail: biigle.$require('projects.components.previewThumbnail'),
        },
        data: {
            project: biigle.$require('projects.project'),
            videos: biigle.$require('projects.videos'),
        },
        computed: {
            hasNoVideos: function () {
                return this.videos.length === 0;
            },
        },
        methods: {
            deleteVideo: function (video, force) {
                VIDEOS_API.delete({id: video.id}, {force: !!force})
                    .then(this.videoDeleted(video), this.maybeForceDelete(video));
            },
            maybeForceDelete: function (video) {
                return (function (response) {
                    if (response.status === 422) {
                        if (confirm('Deleting the video would delete annotations. Do you want to delete the video and the annotations?')) {
                            this.deleteVideo(video, true);
                        }

                        return;
                    }

                    MSG.handleResponseError(response);
                }).bind(this);
            },
            videoDeleted: function (video) {
                return (function () {
                    var index = this.videos.indexOf(video);
                    if (index !== -1) {
                        this.videos.splice(index, 1);
                    }
                }).bind(this);
            },
        },
    });
});
