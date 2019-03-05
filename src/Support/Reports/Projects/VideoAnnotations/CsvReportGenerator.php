<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects\VideoAnnotations;

use Biigle\Modules\Videos\Video;
use Biigle\Modules\Reports\Support\File;
use Biigle\Modules\Reports\Support\Reports\Videos\VideoAnnotations\CsvReportGenerator as ReportGenerator;
use Biigle\Modules\Reports\Support\Reports\Projects\ProjectReportGenerator;

class CsvReportGenerator extends ProjectReportGenerator
{
    /**
     * The class of the video report to use for this project report.
     *
     * @var string
     */
    protected $reportClass = ReportGenerator::class;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'CSV video annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'csv_video_annotation_report';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $filesForZip = [];
        logger($this->source->id);

        foreach (Video::where('project_id', $this->source->id)->get() as $video) {
            $report = $this->getReportGenerator();
            $file = File::makeTmp();
            $report->generate($video, $file->getPath());
            // The individual video reports should be deleted again after
            // the ZIP of this report was created.
            $this->tmpFiles[] = $file;
            $filesForZip[$file->getPath()] = $video->id.'_'.$report->getFullFilename();
        }


        $this->makeZip($filesForZip, $path);
    }
}
