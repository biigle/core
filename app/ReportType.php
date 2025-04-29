<?php

namespace Biigle;

use Biigle\Traits\HasConstantInstances;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static ReportType imageAnnotationsAbundance()
 * @method static int imageAnnotationsAbundanceId()
 * @method static ReportType imageAnnotationsAnnotationLocation()
 * @method static int imageAnnotationsAnnotationLocationId()
 * @method static ReportType imageAnnotationsArea()
 * @method static int imageAnnotationsAreaId()
 * @method static ReportType imageAnnotationsBasic()
 * @method static int imageAnnotationsBasicId()
 * @method static ReportType imageAnnotationsCsv()
 * @method static int imageAnnotationsCsvId()
 * @method static ReportType imageAnnotationsExtended()
 * @method static int imageAnnotationsExtendedId()
 * @method static ReportType imageAnnotationsCoco()
 * @method static int imageAnnotationsCocoId()
 * @method static ReportType imageAnnotationsFull()
 * @method static int imageAnnotationsFullId()
 * @method static ReportType imageAnnotationsImageLocation()
 * @method static int imageAnnotationsImageLocationId()
 * @method static ReportType imageIfdo()
 * @method static int imageIfdoId()
 * @method static ReportType imageLabelsBasic()
 * @method static int imageLabelsBasicId()
 * @method static ReportType imageLabelsCsv()
 * @method static int imageLabelsCsvId()
 * @method static ReportType imageLabelsImageLocation()
 * @method static int imageLabelsImageLocationId()
 * @method static ReportType videoAnnotationsCsv()
 * @method static int videoAnnotationsCsvId()
 * @method static ReportType videoIfdo()
 * @method static int videoIfdoId()
 * @method static ReportType videoLabelsCsv()
 * @method static int videoLabelsCsvId()
 */
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
}
