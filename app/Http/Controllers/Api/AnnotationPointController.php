<?php namespace Dias\Http\Controllers\Api;

use Dias\Annotation;

class AnnotationPointController extends Controller {

	/**
	 * Creates a new point for the specified annotation.
	 *
	 * @param int $id Annotation ID
	 * @return Annotation
	 */
	public function store($id)
	{
		$this->requireArguments('x', 'y');

		$annotation = $this->requireNotNull(Annotation::find($id));

		$this->requireCanEdit($annotation);

		$annotation->addPoint(
			$this->request->input('x'),
			$this->request->input('y')
		);

		return AnnotationController::find($id);
	}

	/**
	 * Removes the specified annotation point.
	 *
	 * @param  int  $annotationId
	 * @param int $pointId
	 * @return Annotation
	 */
	public function destroy($annotationId, $pointId)
	{
		$annotation = $this->requireNotNull(Annotation::find($annotationId));
		$this->requireCanEdit($annotation);

		$point = $this->requireNotNull($annotation->points()->find($pointId));

		$point->delete();
		return AnnotationController::find($annotationId);
	}
}
