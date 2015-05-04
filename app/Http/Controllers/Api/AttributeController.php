<?php namespace Dias\Http\Controllers\Api;

use Illuminate\Database\QueryException;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

use Dias\Attribute;

class AttributeController extends Controller {

	/**
	 * Creates a new AttrbuteController instance.
	 * 
	 * @param Guard $auth
	 * @param Request $request
	 */
	public function __construct(Guard $auth, Request $request)
	{
		parent::__construct($auth, $request);
		$this->middleware('admin', ['only' => ['store', 'destroy']]);
	}

	/**
	 * Shows a list of all attributes.
	 * 
	 * @api {get} attributes Get all attributes
	 * @apiGroup Attributes
	 * @apiName IndexAttributes
	 * @apiPermission user
	 * 
	 * @apiSuccessExample {json} Success response:
	 * [
	 *    {
	 *       "id": 1,
	 *       "name": "bad_quality",
	 *       "type": "boolean"
	 *    }
	 * ]
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
		return Attribute::all();
	}

	/**
	 * Shows the specified attribute.
	 * 
	 * @api {get} attributes/:id Get an attribute
	 * @apiGroup Attributes
	 * @apiName ShowAttributes
	 * @apiPermission user
	 * 
	 * @apiParam {Number} id The attribute ID.
	 * @apiSuccessExample {json} Success response:
	 * {
	 *    "id": 1,
	 *    "name": "bad_quality",
	 *    "type": "boolean"
	 * }
	 *
	 * @param int $id attribute id
	 * @return Attributr
	 */
	public function show($id)
	{
		return $this->requireNotNull(Attribute::find($id));
	}

	/**
	 * Creates a new attribute.
	 * 
	 * @api {post} attributes Create a new attribute
	 * @apiGroup Attributes
	 * @apiName StoreAttributes
	 * @apiPermission admin
	 * 
	 * @apiParam (Required arguments) {String} name The name of the new attribute.
	 * @apiParam (Required arguments) {String} type One of `integer`, `double`, `string` or `boolean`.
	 * @apiSuccessExample {json} Success response:
	 * {
	 *    "id": 2,
	 *    "name": "expert",
	 *    "type": "boolean"
	 * }
	 *
	 * @return Attribute
	 */
	public function store()
	{
		$this->validate($this->request, Attribute::$createRules);

		$attribute = new Attribute;
		$attribute->name = $this->request->input('name');
		$attribute->type = $this->request->input('type');

		try {
			$attribute->save();
		} catch (QueryException $e) {
			abort(400, 'Unsupported attribute type!');
		}

		return $attribute;
	}

	/**
	 * Removes the specified attribute.
	 * 
	 * @api {delete} attributes/:id Delete an attribute
	 * @apiGroup Attributes
	 * @apiName DestroyAttributes
	 * @apiPermission admin
	 * @apiDescription If an attribute is still in use, it cannot be deleted.
	 * 
	 * @apiParam {Number} id The attribute ID.
	 *
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function destroy($id)
	{
		$attribute = $this->requireNotNull(Attribute::find($id));

		try {
			$attribute->delete();
		} catch (QueryException $e) {
			abort(400, 'The attribute is still in use and cannot be deleted!');
		}

		return response('Deleted.', 200);
	}
}
