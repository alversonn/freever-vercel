"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertTriangle,
  FlaskConical,
  Stethoscope,
  Save,
  CircleCheck,
  User,
  Thermometer,
  TestTube2,
  FileText,
} from "lucide-react";
import type { CheckedState } from "@radix-ui/react-checkbox";
import Protected from "@/components/auth/Protected";

/* ================== Types ================== */
interface FormData {
  name: string;
  age: string;
  gender: string;
  dateOfBirth: string;

  // Emergency block
  pulseWeak: boolean;
  consciousnessPoor: boolean;
  oxygenSaturation: number | string;

  // Warning signs
  nausea: boolean;
  vomiting: boolean;
  lossOfAppetite: boolean;
  severeBleeding: boolean;
  respiratoryProblems: boolean;
  seizure: boolean;
  severeDehydration: boolean;
  shockSign: boolean;

  // Labs
  leukocyteCount: number | string;
  neutrophilCount: number | string;
  lymphocyteCount: number | string;
  crpLevel: number | string | null; // optional
  feverDuration: number | string;

  // Results
  nlcrResult: number;
  diagnosis: string;
  recommendation: string;
  sensitivity: number;
  specificity: number;
}

const initialFormData: FormData = {
  name: "",
  age: "",
  gender: "Male",
  dateOfBirth: "",

  pulseWeak: false,
  consciousnessPoor: false,
  oxygenSaturation: 98,

  nausea: false,
  vomiting: false,
  lossOfAppetite: false,
  severeBleeding: false,
  respiratoryProblems: false,
  seizure: false,
  severeDehydration: false,
  shockSign: false,

  leukocyteCount: "",
  neutrophilCount: "",
  lymphocyteCount: "",
  crpLevel: null,
  feverDuration: "",

  nlcrResult: 0,
  diagnosis: "",
  recommendation: "",
  sensitivity: 0,
  specificity: 0,
};

const WARNING_LABELS = {
  nausea: "Nausea (Mual)",
  vomiting: "Vomiting (Muntah)",
  lossOfAppetite: "No appetite (Tidak nafsu makan)",
  severeBleeding: "Severe bleeding (Pendarahan hebat)",
  respiratoryProblems: "Severe respiratory problems (Masalah pernapasan yang parah)",
  seizure: "Seizures (Kejang)",
  severeDehydration: "Severe dehydration (Dehidrasi yang parah)",
  shockSign: "Shock signs (Tanda-tanda syok)",
} as const;
type WarningKey = keyof typeof WARNING_LABELS;

/* ============== Utilities (local) ============== */
const toNum = (v: number | string | null | undefined): number | undefined => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function buildReferralReasons(fd: FormData): string[] {
  const reasons: string[] = [];
  // emergency
  if (fd.pulseWeak) reasons.push("Weak pulse (Nadi lemah)");
  if (fd.consciousnessPoor) reasons.push("Poor consciousness (Kesadaran buruk)");
  const spo2 = toNum(fd.oxygenSaturation);
  if (typeof spo2 === "number" && spo2 <= 94) reasons.push("SpO₂ ≤ 94%");

  // warnings
  (Object.keys(WARNING_LABELS) as WarningKey[]).forEach((key) => {
    if (fd[key]) reasons.push(WARNING_LABELS[key]);
  });

  return reasons;
}

/* ================== Component ================== */
function AssessmentContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Auto-calc age
  useEffect(() => {
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const md = today.getMonth() - birthDate.getMonth();
      if (md < 0 || (md === 0 && today.getDate() < birthDate.getDate())) age--;
      setFormData((p) => ({ ...p, age: String(age >= 0 ? age : 0) }));
    } else {
      setFormData((p) => ({ ...p, age: "" }));
    }
  }, [formData.dateOfBirth]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
      }));
    },
    []
  );

  const handleCheckboxChange = useCallback(
    (key: keyof FormData, v: CheckedState) => {
      setFormData((prev) => ({ ...prev, [key]: v === true }));
    },
    []
  );

  const handleGenderChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }));
  }, []);

  // === NEXT/BACK ===
  const handleNext = useCallback(() => {
    // Tidak ada auto-referral lagi → selalu lanjut ke step berikutnya
    setCurrentStep((prev) => prev + 1);
  }, []);
  const handleBack = () => setCurrentStep((prev) => prev - 1);

  // === CALCULATE RESULTS (step 3 => 4) ===
  const handleCalculateResults = useCallback(() => {
    const newResults: FormData = { ...formData };

    // Numbers
    const leuk = toNum(formData.leukocyteCount) ?? 0;
    const neut = toNum(formData.neutrophilCount) ?? 0;
    const lymph = toNum(formData.lymphocyteCount) ?? 0;
    const crp = formData.crpLevel === null ? 0 : toNum(formData.crpLevel) ?? 0;

    // NLCR
    const nlcr = lymph > 0 ? round2(neut / lymph) : 0;
    newResults.nlcrResult = nlcr;

    // Sensitivity/Specificity by fever days
    const feverDays = toNum(formData.feverDuration) ?? 0;
    if (feverDays <= 5) {
      newResults.sensitivity = 94.3;
      newResults.specificity = 76.9;
    } else {
      newResults.sensitivity = 96.6;
      newResults.specificity = 89.2;
    }

    // Probable Dx
    const isBacterial = leuk > 10000 || nlcr >= 3.53 || crp >= 40;
    const isViral = leuk <= 10000 && nlcr < 3.53 && crp < 40;

    if (isBacterial) {
      newResults.diagnosis = "Most probable bacterial infection";
      newResults.recommendation =
        "Consider antibiotic therapy with appropriate dosage based on patient weight and condition.";
    } else if (isViral) {
      newResults.diagnosis = "Most probable viral infection";
      newResults.recommendation =
        "Provide symptomatic treatment (e.g., paracetamol) and supplements. Avoid antibiotics.";
    } else {
      newResults.diagnosis = "Inconclusive";
      newResults.recommendation =
        "Clinical judgment required. Consider additional tests or consultation.";
    }

    // Referral advice if any emergency/warning sign
    const reasons = buildReferralReasons(formData);
    if (reasons.length > 0) {
      newResults.recommendation += ` Also, due to warning/emergency sign(s): ${reasons.join(
        ", "
      )}, please refer the patient to the nearest hospital.`;
    }

    setFormData(newResults);
    setCurrentStep(4);
  }, [formData]);

  // === RESET & SAVE ===
  const handleNewAssessment = () => {
    setFormData(initialFormData);
    setCurrentStep(0);
  };

  const handleSaveAssessment = async () => {
    const payload = {
      name: formData.name,
      age: Number(formData.age),
      gender: formData.gender,
      dateOfBirth: new Date(formData.dateOfBirth),

      pulseWeak: formData.pulseWeak,
      consciousnessPoor: formData.consciousnessPoor,
      oxygenSaturation: toNum(formData.oxygenSaturation) ?? 0,

      nausea: formData.nausea,
      vomiting: formData.vomiting,
      lossOfAppetite: formData.lossOfAppetite,
      severeBleeding: formData.severeBleeding,
      respiratoryProblems: formData.respiratoryProblems,
      seizure: formData.seizure,
      severeDehydration: formData.severeDehydration,
      shockSign: formData.shockSign,

      leukocyteCount: toNum(formData.leukocyteCount) ?? 0,
      neutrophilCount: toNum(formData.neutrophilCount) ?? 0,
      lymphocyteCount: toNum(formData.lymphocyteCount) ?? 0,
      crpLevel:
        formData.crpLevel === null || formData.crpLevel === ""
          ? null
          : toNum(formData.crpLevel) ?? null,
      feverDuration: toNum(formData.feverDuration) ?? 0,

      nlcrResult: formData.nlcrResult,
      diagnosis: formData.diagnosis,
      recommendation: formData.recommendation,
      sensitivity: formData.sensitivity,
      specificity: formData.specificity,
    };

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to save assessment");
      }
      alert("Assessment saved successfully!");
      router.push("/records");
    } catch (err) {
      console.error("Save Error:", err);
      alert(
        `Failed to save assessment. Server says: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  /* ================== UI ================== */
  const StepIndicator = ({ step, title }: { step: number; title: string }) => (
    <div
      className={`flex items-center gap-2 ${
        currentStep >= step ? "text-blue-600" : "text-gray-400"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${
          currentStep >= step ? "border-blue-600 bg-blue-100" : "border-gray-300 bg-gray-50"
        }`}
      >
        {step}
      </div>
      <span className="hidden sm:inline">{title}</span>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold text-xl">
                <User size={24} /> Step 0: Patient Information
              </CardTitle>
              <CardDescription>
                Enter the patient&apos;s personal data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="name">Patient Name</Label>
                <Input
                  id="name"
                  name="name"
                  className="mt-2"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    className="mt-2"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age (years)</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    className="mt-2 bg-gray-100 cursor-not-allowed"
                    value={formData.age}
                    readOnly
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>

              <div>
                <Label>Gender</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={handleGenderChange}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleNext}
                  disabled={!formData.name || !formData.age || !formData.dateOfBirth}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </>
        );

      case 1:
        return (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold text-xl text-red-600">
                <Thermometer size={24} /> Step 1: Emergency Assessment
              </CardTitle>
              <CardDescription>
                Evaluate patient for emergency signs requiring hospital referral
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pulseWeak"
                    checked={formData.pulseWeak}
                    onCheckedChange={(v) => handleCheckboxChange("pulseWeak", v)}
                  />
                  <Label htmlFor="pulseWeak">Weak pulse (Nadi lemah)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consciousnessPoor"
                    checked={formData.consciousnessPoor}
                    onCheckedChange={(v) => handleCheckboxChange("consciousnessPoor", v)}
                  />
                  <Label htmlFor="consciousnessPoor">
                    Poor consciousness (Kesadaran buruk)
                  </Label>
                </div>

                <div className="flex items-center space-x-2 max-w-xs">
                  <Label htmlFor="oxygenSaturation" className="whitespace-nowrap">
                    Oxygen saturation (%):
                  </Label>
                  <Input
                    id="oxygenSaturation"
                    name="oxygenSaturation"
                    type="number"
                    value={formData.oxygenSaturation}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="text-sm font-medium text-red-800">
                  Warning Signs - Require Immediate Hospital Referral:
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  {(Object.entries(WARNING_LABELS) as Array<[WarningKey, string]>).map(
                    ([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={formData[key]}
                          onCheckedChange={(v) => handleCheckboxChange(key, v)}
                        />
                        <Label htmlFor={key} className="text-sm font-normal">
                          {label}
                        </Label>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={handleBack} variant="outline">
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </CardContent>
          </>
        );

      case 2: {
        const isLabFormIncomplete =
          formData.feverDuration === "" ||
          formData.leukocyteCount === "" ||
          formData.neutrophilCount === "" ||
          formData.lymphocyteCount === "";

        return (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold text-xl">
                <TestTube2 size={24} /> Step 2: Blood Test Results
              </CardTitle>
              <CardDescription>
                Enter complete blood count and CRP results
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <Label htmlFor="feverDuration">Days with fever:</Label>
                  <Input
                    id="feverDuration"
                    name="feverDuration"
                    type="number"
                    value={formData.feverDuration}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="leukocyteCount">Leukocytes (cells/µL):</Label>
                  <Input
                    id="leukocyteCount"
                    name="leukocyteCount"
                    type="number"
                    value={formData.leukocyteCount}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="neutrophilCount">Neutrophils (cells/µL):</Label>
                  <Input
                    id="neutrophilCount"
                    name="neutrophilCount"
                    type="number"
                    value={formData.neutrophilCount}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lymphocyteCount">Lymphocytes (cells/µL):</Label>
                  <Input
                    id="lymphocyteCount"
                    name="lymphocyteCount"
                    type="number"
                    value={formData.lymphocyteCount}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="crpLevel">CRP (mg/L) - Optional:</Label>
                  <Input
                    id="crpLevel"
                    name="crpLevel"
                    type="number"
                    value={formData.crpLevel ?? ""}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={handleBack} variant="outline">
                  Back
                </Button>
                <Button onClick={handleNext} disabled={isLabFormIncomplete}>
                  Next
                </Button>
              </div>
            </CardContent>
          </>
        );
      }

      case 3:
        return (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold text-xl">
                <FlaskConical size={22} /> Review and Calculate
              </CardTitle>
              <CardDescription>
                Review the entered data before calculating.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              <h4 className="font-semibold">Patient Data Summary:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm p-4 bg-gray-50 rounded-md">
                <p className="font-medium">Fever duration:</p>
                <p>{formData.feverDuration} days</p>

                <p className="font-medium">Leukocytes:</p>
                <p>{Number(formData.leukocyteCount).toLocaleString()} cells/µL</p>

                <p className="font-medium">Neutrophils:</p>
                <p>{Number(formData.neutrophilCount).toLocaleString()} cells/µL</p>

                <p className="font-medium">Lymphocytes:</p>
                <p>{Number(formData.lymphocyteCount).toLocaleString()} cells/µL</p>

                <p className="font-medium">CRP:</p>
                <p>{formData.crpLevel ? `${formData.crpLevel} mg/L` : "Not Tested"}</p>

                <p className="font-medium">NLCR:</p>
                <p>
                  {Number(formData.lymphocyteCount) > 0
                    ? (
                        Number(formData.neutrophilCount) /
                        Number(formData.lymphocyteCount)
                      ).toFixed(2)
                    : "N/A"}
                </p>
              </div>

              <div className="flex justify-between pt-6">
                <Button onClick={handleBack} variant="outline">
                  Back
                </Button>
                <Button
                  onClick={handleCalculateResults}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FlaskConical className="mr-2 h-4 w-4" /> Calculate Results
                </Button>
              </div>
            </CardContent>
          </>
        );

      case 4: {
        const referralReasons = buildReferralReasons(formData);
        const referralAdvised = referralReasons.length > 0;
        const isBacterialBanner = formData.diagnosis.toLowerCase().includes("bacterial");

        return (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold text-xl">
                <FileText size={22} /> Diagnosis Results
              </CardTitle>
              <CardDescription>
                Based on the assessment, the diagnosis is:
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <div
                className={`p-4 rounded-lg shadow-inner ${
                  referralAdvised
                    ? "bg-red-50"
                    : isBacterialBanner
                    ? "bg-orange-50"
                    : "bg-blue-50"
                }`}
              >
                <h4
                  className={`font-bold text-xl mb-2 flex items-center ${
                    referralAdvised
                      ? "text-red-700"
                      : isBacterialBanner
                      ? "text-orange-700"
                      : "text-blue-700"
                  }`}
                >
                  {referralAdvised ? (
                    <AlertTriangle className="mr-2 h-6 w-6" />
                  ) : (
                    <Stethoscope className="mr-2 h-6 w-6" />
                  )}
                  {formData.diagnosis}
                </h4>

                <p className="mb-3">{formData.recommendation}</p>

                {referralAdvised && (
                  <div className="mb-3">
                    <h5 className="font-semibold">Referral advised because:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-1">
                      {referralReasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-2 grid grid-cols-2 gap-x-4 text-sm text-gray-600">
                  <p>
                    <strong>NLCR:</strong> {formData.nlcrResult}
                  </p>
                  <p>
                    <strong>Sensitivity:</strong> {formData.sensitivity}%
                  </p>
                  <p>
                    <strong>Fever Duration:</strong> {formData.feverDuration} days
                  </p>
                  <p>
                    <strong>Specificity:</strong> {formData.specificity}%
                  </p>
                </div>
              </div>

              <div className="mt-2">
                <h5 className="font-semibold mb-2">Criteria Met:</h5>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>
                    Leukocytes {Number(formData.leukocyteCount) <= 10000 ? "≤" : ">"} 10,000 cells/μL
                  </li>
                  <li>NLCR {formData.nlcrResult < 3.53 ? "<" : "≥"} 3.53</li>
                  <li>
                    CRP{" "}
                    {formData.crpLevel === null || formData.crpLevel === ""
                      ? "Not tested"
                      : Number(formData.crpLevel) < 40
                      ? "< 40 mg/L"
                      : "≥ 40 mg/L"}
                  </li>
                </ul>
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={handleNewAssessment} variant="outline">
                  <CircleCheck className="mr-2 h-4 w-4" /> New Assessment
                </Button>
                <Button onClick={handleSaveAssessment}>
                  <Save className="mr-2 h-4 w-4" /> Save and Go to Records
                </Button>
              </div>
            </CardContent>
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 md:p-4">
      <header className="text-center p-4 mb-6 rounded-lg bg-blue-600 text-white shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
          <Stethoscope size={32} /> Freever
        </h1>
        <p>Clinical Decision Support for Fever Diagnosis</p>
      </header>

      <div className="flex items-center justify-between w-full max-w-3xl mx-auto mb-6">
        <StepIndicator step={0} title="Patient Data" />
        <div className={`flex-1 h-0.5 mx-2 ${currentStep > 0 ? "bg-blue-600" : "bg-gray-300"}`} />
        <StepIndicator step={1} title="Assessment" />
        <div className={`flex-1 h-0.5 mx-2 ${currentStep > 1 ? "bg-blue-600" : "bg-gray-300"}`} />
        <StepIndicator step={2} title="Lab Results" />
        <div className={`flex-1 h-0.5 mx-2 ${currentStep > 2 ? "bg-blue-600" : "bg-gray-300"}`} />
        <StepIndicator step={3} title="Calculation" />
        <div className={`flex-1 h-0.5 mx-2 ${currentStep > 3 ? "bg-blue-600" : "bg-gray-300"}`} />
        <StepIndicator step={4} title="Results" />
      </div>

      <Card className="w-full">{renderStepContent()}</Card>

      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>Freever - Clinical Decision Support Tool</p>
      </footer>
    </div>
  );
}

/** Default export: dibungkus proteksi */
export default function Page() {
  return (
    <Protected>
      <AssessmentContent />
    </Protected>
  );
}
