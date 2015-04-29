<?php namespace Dias\Http\Controllers\Api;

use Dias\Annotation;
use Dias\AnnotationLabel;

class AnnotationLabelController extends Controller {

	/**
	 * Shows all labels of the specified annotation
	 *
	 * @param int $id Annotation ID
	 * @return \Illuminate\Http\Response
	 */
	public function index($id)
	{
		$annotation = $this->requireNotNull(Annotation::find($id));
		$this->requireCanSee($annotation);
		return $annotation->labels;
	}

	/**
	 * Creates a new label for the specified annotation.
	 *
	 * @param int $id Annotation ID
	 * @return \Illuminate\Http\Response
	 */
	public function store($id)
	{
		$this->validate($this->request, Annotation::$attachLabelRules);
		$annotation = $this->requireNotNull(Annotation::find($id));
		$this->requireCanEdit($annotation);

		$labelId = $this->request->input('label_id');

		$annotationLabel = $annotation->addLabel(
			$labelId,
			$this->request->input('confidence'),
			$this->user
		);

		return response($annotationLabel, 201);
	}
	
	/**
	 * Updates the attributes of the specified annotation label.
	 *
	 * @param int  $id
	 */
	public function update($id)
	{
		$annotationLabel = $this->requireNotNull(AnnotationLabel::find($id));
		$this->requireCanEdit($annotationLabel);

		$annotationLabel->confidence = $this->request->input(
			'confidence',
			$annotationLabel->confidence
		);

		$annotationLabel->save();
	}

	/**
	 * Deletes the specified annotation label.
	 *
	 * @param int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function destroy($id)
	{
		$annotationLabel = $this->requireNotNull(AnnotationLabel::find($id));
		$this->requireCanEdit($annotationLabel);

		$annotationLabel->delete();

		return response('Deleted.', 200);
	}
}
