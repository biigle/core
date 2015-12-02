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
        $image = Image::findOrFail($id);
        $this->requireCanSee($image);
        $exifKeys = ['DateTime', 'Model', 'ShutterSpeedValue', 'ApertureValue', 'Flash', 'GPS Latitude', 'GPS Longitude', 'GPS Altitude'];
        $image->setAttribute('exif', $image->getExif());
        $size = $image->getSize();
        $image->setAttribute('width', $size[0]);
        $image->setAttribute('height', $size[1]);

        return view('transects::images.index')
            ->withImage($image)
            ->with('exifKeys', $exifKeys);
    }
}
