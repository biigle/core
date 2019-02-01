/**
 * Helper for modifying the slug and search string of the URL without reloading the page.
 */
biigle.$declare('urlParams', new Vue({
    data: {
        params: {}
    },
    methods: {
        setSlug: function (s) {
            var oldPath = window.location.pathname.replace(/\/$/, '');
            // Replace the old slug with the new slug.
            var newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + s;
            this.replaceState(window.location.href.replace(oldPath, newPath));
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
            var loc = window.location.href;
            for (var key in this.params) {
                if (!this.params.hasOwnProperty(key)) continue;
                search.push(key + '=' + this.params[key]);
            }

            search = search.length > 0 ? '?' + search.join('&') : '';

            if (window.location.search) {
                this.replaceState(loc.replace(window.location.search, search));
            } else if (loc.indexOf("#") !== -1) {
                if (window.location.hash) {
                    this.replaceState(
                        loc.replace(window.location.hash, search + window.location.hash)
                    );
                } else {
                    // this is the case where there is a trailing '#' in the href which
                    // can be removed
                    this.replaceState(loc.slice(0, -1) + search);
                }
            } else {
                this.replaceState(loc + search);
            }
        },
        replaceState: function (url) {
            history.replaceState(null, null, url);
        },
    },
    created: function () {
        // Populate the params object.
        var search = window.location.search.substr(1);
        if (!search) return;

        search = search.split('&');
        var item;
        for (var i = search.length - 1; i >= 0; i--) {
            item = search[i].split('=');
            this.params[item[0]] = item[1];
        }
    },
}));
