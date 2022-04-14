<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects\VideoAnnotations;

use Biigle\Modules\Reports\Support\File;
use Biigle\Modules\Reports\Support\Reports\Projects\ProjectVideoReportGenerator;
use Biigle\Modules\Reports\Support\Reports\Volumes\VideoAnnotations\CsvReportGenerator as ReportGenerator;

class CsvReportGenerator extends ProjectVideoReportGenerator
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
    public $name = 'CSV video annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'csv_video_annotation_report';

    /**
     * Get the report name.
     *
     * @return string
     */
    public function getName()
    {
        $restrictions = [];

        if ($this->isRestrictedToNewestLabel()) {
            $restrictions[] = 'newest label for each video annotation';
        }

        if (!empty($restrictions)) {
            $suffix = implode(' and ', $restrictions);

            return "{$this->name} (restricted to {$suffix})";
        }

        return $this->name;
    }

    /**
     * Get the filename.
     *
     * @return string
     */
    public function getFilename()
    {
        $restrictions = [];

        if ($this->isRestrictedToNewestLabel()) {
            $restrictions[] = 'newest_label';
        }

        if (!empty($restrictions)) {
            $suffix = implode('_', $restrictions);

            return "{$this->filename}_restricted_to_{$suffix}";
        }

        return $this->filename;
    }

    /**
     * Determines if this report should take only the newest label for each annotation.
     *
     * @return bool
     */
    protected function isRestrictedToNewestLabel()
    {
        return $this->options->get('newestLabel', false);
    }
}
