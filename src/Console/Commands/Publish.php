<?php

namespace Biigle\Modules\LabelTrees\Console\Commands;

use Illuminate\Console\Command;
use Biigle\Modules\LabelTrees\LabelTreesServiceProvider as ServiceProvider;

class Publish extends Command
{
    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'label-trees:publish';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Publish or refresh the public assets of this package';

    /**
     * Execute the command.
     *
     * @return void
     */
    public function handle()
    {
        $this->call('vendor:publish', [
            '--provider' => ServiceProvider::class,
            '--tag' => ['public'],
            '--force' => true,
        ]);
    }
}
