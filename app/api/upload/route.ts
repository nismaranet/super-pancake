import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2"; // Sesuaikan path ini dengan lokasi file r2.ts kamu

export async function POST(request: Request) {
  try {
    const { fileName, fileType, folder } = await request.json();

    // Bersihkan nama file dari spasi atau karakter aneh
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-');
    // Format path: folder/timestamp-namafile.jpg
    const filePath = `${folder}/${Date.now()}-${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filePath,
      ContentType: fileType,
    });

    // Buat URL yang valid selama 1 jam (3600 detik)
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
    
    // Ganti domain ini dengan Custom Domain R2 kamu
    const publicUrl = `https://img.nismara.my.id/${filePath}`;

    return NextResponse.json({ signedUrl, publicUrl });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}