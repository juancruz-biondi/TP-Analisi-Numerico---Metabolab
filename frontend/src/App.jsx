import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, 
  Tooltip, CartesianGrid, ZAxis, ReferenceLine 
} from 'recharts';
import { 
  AlertTriangle, CheckCircle2, TrendingUp, Compass, 
  BookOpen, Layers, BarChart3, HelpCircle, ExternalLink, Eye, Calculator, Percent, Info 
} from 'lucide-react';
import { RAW_DATA, CLUSTER_CONFIG } from './data/staticData';
import MathText from './components/MathText';

// Fórmulas matemáticas de los 5 modelos para cada clúster con justificaciones explayadas
const MODEL_FORMULAS = {
  mamiferos: {
    'Lineal': { 
      eq: 'y = 59.14 + 0.3940x', 
      r2: '0.96500', 
      fn: (x) => 59.14 + 0.3940 * x, 
      estado: 'bad', 
      veredicto: 'Descartado: Presenta residuos con fuerte patrón sistemático. Al ser lineal fija un costo metabólico constante por kg (desconoce la economía alométrica) y su ordenada al origen (+59.14 W) sobrestima absurdamente a los mamíferos pequeños (la musaraña consume 0.028 W).' 
    },
    'Exponencial': { 
      eq: 'y = 12.37 · e^(0.0014x)', 
      r2: '0.26942', 
      fn: (x) => 12.37 * Math.exp(0.0014 * x), 
      estado: 'bad', 
      veredicto: 'Descartado: El peor ajuste de todos (r²=0.269). La tasa de consumo energético no crece con aceleración exponencial frente a la masa corporal.' 
    },
    'Potencial': { 
      eq: 'y = 3.469 · x^0.7423', 
      r2: '0.99366', 
      fn: (x) => 3.469 * Math.pow(x, 0.7423), 
      estado: 'winner', 
      veredicto: 'ELEGIDO: Excelente bondad de ajuste (r²=0.9937) sin artificios de escala. Residuos distribuidos al azar en torno a cero en todas las masas. Valida la Ley de Kleiber con b=0.7423 (muy cercano a ¾) y respeta la condición física fundamental y(0)=0.' 
    },
    'Polinómico g2': { 
      eq: 'y = 32.77 + 0.572x - 0.000039x²', 
      r2: '0.98123', 
      fn: (x) => 32.77 + 0.572 * x - 0.000039 * Math.pow(x, 2), 
      estado: 'bad', 
      veredicto: 'Descartado: Emplea 3 parámetros sin superar al modelo potencial. Su término cuadrático negativo curvaría la función hacia abajo en masas mayores y su término independiente (+32.77 W) genera un error estructural en el origen.' 
    },
    'Cociente': { 
      eq: 'y = 6.081·x / (0.435 + x)', 
      r2: '0.99589', 
      fn: (x) => (6.081 * x) / (0.435 + x), 
      estado: 'trap', 
      veredicto: 'TRAMPA ESTADÍSTICA: Aunque tiene el r² numérico más alto (0.99589), es un artificio por linealizar en escala invertida (1/y). La curva satura asintóticamente en 6.08 W: predice 6.04 W para una cabra (real: 92.7 W) y 6.08 W para un elefante (real: 1941.8 W).' 
    }
  },
  aves: {
    'Lineal': { 
      eq: 'y = 7.910 + 1.4065x', 
      r2: '0.88758', 
      fn: (x) => 7.910 + 1.4065 * x, 
      estado: 'bad', 
      veredicto: 'Descartado: r² insuficiente (0.887). Sobrestima el gasto energético de las aves pequeñas al imponer una ordenada de +7.91 W (un colibrí consume solo 0.065 W).' 
    },
    'Exponencial': { 
      eq: 'y = 3.229 · e^(0.05524x)', 
      r2: '0.37174', 
      fn: (x) => 3.229 * Math.exp(0.05524 * x), 
      estado: 'bad', 
      veredicto: 'Descartado: Ajuste inaceptable (r²=0.371). Dispara valores desproporcionados e irreales para aves de gran porte como el avestruz.' 
    },
    'Potencial': { 
      eq: 'y = 4.822 · x^0.7519', 
      r2: '0.97427', 
      fn: (x) => 4.822 * Math.pow(x, 0.7519), 
      estado: 'winner', 
      veredicto: 'ELEGIDO: Gana de forma directa y limpia con el r² más alto (0.9743). Coincidencia asombrosa con el exponente teórico de Kleiber: b=0.7519 (exactamente ¾).' 
    },
    'Polinómico g2': { 
      eq: 'y = 4.585 + 2.128x - 0.00836x²', 
      r2: '0.91449', 
      fn: (x) => 4.585 + 2.128 * x - 0.00836 * Math.pow(x, 2), 
      estado: 'bad', 
      veredicto: 'Descartado: Con r²=0.914 queda muy por debajo del modelo potencial, introduciendo complejidad innecesaria sin sustento biológico.' 
    },
    'Cociente': { 
      eq: 'y = 2.726·x / (0.1275 + x)', 
      r2: '0.94509', 
      fn: (x) => (2.726 * x) / (0.1275 + x), 
      estado: 'bad', 
      veredicto: 'Descartado: No supera al Potencial y satura asintóticamente en 2.72 W, impidiéndole modelar aves mayores a 1 kg.' 
    }
  },
  reptiles: {
    'Lineal': { 
      eq: 'y = 3.951 + 0.2005x', 
      r2: '0.90291', 
      fn: (x) => 3.951 + 0.2005 * x, 
      estado: 'bad', 
      veredicto: 'Descartado: No logra modelar la marcada curvatura de escala en reptiles pesados (>300 kg) y falla en el origen (+3.95 W vs 0.014 W del gecko).' 
    },
    'Exponencial': { 
      eq: 'y = 1.076 · e^(0.01023x)', 
      r2: '0.46995', 
      fn: (x) => 1.076 * Math.exp(0.01023 * x), 
      estado: 'bad', 
      veredicto: 'Descartado: Rendimiento deficiente (r²=0.470). La fisiología de los reptiles no sigue una dinámica de gasto energético exponencial.' 
    },
    'Potencial': { 
      eq: 'y = 0.675 · x^0.8035', 
      r2: '0.97960', 
      fn: (x) => 0.675 * Math.pow(x, 0.8035), 
      estado: 'winner', 
      veredicto: 'ELEGIDO: Máximo r² genuino (0.9796) sin artificios de cálculo. Modela con precisión desde 10 gramos (gecko) hasta 700 kg (cocodrilo marino). Presenta el exponente alométrico más alto (b=0.8035).' 
    },
    'Polinómico g2': { 
      eq: 'y = 1.543 + 0.265x - 0.000113x²', 
      r2: '0.91350', 
      fn: (x) => 1.543 + 0.265 * x - 0.000113 * Math.pow(x, 2), 
      estado: 'bad', 
      veredicto: 'Descartado: r²=0.9135 significativamente inferior al Potencial. Penalizado por el principio de parsimonia al requerir 3 parámetros.' 
    },
    'Cociente': { 
      eq: 'y = 1.171·x / (0.8137 + x)', 
      r2: '0.83116', 
      fn: (x) => (1.171 * x) / (0.8137 + x), 
      estado: 'bad', 
      veredicto: 'Descartado: Claramente inferior (r²=0.831). Satura en 1.17 W, incapacitado para estimar la tasa de reptiles medianos y grandes.' 
    }
  },
  peces: {
    'Lineal': { 
      eq: 'y = 12.71 + 0.0695x', 
      r2: '0.97540', 
      fn: (x) => 12.71 + 0.0695 * x, 
      estado: 'bad', 
      veredicto: 'Descartado: Fija una ordenada de +12.71 W que destruye las estimaciones para los peces pequeños que consumen fracciones de Watt (gobio: 0.0055 W).' 
    },
    'Exponencial': { 
      eq: 'y = 2.492 · e^(0.00063x)', 
      r2: '0.26655', 
      fn: (x) => 2.492 * Math.exp(0.00063 * x), 
      estado: 'bad', 
      veredicto: 'Descartado: El peor modelo evaluado (r²=0.266), completamente ajeno a la física biológica del nado y la respiración branquial.' 
    },
    'Potencial': { 
      eq: 'y = 0.4922 · x^0.7806', 
      r2: '0.98404', 
      fn: (x) => 0.4922 * Math.pow(x, 0.7806), 
      estado: 'winner', 
      veredicto: 'ELEGIDO: El único modelo estructuralmente coherente a lo largo de 6 órdenes de magnitud (desde 5 g a 12.000 kg). Respeta y(0)=0, tiene b=0.7806 consistente con Kleiber y sus residuos no tienen sesgo sistemático.' 
    },
    'Polinómico g2': { 
      eq: 'y = 2.083 + 0.1112x - 0.0000037x²', 
      r2: '0.99491', 
      fn: (x) => 2.083 + 0.1112 * x - 0.0000037 * Math.pow(x, 2), 
      estado: 'trap', 
      veredicto: 'TRAMPA 1: Tiene el r² más alto (0.9949) en escala directa porque la enorme varianza del Tiburón ballena (808 W) domina el promedio global. Sin embargo, su ordenada al origen (+2.083 W) predice 2.08 W para el Gobio (real: 0.0055 W), un error inadmisible de más del 37.000% que viola y(0)=0.' 
    },
    'Cociente': { 
      eq: 'y = 1.080·x / (0.9834 + x)', 
      r2: '0.99251', 
      fn: (x) => (1.080 * x) / (0.9834 + x), 
      estado: 'trap', 
      veredicto: 'TRAMPA 2: Segundo r² más alto (0.9925). Su meseta horizontal en 1.08 W predice 1.08 W para el Tiburón ballena adulto de 12.000 kg (cuyo gasto real es de 808.3 W).' 
    }
  }
};

const MODEL_NAMES = ['Lineal', 'Exponencial', 'Potencial', 'Polinómico g2', 'Cociente'];

// Rango fijo del eje Y de residuos absolutos (W) para cada clúster
const CLUSTER_RESIDUAL_LIMITS = {
  mamiferos: 350,
  aves: 35,
  reptiles: 35,
  peces: 120
};

export default function App() {
  const [activeTab, setActiveTab] = useState('bloque1');
  const [activeClusterKey, setActiveClusterKey] = useState('mamiferos');
  const [scaleMode, setScaleMode] = useState('normal');
  const [activeSubTab, setActiveSubTab] = useState('graficos'); // 'graficos' | 'modelos' | 'residuos' | 'deduccion'
  const [selectedModelName, setSelectedModelName] = useState('Potencial');
  const [residualType, setResidualType] = useState('absoluto'); // 'absoluto' | 'porcentual'

  const currentCluster = CLUSTER_CONFIG?.[activeClusterKey] || {};
  const currentSpeciesData = RAW_DATA?.[activeClusterKey] || [];
  const currentClusterModels = MODEL_FORMULAS[activeClusterKey] || MODEL_FORMULAS.mamiferos;
  const activeModelObj = currentClusterModels[selectedModelName] || currentClusterModels['Potencial'];

  // Sumatorias analíticas para el Sistema de Ecuaciones Normales del modelo Potencial
  const normalEquationData = useMemo(() => {
    const n = currentSpeciesData.length;
    let sumX = 0, sumY = 0, sumX2 = 0, sumXY = 0;
    currentSpeciesData.forEach(d => {
      const X = Math.log(d.masa);
      const Y = Math.log(d.tasa);
      sumX += X;
      sumY += Y;
      sumX2 += X * X;
      sumXY += X * Y;
    });
    const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const A = (sumY - b * sumX) / n;
    const a = Math.exp(A);
    return {
      n,
      sumX: sumX.toFixed(4),
      sumY: sumY.toFixed(4),
      sumX2: sumX2.toFixed(4),
      sumXY: sumXY.toFixed(4),
      A: A.toFixed(4),
      b: b.toFixed(4),
      a: a.toFixed(4)
    };
  }, [currentSpeciesData]);

  // Cálculo de SS_res (Suma de Cuadrados de Residuos) en W² para los 5 modelos del clúster
  const ssResMap = useMemo(() => {
    const map = {};
    MODEL_NAMES.forEach(mName => {
      const fn = currentClusterModels[mName].fn;
      let ss = 0;
      currentSpeciesData.forEach(d => {
        const diff = d.tasa - fn(d.masa);
        ss += diff * diff;
      });
      map[mName] = ss;
    });
    return map;
  }, [currentClusterModels, currentSpeciesData]);

  // Límite fijado del eje vertical para residuos
  const maxResidualLimit = CLUSTER_RESIDUAL_LIMITS[activeClusterKey] || 100;
  const maxPercentLimit = 100;

  // Puntos experimentales y residuos del clúster activo
  const chartData = useMemo(() => {
    return currentSpeciesData.map((d) => {
      const pred = activeModelObj.fn(d.masa);
      const safePred = pred > 0 ? pred : 0.0001;
      const resW = d.tasa - pred;
      const resPct = (resW / d.tasa) * 100;

      let clampedResW = resW;
      let isOutlierW = false;
      if (resW > maxResidualLimit) {
        clampedResW = maxResidualLimit;
        isOutlierW = true;
      } else if (resW < -maxResidualLimit) {
        clampedResW = -maxResidualLimit;
        isOutlierW = true;
      }

      let clampedResPct = resPct;
      let isOutlierPct = false;
      if (resPct > maxPercentLimit) {
        clampedResPct = maxPercentLimit;
        isOutlierPct = true;
      } else if (resPct < -maxPercentLimit) {
        clampedResPct = -maxPercentLimit;
        isOutlierPct = true;
      }

      return {
        ...d,
        logMasa: Number(Math.log(d.masa).toFixed(3)),
        logTasa: Number(Math.log(d.tasa).toFixed(3)),
        predActual: Number(pred.toFixed(3)),
        logPredActual: Number(Math.log(safePred).toFixed(3)),
        residuoRealW: Number(resW.toFixed(4)),
        residuoGraficoW: Number(clampedResW.toFixed(2)),
        isOutlierW,
        residuoRealPct: Number(resPct.toFixed(1)),
        residuoGraficoPct: Number(clampedResPct.toFixed(1)),
        isOutlierPct
      };
    });
  }, [currentSpeciesData, activeModelObj, maxResidualLimit]);

  // Curva suave del modelo seleccionado
  const curveData = useMemo(() => {
    if (!currentSpeciesData.length) return [];
    const masses = currentSpeciesData.map(d => d.masa);
    const minM = Math.min(...masses);
    const maxM = Math.max(...masses);
    const steps = 75;
    const curvePoints = [];

    if (scaleMode === 'normal') {
      for (let i = 0; i <= steps; i++) {
        const factor = Math.pow(i / steps, 2.5);
        const m = minM + factor * (maxM - minM);
        const pred = activeModelObj.fn(m);
        if (pred >= 0 && pred <= maxM * 4) {
          curvePoints.push({
            masa: Number(m.toFixed(4)),
            tasa: Number(pred.toFixed(3)),
            isCurve: true
          });
        }
      }
    } else {
      const logMin = Math.log(minM);
      const logMax = Math.log(maxM);
      for (let i = 0; i <= steps; i++) {
        const lm = logMin + (i / steps) * (logMax - logMin);
        const realM = Math.exp(lm);
        const pred = activeModelObj.fn(realM);
        if (pred > 0) {
          curvePoints.push({
            logMasa: Number(lm.toFixed(3)),
            logTasa: Number(Math.log(pred).toFixed(3)),
            isCurve: true
          });
        }
      }
    }
    return curvePoints;
  }, [currentSpeciesData, activeModelObj, scaleMode]);

  // Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.isCurve) return null;

      return (
        <div className="bg-[#1F2421] text-[#EDEAE1] p-3 rounded-lg shadow-2xl border border-paperLine text-xs font-mono max-w-xs">
          <p className="font-serif text-sm font-bold text-amber-200 mb-1">{data.especie}</p>
          <div className="space-y-0.5">
            <p><span className="text-gray-400">Masa:</span> {data.masa} kg {scaleMode === 'loglog' && `[ln: ${data.logMasa}]`}</p>
            <p><span className="text-gray-400">Tasa:</span> {data.tasa} W {scaleMode === 'loglog' && `[ln: ${data.logTasa}]`}</p>
            {data.predActual !== undefined && (
              <div className="pt-1 mt-1 border-t border-gray-700">
                <p className="text-emerald-300">
                  <span className="text-gray-400">Predicción ({selectedModelName}):</span> {data.predActual} W
                </p>
                <p className={Math.abs(data.residuoRealW) > 10 ? 'text-rose-300 font-bold' : 'text-amber-300'}>
                  <span className="text-gray-400">Residuo:</span> {data.residuoRealW} W ({data.residuoRealPct}%)
                </p>
                {(data.isOutlierW || data.isOutlierPct) && (
                  <p className="text-amber-400 text-[11px] font-bold mt-1 bg-amber-950/80 p-1 rounded border border-amber-500">
                    ⚠ Punto graficado al límite del eje para preservar la escala.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const badgeColor = currentCluster.color || '#1F6E77';

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col antialiased">
      {/* HEADER */}
      <header className="border-b border-paperLine bg-paper/95 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#1F2421] text-amber-100 flex items-center justify-center font-serif text-lg font-bold">
              M
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold font-serif leading-tight">Masa Corporal y Metabolismo Animal - Caso 4</h1>
              <p className="text-xs text-inkMuted font-mono">Mínimos Cuadrados · UTN FRLP</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-paperDark p-1 rounded-lg border border-paperLine text-xs font-medium">
            <button
              onClick={() => setActiveTab('bloque1')}
              className={`px-3 py-1.5 rounded transition ${activeTab === 'bloque1' ? 'bg-ink text-paper shadow-sm' : 'text-inkMuted hover:text-ink'}`}
            >
              I. Contexto
            </button>
            <button
              onClick={() => setActiveTab('bloque2')}
              className={`px-3 py-1.5 rounded transition ${activeTab === 'bloque2' ? 'bg-ink text-paper shadow-sm' : 'text-inkMuted hover:text-ink'}`}
            >
              II. Clústeres
            </button>
            <button
              onClick={() => setActiveTab('bloque3')}
              className={`px-3 py-1.5 rounded transition ${activeTab === 'bloque3' ? 'bg-ink text-paper shadow-sm' : 'text-inkMuted hover:text-ink'}`}
            >
              III. Conclusión & Kleiber
            </button>
          </nav>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        
        {/* BLOQUE 1: CONTEXTO COMPLETO ORIGINAL + NUBES DE PUNTOS SEPARADAS */}
        {activeTab === 'bloque1' && (
          <section className="space-y-6">
            
            {/* 1. PLANTEO DEL PROBLEMA Y SITUACIÓN PROBLEMÁTICA ORIGINAL */}
            <div className="bg-white/75 rounded-xl p-6 border border-paperLine shadow-sm space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-peces font-bold">Bloque I — Contexto & Planteo del Problema</span>
              <h2 className="text-2xl md:text-3xl font-bold font-serif text-ink">
                Situación Problemática y Desafío Científico
              </h2>
              <p className="text-inkMuted leading-relaxed max-w-4xl text-sm md:text-base">
                Un equipo de comunicación científica desea estudiar cómo cambia la <strong>tasa metabólica basal estimada (W)</strong> cuando aumenta la <strong>masa corporal (kg)</strong>. Se comparan <em>mamíferos, aves, reptiles y peces</em>. El objetivo es construir y evaluar un modelo para cada clúster, interpretar sus parámetros y explicar por qué animales de distinto tamaño y grupo biológico no consumen energía de forma directamente proporcional a su masa.
              </p>

              {/* FICHA TÉCNICA DE VARIABLES Y CLÚSTERES (ORIGINAL) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 font-mono text-xs">
                <div className="p-3 bg-paperDark/50 rounded-lg border border-paperLine">
                  <span className="text-gray-500 block text-[11px]">Variable Independiente (X)</span>
                  <span className="font-bold text-ink text-sm">Masa Corporal (kg)</span>
                </div>
                <div className="p-3 bg-paperDark/50 rounded-lg border border-paperLine">
                  <span className="text-gray-500 block text-[11px]">Variable Dependiente (Y)</span>
                  <span className="font-bold text-ink text-sm">Tasa Metabólica Basal (W)</span>
                </div>
                <div className="p-3 bg-paperDark/50 rounded-lg border border-paperLine">
                  <span className="text-gray-500 block text-[11px]">Clústeres en Estudio</span>
                  <span className="font-bold text-ink text-sm">4 grupos (22 especies c/u, 88 total)</span>
                </div>
              </div>

              {/* ACLARACIÓN EXPLÍCITA DE CÁTEDRA (ORIGINAL) */}
              {/*<div className="mt-4 p-4 rounded-lg bg-amber-50 border-l-4 border-amber-600 text-ink text-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900 font-serif">Aclaración Explícita del Profesor (Guía Central)</h4>
                    <p className="italic text-amber-950 mt-1 leading-relaxed">
                      «Es importante no elegir el modelo de antemano ni confiarse por la forma aparente de los datos. La selección del ajuste debe estar justificada mediante los gráficos, la teoría, las medidas de bondad y el comportamiento de los residuos. Tampoco deben suponer que todos los clústeres de un mismo caso necesariamente se ajustan al mismo tipo de modelo. [...] No alcanza con obtener una ecuación utilizando directamente una herramienta informática: deben mostrar y comprender el procedimiento de cálculo, justificar la elección del modelo e interpretar los resultados.»
                    </p>
                  </div>
                </div>
              </div>*/}
            </div>

            {/* 2. LAS 3 TARJETAS TEÓRICAS (KLEIBER, MODELOS, TRAMPAS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-white/70 rounded-xl border border-paperLine shadow-sm">
                <div className="flex items-center gap-2 text-peces font-bold mb-2">
                  <BookOpen className="w-5 h-5" />
                  <h3 className="font-serif text-base">Principio de Kleiber</h3>
                </div>
                <p className="text-xs text-inkMuted leading-relaxed">
                  <MathText text="En 1932, Max Kleiber demostró que la tasa metabólica alométrica sigue $y = a \cdot x^b$ con $b \approx 0.75$, desacreditando la idea geométrica clásica de superficie-volumen ($b \approx 0.67$)." />
                </p>
              </div>

              <div className="p-5 bg-white/70 rounded-xl border border-paperLine shadow-sm">
                <div className="flex items-center gap-2 text-[#7A4632] font-bold mb-2">
                  <Layers className="w-5 h-5" />
                  <h3 className="font-serif text-base">5 Modelos Evaluados</h3>
                </div>
                <p className="text-xs text-inkMuted leading-relaxed">
                  Lineal, Potencial, Exponencial, Polinómico de grado 2 y Modelo Cociente. Linealizados por sustitución o analizados directamente mediante ecuaciones normales.
                </p>
              </div>

              <div className="p-5 bg-white/70 rounded-xl border border-paperLine shadow-sm">
                <div className="flex items-center gap-2 text-rose-700 font-bold mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-serif text-base">Trampas de Transformación</h3>
                </div>
                <p className="text-xs text-inkMuted leading-relaxed">
                  <MathText text="El $r^2$ calculado sobre escalas transformadas ($\ln(y)$ o $1/y$) mide la bondad en ese espacio distorsionado. Al regresar a Watts, el modelo Cociente satura y produce errores colosales." />
                </p>
              </div>
            </div>

            {/* 3. NUBES DE PUNTOS SEPARADAS PARA CADA CLÚSTER (NORMAL Y LOG-LOG) */}
            <div className="space-y-6 pt-2">
              <div className="border-b border-paperLine pb-2">
                <h3 className="text-xl font-serif font-bold text-ink">
                  Nubes de Puntos Iniciales Separadas por Clúster (88 especies)
                </h3>
                <p className="text-xs text-inkMuted">
                  Cada grupo biológico cuenta con su propio gráfico en Escala Normal e Inmediatamente al lado en Escala Log-Log para apreciar la linealización sin solapamiento de puntos.
                </p>
              </div>

              {['mamiferos', 'aves', 'reptiles', 'peces'].map((cKey) => {
                const cl = CLUSTER_CONFIG[cKey];
                const cData = RAW_DATA[cKey].map(d => ({
                  ...d,
                  logMasa: Number(Math.log(d.masa).toFixed(3)),
                  logTasa: Number(Math.log(d.tasa).toFixed(3))
                }));

                return (
                  <div key={cKey} className="bg-white rounded-xl p-5 border border-paperLine shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-paperLine pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cl.color }}></span>
                        <h4 className="font-serif font-bold text-base md:text-lg text-ink">
                          {cl.nombre} <span className="text-xs font-mono font-normal text-inkMuted">({cl.subtitulo})</span>
                        </h4>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded border bg-paperDark text-ink">
                        22 especies
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Gráfico Escala Normal */}
                      <div className="p-3 bg-paperDark/30 rounded-lg border border-paperLine">
                        <p className="text-xs font-mono font-semibold text-ink mb-1">
                          Escala Normal: Masa (kg) vs. Tasa (W)
                        </p>
                        <p className="text-[11px] text-inkMuted mb-2">
                          Se observa la curvatura potencial y la acumulación visual cerca del origen debido a la enorme dispersión de masa.
                        </p>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
                              <XAxis type="number" dataKey="masa" name="Masa" unit=" kg" stroke="#4F5752" tick={{ fontSize: 10 }} />
                              <YAxis type="number" dataKey="tasa" name="Tasa" unit=" W" stroke="#4F5752" tick={{ fontSize: 10 }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Scatter name={cl.nombre} data={cData} fill={cl.color} stroke="#1F2421" />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Gráfico Escala Log-Log */}
                      <div className="p-3 bg-paperDark/30 rounded-lg border border-paperLine">
                        <p className="text-xs font-mono font-semibold text-ink mb-1">
                          Escala Log-Log: ln(Masa) vs. ln(Tasa)
                        </p>
                        <p className="text-[11px] text-inkMuted mb-2">
                          Al transformar con logaritmos neperianos [ln(y) = ln(a) + b·ln(x)], la nube se ordena en una recta casi perfecta.
                        </p>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
                              <XAxis type="number" dataKey="logMasa" name="ln(Masa)" stroke="#4F5752" tick={{ fontSize: 10 }} />
                              <YAxis type="number" dataKey="logTasa" name="ln(Tasa)" stroke="#4F5752" tick={{ fontSize: 10 }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Scatter name={`${cl.nombre} (Log)`} data={cData} fill={cl.color} stroke="#1F2421" />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* BLOQUE 2: CLÚSTERES */}
        {activeTab === 'bloque2' && (
          <section className="space-y-6">
            
            {/* SELECTOR DE CLÚSTER */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-paperLine">
              <div className="flex flex-wrap gap-2">
                {['mamiferos', 'aves', 'reptiles', 'peces'].map((k) => {
                  const cl = CLUSTER_CONFIG?.[k] || {};
                  const isSel = activeClusterKey === k;
                  const col = cl.color || '#1F6E77';
                  const label = cl.nombre || (k.charAt(0).toUpperCase() + k.slice(1));
                  return (
                    <button
                      key={k}
                      onClick={() => {
                        setActiveClusterKey(k);
                        setSelectedModelName('Potencial');
                      }}
                      style={{
                        borderColor: isSel ? col : 'transparent',
                        backgroundColor: isSel ? col : '#E4DFD3',
                        color: isSel ? '#ffffff' : '#1F2421'
                      }}
                      className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition shadow-sm flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isSel ? '#fff' : col }} />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Subtabs del Clúster */}
              <div className="flex flex-wrap gap-1 bg-paperDark p-1 rounded-md border border-paperLine text-xs">
                <button
                  onClick={() => setActiveSubTab('graficos')}
                  className={`px-3 py-1 rounded font-mono ${activeSubTab === 'graficos' ? 'bg-white text-ink shadow-sm' : 'text-inkMuted'}`}
                >
                  Gráficos Duales
                </button>
                <button
                  onClick={() => setActiveSubTab('modelos')}
                  className={`px-3 py-1 rounded font-mono ${activeSubTab === 'modelos' ? 'bg-white text-ink shadow-sm' : 'text-inkMuted'}`}
                >
                  5 Modelos & r²
                </button>
                <button
                  onClick={() => setActiveSubTab('residuos')}
                  className={`px-3 py-1 rounded font-mono ${activeSubTab === 'residuos' ? 'bg-white text-ink shadow-sm' : 'text-inkMuted'}`}
                >
                  Análisis Residual & Distancias
                </button>
                <button
                  onClick={() => setActiveSubTab('deduccion')}
                  className={`px-3 py-1 rounded font-mono flex items-center gap-1.5 ${activeSubTab === 'deduccion' ? 'bg-white text-ink font-bold shadow-sm' : 'text-inkMuted'}`}
                >
                  Deducción & Ecuaciones Normales
                </button>
              </div>
            </div>

            {/* BANNER CLÚSTER */}
            <div 
              className="p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
              style={{ backgroundColor: `${badgeColor}12`, borderColor: `${badgeColor}40` }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold uppercase border bg-white/70">
                    {currentCluster.subtitulo || '22 especies'}
                  </span>
                  <span className="text-xs font-mono text-inkMuted">22 especies</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-ink mt-1">
                  {currentCluster.nombre || activeClusterKey}: Modelo Ganador{' '}
                  <span className="font-mono" style={{ color: badgeColor }}>
                    {currentClusterModels['Potencial'].eq}
                  </span>
                </h3>
              </div>

              <div className="bg-white/80 p-3 rounded-lg border border-paperLine text-right shrink-0">
                <p className="text-[11px] font-mono text-inkMuted">Coeficiente de Determinación</p>
                <p className="text-xl font-mono font-bold text-emerald-700">
                  r² = {currentClusterModels['Potencial'].r2}
                </p>
                <p className="text-[11px] font-mono text-inkMuted">
                  Exponente b = {currentCluster.b || 0.75}
                </p>
              </div>
            </div>

            {/* SUB-PESTAÑA 1: GRÁFICOS (ALTURA 540px) */}
            {activeSubTab === 'graficos' && (
              <div className="space-y-4">
                
                {/* SELECTOR DE MODELOS + ESCALA */}
                <div className="bg-white p-4 rounded-xl border border-paperLine shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-paperLine">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-peces" />
                      <span className="text-xs font-mono font-bold uppercase text-ink">
                        Modelo en Gráfica:
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setScaleMode('normal')}
                        className={`px-3 py-1 text-xs rounded border transition font-mono ${scaleMode === 'normal' ? 'bg-ink text-paper border-ink font-semibold' : 'bg-paper text-ink border-paperLine'}`}
                      >
                        Escala Normal (kg vs W)
                      </button>
                      <button
                        onClick={() => setScaleMode('loglog')}
                        className={`px-3 py-1 text-xs rounded border transition font-mono ${scaleMode === 'loglog' ? 'bg-ink text-paper border-ink font-semibold' : 'bg-paper text-ink border-paperLine'}`}
                      >
                        Escala Log-Log [ln(x) vs ln(y)]
                      </button>
                    </div>
                  </div>

                  {/* Pills de los 5 Modelos */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {MODEL_NAMES.map((mName) => {
                      const isSel = selectedModelName === mName;
                      const mObj = currentClusterModels[mName];
                      return (
                        <button
                          key={mName}
                          onClick={() => setSelectedModelName(mName)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 border ${
                            isSel 
                              ? 'bg-ink text-white border-ink shadow-sm' 
                              : 'bg-paper hover:bg-paperDark text-ink border-paperLine'
                          }`}
                        >
                          {mObj.estado === 'winner' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {mObj.estado === 'trap' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                          <span>{mName}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded ${isSel ? 'bg-white/20 text-white' : 'bg-paperDark text-inkMuted'}`}>
                            r²: {mObj.r2}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* GRÁFICA AMPLIADA A 540px */}
                <div className="bg-white rounded-xl p-5 border border-paperLine shadow-sm">
                  <div className="mb-3">
                    <h4 className="font-serif font-bold text-base text-ink">
                      {scaleMode === 'normal' 
                        ? `Dispersión y Curva Ajustada (${selectedModelName}) en Escala Real (kg vs W)`
                        : `Linealización Logarítmica: Demostración de la Ley de Kleiber`}
                    </h4>
                    <p className="text-xs text-inkMuted">
                      {scaleMode === 'normal'
                        ? "Pasa el cursor sobre los puntos para examinar cada especie. La curva negra representa el modelo seleccionado."
                        : "En la escala log-log, la relación se transforma en una recta pura [ln(y) = ln(a) + b·ln(x)], evidenciando que el modelo potencial es el ajuste biológico natural."}
                    </p>
                  </div>

                  <div className="h-[540px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {scaleMode === 'normal' ? (
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
                          <XAxis type="number" dataKey="masa" name="Masa" unit=" kg" stroke="#4F5752" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                          <YAxis type="number" dataKey="tasa" name="Tasa" unit=" W" stroke="#4F5752" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                          <ZAxis range={[65, 65]} />
                          <Tooltip content={<CustomTooltip />} />
                          <Scatter name={`Curva ${selectedModelName}`} data={curveData} line={{ stroke: '#1F2421', strokeWidth: 2 }} shape={() => null} legendType="none" />
                          <Scatter name="Especies" data={chartData} fill={badgeColor} stroke="#1F2421" strokeWidth={1.5} />
                        </ScatterChart>
                      ) : (
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
                          <XAxis type="number" dataKey="logMasa" name="ln(Masa)" stroke="#4F5752" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                          <YAxis type="number" dataKey="logTasa" name="ln(Tasa)" stroke="#4F5752" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                          <ZAxis range={[65, 65]} />
                          <Tooltip content={<CustomTooltip />} />
                          <Scatter name={`Curva ${selectedModelName}`} data={curveData} line={{ stroke: '#1F2421', strokeWidth: 2 }} shape={() => null} legendType="none" />
                          <Scatter name="Especies (Log-Log)" data={chartData} fill={badgeColor} stroke="#1F2421" strokeWidth={1.5} />
                        </ScatterChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-PESTAÑA 2: TABLA DE LOS 5 MODELOS CON VEREDICTO EXPLAYADO */}
            {activeSubTab === 'modelos' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-paperLine overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-paperDark border-b border-paperLine font-mono uppercase text-inkMuted text-[11px]">
                      <tr>
                        <th className="p-3 w-32">Modelo</th>
                        <th className="p-3 w-60">Ecuación Resultante</th>
                        <th className="p-3 w-28 font-mono">r²</th>
                        <th className="p-3">Veredicto y Justificación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paperLine/60">
                      {MODEL_NAMES.map((mName, idx) => {
                        const m = currentClusterModels[mName];
                        return (
                          <tr 
                            key={idx} 
                            className={m.estado === 'winner' ? 'bg-emerald-50/60 font-semibold' : m.estado === 'trap' ? 'bg-amber-50/70' : 'hover:bg-white'}
                          >
                            <td className="p-3 font-medium flex items-center gap-2">
                              {m.estado === 'winner' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                              {m.estado === 'trap' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                              {mName}
                            </td>
                            <td className="p-3 font-mono text-xs">{m.eq}</td>
                            <td className="p-3 font-mono font-bold">{m.r2}</td>
                            <td className="p-3 text-xs leading-relaxed text-ink/90">
                              {m.veredicto}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* DETALLE TRAMPA */}
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold font-serif text-amber-900">
                        {currentCluster.trampaTitulo || 'Análisis Crítico de Bondad de Ajuste'}
                      </h4>
                      <p className="text-xs md:text-sm mt-1 leading-relaxed whitespace-pre-line text-amber-900">
                        {currentCluster.trampaTexto || 'En este clúster se comparan rigurosamente los residuos en escala real (W) para desenmascarar trampas matemáticas provocadas por transformaciones de variables.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-PESTAÑA 3: ANÁLISIS RESIDUAL CON ESCALA FIJA, CLAMPING DE OUTLIERS Y SS_RES */}
            {activeSubTab === 'residuos' && (
              <div className="space-y-6">
                
                {/* SELECTORES DE MODELO, MÉTRICA Y MEDIDAS SS_RES */}
                <div className="bg-white p-4 rounded-xl border border-paperLine space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-paperLine">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase text-ink">Modelo evaluado en residuos:</span>
                      <p className="text-xs text-inkMuted">
                        Escala vertical compartida para los 5 modelos del clúster (permite comparación visual directa).
                      </p>
                    </div>

                    {/* Alternar Residuo Absoluto (W) vs Porcentual (%) */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setResidualType('absoluto')}
                        className={`px-3 py-1 text-xs rounded border font-mono transition ${residualType === 'absoluto' ? 'bg-ink text-paper border-ink font-semibold' : 'bg-paper text-ink border-paperLine'}`}
                      >
                        Residuo Absoluto (W)
                      </button>
                      <button
                        onClick={() => setResidualType('porcentual')}
                        className={`px-3 py-1 text-xs rounded border font-mono transition flex items-center gap-1 ${residualType === 'porcentual' ? 'bg-ink text-paper border-ink font-semibold' : 'bg-paper text-ink border-paperLine'}`}
                      >
                        <Percent className="w-3 h-3" /> Residuo Relativo (%)
                      </button>
                    </div>
                  </div>

                  {/* Pills de selección de modelo */}
                  <div className="flex flex-wrap gap-2">
                    {MODEL_NAMES.map((mName) => (
                      <button
                        key={mName}
                        onClick={() => setSelectedModelName(mName)}
                        className={`px-3 py-1 rounded text-xs font-mono border transition ${selectedModelName === mName ? 'bg-ink text-white border-ink font-semibold shadow-sm' : 'bg-paper hover:bg-paperDark text-ink border-paperLine'}`}
                      >
                        {mName}
                      </button>
                    ))}
                  </div>

                  {/* TARJETA DE SS_res (SUMA DE CUADRADOS DE RESIDUOS) */}
                  <div className="p-3 bg-paperDark/60 rounded-lg border border-paperLine flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono">
                    <div>
                      <span className="text-gray-500">Métrica Global de Error Cuadrático: </span>
                      <span className="font-bold text-ink text-sm">
                        SS_res = {ssResMap[selectedModelName]?.toLocaleString('es-AR', { maximumFractionDigits: 2 })} W²
                      </span>
                    </div>
                    <div className="text-[11px] text-inkMuted">
                      {selectedModelName === 'Potencial' ? (
                        <span className="text-emerald-800 font-bold">✓ Error residual mínimo y físicamente balanceado.</span>
                      ) : ssResMap[selectedModelName] > ssResMap['Potencial'] * 2 ? (
                        <span className="text-rose-700 font-bold">⚠ Error cuadrático inflado debido a desvíos extremos en escala real.</span>
                      ) : (
                        <span>Error cuadrático en unidades de potencia.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* GRÁFICO DE RESIDUOS CON EJE FIJO Y ADVERTENCIA DE OUTLIERS */}
                <div className="bg-white rounded-xl p-5 border border-paperLine shadow-sm">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-serif font-bold text-base text-ink">
                        Distribución de Residuos: {selectedModelName} ({residualType === 'absoluto' ? 'Watts' : '% relativo al valor real'})
                      </h4>
                      <p className="text-xs text-inkMuted">
                        Eje Y fijado en [{residualType === 'absoluto' ? `-${maxResidualLimit} W, +${maxResidualLimit} W` : `-${maxPercentLimit}%, +${maxPercentLimit}%`}] para {currentCluster.nombre}.
                      </p>
                    </div>

                    {(chartData.some(d => residualType === 'absoluto' ? d.isOutlierW : d.isOutlierPct)) && (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-mono font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        Puntos extremos fijados en el borde
                      </span>
                    )}
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
                        <XAxis type="number" dataKey="masa" name="Masa" unit=" kg" stroke="#4F5752" tick={{ fontSize: 11 }} />
                        <YAxis 
                          type="number" 
                          dataKey={residualType === 'absoluto' ? 'residuoGraficoW' : 'residuoGraficoPct'} 
                          name={residualType === 'absoluto' ? 'Residuo' : 'Error'} 
                          unit={residualType === 'absoluto' ? ' W' : ' %'} 
                          stroke="#4F5752" 
                          tick={{ fontSize: 11 }} 
                          domain={residualType === 'absoluto' ? [-maxResidualLimit, maxResidualLimit] : [-maxPercentLimit, maxPercentLimit]}
                        />
                        <ReferenceLine y={0} stroke="#1F2421" strokeWidth={2} strokeDasharray="4 4" />
                        <Tooltip content={<CustomTooltip />} />
                        <Scatter 
                          name="Residuos" 
                          data={chartData} 
                          fill={activeModelObj.estado === 'winner' ? '#10B981' : '#E11D48'} 
                          stroke="#1F2421" 
                          strokeWidth={1} 
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="text-[11px] text-center font-mono text-inkMuted mt-1">
                    Nota de lectura: Si un modelo presenta puntos clavados en los bordes (+{residualType === 'absoluto' ? `${maxResidualLimit} W` : `${maxPercentLimit}%`}), significa que su residuo real supera la escala gráfica elegida para este clúster.
                  </p>
                </div>

                {/* TABLA NUMÉRICA COMPLETA CON RESIDUOS W Y RESIDUOS % */}
                <div className="bg-white rounded-xl border border-paperLine overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-paperLine bg-paperDark/50">
                    <h4 className="font-serif font-bold text-sm text-ink">
                      Auditoría Numérica Punto por Punto en Watts (W) y Error Relativo (%)
                    </h4>
                    <p className="text-xs text-inkMuted">
                      Datos exactos para {selectedModelName} en {currentCluster.nombre}.
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-paperDark border-b border-paperLine sticky top-0 uppercase text-[10px] text-inkMuted">
                        <tr>
                          <th className="p-2.5">Especie</th>
                          <th className="p-2.5">Masa (kg)</th>
                          <th className="p-2.5">Tasa Real (W)</th>
                          <th className="p-2.5 text-emerald-800">Predicción ({selectedModelName})</th>
                          <th className="p-2.5">Residuo (W)</th>
                          <th className="p-2.5">Error Relativo (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-paperLine/50">
                        {chartData.map((s, i) => {
                          const isWarn = Math.abs(s.residuoRealPct) > 80;
                          return (
                            <tr key={i} className="hover:bg-amber-50/40">
                              <td className="p-2.5 font-sans font-medium text-ink">{s.especie}</td>
                              <td className="p-2.5">{s.masa}</td>
                              <td className="p-2.5 font-bold">{s.tasa}</td>
                              <td className="p-2.5 text-emerald-700">{s.predActual}</td>
                              <td className={`p-2.5 font-bold ${Math.abs(s.residuoRealW) > 20 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                {s.residuoRealW > 0 ? `+${s.residuoRealW}` : s.residuoRealW} W
                              </td>
                              <td className={`p-2.5 font-bold ${isWarn ? 'text-rose-800' : 'text-emerald-700'}`}>
                                {s.residuoRealPct > 0 ? `+${s.residuoRealPct}` : s.residuoRealPct}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-PESTAÑA 4: PASO A PASO Y DEDUCCIÓN ANALÍTICA */}
            {activeSubTab === 'deduccion' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-6 border border-paperLine shadow-sm space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-peces font-bold">
                      Procedimiento Matemático Exigido · Mínimos Cuadrados
                    </span>
                    <h3 className="text-xl font-serif font-bold text-ink mt-1">
                      Deducción Analítica del Modelo Potencial: {currentCluster.nombre}
                    </h3>
                    <p className="text-xs text-inkMuted mt-1">
                      Demostración paso a paso de la linealización por logaritmos neperianos y resolución del Sistema de Ecuaciones Normales según el apunte de cátedra.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-paperDark/50 border border-paperLine">
                      <h4 className="font-serif font-bold text-sm text-ink mb-1">
                        Paso 1: Expresión y Linealización
                      </h4>
                      <p className="text-xs text-inkMuted mb-2">
                        Se aplica logaritmo natural a ambos miembros de la función alométrica:
                      </p>
                      <div className="p-2.5 bg-white rounded border border-paperLine font-mono text-xs text-ink space-y-1">
                        <p className="font-bold">y = a · xᵇ</p>
                        <p>ln(y) = ln(a · xᵇ)</p>
                        <p className="text-emerald-800 font-bold">ln(y) = ln(a) + b · ln(x)</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-paperDark/50 border border-paperLine">
                      <h4 className="font-serif font-bold text-sm text-ink mb-1">
                        Paso 2: Transformación de Variables
                      </h4>
                      <p className="text-xs text-inkMuted mb-2">
                        Se define el cambio de variable para convertirlo en un ajuste lineal estándar:
                      </p>
                      <div className="p-2.5 bg-white rounded border border-paperLine font-mono text-xs text-ink space-y-1">
                        <p>Y = ln(y)  |  X = ln(x)</p>
                        <p>A = ln(a)  |  B = b</p>
                        <p className="text-peces font-bold">Y = A + B · X</p>
                      </div>
                    </div>
                  </div>

                  {/* SISTEMA NORMAL */}
                  <div className="p-4 rounded-lg bg-paperDark/40 border border-paperLine">
                    <h4 className="font-serif font-bold text-sm text-ink mb-1">
                      Paso 3: Planteo del Sistema de Ecuaciones Normales (2 × 2)
                    </h4>
                    <p className="text-xs text-inkMuted mb-3">
                      Derivando la suma de cuadrados de residuos S = Σ(Yᵢ - (A + B·Xᵢ))² respecto de A y B e igualando a cero:
                    </p>
                    
                    <div className="p-4 bg-white rounded-lg border border-paperLine overflow-x-auto">
                      <div className="font-mono text-xs text-center space-y-2">
                        <p className="text-gray-500 font-semibold">Forma Matricial General:</p>
                        <p className="font-bold text-sm text-ink">
                          [ n &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Σ ln(xᵢ) ] [ A ] &nbsp;=&nbsp; [ Σ ln(yᵢ) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]<br/>
                          [ Σ ln(xᵢ) &nbsp;&nbsp;&nbsp;&nbsp; Σ ln(xᵢ)² ] [ B ] &nbsp;=&nbsp; [ Σ (ln(xᵢ)·ln(yᵢ)) ]
                        </p>
                      </div>
                    </div>

                    {/* VALORES NUMÉRICOS CALCULADOS */}
                    <div className="mt-4 p-4 bg-amber-50/70 rounded-lg border border-amber-300">
                      <p className="text-xs font-mono font-bold text-amber-950 uppercase mb-2">
                        Valores Numéricos Obtenidos para {currentCluster.nombre} (n = {normalEquationData.n}):
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs">
                        <div className="p-2 bg-white rounded border border-amber-200">
                          <span className="text-gray-500 block">Σ ln(xᵢ)</span>
                          <span className="font-bold text-ink">{normalEquationData.sumX}</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-amber-200">
                          <span className="text-gray-500 block">Σ ln(yᵢ)</span>
                          <span className="font-bold text-ink">{normalEquationData.sumY}</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-amber-200">
                          <span className="text-gray-500 block">Σ ln(xᵢ)²</span>
                          <span className="font-bold text-ink">{normalEquationData.sumX2}</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-amber-200">
                          <span className="text-gray-500 block">Σ ln(xᵢ)·ln(yᵢ)</span>
                          <span className="font-bold text-ink">{normalEquationData.sumXY}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                        <div>
                          <p className="text-amber-900">1. Coeficientes en Espacio Lineal:</p>
                          <p className="font-bold text-ink">A = {normalEquationData.A} &nbsp;|&nbsp; B = {normalEquationData.b}</p>
                        </div>
                        <div>
                          <p className="text-amber-900">2. Retorno a Variables Físicas:</p>
                          <p className="font-bold text-emerald-800">
                            a = e^(A) = e^({normalEquationData.A}) = {normalEquationData.a} &nbsp;|&nbsp; b = B = {normalEquationData.b}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-300 text-xs font-mono text-emerald-950 flex items-center justify-between">
                    <span>Ecuación Potencial Final:</span>
                    <span className="font-bold text-sm text-emerald-900">
                      y = {normalEquationData.a} · x^{normalEquationData.b}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* BLOQUE 3: COMPARACIÓN Y CONCLUSIONES PRECISAS */}
        {activeTab === 'bloque3' && (
          <section className="space-y-6">
            <div className="bg-white/80 rounded-xl p-6 border border-paperLine shadow-sm">
              <span className="text-xs font-mono uppercase tracking-wider text-peces font-bold">Bloque III — Síntesis Comparativa</span>
              <h2 className="text-2xl md:text-3xl font-bold font-serif mt-1 mb-4 text-ink">
                Confirmación Universal de la Ley de Kleiber
              </h2>

              {/* TABLA COMPARATIVA */}
              <div className="overflow-x-auto my-6 border border-paperLine rounded-lg">
                <table className="w-full text-left text-xs md:text-sm font-sans">
                  <thead className="bg-paperDark border-b border-paperLine font-mono text-[11px] uppercase text-inkMuted">
                    <tr>
                      <th className="p-3">Clúster Biológico</th>
                      <th className="p-3">Estrategia Térmica</th>
                      <th className="p-3">Ecuación Potencial Ajustada</th>
                      <th className="p-3 font-mono">r²</th>
                      <th className="p-3 font-mono">Exponente b (≈ ¾)</th>
                      <th className="p-3 font-mono">Constante base 'a'</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paperLine/60">
                    <tr className="bg-white">
                      <td className="p-3 font-semibold text-[#7A4632]">Mamíferos</td>
                      <td className="p-3">Endotermo</td>
                      <td className="p-3 font-mono text-xs">y = 3.469 · x^0.7423</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">0.9937</td>
                      <td className="p-3 font-mono font-bold">0.7423</td>
                      <td className="p-3 font-mono">3.469 W</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 font-semibold text-[#2F6690]">Aves</td>
                      <td className="p-3">Endotermo</td>
                      <td className="p-3 font-mono text-xs">y = 4.822 · x^0.7519</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">0.9743</td>
                      <td className="p-3 font-mono font-bold">0.7519</td>
                      <td className="p-3 font-mono">4.822 W</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 font-semibold text-[#4C6B3F]">Reptiles</td>
                      <td className="p-3">Ectotermo</td>
                      <td className="p-3 font-mono text-xs">y = 0.675 · x^0.8035</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">0.9796</td>
                      <td className="p-3 font-mono font-bold">0.8035</td>
                      <td className="p-3 font-mono">0.675 W</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 font-semibold text-[#1F6E77]">Peces</td>
                      <td className="p-3">Ectotermo</td>
                      <td className="p-3 font-mono text-xs">y = 0.492 · x^0.7806</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">0.9840</td>
                      <td className="p-3 font-mono font-bold">0.7806</td>
                      <td className="p-3 font-mono">0.492 W</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* LÍNEA DE REPTILES (PUNTO 4 SOLICITADO) 
              <p className="text-xs font-mono text-inkMuted bg-amber-50/80 p-2.5 rounded-lg border border-amber-200">
                * <strong>Observación abierta para la exposición:</strong> El clúster de <strong>Reptiles</strong> presenta el exponente <em>b</em> más alto de los cuatro grupos biológicos (<strong>0.8035</strong>), situándose ligeramente por encima de los ¾ teóricos, lo que plantea una interesante discusión sobre la termorregulación pasiva y la inercia térmica en grandes saurios.
              </p>*/}

              {/* INTERPRETACIONES FÍSICAS CORREGIDAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="p-5 rounded-xl bg-paperDark/60 border border-paperLine">
                  <h4 className="font-serif font-bold text-ink text-base mb-2">
                    1. La Economía de Escala Metabólica
                  </h4>
                  <p className="text-xs md:text-sm text-inkMuted leading-relaxed">
                    En los 4 clústeres, los exponentes se ubican estrictamente en el intervalo <strong>0.74 ≤ b ≤ 0.80</strong>, extraordinariamente cercanos a <strong>0.75 (¾)</strong>. Esto prueba que el metabolismo <strong>no es lineal (b = 1)</strong>: un animal que duplica su peso no duplica su requerimiento energético. Los tejidos de animales mayores operan con una tasa energética notablemente más económica.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-paperDark/60 border border-paperLine">
                  <h4 className="font-serif font-bold text-ink text-base mb-2">
                    2. Endotermos vs. Ectotermos: La Constante 'a'
                  </h4>
                  <p className="text-xs md:text-sm text-inkMuted leading-relaxed">
                    El valor del parámetro <strong>'a'</strong> evidencia el costo de la termorregulación activa: los endotermos consumen <strong>entre 5 y casi 10 veces más energía basal por unidad de masa</strong> que los ectotermos. Por ejemplo, Mamíferos (3.47 W) supera a Reptiles (0.68 W) por un factor de <strong>~5.1×</strong>, mientras que Aves (4.82 W) supera a Peces (0.49 W) por un factor de <strong>~9.8×</strong> (casi un orden de magnitud). No obstante, <em>la curvatura alométrica b se conserva</em> en todos los grupos.
                  </p>
                </div>
              </div>

              {/* CALLOUT DE PARES REALES VS PREDICHOS QUE EVIDENCIAN LAS TRAMPAS */}
              <div className="mt-6 p-4 rounded-xl border border-rose-300 bg-rose-50/70 text-rose-950">
                <h4 className="font-serif font-bold text-rose-900 text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  Evidencia Numérica de las Trampas Estadísticas (Valores Reales vs. Predicción)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-2.5 bg-white/90 rounded border border-rose-200 shadow-sm">
                    <p className="font-bold text-ink">Cabra (Mamífero · 45 kg)</p>
                    <p className="text-emerald-800">Tasa Real: 92.7 W</p>
                    <p className="text-rose-700 font-bold">Predicción Cociente: 6.04 W</p>
                    <span className="text-[10px] text-gray-500">Subestimación absurda por meseta</span>
                  </div>
                  <div className="p-2.5 bg-white/90 rounded border border-rose-200 shadow-sm">
                    <p className="font-bold text-ink">Elefante (Mamífero · 5000 kg)</p>
                    <p className="text-emerald-800">Tasa Real: 1941.8 W</p>
                    <p className="text-rose-700 font-bold">Predicción Cociente: 6.08 W</p>
                    <span className="text-[10px] text-gray-500">Error masivo superior a 1935 W</span>
                  </div>
                  <div className="p-2.5 bg-white/90 rounded border border-rose-200 shadow-sm">
                    <p className="font-bold text-ink">Gobio (Pez · 0.005 kg)</p>
                    <p className="text-emerald-800">Tasa Real: 0.0055 W</p>
                    <p className="text-rose-700 font-bold">Pred. Polinómico: 2.08 W</p>
                    <span className="text-[10px] text-gray-500">Error de más del 37.000% (y(0)≠0)</span>
                  </div>
                </div>
              </div>

              {/* CONCLUSIÓN FINAL REESTRUCTURADA Y CORREGIDA */}
              <div className="mt-6 p-5 rounded-xl bg-ink text-paper border border-ink">
                <h4 className="font-serif font-bold text-amber-200 text-lg mb-2">
                  Conclusión Final del Caso
                </h4>
                <p className="text-xs md:text-sm leading-relaxed text-gray-200">
                  <MathText text="En los 4 clústeres analizados, la relación entre masa y metabolismo basal se describe fielmente mediante el modelo potencial ($y = a \cdot x^b$), con exponentes consistentemente sublineales ($b$ entre 0.74 y 0.80, cercanos a $\frac{3}{4}$), demostrando la validez universal de la Ley de Kleiber. En Mamíferos, el modelo con mayor $r^2$ numérico (Cociente) y en Peces, los dos modelos con mayor $r^2$ numérico (Polinómico y Cociente), resultaron ser artefactos estadísticos inadmisibles que saturan o violan $y(0)=0$. El modelo Potencial es el único que respeta las seis órdenes de magnitud (desde 5 g a 12.000 kg), sustentado por evidencia gráfica (log-log recto), residuos en escala real sin patrones y coherencia alométrica." />
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-paperLine bg-paper py-4 text-center text-xs font-mono text-inkMuted">
        Análisis Numérico · UTN FRLP · Caso 4
      </footer>
    </div>
  );
}