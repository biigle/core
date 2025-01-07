<?php

namespace Biigle;

use Biigle\Services\Reports\ReportGenerator;
use File;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use ReflectionClass;
use SplFileInfo;
use Storage;

class Report extends Model
{
    use HasFactory;

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
        'ready_at' => 'datetime',
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
     * Type of the report.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function type()
    {
        return $this->belongsTo(ReportType::class);
    }

    /**
     * Source of the report (\Biigle\Volume, \Biigle\Project or
     * \Biigle\Video).
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
        if (is_null($this->source) || is_null($this->source->name)) {
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
     * Get the report generator for this report;.
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
        $path = $this->getReportGenerator()->generate($this->source);
        try {
            Storage::disk(config('reports.storage_disk'))
                ->putFileAs('', new SplFileInfo($path), $this->getStorageFilename());
        } finally {
            File::delete($path);
        }
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
        return $this->source_id.'_'.$this->getReportGenerator()->getFullFilename();
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

    /**
     * Delete the file that belongs to this report.
     */
    public function deleteFile()
    {
        Storage::disk(config('reports.storage_disk'))->delete($this->getStorageFilename());
    }

    /**
     * Get the filename of the report in storage (not the filename for download).
     *
     * @return string
     */
    public function getStorageFilename()
    {
        $extension = $this->getReportGenerator()->extension;

        return $this->id.'.'.$extension;
    }
}
