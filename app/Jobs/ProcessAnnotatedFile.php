<?php

namespace Biigle\Jobs;

use Biigle\Annotation;
use Biigle\Exceptions\ProcessAnnotatedFileException;
use Biigle\FileCache\Exceptions\FileLockedException;
use Biigle\Shape;
use Biigle\VideoAnnotation;
use Biigle\VolumeFile;
use Exception;
use FileCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Jcupitt\Vips\Image;
use Str;
use SVG\Nodes\Shapes\SVGCircle;
use SVG\Nodes\Shapes\SVGEllipse;
use SVG\Nodes\Shapes\SVGPolygon;
use SVG\Nodes\Shapes\SVGPolyline;
use SVG\Nodes\Shapes\SVGRect;
use SVG\Nodes\Structures\SVGGroup;
use SVG\Nodes\SVGNodeContainer;
use SVG\SVG;

abstract class ProcessAnnotatedFile extends GenerateFeatureVectors
{
    use SerializesModels, InteractsWithQueue;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Ignore this job if the annotation does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     *
     * @param VolumeFile $file The file to process.
     * @param array $only If filled with annotation IDs belonging to the
     * file, only the annotations will be processed.
     * @param bool|boolean $skipPatches Disable generation of annotation patches.
     * @param bool|boolean $skipFeatureVectors Disable generation of annotation
     * feature vectors.
     * @param bool|boolean $skipSvgs Disable generation of annotation SVGs.
     * @param ?string $targetDisk The storage disk to store annotation patches to (
     * default is the configured `largo.patch_storage_disk`).
     */
    public function __construct(
        public VolumeFile $file,
        public array $only = [],
        public bool $skipPatches = false,
        public bool $skipFeatureVectors = false,
        public bool $skipSvgs = false,
        public ?string $targetDisk = null
    ) {
        $this->targetDisk = $targetDisk ?: config('largo.patch_storage_disk');
    }

    /**
     * Assemble the target path for an annotation patch.
     *
     * @param Annotation $annotation
     *
     * @return string
     */
    public static function getTargetPath(Annotation $annotation, ?string $format = null): string
    {
        $prefix = fragment_uuid_path($annotation->getFile()->uuid);
        $format = $format ?: config('largo.patch_format');

        return match ($annotation::class) {
            // Add "v-" to make absolutely sure that no collisions (same UUID, same ID)
            // occur because patches are stored on the same disk.
            VideoAnnotation::class => "{$prefix}/v-{$annotation->id}.{$format}",
            // This is the old patch storage scheme, so we don't add "i-" for backwards
            // compatibility.
            default => "{$prefix}/{$annotation->id}.{$format}",
        };
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            // Don't load the file if it is not needed.
            if (!$this->skipPatches || !$this->skipFeatureVectors) {
                FileCache::get($this->file, [$this, 'handleFile'], true);
            }

            if (!$this->skipSvgs) {
                $this->createSvgs();
            }
        } catch (FileLockedException $e) {
            // Retry this job without increasing the attempts if the file is currently
            // written by another worker. This worker can process other jobs in the
            // meantime.
            // See: https://github.com/laravel/ideas/issues/735
            $class = get_class($this->file);
            Log::debug("Redispatching annotated {$class} {$this->file->id}.", ['exception' => $e]);
            $this->redispatch();
        } catch (Exception $e) {
            $class = get_class($this->file);
            if ($this->shouldRetryAfterException($e)) {
                $attempts = $this->attempts();
                Log::debug("Backoff annotated {$class} {$this->file->id} ({$attempts} attempts): {$e->getMessage()}", ['exception' => $e]);
                // Exponential backoff for retry after 10 and then 20 minutes.
                $this->release($attempts * 600);
            } elseif ($this->shouldGiveUpAfterException($e)) {
                Log::warning("Could not process annotated {$class} {$this->file->id}: {$e->getMessage()}", ['exception' => $e]);
            } else {
                throw new ProcessAnnotatedFileException("Could not process annotated {$class} {$this->file->id}.", previous: $e);
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
     * Determine if the job should give up trying because the error will likely not be
     * fixed the next time.
     *
     * @param Exception $e
     */
    protected function shouldGiveUpAfterException(Exception $e): bool
    {
        $message = $e->getMessage();
        $giveUpError = (
            // See: https://curl.haxx.se/libcurl/c/libcurl-errors.html
            // Could not resolve host.
            Str::contains($message, 'cURL error 6:') ||
            // Could not connect to server.
            Str::contains($message, 'cURL error 7:') ||
            // Operation timed out (connection too slow?).
            Str::contains($message, 'cURL error 28:') ||
            // Connection reset by peer.
            Str::contains($message, 'cURL error 56:') ||
            // SSL certificate problem of the remote server.
            Str::contains($message, 'cURL error 60:') ||
            // Maybe the file does not exist any more and the server responds with a 404.
            Str::of($message)->isMatch('/MIME type \'(.+)\' not allowed/') ||
            // This can happen if a user disk was deleted.
            Str::of($message)->isMatch('/Disk \[disk-[0-9]+\] does not have a configured driver\./') ||
            // File not found.
            Str::contains($message, 'Unable to read file from location:')
        );

        return $giveUpError;
    }

    /**
     * Determine if this job should retry instead of fail after an exception
     *
     * @param Exception $e
     */
    protected function shouldRetryAfterException(Exception $e): bool
    {
        $message = $e->getMessage();
        $knownError = (
            // The remote source might be available again after a while.
            Str::contains($message, 'The source resource could not be established') ||
            // This error presumably occurs due to worker concurrency.
            Str::contains($message, 'Impossible to create the root directory')
        );

        if ($knownError) {
            return $this->attempts() < ($this->tries * 2);
        }

        return $this->attempts() < $this->tries;
    }

    /**
     * Generate and upload annotation SVGs for the file.
     */
    public function createSvgs(): void
    {
        $this->getAnnotationQuery($this->file)
            // No SVGs should be generated for whole frame annotations.
            ->where('shape_id', '!=', Shape::wholeFrameId())
            ->eachById(fn ($a) => $this->createSvg($a));
    }

    /**
     * Generate and upload an SVG for the annotation.
     */
    protected function createSvg(Annotation $annotation): void
    {
        $thumbWidth = config('thumbnails.width');
        $thumbHeight = config('thumbnails.height');
        $padding = config('largo.patch_padding');
        $pointPadding = config('largo.point_padding');

        $svg = new SVG($thumbWidth, $thumbHeight);
        $doc = $svg->getDocument();

        $points = $annotation->getPoints();
        if (is_array($points[0])) {
            $points = $points[0];
        }
        $shape = $annotation->getShape();

        $box = $this->getAnnotationBoundingBox($points, $shape, $pointPadding, $padding);
        $box = $this->ensureBoxAspectRatio($box, $thumbWidth, $thumbHeight);
        $box = $this->makeBoxContained($box, $this->file->width, $this->file->height);

        // Set viewbox to show svgAnnotation
        $doc->setAttribute('viewBox', implode(' ', $box));

        $svgAnnotation = $this->getSVGAnnotation($points, $shape);
        $doc->addChild($svgAnnotation);

        $path = self::getTargetPath($annotation, format: 'svg');

        Storage::disk($this->targetDisk)->put($path, $svg);
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
            $padding = config('largo.patch_padding');
            $pointPadding = config('largo.point_padding');

            $box = $this->getAnnotationBoundingBox($points, $shape, $pointPadding, $padding);
            $box = $this->ensureBoxAspectRatio($box, $thumbWidth, $thumbHeight);
            $box = $this->makeBoxContained($box, $image->width, $image->height);

            $image = $image->crop(...$box)->resize(floatval($thumbWidth) / $box[2]);
        }

        return $image->writeToBuffer('.'.config('largo.patch_format'), [
            'Q' => 85,
            'strip' => true,
        ]);
    }

    /**
     * Generates feature vectors for the specified annotations belonging to the file of
     * this job. This method either creates new feature vector models or updates the
     * existing ones for the annotations.
     *
     * @param Collection $annotations
     * @param array|string $filePath If a string, a file path to the local image to use for feature vector generation. If an array, a map of annotation IDs to a local image file path.
     */
    protected function generateFeatureVectors(Collection $annotations, array|string $filePath): void
    {
        $boxes = $this->generateFileInput($this->file, $annotations);

        if (empty($boxes)) {
            return;
        }

        // A test output CSV with 1000 entries was about 8 MB so fewer annotations should
        // safely fit within the (faster) 64 MB of shared memory in a Docker container.
        // We allow another option for more than 10k annotations (although they are
        // chunked by 10k in the image/video subclasses) because this class may be used
        // elsewhere with more annotations, too.
        if ($annotations->count() <= 1000) {
            $inputPath = tempnam('/dev/shm', 'largo_feature_vector_input');
            $outputPath = tempnam('/dev/shm', 'largo_feature_vector_output');
        } else {
            $inputPath = tempnam(sys_get_temp_dir(), 'largo_feature_vector_input');
            $outputPath = tempnam(sys_get_temp_dir(), 'largo_feature_vector_output');
        }

        try {
            if (is_array($filePath)) {
                $input = [];
                foreach ($boxes as $id => $box) {
                    // This can happen for individual video frames that could not be
                    // extracted.
                    if (!array_key_exists($id, $filePath)) {
                        continue;
                    }

                    $path = $filePath[$id];
                    if (array_key_exists($path, $input)) {
                        $input[$path][$id] = $box;
                    } else {
                        $input[$path] = [$id => $box];
                    }
                }
            } else {
                $input = [$filePath => $boxes];
            }

            // The "continue" above could result in an empty array.
            if (empty($input)) {
                return;
            }

            File::put($inputPath, json_encode($input));
            $this->python($inputPath, $outputPath);
            $output = $this->readOutputCsv($outputPath);
            $this->updateOrCreateFeatureVectors($annotations, $output);
        } finally {
            File::delete($outputPath);
            File::delete($inputPath);
        }
    }

    /**
     * Create the feature vectors based on the Python script output.
     */
    abstract protected function updateOrCreateFeatureVectors(Collection $annotations, \Generator $output): void;

    /**
     * Get the query builder for the annotations (maybe filtered by IDs).
     *
     * @return Builder<covariant Annotation>
     */
    abstract protected function getAnnotationQuery(VolumeFile $file): Builder;

    /**
     * Draw annotation as SVG
     *
     * @param array $points one dimensional array filled with coordinates of annotation
     * @param Shape $shape shape of given annotation
     *
     * @return SVGNodeContainer annotation as SVG
     *
     */
    protected function getSVGAnnotation(array $points, Shape $shape): SVGNodeContainer
    {
        $tuples = [];
        if ($shape->id !== Shape::circleId()) {
            for ($i = 0; $i < sizeof($points) - 1; $i = $i + 2) {
                $tuples[] = [$points[$i], $points[$i + 1]];
            }
        }

        $annotation = match ($shape->id) {
            Shape::pointId() => new SVGCircle($points[0], $points[1], 5),
            Shape::circleId() => new SVGCircle($points[0], $points[1], $points[2]),
            Shape::polygonId() => new SVGPolygon($tuples),
            Shape::lineId() => new SVGPolyline($tuples),
            Shape::rectangleId() => $this->getRectangleSvgAnnotation($tuples),
            Shape::ellipseId() => $this->getEllipseSvgAnnotation($tuples),
            default => null,
        };

        if ($shape->id !== Shape::pointId()) {
            $annotation->setAttribute('fill', 'none');
            $annotation->setAttribute('vector-effect', 'non-scaling-stroke');
        }

        if ($annotation instanceof SVGPolyline) {
            $annotation->setAttribute('stroke-linecap', 'round');
        }

        if (!($annotation instanceof SVGCircle)) {
            $annotation->setAttribute('stroke-linejoin', 'round');
        }

        $outline = clone $annotation;

        if ($shape->id === Shape::pointId()) {
            $outline->setAttribute('r', 6);
            $outline->setAttribute('fill', '#fff');
            $annotation->setAttribute('fill', '#666');
        } else {
            $outline->setAttribute('stroke', '#fff');
            $outline->setAttribute('stroke-width', '5px');
            $annotation->setAttribute('stroke', '#666');
            $annotation->setAttribute('stroke-width', '3px');
        }

        $group = new SVGGroup;
        $group->addChild($outline);
        $group->addChild($annotation);

        return $group;
    }

    /**
     * Get an SVG rectangle element.
     */
    protected function getRectangleSvgAnnotation(array $tuples): SVGRect
    {
        $sortedCoords = $this->getOrientedCoordinates($tuples, Shape::rectangle());

        $upperLeft = $sortedCoords['UL'];
        $width = sqrt(pow($sortedCoords['UR'][0] - $upperLeft[0], 2) + pow($sortedCoords['UR'][1] - $upperLeft[1], 2));
        $height = sqrt(pow($upperLeft[0] - $sortedCoords['LL'][0], 2) + pow($upperLeft[1] - $sortedCoords['LL'][1], 2));
        $rect = new SVGRect($upperLeft[0], $upperLeft[1], $width, $height);

        // Add rotation
        $vecLR = [$sortedCoords['UR'][0] - $upperLeft[0], $sortedCoords['UR'][1] - $upperLeft[1]];
        $u = [$width, 0];
        $cos = $this->computeRotationAngle($vecLR, $u);
        $rect->setAttribute('transform', 'rotate(' . $cos . ',' . $upperLeft[0] . ',' . $upperLeft[1] . ')');

        return $rect;
    }

    /**
     * Get an SVG ellipse element.
     */
    protected function getEllipseSvgAnnotation(array $tuples): SVGEllipse
    {
        $sortedCoords = $this->getOrientedCoordinates($tuples, Shape::ellipse());

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

        return $elps;
    }

    /**
     * Computes angle between two vectors
     *
     * @param array $v first vector
     * @param array $u second vector
     * @return float rotation angle in degree
     * **/
    protected function computeRotationAngle(array $v, array $u): float
    {
        // If (upper) left and (upper) right coordinate have equal y coordinate, then there is no rotation
        if (intval($v[1]) === 0) {
            return 0;
        }

        // Compute angle
        $scalarProd = 0;
        $vNorm = 0;
        $uNorm = 0;
        for ($i = 0; $i < count($v); $i++) {
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
     * @param Shape $shape shapeId of given annotation
     *
     * @return array with coordinates assigned to their position on the plane
     *
     */
    protected function getOrientedCoordinates(array $tuples, Shape $shape): array
    {
        $assigned = [];

        // Sort x values in ascending order
        usort($tuples, fn ($a, $b) => $a[0] <=> $b[0]);

        // Note: y-axis is inverted
        if ($shape->id === Shape::rectangleId()) {
            $assigned['LL'] = $tuples[0][1] > $tuples[1][1] ? $tuples[0] : $tuples[1];
            $assigned['UL'] = $tuples[0][1] < $tuples[1][1] ? $tuples[0] : $tuples[1];
            $assigned['LR'] = $tuples[2][1] > $tuples[3][1] ? $tuples[2] : $tuples[3];
            $assigned['UR'] = $tuples[2][1] < $tuples[3][1] ? $tuples[2] : $tuples[3];
        } elseif ($shape->id === Shape::ellipseId()) {
            $assigned['L'] = $tuples[0];
            $assigned['R'] = end($tuples);
            $assigned['U'] = $tuples[1][1] < $tuples[2][1] ? $tuples[1] : $tuples[2];
            $assigned['D'] = $tuples[1][1] > $tuples[2][1] ? $tuples[1] : $tuples[2];
        }

        return $assigned;
    }

    /**
     * Dispatch a copy of this job with a delay.
     */
    protected function redispatch(): void
    {
        static::dispatch(
            $this->file,
            $this->only,
            $this->skipPatches,
            $this->skipFeatureVectors,
            $this->skipSvgs,
            $this->targetDisk
        )->onConnection($this->connection)->onQueue($this->queue)->delay(60);
    }
}
