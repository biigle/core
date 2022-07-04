<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes\VideoLabels;

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
    public $name = 'CSV video label report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'csv_video_label_report';

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
        $query = DB::table('video_labels')
            ->join('videos', 'video_labels.video_id', '=', 'videos.id')
            ->join('users', 'video_labels.user_id', '=', 'users.id')
            ->join('labels', 'labels.id', '=', 'video_labels.label_id')
            ->select([
                'video_labels.id as video_label_id',
                'video_labels.video_id',
                'videos.filename',
                'video_labels.user_id',
                'users.firstname',
                'users.lastname',
                'video_labels.label_id',
                'labels.name as label_name',
                'video_labels.created_at',
            ])
            ->where('videos.volume_id', $this->source->id)
            ->when($this->isRestrictedToLabels(), function ($query) {
                return $this->restrictToLabelsQuery($query, 'video_labels');
            })
            ->orderBy('videos.filename');

        if ($this->shouldSeparateLabelTrees()) {
            $query->addSelect('labels.label_tree_id');
        } elseif ($this->shouldSeparateUsers()) {
            $query->addSelect('video_labels.user_id');
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
            'video_label_id',
            'video_id',
            'filename',
            'user_id',
            'firstname',
            'lastname',
            'label_id',
            'label_name',
            'label_hierarchy',
            'created_at',
        ]);

        foreach ($rows as $row) {
            $csv->put([
                $row->video_label_id,
                $row->video_id,
                $row->filename,
                $row->user_id,
                $row->firstname,
                $row->lastname,
                $row->label_id,
                $row->label_name,
                $this->expandLabelName($row->label_id),
                $row->created_at,
            ]);
        }

        $csv->close();

        return $csv;
    }
}
