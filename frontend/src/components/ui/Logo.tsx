import clsx from "clsx";

export interface LogoProps {
  className?: string;
  variant?: "auto" | "light" | "dark" | "mark";
  size?: "sm" | "default" | "md" | "lg";
  alt?: string;
}

/**
 * High-fidelity Chhlat AI brand logo component with seamless dark and light mode support.
 *
 * - In light mode: Renders vibrant brand icon with dark navy wordmark.
 * - In dark mode: Renders vibrant brand icon with crisp, high-contrast white wordmark.
 * - Supports 'mark' variant for compact / collapsed sidebars.
 */
export function Logo({
  className,
  variant = "auto",
  size = "default",
  alt = "Chhlat AI",
}: LogoProps) {
  const sizeClass = {
    sm: "h-7 w-auto object-contain",
    default: "h-8 w-auto object-contain",
    md: "h-8.5 w-auto object-contain",
    lg: "h-10 w-auto object-contain",
  }[size];

  if (variant === "mark") {
    return (
      <img
        src="/logocllhatAI-mark.svg"
        alt={alt}
        className={clsx(sizeClass, className)}
      />
    );
  }

  if (variant === "dark") {
    return (
      <img
        src="/logocllhatAI-dark.svg"
        alt={alt}
        className={clsx(sizeClass, className)}
      />
    );
  }

  if (variant === "light") {
    return (
      <img
        src="/logocllhatAI.svg"
        alt={alt}
        className={clsx(sizeClass, className)}
      />
    );
  }

  // Automatic dark/light mode switching based on Tailwind's 'dark' class
  return (
    <>
      <img
        src="/logocllhatAI.svg"
        alt={alt}
        className={clsx(sizeClass, "dark:hidden", className)}
      />
      <img
        src="/logocllhatAI-dark.svg"
        alt={alt}
        className={clsx(sizeClass, "hidden dark:block", className)}
      />
    </>
  );
}

export default Logo;
