import React, { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";
const APP_ROUTES = new Set(["/", "/app", "/ibrap", "/financeiro/recebimentos", "/financeiro/pagamentos", "/financeiro/despesas-futuras", "/financeiro/recebimentos-futuros"]);

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
  routes: [],
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

const initialIbrapForm = {
  invoiceNumber: "",
  invoiceSeries: "",
};

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

const statusOptions = [
  { value: "faltando_dados", label: "Faltando dados" },
  { value: "aguardando_cte", label: "Aguardando CTE" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
];

const registryStatusMeta = {
  faltando_dados: { icon: "🟠", label: "Faltando dados" },
  aguardando_cte: { icon: "🔵", label: "Aguardando CTE" },
  finalizado: { icon: "🟢", label: "Finalizado" },
  cancelado: { icon: "⚫", label: "Cancelado" },
};

const registryDetailTabs = [
  ["resumo", "📋", "Resumo"],
  ["rota", "📍", "Rota"],
  ["cliente", "👤", "Cliente"],
  ["documentos", "📄", "Documentos"],
  ["acoes", "⚙", "Ações"],
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

const REGISTRY_PAGE_SIZE = 75;

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

function formatMoneyAsTyping(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  return (Number(digits) / 100).toLocaleString("pt-BR", {
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

function formatWeightInput(value) {
  if (String(value ?? "").trim() === "") {
    return "";
  }

  return Number(value ?? 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 3,
  });
}

function formatCoefficient(value) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

function formatCoefficientDisplay(value) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function addMonths(date, months) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
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

function formatInvoiceKey(value) {
  const digits = onlyDigits(value, 44);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function buildCode128C(value) {
  const digits = onlyDigits(value);
  if (!digits || digits.length % 2 !== 0) {
    return null;
  }

  const values = [105];
  for (let index = 0; index < digits.length; index += 2) {
    values.push(Number(digits.slice(index, index + 2)));
  }

  const checksum = values.reduce((total, code, index) => total + code * (index === 0 ? 1 : index), 0) % 103;
  return [...values, checksum, 106];
}

function Code128Barcode({ value }) {
  const codes = buildCode128C(value);

  if (!codes) {
    return (
      <div className="ibrap-barcode ibrap-barcode--empty">
        Chave incompleta para gerar o codigo.
      </div>
    );
  }

  const moduleWidth = 2;
  const height = 86;
  const quietZone = 20;
  const bars = [];
  let cursor = quietZone;

  codes.forEach((code, codeIndex) => {
    const pattern = CODE128_PATTERNS[code];
    pattern.split("").forEach((widthText, index) => {
      const width = Number(widthText) * moduleWidth;
      if (index % 2 === 0) {
        bars.push({ x: cursor, width, key: `${codeIndex}-${index}` });
      }
      cursor += width;
    });
  });

  const totalWidth = cursor + quietZone;

  return (
    <svg className="ibrap-barcode" viewBox={`0 0 ${totalWidth} ${height}`} role="img" aria-label="Codigo de barras da chave da nota fiscal">
      <rect width={totalWidth} height={height} fill="#ffffff" />
      {bars.map((bar) => (
        <rect key={bar.key} x={bar.x} y="8" width={bar.width} height="62" fill="#111827" />
      ))}
      <text x={totalWidth / 2} y="82" textAnchor="middle">
        {onlyDigits(value, 44)}
      </text>
    </svg>
  );
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

function MoneyField({ label, value, onChange }) {
  return (
    <label className="quote-field quote-field--money">
      <span>{label}</span>
      <div className="quote-field__control quote-field__control--money">
        <small>R$</small>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          placeholder="0,00"
          onChange={(event) => onChange(formatMoneyAsTyping(event.target.value))}
        />
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

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <label className="quote-field">
      <span>{label}</span>
      <div className="quote-field__control">
        <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
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

function ReadOnlyStatusField({ label, value }) {
  const status = registryStatusMeta[value] ?? registryStatusMeta.faltando_dados;

  return (
    <div className="quote-field quote-field--readonly">
      <span>{label}</span>
      <div className="quote-field__control quote-field__control--readonly quote-field__control--status">
        <span className={`status-pill status-pill--large status-pill--${value || "faltando_dados"}`}>
          <span aria-hidden="true">{status.icon}</span>
          {status.label}
        </span>
      </div>
    </div>
  );
}

function getStatusLabel(value) {
  return statusOptions.find((option) => option.value === value)?.label ?? "Faltando dados";
}

function getPaymentConditionLabel(value) {
  return paymentConditionOptions.find((option) => option.value === value)?.label ?? value ?? "-";
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function splitCityUf(value) {
  const text = String(value ?? "").trim();

  if (text.includes("/")) {
    const [city = "", uf = ""] = text.split("/");
    return {
      city: city.trim(),
      uf: formatUf(uf),
    };
  }

  const dashMatch = text.match(/^(.*?)\s+-\s+([a-zA-Z]{2})$/);
  const city = dashMatch ? dashMatch[1] : text;
  const uf = dashMatch ? dashMatch[2] : "";

  return {
    city: city.trim(),
    uf: formatUf(uf),
  };
}

function formatCityUfValue(city, uf) {
  const cityText = String(city ?? "");
  const cleanUf = formatUf(uf);

  if (!cityText.trim()) {
    return "";
  }

  return cleanUf ? `${cityText.trim()} - ${cleanUf}` : cityText;
}

function formatCityName(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)(\p{L})/gu, (match) => match.toLocaleUpperCase("pt-BR"))
    .replace(/\b(Da|De|Do|Das|Dos|E)\b/g, (match) => match.toLocaleLowerCase("pt-BR"));
}

function formatCityUfOption(value) {
  const parsed = splitCityUf(value);
  return formatCityUfValue(formatCityName(parsed.city), parsed.uf);
}

function getVehicleOptionLabel(option) {
  if (typeof option === "string") {
    return formatPlate(option);
  }

  const plate = formatPlate(option?.plate ?? "");
  const driver = String(option?.driverName ?? "").trim();
  const name = String(option?.name ?? "").trim();

  return [plate, driver || name].filter(Boolean).join(" - ");
}

function getDriverOptionLabel(option) {
  if (typeof option === "string") {
    return option;
  }

  return String(option?.name ?? "").trim();
}

function getSellerOptionLabel(option) {
  if (typeof option === "string") {
    return option;
  }

  return String(option?.name ?? "").trim();
}

async function searchRegistryOptions(type, search) {
  const query = String(search ?? "").trim();
  if (query.length < 2) {
    return [];
  }

  const response = await fetch(`${API_URL}/quote-registry/options/${type}?search=${encodeURIComponent(query)}`);
  if (!response.ok) {
    return [];
  }

  return response.json();
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

function SuggestField({
  label,
  value,
  onChange,
  options,
  placeholder,
  className = "",
  getOptionLabel = (option) => option,
  onSearch,
}) {
  const [open, setOpen] = useState(false);
  const [remoteOptions, setRemoteOptions] = useState([]);
  const normalizedValue = normalizeSearchText(value);
  const sourceOptions = onSearch ? remoteOptions : options;
  const filteredOptions = [];
  const usedLabels = new Set();

  useEffect(() => {
    if (!onSearch || normalizedValue.length < 2) {
      setRemoteOptions([]);
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      const results = await onSearch(value);
      if (active) {
        setRemoteOptions(Array.isArray(results) ? results : []);
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [normalizedValue, onSearch, value]);

  for (const option of sourceOptions) {
    const optionLabel = getOptionLabel(option);
    const labelKey = normalizeSearchText(optionLabel);

    if (!labelKey.includes(normalizedValue) || usedLabels.has(labelKey)) {
      continue;
    }

    filteredOptions.push(option);
    usedLabels.add(labelKey);

    if (filteredOptions.length === 8) {
      break;
    }
  }

  return (
    <label className={`quote-field suggest-field ${className}`.trim()}>
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
              key={typeof option === "string" ? option : getOptionLabel(option)}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {getOptionLabel(option)}
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
  const initialPath = window.location.pathname;
  const [activeModule, setActiveModule] = useState(
    initialPath.startsWith("/financeiro") ? "financial" : initialPath.startsWith("/ibrap") ? "ibrap" : "calculator",
  );
  const [rates, setRates] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [anttOpen, setAnttOpen] = useState(false);

  useEffect(() => {
    if (!APP_ROUTES.has(window.location.pathname)) {
      window.history.replaceState(null, "", "/app");
    }
  }, []);

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

  const officialQuote = quote
    ? {
        customerTotal: quote.result.customerTotal,
        driverValue: quote.table.driverValue,
        netResult: quote.result.netResult,
        marginPercent: quote.result.realMarginPercent,
        totalCost: quote.result.totalCost,
      }
    : null;
  const simulationQuote = quote?.simulation
    ? {
        customerTotal: quote.simulation.customerTotal,
        driverValue: quote.simulation.driverValue,
        netResult: quote.simulation.netResult,
        marginPercent: quote.simulation.marginPercent,
        totalCost: quote.simulation.totalCost,
      }
    : null;
  const displayedQuote = simulationQuote ?? officialQuote;
  const getQuoteDecision = (quoteMetrics) =>
    quoteMetrics
      ? quoteMetrics.netResult < 0
      ? {
          tone: "danger",
          title: "Não recomendado fechar",
          text: "O resultado ficou negativo. Revise cliente, motorista e custos antes de negociar.",
        }
      : quoteMetrics.marginPercent < 30
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
  const quoteDecision = getQuoteDecision(displayedQuote);
  const officialDecision = getQuoteDecision(officialQuote);
  const simulationDecision = getQuoteDecision(simulationQuote);
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
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo">RB</div>
          <div>
            <div className="sidebar__brand-name">Rodobach</div>
            <div className="sidebar__brand-sub">Transportes</div>
          </div>
        </div>

        <div className="sidebar__section-label">Geral</div>
        <button
          type="button"
          className={"nav-item" + (activeModule === "calculator" ? " nav-item--active" : "")}
          onClick={() => setActiveModule("calculator")}
        >
          <svg className="nav-item__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/>
            <rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>
          </svg>
          Cálculo
        </button>

        <div className="sidebar__section-label">Operação</div>
        <button
          type="button"
          className={"nav-item" + (activeModule === "registry" ? " nav-item--active" : "")}
          onClick={() => setActiveModule("registry")}
        >
          <svg className="nav-item__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3 4h10M3 8h10M3 12h6"/>
          </svg>
          Cadastro
        </button>
        <button
          type="button"
          className={"nav-item" + (activeModule === "clients" ? " nav-item--active" : "")}
          onClick={() => setActiveModule("clients")}
        >
          <svg className="nav-item__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M2 13v-2a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v2"/><circle cx="8" cy="5" r="3"/>
          </svg>
          Faturamento
        </button>
        <button
          type="button"
          className={"nav-item" + (activeModule === "financial" ? " nav-item--active" : "")}
          onClick={() => {
            setActiveModule("financial");
            window.history.replaceState(null, "", "/financeiro/recebimentos");
          }}
        >
          <svg className="nav-item__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 8h6M5 10.5h4"/>
          </svg>
          Financeiro
        </button>

        <div className="sidebar__section-label">Ferramentas</div>
        <button
          type="button"
          className={"nav-item" + (activeModule === "ibrap" ? " nav-item--active" : "")}
          onClick={() => {
            setActiveModule("ibrap");
            window.history.replaceState(null, "", "/ibrap");
          }}
        >
          <svg className="nav-item__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="2" y="4" width="12" height="8" rx="1.5"/><path d="M5 7.5h1.5M8.5 7.5h1.5M11 7.5h.5M5 10h2M9 10h2"/>
          </svg>
          IBRAP
        </button>
        <button
          type="button"
          className={"nav-item" + (activeModule === "dailyAllowance" ? " nav-item--active" : "")}
          onClick={() => setActiveModule("dailyAllowance")}
        >
          <svg className="nav-item__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/>
          </svg>
          Diárias
        </button>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">RB</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar__user-name">Rodobach</div>
              <div className="sidebar__user-role">Administrador</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="main">
        <div className="topbar">
          <div className="topbar__breadcrumb">
            <span>
              {activeModule === "calculator" || activeModule === "registry" ? "Operação"
                : activeModule === "clients" || activeModule === "financial" ? "Análise"
                : "Ferramentas"}
            </span>
            <span className="topbar__breadcrumb-sep">›</span>
            <strong>
              {activeModule === "calculator" ? "Calculadora de frete"
                : activeModule === "registry" ? "Cadastro de cotações"
                : activeModule === "clients" ? "Faturamento"
                : activeModule === "financial" ? "Financeiro"
                : activeModule === "ibrap" ? "IBRAP — Chave NF-e"
                : activeModule === "dailyAllowance" ? "Diárias do motorista"
                : "Calculadora de frete"}
            </strong>
          </div>
          <div className="topbar__spacer" />
          <div className="topbar__search-wrap">
            <svg className="topbar__search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="4.5"/><path d="m10.5 10.5 3 3"/>
            </svg>
            <input className="topbar__search" placeholder="Buscar viagens, clientes, motoristas…" />
          </div>
        </div>

      {activeModule === "calculator" ? (
      <main className="content quote-content">
        <section className="quote-hero">
          <div>
          <span className="hero__eyebrow">Cálculo operacional atualizado</span>
            <h2>Tabela de frete no sistema</h2>
            <p>
              Calcule o valor de motorista, cliente, impostos e resultado usando a base ANTT
              que hoje está na planilha.
            </p>
          </div>
          <div className="quote-hero__rate">
            <span>CCD</span>
            <strong>
              {selectedRate
                ? formatCoefficientDisplay(
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
                  Escolha o conjunto usado na viagem. O número de eixos define o CCD e o CC da tabela ANTT.
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
                  Carga normal e carga especial usam coeficientes ANTT próprios: CCD para deslocamento e CC para carga/descarga.
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
                <div className="quote-result-panels">
                  <div className="metric-section metric-section--primary">
                    <div className="metric-section__header">
                      <div>
                        <span>Cálculo da tabela</span>
                        <strong>Valor oficial da cotação</strong>
                      </div>
                      <small>{quote.input.vehicleType} - {quote.input.axles} eixos</small>
                    </div>
                    <div className="quote-result-grid quote-result-grid--main">
                      <div>
                        <span>Cobrar do cliente</span>
                        <strong>{formatCurrency(officialQuote.customerTotal)}</strong>
                      </div>
                      <div>
                        <span>Pagar motorista</span>
                        <strong>{formatCurrency(officialQuote.driverValue)}</strong>
                      </div>
                      <div className={`quote-result-grid__item--${officialQuote.netResult >= 0 ? "success" : "danger"}`}>
                        <span>Lucro da empresa</span>
                        <strong>{formatCurrency(officialQuote.netResult)}</strong>
                      </div>
                      <div className={`quote-result-grid__item--${officialDecision?.tone ?? "success"}`}>
                        <span>Margem</span>
                        <strong>{formatNumber(officialQuote.marginPercent)}%</strong>
                        <small>Meta 30%</small>
                      </div>
                    </div>
                  </div>

                  {simulationQuote ? (
                    <div className="metric-section metric-section--simulation">
                      <div className="metric-section__header">
                        <div>
                          <span>Simulação da negociação</span>
                          <strong>Valores digitados para negociar</strong>
                        </div>
                        <small>Pedido motorista / cliente</small>
                      </div>
                      <div className="quote-result-grid quote-result-grid--main">
                        <div>
                          <span>Cobrar do cliente</span>
                          <strong>{formatCurrency(simulationQuote.customerTotal)}</strong>
                        </div>
                        <div>
                          <span>Pagar motorista</span>
                          <strong>{formatCurrency(simulationQuote.driverValue)}</strong>
                        </div>
                        <div className={`quote-result-grid__item--${simulationQuote.netResult >= 0 ? "success" : "danger"}`}>
                          <span>Lucro da empresa</span>
                          <strong>{formatCurrency(simulationQuote.netResult)}</strong>
                        </div>
                        <div className={`quote-result-grid__item--${simulationDecision?.tone ?? "success"}`}>
                          <span>Margem</span>
                          <strong>{formatNumber(simulationQuote.marginPercent)}%</strong>
                          <small>Meta 30%</small>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className={`margin-alert margin-alert--${quoteDecision?.tone ?? "success"}`}>
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
                  <ResultLine label="Valor mínimo ANTT" value={formatCurrency(quote.table.tableDriverValue)} />
                  <ResultLine label="Fórmula ANTT" value={`${formatNumber(quote.input.km)} km × ${formatCoefficient(quote.table.displacementCost)} + ${formatCurrency(quote.table.loadUnloadCost)}`} />
                  <ResultLine label="CCD" value={formatCoefficient(quote.table.displacementCost)} />
                  <ResultLine label="CC carga/descarga" value={formatCurrency(quote.table.loadUnloadCost)} />
                  <ResultLine label="Valor cliente" value={formatCurrency(quote.result.customerTotal)} />
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
          <p>Fórmula ANTT: Valor mínimo = (KM × CCD) + CC. A operação vê o valor final; estes coeficientes ficam para conferência técnica.</p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Veículo</th>
                  <th>Eixos</th>
                  <th>CCD normal</th>
                  <th>CC normal</th>
                  <th>CCD carga especial</th>
                  <th>CC carga especial</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.axles}>
                    <td>{rate.vehicleType}</td>
                    <td>{rate.axles}</td>
                    <td>{formatCoefficientDisplay(rate.normalDisplacementCost)}</td>
                    <td>{formatCurrency(rate.normalLoadUnloadCost)}</td>
                    <td>{formatCoefficientDisplay(rate.highPerformanceDisplacementCost)}</td>
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
      ) : activeModule === "financial" ? (
        <FinancialAnalysisScreen
          initialType={
            initialPath.includes("/financeiro/recebimentos-futuros")
              ? "futureReceivable"
              : initialPath.includes("/financeiro/despesas-futuras")
              ? "futurePayable"
              : initialPath.includes("/financeiro/pagamentos")
                ? "payable"
                : "receivable"
          }
        />
      ) : activeModule === "ibrap" ? (
        <IbrapScreen />
      ) : activeModule === "dailyAllowance" ? (
        <DailyAllowanceScreen />
      ) : (
        <QuoteRegistryScreen />
      )}
      </div>
    </div>
  );
}

function IbrapScreen() {
  const [form, setForm] = useState(initialIbrapForm);
  const [result, setResult] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [manualKey, setManualKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const selectedInvoice = result?.rows?.[selectedIndex] ?? null;
  const activeKey = onlyDigits(selectedInvoice?.invoiceKey || manualKey, 44);

  function updateIbrapField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: field === "invoiceNumber" || field === "invoiceSeries" ? onlyDigits(value) : value,
    }));
    setCopyMessage("");
  }

  async function searchInvoice(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCopyMessage("");
    setResult(null);
    setSelectedIndex(0);
    setManualKey("");

    try {
      const params = new URLSearchParams({
        invoiceNumber: form.invoiceNumber,
      });

      if (form.invoiceSeries) {
        params.set("invoiceSeries", form.invoiceSeries);
      }

      const response = await fetch(`${API_URL}/ibrap/invoice-key?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Não foi possível consultar a nota fiscal.");
      }

      setResult(payload);
      if (!payload.rows?.length) {
        setError("Nenhuma nota fiscal encontrada para o número e série informados.");
      }
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyInvoiceKey() {
    if (!activeKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeKey);
      setCopyMessage("Chave copiada.");
    } catch {
      setCopyMessage("Não foi possível copiar automaticamente.");
    }
  }

  return (
    <main className="content quote-content ibrap-screen">
      <section className="quote-hero ibrap-hero">
        <div>
          <span className="hero__eyebrow">IBRAP</span>
          <h2>Leitura da chave da nota fiscal</h2>
          <p>
            Informe o número e a série para localizar a NF-e, copiar a chave e gerar o código para leitura no scanner.
          </p>
        </div>
        <div className="quote-hero__rate">
          <span>Formato</span>
          <strong>NF-e 44</strong>
        </div>
      </section>

      <section className="ibrap-layout">
        <form className="quote-panel ibrap-search-panel" onSubmit={searchInvoice}>
          <div className="quote-panel__header">
            <div>
              <h3>Consultar nota</h3>
              <span>Número da nota e série</span>
            </div>
          </div>

          <div className="ibrap-query-row">
            <div className="ibrap-query-row__number">
              <Field
                label="Número da nota"
                type="text"
                inputMode="numeric"
                value={form.invoiceNumber}
                onChange={(value) => updateIbrapField("invoiceNumber", value)}
                placeholder="Ex: 16640"
              />
            </div>
            <div className="ibrap-query-row__series">
              <Field
                label="Série"
                type="text"
                inputMode="numeric"
                value={form.invoiceSeries}
                onChange={(value) => updateIbrapField("invoiceSeries", value)}
                placeholder="Ex: 1"
              />
            </div>
            <div className="ibrap-actions">
              <button type="submit" disabled={loading || (!form.invoiceNumber && !form.invoiceSeries)}>
                {loading ? "Consultando..." : "Buscar"}
              </button>
            </div>
          </div>

          <FieldHint>
            A série ajuda a filtrar quando existir mais de um vínculo para o mesmo número de nota.
          </FieldHint>

          <div className="ibrap-manual-section">
            <label className="quote-field ibrap-manual-key">
              <span>Chave manual, se precisar gerar sem consulta</span>
              <div className="quote-field__control">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatInvoiceKey(manualKey)}
                  placeholder="Cole a chave NF-e de 44 dígitos"
                  onChange={(event) => setManualKey(onlyDigits(event.target.value, 44))}
                />
              </div>
            </label>
          </div>
        </form>

        <section className="quote-panel ibrap-result-panel">
          <div className="quote-panel__header">
            <div>
              <h3>Chave para leitura</h3>
              <span>{selectedInvoice ? `CT-e ${selectedInvoice.cteCode || "-"} - ${selectedInvoice.customerName || "Cliente nao informado"}` : "Resultado da consulta"}</span>
            </div>
            <button type="button" disabled={!activeKey} onClick={copyInvoiceKey}>
              Copiar chave
            </button>
          </div>

          {error ? <div className="feedback-card feedback-card--error">{error}</div> : null}
          {copyMessage ? <div className="feedback-card feedback-card--success">{copyMessage}</div> : null}

          {result?.rows?.length > 1 ? (
            <div className="ibrap-result-tabs" aria-label="Notas encontradas">
              {result.rows.map((row, index) => (
                <button
                  key={`${row.company}-${row.cteSeries}-${row.cteCode}-${index}`}
                  type="button"
                  className={selectedIndex === index ? "is-active" : ""}
                  onClick={() => setSelectedIndex(index)}
                >
                  {row.invoiceNumber} / {row.invoiceSeries || row.cteSeries || "-"}
                </button>
              ))}
            </div>
          ) : null}

          {activeKey ? (
            <div className="ibrap-key-card">
              <div className="ibrap-key-card__meta">
                <span>Chave NF-e</span>
                <strong>{formatInvoiceKey(activeKey)}</strong>
              </div>
              <Code128Barcode value={activeKey} />
              <div className="ibrap-detail-grid">
                <span>
                  Nota
                  <strong>{selectedInvoice?.invoiceNumber || form.invoiceNumber || "-"}</strong>
                </span>
                <span>
                  Série
                  <strong>{selectedInvoice?.invoiceSeries || form.invoiceSeries || "-"}</strong>
                </span>
                <span>
                  Cliente
                  <strong>{selectedInvoice?.customerName || "-"}</strong>
                </span>
                <span>
                  CT-e
                  <strong>{selectedInvoice?.cteCode || "-"}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              Busque a nota fiscal ou cole uma chave NF-e para gerar o código de leitura.
            </div>
          )}
        </section>
      </section>
    </main>
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
  const [billingMode, setBillingMode] = useState("clients");

  return (
    <main className="content quote-content client-analysis-screen">
      <section className="billing-tabs">
        <button
          type="button"
          className={billingMode === "clients" ? "is-active" : ""}
          onClick={() => setBillingMode("clients")}
        >
          Clientes
        </button>
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

      {billingMode === "clients" ? (
        <ClientAnalysisScreen />
      ) : billingMode === "fleet" ? (
        <TripControlAnalysisScreen />
      ) : (
        <ThirdPartyFreightScreen />
      )}
    </main>
  );
}

function getCostCenterRisk(center) {
  if (Number(center?.valorVencido ?? center?.overdueAmount ?? 0) > 0) {
    return "critical";
  }

  if (Number(center?.valorAberto ?? center?.openAmount ?? 0) > 0) {
    return "warning";
  }

  return "normal";
}

function getFinancialStatus(entry) {
  if (entry?.statusCalculado) {
    return entry.statusCalculado === "pago" ? "quitado" : entry.statusCalculado;
  }

  const statusText = String(entry?.status ?? "").toLowerCase();
  const openAmount = Number(entry?.valorAberto ?? 0);
  const dueDate = entry?.dataVencimento ? new Date(entry.dataVencimento) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (statusText.includes("cancel")) {
    return "cancelado";
  }

  if (openAmount > 0 && dueDate && dueDate < today) {
    return "vencido";
  }

  if (openAmount > 0) {
    return "aberto";
  }

  return "quitado";
}

function getPaymentStatus(payment) {
  const status = getFinancialStatus(payment);
  return status === "quitado" ? "pago" : status;
}

function isOverdue(payment) {
  return getPaymentStatus(payment) === "vencido";
}

function getStatusLabelFromEntry(entry) {
  const status = getFinancialStatus(entry);
  const labels = {
    vencido: "Vencido",
    aberto: "Aberto",
    quitado: "Quitado",
    pago: "Pago",
    cancelado: "Cancelado",
  };

  return labels[status] ?? String(entry?.status ?? "-");
}

function getCenterPlate(center) {
  const text = String(center?.nome ?? center?.centroNome ?? "");
  const match = text.match(/[A-Z]{3}\d[A-Z0-9]\d{2}/i);
  return match ? formatPlate(match[0]) : "";
}

function normalizeFinancialCenter(center) {
  const riskLevel = getCostCenterRisk(center);
  return {
    ...center,
    centerName: center.nome || `Centro ${center.codigo}`,
    plate: getCenterPlate(center),
    totalAmount: Number(center.valorDocumento ?? 0),
    openAmount: Number(center.valorAberto ?? 0),
    overdueAmount: Number(center.valorVencido ?? 0),
    paidAmount: Number(center.valorPago ?? 0),
    entriesCount: Number(center.totalLancamentos ?? 0),
    overdueEntriesCount: Number(center.lancamentosVencidos ?? 0),
    paidEntriesCount: Number(center.lancamentosPagos ?? 0),
    riskLevel,
  };
}

function normalizeFinancialClassification(classification) {
  return {
    ...classification,
    classificationCode: classification.codigo,
    classificationName: classification.nome || "Sem classificação",
    classificationNature: classification.natureza || "-",
    classificationType: classification.tipo || "-",
    classificationMask: classification.mascara || "",
    totalAmount: Number(classification.valorDocumento ?? 0),
    openAmount: Number(classification.valorAberto ?? 0),
    overdueAmount: Number(classification.valorVencido ?? 0),
    paidAmount: Number(classification.valorPago ?? 0),
    entriesCount: Number(classification.totalLancamentos ?? 0),
  };
}

function getSortedFinancialCenters(centers) {
  return [...centers]
    .map(normalizeFinancialCenter)
    .sort((left, right) =>
      right.openAmount - left.openAmount
      || right.overdueAmount - left.overdueAmount
      || right.totalAmount - left.totalAmount
      || left.centerName.localeCompare(right.centerName, "pt-BR"),
    );
}

function getSortedFinancialClassifications(classifications) {
  return [...classifications]
    .map(normalizeFinancialClassification)
    .sort((left, right) =>
      right.openAmount - left.openAmount
      || right.overdueAmount - left.overdueAmount
      || right.totalAmount - left.totalAmount
      || left.classificationName.localeCompare(right.classificationName, "pt-BR"),
    );
}

function FinancialPageHeader({ center, type }) {
  const isPayable = type === "payable";
  const isFuturePayable = type === "futurePayable";
  const isFutureReceivable = type === "futureReceivable";

  return (
    <section className="financial-page-header">
      <div>
        <span className="hero__eyebrow">FINANCEIRO POR CENTRO DE CUSTO</span>
        <h2>{isFutureReceivable ? "Forecast de Recebimentos" : isFuturePayable ? "Despesas futuras" : isPayable ? "Pagamentos" : "Recebimentos"}</h2>
        <p>
          {isFutureReceivable
            ? "Analise os valores previstos a receber e o impacto no caixa futuro."
            : isFuturePayable
            ? "Analise os compromissos futuros em aberto por vencimento, mês e centro de custo."
            : isPayable
            ? "Acompanhe valores pagos, em aberto e vencidos separados por centro de custo."
            : "Acompanhe recebimentos consolidados por frota e por veículo."}
        </p>
      </div>
      <div className="financial-selected-center">
        <span>Centro</span>
        <strong>{center || "Todos"}</strong>
      </div>
    </section>
  );
}

function FinancialTabs({ value, onChange }) {
  return (
    <section className="billing-tabs financial-tabs">
      <button
        type="button"
        className={value === "receivable" ? "is-active" : ""}
        onClick={() => onChange("receivable")}
      >
        Recebimentos
      </button>
      <button
        type="button"
        className={value === "payable" ? "is-active" : ""}
        onClick={() => onChange("payable")}
      >
        Pagamentos
      </button>
      <button
        type="button"
        className={value === "futurePayable" ? "is-active" : ""}
        onClick={() => onChange("futurePayable")}
      >
        Despesas futuras
      </button>
      <button
        type="button"
        className={value === "futureReceivable" ? "is-active" : ""}
        onClick={() => onChange("futureReceivable")}
      >
        Recebimentos futuros
      </button>
    </section>
  );
}

function FinancialFilters({ filters, loading, onChange, onSubmit, lockStatus = false, classificationOptions = [], showCustomer = false }) {
  const statusOptions = [
    { value: "", label: "Todos" },
    { value: "pago", label: "Pago" },
    { value: "aberto", label: "Em aberto" },
    { value: "vencido", label: "Vencido" },
    { value: "cancelado", label: "Cancelado" },
  ];

  return (
    <section className="quote-panel client-analysis-filters financial-filter-panel">
      <form className="financial-filter-grid" onSubmit={onSubmit}>
        <Field
          label="Data inicial"
          type="date"
          value={filters.startDate}
          onChange={(value) => onChange("startDate", value)}
        />
        <Field
          label="Data final"
          type="date"
          value={filters.endDate}
          onChange={(value) => onChange("endDate", value)}
        />
        <Field
          label="Centro de custo"
          value={filters.costCenter}
          placeholder="Todos"
          onChange={(value) => onChange("costCenter", value)}
        />
        <SelectField
          label="Status"
          value={filters.status}
          options={statusOptions}
          disabled={lockStatus}
          onChange={(value) => onChange("status", value)}
        />
        {showCustomer ? (
          <Field
            label="Cliente"
            type="search"
            value={filters.customer}
            placeholder="Todos"
            onChange={(value) => onChange("customer", value)}
          />
        ) : null}
        <SelectField
          label="Classificação financeira"
          value={filters.classification}
          options={[
            { value: "", label: "Todas" },
            ...classificationOptions.map((classification) => ({
              value: classification.codigo,
              label: classification.nome || `Classificação ${classification.codigo}`,
            })),
          ]}
          onChange={(value) => onChange("classification", value)}
        />
        <Field
          label="Busca geral"
          type="search"
          value={filters.search}
          placeholder="Duplicata, documento, cliente/fornecedor"
          onChange={(value) => onChange("search", value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Carregando..." : "Atualizar"}
        </button>
      </form>
    </section>
  );
}

function FinancialKpiGrid({ summary, type }) {
  const isReceivable = type === "receivable";
  const isPayable = type === "payable";
  const overdueAmount = Number(summary.valorVencido ?? 0);
  const totalAmount = Number(summary.valorDocumento ?? 0);
  const paidAmount = Number(summary.valorPago ?? 0);
  const delinquencyPercent = totalAmount > 0 ? (overdueAmount / totalAmount) * 100 : 0;
  const receivedPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const averageTicket = Number(summary.totalLancamentos ?? 0) > 0 ? totalAmount / Number(summary.totalLancamentos) : 0;

  const payableCards = [
    {
      label: isPayable ? "Total do período" : "Total a pagar",
      value: formatCurrency(summary.valorDocumento),
      helper: `${formatNumber(summary.totalLancamentos)} lançamentos no filtro`,
      tone: "primary",
      priority: "primary",
    },
    {
      label: "Em aberto",
      value: formatCurrency(summary.valorAberto),
      helper: `${formatNumber(summary.lancamentosAbertos)} lançamentos abertos`,
      tone: "warning",
      priority: "primary",
    },
    {
      label: "Vencido",
      value: formatCurrency(overdueAmount),
      helper: `${formatNumber(summary.lancamentosVencidos)} pendências vencidas`,
      tone: overdueAmount > 0 ? "danger" : "neutral",
      priority: "primary",
    },
    {
      label: "Pago",
      value: formatCurrency(summary.valorPago),
      helper: `${formatNumber(summary.lancamentosPagos)} títulos pagos`,
      tone: "success",
      priority: "primary",
    },
    {
      label: isPayable ? "% inadimplência" : "Descontos / Juros",
      value: isPayable ? `${formatNumber(delinquencyPercent)}%` : `${formatCurrency(summary.valorDesconto)} / ${formatCurrency(summary.valorJuros)}`,
      helper: isPayable ? "Vencido sobre total do período" : "Composição financeira do período",
      tone: isPayable && delinquencyPercent > 0 ? "danger" : "neutral",
      priority: "secondary",
    }
  ];

  const receivableCards = [
    {
      label: "Total do período",
      value: formatCurrency(summary.valorDocumento),
      helper: "Recebimentos no filtro",
      tone: "success",
      priority: "primary",
    },
    {
      label: "Em aberto",
      value: formatCurrency(summary.valorAberto),
      helper: `${formatNumber(summary.lancamentosAbertos)} lançamentos abertos`,
      tone: "warning",
      priority: "primary",
    },
    {
      label: "Pago",
      value: formatCurrency(summary.valorPago),
      helper: `${formatNumber(summary.lancamentosPagos)} títulos pagos`,
      tone: "success",
      priority: "primary",
    },
    {
      label: "Vencido",
      value: formatCurrency(overdueAmount),
      helper: `${formatNumber(summary.lancamentosVencidos)} pendências vencidas`,
      tone: overdueAmount > 0 ? "danger" : "neutral",
      priority: "primary",
    },
    {
      label: "% recebido",
      value: `${formatNumber(receivedPercent)}%`,
      helper: "Pago sobre total do período",
      tone: "primary",
      priority: "secondary",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(averageTicket),
      helper: "Valor médio por lançamento",
      tone: "neutral",
      priority: "secondary",
    },
  ];

  const cards = isReceivable ? receivableCards : payableCards;

  return (
    <section className="financial-kpi-grid">
      {cards.map((card) => (
        <div
          className={`financial-kpi-card financial-kpi-card--${card.tone} financial-kpi-card--${card.priority}`.trim()}
          key={card.label}
        >
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.helper}</small>
        </div>
      ))}
    </section>
  );
}

function getFutureExpenseInsights(rows, monthly) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueIn7 = addDays(today, 7);
  const dueIn30 = addDays(today, 30);
  const dueIn90 = addDays(today, 90);

  const inRange = (row, endDate) => {
    const dueDate = row.dataVencimento ? new Date(row.dataVencimento) : null;
    return dueDate && dueDate >= today && dueDate <= endDate;
  };

  const amountInRange = (endDate) =>
    rows
      .filter((row) => inRange(row, endDate))
      .reduce((total, row) => total + Number(row.valorAberto ?? 0), 0);

  const nextPayment = [...rows]
    .filter((row) => row.dataVencimento)
    .sort((left, right) => new Date(left.dataVencimento) - new Date(right.dataVencimento))[0];

  const peakMonth = [...monthly]
    .sort((left, right) => Number(right.valorAberto ?? 0) - Number(left.valorAberto ?? 0))[0];

  return {
    due7Amount: amountInRange(dueIn7),
    due30Amount: amountInRange(dueIn30),
    due90Amount: amountInRange(dueIn90),
    nextPayment,
    peakMonth,
  };
}

function FutureExpensesKpiGrid({ summary, rows, monthly, classifications }) {
  const insights = getFutureExpenseInsights(rows, monthly);
  const biggestClassification = getSortedFinancialClassifications(classifications)[0];
  const averageMonthly = monthly.length
    ? monthly.reduce((sum, month) => sum + Number(month.valorAberto ?? 0), 0) / monthly.length
    : 0;
  const peakAmount = Number(insights.peakMonth?.valorAberto ?? 0);
  const riskLevel = peakAmount > averageMonthly * 1.5 && peakAmount > 0
    ? "Alto"
    : peakAmount > averageMonthly * 1.15 && peakAmount > 0
      ? "Médio"
      : "Baixo";
  const cards = [
    {
      label: "Total futuro previsto",
      value: formatCurrency(summary.valorAberto),
      helper: `${formatNumber(summary.lancamentosAbertos)} títulos futuros`,
      tone: "primary",
    },
    {
      label: "Próximos 7 dias",
      value: formatCurrency(insights.due7Amount),
      helper: "Compromissos mais urgentes",
      tone: insights.due7Amount > 0 ? "danger" : "neutral",
    },
    {
      label: "Próximos 30 dias",
      value: formatCurrency(insights.due30Amount),
      helper: "Pressão de caixa no curto prazo",
      tone: "warning",
    },
    {
      label: "Próximos 90 dias",
      value: formatCurrency(insights.due90Amount),
      helper: "Visão trimestral de desembolso",
      tone: "primary",
    },
    {
      label: "Maior concentração",
      value: insights.peakMonth ? formatCurrency(insights.peakMonth.valorAberto) : formatCurrency(0),
      helper: insights.peakMonth ? `Mês ${insights.peakMonth.monthLabel}` : "Sem previsão no filtro",
      tone: "neutral",
    },
    {
      label: "Média mensal",
      value: formatCurrency(averageMonthly),
      helper: "Forecast médio por mês",
      tone: "primary",
    },
    {
      label: "Risco financeiro",
      value: riskLevel,
      helper: biggestClassification ? `Maior custo: ${biggestClassification.classificationName}` : "Concentração por mês",
      tone: riskLevel === "Alto" ? "danger" : riskLevel === "Médio" ? "warning" : "success",
    },
  ];

  return (
    <section className="financial-kpi-grid">
      {cards.map((card) => (
        <div className={`financial-kpi-card financial-kpi-card--${card.tone} financial-kpi-card--primary`} key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.helper}</small>
        </div>
      ))}
    </section>
  );
}

function MonthlyPaymentsChart({
  monthly,
  title = "Pagamentos por mês",
  subtitle = "Comparativo mensal entre total, pago, aberto e vencido.",
  series = [
    { key: "valorDocumento", label: "Total", className: "total" },
    { key: "valorPago", label: "Pago", className: "paid" },
    { key: "valorAberto", label: "Aberto", className: "open" },
    { key: "valorVencido", label: "Vencido", className: "overdue" },
  ],
}) {
  const maxValue = Math.max(
    ...monthly.flatMap((month) => series.map((item) => Number(month[item.key] ?? 0))),
    1,
  );

  return (
    <section className="section-card payments-chart-card">
      <header className="section-card__header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>
      <div className="monthly-payments-chart">
        {monthly.map((month) => (
          <article className="monthly-payment-column" key={month.month || month.monthLabel}>
            <div className="monthly-payment-column__bars" style={{ gridTemplateColumns: `repeat(${series.length}, 1fr)` }}>
              {series.map((item) => (
                <span
                  className={`monthly-payment-column__bar monthly-payment-column__bar--${item.className}`}
                  key={item.key}
                  style={{ height: `${Math.max((Number(month[item.key] ?? 0) / maxValue) * 100, 2)}%` }}
                  title={`${item.label}: ${formatCurrency(month[item.key])}`}
                />
              ))}
            </div>
            <strong>{month.monthLabel}</strong>
          </article>
        ))}
        {!monthly.length ? <div className="empty-state">Nenhum pagamento encontrado para os filtros selecionados.</div> : null}
      </div>
      <div className="chart-legend payments-chart-legend">
        {series.map((item) => (
          <span key={item.key}><i className={`legend-dot legend-dot--${item.className}`} />{item.label}</span>
        ))}
      </div>
    </section>
  );
}

function PaymentsByCostCenterChart({ centers, title = "Pagamentos por centro de custo", subtitle = "Maiores valores por veículo/centro de custo." }) {
  const topCenters = getSortedFinancialCenters(centers).slice(0, 10);
  const maxValue = Math.max(...topCenters.map((center) => center.openAmount), 1);

  return (
    <section className="section-card payments-chart-card">
      <header className="section-card__header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>
      <div className="payments-center-bars">
        {topCenters.map((center) => (
          <article className="payments-center-bar" key={center.codigo}>
            <div>
              <strong>{center.plate || center.centerName}</strong>
              <span>{center.centerName}</span>
            </div>
            <div className="payments-center-bar__track">
              <i className="payments-center-bar__open" style={{ width: `${Math.min((center.openAmount / maxValue) * 100, 100)}%` }} />
            </div>
            <strong>{formatCurrency(center.openAmount)}</strong>
            <small>{formatNumber(center.entriesCount)} títulos</small>
          </article>
        ))}
        {!topCenters.length ? <div className="empty-state">Nenhum centro de custo encontrado.</div> : null}
      </div>
    </section>
  );
}

function FinancialClassificationChart({ classifications }) {
  const topClassifications = getSortedFinancialClassifications(classifications).slice(0, 10);
  const maxValue = Math.max(...topClassifications.map((classification) => classification.openAmount), 1);

  return (
    <section className="section-card payments-chart-card">
      <header className="section-card__header">
        <div>
          <h2>Despesas por classificação</h2>
          <p>Principais tipos de custo previstos no período.</p>
        </div>
      </header>
      <div className="payments-center-bars">
        {topClassifications.map((classification) => (
          <article className="payments-center-bar" key={classification.classificationCode || classification.classificationName}>
            <div>
              <strong>{classification.classificationName}</strong>
              <span>{classification.classificationMask || classification.classificationNature || "Sem classificação"}</span>
            </div>
            <div className="payments-center-bar__track">
              <i className="payments-center-bar__classification" style={{ width: `${Math.min((classification.openAmount / maxValue) * 100, 100)}%` }} />
            </div>
            <strong>{formatCurrency(classification.openAmount)}</strong>
            <small>{formatNumber(classification.entriesCount)} títulos</small>
          </article>
        ))}
        {!topClassifications.length ? <div className="empty-state">Nenhuma classificação encontrada no período.</div> : null}
      </div>
    </section>
  );
}

function FinancialClassificationDonut({ classifications }) {
  const topClassifications = getSortedFinancialClassifications(classifications).slice(0, 6);
  const totalOpen = topClassifications.reduce((sum, item) => sum + item.openAmount, 0);
  const colors = ["#2e78b4", "#1f6f54", "#f28c2b", "#b83a3a", "#61738e", "#8aa4bd"];
  let offset = 0;
  const gradientStops = topClassifications.map((classification, index) => {
    const start = offset;
    const size = totalOpen > 0 ? (classification.openAmount / totalOpen) * 100 : 0;
    offset += size;
    return `${colors[index % colors.length]} ${start}% ${offset}%`;
  });

  return (
    <section className="section-card payment-donut-card">
      <header className="section-card__header">
        <div>
          <h2>Classificação financeira</h2>
          <p>Composição dos pagamentos por tipo de custo.</p>
        </div>
      </header>
      <div className="payment-donut-layout">
        <div
          className="payment-donut"
          style={{ background: totalOpen > 0 ? `conic-gradient(${gradientStops.join(", ")})` : "#edf3f8" }}
          aria-label="Distribuição por classificação financeira"
        >
          <div>
            <strong>{formatCurrency(totalOpen)}</strong>
            <span>em aberto</span>
          </div>
        </div>
        <div className="payment-donut-legend">
          {topClassifications.map((classification, index) => (
            <article key={classification.classificationCode || classification.classificationName}>
              <i style={{ background: colors[index % colors.length] }} />
              <div>
                <strong>{classification.classificationName}</strong>
                <span>{formatCurrency(classification.openAmount)}</span>
              </div>
            </article>
          ))}
          {!topClassifications.length ? <div className="empty-state">Nenhuma classificação no filtro.</div> : null}
        </div>
      </div>
    </section>
  );
}

function PaymentHealthCard({ summary }) {
  const totalAmount = Number(summary.valorDocumento ?? 0);
  const paidAmount = Number(summary.valorPago ?? 0);
  const openAmount = Number(summary.valorAberto ?? 0);
  const overdueAmount = Number(summary.valorVencido ?? 0);
  const currentOpenAmount = Math.max(openAmount - overdueAmount, 0);
  const paidPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const openPercent = totalAmount > 0 ? (currentOpenAmount / totalAmount) * 100 : 0;
  const overduePercent = totalAmount > 0 ? (overdueAmount / totalAmount) * 100 : 0;

  return (
    <section className="section-card payment-health-card">
      <header className="section-card__header">
        <div>
          <h2>Saúde financeira</h2>
          <p>Percentual pago versus compromissos totais do filtro.</p>
        </div>
        <strong>{formatNumber(paidPercent)}%</strong>
      </header>
      <div className="payment-health-bar" aria-label="Saúde financeira dos pagamentos">
        <i className="payment-health-bar__paid" style={{ width: `${Math.min(paidPercent, 100)}%` }} />
        <i className="payment-health-bar__open" style={{ width: `${Math.min(openPercent, 100)}%` }} />
        <i className="payment-health-bar__overdue" style={{ width: `${Math.min(overduePercent, 100)}%` }} />
      </div>
      <div className="payment-health-metrics">
        <span><i className="legend-dot legend-dot--paid" />Pago {formatCurrency(paidAmount)}</span>
        <span><i className="legend-dot legend-dot--open" />Aberto {formatCurrency(openAmount)}</span>
        <span><i className="legend-dot legend-dot--overdue" />Vencido {formatCurrency(overdueAmount)}</span>
      </div>
    </section>
  );
}

function FutureForecastChart({
  monthly,
  title = "Forecast mensal de despesas",
  subtitle = "Valores previstos, tendência e média mensal do horizonte selecionado.",
  emptyText = "Nenhuma despesa futura encontrada para o horizonte selecionado.",
}) {
  const average = monthly.length
    ? monthly.reduce((sum, month) => sum + Number(month.valorAberto ?? 0), 0) / monthly.length
    : 0;
  const maxValue = Math.max(...monthly.map((month) => Number(month.valorAberto ?? 0)), average, 1);
  const averagePosition = 100 - Math.min((average / maxValue) * 100, 100);

  return (
    <section className="section-card future-forecast-card">
      <header className="section-card__header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="forecast-average-pill">
          <span>Média</span>
          <strong>{formatCurrency(average)}</strong>
        </div>
      </header>
      <div className="future-forecast-chart">
        <span className="future-forecast-average-line" style={{ top: `${averagePosition}%` }} />
        {monthly.map((month, index) => {
          const amount = Number(month.valorAberto ?? 0);
          const previousAmount = Number(monthly[index - 1]?.valorAberto ?? 0);
          const trend = index === 0 || previousAmount === 0 ? 0 : ((amount - previousAmount) / previousAmount) * 100;

          return (
            <article className="future-forecast-column" key={month.month || month.monthLabel}>
              <div className="future-forecast-column__bar">
                <i style={{ height: `${Math.max((amount / maxValue) * 100, 2)}%` }} />
              </div>
              <strong>{month.monthLabel}</strong>
              <span>{formatCurrency(amount)}</span>
              {index > 0 ? <small className={trend >= 0 ? "is-up" : "is-down"}>{trend >= 0 ? "+" : ""}{formatNumber(trend)}%</small> : <small>-</small>}
            </article>
          );
        })}
        {!monthly.length ? <div className="empty-state">{emptyText}</div> : null}
      </div>
    </section>
  );
}

function FutureDueHeatmap({ rows, monthly }) {
  const buckets = [
    { key: "1-7", label: "Dias 1-7", start: 1, end: 7 },
    { key: "8-15", label: "Dias 8-15", start: 8, end: 15 },
    { key: "16-23", label: "Dias 16-23", start: 16, end: 23 },
    { key: "24-31", label: "Dias 24-31", start: 24, end: 31 },
  ];
  const monthLabels = monthly.map((month) => month.monthLabel);
  const valuesByMonth = new Map(monthLabels.map((label) => [label, Object.fromEntries(buckets.map((bucket) => [bucket.key, 0]))]));

  rows.forEach((row) => {
    if (!row.dataVencimento) {
      return;
    }

    const dueDate = new Date(row.dataVencimento);
    const monthLabel = dueDate.toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(".", "");
    if (!valuesByMonth.has(monthLabel)) {
      valuesByMonth.set(monthLabel, Object.fromEntries(buckets.map((bucket) => [bucket.key, 0])));
    }

    const day = dueDate.getUTCDate();
    const bucket = buckets.find((item) => day >= item.start && day <= item.end);
    if (bucket) {
      valuesByMonth.get(monthLabel)[bucket.key] += Number(row.valorAberto ?? 0);
    }
  });

  const maxValue = Math.max(
    ...[...valuesByMonth.values()].flatMap((bucketValues) => Object.values(bucketValues)),
    1,
  );

  return (
    <section className="section-card future-heatmap-card">
      <header className="section-card__header">
        <div>
          <h2>Heatmap de vencimentos</h2>
          <p>Concentração financeira por período do mês.</p>
        </div>
      </header>
      <div className="future-heatmap">
        <div className="future-heatmap__head" />
        {buckets.map((bucket) => <strong key={bucket.key}>{bucket.label}</strong>)}
        {[...valuesByMonth.entries()].map(([monthLabel, bucketValues]) => (
          <React.Fragment key={monthLabel}>
            <strong>{monthLabel}</strong>
            {buckets.map((bucket) => {
              const value = bucketValues[bucket.key] || 0;
              const intensity = Math.min(value / maxValue, 1);
              return (
                <span
                  key={bucket.key}
                  style={{ "--heat": intensity }}
                  title={`${monthLabel} - ${bucket.label}: ${formatCurrency(value)}`}
                >
                  {formatCurrency(value)}
                </span>
              );
            })}
          </React.Fragment>
        ))}
        {!valuesByMonth.size ? <div className="empty-state">Sem vencimentos no período.</div> : null}
      </div>
    </section>
  );
}

function FutureUpcomingCommitments({ rows }) {
  const upcoming = [...rows]
    .filter((row) => Number(row.valorAberto ?? 0) > 0)
    .sort((left, right) =>
      new Date(left.dataVencimento || "2999-12-31") - new Date(right.dataVencimento || "2999-12-31")
      || Number(right.valorAberto ?? 0) - Number(left.valorAberto ?? 0),
    )
    .slice(0, 5);

  return (
    <section className="section-card future-upcoming-card">
      <header className="section-card__header">
        <div>
          <h2>Próximos compromissos</h2>
          <p>Top 5 vencimentos futuros para priorizar.</p>
        </div>
      </header>
      <div className="future-upcoming-list">
        {upcoming.map((row) => (
          <article key={`${row.empresa}-${row.duplicata}-${row.parcela}-${row.centroCodigo}`}>
            <time>{formatDate(row.dataVencimento)}</time>
            <div>
              <strong>{row.pessoaNome || row.pessoaFantasia || row.pessoaRazao || row.documento || row.duplicata || "-"}</strong>
              <span>{row.classificacaoNome || "Sem classificação"}</span>
            </div>
            <strong>{formatCurrency(row.valorAberto)}</strong>
          </article>
        ))}
        {!upcoming.length ? <div className="empty-state">Nenhum compromisso futuro no horizonte selecionado.</div> : null}
      </div>
    </section>
  );
}

function FutureHorizonSelector({ value, onChange }) {
  const options = [
    { value: "30d", label: "30 dias" },
    { value: "90d", label: "90 dias" },
    { value: "12m", label: "12 meses" },
    { value: "24m", label: "24 meses" },
  ];

  return (
    <section className="future-horizon-selector" aria-label="Horizonte temporal">
      {options.map((option) => (
        <button
          type="button"
          className={value === option.value ? "is-active" : ""}
          onClick={() => onChange(option.value)}
          key={option.value}
        >
          {option.label}
        </button>
      ))}
    </section>
  );
}

function FutureExpensesDashboard({ data, horizon, onHorizonChange }) {
  return (
    <>
      <FutureHorizonSelector value={horizon} onChange={onHorizonChange} />
      <FutureExpensesKpiGrid summary={data.summary} rows={data.rows} monthly={data.monthly} classifications={data.classifications} />
      <FutureForecastChart monthly={data.monthly} />
      <div className="future-dashboard-grid">
        <FinancialClassificationDonut classifications={data.classifications} />
        <FutureDueHeatmap rows={data.rows} monthly={data.monthly} />
      </div>
      <FutureUpcomingCommitments rows={data.rows} />
    </>
  );
}

function getClientForecast(rows) {
  const clients = new Map();
  rows.forEach((row) => {
    const key = row.pessoa || row.pessoaNome || "sem-cliente";
    const current = clients.get(key) || {
      name: row.pessoaNome || row.pessoaFantasia || row.pessoaRazao || "Sem cliente",
      amount: 0,
      count: 0,
    };
    current.amount += Number(row.valorAberto ?? 0);
    current.count += 1;
    clients.set(key, current);
  });

  return [...clients.values()].sort((left, right) => right.amount - left.amount);
}

function FutureReceivablesKpiGrid({ summary, rows, monthly }) {
  const insights = getFutureExpenseInsights(rows, monthly);
  const averageMonthly = monthly.length
    ? monthly.reduce((sum, month) => sum + Number(month.valorAberto ?? 0), 0) / monthly.length
    : 0;
  const totalOpen = Number(summary.valorAberto ?? 0);
  const overduePercent = totalOpen > 0 ? (Number(summary.valorVencido ?? 0) / totalOpen) * 100 : 0;
  const topClient = getClientForecast(rows)[0];
  const topClientShare = totalOpen > 0 ? ((topClient?.amount || 0) / totalOpen) * 100 : 0;
  const riskLevel = overduePercent > 12 || topClientShare > 45
    ? "Alto"
    : overduePercent > 4 || topClientShare > 30
      ? "Médio"
      : "Baixo";
  const cards = [
    { label: "Total futuro previsto a receber", value: formatCurrency(summary.valorAberto), helper: `${formatNumber(summary.lancamentosAbertos)} títulos em aberto`, tone: "success" },
    { label: "Próximos 7 dias", value: formatCurrency(insights.due7Amount), helper: "Entradas mais próximas", tone: "primary" },
    { label: "Próximos 30 dias", value: formatCurrency(insights.due30Amount), helper: "Previsão de curto prazo", tone: "primary" },
    { label: "Próximos 90 dias", value: formatCurrency(insights.due90Amount), helper: "Visão trimestral de caixa", tone: "primary" },
    { label: "Maior concentração mensal", value: insights.peakMonth ? formatCurrency(insights.peakMonth.valorAberto) : formatCurrency(0), helper: insights.peakMonth ? `Mês ${insights.peakMonth.monthLabel}` : "Sem previsão no filtro", tone: "neutral" },
    { label: "Média mensal prevista", value: formatCurrency(averageMonthly), helper: "Média do horizonte selecionado", tone: "primary" },
    { label: "Risco de recebimento", value: riskLevel, helper: topClient ? `Maior cliente: ${formatNumber(topClientShare)}%` : "Concentração e vencidos", tone: riskLevel === "Alto" ? "danger" : riskLevel === "Médio" ? "warning" : "success" },
  ];

  return (
    <section className="financial-kpi-grid">
      {cards.map((card) => (
        <div className={`financial-kpi-card financial-kpi-card--${card.tone} financial-kpi-card--primary`} key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.helper}</small>
        </div>
      ))}
    </section>
  );
}

function FutureCashFlowChart({ receivableMonthly, payableMonthly }) {
  const payableByMonth = new Map(payableMonthly.map((month) => [month.monthLabel, Number(month.valorAberto ?? 0)]));
  const rows = receivableMonthly.map((month) => {
    const receivable = Number(month.valorAberto ?? 0);
    const payable = payableByMonth.get(month.monthLabel) || 0;
    return { monthLabel: month.monthLabel, receivable, payable, balance: receivable - payable };
  });
  const maxValue = Math.max(...rows.flatMap((row) => [row.receivable, row.payable, Math.abs(row.balance)]), 1);

  return (
    <section className="section-card future-cashflow-card">
      <header className="section-card__header">
        <div>
          <h2>Fluxo líquido projetado</h2>
          <p>Receber menos pagar por mês no horizonte selecionado.</p>
        </div>
      </header>
      <div className="future-cashflow-chart">
        {rows.map((row) => (
          <article key={row.monthLabel}>
            <div className="future-cashflow-bars">
              <i className="cashflow-receivable" style={{ height: `${Math.max((row.receivable / maxValue) * 100, 2)}%` }} title={`Receber: ${formatCurrency(row.receivable)}`} />
              <i className="cashflow-payable" style={{ height: `${Math.max((row.payable / maxValue) * 100, 2)}%` }} title={`Pagar: ${formatCurrency(row.payable)}`} />
            </div>
            <strong>{row.monthLabel}</strong>
            <span className={row.balance >= 0 ? "is-positive" : "is-negative"}>{formatCurrency(row.balance)}</span>
          </article>
        ))}
      </div>
      <div className="chart-legend payments-chart-legend">
        <span><i className="legend-dot legend-dot--paid" />Receber</span>
        <span><i className="legend-dot legend-dot--overdue" />Pagar</span>
      </div>
    </section>
  );
}

function FutureClientDonut({ rows }) {
  const topClients = getClientForecast(rows).slice(0, 6);
  const total = topClients.reduce((sum, client) => sum + client.amount, 0);
  const colors = ["#1f6f54", "#2e78b4", "#f28c2b", "#61738e", "#8aa4bd", "#b83a3a"];
  let offset = 0;
  const stops = topClients.map((client, index) => {
    const start = offset;
    const size = total > 0 ? (client.amount / total) * 100 : 0;
    offset += size;
    return `${colors[index % colors.length]} ${start}% ${offset}%`;
  });

  return (
    <section className="section-card payment-donut-card">
      <header className="section-card__header">
        <div>
          <h2>Recebimentos por cliente</h2>
          <p>Concentração dos principais clientes no forecast.</p>
        </div>
      </header>
      <div className="payment-donut-layout">
        <div className="payment-donut" style={{ background: total > 0 ? `conic-gradient(${stops.join(", ")})` : "#edf3f8" }}>
          <div>
            <strong>{formatCurrency(total)}</strong>
            <span>a receber</span>
          </div>
        </div>
        <div className="payment-donut-legend">
          {topClients.map((client, index) => (
            <article key={client.name}>
              <i style={{ background: colors[index % colors.length] }} />
              <div>
                <strong>{client.name}</strong>
                <span>{formatCurrency(client.amount)} - {formatNumber(total > 0 ? (client.amount / total) * 100 : 0)}%</span>
              </div>
            </article>
          ))}
          {!topClients.length ? <div className="empty-state">Nenhum cliente no horizonte selecionado.</div> : null}
        </div>
      </div>
    </section>
  );
}

function FutureUpcomingReceivables({ rows }) {
  const upcoming = [...rows]
    .filter((row) => Number(row.valorAberto ?? 0) > 0)
    .sort((left, right) =>
      new Date(left.dataVencimento || "2999-12-31") - new Date(right.dataVencimento || "2999-12-31")
      || Number(right.valorAberto ?? 0) - Number(left.valorAberto ?? 0),
    )
    .slice(0, 5);

  return (
    <section className="section-card future-upcoming-card">
      <header className="section-card__header">
        <div>
          <h2>Próximos recebimentos</h2>
          <p>Top 5 entradas previstas para acompanhamento.</p>
        </div>
      </header>
      <div className="future-upcoming-list future-upcoming-list--receivable">
        {upcoming.map((row) => (
          <article key={`${row.empresa}-${row.duplicata}-${row.parcela}-${row.centroCodigo}`}>
            <time>{formatDate(row.dataVencimento)}</time>
            <div>
              <strong>{row.pessoaNome || row.pessoaFantasia || row.pessoaRazao || row.documento || row.duplicata || "-"}</strong>
              <span>{[row.documento || row.duplicata || "-", row.classificacaoNome || "Sem classificação"].filter(Boolean).join(" - ")}</span>
            </div>
            <strong>{formatCurrency(row.valorAberto)}</strong>
          </article>
        ))}
        {!upcoming.length ? <div className="empty-state">Nenhum recebimento futuro no horizonte selecionado.</div> : null}
      </div>
    </section>
  );
}

function FutureReceivablesDashboard({ data, payableData, horizon, onHorizonChange }) {
  return (
    <>
      <FutureHorizonSelector value={horizon} onChange={onHorizonChange} />
      <FutureReceivablesKpiGrid summary={data.summary} rows={data.rows} monthly={data.monthly} />
      <FutureForecastChart
        monthly={data.monthly}
        title="Forecast mensal de recebimentos"
        subtitle="Valores previstos a receber, média mensal e variação entre meses."
        emptyText="Nenhum recebimento futuro encontrado para o horizonte selecionado."
      />
      <div className="future-dashboard-grid">
        <FutureCashFlowChart receivableMonthly={data.monthly} payableMonthly={payableData.monthly || []} />
        <FutureClientDonut rows={data.rows} />
      </div>
      <div className="future-dashboard-grid future-dashboard-grid--secondary">
        <FutureDueHeatmap rows={data.rows} monthly={data.monthly} />
        <FutureUpcomingReceivables rows={data.rows} />
      </div>
    </>
  );
}

function ReceivablesDashboard({ data }) {
  return (
    <>
      <div className="receivable-dashboard-main">
        <FutureForecastChart
          monthly={data.monthly}
          title="Forecast de recebimentos"
          subtitle="Recebimentos por mês, média e variação percentual."
          emptyText="Nenhum recebimento encontrado para os filtros selecionados."
        />
        <FutureClientDonut rows={data.rows} />
      </div>
      <div className="receivable-dashboard-secondary">
        <TopReceivablesCompact centers={data.centers} />
        <FutureDueHeatmap rows={data.rows} monthly={data.monthly} />
      </div>
    </>
  );
}

function TopReceivablesCompact({ centers }) {
  const topCenters = getSortedFinancialCenters(centers).slice(0, 8);
  const maxValue = Math.max(...topCenters.map((center) => center.totalAmount), 1);

  return (
    <section className="section-card top-receivables-card">
      <header className="section-card__header">
        <div>
          <h2>Top recebimentos</h2>
          <p>Centros com maior valor no período.</p>
        </div>
      </header>
      <div className="top-receivables-list">
        {topCenters.map((center) => (
          <article key={center.codigo}>
            <div>
              <strong>{center.plate || center.centerName}</strong>
              <span>{formatNumber(center.entriesCount)} lançamentos</span>
            </div>
            <div className="top-receivables-list__bar">
              <i style={{ width: `${Math.min((center.totalAmount / maxValue) * 100, 100)}%` }} />
            </div>
            <strong>{formatCurrency(center.totalAmount)}</strong>
          </article>
        ))}
        {!topCenters.length ? <div className="empty-state">Nenhum recebimento encontrado no período.</div> : null}
      </div>
    </section>
  );
}

function CostCenterRanking({ centers }) {
  const sortedCenters = getSortedFinancialCenters(centers);
  const maxReference = Math.max(
    ...sortedCenters.map((center) => Math.max(center.overdueAmount, center.openAmount, center.totalAmount)),
    1,
  );
  const riskLabels = {
    critical: "Crítico",
    warning: "Atenção",
    normal: "Normal",
    paid: "Pago",
  };

  return (
    <section className="section-card financial-ranking-panel">
      <header className="section-card__header">
        <div>
          <h2>Ranking de centros de custo</h2>
          <p>Ordenado por maior vencido, depois aberto e impacto total.</p>
        </div>
      </header>
      <div className="cost-center-ranking">
        {sortedCenters.map((center) => (
          <article className={`cost-center-row cost-center-row--compact cost-center-row--${center.riskLevel}`} key={center.codigo}>
            <div className="cost-center-row__vehicle" aria-hidden="true">VEI</div>
            <div className="cost-center-row__main">
              <strong>{center.centerName}</strong>
              <span>{center.plate || `Centro ${center.codigo}`} - {formatNumber(center.entriesCount)} lançamentos</span>
              <div className="cost-center-row__bar">
                <i style={{ width: `${Math.min((Math.max(center.overdueAmount, center.openAmount, center.totalAmount) / maxReference) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatCurrency(center.totalAmount)}</strong>
            </div>
            <div>
              <span>Aberto</span>
              <strong>{formatCurrency(center.openAmount)}</strong>
            </div>
            <div>
              <span>Vencido</span>
              <strong>{formatCurrency(center.overdueAmount)}</strong>
            </div>
            <div>
              <span>Pago</span>
              <strong>{formatCurrency(center.paidAmount)}</strong>
            </div>
            <div className={`risk-badge risk-badge--${center.riskLevel}`}>
              {riskLabels[center.riskLevel]}
            </div>
          </article>
        ))}
        {!sortedCenters.length ? <div className="empty-state">Nenhum centro de custo encontrado.</div> : null}
      </div>
    </section>
  );
}

function FinancialClassificationRanking({ classifications }) {
  const sortedClassifications = getSortedFinancialClassifications(classifications);

  return (
    <section className="section-card financial-ranking-panel">
      <header className="section-card__header">
        <div>
          <h2>Ranking por classificação</h2>
          <p>Ordenado por maior aberto, vencido e impacto total.</p>
        </div>
      </header>
      <div className="cost-center-ranking">
        {sortedClassifications.map((classification) => (
          <article className="classification-row" key={classification.classificationCode || classification.classificationName}>
            <div className="cost-center-row__vehicle" aria-hidden="true">CF</div>
            <div className="cost-center-row__main">
              <strong>{classification.classificationName}</strong>
              <span>
                {[
                  classification.classificationCode ? `Cód. ${classification.classificationCode}` : "",
                  classification.classificationNature,
                  `${formatNumber(classification.entriesCount)} lançamentos`,
                ].filter(Boolean).join(" - ")}
              </span>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatCurrency(classification.totalAmount)}</strong>
            </div>
            <div>
              <span>Aberto</span>
              <strong>{formatCurrency(classification.openAmount)}</strong>
            </div>
            <div>
              <span>Vencido</span>
              <strong>{formatCurrency(classification.overdueAmount)}</strong>
            </div>
            <div>
              <span>Pago</span>
              <strong>{formatCurrency(classification.paidAmount)}</strong>
            </div>
          </article>
        ))}
        {!sortedClassifications.length ? <div className="empty-state">Nenhuma classificação financeira encontrada.</div> : null}
      </div>
    </section>
  );
}

function TopOverdueList({ centers }) {
  const overdueCenters = getSortedFinancialCenters(centers)
    .filter((center) => center.overdueAmount > 0)
    .slice(0, 5);

  return (
    <section className="section-card top-overdue-panel">
      <header className="section-card__header">
        <div>
          <h2>Maiores pendências</h2>
          <p>Centros com maior valor vencido.</p>
        </div>
      </header>
      <div className="top-overdue-list">
        {overdueCenters.map((center, index) => (
          <article className="top-overdue-item" key={center.codigo}>
            <span>{index + 1}</span>
            <div>
              <strong>{center.plate || center.centerName}</strong>
              <small>{formatNumber(center.overdueEntriesCount)} lançamentos vencidos</small>
            </div>
            <strong>{formatCurrency(center.overdueAmount)}</strong>
          </article>
        ))}
        {!overdueCenters.length ? <div className="empty-state">Nenhuma pendência vencida no período.</div> : null}
      </div>
    </section>
  );
}

function FinancialEntriesTable({ rows, partyLabel, collapsedByDefault = false }) {
  const pageSize = 25;
  const [page, setPage] = useState(1);
  const [collapsed, setCollapsed] = useState(collapsedByDefault);
  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [rows]);

  useEffect(() => {
    setCollapsed(collapsedByDefault);
  }, [collapsedByDefault]);

  return (
    <section className={`section-card financial-entries-panel ${collapsed ? "is-collapsed" : ""}`}>
      <header className="section-card__header">
        <div>
          <h2>Lançamentos</h2>
          <p>Detalhe por vencimento, documento e centro de custo.</p>
        </div>
        <button type="button" className="financial-entries-toggle" onClick={() => setCollapsed((current) => !current)}>
          {collapsed ? `Ver lançamentos (${formatNumber(rows.length)} registros)` : "Ocultar lançamentos"}
        </button>
      </header>
      {!collapsed ? (
        <>
          <div className="financial-table-summary">
            <strong>{formatNumber(rows.length)}</strong>
            <span>registros</span>
          </div>
          <div className="table-wrapper">
            <table className="client-ranking-table financial-table">
              <thead>
                <tr>
                  <th>Vencimento</th>
                  <th>{partyLabel}</th>
                  <th>Documento / duplicata</th>
                  <th>Parcela</th>
                  <th>Centro de custo</th>
                  <th>Classificação</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th>Aberto</th>
                  <th>Pago</th>
                  <th>Juros</th>
                  <th>Desconto</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => {
                  const status = getFinancialStatus(row);
                  return (
                    <tr className={isOverdue(row) ? "is-overdue" : ""} key={`${row.empresa}-${row.serie}-${row.duplicata}-${row.parcela}-${row.centroCodigo}`}>
                      <td>
                        <strong>{formatDate(row.dataVencimento)}</strong>
                        <span>Emissão {formatDate(row.dataEmissao)}</span>
                      </td>
                      <td>
                        <strong>{row.pessoaNome || row.pessoaFantasia || row.pessoaRazao || row.pessoa || "-"}</strong>
                        <span>
                          {[row.pessoa ? `Cód. ${row.pessoa}` : "", row.pessoaDocumento || row.documento || ""]
                            .filter(Boolean)
                            .join(" - ") || row.observacao || "-"}
                        </span>
                      </td>
                      <td>
                        <strong>{row.documento || row.duplicata || "-"}</strong>
                        <span>Dup. {row.duplicata || "-"} / Parcela {row.parcela || "-"}</span>
                      </td>
                      <td>{row.parcela || "-"}</td>
                      <td>
                        <strong>{getCenterPlate({ nome: row.centroNome }) || row.centroCodigo || "-"}</strong>
                        <span>{row.centroNome || "-"}</span>
                      </td>
                      <td>
                        <strong>{row.classificacaoNome || "Sem classificação"}</strong>
                        <span>{row.classificacaoMascara || row.classificacaoNatureza || "-"}</span>
                      </td>
                      <td>
                        <span className={`financial-status-badge financial-status-badge--${status}`}>
                          {getStatusLabelFromEntry(row)}
                        </span>
                      </td>
                      <td>{formatCurrency(row.valorDocumento)}</td>
                      <td>{formatCurrency(row.valorAberto)}</td>
                      <td>{formatCurrency(row.valorPago)}</td>
                      <td>{formatCurrency(row.valorJuros)}</td>
                      <td>{formatCurrency(row.valorDesconto)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!rows.length ? <div className="empty-state">Nenhum lançamento encontrado para o filtro.</div> : null}
          </div>
          {rows.length > pageSize ? (
            <div className="financial-table-pagination">
              <span>
                Página {formatNumber(safePage)} de {formatNumber(totalPages)}
              </span>
              <div>
                <button type="button" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={safePage === 1}>
                  Anterior
                </button>
                <button type="button" onClick={() => setPage((current) => Math.min(current + 1, totalPages))} disabled={safePage === totalPages}>
                  Próxima
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function FinancialAnalysisScreen({ initialType = "receivable" }) {
  const today = new Date().toISOString().slice(0, 10);
  const currentMonthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
  const futureEndDate = toInputDate(addMonths(new Date(), 12));
  const [futureHorizon, setFutureHorizon] = useState(initialType === "futurePayable" || initialType === "futureReceivable" ? "12m" : "12m");
  const initialFilters = initialType === "futurePayable" || initialType === "futureReceivable"
    ? {
      startDate: today,
      endDate: futureEndDate,
      costCenter: "",
      classification: "",
      customer: "",
      search: "",
      status: "aberto",
    }
    : {
      startDate: currentMonthStart,
      endDate: today,
      costCenter: "",
      classification: "",
      customer: "",
      search: "",
      status: "",
    };
  const [financialType, setFinancialType] = useState(initialType);
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState({
    summary: {
      totalLancamentos: 0,
      valorDocumento: 0,
      valorAberto: 0,
      valorVencido: 0,
      lancamentosAbertos: 0,
      lancamentosVencidos: 0,
    },
    centers: [],
    classifications: [],
    classificationOptions: [],
    monthly: [],
    rows: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cashFlowData, setCashFlowData] = useState({ monthly: [] });

  async function loadFinancialAnalysis(type = financialType, currentFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const apiType = type === "futurePayable" ? "payable" : type === "futureReceivable" ? "receivable" : type;
      const requestFilters = type === "futurePayable" || type === "futureReceivable"
        ? { ...currentFilters, status: "aberto" }
        : currentFilters;
      if (type === "futureReceivable" && requestFilters.customer) {
        requestFilters.search = requestFilters.customer;
      }
      delete requestFilters.customer;
      const params = new URLSearchParams({ type: apiType });
      for (const [key, value] of Object.entries(requestFilters)) {
        if (String(value ?? "").trim()) {
          params.set(key, value);
        }
      }
      params.set("limit", "500");

      const response = await fetch(`${API_URL}/client-analysis/financial?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar a análise financeira.");
      }

      const nextData = await response.json();
      setData(nextData);

      if (type === "futureReceivable") {
        const payableFilters = { ...currentFilters, status: "aberto" };
        delete payableFilters.customer;
        const payableParams = new URLSearchParams({ type: "payable" });
        for (const [key, value] of Object.entries(payableFilters)) {
          if (String(value ?? "").trim()) {
            payableParams.set(key, value);
          }
        }
        payableParams.set("limit", "500");
        const payableResponse = await fetch(`${API_URL}/client-analysis/financial?${payableParams.toString()}`);
        if (payableResponse.ok) {
          setCashFlowData(await payableResponse.json());
        }
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinancialAnalysis(financialType, filters);
  }, [financialType]);

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function applyFilters(event) {
    event.preventDefault();
    loadFinancialAnalysis(financialType, filters);
  }

  function changeFinancialType(type) {
    setFinancialType(type);
    if (type === "futurePayable" || type === "futureReceivable") {
      setFilters((current) => ({
        ...current,
        startDate: today,
        endDate: futureEndDate,
        status: "aberto",
      }));
      setFutureHorizon("12m");
      window.history.replaceState(null, "", type === "futurePayable" ? "/financeiro/despesas-futuras" : "/financeiro/recebimentos-futuros");
      return;
    }

    setFilters((current) => ({
      ...current,
      startDate: current.startDate || currentMonthStart,
      endDate: current.endDate || today,
      status: "",
    }));
    window.history.replaceState(null, "", type === "payable" ? "/financeiro/pagamentos" : "/financeiro/recebimentos");
  }

  function changeFutureHorizon(horizon) {
    const baseDate = new Date();
    const endByHorizon = {
      "30d": toInputDate(addDays(baseDate, 30)),
      "90d": toInputDate(addDays(baseDate, 90)),
      "12m": toInputDate(addMonths(baseDate, 12)),
      "24m": toInputDate(addMonths(baseDate, 24)),
    };
    const nextFilters = {
      ...filters,
      startDate: today,
      endDate: endByHorizon[horizon] || futureEndDate,
      status: "aberto",
    };

    setFutureHorizon(horizon);
    setFilters(nextFilters);
    loadFinancialAnalysis(financialType, nextFilters);
  }

  const isReceivable = financialType === "receivable";
  const isPayable = financialType === "payable";
  const isFuturePayable = financialType === "futurePayable";
  const isFutureReceivable = financialType === "futureReceivable";
  const partyLabel = isReceivable ? "Cliente" : "Fornecedor";

  return (
    <main className="content quote-content client-analysis-screen financial-analysis-screen">
      <FinancialPageHeader center={filters.costCenter} type={financialType} />
      <FinancialTabs value={financialType} onChange={changeFinancialType} />

      {error ? <div className="feedback-card feedback-card--error">{error}</div> : null}

      <FinancialFilters
        filters={filters}
        loading={loading}
        onChange={updateFilter}
        onSubmit={applyFilters}
        lockStatus={isFuturePayable || isFutureReceivable}
        classificationOptions={data.classificationOptions}
        showCustomer={isReceivable || isFutureReceivable}
      />
      {isFutureReceivable ? (
        <FutureReceivablesDashboard data={data} payableData={cashFlowData} horizon={futureHorizon} onHorizonChange={changeFutureHorizon} />
      ) : isFuturePayable ? (
        <FutureExpensesDashboard data={data} horizon={futureHorizon} onHorizonChange={changeFutureHorizon} />
      ) : (
        <FinancialKpiGrid summary={data.summary} type={financialType} />
      )}

      {isReceivable ? <ReceivablesDashboard data={data} /> : null}

      {isFuturePayable || isFutureReceivable ? null : isPayable ? (
        <>
          <div className="payments-chart-grid">
            <MonthlyPaymentsChart monthly={data.monthly} />
            <FinancialClassificationDonut classifications={data.classifications} />
          </div>
          <div className="payments-chart-grid payments-chart-grid--compact">
            <PaymentsByCostCenterChart
              centers={data.centers}
              title="Top centros de custo"
              subtitle="Centros com maior valor em aberto no período."
            />
            <TopOverdueList centers={data.centers} />
          </div>
          <PaymentHealthCard summary={data.summary} />
        </>
      ) : !isReceivable ? (
        <>
          <div className="payments-chart-grid">
            <MonthlyPaymentsChart
              monthly={data.monthly}
              title={isFuturePayable ? "Despesas futuras por mês" : "Pagamentos por mês"}
              subtitle={isFuturePayable ? "Previsão mensal dos compromissos em aberto." : "Comparativo mensal entre total, pago, aberto e vencido."}
              series={isFuturePayable ? [{ key: "valorAberto", label: "Em aberto", className: "open" }] : undefined}
            />
            <PaymentsByCostCenterChart
              centers={data.centers}
              title={isFuturePayable ? "Despesas futuras por centro" : "Pagamentos por centro de custo"}
              subtitle={isFuturePayable ? "Top 10 centros por valor em aberto." : "Top 10 centros por valor em aberto."}
            />
          </div>
          <div className="payments-chart-grid payments-chart-grid--classification">
            <FinancialClassificationChart classifications={data.classifications} />
            <TopOverdueList centers={data.centers} />
          </div>
        </>
      ) : null}

      {!isReceivable && !isPayable && !isFuturePayable && !isFutureReceivable ? (
        <div className="financial-analysis-grid">
          <CostCenterRanking centers={data.centers} />
          {!isReceivable ? (
            <FinancialClassificationRanking classifications={data.classifications} />
          ) : (
            <TopOverdueList centers={data.centers} />
          )}
        </div>
      ) : null}

      {!isFuturePayable && !isFutureReceivable ? <FinancialEntriesTable rows={data.rows} partyLabel={partyLabel} collapsedByDefault={isPayable || isReceivable} /> : null}
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
  const maxClientRevenue = Math.max(...data.ranking.map((client) => Number(client.faturamentoTotal ?? 0)), 1);
  const maxMonthlyCtes = Math.max(...data.monthly.map((month) => Number(month.quantidadeCtes ?? 0)), 1);
  const topClients = data.ranking.slice(0, 8);
  const topClientsTotal = topClients.reduce((sum, client) => sum + Number(client.faturamentoTotal ?? 0), 0);
  const clientColors = ["#1f6f54", "#2e78b4", "#f28c2b", "#61738e", "#8aa4bd", "#b83a3a", "#6f8f54", "#465b78"];
  let clientOffset = 0;
  const clientDonutStops = topClients.map((client, index) => {
    const start = clientOffset;
    const size = topClientsTotal > 0 ? (Number(client.faturamentoTotal ?? 0) / topClientsTotal) * 100 : 0;
    clientOffset += size;
    return `${clientColors[index % clientColors.length]} ${start}% ${clientOffset}%`;
  });

  return (
    <>
      <section className="quote-hero client-revenue-hero">
        <div>
          <span className="hero__eyebrow">Faturamento</span>
          <h2>Análise de clientes</h2>
          <p>
            Veja quanto cada cliente fatura, quantos CT-es gera e a concentração da carteira no período.
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
        <div className="stat-card stat-card--success">
          <span className="stat-card__title">Quantidade de CT-es</span>
          <strong className="stat-card__value">{formatNumber(data.summary.quantidadeCtes)}</strong>
          <span className="stat-card__helper">Documentos emitidos no filtro</span>
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

      <div className="client-revenue-dashboard-grid">
        <section className="section-card client-revenue-bars-card">
          <header className="section-card__header">
            <div>
              <h2>Top clientes por faturamento</h2>
              <p>Valor faturado e quantidade de CT-es por cliente.</p>
            </div>
          </header>
          <div className="client-revenue-bars">
            {topClients.map((client) => (
              <article key={`${client.empresa}-${client.codigo}`}>
                <div>
                  <strong>{client.fantasia || client.nome}</strong>
                  <span>{formatNumber(client.quantidadeCtes)} CT-es</span>
                </div>
                <div className="client-revenue-bars__track">
                  <i style={{ width: `${Math.min((Number(client.faturamentoTotal ?? 0) / maxClientRevenue) * 100, 100)}%` }} />
                </div>
                <strong>{formatCurrency(client.faturamentoTotal)}</strong>
              </article>
            ))}
            {!topClients.length ? <div className="empty-state">Nenhum cliente encontrado no período.</div> : null}
          </div>
        </section>

        <section className="section-card client-revenue-donut-card">
          <header className="section-card__header">
            <div>
              <h2>Concentração da carteira</h2>
              <p>Participação dos principais clientes no faturamento.</p>
            </div>
          </header>
          <div className="payment-donut-layout">
            <div
              className="payment-donut"
              style={{ background: topClientsTotal > 0 ? `conic-gradient(${clientDonutStops.join(", ")})` : "#edf3f8" }}
            >
              <div>
                <strong>{formatCurrency(topClientsTotal)}</strong>
                <span>top clientes</span>
              </div>
            </div>
            <div className="payment-donut-legend">
              {topClients.slice(0, 6).map((client, index) => (
                <article key={`${client.empresa}-${client.codigo}`}>
                  <i style={{ background: clientColors[index % clientColors.length] }} />
                  <div>
                    <strong>{client.fantasia || client.nome}</strong>
                    <span>{formatNumber(client.representatividadePercentual)}% - {formatCurrency(client.faturamentoTotal)}</span>
                  </div>
                </article>
              ))}
              {!topClients.length ? <div className="empty-state">Sem faturamento para compor a carteira.</div> : null}
            </div>
          </div>
        </section>
      </div>

      <section className="section-card client-revenue-monthly-card">
        <header className="section-card__header">
          <div>
            <h2>Evolução mensal por faturamento e CT-es</h2>
            <p>Compare valor faturado e volume operacional mês a mês.</p>
          </div>
        </header>
        <div className="client-revenue-monthly-chart">
          {data.monthly.map((month) => (
            <article key={month.referencia}>
              <div className="client-revenue-monthly-chart__bars">
                <i className="is-revenue" style={{ height: `${Math.max((Number(month.faturamentoTotal ?? 0) / maxMonthlyValue) * 100, 2)}%` }} />
                <i className="is-ctes" style={{ height: `${Math.max((Number(month.quantidadeCtes ?? 0) / maxMonthlyCtes) * 100, 2)}%` }} />
              </div>
              <strong>{month.referencia}</strong>
              <span>{formatCurrency(month.faturamentoTotal)}</span>
              <small>{formatNumber(month.quantidadeCtes)} CT-es</small>
            </article>
          ))}
          {!data.monthly.length ? <div className="empty-state">Sem evolução mensal para mostrar.</div> : null}
        </div>
        <div className="chart-legend payments-chart-legend">
          <span><i className="legend-dot legend-dot--paid" />Faturamento</span>
          <span><i className="legend-dot legend-dot--info" />CT-es</span>
        </div>
      </section>

      <div className="executive-dashboard-grid executive-dashboard-grid--bottom">
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
  const [thirdPartyView, setThirdPartyView] = useState("dashboard");
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
  const thirdPartyChartWidth = 720;
  const thirdPartyChartHeight = 260;
  const thirdPartyChartPadding = 28;
  const thirdPartyMaxFinancialMonth = Math.max(
    ...data.monthly.map((month) => Number(month.faturamento ?? 0)),
    ...data.monthly.map((month) => Number(month.lucro ?? 0)),
    ...data.monthly.map((month) => Number(month.custoTerceiro ?? 0) + Number(month.despesasAcessorias ?? 0)),
    1,
  );
  const getThirdPartyMonthlyCoordinates = (month, index, key) => {
    const availableWidth = thirdPartyChartWidth - thirdPartyChartPadding * 2;
    const availableHeight = thirdPartyChartHeight - thirdPartyChartPadding * 2;
    const value = key === "custoTotal"
      ? Number(month.custoTerceiro ?? 0) + Number(month.despesasAcessorias ?? 0)
      : Number(month[key] ?? 0);
    const x = thirdPartyChartPadding + (data.monthly.length > 1 ? (index / (data.monthly.length - 1)) * availableWidth : availableWidth / 2);
    const y = thirdPartyChartHeight - thirdPartyChartPadding - (value / thirdPartyMaxFinancialMonth) * availableHeight;
    return { x, y };
  };
  const getThirdPartyMonthlyPolyline = (key) => data.monthly.map((month, index) => {
    const point = getThirdPartyMonthlyCoordinates(month, index, key);
    return `${point.x},${point.y}`;
  }).join(" ");
  const pendingThirdParty = data.latest.filter((item) => Number(item.valorPendente ?? 0) > 0);
  const biggestPendingThirdParty = pendingThirdParty.reduce(
    (biggest, item) =>
      Number(item.valorPendente ?? 0) > Number(biggest?.valorPendente ?? 0) ? item : biggest,
    null,
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

      <section className="billing-tabs billing-tabs--sub">
        <button
          type="button"
          className={thirdPartyView === "dashboard" ? "is-active" : ""}
          onClick={() => setThirdPartyView("dashboard")}
        >
          Dashboard gerencial
        </button>
        <button
          type="button"
          className={thirdPartyView === "receivables" ? "is-active" : ""}
          onClick={() => setThirdPartyView("receivables")}
        >
          Pendências
        </button>
        <button
          type="button"
          className={thirdPartyView === "trips" ? "is-active" : ""}
          onClick={() => setThirdPartyView("trips")}
        >
          Controle de viagens
        </button>
      </section>

      {thirdPartyView === "dashboard" ? (
      <>
      <section className="client-kpi-grid third-party-kpi-grid">
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
        <IndicatorCard
          title="Cartas frete"
          value={formatNumber(data.summary.totalCartas)}
          helper={`${formatNumber(data.summary.quantidadeCtes)} CT-es vinculados`}
          info={{
            description: "Quantidade de cartas frete de terceiros no período filtrado.",
            items: [
              "Conta as cartas frete retornadas pela análise.",
              "CT-es vinculados ajudam a conferir o volume faturado.",
            ],
          }}
        />
        <IndicatorCard
          title="Pendente"
          value={formatCurrency(data.summary.valorPendente)}
          helper={`${formatNumber(pendingThirdParty.length)} cartas com saldo`}
          tone={data.summary.valorPendente > 0 ? "danger" : "success"}
          info={{
            description: "Saldo estimado ainda em aberto para pagamento ao terceiro.",
            items: [
              "Considera custo do terceiro e despesas acessórias menos o valor pago.",
              "A contagem usa as cartas recentes com saldo pendente.",
            ],
          }}
        />
        <IndicatorCard
          title="Ticket médio"
          value={formatCurrency(data.summary.totalCartas ? data.summary.faturamento / data.summary.totalCartas : 0)}
          helper="Faturamento médio por carta"
          info={{
            description: "Média de faturamento dos CT-es por carta frete.",
            items: [
              "Divide o faturamento total pela quantidade de cartas no filtro.",
            ],
          }}
        />
        <IndicatorCard
          title="Peso transportado"
          value={`${formatNumber(data.summary.peso)} kg`}
          helper={`${formatNumber(data.summary.totalVeiculos)} veículos | ${formatNumber(data.summary.totalMotoristas)} motoristas`}
          info={{
            description: "Volume operacional vinculado às cartas frete de terceiros.",
            items: [
              "Mostra o peso total das cartas e a cobertura de veículos/motoristas.",
            ],
          }}
        />
      </section>

      <div className="client-analysis-layout">
        <section className="section-card">
          <header className="section-card__header">
            <div>
              <h2>Top veículos mais lucrativos</h2>
              <p>Ranking visual pelo lucro das cartas frete.</p>
            </div>
          </header>
          <div className="ranking-bars">
            {data.ranking.slice(0, 8).map((item) => (
              <div className="ranking-bars__item" key={`${item.posicao}-${item.veiculo}-${item.motorista}`}>
                <div>
                  <strong>{item.veiculo || "-"}</strong>
                  <span>{formatNumber(item.totalCartas)} cartas | Margem {formatNumber((Number(item.lucro ?? 0) / Math.max(Number(item.faturamento ?? 0), 1)) * 100)}%</span>
                </div>
                <i style={{ width: `${(Number(item.lucro ?? 0) / Math.max(Number(data.ranking[0]?.lucro ?? 0), 1)) * 100}%` }} />
                <strong>{formatCurrency(item.lucro)}</strong>
              </div>
            ))}
            {!data.ranking.length ? <div className="empty-state">Nenhum veículo encontrado para o filtro.</div> : null}
          </div>
        </section>
      </div>

      <section className="section-card executive-chart-card">
        <header className="section-card__header">
          <div>
            <h2>Evolução financeira mensal</h2>
            <p>Faturamento, lucro e custo total das cartas frete.</p>
          </div>
        </header>
        <div className="financial-evolution">
          {data.monthly.length ? (
            <svg className="financial-line-chart" viewBox={`0 0 ${thirdPartyChartWidth} ${thirdPartyChartHeight}`} role="img" aria-label="Evolução financeira mensal de terceiros">
              <polyline points={getThirdPartyMonthlyPolyline("faturamento")} className="line-chart__line line-chart__line--revenue" />
              <polyline points={getThirdPartyMonthlyPolyline("lucro")} className="line-chart__line line-chart__line--profit" />
              <polyline points={getThirdPartyMonthlyPolyline("custoTotal")} className="line-chart__line line-chart__line--cost" />
              {data.monthly.map((month, index) => (
                <g key={month.referencia}>
                  <text x={thirdPartyChartPadding + (data.monthly.length > 1 ? (index / (data.monthly.length - 1)) * (thirdPartyChartWidth - thirdPartyChartPadding * 2) : (thirdPartyChartWidth - thirdPartyChartPadding * 2) / 2)} y={thirdPartyChartHeight - 6}>
                    {month.referencia.slice(5)}
                  </text>
                  {[
                    ["faturamento", "revenue", "Faturamento", month.faturamento],
                    ["lucro", "profit", "Lucro", month.lucro],
                    ["custoTotal", "cost", "Custo", Number(month.custoTerceiro ?? 0) + Number(month.despesasAcessorias ?? 0)],
                  ].map(([key, tone, label, value]) => {
                    const point = getThirdPartyMonthlyCoordinates(month, index, key);
                    return (
                      <circle key={key} cx={point.x} cy={point.y} r="5" className={`line-chart__dot line-chart__dot--${tone}`}>
                        <title>{month.referencia} - {label}: {formatCurrency(value)}</title>
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
              <span>Fat. {formatCurrency(month.faturamento)}</span>
              <span>Lucro {formatCurrency(month.lucro)}</span>
              <span>Custo {formatCurrency(Number(month.custoTerceiro ?? 0) + Number(month.despesasAcessorias ?? 0))}</span>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <span><i className="legend-dot legend-dot--info" /> Faturamento</span>
          <span><i className="legend-dot legend-dot--success" /> Lucro</span>
          <span><i className="legend-dot legend-dot--danger" /> Custo</span>
        </div>
        <div className="registry-pagination">
          <span>
            {summary.total
              ? `${firstVisibleRecord}-${lastVisibleRecord} de ${formatNumber(summary.total)} registros`
              : "Nenhum registro"}
          </span>
          <div>
            <button type="button" className="secondary-button" onClick={() => changeRegistryPage(page - 1)} disabled={page <= 1}>
              Anterior
            </button>
            <strong>Página {page} de {totalPages}</strong>
            <button type="button" className="secondary-button" onClick={() => changeRegistryPage(page + 1)} disabled={page >= totalPages}>
              Próxima
            </button>
          </div>
        </div>
      </section>
      </>
      ) : thirdPartyView === "receivables" ? (
      <section className="section-card receivables-workbench">
        <header className="section-card__header">
          <div>
            <h2>Central de pendências de terceiros</h2>
            <p>Cartas frete com saldo pendente para acompanhar pagamento ao terceiro.</p>
          </div>
        </header>
        <div className="receivables-summary">
          <button type="button">
            <span>Total pendente</span>
            <strong>{formatCurrency(data.summary.valorPendente)}</strong>
          </button>
          <button type="button">
            <span>Cartas pendentes</span>
            <strong>{formatNumber(pendingThirdParty.length)}</strong>
          </button>
          <button type="button">
            <span>Maior pendência</span>
            <strong>{biggestPendingThirdParty ? formatCurrency(biggestPendingThirdParty.valorPendente) : "-"}</strong>
          </button>
          <button type="button">
            <span>Pago no período</span>
            <strong>{formatCurrency(data.summary.valorPago)}</strong>
          </button>
        </div>
        <div className="table-wrapper">
          <table className="client-ranking-table trip-latest-table receivables-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Carta</th>
                <th>Veículo</th>
                <th>Motorista</th>
                <th>Rota</th>
                <th>Custo</th>
                <th>Pago terceiro</th>
                <th>Pendente</th>
                <th>CT-es</th>
              </tr>
            </thead>
            <tbody>
              {pendingThirdParty.map((item) => (
                <tr key={`${item.empresa}-${item.serie}-${item.codigo}`}>
                  <td>{formatDate(item.data)}</td>
                  <td>{item.serie}/{item.codigo}</td>
                  <td>{item.veiculo || "-"}</td>
                  <td>{item.motorista || "-"}</td>
                  <td>{item.rotas || "-"}</td>
                  <td>{formatCurrency(item.custoTerceiro)}</td>
                  <td>{formatCurrency(item.valorPago)}</td>
                  <td>{formatCurrency(item.valorPendente)}</td>
                  <td>
                    <strong>{formatNumber(item.quantidadeCtes)}</strong>
                    <span>{item.conhecimentos || "-"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pendingThirdParty.length ? <div className="empty-state">Nenhuma pendência de terceiro encontrada.</div> : null}
        </div>
      </section>
      ) : (
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
      )}
    </>
  );
}

function CitySuggestField({ label, city, uf, onChange, options, placeholder }) {
  return (
    <SuggestField
      label={label}
      value={formatCityUfValue(city, uf)}
      options={options}
      placeholder={placeholder}
      className="quote-field--wide"
      getOptionLabel={formatCityUfOption}
      onSearch={(search) => searchRegistryOptions("cities", search)}
      onChange={onChange}
    />
  );
}

function VehicleSuggestField({ value, onChange, options }) {
  return (
    <SuggestField
      label="Placa do veículo"
      value={value}
      options={options}
      placeholder="MQV-4C62"
      getOptionLabel={getVehicleOptionLabel}
      onSearch={(search) => searchRegistryOptions("vehicles", search)}
      onChange={onChange}
    />
  );
}

function DriverSuggestField({ value, onChange, options }) {
  return (
    <SuggestField
      label="Motorista"
      value={value}
      options={options}
      placeholder="Nome do motorista"
      getOptionLabel={getDriverOptionLabel}
      onSearch={(search) => searchRegistryOptions("drivers", search)}
      onChange={onChange}
    />
  );
}

function CustomerSuggestField({ label, value, onChange, options }) {
  return (
    <SuggestField
      label={label}
      value={value}
      options={options}
      placeholder="Digite o nome do cliente"
      onSearch={(search) => searchRegistryOptions("customers", search)}
      onChange={onChange}
    />
  );
}

function SellerSuggestField({ value, onChange, options }) {
  return (
    <SuggestField
      label="Vendedor"
      value={value}
      options={options}
      placeholder="Digite o vendedor"
      getOptionLabel={getSellerOptionLabel}
      onSearch={(search) => searchRegistryOptions("sellers", search)}
      onChange={(option) => onChange(typeof option === "string" ? option : option?.name ?? "")}
    />
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
    sellers: [],
    vehicles: [],
    drivers: [],
  });
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
  const [page, setPage] = useState(1);
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
      loadQuotes(search, sortConfig, filters, 1);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search, filters]);

  function buildRegistryParams(query = search, sort = sortConfig, currentFilters = filters, currentPage = page) {
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
    params.set("page", currentPage);
    params.set("pageSize", REGISTRY_PAGE_SIZE);
    return params;
  }

  async function loadRegistryOptions() {
    try {
      const response = await fetch(`${API_URL}/quote-registry/options`);
      if (response.ok) {
        setOptions(await response.json());
      }
    } catch {
      setOptions({ customers: [], origins: [], destinations: [], sellers: [], vehicles: [], drivers: [] });
    }
  }

  async function loadQuotes(query = search, sort = sortConfig, currentFilters = filters, currentPage = page) {
    setError("");
    try {
      const params = buildRegistryParams(query, sort, currentFilters, currentPage);

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
    setPage(1);
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
      (option) => normalizeSearchText(formatCityUfOption(option)) === normalizeSearchText(value),
    );

    if (!match && !String(value ?? "").includes("/") && !String(value ?? "").match(/\s+-\s+[a-zA-Z]{0,2}$/)) {
      setForm((current) => ({
        ...current,
        [cityField]: value,
        [ufField]: "",
      }));
      return;
    }

    const parsed = splitCityUf(match ?? value);

    setForm((current) => ({
      ...current,
      [cityField]: parsed.city,
      [ufField]: parsed.uf,
    }));
  }

  function updateRouteField(index, field, value) {
    setForm((current) => ({
      ...current,
      routes: (current.routes ?? []).map((route, routeIndex) =>
        routeIndex === index ? { ...route, [field]: value } : route,
      ),
    }));
  }

  function updateRouteCity(index, value) {
    const match = [...options.origins, ...options.destinations].find(
      (option) => normalizeSearchText(formatCityUfOption(option)) === normalizeSearchText(value),
    );
    const parsed = splitCityUf(match ?? value);

    setForm((current) => ({
      ...current,
      routes: (current.routes ?? []).map((route, routeIndex) =>
        routeIndex === index
          ? {
              ...route,
              city: parsed.city,
              uf: parsed.uf,
            }
          : route,
      ),
    }));
  }

  function addRouteStop() {
    setForm((current) => ({
      ...current,
      routes: [
        ...(current.routes ?? []),
        {
          sequence: (current.routes?.length ?? 0) + 1,
          type: "entrega",
          city: "",
          uf: "",
          customer: "",
          address: "",
          invoiceNumber: "",
          notes: "",
        },
      ],
    }));
  }

  function removeRouteStop(index) {
    setForm((current) => ({
      ...current,
      routes: (current.routes ?? [])
        .filter((_, routeIndex) => routeIndex !== index)
        .map((route, routeIndex) => ({ ...route, sequence: routeIndex + 1 })),
    }));
  }

  function applyRegistryValues(values) {
    setForm((current) => {
      const next = {
        ...current,
        ...values,
      };

      for (const [field, documentKey] of Object.entries(automaticDocumentFields)) {
        if (field in values) {
          next.documents = {
            ...next.documents,
            [documentKey]: String(values[field] ?? "").trim() !== "",
          };
        }
      }

      return next;
    });
  }

  function updateVehicleField(value) {
    if (typeof value === "string") {
      const plate = formatPlate(value);
      const match = options.vehicles.find(
        (vehicle) => normalizeSearchText(formatPlate(vehicle.plate)) === normalizeSearchText(plate),
      );

      if (match) {
        updateVehicleField(match);
        return;
      }

      applyRegistryValues({ vehiclePlate: plate });
      return;
    }

    const nextValues = {
      vehiclePlate: formatPlate(value?.plate ?? ""),
    };

    if (value?.driverName) {
      nextValues.driver = value.driverName;
    }

    if (value?.driverPhone) {
      nextValues.driverPhone = formatPhone(value.driverPhone);
    }

    if (value?.driverLicenseNumber) {
      nextValues.driverLicenseNumber = onlyDigits(value.driverLicenseNumber, 11);
    }

    if (value?.depositAccount) {
      nextValues.depositAccount = value.depositAccount;
    }

    if (value?.pixKey) {
      nextValues.pixKey = value.pixKey;
    }

    applyRegistryValues(nextValues);
  }

  function updateDriverField(value) {
    if (typeof value === "string") {
      const match = options.drivers.find(
        (driver) => normalizeSearchText(driver.name) === normalizeSearchText(value),
      );

      if (match) {
        updateDriverField(match);
        return;
      }

      applyRegistryValues({ driver: value });
      return;
    }

    applyRegistryValues({
      driver: value?.name ?? "",
      driverPhone: value?.driverPhone ? formatPhone(value.driverPhone) : form.driverPhone,
      driverLicenseNumber: value?.driverLicenseNumber ? onlyDigits(value.driverLicenseNumber, 11) : form.driverLicenseNumber,
      depositAccount: value?.depositAccount || form.depositAccount,
      pixKey: value?.pixKey || form.pixKey,
    });
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
      routes: quote.routes ?? [],
      customer: quote.customer ?? "",
      finalCustomer: quote.finalCustomer ?? "",
      customerValue: formatMoneyInput(quote.customerValue),
      tripKm: quote.tripKm ?? "",
      material: quote.material ?? "",
      weightKg: formatWeightInput(quote.weightKg),
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
      routes: quote.routes ?? [],
      customer: quote.customer ?? "",
      finalCustomer: quote.finalCustomer ?? "",
      customerValue: formatMoneyInput(quote.customerValue),
      tripKm: quote.tripKm ?? "",
      material: quote.material ?? "",
      weightKg: formatWeightInput(quote.weightKg),
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
    setPage(1);
    loadQuotes(search, nextSort, filters, 1);
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
    setPage(1);
    loadQuotes(search, sortConfig, nextFilters, 1);
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
      await loadQuotes(search, sortConfig, filters, page);
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

      await loadQuotes(search, sortConfig, filters, page);
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
  const printableQuote = formOpen
    ? {
        ...(selectedQuote ?? {}),
        ...form,
        id: editingId ?? selectedQuote?.id ?? "",
        customerValue: numericCustomerValue,
        driverValue: numericDriverValue,
        weightKg: numericWeightKg,
        pricePerKg,
        pricePerTon,
      }
    : selectedQuote;
  const printableProfit = printableQuote
    ? Number(printableQuote.customerValue ?? 0) - Number(printableQuote.driverValue ?? 0)
    : 0;
  const totalPages = Math.max(1, Math.ceil(summary.total / REGISTRY_PAGE_SIZE));
  const firstVisibleRecord = summary.total ? (page - 1) * REGISTRY_PAGE_SIZE + 1 : 0;
  const lastVisibleRecord = Math.min(summary.total, page * REGISTRY_PAGE_SIZE);

  function changeRegistryPage(nextPage) {
    const safePage = Math.min(totalPages, Math.max(1, nextPage));
    setPage(safePage);
    loadQuotes(search, sortConfig, filters, safePage);
  }

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
            <button type="button" onClick={() => printableQuote && window.print()} disabled={!printableQuote}>
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
            onSearch={(search) => searchRegistryOptions("customers", search)}
            onChange={(value) => updateFilter("customer", value)}
          />
          <SuggestField
            label="Origem"
            value={filters.origin}
            options={options.origins}
            placeholder="Cidade/UF de origem"
            getOptionLabel={formatCityUfOption}
            onSearch={(search) => searchRegistryOptions("cities", search)}
            onChange={(value) => updateFilter("origin", value)}
          />
          <SuggestField
            label="Destino"
            value={filters.destination}
            options={options.destinations}
            placeholder="Cidade/UF de destino"
            getOptionLabel={formatCityUfOption}
            onSearch={(search) => searchRegistryOptions("cities", search)}
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
        <div
          className="registry-detail-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="registry-detail-title"
          onClick={resetForm}
        >
          <section className="quote-panel registry-detail-page" onClick={(event) => event.stopPropagation()}>
          <header className="quote-panel__header registry-detail-header">
            <div>
              <button type="button" className="registry-back-button" onClick={resetForm}>
                Fechar e voltar para lista
              </button>
              <h3 id="registry-detail-title">{editingId ? `Detalhes da cotação ${editingId}` : "Nova cotação"}</h3>
              <span className="panel-caption">
                Dados separados por área para consultar, editar e imprimir sem ocupar a lista.
              </span>
            </div>
            <div className="registry-actions">
              <button type="button" className="secondary-button" onClick={() => selectedQuote && replicateQuote(selectedQuote)} disabled={!selectedQuote}>
                Replicar
              </button>
              <button type="button" className="secondary-button" onClick={() => printableQuote && window.print()} disabled={!printableQuote}>
                Imprimir
              </button>
              <button type="submit" form="registry-detail-form" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </header>

          <div className="registry-detail-tabs">
            {registryDetailTabs.map(([tab, icon, label]) => (
              <button
                key={tab}
                type="button"
                className={activeDetailTab === tab ? "is-active" : ""}
                onClick={() => setActiveDetailTab(tab)}
              >
                <span aria-hidden="true">{icon}</span>
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
                  <ReadOnlyStatusField label="Situação" value={form.status} />
                  <Field label="Data" type="date" value={form.date} onChange={(value) => updateRegistryField("date", value)} />
                  <Field label="KM da viagem" value={form.tripKm} onChange={(value) => updateRegistryField("tripKm", value)} suffix="km" />
                  <MoneyField label="Valor da viagem" value={form.customerValue} onChange={(value) => updateRegistryField("customerValue", value)} />
                  <MoneyField label="Valor pago ao motorista" value={form.driverValue} onChange={(value) => updateRegistryField("driverValue", value)} />
                </FormBlock>
                <div className="registry-preview">
                  <ResultLine label="R$/kg" value={formatCurrency(pricePerKg)} />
                  <ResultLine label="R$/ton" value={formatCurrency(pricePerTon)} />
                </div>
              </>
            ) : null}

            {activeDetailTab === "rota" ? (
              <>
                <FormBlock title="Rota principal">
                  <CitySuggestField
                    label="Origem"
                    city={form.originCity}
                    uf={form.originUf}
                    onChange={(value) => updateCityField("originCity", "originUf", value)}
                    options={options.origins}
                    placeholder="Morro da Fumaça - SC"
                  />
                  <CitySuggestField
                    label="Destino final"
                    city={form.destinationCity}
                    uf={form.destinationUf}
                    onChange={(value) => updateCityField("destinationCity", "destinationUf", value)}
                    options={options.destinations}
                    placeholder="Feira de Santana - BA"
                  />
                  <VehicleSuggestField value={form.vehiclePlate} onChange={updateVehicleField} options={options.vehicles} />
                  <DriverSuggestField value={form.driver} onChange={updateDriverField} options={options.drivers} />
                </FormBlock>

                <section className="form-block route-stops">
                  <header className="route-stops__header">
                    <div>
                      <h4>Entregas da viagem</h4>
                      <span>Inclua uma parada para cada entrega desta cotação.</span>
                    </div>
                    <button type="button" className="secondary-button" onClick={addRouteStop}>
                      Adicionar entrega
                    </button>
                  </header>

                  {(form.routes ?? []).map((route, index) => (
                    <div className="route-stop" key={`${index}-${route.id ?? "nova"}`}>
                      <strong>{index + 1}</strong>
                      <CitySuggestField
                        label="Cidade da entrega"
                        city={route.city}
                        uf={route.uf}
                        onChange={(value) => updateRouteCity(index, value)}
                        options={options.destinations}
                        placeholder="Feira de Santana - BA"
                      />
                      <CustomerSuggestField
                        label="Cliente/local"
                        value={route.customer ?? ""}
                        onChange={(value) => updateRouteField(index, "customer", value)}
                        options={options.customers}
                      />
                      <Field
                        label="Número da nota fiscal"
                        type="text"
                        value={route.invoiceNumber ?? route.address ?? ""}
                        onChange={(value) => updateRouteField(index, "invoiceNumber", value)}
                      />
                      <Field
                        label="Observação da entrega"
                        type="text"
                        value={route.notes ?? ""}
                        onChange={(value) => updateRouteField(index, "notes", value)}
                      />
                      <button type="button" className="route-stop__remove" onClick={() => removeRouteStop(index)}>
                        Remover
                      </button>
                    </div>
                  ))}

                  {!(form.routes ?? []).length ? (
                    <div className="empty-state">Nenhuma entrega adicionada. Use quando a viagem tiver mais de uma parada.</div>
                  ) : null}
                </section>
              </>
            ) : null}

            {activeDetailTab === "cliente" ? (
              <>
                <FormBlock title="Cliente e material">
                  <CustomerSuggestField label="Cliente" value={form.customer} onChange={(value) => updateRegistryField("customer", value)} options={options.customers} />
                  <CustomerSuggestField label="Cliente final" value={form.finalCustomer} onChange={(value) => updateRegistryField("finalCustomer", value)} options={options.customers} />
                  <Field label="Material" type="text" value={form.material} onChange={(value) => updateRegistryField("material", value)} />
                  <Field label="Peso" value={form.weightKg} onChange={(value) => updateRegistryField("weightKg", value)} suffix="kg" />
                  <SellerSuggestField value={form.seller} onChange={(value) => updateRegistryField("seller", value)} options={options.sellers} />
                  <CustomerSuggestField label="Tomador do serviço" value={form.serviceTaker} onChange={(value) => updateRegistryField("serviceTaker", value)} options={options.customers} />
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
                    <button type="button" className="secondary-button" onClick={() => printableQuote && window.print()} disabled={!printableQuote}>Imprimir ficha</button>
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
                    <ResultLine label="Entregas" value={(selectedQuote.routes?.length ?? 0) || "-"} />
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
        </div>
      ) : null}

      {printableQuote ? (
        <div className="registry-print-only">
          <div className="print-card print-card--romaneio">
            <header className="print-romaneio-header">
              <img src="/rodobach-logo.png" alt="Rodobach" />
              <div className="print-route-title">
                <span>Romaneio de viagem</span>
                <strong>{printableQuote.originCity}/{printableQuote.originUf} {"->"} {printableQuote.destinationCity}/{printableQuote.destinationUf}</strong>
              </div>
              <div className="print-trip-badge">
                <span>Viagem</span>
                <strong>{printableQuote.tripNumber || printableQuote.id || "-"}</strong>
              </div>
            </header>

            <div className="selected-kpis print-main-kpis">
              <div>
                <span>Valor da viagem</span>
                <strong>{formatCurrency(printableQuote.customerValue)}</strong>
              </div>
              <div className={printableProfit >= 0 ? "is-positive" : "is-negative"}>
                <span>Lucro previsto</span>
                <strong>{formatCurrency(printableProfit)}</strong>
              </div>
              <div>
                <span>Pedágio</span>
                <strong>{printableQuote.tollValue === undefined || printableQuote.tollValue === "" ? "-" : formatCurrency(printableQuote.tollValue)}</strong>
              </div>
              <div>
                <span>KM da viagem</span>
                <strong>{printableQuote.tripKm ? `${formatNumber(printableQuote.tripKm)} km` : "-"}</strong>
              </div>
            </div>

            <div className="print-warning">
              <strong>TODA DOCUMENTAÇÃO DEVE SER LEGÍVEL</strong>
              <span>Conferir antes de encaminhar para faturamento</span>
            </div>

            <section className="print-section print-section--trip">
              <strong>Dados da viagem</strong>
              <div className="print-section__grid">
                <ResultLine label="N viagem" value={printableQuote.tripNumber || "-"} />
                <ResultLine label="Situação" value={getStatusLabel(printableQuote.status)} />
                <ResultLine label="Cliente" value={printableQuote.customer || "-"} />
                <ResultLine label="Cliente final" value={printableQuote.finalCustomer || "-"} />
                <ResultLine label="Tomador do serviço" value={printableQuote.serviceTaker || printableQuote.customer || "-"} />
                <ResultLine label="Entregas" value={(printableQuote.routes?.length ?? 0) || "-"} />
                <ResultLine label="Material" value={printableQuote.material || "-"} />
                <ResultLine label="Peso" value={`${formatNumber(printableQuote.weightKg)} kg`} />
                <ResultLine label="Valor cliente" value={formatCurrency(printableQuote.customerValue)} />
                <ResultLine label="R$/kg" value={formatCurrency(printableQuote.pricePerKg)} />
                <ResultLine label="R$/ton" value={formatCurrency(printableQuote.pricePerTon)} />
                <ResultLine label="KM da viagem" value={printableQuote.tripKm ? `${formatNumber(printableQuote.tripKm)} km` : "-"} />
              </div>
            </section>

            <section className="print-section print-section--driver">
              <strong>Motorista e pagamento</strong>
              <div className="print-section__grid">
                <ResultLine label="Motorista" value={printableQuote.driver || "-"} />
                <ResultLine label="Placa do veículo" value={printableQuote.vehiclePlate ? formatPlate(printableQuote.vehiclePlate) : "-"} />
                <ResultLine label="Valor motorista" value={formatCurrency(printableQuote.driverValue)} />
                <ResultLine label="Lucro previsto" value={formatCurrency(printableProfit)} tone={getProfitTone(printableProfit)} />
                <ResultLine label="Condição de pagamento" value={getPaymentConditionLabel(printableQuote.paymentCondition)} />
                <ResultLine label="Número do motorista" value={printableQuote.driverPhone ? formatPhone(printableQuote.driverPhone) : "-"} />
                <ResultLine label="CNH do motorista" value={printableQuote.driverLicenseNumber || "-"} />
                <ResultLine label="ANTT do veículo" value={printableQuote.vehicleAntt || "-"} />
                <ResultLine label="Conta depósito" value={printableQuote.depositAccount || "-"} />
                <ResultLine label="Chave PIX" value={printableQuote.pixKey || "-"} />
              </div>
            </section>

            {printableQuote.routes?.length ? (
              <section className="print-section print-section--routes">
                <strong>Entregas da rota</strong>
                <div className="print-route-stops">
                  {printableQuote.routes.map((route, index) => (
                    <span key={`${index}-${route.city}-${route.uf}`}>
                      <strong>{index + 1}</strong>
                      <em>{route.city || "-"}{route.uf ? `/${route.uf}` : ""}</em>
                      <small>{route.customer || "-"}</small>
                      <small>{route.invoiceNumber ? `NF ${route.invoiceNumber}` : "NF -"}</small>
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {printableQuote.notes && !printableQuote.notes.startsWith("Importado da planilha") ? (
              <p className="print-notes">{printableQuote.notes}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}


