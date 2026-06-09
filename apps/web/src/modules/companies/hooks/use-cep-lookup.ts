"use client";

import { useCallback, useState } from "react";

type CepResult = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export function useCepLookup() {
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (cep: string): Promise<CepResult | null> => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return null;

    setLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) return null;

      const data = (await response.json()) as ViaCepResponse;
      if (data.erro) return null;

      return {
        street: data.logradouro ?? "",
        neighborhood: data.bairro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
      };
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookup, loading };
}
