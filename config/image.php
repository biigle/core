<?php

return [

    'tiles' => [
        /*
        | Create tiles for local images where the longest edge is larger than this value
        | in pixels. For these images the tiles will be displayed in the annotation tool
        | instead of the original images because they are too large to be displayed in a
        | browser.
        |
        | Set to INF to disable tiling.
        */
        'threshold' => env('IMAGE_TILES_THRESHOLD', 1E+4),

        /*
         | Directory to temporarily store the tiles when they are generated.
         */
        'tmp_dir' => sys_get_temp_dir(),

        /*
         | Storage disk from config('filesystems.disks') to permanently store the tiles.
         | The default disk stores the tiles locally in storage/tiles. You can also use
         | a cloud storage disk for this.
         */
        'disk' => env('IMAGE_TILES_DISK', 'tiles'),

        /*
         | Queue on which the tile image job should run.
         */
        'queue' => env('IMAGE_TILES_QUEUE', 'default'),

        /*
         | Number of concurrent requests that should be sent when using a s3 disk
         */
        'nbr_concurrent_requests' => env('IMAGE_NBR_CON_REQUESTS', 10),
    ],

];
