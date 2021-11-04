<?php

namespace Biigle\Jobs;

use Biigle\Image;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\Video;
use Biigle\Volume;
use DB;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Ramsey\Uuid\Uuid;

class CreateNewImagesOrVideos extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The volume to create the files for.
     *
     * @var Volume
     */
    public $volume;

    /**
     * The filenames of the files to create.
     *
     * @var array
     */
    public $filenames;

    /**
     * Create a new job instance.
     *
     * @param Volume $volume The volume to create the files for.
     * @param array $filenames The filenames of the files to create.
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
     * @throws \Illuminate\Database\QueryException If there was an error creating the
     * files (e.g. if there were duplicate filenames).
     */
    public function handle()
    {
        $hasFiles = $this->volume->files()->exists();

        DB::transaction(function () {
            $modelClass = $this->volume->isImageVolume() ? Image::class : Video::class;

            collect($this->filenames)
                ->chunk(1000)
                ->each(function ($chunk) use ($modelClass) {
                    $modelClass::insert($this->createFiles($chunk->toArray()));
                });
        });

        $newIds = $this->volume->files()
            ->orderBy('id', 'desc')
            ->take(count($this->filenames))
            ->pluck('id')
            ->toArray();

        if ($hasFiles) {
            ProcessNewVolumeFiles::dispatch($this->volume, $newIds);
        } else {
            ProcessNewVolumeFiles::dispatch($this->volume);
        }

        $this->volume->flushThumbnailCache();

        if ($this->volume->isImageVolume()) {
            event('images.created', [$this->volume->id, $newIds]);
        }
    }

    /**
     * Create an array to be inserted as new image/video models.
     *
     * @param array $filenames New image/video filenames.
     *
     * @return array
     */
    protected function createFiles($filenames)
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
