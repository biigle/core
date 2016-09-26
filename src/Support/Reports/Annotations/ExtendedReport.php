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
     * @param array $options Options for the report
     */
    public function __construct(Project $project, $options = [])
    {
        parent::__construct($project, $options);
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
                    $this->expandLabelName($row->label_id),
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
            ->select(DB::raw('images.filename, annotation_labels.label_id, count(annotation_labels.label_id) as count'))
            ->groupBy('annotation_labels.label_id', 'images.id')
            ->where('images.transect_id', $id)
            ->when($this->isRestricted(), function ($query) use ($id) {
                return $query->whereNotIn('annotations.id', $this->getSkipIds($id));
            })
            ->orderBy('images.filename');
    }
}
