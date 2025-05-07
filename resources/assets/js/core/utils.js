// https://developer.mozilla.org/en-US/docs/Web/API/Document/exitFullscreen
export let exitFullscreen = function () {
    if (document.fullscreenElement) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

let debounceTimeouts = {};
export let debounce = function (callback, wait, id) {
    if (debounceTimeouts.hasOwnProperty(id)) {
        window.clearTimeout(debounceTimeouts[id]);
    }
    debounceTimeouts[id] = window.setTimeout(callback, wait);
};

class UrlParams {
    constructor() {
        this.params = {};

        // Populate the params object.
        let search = window.location.search.substr(1);
        if (!search) return;

        search = search.split('&');
        let item;
        for (let i = search.length - 1; i >= 0; i--) {
            item = search[i].split('=');
            this.params[item[0]] = item[1];
        }
    }
    setSlug(s, index) {
        index = index || -1;
        let oldPath = window.location.pathname.replace(/\/$/, '');
        let newPath = oldPath.split('/');
        newPath.splice(index, 1, s);
        newPath = newPath.join('/');
        this.replaceState(window.location.href.replace(oldPath, newPath));
    }
    set(params) {
        this.params = params;
        this.updateSearch();
    }
    unset(key) {
        delete this.params[key];
        this.updateSearch();
    }
    get(key) {
        return this.params[key];
    }
    updateSearch() {
        let search = [];
        let loc = window.location.href;
        for (let key in this.params) {
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
    }
    replaceState(url) {
        history.replaceState(null, null, url);
    }
}

export let urlParams = new UrlParams();

let throttleTimeouts = {};
let throttleFunctions = {};
export let throttle = function (callback, wait, id) {
    throttleFunctions[id] = callback;
    if (!throttleTimeouts.hasOwnProperty(id)) {
        throttleTimeouts[id] = window.setTimeout(function () {
            throttleFunctions[id]();
            delete throttleTimeouts[id];
        }, wait);
    }
};


export let capitalize = function (s) {
  if (typeof s !== 'string') return ''

  return s.charAt(0).toUpperCase() + s.slice(1)
}
