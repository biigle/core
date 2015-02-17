<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\ApiController;
use Illuminate\Http\Request;

use Dias\Annotation;
use Dias\AnnotationPoint;

class AnnotationPointController extends ApiController {

	/**
	 * Creates a new point for the specifies annotation.
	 *
	 * @param int $id Annotation ID
	 * @param  Request $request
	 * @return \Illuminate\Http\Response
	 */
	public function store($id, Request $request)
	{
		if (!$request->has('x', 'y'))
		{
			abort(400, 'Bad arguments.');
		}

		$annotation = AnnotationController::findOrAbort($id);

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
	 * @return \Illuminate\Http\Response
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
