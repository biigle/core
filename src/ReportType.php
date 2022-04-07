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
        'imageAnnotationsArea' => 'ImageAnnotations\Area',
        'imageAnnotationsBasic' => 'ImageAnnotations\Basic',
        'imageAnnotationsCsv' => 'ImageAnnotations\Csv',
        'imageAnnotationsExtended' => 'ImageAnnotations\Extended',
        'imageAnnotationsFull' => 'ImageAnnotations\Full',
        'imageAnnotationsAbundance' => 'ImageAnnotations\Abundance',
        'imageAnnotationsImageLocation' => 'ImageAnnotations\ImageLocation',
        'imageAnnotationsAnnotationLocation' => 'ImageAnnotations\AnnotationLocation',
        'imageLabelsBasic' => 'ImageLabels\Basic',
        'imageLabelsCsv' => 'ImageLabels\Csv',
        'imageLabelsImageLocation' => 'ImageLabels\ImageLocation',
        'videoAnnotationsCsv' => 'VideoAnnotations\Csv',
        'videoLabelsCsv' => 'VideoLabels\Csv',
        'imageIfdo' => 'Ifdo\ImageIfdo',
        'videoIfdo' => 'Ifdo\VideoIfdo',
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
