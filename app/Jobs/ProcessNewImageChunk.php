<?php

namespace Biigle\Jobs;

use App;
use Biigle\Image;
use Carbon\Carbon;
use ErrorException;
use Exception;
use File;
use FileCache;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Log;
use Storage;
use VipsImage;

class ProcessNewImageChunk extends Job implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * IDs of the images to generate thumbnails for.
     *
     * Public for testability.
     *
     * @var \Illuminate\Support\Collection
     */
    public $ids;

    /**
     * The desired thumbnail width.
     *
     * @var int
     */
    protected $width;

    /**
     * The desired thumbnail height.
     *
     * @var int
     */
    protected $height;

    /**
     * If the image dimensions exceed this threshold the imag eshould be tiled.
     *
     * @var int
     */
    protected $threshold;

    /**
     * Caches if an image needs a new thumbnail.
     *
     * @var array
     */
    protected $needsThumbnailCache;

    /**
     * Caches if an image needs a check for metadata.
     *
     * @var array
     */
    protected $needsMetadataCache;

    /**
     * Create a new job instance.
     *
     * @param \Illuminate\Support\Collection $ids IDs oth the images to generate thumbnails for.
     *
     * @return void
     */
    public function __construct($ids)
    {
        $this->ids = $ids;
        $this->needsThumbnailCache = [];
        $this->needsMetadataCache = [];
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $this->width = config('thumbnails.width');
        $this->height = config('thumbnails.height');
        $this->threshold = config('image.tiles.threshold');
        $images = Image::with('volume')->whereIn('id', $this->ids)->get();
        $callback = function ($image, $path) {
            if (!File::exists($path)) {
                throw new Exception("File '{$path}' does not exist.");
            }

            $this->collectMetadata($image, $path);
            $this->makeThumbnail($image, $path);
        };

        foreach ($images as $image) {
            try {
                if ($this->needsProcessing($image)) {
                    FileCache::getOnce($image, $callback);
                }

                // Do this after processing so the image has width and height attributes.
                if ($this->shouldBeTiled($image)) {
                    $image->tiled = true;
                    $image->tilingInProgress = true;
                    $image->save();
                    TileSingleImage::dispatch($image);
                }
            } catch (Exception $e) {
                Log::warning("Could not process new image {$image->id}: {$e->getMessage()}");
                if (App::runningUnitTests()) {
                    throw $e;
                }
            }
        }

        $images->pluck('volume')->unique()->each(function ($volume) {
            $volume->flushGeoInfoCache();
        });
    }

    /**
     * Determine if an image needs to be processed.
     *
     * @param Image $image
     *
     * @return bool
     */
    protected function needsProcessing(Image $image)
    {
        return $this->needsThumbnail($image) || $this->needsMetadata($image);
    }

    /**
     * Chack if an image needs a thumbnail.
     *
     * @param Image $image
     *
     * @return bool
     */
    protected function needsThumbnail(Image $image)
    {
        if (!array_key_exists($image->id, $this->needsThumbnailCache)) {
            $prefix = fragment_uuid_path($image->uuid);
            $format = config('thumbnails.format');
            $this->needsThumbnailCache[$image->id] =
                !Storage::disk(config('thumbnails.storage_disk'))
                    ->exists("{$prefix}.{$format}");
        }

        return $this->needsThumbnailCache[$image->id];
    }

    /**
     * Makes a thumbnail for a single image.
     *
     * @param Image $image
     * @param string $path Path to the cached image file.
     */
    protected function makeThumbnail(Image $image, $path)
    {
        // Skip existing thumbnails.
        if ($this->needsThumbnail($image)) {
            $prefix = fragment_uuid_path($image->uuid);
            $format = config('thumbnails.format');
            $buffer = VipsImage::thumbnail($path, $this->width, [
                    'height' => $this->height,
                ])
                // Strip EXIF information to not auto rotate thumbnails because
                // the orientation of AUV captured images is not reliable.
                ->writeToBuffer(".{$format}", [
                    'Q' => 85,
                    'strip' => true,
                ]);

            Storage::disk(config('thumbnails.storage_disk'))
                    ->put("{$prefix}.{$format}", $buffer);
        }
    }

    /**
     * Chack if an image has missing metadata.
     *
     * @param Image $image
     *
     * @return bool
     */
    protected function needsMetadata(Image $image)
    {
        if (!array_key_exists($image->id, $this->needsMetadataCache)) {
            $this->needsMetadataCache[$image->id] = !$image->taken_at ||
                !$image->lng ||
                !$image->lat ||
                !$image->width ||
                !$image->height ||
                !$image->size ||
                !$image->mimetype ||
                !array_key_exists('gps_altitude', $image->metadata);
        }

        return $this->needsMetadataCache[$image->id];
    }

    /**
     * Collect image metadata.
     *
     * @param Image $image
     * @param string $path Path to the cached image file.
     */
    protected function collectMetadata(Image $image, $path)
    {
        if (!$this->needsMetadata($image)) {
            return;
        }

        if (is_null($image->size)) {
            $image->size = File::size($path);
        }

        if (is_null($image->mimetype)) {
            $image->mimetype = File::mimeType($path);
        }

        if (is_null($image->width) || is_null($image->height)) {
            try {
                $i = VipsImage::newFromFile($path);
                $image->width = $i->width;
                $image->height = $i->height;
            } catch (Exception $e) {
                // dimensions stay null
            }
        }

        $exif = $this->getExif($path);

        // Exif may be false if no error has been thrown, too (e.g. if the image is PNG)!
        if ($exif !== false) {
            if ($this->hasTakenAtInfo($exif)) {
                try {
                    $date = Carbon::parse($exif['DateTimeOriginal']);
                    // Carbon returns a negative timestamp for the date
                    // '0000-00-00 00:00:00'. This will not be accepted by the database
                    // so catch it here.
                    if ($date->timestamp > 0) {
                        $image->taken_at = $date;
                    }
                } catch (Exception $e) {
                    // date could not be parsed
                    $image->taken_at = null;
                }
            }

            if ($this->hasGpsInfo($exif)) {
                $image->lng = $this->getGps(
                    $exif['GPSLongitude'],
                    $exif['GPSLongitudeRef']
                );
                $image->lat = $this->getGps(
                    $exif['GPSLatitude'],
                    $exif['GPSLatitudeRef']
                );

                // It is unlikely that the position is exactly 0. More likely is a false
                // position if the camera sets 0 as "no position detected". So we assume
                // the image has no position information in this case.
                if ($image->lng === 0.0 && $image->lat === 0.0) {
                    $image->lng = null;
                    $image->lat = null;
                }
            }

            if ($this->hasExtendedGpsInfo($exif)) {
                // GPSAltitudeRef is \x00 for above sea level and \x01 for below sea
                // level. We use a negative gps_altitude for below sea level.
                $ref = ($exif['GPSAltitudeRef'] === "\x00") ? 1 : -1;
                $image->metadata = [
                    'gps_altitude' => $ref * $this->fracToFloat($exif['GPSAltitude']),
                ];
            }
        }

        $image->save();
    }

    /**
     * Check if an exif array contains a creation date.
     *
     * @param  array   $exif
     * @return bool
     */
    protected function hasTakenAtInfo(array $exif)
    {
        return array_key_exists('DateTimeOriginal', $exif);
    }

    /**
     * Check if an exif array contains GPS information.
     *
     * @param  array   $exif
     * @return bool
     */
    protected function hasGpsInfo(array $exif)
    {
        return array_key_exists('GPSLatitude', $exif) &&
            array_key_exists('GPSLatitudeRef', $exif) &&
            array_key_exists('GPSLongitude', $exif) &&
            array_key_exists('GPSLongitudeRef', $exif);
    }

    /**
     * Check if an exif array contains even more GPS information.
     *
     * @param  array   $exif
     * @return bool
     */
    protected function hasExtendedGpsInfo(array $exif)
    {
        return array_key_exists('GPSAltitude', $exif) &&
            array_key_exists('GPSAltitudeRef', $exif);
    }

    /**
     * Get the exif information of an image if possible.
     *
     * @param string $path Path to the image file
     *
     * @return array|bool
     */
    protected function getExif($path)
    {
        try {
            $exif = @exif_read_data($path);
        } catch (ErrorException $e) {
            $exif = false;
        }

        return $exif;
    }

    /**
     * Converts a EXIF GPS coordinate to a float
     * see: http://stackoverflow.com/a/2572991/1796523.
     *
     * @param  array $exifCoord Containing fractures like `"41/1"`
     * @param  string $hemi      Hemisphere, one of `N`, `S`, `E`, or `W`
     * @return float
     */
    protected function getGps($exifCoord, $hemi)
    {
        $fracs = count($exifCoord);
        $degrees = $fracs > 0 ? $this->fracToFloat($exifCoord[0]) : 0;
        $minutes = $fracs > 1 ? $this->fracToFloat($exifCoord[1]) : 0;
        $seconds = $fracs > 2 ? $this->fracToFloat($exifCoord[2]) : 0;
        $flip = ($hemi === 'W' || $hemi === 'S') ? -1 : 1;

        return $flip * ($degrees + $minutes / 60 + $seconds / 3600);
    }

    /**
     * Converts a fracture (string) like "1/2" to a float.
     *
     * @param  string $frac
     * @return float
     */
    protected function fracToFloat($frac)
    {
        $parts = explode('/', $frac);
        $count = count($parts);

        if ($count === 0) {
            return 0;
        } elseif ($count === 1) {
            return $parts[0];
        }

        // Don't use === to catch all incorrect values.
        if ($parts[1] == 0) {
            return 0;
        }

        return floatval($parts[0]) / floatval($parts[1]);
    }

    /**
     * Determine if an image should be tiled.
     *
     * @param Image $image
     *
     * @return bool
     */
    protected function shouldBeTiled(Image $image)
    {
        if ($image->tiled) {
            $disk = Storage::disk(config('image.tiles.disk'));
            $fragment = fragment_uuid_path($image->uuid);
            if ($disk->exists("{$fragment}/ImageProperties.xml")) {
                return false;
            }
        }

        return $image->width > $this->threshold || $image->height > $this->threshold;
    }
}
