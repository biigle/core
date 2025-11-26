@extends('manual.base')

@section('manual-title') Reports schema @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            A description of the file formats of the different available reports.
        </p>
        <h3>Project and volume reports</h3>
        <p>
            Most report types can be requested for a whole project as well as for individual volumes. A project report is a convenience feature which requests reports for all individual volumes of the project at once and provides a ZIP file containing the volume reports for download. However, not all configuration options may be available for project reports.
        </p>
        <p>
            The following sections describe the different types of volume reports but, per definition, apply for project reports as well.
        </p>

        <div class="row">
            <div class="col-xs-6">
                <strong><a href="#image-annotation-reports">Image annotation reports</a></strong>
                <ul>
                    <li><a href="#annotation-abundance-report">Abundance</a></li>
                    <li><a href="#annotation-location-report">AnnotationLocation</a></li>
                    <li><a href="#annotation-area-report">Area</a></li>
                    <li><a href="#annotation-basic-report">Basic</a></li>
                    <li><a href="#annotation-csv-report">CSV</a></li>
                    <li><a href="#annotation-extended-report">Extended</a></li>
                    <li><a href="#annotation-coco-report">Coco</a></li>
                    <li><a href="#annotation-yolo-report">YOLO</a></li>
                    <li><a href="#annotation-full-report">Full</a></li>
                    <li><a href="#annotation-image-location-report">ImageLocation</a></li>
                </ul>
                <strong><a href="#image-label-reports">Image label reports</a></strong>
                <ul>
                    <li><a href="#image-label-basic-report">Basic</a></li>
                    <li><a href="#image-label-csv-report">CSV</a></li>
                    <li><a href="#image-label-image-location-report">ImageLocation</a></li>
                </ul>
            </div>
            <div class="col-xs-6">
                <strong><a href="#video-annotation-reports">Video annotation reports</a></strong>
                <ul>
                    <li><a href="#video-annotation-csv-report">CSV</a></li>
                </ul>
                <strong><a href="#video-label-reports">Video label reports</a></strong>
                <ul>
                    <li><a href="#video-label-csv-report">CSV</a></li>
                </ul>
                <strong><a href="#ifdo-reports">iFDO reports</a></strong>
            </div>
        </div>


        <h3><a name="image-annotation-reports"></a>Image annotation reports</h3>
        <h4><a name="annotation-abundance-report"></a>Abundance</h4>

        <p>
            Similar to the extended report, this report is an XLSX spreadsheet that contains the abundances of each label and image. In this report, there is one row for each image and one column for each used label. If the annotations should be separated by label tree or user, there will be one worksheet for each label tree or user that was used.
        </p>
        <p>
            For a single worksheet (not separated by label tree or user) the first line contains the volume name. For multiple worksheets the first lines contain the name of the respective label tree or user. The second line always contains the column headers. The columns are as follows:
        </p>
        <ol>
            <li><strong>Image filename</strong></li>
            <li>label name 1</li>
            <li>label name 2</li>
            <li>...</li>
        </ol>

        <p>
            If "aggregate child labels" was enabled for this report, the abundances of all child labels will be added to the abundance of the highest parent label and the child labels will be excluded from the report.
        </p>

        <p>
            If "all labels" was enabled for this report, all labels available to the volume will be included in the report, even if there are no annotations with these labels. This option is incompatible with the "restrict to newest label", "aggregate child labels" and "restrict to labels" options, which cannot be active at the same time.
        </p>

        <h4><a name="annotation-location-report"></a>AnnotationLocation</h4>

        <p>
            The image annotation annotation location report is a newline delimited <a href="https://geojson.org/">GeoJSON</a> file that contains the estimated positions of image annotations on a world map. This report can be used to import annotations in a GIS software such as <a href="https://www.qgis.org">QGIS</a>. You can find a description of how to import and use a GeoJSON report in QGIS <a href="{{route('manual-tutorials', ['reports', 'image-location-reports'])}}">here</a>.
        </p>

        <p>
            The annotation position estimation is based on several assumptions. You can find a detailed description <a href="{{route('manual-tutorials', ['reports', 'annotation-location-reports'])}}">here</a>.
        </p>

        <p>
            The report contains one GeoJSON feature for each annotation label. This means that there may be multiple features for a single annotation if the annotation has multiple labels attached. The following properties are included for each feature:
        </p>
        <ul>
            <li><strong>_id</strong><br>The annotation label ID (unique for a GeoJSON feature).</li>
            <li><strong>_image_id</strong><br>The ID of the image to which the annotation belongs.</li>
            <li><strong>_image_filename</strong><br>The filename of the image to which the annotation belongs.</li>
            <li><strong>_image_latitude</strong><br>The latitude coordinate of the image to which the annotation belongs.</li>
            <li><strong>_image_longitude</strong><br>The longitude coordinate of the image to which the annotation belongs.</li>
            <li><strong>_label_name</strong><br>The name of the label that belongs to the annotation label.</li>
            <li><strong>_label_id</strong><br>The ID of the label that belongs to the annotation label.</li>
        </ul>

        <div class="panel panel-warning">
            <div class="panel-body text-warning">
                The GeoJSON format does not support circle features. Circle annotations are converted to point features in this report.
            </div>
        </div>

        <h4><a name="annotation-area-report"></a>Area</h4>

        <p>
            The image annotation area report is an XLSX spreadsheet of all area annotations (rectangle, circle, ellipse and polygon) with their width and height in pixels (px) and their area in px². Line string annotations are included, too, with the "width" set to the total length of the line string. If a laser point detection was performed, the width and height in m and the area in m² is included as well.
        </p>
        <div class="panel panel-warning">
            <div class="panel-body text-warning">
                The computed area of self-intersecting polygons like these will not be correct!
                <svg style="width:100px;margin:5px auto -5px;display:block;" xmlns="http://www.w3.org/2000/svg" width="100px" height="50px" viewBox="0 0 100 50" xmlns:svg="http://www.w3.org/2000/svg">
                    <polygon stroke="#f2b866" stroke-width="2" points="10,10 10,40 90,10 90,40" fill="rgba(255, 255, 255, 0.25)"></polygon>
                    <circle cx="10" cy="10" r="3" fill="#f2b866" />
                    <circle cx="10" cy="40" r="3" fill="#f2b866" />
                    <circle cx="90" cy="10" r="3" fill="#f2b866" />
                    <circle cx="90" cy="40" r="3" fill="#f2b866" />
                </svg>
            </div>
        </div>
        <p>
            For a single worksheet (not separated by label tree or user) the first line contains the volume name. For multiple worksheets the first lines contain the name of the respective label tree or user. The second line always contains the column headers. The columns are as follows:
        </p>
        <ol>
            <li><strong>Annotation ID</strong></li>
            <li><strong>Annotation shape ID</strong></li>
            <li><strong>Annotation shape name</strong></li>
            <li><strong>Label IDs</strong> comma separated list of IDs of all labels that are attached to the annotation</li>
            <li><strong>Label names</strong> comma separated list of names of all labels that are attached to the annotation</li>
            <li><strong>Image ID</strong></li>
            <li><strong>Image filename</strong></li>
            <li><strong>Annotation width (m)</strong> Rectangle: the longer edge. Circle: the diameter. Ellipse: Length of the major axis. Polygon: width of the minimum (non-rotated) bounding rectangle. Line string: total length.</li>
            <li><strong>Annotation height (m)</strong> Rectangle: the shorter edge. Circle: the diameter. Ellipse: Length of the minor axis. Polygon: height of the minimum (non-rotated) bounding rectangle. Line string: always 0.</li>
            <li><strong>Annotation area (m²)</strong></li>
            <li><strong>Annotation width (px)</strong> See the width in m for the interpretation of this value for different shapes.</li>
            <li><strong>Annotation height (px)</strong> See the height in m for the interpretation of this value for different shapes.</li>
            <li><strong>Annotation area (px²)</strong></li>
        </ol>

        <h4><a name="annotation-basic-report"></a>Basic</h4>
        <p>
            The basic image annotation report contains a graphical plot of abundances of the different annotation labels (annotations can have multiple labels by different users). If the annotations should be separated by label tree or user, there will be one plot for each label tree or user.
        </p>
        <p>
            Example plot:
            <figure>
                <a href="{{asset('assets/images/manual/reports/demo_basic_plot.png')}}">
                    <img src="{{asset('assets/images/manual/reports/demo_basic_plot.png')}}" style="max-width: 100%;">
                </a>
            </figure>
        </p>
        <p>
            The bars of the plot are color-coded based on the colors of the labels they represent. If any label occurs more than a hundred times, a logarithmic scale is applied.
        </p>

        <h4><a name="annotation-csv-report"></a>CSV</h4>
        <p>
            The CSV report is intended for subsequent processing. If you want the data in a machine readable format, choose this report. The report is a ZIP archive, containing a CSV file. The CSV file name consists of the volume ID and the volume name (cleaned up so it can be a file name) separated by an underscore. If the image annotations should be separated by label tree or user, there will be one CSV file for each label tree or user and the CSV file name will consist of the label tree or user ID and name instead.
        </p>
        <p>
            Each CSV file contains one row for each annotation label. Since an annotation can have multiple labels, there may be multiple rows for a single annotation. The first row always contains the column headers. The columns are as follows:
        </p>
        <ol>
            <li><strong>Annotation label ID</strong> (not the annotation ID)</li>
            <li><strong>Label ID</strong></li>
            <li><strong>Label name</strong></li>
            <li><strong>Label hierarchy</strong> (see the <a href="#annotation-extended-report">extended report</a> on how to interpret a label hierarchy)</li>
            <li><strong>ID of the user who created/attached the annotation label</strong></li>
            <li><strong>User firstname</strong></li>
            <li><strong>User lastname</strong></li>
            <li><strong>Image ID</strong></li>
            <li><strong>Image filename</strong></li>
            <li><strong>Image longitude</strong></li>
            <li><strong>Image latitude</strong></li>
            <li><strong>Annotation shape ID</strong></li>
            <li><strong>Annotation shape name</strong></li>
            <li>
                <strong>Annotation points</strong>
                <p>
                    The annotation points are encoded as a JSON array of alternating x and y values (e.g. <code>[x1,y1,x2,y2,...]</code>). For circles, the third value of the points array is the radius of the circle.
                </p>
            </li>
            <li>
                <strong>Additional attributes of the image</strong>
                <p>
                    The additional attributes of the image are encoded as a JSON object. The content may vary depending on the BIIGLE modules that are installed and the operations performed on the image (e.g. a laser point detection to calculate the area of an image).
                </p>
            </li>
            <li><strong>Annotation ID</strong></li>
            <li><strong>Creation date (of the annotation label)</strong></li>
        </ol>

        <h4><a name="annotation-extended-report"></a>Extended</h4>

        <p>
            The extended image annotation report is an XLSX spreadsheet which contains a list of the abundances of each label and image. If the annotations should be separated by label tree or user, there will be one worksheet for each label tree or user.
        </p>
        <p>
            For a single worksheet (not separated by label tree or user) the first line contains the volume name. For multiple worksheets the first lines contain the name of the respective label tree or user. The second line always contains the column headers. The columns are as follows:
        </p>
        <ol>
            <li><strong>Image filename</strong></li>
            <li>
                <strong>Label hierarchy</strong>
                <p>
                    The label hierarchy contains all label names from the root label to the child label, separated by a <code>&gt;</code>. If we have the following label tree:
<pre>
Animalia
└─ Annelida
   └─ Polychaeta
      └─ Buskiella sp
</pre>
                    Then the content of the "label hierarchy" column for annotations with the label "Buskiella sp" will be <code>Animalia > Annelida > Polychaeta > Buskiella sp</code>.
                </p>
            </li>
            <li><strong>Label abundance</strong></li>
        </ol>

        <h4><a name="annotation-coco-report"></a>Coco</h4>
        <p>
            The Coco file format is a common format for machine learning applications. The data is stored in a JSON file, which is readable by most deep learning frameworks. For more information please have a look at <a href="https://towardsdatascience.com/how-to-work-with-object-detection-datasets-in-coco-format-9bf4fb5848a4" target="_blank">this article</a>. Point annotations are incompatible and will not be included in this report. All remaining annotations will be transformed to polygons which might cause slight changes in their appearance.
        </p>

        <h4><a name="annotation-yolo-report"></a>YOLO</h4>
        <p>
            The YOLO file format is a standard format for training object detection models (e.g., YOLOv5, YOLOv8, YOLO11). The data is organized into a directory structure with images and text files containing normalized bounding box coordinates. This report generates a ZIP file containing the dataset split into train, validation, and test sets, along with a <code>data.yaml</code> configuration file. Point annotations are incompatible and will not be included in this report. All remaining annotations will be converted to bounding boxes.
        </p>
        <p>
            You can optionally provide a local path to the images on your hard drive. If provided, the report will create symlinks to the images in the generated directory structure, allowing you to use the dataset without duplicating the image files. If no local path is provided, you must manually move or copy the images into the respective <code>images/train</code>, <code>images/val</code>, and <code>images/test</code> directories to match the structure below.
        </p>
        <p>
            The generated ZIP file has the following structure:
<pre>
data.yaml
classes.txt
README.txt
images/
├─ train/
│  ├─ image1.jpg
│  └─ ...
├─ val/
│  └─ ...
└─ test/
   └─ ...
labels/
├─ train/
│  ├─ image1.txt
│  └─ ...
├─ val/
│  └─ ...
└─ test/
   └─ ...
</pre>
        </p>

        <h4><a name="annotation-full-report"></a>Full</h4>

        <p>
            The full image annotation report is an XLSX spreadsheet similar to the <a href="#annotation-extended-report">extended report</a>. It contains a list of all annotations and their labels.
        </p>
        <p>
            The columns are as follows:
        </p>
        <ol>
            <li><strong>Image filename</strong></li>
            <li><strong>Annotation ID</strong></li>
            <li><strong>Annotation shape name</strong></li>
            <li><strong>X-Coordinate(s) of the annotation</strong> (may span multiple lines)</li>
            <li><strong>Y-Coordinate(s) of the annotation</strong> (may span multiple lines)</li>
            <li><strong>Comma separated list of label hierarchies</strong> (see the <a href="#annotation-extended-report">extended report</a> on how to interpret a label hierarchy)</li>
            <li><strong>The area of the image</strong> in m² if available</li>
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
                <strong>Ellipse:</strong> Similar to the rectangle. The first two vertices are the end points of the major axis. The next two vertices are the end points of the minor axis.
            </li>
            <li>
                <strong>Line string:</strong> Each line contains the x and y coordinates of one of the vertices describing the line string.
            </li>
            <li>
                <strong>Polygon:</strong> Each line contains the x and y coordinates of one of the vertices describing the polygon.
            </li>
        </ul>

        <h4><a name="annotation-image-location-report"></a>ImageLocation</h4>

        <p>
            The image annotation image location report is a newline delimited <a href="https://geojson.org/">GeoJSON</a> file that contains image positions as points on a world map. This report can be used to import image positions in a GIS software such as <a href="https://www.qgis.org">QGIS</a>. You can find a description of how to import and use a GeoJSON report in QGIS <a href="{{route('manual-tutorials', ['reports', 'image-location-reports'])}}">here</a>.
        </p>

        <p>
            The report contains one GeoJSON feature for each image. The following properties are included for each feature:
        </p>
        <ul>
            <li><strong>_id</strong><br>The image ID (unique for a GeoJSON feature).</li>
            <li><strong>_filename</strong><br>The filename of the image.</li>
            <li>Additional properties list the number of annotations with a certain label for each image. The format of the property title is "<strong>label_name (#label_id)</strong>"</li>
        </ul>

        <h3><a name="image-label-reports"></a>Image label reports</h3>
        <h4><a name="image-label-basic-report"></a>Basic</h4>
        <p>
            The basic image label report is an XLSX spreadsheet similar to the <a href="#annotation-extended-report">extended annotation report</a>. It contains a list of all labels attached to each image of the volume. The columns are as follows:
        </p>
        <ol>
            <li><strong>Image ID</strong></li>
            <li><strong>Image filename</strong></li>
            <li><strong>Comma separated list of label hierarchies</strong> (see the <a href="#annotation-extended-report">extended annotation report</a> on how to interpret a label hierarchy)</li>
        </ol>

        <h4><a name="image-label-csv-report"></a>CSV</h4>
        <p>
            The CSV report is similar to the <a href="#annotation-csv-report">annotation CSV report</a>. If you want the data in a machine readable format, choose this report.
        </p>
        <p>
            Each CSV file contains one row for each image label. Since an image can have multiple different labels, there may be multiple rows for a single image. The columns are as follows:
        </p>
        <ol>
            <li><strong>Image label ID</strong></li>
            <li><strong>Image ID</strong></li>
            <li><strong>Image filename</strong></li>
            <li><strong>Image longitude</strong></li>
            <li><strong>Image latitude</strong></li>
            <li><strong>ID of the user who attached the image label</strong></li>
            <li><strong>User firstname</strong></li>
            <li><strong>User lastname</strong></li>
            <li><strong>Label ID</strong></li>
            <li><strong>Label name</strong></li>
            <li><strong>Label hierarchy</strong> (see the <a href="#annotation-extended-report">extended annotation report</a> on how to interpret a label hierarchy)</li>
            <li><strong>Creation date</strong></li>
        </ol>

        <h4><a name="image-label-image-location-report"></a>ImageLocation</h4>

        <p>
            The image label image location report is a newline delimited <a href="https://geojson.org/">GeoJSON</a> file that contains image positions as points on a world map. This report can be used to import image positions in a GIS software such as <a href="https://www.qgis.org">QGIS</a>. You can find a description of how to import and use a GeoJSON report in QGIS <a href="{{route('manual-tutorials', ['reports', 'image-location-reports'])}}">here</a>.
        </p>

        <p>
            The report contains one GeoJSON feature for each image. The following properties are included for each feature:
        </p>
        <ul>
            <li><strong>_id</strong><br>The image ID (unique for a GeoJSON feature).</li>
            <li><strong>_filename</strong><br>The filename of the image.</li>
            <li>Additional properties list the image labels that have been used in the volume and whether a label was attached to an image (<code>1</code>) or not (<code>0</code>). The format of the property title is "<strong>label_name (#label_id)</strong>"</li>
        </ul>

        <h3><a name="video-annotation-reports"></a>Video annotation reports</h3>
        <h4><a name="video-annotation-csv-report"></a>CSV</h4>
        <p>
            The CSV report is similar to the <a href="#annotation-csv-report">annotation CSV report</a>.
        </p>
        <p>
            Each CSV file contains one row for each video annotation label. Since a video annotation can have multiple different labels, there may be multiple rows for a single video annotation. The columns are as follows:
        </p>
        <ol>
            <li><strong>Video annotation label ID</strong> (not the video annotation ID)</li>
            <li><strong>Label ID</strong></li>
            <li><strong>Label name</strong></li>
            <li><strong>Label hierarchy</strong> (see the <a href="#annotation-extended-report">extended report</a> on how to interpret a label hierarchy)</li>
            <li><strong>ID of the user who created/attached the video annotation label</strong></li>
            <li><strong>User firstname</strong></li>
            <li><strong>User lastname</strong></li>
            <li><strong>Video ID</strong></li>
            <li><strong>Video filename</strong></li>
            <li><strong>Video annotation shape ID</strong></li>
            <li><strong>Video annotation shape name</strong></li>
            <li>
                <strong>Video annotation points</strong>
                <p>
                    The video annotation points are encoded as nested JSON arrays of alternating x and y values (e.g. <code>[[x11,y11,x12,y12,...],[x21,y21,...],...]</code>). Each array describes the video annotation for a specific key frame (time). For circles, the third value of the points array is the radius of the circle. An empty array means there is a gap in the video annotation.
                </p>
            </li>
            <li>
                <strong>Video annotation key frames</strong>
                <p>
                    The key frames are encoded as a JSON array. Each key frame represents a time in seconds that corresponds to the ponts array at the same index. <code>null</code> means there is a gap in the video annotation.
                </p>
            </li>
            <li><strong>Video annotation ID</strong></li>
            <li><strong>Creation date (of the video annotation label)</strong></li>
            <li>
                <strong>Additional attributes of the video</strong>
                <p>
                    The additional attributes of the video are encoded as a JSON object. The content may vary depending on the BIIGLE modules that are installed and the available metadata for the video. (e.g. MIME type, size, width and height).
                </p>
            </li>
        </ol>

        <h3><a name="video-label-reports"></a>Video label reports</h3>
        <h4><a name="video-label-csv-report"></a>CSV</h4>
        <p>
            Each CSV file contains one row for each video label. Since a video can have multiple different labels, there may be multiple rows for a single video. The columns are as follows:
        </p>
        <ol>
            <li><strong>Video label ID</strong></li>
            <li><strong>Video ID</strong></li>
            <li><strong>Video filename</strong></li>
            <li><strong>ID of the user who attached the video label</strong></li>
            <li><strong>User firstname</strong></li>
            <li><strong>User lastname</strong></li>
            <li><strong>Label ID</strong></li>
            <li><strong>Label name</strong></li>
            <li><strong>Label hierarchy</strong> (see the <a href="#annotation-extended-report">extended annotation report</a> on how to interpret a label hierarchy)</li>
            <li><strong>Creation date</strong></li>
        </ol>

        <h3><a name="image-ifdo-reports"></a><a name="ifdo-reports"></a>iFDO reports</h3>

        <p>
            iFDO reports can be requested if an <a href="https://marine-imaging.com/fair/ifdos/iFDO-overview">iFDO file</a> has been uploaded for a volume. The iFDO report will be generated as the original file with additional information on the annotations and image/video labels that were created in BIIGLE. Optionally, annotations and image/video labels of the original file can be excluded from the report.
        </p>
    </div>
@endsection
