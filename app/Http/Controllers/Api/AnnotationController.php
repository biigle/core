<?php namespace Dias\Http\Controllers\Api;

use Dias\Annotation;

class AnnotationController extends Controller {

	/**
	 * Displays the annotation.
	 *
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function show($id)
	{
		$annotation = $this->requireNotNull(
			Annotation::with('labels', 'points')->find($id)
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
