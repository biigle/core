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
            setDeselected: function (annotation) {
                annotation.selected = false;

                return annotation;
            },
            setAllDeselected: function (annotations) {
                annotations.forEach(this.setDeselected);

                return annotations;
            },
            fetchAnnotations: function (id) {
                if (!this.cache.hasOwnProperty(id)) {
                    this.cache[id] = imagesApi.getAnnotations({id: id})
                        .catch(function () {
                            return Vue.Promise.reject('Failed to load annotations for image ' + id + '!');
                        })
                        .then(this.parseResponse)
                        .then(this.resolveAllShapes);
                }

                return this.cache[id].then(this.setAllDeselected);
            },
            create: function (imageId, annotation) {
                annotation.shape_id = this.inverseShapeMap[annotation.shape];
                delete annotation.shape;

                var self = this;
                return imagesApi.saveAnnotations({id: imageId}, annotation)
                    .then(this.parseResponse)
                    .then(this.resolveShape)
                    .then(this.setDeselected)
                    .then(function (annotation) {
                        self.cache[imageId].then(function (annotations) {
                            annotations.push(annotation);
                        });

                        return annotation;
                    });
            },
            update: function (annotation) {
                var self = this;
                var promise = annotationsApi.update({id: annotation.id}, {
                    points: annotation.points,
                });

                promise.then(function () {
                    self.cache[annotation.image_id].then(function (annotations) {
                        for (var i = annotations.length - 1; i >= 0; i--) {
                            if (annotations[i].id === annotation.id) {
                                annotations[i].points = annotation.points;
                                return;
                            }
                        }
                    });
                });

                return promise;
            },
            attachLabel: function (annotation, label) {
                var promise = annotationsApi.attachLabel({id: annotation.id}, label);
                promise.then(function (response) {
                    annotation.labels.push(response.data);
                });

                return promise;
            },
            detachLabel: function (annotation, label) {
                var promise = annotationsApi.detachLabel({annotation_label_id: label.id});
                promise.then(function () {
                    for (var i = annotation.labels.length - 1; i >= 0; i--) {
                        if (annotation.labels[i].id === label.id) {
                            annotation.labels.splice(i, 1);
                            return;
                        }
                    }
                });

                return promise;
            },
            delete: function (annotation) {
                var promise = annotationsApi.delete({id: annotation.id});
                var annotationsPromise = this.cache[annotation.image_id];
                promise.then(function () {
                    annotationsPromise.then(function (annotations) {
                        for (var i = annotations.length - 1; i >= 0; i--) {
                            if (annotations[i].id === annotation.id) {
                                annotations.splice(i, 1);
                                return;
                            }
                        }
                    });
                });

                return promise;
            },
        },
    });
});
