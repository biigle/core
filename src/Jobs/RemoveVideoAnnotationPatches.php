<?php

namespace Biigle\Modules\Largo\Jobs;

use Storage;

class RemoveVideoAnnotationPatches extends RemoveAnnotationPatches
{
    /**
     * {@inheritdoc}
     */
    protected function deletePatches()
    {
        $disk = Storage::disk(config('largo.patch_storage_disk'));
        $format = config('largo.patch_format');
        $count = config('largo.video_patch_count');

        foreach ($this->annotationIds as $id => $uuid) {
            $prefix = fragment_uuid_path($uuid);
            for ($i = 0; $i < $count; $i++) {
                $disk->delete("{$prefix}/{$id}/{$i}.{$format}");
            }
        }
    }
}
