<div class="help-block" v-if="wantsCombination('ImageAnnotations', 'Basic')">
    The basic image annotation report contains graphical plots of abundances of the different annotation labels (as PDF). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-basic-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('ImageAnnotations', 'Extended')">
    The extended image annotation report lists the abundances of annotation labels for each image and label (as XLSX). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-extended-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('ImageAnnotations', 'Coco')">
    The Coco image annotation report lists all annotations as (approximated polygons). Point annotations will not be included. See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-coco-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('ImageAnnotations', 'Abundance')">
    The abundance image annotation report lists the abundances of annotation labels for each image (as XLSX). Abundances can be aggregated to parent labels. See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-abundance-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('ImageAnnotations', 'Full')">
    The full image annotation report lists the labels, shape and coordinates of all annotations (as XLSX). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-full-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('ImageAnnotations', 'Csv')">
    The CSV image annotation report is intended for subsequent processing and lists the annotation labels at the highest possible resolution (as CSV files in a ZIP archive). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-csv-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('ImageAnnotations', 'Area')">
    The image annotation area report lists all rectangle, circle, ellipse or polygon annotations with their dimensions and area in pixels (as XLSX). If a laser point detection was performed, the dimensions in m and area in m² is included, too. See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-area-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('ImageAnnotations', 'AnnotationLocation')">
    The image annotation annotation location report returns the estimated annotation positions on a world map in the newline delimited GeoJSON format. See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-location-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('ImageAnnotations', 'ImageLocation')">
    The image annotation image location report returns the image positions as points on a world map in the newline delimited GeoJSON format. See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#annotation-image-location-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('ImageLabels', 'Basic')">
    The basic image label report lists the image labels of all images (as XLSX). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#image-label-basic-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('ImageLabels', 'Csv')">
    The CSV image label report is intended for subsequent processing and lists the image labels at the highest possible resolution (as CSV files in a ZIP archive). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#image-label-csv-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('ImageLabels', 'ImageLocation')">
    The image label image location report returns the image positions as points on a world map in the newline delimited GeoJSON format. See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#image-label-image-location-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('VideoAnnotations', 'Csv')">
    The CSV video annotation report is intended for subsequent processing and lists the video annotation labels at the highest possible resolution (as CSV files in a ZIP archive). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#video-annotation-csv-report">report schema</a>.
</div>
<div class="help-block" v-cloak v-if="wantsCombination('VideoLabels', 'Csv')">
    The CSV video label report lists the video labels at the highest possible resolution (as CSV files in a ZIP archive). See the manual for the <a target="_blank" href="{{route('manual-tutorials', ['reports', 'reports-schema'])}}#video-label-csv-report">report schema</a>.
</div>
<div class="help-block" v-if="wantsCombination('ImageIfdo', '')">
    The iFDO report returns the iFDO file that was attached to a volume with added information about annotations and image labels. See the <a target="_blank" href="https://www.marine-imaging.com/fair/ifdos/iFDO-overview">iFDO specification for more information</a>.
</div>
