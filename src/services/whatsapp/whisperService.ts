import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    console.log("🎙️ Iniciando transcripción con Whisper...");

    // Descargar el audio
    const audioResponse = await fetch(audioUrl);
    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer]);

    // Convertir a File
    const audioFile = new File([audioBlob], "audio.ogg", { type: "audio/ogg" });

    // Transcribir con Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "es", // Español por defecto
      response_format: "text",
    });

    console.log("✅ Transcripción completada");
    return transcription as string;
  } catch (error) {
    console.error("❌ Error transcribiendo audio:", error);
    throw new Error("No se pudo transcribir el audio");
  }
}




