/**
 * Store for the images of the annotation tool
 */
biigle.$declare('annotations.stores.images', function () {
    var events = biigle.$require('biigle.events');

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
                        resolve(this);
                    };

                    img.onerror = function () {
                        reject('Failed to load image ' + id + '!');
                    };
                });

                img.src = this.imageFileUri.replace('{id}', id);

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
                if (!this.cache.hasOwnProperty(id)) {
                    this.cache[id] = this.createImage(id);
                    this.cachedIds.push(id);
                }

                return this.cache[id].then(this.drawImage);
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
                if (cachedIds.length > this.maxCacheSize) {
                    var id = cachedIds.shift();
                    var image = this.cache[id];
                    delete this.cache[id];
                }
            },
        },
        created: function () {
            events.$on('images.change', this.updateCache);
        },
    });
});
