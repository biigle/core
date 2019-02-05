<?php

namespace Biigle\Modules\Largo\Jobs;

use File;
use Exception;
use VipsImage;
use FileCache;
use Biigle\Image;
use Biigle\Shape;
use Biigle\Jobs\Job;
use Biigle\Contracts\Annotation;
use Illuminate\Queue\InteractsWithQueue;
use Biigle\Annotation as AnnotationModel;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateAnnotationPatch extends Job implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The class of the annotation model.
     *
     * @var string
     */
    protected $annotationClass;

    /**
     * The ID of the annotation model.
     *
     * @var int
     */
    protected $annotationId;

    /**
     * The the annotation to generate a patch for.
     *
     * @var Annotation
     */
    protected $annotation;

    /**
     * Path to the file to store the annotation patch.
     *
     * @var string
     */
    protected $targetPath;

    /**
     * Create a new job instance.
     *
     * @param Annotation $annotation The the annotation to generate a patch for.
     * @param string|null $targetPath Path to the file to store the annotation patch. If null, th default path for a Largo annotation is used.
     *
     * @return void
     */
    public function __construct(Annotation $annotation, $targetPath = null)
    {
        // We do not use the SerializesModels trait because there is a good chance that
        // the annotation is deleted when this job should be executed. If this is the
        // case, this job should be ignored (see handle method).
        $this->annotationId = $annotation->getQueueableId();
        $this->annotationClass = get_class($annotation);
        $this->targetPath = $targetPath;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $this->annotation = $this->annotationClass::find($this->annotationId);
        if ($this->annotation === null) {
            return;
        }

        // Do not do this in the constructor because that would require fetching all
        // the images of the annotations. This would be really slow when lots of
        // annotation patchs should be generated.
        if (is_null($this->targetPath)) {
            $this->targetPath = $this->getDefaultTargetPath($this->annotation);
        }

        try {
            FileCache::get($this->annotation->getImage(), [$this, 'handleImage']);
        } catch (Exception $e) {
            if (str_contains($e->getMessage(), 'The source resource could not be established') && $this->attempts() < 3) {
                // Retry in 10 minutes, maybe the remote source is available again.
                $this->release(600);

                return;
            }

            throw new Exception("Could not generate annotation patch for annotation {$this->annotationId}: {$e->getMessage()}");
        }
    }

    /**
     * Handle a single image.
     *
     * @param Image $image
     * @param string $path Path to the cached image file.
     */
    public function handleImage(Image $image, $path)
    {
        $targetDir = File::dirname($this->targetPath);
        if (!File::exists($targetDir)) {
            // Make recursive. With force to ignore errors due to race conditions.
            // see: https://github.com/biigle/largo/issues/47
            File::makeDirectory($targetDir, 0755, true, true);
        }

        $thumbWidth = config('thumbnails.width');
        $thumbHeight = config('thumbnails.height');

        $rect = $this->getPatchRect($this->annotation, $thumbWidth, $thumbHeight);
        $image = $this->getVipsImage($path);
        $rect = $this->makeRectContained($rect, $image);

        $image->crop($rect['left'], $rect['top'], $rect['width'], $rect['height'])
            ->resize(floatval($thumbWidth) / $rect['width'])
            ->writeToFile($this->targetPath);
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

    /**
     * Calculate the bounding rectangle of the patch to extract.
     *
     * @param Annotation $annotation
     * @param int $thumbWidth
     * @param int $thumbHeight
     *
     * @return array Containing width, height, top and left
     */
    protected function getPatchRect(Annotation $annotation, $thumbWidth, $thumbHeight)
    {
        $padding = config('largo.patch_padding');
        $points = $annotation->getPoints();

        switch ($annotation->getShape()->id) {
            case Shape::pointId():
                $pointPadding = config('largo.point_padding');
                $left = $points[0] - $pointPadding;
                $right = $points[0] + $pointPadding;
                $top = $points[1] - $pointPadding;
                $bottom = $points[1] + $pointPadding;
                break;

            case Shape::circleId():
                $left = $points[0] - $points[2];
                $right = $points[0] + $points[2];
                $top = $points[1] - $points[2];
                $bottom = $points[1] + $points[2];
                break;

            default:
                $left = INF;
                $right = -INF;
                $top = INF;
                $bottom = -INF;
                foreach ($points as $index => $value) {
                    if ($index % 2 === 0) {
                        $left = min($left, $value);
                        $right = max($right, $value);
                    } else {
                        $top = min($top, $value);
                        $bottom = max($bottom, $value);
                    }
                }
        }

        $left -= $padding;
        $right += $padding;
        $top -= $padding;
        $bottom += $padding;

        $width = $right - $left;
        $height = $bottom - $top;

        $widthRatio = $width / $thumbWidth;
        $heightRatio = $height / $thumbHeight;

        // increase the size of the patch so its aspect ratio is the same than the
        // ratio of the thumbnail dimensions
        if ($widthRatio > $heightRatio) {
            $newHeight = round($thumbHeight * $widthRatio);
            $top -= round(($newHeight - $height) / 2);
            $height = $newHeight;
        } else {
            $newWidth = round($thumbWidth * $heightRatio);
            $left -= round(($newWidth - $width) / 2);
            $width = $newWidth;
        }

        return [
            'width' => intval(round($width)),
            'height' => intval(round($height)),
            'left' => intval(round($left)),
            'top' => intval(round($top)),
        ];
    }

    /**
     * Adjust the position and size of the patch rectangle so it is contained in the
     * image.
     *
     * @param array $rect
     * @param Jcupitt\Vips\Image $image
     *
     * @return array
     */
    protected function makeRectContained($rect, $image)
    {
        // Order of min max is importans so the point gets no negative coordinates.
        $rect['left'] = min($image->width - $rect['width'], $rect['left']);
        $rect['left'] = max(0, $rect['left']);
        $rect['top'] = min($image->height - $rect['height'], $rect['top']);
        $rect['top'] = max(0, $rect['top']);

        // Adjust dimensions of rect if it is larger than the image.
        $rect['width'] = min($image->width, $rect['width']);
        $rect['height'] = min($image->height, $rect['height']);

        return $rect;
    }

    /**
     * Assemble the default target path for a Largo annotation patch.
     *
     * @param AnnotationModel $annotation
     *
     * @return string
     */
    protected function getDefaultTargetPath(AnnotationModel $annotation): string
    {
        $prefix = config('largo.patch_storage').'/'.$annotation->image->volume_id;
        $format = config('largo.patch_format');

        return "{$prefix}/{$annotation->id}.{$format}";
    }
}
