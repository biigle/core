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
        return {
            proxy: null,
            isVideoPopout: true,
            screenHeightOffset: 0,
            timelineHeightOffset: 0,
        };
    },
    computed: {},
    methods: {},
    created() {
        this.parent = window.opener.$videoContainer;
    },
};

const ignoreAttributes = [
    'isVideoPopout',
    'screenHeightOffset',
    'timelineHeightOffset',
];

Object.keys(VideoContainer.data())
    .concat(Object.keys(VideoContainer.computed))
    .concat(['loading']) // Comes from mixin which is not visible here.
    .filter(a => !ignoreAttributes.includes(a))
    .forEach(function (attribute) {
        proxy.computed[attribute] = function () {
            return this.parent[attribute];
        };
    });

Object.keys(VideoContainer.methods).forEach(function (method) {
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
