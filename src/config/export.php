<?php

return [

    /*
    | Path to the Python executable.
    */
    'python' => '/usr/bin/env python',

    /*
    | Paths to the python scripts.
    */
    'scripts' => [
        'basic_report' => __DIR__.'/../resources/scripts/basic_report.py',
        'extended_report' => __DIR__.'/../resources/scripts/extended_report.py',
        'full_report' => __DIR__.'/../resources/scripts/full_report.py',
        'image_labels_standard_report' => __DIR__.'/../resources/scripts/image_label_report.py',
    ],

    /*
    | Directory to store the report files to
    */
    'reports_storage' => storage_path('reports'),

    /*
    | Directory to store temporary files to
    */
    'tmp_storage' => sys_get_temp_dir(),
];
