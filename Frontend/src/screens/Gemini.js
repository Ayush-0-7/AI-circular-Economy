import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Generative AI model

// const genAI = new GoogleGenerativeAI('AIzaSyCqzZTxRZVJlOQ7rkWarXL4y8vemoSUiqE');
// const genAI = new GoogleGenerativeAI('AIzaSyAzm3gyfUp4mFGej3jEqg-jvUkQK1Szn24');
const genAI = new GoogleGenerativeAI('AIzaSyB3df6V6CbdWZJbnvp5V6PoWfMz8mIfy-A');
// const genAI = new GoogleGenerativeAI('AIzaSyB6zlzWKp99f8TwD1IVj4SZOghhR6qhXsg');

const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// Function to generate product description
export const generateDescription = async (productName, productCategory, productQuantity) => {
  const prompt = `Give a short description for a ${productName} in the ${productCategory} category of 1 paragraph dont use any special symbols.`;

  try {
    const result = await model.generateContent(prompt);
    const description = await result.response.text();
    return description; // Return the generated description
  } catch (error) {
    console.error('Error generating description: ', error);
    return ''; // Return an empty string or handle the error as needed
  }
};

// Function to fetch potential buyers
export const fetchPotentialBuyers = async (productName, productCategory) => {
  const prompt = ` generate dummy buyers data for a ${productName} in the ${productCategory} category. Provide a list of potential buyers including their names and their website link in json format.remove the text other than the json format. `;

  try {
    const result = await model.generateContent(prompt);
    const buyersData = await result.response.text();
    console.log(buyersData);
    // Parse the buyersData if it's a JSON string or another format
    // This is a simple example; adjust as necessary based on the expected format
    return buyersData;
    // Ensure the returned data is in the expected format
    // return buyers.map((buyer) => ({
    //   name: buyer.name,
    //   email: buyer.email,
    // }));
  } catch (error) {
    console.error('Error fetching potential buyers: ', error);
    return []; // Return an empty array on error
  }
};
export const fetchDemand = async (productName) => {
    const prompt = ` demand for ${productName} as a raw material in India on a scale of 1 to 100.`;
  
    try {
      const result = await model.generateContent(prompt);
      const description = await result.response.text();
      console.log(description);
      return description; // Return the generated description
    } catch (error) {
      console.error('Error generating description: ', error);
      return ''; // Return an empty string or handle the error as needed
    }
};
// Gemini.js
export const fetchRawMaterials = async (prompt) => {
  const formattedPrompt = `
    Given the product description below, list the raw materials required to produce the product.
    list the eco-fiendly raw materials required to produce the product.

    Product Description: "${prompt}"

    Please format the response as a JSON object with the following structure:
    {
      "rawMaterials": ["Material A", "Material B", "Material C"],
      "ecoFriendlyRawMaterials": ["Eco-Friendly Material X", "Eco-Friendly Material Y", "Eco-Friendly Material Z"]
    }
  `;

  try {
    const result = await model.generateContent(formattedPrompt);
    const data =  await result.response.text();
    console.log(data);
    return data ; 
    
    
  } catch (error) {
    console.error('Error fetching raw materials: ', error);
    throw error; // Propagate the error to be handled in the caller
  }
};

// Example usage
fetchRawMaterials("Hair dryer design");
