<?php

namespace Biigle\Modules\Reports;

use Biigle\Modules\Reports\Database\Factories\ReportTypeFactory;
use Biigle\Traits\HasConstantInstances;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportType extends Model
{
    use HasConstantInstances, HasFactory;

    /**
     * The constant instances of this model.
     *
     * @var array
     */
    const INSTANCES = [
        'imageAnnotationsAbundance' => 'ImageAnnotations\Abundance',
        'imageAnnotationsAnnotationLocation' => 'ImageAnnotations\AnnotationLocation',
        'imageAnnotationsArea' => 'ImageAnnotations\Area',
        'imageAnnotationsBasic' => 'ImageAnnotations\Basic',
        'imageAnnotationsCsv' => 'ImageAnnotations\Csv',
        'imageAnnotationsExtended' => 'ImageAnnotations\Extended',
        'imageAnnotationsCoco' => 'ImageAnnotations\Coco',
        'imageAnnotationsFull' => 'ImageAnnotations\Full',
        'imageAnnotationsImageLocation' => 'ImageAnnotations\ImageLocation',
        'imageIfdo' => 'ImageIfdo',
        'imageLabelsBasic' => 'ImageLabels\Basic',
        'imageLabelsCsv' => 'ImageLabels\Csv',
        'imageLabelsImageLocation' => 'ImageLabels\ImageLocation',
        'videoAnnotationsCsv' => 'VideoAnnotations\Csv',
        'videoIfdo' => 'VideoIfdo',
        'videoLabelsCsv' => 'VideoLabels\Csv',
    ];

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Create a new factory instance for the model.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    protected static function newFactory()
    {
        return ReportTypeFactory::new();
    }
}
