<?php

namespace Dias\Modules\Export\Support\Reports;

use Dias\Project;

class Full extends Report
{
    /**
     * Generate this basic report
     *
     * @param Project $project The project this report belongs to
     * @param array $csvs Array of CsvFile objects that should be used for this report
     */
    public function generate(Project $project, array $csvs)
    {
        $code = 0;
        $python = config('export.python');
        $script = config('export.scripts.full_report');

        $csvs = implode(' ', array_map(function ($csv) {
            return $csv->path;
        }, $csvs));

        $dump = [];
        exec("{$python} {$script} \"{$project->name}\" {$this->path} {$csvs}", $dump, $code);

        if ($code !== 0) {
            throw new \Exception("Full report generation failed with exit code {$code}.");
        }
    }
}
