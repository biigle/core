<?php

namespace Biigle\Jobs;

use DB;
use Biigle\Image;
use Biigle\Volume;
use Ramsey\Uuid\Uuid;
use Biigle\Jobs\ProcessNewImages;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class CreateNewImages extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The volume to create the images for.
     *
     * @var Volume
     */
    public $volume;

    /**
     * The filenames of the images to create.
     *
     * @var array
     */
    public $filenames;

    /**
     * Create a new job instance.
     *
     * @param Volume $volume The volume to create the images for.
     * @param array $filenames The filenames of the images to create.
     *
     * @return void
     */
    public function __construct(Volume $volume, array $filenames)
    {
        $this->volume = $volume;
        $this->filenames = $filenames;
    }

    /**
     * Execute the job.
     *
     * @throws QueryException If there was an error creating the images (e.g. if there
     * were duplicate filenames).
     */
    public function handle()
    {
        $hasImages = $this->volume->images()->exists();

        DB::transaction(function () {
            collect($this->filenames)->chunk(1000)->each(function ($chunk) {
                Image::insert($this->createImages($chunk->toArray()));
            });
        });

        $newIds = $this->volume->images()
            ->orderBy('id', 'desc')
            ->take(count($this->filenames))
            ->pluck('id')
            ->toArray();

        if ($hasImages) {
            ProcessNewImages::dispatch($this->volume, $newIds);
        } else {
            ProcessNewImages::dispatch($this->volume);
        }

        event('images.created', [$this->volume->id, $newIds]);
    }

    /**
     * Create an array to be inserted as new image models.
     *
     * @param array $filenames New image filenames.
     *
     * @return array
     */
    protected function createImages($filenames)
    {
        return array_map(function ($filename) {
            return [
                'filename' => $filename,
                'volume_id' => $this->volume->id,
                'uuid' => Uuid::uuid4(),
            ];
        }, $filenames);
    }
}
