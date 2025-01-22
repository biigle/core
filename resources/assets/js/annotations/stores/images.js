import Events from '@/core/events.js';
import fx from '../vendor/glfx.js';

export class CrossOriginError extends Error {}

const COLOR_ADJUSTMENT_DEFAULTS = {
    brightnessContrast: [0, 0],
    brightnessRGB: [0, 0, 0],
    hueSaturation: [0, 0],
    vibrance: [0],
    gamma: [1],
};

/**
* Store for the images of the annotation tool
*/
class Images {
    constructor() {
        this.initialized = false;
        this.cache = {};
        this.cachedIds = [];
        this._maxCacheSize = 2;
        this.supportsColorAdjustment = false;
        this.currentlyDrawnImage = null;
        this.colorAdjustment = {
            brightnessContrast: [0, 0],
            brightnessRGB: [0, 0, 0],
            hueSaturation: [0, 0],
            vibrance: [0],
            gamma: [1],
        };
        this.imageFileUri = '';
        this.tilesUri = '';
    }

    get supportedTextureSize() {
        if (this.fxCanvas) {
            return this.fxCanvas._.gl.getParameter(this.fxCanvas._.gl.MAX_TEXTURE_SIZE);
        }

        return 0;
    }

    get hasColorAdjustment() {
        for (let type in this.colorAdjustment) {
            if (this.colorAdjustment.hasOwnProperty(type) && this.isAdjustmentActive(type)) {
                return true;
            }
        }

        return false;
    }

    get maxCacheSize() {
        return this._maxCacheSize;
    }

    set maxCacheSize(size) {
        this._maxCacheSize = size;

        // Add +1 to cache size for the "current" image.
        while (this.cachedIds.length > (size + 1)) {
            let id = this.cachedIds.shift();
            delete this.cache[id];
        }
    }

    initialize() {
        this.initialized = true;
        this.imageFileUri = biigle.$require('annotations.imageFileUri');
        this.tilesUri = biigle.$require('annotations.tilesUri');

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

    }

    isTiledImage(image) {
        return image.tiled === true;
    }

    isAdjustmentActive(type) {
        return this.colorAdjustment[type].some((v, i) => {
            return v !== COLOR_ADJUSTMENT_DEFAULTS[type][i];
        });
    }

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
    }

    createImage(id) {
        let img = document.createElement('img');

        // The canvas is required 1) to draw the image with ignored EXIF rotation and
        // pass it on to OpenLayers and 2) to apply color adjustment and pass it on to
        // OpenLayers.
        //
        // We could also use only a single global canvas element for all images to
        // greatly reduce the memory requirements. But I decided to give each image
        // its own canvas element to make switching between images much faster, since
        // the canvases can be prepared before display and don't have to be redrawn
        // on each switch (unless color adjustment is active).
        let canvas = document.createElement('canvas');

        let imageWrapper = {
            id: id,
            source: img,
            width: 0,
            height: 0,
            canvas: canvas,
            crossOrigin: false,
        };

        // Disable auto-rotation based on image metadata. This only works when the
        // element is in the DOM so we have to append it whenever we need it.
        img.style.imageOrientation = 'none';
        canvas.style.imageOrientation = 'none';
        // Make the element invisible when it is appended to the DOM.
        img.style.visibility = 'hidden';
        img.style.position = 'fixed';
        canvas.style.visibility = 'hidden';
        canvas.style.position = 'fixed';

        // Flag to skip redrawing of the original image if no color adjustment is
        // active.
        canvas._dirty = true;

        let promise = new Vue.Promise(function (resolve, reject) {
            img.onload = function () {
                // The element must be appended to the DOM so the dimensions are
                // correctly determined. Otherwise imageOrientation=none has no
                // effect.
                document.body.appendChild(img);
                document.body.appendChild(imageWrapper.canvas);
                imageWrapper.width = img.width;
                imageWrapper.height = img.height;
                imageWrapper.canvas.width = img.width;
                imageWrapper.canvas.height = img.height;
                // Draw the image to the canvas already so the switch to a cached
                // image is as fast as possible.
                imageWrapper.canvas.getContext('2d').drawImage(img, 0, 0);
                imageWrapper.canvas._dirty = false;
                document.body.removeChild(img);
                document.body.removeChild(imageWrapper.canvas);

                resolve(imageWrapper);
            };

            img.onerror = function () {
                reject(`Failed to load image ${id}!`);
            };
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
    }

    drawSimpleImage(image) {
        if (image.canvas._dirty) {
            // Append the image to the DOM so imageOrientation=none is respected.
            document.body.appendChild(image.source);
            document.body.appendChild(image.canvas);
            // This has to be called somehow to force the browser to respect
            // imageOrientation=none.
            image.source.width;
            image.canvas.getContext('2d').drawImage(image.source, 0, 0);
            image.canvas._dirty = false;
            document.body.removeChild(image.source);
            document.body.appendChild(image.canvas);
        }

        return image;
    }

    drawColorAdjustedImage(image) {
        if (this.loadedImageTexture !== image.source.src) {
            // Maybe redraw the unmodified image to the canvas again.
            this.drawSimpleImage(image);

            if (this.fxTexture) {
                this.fxTexture.loadContentsOf(image.canvas);
            } else {
                this.fxTexture = this.fxCanvas.texture(image.canvas);
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
        image.canvas.getContext('2d').drawImage(this.fxCanvas, 0, 0);
        image.canvas._dirty = true;

        return image;
    }

    drawImage(image) {

        this.checkSupportsColorAdjustment(image);
        this.currentlyDrawnImage = image;

        if (this.supportsColorAdjustment && this.hasColorAdjustment) {
            return this.drawColorAdjustedImage(image);
        } else if (this.isTiledImage(image)) {
            return image;
        }

        return this.drawSimpleImage(image);
    }

    fetchImage(id, next) {
        if (!this.initialized) {
            this.initialize();
        }

        if (!this.cache.hasOwnProperty(id)) {
            Events.emit('images.fetching', id);
            this.cache[id] = this.createImage(id);
            // Also do the "else" case if next is undefined.
            if (next !== true) {
                this.cachedIds.unshift(id);
            } else {
                this.cachedIds.push(id);
            }

            // Add +1 to cache size for the "current" image.
            if (this.cachedIds.length > (this.maxCacheSize + 1)) {
                // Also do the "else" case if next is undefined.
                let deleteId = next !== true
                    ? this.cachedIds.pop()
                    : this.cachedIds.shift();
                if (id !== deleteId) {
                    delete this.cache[deleteId]
                }
            }
        }

        return this.cache[id];
    }

    fetchAndDrawImage(id) {
        return this.fetchImage(id).then(this.drawImage.bind(this));
    }

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
    }

    setMaxCacheSize(size) {
        this.maxCacheSize = size;
    }
}

export default new Images();
