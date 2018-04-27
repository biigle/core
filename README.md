# BIIGLE

Benthic Image Indexing, Graphical Labeling and Exploration

## Requirements

- [Docker](https://docs.docker.com/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Installation

### For Production

Run `docker-compose build` to build the `biigle/app`, `biigle/web` and `biigle/worker` Docker images.

Now head over to [biigle/distribution](https://github.com/biigle/distribution) to configure and build your production setup.

### For Development

To develop BIIGLE on your local machine you may use Docker containers, too. This way you don't need to install any of the requirements like Python or special PHP extensions and keep your development environment clearly separated from your regular OS.

#### Download the project files

Set up the project in the `biigle` directory (using [Composer](https://getcomposer.org/doc/00-intro.md)):

```
composer create-project biigle/core:dev-dev-modules --repository='{"type":"vcs","url":"git@github.com:biigle/core.git"}' --keep-vcs --ignore-platform-reqs --prefer-source biigle
```

Note the `--ignore-platform-reqs` flag to keep Composer from complaining about missing requirements. These requirements will be met by the Docker containers.

This will set up the project in the `dev-modules` branch of this repository. The `dev-modules` branch is configured with all BIIGLE modules which makes it easy to start module development. However, changes to the BIIGLE core should be done only in the `master` branch and then merged back into `dev-modules`.

#### Build and run the application

Now you have to configure `GITHUB_OAUTH_TOKEN` in the `.env` file with a [personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/) of GitHub (with authorization for the **repo** scope).

This allows you to build the Docker images and start the application with `docker-compose up`. The first time may take a while. The BIIGLE application is now running at `http://localhost:8000`. Stop the containers with `docker-compose stop`. Destroy them (and the development database) with `docker-compose down`.

#### Initialize the application

Before you can start using or developing BIIGLE, you need to perform a few initialization steps:

1. Apply the database migrations: `docker-compose exec app php artisan migrate`

2. Publish the assets of the BIIGLE modules: `php artisan vendor:publish --tag public`

3. Create the first user: `docker-compose exec app php artisan user:new`

#### Run the tests

Run the tests with `docker-compose run --rm worker php -d memory_limit=1G vendor/bin/phpunit`. The first time might fail since the testing database container needs to start up.

#### Develop a module

The BIIGLE modules are installed by Composer and located in the `vendor/biigle/` directory. As you have used the `dev-modules` branch, they should be there already. Also, the modules are installed as Git repositories, because of the `--prefer-source` flag of Composer. This allows you to modify and develop a module right in its `vendor/biigle/<name>/` directory, commit and push the changes, all while you see the changes instantly applid in the running development instance.

Before you start developing, you should run `git checkout master && git pull` to get the most recent development version of a module.

Module assets like CSS and JavaScript are processed with [Gulp](https://gulpjs.com/). To modify and reprocess the assets, you need to install Gulp first:

1. Install the Gulp CLI: `npm install -g gulp-cli`

2. Install the JavaScript dependencies of a module (in `vendor/biigle/<name>/`): `npm install`

Now you can use three commands to process the assets:

- `gulp watch`: Keeps running, processes the assets and publishes the files to the running development instance whenever a source file has been modified. Use this during development.
- `gulp`: This processes the assets and publishes the files to the running development instance once.
- `gulp --production`: Like `gulp` but also minifies the CSS and JavaScript files. Always run this command before you commit new versions of the asset files to Git.

Processing of the assets of the BIIGLE core works just the same.
