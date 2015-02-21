<?php namespace Dias\Http\Controllers\Api;

use Dias\MediaType;

class MediaTypeController extends Controller {

	/**
	 * Shows all media types.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
		return MediaType::all();
	}

	/**
	 * Displays the specified media type.
	 *
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function show($id)
	{
		return MediaType::find($id);
	}
}
