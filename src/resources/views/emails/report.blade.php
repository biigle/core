<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>BIGLE DIAS Report Notification</title>
    </head>
    <body>
        <p>
            @if ($user->firstname && $user->lastname)
                Dear {{$user->firstname}} {{$user->lastname}},<br><br>
            @else
                Dear user,<br><br>
            @endif
            your BIGLE DIAS {{$type}} report for project {{$project->name}} is ready for download.
        </p>
        <p>
            <strong>The report will be removed once you have downloaded it.</strong>
        </p>
        <p>
           <a href="{{url("api/v1/reports/{$uuid}/{$filename}")}}">Download report</a>
        </p>
    </body>
</html>
