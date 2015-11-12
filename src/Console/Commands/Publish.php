<?php

namespace Dias\Modules\Annotations\Console\Commands;

use Illuminate\Console\Command;
use Dias\Modules\Annotations\AnnotationsServiceProvider as ServiceProvider;

class Publish extends Command {

    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'annotations:publish';

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
