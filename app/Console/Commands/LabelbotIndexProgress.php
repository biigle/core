<?php

namespace Biigle\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class LabelbotIndexProgress extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'labelbot:index-progress';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Show the progress while building the database index for LabelBOT';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $bar = $this->output->createProgressBar(100);
        $hasProgress = false;

        do {
            $progress = DB::select("
                SELECT round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS percent
                FROM pg_stat_progress_create_index
                WHERE command = 'CREATE INDEX CONCURRENTLY'
                ");

            if (!empty($progress)) {
                if (!$hasProgress) {
                    $bar->start();
                    $hasProgress = true;
                }

                $percent = (int) $progress[0]->percent;
                $bar->setProgress($percent);
            } elseif (!$hasProgress) {
                $this->warn('Could not find any index being built.');
            }

            sleep(1);
        } while (!empty($progress));

        if ($hasProgress) {
            $bar->finish();
            $this->line('');
        }
    }
}
