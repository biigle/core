<?php

namespace Biigle\Jobs;

use Biigle\Video;
use Biigle\Volume;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\DeleteWhenMissingModels;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

#[DeleteWhenMissingModels]
class UpdateVolumeMetadata extends Job implements ShouldQueue
{
    use SerializesModels;

    /**
     * Number of files that are updated with a single query. With 5 parameters per
     * file this must stay below biigle.db_param_limit / 5.
     *
     * @var int
     */
    const UPDATE_BATCH_SIZE = 1000;

    /**
     * Create a new job instance.
     */
    public function __construct(public Volume $volume)
    {
        //
    }

    public function handle()
    {
        $metadata = $this->volume->getMetadata();

        if (!$metadata) {
            return;
        }

        $files = [];

        foreach ($this->volume->files()->lazyById() as $file) {
            $fileMeta = $metadata->getFile($file->filename);
            if (!$fileMeta) {
                continue;
            }

            $insert = $fileMeta->getInsertData();

            // If a video is updated with timestamped metadata, the old metadata must
            // be replaced entirely.
            if (($file instanceof Video) && array_key_exists('taken_at', $insert)) {
                $file->taken_at = null;
                $file->lat = null;
                $file->lng = null;
                $file->metadata = null;
            }

            $attrs = $insert['attrs'] ?? null;
            unset($insert['attrs']);
            $file->fill($insert);
            if ($attrs) {
                $file->metadata = array_merge($file->metadata ?: [], $attrs['metadata']);
            }

            if ($file->isDirty()) {
                $files[] = $file;
            }

            if (count($files) >= static::UPDATE_BATCH_SIZE) {
                $this->updateFiles($files);
                $files = [];
            }
        }

        $this->updateFiles($files);

        $this->volume->flushGeoInfoCache();
    }

    /**
     * Write the metadata of the given files to the database with a single query.
     *
     * @param array<\Biigle\VolumeFile> $files
     */
    protected function updateFiles(array $files): void
    {
        if (empty($files)) {
            return;
        }

        if ($this->volume->isImageVolume()) {
            $table = 'images';
            // Parameters in a VALUES list are untyped so they need explicit casts.
            $row = '(?::bigint, ?::timestamp, ?::float8, ?::float8, ?::json)';
        } else {
            $table = 'videos';
            $row = '(?::bigint, ?::json, ?::json, ?::json, ?::json)';
        }

        $values = implode(', ', array_fill(0, count($files), $row));

        $bindings = [];
        foreach ($files as $file) {
            // Raw attributes are the values as Eloquent would store them (e.g. encoded
            // JSON). Unchanged columns are written, too, so all files fit in one query.
            $attributes = $file->getAttributes();
            array_push(
                $bindings,
                $file->id,
                $attributes['taken_at'] ?? null,
                $attributes['lat'] ?? null,
                $attributes['lng'] ?? null,
                $attributes['attrs'] ?? null
            );
        }

        DB::update("
            UPDATE {$table}
            SET taken_at = v.taken_at, lat = v.lat, lng = v.lng, attrs = v.attrs
            FROM (VALUES {$values}) AS v(id, taken_at, lat, lng, attrs)
            WHERE {$table}.id = v.id
        ", $bindings);
    }
}
