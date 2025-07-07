import {watch, ref} from 'vue';

// This class is used to allow watching for changes in annotations in the video popup
// window. Watching objects from the parent window in the popup window does not work.
// Hence, we define the watcher here, an object that "lives" in the parent window, and
// just register a callback in the popup window.
export default class AnnotationArray extends Array {
    constructor() {
        super(...arguments);
        this._ref = ref(this);
    }

    get revision() {
        return this.reduce(function (carry, annotation) {
            return carry + annotation.revision;
        }, 0);
    }

    watch(fn, options) {
        // The ref changes on additions/deletions and the revision changes if an annotation
        // is modified.
        return watch([this._ref, () => this.revision], fn, options);
    }
}
