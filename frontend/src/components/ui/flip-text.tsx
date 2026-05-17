import { AnimatePresence, motion, type Variants } from "framer-motion";
import { cn } from "../../lib/utils";

interface FlipTextProps {
  children: string;
  duration?: number;
  delay?: number;
  delayMultiple?: number;
  framerProps?: Variants;
  className?: string;
}

export function FlipText({
  children,
  duration = 0.5,
  delay = 0,
  delayMultiple = 0.08,
  framerProps = {
    hidden: { rotateX: -90, opacity: 0 },
    visible: { rotateX: 0, opacity: 1 },
  },
  className,
}: FlipTextProps) {
  return (
    <div className="flex justify-center flex-wrap space-x-1" style={{ perspective: "1000px" }}>
      <AnimatePresence mode="wait">
        {children.split("").map((char, i) => (
          <motion.span
            key={i}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={framerProps}
            transition={{ duration, delay: delay + i * delayMultiple }}
            className={cn("origin-center drop-shadow-sm inline-block", className)}
          >
            {char === " " ? <span>&nbsp;</span> : char}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
