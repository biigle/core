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
            parseResponse: function (response) {
                return response.data;
            },
            resolveShape: function (annotation) {
                annotation.shape = this.shapeMap[annotation.shape_id];

                return annotation;
            },
            resolveAllShapes: function (annotations) {
                annotations.forEach(this.resolveShape, this);

                return annotations;
            },
            setSelected: function (annotation) {
                annotation.selected = false;

                return annotation;
            },
            setAllSelected: function (annotations) {
                annotations.forEach(this.setSelected);

                return annotations;
            },
            fetchAnnotations: function (id) {
                if (!this.cache.hasOwnProperty(id)) {
                    this.cache[id] = imagesApi.getAnnotations({id: id})
                        .then(this.parseResponse)
                        .then(this.resolveAllShapes);
                }

                return this.cache[id].then(this.setAllSelected);
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
                return imagesApi.saveAnnotations({id: imageId}, annotation)
                    .then(this.parseResponse)
                    .then(this.resolveShape)
                    .then(this.setSelected)
                    .then(function (annotation) {
                        self.cache[imageId].then(function (annotations) {
                            annotations.push(annotation);
                        });

                        return annotation;
                    });
            },
        },
        created: function () {
            events.$on('images.change', this.updateCache);
        },
    });
});
