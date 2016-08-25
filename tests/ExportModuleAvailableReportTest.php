<?php

use Dias\Modules\Export\AvailableReport;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ExportModuleAvailableReportTest extends TestCase {

    public function testFindOrFail()
    {
        File::shouldReceive('exists')->once()->andReturn(false);
        $this->setExpectedException(ModelNotFoundException::class);
        AvailableReport::findOrFail('abc');
    }
}
