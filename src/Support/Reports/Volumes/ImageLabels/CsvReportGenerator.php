<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes\ImageLabels;

use Biigle\LabelTree;
use Biigle\Modules\Reports\Support\CsvFile;
use Biigle\Modules\Reports\Support\Reports\MakesZipArchives;
use Biigle\Modules\Reports\Support\Reports\Volumes\VolumeReportGenerator;
use Biigle\User;
use DB;

class CsvReportGenerator extends VolumeReportGenerator
{
    use MakesZipArchives;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'CSV image label report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'csv_image_label_report';

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
        $rows = $this->query()->get();
        $toZip = [];

        if ($this->shouldSeparateLabelTrees() && $rows->isNotEmpty()) {
            $rows = $rows->groupBy('label_tree_id');
            $trees = LabelTree::whereIn('id', $rows->keys())->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $csv = $this->createCsv($rows->get($id));
                $this->tmpFiles[] = $csv;
                $toZip[$csv->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'csv');
            }
        } elseif ($this->shouldSeparateUsers() && $rows->isNotEmpty()) {
            $rows = $rows->groupBy('user_id');
            $users = User::whereIn('id', $rows->keys())
                ->selectRaw("id, concat(firstname, ' ', lastname) as name")
                ->pluck('name', 'id');

            foreach ($users as $id => $name) {
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
     * Assemble a new DB query for the volume of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    public function query()
    {
        $query = DB::table('image_labels')
            ->join('images', 'image_labels.image_id', '=', 'images.id')
            ->join('users', 'image_labels.user_id', '=', 'users.id')
            ->join('labels', 'labels.id', '=', 'image_labels.label_id')
            ->select([
                'image_labels.id as image_label_id',
                'image_labels.image_id',
                'images.filename',
                'images.lng as longitude',
                'images.lat as latitude',
                'image_labels.user_id',
                'users.firstname',
                'users.lastname',
                'image_labels.label_id',
                'labels.name as label_name',
            ])
            ->where('images.volume_id', $this->source->id)
            ->when($this->isRestrictedToLabels(), function ($query) {
                return $this->restrictToLabelsQuery($query, 'image_labels');
            })
            ->orderBy('images.filename');

        if ($this->shouldSeparateLabelTrees()) {
            $query->addSelect('labels.label_tree_id');
        }

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
            'image_label_id',
            'image_id',
            'filename',
            'longitude',
            'latitude',
            'user_id',
            'firstname',
            'lastname',
            'label_id',
            'label_name',
            'label_hierarchy',
        ]);

        foreach ($rows as $row) {
            $csv->put([
                $row->image_label_id,
                $row->image_id,
                $row->filename,
                $row->longitude,
                $row->latitude,
                $row->user_id,
                $row->firstname,
                $row->lastname,
                $row->label_id,
                $row->label_name,
                $this->expandLabelName($row->label_id),
            ]);
        }

        $csv->close();

        return $csv;
    }
}
