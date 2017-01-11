<?php

return [

    /*
    | The service for generating thumbnails, this application should use.
    | Default 'Biigle\Services\Thumbnails\InterventionImage' is provided by the core application.
    */
    'service' => 'Biigle\Services\Thumbnails\InterventionImage',

    /*
    | URI where the image thumbnails are available from.
    | If you have 'thumbs', the URL will look like 'example.com/thumbs/abc.jpg'.
    |
    | The URI must exist as directory in the public path.
    | For 'thumbs' there must be a 'public/thumbs' directory.
    */
    'uri' => 'thumbs',

    /*
    | Dimensions of the thumbnail images to create. Only change this if you know what you are
    | doing, since the views must work with these images. The images are always scaled
    | proportionally, so this values are kind of a max-width and max-height.
    */
    'width' => 180,
    'height' => 135,

    /*
     | Thumbnail file format. Depending on your thumbnail service, different formats are
     | supported. Usually fine are 'jpg' or 'png'.
     */
     'format' => 'jpg',

    /*
    | Image URL to use if a thumbnail was not yet generated.
    | Must be a path relative to the 'public' directory (that can be used with the asset
    | helper).
    */
    'empty_url' => 'assets/images/empty-thumbnail.svg',

];
