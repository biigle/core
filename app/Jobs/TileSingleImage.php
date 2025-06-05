<?php

namespace Biigle\Jobs;

use Biigle\Image;
use Exception;
use File;
use FileCache;
use FilesystemIterator;
use GuzzleHttp\Promise\Each;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Jcupitt\Vips\Image as VipsImage;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Symfony\Component\HttpFoundation\File\Exception\UploadException;

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

            $disk = Storage::disk(config('image.tiles.disk'));
            if ($disk instanceof AwsS3V3Adapter) {
                $this->uploadToS3Storage($disk);
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
     * @param AwsS3V3Adapter $disk S3 filesystem adapter
     *
     */
    public function uploadToS3Storage($disk)
    {
        $iterator = $this->getIterator($this->tempPath);

        $client = $this->getClient($disk);
        $bucket = $this->getBucket($disk);

        $uploads = function ($files) use ($client, $bucket) {
            $tmpLength = strlen(config('image.tiles.tmp_dir')) + 1;
            foreach ($files as $file) {
                $path = substr($file, $tmpLength);
                $prefix = $path[0] . $path[1] . '/' . $path[2] . $path[3];

                // @phpstan-ignore-next-line
                yield $client->putObjectAsync([
                    'Bucket' => $bucket,
                    'Key' => "tiles/{$prefix}/{$path}",
                    'SourceFile' => $file,
                ]);
            }
        };

        $files = $uploads($iterator);

        $this->sendRequests($files);
    }

    /**
     * Returns client of AwsS3V3Adapter
     *
     * @param mixed $disk S3 filesystem adapter
     * @return \Aws\S3\S3Client
     */
    protected function getClient($disk)
    {
        return $disk->getClient();
    }

    /**
     * Returns s3 bucket name
     *
     * @param mixed $disk S3 filesystem adapter
     * @return string bucket name
     */
    protected function getBucket($disk)
    {
        return $disk->getConfig()['bucket'];
    }

    /**
     * Upload files to S3 bucket.
     *
     * @param \Iterator $files The files to upload.
     * @param callable $onFullfill Callback for successful uploads.
     * @param callable $onReject Callback for failed uploads.
     * @throws Exception If retry limit is reached
     *
     */
    protected function sendRequests($files, $onFullfill = null, $onReject = null)
    {
        $concurrency = config('image.tiles.concurrent_requests');
        $shouldThrow = false;

        // The promise will be rejected once the retry limit is reached
        $failedUploads = function ($reason, $index) use ($onReject, &$shouldThrow) {
            if ($onReject) {
                $onReject();
            }
            $shouldThrow = true;
        };

        Each::ofLimit(
            $files,
            $concurrency,
            $onFullfill,
            $failedUploads
        )->wait();

        if ($shouldThrow) {
            $id = $this->image->id;
            throw new UploadException("Failed to upload tiles for image with id {$id}");
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
