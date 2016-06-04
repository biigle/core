<?php

namespace Dias\Modules\Ate\Http\Controllers\Views;

class AteController extends Controller
{
    /**
     * Show the application dashboard to the user.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        #read in json and prepare array
        $js = file_get_contents(storage_path()."/example.json");
        
        return view('ate::ate')->with('user', auth()->user())->with('data',$js);
    }
}
