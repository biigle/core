<?php

namespace Biigle\Modules\Largo\Jobs;

use Str;
use \SVG\SVG;
use Exception;
use FileCache;
use Biigle\Shape;
use Biigle\Jobs\Job;
use Biigle\VolumeFile;
use Jcupitt\Vips\Image;
use Biigle\VideoAnnotation;
use SVG\Nodes\Shapes\SVGLine;
use SVG\Nodes\Shapes\SVGRect;
use \SVG\Nodes\Shapes\SVGCircle;
use Biigle\Contracts\Annotation;
use SVG\Nodes\Shapes\SVGEllipse;
use SVG\Nodes\Shapes\SVGPolygon;
use SVG\Nodes\Shapes\SVGPolyline;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Biigle\FileCache\Exceptions\FileLockedException;

abstract class GenerateAnnotationPatch extends Job implements ShouldQueue
{
    use SerializesModels, InteractsWithQueue;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

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
     * Ignore this job if the annotation does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;


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
        $this->annotation = $annotation;
        $this->targetDisk = $targetDisk !== null
            ? $targetDisk
            : config('largo.patch_storage_disk');
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            FileCache::get($this->annotation->getFile(), [$this, 'handleFile'], true);
        } catch (FileLockedException $e) {
            // Retry this job without increasing the attempts if the file is currently
            // written by another worker. This worker can process other jobs in the
            // meantime.
            // See: https://github.com/laravel/ideas/issues/735
            static::dispatch($this->annotation, $this->targetDisk)
                ->onConnection($this->connection)
                ->onQueue($this->queue)
                ->delay(60);
        } catch (Exception $e) {
            if ($this->shouldRetryAfterException($e)) {
                // Exponential backoff for retry after 10 and then 20 minutes.
                $this->release($this->attempts() * 600);
            } else {
                $class = get_class($this->annotation);
                Log::warning("Could not generate annotation patch for {$class} {$this->annotation->id}: {$e->getMessage()}", ['exception' => $e]);
            }
        }
    }

    /**
     * Handle a single file.
     *
     * @param VolumeFile $file
     * @param string $path Path to the cached file.
     */
    abstract public function handleFile(VolumeFile $file, $path);

    /**
     * Assemble the target path for an annotation patch.
     *
     * @param Annotation $annotation
     *
     * @return string
     */
    protected function getTargetPath(Annotation $annotation): string
    {
        $prefix = fragment_uuid_path($annotation->getFile()->uuid);
        $format = config('largo.patch_format');

        if ($annotation instanceof VideoAnnotation) {
            // Add "v-" to make absolutely sure that no collisions (same UUID, same ID)
            // occur because patches are stored on the same disk.
            return "{$prefix}/v-{$annotation->id}.{$format}";
        }

        // This is the old patch storage scheme, so we don't add "i-" for backwards
        // compatibility.
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
        return $this->attempts() < $this->tries && (
            // The remote source might be available again after a while.
            Str::contains($message, 'The source resource could not be established') ||
            // This error presumably occurs due to worker concurrency.
            Str::contains($message, 'Impossible to create the root directory')
        );
    }

    /**
     * Calculate the bounding rectangle of the patch to extract.
     *
     * @param array $points
     * @param Shape $Shape
     * @param int $thumbWidth
     * @param int $thumbHeight
     *
     * @return array Containing width, height, top and left
     */
    protected function getPatchRect(array $points, Shape $shape, $thumbWidth, $thumbHeight)
    {
        $padding = config('largo.patch_padding');

        switch ($shape->id) {
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
     * @param Image $image
     *
     * @return array
     */
    protected function makeRectContained($rect, $width, $height)
    {
        // Order of min max is importans so the point gets no negative coordinates.
        $rect['left'] = min($width - $rect['width'], $rect['left']);
        $rect['left'] = max(0, $rect['left']);
        $rect['top'] = min($height - $rect['height'], $rect['top']);
        $rect['top'] = max(0, $rect['top']);

        // Adjust dimensions of rect if it is larger than the image.
        $rect['width'] = min($width, $rect['width']);
        $rect['height'] = min($height, $rect['height']);

        return $rect;
    }

    /**
     * Get the annotation patch as buffer.
     *
     * @param Image $image
     * @param array $points
     * @param Shape $shape
     *
     * @return string
     */
    protected function getAnnotationPatch($image, $points, $shape)
    {
        $thumbWidth = config('thumbnails.width');
        $thumbHeight = config('thumbnails.height');

        if ($shape->id === Shape::wholeFrameId()) {
            $image = $image->resize(floatval($thumbWidth) / $image->width);
        } else {
            $rect = $this->getPatchRect($points, $shape, $thumbWidth, $thumbHeight);
            $rect = $this->makeRectContained($rect, $image->width, $image->height);

            $image = $image->crop(
                $rect['left'],
                $rect['top'],
                $rect['width'],
                $rect['height']
            )
                ->resize(floatval($thumbWidth) / $rect['width']);
        }

        return $image->writeToBuffer('.' . config('largo.patch_format'), [
            'Q' => 85,
            'strip' => true,
        ]);
    }

    /**
     * Creates transparent SVG thumbnail with annotation
     * 
     * @param int $width of original image
     * @param int $height of original image
     * @param Shape $shape shape of given annotation
     * @param array $points one dimensional array filled with coordinates of annotation
     * 
     * @return mixed SVG image with annotation
     * **/
    protected function getSVGAnnotationPatch($width, $height, $points, $shape)
    {

        $thumbWidth = config('thumbnails.width');
        $thumbHeight = config('thumbnails.height');

        $image = new SVG($thumbWidth, $thumbHeight);
        $doc = $image->getDocument();

        $annotation = $this->getSVGAnnotation($shape->id, $points);

        // Crop and resize image
        $rect = $this->getPatchRect($points, $shape, $thumbWidth, $thumbHeight);
        $rect = $this->makeRectContained($rect, $width, $height);

        // Set viewbox to show annotation
        $doc->setAttribute('viewBox', $rect['left'] . ' ' . $rect['top'] . ' ' . $rect['width'] . ' ' . $rect['height']);

        foreach($annotation as $annotation) {
            $annotation->setAttribute('vector-effect', 'non-scaling-stroke');
            $doc->addChild($annotation);
        }

        return $image;
    }


    /**
     * Draw annotation as SVG
     * 
     * @param int $shapeId shape of given annotation
     * @param array $points one dimensional array filled with coordinates of annotation
     * 
     * @return mixed annotation as SVG
     * 
     * **/
    protected function getSVGAnnotation($shapeId, $points)
    {
        $tuples = [];
        if ($shapeId !== Shape::circleId()) {
            for ($i = 0; $i < sizeof($points) - 1; $i = $i + 2) {
                $tuples[] = [$points[$i], $points[$i + 1]];
            }
        }

        switch ($shapeId) {
            case Shape::pointId():
                $radius = 1;
                return [new SVGCircle($points[0], $points[1], $radius)];
            case Shape::circleId():
                return [new SVGCircle($points[0], $points[1], $points[2])];
            case Shape::polygonId():
                return [new SVGPolygon($tuples)];
            case Shape::lineId():
                return [new SVGPolyline($tuples)];
            case Shape::rectangleId():
                $sortedCoords = $this->getOrientedCoordinates($tuples, Shape::rectangleId());

                $upperLeft = $sortedCoords['UL'];
                $width = sqrt(pow($sortedCoords['UR'][0] - $upperLeft[0], 2) + pow($sortedCoords['UR'][1] - $upperLeft[1], 2));
                $height = sqrt(pow($upperLeft[0] - $sortedCoords['LL'][0], 2) + pow($upperLeft[1] - $sortedCoords['LL'][1], 2));
                $rect = new SVGRect($upperLeft[0], $upperLeft[1], $width, $height);

                // Add rotation
                $vecLR = [$sortedCoords['UR'][0] - $upperLeft[0], $sortedCoords['UR'][1] - $upperLeft[1]];
                $u = [$width, 0];
                $cos = $this->computeRotationAngle($vecLR, $u);
                $rect->setAttribute('transform', 'rotate(' . $cos . ',' . $upperLeft[0] . ',' . $upperLeft[1] . ')');

                return [$rect];
            case Shape::ellipseId():
                $sortedCoords = $this->getOrientedCoordinates($tuples, Shape::ellipseId());

                $vecLR = [$sortedCoords['R'][0] - $sortedCoords['L'][0], $sortedCoords['R'][1] - $sortedCoords['L'][1]];
                $vecUD = [$sortedCoords['D'][0] - $sortedCoords['U'][0], $sortedCoords['D'][1] - $sortedCoords['U'][1]];
                $radiusX = sqrt(pow($vecLR[0], 2) + pow($vecLR[1], 2)) / 2.0;
                $radiusY = sqrt(pow($vecUD[0], 2) + pow($vecUD[1], 2)) / 2.0;
                $center = [0.5 * $vecLR[0] + $sortedCoords['L'][0], 0.5 * $vecLR[1] + $sortedCoords['L'][1]];
                $elps = new SVGEllipse($center[0], $center[1], $radiusX, $radiusY);

                // Add rotation
                $v = [$sortedCoords['R'][0] - $sortedCoords['L'][0], $sortedCoords['R'][1] - $sortedCoords['L'][1]];
                $u = [$center[0], 0];
                $cos = $this->computeRotationAngle($v, $u);

                $elps->setAttribute('transform', 'rotate(' . $cos . ',' . $center[0] . ',' . $center[1] . ')');
                return [$elps];
        }
    }

    /**
     * Computes angle between two vectors
     * 
     * @param array $v first vector
     * @param array $u second vector
     * @return float rotation angle in degree
     * **/
    protected function computeRotationAngle($v, $u)
    {
        // If (upper) left and (upper) right coordinate have equal y coordinate, then there is no rotation
        if ($v[1] === 0) {
            return 0;
        }

        // Compute angle
        $scalarProd = 0;
        $vNorm = 0;
        $uNorm = 0;
        for ($i = 0; $i < sizeof($v); $i++) {
            $scalarProd += $v[$i] * $u[$i];
            $vNorm += pow($v[$i], 2);
            $uNorm += pow($u[$i], 2);
        }
        $deg = rad2deg(acos($scalarProd / (sqrt($vNorm) * sqrt($uNorm))));

        // Use opposite angle, if rotation is needed in counter clock wise direction
        return $v[1] > 0 ? $deg : 360 - $deg;
    }

    /**
     * Determines position of coordinate
     * 
     * @param array $tuples coordinates array
     * @param int $shapeId shapeId of given annotation
     * 
     * @return array with coordinates assigned to their position on the plane
     * 
     * **/
    protected function getOrientedCoordinates($tuples, $shapeId)
    {
        $assigned = [];

        // Sort x values in ascending order
        usort($tuples, fn($a, $b) => $a[0] <=> $b[0]);

        // Note: y-axis is inverted
        if ($shapeId === Shape::rectangleId()) {
            $assigned['LL'] = $tuples[0][1] > $tuples[1][1] ? $tuples[0] : $tuples[1];
            $assigned['UL'] = $tuples[0][1] < $tuples[1][1] ? $tuples[0] : $tuples[1];
            $assigned['LR'] = $tuples[2][1] > $tuples[3][1] ? $tuples[2] : $tuples[3];
            $assigned['UR'] = $tuples[2][1] < $tuples[3][1] ? $tuples[2] : $tuples[3];
        }
        if ($shapeId === Shape::ellipseId()) {
            $assigned['L'] = $tuples[0];
            $assigned['R'] = end($tuples);
            $assigned['U'] = $tuples[1][1] < $tuples[2][1] ? $tuples[1] : $tuples[2];
            $assigned['D'] = $tuples[1][1] > $tuples[2][1] ? $tuples[1] : $tuples[2];
        }

        return $assigned;
    }
}
