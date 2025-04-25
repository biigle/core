# DINOv2 Model ONNX Export Script

This Python script is used to export a pre-trained DINOv2 Vision Transformer model (`ViT-S/14`) to the ONNX format. After exporting the model, place it in the public/assets directory to serve it correctly. Alternatively, you can change the onnx_file variable in the labelbot config to point to the location of the exported model.

## Requirements

To use this script, make sure the following libraries are installed in your environment:

- `torch`
- `transformers`
- `onnx`

You can install the required libraries by running:
```bash
pip install -r requirements.txt