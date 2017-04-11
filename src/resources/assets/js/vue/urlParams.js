/**
 * Helper for modifying the slug and search string of the URL without reloading the page.
 */
biigle.$declare('volumes.urlParams', new Vue({
    data: {
        params: {}
    },
    methods: {
        setSlug: function (s) {
            var oldPath = location.pathname.replace(/\/$/, '');
            // Replace the old slug with the new slug.
            var newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + s;
            this.replaceState(location.href.replace(oldPath, newPath));
        },
        set: function (params) {
            this.params = params;
            this.updateSearch();
        },
        unset: function (key) {
            delete this.params[key];
            this.updateSearch();
        },
        get: function (key) {
            return this.params[key];
        },
        updateSearch: function () {
            var search = [];
            var loc = location.href;
            for (var key in this.params) {
                if (!this.params.hasOwnProperty(key)) continue;
                search.push(key + '=' + this.params[key]);
            }

            search = search.length > 0 ? '?' + search.join('&') : '';

            if (location.search) {
                this.replaceState(loc.replace(location.search, search));
            } else if (location.hash) {
                this.replaceState(loc.replace(location.hash, search + location.hash));
            } else {
                this.replaceState(location + search);
            }
        },
        replaceState: function (url) {
            history.replaceState(null, null, url);
        },
    },
    created: function () {
        // Populate the params object.
        var search = location.search.substr(1);
        if (!search) return;

        search = search.split('&');
        var item;
        for (var i = search.length - 1; i >= 0; i--) {
            item = search[i].split('=');
            this.params[item[0]] = item[1];
        }
    },
}));
