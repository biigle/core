<?php

namespace Biigle\Jobs;

use Biigle\Video;
use Biigle\Volume;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;

class UpdateVolumeMetadata extends Job implements ShouldQueue
{
    use SerializesModels;

    /**
     * Ignore this job if the project or volume does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

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
                $file->save();
            }
        }

        $this->volume->flushGeoInfoCache();
    }
}
