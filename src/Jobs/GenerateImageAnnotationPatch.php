<?php

namespace Biigle\Modules\Largo\Jobs;

use Storage;
use Exception;
use FileCache;
use VipsImage;
use Biigle\Shape;
use Biigle\VolumeFile;

class GenerateImageAnnotationPatch extends GenerateAnnotationPatch
{
    /**
     * Handle a single image.
     *
     * @param VolumeFile $file
     * @param string $path Path to the cached image file.
     */
    public function handleFile(VolumeFile $file, $path)
    {
        // Do not get the path in the constructor because that would require fetching all
        // the images of the annotations. This would be really slow when lots of
        // annotation patchs should be generated.
        $targetPath = $this->getTargetPath($this->annotation);
        $image = $this->getVipsImage($path);

        if ($this->createSVG !== 2) {
            $buffer = $this->getAnnotationPatch($image, $this->annotation->getPoints(), $this->annotation->getShape());
            Storage::disk($this->targetDisk)->put($targetPath, $buffer);
        }

        if ($this->createSVG) {
            $svgTargetPath = str_replace(config('largo.patch_format'), 'svg', $targetPath);
            $svgAnnotation = $this->getSVGAnnotationPatch($image->width, $image->height, $this->annotation->getPoints(),
                $this->annotation->getShape());
            Storage::disk($this->targetDisk)->put($svgTargetPath, $svgAnnotation);
        }
    }

    /**
     * Get the vips image instance.
     *
     * @param string $path
     *
     * @return \Jcupitt\Vips\Image
     */
    protected function getVipsImage($path)
    {
        return VipsImage::newFromFile($path, ['access' => 'sequential']);
    }
}
