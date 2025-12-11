"use client";

import { motion } from "framer-motion";
import { Smartphone, Shield, Download as DownloadIcon } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import DownloadButton from "./DownloadButton";

export default function DownloadSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-10" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={fadeInUp}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <Smartphone className="w-4 h-4" />
              <span>Available for Android users only</span>
            </div>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            Ready to Start Tracking?
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-xl sm:text-2xl text-white/90 mb-12 max-w-2xl mx-auto"
          >
            Download MealLogger APK and begin your journey to better eating
            habits today.
          </motion.p>

          <motion.div variants={fadeInUp} className="mb-8">
            <DownloadButton size="lg" />
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap justify-center gap-6 text-white/80 text-sm"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Scanned for safety</span>
            </div>
            <div className="flex items-center gap-2">
              <DownloadIcon className="w-5 h-5" />
              <span>Direct download</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>No ads, no tracking</span>
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="mt-12 bg-white/10 backdrop-blur-md rounded-3xl p-6 max-w-2xl mx-auto"
          >
            <h3 className="text-lg font-semibold text-white mb-3">
              Installation Instructions
            </h3>
            <ol className="text-left text-white/90 space-y-2 text-sm">
              <li className="flex gap-3">
                <span className="font-bold">1.</span>
                <span>
                  Download the APK file to your Android device
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">2.</span>
                <span>
                  Go to Settings → Security → Enable "Install from Unknown
                  Sources"
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">3.</span>
                <span>
                  Open the downloaded APK file and follow the installation
                  prompts
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">4.</span>
                <span>
                  Launch MealLogger and start tracking your meals!
                </span>
              </li>
            </ol>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

