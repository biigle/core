# Biigle Reports Module

Install the module:

Add the following to the repositories array of your `composer.json`:
```
{
  "type": "vcs",
  "url": "https://github.com/BiodataMiningGroup/biigle-reports.git"
}
```

1. Run `php composer.phar require biigle/reports`.
2. Run `php artisan vendor:publish --tag=public` to refresh the public assets of this package. Do this for every update of the package.
3. Run `pip install -r vendor/biigle/reports/requirements.txt` to install python requirements.
4. Create a `storage/reports` directory that is read/writable for the web application. The location can be configured via the `reports.reports_storage` key.
5. Make sure the `reports.tmp_storage` directory is read/writable for the web application (default is `sys_get_temp_dir()`).
