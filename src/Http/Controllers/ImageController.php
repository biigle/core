<?php

namespace Dias\Modules\Transects\Http\Controllers;

use Dias\Image;
use Dias\Http\Controllers\Views\Controller;

class ImageController extends Controller
{
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
        $size = getimagesize($image->url);
        $image->setAttribute('width', $size[0]);
        $image->setAttribute('height', $size[1]);

        return view('transects::images.index')
            ->withImage($image);
    }
}
