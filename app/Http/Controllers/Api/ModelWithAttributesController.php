<?php namespace Dias\Http\Controllers\Api;

use Dias\Contracts\BelongsToProjectContract;

abstract class ModelWithAttributesController extends Controller {

	/**
	 * Returns the ModelWithAttributes with the specified ID.
	 * 
	 * @param int $id ModelWithAttributes ID
	 * @return \Dias\Model\ModelWithAttributes
	 */
	abstract protected function getModel($id);
	
	/**
	 * Shows all attributes of the specified model
	 * 
	 * @apiDefine indexAttributes
	 * @apiParam {Number} id The model ID.
	 * @apiSuccessExample {json} Success response:
	 * [
	 *    {
	 *       "id": 2,
	 *       "name": "test",
	 *       "type": "integer",
	 *       "value_int": 1,
	 *       "value_double": null,
	 *       "value_string": null
	 *    }
	 * ]
	 *
	 * @param int $id ModelWithAttributes ID
	 * @return \Illuminate\Http\Response
	 */
	public function index($id)
	{
		$model = $this->requireNotNull($this->getModel($id));
		if ($model instanceof BelongsToProjectContract)
		{
			$this->requireCanSee($model);
		}
		return $model->attributes;
	}

	/**
	 * Displays an attribute of the model.
	 *
	 * @apiDefine showAttributes
	 * @apiParam {Number} id The annotation ID.
	 * @apiParam {String} name The attribute name.
	 * @apiSuccessExample {json} Success response:
	 * {
	 *     "id": 2,
	 *     "name": "test",
	 *     "type": "integer",
	 *     "value_int": 1,
	 *     "value_double": null,
	 *     "value_string": null
	 * }
	 * 
	 * @param int $modelId ID of the model
	 * @param  String  $name name of the attribute
	 * @return Annotation
	 */
	public function show($modelId, $name)
	{
		$model = $this->requireNotNull($this->getModel($modelId));
		if ($model instanceof BelongsToProjectContract)
		{
			$this->requireCanSee($model);
		}
		return $model->attributes()->whereName($name)->first();
	}
}
