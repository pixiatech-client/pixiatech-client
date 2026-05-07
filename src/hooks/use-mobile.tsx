import * as React from "react"

const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // This effect runs only on the client side
    const checkDevice = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check
    checkDevice();
    
    // Add event listener
    window.addEventListener("resize", checkDevice);

    // Cleanup listener on unmount
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return isMobile;
}
