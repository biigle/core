<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\ApiController;
use Dias\MediaType;

class MediaTypeController extends ApiController {

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
