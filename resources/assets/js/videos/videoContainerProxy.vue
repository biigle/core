<script>
import LoaderBlock from '@/core/components/loaderBlock.vue';
import MessageCurtain from '@/core/components/messageCurtain.vue';
import VideoScreen from './components/videoScreen.vue';
import VideoTimeline from './components/videoTimeline.vue';
import VideoContainer from './videoContainer.vue';

const proxy = {
    components: {
        videoScreen: VideoScreen,
        videoTimeline: VideoTimeline,
        loaderBlock: LoaderBlock,
        messageCurtain: MessageCurtain,
    },
    data() {
        const data = VideoContainer.data();

        data.loading = false;
        data.isVideoPopout = true;

        return data;
    },
    computed: VideoContainer.computed,
    methods: {
        mountProxyWatchers() {
            const ignoreAttributes = [
                'settings',
                'isVideoPopout',
            ];

            const data = VideoContainer.data();

            // TODO deep watch?
            Object.keys(data)
                .concat(['loading']) // Comes from mixin which is not visible here.
                .filter(a => !ignoreAttributes.includes(a))
                .forEach((attribute) => {
                    this.parent.$watch(attribute, {
                        handler: (v) => {
                            this[attribute] = v;
                        },
                        immediate: true,
                    });
                });

            Object.keys(data.settings)
                .forEach((attribute) => {
                    this.parent.$watch('settings.' + attribute, {
                        handler: (v) => {
                            this.settings[attribute] = v;
                        },
                        immediate: true,
                    });
                });
        },
    },
    created() {
        this.parent = window.opener.$videoContainer;
        this.mountProxyWatchers();
    },
};

Object.keys(VideoContainer.methods)
    // Comes from mixin which is not visible here.
    .concat(['startLoading', 'finishLoading', 'handleErrorResponse'])
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
