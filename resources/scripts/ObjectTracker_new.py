import sys
import numpy as np
import torch
import cv2
from sam2.build_sam import build_sam2_camera_predictor
import json

if torch.cuda.get_device_properties(0).major >= 8:
    # turn on tfloat32 for Ampere GPUs (https://pytorch.org/docs/stable/notes/cuda.html#tensorfloat-32-tf32-on-ampere-devices)
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True

sam2_checkpoint = sys.argv[3]
model_cfg = "configs/sam2.1/sam2.1_hiera_s.yaml"
predictor = build_sam2_camera_predictor(model_cfg, sam2_checkpoint)

class ObjectTracker(object):
    def __init__(self, params):
        self.video = cv2.VideoCapture(params['video_path'])
        self.fps = self.video.get(cv2.CAP_PROP_FPS)
        self.width = self.video.get(cv2.CAP_PROP_FRAME_WIDTH)
        self.height = self.video.get(cv2.CAP_PROP_FRAME_HEIGHT)
        self.debug = False

        start_frame = round(params['start_time'] * self.fps)
        self.video.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

        self.tracker = build_sam2_camera_predictor(model_cfg, sam2_checkpoint)
        success, frame = self.video.read()
        if not success:
            raise IOError('The video file could not be read: {}'.format(params['video_path']))
        track_window = tuple(map(int, params['start_window']))
        self.track_width, self.track_height = track_window[2], track_window[3]
        track_window = (track_window[0],track_window[1],track_window[0]+track_window[2],track_window[1]+track_window[3])
        # points = np.array([[track_window[0], track_window[1]]], dtype=np.float32)
        # labels = np.array([1], dtype=np.int32)
        self.tracker.load_first_frame(frame)
        if_init = True
        # self.tracker.add_new_prompt(frame_idx=0, obj_id = 1, points=points, labels=labels)
        self.tracker.add_new_prompt(frame_idx=0, obj_id = 1, bbox=track_window)

    def center_out_of_frame(self, center):
        return center[0] <= 1 or center[1] <= 1 or center[0] >= self.width - 1 or center[1] >= self.height - 1

    def __iter__(self):
        return self

    def __del__(self):
        if self.video:
            self.video.release()

        if self.debug:
            cv2.destroyAllWindows()

    def _next(self):
        for n in range(2):
            success, frame = self.video.read()

        if not success:
            raise StopIteration

        (out_obj_ids, mask_logits) = self.tracker.track(frame)
        mask = mask_logits[0] > 0
        coords = np.where(mask[0].detach().cpu().numpy())

        if len(coords[0]) == 0 or len(coords[1]) == 0:
            raise StopIteration
        
        box = (np.min(coords[1]),np.min(coords[0]),np.max(coords[1]),np.max(coords[0]))

        center = ((box[0] + box[2]) * 0.5, (box[1] + box[3]) * 0.5)

        # Updates radius based on tracking mask. If the mask gets larger because of adjacent objects, the radius will grow as well.
        # radius = np.max((np.abs(box[0] - box[2]), np.abs(box[1] - box[3]))) * 0.5

        # Keeps radius of initial annotation
        radius = np.max((self.track_width, self.track_height)) * 0.5

        if not success:
            raise StopIteration

        if self.center_out_of_frame(center):
            raise StopIteration

        current_frame = self.video.get(cv2.CAP_PROP_POS_FRAMES)
        current_time = current_frame / self.fps

        if self.debug:
            x, y, w, h = list(map(int, box))
            cv2.rectangle(frame, (x, y), (x + w, y + h), 255, 2)
            show_frame = cv2.resize(frame, (1024, 768))
            cv2.imshow("frame", show_frame)
            cv2.waitKey(1)

        return (current_time, center[0], center[1], radius)

    def __next__(self):
        return self._next()

    def next(self):
        return self._next()

with open(sys.argv[1]) as f:
    params = json.load(f)

current_keyframe = ()
last_keyframe = ()
keyframe_distance = params['keyframe_distance']
keyframes = []

def keyframes_differ(a, b):
    return np.sqrt(np.square(a[1] - b[1]) + np.square(a[2] - b[2])) > keyframe_distance or abs(a[3] - b[3]) > keyframe_distance

for keyframe in ObjectTracker(params):
    current_keyframe = keyframe
    if not last_keyframe or keyframes_differ(last_keyframe, keyframe):
        last_keyframe = keyframe
        keyframes.append(keyframe)

# Add the last keyframe even if it did not have the right keyframe distance.
if keyframes and keyframes[-1][0] != current_keyframe[0]:
    keyframes.append(current_keyframe)

with open(sys.argv[2], 'w') as f:
    json.dump(keyframes, f)
