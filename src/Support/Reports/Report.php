<?php

namespace Dias\Modules\Export\Support\Reports;

use File;
use Exception;
use Dias\Project;
use Dias\Modules\Export\AvailableReport;

class Report
{
    /**
     * The project for which the report should be generated.
     *
     * @var Project
     */
    protected $project;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name;

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename;

    /**
     * File extension of the report file.
     *
     * @var string
     */
    protected $extension;

    /**
     * Temporary files that are created when generating a report.
     *
     * @var array
     */
    protected $tmpFiles;

    /**
     * Instance of the stored report file.
     *
     * @var AvailableReport
     */
    protected $availableReport;

    /**
     * Create a report instance.
     *
     * @param Project $project The project for which the report should be generated.
     */
    public function __construct(Project $project)
    {
        $this->project = $project;
        $this->tmpFiles = [];
        $this->name = '';
        $this->filename = '';
        $this->extension = '';
        $this->availableReport = new AvailableReport;
    }

    /**
     * Generate the report.
     *
     * @return void
     */
    public function generate()
    {
        try {
            $this->generateReport();
        } catch (Exception $e) {
            if (isset($this->availableReport)) {
                $this->availableReport->delete();
                throw $e;
            }
        } finally {
            array_walk($this->tmpFiles, function ($file) {
                $file->delete();
            });
        }
    }

    /**
     * Get the report name
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Get the name of the project belonging to this report
     *
     * @return string
     */
    public function getProjectName()
    {
        return $this->project->name;
    }

    /**
     * Get the download URL for this report.
     *
     * @return string
     */
    public function getUrl()
    {
        return route('download_report', [
            $this->availableReport->basename(),
            $this->getDownloadFilename(),
        ]);
    }

    /**
     * Get the filename
     *
     * @return string
     */
    public function getFilename()
    {
        return $this->filename;
    }

    /**
     * Get the filename used for downloading the report
     *
     * @return string
     */
    public function getDownloadFilename()
    {
        return "biigle_{$this->project->id}_{$this->getFilename()}.{$this->extension}";
    }
}
