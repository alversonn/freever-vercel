// src/lib/diagnosis.ts
export type WarningFlags = {
    pulseWeak?: boolean;
    consciousnessPoor?: boolean;
    oxygenSaturation?: number; // SpO2
    // optional warning signs (pakai kalau field ini memang ada di form kamu)
    nausea?: boolean;
    vomiting?: boolean;
    lossOfAppetite?: boolean;
    severeBleeding?: boolean;
    respiratoryProblems?: boolean;
    seizure?: boolean;
    severeDehydration?: boolean;
    shockSign?: boolean;
  };
  
  export type LabInputs = {
    leukocyteCount: number | null | undefined;
    neutrophilCount: number | null | undefined;
    lymphocyteCount: number | null | undefined;
    crpLevel: number | null | undefined; // opsional
  };
  
  export type DiagnosisResult = {
    probable: "Bacterial Infection" | "Viral Infection";
    nlcr: number; // 0 kalau tidak bisa dihitung
    needsReferral: boolean;
    reasons: string[]; // daftar alasan rujukan
    recommendation: string; // gabungan saran klinis + rujukan (jika perlu)
  };
  
  export function computeDiagnosisAndReferral(
    warn: WarningFlags,
    labs: LabInputs
  ): DiagnosisResult {
    const reasons: string[] = [];
    const { pulseWeak, consciousnessPoor } = warn;
    const spo2 = typeof warn.oxygenSaturation === "number" ? warn.oxygenSaturation : undefined;
  
    // emergency triggers
    if (pulseWeak) reasons.push("Weak pulse");
    if (consciousnessPoor) reasons.push("Poor consciousness");
    if (typeof spo2 === "number" && spo2 <= 94) reasons.push("SpO₂ ≤ 94%");
  
    // optional warning signs
    if (warn.nausea) reasons.push("Nausea");
    if (warn.vomiting) reasons.push("Vomiting");
    if (warn.lossOfAppetite) reasons.push("Loss of appetite");
    if (warn.severeBleeding) reasons.push("Severe bleeding");
    if (warn.respiratoryProblems) reasons.push("Respiratory problems");
    if (warn.seizure) reasons.push("Seizure");
    if (warn.severeDehydration) reasons.push("Severe dehydration");
    if (warn.shockSign) reasons.push("Shock sign");
  
    const needsReferral = reasons.length > 0;
  
    // ----- Probable diagnosis dari hasil lab -----
    const leuk = toNum(labs.leukocyteCount) ?? 0;
    const neut = toNum(labs.neutrophilCount) ?? 0;
    const lymph = toNum(labs.lymphocyteCount) ?? 0;
    const crp = labs.crpLevel == null ? 0 : toNum(labs.crpLevel) ?? 0;
  
    let nlcr = 0;
    if (lymph > 0) nlcr = round2(neut / lymph);
  
    let probable: DiagnosisResult["probable"] = "Viral Infection";
    if (leuk > 10000 || nlcr > 3.53 || crp > 40) probable = "Bacterial Infection";
  
    // saran klinis dasar
    let recommendation =
      probable === "Bacterial Infection"
        ? "Consider antibiotic therapy with appropriate dosage based on patient weight and condition."
        : "Provide symptomatic treatment (e.g., paracetamol) and supplements. Avoid antibiotics.";
  
    // tambahkan advice rujukan jika perlu
    if (needsReferral) {
      recommendation += ` Also, due to warning/emergency sign(s): ${reasons.join(
        ", "
      )}, please refer the patient to the nearest hospital.`;
    }
  
    return { probable, nlcr, needsReferral, reasons, recommendation };
  }
  
  function toNum(v: number | null | undefined) {
    if (v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  function round2(n: number) {
    return Math.round(n * 100) / 100;
  }
  