<?php

namespace Biigle\Jobs;




use Biigle\Image;
use Biigle\Jobs\Job;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Exception;
use App;
use Log;
use FileCache;
use File;

class GenerateHashValue extends Job implements ShouldQueue
{
    use SerializesModels, InteractsWithQueue;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 2;

    /**
     * Ignore this job if the image does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;


    /**
     * The image to process
     *
     * @var Image
     */
    public $image;

    /**
     * The hash value according to the image
     *
     * @var string
     */
    public $hash;

    /**
     * Caches if an image needs a new hash value.
     *
     * @var array
     */
    protected $needsHashCache;


    /**
     * Create a new job instance.
     *
     * @param Image $image The image to generate process.
     *
     * @return void
     */
    public function __construct(Image $image)
    {
        $this->image = $image;
        $this->hash = '';
        $this->needsHashCache = [];
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            if ($this->needsHashValue($this->image)) {
                FileCache::getOnce($this->image, function ($image, $path) {
                    if (!File::exists($path)) {
                        throw new Exception("File '{$path}' does not exist.");
                    }
                    if ($this->needsHashValue($image)) {
                        $this->getThumbnail($image, $path);
                        // here path or the image which i get with get Thumbnail?
                        $output = $this->python("{$path}");
                        $image->hash = $output;
                        $image->save();
                    }

                });
            }
        } catch (Exception $e) {
            if (App::runningUnitTests()) {
                throw $e;
            } else {
                Log::warning("Could not process new image {$this->image->id}: {$e->getMessage()}");
            }
        }
    }

    /**
     * Chack if an image needs a hash.
     *
     * @param Image $image
     *
     * @return bool
     */
    protected function needsHashValue(Image $image)
    {
        if (!array_key_exists($image->id, $this->needsHashCache)) {
            $prefix = fragment_uuid_path($image->uuid);
            $format = config('thumbnails.format');
            $this->needsHashCache[$image->id] =
                !Storage::disk(config('thumbnails.storage_disk'))
                    ->exists("{$prefix}.{$format}");
        }

        return $this->needsHashCache[$image->id];
    }
    /**
     * Gets a thumbnail for a single image.
     *
     * @param Image $image
     * @param string $path Path to the cached image file.
     * @return string
     */
    protected function getThumbnail(Image $image, $path)
    {
        $prefix = fragment_uuid_path($image->uuid);
        $format = config('thumbnails.format');

        return Storage::disk(config('thumbnails.storage_disk'))
            ->get("{$prefix}.{$format}");
    }

    /**
     * Execute a Python script.
     *
     * @param string $path of the image
     *
     * @return string the hash value for the image
     */
    protected function python($path)
    {
        $lines = 0;
        $code = 0;

        exec("python3 {$path}", $lines, $code);

        if ($code !== 0) {
            throw new Exception("Error while executing Python script':\n".implode("\n", $lines));
        }

        return end($lines);

    }
}
