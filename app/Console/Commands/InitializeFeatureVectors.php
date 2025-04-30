<?php

namespace Biigle\Console\Commands;

use Biigle\ImageAnnotation;
use Biigle\MediaType;
use Biigle\Jobs\InitializeFeatureVectorChunk;
use Biigle\VideoAnnotation;
use Biigle\Volume;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Queue;

class InitializeFeatureVectors extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'largo:initialize-feature-vectors
        {--dry-run : Do not submit jobs to generate feature vectors}
        {--volume= : Process only annotations of a single volume (ID)}
        {--queue=default : Queue name to push jobs to generate feature vectors to}
        {--chunk-size=1000 : Number of annotations to process in a single job}
        {--older-than= : Only check annotations older than this date}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate annotation feature vectors based on their annotation thumbnails.';

    /**
     * Execute the command.
     *
     * @return void
     */
    public function handle()
    {
        $query = Volume::select('id')
            ->where('media_type_id', MediaType::imageId())
            ->when($this->option('older-than'), function ($query) {
                $query->where('created_at', '<', new Carbon($this->option('older-than')));
            })
            ->when($this->option('volume'), fn ($q) => $q->where('id', $this->option('volume')));

        $count = $query->clone()->count();
        $progress = $this->output->createProgressBar($count);
        $this->info("Processing {$count} image volumes.");
        $query->lazyById()->each(function ($volume) use ($progress) {
            $this->processImages($volume);
            $progress->advance();
        });
        $progress->finish();
        $this->line('');

        $query = Volume::select('id')
            ->where('media_type_id', MediaType::videoId())
            ->when($this->option('older-than'), function ($query) {
                $query->where('created_at', '<', new Carbon($this->option('older-than')));
            })
            ->when($this->option('volume'), fn ($q) => $q->where('id', $this->option('volume')));

        $count = $query->clone()->count();
        $progress = $this->output->createProgressBar($count);
        $this->info("Processing {$count} video volumes.");
        $query->lazyById()->each(function ($volume) use ($progress) {
            $this->processVideos($volume);
            $progress->advance();
        });
        $progress->finish();
        $this->line('');
    }

    protected function processImages(Volume $volume)
    {
        $chunkSize = intval($this->option('chunk-size'));
        $loopChunkSize = max($chunkSize, 10000);

        ImageAnnotation::join('images', 'images.id', '=', 'image_annotations.image_id')
            ->where('images.volume_id', $volume->id)
            ->when($this->option('older-than'), function ($query) {
                $query->where('image_annotations.created_at', '<', new Carbon($this->option('older-than')));
            })
            ->select('image_annotations.id')
            ->chunkById($loopChunkSize, function ($chunk) use ($chunkSize) {
                $chunk->chunk($chunkSize)->each(function ($c) {
                    $job = new InitializeFeatureVectorChunk($c->pluck('id')->all(), []);
                    if (!$this->option('dry-run')) {
                        Queue::pushOn($this->option('queue'), $job);
                    }
                });
            }, 'image_annotations.id', 'id');
    }

    protected function processVideos(Volume $volume)
    {
        $chunkSize = intval($this->option('chunk-size'));
        $loopChunkSize = max($chunkSize, 10000);

        VideoAnnotation::join('videos', 'videos.id', '=', 'video_annotations.video_id')
            ->where('videos.volume_id', $volume->id)
            ->when($this->option('older-than'), function ($query) {
                $query->where('video_annotations.created_at', '<', new Carbon($this->option('older-than')));
            })
            ->select('video_annotations.id')
            ->chunkById($loopChunkSize, function ($chunk) use ($chunkSize) {
                $chunk->chunk($chunkSize)->each(function ($c) {
                    $job = new InitializeFeatureVectorChunk([], $c->pluck('id')->all());
                    if (!$this->option('dry-run')) {
                        Queue::pushOn($this->option('queue'), $job);
                    }
                });
            }, 'video_annotations.id', 'id');
    }
}
