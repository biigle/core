<?php

namespace Biigle\Modules\Export\Observers;

use File;
use Biigle\Modules\Export\Report;

class ReportObserver
{
    /**
     * Fill the attributes that depend on the source.
     *
     * @param Report $report
     */
    public function creating($report)
    {
        $report->source_name = $report->source->name;
        $generator = $report->getReportGenerator();
        $report->name = $generator->getName();
        $report->filename = $generator->getFilename();
    }

    /**
     * Remove report file of a report that should be deleted.
     *
     * @param Report $report
     */
    public function deleted($report)
    {
        File::delete($report->getPath());
    }
}
