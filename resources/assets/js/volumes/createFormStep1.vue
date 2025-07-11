<script>
import {Dropdown} from 'uiv';
import LoaderMixin from '@/core/mixins/loader.vue';

export const MEDIA_TYPE = {
    IMAGE: 'image',
    VIDEO: 'video',
};

export default {
    mixins: [LoaderMixin],
    components: {
        Dropdown,
    },
    data() {
        return {
            mediaType: MEDIA_TYPE.IMAGE,
            hasFile: false,
            initialized: false,
            parsers: [],
            selectedParser: null,
            selectedAnnotationTools: [
                'point', 'rectangle', 'circle', 'ellipse', 'linestring', 'measure', 
                'polygon', 'polygonbrush', 'polygonEraser', 'polygonFill', 'magicwand', 'magicsam'
            ],
        };
    },
    computed: {
        isImageMediaType() {
            return this.mediaType === MEDIA_TYPE.IMAGE;
        },
        isVideoMediaType() {
            return this.mediaType === MEDIA_TYPE.VIDEO;
        },
        imageTypeButtonClass() {
            return {
                active: this.isImageMediaType,
                'btn-info': this.isImageMediaType,
            };
        },
        videoTypeButtonClass() {
            return {
                active: this.isVideoMediaType,
                'btn-info': this.isVideoMediaType,
            };
        },
        fileButtonClass() {
            return {
                active: this.hasFile,
                'btn-info': this.hasFile,
            };
        },
        availableParsers() {
            return this.parsers[this.mediaType] || [];
        },
        allAnnotationToolsSelected() {
            // All 11 tools: point, rectangle, circle, ellipse, linestring, measure, polygon, polygonbrush, polygonEraser, polygonFill, magicwand, magicsam
            return this.selectedAnnotationTools.length === 12;
        },
        allToolsSelectedText() {
            return this.allAnnotationToolsSelected ? 'Deselect all tools' : 'Select all tools';
        },
        toggleAllToolsIcon() {
            return this.allAnnotationToolsSelected ? 'fa fa-times' : 'fa fa-check';
        },
    },
    methods: {
        selectImageMediaType() {
            this.mediaType = MEDIA_TYPE.IMAGE;
        },
        selectVideoMediaType() {
            this.mediaType = MEDIA_TYPE.VIDEO;
        },
        selectFile(parser) {
            this.selectedParser = parser;
            // Use $nextTick so the input element will have the appropriate MIME type
            // filter from the selected parser.
            this.$nextTick(() => this.$refs.metadataFileField.click());
        },
        handleSelectedFile() {
            this.hasFile = this.$refs.metadataFileField.files.length > 0;
        },
        toggleAllAnnotationTools() {
            if (this.allAnnotationToolsSelected) {
                this.selectedAnnotationTools = [];
            } else {
                this.selectedAnnotationTools = [
                    'point', 'rectangle', 'circle', 'ellipse', 'linestring', 'measure', 
                    'polygon', 'polygonbrush', 'polygonEraser', 'polygonFill', 'magicwand', 'magicsam'
                ];
            }
        },
    },
    created() {
        this.mediaType = biigle.$require('volumes.mediaType');
        this.parsers = biigle.$require('volumes.parsers');
        // Used to hide a dummy button that masks a flashing selected state on load.
        this.initialized = true;
    },
};
</script>
