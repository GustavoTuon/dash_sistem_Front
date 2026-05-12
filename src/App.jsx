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

const statusOptions = [
  { value: "faltando_dados", label: "Faltando dados" },
  { value: "aguardando_cte", label: "Aguardando CTE" },
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

function formatNumber(value) {
  return numberFormatter.format(Number(value ?? 0));
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

export function App() {
  const [activeModule, setActiveModule] = useState("calculator");
  const [rates, setRates] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const quoteMarginTarget = quote?.input.profitMode === "fixed" ? null : Number(quote?.input.profitValue ?? 0);
  const quoteMarginIsHealthy = quote
    ? quote.input.profitMode === "fixed"
      ? quote.result.netResult >= quote.result.targetProfit
      : quote.result.realMarginPercent >= quoteMarginTarget
    : true;
  const quoteResultTone = quote?.result.netResult >= 0 ? "success" : "danger";
  const quoteMarginTone = quoteMarginIsHealthy ? "success" : "danger";

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
            </div>
            <span>
              {activeModule === "registry"
                ? "Consulta, cadastro e impressão de fretes negociados"
                : "Base ANTT por tipo de veículo e número de eixos"}
            </span>
          </nav>

          <div className="topbar__summary">
            <span>{selectedRate?.vehicleType ?? "Tabela"}</span>
            <strong>{form.axles} eixos</strong>
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
          <form className="quote-panel" onSubmit={calculateQuote}>
            <header className="quote-panel__header">
              <h3>Dados da cotação</h3>
              <button type="submit" disabled={loading}>
                {loading ? "Calculando..." : "Calcular"}
              </button>
            </header>

            <FormBlock
              title="Piso mínimo ANTT"
              description="Define a base da tabela: veículo, tipo de carga e quilometragem calculam o valor mínimo do motorista."
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
                  label="Tipo de carga"
                  value={form.loadType}
                  onChange={(value) => updateField("loadType", value)}
                  options={[
                    { value: "normal", label: "Normal" },
                    { value: "high_performance", label: "Alto desempenho" },
                  ]}
                />
                <FieldHint>
                  Normal usa a tabela padrão. Alto desempenho usa o coeficiente maior da planilha quando a carga exige operação mais cara.
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

                <SegmentedControl
                  label="Base preço cliente"
                  value={form.pricingReference}
                  onChange={(value) => updateField("pricingReference", value)}
                  options={[
                    { value: "normal_antt", label: "Tabela normal" },
                    { value: "selected_load", label: "Usar carga selecionada" },
                  ]}
                />
                <FieldHint>
                  Tabela normal usa sempre a referência normal ANTT. Usar carga selecionada aplica no preço do cliente o tipo escolhido acima: {form.loadType === "high_performance" ? "Alto desempenho" : "Normal"}.
                </FieldHint>

                <Field label="Quilometragem" value={form.km} onChange={(value) => updateField("km", value)} suffix="km" />
            </FormBlock>

            <FormBlock
              title="Custos adicionais"
              description="Informe os custos que entram no frete final, como NF-e, CT-e, pedágio, seguro e ICMS."
            >
              <Field label="Valor NF-e" type="text" inputMode="decimal" value={form.invoiceValue} onChange={(value) => updateField("invoiceValue", value)} suffix="R$" />
              <Field label="Valor CT-e" type="text" inputMode="decimal" value={form.cteValue} onChange={(value) => updateField("cteValue", value)} placeholder="Usa o valor do cliente" suffix="R$" />
              <Field label="Pedágio" type="text" inputMode="decimal" value={form.tollValue} onChange={(value) => updateField("tollValue", value)} suffix="R$" />
              <Field label="Seguro terceiros" type="text" inputMode="decimal" value={form.thirdPartyInsuranceValue} onChange={(value) => updateField("thirdPartyInsuranceValue", value)} suffix="R$" />
              <Field label="ICMS" value={form.icmsPercent} onChange={(value) => updateField("icmsPercent", value)} suffix="%" />
              <SegmentedControl
                label="Cálculo do imposto"
                value={form.taxMode}
                onChange={(value) => updateField("taxMode", value)}
                options={[
                  { value: "inside", label: "Por dentro" },
                  { value: "cte_value", label: "Sobre CT-e" },
                ]}
              />
            </FormBlock>

            <FormBlock
              title="Preço sugerido cliente"
              description="Escolha como calcular o ganho: percentual bruto, valor fixo ou margem líquida desejada."
            >
              <SegmentedControl
                label="Tipo de lucro"
                value={form.profitMode}
                onChange={(value) => updateField("profitMode", value)}
                options={[
                  { value: "net_margin", label: "Margem líquida" },
                  { value: "percent", label: "% bruto" },
                  { value: "fixed", label: "Valor fixo" },
                ]}
              />
              <Field
                label="Lucro desejado"
                value={form.profitValue}
                onChange={(value) => updateField("profitValue", value)}
                suffix={form.profitMode === "fixed" ? "R$" : "%"}
              />
              <Field
                label="Valor motorista simulado"
                type="text"
                inputMode="decimal"
                value={form.manualDriverValue}
                onChange={(value) => updateField("manualDriverValue", value)}
                suffix="R$"
              />
              <Field
                label="Valor cliente simulado"
                type="text"
                inputMode="decimal"
                value={form.manualClientValue}
                onChange={(value) => updateField("manualClientValue", value)}
                suffix="R$"
              />
              <FieldHint>
                Use os campos de simulação para testar cenários sem alterar o cálculo principal. Com motorista e cliente preenchidos, o sistema recalcula lucro e margem; se deixar o cliente vazio, ele sugere o valor pelo lucro desejado.
              </FieldHint>
            </FormBlock>
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
                      <span>Resultado calculado</span>
                      <strong>Valor oficial da cotação</strong>
                    </div>
                    <small>{quote.input.vehicleType} - {quote.input.axles} eixos</small>
                  </div>
                  <div className="quote-result-grid">
                    <div>
                      <span>Cliente</span>
                      <strong>{formatCurrency(quote.result.customerTotal)}</strong>
                    </div>
                    <div>
                      <span>Motorista</span>
                      <strong>{formatCurrency(quote.table.driverValue)}</strong>
                    </div>
                    <div className={`quote-result-grid__item--${quoteResultTone}`}>
                      <span>Resultado</span>
                      <strong>{formatCurrency(quote.result.netResult)}</strong>
                    </div>
                    <div className={`quote-result-grid__item--${quoteMarginTone}`}>
                      <span>Margem</span>
                      <strong>{formatNumber(quote.result.realMarginPercent)}%</strong>
                      <small>
                        {quote.input.profitMode === "fixed"
                          ? `Alvo ${formatCurrency(quote.result.targetProfit)}`
                          : `Meta ${formatNumber(quoteMarginTarget)}%`}
                      </small>
                    </div>
                  </div>
                </div>

                <div className={`margin-alert margin-alert--${quoteMarginTone}`}>
                  {quoteMarginIsHealthy
                    ? "Margem dentro do alvo configurado para esta cotação."
                    : "Margem abaixo do alvo. Revise valor do cliente, motorista ou custos antes de fechar."}
                </div>

                {quote.simulation ? (
                  <div className="metric-section metric-section--simulation">
                    <div className="metric-section__header">
                      <div>
                        <span>Simulação</span>
                        <strong>Cenário digitado para comparar</strong>
                      </div>
                      <small>Não altera o cálculo oficial</small>
                    </div>
                    <div className="quote-result-grid">
                      <div>
                        <span>Cliente</span>
                        <strong>{formatCurrency(quote.simulation.customerTotal)}</strong>
                      </div>
                      <div>
                        <span>Motorista</span>
                        <strong>{formatCurrency(quote.simulation.driverValue)}</strong>
                      </div>
                      <div className={quote.simulation.netResult >= 0 ? "quote-result-grid__item--success" : "quote-result-grid__item--danger"}>
                        <span>Resultado</span>
                        <strong>{formatCurrency(quote.simulation.netResult)}</strong>
                      </div>
                      <div className={quote.simulation.marginPercent >= (quoteMarginTarget ?? 0) ? "quote-result-grid__item--success" : "quote-result-grid__item--danger"}>
                        <span>Margem</span>
                        <strong>{formatNumber(quote.simulation.marginPercent)}%</strong>
                        <small>Simulada</small>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="result-details">
                  <span>Composição do cálculo</span>
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
                </div>

                {quote.simulation ? (
                  <div className="result-details result-details--simulation">
                    <span>Composição da simulação</span>
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
                </div>
                ) : null}
              </>
            ) : (
              <div className="empty-state">
                Preencha os dados e calcule para ver o valor de cobrança e a margem real.
              </div>
            )}
          </aside>
        </div>

        <section className="quote-table section-card">
          <header className="section-card__header">
            <div>
              <h2>Base ANTT carregada</h2>
              <p>Coeficientes extraídos da aba PREÇOS ANTT da planilha.</p>
            </div>
          </header>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Veículo</th>
                  <th>Eixos</th>
                  <th>KM normal</th>
                  <th>Carga/descarga normal</th>
                  <th>KM alto desempenho</th>
                  <th>Carga/descarga alto desempenho</th>
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
        </section>
      </main>
      ) : (
        <QuoteRegistryScreen />
      )}
    </div>
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
  }

  function openNewQuote() {
    setForm(initialRegistryForm);
    setEditingId(null);
    setFormOpen(true);
  }

  function editQuote(quote) {
    setEditingId(quote.id);
    setSelectedQuote(quote);
    setFormOpen(true);
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
            <span className="panel-caption">Clique no cabeçalho da tabela para ordenar.</span>
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
                ].map(([key, label]) => (
                  <th key={key}>
                    <button type="button" onClick={() => sortBy(key)}>
                      {label}
                      <span>{sortConfig.key === key ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr
                  key={quote.id}
                  className={selectedQuote?.id === quote.id ? "is-active" : ""}
                  onClick={() => setSelectedQuote(quote)}
                  onDoubleClick={() => editQuote(quote)}
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
                </tr>
              ))}
            </tbody>
          </table>
          {!quotes.length ? <div className="empty-state">Nenhuma cotação cadastrada.</div> : null}
        </div>
      </section>

      <div className="registry-layout registry-layout--detail">
        {formOpen ? (
        <form className="quote-panel registry-form" onSubmit={saveQuote}>
          <header className="quote-panel__header">
            <h3>{editingId ? `Editando cotação ${editingId}` : "Nova cotação"}</h3>
            <div className="registry-actions">
              <button type="button" className="secondary-button" onClick={resetForm}>
                Fechar
              </button>
              <button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </header>

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

          <FormBlock title="Rota">
            <Field label="N viagem" type="text" value={form.tripNumber} onChange={(value) => updateRegistryField("tripNumber", value)} />
            <SelectField label="Situação" value={form.status} onChange={(value) => updateRegistryField("status", value)} options={statusOptions} />
            <Field label="Data" type="date" value={form.date} onChange={(value) => updateRegistryField("date", value)} />
            <Field label="Placa do veículo" type="text" value={form.vehiclePlate} onChange={(value) => updateRegistryField("vehiclePlate", formatPlate(value))} placeholder="MQV-4C62" />
            <SuggestField label="Origem" value={form.originCity} onChange={(value) => updateCityField("originCity", "originUf", value)} options={options.origins} placeholder="Morro da Fumaca" />
            <Field label="UF origem" type="text" value={form.originUf} onChange={(value) => updateRegistryField("originUf", formatUf(value))} placeholder="SC" />
            <SuggestField label="Destino" value={form.destinationCity} onChange={(value) => updateCityField("destinationCity", "destinationUf", value)} options={options.destinations} placeholder="Feira de Santana" />
            <Field label="UF destino" type="text" value={form.destinationUf} onChange={(value) => updateRegistryField("destinationUf", formatUf(value))} placeholder="BA" />
            <Field label="KM da viagem" value={form.tripKm} onChange={(value) => updateRegistryField("tripKm", value)} suffix="km" />
          </FormBlock>

          <FormBlock title="Cliente e carga">
            <Field label="Cliente" type="text" value={form.customer} onChange={(value) => updateRegistryField("customer", value)} />
            <Field label="Cliente final" type="text" value={form.finalCustomer} onChange={(value) => updateRegistryField("finalCustomer", value)} />
            <Field label="Material" type="text" value={form.material} onChange={(value) => updateRegistryField("material", value)} />
            <Field label="Peso" value={form.weightKg} onChange={(value) => updateRegistryField("weightKg", value)} suffix="kg" />
          </FormBlock>

          <FormBlock title="Financeiro">
            <Field label="Valor da viagem" type="text" inputMode="decimal" value={form.customerValue} onChange={(value) => updateRegistryField("customerValue", value)} onBlur={() => updateRegistryField("customerValue", formatMoneyInput(form.customerValue))} suffix="R$" />
            <Field label="Valor pago ao motorista" type="text" inputMode="decimal" value={form.driverValue} onChange={(value) => updateRegistryField("driverValue", value)} onBlur={() => updateRegistryField("driverValue", formatMoneyInput(form.driverValue))} suffix="R$" />
          </FormBlock>

          <FormBlock title="Motorista e venda">
            <Field label="Motorista" type="text" value={form.driver} onChange={(value) => updateRegistryField("driver", value)} />
            <Field label="Vendedor" type="text" value={form.seller} onChange={(value) => updateRegistryField("seller", value)} />
          </FormBlock>

          <FormBlock title="Faturamento">
            <Field label="Tomador do serviço" type="text" value={form.serviceTaker} onChange={(value) => updateRegistryField("serviceTaker", value)} />
            <SelectField label="Condição de pagamento" value={form.paymentCondition} onChange={(value) => updateRegistryField("paymentCondition", value)} options={paymentConditionOptions} />
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

          <label className="registry-notes">
            <span>Observações</span>
            <textarea
              value={form.notes}
              onChange={(event) => updateRegistryField("notes", event.target.value)}
              rows={3}
            />
          </label>

          <div className="registry-preview">
            <ResultLine label="R$/kg" value={formatCurrency(pricePerKg)} />
            <ResultLine label="R$/ton" value={formatCurrency(pricePerTon)} />
          </div>
        </form>
        ) : null}

        <section className="quote-results registry-list">
          <header>
            <h3>Selecionada</h3>
            <span>{selectedQuote ? `Cotação ${selectedQuote.id}` : "Nenhum registro"}</span>
          </header>

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
              <div className="registry-actions">
                <button type="button" className="secondary-button" onClick={() => editQuote(selectedQuote)}>
                  Editar
                </button>
                <button type="button" className="secondary-button" onClick={() => replicateQuote(selectedQuote)}>
                  Replicar
                </button>
                <button type="button" className="danger-button" onClick={() => deleteQuote(selectedQuote)}>
                  Excluir
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">Selecione uma linha para ver os detalhes.</div>
          )}
        </section>
      </div>
    </main>
  );
}


