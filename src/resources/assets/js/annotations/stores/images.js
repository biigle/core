/**
 * Store for the images of the annotation tool
 */
biigle.$declare('annotations.stores.images', function () {
    var events = biigle.$require('events');

    var fxCanvas;

    // This canvas is used as workaround to the auto-rotation of images according to EXIF
    // in Chrome (and maybe other browsers). The canvas and image need CSS
    // "image-orientation: none" to disable auto-rotation. For the style to be applied,
    // the elements need to be placed in the DOM. This single canvas is used for all
    // images so each image does not have to append a new canvas to the DOM.
    // See: https://bugs.chromium.org/p/chromium/issues/detail?id=158753#c114
    var drawCanvas = document.createElement('canvas');
    drawCanvas.style.imageOrientation = 'none';
    drawCanvas.style.visibility = 'hidden';
    drawCanvas.style.position = 'fixed';
    document.body.appendChild(drawCanvas);

    if (window.hasOwnProperty('fx')) {
        try {
            // If fxCanvas is not initialized WebGL is not supported at all.
            fxCanvas = fx.canvas();
            var fxTexture = null;
            var loadedImageTexture = null;
        } catch (error) {
            console.log('WebGL not supported. Color adjustment disabled.');
        }
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
                if (!fxCanvas || image.crossOrigin) {
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
                // see: https://github.com/biigle/annotations/issues/44
                var tmpCanvas = fx.canvas();
                tmpCanvas.width = image.width;
                tmpCanvas.height = image.height;
                if (image.width !== tmpCanvas._.gl.drawingBufferWidth || image.height !== tmpCanvas._.gl.drawingBufferHeight) {
                    console.log('Your browser does not allow a WebGL drawing buffer with the size of the original image. Color adjustment disabled.');
                    this.supportsColorAdjustment = false;
                    return;
                }

                this.supportsColorAdjustment = true;
            },
            createImage: function (id) {
                var self = this;
                var img = document.createElement('img');

                var imageWrapper = {
                    id: id,
                    source: img,
                    width: 0,
                    height: 0,
                    canvas: document.createElement('canvas'),
                    crossOrigin: false,
                };

                // Disable auto-rotation. Otherwise the canvas element might use the
                // wrong values for width/height.
                img.style.imageOrientation = 'none';
                img.style.visibility = 'hidden';
                img.style.position = 'fixed';
                document.body.appendChild(img);

                var promise = new Vue.Promise(function (resolve, reject) {
                    img.onload = function () {
                        imageWrapper.width = img.width;
                        imageWrapper.height = img.height;
                        resolve(imageWrapper);
                    };

                    img.onerror = function () {
                        reject('Failed to load image ' + id + '!');
                    };
                });

                promise.finally(function () {
                    document.body.removeChild(img);
                });

                // The image may be tiled, so we request the data from the endpoint and
                // check if it's an image or a JSON. If this is a cross origin request,
                // the preflight request is automatically performed. If CORS is blocked,
                // the catch() block below handles fallback loading of images.
                return Vue.http.get(this.imageFileUri.replace(':id', id), {responseType: 'blob'})
                    .then(function (response) {
                        var type = response.headers.get('content-type');
                        if (type === 'application/json') {
                            var uuid = response.body.uuid;
                            response.body.url = self.tilesUri.replace(':uuid', uuid[0] + uuid[1] + '/' + uuid[2] + uuid[3] + '/' + uuid);

                            return response.body;
                        }

                        response.blob().then(function (blob) {
                            var urlCreator = window.URL || window.webkitURL;
                            img.src = urlCreator.createObjectURL(blob);
                        });

                        return promise;
                    })
                    .catch(function (response) {
                        // I could not find any reliable way to detect a failure due to
                        // blocking of CORS. But the status seemed to be always 0.
                        // If CORS is blocked, we can still display the image but have to
                        // disable a few features that require reading the image data.
                        if (response.status === 0) {
                            imageWrapper.crossOrigin = true;
                            img.src = response.url;

                            return promise;
                        }

                        return Vue.Promise.reject('Failed to load image ' + id + '!');
                    });
            },
            drawSimpleImage: function (image) {
                document.body.appendChild(image.source);
                drawCanvas.width = image.width;
                drawCanvas.height = image.height;
                drawCanvas.getContext('2d').drawImage(image.source, 0, 0);
                document.body.removeChild(image.source);

                image.canvas.width = image.width;
                image.canvas.height = image.height;
                image.canvas.getContext('2d').drawImage(drawCanvas, 0, 0);

                return image;
            },
            drawColorAdjustedImage: function (image) {
                if (loadedImageTexture !== image.source.src) {
                    document.body.appendChild(image.source);
                    drawCanvas.width = image.width;
                    drawCanvas.height = image.height;
                    drawCanvas.getContext('2d').drawImage(image.source, 0, 0);
                    document.body.removeChild(image.source);

                    if (fxTexture) {
                        fxTexture.loadContentsOf(drawCanvas);
                    } else {
                        fxTexture = fxCanvas.texture(drawCanvas);
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
