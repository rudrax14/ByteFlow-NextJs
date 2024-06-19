import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const POST = async (request: Request) => {
  const { question } = await request.json();

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // More specific prompt to ensure the response is generated and formatted in HTML
    const prompt =
      "Generate a detailed response to the following question in HTML format for TinyMCE only body and do not put big para-space: " +
      question;

    const result = await model.generateContent(prompt);
    const response = result.response.candidates![0].content.parts[0].text;

    return NextResponse.json({ response });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
};
