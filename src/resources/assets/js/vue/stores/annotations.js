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
            inverseShapeMap: function () {
                var map = {};
                for (var id in this.shapeMap) {
                    map[this.shapeMap[id]] = parseInt(id, 10);
                }

                return map;
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
            resolveShape: function (annotation) {
                annotation.shape = this.shapeMap[annotation.shape_id];

                return annotation;
            },
            resolveShapes: function (annotations) {
                annotations.forEach(this.resolveShape, this);

                return annotations;
            },
            setSelected: function (annotations) {
                annotations.forEach(function (annotation) {
                    annotation.selected = false;
                });

                return annotations;
            },
            fetchAnnotations: function (id) {
                if (!this.cache.hasOwnProperty(id)) {
                    this.cache[id] = imagesApi.getAnnotations({id: id})
                        .then(this.parseAnnotations)
                        .then(this.resolveShapes);
                }

                return this.cache[id].then(this.setSelected);
            },
            updateCache: function (currentId, previousId, nextId) {
                var self = this;
                this.fetchAnnotations(currentId)
                    .then(function() {self.fetchAnnotations(nextId);})
                    .then(function() {self.fetchAnnotations(previousId);});
            },
            create: function (imageId, annotation) {
                annotation.shape_id = this.inverseShapeMap[annotation.shape];
                delete annotation.shape;

                var self = this;
                var promise = imagesApi.saveAnnotations({id: imageId}, annotation)
                    .then(function (response) {
                        // TODO: resolve shape, put to cache
                    });

                // TODO: separately handle error but don't return it with the promise

                return promise;
            },
        },
        created: function () {
            events.$on('images.change', this.updateCache);
        },
    });
});
