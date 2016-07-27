<?php

namespace Dias\Modules\Export\Jobs;

use DB;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Basic;

class GenerateBasicReport extends GenerateReportJob
{
    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $transects = $this->project->transects()
            ->pluck('name', 'id');

        $tmpFiles = [];

        try {
            foreach ($transects as $id => $name) {
                $csv = CsvFile::makeTmp();
                $tmpFiles[] = $csv;

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

            $report = app()->make(Basic::class);
            $report->generate($this->project, $tmpFiles);

            $this->sendReportMail('basic', $report->basename(), 'pdf');

        } catch (\Exception $e) {
            if (isset($report)) {
                $report->delete();
                throw $e;
            }
        } finally {
            array_walk($tmpFiles, function ($file) {
                $file->delete();
            });
        }
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
}
