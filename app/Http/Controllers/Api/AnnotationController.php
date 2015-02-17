<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\ApiController;
use Illuminate\Http\Request;

use Dias\Annotation;

class AnnotationController extends ApiController {

	/**
	 * Finds the requested annotation or aborts with 404 if it doesn't exist.
	 * 
	 * @param int $id Annotation ID
	 * @return Dias\Annotation
	 */
	public static function findOrAbort($id)
	{
		$annotation = Annotation::find($id);
		if (!$annotation)
		{
			abort(404);
		}

		return $annotation;
	}

	/**
	 * Displays the annotation.
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
	 * Removes the annotation.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function destroy($id)
	{
		$annotation = self::findOrAbort($id);

		$projectIds = $annotation->projectIds();
		if (!$this->auth->user()->canEditInOneOfProjects($projectIds))
		{
			abort(401);
		}

		$annotation->delete();
		return response('Deleted.', 200);
	}

}
