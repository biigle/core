<?php namespace Dias\Http\Controllers\Api;

use Dias\Image;
use InterventionImage;

class ImageController extends Controller {

	/**
	 * Shows the specified image.
	 *
	 * @param int $id image id
	 * @return \Illuminate\Http\Response
	 */
	public function show($id)
	{
		$image = $this->requireNotNull(Image::find($id));
		$this->requireCanSee($image);

		return $image;
	}

	/**
	 * Shows the specified image thumbnail file.
	 *
	 * @param int $id image id
	 * @return \Illuminate\Http\Response
	 */
	public function showThumb($id)
	{
		$image = $this->requireNotNull(Image::find($id));
		$this->requireCanSee($image);

		return $image->getThumb()->response('jpg');
	}

	/**
	 * Shows the specified image file.
	 *
	 * @param int $id image id
	 * @return \Illuminate\Http\Response
	 */
	public function showFile($id)
	{
		$image = $this->requireNotNull(Image::find($id));
		$this->requireCanSee($image);

		return $image->getFile()->response('jpg');
	}
}
