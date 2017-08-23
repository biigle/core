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

];
