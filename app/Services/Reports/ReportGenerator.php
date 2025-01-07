<?php

namespace Biigle\Services\Reports;

use Biigle\Label;
use Biigle\ReportType;
use Biigle\Services\Reports\File as FileHelper;
use Biigle\Video;
use Biigle\Volume;
use Exception;
use File;
use ReflectionClass;
use Str;

class ReportGenerator
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
    public $name;

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename;

    /**
     * File extension of the report file.
     *
     * @var string
     */
    public $extension;

    /**
     * Source this report belongs to (e.g. a volume).
     *
     * @var mixed
     */
    protected $source;

    /**
     * Temporary files that are created when generating a report.
     *
     * @var array
     */
    protected $tmpFiles;

    /**
     * Cache for labels of all label trees that are used for this report.
     *
     * @var \Illuminate\Support\Collection
     */
    protected $labels;

    /**
     * Get the report generator for the given type.
     *
     * @param string $sourceClass Class name of the source model
     * @param ReportType $type Type of the report to generate
     * @param array $options Options for the report generator
     *
     * @return ReportGenerator
     */
    public static function get($sourceClass, ReportType $type, $options = [])
    {
        // Establish backwards compatibility with old single video reports.
        // See: https://github.com/biigle/core/issues/276
        if ($sourceClass === Video::class && $type->id === ReportType::videoAnnotationsCsvId()) {
            $sourceClass = Volume::class;
        }

        if (class_exists($sourceClass)) {
            $reflect = new ReflectionClass($sourceClass);
            $sourceClass = Str::plural($reflect->getShortName());
            $fullClass = __NAMESPACE__.'\\'.$sourceClass.'\\'.$type->name.'ReportGenerator';

            if (class_exists($fullClass)) {
                return new $fullClass($options);
            }

            throw new Exception("Report generator {$fullClass} does not exist.");
        }

        throw new Exception("Source class {$sourceClass} does not exist.");
    }

    /**
     * Create a report generator instance.
     *
     * @param array $options Options for the report
     */
    public function __construct($options = [])
    {
        $this->options = collect($options);
        $this->tmpFiles = [];
    }

    /**
     * Generate the report.
     *
     * @param mixed $source Source to generate the report for (e.g. a volume)
     *
     * @return string Path to the generated report file.
     */
    public function generate($source)
    {
        $this->setSource($source);

        if (is_null($this->source)) {
            throw new Exception('Cannot generate report because the source does not exist.');
        }

        $path = FileHelper::makeTmp()->getPath();

        try {
            $this->generateReport($path);
        } catch (Exception $e) {
            if (File::exists($path)) {
                File::delete($path);
            }
            throw $e;
        } finally {
            array_walk($this->tmpFiles, function ($file) {
                if (is_string($file)) {
                    File::delete($file);
                } else {
                    $file->delete();
                }
            });
        }

        return $path;
    }

    /**
     * Internal function to generate the report.
     *
     * (public for better testability)
     *
     * @param string $path Path to write the report file to.
     */
    public function generateReport($path)
    {
        //
    }

    /**
     * Set the source.
     *
     * @param mixed $source
     */
    public function setSource($source)
    {
        $this->source = $source;
    }

    /**
     * Get the report name.
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Get the report filename.
     *
     * @return string
     */
    public function getFilename()
    {
        return $this->filename;
    }

    /**
     * Get the filename with extension.
     *
     * @return string
     */
    public function getFullFilename()
    {
        return "{$this->getFilename()}.{$this->extension}";
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
     * @return bool
     */
    protected function shouldSeparateLabelTrees()
    {
        return $this->options->get('separateLabelTrees', false);
    }

    /**
     * Should this report separate the output files for different user?
     *
     * @return bool
     */
    protected function shouldSeparateUsers()
    {
        return $this->options->get('separateUsers', false);
    }

    /**
     * Returns the array of label ids to which this report should be restricted.
     *
     * @return array
     */
    protected function getOnlyLabels()
    {
        return $this->options->get('onlyLabels', []);
    }

    /**
     * Determines if this report is restricted to a subset of labels.
     *
     * @return bool
     */
    protected function isRestrictedToLabels()
    {
        return !empty($this->getOnlyLabels());
    }
}
