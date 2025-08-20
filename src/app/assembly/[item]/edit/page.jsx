// src/app/assembly/[item]/edit/page.jsx
"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

const TABS = [
  "Hose Cut",
  "Sleeve/Guard cut",
  "Crimp A",
  "CollarA",
  "Crimp B",
  "CollarB",
  "Packaging",
];

export default function AssemblyEditPage() {
  const { item } = useParams(); // Item recién creado
  const [tab, setTab] = useState(TABS[0]);

  function AddsStatus({ item }) {
    const [adds, setAdds] = useState(null);
    const [order, setOrder] = useState([]);
    useEffect(() => {
      fetch(`/api/assembly/${item}/adds`)
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) {
            setAdds(d.adds);
            setOrder(d.order);
          }
        });
    }, [item]);

    if (!adds) return null;
    const parts = adds.split("|");
    return (
      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="font-medium">Adds:</div>
        <ul className="list-disc ml-5">
          {order.map((name, i) => (
            <li key={name}>
              {name}: <span className="font-mono">{parts[i] ?? "0"}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="min-h-dvh p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">
            Producto #{item} – Formularios opcionales
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Completa solo los que apliquen. (Estos formularios aún no guardan;
            conectamos las APIs cuando nos digas.)
          </p>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg border text-sm
                ${
                  tab === t
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <TabContent tab={tab} item={item} />
        </div>
      </div>
    </div>
  );
}

function TabContent({ tab, item }) {
  switch (tab) {
    case "Hose Cut":
      return (
        <FormStub
          title="Hose Cut"
          item={item}
          fields={["Hose PN", "Length (mm)", "Notes"]}
        />
      );
    case "Sleeve/Guard cut":
      return (
        <FormStub
          title="Sleeve/Guard cut"
          item={item}
          fields={["Sleeve Type", "Length (mm)", "Notes"]}
        />
      );
    case "Crimp A":
      return (
        <FormStub
          title="Crimp A"
          item={item}
          fields={["Fitting A PN", "Crimp Spec", "Notes"]}
        />
      );
    case "CollarA":
      return (
        <FormStub
          title="CollarA"
          item={item}
          fields={["Collar A PN", "Spec", "Notes"]}
        />
      );
    case "Crimp B":
      return (
        <FormStub
          title="Crimp B"
          item={item}
          fields={["Fitting B PN", "Crimp Spec", "Notes"]}
        />
      );
    case "CollarB":
      return (
        <FormStub
          title="CollarB"
          item={item}
          fields={["Collar B PN", "Spec", "Notes"]}
        />
      );
    case "Packaging":
      return (
        <FormStub
          title="Packaging"
          item={item}
          fields={["Box Type", "Qty per Box", "Label"]}
        />
      );
    default:
      return null;
  }
}

function FormStub({ title, item, fields }) {
  return (
    <form className="space-y-4">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        <strong>Item:</strong> {item}
      </div>

      {fields.map((f) => (
        <div key={f}>
          <label className="block text-sm mb-1">{f}</label>
          <input
            placeholder={`Escribe ${f}`}
            className="w-full rounded-lg border px-3 py-2
                       border-slate-300 focus:ring-2 focus:ring-slate-400
                       dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          disabled
          className="rounded-lg bg-slate-300/70 text-slate-700 px-4 py-2
                     dark:bg-slate-700 dark:text-slate-300 cursor-not-allowed"
          title="Próximamente: conectaremos el endpoint"
        >
          Guardar (pendiente API)
        </button>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Este formulario es opcional. Al confirmar el modelo de datos,
          conectamos el guardado a SQL Server.
        </span>
      </div>
    </form>
  );
}
