# DIAS

DISCOL Image Annotation Software

## Requirements

- PHP 5.4+
- PHP mcrypt extension
- PHP JSON extension

- PostgreSQL

And for development:

- PHPUnit
- Node.js
- gulp-cli
- karma

## Installation

1. Clone this repository.
2. Run `composer install` ([get composer](https://getcomposer.org/doc/00-intro.md#installation-linux-unix-osx)).
4. Configure your database credentials in `.env.local.php` in the repo root. You need to configure your hostname to be recognized as local in `bootstrap/start.php`.
5. Set up the database with `php artisan migrate`.
6. Run a local development server with `php artisan serve`. Alternatively you could use `php -S localhost:8000 -t public/` to mimic a production server.

## Developing

## Testing

### Server

Run `phpunit` in the root of the repo.

### Client

Run `npm test` in the root of the repo.

## Deployment

See <http://stackoverflow.com/a/23153290/1796523>.

Walk through all the `app/config/` files and set the configs.
Don't forget to set the encryption key! You can generate one with `php artisan key:generate`.

**Put all sensitive and secret stuff to `.env.php` in the repo root!** You'll see where the `$_ENV` array is used in the config files.
