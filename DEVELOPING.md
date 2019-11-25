# Developing BIIGLE

To develop BIIGLE on your local machine you can use Docker containers. This way you don't need to install any of the requirements like Python or special PHP extensions and keep your development environment clearly separated from your regular OS.

## Download the project files

Set up the project in the `biigle` directory (using [Composer](https://getcomposer.org/doc/00-intro.md)):

```
composer create-project biigle/core:dev-dev-modules \
    --repository='{"type":"vcs","url":"git@github.com:biigle/core.git"}' \
    --keep-vcs \
    --ignore-platform-reqs \
    --prefer-source biigle
```

Note the `--ignore-platform-reqs` flag to keep Composer from complaining about missing requirements. These requirements will be met by the Docker containers.

This will set up the project in the `dev-modules` branch of this repository. The `dev-modules` branch is configured with all BIIGLE modules which makes it easy to start module development.

## Build and run the application

Now you have to configure `GITHUB_OAUTH_TOKEN` in the `.env` file with a [personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/) of GitHub (with authorization for the **repo** scope).

This allows you to build the Docker images and start the application with `docker-compose up`. The first time may take a while. The BIIGLE application is now running at `http://localhost:8000`. Stop the containers with `docker-compose stop`. Destroy them (and the development database) with `docker-compose down`.

## Initialize the application

Before you can start using or developing BIIGLE, you need to perform a few initialization steps:

1. Apply the database migrations: `docker-compose exec app php artisan migrate`

2. Publish the assets of the BIIGLE modules: `php artisan vendor:publish --tag public`

3. Create the first user: `docker-compose exec app php artisan user:new`

## Run the tests

Run the tests with `composer test`. The first time might fail since the testing database container needs to start up. To run only a subset of the tests, use `composer testf [pattern]` with `[pattern]` being a string that matches the test class or function that you want to run.

## Publish the Docker images

To publish a new version of the `biigle/app`, `biigle/web` and `biigle/worker` Docker images, create a new version as Git tag, first. This can be done on GitHub, too. Pull the new version tag with `git pull --tags`. If you do not set a version tag, only the `latest` Docker images will be built.

To build the Docker images, run `./build.sh`. The script asks you if you want to publish the new images to the GitHub package registry. Before you can do this, you have to [configure Docker](https://help.github.com/en/articles/configuring-docker-for-use-with-github-package-registry) to use the package registry and you obviously need package write permissions in this repository.

## Develop a module

The BIIGLE modules are installed by Composer and located in the `vendor/biigle/` directory. As you have used the `dev-modules` branch, they should be there already. Also, the modules are installed as Git repositories, because of the `--prefer-source` flag of Composer. This allows you to modify and develop a module right in its `vendor/biigle/<name>/` directory, commit and push the changes, all while you see the changes instantly applied in the running development instance.

Learn more on module development and how to create a new module in the [biigle/module](https://github.com/biigle/module) template repository.
