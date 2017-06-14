<?php

namespace Biigle\Modules\Export\Observers;

use File;
use Biigle\Modules\Export\Report;

class ReportObserver
{
    /**
     * Remove report file of a report that should be deleted.
     *
     * @param \Biigle\Report $report
     */
    public function deleted($report)
    {
        File::delete($report->getPath());
    }
}
