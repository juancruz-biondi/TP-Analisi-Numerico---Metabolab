from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dataset import DATASET
from regression import fit_models_for_cluster

app = FastAPI(title="MetaboLab API - Caso 4")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/clusters")
def get_clusters():
    return list(DATASET.keys())

@app.get("/api/data/{cluster_name}")
def get_cluster_data(cluster_name: str):
    name = cluster_name.lower()
    if name not in DATASET:
        return {"error": "Cluster no encontrado"}
    
    data = DATASET[name]
    models = fit_models_for_cluster(data)
    
    # Preparar tabla con predicciones y residuos en escala REAL (W)
    residuals_table = []
    for d in data:
        m = d["masa"]
        t_real = d["tasa"]
        pred_pot = float(models["potencial"]["predict"](m))
        pred_coc = float(models["cociente"]["predict"](m))
        pred_poly = float(models["polinomico"]["predict"](m))

        residuals_table.append({
            "especie": d["especie"],
            "masa": m,
            "tasa_real": t_real,
            "pred_potencial": round(pred_pot, 4),
            "residuo_potencial": round(t_real - pred_pot, 4),
            "pred_cociente": round(pred_coc, 4),
            "residuo_cociente": round(t_real - pred_coc, 4),
            "pred_polinomico": round(pred_poly, 4),
            "residuo_polinomico": round(t_real - pred_poly, 4)
        })

    return {
        "cluster": name,
        "species_count": len(data),
        "data": data,
        "models_summary": {k: {"eq": v["eq"], "r2": round(v["r2"], 5)} for k, v in models.items()},
        "residuals": residuals_table
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)