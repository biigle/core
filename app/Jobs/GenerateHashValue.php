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
use Storage;
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
     * @throws Exception
     */
    public function handle()
    {
        $hashValue = $this->getHashValue($this->image);
        if ($hashValue !== null) {
            $hash = $hashValue->hash;
            $this->image->hash = $hash;
            $this->image->save();
        }
    }

    /**
     * Gets a thumbnail for a single image.
     *
     * @param Image $image
     * @return string byte string of the image
     */
    protected function getThumbnail(Image $image)
    {
        try {
            $prefix = fragment_uuid_path($image->uuid);
            $format = config('thumbnails.format');

            return Storage::disk(config('thumbnails.storage_disk'))
                ->get("{$prefix}.{$format}");
        } catch (Exception $e) {
            // File not found
            return false;
        }

    }

    /**
     * Execute the HashValueGenerator and get the resulting hash value to the image.
     *
     * @param Image $image
     * @return string
     * @throws Exception
     */
    protected function getHashValue(Image $image)
    {
        $imageByteString = $this->getThumbnail($image);
        if ($imageByteString !== false) {
            $script = config('biigle.hash_value_generator');

            try {
                $outputPath = $this->getOutputJsonPath($image);
                $inputPath = $this->createInputJson($image, $imageByteString);
                $output = $this->python("{$script} {$inputPath} {$outputPath}");
                $hashValue = decodeOutputJson($outputPath);
                dd($hashValue);

            } catch (Exception $e) {
                $input = File::get($inputPath);
                throw new Exception("Input: {$input}\n" . $e->getMessage());
            } finally {
                if (isset($inputPath)) {
                    $this->maybeDeleteFile($inputPath);
                }

                if (isset($outputPath)) {
                    $this->maybeDeleteFile($outputPath);
                }
            }
            return $hashValue;
        } else {
            // Return null if no hash can be computed
            return null;
        }
    }



    /**
     * Execute a Python script.
     *
     * @param $command
     * @return string the hash value for the image
     * @throws Exception
     */
    protected function python($command)
    {
        $lines = 0;
        $code = 0;
        $python = config('biigle.python');


        exec("{$python} {$command}", $lines, $code);

        if ($code !== 0) {
            throw new Exception("Error while executing Python script':\n".implode("\n", $lines));
        }

        return end($lines);

    }

    /**
     * Get the path to to input file for the object tracking script.
     *
     * @param Image $image
     *
     * @return string
     */
    protected function getInputJsonPath(Image $image)
    {
        return config('hash.tmp_dir')."/generate_hash_value_input_{$image->id}.json";
    }

    /**
    * Create the JSON file that is the input for the HashValueGenerator script.
    *
    * @param Image $image
    * @param string $imagePath Path to the video file.
    *
    * @return string Path to the JSON file.
    */
    protected function createInputJson(Image $image, $imageAsByteString)
    {
        $path = $this->getInputJsonPath($image);
        $content = json_encode([
            'image_as_byte_string' => $imageAsByteString,
            'image_id' => $image->id,
        ]);

        File::put($path, $content);
        return $path;
    }

    /**
     * Get the path to to output file for the object tracking script.
     *
     * @param Image $image
     *
     * @return string
     */
    protected function getOutputJsonPath(Image $image)
    {
        return config('hash.tmp_dir')."/generate_hash_value_output_{$image->id}.json";
    }

    /**
     * @param path Opens the ouput path after the python script and decodes it
     *
     * @return mixed
     */
    protected function decodeOutputJson($path)
    {
        return json_decode(File::get($path), true);

    }


    /**
     * Delete a file if it exists.
     *
     * @param string $path
     */
    protected function maybeDeleteFile($path)
    {
        if (File::exists($path)) {
            File::delete($path);
        }
    }
}
