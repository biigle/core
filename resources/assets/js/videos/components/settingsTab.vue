<script>
import PowerToggle from '../../core/components/powerToggle';
import Settings from '../stores/settings';

export default {
    components: {
        powerToggle: PowerToggle,
    },
    props: {
        supportsJumpByFrame: {
            type: Boolean,
            default: false,
        },
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
                'enableJumpByFrame',
            ],
            annotationOpacity: 1,
            showMinimap: true,
            autoplayDraw: 0,
            showLabelTooltip: false,
            showMousePosition: false,
            playbackRate: 1.0,
            showProgressIndicator: true,
            enableJumpByFrame: false,
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
        handleEnableJumpByFrame() {
            this.enableJumpByFrame = true;
        },
        handleDisableJumpByFrame() {
            this.enableJumpByFrame = false;
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
        showProgressIndicator(show) {
            this.$emit('update', 'showProgressIndicator', show);
            Settings.set('showProgressIndicator', show);
        },
        enableJumpByFrame(show) {
            this.$emit('update', 'enableJumpByFrame', show);
            Settings.set('enableJumpByFrame', show);
        }
    },
    created() {
        this.restoreKeys.forEach((key) => {
            this[key] = Settings.get(key);
        });
    },
};
</script>
