# DIAS

DISCOL Image Annotation Software

## Requirements

- PHP 5.4+
- PHP mcrypt extension
- PHP JSON extension
- PHP PGSQL extension
- PHP Fileinfo extension

- (PHP) GD Library (>=2.0) 
- PostgreSQL
- Git

And for development/testing:

- PHP cURL extension
- PHP SQLite extension

- Node.js
- gulp-cli
- karma/jasmine
- PhantomJS

- SQLite

## Installation

1. Clone this repository.
2. Run `composer install` ([get composer](https://getcomposer.org/doc/00-intro.md#installation-linux-unix-osx)).
4. Copy `.env.example` to `.env` and populate it with your database credentials. Then run `php artisan key:generate` to generate an encryption key.
5. Set up the database with `php artisan migrate`.
6. Run a local development server with `php artisan serve`. Alternatively you could use `php -S localhost:8000 -t public/` to mimic a production server.

## Developing

TODO

(`npm install`, Package development, `php artisan tinker`)

Update or generate the API documentation with `./update-doc.sh`.

## Testing

You shouldn't need to configure your testing environment since for acceptance tests your `local` database is used, and for functional/unit tests an SQLite in-memory database is used.

### Acceptance

1. start `phantomjs --webdriver=4444`
2. start `php -S localhost:8000 -t public/`
3. start your database (it will be wiped and re-seeded during testing!)
4. run `php vendor/bin/codecept run`

### Unit/Functional

Run `phpunit`.

To run all tests, set up the PHP server and run `./test.sh`.

## Deployment

Deployment instructions are not final yet!

See <http://stackoverflow.com/a/23153290/1796523>.

Generate minified sources with `gulp --production`.

Walk through all the `app/config/` files and set the configs.
Don't forget to set the encryption key! You can generate one with `php artisan key:generate`.
Maybe set up the route cache? Cache the environment variables?

**Put all sensitive and secret stuff to `.env.php` in the repo root!** You'll see where the `env()` helper is used in the config files.
