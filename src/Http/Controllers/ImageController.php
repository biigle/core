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

		return view('transects::images.index')
			->withImage($image)
			->withFile($image->getFile())
			->withMixins($this->modules->getMixins('imagesIndex'))
			->with('buttonMixins', $this->modules->getMixins('imagesIndexButtons'))
			->with('message', session('message'))
			->with('messageType', session('messageType'));
	}
}
