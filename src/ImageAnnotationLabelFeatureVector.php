<?php

namespace Biigle\Modules\Largo;

use Biigle\Modules\Largo\Database\Factories\ImageAnnotationLabelFeatureVectorFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Pgvector\Laravel\Vector;

class ImageAnnotationLabelFeatureVector extends Model
{
    use HasFactory;

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'vector' => Vector::class,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'id',
        'annotation_id',
        'label_id',
        'label_tree_id',
        'volume_id',
        'vector',
    ];

    /**
     * Create a new factory instance for the model.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    protected static function newFactory()
    {
        return ImageAnnotationLabelFeatureVectorFactory::new();
    }
}
