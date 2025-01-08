<?php

return [

    /*
    | Path to the Python executable.
    */
    'python' => '/usr/bin/python3',

    /*
    | Paths to the python scripts.
    */
    'scripts' => [
        'basic_report' => __DIR__.'/../resources/scripts/reports/basic_report.py',
        'csvs_to_xlsx' => __DIR__.'/../resources/scripts/reports/csvs_to_xlsx.py',
        'full_report' => __DIR__.'/../resources/scripts/reports/full_report.py',
        'to_coco' => __DIR__.'/../resources/scripts/reports/to_coco.py',
    ],

    /**
     * Storage disk to store the report files to.
     */
    'storage_disk' => env('REPORTS_STORAGE_DISK', 'reports'),

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

    /*
     | Specifies which queue should be used for which job.
     */
    'generate_report_queue' => env('REPORTS_GENERATE_REPORT_QUEUE', 'high'),
];
