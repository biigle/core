<?php

namespace Biigle\Jobs;

use Biigle\Image;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\Rules\ImageMetadata;
use Biigle\Video;
use Biigle\Volume;
use Carbon\Carbon;
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
     * @param array $metadata File metadata (one row per file plus column headers).
     *
     * @return void
     */
    public function __construct(Volume $volume, array $filenames, $metadata = [])
    {
        $this->volume = $volume;
        $this->filenames = $filenames;
        $this->metadata = $metadata;
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

            if ($this->volume->isImageVolume()) {
                $metadataMap = $this->generateMetadataMap();
                $chunks->each(function ($chunk) use ($metadataMap) {
                    Image::insert($this->createImages($chunk->toArray(), $metadataMap));
                });
            } else {
                $chunks->each(function ($chunk) {
                    Video::insert($this->createVideos($chunk->toArray()));
                });
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
     * Create an array to be inserted as new video models.
     *
     * @param array $filenames New video filenames.
     *
     * @return array
     */
    protected function createVideos($filenames)
    {
        return array_map(function ($filename) {
            return [
                'filename' => $filename,
                'volume_id' => $this->volume->id,
                'uuid' => Uuid::uuid4(),
            ];
        }, $filenames);
    }

    /**
     * Create an array to be inserted as new image models.
     *
     * @param array $filenames New image filenames.
     *
     * @return array
     */
    protected function createImages($filenames, $metadataMap)
    {
        return array_map(function ($filename) use ($metadataMap) {
            $insert = [
                'filename' => $filename,
                'volume_id' => $this->volume->id,
                'uuid' => (string) Uuid::uuid4(),
            ];

            $metadata = collect($metadataMap->get($filename));
            if ($metadata) {
                // Remove empty cells.
                $metadata = $metadata->filter();
                $insert = $metadata
                    ->only(ImageMetadata::ALLOWED_ATTRIBUTES)
                    ->merge($insert)
                    ->toArray();

                $more = $metadata->only(ImageMetadata::ALLOWED_METADATA);
                if ($more->isNotEmpty()) {
                    $insert['attrs'] = json_encode(['metadata' => $more->toArray()]);
                }
            }

            return $insert;
        }, $filenames);
    }

    /**
     * Generate a map for image metadata that is indexed by image name.
     *
     * @return \Illuminate\Support\Collection
     */
    protected function generateMetadataMap()
    {
        if (empty($this->metadata)) {
            return collect([]);
        }

        $columns = $this->metadata[0];

        $map = collect(array_slice($this->metadata, 1))
            ->map(function ($row) use ($columns) {
                return array_combine($columns, $row);
            })
            ->map(function ($row) {
                if (array_key_exists('taken_at', $row)) {
                    $row['taken_at'] = Carbon::parse($row['taken_at'])->toDateTimeString();
                }

                return $row;
            })
            ->keyBy('filename');

        $map->forget('filename');

        return $map;
    }
}
