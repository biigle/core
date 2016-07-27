<?php

namespace Dias\Modules\Export\Jobs;

use DB;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Full;

class GenerateFullReport extends GenerateReportJob
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

                $query = $this->query($id);

                $query->chunkById(500, function ($rows) use ($csv) {
                    foreach ($rows as $row) {
                        $csv->put([
                            $row->filename,
                            $row->annotation_id,
                            $row->label_name,
                            $row->shape_name,
                            $row->points,
                        ]);
                    }
                }, 'annotation_labels.id');
                $csv->close();
            }

            $report = app()->make(Full::class);
            $report->generate($this->project, $tmpFiles);

            $this->sendReportMail('full', $report->basename(), 'xlsx');

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
    private function query($id)
    {
        return DB::table('annotation_labels')
            ->join('labels', 'annotation_labels.label_id', '=', 'labels.id')
            ->join('annotations', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->join('shapes', 'annotations.shape_id', '=', 'shapes.id')
            ->select(
                'annotation_labels.id', // required for chunkById
                'images.filename',
                'annotations.id as annotation_id',
                'labels.name as label_name',
                'shapes.name as shape_name',
                'annotations.points'
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
