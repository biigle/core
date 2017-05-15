/**
 * Store for annotator settings
 */
biigle.$declare('annotations.stores.settings', new Vue({
    data: function () {
        return {
            settings: {},
            storageKey: 'biigle.annotations.settings',
        };
    },
    computed: {
        debounce: function () {
            return biigle.$require('annotations.stores.utils').debounce;
        },
    },
    methods: {
        set: function (key, value) {
            if (this.settings.hasOwnProperty(key)) {
                this.settings[key] = value;
            } else {
                Vue.set(this.settings, key, value);
            }
        },
        get: function (key) {
            return this.settings[key];
        },
        has: function (key) {
            return this.settings.hasOwnProperty(key);
        },
        storeSettings: function () {
            window.localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        },
    },
    created: function () {
        var settings = JSON.parse(window.localStorage.getItem(this.storageKey));
        if (settings) {
            Vue.set(this, 'settings', settings);
        }
    },
    watch: {
        settings: {
            handler: function () {
                this.debounce(this.storeSettings, 100, 'annotations.settings');
            },
            deep: true,
        },
    },
}));
