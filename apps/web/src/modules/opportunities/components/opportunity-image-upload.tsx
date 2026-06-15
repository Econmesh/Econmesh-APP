"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Loader2, Star, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { MAX_OPPORTUNITY_IMAGES } from "@/modules/opportunities/constants";
import { opportunitiesService } from "@/services/opportunities/opportunities.service";
import type { OpportunityImage } from "@/types/api";

type OpportunityImageUploadProps = {
	images: OpportunityImage[];
	onChange: (images: OpportunityImage[]) => void;
	disabled?: boolean;
};

export function OpportunityImageUpload({
	images,
	onChange,
	disabled,
}: OpportunityImageUploadProps) {
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	async function handleFilesSelected(fileList: FileList | null) {
		if (!fileList?.length) return;

		const remaining = MAX_OPPORTUNITY_IMAGES - images.length;
		if (remaining <= 0) {
			toast.error(`Máximo de ${MAX_OPPORTUNITY_IMAGES} imagens.`);
			return;
		}

		const files = Array.from(fileList).slice(0, remaining);
		setUploading(true);

		try {
			const uploaded: OpportunityImage[] = [];
			for (const file of files) {
				if (!file.type.startsWith("image/")) {
					toast.error(`${file.name} não é uma imagem válida.`);
					continue;
				}
				const image = await opportunitiesService.uploadImage(file);
				uploaded.push(image);
			}

			const nextImages = [...images, ...uploaded].map((img, index) => ({
				...img,
				sort_order: index,
				is_primary: images.length === 0 && index === 0 ? true : img.is_primary,
			}));

			if (!nextImages.some((img) => img.is_primary) && nextImages[0]) {
				nextImages[0] = { ...nextImages[0], is_primary: true };
			}

			onChange(nextImages);
		} catch {
			toast.error("Não foi possível enviar as imagens.");
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	}

	function removeImage(index: number) {
		const next = images
			.filter((_, i) => i !== index)
			.map((img, i) => ({
				...img,
				sort_order: i,
			}));
		if (!next.some((img) => img.is_primary) && next[0]) {
			next[0] = { ...next[0], is_primary: true };
		}
		onChange(next);
	}

	function setPrimary(index: number) {
		onChange(
			images.map((img, i) => ({
				...img,
				is_primary: i === index,
			})),
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-3">
				{images.map((image, index) => (
					<div
						key={image.storage_key}
						className="group relative size-24 overflow-hidden border border-border bg-muted"
					>
						<Image
							src={image.url}
							alt={`Imagem ${index + 1}`}
							fill
							className="object-cover"
							unoptimized
						/>
						{image.is_primary ? (
							<span className="absolute top-1 left-1 flex items-center gap-0.5 bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
								<Star className="size-2.5 fill-current" aria-hidden />
								Principal
							</span>
						) : null}
						<div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
							{!image.is_primary ? (
								<Button
									type="button"
									size="icon-xs"
									variant="secondary"
									onClick={() => setPrimary(index)}
									aria-label="Definir como principal"
								>
									<Star className="size-3" aria-hidden />
								</Button>
							) : null}
							<Button
								type="button"
								size="icon-xs"
								variant="destructive"
								onClick={() => removeImage(index)}
								aria-label="Remover imagem"
							>
								<Trash2 className="size-3" aria-hidden />
							</Button>
						</div>
					</div>
				))}

				{images.length < MAX_OPPORTUNITY_IMAGES ? (
					<button
						type="button"
						disabled={disabled || uploading}
						onClick={() => fileInputRef.current?.click()}
						className="flex size-24 flex-col items-center justify-center gap-1 border border-border border-dashed bg-muted/30 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
					>
						{uploading ? (
							<Loader2 className="size-5 animate-spin" aria-hidden />
						) : (
							<Upload className="size-5" aria-hidden />
						)}
						Adicionar
					</button>
				) : null}
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				multiple
				className="sr-only"
				onChange={(e) => void handleFilesSelected(e.target.files)}
			/>

			<p className="text-muted-foreground text-xs">
				Até {MAX_OPPORTUNITY_IMAGES} imagens. Clique na estrela para definir a
				imagem principal.
			</p>
		</div>
	);
}
