<?php

namespace Dias\Model;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Dias\Attribute;

/**
 * A model that can belong to an attribute.
 */
abstract class ModelWithAttributes extends Model
{
    /**
     * Determines the pivot table attributes array depending on the DIAS 
     * attribute type.
     * 
     * @param Attribute $attribute The DIAS attribute
     * @param mixed $value The value that should be set in the pivot table 
     * attributes array
     * 
     * @return array
     */
    private function buildPivotAttributes($attribute, $value)
    {
        $pivot = [];

        switch ($attribute->type) {
            case 'integer':
                $pivot['value_int'] = $value;
                break;
            case 'double':
                $pivot['value_double'] = $value;
                break;
            case 'string':
                $pivot['value_string'] = $value;
                break;
        }

        return $pivot;
    }

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
        $pivot = $this->buildPivotAttributes($attr, $value);

        try {
            $this->attributes()->attach($attr->id, $pivot);
        } catch (QueryException $e) {
            abort(400, 'The model already has the attribute "'.$name.'"!');
        }
    }

    /**
     * Returns a \Dias\Attribute of this model. Fails if this model doesn't
     * have the attribute.
     * Not called `getAttribute` because every Eloquent model already has this
     * function!
     * 
     * @param String $name attribute name
     * @return \Dias\Attribute
     */
    public function getDiasAttribute($name)
    {
        return $this->attributes()->whereName($name)->firstOrFail();
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

    /**
     * Updates the value of an existing attribute of this model.
     * 
     * @param String $name Name of the attribute to update
     * @param mixed $value Value of the new attribute (numeric, String or boolean)
     */
    public function updateDiasAttribute($name, $value)
    {
        $attribute = $this->getDiasAttribute($name);

        $pivot = $this->buildPivotAttributes($attribute, $value);

        $this->attributes()->updateExistingPivot($attribute->id, $pivot);
    }
}
