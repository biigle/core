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
            filterString: '',
            fullHeight: 0,
        },
        computed: {
            filteredVideos: function () {
                if (this.hasFiltering) {
                    var filterString = this.filterString.toLowerCase();

                    return this.videos.filter(function (video) {
                        return video.name.toLowerCase().indexOf(filterString) !== -1;
                    });
                }

                return this.videos;
            },
            hasFiltering: function () {
                return this.filterString.length > 0;
            },
            filterInputClass: function () {
                return this.hasFiltering ? 'panel-filter--active' : '';
            },
            hasVideos: function () {
                return this.videos.length > 0;
            },
            panelStyle: function () {
                if (this.hasFiltering) {
                    return {
                        height: this.fullHeight + 'px',
                    };
                }

                return {};
            },
            hasNoMatchingVideos: function () {
                return this.hasVideos && this.filteredVideos.length === 0;
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
                    this.$nextTick(this.updateFullHeight);
                }).bind(this);
            },
            clearFiltering: function () {
                this.filterString = '';
            },
            updateFullHeight: function () {
                this.fullHeight = this.$el.offsetHeight;
            },
        },
        mounted: function () {
            this.updateFullHeight();
        },
    });
});
