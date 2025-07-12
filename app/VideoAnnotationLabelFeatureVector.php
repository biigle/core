<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Pgvector\Laravel\Vector;

class VideoAnnotationLabelFeatureVector extends Model
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
     * @var array<string, string>
     */
    protected $casts = [
        'vector' => Vector::class,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
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
     * The label that this feature vector belongs to.
     */
    public function label()
    {
        return $this->belongsTo(Label::class);
    }

    /**
     * The annotation that this feature vector belongs to.
     */
    public function annotation()
    {
        return $this->belongsTo(VideoAnnotation::class, 'annotation_id');
    }

    /**
     * The volume that this feature vector belongs to.
     */
    public function volume()
    {
        return $this->belongsTo(Volume::class);
    }
}
