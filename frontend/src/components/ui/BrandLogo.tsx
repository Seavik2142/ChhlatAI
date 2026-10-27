import clsx from "clsx";
import type { Platform } from "../../lib/types";

export type PaymentBrand = "bakong" | "aba_payway" | "acleda" | "wing" | "khqr" | "aba";
export type CourierBrand = "jnt" | "jt" | "vet" | "virak" | "grab";

interface BrandLogoProps {
  brand: Platform | PaymentBrand | CourierBrand | string;
  size?: number;
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

/**
 * Pixel-perfect official platform and payment gateway vector logos.
 * Renders instantly with no network flicker.
 */
export function BrandLogo({
  brand,
  size = 40,
  className,
  rounded = "xl",
}: BrandLogoProps) {
  const roundedClass = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  }[rounded];

  // 1. TELEGRAM
  if (brand === "telegram") {
    return (
      <div
        style={{ width: size, height: size }}
        className={clsx(
          "relative shrink-0 overflow-hidden flex items-center justify-center transition-transform",
          roundedClass,
          className
        )}
      >
        <img
          src="/brands/telegram.png"
          alt="Telegram"
          className="size-full object-contain block select-none pointer-events-none"
          loading="eager"
        />
      </div>
    );
  }

  // 2. FACEBOOK MESSENGER
  if (brand === "facebook" || brand === "messenger") {
    return (
      <div
        style={{ width: size, height: size }}
        className={clsx(
          "relative shrink-0 overflow-hidden shadow-xs flex items-center justify-center transition-transform",
          roundedClass,
          className
        )}
      >
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          className="size-full block"
        >
          <defs>
            <radialGradient
              id="msg-bg-live"
              cx="15%"
              cy="100%"
              r="105%"
              fx="15%"
              fy="100%"
            >
              <stop offset="0%" stopColor="#FF6969" />
              <stop offset="25%" stopColor="#A334FA" />
              <stop offset="60%" stopColor="#0064E0" />
              <stop offset="100%" stopColor="#00C6FF" />
            </radialGradient>
          </defs>
          <rect width="48" height="48" rx="14" fill="#F8FAFC" />
          <path
            fill="url(#msg-bg-live)"
            d="M24 3C12.4 3 3 11.8 3 22.8c0 6.2 3 11.8 7.8 15.4V45l6.7-3.7c2 .6 4.2.9 6.5.9 11.6 0 21-8.8 21-19.8S35.6 3 24 3z"
          />
          <path
            fill="#ffffff"
            d="M11 28.2l7.2-11.4 5.9 5.9 8.9-5.9-7.2 11.4-5.9-5.9-8.9 5.9z"
          />
        </svg>
      </div>
    );
  }

  // 3. INSTAGRAM
  if (brand === "instagram") {
    return (
      <div
        style={{ width: size, height: size }}
        className={clsx(
          "relative shrink-0 overflow-hidden shadow-xs flex items-center justify-center transition-transform",
          roundedClass,
          className
        )}
      >
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          className="size-full block"
        >
          <defs>
            <radialGradient id="ig-rad-live" cx="15%" cy="105%" r="115%">
              <stop offset="0%" stopColor="#FFDD55" />
              <stop offset="15%" stopColor="#FFDD55" />
              <stop offset="50%" stopColor="#FF543E" />
              <stop offset="100%" stopColor="#C837AB" />
            </radialGradient>
            <linearGradient id="ig-lin-live" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3771C8" />
              <stop offset="50%" stopColor="#6600FF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="14" fill="url(#ig-rad-live)" />
          <rect width="48" height="48" rx="14" fill="url(#ig-lin-live)" />
          <rect
            x="9.5"
            y="9.5"
            width="29"
            height="29"
            rx="8.5"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
          />
          <circle
            cx="24"
            cy="24"
            r="7.2"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
          />
          <circle cx="32.5" cy="15.5" r="1.8" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  // 4. TIKTOK
  if (brand === "tiktok") {
    return (
      <div
        style={{ width: size, height: size }}
        className={clsx(
          "relative shrink-0 overflow-hidden shadow-xs flex items-center justify-center bg-[#010101] transition-transform",
          roundedClass,
          className
        )}
      >
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          className="size-full block"
        >
          <rect width="48" height="48" rx="14" fill="#010101" />
          <g transform="translate(6, 6)">
            {/* Cyan Offset */}
            <path
              d="M23.5 10.8c-1.6-1.1-2.7-2.9-2.9-5h-3.8v15.2c0 1.9-1.6 3.5-3.5 3.5s-3.5-1.6-3.5-3.5 1.6-3.5 3.5-3.5c.3 0 .7.1 1 .2v-4c-.3 0-.7-.1-1-.1-4.1 0-7.5 3.4-7.5 7.5s3.4 7.5 7.5 7.5 7.5-3.4 7.5-7.5v-8.8c1.5 1.1 3.4 1.8 5.3 1.9v-3.9c-1-.1-1.9-.4-2.6-1z"
              fill="#25F4EE"
            />
            {/* Magenta Offset */}
            <path
              d="M25.5 12.8c-1.6-1.1-2.7-2.9-2.9-5h-3.8v15.2c0 1.9-1.6 3.5-3.5 3.5s-3.5-1.6-3.5-3.5 1.6-3.5 3.5-3.5c.3 0 .7.1 1 .2v-4c-.3 0-.7-.1-1-.1-4.1 0-7.5 3.4-7.5 7.5s3.4 7.5 7.5 7.5 7.5-3.4 7.5-7.5v-8.8c1.5 1.1 3.4 1.8 5.3 1.9v-3.9c-1-.1-1.9-.4-2.6-1z"
              fill="#FE2C55"
            />
            {/* White Body */}
            <path
              d="M24.5 11.8c-1.6-1.1-2.7-2.9-2.9-5h-3.8v15.2c0 1.9-1.6 3.5-3.5 3.5s-3.5-1.6-3.5-3.5 1.6-3.5 3.5-3.5c.3 0 .7.1 1 .2v-4c-.3 0-.7-.1-1-.1-4.1 0-7.5 3.4-7.5 7.5s3.4 7.5 7.5 7.5 7.5-3.4 7.5-7.5v-8.8c1.5 1.1 3.4 1.8 5.3 1.9v-3.9c-1-.1-1.9-.4-2.6-1z"
              fill="#FFFFFF"
            />
          </g>
        </svg>
      </div>
    );
  }

  // 5. BAKONG KHQR
  if (brand === "bakong" || brand === "khqr") {
    return (
      <div
        style={{ width: size, height: size }}
        className={clsx(
          "relative shrink-0 overflow-hidden shadow-xs flex items-center justify-center bg-[#E1232E] transition-transform border border-red-500/20",
          roundedClass,
          className
        )}
      >
        <img
          src="/brands/bakong_khqr_real.png"
          alt="Bakong KHQR"
          className="size-full object-cover block select-none pointer-events-none"
          loading="eager"
        />
      </div>
    );
  }

  // 6. ABA PAYWAY / ABA BANK
  if (brand === "aba_payway" || brand === "aba") {
    return (
      <div
        style={{ width: size, height: size }}
        className={clsx(
          "relative shrink-0 overflow-hidden shadow-xs flex items-center justify-center bg-[#004860] transition-transform border border-[#004860]/20",
          roundedClass,
          className
        )}
      >
        <img
          src="/brands/aba_square.png"
          alt="ABA Bank / PayWay"
          className="size-full object-cover block select-none pointer-events-none"
          loading="eager"
        />
      </div>
    );
  }

  // 7. ACLEDA BANK
  if (brand === "acleda") {
    return (
      <div
        style={{ width: size, height: size }}
        className={clsx(
          "relative shrink-0 overflow-hidden shadow-xs flex items-center justify-center bg-[#173A67] transition-transform border border-[#173A67]/20",
          roundedClass,
          className
        )}
      >
        <img
          src="/brands/acleda_real.png"
          alt="ACLEDA Bank"
          className="size-full object-contain p-0.5 block select-none pointer-events-none"
          loading="eager"
        />
      </div>
    );
  }

  // 8. WING BANK
  if (brand === "wing") {
    return (
      <div
        style={{ width: size, height: size }}
        className={clsx(
          "relative shrink-0 overflow-hidden shadow-xs flex items-center justify-center transition-transform",
          roundedClass,
          className
        )}
      >
        <img
          src="/brands/wing.svg"
          alt="Wing Bank"
          className="size-full object-cover block select-none pointer-events-none"
          loading="eager"
        />
      </div>
    );
  }

  // 9. J&T EXPRESS
  if (brand === "jnt" || brand === "jt") {
    return (
      <div
        style={{ width: size, height: size }}
        className={clsx(
          "relative shrink-0 overflow-hidden shadow-xs flex items-center justify-center transition-transform",
          roundedClass,
          className
        )}
      >
        <img
          src="/brands/jnt.svg"
          alt="J&T Express"
          className="size-full object-cover block select-none pointer-events-none"
          loading="eager"
        />
      </div>
    );
  }

  // 10. VIRAK BUNTHAM (VET)
  if (brand === "vet" || brand === "virak") {
    return (
      <div
        style={{ width: size, height: size }}
        className={clsx(
          "relative shrink-0 overflow-hidden shadow-xs flex items-center justify-center transition-transform",
          roundedClass,
          className
        )}
      >
        <img
          src="/brands/vet.svg"
          alt="Virak Buntham"
          className="size-full object-cover block select-none pointer-events-none"
          loading="eager"
        />
      </div>
    );
  }

  // 11. GRAB EXPRESS
  if (brand === "grab") {
    return (
      <div
        style={{ width: size, height: size }}
        className={clsx(
          "relative shrink-0 overflow-hidden shadow-xs flex items-center justify-center transition-transform",
          roundedClass,
          className
        )}
      >
        <img
          src="/brands/grab.svg"
          alt="Grab Express"
          className="size-full object-cover block select-none pointer-events-none"
          loading="eager"
        />
      </div>
    );
  }

  // Fallback for other / generic
  return (
    <div
      style={{ width: size, height: size }}
      className={clsx(
        "flex shrink-0 items-center justify-center bg-slate-100 text-slate-700 font-bold uppercase text-xs border border-slate-200",
        roundedClass,
        className
      )}
    >
      {String(brand).slice(0, 2)}
    </div>
  );
}
