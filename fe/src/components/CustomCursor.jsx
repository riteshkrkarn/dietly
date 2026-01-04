import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

const CustomCursor = () => {
    const [isHovering, setIsHovering] = useState(false);
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    // Different spring configs for smooth following effect
    const springConfigFast = { damping: 25, stiffness: 400 };
    const springConfigSlow = { damping: 40, stiffness: 200 };

    const cursorXSpring = useSpring(cursorX, springConfigFast);
    const cursorYSpring = useSpring(cursorY, springConfigFast);
    const tailXSpring = useSpring(cursorX, springConfigSlow);
    const tailYSpring = useSpring(cursorY, springConfigSlow);

    useEffect(() => {
        const moveCursor = (e) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        const handleMouseOver = (e) => {
            const target = e.target;
            const isInteractive =
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') ||
                target.closest('a') ||
                target.style.cursor === 'pointer';

            setIsHovering(isInteractive);
        };

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("mouseover", handleMouseOver);

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mouseover", handleMouseOver);
        };
    }, [cursorX, cursorY]);

    return (
        <>
            {/* Trailing blur tail */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9997]"
                style={{
                    x: tailXSpring,
                    y: tailYSpring,
                }}
            >
                <motion.div
                    className="relative -translate-x-1/2 -translate-y-1/2 bg-green-400/20 rounded-full blur-xl"
                    animate={{
                        width: isHovering ? 80 : 50,
                        height: isHovering ? 80 : 50,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
            </motion.div>

            {/* Crosshair - Horizontal line */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9999]"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                }}
            >
                <motion.div
                    className="relative -translate-x-1/2 -translate-y-1/2 bg-green-500 rounded-full"
                    animate={{
                        width: isHovering ? 30 : 20,
                        height: 2,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
            </motion.div>

            {/* Crosshair - Vertical line */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9999]"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                }}
            >
                <motion.div
                    className="relative -translate-x-1/2 -translate-y-1/2 bg-green-500 rounded-full"
                    animate={{
                        width: 2,
                        height: isHovering ? 30 : 20,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
            </motion.div>

            {/* Center dot */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[10000]"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                }}
            >
                <motion.div
                    className="relative -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg shadow-green-500/50"
                    animate={{
                        width: isHovering ? 8 : 6,
                        height: isHovering ? 8 : 6,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                />
            </motion.div>

            {/* Outer expanding circle on hover */}
            {isHovering && (
                <motion.div
                    className="fixed top-0 left-0 pointer-events-none z-[9998]"
                    style={{
                        x: cursorXSpring,
                        y: cursorYSpring,
                    }}
                >
                    <motion.div
                        className="relative -translate-x-1/2 -translate-y-1/2 border-2 border-green-400 rounded-full"
                        initial={{ width: 0, height: 0, opacity: 0 }}
                        animate={{
                            width: 50,
                            height: 50,
                            opacity: [0.6, 0.3, 0.6],
                        }}
                        exit={{ width: 0, height: 0, opacity: 0 }}
                        transition={{
                            width: { type: "spring", stiffness: 300, damping: 20 },
                            height: { type: "spring", stiffness: 300, damping: 20 },
                            opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                        }}
                    />
                </motion.div>
            )}

            {/* Corner brackets for modern tech feel */}
            {isHovering && (
                <motion.div
                    className="fixed top-0 left-0 pointer-events-none z-[9999]"
                    style={{
                        x: cursorXSpring,
                        y: cursorYSpring,
                    }}
                >
                    <motion.div
                        className="relative -translate-x-1/2 -translate-y-1/2"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 90 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Top-left bracket */}
                        <div className="absolute -top-4 -left-4 w-3 h-3 border-t-2 border-l-2 border-green-500" />
                        {/* Top-right bracket */}
                        <div className="absolute -top-4 -right-4 w-3 h-3 border-t-2 border-r-2 border-green-500" />
                        {/* Bottom-left bracket */}
                        <div className="absolute -bottom-4 -left-4 w-3 h-3 border-b-2 border-l-2 border-green-500" />
                        {/* Bottom-right bracket */}
                        <div className="absolute -bottom-4 -right-4 w-3 h-3 border-b-2 border-r-2 border-green-500" />
                    </motion.div>
                </motion.div>
            )}
        </>
    );
};

export default CustomCursor;
