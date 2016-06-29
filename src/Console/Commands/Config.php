<?php

namespace Dias\Modules\Export\Console\Commands;

use Illuminate\Console\Command;
use Dias\Modules\Export\ExportServiceProvider as ServiceProvider;

class Config extends Command {

    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'export:config';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Publish the configuration of this package';

    /**
     * Execute the command.
     *
     * @return void
     */
    public function handle()
    {
        $this->call('vendor:publish', [
            '--provider' => ServiceProvider::class,
            '--tag' => ['config'],
        ]);
    }
}
