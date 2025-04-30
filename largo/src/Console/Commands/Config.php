<?php

namespace Biigle\Modules\Largo\Console\Commands;

use Biigle\Modules\Largo\LargoServiceProvider as ServiceProvider;
use Illuminate\Console\Command;

class Config extends Command
{
    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'largo:config';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Publish the config file for this module';

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
            '--force' => true,
        ]);
    }
}
