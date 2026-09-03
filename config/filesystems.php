<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. A "local" driver, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    | Supported: "local", "ftp", "sftp", "s3"
    |
    */

    'default' => env('FILESYSTEM_DISK', env('FILESYSTEM_DRIVER', 'local')),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    | NOTE: Disks with the name "user-[number]" or "disk-[number]" may be reserved
    | for the biigle/user-storage and biigle/user-disks modules.
    */

    'disks' => [

        // Default storage disk for images.
        'local' => [
            'driver' => 'local',
            'root' => storage_path('images'),
        ],

        // Default storage disk for image tiles.
        'tiles' => [
            'driver' => 'local',
            'root' => storage_path('app/public/tiles'),
            'url' => env('APP_URL').'/storage/tiles',
            'visibility' => 'public',
        ],

        'thumbs' => [
            'driver' => 'local',
            'root' => storage_path('app/public/thumbs'),
            'url' => env('APP_URL').'/storage/thumbs',
            'visibility' => 'public',
        ],

        'reports' => [
            'driver' => 'local',
            'root' => storage_path('reports'),
        ],

        'geo-overlays' => [
            'driver' => 'local',
            'root' => storage_path('app/public/geo-overlays'),
            'url' => env('APP_URL').'/storage/geo-overlays',
            'visibility' => 'public',
        ],

        'swift' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => 'BiigleImages',
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'stream_reads' => true,
            'http' => [
                'connect_timeout' => 5,
            ],
            'throw' => true,
            'options' => [
                'mup_threshold' => 314572800, // 300 MiB
                'part_size' => 104857600, // 100 MiB
            ],
        ],

        'largo' => [
            'driver' => 'local',
            'root' => storage_path('app/public/largo-patches'),
            'url' => env('APP_URL').'/storage/largo-patches',
            'visibility' => 'public',
        ],

        'maia-tp' => [
            'driver' => 'local',
            'root' => storage_path('app/public/maia-tp'),
            'url' => env('APP_URL').'/storage/maia-tp',
            'visibility' => 'public',
        ],

        'maia-ac' => [
            'driver' => 'local',
            'root' => storage_path('app/public/maia-ac'),
            'url' => env('APP_URL').'/storage/maia-ac',
            'visibility' => 'public',
        ],

        'video-thumbs' => [
            'driver' => 'local',
            'root' => storage_path('app/public/video-thumbs'),
            'url' => env('APP_URL').'/storage/video-thumbs',
            'visibility' => 'public',
        ],

        'imports' => [
            'driver' => 'local',
            'root' => storage_path('imports'),
        ],

        'laserpoints' => [
            'driver' => 'local',
            'root' => storage_path('framework/cache/laserpoints'),
        ],

        'metadata' => [
            'driver' => 'local',
            'root' => storage_path('metadata'),
        ],

        'pending-metadata' => [
            'driver' => 'local',
            'root' => storage_path('pending-metadata'),
        ],

        'user-storage' => [
            'driver' => 'local',
            'root' => storage_path('user-storage'),
        ],

        'magic-sam' => [
            'driver' => 'local',
            'root' => storage_path('app/public/magic-sam'),
            'url' => env('APP_URL').'/storage/magic-sam',
            'visibility' => 'public',
        ],

        'reports' => [
            'driver' => 'local',
            'root' => storage_path('reports'),
        ],

        'largo' => [
            'driver' => 'local',
            'root' => storage_path('app/public/largo-patches'),
            'url' => env('APP_URL').'/storage/largo-patches',
            'visibility' => 'public',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
