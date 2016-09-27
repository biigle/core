<?php

namespace Dias\Modules\Export\Support\Reports;

use App;
use Exception;
use Dias\Modules\Export\Support\Exec;

trait ExecutesPythonScript
{
    /**
     * Execute the external report parsing Python script
     *
     * @param string $name Name of the script to execute (in the `export.scripts` config namespace)
     * @param string $title Title to use for the report
     * @throws Exception If the script returned an error code.
     */
    protected function executeScript($name, $title)
    {
        $python = config('export.python');
        $script = config("export.scripts.{$name}");

        $csvs = implode(' ', array_map(function ($csv) {
            return $csv->path;
        }, $this->tmpFiles));

        $exec = App::make(Exec::class, [
            'command' => "{$python} {$script} \"{$title}\" {$this->availableReport->path} {$csvs}",
        ]);

        if ($exec->code !== 0) {
            throw new Exception("The report script '{$name}' failed with exit code {$exec->code}:\n".implode("\n", $exec->lines));
        }
    }
}
