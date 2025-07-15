<script>
import ExportArea from './exportArea.vue';
import Keyboard from '@/core/keyboard.js';
import PowerToggle from '@/core/components/powerToggle.vue';
import ScreenshotButton from './screenshotButton.vue';
import Settings from '../stores/settings.js';
import {TIMEOUTS} from '../components/labelbotPopup.vue';

/**
 * Additional components that can be dynamically added by other Biigle modules via
 * view mixins. These components are meant for the "annotationsSettingsTab" view mixin
 * mount point.
 *
 * @type {Object}
 */
export let plugins = {};

/**
 * The settings tab of the annotator
 *
 * @type {Object}
 */
export default {
    template: '#settings-tab-template',
    emits: ['change'],
    components: {
        screenshotButton: ScreenshotButton,
        powerToggle: PowerToggle,
        exportArea: ExportArea,
    },
    props: {
        image: {
            type: Object,
            default: null,
        },
        imageFilenames: {
            type: Array,
            default: () => [],
        },
        currentId: {
            type: Number,
            default: -1,
        },
        ids: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            restoreKeys: [
                'annotationOpacity',
                'cachedImagesCount',
                'mousePosition',
                'zoomLevel',
                'scaleLine',
                'labelTooltip',
                'measureTooltip',
                'minimap',
                'progressIndicator',
                'exampleAnnotations',
                'labelbotTimeout',
            ],
            annotationOpacity: 1.0,
            cachedImagesCount: 1,
            mousePosition: false,
            zoomLevel: false,
            scaleLine: false,
            labelTooltip: false,
            measureTooltip: false,
            minimap: true,
            progressIndicator: true,
            exampleAnnotations: true,
            labelbotTimeout: 1,
            labelbotTimeoutMax: TIMEOUTS.length - 1,
        };
    },
    computed: {
        plugins() {
            return plugins;
        },
        crossOrigin() {
            return this.image && this.image.crossOrigin;
        },
        settings() {
            return Settings;
        },
        labelbotTimeoutValue() {
            return TIMEOUTS[this.labelbotTimeout];
        },
    },
    methods: {
        showMousePosition() {
            this.mousePosition = true;
        },
        hideMousePosition() {
            this.mousePosition = false;
        },
        showZoomLevel() {
            this.zoomLevel = true;
        },
        hideZoomLevel() {
            this.zoomLevel = false;
        },
        showScaleLine() {
            this.scaleLine = true;
        },
        hideScaleLine() {
            this.scaleLine = false;
        },
        showLabelTooltip() {
            this.labelTooltip = true;
            this.measureTooltip = false;
        },
        hideLabelTooltip() {
            this.labelTooltip = false;
        },
        showMeasureTooltip() {
            this.measureTooltip = true;
            this.labelTooltip = false;
        },
        hideMeasureTooltip() {
            this.measureTooltip = false;
        },
        showMinimap() {
            this.minimap = true;
        },
        hideMinimap() {
            this.minimap = false;
        },
        showProgressIndicator() {
            this.progressIndicator = true;
        },
        hideProgressIndicator() {
            this.progressIndicator = false;
        },
        toggleAnnotationOpacity() {
            if (this.annotationOpacity > 0) {
                this.annotationOpacity = 0;
            } else {
                this.annotationOpacity = 1;
            }
        },
        showExampleAnnotations() {
            this.exampleAnnotations = true;
        },
        hideExampleAnnotations() {
            this.exampleAnnotations = false;
        },
    },
    watch: {
        annotationOpacity(opacity) {
            opacity = parseFloat(opacity);
            this.$emit('change', 'annotationOpacity', opacity);
            this.settings.set('annotationOpacity', opacity);
        },
        cachedImagesCount(amount) {
            amount = parseInt(amount);
            this.$emit('change', 'cachedImagesCount', amount);
            this.settings.set('cachedImagesCount', amount);
        },
        labelbotTimeout(index) {
            index = parseInt(index);
            this.$emit('change', 'labelbotTimeout', index);
            this.settings.set('labelbotTimeout', index);
        },
        mousePosition(show) {
            this.$emit('change', 'mousePosition', show);
            this.settings.set('mousePosition', show);
        },
        zoomLevel(show) {
            this.$emit('change', 'zoomLevel', show);
            this.settings.set('zoomLevel', show);
        },
        scaleLine(show) {
            this.$emit('change', 'scaleLine', show);
            this.settings.set('scaleLine', show);
        },
        labelTooltip(show) {
            this.$emit('change', 'labelTooltip', show);
            this.settings.set('labelTooltip', show);
        },
        measureTooltip(show) {
            this.$emit('change', 'measureTooltip', show);
            this.settings.set('measureTooltip', show);
        },
        minimap(show) {
            this.$emit('change', 'minimap', show);
            this.settings.set('minimap', show);
        },
        progressIndicator(show) {
            this.$emit('change', 'progressIndicator', show);
            this.settings.set('progressIndicator', show);
        },
        exampleAnnotations(show) {
            this.$emit('change', 'exampleAnnotations', show);
            this.settings.set('exampleAnnotations', show);
        },
    },
    created() {
        this.restoreKeys.forEach((key) => {
            this[key] = this.settings.get(key);
        });
        Keyboard.on('o', this.toggleAnnotationOpacity);
    },
};
</script>
