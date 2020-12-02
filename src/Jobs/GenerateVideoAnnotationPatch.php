<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\Contracts\Annotation;
use Biigle\Shape;
use Biigle\VolumeFile;
use Exception;
use FileCache;
use Storage;
use VipsImage;
use FFMpeg\Media\Video;

class GenerateVideoAnnotationPatch extends GenerateAnnotationPatch
{

    // WE ONLY HAVE TO INTERPOLATE THE BOUNDING RECTANGLE OF THE ANNOTATION FRAMES HERE.
    // THIS IS CHEAPER AND WORKS EVEN FOR LINE STRINGS AND POLYGONS.

    /**
     * Handle a single image.
     *
     * @param VolumeFile $file
     * @param string $path Path to the cached image file.
     */
    public function handleFile(VolumeFile $file, $path)
    {
        // // Do not get the path in the constructor because that would require fetching all
        // // the images of the annotations. This would be really slow when lots of
        // // annotation patchs should be generated.
        // $targetPath = $this->getTargetPath($this->annotation);

        // $thumbWidth = config('thumbnails.width');
        // $thumbHeight = config('thumbnails.height');

        // $image = $this->getVipsImage($path);
        // $rect = $this->getPatchRect($this->annotation, $thumbWidth, $thumbHeight);
        // $rect = $this->makeRectContained($rect, $image);

        // $buffer = $image->crop(
        //         $rect['left'],
        //         $rect['top'],
        //         $rect['width'],
        //         $rect['height']
        //     )
        //     ->resize(floatval($thumbWidth) / $rect['width'])
        //     ->writeToBuffer('.'.config('largo.patch_format'), [
        //         'Q' => 85,
        //         'strip' => true,
        //     ]);

        // Storage::disk($this->targetDisk)->put($targetPath, $buffer);
    }

    /**
     * Get a video frame from a specific time as VipsImage object.
     *
     * @param Video $video
     * @param float $time
     *
     * @return VipsImage
     */
    protected function getVideoFrame(Video $video, $time)
    {
        //
    }
}
