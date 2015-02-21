<?php namespace Dias\Http\Controllers\Api;

use Dias\Annotation;
use Dias\AnnotationPoint;

class AnnotationPointController extends Controller {

	/**
	 * Creates a new point for the specifies annotation.
	 *
	 * @param int $id Annotation ID
	 * @return \Illuminate\Http\Response
	 */
	public function store($id)
	{
		$this->requireArguments('x', 'y');

		$annotation = $this->requireNotNull(Annotation::find($id));

		$this->requireCanEdit($annotation);

		return $annotation->addPoint(
			$this->request->input('x'),
			$this->request->input('y')
		);
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
