<?php

namespace Biigle\Jobs;

use File;
use Exception;
use FileCache;
use Biigle\Image;
use FilesystemIterator;
use GuzzleHttp\Promise\Each;
use RecursiveIteratorIterator;
use RecursiveDirectoryIterator;
use Illuminate\Support\Facades\Log;
use Jcupitt\Vips\Image as VipsImage;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use GuzzleHttp\Promise\PromiseInterface;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Contracts\Queue\ShouldQueue;

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
            $adapter = Storage::disk(config('image.tiles.disk'))->getAdapter();
            if ($adapter instanceof AwsS3V3Adapter) {
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
     * Upload the tiles from temporary local storage to the tiles storage disk.
     */
    public function uploadToS3Storage()
    {
        $iterator = $this->getIterator($this->tempPath);
        $disk = Storage::disk(config('image.tiles.disk'));
        $fragment = fragment_uuid_path($this->image->uuid);
        
        try {
            $client = $this->getClient($disk);
            $bucket = $this->getBucket($disk);

            // Logic about your requests and how to execute them
            $uploads = function($files) use ($client, $bucket, $fragment) {
                foreach ($files as $file) {
                    yield $client->putObjectAsync([
                        'Bucket'        => $bucket,
                        'Key'           => $fragment. "/" . basename($file),
                        'SourceFile'    => $file,
                    ]);
                }
            };
            
            $failedUploads = [];
            $filenames = $this->getIterator($this->tempPath);

            $onFullfill = function ($res, $index) use ($filenames) {
                $filenames->next();
            };
            $onReject = function ($reason, $index) use ($failedUploads, $filenames) {
                array_push($failedUploads, $filenames->current());
                Log::info($failedUploads);
            };

            $retry = 1;
            $files = $uploads($iterator);

            do {
                // $failedUploads = [];
                $this->sendRequests($files, $onFullfill, $onReject);
                $files = $failedUploads;
                Log::info([$failedUploads, $retry]);

                $retry -= 1;
            } while (!empty($failedUploads) && $retry > 0);
            

        } catch (Exception $e) {
            $disk->deleteDirectory($fragment);
            throw $e;
        }
    }

    protected function sendRequests($files, $onFullfill, $onReject) {
        $concurrency = config('image.tiles.nbr_concurrent_requests');
        Each::ofLimit(
            $files,
            $concurrency,
            $onFullfill,
            $onReject
        )->wait();
    }

    protected function getClient($disk){
        return $disk->getClient();
    }

    protected function getBucket($disk){
        return $disk->getClient()->getConfig('bucket');
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
