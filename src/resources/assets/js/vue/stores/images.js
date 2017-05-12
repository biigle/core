/**
 * Store for the images of the annotation tool
 */
biigle.$declare('annotations.stores.images', function () {
    var events = biigle.$require('biigle.events');
    var canvas = document.createElement('canvas');

    return new Vue({
        data: {
            cache: {},
            cachedIds: [],
            maxCacheSize: 10,
        },
        computed: {
            imageFileUri: function () {
                return biigle.$require('annotations.imageFileUri');
            },
        },
        methods: {
            createImage: function (id) {
                var img = document.createElement('img');
                var promise = new Vue.Promise(function (resolve, reject) {
                    img.onload = function () {
                        // We want to use the same canvas element for drawing and to
                        // apply the color adjustments for better performance. But we
                        // also want Vue to detect switched images which would not work
                        // if we simply passed on the canvas element as a prop to a
                        // component. We therefore create this new object for each image.
                        // And pass it as a prop instead.
                        resolve({
                            source: this,
                            width: this.width,
                            height: this.height,
                            canvas: canvas,
                        });
                    };

                    img.onerror = function () {
                        reject('Failed to load image ' + id + '!');
                    };
                });

                img.src = this.imageFileUri.replace('{id}', id);

                return promise;
            },
            drawImage: function (image) {
                image.canvas.width = image.width;
                image.canvas.height = image.height;
                image.canvas.getContext('2d').drawImage(image.source, 0, 0);

                return image;
            },
            fetchImage: function (id) {
                if (!this.cache.hasOwnProperty(id)) {
                    this.cache[id] = this.createImage(id);
                    this.cachedIds.push(id);
                }

                return this.cache[id];
            },
            fetchAndDrawImage: function (id) {
                return this.fetchImage(id).then(this.drawImage);
            }
        },
        watch: {
            cachedIds: function (cachedIds) {
                // If there are too many cached images, remove the oldest one to free
                // resources.
                if (cachedIds.length > this.maxCacheSize) {
                    var id = cachedIds.shift();
                    var image = this.cache[id];
                    delete this.cache[id];
                }
            },
        },
    });
});
