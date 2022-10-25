<script>
import AnnotationTimeline from './components/charts/timelinePlot.vue';
import SankeyPlot from './components/charts/sankeyPlot.vue';
import PieChart from './components/charts/pieChart.vue';
import NetMap from './components/charts/netmapDisplay.vue';
import PieLabel from './components/charts/pieLabelChart.vue';

export default {
    data() {
        return {
            project: null,
            userId: null,
            annotationTimeSeries: null,
            volumeAnnotations: null,
            volumeNames: null,
            annotatedImages: null,
            totalImages: null,
            annotationLabels: null,
            sourceTargetLabels: null,
            totalVideos: null,
            annotatedVideos: null,
            annotationTimeSeriesVideo: null,
            volumeAnnotationsVideo: null,
            volumeNamesVideo: null,
            annotationLabelsVideo: null,
            sourceTargetLabelsVideo: null,
            showTimeline: true,
            showSankey: true,
            showPieLabel: true,
            showNetMap: true,
            container: "project-statistics",
            showImageVolumes: false,
            showVideoVolumes: false,
            volumes: null,
        };
    },
    components: {
        annotationTimeline: AnnotationTimeline,
        pieChart: PieChart,
        sankeyPlot: SankeyPlot,
        pieLabel: PieLabel,
        netMap: NetMap
    },
    computed: {
        toggleImageVolumesClass() {
            return this.showImageVolumes ? 'btn-info active' : 'btn-default';
        },
        toggleVideoVolumesClass() {
            return this.showVideoVolumes ? 'btn-info active' : 'btn-default';
        },
        hasVolumes() {
            return this.volumes.length > 0;
        },
        hasMixedMediaTypes() {
            return this.volumes.some((v) => v.media_type.name === 'image') && this.volumes.some((v) => v.media_type.name === 'video');
        },
        computedData() {
            if (this.showImageVolumes && !this.showVideoVolumes) {
                return {
                    annotationTimeSeries : this.annotationTimeSeries,
                    volumeAnnotations: this.volumeAnnotations,
                    volumeNames: this.volumeNames,
                    totalFiles: this.totalImages,
                    annotatedFiles: this.annotatedImages,
                    annotationLabels: this.annotationLabels,
                    sourceTargetLabels: this.sourceTargetLabels
                };
            } else if (!this.showImageVolumes && this.showVideoVolumes) {
                return {
                    annotationTimeSeries : this.annotationTimeSeriesVideo,
                    volumeAnnotations: this.volumeAnnotationsVideo,
                    volumeNames: this.volumeNamesVideo,
                    totalFiles: this.totalVideos,
                    annotatedFiles: this.annotatedVideos,
                    annotationLabels: this.annotationLabelsVideo,
                    sourceTargetLabels: this.sourceTargetLabelsVideo
                };
            } else {
                return {
                    annotationTimeSeries : this.mergedAnnotationTimeseries,
                    volumeAnnotations: this.volumeAnnotations.concat(this.volumeAnnotationsVideo),
                    volumeNames: this.volumeNames.concat(this.volumeNamesVideo),
                    totalFiles: this.totalImages + this.totalVideos,
                    annotatedFiles: this.annotatedImages + this.annotatedVideos,
                    annotationLabels: this.mergedAnnotationLabels,
                    sourceTargetLabels: this.mergedSourceTargetLabels,
                };
            }
        },
        subtitle() {
            let term = '';
            if (this.showImageVolumes) {
                term = 'image ';
            } else if (this.showVideoVolumes) {
                term = 'video ';
            }

            return [
                `per user annotations across all ${term}volumes of the project, sorted by year`,
                `(across all ${term}volumes of the project)`,
            ];
        },
        mergedAnnotationTimeseries() {
            let a = this.annotationTimeSeries;
            let b = this.annotationTimeSeriesVideo;
            let result = [];
            let ids = {};
            for (let itemA of a) {
                let newObject = Object.assign({}, itemA);
                ids[itemA.user_id + '-' + itemA.year] = true;
                for (let itemB of b) {
                    if (newObject.user_id === itemB.user_id && newObject.year === itemB.year) {
                        newObject.count += itemB.count;
                    }
                }
                result.push(newObject);
            }

            for (let itemB of b) {
                if (ids[itemB.user_id + '-' + itemB.year] !== true) {
                    result.push(Object.assign({}, itemB));
                }
            }

            return result;
        },
        mergedAnnotationLabels() {
            let a = this.annotationLabels;
            let b = this.annotationLabelsVideo;
            let result = [];
            let ids = {};
            for (let itemA of a) {
                let newObject = Object.assign({}, itemA);
                ids[itemA.id] = true;
                for (let itemB of b) {
                    if (newObject.id === itemB.id) {
                        newObject.count += itemB.count;
                    }
                }
                result.push(newObject);
            }

            for (let itemB of b) {
                if (ids[itemB.id] !== true) {
                    result.push(Object.assign({}, itemB));
                }
            }

            return result;
        },
        mergedSourceTargetLabels() {
            let a = this.sourceTargetLabels;
            let b = this.sourceTargetLabelsVideo;
            let result = {};
            for (let id in a) {
                // Concatenate and clone array, removing duplicate entries.
                result[id] = Array.from(new Set([...a[id], ...b[id] || []]));
            }

            for (let id in b) {
                if (!result[id]) {
                    // Only clone this time.
                    result[id] = b[id].slice();
                }
            }

            return result;
        },
    },
    methods: {
        toggleImageVolumes() {
            this.showVideoVolumes = false;
            this.showImageVolumes = !this.showImageVolumes;
        },
        toggleVideoVolumes() {
            this.showImageVolumes = false;
            this.showVideoVolumes = !this.showVideoVolumes;
        },
        checkForEmptyVals() {
            // check for each statistics-vis if corresponding arrays/objects are empty
            if (this.annotationTimeSeries.length === 0) {
                this.showTimeline = false;
            }

            if (this.volumeAnnotations.length === 0) {
                this.showSankey = false;
            }

            if (this.annotationLabels.length === 0) {
                this.showPieLabel = false;
            }

            if (Object.keys(this.sourceTargetLabels).length === 0 && this.annotationLabels.length === 0) {
                this.showNetMap = false;
            }
        },
    },
    created() {
        this.project = biigle.$require('projects.project');
        this.userId = biigle.$require('projects.userId');
        this.annotationTimeSeries = biigle.$require('projects.annotationTimeSeries');
        this.volumeAnnotations = biigle.$require('projects.volumeAnnotations');
        this.volumeNames = biigle.$require('projects.volumeNames');
        this.annotatedImages = biigle.$require('projects.annotatedImages');
        this.totalImages = biigle.$require('projects.totalImages');
        this.annotationLabels =  biigle.$require('projects.annotationLabels');
        this.sourceTargetLabels =  biigle.$require('projects.sourceTargetLabels');
        this.totalVideos = biigle.$require('projects.totalVideos');
        this.annotatedVideos = biigle.$require('projects.annotatedVideos');
        this.annotationTimeSeriesVideo = biigle.$require('projects.annotationTimeSeriesVideo');
        this.volumeAnnotationsVideo = biigle.$require('projects.volumeAnnotationsVideo');
        this.volumeNamesVideo = biigle.$require('projects.volumeNamesVideo');
        this.annotationLabelsVideo = biigle.$require('projects.annotationLabelsVideo');
        this.sourceTargetLabelsVideo = biigle.$require('projects.sourceTargetLabelsVideo');
        this.volumes = biigle.$require('projects.volumes');

        this.checkForEmptyVals();
    },
};
</script>

