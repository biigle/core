<?php

namespace Biigle\Modules\Reports\Support\Reports\Videos\VideoAnnotations;

use DB;
use Biigle\Label;
use Biigle\LabelTree;
use Biigle\Modules\Reports\Support\CsvFile;
use Biigle\Modules\Reports\Support\Reports\ReportGenerator;
use Biigle\Modules\Reports\Support\Reports\MakesZipArchives;

class CsvReportGenerator extends ReportGenerator
{
    use MakesZipArchives;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'CSV video annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'csv_video_annotation_report';

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
        $rows = $this->query()->get();
        $toZip = [];

        if ($this->shouldSeparateLabelTrees()) {
            $rows = $rows->groupBy('label_tree_id');
            $trees = LabelTree::whereIn('id', $rows->keys())->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $csv = $this->createCsv($rows->get($id));
                $this->tmpFiles[] = $csv;
                $toZip[$csv->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'csv');
            }
        } else {
            $csv = $this->createCsv($rows);
            $this->tmpFiles[] = $csv;
            $toZip[$csv->getPath()] = $this->sanitizeFilename("{$this->source->id}-{$this->source->name}", 'csv');
        }

        $this->makeZip($toZip, $path);
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
            // attached to the video (through its projects).
            $this->labels = $this->getVideoLabels()->keyBy('id');
        }

        return parent::expandLabelName($id);
    }

    /**
     * Callback to be used in a `when` query statement that restricts the results to a specific subset of annotation labels.
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @return \Illuminate\Database\Query\Builder
     */
    public function restrictToLabelsQuery($query)
    {
        return $query->whereIn('video_annotation_labels.label_id', $this->getOnlyLabels());
    }

    /**
     * Assembles the part of the DB query that is the same for all annotation reports.
     *
     * @param mixed $columns The columns to select
     * @return \Illuminate\Database\Query\Builder
     */
    public function initQuery($columns = [])
    {
        $query = DB::table('video_annotation_labels')
            ->join('video_annotations', 'video_annotation_labels.video_annotation_id', '=', 'video_annotations.id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->join('labels', 'video_annotation_labels.label_id', '=', 'labels.id')
            ->where('videos.id', $this->source->id)
            ->when($this->isRestrictedToLabels(), [$this, 'restrictToLabelsQuery'])
            ->select($columns);

        if ($this->shouldSeparateLabelTrees()) {
            $query->addSelect('labels.label_tree_id');
        }

        return $query;
    }

    /**
     * Get all labels that are attached to the volume of this report (through project label trees).
     *
     * @return \Illuminate\Support\Collection
     */
    protected function getVideoLabels()
    {
        return Label::select('id', 'name', 'parent_id')
            ->whereIn('label_tree_id', function ($query) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->where('project_id', $this->source->project_id);
            })
            ->get();
    }

    /**
     * Assemble a new DB query for the video of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $query = $this->initQuery([
                'video_annotation_labels.id as video_annotation_label_id',
                'video_annotation_labels.label_id',
                'labels.name as label_name',
                'users.id as user_id',
                'users.firstname',
                'users.lastname',
                'videos.id as video_id',
                'videos.name as video_name',
                'shapes.id as shape_id',
                'shapes.name as shape_name',
                'video_annotations.points',
                'video_annotations.frames',
                'video_annotations.id as video_annotation_id',
            ])
            ->join('shapes', 'video_annotations.shape_id', '=', 'shapes.id')
            ->join('users', 'video_annotation_labels.user_id', '=', 'users.id')
            ->orderBy('video_annotation_labels.id');

        return $query;
    }

    /**
     * Create a CSV file for this report.
     *
     * @param \Illuminate\Support\Collection $rows The rows for the CSV
     * @return CsvFile
     */
    protected function createCsv($rows)
    {
        $csv = CsvFile::makeTmp();
        // column headers
        $csv->put([
            'video_annotation_label_id',
            'label_id',
            'label_name',
            'label_hierarchy',
            'user_id',
            'firstname',
            'lastname',
            'video_id',
            'video_name',
            'shape_id',
            'shape_name',
            'points',
            'frames',
            'video_annotation_id',
        ]);

        foreach ($rows as $row) {
            $csv->put([
                $row->video_annotation_label_id,
                $row->label_id,
                $row->label_name,
                $this->expandLabelName($row->label_id),
                $row->user_id,
                $row->firstname,
                $row->lastname,
                $row->video_id,
                $row->video_name,
                $row->shape_id,
                $row->shape_name,
                $row->points,
                $row->frames,
                $row->video_annotation_id,
            ]);
        }

        $csv->close();

        return $csv;
    }
}
