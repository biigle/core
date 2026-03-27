<?php

namespace Biigle\Jobs;

use Biigle\Events\VolumeImagesProcessed;
use Biigle\User;
use Biigle\Volume;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CreateNewFilesAndNotifyUser extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The new created volume
     *
     * @var Volume
     */
    public $volume;

    /**
     * File names of files within the volume
     *
     * @var array
     */
    public $filenames;

    /**
     * The id of the user requesting the new volume
     *
     * @var int
     */
    public $userId;

    /**
     * Ignore this job if the volume does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     *
     * @param Volume $volume
     * @param array $filenames
     * @param int $userId
     */
    public function __construct(Volume $volume, array $filenames, int $userId)
    {
        $this->volume = $volume;
        $this->filenames = $filenames;
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $job = $this->getJob();
        $job->handle();

        $user = User::where('id', $this->userId)->get();
        if ($user->isNotEmpty() && $this->volume->isImageVolume()) {
            VolumeImagesProcessed::dispatch($user->first());
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
