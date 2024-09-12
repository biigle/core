<?php

namespace Biigle\Console\Commands;

use Biigle\Jobs\ProcessNewVideo;
use Biigle\MediaType;
use Biigle\Video;
use Biigle\Volume;
use FFMpeg\FFProbe;
use Illuminate\Console\Command;
use Throwable;

class UpdateVideoMetadata extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'update-video-metadata
        {--dry-run : Don\'t make requests or push jobs to the queue}
        {--volume= : Process only the specified volume}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reprocess all videos to store metadata like height and width in the DB';

    /**
     * Is this a dry run?
     *
     * @var bool
     */
    protected $dryRun;

    /**
     * The FFProbe video instance.
     *
     * @var FFProbe|null
     */
    protected $ffprobe;

    /**
     * Handle the command.
     *
     * @return void
     */
    public function handle()
    {
        $this->dryRun = $this->option('dry-run');
        $volumeId = $this->option('volume');
        $query = Volume::where('media_type_id', MediaType::videoId());

        if ($volumeId) {
            $this->processVolume($query->find($volumeId));
        } else {
            $query->eachById([$this, 'processVolume']);
        }
    }

    public function processVolume(Volume $volume)
    {
        $query = $volume->videos()
            ->where(function ($query) {
                $query->whereNull('attrs->width')
                    ->orWhereNull('attrs->height');
            });

        if ($volume->isRemote()) {
            $query->eachById([$this, 'processRemoteVideo']);
        } else {
            $query->eachById([$this, 'processLocalVideo']);
        }
    }

    public function processLocalVideo(Video $video)
    {
        $this->line('Processing '.$video->url);

        if (!$this->dryRun) {
            ProcessNewVideo::dispatch($video);
        }
    }

    public function processRemoteVideo(Video $video)
    {
        if (!$this->ffprobe) {
            $this->ffprobe = FFProbe::create();
        }

        $this->line('Processing '.$video->url);

        try {
            $dimensions = $this->ffprobe->streams($video->url)
                ->videos()
                ->first()
                ->getDimensions();
            $video->width = $dimensions->getWidth();
            $video->height = $dimensions->getHeight();
            if (!$this->dryRun) {
                $video->save();
            }
        } catch (Throwable $e) {
            // ignore and leave dimensions at null.
        }
    }
}
