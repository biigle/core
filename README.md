# Dias Annotations Module

Install the module:

Add the following to the repositories array of your `composer.json`:
```
{
  "type": "vcs",
  "url": "git@github.com:BiodataMiningGroup/dias-annotations.git"
}
```

1. Run `php composer.phar require dias/annotations`.
2. Add `'Dias\Modules\Annotations\AnnotationsServiceProvider'` to the `providers` array in `config/app.php`.
3. Run `php artisan annotations:publish` to refresh the public assets of this package. Do this for every update of the package.
