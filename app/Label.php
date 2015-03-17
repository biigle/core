<?php namespace Dias;

use Dias\Model\ModelWithAttributes;

/**
 * Annotations on an image can have multiple labels. A label is e.g. the
 * type of the object visible in the region of the annotation. So if
 * you put a circle annotation around a rock, you would label the annotation
 * with `rock`.
 * 
 * Labels can be ordered in a tree-like structure.
 */
class Label extends ModelWithAttributes {

	/**
	 * Validation rules for creating a new label
	 * 
	 * @var array
	 */
	public static $createRules = array(
		'name' => 'required',
	);

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	/**
	 * The attributes excluded from the model's JSON form.
	 *
	 * @var array
	 */
	protected $hidden = array(
		// hide pivot table in annotation show output
		'pivot'
	);

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
	 * Adds the `hasParent` attribute to the label model which specifies whether
	 * the label has a parent label.
	 * 
	 * @return boolean
	 */
	public function getHasParentAttribute()
	{
		return $this->parent !== null;
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
	 * @return boolean
	 */
	public function getHasChildrenAttribute()
	{
		return $this->children()->first() !== null;
	}
}
