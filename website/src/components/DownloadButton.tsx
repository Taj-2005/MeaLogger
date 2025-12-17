"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Check, AlertCircle, Loader2 } from "lucide-react";
import {
  extractDriveFileId,
  buildDirectDownloadUrl,
  isAndroidDevice,
  isIOSDevice,
} from "@/lib/drive-utils";

interface DownloadButtonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function DownloadButton({
  className = "",
  size = "lg",
}: DownloadButtonProps) {
  const [downloadState, setDownloadState] = useState<
    "idle" | "validating" | "downloading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const driveLink =
    process.env.NEXT_PUBLIC_APK_DRIVE_LINK ||
    "https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing";

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  useEffect(() => {
    if (isIOSDevice()) {
      setDownloadState("error");
      setErrorMessage("iOS version coming soon");
    }
  }, []);

  const handleDownload = async () => {
    if (isIOSDevice()) {
      return;
    }

    setDownloadState("validating");
    setErrorMessage("");

    try {
      const fileId = extractDriveFileId(driveLink);

      if (!fileId) {
        throw new Error("Invalid Google Drive link");
      }

      setDownloadState("downloading");

      const useProxy = process.env.NEXT_PUBLIC_ENABLE_DOWNLOAD_PROXY === "true";
      
      if (useProxy) {
        try {
          const response = await fetch(`/api/download?driveId=${fileId}`);
          
          if (!response.ok) {
            throw new Error("Proxy download failed");
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "Melo.apk";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (proxyError) {
          console.warn("Proxy download failed, trying direct:", proxyError);
          const directUrl = buildDirectDownloadUrl(fileId);
          window.open(directUrl, "_blank");
        }
      } else {
        const directUrl = buildDirectDownloadUrl(fileId);
        const link = document.createElement("a");
        link.href = directUrl;
        link.download = "MealLogger.apk";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setTimeout(() => {
        setDownloadState("success");
        setTimeout(() => setDownloadState("idle"), 2000);
      }, 1000);
    } catch (error) {
      setDownloadState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to initiate download"
      );
      setTimeout(() => {
        setDownloadState("idle");
        setErrorMessage("");
      }, 3000);
    }
  };

  const getButtonContent = () => {
    switch (downloadState) {
      case "validating":
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Validating...</span>
          </>
        );
      case "downloading":
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Starting Download...</span>
          </>
        );
      case "success":
        return (
          <>
            <Check className="w-5 h-5" />
            <span>Download Started!</span>
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="w-5 h-5" />
            <span>{errorMessage || "Download Failed"}</span>
          </>
        );
      default:
        return (
          <>
            <Download className="w-5 h-5" />
            <span>Download APK</span>
          </>
        );
    }
  };

  const getButtonStyles = () => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed";

    switch (downloadState) {
      case "success":
        return `${baseStyles} bg-green-600 text-white hover:bg-green-700`;
      case "error":
        return `${baseStyles} bg-red-600 text-white hover:bg-red-700`;
      default:
        return `${baseStyles} bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700`;
    }
  };

  return (
    <div className={className}>
      <motion.button
        onClick={handleDownload}
        disabled={downloadState === "validating" || downloadState === "downloading"}
        className={`${getButtonStyles()} ${sizeClasses[size]}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {getButtonContent()}
      </motion.button>

      {downloadState === "error" && errorMessage && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-600 text-center"
        >
          {errorMessage}
        </motion.p>
      )}

      {isIOSDevice() && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-sm text-gray-500 text-center"
        >
          iOS version coming soon
        </motion.p>
      )}
    </div>
  );
}

