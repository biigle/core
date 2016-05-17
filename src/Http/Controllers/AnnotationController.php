<?php

namespace Dias\Modules\Annotations\Http\Controllers;

use Dias\Image;
use Dias\Http\Controllers\Views\Controller;

class AnnotationController extends Controller
{
    /**
     * Shows the annotation index page.
     * @param int $id the image ID
     *
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $image = Image::with('transect')->findOrFail($id);
        $this->requireCanSee($image);

        if ($this->user->isAdmin) {
            // admins have no restrictions
            $projectIds = $image->projectIds();
        } else {
            // array of all project IDs that the user and the image have in common
            $projectIds = array_intersect(
                $this->user->projects()->pluck('id')->toArray(),
                $image->projectIds()
            );
        }

        return view('annotations::index')
            ->withUser($this->user)
            ->withImage($image)
            ->with('editMode', $this->user->canEditInOneOfProjects($image->projectIds()))
            ->with('projectIds', implode(',', $projectIds))
            ->with('transectImagesIds', $image->transect->images()->pluck('id'));
    }
}
