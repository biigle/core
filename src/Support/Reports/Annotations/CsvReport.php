<?php

namespace Dias\Modules\Export\Support\Reports\Annotations;

use DB;
use Dias\Project;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\MakesZipArchives;

class CsvReport extends AnnotationReport
{
    use MakesZipArchives;

    /**
     * Create an image label report instance.
     *
     * @param Project $project The project for which the report should be generated.
     * @param bool $restricted Is the report restricted to the export area?
     */
    public function __construct(Project $project, $restricted)
    {
        parent::__construct($project, $restricted);
        $this->name = 'CSV annotation report';
        $this->filename = 'csv_annotation_report';
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
                        $row->annotation_label_id,
                        $row->label_id,
                        $row->label_name,
                        $row->user_id,
                        $row->firstname,
                        $row->lastname,
                        $row->image_id,
                        $row->filename,
                        $row->shape_id,
                        $row->shape_name,
                        $row->points,
                        $row->attrs,
                    ]);
                }
            }, 'annotation_labels.id', 'annotation_label_id');

            $csv->close();
        }

        $this->makeZip($transects);
    }

    /**
     * Assemble a new DB query for a transect.
     *
     * @param int $id Transect ID
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query($id)
    {
        return DB::table('annotation_labels')
            ->join('labels', 'annotation_labels.label_id', '=', 'labels.id')
            ->join('annotations', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->join('shapes', 'annotations.shape_id', '=', 'shapes.id')
            ->join('users', 'annotation_labels.user_id', '=', 'users.id')
            ->select([
                'annotation_labels.id as annotation_label_id',
                'labels.id as label_id',
                'labels.name as label_name',
                'users.id as user_id',
                'users.firstname',
                'users.lastname',
                'images.id as image_id',
                'images.filename',
                'shapes.id as shape_id',
                'shapes.name as shape_name',
                'annotations.points',
                'images.attrs',
            ])
            ->where('images.transect_id', $id)
            ->when($this->restricted, function ($query) use ($id) {
                return $query->whereNotIn('annotations.id', $this->getSkipIds($id));
            })
            ->orderBy('annotation_labels.id');
    }
}
