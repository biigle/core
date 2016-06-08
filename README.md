# Dias Export Module

Install the module:

Add the following to the repositories array of your `composer.json`:
```
{
  "type": "vcs",
  "url": "https://github.com/BiodataMiningGroup/dias-export.git"
}
```

1. Run `php composer.phar require dias/export:dev-master`.
2. Add `'Dias\Modules\Export\ExportServiceProvider'` to the `providers` array in `config/app.php`.
3. Run `php artisan export:publish` to refresh the public assets of this package. Do this for every update of the package.
