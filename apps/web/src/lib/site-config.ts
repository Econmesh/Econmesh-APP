import { env } from "@econmesh-app/env/web";

export const siteConfig = {
	name: "ECONMESH",
	tagline: "CleanTech para a transição circular",
	description:
		"Um ecossistema digital que mapeia, conecta e viabiliza fluxos de recursos (materiais, água, energia e serviços) entre diversas empresas, de forma inteligente e confiável.",
	url: env.NEXT_PUBLIC_SITE_URL ?? "https://econmesh.com.br",
	contact: {
		email: "contato@econmesh.com.br",
		phone: "+55 (11) 0000-0000",
		location: "Recife - PE, Brasil",
	},
	newsletter: {
		mailto: "contato@econmesh.com.br",
		subject: "Newsletter ECONMESH — Novidades",
	},
	social: [
		{
			label: "LinkedIn",
			href: "#",
		},
		{
			label: "Instagram",
			href: "#",
		},
		{
			label: "YouTube",
			href: "#",
		},
	],
} as const;

export const navLinks = [
	{ href: "#home", label: "HOME" },
	{ href: "#solucoes", label: "SOLUÇÕES" },
	{ href: "#sobre", label: "SOBRE" },
	{ href: "#contato", label: "CONTATO" },
	{ href: "#novidades", label: "BLOG" },
] as const;

export const featureCards = [
	{
		title: "MANUFATURA REVERSA ITINERANTE",
		icon: "refresh" as const,
	},
	{
		title: "RECURSOS ENERGÉTICOS",
		icon: "zap" as const,
	},
	{
		title: "DIAGNÓSTICO DE CIRCULARIDADE",
		icon: "recycle" as const,
	},
] as const;

export const footerQuickLinks = [
	{ href: "#home", label: "Home" },
	{ href: "#solucoes", label: "Soluções" },
	{ href: "#sobre", label: "Sobre" },
	{ href: "#contato", label: "Contato" },
	{ href: "#novidades", label: "Blog" },
] as const;
