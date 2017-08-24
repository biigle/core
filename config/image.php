<?php

return [

    /*
    | Settings for the image cache. The image cache caches remote images locally so they
    | don't have to be downloaded too often.
    */
    'cache' => [
        /*
        | Maximum allowed remote image size in bytes.
        */
        'max_image_size' => 1E+8, // 100 MB

        /*
        | Maximum size of the image cache in bytes.
        */
        'max_size' => 1E+9, // 1 GB

        /*
        | Directory to use for the image cache.
        */
        'path' => storage_path('framework/cache/images'),
    ],

    'tiles' => [
        /*
        | Create tiles for local images where the longest edge is larger than this value
        | in pixels. For these images the tiles will be displayed in the annotation tool
        | instead of the original images because they is too large to be displayed in a
        | browser.
        |
        | Set to INF to disable tiling.
        */
        'threshold' => 5000,

        /*
        | URI where the image tiles are available from.
        | If you have 'tiles', the URL will look like 'example.com/tiles/...'.
        |
        | The URI must exist as directory in the public path.
        | For 'tiles' there must be a 'public/tiles' directory (or link).
        */
        'uri' => 'tiles',
    ],


];
