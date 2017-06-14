<?php

namespace Biigle\Modules\Export\Support\Reports;

use File;
use Exception;
use Biigle\Label;
use ReflectionClass;
use Biigle\Modules\Export\ReportType;

class ReportGenerator
{
    /**
     * Options for this report.
     *
     * @var \Illuminate\Support\Collection
     */
    public $options;

    /**
     * The source this report belongs to.
     *
     * @var mixed
     */
    protected $source;

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
     * Cache for labels of all label trees that are used for this report.
     *
     * @var \Illuminate\Support\Collection
     */
    protected $labels;

    /**
     * Get the report generator for the given type.
     *
     * @param mixed $source
     * @param ReportType $type
     * @param array $options Options for the report generator
     *
     * @return ReportGenerator
     */
    public static function get($source, ReportType $type, $options = [])
    {
        $reflect = new ReflectionClass($source);
        $sourceClass = str_plural($reflect->getShortName());
        $className = __NAMESPACE__.'\\'.$sourceClass.'\\'.$type->name.'ReportGenerator';

        if (class_exists($className)) {
            return new $className($source, $options);
        }

        return null;
    }

    /**
     * Create a report generator instance.
     *
     * @param mixed $source Source this report belongs to (e.g. a volume)
     * @param array $options Options for the report
     */
    public function __construct($source, $options = [])
    {
        $this->source = $source;
        $this->options = collect($options);
        $this->tmpFiles = [];
    }

    /**
     * Generate the report.
     *
     * @param string $path Path to write the report file to.
     */
    public function generate($path)
    {
        try {
            $this->generateReport($path);
        } catch (Exception $e) {
            if (File::exists($path)) {
                File::delete($path);
            }
            throw $e;
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
     *
     * @param string $path Path to write the report file to.
     */
    public function generateReport($path)
    {
        //
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
     * @return bool
     */
    protected function shouldSeparateLabelTrees()
    {
        return $this->options->get('separateLabelTrees', false);
    }
}
