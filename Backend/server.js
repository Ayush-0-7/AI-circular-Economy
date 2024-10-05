// server.js (Backend)
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fal = require('@fal-ai/serverless-client');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Adjust CORS settings as needed
app.use(express.json());

// Configure Fal-AI Client
fal.config({
  credentials: process.env.FAL_KEY,
});

// API Endpoint
app.post('/api/proxy', async (req, res) => {
  const {
    prompt,
    image_size = "square_hd",
    sync_mode = true,
    num_images = 1,
    num_inference_steps = 2,
    enable_safety_checker = true,
    expand_prompt = false,
    seed,
  } = req.body;

  const input = {
    prompt,
    image_size,
    sync_mode,
    num_images,
    num_inference_steps,
    enable_safety_checker,
    expand_prompt,
    seed: seed ? Number(seed) : undefined,
  };

  try {
    const result = await fal.subscribe("fal-ai/fast-lightning-sdxl", {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.forEach((log) => {
            console.log(log.message);
          });
        }
      },
    });

    if (result.images && result.images.length > 0) {
      res.json({
        images: result.images,
        prompt: result.prompt,
        timings: result.timings,
        seed: result.seed,
        has_nsfw_concepts: result.has_nsfw_concepts,
      });
    } else {
      res.status(500).json({ error: 'No images returned from Fal-AI API.' });
    }
  } catch (error) {
    console.error('Error generating images:', error);
    res.status(500).json({ error: 'Failed to generate images.' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});
