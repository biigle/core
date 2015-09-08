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

        // array of all project IDs that the user and the image have in common
        $projectIds = array_intersect(
            $this->user->projects()->select('id')->get()->pluck('id')->toArray(),
            $image->projectIds()
        );

		return view('annotations::index')
			->withUser($this->user)
			->withImage($image)
			->with('editMode', $this->user->canEditInOneOfProjects($image->projectIds()))
            ->with('projectIds', implode(',', $projectIds))
			->with('message', session('message'))
			->with('messageType', session('messageType'));
	}
}
