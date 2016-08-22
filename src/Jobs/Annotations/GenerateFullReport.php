<?php

namespace Dias\Modules\Export\Jobs\Annotations;

use DB;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Annotations\Full;

class GenerateFullReport extends GenerateAnnotationReportJob
{
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
            $this->tmpFiles[] = $csv;

            // put transect name to first line
            $csv->put([$name]);

            $query = $this->query($id);

            $query->chunkById(500, function ($rows) use ($csv) {
                foreach ($rows as $row) {
                    $csv->put([
                        $row->filename,
                        $row->annotation_id,
                        $row->label_name,
                        $row->shape_name,
                        $row->points,
                        $row->attrs
                    ]);
                }
            }, 'annotation_labels.id', 'annotation_labels_id');

            $csv->close();
        }

        $this->report = app()->make(Full::class);
        $this->report->generate($this->project, $this->tmpFiles);

        $this->sendReportMail(
            'full annotation',
            'full_annotation',
            $this->report->basename(),
            'xlsx'
        );
    }

    /**
     * Assemble a new DB query for a transect.
     *
     * @param int $id Transect ID
     *
     * @return \Illuminate\Database\Query\Builder
     */
    private function query($id)
    {
        return DB::table('annotation_labels')
            ->join('labels', 'annotation_labels.label_id', '=', 'labels.id')
            ->join('annotations', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->join('shapes', 'annotations.shape_id', '=', 'shapes.id')
            ->select(
                'annotation_labels.id as annotation_labels_id', // required for chunkById
                'images.filename',
                'annotations.id as annotation_id',
                'labels.name as label_name',
                'shapes.name as shape_name',
                'annotations.points',
                'images.attrs'
            )
            ->where('images.transect_id', $id)
            ->when($this->restricted, function ($query) use ($id) {
                return $query->whereNotIn('annotations.id', $this->getSkipIds($id));
            })
            // order by is essential for chunking!
            ->orderBy('annotations.id')
            ->orderBy('labels.id')
            ->orderBy('annotation_labels.user_id');
    }
}
