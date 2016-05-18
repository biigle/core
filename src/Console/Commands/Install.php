<?php

namespace Dias\Modules\Export\Console\Commands;

use Illuminate\Console\Command;
use Dias\Attribute;
use Dias\Modules\Export\ExportServiceProvider as ServiceProvider;

class Install extends Command
{
    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'export:install';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run the database migrations for the dias/export package';

    /**
     * Execute the command.
     *
     * @return void
     */
    public function handle()
    {
        $this->setUpMigration();
        $this->info('Finished! Please refer to the package readme on how to proceed.');
    }

    private function setUpMigration()
    {
        $this->call('vendor:publish', [
            '--provider' => ServiceProvider::class,
            '--tag' => ['migrations'],
        ]);

        if ($this->confirm('Do you want to run the migration right away?')) {
            $this->call('migrate');
        }
    }
}
