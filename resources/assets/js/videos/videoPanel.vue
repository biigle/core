<script>
import VideosApi from './api/videos';
import {EditorMixin} from './import';
import {handleErrorResponse} from './import';
import {LoaderMixin} from './import';
import {PreviewThumbnail} from './import';

/**
 * The video list on the project show view.
 */
export default {
    mixins: [
        LoaderMixin,
        EditorMixin,
    ],
    components: {
        previewThumbnail: PreviewThumbnail,
    },
    data() {
        return {
            project: null,
            videos: [],
            filterString: '',
            fullHeight: 0,
        };
    },
    computed: {
        filteredVideos() {
            if (this.hasFiltering) {
                let filterString = this.filterString.toLowerCase();

                return this.videos.filter(
                    (video) => video.name.toLowerCase().indexOf(filterString) !== -1
                );
            }

            return this.videos;
        },
        hasFiltering() {
            return this.filterString.length > 0;
        },
        filterInputClass() {
            return this.hasFiltering ? 'panel-filter--active' : '';
        },
        hasVideos() {
            return this.videos.length > 0;
        },
        panelStyle() {
            if (this.hasFiltering) {
                return {
                    height: this.fullHeight + 'px',
                };
            }

            return {};
        },
        hasNoMatchingVideos() {
            return this.hasVideos && this.filteredVideos.length === 0;
        },
    },
    methods: {
        deleteVideo(video, force) {
            VideosApi.delete({id: video.id}, {force: !!force})
                .then(this.videoDeleted(video), this.maybeForceDelete(video));
        },
        maybeForceDelete(video) {
            return (response) => {
                if (response.status === 422) {
                    if (confirm('Deleting the video would delete annotations. Do you want to delete the video and the annotations?')) {
                        this.deleteVideo(video, true);
                    }

                    return;
                }

                handleErrorResponse(response);
            };
        },
        videoDeleted(video) {
            return () => {
                let index = this.videos.indexOf(video);
                if (index !== -1) {
                    this.videos.splice(index, 1);
                }
                this.$nextTick(this.updateFullHeight);
            };
        },
        clearFiltering() {
            this.filterString = '';
        },
        updateFullHeight() {
            this.fullHeight = this.$el.offsetHeight;
        },
    },
    created() {
        this.project = biigle.$require('projects.project');
        this.videos = biigle.$require('projects.videos');
    },
    mounted() {
        this.updateFullHeight();
    },
};
</script>
