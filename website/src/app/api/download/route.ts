import { NextRequest, NextResponse } from "next/server";
import { extractDriveFileId, buildDirectDownloadUrl } from "@/lib/drive-utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const driveId = searchParams.get("driveId");
  const driveLink = searchParams.get("link");

  if (!driveId && !driveLink) {
    return NextResponse.json(
      { error: "Missing driveId or link parameter" },
      { status: 400 }
    );
  }

  let fileId: string | null = null;

  if (driveId) {
    fileId = driveId;
  } else if (driveLink) {
    fileId = extractDriveFileId(driveLink);
  }

  if (!fileId) {
    return NextResponse.json(
      { error: "Invalid Google Drive link or file ID" },
      { status: 400 }
    );
  }

  try {
    const directUrl = buildDirectDownloadUrl(fileId);

    const response = await fetch(directUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": 'attachment; filename="MealLogger.apk"',
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Download proxy error:", error);
    return NextResponse.json(
      {
        error: "Failed to proxy download",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

