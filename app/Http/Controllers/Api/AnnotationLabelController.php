<?php namespace Dias\Http\Controllers\Api;

use Dias\Annotation;

class AnnotationLabelController extends Controller {

	/**
	 * Creates a new label for the specifies annotation.
	 *
	 * @param int $id Annotation ID
	 * @return \Illuminate\Http\Response
	 */
	public function store($id)
	{
		$this->requireArguments('label_id', 'confidence');

		$annotation = $this->requireNotNull(Annotation::find($id));

		$this->requireCanEdit($annotation);

		$annotation->addLabel(
			$this->request->input('label_id'),
			$this->request->input('confidence'),
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
	 */
	public function update($annotationId, $labelId)
	{
		$annotation = $this->requireNotNull(Annotation::find($annotationId));
		$user = $this->auth->user();

		$this->requireCanEdit($annotation);

		$label = $this->requireNotNull(
			$annotation->labels()->whereUserId($user->id)->find($labelId)
		);

		$annotation->labels()->updateExistingPivot($label->id, array(
			'confidence' => $this->request->input('confidence', $label->confidence)
		));
	}

	/**
	 * Detaches the specified label of the requesting user from the specified
	 * annotation. Project admins can detach labels of other users, too, if they
	 * provide theit `user_id` as an request argument.
	 *
	 * @param int  $annotationId
	 * @param int $labelId
	 * @return \Illuminate\Http\Response
	 */
	public function destroy($annotationId, $labelId)
	{
		$annotation = $this->requireNotNull(Annotation::find($annotationId));
		$user = $this->auth->user();

		$this->requireCanEdit($annotation);

		$userId = $user->id;

		// a project admin can detach labels of other users as well
		if ($user->canAdminOneOfProjects($annotation->projectIds()))
		{
			$userId = $this->request->input('user_id', $userId);
		}

		// try to detach the label
		if (!$annotation->removeLabel($labelId, $userId))
		{
			abort(404, 'User "'.$user->id.'" doesn\'t have label "'. $labelId.'" attached to annotation "'.$annotationId.'"!');
		}

		return response('Deleted.', 200);
	}
}
