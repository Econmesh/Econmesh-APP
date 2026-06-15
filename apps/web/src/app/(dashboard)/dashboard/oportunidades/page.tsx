"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Input } from "@econmesh-app/ui/components/input";
import { Filter, Plus, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { OpportunityFilters } from "@/modules/opportunities/components/opportunity-filters";
import { OpportunityList } from "@/modules/opportunities/components/opportunity-list";
import { useDebouncedValue } from "@/modules/opportunities/hooks/use-debounced-value";
import { useOpportunities } from "@/modules/opportunities/hooks/use-opportunities";
import type { OpportunityListParams } from "@/types/api";

const DEFAULT_FILTERS: OpportunityListParams = {
  sort: "newest",
};

export default function OportunidadesPage() {
  const [filters, setFilters] = useState<OpportunityListParams>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  const queryParams = useMemo(
    () => ({ ...filters, q: debouncedSearch || undefined }),
    [filters, debouncedSearch],
  );

  const { opportunities, loading, loadingMore, hasMore, total, loadMore, error } =
    useOpportunities(queryParams);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Oportunidades</h1>
          <p className="text-sm text-muted-foreground">
            Economia circular — encontre materiais, parcerias e ativos
            compartilhados.
          </p>
        </div>
        <Link href={"/dashboard/oportunidades/nova" as Route} className="inline-flex">
          <Button>
            <Plus className="size-4" aria-hidden />
            Publicar oportunidade
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, descrição, categoria ou detalhe técnico…"
          className="pl-9"
          aria-label="Buscar oportunidades"
        />
      </div>

      <div className="flex gap-6">
        <OpportunityFilters
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
        />

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center justify-between lg:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(true)}
            >
              <Filter className="size-4" aria-hidden />
              Filtros
            </Button>
          </div>

          <OpportunityList
            opportunities={opportunities}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            total={total}
            onLoadMore={loadMore}
          />
        </div>
      </div>

      {showMobileFilters ? (
        <OpportunityFilters
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          showMobile
          onCloseMobile={() => setShowMobileFilters(false)}
        />
      ) : null}
    </div>
  );
}
