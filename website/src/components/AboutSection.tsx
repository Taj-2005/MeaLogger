"use client";

import { motion } from "framer-motion";
import { Target, Zap, Shield, TrendingUp } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const features = [
  {
    icon: Target,
    title: "The Problem",
    description:
      "Most people struggle to remember what they ate, when they ate it, and how consistent their eating habits are. Without tracking, it's impossible to build awareness and make meaningful changes.",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: Zap,
    title: "The Solution",
    description:
      "Melo makes meal tracking effortless. Simply snap a photo of your meal, and the app automatically logs it with timestamps. No manual entry, no complexity—just quick photo captures.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Why It Works",
    description:
      "Photo-based logging is faster and more accurate than typing. Combined with smart reminders, streak tracking, and a beautiful timeline, Melo helps you build consistent habits naturally.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "What Makes It Special",
    description:
      "Cloud-based storage means your data is safe and accessible from any device. Log in from your phone, tablet, or web browser—all your meals, streaks, and progress are always available. Beautiful dashboard insights, customizable reminders, and streak tracking keep you motivated and engaged.",
    color: "from-green-500 to-emerald-500",
  },
];

export default function AboutSection() {
  return (
    <section className="py-24 bg-white">
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
              Why Melo?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A modern approach to meal tracking that actually works
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                  className="bg-gray-50 rounded-3xl p-8 hover:shadow-xl transition-shadow duration-300"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
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

