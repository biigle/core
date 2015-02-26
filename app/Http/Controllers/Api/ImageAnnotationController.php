<?php namespace Dias\Http\Controllers\Api;

use Dias\Image;
use Dias\Shape;
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

		return $image->annotations;
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
		$this->requireArguments('shape_id', 'points');

		$shape = Shape::find($this->request->input('shape_id'));

		if (!$shape)
		{
			abort(400, 'Shape with ID "'.$this->request->input('shape_id').'" does not exist.');
		}

		$points = json_decode($this->request->input('points'));

		if (empty($points))
		{
			abort(400, 'Annotation must be initialized with at least one point.');
		}

		$annotation = new Annotation;
		$annotation->shape()->associate($shape);
		$annotation->image()->associate($image);
		$annotation->save();

		foreach ($points as $point) {
			$annotation->addPoint($point->x, $point->y);
		}

		// return annotation object with points
		return Annotation::with('points')->find($annotation->id);
	}
}
