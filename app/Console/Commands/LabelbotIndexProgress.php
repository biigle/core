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
        while (!empty($query = $this->runQuery())) {
            if (!isset($bar)) {
                $bar = $this->output->createProgressBar($query[0]->blocks_total);
                $bar->start();
            }

            $bar->setProgress($query[0]->blocks_done);
            sleep(1);
        };

        if (isset($bar)) {
            $bar->finish();
            $this->line('');
        } else {
            $this->warn('Could not find any index being built.');
        }
    }

    protected function runQuery()
    {
        return DB::select("
                SELECT blocks_done, blocks_total
                FROM pg_stat_progress_create_index
                WHERE command = 'CREATE INDEX CONCURRENTLY'
                ");
    }
}
