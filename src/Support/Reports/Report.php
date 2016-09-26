<?php

namespace Dias\Modules\Export\Support\Reports;

use File;
use Exception;
use Dias\Label;
use Dias\Project;
use Dias\Modules\Export\AvailableReport;

class Report
{
    /**
     * The project for which the report should be generated.
     *
     * @var Project
     */
    public $project;

    /**
     * Options for this report.
     *
     * @var \Illuminate\Support\Collection
     */
    public $options;

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
     * Cache for labels of all label trees that were used in this project.
     *
     * Not necessarily only the label trees that are currently attached to the project!
     *
     * @var \Illuminate\Support\Collection
     */
    protected $labels;

    /**
     * Create a report instance.
     *
     * @param Project $project The project for which the report should be generated.
     * @param array $options Options for the report
     */
    public function __construct(Project $project, $options = [])
    {
        $this->project = $project;
        $this->options = collect($options);
        $this->tmpFiles = [];
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
     * Get the file extension
     *
     * @return string
     */
    public function getExtension()
    {
        return $this->extension;
    }

    /**
     * Get the filename used for downloading the report
     *
     * @return string
     */
    public function getDownloadFilename()
    {
        return "biigle_{$this->project->id}_{$this->getFilename()}.{$this->getExtension()}";
    }

    /**
     * Constructs a label name from the names of all parent labels and the label itself.
     *
     * Example: `Animalia > Annelida > Polychaeta > Buskiella sp`
     *
     * @param int  $id  Label ID
     * @return string
     */
    public function expandLabelName($id)
    {
        if (is_null($this->labels)) {
            // We expect most of the used labels to belong to a label tree currently
            // attached to the project.
            $this->labels = $this->getProjectLabels()->keyBy('id');
        }

        if (!$this->labels->has($id)) {
            // If another label tree was used, fetch it separately.
            $labels = $this->getSiblingLabels($id);
            $this->labels = $this->labels->merge($labels)->keyBy('id');
        }

        $label = $this->labels[$id];
        $name = $label->name;

        while (!is_null($label->parent_id)) {
            // We can assume that all parents belong to the same label tree so they
            // should already be cached here.
            $label = $this->labels[$label->parent_id];
            $name = "{$label->name} > {$name}";
        }

        return $name;
    }

    /**
     * Get all labels that are attached to the project of this report (through label trees).
     *
     * @return \Illuminate\Support\Collection
     */
    protected function getProjectLabels()
    {
        return Label::select('id', 'name', 'parent_id')
            ->whereIn('label_tree_id', function ($query) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->where('project_id', $this->project->id);
            })
            ->get();
    }

    /**
     * Get all labels that belong to the label tree of the given label.
     *
     * @param int $id Label ID
     * @return \Illuminate\Support\Collection
     */
    protected function getSiblingLabels($id)
    {
        return Label::select('id', 'name', 'parent_id')
            ->whereIn('label_tree_id', function ($query) use ($id) {
                $query->select('label_tree_id')
                    ->from('labels')
                    ->where('id', $id);
            })
            ->get();
    }
}
