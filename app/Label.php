<?php

namespace Biigle;

use DB;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Annotations on an image can have multiple labels. A label is e.g. the
 * type of the object visible in the region of the annotation. So if
 * you put a circle annotation around a rock, you would label the annotation
 * with `rock`.
 *
 * Labels can be ordered in a tree-like structure.
 *
 * @property string $uuid
 */
class Label extends Model
{
    use HasFactory;

    /**
     * The attributes hidden from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'uuid',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'parent_id' => 'int',
        'label_tree_id' => 'int',
        'label_source_id' => 'int',
    ];

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Scope a query to used labels.
     *
     * @param \Illuminate\Database\Query\Builder $query
     *
     * @return \Illuminate\Database\Query\Builder
     */
    public function scopeUsed($query)
    {
        return $query->where(function ($query) {
            return $query
                ->whereExists(function ($query) {
                    return $query->select(DB::raw(1))
                        ->from('image_annotation_labels')
                        ->whereRaw('labels.id = image_annotation_labels.label_id');
                })
                ->orWhereExists(function ($query) {
                    return $query->select(DB::raw(1))
                        ->from('image_labels')
                        ->whereRaw('labels.id = image_labels.label_id');
                })
                ->orWhereExists(function ($query) {
                    return $query->select(DB::raw(1))
                        ->from('video_annotation_labels')
                        ->whereRaw('labels.id = video_annotation_labels.label_id');
                })
                ->orWhereExists(function ($query) {
                    return $query->select(DB::raw(1))
                        ->from('video_labels')
                        ->whereRaw('labels.id = video_labels.label_id');
                });
        });
    }

    /**
     * The parent label if the labels are ordered in a tree-like structure.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function parent()
    {
        return $this->belongsTo(self::class);
    }

    /**
     * The label tree this label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function tree()
    {
        return $this->belongsTo(LabelTree::class, 'label_tree_id');
    }

    /**
     * The child labels of this label if they are ordered in a tree-like
     * structue.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /**
     * Remove the optional '#' from a hexadecimal color.
     *
     * @param string $value The color
     */
    public function setColorAttribute($value)
    {
        if (is_string($value) && $value[0] === '#') {
            $value = substr($value, 1);
        }

        $this->attributes['color'] = $value;
    }

    /**
     * Determines if the label is used anywhere (e.g. attached to an annotation).
     *
     * @return bool
     */
    public function isUsed()
    {
        return static::used()->where('id', $this->id)->exists();
    }

    /**
     * Determines if the label can be deleted.
     *
     * A label can be deleted if it doesn't have any child labels and if it is not used
     * anywhere (e.g. attached to an annotation).
     *
     * @return bool
     */
    public function canBeDeleted()
    {
        return !self::where('parent_id', $this->id)->exists() && !$this->isUsed();
    }
}
