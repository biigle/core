<?php

namespace Biigle\Modules\Largo\Console\Commands;

use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\Jobs\InitializeFeatureVectorChunk;
use Biigle\VideoAnnotation;
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
        $chunkSize = intval($this->option('chunk-size'));
        $loopChunkSize = max($chunkSize, 10000);

        $count = ImageAnnotation::count();
        $this->info("Processing {$count} image annotations.");
        $p = $this->output->createProgressBar($count);

        ImageAnnotation::select('id')
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

        $count = VideoAnnotation::count();
        $this->info("Processing {$count} video annotations.");
        $p = $this->output->createProgressBar($count);

        VideoAnnotation::select('id')
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
