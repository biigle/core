<?php

namespace Biigle\Jobs;

use Biigle\Image;
use Biigle\Video;
use Biigle\Volume;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class ProcessCloneVolumeFiles extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The volume for which the files should be processed.
     *
     * @var Volume
     */
    protected $volume;

    /**
     * Array of image/video IDs to restrict processing to.
     * If it is empty, all files of the volume will be taken.
     *
     * @var array
     */
    protected $only;

    /**
     * Array maps uuid of copied file to uuid of original files.
     *
     * @var array
     */
    protected $uuidMap;

    /**
     * Ignore this job if the volume does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     *
     * @param Volume $volume The volume for which the files should be processed.
     * @param array $only (optional) Array of image/video IDs to restrict processing to.
     * If it is empty, all files of the volume will be taken.
     * @param array $uuidMap Array to map copied file uuid to the original file uuid during cloning process.
     *
     * @return void
     */
    public function __construct(Volume $volume, array $only = [], $uuidMap)
    {
        $this->volume = $volume;
        $this->only = $only;
        $this->uuidMap = $uuidMap;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $query = $this->volume->files()
            ->when($this->only, fn ($query) => $query->whereIn('id', $this->only));

        if ($this->volume->isImageVolume()) {
            $query->eachById(function (Image $img) {
                $prefix = fragment_uuid_path($this->uuidMap[$img->uuid]);
                $copyPrefix = fragment_uuid_path($img->uuid);
                CloneImageThumbnails::dispatch($img, $prefix, $copyPrefix);
            });
        } else {
            $queue = config('videos.process_new_video_queue');
            $query->eachById(function (Video $video) use ($queue) {
                $prefix = fragment_uuid_path($this->uuidMap[$video->uuid]);
                $copyPrefix = fragment_uuid_path($video->uuid);
                CloneVideoThumbnails::dispatch($video, $copyPrefix)->onQueue($queue);

                }
            );
        }
    }
}
