import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hidden, setHidden] = useState(false);
    const { scrollY } = useScroll();

    // Auto-hide navbar on scroll down
    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    const navLinks = [
        { path: "/how-it-works", label: "How it works" },
        { path: "/dashboard", label: "Dashboard" },
        { path: "/about", label: "About" },
    ];

    const isActive = (path) => location.pathname === path;
    const showBackButton = ["/chat", "/scan"].includes(location.pathname);

    // Animation variants
    const navbarVariants = {
        visible: { y: 0, opacity: 1 },
        hidden: { y: "-100%", opacity: 0 }
    };

    const logoVariants = {
        initial: { scale: 1 },
        hover: {
            scale: 1.05,
            transition: { type: "spring", stiffness: 400, damping: 10 }
        },
        tap: { scale: 0.95 }
    };

    const linkVariants = {
        initial: { y: 0 },
        hover: {
            y: -2,
            transition: { type: "spring", stiffness: 300, damping: 15 }
        }
    };

    const buttonVariants = {
        hover: {
            scale: 1.05,
            transition: { type: "spring", stiffness: 400, damping: 10 }
        },
        tap: { scale: 0.95 }
    };

    const mobileMenuVariants = {
        hidden: {
            opacity: 0,
            height: 0,
            transition: {
                duration: 0.3,
                ease: "easeInOut"
            }
        },
        visible: {
            opacity: 1,
            height: "auto",
            transition: {
                duration: 0.3,
                ease: "easeInOut",
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const mobileItemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { type: "spring", stiffness: 300, damping: 25 }
        }
    };

    const hamburgerTopVariants = {
        closed: { rotate: 0, y: 0 },
        open: {
            rotate: 45,
            y: 8,
            transition: { duration: 0.3, ease: "easeInOut" }
        }
    };

    const hamburgerMiddleVariants = {
        closed: { opacity: 1 },
        open: {
            opacity: 0,
            transition: { duration: 0.2 }
        }
    };

    const hamburgerBottomVariants = {
        closed: { rotate: 0, y: 0 },
        open: {
            rotate: -45,
            y: -8,
            transition: { duration: 0.3, ease: "easeInOut" }
        }
    };

    const backButtonVariants = {
        initial: { x: -10, opacity: 0 },
        animate: {
            x: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 25 }
        },
        hover: {
            x: -5,
            transition: { type: "spring", stiffness: 400, damping: 10 }
        }
    };

    return (
        <motion.nav
            variants={navbarVariants}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onMouseEnter={() => setHidden(false)}
            className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100"
        >
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Back Button or Logo */}
                    {showBackButton ? (
                        <motion.button
                            variants={backButtonVariants}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate("/")}
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            <motion.svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                animate={{ x: [0, -3, 0] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                    ease: "easeInOut"
                                }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </motion.svg>
                            <span className="font-medium">Back</span>
                        </motion.button>
                    ) : (
                        <Link to="/">
                            <motion.div
                                variants={logoVariants}
                                initial="initial"
                                whileHover="hover"
                                whileTap="tap"
                                className="flex items-center gap-2"
                            >
                                <motion.svg
                                    className="w-8 h-8 text-gray-900"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6, ease: "easeInOut" }}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </motion.svg>
                                <span className="text-xl font-semibold text-gray-900">dietly</span>
                            </motion.div>
                        </Link>
                    )}

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link key={link.path} to={link.path}>
                                <motion.div
                                    variants={linkVariants}
                                    initial="initial"
                                    whileHover="hover"
                                    className="relative"
                                >
                                    <span className={`font-medium text-sm transition-colors ${isActive(link.path)
                                        ? "text-green-600"
                                        : "text-gray-700 hover:text-gray-900"
                                        }`}>
                                        {link.label}
                                    </span>
                                    {isActive(link.path) && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-green-600"
                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        ))}
                    </div>

                    {/* CTA Buttons - Desktop */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Login Button with Shimmer & 3D Effect */}
                        <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            className="px-5 py-2 text-sm font-semibold text-green-700 border-2 border-green-600 rounded-full relative overflow-hidden group"
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            {/* Hover background */}
                            <motion.span
                                className="absolute inset-0 bg-green-50"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            />

                            {/* Shimmer effect */}
                            <motion.span
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                                initial={{ x: "-100%", skewX: -20 }}
                                whileHover={{
                                    x: "200%",
                                    transition: { duration: 0.6 }
                                }}
                            />

                            {/* Border glow effect */}
                            <motion.span
                                className="absolute inset-0 rounded-full border-2 border-green-400"
                                initial={{ opacity: 0, scale: 1 }}
                                whileHover={{
                                    opacity: [0, 0.5, 0],
                                    scale: [1, 1.1, 1.2],
                                    transition: { duration: 0.6 }
                                }}
                            />

                            <span className="relative z-10">Log in</span>
                        </motion.button>

                        {/* Start Scan Button with Advanced Effects */}
                        <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => navigate("/scan")}
                            animate={{
                                y: [0, -2, 0],
                                transition: {
                                    repeat: Infinity,
                                    duration: 2,
                                    ease: "easeInOut"
                                }
                            }}
                            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 rounded-full relative overflow-hidden group shadow-lg shadow-green-600/30"
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            {/* Animated gradient background */}
                            <motion.span
                                className="absolute inset-0 bg-gradient-to-r from-green-500 via-green-600 to-green-500"
                                animate={{
                                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                                style={{ backgroundSize: "200% 100%" }}
                            />

                            {/* Circular ripple on hover */}
                            <motion.span
                                className="absolute inset-0 bg-white rounded-full"
                                initial={{ scale: 0, opacity: 0.3 }}
                                whileHover={{
                                    scale: 2.5,
                                    opacity: 0,
                                    transition: { duration: 0.6 }
                                }}
                            />

                            {/* Shimmer effect */}
                            <motion.span
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-25"
                                animate={{ x: ["-100%", "200%"] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 2,
                                    ease: "linear",
                                    repeatDelay: 1
                                }}
                                style={{ skewX: -20 }}
                            />

                            {/* Glow pulse effect */}
                            <motion.span
                                className="absolute inset-0 rounded-full"
                                animate={{
                                    boxShadow: [
                                        "0 0 20px rgba(13, 148, 136, 0.4)",
                                        "0 0 30px rgba(13, 148, 136, 0.6)",
                                        "0 0 20px rgba(13, 148, 136, 0.4)"
                                    ]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 2,
                                    ease: "easeInOut"
                                }}
                            />

                            {/* Hover scale background */}
                            <motion.span
                                className="absolute inset-0 bg-green-700 rounded-full"
                                initial={{ scale: 0 }}
                                whileHover={{
                                    scale: 1,
                                    transition: { duration: 0.3 }
                                }}
                            />

                            {/* 3D depth on hover */}
                            <motion.span
                                className="relative z-10 flex items-center gap-2"
                                whileHover={{
                                    z: 10,
                                    transition: { duration: 0.2 }
                                }}
                            >
                                Start a scan
                                <motion.span
                                    animate={{ x: [0, 3, 0] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1.5,
                                        ease: "easeInOut"
                                    }}
                                >
                                    →
                                </motion.span>
                            </motion.span>
                        </motion.button>
                    </div>

                    {/* Mobile Menu Button */}
                    <motion.button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors relative z-50"
                        aria-label="Toggle menu"
                        whileTap={{ scale: 0.9 }}
                    >
                        <div className="w-6 h-5 flex flex-col justify-between">
                            <motion.span
                                variants={hamburgerTopVariants}
                                animate={isMenuOpen ? "open" : "closed"}
                                className="w-full h-0.5 bg-current origin-center"
                            />
                            <motion.span
                                variants={hamburgerMiddleVariants}
                                animate={isMenuOpen ? "open" : "closed"}
                                className="w-full h-0.5 bg-current"
                            />
                            <motion.span
                                variants={hamburgerBottomVariants}
                                animate={isMenuOpen ? "open" : "closed"}
                                className="w-full h-0.5 bg-current origin-center"
                            />
                        </div>
                    </motion.button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            variants={mobileMenuVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="md:hidden overflow-hidden"
                        >
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                {navLinks.map((link) => (
                                    <motion.div
                                        key={link.path}
                                        variants={mobileItemVariants}
                                    >
                                        <Link
                                            to={link.path}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`block px-4 py-2.5 font-medium text-sm transition-colors rounded-lg ${isActive(link.path)
                                                ? "bg-green-50 text-green-700"
                                                : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}
                                <motion.div
                                    variants={mobileItemVariants}
                                    className="pt-2 space-y-2"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full px-4 py-2.5 text-sm font-semibold text-green-700 border-2 border-green-600 rounded-full hover:bg-green-50 transition-all"
                                    >
                                        Log in
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            navigate("/scan");
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-full hover:bg-green-700 transition-all"
                                    >
                                        Start a scan
                                    </motion.button>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.nav>
    );
};

export default Navbar;
