
import Image from "next/image";
import { ReactNode, useRef, useState } from "react"

export const GIFtext = ({
    children,
    GifName,
    width = 32,
    height = 32,
}: {
    children: ReactNode;
    GifName: string;
    width?: number;
    height?: number;
}) => {
    const containerRef = useRef<HTMLSpanElement>(null);
    const [positionX, setPositionX] = useState<number | null>(null);
    const [show, setShow] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
        if (containerRef.current) {
            const bounds = containerRef.current.getBoundingClientRect();
            setPositionX(e.clientX - bounds.left);
        }
        setShow(true);
    };

    const handleMouseLeave = () => {
        setShow(false);
    };

    return (
        <span
            ref={containerRef}
            style={{ position: "relative", display: "inline-block" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {show && positionX !== null && (
                <Image
                    unoptimized
                    src={`/${GifName}`}
                    alt=""
                    width={width}
                    height={height}
                    style={{
                        position: "absolute",
                        left: positionX,
                        top: -height + 32 > -32 ? -32 : -height + 32, // Adjust as needed for GIF height/position
                        transform: "translateX(-50%)",
                        pointerEvents: "none",
                        zIndex: 30,
                    }}
                />
            )}
            <span>{children}</span>
        </span>
    );
};
