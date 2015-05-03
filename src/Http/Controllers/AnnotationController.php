<?php namespace Dias\Modules\Annotations\Http\Controllers;

use Dias\Image;
use Dias\Http\Controllers\Views\Controller;

class AnnotationController extends Controller {

	/**
	 * Shows the annotation index page.
	 * @param int $id the image ID
	 * 
	 * @return \Illuminate\Http\Response
	 */
	public function index($id)
	{
		$image = $this->requireNotNull(Image::find($id));
		$this->requireCanSee($image);

		return view('annotations::index')
			->withUser($this->user)
			->withImage($image)
			->with('editMode', $this->user->canEditInOneOfProjects($image->projectIds()))
			->with('message', session('message'))
			->with('messageType', session('messageType'));
	}
}
