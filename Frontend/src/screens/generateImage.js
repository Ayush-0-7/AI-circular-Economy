import fetch from 'node-fetch';
import fs from 'fs';

async function generateImage() {
    const model = "runwayml/stable-diffusion-v1-5";
    const loraModel = "Melonie/text_to_image_finetuned";
    const prompt = "Astronaut in a jungle, cold color palette, muted colors, detailed, 8k";

    try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer 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`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: prompt,
                options: {
                    use_lora: loraModel // Use the LoRA weights
                }
            }),
        });

        // Check for successful response
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const buffer = await response.buffer(); // Use buffer instead of blob
        
        // Save the image to a file
        fs.writeFileSync('generated-image.png', buffer);
        console.log("Image saved as generated-image.png");
    } catch (error) {
        console.error("Error generating image: ", error);
    }
}

// Call the function
generateImage();
