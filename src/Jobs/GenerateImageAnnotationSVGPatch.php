<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\VolumeFile;
use Storage;
use VipsImage;

class GenerateImageAnnotationSVGPatch extends GenerateAnnotationPatch
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
        $image = $this->getVipsImage($path);

        $svgTargetPath = str_replace(config('largo.patch_format'), 'svg', $this->getTargetPath($this->annotation));
        $svgAnnotation = $this->getSVGAnnotationPatch(
            $image->width,
            $image->height,
            $this->annotation->getPoints(),
            $this->annotation->getShape()
        );
        
        Storage::disk($this->targetDisk)->put($svgTargetPath, $svgAnnotation);
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
