<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

use Dias\Annotation;

class AnnotationController extends Controller {

	private $auth;

	public function __construct(Guard $auth)
	{
		$this->middleware('auth.api');
		$this->auth = $auth;
	}

	/**
	 * Display the annotation if the user has permission.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function show($id)
	{
		$annotation = Annotation::with('labels', 'points')->find($id);
		if (!$annotation)
		{
			abort(404);
		}

		// call fresh so the transect and image doesn't appear in the output
		// (they will be fetched for projectIds())
		$projectIds = $annotation->fresh()->projectIds();
		if (!$this->auth->user()->canSeeOneOfProjects($projectIds))
		{
			abort(401);
		}

		return $annotation;
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
	 * Remove the annotation if the user has permission.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function destroy($id)
	{
		$annotation = Annotation::find($id);
		if (!$annotation)
		{
			abort(404);
		}

		$projectIds = $annotation->projectIds();
		if (!$this->auth->user()->canEditInOneOfProjects($projectIds))
		{
			abort(401);
		}

		$annotation->delete();
		return response('Deleted.', 200);
	}

}
