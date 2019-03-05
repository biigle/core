# Biigle Reports Module

Install the module:

Add the following to the repositories array of your `composer.json`:
```
{
  "type": "vcs",
  "url": "https://github.com/biigle/reports.git"
}
```

1. Run `php composer.phar require biigle/reports`.
2. Add `'Biigle\Modules\Reports\ReportsServiceProvider'` to the `providers` array in `config/app.php`.
3. Run `php artisan reports:publish` to refresh the public assets of this package. Do this for every update of the package.
4. Run `pip install -r vendor/biigle/reports/requirements.txt` to install python requirements.
5. Configure a storage disk for the report files and set the `REPORTS_STORAGE_DISK` variable to the name of this storage disk in the `.env` file. Example for a local disk:
    ```php
    'reports' => [
        'driver' => 'local',
        'root' => storage_path('reports'),
    ],
    ```
