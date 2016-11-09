<?php

namespace Dias\Http\Controllers\Views\Admin;

use Dias\SystemMessage;
use Dias\SystemMessageType;
use Dias\Http\Controllers\Controller;

class SystemMessagesController extends Controller
{
    /**
     * Shows the admin system messages page.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return view('admin.system-messages.index');
    }

    /**
     * Shows the admin new system message page.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $types = [
            SystemMessageType::$important,
            SystemMessageType::$update,
            SystemMessageType::$info,
        ];

        return view('admin.system-messages.create', [
            'types' => $types,
        ]);
    }

    /**
     * Shows the admin edit system message page.
     *
     * @return \Illuminate\Http\Response
     */
    public function update($id)
    {
        $message = SystemMessage::findOrFail($id);
    }
}
