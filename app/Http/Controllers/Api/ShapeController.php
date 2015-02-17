<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\ApiController;
use Dias\Shape;

class ShapeController extends ApiController {

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
	 * @return \Illuminate\Http\Response
	 */
	public function show($id)
	{
		return Shape::find($id);
	}
}
