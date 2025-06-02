<?php

namespace Biigle\Jobs;

use ArrayIterator;
use Biigle\Image;
use Exception;
use File;
use FileCache;
use FilesystemIterator;
use GuzzleHttp\Promise\Each;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Jcupitt\Vips\Image as VipsImage;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class TileSingleImage extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The image to generate tiles for.
     *
     * @var Image
     */
    public $image;

    /**
     * Path to the temporary storage file for the tiles.
     *
     * @var string
     */
    public $tempPath;

    /**
     * Ignore this job if the image does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     *
     * @param Image $image The image to generate tiles for.
     *
     * @return void
     */
    public function __construct(Image $image)
    {
        $this->image = $image;
        $this->tempPath = config('image.tiles.tmp_dir')."/{$image->uuid}";
        $this->queue = config('image.tiles.queue');
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            FileCache::getOnce($this->image, [$this, 'generateTiles']);
            if (config('filesystems.disks.tiles.driver') === 's3') {
                $this->uploadToS3Storage();
            } else {
                $this->uploadToStorage();
            }
            $this->image->tilingInProgress = false;
            $this->image->save();
        } finally {
            File::deleteDirectory($this->tempPath);
        }
    }

    /**
     * Generate tiles for the image and put them to temporary storage.
     *
     * @param Image $image
     * @param string $path Path to the cached image file.
     */
    public function generateTiles(Image $image, $path)
    {
        $this->getVipsImage($path)->dzsave($this->tempPath, [
            'layout' => 'zoomify',
            'container' => 'fs',
            'strip' => true,
        ]);
    }

    /**
     * Upload the tiles from temporary local storage to the tiles storage disk.
     */
    public function uploadToStorage()
    {
        // +1 for the connecting slash.
        $prefixLength = strlen($this->tempPath) + 1;
        $iterator = $this->getIterator($this->tempPath);
        $disk = Storage::disk(config('image.tiles.disk'));
        $fragment = fragment_uuid_path($this->image->uuid);
        try {
            foreach ($iterator as $pathname => $fileInfo) {
                $disk->putFileAs($fragment, $fileInfo, substr($pathname, $prefixLength));
            }
        } catch (Exception $e) {
            $disk->deleteDirectory($fragment);
            throw $e;
        }
    }

    /**
     * Upload the tiles from temporary local storage to the s3 tiles storage disk.
     *
     * @param int $retry Number of retries for failed uploads.
     * @throws Exception
     *
     */
    public function uploadToS3Storage($retry = 3)
    {
        $iterator = $this->getIterator($this->tempPath);
        $disk = Storage::disk(config('image.tiles.disk'));

        $client = $disk->getClient();
        $bucket = $disk->getConfig()['bucket'];

        $uploads = function ($files) use ($client, $bucket) {
            $tmpLength = strlen(config('image.tiles.tmp_dir')) + 1;
            foreach ($files as $file) {
                $path = substr($file, $tmpLength);
                $prefix = $path[0] . $path[1] . '/' . $path[2] . $path[3];

                yield $client->putObjectAsync([
                    'Bucket' => $bucket,
                    'Key' => "tiles/{$prefix}/{$path}",
                    'SourceFile' => $file,
                ]);
            }
        };

        // Keep track of failed uploads
        $failedUploads = [];
        $filenames = $this->getIterator($this->tempPath);

        $onFullfill = function ($res, $index) use ($filenames) {
            $filenames->next();
        };
        $onReject = function ($reason, $index) use (&$failedUploads, $filenames) {
            array_push($failedUploads, $filenames->current());
        };

        $files = $uploads($iterator);

        while ($retry > 0) {
            $failedUploads = [];
            $this->sendRequests($files, $onFullfill, $onReject);
            $files = new ArrayIterator($failedUploads);
            $retry -= 1;
            if (empty($failedUploads)) {
                break;
            }
        }

        if (!empty($failedUploads)) {
            throw new Exception("Failed to upload tiles for image with id " . $this->image->id);
        }
    }

    /**
     * Upload files to S3 bucket.
     *
     * @param \Iterator $files The files to upload.
     * @param callable $onFullfill Callback for successful uploads.
     * @param callable $onReject Callback for failed uploads.
     *
     */
    protected function sendRequests($files, $onFullfill, $onReject)
    {
        $concurrency = config('image.tiles.nbr_concurrent_requests');
        Each::ofLimit(
            $files,
            $concurrency,
            $onFullfill,
            $onReject
        )->wait();
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
     * Get the recursive directory iterator for the given path.
     *
     * @param string $path
     *
     * @return RecursiveIteratorIterator
     */
    protected function getIterator($path)
    {
        return new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(
                $path,
                FilesystemIterator::KEY_AS_PATHNAME |
                    FilesystemIterator::CURRENT_AS_FILEINFO |
                    FilesystemIterator::SKIP_DOTS
            )
        );
    }
}
