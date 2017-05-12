/**
 * Store for the images of the annotation tool
 */
biigle.$declare('annotations.stores.images', function () {
    var events = biigle.$require('biigle.events');
    var canvas = document.createElement('canvas');

    var fxCanvas;

    try {
        // If fxCanvas is not initialized WebGL is not supported at all.
        fxCanvas = fx.canvas();
        var fxTexture = null;
        var loadedImageTexture = null;
    } catch (error) {
        console.log('WebGL not supported. Color adjustment disabled.');
    }

    return new Vue({
        data: {
            cache: {},
            cachedIds: [],
            maxCacheSize: 10,
            supportsColorAdjustment: false,
            currentlyDrawnImage: null,
        },
        computed: {
            imageFileUri: function () {
                return biigle.$require('annotations.imageFileUri');
            },
            supportedTextureSize: function () {
                if (fxCanvas) {
                    return fxCanvas._.gl.getParameter(fxCanvas._.gl.MAX_TEXTURE_SIZE);
                }

                return 0;
            },
            isRemoteVolume: function () {
                return biigle.$require('annotations.volumeIsRemote');
            },
            hasColorAdjustment: function () {
                return false;
            },
        },
        methods: {
            checkSupportsColorAdjustment: function (image) {
                if (!fxCanvas || this.isRemoteVolume) {
                    return false;
                }

                // If we already have a drawn image we only need to check the support
                // again if the image dimensions changed.
                if (this.currentlyDrawnImage && this.currentlyDrawnImage.width === image.width && this.currentlyDrawnImage.height === image.height) {
                    return this.supportsColorAdjustment;
                }

                // Check supported texture size.
                var size = this.supportedTextureSize;
                if (size < image.width || size < image.height) {
                    console.log('Insufficient WebGL texture size. Required: ' + image.width + 'x' + image.height + ', available: ' + size + 'x' + size + '. Color adjustment disabled.');
                    this.supportsColorAdjustment = false;
                    return;
                }

                // Check supported drawing buffer size.
                // see: https://github.com/BiodataMiningGroup/biigle-annotations/issues/44
                fxCanvas.width = image.width;
                fxCanvas.height = image.height;
                if (image.width !== fxCanvas._.gl.drawingBufferWidth || image.height !== fxCanvas._.gl.drawingBufferHeight) {
                    console.log('Your browser does not allow a WebGL drawing buffer with the size of the original image. Color adjustment disabled.');
                    this.supportsColorAdjustment = false;
                    return;
                }

                this.supportsColorAdjustment = true;
            },
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
            drawSimpleImage: function (image) {
                image.canvas.width = image.width;
                image.canvas.height = image.height;
                image.canvas.getContext('2d').drawImage(image.source, 0, 0);

                return image;
            },
            drawColorAdjustedImage: function (image) {
                // TODO implement color adjustment here
            },
            drawImage: function (image) {
                this.checkSupportsColorAdjustment(image);
                this.currentlyDrawnImage = image;

                if (this.supportsColorAdjustment && this.hasColorAdjustment) {
                    return this.drawColorAdjustedImage(image);
                }

                return this.drawSimpleImage(image);
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
