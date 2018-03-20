<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Model;

/**
 * Annotations on an image can have multiple labels. A label is e.g. the
 * type of the object visible in the region of the annotation. So if
 * you put a circle annotation around a rock, you would label the annotation
 * with `rock`.
 *
 * Labels can be ordered in a tree-like structure.
 */
class Label extends Model
{
    /**
     * Validation rules for creating a new label.
     *
     * @var array
     */
    public static $createRules = [
        'name' => 'required',
        'color' => 'required|string|regex:/^\#?[A-Fa-f0-9]{6}$/',
        'parent_id' => 'integer|exists:labels,id',
        'label_source_id' => 'integer|exists:label_sources,id',
        'source_id' => 'required_with:label_source_id|filled',
    ];

    /**
     * Validation rules for updating a label.
     *
     * @var array
     */
    public static $updateRules = [
        'name' => 'filled',
        'color' => 'filled|string|regex:/^\#?[A-Fa-f0-9]{6}$/',
        'parent_id' => 'filled|integer|exists:labels,id',
    ];

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
        $this->attributes['color'] = ($value[0] === '#') ? substr($value, 1) : $value;
    }

    /**
     * Determines if the label is used anywhere (e.g. attached to an annotation).
     *
     * @return bool
     */
    public function isUsed()
    {
        return AnnotationLabel::where('label_id', $this->id)->exists()
            || ImageLabel::where('label_id', $this->id)->exists();
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
