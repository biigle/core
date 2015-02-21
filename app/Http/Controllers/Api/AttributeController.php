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
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
		return Attribute::all();
	}

	/**
	 * Shows the specified attribute.
	 *
	 * @param int $id attribute id
	 * @return \Illuminate\Http\Response
	 */
	public function show($id)
	{
		return $this->requireNotNull(Attribute::find($id));
	}

	/**
	 * Creates a new attribute.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store()
	{
		$this->requireArguments('name', 'type');

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
