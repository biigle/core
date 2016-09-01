<?php

namespace Dias\Modules\Export\Support\Reports\Annotations;

use DB;
use Dias\Project;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\ExecutesPythonScript;

class ExtendedReport extends AnnotationReport
{
    use ExecutesPythonScript;

    /**
     * Create an image label report instance.
     *
     * @param Project $project The project for which the report should be generated.
     * @param bool $restricted Is the report restricted to the export area?
     */
    public function __construct(Project $project, $restricted)
    {
        parent::__construct($project, $restricted);
        $this->name = 'extended annotation report';
        $this->filename = 'extended_annotation_report';
        $this->extension = 'xlsx';
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
            $this->tmpFiles[] = $csv;

            // put transect name to first line
            $csv->put([$name]);

            $query = $this->query($id);
            $rows = $query->get();

            // DO NOT USE CHUNK BECAUSE IT DESTROYS groupBy!
            foreach ($rows as $row) {
                $csv->put([
                    $row->filename,
                    $row->name,
                    $row->count,
                ]);
            }

            $csv->close();
        }

        $this->executeScript('extended_report');
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
        return DB::table('images')
            ->join('annotations', 'annotations.image_id', '=', 'images.id')
            ->join('annotation_labels', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('labels', 'annotation_labels.label_id', '=', 'labels.id')
            // images.id is required for chunkById
            ->select(DB::raw('images.id as images_id, images.filename, labels.name, count(labels.id) as count'))
            ->groupBy('labels.id', 'images.id')
            ->where('images.transect_id', $id)
            ->when($this->restricted, function ($query) use ($id) {
                return $query->whereNotIn('annotations.id', $this->getSkipIds($id));
            })
            ->orderBy('images.filename');
    }
}
