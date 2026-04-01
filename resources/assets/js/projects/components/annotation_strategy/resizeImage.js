/**
 * Resizes an image and returns a Blob object
 */
export const resizeImage = (
    file,
    { maxWidth = 300, maxHeight = 300, quality = 0.9 } = {},
) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onerror = (err) => reject(err);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth && height > maxHeight) {
                    const scale = Math.min(
                        maxWidth / width,
                        maxHeight / height,
                        1,
                    );
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(
                                new Error(
                                    'An error occurred when manipulating the image',
                                ),
                            );
                        }
                    },
                    'image/jpeg',
                    quality,
                );
            };
        };
        reader.onerror = (err) => reject(err);
    });
};
