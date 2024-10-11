<script>
import {Dropdown} from 'uiv';
import LabelTreeVersionApi from '@/core/api/labelTreeVersion.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import Messages from '@/core/messages/store.vue';
import {handleErrorResponse} from '@/core/messages/store.vue';

/**
 * The panel for editing the information of a label tree version
 */
export default {
    mixins: [LoaderMixin],
    components: {
        dropdown: Dropdown,
    },
    data() {
        return {
            version: null,
            redirectUrl: null,
        };
    },
    computed: {
        disabledClass() {
            return this.loading ? 'disabled' : '';
        },
    },
    methods: {
        deleteVersion() {
            this.startLoading();
            LabelTreeVersionApi.delete({id: this.version.id})
                .then(this.deleteSuccess, handleErrorResponse);
        },
        deleteSuccess() {
            Messages.success('The label tree version was deleted. Redirecting...');
            setTimeout(() => location.href = this.redirectUrl, 2000);
        },
    },
    created() {
        this.version = biigle.$require('labelTrees.version');
        this.redirectUrl = biigle.$require('labelTrees.redirectUrl');
    },
};
</script>
