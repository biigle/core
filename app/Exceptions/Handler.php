<?php

namespace Biigle\Exceptions;

use Exception;
use ErrorException;
use Biigle\Http\Controllers\Controller;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Exception\HttpResponseException;
use Symfony\Component\Debug\Exception\FlattenException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Debug\ExceptionHandler as SymfonyExceptionHandler;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that should not be reported.
     *
     * @var array
     */
    protected $dontReport = [
        HttpException::class,
        ValidationException::class,
        AuthorizationException::class,
        ModelNotFoundException::class,
        AuthenticationException::class,
    ];

    /**
     * Report or log an exception.
     *
     * This is a great spot to send exceptions to Sentry, Bugsnag, etc.
     *
     * @param  \Exception  $exception
     * @return void
     */
    public function report(Exception $exception)
    {
        parent::report($exception);
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Exception  $exception
     * @return \Illuminate\Http\Response
     */
    public function render($request, Exception $exception)
    {
        // convert the exception here because we want to throw a 403 and not a 500
        if ($exception instanceof TokenMismatchException) {
            $exception = new AccessDeniedHttpException();
        }

        // use JsonResponse if this was an automated request
        if (Controller::isAutomatedRequest($request)) {
            return $this->renderJsonResponse($exception);
        } elseif ($exception instanceof ErrorException && view()->exists('errors.500')) {
            return $this->renderCustomErrorPage($exception);
        } else {
            return parent::render($request, $exception);
        }
    }

    /**
     * Convert an authentication exception into an unauthenticated response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Auth\AuthenticationException  $exception
     * @return \Illuminate\Http\Response
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        if ($request->expectsJson()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return redirect()->guest('login');
    }

    /**
     * Render the given HttpException.
     *
     * @param  \Symfony\Component\HttpKernel\Exception\HttpException  $e
     * @return \Symfony\Component\HttpFoundation\Response
     */
    protected function renderHttpException(HttpException $e)
    {
        $status = $e->getStatusCode();

        if (!view()->exists("errors.{$status}")) {
            return parent::renderHttpException($e);
        }

        return $this->renderCustomErrorPage($e);
    }

    /**
     * Render an exception with a custom view.
     *
     * @param \Exception $e
     * @return \Symfony\Component\HttpFoundation\Response
     */
    private function renderCustomErrorPage(Exception $e)
    {
        $e = FlattenException::create($e);
        $handler = new SymfonyExceptionHandler(config('app.debug'));
        $status = $e->getStatusCode();

        return response()->view(
            "errors.{$status}",
            [
                'exception' => $e,
                'content' => $handler->getContent($e),
                'css' => $handler->getStylesheet($e),
                'debug' => config('app.debug'),
            ],
            $status,
            $e->getHeaders()
        );
    }

    private function renderJsonResponse(Exception $e)
    {
        if ($e instanceof HttpResponseException) {
            return $e->getResponse();
        } elseif ($e instanceof ModelNotFoundException) {
            $e = new HttpException(404, $e->getMessage());
        } elseif ($e instanceof AuthorizationException) {
            $e = new HttpException(403, $e->getMessage());
        } elseif ($e instanceof ValidationException && $e->getResponse()) {
            return $e->getResponse();
        }

        $status = $this->isHttpException($e) ? $e->getStatusCode() : 500;

        $response = ['message' => $e->getMessage()];

        if (config('app.debug')) {
            $response['trace'] = $e->getTraceAsString();
        } elseif ($status >= 500) {
            // don't disclose server errors if not in debug mode
            $response['message'] = 'Whoops, looks like something went wrong.';
        }

        return response()->json($response, $status);
    }
}
