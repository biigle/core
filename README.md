# BIIGLE Reports Module

This is the BIIGLE module to generate reports for projects, volumes and videos.

## Installation

1. Run `composer config repositories.reports vcs git@github.com:biigle/reports.git`
2. Run `composer require biigle/reports`.
3. Add `Biigle\Modules\Reports\ReportsServiceProvider::class` to the `providers` array in `config/app.php`.
4. Run `php artisan vendor:publish --tag=public` to publish the public assets of this module.
5. Run `pip install -r vendor/biigle/reports/requirements.txt` to install the python requirements.
6. Configure a storage disk for the report files and set the `REPORTS_STORAGE_DISK` variable to the name of this storage disk in the `.env` file. Example for a local disk:
    ```php
    'reports' => [
        'driver' => 'local',
        'root' => storage_path('reports'),
    ],
    ```

## Developing

Take a look at the [development guide](https://github.com/biigle/core/blob/master/DEVELOPING.md) of the core repository to get started with the development setup.

Want to develop a new module? Head over to the [biigle/module](https://github.com/biigle/module) template repository.

## Contributions and bug reports

Contributions to BIIGLE are always welcome. Check out the [contribution guide](https://github.com/biigle/core/blob/master/CONTRIBUTING.md) to get started.
