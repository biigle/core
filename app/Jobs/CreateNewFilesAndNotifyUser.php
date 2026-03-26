<?php

namespace Biigle\Jobs;

use Biigle\Events\VolumeImagesProcessed;
use Biigle\User;
use Biigle\Volume;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CreateNewFilesAndNotifyUser implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The new created volume
     *
     * @var Volume
     */
    public $volume;

    /**
     * Array of file names contained by the volume
     *
     * @var array
     */
    public $filenames;

    /**
     * The user requesting the new volume
     *
     * @var User
     */
    public $user;

    /**
     * Ignore this job if the volume or user does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     *
     * @param Volume $volume
     * @param array $filenames
     * @param User $user
     */
    public function __construct(Volume $volume, array $filenames, User $user)
    {
        $this->volume = $volume;
        $this->filenames = $filenames;
        $this->user = $user;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $job = $this->getJob();
        $job->handle();

        if ($this->volume->isImageVolume()) {
            VolumeImagesProcessed::dispatch($this->user);
        }
    }

    /**
     * Return the job to process the new files
     *
     * @return CreateNewImagesOrVideos job
     */
    public function getJob()
    {
        return new CreateNewImagesOrVideos($this->volume, $this->filenames);
    }
}
