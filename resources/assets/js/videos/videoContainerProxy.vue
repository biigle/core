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
import LoaderMixin from '@/core/mixins/loader.vue';
import LabelbotMixin from '@/annotations/mixins/labelbot.vue';

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
        Object.keys(VideoContainer.computed)
            .concat(Object.keys(LoaderMixin.data()))
            .concat(Object.keys(LoaderMixin.computed))
            .concat(Object.keys(LabelbotMixin.data()))
            .concat(Object.keys(LabelbotMixin.computed))
            .forEach(k => data[k] = null);

        data.loading = false;
        data.isVideoPopout = true;

        return data;
    },
    provide() {
        return {
            labelTrees: this.labelTrees,
        };
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
                .concat(Object.keys(LoaderMixin.data()))
                .concat(Object.keys(LabelbotMixin.data()))
                .concat(Object.keys(LabelbotMixin.computed))
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
        handleInitMap(map) {
            Events.emit('videos.map.init', map);
            this.parent.handleInitMap(map);
        },
        handleReachedAnnotation() {
            // Ignore this event from the timeline of the popup. The event from the
            // timeline of the main window will be handled.
        },
    },
    watch: {
        labelbotOverlayCount(count) {
            if (count > 0) {
                Keyboard.setActiveSet('labelbot');
            } else {
                Keyboard.setActiveSet('default');
            }
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
};

Object.keys(VideoContainer.methods)
    // Comes from mixin which is not visible here.
    .concat(Object.keys(LoaderMixin.methods))
    .concat(Object.keys(LabelbotMixin.methods))
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
