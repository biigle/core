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
        $image = Image::with('transect')->findOrFail($id);

        $this->authorize('access', $image);

        $exifKeys = [
            'DateTime',
            'Model',
            'ShutterSpeedValue',
            'ApertureValue',
            'Flash',
            'GPS Latitude',
            'GPS Longitude',
            'GPS Altitude'
        ];

        $image->exif = $image->getExif();

        $size = $image->getSize();
        $image->width = $size[0];
        $image->height = $size[1];

        return view('transects::images.index', [
            'image' => $image,
            'transect' => $image->transect,
            'exifKeys' => $exifKeys,
        ]);
    }
}
