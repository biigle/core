<?php namespace Dias\Model;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;

use Dias\Attribute;

/**
 * A model that can belong to an attribute.
 */
abstract class ModelWithAttributes extends Model {

	/**
	 * The attributes of this model.
	 * 
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function attributes()
	{
		return $this->belongsToMany('Dias\Attribute')
			->withPivot(
				'value_int as value_int',
				'value_double as value_double',
				'value_string as value_string'
			);
	}

	/**
	 * Attaches an attribute to the model.
	 * 
	 * @param String $name attribute name
	 * @param mixed $value Attribute value (numeric, String or boolean)
	 * @return void
	 */
	public function attachDiasAttribute($name, $value)
	{
		$attr = Attribute::whereName($name)->firstOrFail();
		$pivot = array();

		switch ($attr->type)
		{
			case "integer":
				$pivot['value_int'] = $value;
				break;
			case "double":
				$pivot['value_double'] = $value;
				break;
			case "string":
				$pivot['value_string'] = $value;
				break;
		}

		try
		{
			$this->attributes()->attach($attr->id, $pivot);
		}
		catch (QueryException $e)
		{
			abort(400, 'The model already has the attribute "'.$name.'"!');
		}
	}

	/**
	 * Returns a \Dias\Attribute of this model.
	 * Not called `getAttribute` because every Eloquent model already has this
	 * function!
	 * 
	 * @param String $name attribute name
	 * @return \Dias\Attribute
	 */
	public function getDiasAttribute($name)
	{
		return $this->attributes()->whereName($name)->first();
	}

	/**
	 * Detaches a \Dias\Attribute from this model.
	 * 
	 * @param String $name attribute name
	 * @return void
	 */
	public function detachDiasAttribute($name)
	{
		$attribute = $this->getDiasAttribute($name);
		$this->attributes()->detach($attribute->id);
	}
}
