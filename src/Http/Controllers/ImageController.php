<?php namespace Dias\Modules\Transects\Http\Controllers;

use Dias\Image;
use Dias\Http\Controllers\Views\Controller;

class ImageController extends Controller {

	/**
	 * Shows the image index page.
	 *
	 * @param int $id transect ID
	 * @return \Illuminate\Http\Response
	 */
	public function index($id)
	{
		$image = $this->requireNotNull(Image::find($id));
		$this->requireCanSee($image);
		$image->setAttribute('exif', $image->getExif());
		$file = $image->getFile();
		$image->setAttribute('width', $file->width());
		$image->setAttribute('height', $file->height());

		return view('transects::images.index')
			->withImage($image);
	}
}
