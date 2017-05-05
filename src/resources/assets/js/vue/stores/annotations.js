/**
 * Store for the annotations of the annotation tool
 */
biigle.$declare('annotations.stores.annotations', function () {
    var events = biigle.$require('biigle.events');
    var imagesApi = biigle.$require('api.images');
    var annotationsApi = biigle.$require('api.annotations');

    return new Vue({
        data: {
            cache: {},
        },
        computed: {
            imageFileUri: function () {
                return biigle.$require('annotations.imageFileUri');
            },
            shapeMap: function () {
                return biigle.$require('annotations.shapes');
            },
        },
        methods: {
            parseAnnotations: function (response) {
                var promise = new Vue.Promise(function (resolve, reject) {
                    if (response.status === 200) {
                        resolve(response.data);
                    } else {
                        reject('Failed to load annotations!');
                    }
                });

                return promise;
            },
            resolveShapes: function (annotations) {
                annotations.forEach(function (annotation) {
                    annotation.shape = this.shapeMap[annotation.shape_id];
                }, this);

                return annotations;
            },
            fetchAnnotations: function (id) {
                if (!this.cache.hasOwnProperty(id)) {
                    this.cache[id] = imagesApi.getAnnotations({id: id})
                        .then(this.parseAnnotations)
                        .then(this.resolveShapes);
                }

                return this.cache[id];
            },
            updateCache: function (currentId, previousId, nextId) {
                var self = this;
                this.fetchAnnotations(currentId)
                    .then(function() {self.fetchAnnotations(nextId);})
                    .then(function() {self.fetchAnnotations(previousId);});
            },
        },
        created: function () {
            events.$on('images.change', this.updateCache);
        },
    });
});
