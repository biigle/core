<?php

namespace Biigle\Services\Thumbnails;

use Biigle\Volume;
use Biigle\Contracts\ThumbnailService;
use Biigle\Jobs\ProcessThumbnailChunkJob;
use Illuminate\Foundation\Bus\DispatchesJobs;

/**
 * The default thumbnails service using the InterventionImage package
 * (http://image.intervention.io/).
 */
class InterventionImage implements ThumbnailService
{
    use DispatchesJobs;

    /**
     * {@inheritdoc}
     */
    public function generateThumbnails(Volume $volume, array $only)
    {
        $volume->images()
            ->with('volume')
            ->when($only, function ($query) use ($only) {
                return $query->whereIn('id', $only);
            })
            ->chunk(100, function ($images) {
                $this->dispatch(new ProcessThumbnailChunkJob($images));
            });
    }
}
