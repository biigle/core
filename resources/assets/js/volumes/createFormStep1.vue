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
            selectedImageAnnotationTools: [
                'point', 'rectangle', 'circle', 'ellipse', 'linestring', 'measure', 
                'polygon', 'polygonbrush', 'polygonEraser', 'polygonFill', 'magicwand', 'magicsam'
            ],
            selectedVideoAnnotationTools: [
                'point', 'rectangle', 'circle', 'linestring', 'polygon', 'wholeframe'
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
        availableAnnotationTools() {
            if (this.isVideoMediaType) {
                // Video volumes support: point, rectangle, circle, linestring, polygon, polygonbrush, polygonEraser, polygonFill, wholeframe
                return ['point', 'rectangle', 'circle', 'linestring', 'polygon', 'polygonbrush', 'polygonEraser', 'polygonFill', 'wholeframe'];
            } else {
                // Image volumes support all tools except wholeframe
                return [
                    'point', 'rectangle', 'circle', 'ellipse', 'linestring', 'measure', 
                    'polygon', 'polygonbrush', 'polygonEraser', 'polygonFill', 'magicwand', 'magicsam'
                ];
            }
        },
        selectedAnnotationTools: {
            get() {
                return this.isVideoMediaType ? this.selectedVideoAnnotationTools : this.selectedImageAnnotationTools;
            },
            set(value) {
                if (this.isVideoMediaType) {
                    this.selectedVideoAnnotationTools = value;
                } else {
                    this.selectedImageAnnotationTools = value;
                }
            }
        },
        allAnnotationToolsSelected() {
            return this.selectedAnnotationTools.length === this.availableAnnotationTools.length;
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
            this.updateToolsForMediaType();
        },
        selectVideoMediaType() {
            this.mediaType = MEDIA_TYPE.VIDEO;
            this.updateToolsForMediaType();
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
                this.selectedAnnotationTools = [...this.availableAnnotationTools];
            }
        },
        updateToolsForMediaType() {
            // Each media type now has its own tool selection, so we just need to
            // ensure that the current selection has appropriate tools enabled
            const currentTools = this.selectedAnnotationTools;
            
            // If no tools are selected for this media type, select all available tools
            if (currentTools.length === 0) {
                this.selectedAnnotationTools = [...this.availableAnnotationTools];
            } else {
                // Filter out any tools that are not available for this media type
                const filteredTools = currentTools.filter(tool => 
                    this.availableAnnotationTools.includes(tool)
                );
                
                // If filtering removed all tools, select all available tools
                if (filteredTools.length === 0) {
                    this.selectedAnnotationTools = [...this.availableAnnotationTools];
                } else {
                    this.selectedAnnotationTools = filteredTools;
                }
            }
        },
    },
    created() {
        this.mediaType = biigle.$require('volumes.mediaType');
        this.parsers = biigle.$require('volumes.parsers');
        // Update tools for the initial media type
        this.updateToolsForMediaType();
        // Used to hide a dummy button that masks a flashing selected state on load.
        this.initialized = true;
    },
};
</script>
