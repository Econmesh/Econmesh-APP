import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/site-config";
import { useTheme } from "next-themes";

const LOGO_SIZES = {
	default: { className: "h-8 w-auto md:h-9", width: 180, height: 36 },
	lg: { className: "h-14 w-auto md:h-16", width: 320, height: 64 },
} as const;

type LogoProps = {
	className?: string;
	width?: number;
	height?: number;
	size?: keyof typeof LOGO_SIZES;
};

export function Logo({ className, width, height, size = "default" }: LogoProps) {
	const preset = LOGO_SIZES[size];

	const { theme } = useTheme();

	return (
		<Link href="/" className={className} aria-label={`${siteConfig.name} — início`}>
			<Image
				src={`${theme == "dark" ? "/ECONMESH-LOGO-BRANCO.png" : "/ECONMESH-LOGO.png"}`}
				alt={siteConfig.name}
				width={width ?? preset.width}
				height={height ?? preset.height}
				className={preset.className}
				priority
			/>
		</Link>
	);
}
