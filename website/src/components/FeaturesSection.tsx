"use client";

import { fadeInUp, staggerContainer } from "@/lib/animations";
import { motion } from "framer-motion";
import {
    Bell,
    Camera,
    Cloud,
    Palette,
    TrendingUp,
    User,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Photo-Based Logging",
    description:
      "Capture meals instantly with your camera. No typing, no hassle—just point, shoot, and log.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description:
      "Customizable meal reminders keep you on track. Set different times for breakfast, lunch, dinner, and snacks.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description:
      "Your data is safely stored in the cloud. Log in from any device—phone, tablet, or web—and access your complete meal history. Never lose your data.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: TrendingUp,
    title: "Streak Tracking",
    description:
      "Build consistency with visual streak tracking. Watch your daily streak grow and stay motivated.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: User,
    title: "Profile & Settings",
    description:
      "Personalize your experience with customizable settings, profile management, and preferences.",
    color: "from-yellow-500 to-amber-500",
  },
  {
    icon: Palette,
    title: "Modern UI",
    description:
      "Beautiful, intuitive interface designed for ease of use. Clean design that makes meal tracking enjoyable.",
    color: "from-indigo-500 to-purple-500",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to build better eating habits
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-gray-50 rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

