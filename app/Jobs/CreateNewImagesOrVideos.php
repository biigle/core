<?php

namespace Biigle\Jobs;

use Biigle\Image;
use Biigle\Rules\ImageMetadata;
use Biigle\Traits\ChecksMetadataStrings;
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
    use InteractsWithQueue, SerializesModels, ChecksMetadataStrings;

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
                $metadataMap = $this->generateImageMetadataMap();
                $chunks->each(function ($chunk) use ($metadataMap) {
                    Image::insert($this->createFiles($chunk->toArray(), $metadataMap));
                });
            } else {
                $metadataMap = $this->generateVideoMetadataMap();
                $chunks->each(function ($chunk) use ($metadataMap) {
                    Video::insert($this->createFiles($chunk->toArray(), $metadataMap));
                });
            }
        });

        $newIds = $this->volume
            ->files()
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
     *
     * @param array $filenames New image/video filenames.
     * @param \Illuminate\Support\Collection $metadataMap
     *
     * @return array
     */
    protected function createFiles($filenames, $metadataMap)
    {
        return array_map(function ($filename) use ($metadataMap) {
            // This makes sure that the inserts have the same number of columns even if
            // some images have additional metadata and others not.
            $insert = array_fill_keys(
                array_merge(['attrs'], ImageMetadata::ALLOWED_ATTRIBUTES),
                null
            );

            $insert = array_merge($insert, [
                'filename' => $filename,
                'volume_id' => $this->volume->id,
                'uuid' => (string) Uuid::uuid4(),
            ]);

            $metadata = collect($metadataMap->get($filename));
            if ($metadata) {
                // Remove empty cells.
                $metadata = $metadata->filter();
                $insert = array_merge(
                    $insert,
                    $metadata->only(ImageMetadata::ALLOWED_ATTRIBUTES)->toArray()
                );

                $more = $metadata->only(ImageMetadata::ALLOWED_METADATA);
                if ($more->isNotEmpty()) {
                    $insert['attrs'] = collect(['metadata' => $more])->toJson();
                }
            }

            return $insert;
        }, $filenames);
    }

    /**
     * Generate a map for image metadata that is indexed by filename.
     *
     * @return \Illuminate\Support\Collection
     */
    protected function generateImageMetadataMap()
    {
        if (empty($this->metadata)) {
            return collect([]);
        }

        $columns = $this->metadata[0];

        $map = collect(array_slice($this->metadata, 1))
            ->map(fn ($row) => array_combine($columns, $row))
            ->map(function ($row) {
                if (array_key_exists('taken_at', $row)) {
                    $row['taken_at'] = Carbon::parse($row['taken_at']);
                }

                return $row;
            })
            ->keyBy('filename');

        $map->forget('filename');

        return $map;
    }

    /**
     * Generate a map for video metadata that is indexed by filename.
     *
     * @return \Illuminate\Support\Collection
     */
    protected function generateVideoMetadataMap()
    {
        if (empty($this->metadata)) {
            return collect([]);
        }

        $columns = $this->metadata[0];

        $map = collect(array_slice($this->metadata, 1))
            ->map(fn ($row) => array_combine($columns, $row))
            ->map(function ($row) {
                if (array_key_exists('taken_at', $row)) {
                    $row['taken_at'] = Carbon::parse($row['taken_at']);
                } else {
                    $row['taken_at'] = null;
                }

                return $row;
            })
            ->sortBy('taken_at')
            ->groupBy('filename')
            ->map(fn ($entries) => $this->processVideoColumns($entries, $columns));

        return $map;
    }

    /**
     * Generate the metadata map entry for a single video file.
     *
     * @param \Illuminate\Support\Collection $entries
     * @param \Illuminate\Support\Collection $columns
     *
     * @return \Illuminate\Support\Collection
     */
    protected function processVideoColumns($entries, $columns)
    {
        $return = collect([]);
        foreach ($columns as $column) {
            $values = $entries->pluck($column);
            if ($values->filter([$this, 'isFilledString'])->isEmpty()) {
                // Ignore completely empty columns.
                continue;
            }

            $return[$column] = $values;

            if (in_array($column, array_keys(ImageMetadata::NUMERIC_FIELDS))) {
                $return[$column] = $return[$column]->map(function ($x) {
                    // This check is required since floatval would return 0 for
                    // an empty value. This could skew metadata.
                    return $this->isFilledString($x) ? floatval($x) : null;
                });
            }

            if (in_array($column, ImageMetadata::ALLOWED_ATTRIBUTES)) {
                $return[$column] = $return[$column]->toJson();
            }
        }

        $return->forget('filename');

        return $return;
    }
}
