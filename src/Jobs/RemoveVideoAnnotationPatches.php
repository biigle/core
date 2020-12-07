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

        foreach ($this->annotationIds as $id => $uuid) {
            $prefix = fragment_uuid_path($uuid);
            $disk->deleteDirectory("{$prefix}/{$id}");
        }
    }
}
