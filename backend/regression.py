import numpy as np

def fit_models_for_cluster(data):
    x = np.array([d["masa"] for d in data], dtype=float)
    y = np.array([d["tasa"] for d in data], dtype=float)
    n = len(x)

    def calc_r2(y_obs, y_fit):
        st = np.sum((y_obs - np.mean(y_obs))**2)
        sr = np.sum((y_obs - y_fit)**2)
        return float(1.0 - (sr / st)) if st != 0 else 0.0

    # 1. Lineal: y = a1 + a2*x
    p_lin = np.polyfit(x, y, 1) # [a2, a1]
    y_lin = np.polyval(p_lin, x)
    r2_lin = calc_r2(y, y_lin)

    # 2. Exponencial: ln(y) = ln(a) + b*x
    p_exp = np.polyfit(x, np.log(y), 1)
    b_exp, ln_a_exp = p_exp[0], p_exp[1]
    a_exp = np.exp(ln_a_exp)
    r2_exp = calc_r2(np.log(y), ln_a_exp + b_exp * x)

    # 3. Potencial: ln(y) = ln(a) + b*ln(x)
    p_pot = np.polyfit(np.log(x), np.log(y), 1)
    b_pot, ln_a_pot = p_pot[0], p_pot[1]
    a_pot = np.exp(ln_a_pot)
    r2_pot = calc_r2(np.log(y), ln_a_pot + b_pot * np.log(x))

    # 4. Polinómico g2: y = a1 + a2*x + a3*x^2
    p_poly = np.polyfit(x, y, 2) # [a3, a2, a1]
    y_poly = np.polyval(p_poly, x)
    r2_poly = calc_r2(y, y_poly)

    # 5. Cociente: 1/y = 1/a + (b/a)*(1/x) => Y = A + B*X
    inv_x = 1.0 / x
    inv_y = 1.0 / y
    p_coc = np.polyfit(inv_x, inv_y, 1) # [B, A]
    B, A = p_coc[0], p_coc[1]
    a_coc = 1.0 / A if A != 0 else 0.0
    b_coc = B * a_coc
    r2_coc = calc_r2(inv_y, A + B * inv_x)

    return {
        "lineal": {"eq": f"y = {p_lin[1]:.2f} + {p_lin[0]:.4f}x", "r2": r2_lin, "predict": lambda v: p_lin[1] + p_lin[0]*v},
        "exponencial": {"eq": f"y = {a_exp:.3f}·e^({b_exp:.5f}x)", "r2": r2_exp, "predict": lambda v: a_exp * np.exp(b_exp * v)},
        "potencial": {"eq": f"y = {a_pot:.3f}·x^{b_pot:.4f}", "r2": r2_pot, "a": float(a_pot), "b": float(b_pot), "predict": lambda v: a_pot * (v**b_pot)},
        "polinomico": {"eq": f"y = {p_poly[2]:.3f} + {p_poly[1]:.4f}x - {abs(p_poly[0]):.7f}x²" if p_poly[0]<0 else f"y = {p_poly[2]:.3f} + {p_poly[1]:.4f}x + {p_poly[0]:.7f}x²", "r2": r2_poly, "predict": lambda v: np.polyval(p_poly, v)},
        "cociente": {"eq": f"y = {a_coc:.3f}·x/({b_coc:.4f}+x)", "r2": r2_coc, "predict": lambda v: (a_coc*v)/(b_coc+v) if (b_coc+v)!=0 else 0.0}
    }