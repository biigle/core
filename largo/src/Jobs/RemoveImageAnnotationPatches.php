<?php

namespace Biigle\Modules\Largo\Jobs;

use Storage;

class RemoveImageAnnotationPatches extends RemoveAnnotationPatches
{
    /**
     * {@inheritdoc}
     */
    protected function deletePatches()
    {
        $disk = Storage::disk(config('largo.patch_storage_disk'));
        $format = config('largo.patch_format');

        foreach ($this->annotationIds as $id => $uuid) {
            $prefix = fragment_uuid_path($uuid);
            $disk->delete("{$prefix}/{$id}.{$format}");
            $disk->delete("{$prefix}/{$id}.svg");
        }
    }
}
