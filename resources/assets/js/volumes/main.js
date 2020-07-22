import './export';
import AnnotationSessionPanel from './annotationSessionPanel';
import CreateForm from './createForm';
import FileCount from './fileCount';
import ImagePanel from './imagePanel';
import MetadataUpload from './metadataUpload';
import SearchResults from './searchResults';
import VolumeContainer from './volumeContainer';

biigle.$mount('annotation-session-panel', AnnotationSessionPanel);
biigle.$mount('create-volume-form', CreateForm);
biigle.$mount('file-count', FileCount);
biigle.$mount('image-panel', ImagePanel);
biigle.$mount('search-results', SearchResults);
biigle.$mount('volume-container', VolumeContainer);
biigle.$mount('volume-metadata-upload', MetadataUpload);
