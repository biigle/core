<script>
import PowerToggle from '../../core/components/powerToggle';
import Settings from '../stores/settings';
import ScreenshotButton from '../../annotations/components/screenshotButton.vue';

export default {
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
        videosObj: {
            type: Object,
            default: () => {}
        },
        currentId: {
            type: Number,
            default: -1,
        },
        map: {
            type: Object,
            default: null,
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
    },
    created() {
        this.restoreKeys.forEach((key) => {
            this[key] = Settings.get(key);
        });
    },
};
</script>
