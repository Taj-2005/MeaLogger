"use client";

import { fadeInUp, slideInLeft, slideInRight, staggerContainer } from "@/lib/animations";
import { motion } from "framer-motion";
import {
    Bell,
    Calendar,
    Camera,
    Clock,
    Trophy,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Capture Your Meal",
    description:
      "Open the app and snap a quick photo of your meal. That's it—no typing, no complexity.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    number: "02",
    icon: Clock,
    title: "Auto-Log with Timestamp",
    description:
      "The app automatically saves your meal with the current time and date. Everything is organized chronologically.",
    color: "from-purple-500 to-pink-500",
  },
  {
    number: "03",
    icon: Calendar,
    title: "View Your Timeline",
    description:
      "Browse your complete meal history in a beautiful, scrollable timeline. See your eating patterns at a glance.",
    color: "from-green-500 to-emerald-500",
  },
  {
    number: "04",
    icon: Bell,
    title: "Set Smart Reminders",
    description:
      "Configure custom meal reminders for breakfast, lunch, dinner, or snacks. Never miss a meal again.",
    color: "from-orange-500 to-red-500",
  },
  {
    number: "05",
    icon: Trophy,
    title: "Track Your Streaks",
    description:
      "Build consistency with streak tracking. Watch your daily streak grow and stay motivated to maintain it.",
    color: "from-yellow-500 to-amber-500",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-gray-50 to-white scroll-mt-20">
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
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, intuitive, and designed for real life
            </p>
          </motion.div>

          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              const AnimationVariant = isEven ? slideInLeft : slideInRight;

              return (
                <motion.div
                  key={index}
                  variants={AnimationVariant}
                  className="flex flex-col md:flex-row items-center gap-8"
                >
                  <div
                    className={`flex-shrink-0 w-full md:w-1/2 ${
                      isEven ? "md:order-1" : "md:order-2"
                    }`}
                  >
                    <div className="relative">
                      <div
                        className={`w-full h-64 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-2xl`}
                      >
                        <Icon className="w-24 h-24 text-white opacity-90" />
                      </div>
                      <div className="absolute -top-4 -left-4 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">
                          {step.number}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-full md:w-1/2 text-center md:text-left ${
                      isEven ? "md:order-2" : "md:order-1"
                    }`}
                  >
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

