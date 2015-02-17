<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\ApiController;
use Illuminate\Http\Request;

use Dias\Annotation;

class AnnotationLabelController extends ApiController {

	/**
	 * Creates a new label for the specifies annotation.
	 *
	 * @param int $id Annotation ID
	 * @param  Illuminate\Http\Request $request
	 * @return Response
	 */
	public function store($id, Request $request)
	{
		if (!$request->has('label_id', 'confidence'))
		{
			abort(400, 'Bad arguments.');
		}

		$annotation = AnnotationController::findOrAbort($id);

		$projectIds = $annotation->projectIds();
		if (!$this->auth->user()->canEditInOneOfProjects($projectIds))
		{
			abort(401);
		}

		$annotation->addLabel(
			$request->input('label_id'),
			$request->input('confidence'),
			$this->auth->user()
		);

		return response('Created.', 201);
	}
	
	/**
	 * Updates the attributes of the specified label attached by the requesting
	 * user to the specified annotation.
	 *
	 * @param int  $annotationId
	 * @param int $labelId
	 * @param Illuminate\Http\Request $request
	 * @return Response
	 */
	public function update($annotationId, $labelId, Request $request)
	{
		$annotation = AnnotationController::findOrAbort($annotationId);
		$user = $this->auth->user();

		$projectIds = $annotation->projectIds();
		if (!$user->canEditInOneOfProjects($projectIds))
		{
			abort(401);
		}

		$label = $annotation->labels()
			->whereUserId($user->id)
			->find($labelId);

		if (!$label)
		{
			abort(404);
		}

		$annotation->labels()->updateExistingPivot($label->id, array(
			'confidence' => $request->input('confidence', $label->confidence)
		));
	}
}
