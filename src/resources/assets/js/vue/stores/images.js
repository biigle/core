/**
 * Store for the images of the annotation tool
 */
biigle.$declare('annotations.stores.images', function () {
    var events = biigle.$require('biigle.events');
    var imageApi = biigle.$require('api.images');
    var url = window.URL || window.webkitURL;

    return new Vue({
        data: {
            imageCache: {},
            cachedIds: [],
            maxCachedImages: 10,
        },
        methods: {
            parseBlob: function (response) {
                return url.createObjectURL(response.body);
            },
            createImage: function (url) {
                var img = document.createElement('img');
                var promise = new Vue.Promise(function (resolve, reject) {
                    img.onload = function () {
                        resolve(this);
                    };

                    img.onerror = function () {
                        reject('Image ' + url + ' could not be loaded!');
                    };
                });

                img.src = url;

                return promise;
            },
            drawImage: function (img) {
                var canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);

                return canvas;
            },
            fetchImage: function (id) {
                if (!this.imageCache.hasOwnProperty(id)) {
                    this.imageCache[id] = imageApi.getFile({id: id})
                        .then(this.parseBlob)
                        .then(this.createImage);
                    this.cachedIds.push(id);
                }

                return this.imageCache[id].then(this.drawImage);
            },
            updateCache: function (currentId, previousId, nextId) {
                var self = this;
                this.fetchImage(currentId)
                    .then(function() {self.fetchImage(nextId);})
                    .then(function() {self.fetchImage(previousId);});
            },
        },
        watch: {
            cachedIds: function (cachedIds) {
                // If there are too many cached images, remove the oldest one to free
                // resources.
                if (cachedIds.length > this.maxCachedImages) {
                    var id = cachedIds.shift();
                    var image = this.imageCache[id];
                    url.revokeObjectURL(image.src);
                    delete this.imageCache[id];
                }
            },
        },
        created: function () {
            events.$on('images.change', this.updateCache);
        },
    });
});
