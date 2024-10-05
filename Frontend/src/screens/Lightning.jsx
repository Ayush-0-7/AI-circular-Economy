import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Lightning.css'; // Ensure this file contains the necessary styles
import { fetchRawMaterials } from './Gemini'; // Import the fetchRawMaterials function

const DEFAULT_PROMPT = "A cinematic shot of a baby raccoon wearing an intricate Italian priest robe";

const INPUT_DEFAULTS = {
  enable_safety_checker: true,
  image_size: "square_hd",
  sync_mode: true,
  num_images: 1, // Default to 1, can be changed by user
  expand_prompt: false,
  num_inference_steps: 2,
};

function randomSeed() {
  return Math.floor(Math.random() * 10000000).toFixed(0);
}

const Lightning = () => {
  const [images, setImages] = useState([]); // Array for multiple images
  const [selectedImage, setSelectedImage] = useState(null); // State for the selected image
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [seed, setSeed] = useState(randomSeed());
  const [inferenceTime, setInferenceTime] = useState(null);
  const [numImages, setNumImages] = useState(INPUT_DEFAULTS.num_images); // New state for number of images
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawMaterials, setRawMaterials] = useState(null); // Change to hold a single object

  // Function to call the API
  const generateImage = async (prompt, seed, numImages) => {
    const input = {
      ...INPUT_DEFAULTS,
      prompt,
      seed: seed ? Number(seed) : Number(randomSeed()),
      num_images: numImages, // Set number of images based on user input
    };

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('https://ai-circular-economy.vercel.app/api/proxy', input); // Proxy set in frontend's package.json

      if (response.data && response.data.images && response.data.images.length > 0) {
        const imageUrls = response.data.images.map((img) => img.url); // Extract all image URLs
        setImages(imageUrls);
        setInferenceTime(response.data.timings ? response.data.timings.inference : null);
      } else {
        setError('No images returned from the server.');
        setImages([]); // Clear images if none returned
      }
    } catch (err) {
      console.error('Error generating images:', err);
      setError('Failed to generate images.');
      setImages([]); // Clear images on error
    } finally {
      setLoading(false);
    }
  };

  // Handle image click to select/deselect it
  const handleImageClick = (imgUrl) => {
    setSelectedImage((prevSelected) => (prevSelected === imgUrl ? null : imgUrl));
  };

  const handlePromptChange = (newPrompt) => {
    setPrompt(newPrompt);
    generateImage(newPrompt, seed, numImages);
  };

  const handleSeedChange = (newSeed) => {
    setSeed(newSeed);
    generateImage(prompt, newSeed, numImages);
  };

  const handleNumImagesChange = (newNumImages) => {
    const num = Number(newNumImages);
    if (num >= 1 && num <= 10) { // Limit number of images for practicality
      setNumImages(num);
      generateImage(prompt, seed, num);
    } else {
      alert('Please enter a number between 1 and 10.');
    }
  };

  const incrementNumImages = () => {
    if (numImages < 10) {
      setNumImages(numImages + 1);
      generateImage(prompt, seed, numImages + 1);
    }
  };

  const decrementNumImages = () => {
    if (numImages > 1) {
      setNumImages(numImages - 1);
      generateImage(prompt, seed, numImages - 1);
    }
  };

  // Function to handle raw material generation
  const handleGenerateRawMaterial = async () => {
    if (selectedImage) {
      try {
        const rawMaterialData = await fetchRawMaterials(prompt);

        // Clean the response by removing ``` and 'json' from the result
        const cleanedData = rawMaterialData.replace(/```|json/g, '');

        // Parse the cleaned string to JSON
        const parsedData = JSON.parse(cleanedData);

        setRawMaterials(parsedData); // Set the response data to state
      } catch (error) {
        console.error("Error fetching raw materials: ", error);
        setRawMaterials(null); // Clear raw materials on error
      }
    }
  };

  useEffect(() => {
    // Generate the first set of images when the component mounts
    generateImage(prompt, seed, numImages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  return (
    <div className="app-container">
      <div className="input-section">
        <label htmlFor="prompt">Prompt:</label>
        <input
          type="text"
          id="prompt"
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          className="input-box"
          placeholder="Enter your image description"
        />

        <label htmlFor="seed">Seed:</label>
        <input
          type="number"
          id="seed"
          value={seed}
          onChange={(e) => handleSeedChange(e.target.value)}
          className="input-box"
          placeholder="Random or specify a seed"
        />

        <label htmlFor="numImages">Number of Images:</label>
        <div className="num-images-wrapper">
          <button
            className="num-images-btn"
            onClick={decrementNumImages}
            disabled={numImages <= 1}
          >
            -
          </button>
          <input
            type="number"
            id="numImages"
            value={numImages}
            onChange={(e) => handleNumImagesChange(e.target.value)}
            className="input-box"
            placeholder="Enter number of images (1-10)"
            min="1"
            max="10"
          />
          <button
            className="num-images-btn"
            onClick={incrementNumImages}
            disabled={numImages >= 10}
          >
            +
          </button>
        </div>

        <button
          onClick={() => generateImage(prompt, seed, numImages)}
          disabled={loading}
          className="generate-button"
        >
          {loading ? "Generating..." : "Generate Images"}
        </button>
      </div>

      <div className="image-section">
        {loading && <p>Generating images...</p>}
        {error && <p className="error-message">{error}</p>}
        {images.length > 0 && (
          <div className="images-grid">
            {images.map((imgUrl, index) => (
              <div
                key={index}
                className={`image-wrapper ${selectedImage === imgUrl ? "border-4 border-blue-500" : ""}`} // Highlight selected image
                onClick={() => handleImageClick(imgUrl)}
              >
                <img
                  src={imgUrl}
                  alt={`Generated ${index + 1}`}
                  className="generated-image cursor-pointer"
                />
              </div>
            ))}
          </div>
        )}
        {inferenceTime && <p>Inference time: {inferenceTime}ms</p>}

        {/* Button to generate raw material */}
        <button
          onClick={handleGenerateRawMaterial}
          disabled={!selectedImage} // Disable if no image is selected
          className={`mt-4 px-6 py-2 ${selectedImage ? "bg-green-500 hover:bg-green-600" : "bg-gray-400"} text-white rounded-lg shadow-md transition-colors duration-300 ease-in-out`}
        >
          Generate Raw Material
        </button>

        {/* Display raw materials as a table */}
        {rawMaterials && rawMaterials.rawMaterials && rawMaterials.rawMaterials.length > 0 && (
          <div className="raw-materials-section mt-4">
            <h3 className="text-lg font-bold mb-2">Raw Materials</h3>
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Raw Material</th>
                  <th className="px-4 py-2 border">Eco-Friendly Alternative</th>
                </tr>
              </thead>
              <tbody>
                {rawMaterials.rawMaterials.map((material, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 border">{material}</td>
                    <td className="px-4 py-2 border">{rawMaterials.ecoFriendlyRawMaterials[index]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lightning;
