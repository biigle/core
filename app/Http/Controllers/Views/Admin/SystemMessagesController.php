<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\SystemMessage;
use Biigle\SystemMessageType;
use Biigle\Http\Controllers\Controller;

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
            ->paginate(20);

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
            SystemMessageType::typeInfo(),
            SystemMessageType::typeUpdate(),
            SystemMessageType::typeImportant(),
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
            SystemMessageType::typeInfo(),
            SystemMessageType::typeUpdate(),
            SystemMessageType::typeImportant(),
        ];

        return view('admin.system-messages.update', [
            'types' => $types,
            'message' => $message,
        ]);
    }
}
