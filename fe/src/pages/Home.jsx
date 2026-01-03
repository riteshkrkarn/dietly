import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";

const Home = () => {
  const navigate = useNavigate();

  // Refs for scroll-based animations
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  // Scroll progress for hero parallax
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Parallax mappings (transform-only for performance) [web:37][web:40]
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  // Features in-view trigger
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });

  // Variants (kept outside JSX for reuse / cleanliness) [web:31][web:44]
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const heroImageVariants = {
    hidden: { scale: 0.8, opacity: 0, rotateY: -15 },
    visible: {
      scale: 1,
      opacity: 1,
      rotateY: 0,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 15,
        delay: 0.5,
      },
    },
  };

  const floatingAnimation = {
    y: [0, -20, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  const cardVariants = {
    hidden: { y: 60, opacity: 0, scale: 0.9 },
    visible: (i) => ({
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
        delay: i * 0.15,
      },
    }),
    hover: {
      y: -10,
      scale: 1.03,
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: {
      scale: 1.05,
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
    tap: { scale: 0.95 },
  };

  const iconVariants = {
    rest: { rotate: 0, scale: 1 },
    hover: {
      rotate: 360,
      scale: 1.2,
      transition: { duration: 0.6, ease: "easeInOut" },
    },
  };

  // Keep your existing features array; no changes needed to its content
  const features = [
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      ),
      title: "Instant Insights",
      description:
        "Upload any nutrition label and get instant, plain-language explanations in seconds—no more confusion about what you're eating.",
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      ),
      title: "Ask Anything",
      description:
        "Chat naturally with our AI copilot. Ask about allergies, health impacts, or how this food fits your goals at the moment of decision.",
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      title: "Honest & Clear",
      description:
        "We don't just show you numbers. We explain what they mean, why they matter, and what trade-offs exist—in words you actually understand.",
    },
  ];

  // JSX below is exactly your current UI; it already uses motion.* and variants correctly.
  // No structural / visual changes are needed to satisfy “just add the rest of the things required”.
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative max-w-7xl mx-auto px-6 py-12 md:py-20">
        {/* Animated background blobs */}
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-green-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10"
          style={{ opacity }}
        >
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="space-y-4">
              <motion.p
                className="text-sm font-semibold text-green-600 tracking-wide uppercase inline-block"
                whileHover={{ scale: 1.05, x: 5 }}
              >
                <motion.span
                  className="inline-block"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ✨
                </motion.span>{" "}
                AI NUTRITION COPILOT
              </motion.p>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
                variants={itemVariants}
              >
                Actually{" "}
                <motion.span
                  className="inline-block bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ["0%", "100%", "0%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  understand
                </motion.span>{" "}
                what you're eating
              </motion.h1>

              <motion.p
                className="text-lg text-gray-600 leading-relaxed max-w-xl"
                variants={itemVariants}
              >
                No more scrolling through dense ingredient lists. Just show dietly a label or
                meal, ask your question, and get clear, contextual answers at the exact moment
                you need them.
              </motion.p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div className="flex flex-wrap gap-4" variants={itemVariants}>
              <motion.button
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                onClick={() => navigate("/scan")}
                className="group px-6 py-3.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30 flex items-center gap-2 relative overflow-hidden"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-600"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.svg
                  variants={iconVariants}
                  className="w-5 h-5 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </motion.svg>
                <span className="relative z-10">Scan a Label</span>
              </motion.button>

              <motion.button
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                onClick={() => navigate("/chat")}
                className="px-6 py-3.5 border-2 border-green-600 text-green-700 font-semibold rounded-xl hover:bg-green-50 transition-all relative overflow-hidden group"
              >
                <motion.span
                  className="absolute inset-0 bg-green-50"
                  initial={{ y: "100%" }}
                  whileHover={{ y: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10">Ask AI</span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right - Hero Image with Parallax */}
          <motion.div className="relative" style={{ y }}>
            <motion.div
              variants={heroImageVariants}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              <motion.div
                className="rounded-3xl overflow-hidden shadow-2xl shadow-gray-900/10 relative z-10"
                whileHover={{
                  scale: 1.02,
                  rotateY: 5,
                  rotateX: -5,
                  transition: { duration: 0.3 },
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.img
                  src="/dietly heroimage.png"
                  alt="dietly AI nutrition copilot interface"
                  className="w-full h-auto object-cover"
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </motion.div>

              {/* Floating badge - AI Active */}
              <motion.div
                className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl z-20"
                animate={floatingAnimation}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-gray-900">AI Ready</span>
                </div>
              </motion.div>

              {/* Floating stat */}
              <motion.div
                className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl z-20"
                animate={{
                  y: [0, 15, 0],
                  transition: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                whileHover={{ scale: 1.1, rotate: -5 }}
              >
                <p className="text-xs text-gray-600">Analyzed in</p>
                <p className="text-2xl font-bold text-green-600">&lt;5s</p>
              </motion.div>
            </motion.div>

            {/* Decorative element with parallax */}
            <motion.div
              className="absolute -bottom-6 -right-6 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-30 -z-10"
              style={{ scale }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Cards Section */}
      <section ref={featuresRef} className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            Why{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              dietly
            </span>
            ?
          </motion.h2>
          <motion.p
            className="text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            AI is the interface, not a feature. No forms, no charts—just answers when you need
            them.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={featuresInView ? "visible" : "hidden"}
              whileHover="hover"
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer group"
            >
              <motion.div
                className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <svg
                  className="w-6 h-6 text-green-600 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {feature.icon}
                </svg>
              </motion.div>
              <motion.h3
                className="text-lg font-bold text-gray-900 mb-2"
                initial={{ x: 0 }}
                whileHover={{ x: 5 }}
              >
                {feature.title}
              </motion.h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>

              {/* Hover arrow indicator */}
              <motion.div
                className="mt-4 flex items-center text-green-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ x: -10 }}
                whileHover={{ x: 0 }}
              >
                Learn more
                <motion.svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </motion.svg>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
