<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Pgvector\Laravel\Vector;

#[Fillable(['id', 'annotation_id', 'label_id', 'label_tree_id', 'volume_id', 'vector'])]
#[WithoutTimestamps]
class VideoAnnotationLabelFeatureVector extends Model
{
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'vector' => Vector::class,
        ];
    }
}
