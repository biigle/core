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
    ],

    /*
    | Directory to store the report files to
    */
    'reports_storage' => storage_path('reports'),

    /*
    | Directory to store temporary files to
    */
    'tmp_storage' => sys_get_temp_dir(),

    'notifications' => [
        /*
        | Set the way notifications for new reports are sent by default.
        |
        | Available are: "email", "web"
        */
        'default_settings' => 'email',

        /*
        | Choose whether users are allowed to change their notification settings.
        | If set to false the default settings will be used for all users.
        */
        'allow_user_settings' => true,
    ],
];
