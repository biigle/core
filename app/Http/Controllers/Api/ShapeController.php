<?php namespace Dias\Http\Controllers\Api;

use Dias\Shape;

class ShapeController extends Controller {

	/**
	 * Shows all shapes.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
		return Shape::all();
	}

	/**
	 * Displays the specified shape.
	 *
	 * @param  int  $id
	 * @return Shape
	 */
	public function show($id)
	{
		return Shape::find($id);
	}
}
