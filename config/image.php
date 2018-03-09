<?php

return [

    /*
    | Settings for the image cache. The image cache caches remote or cloud storage
    | images locally so they don't have to be downloaded too often.
    */
    'cache' => [
        /*
        | Maximum allowed size of a cached image in bytes. Set to -1 to allow any size.
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

        /*
         | Read timeout in seconds for fetching remote images. If the stream transmits
         | no data for longer than this period (or cannot be established), caching the
         | image fails.
         */
        'timeout' => 5.0,
    ],

    'tiles' => [
        /*
        | Create tiles for local images where the longest edge is larger than this value
        | in pixels. For these images the tiles will be displayed in the annotation tool
        | instead of the original images because they are too large to be displayed in a
        | browser.
        |
        | Set to INF to disable tiling.
        */
        'threshold' => 10000,

        /*
        | URI where the image tiles are available from.
        | If you have 'tiles', the URL will look like 'example.com/tiles/...'.
        |
        | The URI must exist as directory in the public path.
        | For 'tiles' there must be a 'public/tiles' directory (or link).
        */
        'uri' => 'tiles',

        /*
         | Directory to temporarily store the tiles when they are generated.
         */
        'tmp_dir' => sys_get_temp_dir(),

        /*
         | Storage disk from config('filesystems.disks') to permanently store the tiles.
         | The default disk stores the tiles locally in storage/tiles, which are then
         | served by the webserver through the public/tiles link.
         | Alternatively you can use a public object storage container and configure
         | the webserver to act as a reverse proxy for the uri configured above.
         */
        'disk' => 'local-tiles',

        /*
        | Settings for the image tile cache. The image tile cache extracts local or cloud
        | storage image tiles (which are packed in ZIP files) locally so they can be
        | served by the webserver. Image tiles are cached on demand when a user opens an
        | image.
        */
        'cache' => [
            /*
            | Maximum size of the image tile cache in bytes.
            */
            'max_size' => 1E+9, // 1 GB

            /*
            | Directory to use for the image tile cache.
            */
            'path' => storage_path('framework/cache/tiles'),
        ],
    ],

];
