import {debounce, urlParams} from '../utils.js';
import {reactive, watch} from 'vue';

/**
 * Model for arbitrary settings that are persisted in localStorage.
 */
export default class {
    constructor(options) {
        this.urlParams = options?.urlParams || [];
        this.storageKey = options?.storageKey || 'biigle.settings';
        this.defaults = options?.defaults || {};
        this.data = reactive({});

        // Vue 2 legacy support.
        if (options.data) {
            throw new Error('Settings is no longer a Vue instance.');
        }

        this.restoreFromLocalStorage();
        if (this.urlParams.length > 0) {
            this.restoreFromUrlParams(this.urlParams);
        }
    }

    set(key, value) {
        if (value === this.defaults[key]) {
            this.delete(key);
        } else if (this.has(key)) {
            this.data[key] = value;
        } else {
            this.data[key] = value;
        }

        debounce(this.persist, 100, this.storageKey);
    }

    delete(key) {
        delete this.data[key];
        this.persist();
    }

    get(key) {
        return this.has(key) ? this.data[key] : this.defaults[key];
    }

    has(key) {
        return this.data.hasOwnProperty(key);
    }

    persist() {
        if (Object.keys(this.data).length > 0) {
            window.localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } else {
            window.localStorage.removeItem(this.storageKey);
        }
    }

    restoreFromLocalStorage() {
        let data = JSON.parse(window.localStorage.getItem(this.storageKey));
        if (data) {
            this.data = data;
        }
    }

    restoreFromUrlParams(keys) {
        let params = urlParams.params;
        keys = keys || Object.keys(params);
        keys.forEach((key) => {
            if (params.hasOwnProperty(key)) {
                this.data[key] = params[key];
            }
        });
    }

    watch(key, callback) {
        watch(() => this.data[key], callback);
    }
};
