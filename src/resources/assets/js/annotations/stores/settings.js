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
        delete: function (key) {
            Vue.delete(this.settings, key);
        },
        get: function (key) {
            return this.settings[key];
        },
        has: function (key) {
            return this.settings.hasOwnProperty(key);
        },
        storeSettings: function () {
            var hasItems = false;
            for (var key in this.settings) {
                if (this.settings.hasOwnProperty(key)) {
                    window.localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
                    return;
                }
            }

            window.localStorage.removeItem(this.storageKey);
        },
        parseUrlParam: function (value) {
            if (!isNaN(value)) {
                return parseFloat(value);
            } else if (value === 'true' || value === 'false') {
                return value === 'true';
            }

            return value;
        },
        loadFromUrlParams: function (properties) {
            var urlParams = biigle.$require('volumes.urlParams');

            properties.forEach(function (property) {
                var value = urlParams.get(property);
                if (value) {
                    this.set(property, this.parseUrlParam(value));
                }
            }, this);
        },
        restoreProperties: function (context, properties, fromUrlParams) {
            if (fromUrlParams) {
                this.loadFromUrlParams(properties);
            }

            properties.forEach(function (property) {
                if (this.has(property)) {
                    Vue.set(context, property, this.get(property));
                }
            }, this);
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
