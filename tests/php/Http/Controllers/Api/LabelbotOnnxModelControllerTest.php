<?php

class LabelbotOnnxModelControllerTest extends ApiTestCase
{
    public function testStream()
    {
        $this->doTestApiRoute('GET', '/api/v1/labelbot-onnx-model');
        $this->beUser();

        $response = $this->get('/api/v1/labelbot-onnx-model')
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/octet-stream')
            ->assertHeader('content-disposition', 'attachment; filename="model.onnx"');

        // File not found
        config(['labelbot.onnx_url' => 'http://wrong/path/to/model.onnx']);
        $errorResponse = $this->get('/api/v1/labelbot-onnx-model')
            ->assertStatus(404);
    }
}
