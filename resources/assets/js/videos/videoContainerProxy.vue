<script>
import Keyboard from '@/core/keyboard.js';
import LoaderBlock from '@/core/components/loaderBlock.vue';
import MessageCurtain from '@/core/components/messageCurtain.vue';
import Messages from '@/core/messages/store.js';
import VideoContainer from './videoContainer.vue';
import VideoScreen from './components/videoScreen.vue';
import VideoTimeline from './components/videoTimeline.vue';

const proxy = {
    components: {
        videoScreen: VideoScreen,
        videoTimeline: VideoTimeline,
        loaderBlock: LoaderBlock,
        messageCurtain: MessageCurtain,
    },
    data() {
        const data = VideoContainer.data();
        Object.keys(VideoContainer.computed).forEach(k => data[k] = null);
        data.loading = false;
        data.isVideoPopout = true;

        return data;
    },
    computed: {},
    methods: {
        mountProxyWatchers() {
            const data = VideoContainer.data();
            const ignoreAttributes = [
                'settings',
                'isVideoPopout',
            ];

            Object.keys(data)
                .concat(['loading']) // Comes from mixin which is not visible here.
                .concat(Object.keys(VideoContainer.computed))
                .filter(a => !ignoreAttributes.includes(a))
                .forEach((attribute) => {
                    this.parent.$watch(attribute, {
                        handler: v => this[attribute] = v,
                        immediate: true,
                    });
                });

            // The settings must be watched one level deeper. VideoContainer also has
            // the urlParams one level deeper but these are irrelevant in the proxy.
            Object.keys(data.settings)
                .forEach((attribute) => {
                    this.parent.$watch('settings.' + attribute, {
                        handler: v => this.settings[attribute] = v,
                        immediate: true,
                    });
                });
        },
        // These methods need special treatment.
        handleRequiresSelectedLabel() {
            Messages.info('Please select a label first.');
            this.parent.handleRequiresSelectedLabel();
        },
        showPreviousVideo() {
            this.reset();
            this.parent.showPreviousVideo();
        },
        showNextVideo() {
            this.reset();
            this.parent.showNextVideo();
        },
        reset() {
            this.$refs.videoTimeline.reset();
            this.$refs.videoScreen.reset();
        },
        deleteSelectedAnnotationsOrKeyframes() {
            if (this.selectedAnnotations.length === 0) {
                return;
            }

            // Override this method to show the confirmation dialog in the window the
            // deletion was requested.
            if (confirm('Are you sure that you want to delete all selected annotations/keyframes?')) {
                this.parent.deleteSelectedAnnotationsOrKeyframes(true);
            }
        },
        bindProxyShortcuts() {
            Keyboard.on('C', this.selectLastAnnotation, 0, this.listenerSet);
            Keyboard.on('Delete', this.deleteSelectedAnnotationsOrKeyframes, 0, this.listenerSet);
            Keyboard.on(' ', this.togglePlaying, 0, this.listenerSet);
        },
        releaseProxyShortcuts() {
            Keyboard.off('C', this.selectLastAnnotation, this.listenerSet);
            Keyboard.off('Delete', this.deleteSelectedAnnotationsOrKeyframes, this.listenerSet);
            Keyboard.off(' ', this.togglePlaying, this.listenerSet);
        },
    },
    created() {
        this.parent = window.opener?.$videoContainer;
        if (this.parent) {
            this.mountProxyWatchers();
            this.bindProxyShortcuts();
        } else {
            Messages.danger('This page must be called from the video annotation tool.');
        }
    },
    beforeUnmount() {
        if (this.parent) {
            this.releaseProxyShortcuts();
        }
    },
};

Object.keys(VideoContainer.methods)
    // Comes from mixin which is not visible here.
    .concat(['startLoading', 'finishLoading', 'handleErrorResponse'])
    .filter(method => !proxy.methods.hasOwnProperty(method))
    .forEach(function (method) {
        proxy.methods[method] = function () {
            return this.parent[method].apply(this.parent, arguments);
        };
    });

export default proxy;
</script>
<style>
    .video-popup {
        display: flex;
        height: 100vh;
        flex-direction: column;
    }
    .video-popup .video-screen {
        flex: 1;
    }
</style>
