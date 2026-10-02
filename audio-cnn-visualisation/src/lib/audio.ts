import { encodeWav } from "~/lib/wav";

export const MAX_FILE_MB = 50;
export const MAX_SECONDS = 10;

export class UserFacingError extends Error {}

// Décode n'importe quel format lu par le navigateur (mp3, m4a, ogg, webm, wav…),
// garde les MAX_SECONDS premières secondes et renvoie un WAV mono compact.
export async function prepareAudio(file: File): Promise<Blob> {
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new UserFacingError(`Fichier trop lourd (max ${MAX_FILE_MB} Mo).`);
  }

  const ctx = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(await file.arrayBuffer());
  } catch {
    throw new UserFacingError(
      "Format non supporté. Essaie un fichier WAV, MP3, M4A ou OGG.",
    );
  } finally {
    void ctx.close();
  }

  if (decoded.length === 0) throw new UserFacingError("Le fichier audio est vide.");

  const length = Math.min(decoded.length, Math.floor(MAX_SECONDS * decoded.sampleRate));
  const trimmed = new AudioBuffer({
    length,
    numberOfChannels: decoded.numberOfChannels,
    sampleRate: decoded.sampleRate,
  });
  for (let c = 0; c < decoded.numberOfChannels; c++) {
    trimmed.copyToChannel(decoded.getChannelData(c).subarray(0, length), c);
  }

  return encodeWav(trimmed);
}

export function apiErrorMessage(status: number): string {
  if (status === 429) return "Trop de requêtes. Patiente une minute avant de réessayer.";
  if (status === 413) return "Fichier trop volumineux pour être analysé.";
  if (status === 400) return "Ce fichier audio n'a pas pu être lu par le serveur.";
  if (status >= 500) return "Le serveur est momentanément indisponible. Réessaie dans quelques instants.";
  return `Une erreur est survenue (code ${status}).`;
}
