import Tesseract from "tesseract.js";

// Singleton worker for better performance
let worker = null;

/**
 * Initialize the Tesseract worker (call on app start for faster first scan)
 */
export const initializeWorker = async () => {
  if (!worker) {
    worker = await Tesseract.createWorker("eng");
    console.log("✅ Tesseract worker initialized");
  }
  return worker;
};

/**
 * Extract raw text from an image file path
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} - Raw extracted text
 */
export const extractTextFromImage = async (imagePath) => {
  try {
    // Initialize worker if not already done
    if (!worker) {
      await initializeWorker();
    }

    const {
      data: { text },
    } = await worker.recognize(imagePath);

    return text.trim();
  } catch (error) {
    console.error("Error extracting text:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};

/**
 * Extract raw text from an image buffer (for use with multer)
 * @param {Buffer} imageBuffer - Image buffer from multer
 * @returns {Promise<string>} - Raw extracted text
 */
export const extractTextFromBuffer = async (imageBuffer) => {
  try {
    // Initialize worker if not already done
    if (!worker) {
      await initializeWorker();
    }

    const {
      data: { text },
    } = await worker.recognize(imageBuffer);

    return text.trim();
  } catch (error) {
    console.error("Error extracting text from buffer:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};

/**
 * Terminate the worker (call on app shutdown)
 */
export const terminateWorker = async () => {
  if (worker) {
    await worker.terminate();
    worker = null;
    console.log("🛑 Tesseract worker terminated");
  }
};
