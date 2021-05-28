<script>
import LoaderComponent from '../components/loader';
import LoaderBlockComponent from '../components/loaderBlock';
import MessageCurtainComponent from '../components/messageCurtain';
import Messages from './../messages/store';

/**
 * A mixin for view models that have a loading state
 *
 * @type {Object}
 */
export default {
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
            return Messages.handleErrorResponse(response);
        },
    },
};
</script>
