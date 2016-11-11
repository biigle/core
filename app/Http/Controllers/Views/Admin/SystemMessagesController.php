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
        $messages = SystemMessage::orderBy('published_at', 'desc')
            ->with('type')
            ->get();

        return view('admin.system-messages.index', [
            'messages' => $messages,
        ]);
    }

    /**
     * Shows the admin new system message page.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $types = [
            SystemMessageType::$info,
            SystemMessageType::$update,
            SystemMessageType::$important,
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
        $types = [
            SystemMessageType::$info,
            SystemMessageType::$update,
            SystemMessageType::$important,
        ];

        return view('admin.system-messages.update', [
            'types' => $types,
            'message' => $message,
        ]);
    }
}
