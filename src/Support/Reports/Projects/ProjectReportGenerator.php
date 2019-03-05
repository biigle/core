<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects;

use Biigle\Volume;
use Biigle\Project;
use Biigle\Modules\Reports\Support\File;
use Biigle\Modules\Reports\Support\Reports\ReportGenerator;
use Biigle\Modules\Reports\Support\Reports\MakesZipArchives;

class ProjectReportGenerator extends ReportGenerator
{
    use MakesZipArchives;

    /**
     * The class of the report generator to use for this project report.
     *
     * @var string
     */
    protected $reportClass;

    /**
     * File extension of the report file.
     *
     * @var string
     */
    protected $extension = 'zip';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $filesForZip = [];

        foreach ($this->source->volumes as $volume) {
            $report = $this->getReportGenerator();
            $file = File::makeTmp();
            $report->generate($volume, $file->getPath());
            // The individual volume reports should be deleted again after
            // the ZIP of this report was created.
            $this->tmpFiles[] = $file;
            $filesForZip[$file->getPath()] = $volume->id.'_'.$report->getFullFilename();
        }

        $this->makeZip($filesForZip, $path);
    }

    /**
     * Get the report generator.
     *
     * @return \Biigle\Modules\Reports\Support\Reports\ReportGenerator
     */
    protected function getReportGenerator()
    {
        return new $this->reportClass($this->options);
    }
}
