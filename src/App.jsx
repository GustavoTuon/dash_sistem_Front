import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

const dashboardTabs = [
  { id: "overview", label: "Dashboard Geral" },
  { id: "fuel", label: "Dashboard Combustível" },
];

function formatCurrency(value) {
  return currencyFormatter.format(value ?? 0);
}

function formatCompactCurrency(value) {
  return compactCurrencyFormatter.format(value ?? 0);
}

function formatNumber(value) {
  return numberFormatter.format(value ?? 0);
}

function buildQuery(params) {
  const searchParams = new URLSearchParams();

  if (params.placa) {
    searchParams.set("placa", params.placa);
  }

  if (params.categoria) {
    searchParams.set("categoria", params.categoria);
  }

  if (params.months?.length) {
    searchParams.set("months", params.months.join(","));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toggleMonth(month, _selectedMonths, setSelectedMonths) {
  setSelectedMonths((currentMonths) =>
    currentMonths.includes(month)
      ? currentMonths.filter((item) => item !== month)
      : [...currentMonths, month],
  );
}

function toggleCategory(category, selectedCategory, setSelectedCategory) {
  setSelectedCategory(selectedCategory === category ? "" : category);
}

function StatCard({ title, value, helper, tone = "default" }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__title">{title}</span>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__helper">{helper}</span>
    </article>
  );
}

function SectionCard({ title, subtitle, children, actions }) {
  return (
    <section className="section-card">
      <header className="section-card__header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions}
      </header>
      <div className="section-card__body">{children}</div>
    </section>
  );
}

function SortableTable({ columns, rows, emptyMessage = "Nenhum dado encontrado." }) {
  const [sortConfig, setSortConfig] = useState(null);

  const sortedRows = useMemo(() => {
    if (!sortConfig) {
      return rows;
    }

    const sorted = [...rows].sort((left, right) => {
      const leftValue = sortConfig.sortValue
        ? sortConfig.sortValue(left)
        : left[sortConfig.key];
      const rightValue = sortConfig.sortValue
        ? sortConfig.sortValue(right)
        : right[sortConfig.key];

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortConfig.direction === "asc"
          ? leftValue - rightValue
          : rightValue - leftValue;
      }

      return sortConfig.direction === "asc"
        ? String(leftValue ?? "").localeCompare(String(rightValue ?? ""), "pt-BR")
        : String(rightValue ?? "").localeCompare(String(leftValue ?? ""), "pt-BR");
    });

    return sorted;
  }, [rows, sortConfig]);

  if (!rows.length) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  function handleSort(column) {
    setSortConfig((current) => {
      if (current?.key === column.key) {
        return {
          ...column,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        ...column,
        direction: column.defaultDirection ?? "asc",
      };
    });
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((column) => {
              const isActive = sortConfig?.key === column.key;
              const direction = isActive ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕";

              return (
                <th key={column.key}>
                  <button
                    type="button"
                    className={`table-sort ${isActive ? "is-active" : ""}`}
                    onClick={() => handleSort(column)}
                  >
                    <span>{column.label}</span>
                    <span>{direction}</span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr key={row.id ?? row.codigoAbastecimento ?? `${index}-${row[columns[0].key]}`}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonthFilter({ months, selectedMonths, onToggle, onClear }) {
  return (
    <div className="month-filter">
      <div className="month-filter__header">
        <div>
          <span className="month-filter__eyebrow">Filtro por referência</span>
          <h3>Selecione um ou mais meses</h3>
        </div>
        <button type="button" className="ghost-button" onClick={onClear}>
          Limpar filtro
        </button>
      </div>

      <div className="month-filter__chips">
        {months.map((month) => {
          const isActive = selectedMonths.includes(month.value);

          return (
            <button
              key={month.value}
              type="button"
              className={`month-chip ${isActive ? "is-active" : ""}`}
              onClick={() => onToggle(month.value)}
            >
              {month.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CostIndicatorGrid({ items }) {
  return (
    <div className="cost-indicator-grid">
      {items.map((item) => (
        <article key={item.id} className="cost-indicator-card">
          <span>{item.label}</span>
          <strong>{formatCurrency(item.total)}</strong>
        </article>
      ))}
    </div>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [plates, setPlates] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [overviewData, setOverviewData] = useState(null);
  const [fuelData, setFuelData] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const categoryScrollRef = useRef(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const overviewQuery = buildQuery({
          placa: selectedPlate,
          months: selectedMonths,
          categoria: selectedCategory,
        });

        const fuelQuery = buildQuery({
          placa: selectedPlate,
          months: selectedMonths,
        });

        const diagnosticsQuery = buildQuery({
          months: selectedMonths,
          categoria: selectedCategory,
        });

        const [platesResponse, monthsResponse, overviewResponse, fuelResponse] = await Promise.all([
          fetch(`${API_URL}/plates`),
          fetch(`${API_URL}/months`),
          fetch(`${API_URL}/overview${overviewQuery}`),
          fetch(`${API_URL}/fuel${fuelQuery}`),
        ]);

        let diagnosticsJson = null;
        try {
          const diagnosticsResponse = await fetch(`${API_URL}/diagnostics${diagnosticsQuery}`);
          if (diagnosticsResponse.ok) {
            diagnosticsJson = await diagnosticsResponse.json();
          }
        } catch {
          diagnosticsJson = null;
        }

        if (
          !platesResponse.ok ||
          !monthsResponse.ok ||
          !overviewResponse.ok ||
          !fuelResponse.ok
        ) {
          throw new Error("Falha ao carregar os dashboards.");
        }

        const [platesJson, monthsJson, overviewJson, fuelJson] = await Promise.all([
          platesResponse.json(),
          monthsResponse.json(),
          overviewResponse.json(),
          fuelResponse.json(),
        ]);

        setPlates(platesJson);
        setMonths(monthsJson);
        setOverviewData(overviewJson);
        setFuelData(fuelJson);
        setDiagnostics(diagnosticsJson);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [selectedPlate, selectedMonths, selectedCategory]);

  useEffect(() => {
    if (!loading && categoryScrollRef.current !== null) {
      window.scrollTo({ top: categoryScrollRef.current });
      categoryScrollRef.current = null;
    }
  }, [loading]);

  const selectedPlateInfo =
    plates.find((plate) => plate.placa === selectedPlate) ?? plates[0];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__inner">
          <div className="brand-block">
            <div className="brand-lockup">
              <div className="brand-mark" aria-hidden="true">
                <span className="brand-mark__rb brand-mark__rb--dark">R</span>
                <span className="brand-mark__rb brand-mark__rb--light">B</span>
              </div>
              <div className="brand-copy">
                <span className="brand-block__eyebrow">Transportes Rodoviários</span>
                <h1>Rodobach</h1>
              </div>
            </div>
            <p>
              Painel executivo para acompanhar custos, abastecimentos e resultado
              por placa com uma leitura clara para o cliente.
            </p>
            <div className="brand-accent-line" />
          </div>

          <div className="filter-card">
            <label htmlFor="placa">Placa</label>
            <div className="select-shell">
              <select
                id="placa"
                value={selectedPlate}
                onChange={(event) => setSelectedPlate(event.target.value)}
              >
                <option value="">Todas as placas</option>
                {plates.map((plate) => (
                  <option key={plate.placa} value={plate.placa}>
                    {plate.placa}
                  </option>
                ))}
              </select>
            </div>

            <small>
              {selectedPlateInfo
                ? `${selectedPlateInfo.descricao ?? "Veículo"} | ${
                    selectedPlateInfo.empresa ?? "Empresa não informada"
                  }`
                : "Filtro geral para toda a base"}
            </small>
          </div>

          <nav className="nav-tabs" aria-label="Dashboards">
            {dashboardTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "is-active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="content">
        <section className="hero">
          <div>
            <span className="hero__eyebrow">Visão executiva Rodobach</span>
            <h2>
              {activeTab === "overview"
                ? "Custos, receitas e lucro por placa"
                : "Controle de abastecimentos e eficiência"}
            </h2>
            <p>
              Clique nos meses para filtrar toda a tela. Você pode combinar mais
              de uma referência ao mesmo tempo.
            </p>
          </div>
          <div className="hero__status">
            <span>Meses ativos</span>
            <strong>{selectedMonths.length || months.length}</strong>
          </div>
        </section>

        <MonthFilter
          months={months}
          selectedMonths={selectedMonths}
          onToggle={(month) => toggleMonth(month, selectedMonths, setSelectedMonths)}
          onClear={() => setSelectedMonths([])}
        />

        {!error && diagnostics ? (
          <section className="diagnostics-strip diagnostics-strip--compact">
            <article className="diagnostic-pill">
              <span>Média de receita por competência</span>
              <strong>{formatCurrency(diagnostics.averages.receitaMediaPorCompetencia)}</strong>
            </article>
            <article className="diagnostic-pill">
              <span>Média de custo por competência</span>
              <strong>{formatCurrency(diagnostics.averages.custoMedioPorCompetencia)}</strong>
            </article>
            <article className="diagnostic-pill">
              <span>Média por abastecimento</span>
              <strong>{formatCurrency(diagnostics.averages.ticketMedioAbastecimento)}</strong>
            </article>
          </section>
        ) : null}

        {selectedCategory ? (
          <div className="selection-banner">
            Filtrando categoria: <strong>{selectedCategory}</strong>
            <button type="button" className="ghost-button" onClick={() => setSelectedCategory("")}>
              Limpar categoria
            </button>
          </div>
        ) : null}

        {loading ? (
          !overviewData && !fuelData ? (
            <div className="feedback-card">Carregando dados do dashboard...</div>
          ) : null
        ) : null}
        {error ? (
          <div className="feedback-card feedback-card--error">{error}</div>
        ) : null}

        {!error && activeTab === "overview" && overviewData ? (
          <OverviewDashboard
            data={overviewData}
            selectedMonths={selectedMonths}
            selectedCategory={selectedCategory}
            onToggleMonth={(month) =>
              toggleMonth(month, selectedMonths, setSelectedMonths)
            }
            onToggleCategory={(category) => {
              categoryScrollRef.current = window.scrollY;
              toggleCategory(category, selectedCategory, setSelectedCategory);
            }}
          />
        ) : null}

        {!error && activeTab === "fuel" && fuelData ? (
          <FuelDashboard
            data={fuelData}
            selectedMonths={selectedMonths}
            onToggleMonth={(month) =>
              toggleMonth(month, selectedMonths, setSelectedMonths)
            }
          />
        ) : null}
      </main>
    </div>
  );
}

function OverviewDashboard({
  data,
  selectedMonths,
  selectedCategory,
  onToggleMonth,
  onToggleCategory,
}) {
  return (
    <div className="dashboard-grid">
      <div className="stats-grid">
        <StatCard
          title="Receita Total"
          value={formatCurrency(data.summary.receitaTotal)}
          helper="Entradas consolidadas da placa"
          tone="primary"
        />
        <StatCard
          title="Custo Total"
          value={formatCurrency(data.summary.custoTotal)}
          helper="Despesas e custos operacionais"
          tone="danger"
        />
        <StatCard
          title="Lucro Total"
          value={formatCurrency(data.summary.lucroTotal)}
          helper={`${formatNumber(data.summary.margemPercentual)}% de margem`}
          tone={data.summary.lucroTotal >= 0 ? "success" : "danger"}
        />
        <StatCard
          title="Média por Competência"
          value={formatCurrency(data.summary.ticketMedioReceita)}
          helper={`${formatNumber(data.summary.totalCompetencias)} competências filtradas`}
        />
      </div>

      <SectionCard
        title="Receita x custo x lucro"
        subtitle="Clique no mês para aplicar ou remover o filtro"
      >
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8e6f2" />
              <XAxis dataKey="label" stroke="#556579" />
              <YAxis stroke="#556579" tickFormatter={formatCompactCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="receita"
                name="Receita"
                stroke="#67E87B"
                fill="rgba(103, 232, 123, 0.14)"
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="custo"
                name="Custo"
                stroke="#D84C4C"
                fill="rgba(216, 76, 76, 0.16)"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="lucro"
                name="Resultado"
                stroke="#2E78B4"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{
                  r: 6,
                  onClick: (_event, payload) => onToggleMonth(payload.payload.referencia),
                }}
              >
                <LabelList
                  dataKey="lucro"
                  position="top"
                  formatter={(value) => formatCompactCurrency(value)}
                  className="chart-label chart-label--blue"
                />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {!!selectedMonths.length ? (
          <div className="selection-caption">
            Filtrando: {selectedMonths.join(", ")}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Custos detalhados"
        subtitle="Principais componentes de custo separados para leitura executiva"
      >
        <CostIndicatorGrid items={data.costIndicators} />
      </SectionCard>

      <SectionCard
        title="Custos por categoria"
        subtitle="Clique em uma categoria para filtrar todo o dashboard financeiro"
      >
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart
              data={[...data.categories].sort((a, b) => b.total - a.total)}
              layout="vertical"
              margin={{ left: 24, right: 24 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eef5" horizontal={false} />
              <XAxis type="number" stroke="#556579" tickFormatter={formatCompactCurrency} />
              <YAxis type="category" dataKey="categoria" stroke="#556579" width={160} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar
                dataKey="total"
                fill="#2E78B4"
                radius={[0, 10, 10, 0]}
                onClick={(payload) => onToggleCategory(payload.categoria)}
              >
                <LabelList
                  dataKey="total"
                  position="right"
                  formatter={(value) => formatCurrency(value)}
                  className="chart-label"
                />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {selectedCategory ? (
          <div className="selection-caption">
            Categoria ativa: {selectedCategory}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Contas com maior impacto"
        subtitle="Ordene as colunas para analisar as maiores despesas"
      >
        <SortableTable
          columns={[
            { key: "conta", label: "Conta" },
            {
              key: "total",
              label: "Total",
              render: (value) => formatCurrency(value),
              sortValue: (row) => row.total,
              defaultDirection: "desc",
            },
          ]}
          rows={data.topAccounts}
        />
      </SectionCard>
    </div>
  );
}

function FuelDashboard({ data, selectedMonths, onToggleMonth }) {
  return (
    <div className="dashboard-grid">
      <div className="stats-grid">
        <StatCard
          title="Gasto com Combustível"
          value={formatCurrency(data.summary.gastoTotal)}
          helper={`${formatNumber(data.summary.totalAbastecimentos)} abastecimentos`}
          tone="danger"
        />
        <StatCard
          title="Litros Abastecidos"
          value={formatNumber(data.summary.litrosTotal)}
          helper="Volume total na base"
        />
        <StatCard
          title="KM Rodado"
          value={formatNumber(data.summary.kmTotal)}
          helper={`Custo médio ${formatCurrency(data.summary.custoPorKm)}/km`}
          tone="primary"
        />
        <StatCard
          title="Média de Consumo"
          value={`${formatNumber(data.summary.mediaConsumo)} km/l`}
          helper={`Ticket médio ${formatCurrency(
            data.summary.ticketMedioAbastecimento,
          )}`}
          tone="success"
        />
      </div>

      <SectionCard
        title="KM percorrido x média do veículo"
        subtitle="Colunas para rodagem e linha para média mensal de consumo"
      >
        <div className="chart-box chart-box--tall">
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8e6f2" />
              <XAxis dataKey="label" stroke="#556579" />
              <YAxis yAxisId="left" stroke="#556579" tickFormatter={formatNumber} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#556579"
                tickFormatter={formatNumber}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "KM Rodado") {
                    return formatNumber(value);
                  }

                  return `${formatNumber(value)} km/l`;
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="kmTotal"
                name="KM Rodado"
                fill="#2E78B4"
                radius={[10, 10, 0, 0]}
                onClick={(payload) => onToggleMonth(payload.referencia)}
              >
                <LabelList
                  dataKey="kmTotal"
                  position="top"
                  formatter={(value) => formatNumber(value)}
                  className="chart-label"
                />
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="mediaConsumo"
                name="Média km/l"
                stroke="#F28C2B"
                strokeWidth={3}
                dot={{ r: 4 }}
              >
                <LabelList
                  dataKey="mediaConsumo"
                  position="top"
                  formatter={(value) => `${formatNumber(value)} km/l`}
                  className="chart-label chart-label--orange"
                />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {!!selectedMonths.length ? (
          <div className="selection-caption">
            Filtrando: {selectedMonths.join(", ")}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Evolução do gasto com combustível"
        subtitle="Valores exibidos para facilitar a identificação mês a mês"
      >
        <div className="chart-box chart-box--tall">
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8e6f2" />
              <XAxis dataKey="label" stroke="#556579" />
              <YAxis stroke="#556579" tickFormatter={formatCompactCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar
                dataKey="gastoTotal"
                name="Custo de combustível"
                fill="#D84C4C"
                radius={[10, 10, 0, 0]}
                onClick={(payload) => onToggleMonth(payload.referencia)}
              >
                <LabelList
                  dataKey="gastoTotal"
                  position="top"
                  formatter={(value) => formatCurrency(value)}
                  className="chart-label chart-label--red"
                />
              </Bar>
              <Line
                type="monotone"
                dataKey="precoMedio"
                name="Preço médio/l"
                stroke="#263A5C"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard
        title="Motoristas"
        subtitle="Ordene as colunas para comparar volume, gasto e consumo"
      >
        <SortableTable
          columns={[
            { key: "motorista", label: "Motorista" },
            {
              key: "abastecimentos",
              label: "Abastecimentos",
              render: (value) => formatNumber(value),
              sortValue: (row) => row.abastecimentos,
              defaultDirection: "desc",
            },
            {
              key: "gastoTotal",
              label: "Gasto Total",
              render: (value) => formatCurrency(value),
              sortValue: (row) => row.gastoTotal,
              defaultDirection: "desc",
            },
            {
              key: "mediaConsumo",
              label: "Média km/l",
              render: (value) => formatNumber(value),
              sortValue: (row) => row.mediaConsumo,
              defaultDirection: "desc",
            },
          ]}
          rows={data.drivers}
        />
      </SectionCard>

      <SectionCard
        title="Postos com maior gasto"
        subtitle="Ordene as colunas para identificar padrões de abastecimento"
      >
        <SortableTable
          columns={[
            { key: "posto", label: "Posto" },
            {
              key: "abastecimentos",
              label: "Abastecimentos",
              render: (value) => formatNumber(value),
              sortValue: (row) => row.abastecimentos,
              defaultDirection: "desc",
            },
            {
              key: "gastoTotal",
              label: "Gasto Total",
              render: (value) => formatCurrency(value),
              sortValue: (row) => row.gastoTotal,
              defaultDirection: "desc",
            },
            {
              key: "precoMedio",
              label: "Preço médio/l",
              render: (value) => formatCurrency(value),
              sortValue: (row) => row.precoMedio,
              defaultDirection: "desc",
            },
          ]}
          rows={data.stations}
        />
      </SectionCard>

      <SectionCard
        title="Últimos abastecimentos"
        subtitle="Ordene as colunas para navegar pelos lançamentos recentes"
      >
        <SortableTable
          columns={[
            {
              key: "dataAbastecimento",
              label: "Data",
              render: (value) => new Date(value).toLocaleDateString("pt-BR"),
              sortValue: (row) => new Date(row.dataAbastecimento).getTime(),
              defaultDirection: "desc",
            },
            { key: "motorista", label: "Motorista" },
            { key: "posto", label: "Posto" },
            {
              key: "kmRodado",
              label: "KM",
              render: (value) => formatNumber(value),
              sortValue: (row) => row.kmRodado,
              defaultDirection: "desc",
            },
            {
              key: "litrosAbastecidos",
              label: "Litros",
              render: (value) => formatNumber(value),
              sortValue: (row) => row.litrosAbastecidos,
              defaultDirection: "desc",
            },
            {
              key: "valorAbastecimento",
              label: "Valor",
              render: (value) => formatCurrency(value),
              sortValue: (row) => row.valorAbastecimento,
              defaultDirection: "desc",
            },
          ]}
          rows={data.recentSupplies}
        />
      </SectionCard>
    </div>
  );
}
