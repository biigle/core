<?php

namespace Dias\Http\Controllers\Api;

use Dias\Contracts\BelongsToProjectContract;
use Dias\Attribute;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

abstract class ModelWithAttributesController extends Controller
{
    /**
     * Creates a new ModelWithAttributesController instance.
     * This constructor allows child controllers to define own middleware.
     *
     * @param Request $request
     */
    public function __construct(Request $request)
    {
        parent::__construct($request);
    }

    /**
     * Returns the ModelWithAttributes with the specified ID.
     *
     * @param int $id ModelWithAttributes ID
     * @return \Dias\Model\ModelWithAttributes
     */
    abstract protected function getModel($id);

    /**
     * Shows all attributes of the specified model.
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
        if ($model instanceof BelongsToProjectContract) {
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
        if ($model instanceof BelongsToProjectContract) {
            $this->requireCanSee($model);
        }

        return $this->requireNotNull($model->getDiasAttribute($name));
    }

    /**
     * Attaches a new attribute to the specified model.
     *
     * @apiDefine storeAttributes
     * @apiParam {Number} id The model ID.
     * @apiParam (Required arguments) {String} name The attribute name.
     * @apiParam (Required arguments) {Mixed} value The attribute value, either `Integer`, `Double`, `String` or `Boolean`, depending on the type of the attribute.
     * @apiParamExample {String} Request example:
     * name: my-test-attribute
     * value: 123
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 4,
     *    "name": "my-test-attribute",
     *    "type": "integer",
     *    "value_int": 123,
     *    "value_double": null,
     *    "value_string": null
     * }
     *
     * @param int $id Model ID
     * @return \Illuminate\Http\Response
     */
    public function store($id)
    {
        $this->validate($this->request, Attribute::$attachRules);
        $model = $this->requireNotNull($this->getModel($id));
        if ($model instanceof BelongsToProjectContract) {
            $this->requireCanEdit($model);
        }

        if ($model instanceof \Dias\Project) {
            $this->requireCanAdmin($model);
        }

        $model->attachDiasAttribute(
            $this->request->input('name'),
            $this->request->input('value')
        );

        return response($model->getDiasAttribute($this->request->input('name')), 201);
    }

    /**
     * Updates an attribute of the specified model.
     *
     * @apiDefine updateAttributes
     * @apiParam {Number} id The model ID.
     * @apiParam {String} name The attribute name.
     * @apiParam (Required arguments) {Mixed} value The attribute value, either `Integer`, `Double`, `String` or `Boolean`, depending on the type of the attribute.
     * @apiParamExample {String} Request example:
     * name: my-test-attribute
     * value: 123
     *
     * @param int $id Model ID
     * @param String $name Attribute name
     * @return \Illuminate\Http\Response
     */
    public function update($id, $name)
    {
        $this->validate($this->request, Attribute::$updateRules);
        $model = $this->requireNotNull($this->getModel($id));

        if ($model instanceof BelongsToProjectContract) {
            $this->requireCanEdit($model);
        }

        if ($model instanceof \Dias\Project) {
            $this->requireCanAdmin($model);
        }

        $model->updateDiasAttribute($name, $this->request->input('value'));
    }

    /**
     * Detaches an attribute from the specified model.
     *
     * @apiDefine destroyAttributes
     * @apiParam {Number} id The model ID.
     * @apiParam {String} name The attribute name.
     *
     * @param int $id Model ID
     * @param String $name Attribute name
     * @return \Illuminate\Http\Response
     */
    public function destroy($id, $name)
    {
        $model = $this->requireNotNull($this->getModel($id));

        if ($model instanceof BelongsToProjectContract) {
            $this->requireCanEdit($model);
        }

        if ($model instanceof \Dias\Project) {
            $this->requireCanAdmin($model);
        }

        $model->detachDiasAttribute($name);
    }
}
