<?php

namespace Biigle\Modules\Reports\Observers;

use Biigle\Modules\Reports\Report;

class ReportObserver
{
    /**
     * Fill the attributes that depend on the source.
     *
     * @param Report $report
     */
    public function creating($report)
    {
        if ($report->source->name) {
            $report->source_name = $report->source->name;
        } elseif (is_null($report->source_name)) {
            $report->source_name = '';
        }
    }

    /**
     * Remove report file of a report that should be deleted.
     *
     * @param Report $report
     */
    public function deleted($report)
    {
        $report->deleteFile();
    }
}
