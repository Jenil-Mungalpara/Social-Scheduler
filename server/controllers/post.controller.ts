import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { cloudinary } from "../config/cloudinary.js";
import { Generation } from "../models/generation.model.js";
import { Post } from "../models/post.model.js";

//helper to call leonardo ai

const pollLeonardoJob = async (generationId: string, apiKey: string): Promise<string> => {
    const maxRetries = 20;
    const delay = 5000;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await axios.get(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
                headers: {
                    accept: "application/json", authorization: `Bearer ${apiKey}`
                }
            })

            const generation = response.data.generations_by_pk;
            if (generation.status === "COMPLETE") {
                if (generation.generated_images && generation.generated_images.length > 0) {
                    return generation.generated_images[0].url;
                }
                throw new Error("Generation complete but no images found.")
            }
            if (generation.status === "FAILED") {
                throw new Error("Leonardo.ai generation failed.")
            }
        } catch (err: any) {
            console.error("Polling error : ", err?.response?.data || err.message);
        }
        await new Promise((resolve)=>setTimeout(resolve,delay));
    }
    throw new Error("Leonardo ai generation timeout");
}

//generate post
//POST /api/posts/generate

export const generatePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { prompt, tone, generateImage } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(400).json({ message: "Gemini API key missing" });
            return;
        }
        const ai = new GoogleGenAI({ apiKey });

        //generate text

        const textResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a social media post based on this prompt : "${prompt}". Tone:${tone}. Include relevant hashtags.
            Format the response as JSON with "content" and "imagePrompt" fields.
            The "imagePrompt" should be highly descriptive prompt for an image generator that complements the post`,
        });

        let content = "";
        let imagePrompt = prompt;
        let mediaUrl = "";

        try {
            const rawText = textResponse.text || "";
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { content: rawText, imagePrompt: prompt }
            content = data.content;
            imagePrompt = data.imagePrompt;
        } catch (e) {
            content = textResponse.text || ""
        }
        if (generateImage) {
            try {
                const leonardoKey = process.env.IMG_KEY;
                if (leonardoKey) {
                    const leoResponse = await axios.post(
                        "https://cloud.leonardo.ai/api/rest/v2/generations",
                        {
                            "public": false,
                            "model": "gpt-image-2",
                            "parameters": {
                                "quality": "LOW",
                                "prompt": imagePrompt,
                                "quantity": 1,
                                "width": 1024,
                                "height": 1024,
                                "prompt_enhance": "OFF"
                            }
                        },
                        {
                            headers: {
                                accept: "application/json",
                                authorization: `Bearer ${leonardoKey}`,
                                "content-type": "application/json",
                            }
                        }
                    )

                    const generationId = leoResponse.data.generate.generationId;

                    const tempUrl = await pollLeonardoJob(generationId, leonardoKey);

                    //upload to cloudinary

                    const uploadResult = await cloudinary.uploader.upload(tempUrl, {
                        folder: "ai-generations"
                    });
                    mediaUrl = uploadResult.secure_url
                }
            } catch (err: any) {
                console.error("image generation failed", err);
            }
        }

        //save generation to db

        const generation = await Generation.create({
            user: req.user._kd,
            prompt,
            content,
            mediaUrl,
            mediaType: mediaUrl ? "image" : undefined,
            tone,
        })

        res.json({ generation });

    } catch (err: any) {
        res.status(500).json({ message: err?.message || "server error" })
    }
}


//get generations
// GET /api/posts/generations

export const getGenerations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const generations = Generation.find({
            user: req.user._id
        }).sort({ createdAt: -1 });
        res.json({ generations });
    } catch (error: any) {
        res.status(500).json({ message: error?.message || "Server error" });
    }

}

//get posts
// GET /api/posts/

export const getPosts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const posts = await Post.find({ user: req.user._id });
        res.json({ posts });
    } catch (error: any) {
        res.status(500).json({ message: error?.message || "Server error" });
    }

}

//schedule post
// GET /api/posts/generations

export const schedulePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { content, platforms, scheduledFor, status } = req.body;

        // Parse platforms if it comes as a stringified array from FormData
        let parsedPlatforms = platforms;
        if (typeof platforms === "string") {
            try {
                parsedPlatforms = JSON.parse(platforms)
            } catch (e) {
                parsedPlatforms = platforms.split(",");
            }
        }

        let mediaUrl: string | undefined = req.body.mediaUrl;
        let mediaType: "image" | "video" | undefined = req.body.mediaType;
        if (req.file) {
            const result = await new Promise<any>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({ resource_type: "auto", folder: "social-scheduler" }, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                });
                stream.end(req.file!.buffer);
            });
            mediaUrl = result.secure_url;
            mediaType = result.resource_type === "video" ? "video" : "image";
        }

        const post = await Post.create({
            user: req.user._id,
            content,
            platforms: parsedPlatforms,
            mediaUrl,
            mediaType,
            scheduledFor,
            status,
        })
        res.status(201).json(post)
        
    } catch (error: any) {
        res.status(500).json({ message: error?.message || "Server error" });
    }

}
