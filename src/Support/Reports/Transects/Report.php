<?php

namespace Dias\Modules\Export\Support\Reports\Transects;

use Dias\Label;
use Dias\Transect;
use Dias\Modules\Export\Support\Reports\Report as BaseReport;

class Report extends BaseReport
{
    /**
     * The transect, this report belongs to.
     *
     * @var Transect
     */
    public $transect;

    /**
     * Create a report instance.
     *
     * @param Transect $transect The transect, this report belongs to
     * @param array $options Options for the report
     */
    public function __construct(Transect $transect, $options = [])
    {
        parent::__construct($options);
        $this->transect = $transect;
    }

    /**
     * Get the ID associated with this report (e.g. project ID)
     *
     * @return int
     */
    public function getId()
    {
        return $this->transect->id;
    }

    /**
     * Description of the subject of this report (e.g. `project xyz`).
     *
     * @return string
     */
    public function getSubject()
    {
        return  "transect {$this->transect->name}";
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
            $this->labels = $this->getTransectLabels()->keyBy('id');
        }

        return parent::expandLabelName($id);
    }

    /**
     * Get all labels that are attached to the transect of this report (through project label trees).
     *
     * @return \Illuminate\Support\Collection
     */
    protected function getTransectLabels()
    {
        return Label::select('id', 'name', 'parent_id')
            ->whereIn('label_tree_id', function ($query) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', function ($query) {
                        $query->select('project_id')
                            ->from('project_transect')
                            ->where('transect_id', $this->transect->id);
                    });
            })
            ->get();
    }
}
