<?php

namespace Biigle\Jobs;

use Biigle\PendingVolume;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;

class ImportVolumeMetadata extends Job implements ShouldQueue
{
    use SerializesModels;

    /**
     * Ignore this job if the pending volume does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     *
     */
    public function __construct(public PendingVolume $pendingVolume)
    {
        //
    }

    public function handle(): void
    {
        // ignore annotations with deleted labels, set null to
        // annotations with deleted users (as they could be deleted in the meantime).
        // do not import annotations/file labels if the pending volume property is false.
        //
        // delete pending volume on success
    }
}
