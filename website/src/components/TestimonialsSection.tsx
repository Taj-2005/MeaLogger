"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Health Enthusiast",
    content:
      "Melo has completely changed how I track my meals. The photo-based logging is so quick, and I love seeing my streak grow every day!",
    rating: 5,
  },
  {
    name: "Michael Rodriguez",
    role: "Fitness Coach",
    content:
      "As someone who needs to track meals for my clients, Melo's simplicity and cloud sync make it perfect. I can access everything from any device, and I never lose my data.",
    rating: 5,
  },
  {
    name: "Emily Johnson",
    role: "Busy Professional",
    content:
      "The reminders are a game-changer. I used to forget to log meals, but now the app keeps me consistent. Beautiful UI too!",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-gray-50">
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
              Loved by Users
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what people are saying about Melo
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 relative"
              >
                <Quote className="w-12 h-12 text-blue-500 opacity-20 absolute top-4 right-4" />
                
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed relative z-10">
                  "{testimonial.content}"
                </p>

                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

