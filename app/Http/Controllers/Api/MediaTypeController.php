<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\Controller;
use Dias\MediaType;

class MediaTypeController extends Controller {

	public function __construct()
	{
		$this->middleware('auth.api');
	}

	/**
	 * Shows all media types.
	 *
	 * @return Response
	 */
	public function index()
	{
		return MediaType::all();
	}

	/**
	 * Displays the specified media type.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function show($id)
	{
		return MediaType::find($id);
	}
}
