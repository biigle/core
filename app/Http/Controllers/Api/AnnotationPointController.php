<?php namespace Dias\Http\Controllers\Api;

use Dias\Annotation;
use Dias\AnnotationPoint;

class AnnotationPointController extends Controller {

	/**
	 * Creates a new point for the specified annotation.
	 *
	 * @param int $id Annotation ID
	 * @return \Illuminate\Http\Response
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

		// get the annotation anew to return with labels and points
		return Annotation::with('labels', 'points')->find($id);
	}

	/**
	 * Removes the specified annotation point.
	 *
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function destroy($id)
	{
		$point = $this->requireNotNull(AnnotationPoint::find($id));

		$this->requireCanEdit($point);

		$point->delete();
		return response('Deleted.', 200);
	}
}
