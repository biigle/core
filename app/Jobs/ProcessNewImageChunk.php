<?php

namespace Biigle\Jobs;

use Log;
use File;
use Exception;
use VipsImage;
use ImageCache;
use Biigle\Image;
use Carbon\Carbon;
use ErrorException;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\DispatchesJobs;

class ProcessNewImageChunk extends Job implements ShouldQueue
{
    use InteractsWithQueue, DispatchesJobs;

    /**
     * IDs of the images to generate thumbnails for.
     *
     * Public for testability.
     *
     * @var Collection
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
     * Create a new job instance.
     *
     * @param Collection $ids IDs oth the images to generate thumbnails for.
     *
     * @return void
     */
    public function __construct($ids)
    {
        $this->ids = $ids;
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
            $this->collectMetadata($image, $path);
            $this->makeThumbnail($image, $path);
            if ($this->shouldBeTiled($image, $path)) {
                $this->dispatch(new TileSingleImage($image));
            }
        };

        foreach ($images as $image) {
            try {
                ImageCache::getOnce($image, $callback);
            } catch (Exception $e) {
                Log::error("Could not process new image {$image->id}: {$e->getMessage()}");
            }
        }

        $images->pluck('volume')->unique()->each(function ($volume) {
            $volume->flushGeoInfoCache();
        });
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
        if (File::exists($image->thumbPath)) {
            return;
        }

        File::makeDirectory(File::dirname($image->thumbPath), 0755, true, true);
        VipsImage::thumbnail($path, $this->width, ['height' => $this->height])
            ->writeToFile($image->thumbPath);
    }

    /**
     * Collect image metadata.
     *
     * @param Image $image
     * @param string $path Path to the cached image file.
     */
    protected function collectMetadata(Image $image, $path)
    {
        try {
            $exif = @exif_read_data($path);
        } catch (ErrorException $e) {
            $exif = false;
        }

        // Exif may be false if no error has been thrown, too (e.g. if the image is PNG)!
        if ($exif === false) {
            return;
        }

        if ($this->hasTakenAtInfo($exif)) {
            try {
                $image->taken_at = new Carbon($exif['DateTimeOriginal']);
            } catch (Exception $e) {
                // date could not be parsed
                $image->taken_at = null;
            }
        }

        if ($this->hasGpsInfo($exif)) {
            $image->lng = $this->getGps($exif['GPSLongitude'], $exif['GPSLongitudeRef']);
            $image->lat = $this->getGps($exif['GPSLatitude'], $exif['GPSLatitudeRef']);

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
        if (count($parts) <= 0) {
            return 0;
        }
        if (count($parts) === 1) {
            return $parts[0];
        }

        return floatval($parts[0]) / floatval($parts[1]);
    }

    /**
     * Determine if an image should be tiled.
     *
     * @param Image $image
     * @param string $path Path to the cached image file.
     *
     * @return bool
     */
    protected function shouldBeTiled(Image $image, $path)
    {
        if (!$image->tiled) {
            try {
                $i = VipsImage::newFromFile($path);
            } catch (Exception $e) {
                return false;
            }

            return $i->width > $this->threshold || $i->height > $this->threshold;
        }

        return false;
    }
}
