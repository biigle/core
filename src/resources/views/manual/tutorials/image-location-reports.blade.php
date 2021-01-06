@extends('manual.base')

@section('manual-title') Image location reports @stop

@section('manual-content')
    <div class="row">
        <p class="lead">
            A detailed description of image location reports with a short introduction to QGIS.
        </p>
        <p>
            Image location reports contain image positions as points on a world map. The report file format is newline delimited <a href="https://geojson.org/">GeoJSON</a> which can be imported in a GIS software such as <a href="https://www.qgis.org">QGIS</a>.
        </p>

        <p>
            The image location reports require image metadata for latitude and longitude coordinates which are either automatically obtained by BIIGLE or manually provided. BIIGLE expects these coordinates to be provided in the <a href="https://epsg.io/4326">EPSG:4326</a> coordinate reference system. Read more on image metadata <a href="{{route('manual-tutorials', ['volumes', 'image-metadata'])}}">here</a>.
        </p>

        <p>
            Each report includes information on annotation or image labels for each image as properties of a GeoJSON feature. These properties can be used to filter or style the feature display in a GIS. Below you can find some examples using <a href="https://www.qgis.org">QGIS</a> version 3.10.
        </p>

        <h3><a name="import-geojson-in-qgis"></a>Import GeoJSON in QGIS</h3>

        <p>
            To import an image location report in QGIS, add it as a new vector layer. Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> to open the data source manager for a new vector layer. There, select "File" as source type, "Automatic" as encoding and choose the <code>.ndjson</code> report file as source below. Finally, click on the "Add" button.
        </p>

        <p>
            Now the image locations appear as a new layer in the layers list. Next, you have to make sure that the vector features are displayed with the correct coordinate reference system. Right click on the layer and select "Set CRS" > "Set Layer CRS". There, choose the EPSG:4326 CRS.
        </p>

        <p>
            Image location reports contain additional properties or attributes for each image. To view these attributes, select "Open Attribute Table" in the right click menu of the vector layer.
        </p>

        <h3><a name="filter-annotation-image-location-report"></a>Filter an annotation image location report</h3>

        <p>
            The annotation image location report contains information on the number of annotations with a certain label that belong to a certain image. This information can be used to filter the vector features that represent the images in the GIS. Here is how to enable a filtering for the following example query: "Show all positions for images that contain at least one annotations with the label Sponge".
        </p>

        <p>
            To create a new filtering, right click on the vector layer and select "Filter...", which will open the Query Builder window. There you can see the list of available fields on the left. In this case, the fields will include a list of the labels that have been used throughout the volume. in our example, this list should also include the "Sponge" label, which we select with a double click. Now we choose the ">" operator from the list of available operators below. Finally, we add "0" to the existing query, which should now look similar to this:
        </p>
        <pre>"Sponge (#6427)" > 0</pre>
        <p>
            You can test if your filter query is correct with a click on the "Test" button. If everything is well, click "OK" to enable the new filtering.
        </p>
        <p>
            If you apply one ore more filter rules like in the example above, you can reproduce the behavior of the <a href="{{route('manual-tutorials', ['geo', 'volume-map'])}}">image volume map</a> in the GIS. However, the GIS query builder is much more powerful.
        </p>

        <h3><a name="style-annotation-image-location-report"></a>Style an annotation image location report</h3>

        <p>
            The annotation count information of the annotation image location report can also be used to adjust the style of the vector features that represent the image positions. By default, the features are displayed as circle markers. Here is how you can adjust the size and/or color of the markers based on the annotation count.
        </p>

        <h4><a name="adjust-the-size"></a>Adjust the size</h4>

        <p>
            To adjust the size of the circle markers, select "Properties..." in the right click menu of the vector layer. This will open the Layer Properties dialog. There, choose "Symbology" in the sidebar on the left. Here, select the "Simple marker" at the top. Now you can edit the style of the marker. To enable a dynamic size, click on the context menu icon at the right of the "Size" form field and choose "Assistant...".
        </p>

        <p>
            In the marker size assistant window, choose the label on which the marker size should be based from the "Source" dropdown input (e.g. "Sponge (#6427)" from the example above). Now click on the "Fetch value range from layer" button at the right of the "Values from ... to" input fields to automatically determine the value range. Finally, click "OK" and then "Apply" to apply the new style.
        </p>

        <h4><a name="adjust-the-color"></a>Adjust the color</h4>

        <p>
            Adjusting the color of the circle markers is very similar to adjusting the size. Instead of the marker size assistant, you open the marker fill color assistant in the layer properties dialog. There, choose the source and value range in the same way than described above. Finally, click "OK" and then "Apply" to apply the new style.
        </p>

        <h3><a name="filter-image-label-image-location-report"></a>Filter an image label image location report</h3>

        <p>
            Filtering of an image label image location report is done in the same way than filtering of an <a href="#filter-annotation-image-location-report">image annotation image location report</a>. However, the image label report contains different properties for each image. In this report the properties of an image specify whether a certain label is attached to the image or not. A property is <code>1</code> if a label is attached and <code>0</code> of it is not attached. This can be used to filter the vector features to display only those positions of images that have (or don't have) a specific label attached. For example, a query to show only positions of images that do not have the "Unusable" label attached may look like this:
        </p>
        <pre>"Unusable (#1337)" != 1</pre>
    </div>
@endsection
