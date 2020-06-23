import {handleErrorResponse} from './import';
import {LabelTreeVersionApi} from './import';
import {LoaderMixin} from './import';
import {Messages} from './import';

/**
 * The panel for editing the information of a label tree version
 */
export default {
    mixins: [LoaderMixin],
    data: {
        version: null,
        redirectUrl: null,
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
