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
     * Number of files that are updated with a single query.
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

        $updates = [];

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
                // Collect the changed attributes (as they would be saved by the model)
                // and update the files in batches.
                $updates[] = array_merge(['id' => $file->id], $file->getDirty());
            }

            if (count($updates) >= static::UPDATE_BATCH_SIZE) {
                $this->updateFiles($updates);
                $updates = [];
            }
        }

        $this->updateFiles($updates);

        $this->volume->flushGeoInfoCache();
    }

    /**
     * Update the files with the given attributes.
     *
     * Files with the same set of changed attributes are updated together with a single
     * UPDATE ... FROM (VALUES ...) query.
     *
     * @param array $updates Arrays of the file ID and the changed (raw) attributes.
     */
    protected function updateFiles(array $updates): void
    {
        if (empty($updates)) {
            return;
        }

        $table = $this->volume->isImageVolume() ? 'images' : 'videos';
        $types = DB::table('information_schema.columns')
            ->where('table_schema', DB::raw('current_schema()'))
            ->where('table_name', $table)
            ->pluck('udt_name', 'column_name');

        $groups = collect($updates)->groupBy(function ($update) {
            $columns = array_keys($update);
            sort($columns);

            return implode(',', $columns);
        });

        foreach ($groups as $group) {
            $columns = array_keys($group->first());
            $placeholders = '('.implode(', ', array_map(fn ($c) => "?::{$types[$c]}", $columns)).')';
            $set = implode(', ', array_map(
                fn ($c) => "\"{$c}\" = v.\"{$c}\"",
                array_filter($columns, fn ($c) => $c !== 'id')
            ));
            $alias = implode(', ', array_map(fn ($c) => "\"{$c}\"", $columns));
            $chunkSize = intdiv(config('biigle.db_param_limit'), count($columns));

            foreach ($group->chunk($chunkSize) as $chunk) {
                $bindings = [];
                foreach ($chunk as $update) {
                    foreach ($columns as $column) {
                        $bindings[] = $update[$column];
                    }
                }

                $values = implode(', ', array_fill(0, $chunk->count(), $placeholders));

                DB::update("UPDATE {$table} SET {$set} FROM (VALUES {$values}) AS v({$alias}) WHERE {$table}.id = v.id", $bindings);
            }
        }
    }
}
