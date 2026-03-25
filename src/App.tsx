import { useEffect, useMemo, useState } from "react";
import { citizens } from "./data/mockData";
import { Citizen } from "./types";
import "./styles.css";

type Page = "dashboard" | "registry";

const statusColor: Record<string, string> = {
  "Активен": "ok",
  "Требует проверки": "warn",
  "Новая анкета": "new",
  "Архив": "archive",
};

const slicePage = 25;

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 1000000007;
  }
  return hash;
}

function Dashboard({ data }: { data: Citizen[] }) {
  const monthLabels = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  const [ordersRange, setOrdersRange] = useState<"month" | "year">("year");
  const [growthRange, setGrowthRange] = useState<"day" | "month">("month");

  const monthSeries = useMemo(() => {
    const open = Array(12).fill(0);
    const work = Array(12).fill(0);
    const closed = Array(12).fill(0);
    const maintenance = Array(12).fill(0);
    const totals = Array(12).fill(0);

    const safeDate = (iso: string) => {
      const d = new Date(iso + "T00:00:00");
      return Number.isFinite(d.getTime()) ? d : null;
    };

    data.forEach((c) => {
      c.requests.forEach((r) => {
        const dt = safeDate(r.createdAt);
        const idx = dt ? dt.getMonth() : 0;

        if (r.status === "Открыт") open[idx] += 1;
        if (r.status === "В работе") work[idx] += 1;
        if (r.status === "Закрыт") closed[idx] += 1;
        if (r.category === "Техническая заявка") maintenance[idx] += 1;
      });
    });

    for (let i = 0; i < 12; i += 1) {
      totals[i] = open[i] + work[i] + closed[i] + maintenance[i];
    }

    const maxTotal = Math.max(...totals, 1);
    return { open, work, closed, maintenance, totals, maxTotal };
  }, [data]);

  const dailySeries = useMemo(() => {
    // Последние 30 дней (для переключателя Month в Total Orders)
    const days = 30;
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const totals = Array(days).fill(0);
    const safeDate = (iso: string) => {
      const d = new Date(iso + "T00:00:00");
      return Number.isFinite(d.getTime()) ? d : null;
    };

    data.forEach((c) => {
      c.requests.forEach((r) => {
        const dt = safeDate(r.createdAt);
        if (!dt) return;
        const dayStart = new Date(dt);
        dayStart.setHours(0, 0, 0, 0);
        const idx = Math.floor((dayStart.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        if (idx >= 0 && idx < days) totals[idx] += 1;
      });
    });

    const max = Math.max(...totals, 1);
    return { totals, max };
  }, [data]);

  const kpis = useMemo(() => {
    const totalCitizens = data.length;
    const active = data.filter((p) => p.status === "Активен").length;
    const needsReview = data.filter((p) => p.status === "Требует проверки").length;
    const allRequests = data.reduce((acc, c) => acc + c.requests.length, 0);
    const openRequests = data.flatMap((p) => p.requests).filter((r) => r.status !== "Закрыт").length;
    const avgRisk = Math.round(data.reduce((acc, p) => acc + p.riskScore, 0) / Math.max(1, totalCitizens));
    return { totalCitizens, active, needsReview, allRequests, openRequests, avgRisk };
  }, [data]);

  const linePoints = useMemo(() => {
    const w = 220;
    const h = 60;
    const padX = 6;
    const padY = 6;
    const values = ordersRange === "year" ? monthSeries.totals : dailySeries.totals;
    const max = Math.max(...values, 1);
    const step = values.length > 1 ? (w - padX * 2) / (values.length - 1) : 0;

    return values
      .map((v, i) => {
        const x = padX + step * i;
        const y = padY + (1 - v / max) * (h - padY * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [dailySeries.totals, monthSeries.totals, ordersRange]);

  const growthSeries = useMemo(() => {
    if (growthRange === "month") {
      return {
        labels: monthLabels,
        open: monthSeries.open,
        work: monthSeries.work,
        closed: monthSeries.closed,
        maintenance: monthSeries.maintenance,
        totals: monthSeries.totals,
        maxTotal: monthSeries.maxTotal,
      };
    }

    // Последние 14 дней (Day) для Total Growth
    const days = 14;
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const open = Array(days).fill(0);
    const work = Array(days).fill(0);
    const closed = Array(days).fill(0);
    const maintenance = Array(days).fill(0);
    const totals = Array(days).fill(0);

    const safeDate = (iso: string) => {
      const d = new Date(iso + "T00:00:00");
      return Number.isFinite(d.getTime()) ? d : null;
    };

    data.forEach((c) => {
      c.requests.forEach((r) => {
        const dt = safeDate(r.createdAt);
        if (!dt) return;
        const dayStart = new Date(dt);
        dayStart.setHours(0, 0, 0, 0);
        const idx = Math.floor((dayStart.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        if (idx < 0 || idx >= days) return;

        if (r.status === "Открыт") open[idx] += 1;
        if (r.status === "В работе") work[idx] += 1;
        if (r.status === "Закрыт") closed[idx] += 1;
        if (r.category === "Техническая заявка") maintenance[idx] += 1;
      });
    });

    for (let i = 0; i < days; i += 1) totals[i] = open[i] + work[i] + closed[i] + maintenance[i];
    const maxTotal = Math.max(...totals, 1);

    const labels = Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    });

    return { labels, open, work, closed, maintenance, totals, maxTotal };
  }, [data, growthRange, monthLabels, monthSeries]);

  const topDepartments = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        closed: number[];
      }
    >();

    const safeDate = (iso: string) => {
      const d = new Date(iso + "T00:00:00");
      return Number.isFinite(d.getTime()) ? d : null;
    };

    data.forEach((c) => {
      if (!map.has(c.department)) {
        map.set(c.department, { total: 0, closed: Array(12).fill(0) });
      }
      const entry = map.get(c.department)!;
      entry.total += c.requests.length;
      c.requests.forEach((r) => {
        const dt = safeDate(r.createdAt);
        const idx = dt ? dt.getMonth() : 0;
        if (r.status === "Закрыт") entry.closed[idx] += 1;
      });
    });

    return [...map.entries()]
      .map(([name, v]) => {
        const first = v.closed[0];
        const last = v.closed[11];
        const delta = first > 0 ? ((last - first) / first) * 100 : 0;
        return { name, total: v.total, closedSeries: v.closed, delta };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [data]);

  return (
    <section className="dash-page">
      <div className="dash-top-row">
        <div className="dash-title-block">
          <h2 className="dash-h2">Dashboard</h2>
          <p className="dash-subtitle">Сводные показатели по гражданам и обращениям</p>
        </div>
      </div>

      <div className="dash-kpis-grid">
        <article className="kpi-gradient kpi-purple clickable" role="button" tabIndex={0}>
          <div className="kpi-row">
            <div className="kpi-icon" aria-hidden="true">
              <div className="kpi-icon-inner" />
            </div>
            <div className="kpi-meta">
              <div className="kpi-label">Total Citizens</div>
              <div className="kpi-value">{kpis.totalCitizens.toLocaleString("ru-RU")}</div>
            </div>
          </div>
          <div className="kpi-footer">{kpis.avgRisk}% средний риск</div>
        </article>

        <article className="kpi-gradient kpi-blue clickable" role="button" tabIndex={0}>
          <div className="kpi-row">
            <div className="kpi-icon" aria-hidden="true">
              <div className="kpi-icon-inner kpi-icon-inner-blue" />
            </div>
            <div className="kpi-meta">
              <div className="kpi-label">Total Orders</div>
              <div className="kpi-value">{kpis.allRequests.toLocaleString("ru-RU")}</div>
            </div>
            <div className="kpi-range" aria-label="Период">
              <button
                className={ordersRange === "month" ? "range-chip range-chip-active" : "range-chip"}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOrdersRange("month");
                }}
              >
                Month
              </button>
              <button
                className={ordersRange === "year" ? "range-chip range-chip-active" : "range-chip"}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOrdersRange("year");
                }}
              >
                Year
              </button>
            </div>
          </div>
          <div className="kpi-line">
            <svg width="230" height="70" viewBox="0 0 230 70" role="img" aria-label="График динамики">
              <polyline points={linePoints} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
              <polygon points={`${linePoints} 230,70 0,70`} fill="rgba(255,255,255,0.10)" />
            </svg>
          </div>
        </article>

        <article className="mini-card mini-card-blue clickable" role="button" tabIndex={0}>
          <div className="mini-card-row">
            <div className="mini-icon" aria-hidden="true" />
            <div>
              <div className="mini-label">Open cases</div>
              <div className="mini-value">{kpis.openRequests.toLocaleString("ru-RU")}</div>
            </div>
          </div>
          <div className="mini-sub">в работе (не закрыто)</div>
        </article>

        <article className="mini-card mini-card-white clickable" role="button" tabIndex={0}>
          <div className="mini-card-row">
            <div className="mini-icon mini-icon-amber" aria-hidden="true" />
            <div>
              <div className="mini-label">Needs review</div>
              <div className="mini-value">{kpis.needsReview.toLocaleString("ru-RU")}</div>
            </div>
          </div>
          <div className="mini-sub">требуют проверки</div>
        </article>
      </div>

      <div className="dash-bottom-grid">
        <article className="chart-card">
          <div className="chart-card-head">
            <div>
              <div className="chart-title">Total Growth</div>
              <div className="chart-sub">динамика обращений по месяцам</div>
            </div>
            <div className="chart-range">
              <select
                className="range-select"
                value={growthRange}
                onChange={(e) => setGrowthRange(e.target.value as "day" | "month")}
                aria-label="Период"
              >
                <option value="day">Day</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>

          <div className="stacked-chart">
            <div className="stacked-ygrid" aria-hidden="true" />
            <div
              className={growthRange === "day" ? "stacked-bars stacked-bars-day" : "stacked-bars"}
              role="img"
              aria-label="Stacked bar chart"
            >
              {growthSeries.labels.map((label, idx) => {
                const max = growthSeries.maxTotal;
                const openPct = (growthSeries.open[idx] / max) * 100;
                const workPct = (growthSeries.work[idx] / max) * 100;
                const closedPct = (growthSeries.closed[idx] / max) * 100;
                const maintenancePct = (growthSeries.maintenance[idx] / max) * 100;

                return (
                  <div className="stack-col" key={label}>
                    <div className="stack-bar" title={`${label}: всего ${growthSeries.totals[idx]}`}>
                      <div className="stack-seg seg-maintenance" style={{ height: `${maintenancePct}%` }} />
                      <div className="stack-seg seg-closed" style={{ height: `${closedPct}%` }} />
                      <div className="stack-seg seg-work" style={{ height: `${workPct}%` }} />
                      <div className="stack-seg seg-open" style={{ height: `${openPct}%` }} />
                    </div>
                    <div className="stack-xlabel">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-swatch sw-open" aria-hidden="true" /> Открыт
            </div>
            <div className="legend-item">
              <span className="legend-swatch sw-work" aria-hidden="true" /> В работе
            </div>
            <div className="legend-item">
              <span className="legend-swatch sw-closed" aria-hidden="true" /> Закрыт
            </div>
            <div className="legend-item">
              <span className="legend-swatch sw-maintenance" aria-hidden="true" /> Тех. заявка
            </div>
          </div>
        </article>

        <article className="popular-card">
          <div className="popular-head">
            <div>
              <div className="popular-title">Popular Departments</div>
              <div className="popular-sub">топ по нагрузке и динамике закрытых обращений</div>
            </div>
          </div>

          <div className="popular-list">
            {topDepartments.map((d) => {
              const first = d.closedSeries[0];
              const last = d.closedSeries[11];
              const delta = first > 0 ? ((last - first) / first) * 100 : 0;
              const positive = delta >= 0;
              const sparkMax = Math.max(...d.closedSeries, 1);
              const values = d.closedSeries;
              const w = 86;
              const h = 40;
              const pad = 3;
              const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
              const points = values
                .map((v, i) => {
                  const x = pad + step * i;
                  const y = pad + (1 - v / sparkMax) * (h - pad * 2);
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(" ");

              return (
                <div className="popular-item" key={d.name}>
                  <div className="popular-left">
                    <div className="popular-item-title">{d.name}</div>
                    <div className="popular-item-amount">{d.total.toLocaleString("ru-RU")} заявок</div>
                  </div>
                  <div className={`popular-delta ${positive ? "delta-pos" : "delta-neg"}`}>
                    {positive ? "+" : ""}{Math.round(delta)}% закрыто
                  </div>
                  <div className="popular-spark">
                    <svg width="86" height="40" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="sparkline">
                      <polyline
                        points={points}
                        fill="none"
                        stroke={positive ? "rgba(34,197,94,0.9)" : "rgba(239,68,68,0.9)"}
                        strokeWidth="2.2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      <polygon points={`${points} ${w},${h} 0,${h}`} fill={positive ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)"} />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}

function CitizenCard({ citizen }: { citizen: Citizen }) {
  const [tab, setTab] = useState<"main" | "contacts" | "family" | "education" | "requests">("main");
  const [reqStatus, setReqStatus] = useState("all");
  const [reqCategory, setReqCategory] = useState("all");

  useEffect(() => {
    // При смене выбранной карточки возвращаем пользователя в “Основные сведения”.
    setTab("main");
    setReqStatus("all");
    setReqCategory("all");
  }, [citizen.id]);

  const citizensDocs = useMemo(() => {
    const categories = citizen.requests.map((r) => r.category);
    return Array.from(new Set(categories)).slice(0, 8);
  }, [citizen.requests]);

  const requestCategories = useMemo(() => {
    return Array.from(new Set(citizen.requests.map((r) => r.category))).sort((a, b) => a.localeCompare(b, "ru"));
  }, [citizen.requests]);

  const filteredRequests = useMemo(() => {
    return citizen.requests.filter((r) => {
      const mStatus = reqStatus === "all" || r.status === reqStatus;
      const mCategory = reqCategory === "all" || r.category === reqCategory;
      return mStatus && mCategory;
    });
  }, [citizen.requests, reqCategory, reqStatus]);

  const initials = useMemo(() => {
    const parts = citizen.fullName.split(" ").filter(Boolean);
    const a = parts[1]?.[0] ?? parts[0]?.[0] ?? "Г";
    const b = parts[2]?.[0] ?? parts[0]?.[1] ?? "С";
    return `${a}${b}`.toUpperCase();
  }, [citizen.fullName]);

  const metrics = useMemo(() => {
    const open = citizen.requests.filter((r) => r.status !== "Закрыт").length;
    const closed = citizen.requests.filter((r) => r.status === "Закрыт").length;
    const famCount = citizen.familyMembers.length;
    const eduCount = citizen.education.length;
    return [
      { tone: "new", value: String(open), label: "В работе" },
      { tone: "warn", value: String(closed), label: "Закрыто" },
      { tone: "archive", value: String(famCount), label: "Связи (семья)" },
      { tone: "ok", value: String(eduCount), label: "Образование" },
    ] as const;
  }, [citizen.education.length, citizen.familyMembers.length, citizen.requests]);

  const experience = useMemo(() => {
    const seed = hashString(citizen.id + citizen.department);
    const specialties = [
      "Аналитик данных",
      "Менеджер по работе с клиентами",
      "Специалист по поддержке",
      "Инженер по сопровождению",
      "Специалист по претензионной работе",
    ];
    const employers = ["Сбер-Сервис", "РосИнфра", "ТехАрхив", "НордСофт", "ЛогистикПлюс"];
    const roles = ["Специалист", "Старший специалист", "Ведущий специалист", "Руководитель направления"];
    const formats = ["Удаленно", "Гибрид", "Офис"];
    const datesFrom = ["2016", "2017", "2018", "2019", "2020"];
    const datesTo = ["Настоящее время", "2024", "2023", "2022", "2021"];

    return {
      specialty: specialties[seed % specialties.length],
      employer: employers[Math.floor(seed / 7) % employers.length],
      role: roles[Math.floor(seed / 11) % roles.length],
      format: formats[Math.floor(seed / 13) % formats.length],
      startedAt: `${datesFrom[Math.floor(seed / 17) % datesFrom.length]}-01-01`,
      endedAt: datesTo[Math.floor(seed / 19) % datesTo.length],
      note:
        "Опыт в обращениях и сопровождении: проверка данных, взаимодействие с профильными отделами, контроль исполнения и качество заполнения анкет.",
      skills: ["Диагностика", "Проверка данных", "Документооборот", "Согласования", "Коммуникации", "Инциденты", "Аналитика"],
    };
  }, [citizen.department, citizen.id]);

  return (
    <article className="card citizen-card">
      <div className="citizen-top">
        <div className="citizen-top-main">
          <div className="citizen-title-row">
            <h3 className="citizen-name">{citizen.fullName}</h3>
            <span className={`pill pill-${statusColor[citizen.status]}`}>{citizen.status}</span>
          </div>
          <div className="citizen-subline">
            {citizen.id} · {citizen.city}, {citizen.district}
          </div>
        </div>
        <div className="citizen-actions">
          <button className="btn btn-outline" type="button">
            Экспорт
          </button>
          <button className="btn btn-primary" type="button">
            Сохранить
          </button>
        </div>
        <div className="citizen-aside" aria-label="Сводка по гражданину">
          <div className="citizen-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="citizen-metrics">
            {metrics.map((m) => (
              <div className="metric-row" key={m.label}>
                <span className={`metric-dot tone-${m.tone}`} aria-hidden="true" />
                <div className="metric-body">
                  <b>{m.value}</b>
                  <span className="metric-label">{m.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <nav className="tabs" aria-label="Разделы карточки">
        <button className={tab === "main" ? "tab active" : "tab"} onClick={() => setTab("main")} type="button">
          Профиль
        </button>
        <button className={tab === "contacts" ? "tab active" : "tab"} onClick={() => setTab("contacts")} type="button">
          Контакты
        </button>
        <button className={tab === "family" ? "tab active" : "tab"} onClick={() => setTab("family")} type="button">
          Семья
        </button>
        <button className={tab === "education" ? "tab active" : "tab"} onClick={() => setTab("education")} type="button">
          Образование
        </button>
        <button className={tab === "requests" ? "tab active" : "tab"} onClick={() => setTab("requests")} type="button">
          Обращения
        </button>
      </nav>

      {tab === "main" && (
        <div className="tab-panel">
          <div className="section profile-section">
            <h4>Общая информация</h4>
            <div className="fields-grid">
              <label>
                ФИО
                <input defaultValue={citizen.fullName} />
              </label>
              <label>
                Дата рождения
                <input type="date" defaultValue={citizen.birthDate} />
              </label>
              <label>
                Возраст
                <input defaultValue={String(citizen.age)} />
              </label>
              <label>
                Пол
                <select defaultValue={citizen.gender}>
                  <option value="М">М</option>
                  <option value="Ж">Ж</option>
                </select>
              </label>
              <label>
                СНИЛС
                <input defaultValue={citizen.snils} />
              </label>
              <label>
                Паспорт
                <input defaultValue={citizen.passport} />
              </label>
              <label>
                ИНН
                <input defaultValue={citizen.inn} />
              </label>
              <label>
                Статус анкеты
                <select defaultValue={citizen.status}>
                  <option>Активен</option>
                  <option>Требует проверки</option>
                  <option>Новая анкета</option>
                  <option>Архив</option>
                </select>
              </label>
              <label>
                Отдел
                <select defaultValue={citizen.department}>
                  <option>Соцподдержка</option>
                  <option>Миграционный учет</option>
                  <option>ЖКХ</option>
                  <option>Help Desk</option>
                  <option>МФЦ</option>
                  <option>Пенсионный отдел</option>
                </select>
              </label>
              <label>
                Занятость
                <select defaultValue={citizen.employmentType}>
                  <option>Работающий</option>
                  <option>Самозанятый</option>
                  <option>Временная занятость</option>
                  <option>Безработный</option>
                </select>
              </label>
              <label>
                Адрес
                <input defaultValue={citizen.address} />
              </label>
              <label>
                Регистрация (дата)
                <input type="date" defaultValue={citizen.registrationDate} />
              </label>
              <label className="range-label">
                Риск-балл: <b>{citizen.riskScore}</b>
                <input type="range" min={0} max={100} defaultValue={citizen.riskScore} />
              </label>
            </div>
          </div>

          <div className="section profile-section">
            <h4>Опыт и место работы</h4>
            <div className="fields-grid small-grid">
              <label>
                Специальность
                <input defaultValue={experience.specialty} />
              </label>
              <label>
                Роль в проекте
                <input defaultValue={experience.role} />
              </label>
              <label>
                Предыдущее место работы
                <input defaultValue={experience.employer} />
              </label>
              <label>
                Формат сотрудничества
                <select defaultValue={experience.format}>
                  <option>Удаленно</option>
                  <option>Гибрид</option>
                  <option>Офис</option>
                </select>
              </label>
              <label>
                Начало периода
                <input type="date" defaultValue={experience.startedAt} />
              </label>
              <label>
                Завершение периода
                <input defaultValue={experience.endedAt} />
              </label>
              <label>
                Навыки (multi-select)
                <select multiple defaultValue={["Проверка данных", "Документооборот"]}>
                  {experience.skills.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Краткое описание опыта
                <textarea rows={3} defaultValue={experience.note} />
              </label>
            </div>
          </div>

          <div className="two-col">
            <div className="section">
              <h4>Сопутствующие признаки</h4>
              <div className="checkbox-row">
                <label className="checkbox">
                  <input type="checkbox" defaultChecked />
                  Имеет инвалидность
                </label>
                <label className="checkbox">
                  <input type="checkbox" />
                  Требуется сопровождение
                </label>
                <label className="checkbox">
                  <input type="checkbox" defaultChecked />
                  Нуждается в справках
                </label>
              </div>
              <label>
                Наблюдение / примечание
                <textarea defaultValue="Анкета требует дополнительной валидации по документам. " rows={3} />
              </label>
            </div>

            <div className="section">
              <h4>Пакет документов (из обращения)</h4>
              <div className="chips">
                {citizensDocs.length ? (
                  citizensDocs.map((d) => (
                    <label key={d} className="chip">
                      <input type="checkbox" defaultChecked />
                      {d}
                    </label>
                  ))
                ) : (
                  <div className="muted">Нет данных</div>
                )}
              </div>
              <label>
                Список документов (multi-select)
                <select multiple defaultValue={citizensDocs.slice(0, 2)}>
                  {["Паспорт", "СНИЛС", "ИНН", "Свидетельство о браке", "Справка о доходах", "Документы по месту жительства"].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      )}

      {tab === "contacts" && (
        <div className="tab-panel">
          <div className="fields-grid">
            <label>
              Телефон
              <input defaultValue={citizen.phone} />
            </label>
            <label>
              Email
              <input defaultValue={citizen.email} />
            </label>
            <label>
              Телефон (доп.)
              <input defaultValue={citizen.phone.replace("+7", "+7 (8")} />
            </label>
            <label>
              Мессенджер
              <select defaultValue="Telegram">
                <option>Telegram</option>
                <option>WhatsApp</option>
                <option>VK</option>
              </select>
            </label>
            <label>
              Предпочтительный канал
              <select defaultValue="Звонок">
                <option>Звонок</option>
                <option>SMS</option>
                <option>Email</option>
              </select>
            </label>
            <label>
              Часы связи (от)
              <input type="time" defaultValue="10:00" />
            </label>
            <label>
              Часы связи (до)
              <input type="time" defaultValue="18:00" />
            </label>
            <label>
              Адрес (почтовый)
              <input defaultValue={citizen.address} />
            </label>
            <label>
              Описание контакта
              <textarea rows={3} defaultValue="Уточнять по телефону перед визитом." />
            </label>
            <div className="spacer" />
            <div className="spacer" />
            <div className="checkbox-row">
              <label className="checkbox">
                <input type="checkbox" defaultChecked />
                Согласен(а) на уведомления
              </label>
              <label className="checkbox">
                <input type="checkbox" />
                Запрет на звонки
              </label>
            </div>
          </div>
        </div>
      )}

      {tab === "family" && (
        <div className="tab-panel">
          <div className="two-col">
            <div className="section">
              <h4>Члены семьи (таблица)</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th>Родство</th>
                    <th>Дата рождения</th>
                    <th>Занятость</th>
                  </tr>
                </thead>
                <tbody>
                  {citizen.familyMembers.map((m) => (
                    <tr key={m.id}>
                      <td>{m.fullName}</td>
                      <td>{m.relation}</td>
                      <td>{m.birthDate}</td>
                      <td>{m.occupation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="section">
              <h4>Добавить запись</h4>
              <div className="fields-grid small-grid">
                <label>
                  ФИО
                  <input defaultValue="" placeholder="Иванов Иван Иванович" />
                </label>
                <label>
                  Родство
                  <select defaultValue="Супруг(а)">
                    <option>Супруг(а)</option>
                    <option>Ребенок</option>
                    <option>Родитель</option>
                  </select>
                </label>
                <label>
                  Дата рождения
                  <input type="date" defaultValue="1990-01-01" />
                </label>
                <label>
                  Занятость
                  <input defaultValue="Работает" />
                </label>
              </div>
              <button className="btn btn-primary" type="button">
                Добавить в «члены семьи»
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "education" && (
        <div className="tab-panel">
          <div className="two-col">
            <div className="section">
              <h4>Образование (таблица)</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Учреждение</th>
                    <th>Квалификация</th>
                    <th>Год</th>
                  </tr>
                </thead>
                <tbody>
                  {citizen.education.map((e) => (
                    <tr key={e.id}>
                      <td>{e.institution}</td>
                      <td>{e.qualification}</td>
                      <td>{e.graduationYear}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="section">
              <h4>Сведения об обучении</h4>
              <div className="fields-grid small-grid">
                <label>
                  Учреждение
                  <select defaultValue={citizen.education[0]?.institution.trim() ?? "НГУ"}>
                    {["НГУ", "МГУ", "СПбГУ", "НГТУ", "КФУ"].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Квалификация
                  <select defaultValue={citizen.education[0]?.qualification ?? "Бакалавр"}>
                    {["Бакалавр", "Специалист", "Магистр"].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Год окончания
                  <input type="number" min={1950} max={2026} defaultValue={citizen.education[0]?.graduationYear ?? 2016} />
                </label>
                <label>
                  Тип документа
                  <select defaultValue="Диплом">
                    <option>Диплом</option>
                    <option>Сертификат</option>
                    <option>Удостоверение</option>
                  </select>
                </label>
              </div>

              <label>
                Языки (multi-select)
                <select multiple defaultValue={["Русский", "Английский"]}>
                  {["Русский", "Английский", "Немецкий", "Французский", "Казахский"].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>

              <button className="btn btn-outline" type="button">
                Добавить «образование»
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "requests" && (
        <div className="tab-panel">
          <div className="two-col">
            <div className="section">
              <div className="section-head">
                <h4>Обращения (таблица)</h4>
                <div className="filters-row">
                  <label>
                    Статус
                    <select value={reqStatus} onChange={(e) => setReqStatus(e.target.value)}>
                      <option value="all">Все</option>
                      <option value="Открыт">Открыт</option>
                      <option value="В работе">В работе</option>
                      <option value="Закрыт">Закрыт</option>
                    </select>
                  </label>
                  <label>
                    Категория
                    <select value={reqCategory} onChange={(e) => setReqCategory(e.target.value)}>
                      <option value="all">Все</option>
                      {requestCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Категория</th>
                    <th>Приоритет</th>
                    <th>Статус</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.category}</td>
                      <td>
                        <span className={`pill pill-${r.priority === "Высокий" ? "new" : r.priority === "Средний" ? "warn" : "archive"}`}>
                          {r.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`pill pill-${r.status === "Открыт" ? "new" : r.status === "В работе" ? "warn" : "archive"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>{r.createdAt}</td>
                    </tr>
                  ))}
                  {!filteredRequests.length && (
                    <tr>
                      <td colSpan={5} className="empty-cell">
                        По текущим фильтрам обращений нет.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="section">
              <h4>Создать обращение</h4>
              <div className="fields-grid small-grid">
                <label>
                  Категория
                  <select defaultValue={requestCategories[0] ?? "Справка"}>
                    {requestCategories.length ? (
                      requestCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))
                    ) : (
                      <option value="Справка">Справка</option>
                    )}
                  </select>
                </label>
                <label>
                  Приоритет
                  <select defaultValue="Средний">
                    <option>Низкий</option>
                    <option>Средний</option>
                    <option>Высокий</option>
                  </select>
                </label>
                <label>
                  Статус (старт)
                  <select defaultValue="Открыт">
                    <option>Открыт</option>
                    <option>В работе</option>
                    <option>Закрыт</option>
                  </select>
                </label>
                <label>
                  Дата
                  <input type="date" defaultValue="2026-03-24" />
                </label>
              </div>
              <label>
                Краткое описание
                <textarea rows={3} defaultValue="Запрос на предоставление услуги/справки." />
              </label>
              <button className="btn btn-primary" type="button">
                Отправить обращение
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function CitizenProfileModal({ citizen, onClose }: { citizen: Citizen; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Профиль гражданина" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {citizen.fullName}
            <span className="modal-subtitle">
              {citizen.id} · {citizen.city}, {citizen.district}
            </span>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-card">
            <CitizenCard citizen={citizen} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Registry({ data }: { data: Citizen[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [city, setCity] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(data[0]?.id ?? "");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    return data.filter((c) => {
      const matchQuery = `${c.fullName} ${c.id} ${c.phone}`.toLowerCase().includes(query.toLowerCase());
      const matchStatus = status === "all" || c.status === status;
      const matchCity = city === "all" || c.city === city;
      return matchQuery && matchStatus && matchCity;
    });
  }, [data, query, status, city]);

  const pages = Math.max(1, Math.ceil(filtered.length / slicePage));
  const safePage = Math.min(page, pages);
  const paged = filtered.slice((safePage - 1) * slicePage, safePage * slicePage);
  const selected = filtered.find((c) => c.id === selectedId) ?? paged[0];

  return (
    <section className="content">
      <h2>Картотека граждан</h2>
      <div className="toolbar card">
        <label>Поиск<input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="ФИО, ID, телефон" /></label>
        <label>Статус
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">Все</option>
            <option value="Активен">Активен</option>
            <option value="Требует проверки">Требует проверки</option>
            <option value="Новая анкета">Новая анкета</option>
            <option value="Архив">Архив</option>
          </select>
        </label>
        <label>Город
          <select value={city} onChange={(e) => { setCity(e.target.value); setPage(1); }}>
            <option value="all">Все</option>
            {[...new Set(data.map((i) => i.city))].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <div className="counter">Найдено: <strong>{filtered.length.toLocaleString("ru-RU")}</strong></div>
      </div>

      <div className="registry-layout">
        <div className="list card">
          <ul>
            {paged.map((p) => (
              <li key={p.id}>
                <button
                  className={selected?.id === p.id ? "active" : ""}
                  onClick={() => {
                    setSelectedId(p.id);
                    setModalOpen(true);
                  }}
                >
                  <span>{p.fullName}</span>
                  <small>{p.id} · {p.city}</small>
                </button>
              </li>
            ))}
          </ul>
          <div className="pagination">
            <button disabled={safePage === 1} onClick={() => setPage((v) => Math.max(1, v - 1))}>Назад</button>
            <span className="page-indicator">{safePage} / {pages}</span>
            <button disabled={safePage === pages} onClick={() => setPage((v) => Math.min(pages, v + 1))}>Далее</button>
          </div>
        </div>
        <div className="card registry-side-help">
          <b>Подсказка:</b> клик по человеку откроет профиль поверх экрана.
        </div>
      </div>

      {modalOpen && selected ? <CitizenProfileModal citizen={selected} onClose={() => setModalOpen(false)} /> : null}
    </section>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true" />
          <div className="brand-text">
            <div className="brand-title">CitizenDesk</div>
            <div className="brand-sub">кабинет сопровождения</div>
          </div>
        </div>

        <div className="header-nav" role="navigation" aria-label="Разделы">
          <button
            className={page === "dashboard" ? "header-btn header-btn-active" : "header-btn"}
            type="button"
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={page === "registry" ? "header-btn header-btn-active" : "header-btn"}
            type="button"
            onClick={() => setPage("registry")}
          >
            Картотека
          </button>
        </div>
      </header>

      <main className="site-main">
        {page === "dashboard" ? <Dashboard data={citizens} /> : <Registry data={citizens} />}
      </main>
    </div>
  );
}
