<?php

namespace Dias\Exceptions;

use Exception;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Dias\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Illuminate\Session\TokenMismatchException;
use Symfony\Component\Debug\ExceptionHandler as SymfonyExceptionHandler;
use Symfony\Component\Debug\Exception\FlattenException;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that should not be reported.
     *
     * @var array
     */
    protected $dontReport = [
        AuthorizationException::class,
        HttpException::class,
        ModelNotFoundException::class,
        ValidationException::class,
    ];

    private function renderJsonResponse(Exception $e)
    {
        if ($e instanceof HttpResponseException) {
            return $e->getResponse();
        } elseif ($e instanceof ModelNotFoundException) {
            $e = new NotFoundHttpException($e->getMessage(), $e);
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

    /**
     * Report or log an exception.
     *
     * This is a great spot to send exceptions to Sentry, Bugsnag, etc.
     *
     * @param  \Exception  $e
     * @return void
     */
    public function report(Exception $e)
    {
        parent::report($e);
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Exception  $e
     * @return \Illuminate\Http\Response
     */
    public function render($request, Exception $e)
    {
        if ($e instanceof TokenMismatchException) {
            $e = new AccessDeniedHttpException();
        }

        // use JsonResponse if this was an automated request
        if (Controller::isAutomatedRequest($request)) {
            return $this->renderJsonResponse($e);
        } else if ($e instanceof \ErrorException && view()->exists("errors.500")) {
            return $this->renderCustomErrorPage($e);
        } else {
            return parent::render($request, $e);
        }
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
     * Render an exception with a custom view
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
}
