<?php

namespace Dias\Modules\Export\Support\Reports\ImageLabels;

use DB;
use Dias\Project;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Report;
use Dias\Modules\Export\Support\Reports\ExecutesPythonScript;

class BasicReport extends Report
{
    use ExecutesPythonScript;

    /**
     * Create an image label report instance.
     *
     * @param Project $project The project for which the report should be generated.
     */
    public function __construct(Project $project)
    {
        parent::__construct($project);
        $this->name = 'standard image label report';
        $this->filename = 'standard_image_label_report';
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

            $rows = $this->query($id)->get()->groupBy('id');

            foreach ($rows as $imageId => $row) {
                $csv->put([
                    $row[0]->id,
                    $row[0]->filename,
                    $row->map(function ($row) {
                        return $this->expandLabelName($row->label_id);
                    })->implode(', '),
                ]);
            }

            $csv->close();
        }

        $this->executeScript('image_labels_standard_report');
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
            ->select('images.id', 'images.filename', 'image_labels.label_id')
            ->where('images.transect_id', $id)
            ->orderBy('images.filename');
    }
}
