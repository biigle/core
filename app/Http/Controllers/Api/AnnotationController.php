<?php namespace Dias\Http\Controllers\Api;

use Dias\Annotation;

class AnnotationController extends Controller {

	/**
	 * Finds the annotation and eager loads its labels and points.
	 * 
	 * @param int $id annotation id
	 * @return Annotation
	 */
	public static function find($id)
	{
		return Annotation::with('labels', 'points')->find($id);
	}

	/**
	 * Displays the annotation.
	 *
	 * @param  int  $id
	 * @return Annotation
	 */
	public function show($id)
	{
		$annotation = $this->requireNotNull(
			self::find($id)
		);

		// call fresh so the transect and image doesn't appear in the output
		// (they will be fetched for projectIds())
		$this->requireCanSee($annotation->fresh());

		return $annotation;
	}

	/**
	 * Removes the annotation.
	 *
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function destroy($id)
	{
		$annotation = $this->requireNotNull(Annotation::find($id));

		$this->requireCanEdit($annotation);

		$annotation->delete();
		return response('Deleted.', 200);
	}

}
