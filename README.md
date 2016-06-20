# Dias Ate Module

Install the module:

Add the following to the repositories array of your `composer.json`:
```
{
  "type": "vcs",
  "url": "https://github.com/BiodataMiningGroup/dias-ate.git"
}
```

1. Run `php composer.phar require dias/ate:dev-master`.
2. Add `'Dias\Modules\Ate\AteServiceProvider'` to the `providers` array in `config/app.php`.
3. Run `php artisan ate:publish` to refresh the public assets of this package. Do this for every update of the package.
4. Run `pip install -r requirements` to install python requirements