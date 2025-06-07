<?php

namespace Biigle\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ShowHNSWProgress extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'labelbot:hnsw-build-progress';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Show progress of HNSW index creation';

    /**
     * Execute the console command.
     */
    public function handle()
    {

        $bar = $this->output->createProgressBar(100);
        $hasProgress = false;

        do {
            $progress = DB::select("
                SELECT round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS percent, phase
                FROM pg_stat_progress_create_index
                WHERE command = 'CREATE INDEX'
                ");

            if (count($progress)) {
                if (!$hasProgress) {
                    $this->line("Building the HNSW index...");
                    $bar->start();
                    $hasProgress = true;
                }

                $percent = (int) $progress[0]->percent;
                $bar->setProgress($percent);
            } else {
                if (!$hasProgress) {
                    $this->warn('No HNSW index creation in progress.');
                }
                break;
            }

            sleep(1);
        } while (true);

        if ($hasProgress) {
            $bar->finish();
            $this->info("HNSW index build is complete.");
        }
    }
}
