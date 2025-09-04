<?php

namespace Biigle\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class LabelbotCreateIndex extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'labelbot:create-index
        {--work-mem= : Sets "maintenance_work_mem" during index build to this value in GB}
        {--parallel-workers= : Sets "max_parallel_maintenance_workers" during index build}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create the database index that is essential for LabelBOT';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        DB::beginTransaction();

        $workMem = (int) $this->option('work-mem');
        if ($workMem > 0) {
            DB::statement("SET LOCAL maintenance_work_mem = '{$workMem}GB'");
        }

        $parallelWorkers = (int) $this->option('parallel-workers');
        if ($parallelWorkers > 0) {
            DB::statement("SET LOCAL max_parallel_maintenance_workers = {$parallelWorkers}");
        }

        $this->line("Building image annotation index.");
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS image_annotation_label_feature_vectors_vector_idx ON image_annotation_label_feature_vectors USING hnsw (vector vector_cosine_ops) WITH (m = 16, ef_construction = 256)');
        $this->info("Finished.");

        $this->line("Building video annotation index.");
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS video_annotation_label_feature_vectors_vector_idx ON video_annotation_label_feature_vectors USING hnsw (vector vector_cosine_ops) WITH (m = 16, ef_construction = 256)');
        $this->info("Finished.");

        DB::commit();
    }
}
