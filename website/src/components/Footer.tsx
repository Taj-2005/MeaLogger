"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-6xl mx-auto"
        >
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                MealLogger
              </h3>
              <p className="text-gray-400">
                Track your meals effortlessly with photo-based logging and smart
                reminders.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">App</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#download" className="hover:text-white transition-colors">
                    Download
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Info</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Version 1.0.0</li>
                <li>Android Only</li>
                <li>Free & Open Source</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>
              © {new Date().getFullYear()} MealLogger. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

