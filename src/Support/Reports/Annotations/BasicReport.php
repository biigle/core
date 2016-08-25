<?php

namespace Dias\Modules\Export\Support\Reports\Annotations;

use DB;
use App;
use Dias\Project;
use Dias\Modules\Export\Support\Exec;
use Dias\Modules\Export\Support\CsvFile;

class BasicReport extends AnnotationReport
{
    /**
     * Create an image label report instance.
     *
     * @param Project $project The project for which the report should be generated.
     * @param bool $restricted Is the report restricted to the export area?
     */
    public function __construct(Project $project, $restricted)
    {
        parent::__construct($project, $restricted);
        $this->name = 'basic annotation report';
        $this->filename = 'basic_annotation_report';
        $this->extension = 'pdf';
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

            $rows = $this->query($id)->get();

            foreach ($rows as $row) {
                $csv->put([
                    $row->name,
                    $row->color,
                    $row->count,
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
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query($id)
    {
        return DB::table('labels')
            ->join('annotation_labels', 'annotation_labels.label_id', '=', 'labels.id')
            ->join('annotations', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->where('images.transect_id', $id)
            ->when($this->restricted, function ($query) use ($id) {
                return $query->whereNotIn('annotations.id', $this->getSkipIds($id));
            })
            ->select(DB::raw('labels.name, labels.color, count(labels.id) as count'))
            ->groupBy('labels.id');
    }

    /**
     * Execute the external report parsing script
     */
    protected function executeScript()
    {
        $python = config('export.python');
        $script = config('export.scripts.basic_report');

        $csvs = implode(' ', array_map(function ($csv) {
            return $csv->path;
        }, $this->tmpFiles));

        $exec = App::make(Exec::class, [
            'command' => "{$python} {$script} \"{$this->project->name}\" {$this->storedReport->path} {$csvs}",
        ]);

        if ($exec->code !== 0) {
            throw new \Exception("Basic annotation report generation failed with exit code {$exec->code}:\n".implode("\n", $exec->lines));
        }
    }
}
