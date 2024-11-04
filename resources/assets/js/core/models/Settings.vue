<script>
import {debounce, urlParams} from '../utils.js';

/**
 * Model for arbitrary settings that are persisted in localStorage.
 */
export default Vue.extend({
    data() {
        return {
            urlParams: [],
            storageKey: 'biigle.settings',
            defaults: {},
            data: {},
        };
    },
    methods: {
        set(key, value) {
            if (value === this.defaults[key]) {
                this.delete(key);
            } else if (this.has(key)) {
                this.data[key] = value;
            } else {
                Vue.set(this.data, key, value);
            }

            debounce(this.persist, 100, this.storageKey);
        },
        delete(key) {
            Vue.delete(this.data, key);
            this.persist();
        },
        get(key) {
            return this.has(key) ? this.data[key] : this.defaults[key];
        },
        has(key) {
            return this.data.hasOwnProperty(key);
        },
        persist() {
            if (Object.keys(this.data).length > 0) {
                window.localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            } else {
                window.localStorage.removeItem(this.storageKey);
            }
        },
        restoreFromLocalStorage() {
            let data = JSON.parse(window.localStorage.getItem(this.storageKey));
            if (data) {
                Vue.set(this, 'data', data);
            }
        },
        restoreFromUrlParams(keys) {
            let params = urlParams.params;
            keys = keys || Object.keys(params);
            keys.forEach((key) => {
                if (params.hasOwnProperty(key)) {
                    Vue.set(this.data, key, params[key]);
                }
            });
        },
        watch(key, callback) {
            return this.$watch(`data.${key}`, callback);
        },
    },
    created() {
        this.restoreFromLocalStorage();
        if (this.urlParams.length > 0) {
            this.restoreFromUrlParams(this.urlParams);
        }
    },
});
</script>
