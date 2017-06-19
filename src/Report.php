<?php

namespace Biigle\Modules\Export;

use File;
use Exception;
use ReflectionClass;
use Illuminate\Database\Eloquent\Model;
use Biigle\Modules\Export\Support\Reports\ReportGenerator;

class Report extends Model
{
    /**
     * The report generator for this report.
     *
     * @var ReportGenerator
     */
    protected $reportGenerator;

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'user_id' => 'int',
        'type_id' => 'int',
        'source_id' => 'int',
        'options' => 'array',
    ];

    /**
     * The user that requested the report.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(\Biigle\User::class);
    }

    /**
     * Type of the report
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function type()
    {
        return $this->belongsTo(ReportType::class);
    }

    /**
     * Source of the report (\Biigle\Volume or \Biigle\Project)
     *
     * @return \Illuminate\Database\Eloquent\Relations\MorphTo
     */
    public function source()
    {
        return $this->morphTo();
    }

    /**
     * Get the source name dynamically if the source still exists.
     *
     * @return string
     */
    public function getSourceNameAttribute()
    {
        if (is_null($this->source)) {
            return $this->attributes['source_name'];
        }

        return $this->source->name;
    }

    /**
     * Set the report generator for this model.
     *
     * @param ReportGenerator $generator
     */
    public function setReportGenerator(ReportGenerator $generator)
    {
        $this->reportGenerator = $generator;
    }

    /**
     * Get the report generator for this report;
     *
     * @return ReportGenerator
     */
    public function getReportGenerator()
    {
        if (!$this->reportGenerator) {
            $this->reportGenerator = ReportGenerator::get($this->source_type, $this->type, $this->options);
        }

        return $this->reportGenerator;
    }

    /**
     * Generate the report file for this report.
     */
    public function generate()
    {
        $this->getReportGenerator()->generate($this->source, $this->getPath());
    }

    /**
     * Get the path to the report file.
     *
     * @return string
     */
    public function getPath()
    {
        return config('export.reports_storage').'/'.$this->id;
    }

    /**
     * Get the subject for this report.
     *
     * @return string
     */
    public function getSubjectAttribute()
    {
        $reflect = new ReflectionClass($this->source_type);

        return strtolower($reflect->getShortName()).' '.$this->source_name;
    }

    /**
     * Get the name for this report.
     *
     * @return string
     */
    public function getNameAttribute()
    {
        return $this->getReportGenerator()->getName();
    }

    /**
     * Get the filename for this report.
     *
     * @return string
     */
    public function getFilenameAttribute()
    {
        return $this->source_id.'_'.$this->getReportGenerator()->getFilename();
    }

    /**
     * Get the URL to download the report.
     *
     * @return string
     */
    public function getUrl()
    {
        return route('show-reports', $this->id);
    }
}
