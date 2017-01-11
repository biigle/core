<?php

namespace Biigle\Http\Controllers\Views;

use View;

class ManualController extends Controller
{

    /**
     * Show the application manual to the user.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return view('manual.index');
    }

    /**
     * Show a tutorials article.
     *
     * @param string $module Name of the module or name of the article
     * @param string $article Article name (only if the article belongs to a module)
     * @return \Illuminate\Http\Response
     */
    public function tutorialsArticle($module, $article = null)
    {
        $view = 'manual.tutorials.';

        if (is_null($article)) {
            $view .= $module;
        } else {
            $view = "{$module}::{$view}{$article}";
        }

        if (View::exists($view)) {
            return View::make($view);
        } else {
            abort(404);
        }
    }

    /**
     * Show the application documentation center to the user.
     *
     * @return \Illuminate\Http\Response
     */
    public function indexDocumentation()
    {
        return view('manual.documentation.index');
    }

    /**
     * Show a documentation article.
     *
     * @param string $module Name of the module or name of the article
     * @param string $article Article name (only if the article belongs to a module)
     * @return \Illuminate\Http\Response
     */
    public function documentationArticle($module, $article = null)
    {
        $view = 'manual.documentation.';

        if (is_null($article)) {
            $view .= $module;
        } else {
            $view = "{$module}::{$view}{$article}";
        }

        if (View::exists($view)) {
            return View::make($view);
        } else {
            abort(404);
        }
    }
}
