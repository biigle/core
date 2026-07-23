<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Pgvector\Laravel\Vector;

#[Fillable(['id', 'annotation_id', 'label_id', 'label_tree_id', 'volume_id', 'vector'])]
#[WithoutTimestamps]
class ImageAnnotationLabelFeatureVector extends Model
{
    use HasFactory;

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'vector' => Vector::class,
    ];
}
