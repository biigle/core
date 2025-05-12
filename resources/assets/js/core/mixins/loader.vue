<script>
import LoaderComponent from '../components/loader.vue';
import LoaderBlockComponent from '../components/loaderBlock.vue';
import MessageCurtainComponent from '../components/messageCurtain.vue';
import {handleErrorResponse} from '../messages/store.js';

/**
 * A mixin for view models that have a loading state
 *
 * @type {Object}
 */
export default {
    emits: ['loading'],
    components: {
        loader: LoaderComponent,
        loaderBlock: LoaderBlockComponent,
        messageCurtain: MessageCurtainComponent,
    },
    data() {
        return {
            instancesLoading: 0,
        };
    },
    computed: {
        loading() {
            return this.instancesLoading > 0;
        },
    },
    watch: {
        loading(loading) {
            this.$emit('loading', loading);
        },
    },
    methods: {
        startLoading() {
            this.instancesLoading += 1;
        },
        finishLoading() {
            if (this.instancesLoading > 0) {
                this.instancesLoading -= 1;
            }
        },
        handleErrorResponse(response) {
            return handleErrorResponse(response);
        },
    },
};
</script>
