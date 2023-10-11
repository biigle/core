<?php

return [

    /*
    | Storage disk where the thumbnail images will be stored.
    */
    'storage_disk' => env('THUMBNAIL_STORAGE_DISK', 'thumbs'),

    /*
    | Dimensions of the thumbnail images to create. Only change this if you know what
    | you are doing, since the views must work with these images. The images are always
    | scaled proportionally, so this values are kind of a max-width and max-height.
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
