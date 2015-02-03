# DIAS

DISCOL Image Annotation Software

## Requirements

- PHP 5.4+
- PHP mcrypt extension
- PHP JSON extension
- PHP PGSQL extension

- PostgreSQL

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
4. Set up your hostname to be recognized as local in `bootstrap/start.php`. Create `.env.local.php` and `.env.testing.php` files from `.example.env.php` and populate `local` with your database credentials.
5. Set up the database and seed it with `php artisan migrate --seed`.
6. Run a local development server with `php artisan serve`. Alternatively you could use `php -S localhost:8000 -t public/` to mimic a production server.

## Developing

TODO

(`npm install`, Package development)

## Testing

You shouldn't need to configure anything in `.env.testing.php` since for acceptance tests your `local` database is used, and for functional/unit tests an SQLite in-memory database is used.

### Acceptance

1. start `phantomjs --webdriver=4444`
2. start `php -S localhost:8000 -t public/`
3. start your database (it will be wiped and re-seeded during testing)
4. run `./test-acceptance.sh`

### Unit/Functional

Run `./test-unit.sh`.

## Deployment

Deployment instructions are not final yet!

See <http://stackoverflow.com/a/23153290/1796523>.

Walk through all the `app/config/` files and set the configs.
Don't forget to set the encryption key! You can generate one with `php artisan key:generate`.

**Put all sensitive and secret stuff to `.env.php` in the repo root!** You'll see where the `$_ENV` array is used in the config files.
