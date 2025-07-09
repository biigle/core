<script>
import Keyboard from '@/core/keyboard.js';
import PowerToggle from '@/core/components/powerToggle.vue';
import ScreenshotButton from '@/annotations/components/screenshotButton.vue';
import Settings from '../stores/settings.js';

export default {
    template: '#settings-tab-template',
    emits: ['update'],
    components: {
        powerToggle: PowerToggle,
        screenshotButton: ScreenshotButton
    },
    props: {
        supportsJumpByFrame: {
            type: Boolean,
            default: false,
        },
        crossOriginError: {
            type: Boolean,
            default: false,
        },
        videoFilenames: {
            type: Array,
            default: () => []
        },
        currentId: {
            type: Number,
            default: -1,
        },
        map: {
            type: Object,
            default: null,
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
                'showMinimap',
                'autoplayDraw',
                'showLabelTooltip',
                'showMousePosition',
                'showProgressIndicator',
                'showThumbnailPreview',
                'enableJumpByFrame',
                'jumpStep',
                'muteVideo',
                'singleAnnotation',
                'restrictToBounds',
            ],
            annotationOpacity: 1,
            showMinimap: true,
            autoplayDraw: 0,
            showLabelTooltip: false,
            showMousePosition: false,
            playbackRate: 1.0,
            jumpStep: 5.0,
            showProgressIndicator: true,
            showThumbnailPreview: true,
            enableJumpByFrame: false,
            muteVideo: true,
            singleAnnotation: false,
            restrictToBounds: false,
        };
    },
    computed: {
        jumpByFrameNotSupported() {
            return !this.supportsJumpByFrame;
        },
    },
    methods: {
        handleShowMinimap() {
            this.showMinimap = true;
        },
        handleHideMinimap() {
            this.showMinimap = false;
        },
        handleShowLabelTooltip() {
            this.showLabelTooltip = true;
        },
        handleHideLabelTooltip() {
            this.showLabelTooltip = false;
        },
        handleShowMousePosition() {
            this.showMousePosition = true;
        },
        handleHideMousePosition() {
            this.showMousePosition = false;
        },
        handleShowProgressIndicator() {
            this.showProgressIndicator = true;
        },
        handleHideProgressIndicator() {
            this.showProgressIndicator = false;
        },
        handleShowThumbnailPreview() {
            this.showThumbnailPreview = true;
        },
        handleHideThumbnailPreview() {
            this.showThumbnailPreview = false;
        },
        handleEnableJumpByFrame() {
            this.enableJumpByFrame = true;
        },
        handleDisableJumpByFrame() {
            this.enableJumpByFrame = false;
        },
        handleMuteVideo() {
            this.muteVideo = true;
        },
        handleUnmuteVideo() {
            this.muteVideo = false;
        },
        handleSingleAnnotation() {
            this.singleAnnotation = true;
        },
        handleDisableSingleAnnotation() {
            this.singleAnnotation = false;
        },
        handleEnableRestrictToBounds() {
            this.restrictToBounds = true;
        },
        handleDisableRestrictToBounds() {
            this.restrictToBounds = false;
        },
        toggleAnnotationOpacity() {
            if (this.annotationOpacity > 0) {
                this.annotationOpacity = 0;
            } else {
                this.annotationOpacity = 1;
            }
        },
    },
    watch: {
        annotationOpacity(value) {
            value = parseFloat(value);
            if (!isNaN(value)) {
                this.$emit('update', 'annotationOpacity', value);
                Settings.set('annotationOpacity', value);
            }
        },
        showMinimap(show) {
            this.$emit('update', 'showMinimap', show);
            Settings.set('showMinimap', show);
        },
        autoplayDraw(value) {
            value = parseFloat(value);
            this.$emit('update', 'autoplayDraw', value);
            Settings.set('autoplayDraw', value);
        },
        showLabelTooltip(show) {
            this.$emit('update', 'showLabelTooltip', show);
            Settings.set('showLabelTooltip', show);
        },
        showMousePosition(show) {
            this.$emit('update', 'showMousePosition', show);
            Settings.set('showMousePosition', show);
        },
        playbackRate(value) {
            value = parseFloat(value);
            if (!isNaN(value)) {
                this.$emit('update', 'playbackRate', value);
            }
        },
        jumpStep(value) {
            value = parseFloat(value);
            this.$emit('update', 'jumpStep', value);
            Settings.set('jumpStep', value);
        },
        showProgressIndicator(show) {
            this.$emit('update', 'showProgressIndicator', show);
            Settings.set('showProgressIndicator', show);
        },
        showThumbnailPreview(show) {
            this.$emit('update', 'showThumbnailPreview', show);
            Settings.set('showThumbnailPreview', show);
        },
        enableJumpByFrame(show) {
            this.$emit('update', 'enableJumpByFrame', show);
            Settings.set('enableJumpByFrame', show);
        },
        muteVideo(show) {
            this.$emit('update', 'muteVideo', show);
            Settings.set('muteVideo', show);
        },
        singleAnnotation(show) {
            this.$emit('update', 'singleAnnotation', show);
            Settings.set('singleAnnotation', show);
        },
        restrictToBounds(enabled) {
            this.$emit('update', 'restrictToBounds', enabled);
            Settings.set('restrictToBounds', enabled);
        },
    },
    created() {
        this.restoreKeys.forEach((key) => {
            this[key] = Settings.get(key);
        });

        Keyboard.on('o', this.toggleAnnotationOpacity);
    },
};
</script>
