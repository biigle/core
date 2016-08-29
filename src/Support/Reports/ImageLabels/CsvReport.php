<?php

namespace Dias\Modules\Export\Support\Reports\ImageLabels;

use DB;
use Dias\Project;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Report;
use Dias\Modules\Export\Support\Reports\MakesZipArchives;

class CsvReport extends Report
{
    use MakesZipArchives;

    /**
     * Create an image label report instance.
     *
     * @param Project $project The project for which the report should be generated.
     */
    public function __construct(Project $project)
    {
        parent::__construct($project);
        $this->name = 'CSV image label report';
        $this->filename = 'csv_image_label_report';
        $this->extension = 'zip';
    }

    /**
     * Generate the report.
     *
     * @return void
     */
    public function generateReport()
    {
        $transects = $this->project->transects()
            ->pluck('name', 'id');

        foreach ($transects as $id => $name) {
            $csv = CsvFile::makeTmp();
            $this->tmpFiles[$id] = $csv;

            $query = $this->query($id);

            $query->chunkById(500, function ($rows) use ($csv) {
                foreach ($rows as $row) {
                    $csv->put([
                        $row->image_label_id,
                        $row->image_id,
                        $row->filename,
                        $row->user_id,
                        $row->firstname,
                        $row->lastname,
                        $row->label_id,
                        $row->label_name,
                    ]);
                }
            }, 'image_labels.id', 'image_label_id');

            $csv->close();
        }

        $this->makeZip($transects);
    }

    /**
     * Assemble a new DB query for a transect.
     *
     * @param int $id Transect ID
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query($id)
    {
        return DB::table('image_labels')
            ->join('images', 'image_labels.image_id', '=', 'images.id')
            ->join('labels', 'image_labels.label_id', '=', 'labels.id')
            ->join('users', 'image_labels.user_id', '=', 'users.id')
            ->select([
                'image_labels.id as image_label_id',
                'image_labels.image_id',
                'images.filename',
                'image_labels.user_id',
                'users.firstname',
                'users.lastname',
                'image_labels.label_id',
                'labels.name as label_name',
            ])
            ->where('images.transect_id', $id)
            ->orderBy('images.filename')
            ->orderBy('image_labels.label_id');
    }
}
