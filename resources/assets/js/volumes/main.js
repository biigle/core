import './export';
import AnnotationSessionPanel from './annotationSessionPanel';
import CreateForm from './createForm';
import FileCount from './fileCount';
import FilePanel from './filePanel';
import MetadataUpload from './metadataUpload';
import ProjectsBreadcrumb from './projectsBreadcrumb';
import SearchResults from './searchResults';
import VolumeContainer from './volumeContainer';

biigle.$mount('annotation-session-panel', AnnotationSessionPanel);
biigle.$mount('create-volume-form', CreateForm);
biigle.$mount('file-panel', FilePanel);
biigle.$mount('projects-breadcrumb', ProjectsBreadcrumb);
biigle.$mount('search-results', SearchResults);
biigle.$mount('volume-container', VolumeContainer);
biigle.$mount('volume-file-count', FileCount);
biigle.$mount('volume-metadata-upload', MetadataUpload);
