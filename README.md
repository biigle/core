# Dias Projects Module

Install the module:

Add the following to your `composer.json`?
```
"repositories": [
   {
      "type": "vcs",
      "url": "porta.cebitec.uni-bielefeld.de:/vol/biodtmin/git/dias-projects.git"
   }
]
```

1. Add `"dias/projects": "dev-master",` to the `require` section of your `composer.json`.
2. Run `php composer.phar update dias/projects`.
3. Add `'Dias\Modules\Projects\ProjectsServiceProvider'` to the `providers` array in `config/app.php`.
4. Run `php artisan vendor:publish --provider="Dias\Modules\Projects\ProjectsServiceProvider" --tag="public" --force` to refresh the public assets of this package.