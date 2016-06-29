# Dias Export Module

Install the module:

Add the following to the repositories array of your `composer.json`:
```
{
  "type": "vcs",
  "url": "https://github.com/BiodataMiningGroup/dias-export.git"
}
```

1. Run `php composer.phar require dias/export`.
2. Add `'Dias\Modules\Export\ExportServiceProvider'` to the `providers` array in `config/app.php`.
3. Run `php artisan export:publish` to refresh the public assets of this package. Do this for every update of the package.
4. Run `pip install -r vendor/dias/export/requirements.txt` to install python requirements.
5. Create a `storage/reports` directory that is read/writable for the web application. The location can be configured via the `export.exports_storage` key.
