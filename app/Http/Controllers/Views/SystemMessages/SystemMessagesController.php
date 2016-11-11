<?php

namespace Dias\Http\Controllers\Views\SystemMessages;

use Dias\SystemMessage;
use Dias\SystemMessageType;
use Illuminate\Http\Request;
use Dias\Http\Controllers\Controller;

class SystemMessagesController extends Controller
{
    /**
     * Shows the system message list.
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $this->validate($request, [
            'type' => 'exists:system_message_types,id',
        ]);

        $type = $request->input('type');

        $messages = SystemMessage::select('id', 'title', 'type_id', 'published_at')
            ->with('type')
            ->when($type, function ($query) use ($type) {
                return $query->where('type_id', $type);
            })
            ->get();

        $typeClasses = [
            SystemMessageType::$important->id => 'warning',
            SystemMessageType::$update->id => 'success',
            SystemMessageType::$info->id => 'info',
        ];

        $types = [
            SystemMessageType::$important,
            SystemMessageType::$update,
            SystemMessageType::$info,
        ];

        return view('system-messages.index', [
            'messages' => $messages,
            'typeClasses' => $typeClasses,
            'type' => $type,
            'types' => $types,
        ]);
    }

    /**
     * Show a system message
     * @param  int $id System message ID
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $message = SystemMessage::with('type')->findOrFail($id);

        $typeClasses = [
            SystemMessageType::$important->id => 'warning',
            SystemMessageType::$update->id => 'success',
            SystemMessageType::$info->id => 'info',
        ];

        return view('system-messages.show', [
            'message' => $message,
            'typeClasses' => $typeClasses,
        ]);
    }
}
