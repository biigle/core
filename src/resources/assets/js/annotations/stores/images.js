/**
 * Store for the images of the annotation tool
 */
biigle.$declare('annotations.stores.images', function () {
    var events = biigle.$require('events');
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

    window.addEventListener('beforeunload', function (e) {
        // Make sure the texture is destroyed when the page is left.
        // The browser may take its time to garbage collect it and it may cause
        // crashes due to lack of memory if not explicitly destroyed like this.
        if (fxTexture) {
            fxTexture.destroy();
            // tell the browser that we *really* no longer want to use the resources
            // see: http://stackoverflow.com/a/23606581/1796523
            fxCanvas.width = 1;
            fxCanvas.height = 1;
        }
    });

    return new Vue({
        data: {
            cache: {},
            cachedIds: [],
            maxCacheSize: 10,
            supportsColorAdjustment: false,
            currentlyDrawnImage: null,
            colorAdjustment: {
                brightnessContrast: [0, 0],
                brightnessRGB: [0, 0, 0],
                hueSaturation: [0, 0],
                vibrance: [0],
            },
        },
        computed: {
            imageFileUri: function () {
                return biigle.$require('annotations.imageFileUri');
            },
            tilesUri: function () {
                return biigle.$require('annotations.tilesUri');
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
                for (var type in this.colorAdjustment) {
                    if (this.colorAdjustment.hasOwnProperty(type) && this.isAdjustmentActive(type)) {
                        return true;
                    }
                }

                return false;
            },
        },
        methods: {
            isTiledImage: function (image) {
                return image.tiled === true;
            },
            isAdjustmentActive: function (type) {
                return this.colorAdjustment[type].reduce(function (acc, value) {
                    return acc + value;
                }) !== 0;
            },
            checkSupportsColorAdjustment: function (image) {
                if (!fxCanvas || this.isRemoteVolume) {
                    return false;
                }

                if (this.isTiledImage(image)) {
                    this.supportsColorAdjustment = false;
                    return;
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
                var self = this;
                var img = document.createElement('img');
                // We want to use the same canvas element for drawing and to
                // apply the color adjustments for better performance. But we
                // also want Vue to detect switched images which would not work
                // if we simply passed on the canvas element as a prop to a
                // component. We therefore create this new object for each image.
                // And pass it as a prop instead.
                var promise = new Vue.Promise(function (resolve, reject) {
                    img.onload = function () {
                        resolve({
                            source: img,
                            width: img.width,
                            height: img.height,
                            canvas: canvas,
                        });
                    };

                    img.onerror = function () {
                        reject('Failed to load image ' + id + '!');
                    };
                });

                if (this.isRemoteVolume) {
                    // Images of remote volumes *must* be loaded as src of an image
                    // element because of cross origin restrictions!
                    img.src = this.imageFileUri.replace('{id}', id);

                    return promise;

                } else {
                    // If the volume is not remote the image may be tiled. So we request
                    // the data from the endpoint and check if it's an image or a JSON.
                    return Vue.http.get(this.imageFileUri.replace('{id}', id))
                        .catch(function () {
                            return Vue.Promise.reject('Failed to load image ' + id + '!');
                        })
                        .then(function (response) {
                            if (response.bodyBlob.type === 'application/json') {
                                response.body.url = self.tilesUri.replace('{uuid}', response.body.uuid);

                                return response.body;
                            }

                            var urlCreator = window.URL || window.webkitURL;
                            img.src = urlCreator.createObjectURL(response.bodyBlob);

                            return promise;
                        });
                }
            },
            drawSimpleImage: function (image) {
                image.canvas.width = image.width;
                image.canvas.height = image.height;
                image.canvas.getContext('2d').drawImage(image.source, 0, 0);

                return image;
            },
            drawColorAdjustedImage: function (image) {
                if (loadedImageTexture !== image.source.src) {
                    if (fxTexture) {
                        fxTexture.loadContentsOf(image.source);
                    } else {
                        fxTexture = fxCanvas.texture(image.source);
                    }
                    loadedImageTexture = image.source.src;
                }

                fxCanvas.draw(fxTexture);

                for (var type in this.colorAdjustment) {
                    if (this.colorAdjustment.hasOwnProperty(type) && this.isAdjustmentActive(type)) {
                        fxCanvas[type].apply(fxCanvas, this.colorAdjustment[type]);
                    }
                }

                fxCanvas.update();
                image.canvas.width = image.width;
                image.canvas.height = image.height;
                image.canvas.getContext('2d').drawImage(fxCanvas, 0, 0);

                return image;
            },
            drawImage: function (image) {
                this.checkSupportsColorAdjustment(image);
                this.currentlyDrawnImage = image;

                if (this.supportsColorAdjustment && this.hasColorAdjustment) {
                    return this.drawColorAdjustedImage(image);
                } else if (this.isTiledImage(image)) {
                    return image;
                }

                return this.drawSimpleImage(image);
            },
            fetchImage: function (id) {
                if (!this.cache.hasOwnProperty(id)) {
                    events.$emit('images.fetching', id);
                    this.cache[id] = this.createImage(id);
                    this.cachedIds.push(id);

                }

                return this.cache[id];
            },
            fetchAndDrawImage: function (id) {
                return this.fetchImage(id).then(this.drawImage);
            },
            updateColorAdjustment: function (params) {
                if (!this.supportsColorAdjustment) {
                    return;
                }

                var type, i;
                var colorAdjustment = this.colorAdjustment;
                // Store this *before* the params are applied.
                var hadColorAdjustment = this.hasColorAdjustment;

                for (type in params) {
                    if (params.hasOwnProperty(type)) {
                        for (i = params[type].length - 1; i >= 0; i--) {
                            colorAdjustment[type].splice(i, 1, params[type][i]);
                        }
                    }
                }

                if (this.hasColorAdjustment) {
                    this.drawColorAdjustedImage(this.currentlyDrawnImage);
                } else if (hadColorAdjustment) {
                    // This is the case where a previously active color adjustment was
                    // reset and the original image should be rendered again.
                    this.drawSimpleImage(this.currentlyDrawnImage);
                }
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
    });
});
