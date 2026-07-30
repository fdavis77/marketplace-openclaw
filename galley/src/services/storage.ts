import { supabase } from "../lib/supabase";

async function uploadTo(bucket: string, file: File) {
  const extension = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;
  return path;
}

export function uploadChefPhoto(file: File) {
  return uploadTo("chef-photos", file);
}

export function uploadChefDocument(file: File) {
  return uploadTo("chef-documents", file);
}

export async function getSignedUrl(bucket: string, path: string, expiresInSeconds = 300) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}
