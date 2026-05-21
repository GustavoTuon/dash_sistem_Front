import React, { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

const initialForm = {
  axles: 7,
  loadType: "normal",
  operationType: "etc",
  pricingReference: "normal_antt",
  km: 1000,
  invoiceValue: "",
  cteValue: "",
  tollValue: "",
  thirdPartyInsuranceValue: "",
  profitMode: "net_margin",
  profitValue: 30,
  icmsPercent: 12,
  taxMode: "inside",
  manualDriverValue: "",
  manualClientValue: "",
};

const initialRegistryForm = {
  tripNumber: "",
  vehiclePlate: "",
  status: "faltando_dados",
  date: new Date().toISOString().slice(0, 10),
  originCity: "",
  originUf: "SC",
  destinationCity: "",
  destinationUf: "",
  customer: "",
  finalCustomer: "",
  customerValue: "",
  tripKm: "",
  material: "",
  weightKg: "",
  driver: "",
  driverValue: "",
  seller: "",
  serviceTaker: "",
  paymentCondition: "",
  driverPhone: "",
  driverLicenseNumber: "",
  vehicleAntt: "",
  depositAccount: "",
  pixKey: "",
  documents: {
    plates: false,
    antt: false,
    depositAccount: false,
    pixKey: false,
    driverLicense: false,
    proofOfAddress: false,
    driverPhone: false,
  },
  notes: "",
};

const initialDailyAllowanceForm = {
  driver: "",
  startDate: new Date().toISOString().slice(0, 10),
  startTime: "08:00",
  endDate: new Date().toISOString().slice(0, 10),
  endTime: "18:00",
};

const initialDailyParameterForm = {
  id: null,
  code: "",
  label: "",
  triggerTime: "",
  triggerAfterHours: "",
  amount: "",
  active: true,
  sortOrder: 0,
};

const statusOptions = [
  { value: "faltando_dados", label: "Faltando dados" },
  { value: "aguardando_cte", label: "Aguardando CTE" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
];

const paymentConditionOptions = [
  { value: "", label: "Selecione" },
  { value: "avista", label: "A vista" },
  { value: "7_dias", label: "7 dias" },
  { value: "15_dias", label: "15 dias" },
  { value: "30_dias", label: "30 dias" },
  { value: "a_combinar", label: "A combinar" },
];

const emptyRegistrySummary = {
  total: 0,
  customerTotal: 0,
  driverTotal: 0,
  profitTotal: 0,
};

const automaticDocumentFields = {
  vehiclePlate: "plates",
  vehicleAntt: "antt",
  depositAccount: "depositAccount",
  pixKey: "pixKey",
  driverLicenseNumber: "driverLicense",
  driverPhone: "driverPhone",
};

function formatCurrency(value) {
  return currencyFormatter.format(Number(value ?? 0));
}

function parseLocaleNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(
    String(value ?? "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, ""),
  );

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoneyInput(value) {
  if (String(value ?? "").trim() === "") {
    return "";
  }

  return parseLocaleNumber(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseFlexibleDecimal(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const text = String(value ?? "").trim();
  if (!text) {
    return 0;
  }

  if (text.includes(",")) {
    return parseLocaleNumber(text);
  }

  const parsed = Number(text.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  return numberFormatter.format(Number(value ?? 0));
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatPlate(value) {
  const clean = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);

  if (clean.length <= 3) {
    return clean;
  }

  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

function formatUf(value) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
}

function onlyDigits(value, maxLength) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return maxLength ? digits.slice(0, maxLength) : digits;
}

function formatPhone(value) {
  const digits = onlyDigits(value, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function Field({
  label,
  value,
  onChange,
  type = "number",
  step = "0.01",
  suffix,
  placeholder,
  inputMode,
  onBlur,
}) {
  return (
    <label className="quote-field">
      <span>{label}</span>
      <div className="quote-field__control">
        <input
          type={type}
          step={step}
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        {suffix ? <small>{suffix}</small> : null}
      </div>
    </label>
  );
}

function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div className="segmented-control">
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? "is-active" : ""}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FieldHint({ children }) {
  return <p className="field-hint">{children}</p>;
}

function ResultLine({ label, value, tone }) {
  return (
    <div className={`result-line ${tone ? `result-line--${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="checkbox-field">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="checkbox-field">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="quote-field">
      <span>{label}</span>
      <div className="quote-field__control">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function getStatusLabel(value) {
  return statusOptions.find((option) => option.value === value)?.label ?? "Faltando dados";
}

function getPaymentConditionLabel(value) {
  return paymentConditionOptions.find((option) => option.value === value)?.label ?? value ?? "-";
}

function splitCityUf(value) {
  const [city = "", uf = ""] = String(value ?? "").split("/");
  return {
    city: city.trim(),
    uf: formatUf(uf),
  };
}

function getProfitTone(value) {
  return Number(value ?? 0) >= 0 ? "success" : "danger";
}

function getVehicleOwnershipLabel(value) {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (normalized === "P") {
    return "Frota";
  }

  if (normalized === "T") {
    return "Terceiro";
  }

  return "Sem informação";
}

function SuggestField({ label, value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const normalizedValue = String(value ?? "").toLocaleLowerCase("pt-BR");
  const filteredOptions = options
    .filter((option) => option.toLocaleLowerCase("pt-BR").includes(normalizedValue))
    .slice(0, 8);

  return (
    <label className="quote-field suggest-field">
      <span>{label}</span>
      <div className="quote-field__control">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
        />
      </div>
      {open && filteredOptions.length ? (
        <div className="suggest-field__menu">
          {filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </label>
  );
}

function FormBlock({ title, description, children }) {
  return (
    <section className="form-block">
      <div className="form-block__header">
        <h4>{title}</h4>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="quote-form-grid">{children}</div>
    </section>
  );
}

function IndicatorCard({ title, value, helper, tone = "", info }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`stat-card ${tone ? `stat-card--${tone}` : ""} indicator-card ${open ? "is-help-open" : ""}`}>
      <div className="indicator-card__title-row">
        <span className="stat-card__title">{title}</span>
        {info ? (
          <button
            type="button"
            className="indicator-help"
            aria-label={`Ver detalhes do indicador ${title}`}
            onClick={() => setOpen((current) => !current)}
            onBlur={() => window.setTimeout(() => setOpen(false), 140)}
          >
            ?
          </button>
        ) : null}
      </div>
      <strong className="stat-card__value">{value}</strong>
      {helper ? <span className="stat-card__helper">{helper}</span> : null}
      {open && info ? (
        <div className="indicator-popover">
          <strong>O que este indicador mostra</strong>
          <p>{info.description}</p>
          <strong>Dados considerados</strong>
          <ul>
            {info.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function App() {
  const [activeModule, setActiveModule] = useState("calculator");
  const [rates, setRates] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [anttOpen, setAnttOpen] = useState(false);

  useEffect(() => {
    async function loadRates() {
      try {
        const response = await fetch(`${API_URL}/freight/rates`);
        if (!response.ok) {
          throw new Error("Não foi possível carregar a tabela ANTT.");
        }

        setRates(await response.json());
      } catch (loadError) {
        setError(loadError.message);
      }
    }

    loadRates();
  }, []);

  const selectedRate = useMemo(
    () => rates.find((rate) => Number(rate.axles) === Number(form.axles)),
    [rates, form.axles],
  );

  const displayedQuote = quote
    ? quote.simulation
      ? {
          customerTotal: quote.simulation.customerTotal,
          driverValue: quote.simulation.driverValue,
          netResult: quote.simulation.netResult,
          marginPercent: quote.simulation.marginPercent,
          totalCost: quote.simulation.totalCost,
          isSimulation: true,
        }
      : {
          customerTotal: quote.result.customerTotal,
          driverValue: quote.table.driverValue,
          netResult: quote.result.netResult,
          marginPercent: quote.result.realMarginPercent,
          totalCost: quote.result.totalCost,
          isSimulation: false,
        }
    : null;
  const quoteDecision = displayedQuote
    ? displayedQuote.netResult < 0
      ? {
          tone: "danger",
          title: "Não recomendado fechar",
          text: "O resultado ficou negativo. Revise cliente, motorista e custos antes de negociar.",
        }
      : displayedQuote.marginPercent < 30
        ? {
            tone: "warning",
            title: "Atenção: margem baixa",
            text: "A margem ficou abaixo da meta de 30%. Vale renegociar antes de fechar.",
          }
        : {
            tone: "success",
            title: "Frete bom",
            text: "A margem ficou dentro da meta de 30% para a operação.",
          }
    : null;
  const quoteResultTone = displayedQuote?.netResult >= 0 ? "success" : "danger";
  const quoteMarginTone = quoteDecision?.tone ?? "success";
  const suggestedCustomerValue =
    displayedQuote && displayedQuote.marginPercent < 30
      ? displayedQuote.totalCost / (1 - 0.3)
      : null;

  async function calculateQuote(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/freight/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Não foi possível calcular a cotação.");
      }

      setQuote(await response.json());
      setCopyMessage("");
    } catch (calculateError) {
      setError(calculateError.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function copyFreightSummary() {
    if (!quote || !displayedQuote) {
      return;
    }

    const summary = [
      "Frete simulado:",
      `Veículo: ${quote.input.vehicleType} ${quote.input.axles}e`,
      `KM: ${formatNumber(quote.input.km)}`,
      `Cliente: ${formatCurrency(displayedQuote.customerTotal)}`,
      `Motorista: ${formatCurrency(displayedQuote.driverValue)}`,
      `Lucro: ${formatCurrency(displayedQuote.netResult)}`,
      `Margem: ${formatNumber(displayedQuote.marginPercent)}%`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setCopyMessage("Resumo copiado para enviar no WhatsApp.");
    } catch {
      setCopyMessage("Não foi possível copiar automaticamente.");
    }
  }

  return (
    <div className="app-shell freight-app">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand-block topbar__brand">
            <div className="brand-lockup">
              <div className="brand-mark" aria-hidden="true">
                <span className="brand-mark__rb brand-mark__rb--dark">R</span>
                <span className="brand-mark__rb brand-mark__rb--light">B</span>
              </div>
              <div className="brand-copy">
                <span className="brand-block__eyebrow">Transportes</span>
                <h1>Rodobach</h1>
              </div>
            </div>
          </div>

          <nav className="quote-nav" aria-label="Módulo atual">
            <div className="module-switch">
              <button
                type="button"
                className={activeModule === "calculator" ? "is-active" : ""}
                onClick={() => setActiveModule("calculator")}
              >
                Cálculo
              </button>
              <button
                type="button"
                className={activeModule === "registry" ? "is-active" : ""}
                onClick={() => setActiveModule("registry")}
              >
                Cadastro
              </button>
              <button
                type="button"
                className={activeModule === "clients" ? "is-active" : ""}
                onClick={() => setActiveModule("clients")}
              >
                Faturamento
              </button>
              <button
                type="button"
                className={activeModule === "dailyAllowance" ? "is-active" : ""}
                onClick={() => setActiveModule("dailyAllowance")}
              >
                Diárias
              </button>
            </div>
            <span>
              {activeModule === "registry"
                ? "Consulta, cadastro e impressão de fretes negociados"
                : activeModule === "clients"
                  ? "Controle de viagens por motorista e veículo"
                  : activeModule === "dailyAllowance"
                    ? "Cálculo de diárias e parâmetros do motorista"
                  : "Base ANTT por tipo de veículo e número de eixos"}
            </span>
          </nav>

          <div className="topbar__summary">
            {activeModule === "clients" || activeModule === "dailyAllowance" ? (
              <>
                <span>{activeModule === "clients" ? "Análise" : "Cálculo"}</span>
                <strong>{activeModule === "clients" ? "Faturamento" : "Diárias"}</strong>
              </>
            ) : (
              <>
                <span>{selectedRate?.vehicleType ?? "Tabela"}</span>
                <strong>{form.axles} eixos</strong>
              </>
            )}
          </div>
        </div>
      </header>

      {activeModule === "calculator" ? (
      <main className="content quote-content">
        <section className="quote-hero">
          <div>
            <span className="hero__eyebrow">Cálculo operacional</span>
            <h2>Tabela de frete no sistema</h2>
            <p>
              Calcule o valor de motorista, cliente, impostos e resultado usando a base ANTT
              que hoje está na planilha.
            </p>
          </div>
          <div className="quote-hero__rate">
            <span>Custo KM</span>
            <strong>
              {selectedRate
                ? formatCurrency(
                    form.loadType === "normal"
                      ? selectedRate.normalDisplacementCost
                      : selectedRate.highPerformanceDisplacementCost,
                  )
                : "--"}
            </strong>
          </div>
        </section>

        {error ? <div className="feedback-card feedback-card--error">{error}</div> : null}

        <div className="quote-layout">
          <form id="freight-calculator-form" className="quote-panel" onSubmit={calculateQuote}>
            <header className="quote-panel__header">
              <div>
                <h3>Calculadora de frete</h3>
                <span>Modo rápido</span>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? "Calculando..." : "Calcular frete"}
              </button>
            </header>

            <FormBlock
              title="1. Dados da viagem"
              description="Preencha só o necessário para chegar no valor do frete."
            >
                <SegmentedControl
                  label="Veículo"
                  value={Number(form.axles)}
                  onChange={(value) => updateField("axles", Number(value))}
                  options={rates.map((rate) => ({
                    value: Number(rate.axles),
                    label: `${rate.vehicleType} (${rate.axles} eixos)`,
                  }))}
                />
                <FieldHint>
                  Escolha o conjunto usado na viagem. O número de eixos define o custo por km e o piso mínimo ANTT.
                </FieldHint>

                <SegmentedControl
                  label="Carga normal ou carga especial?"
                  value={form.loadType}
                  onChange={(value) => updateField("loadType", value)}
                  options={[
                    { value: "normal", label: "Carga normal" },
                    { value: "high_performance", label: "Carga especial" },
                  ]}
                />
                <FieldHint>
                  Carga normal usa a tabela padrão. Carga especial usa o coeficiente maior quando a operação exige mais custo.
                </FieldHint>

                <SegmentedControl
                  label="Operação"
                  value={form.operationType}
                  onChange={(value) => updateField("operationType", value)}
                  options={[
                    { value: "etc", label: "ETC" },
                    { value: "tac", label: "TAC" },
                  ]}
                />
                <FieldHint>
                  ETC calcula como transportadora. TAC adiciona os encargos estimados de RPA ao custo do motorista.
                </FieldHint>

                <Field label="KM da viagem" value={form.km} onChange={(value) => updateField("km", value)} placeholder="Ex: 3000" suffix="km" />
            </FormBlock>

            <FormBlock
              title="2. Custos da viagem"
              description="Informe os custos que normalmente entram na negociação."
            >
              <Field label="Pedágio" type="text" inputMode="decimal" value={form.tollValue} onChange={(value) => updateField("tollValue", value)} placeholder="Ex: 450,00" suffix="R$" />
              <Field label="Seguro adicional" type="text" inputMode="decimal" value={form.thirdPartyInsuranceValue} onChange={(value) => updateField("thirdPartyInsuranceValue", value)} placeholder="Ex: 300,00" suffix="R$" />
              <Field label="ICMS" value={form.icmsPercent} onChange={(value) => updateField("icmsPercent", value)} suffix="%" />
            </FormBlock>

            <FormBlock
              title="3. Meta de ganho"
              description="Escolha rapidamente a margem desejada para a empresa."
            >
              <div className="quick-margin-group">
                <span>Quanto a empresa quer ganhar?</span>
                <div>
                  {[20, 25, 30, 35].map((margin) => (
                    <button
                      key={margin}
                      type="button"
                      className={form.profitMode === "net_margin" && Number(form.profitValue) === margin ? "is-active" : ""}
                      onClick={() => {
                        updateField("profitMode", "net_margin");
                        updateField("profitValue", margin);
                      }}
                    >
                      {margin}%
                    </button>
                  ))}
                </div>
              </div>
            </FormBlock>

            <FormBlock
              title="4. Simulação de negociação"
              description="Teste a conversa com o motorista e veja quanto precisa cobrar."
            >
              <div className="simulation-quick-panel">
                <div className="simulation-quick-panel__header">
                  <div>
                    <strong>Simular negociação</strong>
                    <span>Digite o pedido do motorista e, se quiser, o valor que pretende cobrar.</span>
                  </div>
                  <button type="submit" className="secondary-button" disabled={loading}>
                    Atualizar negociação
                  </button>
                </div>
                <div className="simulation-quick-panel__grid">
                  <Field
                    label="Se o motorista pedir"
                    type="text"
                    inputMode="decimal"
                    value={form.manualDriverValue}
                    onChange={(value) => updateField("manualDriverValue", value)}
                    placeholder="Ex: 25.000,00"
                    suffix="R$"
                  />
                  <Field
                    label="Quanto preciso cobrar do cliente?"
                    type="text"
                    inputMode="decimal"
                    value={form.manualClientValue}
                    onChange={(value) => updateField("manualClientValue", value)}
                    placeholder="Ex: 35.969,74"
                    suffix="R$"
                  />
                </div>
              </div>
            </FormBlock>

            <details
              className="advanced-options"
              open={advancedOpen}
              onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
            >
              <summary>Ver cálculo avançado</summary>
              <div className="advanced-options__body">
                <SegmentedControl
                  label="Como calcular o valor cobrado do cliente?"
                  value={form.pricingReference}
                  onChange={(value) => updateField("pricingReference", value)}
                  options={[
                    { value: "normal_antt", label: "Pela tabela normal" },
                    { value: "selected_load", label: "Pela carga escolhida" },
                  ]}
                />
                <FieldHint>
                  Tabela normal usa sempre a referência normal ANTT. Pela carga escolhida aplica no preço do cliente o tipo marcado acima: {form.loadType === "high_performance" ? "Carga especial" : "Carga normal"}.
                </FieldHint>
              <Field label="Valor da NF-e" type="text" inputMode="decimal" value={form.invoiceValue} onChange={(value) => updateField("invoiceValue", value)} placeholder="Usado no seguro da carga" suffix="R$" />
              <Field label="Valor CT-e" type="text" inputMode="decimal" value={form.cteValue} onChange={(value) => updateField("cteValue", value)} placeholder="Usa o valor do cliente" suffix="R$" />
              <SegmentedControl
                label="O ICMS já está dentro do valor?"
                value={form.taxMode}
                onChange={(value) => updateField("taxMode", value)}
                options={[
                  { value: "inside", label: "Sim, calcular por dentro" },
                  { value: "cte_value", label: "Não, calcular sobre CT-e" },
                ]}
              />
              <SegmentedControl
                label="Forma de ganho"
                value={form.profitMode}
                onChange={(value) => updateField("profitMode", value)}
                options={[
                  { value: "net_margin", label: "Margem líquida" },
                  { value: "percent", label: "% bruto" },
                  { value: "fixed", label: "Valor fixo" },
                ]}
              />
              <Field
                label="Quanto a empresa quer ganhar?"
                value={form.profitValue}
                onChange={(value) => updateField("profitValue", value)}
                placeholder={form.profitMode === "fixed" ? "Ex: 5000,00" : "Ex: 30%"}
                suffix={form.profitMode === "fixed" ? "R$" : "%"}
              />
              </div>
            </details>
          </form>

          <aside className="quote-results">
            <header>
              <h3>Resultado</h3>
              <span>{quote ? `${quote.input.vehicleType} - ${quote.input.axles} eixos` : "Aguardando cálculo"}</span>
            </header>

            {quote ? (
              <>
                <div className="metric-section metric-section--primary">
                  <div className="metric-section__header">
                    <div>
                      <span>{displayedQuote.isSimulation ? "Simulação da negociação" : "Resultado calculado"}</span>
                      <strong>{displayedQuote.isSimulation ? "Valores digitados para negociar" : "Valor oficial da cotação"}</strong>
                    </div>
                    <small>{quote.input.vehicleType} - {quote.input.axles} eixos</small>
                  </div>
                  <div className="quote-result-grid quote-result-grid--main">
                    <div>
                      <span>Cobrar do cliente</span>
                      <strong>{formatCurrency(displayedQuote.customerTotal)}</strong>
                    </div>
                    <div>
                      <span>Pagar motorista</span>
                      <strong>{formatCurrency(displayedQuote.driverValue)}</strong>
                    </div>
                    <div className={`quote-result-grid__item--${quoteResultTone}`}>
                      <span>Lucro da empresa</span>
                      <strong>{formatCurrency(displayedQuote.netResult)}</strong>
                    </div>
                    <div className={`quote-result-grid__item--${quoteMarginTone}`}>
                      <span>Margem</span>
                      <strong>{formatNumber(displayedQuote.marginPercent)}%</strong>
                      <small>Meta 30%</small>
                    </div>
                  </div>
                </div>

                <div className={`margin-alert margin-alert--${quoteMarginTone}`}>
                  <strong>{quoteDecision.title}</strong>
                  <span>{quoteDecision.text}</span>
                  {suggestedCustomerValue ? (
                    <small>Para atingir 30%, cobre pelo menos {formatCurrency(suggestedCustomerValue)}.</small>
                  ) : null}
                </div>

                <div className="result-copy-box result-copy-box--action">
                  <div>
                    <span>Resumo de negociação</span>
                    <strong>Copie os valores principais para enviar ao motorista ou comercial.</strong>
                  </div>
                  <button type="button" className="secondary-button" onClick={copyFreightSummary}>
                    Copiar resumo para WhatsApp
                  </button>
                  {copyMessage ? <small>{copyMessage}</small> : null}
                </div>

                <details className="result-details result-details--collapsed">
                  <summary>Ver detalhes do cálculo</summary>
                  <ResultLine label="Valor cliente" value={formatCurrency(quote.result.customerTotal)} />
                  <ResultLine label="Motorista pela tabela" value={formatCurrency(quote.table.tableDriverValue)} />
                  <ResultLine label="Base preço cliente" value={formatCurrency(quote.table.pricingReferenceValue)} />
                  <ResultLine label="CT-e usado no ICMS" value={formatCurrency(quote.input.cteValueUsed)} />
                  <ResultLine label="Seguro da carga" value={formatCurrency(quote.charges.cargoInsurance)} />
                  <ResultLine label="Seguro terceiros" value={formatCurrency(quote.charges.thirdPartyInsurance)} />
                  <ResultLine label="Pedágio" value={formatCurrency(quote.charges.tollValue)} />
                  <ResultLine label="ICMS" value={formatCurrency(quote.charges.icmsValue)} />
                  {quote.charges.rpa ? (
                    <>
                      <ResultLine label="RPA estimado" value={formatCurrency(quote.charges.rpa.totalDiscounts)} />
                      <ResultLine label="INSS patronal TAC" value={formatCurrency(quote.charges.rpa.patronalInss)} />
                      <ResultLine label="Motorista + RPA" value={formatCurrency(quote.charges.driverWithRpa)} />
                    </>
                  ) : null}
                  <ResultLine label="Total de taxas" value={formatCurrency(quote.charges.taxTotal)} />
                  <ResultLine label="Custo total" value={formatCurrency(quote.result.totalCost)} />
                  <ResultLine
                    label="Resultado líquido"
                    value={formatCurrency(quote.result.netResult)}
                    tone={quote.result.netResult >= 0 ? "success" : "danger"}
                  />
                  <ResultLine label="Margem real" value={`${formatNumber(quote.result.realMarginPercent)}%`} />
                </details>

                {quote.simulation ? (
                  <details className="result-details result-details--simulation result-details--collapsed">
                    <summary>Ver detalhes da simulação</summary>
                    <ResultLine label="Valor cliente simulado" value={formatCurrency(quote.simulation.customerTotal)} />
                    <ResultLine label="Motorista simulado" value={formatCurrency(quote.simulation.driverValue)} />
                    <ResultLine label="Base preço cliente" value={formatCurrency(quote.simulation.pricingReferenceValue)} />
                    <ResultLine label="CT-e usado no ICMS" value={formatCurrency(quote.simulation.cteValueUsed)} />
                    <ResultLine label="Seguro da carga" value={formatCurrency(quote.simulation.cargoInsurance)} />
                    <ResultLine label="Seguro terceiros" value={formatCurrency(quote.simulation.thirdPartyInsurance)} />
                    <ResultLine label="Pedágio" value={formatCurrency(quote.simulation.tollValue)} />
                    <ResultLine label="ICMS" value={formatCurrency(quote.simulation.icmsValue)} />
                    {quote.simulation.rpa ? (
                      <>
                        <ResultLine label="RPA estimado" value={formatCurrency(quote.simulation.rpa.totalDiscounts)} />
                        <ResultLine label="INSS patronal TAC" value={formatCurrency(quote.simulation.rpa.patronalInss)} />
                        <ResultLine label="Motorista + RPA" value={formatCurrency(quote.simulation.driverWithRpa)} />
                      </>
                    ) : null}
                    <ResultLine label="Total de taxas" value={formatCurrency(quote.simulation.taxTotal)} />
                    <ResultLine label="Custo total" value={formatCurrency(quote.simulation.totalCost)} />
                    <ResultLine
                      label="Resultado líquido"
                      value={formatCurrency(quote.simulation.netResult)}
                      tone={quote.simulation.netResult >= 0 ? "success" : "danger"}
                    />
                    <ResultLine label="Margem real" value={`${formatNumber(quote.simulation.marginPercent)}%`} />
                  </details>
                ) : null}
              </>
            ) : (
              <div className="empty-state">
                Preencha os dados e calcule para ver o valor de cobrança e a margem real.
              </div>
            )}
          </aside>
        </div>

        <details
          className="quote-table section-card quote-table--collapsed"
          open={anttOpen}
          onToggle={(event) => setAnttOpen(event.currentTarget.open)}
        >
          <summary>Configuração ANTT</summary>
          <p>Coeficientes extraídos da aba PREÇOS ANTT da planilha.</p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Veículo</th>
                  <th>Eixos</th>
                  <th>KM normal</th>
                  <th>Carga/descarga normal</th>
                  <th>KM carga especial</th>
                  <th>Carga/descarga carga especial</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.axles}>
                    <td>{rate.vehicleType}</td>
                    <td>{rate.axles}</td>
                    <td>{formatCurrency(rate.normalDisplacementCost)}</td>
                    <td>{formatCurrency(rate.normalLoadUnloadCost)}</td>
                    <td>{formatCurrency(rate.highPerformanceDisplacementCost)}</td>
                    <td>{formatCurrency(rate.highPerformanceLoadUnloadCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </main>
      ) : activeModule === "clients" ? (
        <BillingScreen />
      ) : activeModule === "dailyAllowance" ? (
        <DailyAllowanceScreen />
      ) : (
        <QuoteRegistryScreen />
      )}
    </div>
  );
}

function DailyAllowanceScreen() {
  const [form, setForm] = useState(initialDailyAllowanceForm);
  const [parameters, setParameters] = useState([]);
  const [parameterForm, setParameterForm] = useState(initialDailyParameterForm);
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parameterLoading, setParameterLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [parametersOpen, setParametersOpen] = useState(false);

  useEffect(() => {
    loadParameters();
  }, []);

  async function loadParameters() {
    setError("");
    try {
      const response = await fetch(`${API_URL}/daily-allowance/parameters`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar os parâmetros de diária.");
      }

      setParameters(await response.json());
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateParameterField(field, value) {
    setParameterForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function editParameter(parameter) {
    setParameterForm({
      id: parameter.id,
      code: parameter.code,
      label: parameter.label,
      triggerTime: parameter.triggerTime ?? "",
      triggerAfterHours: parameter.triggerAfterHours ?? "",
      amount: Number(parameter.amount ?? 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      active: Boolean(parameter.active),
      sortOrder: parameter.sortOrder ?? 0,
    });
  }

  function resetParameterForm() {
    setParameterForm(initialDailyParameterForm);
  }

  async function calculateAllowance(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch(`${API_URL}/daily-allowance/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Não foi possível calcular a diária.");
      }

      setCalculation(await response.json());
    } catch (calculateError) {
      setError(calculateError.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveParameter(event) {
    event.preventDefault();
    setParameterLoading(true);
    setError("");

    try {
      const payload = {
        ...parameterForm,
        amount: parseFlexibleDecimal(parameterForm.amount),
        triggerAfterHours: parameterForm.triggerAfterHours,
      };
      const response = await fetch(
        `${API_URL}/daily-allowance/parameters${parameterForm.id ? `/${parameterForm.id}` : ""}`,
        {
          method: parameterForm.id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error("Não foi possível salvar o parâmetro.");
      }

      resetParameterForm();
      await loadParameters();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setParameterLoading(false);
    }
  }

  async function deleteParameter(parameter) {
    const canDelete = window.confirm(`Excluir o parâmetro ${parameter.label}?`);
    if (!canDelete) {
      return;
    }

    setParameterLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/daily-allowance/parameters/${parameter.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Não foi possível excluir o parâmetro.");
      }

      await loadParameters();
      if (parameterForm.id === parameter.id) {
        resetParameterForm();
      }
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setParameterLoading(false);
    }
  }

  async function copyObservation() {
    if (!calculation?.observation) {
      return;
    }

    await navigator.clipboard.writeText(calculation.observation);
    setCopied(true);
  }

  const dailyRows = useMemo(() => {
    if (!calculation?.items?.length) {
      return [];
    }

    const rowsByDate = new Map();

    for (const item of calculation.items) {
      const current = rowsByDate.get(item.date) ?? {
        date: item.date,
        cafe: null,
        almoco: null,
        janta: null,
        outros: [],
        total: 0,
      };
      const key = String(item.code ?? item.label)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (key.includes("cafe")) {
        current.cafe = item;
      } else if (key.includes("almoco")) {
        current.almoco = item;
      } else if (key.includes("janta")) {
        current.janta = item;
      } else {
        current.outros.push(item);
      }

      current.total += Number(item.amount ?? 0);
      rowsByDate.set(item.date, current);
    }

    return [...rowsByDate.values()]
      .map((row) => ({
        ...row,
        total: Math.round(row.total * 100) / 100,
      }))
      .sort((left, right) => left.date.localeCompare(right.date));
  }, [calculation]);

  const dailyTotals = useMemo(
    () =>
      dailyRows.reduce(
        (totals, row) => ({
          cafe: totals.cafe + (row.cafe ? Number(row.cafe.amount ?? 0) : 0),
          almoco: totals.almoco + (row.almoco ? Number(row.almoco.amount ?? 0) : 0),
          janta: totals.janta + (row.janta ? Number(row.janta.amount ?? 0) : 0),
          total: totals.total + Number(row.total ?? 0),
        }),
        { cafe: 0, almoco: 0, janta: 0, total: 0 },
      ),
    [dailyRows],
  );

  const mealCell = (item) => (item ? formatCurrency(item.amount) : "-");

  return (
    <main className="content quote-content daily-screen">
      <section className="quote-hero">
        <div>
          <span className="hero__eyebrow">Diárias</span>
          <h2>Cálculo de diária do motorista</h2>
          <p>
            Informe o período da viagem para calcular café, almoço e janta com uma observação pronta para enviar.
          </p>
        </div>
        <div className="daily-hero-actions">
          <button type="button" className="secondary-button" onClick={() => setParametersOpen(true)}>
            Ver parâmetros
          </button>
          <div className="quote-hero__rate">
            <span>Total calculado</span>
            <strong>{calculation ? formatCurrency(calculation.total) : formatCurrency(0)}</strong>
          </div>
        </div>
      </section>

      {error ? <div className="feedback-card feedback-card--error">{error}</div> : null}

      <div className="daily-layout">
        <section className="quote-panel">
          <header className="quote-panel__header">
            <div>
              <h3>Período da diária</h3>
              <span className="panel-caption">A janta conta às 21:00 ou quando bater 11h rodadas no dia.</span>
            </div>
            <button type="button" onClick={calculateAllowance} disabled={loading}>
              {loading ? "Calculando..." : "Calcular"}
            </button>
          </header>

          <form className="daily-form-grid" onSubmit={calculateAllowance}>
            <Field
              label="Motorista"
              type="text"
              value={form.driver}
              placeholder="Nome do motorista"
              onChange={(value) => updateForm("driver", value)}
            />
            <Field
              label="Data inicial"
              type="date"
              value={form.startDate}
              onChange={(value) => updateForm("startDate", value)}
            />
            <Field
              label="Hora inicial"
              type="time"
              value={form.startTime}
              onChange={(value) => updateForm("startTime", value)}
            />
            <Field
              label="Data final"
              type="date"
              value={form.endDate}
              onChange={(value) => updateForm("endDate", value)}
            />
            <Field
              label="Hora final"
              type="time"
              value={form.endTime}
              onChange={(value) => updateForm("endTime", value)}
            />
          </form>
        </section>

        <aside className="quote-results daily-result-panel">
          <header>
            <h3>Resultado</h3>
            <span>{calculation ? calculation.period : "Aguardando cálculo"}</span>
          </header>

          {calculation ? (
            <>
              <div className="result-total">
                <span>Valor da diária</span>
                <strong>{formatCurrency(calculation.total)}</strong>
                <small>{calculation.items.length} item(ns) calculado(s)</small>
              </div>
              <div className="daily-result-table-shell">
                <table className="daily-result-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Café</th>
                      <th>Almoço</th>
                      <th>Janta</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRows.map((row) => (
                      <tr key={row.date}>
                        <td>{formatDate(row.date)}</td>
                        <td>{mealCell(row.cafe)}</td>
                        <td>{mealCell(row.almoco)}</td>
                        <td>{mealCell(row.janta)}</td>
                        <td>{formatCurrency(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td>{formatCurrency(dailyTotals.cafe)}</td>
                      <td>{formatCurrency(dailyTotals.almoco)}</td>
                      <td>{formatCurrency(dailyTotals.janta)}</td>
                      <td>{formatCurrency(dailyTotals.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <label className="registry-notes daily-observation">
                <span>Observação para enviar</span>
                <textarea readOnly rows={4} value={calculation.observation} />
              </label>
              <div className="registry-actions">
                <button type="button" onClick={copyObservation}>
                  {copied ? "Copiado" : "Copiar observação"}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              Calcule para gerar os itens e o texto que será enviado ao motorista.
            </div>
          )}
        </aside>
      </div>

      {parametersOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setParametersOpen(false)}>
          <section
            className="quote-panel daily-parameters-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Parâmetros de cálculo de diárias"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="quote-panel__header">
              <div>
                <h3>Parâmetros de cálculo</h3>
                <span className="panel-caption">Altere horários, valores e regras sem mexer no código.</span>
              </div>
              <div className="registry-actions">
                <button type="button" className="secondary-button" onClick={resetParameterForm}>
                  Novo parâmetro
                </button>
                <button type="button" className="secondary-button" onClick={() => setParametersOpen(false)}>
                  Fechar
                </button>
              </div>
            </header>

            <form className="daily-parameter-form" onSubmit={saveParameter}>
              <Field
                label="Código"
                type="text"
                value={parameterForm.code}
                placeholder="ex: cafe"
                onChange={(value) => updateParameterField("code", value)}
              />
              <Field
                label="Descrição"
                type="text"
                value={parameterForm.label}
                placeholder="Café"
                onChange={(value) => updateParameterField("label", value)}
              />
              <Field
                label="Horário"
                type="time"
                value={parameterForm.triggerTime}
                onChange={(value) => updateParameterField("triggerTime", value)}
              />
              <Field
                label="Horas rodadas"
                value={parameterForm.triggerAfterHours}
                onChange={(value) => updateParameterField("triggerAfterHours", value)}
                suffix="h"
              />
              <Field
                label="Valor"
                type="text"
                inputMode="decimal"
                value={parameterForm.amount}
                onBlur={() => updateParameterField("amount", formatMoneyInput(parameterForm.amount))}
                onChange={(value) => updateParameterField("amount", value)}
                suffix="R$"
              />
              <Field
                label="Ordem"
                value={parameterForm.sortOrder}
                onChange={(value) => updateParameterField("sortOrder", value)}
              />
              <ToggleField
                label="Ativo"
                checked={parameterForm.active}
                onChange={(value) => updateParameterField("active", value)}
              />
              <button type="submit" disabled={parameterLoading}>
                {parameterLoading ? "Salvando..." : parameterForm.id ? "Salvar alteração" : "Criar parâmetro"}
              </button>
            </form>

            <div className="registry-table-shell daily-parameters-table">
              <table className="registry-table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Horário</th>
                    <th>Horas</th>
                    <th>Valor</th>
                    <th>Situação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((parameter) => (
                    <tr key={parameter.id}>
                      <td>{parameter.label}</td>
                      <td>{parameter.triggerTime || "-"}</td>
                      <td>{parameter.triggerAfterHours ? `${formatNumber(parameter.triggerAfterHours)}h` : "-"}</td>
                      <td>{formatCurrency(parameter.amount)}</td>
                      <td>{parameter.active ? "Ativo" : "Inativo"}</td>
                      <td>
                        <div className="registry-actions">
                          <button type="button" className="secondary-button" onClick={() => editParameter(parameter)}>
                            Editar
                          </button>
                          <button type="button" className="danger-button" onClick={() => deleteParameter(parameter)}>
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!parameters.length ? <div className="empty-state">Nenhum parâmetro cadastrado.</div> : null}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function BillingScreen() {
  const [billingMode, setBillingMode] = useState("fleet");

  return (
    <main className="content quote-content client-analysis-screen">
      <section className="billing-tabs">
        <button
          type="button"
          className={billingMode === "fleet" ? "is-active" : ""}
          onClick={() => setBillingMode("fleet")}
        >
          Frota
        </button>
        <button
          type="button"
          className={billingMode === "thirdParty" ? "is-active" : ""}
          onClick={() => setBillingMode("thirdParty")}
        >
          Terceiros
        </button>
      </section>

      {billingMode === "fleet" ? <TripControlAnalysisScreen /> : <ThirdPartyFreightScreen />}
    </main>
  );
}

function ClientAnalysisScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const currentYearStart = `${new Date().getFullYear()}-01-01`;
  const [filters, setFilters] = useState({
    startDate: currentYearStart,
    endDate: today,
    driver: "",
    vehicle: "",
    limit: "20",
  });
  const [data, setData] = useState({
    summary: {
      faturamentoTotal: 0,
      quantidadeCtes: 0,
      totalClientes: 0,
      ticketMedioCliente: 0,
      clienteMaiorFaturamento: null,
    },
    ranking: [],
    monthly: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadAnalysis(currentFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(currentFilters)) {
        if (String(value ?? "").trim()) {
          params.set(key, value);
        }
      }

      const response = await fetch(`${API_URL}/client-analysis/revenue?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar a análise de clientes.");
      }

      setData(await response.json());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalysis();
  }, []);

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function applyFilters(event) {
    event.preventDefault();
    loadAnalysis(filters);
  }

  const topClient = data.summary.clienteMaiorFaturamento;
  const maxMonthlyValue = Math.max(
    ...data.monthly.map((month) => Number(month.faturamentoTotal ?? 0)),
    1,
  );

  return (
    <>
      <section className="quote-hero">
        <div>
          <span className="hero__eyebrow">Faturamento</span>
          <h2>CT-e por cliente</h2>
          <p>
            Acompanhe a representatividade de cada cliente, veja quem mais fatura e filtre por período.
          </p>
        </div>
        <div className="quote-hero__rate">
          <span>Maior cliente</span>
          <strong>{topClient ? topClient.nome : "-"}</strong>
        </div>
      </section>

      {error ? <div className="feedback-card feedback-card--error">{error}</div> : null}

      <section className="quote-panel client-analysis-filters">
        <form className="client-filter-grid" onSubmit={applyFilters}>
          <Field
            label="Data inicial"
            type="date"
            value={filters.startDate}
            onChange={(value) => updateFilter("startDate", value)}
          />
          <Field
            label="Data final"
            type="date"
            value={filters.endDate}
            onChange={(value) => updateFilter("endDate", value)}
          />
          <Field
            label="Cliente"
            type="search"
            value={filters.search}
            placeholder="Nome, fantasia, CNPJ ou código"
            onChange={(value) => updateFilter("search", value)}
          />
          <Field
            label="Limite ranking"
            value={filters.limit}
            onChange={(value) => updateFilter("limit", value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Carregando..." : "Atualizar"}
          </button>
        </form>
      </section>

      <section className="client-kpi-grid">
        <div className="stat-card stat-card--primary">
          <span className="stat-card__title">Faturamento total</span>
          <strong className="stat-card__value">{formatCurrency(data.summary.faturamentoTotal)}</strong>
          <span className="stat-card__helper">{formatNumber(data.summary.quantidadeCtes)} CT-es no período</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__title">Clientes com faturamento</span>
          <strong className="stat-card__value">{formatNumber(data.summary.totalClientes)}</strong>
          <span className="stat-card__helper">Base filtrada pela emissão dos CT-es</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__title">Média por cliente</span>
          <strong className="stat-card__value">{formatCurrency(data.summary.ticketMedioCliente)}</strong>
          <span className="stat-card__helper">Faturamento médio no filtro atual</span>
        </div>
        <div className="stat-card stat-card--success">
          <span className="stat-card__title">Cliente que mais fatura</span>
          <strong className="stat-card__value">{topClient ? formatCurrency(topClient.faturamentoTotal) : "-"}</strong>
          <span className="stat-card__helper">
            {topClient ? `${formatNumber(topClient.representatividadePercentual)}% do total` : "Sem dados"}
          </span>
        </div>
      </section>

      <div className="client-analysis-layout">
        <section className="section-card">
          <header className="section-card__header">
            <div>
              <h2>Ranking de clientes</h2>
              <p>Ordenado pelo faturamento total no período selecionado.</p>
            </div>
          </header>
          <div className="table-wrapper">
            <table className="client-ranking-table">
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Cliente</th>
                  <th>CT-es</th>
                  <th>Faturamento</th>
                  <th>Representatividade</th>
                  <th>Última emissão</th>
                </tr>
              </thead>
              <tbody>
                {data.ranking.map((client) => (
                  <tr key={`${client.empresa}-${client.codigo}`}>
                    <td>{client.posicao}</td>
                    <td>
                      <strong>{client.fantasia || client.nome}</strong>
                      <span>{client.codigo} {client.documento ? `- ${client.documento}` : ""}</span>
                    </td>
                    <td>{formatNumber(client.quantidadeCtes)}</td>
                    <td>{formatCurrency(client.faturamentoTotal)}</td>
                    <td>
                      <div className="share-cell">
                        <span>{formatNumber(client.representatividadePercentual)}%</span>
                        <div>
                          <i style={{ width: `${Math.min(client.representatividadePercentual, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(client.ultimaEmissao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.ranking.length ? <div className="empty-state">Nenhum faturamento encontrado para o filtro.</div> : null}
          </div>
        </section>

        <section className="quote-results client-monthly-panel">
          <header>
            <h3>Evolução mensal</h3>
            <span>Faturamento e quantidade de CT-es</span>
          </header>
          <div className="client-monthly-list">
            {data.monthly.map((month) => (
              <div className="client-monthly-item" key={month.referencia}>
                <div>
                  <strong>{month.referencia}</strong>
                  <span>{formatNumber(month.quantidadeCtes)} CT-es</span>
                </div>
                <div className="client-monthly-bar">
                  <i style={{ width: `${(month.faturamentoTotal / maxMonthlyValue) * 100}%` }} />
                </div>
                <strong>{formatCurrency(month.faturamentoTotal)}</strong>
              </div>
            ))}
            {!data.monthly.length ? <div className="empty-state">Sem evolução mensal para mostrar.</div> : null}
          </div>
        </section>
      </div>
    </>
  );
}

function ManifestAnalysisScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const currentYearStart = `${new Date().getFullYear()}-01-01`;
  const [filters, setFilters] = useState({
    startDate: currentYearStart,
    endDate: today,
    search: "",
    limit: "20",
    ownership: "",
  });
  const [data, setData] = useState({
    summary: {
      totalManifestos: 0,
      totalPlacas: 0,
      quantidadeCtes: 0,
      valorMercadoria: 0,
      pesoBruto: 0,
      placaMaiorValor: null,
    },
    ranking: [],
    latest: [],
    monthly: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ownershipMenuOpen, setOwnershipMenuOpen] = useState(false);
  const ownershipOptions = [
    { value: "", label: "Todos" },
    { value: "P", label: "Frota" },
    { value: "T", label: "Terceiro" },
  ];
  const selectedOwnership =
    ownershipOptions.find((option) => option.value === filters.ownership) ?? ownershipOptions[0];

  async function loadManifests(currentFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(currentFilters)) {
        if (String(value ?? "").trim()) {
          params.set(key, value);
        }
      }

      const response = await fetch(`${API_URL}/client-analysis/manifests?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar os manifestos.");
      }

      setData(await response.json());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadManifests();
  }, []);

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function applyFilters(event) {
    event.preventDefault();
    loadManifests(filters);
  }

  const topPlate = data.summary.placaMaiorValor;
  const maxMonthlyValue = Math.max(
    ...data.monthly.map((month) => Number(month.valorMercadoria ?? 0)),
    1,
  );

  return (
    <>
      <section className="quote-hero">
        <div>
          <span className="hero__eyebrow">Manifestos</span>
          <h2>MDF-e por placa</h2>
          <p>
            Acompanhe os manifestos emitidos, valor de mercadoria, peso e CT-es relacionados por placa.
          </p>
        </div>
        <div className="quote-hero__rate">
          <span>Placa destaque</span>
          <strong>{topPlate ? topPlate.placa : "-"}</strong>
        </div>
      </section>

      {error ? <div className="feedback-card feedback-card--error">{error}</div> : null}

      <section className="quote-panel client-analysis-filters">
        <form className="client-filter-grid" onSubmit={applyFilters}>
          <Field
            label="Data inicial"
            type="date"
            value={filters.startDate}
            onChange={(value) => updateFilter("startDate", value)}
          />
          <Field
            label="Data final"
            type="date"
            value={filters.endDate}
            onChange={(value) => updateFilter("endDate", value)}
          />
          <Field
            label="Placa"
            type="search"
            value={filters.search}
            placeholder="Placa, veículo ou motorista"
            onChange={(value) => updateFilter("search", value)}
          />
          <Field
            label="Limite ranking"
            value={filters.limit}
            onChange={(value) => updateFilter("limit", value)}
          />
          <div className="ownership-filter">
            <span>Propriedade</span>
            <button
              type="button"
              className="ownership-filter__trigger"
              onClick={() => setOwnershipMenuOpen((current) => !current)}
            >
              {selectedOwnership.label}
            </button>
            {ownershipMenuOpen ? (
              <div className="ownership-filter__menu">
                {ownershipOptions.map((option) => (
                  <button
                    key={option.value || "all"}
                    type="button"
                    className={option.value === filters.ownership ? "is-active" : ""}
                    onClick={() => {
                      updateFilter("ownership", option.value);
                      setOwnershipMenuOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Carregando..." : "Atualizar"}
          </button>
        </form>
      </section>

      <section className="client-kpi-grid">
        <div className="stat-card stat-card--primary">
          <span className="stat-card__title">Valor mercadoria</span>
          <strong className="stat-card__value">{formatCurrency(data.summary.valorMercadoria)}</strong>
          <span className="stat-card__helper">{formatNumber(data.summary.totalManifestos)} manifestos</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__title">Placas com manifesto</span>
          <strong className="stat-card__value">{formatNumber(data.summary.totalPlacas)}</strong>
          <span className="stat-card__helper">Base filtrada pela emissão do MDF-e</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__title">CT-es relacionados</span>
          <strong className="stat-card__value">{formatNumber(data.summary.quantidadeCtes)}</strong>
          <span className="stat-card__helper">{formatNumber(data.summary.pesoBruto)} kg de peso bruto</span>
        </div>
        <div className="stat-card stat-card--success">
          <span className="stat-card__title">Placa com maior valor</span>
          <strong className="stat-card__value">{topPlate ? formatCurrency(topPlate.valorMercadoria) : "-"}</strong>
          <span className="stat-card__helper">{topPlate ? topPlate.placa : "Sem dados"}</span>
        </div>
      </section>

      <div className="client-analysis-layout">
        <section className="section-card">
          <header className="section-card__header">
            <div>
              <h2>Ranking por placa</h2>
              <p>Ordenado pelo valor total de mercadoria dos manifestos no período.</p>
            </div>
          </header>
          <div className="table-wrapper">
            <table className="client-ranking-table">
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Placa</th>
                  <th>Propriedade</th>
                  <th>Manifestos</th>
                  <th>CT-es</th>
                  <th>Valor mercadoria</th>
                  <th>Peso bruto</th>
                  <th>Última emissão</th>
                </tr>
              </thead>
              <tbody>
                {data.ranking.map((plate) => (
                  <tr key={`${plate.placa}-${plate.veiculo}`}>
                    <td>{plate.posicao}</td>
                    <td>
                      <strong>{plate.placa || "-"}</strong>
                      <span>{plate.veiculo || "-"}</span>
                    </td>
                    <td>{getVehicleOwnershipLabel(plate.tipoPropriedade)}</td>
                    <td>{formatNumber(plate.totalManifestos)}</td>
                    <td>{formatNumber(plate.quantidadeCtes)}</td>
                    <td>{formatCurrency(plate.valorMercadoria)}</td>
                    <td>{formatNumber(plate.pesoBruto)} kg</td>
                    <td>{formatDate(plate.ultimaEmissao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.ranking.length ? <div className="empty-state">Nenhum manifesto encontrado para o filtro.</div> : null}
          </div>
        </section>

        <section className="quote-results client-monthly-panel">
          <header>
            <h3>Evolução mensal</h3>
            <span>Valor de mercadoria e MDF-e</span>
          </header>
          <div className="client-monthly-list">
            {data.monthly.map((month) => (
              <div className="client-monthly-item" key={month.referencia}>
                <div>
                  <strong>{month.referencia}</strong>
                  <span>{formatNumber(month.totalManifestos)} MDF-e</span>
                </div>
                <div className="client-monthly-bar">
                  <i style={{ width: `${(month.valorMercadoria / maxMonthlyValue) * 100}%` }} />
                </div>
                <strong>{formatCurrency(month.valorMercadoria)}</strong>
              </div>
            ))}
            {!data.monthly.length ? <div className="empty-state">Sem evolução mensal para mostrar.</div> : null}
          </div>
        </section>
      </div>

      <section className="section-card">
        <header className="section-card__header">
          <div>
            <h2>Últimos manifestos</h2>
            <p>Lista operacional com os MDF-e mais recentes do filtro atual.</p>
          </div>
        </header>
        <div className="table-wrapper">
          <table className="client-ranking-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Placa</th>
                <th>Propriedade</th>
                <th>MDF-e</th>
                <th>Motorista</th>
                <th>CT-es</th>
                <th>Valor mercadoria</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.latest.map((manifest) => (
                <tr key={`${manifest.empresa}-${manifest.serie}-${manifest.codigo}`}>
                  <td>{formatDate(manifest.dataEmissao)}</td>
                  <td>{manifest.placa || "-"}</td>
                  <td>{getVehicleOwnershipLabel(manifest.tipoPropriedade)}</td>
                  <td>{manifest.serie}/{manifest.codigo}</td>
                  <td>{manifest.motorista || "-"}</td>
                  <td>{formatNumber(manifest.quantidadeCtes)}</td>
                  <td>{formatCurrency(manifest.valorMercadoria)}</td>
                  <td>{manifest.status || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.latest.length ? <div className="empty-state">Nenhum MDF-e recente encontrado.</div> : null}
        </div>
      </section>
    </>
  );
}

function getTripStatusLabel(value) {
  const normalized = String(value ?? "").trim();

  if (normalized === "1") {
    return "Aberta";
  }

  if (normalized === "2") {
    return "Encerrada";
  }

  if (normalized === "3") {
    return "Cancelada";
  }

  return normalized || "-";
}

function getTripPaymentStatusLabel(value) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized === "paid") {
    return "Pago";
  }

  if (normalized === "partial") {
    return "Parcial";
  }

  if (normalized === "pending") {
    return "Pendente";
  }

  return "-";
}

const tripPaymentStatusOptions = [
  { value: "pending", label: "Pendente", tone: "pending" },
  { value: "partial", label: "Parcial", tone: "partial" },
  { value: "paid", label: "Recebido", tone: "paid" },
];

function TripControlAnalysisScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const currentYearStart = `${new Date().getFullYear()}-01-01`;
  const [fleetView, setFleetView] = useState("receivables");
  const [expandedTripRows, setExpandedTripRows] = useState({});
  const [filters, setFilters] = useState({
    startDate: currentYearStart,
    endDate: today,
    search: "",
    driver: "",
    vehicle: "",
    paymentStatus: "",
    limit: "20",
  });
  const [data, setData] = useState({
    summary: {
      totalViagens: 0,
      totalVeiculos: 0,
      totalMotoristas: 0,
      totalFretes: 0,
      quantidadeFretesDetalhado: 0,
      totalFretesDetalhado: 0,
      totalFretesRecebido: 0,
      totalFretesPendente: 0,
      viagensPagas: 0,
      viagensParciais: 0,
      viagensPendentes: 0,
      totalCustos: 0,
      totalAbastecimentos: 0,
      totalAdiantamentos: 0,
      quantidadeAbastecimentos: 0,
      litrosAbastecidos: 0,
      totalPedagio: 0,
      valorComissaoMotorista: 0,
      totalDespesas: 0,
      totalViagem: 0,
      lucroCalculado: 0,
      margemLucroPercentual: 0,
      quantidadeAdiantamentos: 0,
      totalAdiantamentosDetalhado: 0,
      lucroPago: 0,
      lucroPendente: 0,
      kmPercorrido: 0,
      totalDiarias: 0,
      pesoTransportado: 0,
      maiorResultado: null,
      despesasDetalhadas: [],
    },
    ranking: [],
    latest: [],
    monthly: [],
  });
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [activeTripTab, setActiveTripTab] = useState("freights");
  const [copyCollectionMessage, setCopyCollectionMessage] = useState("");
  const [showAllCostCategories, setShowAllCostCategories] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadTrips(currentFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(currentFilters)) {
        if (String(value ?? "").trim()) {
          params.set(key, value);
        }
      }

      const response = await fetch(`${API_URL}/client-analysis/trips?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar o controle de viagens.");
      }

      setData(await response.json());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadTrips(filters);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function togglePaymentStatus(status) {
    setFilters((current) => {
      const selected = String(current.paymentStatus ?? "")
        .split(",")
        .filter(Boolean);
      const nextSelected = selected.includes(status)
        ? selected.filter((item) => item !== status)
        : [...selected, status];

      return {
        ...current,
        paymentStatus: nextSelected.join(","),
      };
    });
  }

  async function openTripDetails(trip) {
    setSelectedTrip(trip);
    setTripDetails(null);
    setActiveTripTab("freights");
    setCopyCollectionMessage("");
    setDetailsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/client-analysis/trips/${trip.empresa}/${trip.codigo}/details`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar os detalhes da viagem.");
      }

      setTripDetails(await response.json());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function applyPaymentStatus(status) {
    const nextFilters = {
      ...filters,
      paymentStatus: status,
    };

    setFilters(nextFilters);
    setFleetView("receivables");
    await loadTrips(nextFilters);
  }

  async function copyTripCollection(trip = selectedTrip) {
    if (!trip) {
      return;
    }

    const message = [
      "Cobrança de frete:",
      `Viagem: ${trip.codigo}`,
      `Veículo: ${trip.placa || trip.veiculo || "-"}`,
      `Motorista: ${trip.motorista || "-"}`,
      `Frete: ${formatCurrency(trip.totalFretesDetalhado || trip.totalFretes)}`,
      `Recebido: ${formatCurrency(trip.totalFretesRecebido)}`,
      `Pendente: ${formatCurrency(trip.totalFretesPendente)}`,
      `Situação: ${getTripPaymentStatusLabel(trip.situacaoRecebimento)}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(message);
      setCopyCollectionMessage("Resumo de cobrança copiado.");
    } catch {
      setCopyCollectionMessage("Não foi possível copiar automaticamente.");
    }
  }

  const topTrip = data.summary.maiorResultado;
  const maxMonthlyValue = Math.max(
    ...data.monthly.map((month) => Number(month.totalViagem ?? 0)),
    1,
  );
  const pendingTrips = data.latest.filter((trip) => ["pending", "partial"].includes(String(trip.situacaoRecebimento ?? "").toLowerCase()));
  const biggestPendingTrip = pendingTrips.reduce(
    (current, trip) => (Number(trip.totalFretesPendente ?? 0) > Number(current?.totalFretesPendente ?? 0) ? trip : current),
    null,
  );
  const averageTripRevenue = data.summary.totalViagens > 0 ? (data.summary.totalFretesDetalhado || data.summary.totalFretes) / data.summary.totalViagens : 0;
  const averageFuel = data.summary.litrosAbastecidos > 0 ? data.summary.kmPercorrido / data.summary.litrosAbastecidos : 0;
  const maxFinancialMonth = Math.max(
    ...data.monthly.map((month) => Number(month.totalFretes ?? 0)),
    ...data.monthly.map((month) => Number(month.totalViagem ?? 0)),
    ...data.monthly.map((month) => Number(month.totalDespesas ?? 0)),
    1,
  );
  const directCostCategories = [
    { label: "Combustível", value: data.summary.totalAbastecimentos, tone: "info", group: "Custo direto" },
    { label: "Adiantamentos", value: data.summary.totalAdiantamentos, tone: "neutral", group: "Custo direto" },
    { label: "Diárias", value: data.summary.totalDiarias, tone: "success", group: "Custo direto" },
    { label: "Pedágio da viagem", value: data.summary.totalPedagio, tone: "warning", group: "Custo direto" },
    { label: "Comissão motorista", value: data.summary.valorComissaoMotorista, tone: "danger", group: "Custo direto" },
  ];
  const detailedExpenseCategories = (data.summary.despesasDetalhadas ?? []).map((expense, index) => ({
    label: expense.nome,
    value: expense.total,
    quantity: expense.quantidade,
    tone: ["warning", "danger", "neutral", "info"][index % 4],
    group: "Despesa lançada",
  }));
  const costCategories = [...directCostCategories, ...detailedExpenseCategories]
    .filter((item) => Number(item.value ?? 0) > 0)
    .sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0));
  const visibleCostCategories = showAllCostCategories
    ? costCategories
    : [
        ...costCategories.slice(0, 10),
        ...(costCategories.length > 10
          ? [{
              label: "Outros",
              value: costCategories.slice(10).reduce((sum, item) => sum + Number(item.value ?? 0), 0),
              quantity: costCategories.slice(10).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
              tone: "neutral",
              group: `${costCategories.length - 10} categorias`,
            }]
          : []),
      ];
  const totalCostCategoryValue = Math.max(
    costCategories.reduce((sum, item) => sum + Number(item.value ?? 0), 0),
    1,
  );
  const searchSuggestions = Array.from(new Set([
    ...data.latest.flatMap((trip) => [
      trip.placa,
      trip.veiculo,
      trip.motorista,
      trip.codigo ? String(trip.codigo) : "",
      trip.cidadeOrigem,
      trip.cidadeDestinoFrete,
    ]),
    ...data.ranking.flatMap((trip) => [trip.placa, trip.veiculo, trip.motorista]),
  ].filter(Boolean))).slice(0, 30);
  const chartWidth = 720;
  const chartHeight = 260;
  const chartPadding = 28;
  const getMonthlyCoordinates = (month, index, key) => {
    const availableWidth = chartWidth - chartPadding * 2;
    const availableHeight = chartHeight - chartPadding * 2;
    const x = chartPadding + (data.monthly.length > 1 ? (index / (data.monthly.length - 1)) * availableWidth : availableWidth / 2);
    const y = chartHeight - chartPadding - (Number(month[key] ?? 0) / maxFinancialMonth) * availableHeight;
    return { x, y };
  };
  const getMonthlyPolyline = (key) => data.monthly.map((month, index) => {
    const point = getMonthlyCoordinates(month, index, key);
    return `${point.x},${point.y}`;
  }).join(" ");
  const toggleTripRow = (trip) => {
    const key = `${trip.empresa}-${trip.codigo}`;
    setExpandedTripRows((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <>
      <section className="quote-hero">
        <div>
          <span className="hero__eyebrow">Controle de viagens</span>
          <h2>Viagens por motorista e veículo</h2>
          <p>
            Acompanhe fretes, despesas, resultado, quilômetros e diárias com filtro por motorista ou veículo.
          </p>
        </div>
        <div className="quote-hero__rate">
          <span>Maior resultado</span>
          <strong>{topTrip ? formatCurrency(topTrip.totalViagem) : "-"}</strong>
        </div>
      </section>

      {error ? <div className="feedback-card feedback-card--error">{error}</div> : null}

      <section className="quote-panel client-analysis-filters fleet-filter-shell">
        <div className="fleet-filter-panel">
          <div className="fleet-filter-main">
            <label className="quote-field smart-search-field fleet-search-control">
              <div className="quote-field__control">
                <input
                  type="search"
                  list="fleet-search-suggestions"
                  value={filters.search}
                  placeholder="Buscar por motorista, placa, viagem ou rota..."
                  onChange={(event) => updateFilter("search", event.target.value)}
                />
              </div>
              <datalist id="fleet-search-suggestions">
                {searchSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </label>
            <Field
              label="Início"
              type="date"
              value={filters.startDate}
              onChange={(value) => updateFilter("startDate", value)}
            />
            <Field
              label="Fim"
              type="date"
              value={filters.endDate}
              onChange={(value) => updateFilter("endDate", value)}
            />
            <div className="quick-status-actions quick-status-actions--filter compact-status-pills" aria-label="Status financeiro">
              {tripPaymentStatusOptions.map((status) => {
                const selectedStatuses = String(filters.paymentStatus ?? "").split(",").filter(Boolean);
                const isSelected = selectedStatuses.includes(status.value);

                return (
                  <button
                    key={status.value}
                    type="button"
                    className={[
                      isSelected ? "is-active" : "",
                      `status-pill--${status.tone}`,
                    ].filter(Boolean).join(" ")}
                    onClick={() => togglePaymentStatus(status.value)}
                    aria-pressed={isSelected}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
            <div className="filter-actions">
              <button
                type="button"
                className="secondary-button filter-clear-button"
                onClick={() => {
                  const nextFilters = { startDate: currentYearStart, endDate: today, search: "", driver: "", vehicle: "", paymentStatus: "", limit: "20" };
                  setFilters(nextFilters);
                }}
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="billing-tabs billing-tabs--sub">
        <button
          type="button"
          className={fleetView === "dashboard" ? "is-active" : ""}
          onClick={() => setFleetView("dashboard")}
        >
          Dashboard gerencial
        </button>
        <button
          type="button"
          className={fleetView === "receivables" ? "is-active" : ""}
          onClick={() => setFleetView("receivables")}
        >
          Pendências
        </button>
        <button
          type="button"
          className={fleetView === "trips" ? "is-active" : ""}
          onClick={() => setFleetView("trips")}
        >
          Controle de viagens
        </button>
      </section>

      {fleetView === "dashboard" ? (
      <>
      <section className="client-kpi-grid">
        <IndicatorCard
          title="Faturamento"
          value={formatCurrency(data.summary.totalFretes)}
          helper={`${formatNumber(data.summary.totalViagens)} viagens | Recebido ${formatCurrency(data.summary.totalFretesRecebido)}`}
          tone="primary"
          info={{
            description: "Soma do valor de frete das viagens da frota dentro do período selecionado.",
            items: [
              "Usa o campo totalfretescvg da tabela logistica.controleviagens.",
              `Recebido no financeiro: ${formatCurrency(data.summary.totalFretesRecebido)}.`,
              `Pendente no financeiro: ${formatCurrency(data.summary.totalFretesPendente)}.`,
              "Considera data de saída dentro do período filtrado.",
              "Filtros de motorista e veículo também são aplicados.",
            ],
          }}
        />
        <IndicatorCard
          title="Recebido"
          value={formatCurrency(data.summary.totalFretesRecebido)}
          helper={`Pendente ${formatCurrency(data.summary.totalFretesPendente)} | ${formatNumber(data.summary.viagensPendentes)} viagens`}
          tone={data.summary.totalFretesPendente > 0 ? "warning" : "success"}
          info={{
            description: "Mostra quanto dos CT-es vinculados às viagens já teve recebimento no financeiro.",
            items: [
              "Cruza controleviagensfretes com financeiro.receberrecebimentos.",
              "Usa conhecimentocvf como duplicata e serieconhecimentocvf como série.",
              `Pagas: ${formatNumber(data.summary.viagensPagas)} viagens.`,
              `Parciais: ${formatNumber(data.summary.viagensParciais)} viagens.`,
              `Pendentes: ${formatNumber(data.summary.viagensPendentes)} viagens.`,
            ],
          }}
        />
        <IndicatorCard
          title="Custos"
          value={formatCurrency(data.summary.totalCustos)}
          helper={`Abast. ${formatCurrency(data.summary.totalAbastecimentos)} | Adiant. ${formatCurrency(data.summary.totalAdiantamentos)}`}
          info={{
            description: "Soma dos custos operacionais diretos da viagem.",
            items: [
              `totalabastecimentoscvg: ${formatCurrency(data.summary.totalAbastecimentos)}.`,
              `controleviagensadiantamentos: ${formatCurrency(data.summary.totalAdiantamentos)} em ${formatNumber(data.summary.quantidadeAdiantamentos)} lanç.`,
              `totalpedagiocvg: ${formatCurrency(data.summary.totalPedagio)}.`,
              `totaldiariascvg: ${formatCurrency(data.summary.totalDiarias)}.`,
              `valorcomissaomotoristacvg: ${formatCurrency(data.summary.valorComissaoMotorista)}.`,
              `Total exibido: ${formatCurrency(data.summary.totalCustos)}.`,
            ],
          }}
        />
        <IndicatorCard
          title="Despesas"
          value={formatCurrency(data.summary.totalDespesas)}
          helper={`Pedágio ${formatCurrency(data.summary.totalPedagio)} | Comissão ${formatCurrency(data.summary.valorComissaoMotorista)}`}
          info={{
            description: "Soma das despesas registradas no controle de viagens.",
            items: [
              `totaldespesascvg: ${formatCurrency(data.summary.totalDespesas)}.`,
              ...(data.summary.despesasDetalhadas?.length
                ? data.summary.despesasDetalhadas.map(
                    (expense) => `${expense.nome}: ${formatCurrency(expense.total)} em ${formatNumber(expense.quantidade)} lanç.`,
                  )
                : ["Nenhuma despesa detalhada encontrada no filtro atual."]),
              "Considera os mesmos filtros de período, motorista e veículo.",
            ],
          }}
        />
        <IndicatorCard
          title="Lucro"
          value={formatCurrency(data.summary.lucroCalculado)}
          helper={`Margem ${formatNumber(data.summary.margemLucroPercentual)}% | Meta 30%`}
          tone={data.summary.margemLucroPercentual < 30 ? "danger" : "success"}
          info={{
            description: "Lucro calculado com a nova composição de custos, incluindo adiantamentos.",
            items: [
              `Faturamento: ${formatCurrency(data.summary.totalFretes)}.`,
              `Custos: ${formatCurrency(data.summary.totalCustos)}.`,
              `Despesas: ${formatCurrency(data.summary.totalDespesas)}.`,
              `Lucro: faturamento - custos - despesas = ${formatCurrency(data.summary.lucroCalculado)}.`,
              `Margem: ${formatNumber(data.summary.margemLucroPercentual)}%. A meta é 30%.`,
            ],
          }}
        />
        <IndicatorCard
          title="Margem"
          value={`${formatNumber(data.summary.margemLucroPercentual)}%`}
          helper="Meta operacional 30%"
          tone={data.summary.margemLucroPercentual < 30 ? "danger" : "success"}
        />
        <IndicatorCard
          title="Média por viagem"
          value={formatCurrency(averageTripRevenue)}
          helper={`${formatNumber(data.summary.totalViagens)} viagens no filtro`}
        />
        <IndicatorCard
          title="KM rodado"
          value={`${formatNumber(data.summary.kmPercorrido)} km`}
          helper={`Média combustível ${averageFuel ? `${formatNumber(averageFuel)} km/L` : "-"}`}
        />
      </section>

      <div className="executive-dashboard-grid">
        <section className="section-card executive-chart-card">
          <header className="section-card__header">
            <div>
              <h2>Evolução financeira mensal</h2>
              <p>Faturamento, lucro e despesas no período filtrado.</p>
            </div>
          </header>
          <div className="financial-evolution">
            {data.monthly.length ? (
              <svg className="financial-line-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Evolução financeira mensal">
                <polyline points={getMonthlyPolyline("totalFretes")} className="line-chart__line line-chart__line--revenue" />
                <polyline points={getMonthlyPolyline("totalViagem")} className="line-chart__line line-chart__line--profit" />
                <polyline points={getMonthlyPolyline("totalDespesas")} className="line-chart__line line-chart__line--cost" />
                {data.monthly.map((month, index) => (
                  <g key={month.referencia}>
                    <text x={chartPadding + (data.monthly.length > 1 ? (index / (data.monthly.length - 1)) * (chartWidth - chartPadding * 2) : (chartWidth - chartPadding * 2) / 2)} y={chartHeight - 6}>
                      {month.referencia.slice(5)}
                    </text>
                    {[
                      ["totalFretes", "revenue", "Faturamento"],
                      ["totalViagem", "profit", "Lucro"],
                      ["totalDespesas", "cost", "Despesas"],
                    ].map(([key, tone, label]) => {
                      const point = getMonthlyCoordinates(month, index, key);
                      return (
                        <circle key={key} cx={point.x} cy={point.y} r="5" className={`line-chart__dot line-chart__dot--${tone}`}>
                          <title>{month.referencia} - {label}: {formatCurrency(month[key])}</title>
                        </circle>
                      );
                    })}
                  </g>
                ))}
              </svg>
            ) : null}
            {!data.monthly.length ? <div className="empty-state">Sem evolução mensal para mostrar.</div> : null}
          </div>
          <div className="financial-chart-records">
            {data.monthly.map((month) => (
              <div key={month.referencia}>
                <strong>{month.referencia}</strong>
                <span>Fat. {formatCurrency(month.totalFretes)}</span>
                <span>Lucro {formatCurrency(month.totalViagem)}</span>
                <span>Desp. {formatCurrency(month.totalDespesas)}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot legend-dot--info" /> Faturamento</span>
            <span><i className="legend-dot legend-dot--success" /> Lucro</span>
            <span><i className="legend-dot legend-dot--danger" /> Despesas</span>
          </div>
        </section>

        <section className="section-card executive-chart-card">
          <header className="section-card__header">
            <div>
              <h2>Custos por categoria</h2>
              <p>Onde a operação está consumindo mais dinheiro.</p>
            </div>
          </header>
          <div className="cost-bars">
            {visibleCostCategories.map((item) => (
              <div className="cost-bars__item" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <span>
                    {item.group} | {formatCurrency(item.value)} | {formatNumber((Number(item.value ?? 0) / totalCostCategoryValue) * 100)}%
                    {item.quantity ? ` | ${formatNumber(item.quantity)} lanç.` : ""}
                  </span>
                </div>
                <i
                  className={`cost-bars__bar cost-bars__bar--${item.tone}`}
                  style={{ width: `${Math.max((Number(item.value ?? 0) / totalCostCategoryValue) * 100, 1.5)}%` }}
                />
              </div>
            ))}
            {costCategories.length > 10 ? (
              <button
                type="button"
                className="secondary-button cost-bars__toggle"
                onClick={() => setShowAllCostCategories((current) => !current)}
              >
                {showAllCostCategories ? "Ver menos" : `Ver mais ${costCategories.length - 10} categorias`}
              </button>
            ) : null}
            {!costCategories.length ? <div className="empty-state">Sem custos ou despesas no filtro atual.</div> : null}
          </div>
        </section>
      </div>

      <div className="executive-dashboard-grid executive-dashboard-grid--bottom">
        <section className="section-card">
          <header className="section-card__header">
            <div>
              <h2>Top veículos lucrativos</h2>
              <p>Ranking pelo resultado total da viagem.</p>
            </div>
          </header>
          <div className="ranking-bars">
            {data.ranking.slice(0, 6).map((trip) => (
              <div className="ranking-bars__item" key={`${trip.posicao}-${trip.placa}-${trip.motorista}`}>
                <div>
                  <strong>{trip.placa || "-"}</strong>
                  <span>{formatNumber(trip.totalViagens)} viagens | Margem {formatNumber((Number(trip.totalViagem ?? 0) / Math.max(Number(trip.totalFretesDetalhado || trip.totalFretes || 0), 1)) * 100)}%</span>
                </div>
                <i style={{ width: `${(Number(trip.totalViagem ?? 0) / Math.max(Number(data.ranking[0]?.totalViagem ?? 0), 1)) * 100}%` }} />
                <strong>{formatCurrency(trip.totalViagem)}</strong>
              </div>
            ))}
            {!data.ranking.length ? <div className="empty-state">Nenhuma viagem encontrada para o filtro.</div> : null}
          </div>
        </section>

        <section className="section-card">
          <header>
            <h2>Recebimento</h2>
            <p>Distribuição das viagens por situação financeira.</p>
          </header>
          <div className="receiving-split">
            {[
              ["Recebidas", data.summary.viagensPagas, "paid"],
              ["Parciais", data.summary.viagensParciais, "partial"],
              ["Pendentes", data.summary.viagensPendentes, "pending"],
            ].map(([label, amount, tone]) => (
              <div key={label}>
                <span className={`status-pill status-pill--${tone}`}>{label}</span>
                <strong>{formatNumber(amount)}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
      </>
      ) : fleetView === "receivables" ? (
      <section className="section-card receivables-workbench">
        <header className="section-card__header">
          <div>
            <h2>Central de pendências</h2>
            <p>Lista operacional para acompanhar viagens sem recebimento ou com baixa parcial.</p>
          </div>
          <div className="quick-status-actions">
            <button type="button" className={!filters.paymentStatus ? "is-active" : ""} onClick={() => applyPaymentStatus("")}>Todos</button>
            <button type="button" className={filters.paymentStatus === "pending" ? "is-active" : ""} onClick={() => applyPaymentStatus("pending")}>Em aberto</button>
            <button type="button" className={filters.paymentStatus === "partial" ? "is-active" : ""} onClick={() => applyPaymentStatus("partial")}>Parcial</button>
            <button type="button" className={filters.paymentStatus === "paid" ? "is-active" : ""} onClick={() => applyPaymentStatus("paid")}>Recebido</button>
          </div>
        </header>
        <div className="receivables-summary">
          <button type="button" onClick={() => applyPaymentStatus("pending")}>
            <span>Total pendente</span>
            <strong>{formatCurrency(data.summary.totalFretesPendente)}</strong>
          </button>
          <button type="button" onClick={() => applyPaymentStatus("partial")}>
            <span>Viagens em aberto</span>
            <strong>{formatNumber(data.summary.viagensPendentes + data.summary.viagensParciais)}</strong>
          </button>
          <button type="button" onClick={() => biggestPendingTrip && openTripDetails(biggestPendingTrip)}>
            <span>Maior pendência</span>
            <strong>{biggestPendingTrip ? formatCurrency(biggestPendingTrip.totalFretesPendente) : "-"}</strong>
          </button>
          <button type="button" onClick={() => applyPaymentStatus("paid")}>
            <span>Recebido no período</span>
            <strong>{formatCurrency(data.summary.totalFretesRecebido)}</strong>
          </button>
        </div>
        <div className="table-wrapper">
          <table className="client-ranking-table trip-latest-table receivables-table">
            <thead>
              <tr>
                <th>Saída</th>
                <th>Viagem</th>
                <th>Veículo</th>
                <th>Motorista</th>
                <th>Rota</th>
                <th>Valor</th>
                <th>Recebido</th>
                <th>Pendente</th>
                <th>Recebimento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.latest.map((trip) => (
                <tr key={`${trip.empresa}-${trip.codigo}`}>
                  <td>{formatDate(trip.dataSaida)}</td>
                  <td>{trip.codigo}</td>
                  <td>
                    <strong>{trip.placa || "-"}</strong>
                    <span>{trip.veiculo || trip.veiculoCodigo || "-"}</span>
                  </td>
                  <td>{trip.motorista || "-"}</td>
                  <td>
                    <strong>{trip.cidadeOrigem ? `${trip.cidadeOrigem}/${trip.ufOrigem || ""}` : "-"}</strong>
                    <span>{trip.cidadeDestinoFrete ? `${trip.cidadeDestinoFrete}/${trip.ufDestinoFrete || ""}` : "-"}</span>
                  </td>
                  <td>{formatCurrency(trip.totalFretesDetalhado || trip.totalFretes)}</td>
                  <td>{formatCurrency(trip.totalFretesRecebido)}</td>
                  <td>{formatCurrency(trip.totalFretesPendente)}</td>
                  <td>
                    <span className={`status-pill status-pill--${trip.situacaoRecebimento || "pending"}`}>
                      {getTripPaymentStatusLabel(trip.situacaoRecebimento)}
                    </span>
                  </td>
                  <td>
                    <div className="registry-actions">
                      <button type="button" className="secondary-button" onClick={() => openTripDetails(trip)}>
                        Ver detalhes
                      </button>
                      <button type="button" className="secondary-button" onClick={() => copyTripCollection(trip)}>
                        Copiar cobrança
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.latest.length ? <div className="empty-state">Nenhum controle recente encontrado.</div> : null}
        </div>
      </section>
      ) : (
      <section className="section-card">
        <header className="section-card__header">
          <div>
            <h2>Controle de viagens</h2>
            <p>Lista operacional completa com custos, fretes, média e status da viagem.</p>
          </div>
        </header>
        <div className="table-wrapper">
          <table className="client-ranking-table trip-latest-table">
            <thead>
              <tr>
                <th>Viagem</th>
                <th>Motorista</th>
                <th>Rota</th>
                <th>Valor</th>
                <th>Recebido</th>
                <th>Pendente</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.latest.map((trip) => (
                <React.Fragment key={`${trip.empresa}-${trip.codigo}`}>
                  <tr>
                    <td>
                      <strong>{trip.codigo}</strong>
                      <span>{formatDate(trip.dataSaida)}</span>
                    </td>
                    <td>{trip.motorista || "-"}</td>
                    <td>
                      <strong>{trip.cidadeOrigem ? `${trip.cidadeOrigem}/${trip.ufOrigem || ""}` : "-"}</strong>
                      <span>{trip.cidadeDestinoFrete ? `${trip.cidadeDestinoFrete}/${trip.ufDestinoFrete || ""}` : "-"}</span>
                    </td>
                    <td>{formatCurrency(trip.totalFretesDetalhado || trip.totalFretes)}</td>
                    <td>{formatCurrency(trip.totalFretesRecebido)}</td>
                    <td>{formatCurrency(trip.totalFretesPendente)}</td>
                    <td>
                      <span className={`status-pill status-pill--${trip.situacaoRecebimento || "pending"}`}>
                        {getTripPaymentStatusLabel(trip.situacaoRecebimento)}
                      </span>
                    </td>
                    <td>
                      <div className="registry-actions">
                        <button type="button" className="secondary-button" onClick={() => toggleTripRow(trip)}>
                          {expandedTripRows[`${trip.empresa}-${trip.codigo}`] ? "Ocultar" : "Expandir"}
                        </button>
                        <button type="button" className="secondary-button" onClick={() => openTripDetails(trip)}>
                          Ver detalhes
                        </button>
                        <button type="button" className="secondary-button" onClick={() => copyTripCollection(trip)}>
                          WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedTripRows[`${trip.empresa}-${trip.codigo}`] ? (
                    <tr className="trip-expanded-row">
                      <td colSpan={8}>
                        <div>
                          <span>Veículo: <strong>{trip.placa || "-"} | {trip.veiculo || trip.veiculoCodigo || "-"}</strong></span>
                          <span>KM: <strong>{formatNumber(trip.kmPercorrido)} km</strong></span>
                          <span>Combustível: <strong>{formatCurrency(trip.totalAbastecimentos)}</strong></span>
                          <span>Média: <strong>{trip.mediaKm ? `${formatNumber(trip.mediaKm)} km/L` : "-"}</strong></span>
                          <span>Despesas: <strong>{formatCurrency(trip.totalDespesas)}</strong></span>
                          <span>Diárias: <strong>{formatCurrency(trip.totalDiarias)}</strong></span>
                          <span>Total viagem: <strong>{formatCurrency(trip.totalViagem)}</strong></span>
                          <span>Status viagem: <strong>{getTripStatusLabel(trip.status)}</strong></span>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {!data.latest.length ? <div className="empty-state">Nenhum controle recente encontrado.</div> : null}
        </div>
      </section>
      )}

      {selectedTrip ? (
        <div className="modal-backdrop modal-backdrop--drawer">
          <section className="quote-panel trip-details-modal">
            <header className="quote-panel__header">
              <div>
                <h3>Detalhes da viagem {selectedTrip.codigo}</h3>
                <span className="panel-caption">
                  {selectedTrip.placa || "-"} | {selectedTrip.motorista || "-"}
                </span>
              </div>
              <div className="registry-actions">
                <button type="button" className="secondary-button" onClick={() => copyTripCollection(selectedTrip)}>
                  Copiar cobrança
                </button>
                <button type="button" className="secondary-button" onClick={() => setSelectedTrip(null)}>
                  Fechar
                </button>
              </div>
            </header>
            {copyCollectionMessage ? <div className="feedback-card feedback-card--success">{copyCollectionMessage}</div> : null}

            {detailsLoading ? <div className="empty-state">Carregando detalhes...</div> : null}

            {tripDetails ? (
              <div className="trip-details-grid">
                <div className="selected-kpis">
                  <div>
                    <span>Fretes</span>
                    <strong>{formatCurrency(tripDetails.summary.totalFretes)}</strong>
                  </div>
                  <div>
                    <span>Recebido</span>
                    <strong>{formatCurrency(tripDetails.summary.totalRecebido)}</strong>
                  </div>
                  <div>
                    <span>Pendente</span>
                    <strong>{formatCurrency(tripDetails.summary.totalPendente)}</strong>
                  </div>
                  <div>
                    <span>Peso carregado</span>
                    <strong>{formatNumber(tripDetails.summary.pesoCarregado)} kg</strong>
                  </div>
                  <div>
                    <span>Média por frete</span>
                    <strong>{formatNumber(tripDetails.summary.mediaPesoFrete)} kg</strong>
                  </div>
                  <div>
                    <span>Adiantamentos</span>
                    <strong>{formatCurrency(tripDetails.summary.totalAdiantamentos)}</strong>
                  </div>
                  <div>
                    <span>Abastecimentos</span>
                    <strong>{formatCurrency(tripDetails.summary.totalAbastecimentos)}</strong>
                  </div>
                  <div>
                    <span>Média combustível</span>
                    <strong>{tripDetails.summary.mediaCombustivel ? `${formatNumber(tripDetails.summary.mediaCombustivel)} km/L` : "-"}</strong>
                  </div>
                </div>

                <div className="detail-tabs">
                  <button type="button" className={activeTripTab === "freights" ? "is-active" : ""} onClick={() => setActiveTripTab("freights")}>Fretes</button>
                  <button type="button" className={activeTripTab === "costs" ? "is-active" : ""} onClick={() => setActiveTripTab("costs")}>Custos</button>
                  <button type="button" className={activeTripTab === "finance" ? "is-active" : ""} onClick={() => setActiveTripTab("finance")}>Financeiro</button>
                  <button type="button" className={activeTripTab === "timeline" ? "is-active" : ""} onClick={() => setActiveTripTab("timeline")}>Timeline</button>
                </div>

                {activeTripTab === "freights" ? (
                <section className="trip-detail-section">
                  <h4>Fretes</h4>
                  <div className="table-wrapper">
                    <table className="client-ranking-table compact-detail-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Origem</th>
                          <th>Destino</th>
                          <th>Peso</th>
                          <th>Frete</th>
                          <th>Recebido</th>
                          <th>Pendente</th>
                          <th>Situação</th>
                          <th>CT-e</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tripDetails.freights.map((freight) => (
                          <tr key={freight.sequencia}>
                            <td>{formatDate(freight.data)}</td>
                            <td>{freight.cidadeOrigem ? `${freight.cidadeOrigem}/${freight.ufOrigem || ""}` : "-"}</td>
                            <td>{freight.cidadeDestino ? `${freight.cidadeDestino}/${freight.ufDestino || ""}` : "-"}</td>
                            <td>{formatNumber(freight.peso)} kg</td>
                            <td>{formatCurrency(freight.valorFrete)}</td>
                            <td>{formatCurrency(freight.valorRecebido)}</td>
                            <td>{formatCurrency(freight.valorPendente)}</td>
                            <td>{getTripPaymentStatusLabel(freight.situacaoRecebimento)}</td>
                            <td>{freight.serieConhecimento ? `${freight.serieConhecimento}/` : ""}{freight.conhecimento || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!tripDetails.freights.length ? <div className="empty-state">Sem fretes vinculados.</div> : null}
                  </div>
                </section>
                ) : null}

                {activeTripTab === "costs" ? (
                <section className="trip-detail-section">
                  <h4>Abastecimentos</h4>
                  <div className="table-wrapper">
                    <table className="client-ranking-table compact-detail-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Combustível</th>
                          <th>Litros</th>
                          <th>Valor/L</th>
                          <th>Total</th>
                          <th>Média</th>
                          <th>Posto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tripDetails.fuel.map((fuel) => (
                          <tr key={fuel.abastecimento}>
                            <td>{formatDate(fuel.data)}</td>
                            <td>{fuel.siglaCombustivel || fuel.combustivel || "-"}</td>
                            <td>{formatNumber(fuel.litros)} L</td>
                            <td>{formatCurrency(fuel.valorLitro)}</td>
                            <td>{formatCurrency(fuel.total)}</td>
                            <td>{fuel.media ? `${formatNumber(fuel.media)} km/L` : "-"}</td>
                            <td>{fuel.posto || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!tripDetails.fuel.length ? <div className="empty-state">Sem abastecimentos vinculados.</div> : null}
                  </div>
                </section>
                ) : null}

                {activeTripTab === "finance" ? (
                <section className="trip-detail-section">
                  <h4>Adiantamentos</h4>
                  <div className="table-wrapper">
                    <table className="client-ranking-table compact-detail-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Vencimento</th>
                          <th>Valor</th>
                          <th>Pagamento</th>
                          <th>Observação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tripDetails.advances.map((advance) => (
                          <tr key={advance.sequencia}>
                            <td>{formatDate(advance.data)}</td>
                            <td>{formatDate(advance.dataVencimento)}</td>
                            <td>{formatCurrency(advance.valor)}</td>
                            <td>{advance.formaPagamento || "-"}</td>
                            <td>{advance.observacao || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!tripDetails.advances.length ? <div className="empty-state">Sem adiantamentos vinculados.</div> : null}
                  </div>
                </section>
                ) : null}

                {activeTripTab === "timeline" ? (
                  <section className="trip-detail-section">
                    <h4>Timeline</h4>
                    <div className="timeline-list">
                      <div>
                        <strong>Saída</strong>
                        <span>{formatDate(selectedTrip.dataSaida)} {selectedTrip.horaSaida || ""}</span>
                      </div>
                      <div>
                        <strong>Recebimento</strong>
                        <span>{getTripPaymentStatusLabel(selectedTrip.situacaoRecebimento)} | Pendente {formatCurrency(selectedTrip.totalFretesPendente)}</span>
                      </div>
                      <div>
                        <strong>Situação da viagem</strong>
                        <span>{getTripStatusLabel(selectedTrip.status)}</span>
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}

function ThirdPartyFreightScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const currentYearStart = `${new Date().getFullYear()}-01-01`;
  const [filters, setFilters] = useState({
    startDate: currentYearStart,
    endDate: today,
    driver: "",
    vehicle: "",
    limit: "20",
  });
  const [data, setData] = useState({
    summary: {
      totalCartas: 0,
      totalVeiculos: 0,
      totalMotoristas: 0,
      quantidadeCtes: 0,
      faturamento: 0,
      custoTerceiro: 0,
      valorPago: 0,
      quantidadePagamentos: 0,
      valorPendente: 0,
      valorAdiantamento: 0,
      valorCombustivel: 0,
      valorPedagio: 0,
      despesasAcessorias: 0,
      quantidadeDespesasAcessorias: 0,
      totalDeducoes: 0,
      lucro: 0,
      margemLucroPercentual: 0,
      peso: 0,
      maiorLucro: null,
    },
    ranking: [],
    latest: [],
    monthly: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadThirdParty(currentFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(currentFilters)) {
        if (String(value ?? "").trim()) {
          params.set(key, value);
        }
      }

      const response = await fetch(`${API_URL}/client-analysis/third-party-freights?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar os fretes de terceiros.");
      }

      setData(await response.json());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadThirdParty();
  }, []);

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function applyFilters(event) {
    event.preventDefault();
    loadThirdParty(filters);
  }

  const top = data.summary.maiorLucro;
  const maxMonthlyValue = Math.max(
    ...data.monthly.map((month) => Number(month.lucro ?? 0)),
    1,
  );

  return (
    <>
      <section className="quote-hero">
        <div>
          <span className="hero__eyebrow">Terceiros</span>
          <h2>Fretes de terceiros</h2>
          <p>
            Acompanhe cartas frete, CT-es vinculados, custo do terceiro, pagamentos e margem por veículo.
          </p>
        </div>
        <div className="quote-hero__rate">
          <span>Maior lucro</span>
          <strong>{top ? formatCurrency(top.lucro) : "-"}</strong>
        </div>
      </section>

      {error ? <div className="feedback-card feedback-card--error">{error}</div> : null}

      <section className="quote-panel client-analysis-filters">
        <form className="client-filter-grid client-filter-grid--trips" onSubmit={applyFilters}>
          <Field
            label="Data inicial"
            type="date"
            value={filters.startDate}
            onChange={(value) => updateFilter("startDate", value)}
          />
          <Field
            label="Data final"
            type="date"
            value={filters.endDate}
            onChange={(value) => updateFilter("endDate", value)}
          />
          <Field
            label="Motorista"
            type="search"
            value={filters.driver}
            placeholder="Nome ou código do motorista"
            onChange={(value) => updateFilter("driver", value)}
          />
          <Field
            label="Veículo"
            type="search"
            value={filters.vehicle}
            placeholder="Placa do terceiro"
            onChange={(value) => updateFilter("vehicle", value)}
          />
          <Field
            label="Limite ranking"
            value={filters.limit}
            onChange={(value) => updateFilter("limit", value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Carregando..." : "Atualizar"}
          </button>
        </form>
      </section>

      <section className="client-kpi-grid">
        <IndicatorCard
          title="Faturamento CT-e"
          value={formatCurrency(data.summary.faturamento)}
          helper={`${formatNumber(data.summary.quantidadeCtes)} CT-es em ${formatNumber(data.summary.totalCartas)} cartas`}
          tone="primary"
          info={{
            description: "Soma do faturamento dos CT-es vinculados às cartas frete de terceiros.",
            items: [
              "Usa os CT-es da tabela logistica.cartasfretesconhecimentos.",
              "Soma o campo totalcon da tabela logistica.conhecimentos.",
              "Quando há mais de um CT-e na carta, o faturamento é agrupado antes do ranking.",
            ],
          }}
        />
        <IndicatorCard
          title="Custo terceiro"
          value={formatCurrency(data.summary.custoTerceiro)}
          helper={`Desp. acess. ${formatCurrency(data.summary.despesasAcessorias)} | Pedágio ${formatCurrency(data.summary.valorPedagio)}`}
          info={{
            description: "Soma do valor devido ao terceiro nas cartas frete do filtro.",
            items: [
              `Custo principal: ${formatCurrency(data.summary.custoTerceiro)}. Prioriza valorliquidocfr; se estiver zerado, usa valorfretecfr.`,
              `Despesas acessórias: ${formatCurrency(data.summary.despesasAcessorias)} em ${formatNumber(data.summary.quantidadeDespesasAcessorias)} lanç.`,
              `valoradiantamentocfr: ${formatCurrency(data.summary.valorAdiantamento)}.`,
              `valorpedagiocfr: ${formatCurrency(data.summary.valorPedagio)}.`,
              `valorcombustivelcfr: ${formatCurrency(data.summary.valorCombustivel)}.`,
              `totaldeducoescfr: ${formatCurrency(data.summary.totalDeducoes)}.`,
            ],
          }}
        />
        <IndicatorCard
          title="Pagamento terceiro"
          value={formatCurrency(data.summary.valorPago)}
          helper={`${formatNumber(data.summary.quantidadePagamentos)} pag. | Pendente ${formatCurrency(data.summary.valorPendente)}`}
          info={{
            description: "Mostra quanto já foi pago ao terceiro na carta frete e o saldo pendente estimado.",
            items: [
              "Pago usa a tabela logistica.cartasfretespagamentos quando existir lançamento ativo.",
              "Se não houver pagamento detalhado, usa valorpagocfr da carta frete.",
              "Pendente é custo terceiro mais despesas acessórias menos valor pago, nunca abaixo de zero.",
            ],
          }}
        />
        <IndicatorCard
          title="Lucro"
          value={formatCurrency(data.summary.lucro)}
          helper={`Margem ${formatNumber(data.summary.margemLucroPercentual)}% | Meta 30%`}
          tone={data.summary.margemLucroPercentual < 30 ? "danger" : "success"}
          info={{
            description: "Resultado entre faturamento dos CT-es, custo do terceiro e despesas acessórias.",
            items: [
              "Cálculo: faturamento CT-e menos custo terceiro menos despesas acessórias.",
              "Peso vem da carta frete ou dos CT-es vinculados quando necessário.",
              `Margem: ${formatNumber(data.summary.margemLucroPercentual)}%. A meta é 30%.`,
            ],
          }}
        />
      </section>

      <div className="client-analysis-layout">
        <section className="section-card">
          <header className="section-card__header">
            <div>
              <h2>Ranking de terceiros</h2>
              <p>Ordenado pelo lucro entre CT-es vinculados e custo da carta frete.</p>
            </div>
          </header>
          <div className="table-wrapper">
            <table className="client-ranking-table trip-ranking-table">
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Veículo</th>
                  <th>Motorista</th>
                  <th>Cartas</th>
                  <th>CT-es</th>
                  <th>Faturamento</th>
                  <th>Custo terceiro</th>
                  <th>Desp. acess.</th>
                  <th>Pago</th>
                  <th>Lucro</th>
                  <th>Peso</th>
                  <th>Última data</th>
                </tr>
              </thead>
              <tbody>
                {data.ranking.map((item) => (
                  <tr key={`${item.posicao}-${item.veiculo}-${item.motorista}`}>
                    <td>{item.posicao}</td>
                    <td>
                      <strong>{item.veiculo || "-"}</strong>
                      <span>Prop. {item.proprietario || "-"}</span>
                    </td>
                    <td>{item.motorista || "-"}</td>
                    <td>{formatNumber(item.totalCartas)}</td>
                    <td>{formatNumber(item.quantidadeCtes)}</td>
                    <td>{formatCurrency(item.faturamento)}</td>
                    <td>{formatCurrency(item.custoTerceiro)}</td>
                    <td>{formatCurrency(item.despesasAcessorias)}</td>
                    <td>{formatCurrency(item.valorPago)}</td>
                    <td className={item.faturamento > 0 && (item.lucro / item.faturamento) * 100 < 30 ? "profit-negative" : "profit-positive"}>
                      {formatCurrency(item.lucro)}
                    </td>
                    <td>{formatNumber(item.peso)} kg</td>
                    <td>{formatDate(item.ultimaData)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.ranking.length ? <div className="empty-state">Nenhum frete de terceiro encontrado.</div> : null}
          </div>
        </section>

        <section className="quote-results client-monthly-panel">
          <header>
            <h3>Evolução mensal</h3>
            <span>Lucro e cartas frete</span>
          </header>
          <div className="client-monthly-list">
            {data.monthly.map((month) => (
              <div className="client-monthly-item" key={month.referencia}>
                <div>
                  <strong>{month.referencia}</strong>
                  <span>{formatNumber(month.totalCartas)} cartas</span>
                </div>
                <div className="client-monthly-bar">
                  <i style={{ width: `${(month.lucro / maxMonthlyValue) * 100}%` }} />
                </div>
                <strong>{formatCurrency(month.lucro)}</strong>
              </div>
            ))}
            {!data.monthly.length ? <div className="empty-state">Sem evolução mensal para mostrar.</div> : null}
          </div>
        </section>
      </div>

      <section className="section-card">
        <header className="section-card__header">
          <div>
            <h2>Últimas cartas frete</h2>
            <p>Lista operacional com cartas, rotas e CT-es vinculados.</p>
          </div>
        </header>
        <div className="table-wrapper">
          <table className="client-ranking-table trip-latest-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Carta</th>
                <th>Veículo</th>
                <th>Motorista</th>
                <th>Rota</th>
                <th>CT-es</th>
                <th>Faturamento</th>
                <th>Custo</th>
                <th>Desp. acess.</th>
                <th>Pago terceiro</th>
                <th>Pendente</th>
                <th>Lucro</th>
                <th>Peso</th>
              </tr>
            </thead>
            <tbody>
              {data.latest.map((item) => (
                <tr key={`${item.empresa}-${item.serie}-${item.codigo}`}>
                  <td>{formatDate(item.data)}</td>
                  <td>{item.serie}/{item.codigo}</td>
                  <td>{item.veiculo || "-"}</td>
                  <td>{item.motorista || "-"}</td>
                  <td>{item.rotas || "-"}</td>
                  <td>
                    <strong>{formatNumber(item.quantidadeCtes)}</strong>
                    <span>{item.conhecimentos || "-"}</span>
                  </td>
                  <td>{formatCurrency(item.faturamento)}</td>
                  <td>{formatCurrency(item.custoTerceiro)}</td>
                  <td>
                    <strong>{formatCurrency(item.despesasAcessorias)}</strong>
                    <span>{formatNumber(item.quantidadeDespesasAcessorias)} lanç.</span>
                  </td>
                  <td>{formatCurrency(item.valorPago)}</td>
                  <td>{formatCurrency(item.valorPendente)}</td>
                  <td className={item.faturamento > 0 && (item.lucro / item.faturamento) * 100 < 30 ? "profit-negative" : "profit-positive"}>
                    <strong>{formatCurrency(item.lucro)}</strong>
                    <span>{item.faturamento > 0 ? `${formatNumber((item.lucro / item.faturamento) * 100)}%` : "-"}</span>
                  </td>
                  <td>{formatNumber(item.peso)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.latest.length ? <div className="empty-state">Nenhuma carta recente encontrada.</div> : null}
        </div>
      </section>
    </>
  );
}

function QuoteRegistryScreen() {
  const [quotes, setQuotes] = useState([]);
  const [form, setForm] = useState(initialRegistryForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    customer: "",
    origin: "",
    destination: "",
  });
  const [summary, setSummary] = useState(emptyRegistrySummary);
  const [options, setOptions] = useState({
    customers: [],
    origins: [],
    destinations: [],
  });
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("resumo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQuotes();
    loadRegistryOptions();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadQuotes(search, sortConfig, filters);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search, filters]);

  function buildRegistryParams(query = search, sort = sortConfig, currentFilters = filters) {
    const params = new URLSearchParams();
    if (query) {
      params.set("search", query);
    }
    for (const [key, value] of Object.entries(currentFilters)) {
      if (value) {
        params.set(key, value);
      }
    }
    params.set("sort", sort.key);
    params.set("direction", sort.direction);
    return params;
  }

  async function loadRegistryOptions() {
    try {
      const response = await fetch(`${API_URL}/quote-registry/options`);
      if (response.ok) {
        setOptions(await response.json());
      }
    } catch {
      setOptions({ customers: [], origins: [], destinations: [] });
    }
  }

  async function loadQuotes(query = search, sort = sortConfig, currentFilters = filters) {
    setError("");
    try {
      const params = buildRegistryParams(query, sort, currentFilters);

      const [listResponse, summaryResponse] = await Promise.all([
        fetch(`${API_URL}/quote-registry?${params.toString()}`),
        fetch(`${API_URL}/quote-registry/summary?${params.toString()}`),
      ]);

      if (!listResponse.ok || !summaryResponse.ok) {
        throw new Error("Não foi possível carregar as cotações.");
      }

      const data = await listResponse.json();
      setQuotes(data);
      setSummary(await summaryResponse.json());
      setSelectedQuote((current) => current ?? data[0] ?? null);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function clearFilters() {
    setSearch("");
    setFilters({
      status: "",
      customer: "",
      origin: "",
      destination: "",
    });
  }

  function updateRegistryField(field, value) {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };
      const documentKey = automaticDocumentFields[field];

      if (documentKey) {
        next.documents = {
          ...current.documents,
          [documentKey]: String(value ?? "").trim() !== "",
        };
      }

      return next;
    });
  }

  function updateCityField(cityField, ufField, value) {
    const match = [...options.origins, ...options.destinations].find(
      (option) => option.toLocaleLowerCase("pt-BR") === value.toLocaleLowerCase("pt-BR"),
    );
    const parsed = splitCityUf(match ?? value);

    setForm((current) => ({
      ...current,
      [cityField]: parsed.city,
      [ufField]: parsed.uf || current[ufField],
    }));
  }

  function updateDocumentField(field, value) {
    setForm((current) => ({
      ...current,
      documents: {
        ...current.documents,
        [field]: value,
      },
    }));
  }

  function resetForm() {
    setForm(initialRegistryForm);
    setEditingId(null);
    setFormOpen(false);
    setDetailOpen(false);
    setActiveDetailTab("resumo");
  }

  function openNewQuote() {
    setForm(initialRegistryForm);
    setEditingId(null);
    setFormOpen(true);
    setDetailOpen(true);
    setSelectedQuote(null);
    setActiveDetailTab("resumo");
  }

  function editQuote(quote) {
    setEditingId(quote.id);
    setSelectedQuote(quote);
    setFormOpen(true);
    setDetailOpen(true);
    setActiveDetailTab("resumo");
    setForm({
      tripNumber: quote.tripNumber ?? "",
      vehiclePlate: formatPlate(quote.vehiclePlate ?? ""),
      status: quote.status ?? "faltando_dados",
      date: quote.date ?? initialRegistryForm.date,
      originCity: quote.originCity ?? "",
      originUf: quote.originUf ?? "SC",
      destinationCity: quote.destinationCity ?? "",
      destinationUf: quote.destinationUf ?? "",
      customer: quote.customer ?? "",
      finalCustomer: quote.finalCustomer ?? "",
      customerValue: formatMoneyInput(quote.customerValue),
      tripKm: quote.tripKm ?? "",
      material: quote.material ?? "",
      weightKg: quote.weightKg ?? "",
      driver: quote.driver ?? "",
      driverValue: formatMoneyInput(quote.driverValue),
      seller: quote.seller ?? "",
      serviceTaker: quote.serviceTaker ?? "",
      paymentCondition: quote.paymentCondition ?? "",
      driverPhone: formatPhone(quote.driverPhone ?? ""),
      driverLicenseNumber: quote.driverLicenseNumber ?? "",
      vehicleAntt: quote.vehicleAntt ?? "",
      depositAccount: quote.depositAccount ?? "",
      pixKey: quote.pixKey ?? "",
      documents: {
        ...initialRegistryForm.documents,
        ...(quote.documents ?? {}),
      },
      notes: quote.notes ?? "",
    });
  }

  function replicateQuote(quote) {
    setEditingId(null);
    setSelectedQuote(quote);
    setFormOpen(true);
    setDetailOpen(true);
    setActiveDetailTab("resumo");
    setForm({
      tripNumber: "",
      vehiclePlate: formatPlate(quote.vehiclePlate ?? ""),
      status: "faltando_dados",
      date: new Date().toISOString().slice(0, 10),
      originCity: quote.originCity ?? "",
      originUf: quote.originUf ?? "SC",
      destinationCity: quote.destinationCity ?? "",
      destinationUf: quote.destinationUf ?? "",
      customer: quote.customer ?? "",
      finalCustomer: quote.finalCustomer ?? "",
      customerValue: formatMoneyInput(quote.customerValue),
      tripKm: quote.tripKm ?? "",
      material: quote.material ?? "",
      weightKg: quote.weightKg ?? "",
      driver: quote.driver ?? "",
      driverValue: formatMoneyInput(quote.driverValue),
      seller: quote.seller ?? "",
      serviceTaker: quote.serviceTaker ?? quote.customer ?? "",
      paymentCondition: quote.paymentCondition ?? "",
      driverPhone: formatPhone(quote.driverPhone ?? ""),
      driverLicenseNumber: quote.driverLicenseNumber ?? "",
      vehicleAntt: quote.vehicleAntt ?? "",
      depositAccount: quote.depositAccount ?? "",
      pixKey: quote.pixKey ?? "",
      documents: {
        ...initialRegistryForm.documents,
        ...(quote.documents ?? {}),
      },
      notes: quote.notes ? `Replicado da cotação ${quote.id}. ${quote.notes}` : `Replicado da cotação ${quote.id}.`,
    });
  }

  function sortBy(key) {
    const nextSort = {
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
    };
    setSortConfig(nextSort);
    loadQuotes(search, nextSort, filters);
  }

  function openQuoteDetails(quote) {
    editQuote(quote);
  }

  function applyQuickStatus(status) {
    const nextFilters = {
      ...filters,
      status,
    };
    setFilters(nextFilters);
    loadQuotes(search, sortConfig, nextFilters);
  }

  async function saveQuote(event) {
    event.preventDefault();
    const requiredFields = [
      ["N viagem", form.tripNumber],
      ["Data", form.date],
      ["Origem", form.originCity],
      ["UF origem", form.originUf],
      ["Destino", form.destinationCity],
      ["UF destino", form.destinationUf],
      ["Cliente", form.customer],
      ["Valor cliente", form.customerValue],
      ["Material", form.material],
      ["Peso", form.weightKg],
      ["Tomador do serviço", form.serviceTaker],
      ["Condição de pagamento", form.paymentCondition],
      ["Placa do veículo", form.vehiclePlate],
      ["CNH do motorista", form.driverLicenseNumber],
      ["ANTT do veículo", form.vehicleAntt],
    ];
    const emptyFields = requiredFields
      .filter(([, value]) => String(value ?? "").trim() === "")
      .map(([label]) => label);

    if (emptyFields.length) {
      const canContinue = window.confirm(
        `Existem campos vazios:\n\n${emptyFields.join("\n")}\n\nDeseja salvar mesmo assim?`,
      );

      if (!canContinue) {
        setError(`Preencha antes de salvar: ${emptyFields.join(", ")}.`);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/quote-registry${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      if (!response.ok) {
        throw new Error("Não foi possível salvar a cotação.");
      }

      const saved = await response.json();
      resetForm();
      await loadQuotes(search, sortConfig, filters);
      await loadRegistryOptions();
      setSelectedQuote(saved);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteQuote(quote) {
    const canDelete = window.confirm(`Excluir a cotação ${quote.id}?`);
    if (!canDelete) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/quote-registry/${quote.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Não foi possível excluir a cotação.");
      }

      await loadQuotes(search, sortConfig, filters);
      await loadRegistryOptions();
      if (selectedQuote?.id === quote.id) {
        setSelectedQuote(null);
      }
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setLoading(false);
    }
  }

  const numericCustomerValue = parseLocaleNumber(form.customerValue);
  const numericWeightKg = parseLocaleNumber(form.weightKg);
  const numericDriverValue = parseLocaleNumber(form.driverValue);
  const formProfit = numericCustomerValue - numericDriverValue;
  const selectedProfit = selectedQuote
    ? Number(selectedQuote.customerValue ?? 0) - Number(selectedQuote.driverValue ?? 0)
    : 0;
  const pricePerKg = numericWeightKg > 0 ? numericCustomerValue / numericWeightKg : 0;
  const pricePerTon = numericWeightKg > 0 ? numericCustomerValue / (numericWeightKg / 1000) : 0;

  return (
    <main className="content quote-content registry-screen">
      <section className="quote-hero">
        <div>
          <span className="hero__eyebrow">Cadastro rapido</span>
          <h2>Consulta de fretes negociados</h2>
          <p>
            Tela simples para registrar origem, destino, cliente, material, peso e valores.
          </p>
        </div>
        <div className="quote-hero__rate">
          <span>Registros</span>
          <strong>{summary.total}</strong>
        </div>
      </section>

      {error ? <div className="feedback-card feedback-card--error">{error}</div> : null}

      <section className="quote-panel registry-consult">
        <header className="quote-panel__header">
          <div>
            <h3>Consultar cotações</h3>
            <span className="panel-caption">Clique no registro para abrir os detalhes da cotação.</span>
          </div>
          <div className="registry-actions">
            <button type="button" className="secondary-button" onClick={openNewQuote}>
              Nova cotação
            </button>
            <button type="button" onClick={() => selectedQuote && replicateQuote(selectedQuote)} disabled={!selectedQuote}>
              Replicar
            </button>
            <button type="button" onClick={() => selectedQuote && window.print()} disabled={!selectedQuote}>
              Imprimir
            </button>
          </div>
        </header>

        <div className="registry-status-quick">
          {[
            { value: "", label: "Todos" },
            { value: "aguardando_cte", label: "Aguardando CTE" },
            { value: "faltando_dados", label: "Faltando dados" },
            { value: "finalizado", label: "Finalizados" },
          ].map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              className={filters.status === option.value ? "is-active" : ""}
              onClick={() => applyQuickStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="registry-filters">
          <SelectField
            label="Situação"
            value={filters.status}
            onChange={(value) => updateFilter("status", value)}
            options={[{ value: "", label: "Todas" }, ...statusOptions]}
          />
          <SuggestField
            label="Cliente"
            value={filters.customer}
            options={options.customers}
            placeholder="Filtrar por cliente"
            onChange={(value) => updateFilter("customer", value)}
          />
          <SuggestField
            label="Origem"
            value={filters.origin}
            options={options.origins}
            placeholder="Cidade/UF de origem"
            onChange={(value) => updateFilter("origin", value)}
          />
          <SuggestField
            label="Destino"
            value={filters.destination}
            options={options.destinations}
            placeholder="Cidade/UF de destino"
            onChange={(value) => updateFilter("destination", value)}
          />
          <label className="quote-field registry-filter-search">
            <span>Busca geral</span>
            <div className="quote-field__control">
              <input
                type="search"
                value={search}
                placeholder="Viagem, motorista, placa, material..."
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>
          <button type="button" className="secondary-button" onClick={clearFilters}>
            Limpar filtros
          </button>
        </div>

        <div className="registry-table-shell">
          <table className="registry-table">
            <thead>
              <tr>
                {[
                  ["id", "N"],
                  ["tripNumber", "Viagem"],
                  ["status", "Situação"],
                  ["date", "Data"],
                  ["customer", "Cliente"],
                  ["origin", "Origem"],
                  ["destination", "Destino"],
                  ["tripKm", "KM"],
                  ["material", "Material"],
                  ["weightKg", "Peso"],
                  ["customerValue", "Valor"],
                  ["profit", "Lucro"],
                  ["driver", "Motorista"],
                  ["vehiclePlate", "Placa"],
                  ["actions", "Ações"],
                ].map(([key, label]) => (
                  <th key={key}>
                    {key === "actions" ? (
                      <span>{label}</span>
                    ) : (
                      <button type="button" onClick={() => sortBy(key)}>
                        {label}
                        <span>{sortConfig.key === key ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</span>
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr
                  key={quote.id}
                  className={selectedQuote?.id === quote.id ? "is-active" : ""}
                  onClick={() => openQuoteDetails(quote)}
                >
                  <td>{quote.id}</td>
                  <td>{quote.tripNumber || "-"}</td>
                  <td><span className={`status-pill status-pill--${quote.status || "faltando_dados"}`}>{getStatusLabel(quote.status)}</span></td>
                  <td>{quote.date ? new Date(`${quote.date}T00:00:00`).toLocaleDateString("pt-BR") : "-"}</td>
                  <td>{quote.customer || "-"}</td>
                  <td>{quote.originCity}/{quote.originUf}</td>
                  <td>{quote.destinationCity}/{quote.destinationUf}</td>
                  <td>{quote.tripKm ? formatNumber(quote.tripKm) : "-"}</td>
                  <td>{quote.material || "-"}</td>
                  <td>{formatNumber(quote.weightKg)}</td>
                  <td>{formatCurrency(quote.customerValue)}</td>
                  <td className={parseLocaleNumber(quote.customerValue) - parseLocaleNumber(quote.driverValue) >= 0 ? "profit-positive" : "profit-negative"}>
                    {formatCurrency(parseLocaleNumber(quote.customerValue) - parseLocaleNumber(quote.driverValue))}
                  </td>
                  <td>{quote.driver || "-"}</td>
                  <td>{quote.vehiclePlate ? formatPlate(quote.vehiclePlate) : "-"}</td>
                  <td>
                    <div className="registry-row-actions" onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => openQuoteDetails(quote)}>Ver</button>
                      <button type="button" onClick={() => editQuote(quote)}>Editar</button>
                      <button type="button" onClick={() => replicateQuote(quote)}>Replicar</button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQuote(quote);
                          window.setTimeout(() => window.print(), 80);
                        }}
                      >
                        Imprimir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!quotes.length ? <div className="empty-state">Nenhuma cotação cadastrada.</div> : null}
        </div>
      </section>

      {detailOpen && formOpen ? (
        <section className="quote-panel registry-detail-page">
          <header className="quote-panel__header registry-detail-header">
            <div>
              <button type="button" className="registry-back-button" onClick={resetForm}>
                Voltar para lista
              </button>
              <h3>{editingId ? `Detalhes da cotação ${editingId}` : "Nova cotação"}</h3>
              <span className="panel-caption">
                Dados separados por área para consultar, editar e imprimir sem ocupar a lista.
              </span>
            </div>
            <div className="registry-actions">
              <button type="button" className="secondary-button" onClick={() => selectedQuote && replicateQuote(selectedQuote)} disabled={!selectedQuote}>
                Replicar
              </button>
              <button type="button" className="secondary-button" onClick={() => selectedQuote && window.print()} disabled={!selectedQuote}>
                Imprimir
              </button>
              <button type="submit" form="registry-detail-form" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </header>

          <div className="registry-detail-tabs">
            {[
              ["resumo", "Resumo"],
              ["rota", "Rota"],
              ["cliente", "Cliente e material"],
              ["documentos", "Documentos"],
              ["acoes", "Ações"],
            ].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                className={activeDetailTab === tab ? "is-active" : ""}
                onClick={() => setActiveDetailTab(tab)}
              >
                {label}
              </button>
            ))}
          </div>

          <form id="registry-detail-form" className="registry-form registry-detail-form" onSubmit={saveQuote}>
            <div className="registry-form-summary">
              <ResultLine label="Valor da viagem" value={formatCurrency(numericCustomerValue)} />
              <ResultLine label="Valor motorista" value={formatCurrency(numericDriverValue)} />
              <ResultLine
                label="Lucro previsto"
                value={formatCurrency(formProfit)}
                tone={getProfitTone(formProfit)}
              />
              <ResultLine label="KM" value={form.tripKm ? `${formatNumber(form.tripKm)} km` : "-"} />
            </div>

            {activeDetailTab === "resumo" ? (
              <>
                <FormBlock title="Resumo">
                  <Field label="N viagem" type="text" value={form.tripNumber} onChange={(value) => updateRegistryField("tripNumber", value)} />
                  <SelectField label="Situação" value={form.status} onChange={(value) => updateRegistryField("status", value)} options={statusOptions} />
                  <Field label="Data" type="date" value={form.date} onChange={(value) => updateRegistryField("date", value)} />
                  <Field label="KM da viagem" value={form.tripKm} onChange={(value) => updateRegistryField("tripKm", value)} suffix="km" />
                  <Field label="Valor da viagem" type="text" inputMode="decimal" value={form.customerValue} onChange={(value) => updateRegistryField("customerValue", value)} onBlur={() => updateRegistryField("customerValue", formatMoneyInput(form.customerValue))} suffix="R$" />
                  <Field label="Valor pago ao motorista" type="text" inputMode="decimal" value={form.driverValue} onChange={(value) => updateRegistryField("driverValue", value)} onBlur={() => updateRegistryField("driverValue", formatMoneyInput(form.driverValue))} suffix="R$" />
                </FormBlock>
                <div className="registry-preview">
                  <ResultLine label="R$/kg" value={formatCurrency(pricePerKg)} />
                  <ResultLine label="R$/ton" value={formatCurrency(pricePerTon)} />
                </div>
              </>
            ) : null}

            {activeDetailTab === "rota" ? (
              <FormBlock title="Rota">
                <SuggestField label="Origem" value={form.originCity} onChange={(value) => updateCityField("originCity", "originUf", value)} options={options.origins} placeholder="Morro da Fumaca" />
                <Field label="UF origem" type="text" value={form.originUf} onChange={(value) => updateRegistryField("originUf", formatUf(value))} placeholder="SC" />
                <SuggestField label="Destino" value={form.destinationCity} onChange={(value) => updateCityField("destinationCity", "destinationUf", value)} options={options.destinations} placeholder="Feira de Santana" />
                <Field label="UF destino" type="text" value={form.destinationUf} onChange={(value) => updateRegistryField("destinationUf", formatUf(value))} placeholder="BA" />
                <Field label="Placa do veículo" type="text" value={form.vehiclePlate} onChange={(value) => updateRegistryField("vehiclePlate", formatPlate(value))} placeholder="MQV-4C62" />
                <Field label="Motorista" type="text" value={form.driver} onChange={(value) => updateRegistryField("driver", value)} />
              </FormBlock>
            ) : null}

            {activeDetailTab === "cliente" ? (
              <>
                <FormBlock title="Cliente e material">
                  <Field label="Cliente" type="text" value={form.customer} onChange={(value) => updateRegistryField("customer", value)} />
                  <Field label="Cliente final" type="text" value={form.finalCustomer} onChange={(value) => updateRegistryField("finalCustomer", value)} />
                  <Field label="Material" type="text" value={form.material} onChange={(value) => updateRegistryField("material", value)} />
                  <Field label="Peso" value={form.weightKg} onChange={(value) => updateRegistryField("weightKg", value)} suffix="kg" />
                  <Field label="Vendedor" type="text" value={form.seller} onChange={(value) => updateRegistryField("seller", value)} />
                  <Field label="Tomador do serviço" type="text" value={form.serviceTaker} onChange={(value) => updateRegistryField("serviceTaker", value)} />
                  <SelectField label="Condição de pagamento" value={form.paymentCondition} onChange={(value) => updateRegistryField("paymentCondition", value)} options={paymentConditionOptions} />
                </FormBlock>
                <label className="registry-notes">
                  <span>Observações</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => updateRegistryField("notes", event.target.value)}
                    rows={4}
                  />
                </label>
              </>
            ) : null}

            {activeDetailTab === "documentos" ? (
              <>
                <FormBlock title="Dados para cadastro">
                  <Field label="Número do motorista" type="text" value={form.driverPhone} onChange={(value) => updateRegistryField("driverPhone", formatPhone(value))} placeholder="(48) 99999-9999" />
                  <Field label="CNH do motorista" type="text" value={form.driverLicenseNumber} onChange={(value) => updateRegistryField("driverLicenseNumber", onlyDigits(value, 11))} />
                  <Field label="ANTT do veículo" type="text" value={form.vehicleAntt} onChange={(value) => updateRegistryField("vehicleAntt", onlyDigits(value))} />
                  <Field label="Conta depósito" type="text" value={form.depositAccount} onChange={(value) => updateRegistryField("depositAccount", value)} />
                  <Field label="Chave PIX" type="text" value={form.pixKey} onChange={(value) => updateRegistryField("pixKey", value)} />
                </FormBlock>
                <section className="form-block">
                  <h4>Documentos para cadastro</h4>
                  <div className="checkbox-grid">
                    <CheckboxField label="Documentação das placas" checked={form.documents.plates} onChange={(value) => updateDocumentField("plates", value)} />
                    <CheckboxField label="ANTT das placas" checked={form.documents.antt} onChange={(value) => updateDocumentField("antt", value)} />
                    <CheckboxField label="Conta para depósito" checked={form.documents.depositAccount} onChange={(value) => updateDocumentField("depositAccount", value)} />
                    <CheckboxField label="Chave PIX" checked={form.documents.pixKey} onChange={(value) => updateDocumentField("pixKey", value)} />
                    <CheckboxField label="CNH do motorista" checked={form.documents.driverLicense} onChange={(value) => updateDocumentField("driverLicense", value)} />
                    <CheckboxField label="Comprovante de residência" checked={form.documents.proofOfAddress} onChange={(value) => updateDocumentField("proofOfAddress", value)} />
                    <CheckboxField label="Número do motorista" checked={form.documents.driverPhone} onChange={(value) => updateDocumentField("driverPhone", value)} />
                  </div>
                </section>
              </>
            ) : null}

            {activeDetailTab === "acoes" ? (
              <div className="registry-actions-tab">
                <section className="registry-action-panel">
                  <h4>Ações da cotação</h4>
                  <div className="registry-actions registry-actions--stacked">
                    <button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar alterações"}</button>
                    <button type="button" className="secondary-button" onClick={() => selectedQuote && replicateQuote(selectedQuote)} disabled={!selectedQuote}>Replicar cotação</button>
                    <button type="button" className="secondary-button" onClick={() => selectedQuote && window.print()} disabled={!selectedQuote}>Imprimir ficha</button>
                    <button type="button" className="secondary-button" onClick={() => updateRegistryField("status", "finalizado")}>Marcar como finalizada</button>
                    <button type="button" className="danger-button" onClick={() => updateRegistryField("status", "cancelado")}>Marcar como cancelada</button>
                    {selectedQuote ? (
                      <button type="button" className="danger-button" onClick={() => deleteQuote(selectedQuote)}>Excluir cotação</button>
                    ) : null}
                  </div>
                </section>

                {selectedQuote ? (
                  <div className="print-card">
                    <div className="selected-kpis">
                      <div>
                        <span>Valor da viagem</span>
                        <strong>{formatCurrency(selectedQuote.customerValue)}</strong>
                      </div>
                      <div>
                        <span>Pago ao motorista</span>
                        <strong>{formatCurrency(selectedQuote.driverValue)}</strong>
                      </div>
                      <div className={selectedProfit >= 0 ? "is-positive" : "is-negative"}>
                        <span>Lucro previsto</span>
                        <strong>{formatCurrency(selectedProfit)}</strong>
                      </div>
                      <div>
                        <span>KM da viagem</span>
                        <strong>{selectedQuote.tripKm ? `${formatNumber(selectedQuote.tripKm)} km` : "-"}</strong>
                      </div>
                    </div>

                    <div className="print-card__header">
                      <img src="/rodobach-logo.png" alt="Rodobach" />
                      <div>
                        <strong>Rodobach</strong>
                        <span>Viagem {selectedQuote.tripNumber || selectedQuote.id}</span>
                      </div>
                    </div>
                    <div className="print-warning">
                      <strong>TODA DOCUMENTAÇÃO DEVE SER LEGÍVEL</strong>
                      <span>Conferir antes de encaminhar para faturamento</span>
                    </div>
                    <h4>{selectedQuote.originCity}/{selectedQuote.originUf} {"->"} {selectedQuote.destinationCity}/{selectedQuote.destinationUf}</h4>
                    <ResultLine label="N viagem" value={selectedQuote.tripNumber || "-"} />
                    <ResultLine label="Situação" value={getStatusLabel(selectedQuote.status)} />
                    <ResultLine label="Placa do veículo" value={selectedQuote.vehiclePlate ? formatPlate(selectedQuote.vehiclePlate) : "-"} />
                    <ResultLine label="Cliente" value={selectedQuote.customer || "-"} />
                    <ResultLine label="Cliente final" value={selectedQuote.finalCustomer || "-"} />
                    <ResultLine label="KM da viagem" value={selectedQuote.tripKm ? `${formatNumber(selectedQuote.tripKm)} km` : "-"} />
                    <ResultLine label="Material" value={selectedQuote.material || "-"} />
                    <ResultLine label="Peso" value={`${formatNumber(selectedQuote.weightKg)} kg`} />
                    <ResultLine label="Valor cliente" value={formatCurrency(selectedQuote.customerValue)} />
                    <ResultLine label="Motorista" value={selectedQuote.driver || "-"} />
                    <ResultLine label="Valor motorista" value={formatCurrency(selectedQuote.driverValue)} />
                    <ResultLine
                      label="Lucro previsto"
                      value={formatCurrency(selectedProfit)}
                      tone={getProfitTone(selectedProfit)}
                    />
                    <ResultLine label="Tomador do serviço" value={selectedQuote.serviceTaker || selectedQuote.customer || "-"} />
                    <ResultLine label="Condição de pagamento" value={getPaymentConditionLabel(selectedQuote.paymentCondition)} />
                    <ResultLine label="Número do motorista" value={selectedQuote.driverPhone ? formatPhone(selectedQuote.driverPhone) : "-"} />
                    <ResultLine label="CNH do motorista" value={selectedQuote.driverLicenseNumber || "-"} />
                    <ResultLine label="ANTT do veículo" value={selectedQuote.vehicleAntt || "-"} />
                    <ResultLine label="Conta depósito" value={selectedQuote.depositAccount || "-"} />
                    <ResultLine label="Chave PIX" value={selectedQuote.pixKey || "-"} />
                    <ResultLine label="R$/kg" value={formatCurrency(selectedQuote.pricePerKg)} />
                    <ResultLine label="R$/ton" value={formatCurrency(selectedQuote.pricePerTon)} />
                    <div className="print-checklist">
                      <strong>Documentos para cadastro</strong>
                      {[
                        ["Documentação das placas", selectedQuote.documents?.plates],
                        ["ANTT das placas", selectedQuote.documents?.antt],
                        ["Conta para depósito", selectedQuote.documents?.depositAccount],
                        ["Chave PIX", selectedQuote.documents?.pixKey],
                        ["CNH do motorista", selectedQuote.documents?.driverLicense],
                        ["Comprovante de residência", selectedQuote.documents?.proofOfAddress],
                        ["Número do motorista", selectedQuote.documents?.driverPhone],
                      ].map(([label, checked]) => (
                        <span key={label}>{checked ? "OK" : "__"} {label}</span>
                      ))}
                    </div>
                    {selectedQuote.notes && !selectedQuote.notes.startsWith("Importado da planilha") ? (
                      <p>{selectedQuote.notes}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="empty-state">Salve a cotação para liberar impressão e replicação.</div>
                )}
              </div>
            ) : null}
          </form>
        </section>
      ) : null}

      {selectedQuote ? (
        <div className="registry-print-only">
          <div className="print-card">
            <div className="selected-kpis">
              <div>
                <span>Valor da viagem</span>
                <strong>{formatCurrency(selectedQuote.customerValue)}</strong>
              </div>
              <div>
                <span>Pago ao motorista</span>
                <strong>{formatCurrency(selectedQuote.driverValue)}</strong>
              </div>
              <div className={selectedProfit >= 0 ? "is-positive" : "is-negative"}>
                <span>Lucro previsto</span>
                <strong>{formatCurrency(selectedProfit)}</strong>
              </div>
              <div>
                <span>KM da viagem</span>
                <strong>{selectedQuote.tripKm ? `${formatNumber(selectedQuote.tripKm)} km` : "-"}</strong>
              </div>
            </div>
            <div className="print-card__header">
              <img src="/rodobach-logo.png" alt="Rodobach" />
              <div>
                <strong>Rodobach</strong>
                <span>Viagem {selectedQuote.tripNumber || selectedQuote.id}</span>
              </div>
            </div>
            <div className="print-warning">
              <strong>TODA DOCUMENTAÇÃO DEVE SER LEGÍVEL</strong>
              <span>Conferir antes de encaminhar para faturamento</span>
            </div>
            <h4>{selectedQuote.originCity}/{selectedQuote.originUf} {"->"} {selectedQuote.destinationCity}/{selectedQuote.destinationUf}</h4>
            <ResultLine label="N viagem" value={selectedQuote.tripNumber || "-"} />
            <ResultLine label="Situação" value={getStatusLabel(selectedQuote.status)} />
            <ResultLine label="Placa do veículo" value={selectedQuote.vehiclePlate ? formatPlate(selectedQuote.vehiclePlate) : "-"} />
            <ResultLine label="Cliente" value={selectedQuote.customer || "-"} />
            <ResultLine label="Cliente final" value={selectedQuote.finalCustomer || "-"} />
            <ResultLine label="KM da viagem" value={selectedQuote.tripKm ? `${formatNumber(selectedQuote.tripKm)} km` : "-"} />
            <ResultLine label="Material" value={selectedQuote.material || "-"} />
            <ResultLine label="Peso" value={`${formatNumber(selectedQuote.weightKg)} kg`} />
            <ResultLine label="Valor cliente" value={formatCurrency(selectedQuote.customerValue)} />
            <ResultLine label="Motorista" value={selectedQuote.driver || "-"} />
            <ResultLine label="Valor motorista" value={formatCurrency(selectedQuote.driverValue)} />
            <ResultLine label="Lucro previsto" value={formatCurrency(selectedProfit)} tone={getProfitTone(selectedProfit)} />
            <ResultLine label="Tomador do serviço" value={selectedQuote.serviceTaker || selectedQuote.customer || "-"} />
            <ResultLine label="Condição de pagamento" value={getPaymentConditionLabel(selectedQuote.paymentCondition)} />
            <ResultLine label="Número do motorista" value={selectedQuote.driverPhone ? formatPhone(selectedQuote.driverPhone) : "-"} />
            <ResultLine label="CNH do motorista" value={selectedQuote.driverLicenseNumber || "-"} />
            <ResultLine label="ANTT do veículo" value={selectedQuote.vehicleAntt || "-"} />
            <ResultLine label="Conta depósito" value={selectedQuote.depositAccount || "-"} />
            <ResultLine label="Chave PIX" value={selectedQuote.pixKey || "-"} />
            <ResultLine label="R$/kg" value={formatCurrency(selectedQuote.pricePerKg)} />
            <ResultLine label="R$/ton" value={formatCurrency(selectedQuote.pricePerTon)} />
            <div className="print-checklist">
              <strong>Documentos para cadastro</strong>
              {[
                ["Documentação das placas", selectedQuote.documents?.plates],
                ["ANTT das placas", selectedQuote.documents?.antt],
                ["Conta para depósito", selectedQuote.documents?.depositAccount],
                ["Chave PIX", selectedQuote.documents?.pixKey],
                ["CNH do motorista", selectedQuote.documents?.driverLicense],
                ["Comprovante de residência", selectedQuote.documents?.proofOfAddress],
                ["Número do motorista", selectedQuote.documents?.driverPhone],
              ].map(([label, checked]) => (
                <span key={label}>{checked ? "OK" : "__"} {label}</span>
              ))}
            </div>
            {selectedQuote.notes && !selectedQuote.notes.startsWith("Importado da planilha") ? (
              <p>{selectedQuote.notes}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}


