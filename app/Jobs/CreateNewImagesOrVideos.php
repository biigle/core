<?php

namespace Biigle\Jobs;

use Biigle\Image;
use Biigle\Services\MetadataParsing\VolumeMetadata;
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
     * Metadata of the files to add during creation.
     *
     * @var array
     */
    public $metadata;

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
            $chunks = collect($this->filenames)->chunk(1000);
            $metadata = $this->volume->getMetadata();

            if ($this->volume->isImageVolume()) {
                $chunks->each(
                    fn ($chunk) => Image::insert($this->createFiles($chunk->toArray(), $metadata))
                );
            } else {
                $chunks->each(
                    fn ($chunk) => Video::insert($this->createFiles($chunk->toArray(), $metadata))
                );
            }
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

        if ($this->volume->creating_async) {
            $this->volume->creating_async = false;
            $this->volume->save();
        }

        if ($this->volume->isImageVolume()) {
            event('images.created', [$this->volume->id, $newIds]);
        }
    }

    /**
     * Create an array to be inserted as new image or video models.
     */
    protected function createFiles(array $filenames, ?VolumeMetadata $metadata): array
    {
        $metaKeys = [];
        $insertData = [];

        foreach ($filenames as $filename) {
            $insert = [];

            if ($metadata && ($fileMeta = $metadata->getFile($filename))) {
                $insert = array_map(function ($item) {
                    if (is_array($item)) {
                        return json_encode($item);
                    }

                    return $item;
                }, $fileMeta->getInsertData());
            }

            $metaKeys += array_keys($insert);

            $insert = array_merge($insert, [
                'filename' => $filename,
                'volume_id' => $this->volume->id,
                'uuid' => (string) Uuid::uuid4(),
            ]);

            $insertData[] = $insert;
        }

        // Ensure that each item has the same keys even if some are missing metadata.
        if (!empty($metaKeys)) {
            $fill = array_fill_keys($metaKeys, null);
            $insertData = array_map(fn ($i) => array_merge($fill, $i), $insertData);
        }

        return $insertData;
    }
}
