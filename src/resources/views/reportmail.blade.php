<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>BiigleDias Report Notification</title>
    </head>
    <body>
    	<p>Dear {{{$name}}},<p>
    	<p>your BiigleDias report is ready for download. Please save it because it is deleted after the first access.</p>
    	<a href="http://127.0.0.1:8000/api/v1/files/retrieve/{{{$uuid}}}/BiigleDiasReport{{{$ending}}}">Download report</a>
    </body>
</html>