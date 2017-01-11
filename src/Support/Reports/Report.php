<?php

namespace Biigle\Modules\Export\Support\Reports;

use File;
use Exception;
use Biigle\Label;
use Biigle\Modules\Export\AvailableReport;

class Report
{
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
     * Cache for labels of all label trees that are used for this report.
     *
     * @var \Illuminate\Support\Collection
     */
    protected $labels;

    /**
     * Create a report instance.
     *
     * @param array $options Options for the report
     */
    public function __construct($options = [])
    {
        $this->options = collect($options);
        $this->tmpFiles = [];
        $this->availableReport = new AvailableReport;
    }

    /**
     * Generate the report.
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
     * Internal function to generate the report.
     *
     * (public for better testability)
     */
    public function generateReport()
    {
        //
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
     * Get the ID associated with this report (e.g. project ID)
     *
     * @return int
     */
    public function getId()
    {
        return 0;
    }

    /**
     * Get the filename used for downloading the report
     *
     * @return string
     */
    public function getDownloadFilename()
    {
        return "biigle_{$this->getId()}_{$this->getFilename()}.{$this->getExtension()}";
    }

    /**
     * Description of the subject of this report (e.g. `project xyz`).
     *
     * @return string
     */
    public function getSubject()
    {
        return  '';
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
            $this->labels = collect();
        }

        if (!$this->labels->has($id)) {
            // Fetch the whole label tree for each label that wasn't already loaded.
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

    /**
     * Should this report separate the output files for different label trees?
     *
     * @return boolean
     */
    protected function shouldSeparateLabelTrees()
    {
        return $this->options->get('separateLabelTrees', false);
    }
}
