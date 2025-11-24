function trimCanvas(canvas) {
    let ctx = canvas.getContext('2d');
    let copy = document.createElement('canvas').getContext('2d');
    let pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let l = pixels.data.length;
    let i, x, y;
    let bound = {
        top: null,
        left: null,
        right: null,
        bottom: null
    };

    for (i = 0; i < l; i += 4) {
        if (pixels.data[i + 3] !== 0) {
            x = (i / 4) % canvas.width;
            y = ~~((i / 4) / canvas.width);

            if (bound.top === null) {
                bound.top = y;
            }

            if (bound.left === null) {
                bound.left = x;
            } else if (x < bound.left) {
                bound.left = x;
            }

            if (bound.right === null) {
                bound.right = x;
            } else if (bound.right < x) {
                bound.right = x;
            }

            if (bound.bottom === null) {
                bound.bottom = y;
            } else if (bound.bottom < y) {
                bound.bottom = y;
            }
        }
    }
    
    let trimHeight = bound.bottom - bound.top;
    let trimWidth = bound.right - bound.left;
    let trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

    copy.canvas.width = trimWidth;
    copy.canvas.height = trimHeight;
    copy.putImageData(trimmed, 0, 0);

    return copy.canvas;
}
        
let makeBlob = function(canvas) {
    try {
        canvas = trimCanvas(canvas);
    } catch (error) {
        return Promise.reject('Could not create screenshot. Maybe the image is not loaded yet?');
    }

    let type = 'image/png';
    if (!HTMLCanvasElement.prototype.toBlob) {
        // fallback if toBlob is not implemented see 'Polyfill':
        // https://developer.mozilla.org/de/docs/Web/API/HTMLCanvasElement/toBlob
        let binStr = atob(canvas.toDataURL(type).split(',')[1]);
        let len = binStr.length;
        let arr = new Uint8Array(len);
        for (let i = 0; i < len; i++ ) {
            arr[i] = binStr.charCodeAt(i);
        }

        return new Promise(function (resolve) {
            resolve(new Blob([arr], {type: type}));
        });
    } else {
        return new Promise(function (resolve) {
            canvas.toBlob(resolve, type);
        });
    }
}

export {makeBlob}