<script>
import Events from '../../core/events';
import fx from '../vendor/glfx';

export class CrossOriginError extends Error {}

/**
* Store for the images of the annotation tool
*/
export default new Vue({
    data: {
        initialized: false,
        cache: {},
        cachedIds: [],
        maxCacheSize: 200,
        supportsColorAdjustment: false,
        currentlyDrawnImage: null,
        colorAdjustmentDefaults: {
            brightnessContrast: [0, 0],
            brightnessRGB: [0, 0, 0],
            hueSaturation: [0, 0],
            vibrance: [0],
            gamma: [1],
        },
        colorAdjustment: {
            brightnessContrast: [0, 0],
            brightnessRGB: [0, 0, 0],
            hueSaturation: [0, 0],
            vibrance: [0],
            gamma: [1],
        },
    },
    computed: {
        imageFileUri() {
            return biigle.$require('annotations.imageFileUri');
        },
        tilesUri() {
            return biigle.$require('annotations.tilesUri');
        },
        supportedTextureSize() {
            if (this.fxCanvas) {
                return this.fxCanvas._.gl.getParameter(this.fxCanvas._.gl.MAX_TEXTURE_SIZE);
            }

            return 0;
        },
        hasColorAdjustment() {
            for (let type in this.colorAdjustment) {
                if (this.colorAdjustment.hasOwnProperty(type) && this.isAdjustmentActive(type)) {
                    return true;
                }
            }

            return false;
        },
    },
    methods: {
        initialize() {
            // The properties defined in this function are intentionally no reactive
            // properties of this Vue instance.
            this.initialized = true;

            // This canvas is used as workaround to the auto-rotation of images
            // according to EXIF in Chrome, Firefox and other browsers. The canvas and
            // image need CSS "image-orientation: none" to disable auto-rotation. For
            // the style to be applied, the elements need to be placed in the DOM. This
            // single canvas is used for all images so each image does not have to
            // append a new canvas to the DOM.
            // See: https://bugs.chromium.org/p/chromium/issues/detail?id=158753#c114
            this.drawCanvas = document.createElement('canvas');
            this.drawCanvas.style.imageOrientation = 'none';
            this.drawCanvas.style.visibility = 'hidden';
            this.drawCanvas.style.position = 'fixed';
            document.body.appendChild(this.drawCanvas);

            try {
                // If this.fxCanvas is not initialized WebGL is not supported at all.
                this.fxCanvas = fx.canvas();
                this.fxTexture = null;
                this.loadedImageTexture = null;
            } catch (error) {
                console.warn('WebGL not supported. Color adjustment disabled.');
            }

            window.addEventListener('beforeunload', function () {
                // Make sure the texture is destroyed when the page is left.
                // The browser may take its time to garbage collect it and it may cause
                // crashes due to lack of memory if not explicitly destroyed like this.
                if (this.fxTexture) {
                    this.fxTexture.destroy();
                    // tell the browser that we *really* no longer want to use the resources
                    // see: http://stackoverflow.com/a/23606581/1796523
                    this.fxCanvas.width = 1;
                    this.fxCanvas.height = 1;
                }
            });

        },
        isTiledImage(image) {
            return image.tiled === true;
        },
        isAdjustmentActive(type) {
            return this.colorAdjustment[type].some((v, i) => {
                return v !== this.colorAdjustmentDefaults[type][i];
            });
        },
        checkSupportsColorAdjustment(image) {
            if (!this.fxCanvas || image.crossOrigin) {
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
            let size = this.supportedTextureSize;
            if (size < image.width || size < image.height) {
                console.warn(`Insufficient WebGL texture size. Required: ${image.width}x${image.height}, available: ${size}x${size}. Color adjustment disabled.`);
                this.supportsColorAdjustment = false;
                return;
            }

            // Check supported drawing buffer size.
            // see: https://github.com/biigle/annotations/issues/44
            let tmpCanvas = fx.canvas();
            tmpCanvas.width = image.width;
            tmpCanvas.height = image.height;
            if (image.width !== tmpCanvas._.gl.drawingBufferWidth || image.height !== tmpCanvas._.gl.drawingBufferHeight) {
                console.warn('Your browser does not allow a WebGL drawing buffer with the size of the original image. Color adjustment disabled.');
                this.supportsColorAdjustment = false;
                return;
            }

            this.supportsColorAdjustment = true;
        },
        createImage(id) {
            let img = document.createElement('img');

            let imageWrapper = {
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

            let promise = new Vue.Promise(function (resolve, reject) {
                img.onload = function () {
                    imageWrapper.width = img.width;
                    imageWrapper.height = img.height;
                    resolve(imageWrapper);
                };

                img.onerror = function () {
                    reject(`Failed to load image ${id}!`);
                };
            });

            promise.finally(function () {
                document.body.removeChild(img);
            });

            // The image may be tiled, so we request the data from the endpoint and
            // check if it's an image or a JSON. If this is a cross origin request,
            // the preflight request is automatically performed. If CORS is blocked,
            // the catch() block below handles fallback loading of images.
            //
            // Use fetch() instead of Vue.http.get() because Laravel Echo automatically
            // adds an interceptor that adds an additional header whcih could cause
            // problems with CORS.
            //
            // See: https://github.com/laravel/echo/issues/152
            let url = this.imageFileUri.replace(':id', id);

            return fetch(url).then((response) => {
                    if (!response.ok) {
                        throw new Error();
                    }

                    let type = response.headers.get('content-type');
                    if (type === 'application/json') {
                        return response.json().then((body) => {
                            let uuid = body.uuid;
                            body.url = this.tilesUri.replace(':uuid', uuid[0] + uuid[1] + '/' + uuid[2] + uuid[3] + '/' + uuid);

                            return body;
                        });
                    }

                    response.blob().then(function (blob) {
                        let urlCreator = window.URL || window.webkitURL;
                        img.src = urlCreator.createObjectURL(blob);
                    });

                    return promise;
                })
                .catch((error) => {
                    // fetch() will throw a TypeError if CORS is not allowed. Retry with
                    // the plain img fallback.
                    // Remote image without CORS support will be dropped in a future
                    // release. See: https://github.com/biigle/core/issues/351
                    if (error instanceof TypeError) {
                        imageWrapper.crossOrigin = true;
                        img.src = url;

                        return promise;
                    }

                    return Vue.Promise.reject(`Failed to load image ${id}!`);
                });
        },
        drawSimpleImage(image) {
            document.body.appendChild(image.source);
            this.drawCanvas.width = image.width;
            this.drawCanvas.height = image.height;
            this.drawCanvas.getContext('2d').drawImage(image.source, 0, 0);
            document.body.removeChild(image.source);

            image.canvas.width = image.width;
            image.canvas.height = image.height;
            image.canvas.getContext('2d').drawImage(this.drawCanvas, 0, 0);

            return image;
        },
        drawColorAdjustedImage(image) {
            if (this.loadedImageTexture !== image.source.src) {
                document.body.appendChild(image.source);
                this.drawCanvas.width = image.width;
                this.drawCanvas.height = image.height;
                this.drawCanvas.getContext('2d').drawImage(image.source, 0, 0);
                document.body.removeChild(image.source);

                if (this.fxTexture) {
                    this.fxTexture.loadContentsOf(this.drawCanvas);
                } else {
                    this.fxTexture = this.fxCanvas.texture(this.drawCanvas);
                }
                this.loadedImageTexture = image.source.src;
            }

            this.fxCanvas.draw(this.fxTexture);

            for (let type in this.colorAdjustment) {
                if (this.colorAdjustment.hasOwnProperty(type) && this.isAdjustmentActive(type)) {
                    this.fxCanvas[type].apply(this.fxCanvas, this.colorAdjustment[type]);
                }
            }

            this.fxCanvas.update();
            image.canvas.width = image.width;
            image.canvas.height = image.height;
            image.canvas.getContext('2d').drawImage(this.fxCanvas, 0, 0);

            return image;
        },
        drawImage(image) {
            if (!this.initialized) {
                this.initialize();
            }

            this.checkSupportsColorAdjustment(image);
            this.currentlyDrawnImage = image;

            if (this.supportsColorAdjustment && this.hasColorAdjustment) {
                return this.drawColorAdjustedImage(image);
            } else if (this.isTiledImage(image)) {
                return image;
            }

            return this.drawSimpleImage(image);
        },
        fetchImage(id) {
            if (!this.cache.hasOwnProperty(id)) {
                Events.$emit('images.fetching', id);
                this.cache[id] = this.createImage(id);
                this.cachedIds.push(id);
            }

            return this.cache[id];
        },
        fetchAndDrawImage(id) {
            return this.fetchImage(id).then(this.drawImage);
        },
        updateColorAdjustment(params) {
            if (!this.supportsColorAdjustment) {
                return;
            }

            let type, i;
            let colorAdjustment = this.colorAdjustment;
            // Store this *before* the params are applied.
            let hadColorAdjustment = this.hasColorAdjustment;

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
        cachedIds(cachedIds) {
            // If there are too many cached images, remove the oldest one to free
            // resources.
            if (cachedIds.length > this.maxCacheSize) {
                let id = cachedIds.shift();
                delete this.cache[id];
            }
        },
    },
});
</script>
