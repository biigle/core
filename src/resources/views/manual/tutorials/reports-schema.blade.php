@extends('manual.base')

@section('manual-title') Schema of exported reports @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            A description of the file formats of the different available reports.
        </p>

        <h3>Annotation reports</h3>
        <h4>Basic</h4>
        <p>
            The basic annotation report contains graphical plots of abundances of the different annotation labels (annotations can have multiple different labels by different users). The report is generated as a single PDF file, containing one page and plot for each transect of the project.
        </p>
        <p>
            Example plot:
            <figure>
                <a href="{{asset('vendor/export/images/demo_basic_plot.png')}}">
                    <img src="{{asset('vendor/export/images/demo_basic_plot.png')}}" style="max-width: 100%;">
                </a>
            </figure>
        </p>
        <p>
            The bars of the plot are color-coded based on the colors of the labels they represent. If any label occurs more than a hundred times, a logarithmic scale is applied for the transect.
        </p>

        <h4><a name="annotation-extended-report"></a>Extended</h4>

        <p>
            The extended annotation report is an XLSX spreadsheet with one sheet for every transect of the project. Transects without annotations are ommitted. The report contains a list of the abundances of each label <em>per image</em>.
        </p>
        <p>
            Each sheet contains the name of the transect as the first line. The columns are as follows:
        </p>
        <ol>
            <li>Image filename</li>
            <li>Label name</li>
            <li>Label abundance</li>
        </ol>

        <h4>Full</h4>

        <p>
            The full annotation report is an XLSX spreadsheet similar to the <a href="#annotation-extended-report">extended report</a>. It contains a list of all annotations and their labels for each transect.
        </p>
        <p>
            Each sheet contains the name of the transect as the first line. The columns are as follows:
        </p>
        <ol>
            <li>Image filename</li>
            <li>Annotation ID</li>
            <li>Annotation shape name</li>
            <li>X-Coordinate(s) of the annotation (may span multiple lines)</li>
            <li>Y-Coordinate(s) of the annotation (may span multiple lines)</li>
            <li>Labels of the annotation in a comma separated list</li>
            <li>The area of the image in m² if available</li>
        </ol>
        <p>
            For the different annotation shapes, the coordinates are interpreted as follows:
        </p>
        <ul>
            <li>
                <strong>Point:</strong> The x and y coordinates are the location of the point on the image.
            </li>
            <li>
                <strong>Rectangle:</strong> Each line contains the x and y coordinates of one of the four vertices describing the rectangle.
            </li>
            <li>
                <strong>Circle:</strong> The first line contains the x and y coordinates of the center of the circle. The x value of the second line is the radius of the circle.
            </li>
            <li>
                <strong>Line string:</strong> Each line contains the x and y coordinates of one of the vertices describing the line string.
            </li>
            <li>
                <strong>Polygon:</strong> Each line contains the x and y coordinates of one of the vertices describing the polygon.
            </li>
        </ul>

        <h4><a name="annotation-csv-report"></a>CSV</h4>
        <p>
            The CSV report is intended for subsequent processing. If you want the data in a machine readable format, choose this report. The report is a ZIP archive, containing a CSV file for each transect of the project. Each CSV file name consists of the transect ID and the transect name (cleaned up so it can be a file name) separated by an underscore.
        </p>
        <p>
            The CSV files contains one row for each annotation label. Since an annotation can have multiple labels, there may be multiple rows for a single annotation. The columns are as follows:
        </p>
        <ol>
            <li>Annotation label ID (not the annotation ID)</li>
            <li>Label ID</li>
            <li>Label name</li>
            <li>ID of the user who created/attached the annotation label</li>
            <li>User firstname</li>
            <li>User lastname</li>
            <li>Image ID</li>
            <li>Image filename</li>
            <li>Annotation shape ID</li>
            <li>Annotation shape name</li>
            <li>Annotation points</li>
            <li>Additional attributes of the image</li>
        </ol>
        <p>
            The annotation points are encoded as a JSON array of alternating x and y values (e.g. <code>[x1,y1,x2,y2,...]</code>). For circles, the third value of the points array is the radius of the circle.
        </p>
        <p>
            The additional attributes of the image are encoded as a JSON object. The content may vary depending on the DIAS modules that are installed and the operations performed on the image (e.g. a laserpoint detection to calculate the area of an image).
        </p>

        <h3>Image label report</h3>
        <h4>Basic</h4>
        <p>
            The basic image label report is an XLSX spreadsheet similar to the <a href="#annotation-extended-report">extended annotation report</a>. It contains a list of all labels attached to each image of a transect. The columns are as follows:
        </p>
        <ol>
            <li>Image ID</li>
            <li>Image filename</li>
            <li>Comma separated list of label names</li>
        </ol>

        <h4>CSV</h4>
        <p>
            The CSV report is similar to the <a href="#annotation-csv-report">annotation CSV report</a>. If you want the data in a machine readable format, choose this report.
        </p>
        <p>
            The CSV files contains one row for each image label. Since an image can have multiple different labels, there may be multiple rows for a single image. The columns are as follows:
        </p>
        <ol>
            <li>Image label ID</li>
            <li>Image ID</li>
            <li>Image filename</li>
            <li>ID of the user who attached the image label</li>
            <li>User firstname</li>
            <li>User lastname</li>
            <li>Label ID</li>
            <li>Label name</li>
        </ol>
    </div>
@endsection
