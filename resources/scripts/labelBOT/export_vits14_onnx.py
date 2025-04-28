import torch
from transformers import Dinov2Model

# Define image size and model size
image_width, image_height = 224, 224
model_size = 'small'  # ViT-S/14

# Load the pre-trained Dinov2Model (ViT-S/14)
dinov2_model = Dinov2Model.from_pretrained(f'facebook/dinov2-{model_size}')
dinov2_model.eval()

# Create a dummy input tensor for exporting the model
dummy_input = torch.randn(1, 3, image_height, image_width)

# Export the model to ONNX format
onnx_model_path = 'dinov2_vits14.onnx'
torch.onnx.export(dinov2_model, dummy_input, onnx_model_path, 
                  input_names=['input'], output_names=['output'])