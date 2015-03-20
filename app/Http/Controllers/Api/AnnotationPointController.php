<?php namespace Dias\Http\Controllers\Api;

use Dias\Annotation;

class AnnotationPointController extends Controller {

	/**
	 * Shows all points of the specified annotation
	 *
	 * @param int $id Annotation ID
	 * @return \Illuminate\Http\Response
	 */
	public function index($id)
	{
		$annotation = $this->requireNotNull(Annotation::find($id));
		$this->requireCanSee($annotation);
		return $annotation->points;
	}

	/**
	 * Creates a new point for the specified annotation.
	 *
	 * @param int $id Annotation ID
	 * @return \Dias\AnnotationPoint
	 */
	public function store($id)
	{
		$this->validate($this->request, Annotation::$createPointRules);

		$annotation = $this->requireNotNull(Annotation::find($id));

		$this->requireCanEdit($annotation);

		return $annotation->addPoint(
			$this->request->input('x'),
			$this->request->input('y')
		);
	}

	/**
	 * Updates the attributes of the specified point belonging to the specified
	 * annotation.
	 *
	 * @param int  $annotationId
	 * @param int $pointId
	 */
	public function update($annotationId, $pointId)
	{
		$annotation = $this->requireNotNull(Annotation::find($annotationId));

		$this->requireCanEdit($annotation);

		$point = $this->requireNotNull($annotation->points()->find($pointId));

		$point->x = $this->request->input('x', $point->x);
		$point->y = $this->request->input('y', $point->y);
		$point->save();
	}

	/**
	 * Removes the specified annotation point.
	 *
	 * @param  int  $annotationId
	 * @param int $pointId
	 * @return \Illuminate\Http\Response
	 */
	public function destroy($annotationId, $pointId)
	{
		$annotation = $this->requireNotNull(Annotation::find($annotationId));
		$this->requireCanEdit($annotation);

		$point = $this->requireNotNull($annotation->points()->find($pointId));

		$point->delete();
		return response('Deleted.', 200);
	}
}
