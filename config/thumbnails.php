<?php

return [

    /*
    | The service for generating thumbnails, this application should use.
    | Default 'Dias\Services\Thumbnails\InterventionImage' is provided by the core application.
    */
    'service' => 'Dias\Services\Thumbnails\InterventionImage',

    /*
    | The directory where all thumbnail images are stored. Must be publicly visible!
    */
    'storage' => public_path('thumbs'),

    /*
    | Dimensions of the thumbnail images to create. Only change this if you know what you are
    | doing, since the views must work with these images. The images are always scaled
    | proportionally, so this values are kind of a max-width and max-height.
    */
    'width' => 180,
    'height' => 135,

    /*
    | Image URL to use if a thumbnail was not yet generated.
    | Must be a path relative to the 'public' directory (that can be used with the asset
    | helper).
    */
    'empty_url' => 'assets/images/empty-thumbnail.svg',

];
