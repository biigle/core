<script>
import LoaderMixin from './loader.vue';
import UsersApi from '../api/users.js';
import {handleErrorResponse} from '../messages/store.vue';

/**
 * A mixin for the notification settings view.
 *
 * @type {Object}
 */
export default {
    mixins: [LoaderMixin],
    data() {
        return {
            settings: '',
            saved: false,
            error: false,
            settingsKey: '',
        };
    },
    methods: {
        handleSuccess: function () {
            this.saved = true;
            this.error = false;
        },
        handleError: function (response) {
            this.saved = false;
            this.error = true;
            handleErrorResponse(response);
        },
    },
    watch: {
        settings: function (settings) {
            this.startLoading();
            let payload = {};
            payload[this.settingsKey] = settings;
            UsersApi.updateSettings(payload)
                .then(this.handleSuccess, this.handleError)
                .finally(this.finishLoading);
        },
    },
};
</script>
