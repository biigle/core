<?php

namespace Dias\Modules\Export\Support\Reports\ImageLabels;

use DB;
use App;
use Dias\Project;
use Dias\Modules\Export\Support\Exec;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Report;

class StandardReport extends Report
{
    /**
     * Create an image label report instance.
     *
     * @param Project $project The project for which the report should be generated.
     */
    public function __construct(Project $project)
    {
        parent::__construct($project);
        $this->name = 'image label report';
        $this->filename = 'image_label_report';
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
                        return $row->name;
                    })->implode(', '),
                ]);
            }

            $csv->close();
        }

        $this->executeScript();
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
            ->select('images.id', 'images.filename', 'labels.name')
            ->where('images.transect_id', $id)
            ->orderBy('images.filename');
    }

    /**
     * Execute the external report parsing script
     */
    protected function executeScript()
    {
        $python = config('export.python');
        $script = config('export.scripts.image_labels_standard_report');

        $csvs = implode(' ', array_map(function ($csv) {
            return $csv->path;
        }, $this->tmpFiles));

        $exec = App::make(Exec::class, [
            'command' => "{$python} {$script} \"{$this->project->name}\" {$this->storedReport->path} {$csvs}",
        ]);

        if ($exec->code !== 0) {
            throw new \Exception("Standard image label report generation failed with exit code {$exec->code}:\n".implode("\n", $exec->lines));
        }
    }
}
