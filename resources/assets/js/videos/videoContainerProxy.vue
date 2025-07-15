<script>
import Events from '@/core/events.js';
import Keyboard from '@/core/keyboard.js';
import LoaderBlock from '@/core/components/loaderBlock.vue';
import MessageCurtain from '@/core/components/messageCurtain.vue';
import Messages from '@/core/messages/store.js';
import ScreenshotButton from '@/annotations/components/screenshotButton.vue';
import VideoContainer from './videoContainer.vue';
import VideoScreen from './components/videoScreen.vue';
import VideoTimeline from './components/videoTimeline.vue';

const proxy = {
    components: {
        videoScreen: VideoScreen,
        videoTimeline: VideoTimeline,
        loaderBlock: LoaderBlock,
        messageCurtain: MessageCurtain,
        screenshotButton: ScreenshotButton,
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
        forwardKeypress(e) {
            window.opener.document.body.dispatchEvent(new KeyboardEvent('keydown', {
                key: e.key,
                altKey: e.altKey,
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
                shiftKey: e.shiftKey,
            }));
            window.opener.document.body.dispatchEvent(new KeyboardEvent('keyup', {key: e.key}));
        },
        bindProxyShortcuts() {
            Keyboard.on('Delete', this.deleteSelectedAnnotationsOrKeyframes, 0, this.listenerSet);
            Keyboard.on('C', this.forwardKeypress, 0, this.listenerSet);
            Keyboard.on(' ', this.forwardKeypress, 0, this.listenerSet);
            Keyboard.on('1', this.forwardKeypress, 0, this.listenerSet);
            Keyboard.on('2', this.forwardKeypress, 0, this.listenerSet);
            Keyboard.on('3', this.forwardKeypress, 0, this.listenerSet);
            Keyboard.on('4', this.forwardKeypress, 0, this.listenerSet);
            Keyboard.on('5', this.forwardKeypress, 0, this.listenerSet);
            Keyboard.on('6', this.forwardKeypress, 0, this.listenerSet);
            Keyboard.on('7', this.forwardKeypress, 0, this.listenerSet);
            Keyboard.on('8', this.forwardKeypress, 0, this.listenerSet);
            Keyboard.on('9', this.forwardKeypress, 0, this.listenerSet);
            Keyboard.on('0', this.forwardKeypress, 0, this.listenerSet);
            Keyboard.on('Tab', this.forwardKeypress, 0, this.listenerSet);
            Keyboard.on('o', this.forwardKeypress, 0, this.listenerSet);
        },
        releaseProxyShortcuts() {
            Keyboard.off('Delete', this.deleteSelectedAnnotationsOrKeyframes, this.listenerSet);
            Keyboard.off('C', this.forwardKeypress, this.listenerSet);
            Keyboard.off(' ', this.forwardKeypress, this.listenerSet);
            Keyboard.on('1', this.forwardKeypress, this.listenerSet);
            Keyboard.on('2', this.forwardKeypress, this.listenerSet);
            Keyboard.on('3', this.forwardKeypress, this.listenerSet);
            Keyboard.on('4', this.forwardKeypress, this.listenerSet);
            Keyboard.on('5', this.forwardKeypress, this.listenerSet);
            Keyboard.on('6', this.forwardKeypress, this.listenerSet);
            Keyboard.on('7', this.forwardKeypress, this.listenerSet);
            Keyboard.on('8', this.forwardKeypress, this.listenerSet);
            Keyboard.on('9', this.forwardKeypress, this.listenerSet);
            Keyboard.on('0', this.forwardKeypress, this.listenerSet);
            Keyboard.on('Tab', this.forwardKeypress, this.listenerSet);
            Keyboard.on('o', this.forwardKeypress, this.listenerSet);
        },
        handleInitMap(map) {
            Events.emit('videos.map.init', map);
            this.parent.handleInitMap(map);
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
