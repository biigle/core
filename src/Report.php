<?php

namespace Biigle\Modules\Export;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
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

    //TODO implement generate() function that gets the correct ReportGenerator and performs its generate($path) function with the correct path for this report.
    // Make sure the directory to put the file to exists!
}
