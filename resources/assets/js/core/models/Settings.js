/**
 * Model for arbitrary settings that are persisted in localStorage.
 */
biigle.$declare('core.models.Settings', function () {
    return Vue.extend({
        data: function () {
            return {
                urlParams: false,
                storageKey: 'biigle.settings',
                defaults: {},
                data: {},
            };
        },
        computed: {
            debounce: function () {
                return biigle.$require('annotations.stores.utils').debounce;
            },
        },
        methods: {
            set: function (key, value) {
                if (value === this.defaults[key]) {
                    this.delete(key);
                } else if (this.has(key)) {
                    this.data[key] = value;
                } else {
                    Vue.set(this.data, key, value);
                }

                this.debounce(this.persist, 100, this.storageKey);
            },
            delete: function (key) {
                Vue.delete(this.data, key);
                this.persist();
            },
            get: function (key) {
                return this.data[key] || this.defaults[key];
            },
            has: function (key) {
                return this.data.hasOwnProperty(key);
            },
            persist: function () {
                if (Object.keys(this.data).length > 0) {
                    window.localStorage.setItem(this.storageKey, JSON.stringify(this.data));
                } else {
                    window.localStorage.removeItem(this.storageKey);
                }
            },
            restoreFromLocalStorage: function () {
                var data = JSON.parse(window.localStorage.getItem(this.storageKey));
                if (data) {
                    Vue.set(this, 'data', data);
                }
            },
            restoreFromUrlParams: function (keys) {
                var params = biigle.$require('urlParams').params;
                keys = keys || Object.keys(params);
                keys.forEach(function (key) {
                    Vue.set(this.data, key, params[key]);
                }, this);
            },
        },
        created: function () {
            this.restoreFromLocalStorage();
            if (this.urlParams) {
                this.restoreFromUrlParams();
            }
        },
    });
});
