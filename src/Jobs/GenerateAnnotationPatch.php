<?php

namespace Biigle\Modules\Largo\Jobs;

use Str;
use Storage;
use Exception;
use VipsImage;
use FileCache;
use Biigle\Image;
use Biigle\Shape;
use Biigle\Jobs\Job;
use Biigle\Contracts\Annotation;
use Illuminate\Queue\InteractsWithQueue;
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
     * The storage disk to store the annotation patches to.
     *
     * @var string
     */
    protected $targetDisk;

    /**
     * Create a new job instance.
     *
     * @param Annotation $annotation The the annotation to generate a patch for.
     * @param string|null $targetDisk The storage disk to store the annotation patches to.
     *
     * @return void
     */
    public function __construct(Annotation $annotation, $targetDisk = null)
    {
        // We do not use the SerializesModels trait because there is a good chance that
        // the annotation is deleted when this job should be executed. If this is the
        // case, this job should be ignored (see handle method).
        $this->annotationId = $annotation->getQueueableId();
        $this->annotationClass = get_class($annotation);
        $this->targetDisk = $targetDisk !== null ? $targetDisk : config('largo.patch_storage_disk');
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

        try {
            FileCache::get($this->annotation->getImage(), [$this, 'handleImage']);
        } catch (Exception $e) {
            if ($this->shouldRetryAfterException($e)) {
                // Retry in 10 minutes.
                $this->release(600);
            } else {
                throw new Exception("Could not generate annotation patch for annotation {$this->annotationId}: {$e->getMessage()}");
            }
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
        // Do not get the path in the constructor because that would require fetching all
        // the images of the annotations. This would be really slow when lots of
        // annotation patchs should be generated.
        $targetPath = $this->getTargetPath($this->annotation);

        $thumbWidth = config('thumbnails.width');
        $thumbHeight = config('thumbnails.height');

        $image = $this->getVipsImage($path);
        $rect = $this->getPatchRect($this->annotation, $thumbWidth, $thumbHeight);
        $rect = $this->makeRectContained($rect, $image);

        $buffer = $image->crop(
                $rect['left'],
                $rect['top'],
                $rect['width'],
                $rect['height']
            )
            ->resize(floatval($thumbWidth) / $rect['width'])
            ->writeToBuffer('.'.config('largo.patch_format'), [
                'Q' => 85,
                'strip' => true,
            ]);

        Storage::disk($this->targetDisk)->put($targetPath, $buffer);
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

        // Ensure the minimum width so the annotation patch is not "zoomed in".
        if ($width < $thumbWidth) {
            $delta = ($thumbWidth - $width) / 2.0;
            $left -= $delta;
            $right += $delta;
            $width = $thumbWidth;
        }

        // Ensure the minimum height so the annotation patch is not "zoomed in".
        if ($height < $thumbHeight) {
            $delta = ($thumbHeight - $height) / 2.0;
            $top -= $delta;
            $bottom += $delta;
            $height = $thumbHeight;
        }

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
     * Assemble the target path for an annotation patch.
     *
     * @param Annotation $annotation
     *
     * @return string
     */
    protected function getTargetPath(Annotation $annotation): string
    {
        $prefix = fragment_uuid_path($annotation->getImage()->uuid);
        $format = config('largo.patch_format');

        return "{$prefix}/{$annotation->id}.{$format}";
    }

    /**
     * Determine if this job should retry instead of fail after an exception
     *
     * @param Exception $e
     *
     * @return bool
     */
    protected function shouldRetryAfterException(Exception $e)
    {
        $message = $e->getMessage();
        return $this->attempts() < 3 && (
            // The remote source might be available again after a while.
            Str::contains($message, 'The source resource could not be established') ||
            // This error presumably occurs due to worker concurrency.
            Str::contains($message, 'Impossible to create the root directory')
        );
    }
}
