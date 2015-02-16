<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

use Dias\Annotation;
use Dias\AnnotationPoint;

class AnnotationPointController extends Controller {

	/**
	 * The authenticator.
	 * 
	 * @var \Illuminate\Contracts\Auth\Guard
	 */
	private $auth;

	public function __construct(Guard $auth)
	{
		$this->auth = $auth;
	}

	/**
	 * Creates a new point for the specifies annotation.
	 *
	 * @param int $annotationId
	 * @param  Illuminate\Http\Request $request
	 * @return Response
	 */
	public function store($annotationId, Request $request)
	{
		if (!$request->has('x', 'y'))
		{
			abort(400, 'Bad arguments.');
		}

		$annotation = Annotation::find($annotationId);
		if (!$annotation)
		{
			abort(404);
		}

		$projectIds = $annotation->projectIds();
		if (!$this->auth->user()->canEditInOneOfProjects($projectIds))
		{
			abort(401);
		}

		return $annotation->addPoint($request->input('x'), $request->input('y'));
	}

	/**
	 * Removes the specified annotation point.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function destroy($id)
	{
		$point = AnnotationPoint::find($id);
		if (!$point)
		{
			abort(404);
		}

		$projectIds = $point->projectIds();
		if (!$this->auth->user()->canEditInOneOfProjects($projectIds))
		{
			abort(401);
		}

		$point->delete();
		return response('Deleted.', 200);
	}
}
