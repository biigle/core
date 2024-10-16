<?php

namespace Biigle\Jobs;

use Biigle\Image;
use Biigle\Video;
use Biigle\Volume;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class ProcessNewVolumeFiles extends Job implements ShouldQueue
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
     *
     * @return void
     */
    public function __construct(Volume $volume, array $only = [], $uuidMap = [])
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
                if (!$this->uuidMap) {
                    ProcessNewImage::dispatch($img);
                    return;
                }

                $prefix = fragment_uuid_path($this->uuidMap[$img->uuid]);
                $copyPrefix = fragment_uuid_path($img->uuid);

                $hasThumbnails = count(Storage::disk(config('thumbnails.storage_disk'))->files($prefix)) > 0;
                $hasTiledData = count(Storage::disk(config('image.tiles.disk'))->files($prefix)) > 0;
                
                if ($hasThumbnails && $hasTiledData) {
                    CloneImageThumbnails::dispatch($prefix, $copyPrefix);
                } else {
                    ProcessNewImage::dispatch($img);
                }
            });
        } else {
            $queue = config('videos.process_new_video_queue');
            $query->eachById(fn (Video $v) => ProcessNewVideo::dispatch($v)->onQueue($queue));
        }
    }
}
