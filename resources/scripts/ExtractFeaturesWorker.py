from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from PIL import Image, ImageFile
from queue import Queue
from threading import Thread, Event
from torch import device, no_grad
from torch.cuda import is_available as cuda_is_available
from torch.hub import load as hub_load
import io
import json
import torchvision.transforms as T
import traceback

class RequestItem:
    def __init__(self, data, event):
        self.data = data
        self.event = event
        self.result = None  # Placeholder for the result
        self.exception = None

request_queue = Queue()

class RequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        event = Event()
        request_item = RequestItem(io.BytesIO(post_data), event)
        request_queue.put(request_item)

        # Wait for the worker to process this request
        event.wait()

        if request_item.exception is None:
            # Access the result set by the worker
            result = request_item.result
            # Send the result back to the client
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result, separators=(',', ':')).encode())
        else:
            traceback.print_exception(request_item.exception)
            self.send_response(500)
            self.end_headers()

def worker():
    # See: https://stackoverflow.com/a/23575424/1796523
    ImageFile.LOAD_TRUNCATED_IMAGES = True

    dinov2_vits14 = hub_load('facebookresearch/dinov2:main', 'dinov2_vits14')

    if cuda_is_available():
        dev = device('cuda')
        dinov2_vits14 = dinov2_vits14.cuda()
    else:
        dev = device('cpu')

    dinov2_vits14.to(dev)

    transform = T.Compose([
        # Input is expected to be 224x224 already.
        # T.Resize((224, 224), interpolation=T.InterpolationMode.BICUBIC),
        T.ToTensor(),
        T.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ])

    while True:
        request_item = request_queue.get()

        try:
            # The image is expected to arrive as RGB.
            image = Image.open(request_item.data)
            with no_grad():
                image_t = transform(image).unsqueeze(0).to(dev)
                features = dinov2_vits14(image_t)
            request_item.result = features[0].tolist()
        except Exception as e:
            request_item.exception = e

        # Signal that the request has been processed
        request_item.event.set()
        request_queue.task_done()

if __name__ == '__main__':
    worker_thread = Thread(target=worker, daemon=True)
    worker_thread.start()

    # worker_thread = Thread(target=worker, daemon=True)
    # worker_thread.start()

    server_address = ('', 80)
    httpd = ThreadingHTTPServer(server_address, RequestHandler)
    print("Starting server on port 80")
    httpd.serve_forever()
