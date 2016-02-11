<?php

namespace Dias;

use Dias\Model\ModelWithAttributes;

/**
 * Annotations on an image can have multiple labels. A label is e.g. the
 * type of the object visible in the region of the annotation. So if
 * you put a circle annotation around a rock, you would label the annotation
 * with `rock`.
 *
 * Labels can be ordered in a tree-like structure.
 */
class Label extends ModelWithAttributes
{
    /**
     * Validation rules for creating a new label.
     *
     * @var array
     */
    public static $createRules = [
        'name' => 'required',
        'parent_id' => 'integer|exists:labels,id',
        'aphia_id' => 'integer',
        'project_id' => 'integer|exists:projects,id',
        'color' => 'required|string|regex:/^\#?[A-Fa-f0-9]{6}$/',
    ];

    /**
     * Validation rules for updating a label.
     *
     * @var array
     */
    public static $updateRules = [
        'parent_id' => 'integer|exists:labels,id',
        'aphia_id' => 'integer',
        'color' => 'string|regex:/^\#?[A-Fa-f0-9]{6}$/',
    ];

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        // hide pivot table in annotation show output
        'pivot',
    ];

    /**
     * The parent label if the labels are ordered in a tree-like structure.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function parent()
    {
        return $this->belongsTo('Dias\Label');
    }

    /**
     * The project this label belongs to. If `null`, it is a global label.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function project()
    {
        return $this->belongsTo('Dias\Project');
    }

    /**
     * The child labels of this label if they are ordered in a tree-like
     * structue.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function children()
    {
        return $this->hasMany('Dias\Label', 'parent_id');
    }

    /**
     * Adds the `hasChildren` attribute to the label model which specifies
     * whether the label has any child labels.
     *
     * @return bool
     */
    public function getHasChildrenAttribute()
    {
        return $this->children()->first() !== null;
    }

    /**
     * Remove the optional '#' from a hexadecimal color
     *
     * @param string $value The color
     */
    public function setColorAttribute($value)
    {
        $this->attributes['color'] = ($value[0] === '#') ? substr($value, 1) : $value;
    }
}
