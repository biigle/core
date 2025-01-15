import AnnotationsApi from '@/core/api/annotations.js';
import ImagesApi from '@/core/api/images.js';

/**
* Store for the annotations of the annotation tool
*/

class Annotations {
    constructor() {
        this.cache = {};
        this.shapeMap = this.getShapeMap();
        this.inverseShapeMap = this.getInverseShapeMap();
    }

    getShapeMap() {
        return biigle.$require('annotations.shapes');
    }

    getInverseShapeMap() {
        let map = {};
        for (let id in this.shapeMap) {
            map[this.shapeMap[id]] = parseInt(id, 10);
        }

        return map;
    }

    parseResponse(response) {
        return response.data;
    }

    resolveShape(annotation) {
        annotation.shape = this.shapeMap[annotation.shape_id];

        return annotation;
    }

    resolveAllShapes(annotations) {
        annotations.forEach(this.resolveShape, this);

        return annotations;
    }

    setDeselected(annotation) {
        annotation.selected = false;

        return annotation;
    }

    setAllDeselected(annotations) {
        annotations.forEach(this.setDeselected);

        return annotations;
    }

    fetchAnnotations(id) {
        if (!this.cache.hasOwnProperty(id)) {
            this.cache[id] = ImagesApi.getAnnotations({id: id})
                .catch(function () {
                    return Vue.Promise.reject(`Failed to load annotations for image ${id}!`);
                })
                .then(this.parseResponse)
                .then(this.resolveAllShapes);
        }

        return this.cache[id].then(this.setAllDeselected);
    }

    create(imageId, annotation) {
        annotation.shape_id = this.inverseShapeMap[annotation.shape];
        delete annotation.shape;

        return ImagesApi.saveAnnotations({id: imageId}, annotation)
            .then(this.parseResponse)
            .then(this.resolveShape)
            .then(this.setDeselected)
            .then((annotation) => {
                this.cache[imageId].then(function (annotations) {
                    annotations.unshift(annotation);
                });

                return annotation;
            });
    }

    update(annotation) {
        let promise = AnnotationsApi.update({id: annotation.id}, {
            points: annotation.points,
        });

        promise.then(() => {
            this.cache[annotation.image_id].then(function (annotations) {
                for (let i = annotations.length - 1; i >= 0; i--) {
                    if (annotations[i].id === annotation.id) {
                        annotations[i].points = annotation.points;
                        return;
                    }
                }
            });
        });

        return promise;
    }

    attachLabel(annotation, label) {
        let promise = AnnotationsApi.attachLabel({id: annotation.id}, label);
        promise.then(function (response) {
            annotation.labels.unshift(response.data);
        }, () => {/* ignore errors here */});

        return promise;
    }

    detachLabel(annotation, label) {
        let promise = AnnotationsApi.detachLabel({annotation_label_id: label.id});
        promise.then(function () {
            for (let i = annotation.labels.length - 1; i >= 0; i--) {
                if (annotation.labels[i].id === label.id) {
                    annotation.labels.splice(i, 1);
                    return;
                }
            }
        });

        return promise;
    }

    delete(annotation) {
        let promise = AnnotationsApi.delete({id: annotation.id});
        let annotationsPromise = this.cache[annotation.image_id];
        promise.then(function () {
            annotationsPromise.then(function (annotations) {
                for (let i = annotations.length - 1; i >= 0; i--) {
                    if (annotations[i].id === annotation.id) {
                        annotations.splice(i, 1);
                        return;
                    }
                }
            });
        });

        return promise;
    }

};

export default new Annotations();
