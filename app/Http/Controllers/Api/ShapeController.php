<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\Controller;
use Dias\Shape;

class ShapeController extends Controller {

	public function __construct()
	{
		$this->middleware('auth.api');
	}

	/**
	 * Schows all roles.
	 *
	 * @return Response
	 */
	public function index()
	{
		return Shape::all();
	}

	/**
	 * Displays the specified role.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function show($id)
	{
		return Shape::find($id);
	}
}
