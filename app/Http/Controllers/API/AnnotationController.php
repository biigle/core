<?php namespace Dias\Http\Controllers\API;

use Dias\Http\Requests;
use Dias\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\Guard;

use Dias\Annotation;

class AnnotationController extends Controller {

	public function __construct()
	{
		$this->middleware('auth.api');
	}

	/**
	 * Display a listing of the resource.
	 *
	 * @param Illuminate\Contracts\Auth\Guard $auth
	 * @return Response
	 */
	public function index(Guard $auth)
	{
		return $auth->user()->annotations()->get();
	}

	/**
	 * Store a newly created resource in storage.
	 *
	 * @return Response
	 */
	public function store()
	{
		//
	}

	/**
	 * Display the specified resource.
	 *
	 * @param  int  $id
	 * @param Illuminate\Contracts\Auth\Guard $auth
	 * @return Response
	 */
	public function show($id, Guard $auth)
	{
		// check if user is allowed to see this
		if ($auth->user()->annotations()->find($id) !== null)
		{
			// do separate query so no user related data is displayed in the json
			// response
			return Annotation::with('labels', 'points')->find($id);
		}

		return response('Unauthorized.', 401);
	}

	/**
	 * Update the specified resource in storage.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function update($id)
	{
		//
	}

	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function destroy($id)
	{
		//
	}

}
