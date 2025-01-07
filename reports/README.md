# BIIGLE Reports Module

[![Test status](https://github.com/biigle/reports/workflows/Tests/badge.svg)](https://github.com/biigle/reports/actions?query=workflow%3ATests)

This is the BIIGLE module to generate reports for projects and volumes.

## Installation

This module is already included in [`biigle/biigle`](https://github.com/biigle/biigle).

1. Run `composer require biigle/reports`.
2. Add `Biigle\Modules\Reports\ReportsServiceProvider::class` to the `providers` array in `config/app.php`.
3. Run `php artisan vendor:publish --tag=public` to publish the public assets of this module.
4. Run `pip install -r vendor/biigle/reports/requirements.txt` to install the python requirements.
5. Configure a storage disk for the report files and set the `REPORTS_STORAGE_DISK` variable to the name of this storage disk in the `.env` file. Example for a local disk:
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
