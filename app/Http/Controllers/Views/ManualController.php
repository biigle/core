<?php

namespace Dias\Http\Controllers\Views;

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
     * Show the application tutorial center to the user.
     *
     * @return \Illuminate\Http\Response
     */
    public function indexTutorials()
    {
        return view('manual.tutorials.index');
    }

    /**
     * Show a tutorials article.
     *
     * @param string $name Article name
     * @return \Illuminate\Http\Response
     */
    public function tutorialsArticle($name)
    {
        if (view()->exists('manual.tutorials.'.$name)) {
            return view('manual.tutorials.'.$name);
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
     * @param string $name Article name
     * @return \Illuminate\Http\Response
     */
    public function documentationArticle($name)
    {
        if (view()->exists('manual.documentation.'.$name)) {
            return view('manual.documentation.'.$name);
        } else {
            abort(404);
        }
    }
}
