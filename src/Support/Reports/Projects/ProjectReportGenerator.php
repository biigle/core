<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects;

use Biigle\Modules\Reports\Support\Reports\MakesZipArchives;
use Biigle\Modules\Reports\Support\Reports\ReportGenerator;

abstract class ProjectReportGenerator extends ReportGenerator
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
    public $extension = 'zip';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $filesForZip = [];

        foreach ($this->getProjectSources() as $source) {
            $report = $this->getReportGenerator();
            $p = $report->generate($source);
            // The individual source reports should be deleted again after
            // the ZIP of this report was created.
            $this->tmpFiles[] = $p;
            $filesForZip[$p] = $source->id.'_'.$report->getFullFilename();
        }

        $this->makeZip($filesForZip, $path);
    }

    /**
     * Get sources for the sub-reports that should be generated for this project.
     *
     * @return mixed
     */
    abstract public function getProjectSources();

    /**
     * Get the report generator.
     *
     * @return \Biigle\Modules\Reports\Support\Reports\ReportGenerator
     */
    protected function getReportGenerator()
    {
        return new $this->reportClass($this->options);
    }

    /**
     * Determines if this report should take only the newest label for each annotation.
     *
     * @return bool
     */
    protected function isRestrictedToNewestLabel()
    {
        return $this->options->get('newestLabel', false);
    }
}
