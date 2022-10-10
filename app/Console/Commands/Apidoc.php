<?php

namespace Biigle\Console\Commands;

use Biigle\Services\Modules;
use Illuminate\Console\Command;

class Apidoc extends Command
{
    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'apidoc';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate the REST API documentation';

    /**
     * Handle the command.
     *
     * @return int
     */
    public function handle(Modules $modules)
    {
        $input = array_merge($modules->getApidocPaths(), [
            app_path('Http/Controllers/Api/'),
        ]);

        $output = public_path('doc/api');

        $flags = '-i '.implode(' -i ', $input);
        $flags .= " -o {$output}";

        $apidoc = 'apidoc';
        $command = "{$apidoc} {$flags}";

        $this->info("Executing: {$command}");

        $code = 0;
        system($command, $code);

        return $code;
    }
}
