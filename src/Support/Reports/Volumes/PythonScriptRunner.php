<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes;

use Exception;

class PythonScriptRunner
{
    /**
     * Array of output lines of the exec call.
     *
     * @var array
     */
    public $lines;

    /**
     * Exit code of the exec call.
     *
     * @var int
     */
    public $code;

    /**
     * Create and execute the exec command.
     */
    public function __construct()
    {
        $this->lines = [];
        $this->code = 0;
    }

    /**
     * Execute the external report parsing Python script.
     *
     * @param string $scriptName Name of the script to execute (in the `reports.scripts` config namespace)
     * @param string $volumeName Name of the volume that belongs to the data
     * @param string $path Path to the file to store the generated report to
     * @param array $csvs Array of CSV files that should be passed along to the script
     *
     * @throws Exception If the script returned an error code.
     */
    public function run($scriptName, $volumeName, $path, $csvs = [])
    {
        $python = config('reports.python');
        $script = config("reports.scripts.{$scriptName}");

        $csvs = implode(' ', array_map(function ($csv) {
            return $csv->getPath();
        }, $csvs));

        $command = "{$python} {$script} \"{$volumeName}\" {$path} {$csvs} 2>&1";

        exec($command, $this->lines, $this->code);

        if ($this->code !== 0) {
            throw new Exception("The report script '{$scriptName}' failed with exit code {$this->code}:\n".implode("\n", $this->lines));
        }
    }
}
