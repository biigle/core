/**
 * Store for annotator settings
 */
biigle.$declare('annotations.stores.settings', new Vue({
    data: function () {
        return {
            permanentSettings: {},
            volatileSettings: {},
            storageKey: 'biigle.annotations.settings',
        };
    },
    computed: {
        debounce: function () {
            return biigle.$require('annotations.stores.utils').debounce;
        },
    },
    methods: {
        setPermanent: function (key, value) {
            if (this.volatileSettings.hasOwnProperty(key)) {
                throw "Can't set '" + key + "' as permanent setting key because there already is a volatile setting key with this name.";
            } else if (this.permanentSettings.hasOwnProperty(key)) {
                this.permanentSettings[key] = value;
            } else {
                Vue.set(this.permanentSettings, key, value);
            }
        },
        setVolatile: function (key, value) {
            if (this.permanentSettings.hasOwnProperty(key)) {
                throw "Can't set '" + key + "' as volatile setting key because there already is a permanent setting key with this name.";
            } else if (this.volatileSettings.hasOwnProperty(key)) {
                this.volatileSettings[key] = value;
            } else {
                Vue.set(this.volatileSettings, key, value);
            }
        },
        get: function (key) {
            if (this.permanentSettings.hasOwnProperty(key)) {
                return this.permanentSettings[key];
            }

            return this.volatileSettings[key];
        },
        has: function (key) {
            return this.permanentSettings.hasOwnProperty(key) || this.volatileSettings.hasOwnProperty(key);
        },
        storePermanentSettings: function () {
            window.localStorage.setItem(this.storageKey, JSON.stringify(this.permanentSettings));
        },
    },
    created: function () {
        var settings = JSON.parse(window.localStorage.getItem(this.storageKey));
        if (settings) {
            Vue.set(this, 'permanentSettings', settings);
        }
    },
    watch: {
        permanentSettings: {
            handler: function () {
                this.debounce(this.storePermanentSettings, 100, 'annotations.permanentSettings');
            },
            deep: true,
        },
    },
}));
