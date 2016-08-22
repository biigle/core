<?php

namespace Dias\Modules\Export\Support\Reports\ImageLabels;

use Dias\Project;
use Dias\Modules\Export\Support\Reports\Report;

class Standard extends Report
{
    /**
     * Generate this report
     *
     * @param Project $project The project this report belongs to
     * @param array $csvs Array of CsvFile objects that should be used for this report
     */
    public function generate(Project $project, array $csvs)
    {
        $code = 0;
        $python = config('export.python');
        $script = config('export.scripts.image_labels_standard_report');

        $csvs = implode(' ', array_map(function ($csv) {
            return $csv->path;
        }, $csvs));

        $dump = [];
        exec("{$python} {$script} \"{$project->name}\" {$this->path} {$csvs}", $dump, $code);

        if ($code !== 0) {
            throw new \Exception("Standard image label report generation failed with exit code {$code}:\n".implode("\n", $dump));
        }
    }
}
