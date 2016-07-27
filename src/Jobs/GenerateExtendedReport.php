<?php

namespace Dias\Modules\Export\Jobs;

use DB;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Extended;

class GenerateExtendedReport extends GenerateReportJob
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
                            $row->name,
                            $row->count,
                        ]);
                    }
                }, 'images.id');

                $csv->close();
            }

            $report = app()->make(Extended::class);
            $report->generate($this->project, $tmpFiles);

            $this->sendReportMail('extended', $report->basename(), 'xlsx');

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
        return DB::table('images')
            ->join('annotations', 'annotations.image_id', '=', 'images.id')
            ->join('annotation_labels', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('labels', 'annotation_labels.label_id', '=', 'labels.id')
            // images.id is required for chunkById
            ->select(DB::raw('images.id, images.filename, labels.name, count(labels.id) as count'))
            ->groupBy('labels.id', 'images.id')
            ->where('images.transect_id', $id)
            ->when($this->restricted, function ($query) use ($id) {
                return $query->whereNotIn('annotations.id', $this->getSkipIds($id));
            })
            // order by is essential for chunking!
            ->orderBy('images.id')
            ->orderBy('labels.id');
    }
}
