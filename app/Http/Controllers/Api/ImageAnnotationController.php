<?php namespace Dias\Http\Controllers\Api;

use Dias\Image;
use Dias\Shape;
use Dias\Label;
use Dias\Annotation;

class ImageAnnotationController extends Controller {

	/**
	 * Shows a list of all annotations of the specified image.
	 *
	 * @param int $id image id
	 * @return \Illuminate\Http\Response
	 */
	public function index($id)
	{
		$image = $this->requireNotNull(Image::find($id));
		$this->requireCanSee($image);

		return $image->annotations()->with('points')->get();
	}

	/**
	 * Creates a new annotation in the specified image.
	 *
	 * @param int $id image ID
	 * @return Annotation
	 */
	public function store($id)
	{
		$image = $this->requireNotNull(Image::find($id));
		$this->requireCanEdit($image);

		$this->validate($this->request, Image::$createAnnotationRules);
		$this->validate($this->request, Annotation::$attachLabelRules);

		$shape = Shape::find($this->request->input('shape_id'));

		// from a JSON request, the array may already be decoded
		$points = $this->request->input('points');
		
		if (is_string($points))
		{
			$points = json_decode($points);
		}

		if (empty($points))
		{
			abort(400, 'Annotation must be initialized with at least one point.');
		}

		$annotation = new Annotation;
		$annotation->shape()->associate($shape);
		$annotation->image()->associate($image);
		$annotation->save();

		$annotation->addPoints($points);
		$annotation->addLabel(
			$this->request->input('label_id'),
			$this->request->input('confidence'),
			$this->user
		);

		return Annotation::with('points')->find($annotation->id);
	}
}
