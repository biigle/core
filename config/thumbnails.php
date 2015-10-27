<?php

return [

    /*
    | The service for generating thumbnails, this application should use.
    | Default 'Dias\Services\Thumbnails\InterventionImage' is provided by the core application.
    */
    'service' => 'Dias\Services\Thumbnails\InterventionImage',

    /*
    | The directory where all thumbnail images are stored.
    */
    'storage' => storage_path('thumbs'),

    /*
    | Dimensions of the thumbnail images to create. Only change this if you know what you are
    | doing, since the views must work with these images. The images are always scaled
    | proportionally, so this values are kind of a max-width and max-height.
    */
    'width' => 180,
    'height' => 135,

    /*
    | Image URL to use if a thumbnail was not yet generated.
    | Must be publicly accessible via HTTP(S).
    | If it is a relative path not starting with 'http(s)://', it is assumed to be located in the
    | public directory.
    | We can't use the asset() helper here because the UrlGenerator is not ready when loading the
    | config.
    */
    'empty_url' => 'assets/images/empty-thumbnail.svg',

];
