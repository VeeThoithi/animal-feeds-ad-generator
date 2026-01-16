import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import { createCanvas, loadImage } from 'canvas';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.json({ message: "Animal Feed Ad Generator API is running!" });
});

// Helper function to detect animal type from product name
function detectAnimalType(productName) {
  const lower = productName.toLowerCase();
  
  if (lower.includes('chicken') || lower.includes('poultry') || lower.includes('layer') || lower.includes('broiler') || lower.includes('chick')) {
    return 'chickens';
  } else if (lower.includes('cattle') || lower.includes('cow') || lower.includes('dairy') || lower.includes('beef')) {
    return 'cattle';
  } else if (lower.includes('pig') || lower.includes('swine') || lower.includes('pork')) {
    return 'pigs';
  } else if (lower.includes('goat') || lower.includes('sheep') || lower.includes('lamb')) {
    return 'goats and sheep';
  } else if (lower.includes('fish') || lower.includes('aqua')) {
    return 'fish';
  } else if (lower.includes('rabbit')) {
    return 'rabbits';
  } else if (lower.includes('duck') || lower.includes('goose')) {
    return 'ducks';
  } else if (lower.includes('horse')) {
    return 'horses';
  }
  
  return 'farm animals'; // Default
}

// Generate ad using Pollinations.ai text API
app.post("/generate-ad", async (req, res) => {
  try {
    const { product, format } = req.body;

    if (!product || product.trim() === "") {
      return res.status(400).json({ error: "Product description is required" });
    }

    console.log(`Generating ad for: ${product}`);
    const isShortFormat = format === "short";

    // Try Pollinations.ai Text Generation first
    try {
      console.log("Using Pollinations.ai for text generation");

      const textPrompt = isShortFormat
        ? `Write a 2-line catchy advertisement with emojis for animal feed product: "${product}". Maximum 25 words. No hashtags. Just the ad text.`
        : `Create a compelling social media advertisement for animal feed product: "${product}". Include emojis and farming hashtags. Keep it under 100 words. Make it engaging for farmers.`;

      const textResponse = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a creative marketing expert for agricultural and livestock businesses. Create compelling, concise advertisements."
            },
            {
              role: "user",
              content: textPrompt
            }
          ],
          model: "openai",
          seed: Date.now(),
          jsonMode: false
        })
      });

      if (textResponse.ok) {
        let generatedText = await textResponse.text();
        
        // Clean up the text
        generatedText = generatedText
          .replace(/^["']|["']$/g, '') // Remove quotes
          .replace(/^Advertisement:\s*/i, "")
          .replace(/^Ad:\s*/i, "")
          .trim();

        // For short format, keep only first 2 lines
        if (isShortFormat) {
          const lines = generatedText.split('\n').filter(line => line.trim());
          generatedText = lines.slice(0, 2).join('\n');
        }

        // Validate length
        const minLength = isShortFormat ? 20 : 40;
        const maxLength = isShortFormat ? 200 : 600;

        if (generatedText.length > minLength && generatedText.length < maxLength) {
          console.log("✅ Success with Pollinations.ai text generation");
          console.log("Generated text:", generatedText);
          return res.json({ 
            caption: generatedText,
            model: "pollinations-ai"
          });
        }
      }

      console.log("Pollinations.ai text generation failed, using templates");
    } catch (error) {
      console.error("Pollinations.ai text error:", error.message);
    }

    // Fallback to template-based ads
    console.log("Using fallback template");

    // Short catchy templates (2-line ads)
    const shortAdTemplates = [
      `🌾 ${product} - Where Strong Animals Begin! 💪\nHealthy livestock, profitable future. Order now! 📞`,
      
      `🌟 Premium ${product} for Superior Growth! 💚\nTrusted by farmers nationwide. Get yours today!`,
      
      `🐄 ${product} - The Smart Farmer's Choice! ✨\nBetter nutrition, better results. Call us now!`,
      
      `💚 ${product} - Quality You Can Trust! 🌾\nWatch your animals thrive. Available now!`,
      
      `🚜 ${product} - Proven Results, Happy Farmers! 🐥\nOrder today for healthier, stronger livestock!`,
      
      `⭐ ${product} - Feed Excellence Delivered! 🌾\nMaximize growth, maximize profits. Contact us!`,
      
      `🐓 Give Your Animals The Best Start! 💪\n${product} - Scientifically formulated for success!`,
      
      `🌾 ${product} - Premium Nutrition, Premium Results! ✨\nJoin hundreds of satisfied farmers today!`,
      
      `💯 ${product} - The Feed That Delivers! 🐖\nHealthier animals, happier farmers. Order now!`,
      
      `🔥 ${product} - Transform Your Farm! 🌟\nFaster growth, better health. Get started today!`
    ];

    // Long detailed templates
    const longAdTemplates = [
      `🐄 Premium ${product}! 🌾\n\nGive your livestock the nutrition they deserve! Scientifically formulated for optimal health and maximum growth 💪\n\nOrder now and see the difference!\n\n#AnimalFeeds #Livestock #FarmLife #QualityFeeds #HealthyAnimals #Agriculture`,
      
      `🌟 FARMERS' CHOICE 🌟\n\n${product} - The feed that delivers real results! \n\n✅ Better weight gain\n✅ Improved milk production\n✅ Stronger immunity\n✅ Higher profits\n\nCall us today! 📞\n\n#FarmSuccess #AnimalNutrition #Livestock #Poultry #Farming #QualityFeeds`,
      
      `🐔 Superior Nutrition for Your Flock! 🐔\n\n${product} - Complete and balanced formula!\n\n🌾 High protein content\n🌾 Essential vitamins & minerals\n🌾 Better feed conversion ratio\n\nHealthy animals = Profitable farming! 📈\n\n#PoultryFarming #AnimalHealth #Livestock #FeedQuality #Agriculture`,
      
      `💚 PROVEN RESULTS 💚\n\n${product} trusted by successful farmers!\n\n🚜 Faster growth rates\n🚜 Improved production\n🚜 Reduced mortality\n🚜 Maximum ROI\n\nAvailable now at competitive prices!\n\n#Farming #AnimalFeeds #Livestock #Agriculture #FarmBusiness #ProfitableFarming`,
      
      `🌾 Transform Your Farm with ${product}! 🌾\n\nPremium quality feeds with:\n✨ Balanced nutrition\n✨ Quality ingredients\n✨ Affordable prices\n✨ Fast delivery\n\nHealthier animals, bigger profits! 💰\n\nContact us to order!\n\n#FarmSupplies #AnimalNutrition #Livestock #Poultry #Agriculture #KenyanFarmers`
    ];

    const templates = isShortFormat ? shortAdTemplates : longAdTemplates;
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    res.json({ caption: randomTemplate, model: "template" });
  } catch (error) {
    console.error("Error generating ad:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// Image generation endpoint
app.post("/generate-image", async (req, res) => {
  try {
    const { product, adText } = req.body;

    if (!product || product.trim() === "") {
      return res.status(400).json({ error: "Product name is required" });
    }

    if (!adText || adText.trim() === "") {
      return res.status(400).json({ error: "Ad text is required" });
    }

    console.log(`Generating combined ad image for: ${product}`);

    // Detect animal type from product name
    const animalType = detectAnimalType(product);
    console.log(`Detected animal type: ${animalType}`);

    // Use Pollinations.ai for image generation
    try {
      console.log("Using Pollinations.ai for image generation");

      const imagePrompt = `Professional advertisement photo for ${product} animal feed, farm setting with healthy ${animalType}, bright natural lighting, commercial photography, vibrant colors, high quality, 4K, realistic`;
      
      // Encode prompt for URL
      const encodedPrompt = encodeURIComponent(imagePrompt);
      
      // Generate image URL
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1080&seed=${Date.now()}&nologo=true&model=flux`;
      
      console.log("Fetching AI-generated image from Pollinations.ai...");
      
      // Fetch the generated image
      const imageResponse = await fetch(pollinationsUrl);
      
      if (imageResponse.ok) {
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        
        // Create canvas to add text overlay
        const canvas = createCanvas(1080, 1080);
        const ctx = canvas.getContext('2d');
        
        // Load and draw background image
        const bgImage = await loadImage(imageBuffer);
        ctx.drawImage(bgImage, 0, 0, 1080, 1080);
        
        // Add gradient overlay at bottom for text readability
        const gradient = ctx.createLinearGradient(0, 650, 0, 1080);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.7)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1080);
        
        // Add text overlay
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Split text into lines and filter empty ones
        const lines = adText.split('\n').filter(line => line.trim());
        
        // Calculate font size based on number of lines and text length
        let fontSize = 60;
        if (lines.length > 3) fontSize = 48;
        if (lines.length > 5) fontSize = 42;
        
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        
        // Calculate starting Y position to center text in gradient area
        const lineHeight = fontSize + 20;
        const totalHeight = lines.length * lineHeight;
        const startY = 1080 - totalHeight - 60;
        
        // Draw each line
        lines.forEach((line, index) => {
          const y = startY + (index * lineHeight);
          ctx.fillText(line, 540, y);
        });
        
        // Convert to base64
        const finalImage = canvas.toDataURL('image/png');
        
        console.log(`✅ Image generated successfully with ${animalType} and text overlay`);
        return res.json({ 
          imageUrl: finalImage,
          model: "pollinations-ai",
          animalType: animalType
        });
      }
      
      throw new Error("Pollinations.ai image request failed");
      
    } catch (error) {
      console.error("Pollinations.ai error:", error.message);
    }

    // Fallback: Create gradient background with text
    console.log("Using fallback gradient background");
    
    const canvas = createCanvas(1080, 1080);
    const ctx = canvas.getContext('2d');
    
    // Green gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
    gradient.addColorStop(0, '#16a34a');
    gradient.addColorStop(0.5, '#15803d');
    gradient.addColorStop(1, '#166534');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);
    
    // Add product name at top
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 70px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(product.toUpperCase(), 540, 300);
    
    // Add decorative animal emoji based on type
    const fallbackAnimalType = detectAnimalType(product);
    let emoji1 = '🌾', emoji2 = '🐥';
    
    if (fallbackAnimalType.includes('cattle')) {
      emoji1 = '🐄'; emoji2 = '🐮';
    } else if (fallbackAnimalType.includes('pig')) {
      emoji1 = '🐷'; emoji2 = '🐖';
    } else if (fallbackAnimalType.includes('goat')) {
      emoji1 = '🐐'; emoji2 = '🐑';
    } else if (fallbackAnimalType.includes('fish')) {
      emoji1 = '🐟'; emoji2 = '🐠';
    } else if (fallbackAnimalType.includes('duck')) {
      emoji1 = '🦆'; emoji2 = '🦢';
    } else if (fallbackAnimalType.includes('rabbit')) {
      emoji1 = '🐰'; emoji2 = '🐇';
    }
    
    ctx.font = '100px Arial, sans-serif';
    ctx.fillText(emoji1, 200, 500);
    ctx.fillText(emoji2, 880, 500);
    
    // Add ad text
    const lines = adText.split('\n').filter(line => line.trim());
    ctx.font = 'bold 55px Arial, sans-serif';
    const startY = 650;
    const lineHeight = 80;
    
    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      ctx.fillText(line, 540, y);
    });
    
    const finalImage = canvas.toDataURL('image/png');
    
    console.log(`✅ Fallback gradient image created with ${animalType} emojis`);
    res.json({ 
      imageUrl: finalImage,
      model: "fallback-gradient",
      animalType: animalType
    });

  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: "Failed to generate image. Please try again." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌾 Generate animal feed ads at: http://localhost:${PORT}/generate-ad`);
  console.log(`🖼️  Generate ad images at: http://localhost:${PORT}/generate-image`);
  console.log(`✨ Using Pollinations.ai for text and image generation`);
});