<?php

namespace Biigle\Modules\Volumes\Http\Controllers;

use File;
use Biigle\Image;
use Biigle\Http\Controllers\Views\Controller;

class ImageController extends Controller
{
    /**
     * Shows the image index page.
     *
     * @param int $id volume ID
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $image = Image::with('volume')->findOrFail($id);

        $this->authorize('access', $image);

        $exifKeys = [
            'Model',
            'ShutterSpeedValue',
            'ApertureValue',
            'Flash',
        ];

        $metadataMap = [
            'gps_altitude' => 'GPS Altitude',
            'distance_to_ground' => 'Distance to ground',
        ];

        if (File::exists($image->url)) {
            $size = $image->getSize();
            $image->width = $size[0];
            $image->height = $size[1];
            $image->size = round(File::size($image->url) / 1e4) / 1e2;
        }

        return view('volumes::images.index', [
            'image' => $image,
            'volume' => $image->volume,
            'exif' => array_only($image->getExif(), $exifKeys),
            'exifKeys' => $exifKeys,
            'metadata' => array_only($image->metadata, array_keys($metadataMap)),
            'metadataMap' => $metadataMap,
        ]);
    }
}
