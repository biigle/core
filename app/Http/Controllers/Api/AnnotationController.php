<?php namespace Dias\Http\Controllers\Api;

use Dias\Annotation;

class AnnotationController extends Controller {

	/**
	 * Displays the annotation.
	 *
	 * @param  int  $id
	 * @return Annotation
	 */
	public function show($id)
	{
		$annotation = $this->requireNotNull(
			Annotation::with('points')->find($id)
		);

		// call fresh so the transect and image doesn't appear in the output
		// (they will be fetched for projectIds())
		$this->requireCanSee($annotation->fresh());

		return $annotation;
	}

	/**
	 * Updates the annotation including its points.
	 *
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function update($id)
	{
		$annotation = $this->requireNotNull(
			Annotation::with('points')->find($id)
		);

		$this->requireCanEdit($annotation->fresh());

		// from a JSON request, the array may already be decoded
		$points = $this->request->input('points');
		
		if (is_string($points))
		{
			$points = json_decode($points);
		}

		$annotation->refreshPoints($points);
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
