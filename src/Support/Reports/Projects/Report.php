<?php

namespace Biigle\Modules\Export\Support\Reports\Projects;

use App;
use Biigle\Project;
use Biigle\Modules\Export\Support\Reports\MakesZipArchives;
use Biigle\Modules\Export\Support\Reports\Report as BaseReport;

class Report extends BaseReport
{
    use MakesZipArchives;

    /**
     * The project, this report belongs to.
     *
     * @var Project
     */
    public $project;

    /**
     * The class of the volume report to use for this project report.
     *
     * @var string
     */
    protected $volumeReportClass;

    /**
     * File extension of the report file.
     *
     * @var string
     */
    protected $extension = 'zip';

    /**
     * Create a report instance.
     *
     * @param Project $project The project, this report belongs to
     * @param array $options Options for the report
     */
    public function __construct(Project $project, $options = [])
    {
        parent::__construct($options);
        $this->project = $project;
    }

    /**
     * Get the ID associated with this report (e.g. project ID).
     *
     * @return int
     */
    public function getId()
    {
        return $this->project->id;
    }

    /**
     * Description of the subject of this report (e.g. `project xyz`).
     *
     * @return string
     */
    public function getSubject()
    {
        return  "project {$this->project->name}";
    }

    /**
     * Generate the report.
     *
     * @return void
     */
    public function generateReport()
    {
        $filesForZip = [];

        foreach ($this->project->volumes as $volume) {
            $report = App::make($this->volumeReportClass, [
                'volume' => $volume,
                'options' => $this->options,
            ]);
            $report->generate();
            // The individual volume reports should be deleted again after
            // the ZIP of this report was created.
            $this->tmpFiles[] = $report->availableReport;
            $filesForZip[$report->availableReport->path] = $report->getDownloadFilename();
        }

        $this->makeZip($filesForZip);
    }
}
