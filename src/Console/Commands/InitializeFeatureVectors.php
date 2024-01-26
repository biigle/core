<?php

namespace Biigle\Modules\Largo\Console\Commands;

use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\Jobs\InitializeFeatureVectorChunk;
use Biigle\VideoAnnotation;
use Biigle\Volume;
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
        {volume : ID of the volume of which the annotations should be processed}
        {--dry-run : Do not submit jobs to generate feature vectors}
        {--queue=default : Queue name to push jobs to generate feature vectors to}
        {--chunk-size=1000 : Number of annotations to process in a single job}';

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
        $volume = Volume::findOrFail($this->argument('volume'));
        if ($volume->isImageVolume()) {
            $this->processImages($volume);
        } else {
            $this->processVideos($volume);
        }
    }

    protected function processImages(Volume $volume)
    {
        $chunkSize = intval($this->option('chunk-size'));
        $loopChunkSize = max($chunkSize, 10000);

        $query = ImageAnnotation::join('images', 'images.id', '=', 'image_annotations.image_id')
            ->where('images.volume_id', $volume->id);

        $count = $query->count();
        $this->info("Processing {$count} image annotations.");
        $p = $this->output->createProgressBar($count);

        $query->select('image_annotations.id')
            ->chunkById($loopChunkSize, function ($chunk) use ($p, $chunkSize) {
                $chunk->chunk($chunkSize)->each(function ($c) use ($p) {
                    $job = new InitializeFeatureVectorChunk($c->pluck('id')->all(), []);
                    if (!$this->option('dry-run')) {
                        Queue::pushOn($this->option('queue'), $job);
                    }
                    $p->advance($c->count());
                });
            });

        $p->finish();
        $this->line('');
    }

    protected function processVideos(Volume $volume)
    {
        $chunkSize = intval($this->option('chunk-size'));
        $loopChunkSize = max($chunkSize, 10000);

        $query = VideoAnnotation::join('videos', 'videos.id', '=', 'video_annotations.video_id')
            ->where('videos.volume_id', $volume->id);

        $count = $query->count();
        $this->info("Processing {$count} video annotations.");
        $p = $this->output->createProgressBar($count);

        $query->select('video_annotations.id')
            ->chunkById($loopChunkSize, function ($chunk) use ($p, $chunkSize) {
                $chunk->chunk($chunkSize)->each(function ($c) use ($p) {
                    $job = new InitializeFeatureVectorChunk([], $c->pluck('id')->all());
                    if (!$this->option('dry-run')) {
                        Queue::pushOn($this->option('queue'), $job);
                    }
                    $p->advance($c->count());
                });
            });

        $p->finish();
        $this->line('');
    }
}
