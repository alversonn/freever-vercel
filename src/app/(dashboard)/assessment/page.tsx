"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, FlaskConical, Stethoscope, Save, CircleCheck, User, Thermometer, TestTube2, FileText } from 'lucide-react';
import type { CheckedState } from "@radix-ui/react-checkbox";


// Tipe Data untuk form
interface FormData {
  name: string;
  age: string;
  gender: string;
  dateOfBirth: string;
  pulseWeak: boolean;
  consciousnessPoor: boolean;
  oxygenSaturation: number | string;
  nausea: boolean; vomiting: boolean; lossOfAppetite: boolean; severeBleeding: boolean;
  respiratoryProblems: boolean; seizure: boolean; severeDehydration: boolean; shockSign: boolean;
  leukocyteCount: number | string;
  neutrophilCount: number | string;
  lymphocyteCount: number | string;
  crpLevel: number | string | null;
  feverDuration: number | string;
  nlcrResult: number;
  diagnosis: string;
  recommendation: string;
  sensitivity: number;
  specificity: number;
}

const initialFormData: FormData = {
  name: '', age: '', gender: 'Male', dateOfBirth: '',
  pulseWeak: false, consciousnessPoor: false, oxygenSaturation: 98,
  nausea: false, vomiting: false, lossOfAppetite: false, severeBleeding: false,
  respiratoryProblems: false, seizure: false, severeDehydration: false, shockSign: false,
  leukocyteCount: '', neutrophilCount: '', lymphocyteCount: '', crpLevel: null, feverDuration: '',
  nlcrResult: 0, diagnosis: '', recommendation: '', sensitivity: 0, specificity: 0,
};

const initialWarningSignsState = {
  nausea: "Nausea (Mual)", vomiting: "Vomiting (Muntah)", lossOfAppetite: "No appetite (Tidak nafsu makan)", severeBleeding: "Severe bleeding (Pendarahan hebat)",
  respiratoryProblems: "Severe respiratory problems", seizure: "Seizures (Kejang)", severeDehydration: "Severe dehydration", shockSign: "Shock signs (Tanda-tanda syok)",
};

export default function NewAssessmentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prevData => ({ ...prevData, age: String(age >= 0 ? age : 0) }));
    } else {
      setFormData(prevData => ({ ...prevData, age: '' }));
    }
  }, [formData.dateOfBirth]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }));
  }, []);

  const handleCheckboxChange = <K extends keyof FormData>(
    key: K,
    v: CheckedState
  ) => {
    setFormData(prev => ({ ...prev, [key]: v === true }));
  }; 

  const handleGenderChange = useCallback((value: string) => {
    setFormData(prevData => ({ ...prevData, gender: value }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep === 1) {
        const oxygenLevel = Number(formData.oxygenSaturation);
        const hasAnyWarningSign = formData.nausea || formData.vomiting || formData.lossOfAppetite || formData.severeBleeding || formData.respiratoryProblems || formData.seizure || formData.severeDehydration || formData.shockSign;
        const isEmergency = formData.pulseWeak || formData.consciousnessPoor || (!isNaN(oxygenLevel) && oxygenLevel <= 94) || hasAnyWarningSign;

        if (isEmergency) {
            setFormData(prev => ({
                ...prev,
                diagnosis: 'Requires Immediate Referral',
                recommendation: 'Patient should be referred to the nearest hospital immediately',
            }));
            setCurrentStep(4);
            return;
        }
    }
    setCurrentStep(prev => prev + 1);
  }, [currentStep, formData]);
  
  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleCalculateResults = useCallback(() => {
    const { feverDuration, leukocyteCount, neutrophilCount, lymphocyteCount, crpLevel } = formData;
    let newResults = { ...formData };

    const leukocytesNum = Number(leukocyteCount);
    const neutrophilsNum = Number(neutrophilCount);
    const lymphocytesNum = Number(lymphocyteCount);
    const crpNum = crpLevel !== null && crpLevel !== '' ? Number(crpLevel) : 0;

    const nlcr = lymphocytesNum > 0 ? parseFloat((neutrophilsNum / lymphocytesNum).toFixed(2)) : 0;
    newResults.nlcrResult = nlcr;
    
    if (Number(feverDuration) <= 5) {
        newResults.sensitivity = 94.3;
        newResults.specificity = 76.9;
    } else {
        newResults.sensitivity = 96.6;
        newResults.specificity = 89.2;
    }

    const isBacterial = leukocytesNum > 10000 || nlcr >= 3.53 || (crpNum > 0 && crpNum >= 40);
    const isViral = leukocytesNum <= 10000 && nlcr < 3.53 && (crpNum === 0 || crpNum < 40);
    
    if (isBacterial) {
        newResults.diagnosis = 'Suspected Bacterial Infection';
        newResults.recommendation = 'Antibiotic therapy recommended with appropriate dosage';
    } else if (isViral) {
        newResults.diagnosis = crpNum === 0 ? 'Most probable viral infection' : 'Suspected viral infection';
        newResults.recommendation = crpNum === 0 
            ? 'Most probable viral infection. Symptomatic treatment (paracetamol, etc.) and supplements recommended. Consider CRP test for confirmation.'
            : 'Suspected viral infection. Symptomatic treatment (paracetamol, etc.) and supplements recommended';
    } else {
        newResults.diagnosis = 'Inconclusive';
        newResults.recommendation = 'Clinical judgment required. Consider additional tests or consultation.';
    }
    
    setFormData(newResults);
    setCurrentStep(4);
  }, [formData]);
  
  const handleNewAssessment = () => {
    setFormData(initialFormData);
    setCurrentStep(0);
  };
  
  const handleSaveAssessment = async () => {
    const dataToSave = {
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender,
        dateOfBirth: new Date(formData.dateOfBirth),
        pulseWeak: formData.pulseWeak,
        consciousnessPoor: formData.consciousnessPoor,
        oxygenSaturation: Number(formData.oxygenSaturation),
        nausea: formData.nausea,
        vomiting: formData.vomiting,
        lossOfAppetite: formData.lossOfAppetite,
        severeBleeding: formData.severeBleeding,
        respiratoryProblems: formData.respiratoryProblems,
        seizure: formData.seizure,
        severeDehydration: formData.severeDehydration,
        shockSign: formData.shockSign,
        leukocyteCount: Number(formData.leukocyteCount),
        neutrophilCount: Number(formData.neutrophilCount),
        lymphocyteCount: Number(formData.lymphocyteCount),
        crpLevel: formData.crpLevel === null || formData.crpLevel === '' ? null : Number(formData.crpLevel),
        feverDuration: Number(formData.feverDuration),
        nlcrResult: formData.nlcrResult,
        diagnosis: formData.diagnosis,
        recommendation: formData.recommendation,
        sensitivity: formData.sensitivity,
        specificity: formData.specificity,
    };
    try {
      const res = await fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSave) });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save assessment');
      }
      alert('Assessment saved successfully!');
      router.push('/records');
    } catch (error) {
      console.error("Save Error:", error);
      alert(`Failed to save assessment. Server says: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <CardHeader><CardTitle className="flex items-center gap-2 font-bold text-xl"><User size={24} /> Step 0: Patient Information</CardTitle><CardDescription>Enter the patient&apos;s personal data</CardDescription></CardHeader>
            <CardContent className="space-y-4 pt-6">
                <div><Label htmlFor="name">Patient Name</Label><Input id="name" name="name" className="mt-2" value={formData.name} onChange={handleInputChange} placeholder="e.g., John Doe" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="dateOfBirth">Date of Birth</Label><Input id="dateOfBirth" name="dateOfBirth" type="date" className="mt-2" value={formData.dateOfBirth} onChange={handleInputChange} /></div>
                  <div><Label htmlFor="age">Age (years)</Label><Input id="age" name="age" type="number" className="mt-2 bg-gray-100 cursor-not-allowed" value={formData.age} readOnly placeholder="Auto-calculated" /></div>
                </div>
                <div><Label>Gender</Label><RadioGroup value={formData.gender} onValueChange={handleGenderChange} className="flex space-x-4 mt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><Label htmlFor="male">Male</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><Label htmlFor="female">Female</Label></div></RadioGroup></div>
                <div className="flex justify-end pt-4"><Button onClick={handleNext} disabled={!formData.name || !formData.age || !formData.dateOfBirth}>Next</Button></div>
            </CardContent>
          </>
        );
      case 1:
        return (
          <>
            <CardHeader><CardTitle className="flex items-center gap-2 font-bold text-xl text-red-600"><Thermometer size={24} /> Step 1: Emergency Assessment</CardTitle><CardDescription>Evaluate patient for emergency signs requiring hospital referral</CardDescription></CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pulseWeak"
                    checked={formData.pulseWeak}
                    onCheckedChange={(v: CheckedState) => handleCheckboxChange("pulseWeak", v)}
                  />
                  <Label htmlFor="pulseWeak">Weak pulse (Nadi lemah)</Label>
                </div>
                  <div className="flex items-center space-x-2"><Checkbox id="consciousnessPoor" checked={formData.consciousnessPoor} onCheckedChange={(c) => handleCheckboxChange('consciousnessPoor', !!c)} /><Label htmlFor="consciousnessPoor">Poor consciousness (Kesadaran buruk)</Label></div>
                  <div className="flex items-center space-x-2 max-w-xs"><Label htmlFor="oxygenSaturation" className="whitespace-nowrap">Oxygen saturation (%):</Label><Input id="oxygenSaturation" name="oxygenSaturation" type="number" value={formData.oxygenSaturation} onChange={handleInputChange} /></div>
                </div>
                <div className="space-y-4 border-t pt-4">
                  <Label className="text-sm font-medium text-red-800">Warning Signs - Require Immediate Hospital Referral:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    {Object.entries(initialWarningSignsState).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox id={key} checked={formData[key as keyof FormData] as boolean} onCheckedChange={(c: boolean) => handleCheckboxChange(key as keyof FormData, c)} />
                        <Label htmlFor={key} className="text-sm font-normal">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between pt-4"><Button onClick={handleBack} variant="outline">Back</Button><Button onClick={handleNext}>Next</Button></div>
            </CardContent>
          </>
        );
      case 2:
        const isLabFormIncomplete = formData.feverDuration === '' || formData.leukocyteCount === '' || formData.neutrophilCount === '' || formData.lymphocyteCount === '';
        return (
          <>
            <CardHeader><CardTitle className="flex items-center gap-2 font-bold text-xl"><TestTube2 size={24} /> Step 2: Blood Test Results</CardTitle><CardDescription>Enter complete blood count and CRP results</CardDescription></CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                  <div><Label htmlFor="feverDuration">Days with fever:</Label><Input id="feverDuration" name="feverDuration" type="number" value={formData.feverDuration} onChange={handleInputChange} className="mt-1" required/></div>
                  <div><Label htmlFor="leukocyteCount">Leukocytes (cells/µL):</Label><Input id="leukocyteCount" name="leukocyteCount" type="number" value={formData.leukocyteCount} onChange={handleInputChange} className="mt-1" required/></div>
                  <div><Label htmlFor="neutrophilCount">Neutrophils (cells/µL):</Label><Input id="neutrophilCount" name="neutrophilCount" type="number" value={formData.neutrophilCount} onChange={handleInputChange} className="mt-1" required/></div>
                  <div><Label htmlFor="lymphocyteCount">Lymphocytes (cells/µL):</Label><Input id="lymphocyteCount" name="lymphocyteCount" type="number" value={formData.lymphocyteCount} onChange={handleInputChange} className="mt-1" required/></div>
                  <div className="md:col-span-2"><Label htmlFor="crpLevel">CRP (mg/L) - Optional:</Label><Input id="crpLevel" name="crpLevel" type="number" value={formData.crpLevel ?? ''} onChange={handleInputChange} className="mt-1" placeholder="Optional" /></div>
                </div>
              <div className="flex justify-between pt-4"><Button onClick={handleBack} variant="outline">Back</Button><Button onClick={handleNext} disabled={isLabFormIncomplete}>Next</Button></div>
            </CardContent>
          </>
        );
      case 3:
        return (
          <>
            <CardHeader><CardTitle className="flex items-center gap-2 font-bold text-xl"><FlaskConical size={22}/> Review and Calculate</CardTitle><CardDescription>Review the entered data before calculating.</CardDescription></CardHeader>
            <CardContent className="space-y-4 pt-6">
              <h4 className="font-semibold">Patient Data Summary:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm p-4 bg-gray-50 rounded-md">
                <p className="font-medium">Fever duration:</p> <p>{formData.feverDuration} days</p>
                <p className="font-medium">Leukocytes:</p> <p>{Number(formData.leukocyteCount).toLocaleString()} cells/µL</p>
                <p className="font-medium">Neutrophils:</p> <p>{Number(formData.neutrophilCount).toLocaleString()} cells/µL</p>
                <p className="font-medium">Lymphocytes:</p> <p>{Number(formData.lymphocyteCount).toLocaleString()} cells/µL</p>
                <p className="font-medium">CRP:</p> <p>{formData.crpLevel ? `${formData.crpLevel} mg/L` : 'Not Tested'}</p>
                <p className="font-medium">NLCR:</p> <p>{Number(formData.lymphocyteCount) > 0 ? (Number(formData.neutrophilCount) / Number(formData.lymphocyteCount)).toFixed(2) : 'N/A'}</p>
              </div>
              <div className="flex justify-between pt-6"><Button onClick={handleBack} variant="outline">Back</Button><Button onClick={handleCalculateResults} className="bg-green-600 hover:bg-green-700"><FlaskConical className="mr-2 h-4 w-4" /> Calculate Results</Button></div>
            </CardContent>
          </>
        );
      case 4:
        return (
          <>
            <CardHeader><CardTitle className="flex items-center gap-2 font-bold text-xl"><FileText size={22}/> Diagnosis Results</CardTitle><CardDescription>Based on the assessment, the diagnosis is:</CardDescription></CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className={`p-4 rounded-lg shadow-inner ${formData.diagnosis.includes('Referral') ? 'bg-red-50' : formData.diagnosis.includes('Bacterial') ? 'bg-orange-50' : 'bg-blue-50'}`}>
                <h4 className={`font-bold text-xl mb-2 flex items-center ${formData.diagnosis.includes('Referral') ? 'text-red-700' : formData.diagnosis.includes('Bacterial') ? 'text-orange-700' : 'text-blue-700'}`}>
                  {formData.diagnosis.includes('Referral') ? <AlertTriangle className="mr-2 h-6 w-6" /> : <Stethoscope className="mr-2 h-6 w-6" />}
                  {formData.diagnosis}
                </h4>
                <p>{formData.recommendation}</p>
                {!formData.diagnosis.includes('Referral') && (
                  <div className="mt-4 grid grid-cols-2 gap-x-4 text-sm text-gray-600">
                    <p><strong>NLCR:</strong> {formData.nlcrResult}</p>
                    <p><strong>Sensitivity:</strong> {formData.sensitivity}%</p>
                    <p><strong>Fever Duration:</strong> {formData.feverDuration} days</p>
                    <p><strong>Specificity:</strong> {formData.specificity}%</p>
                  </div>
                )}
              </div>
              {!formData.diagnosis.includes('Referral') && (
                <div className="mt-2">
                  <h5 className="font-semibold mb-2">Criteria Met:</h5>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    <li>Leukocytes {Number(formData.leukocyteCount) <= 10000 ? '≤' : '>'} 10,000 cells/μL</li>
                    <li>NLCR {formData.nlcrResult < 3.53 ? '<' : '≥'} 3.53</li>
                    <li>CRP {formData.crpLevel === null || formData.crpLevel === '' ? 'Not tested' : Number(formData.crpLevel) < 40 ? '< 40 mg/L' : '≥ 40 mg/L'}</li>
                  </ul>
                </div>
              )}
              <div className="flex justify-between pt-4">
                <Button onClick={handleNewAssessment} variant="outline"><CircleCheck className="mr-2 h-4 w-4" /> New Assessment</Button>
                <Button onClick={handleSaveAssessment}><Save className="mr-2 h-4 w-4" /> Save and Go to Records</Button>
              </div>
            </CardContent>
          </>
        );
      default: return null;
    }
  };

  const StepIndicator = ({ step, title }: { step: number; title: string }) => (
    <div className={`flex items-center gap-2 ${currentStep >= step ? 'text-blue-600' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${currentStep >= step ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-gray-50'}`}>{step}</div>
      <span className="hidden sm:inline">{title}</span>
    </div>
  );
  
  return (
    <div className="w-full max-w-4xl mx-auto p-2 md:p-4">
        <header className="text-center p-4 mb-6 rounded-lg bg-blue-600 text-white shadow-lg">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2"><Stethoscope size={32}/> Freever</h1>
            <p>Clinical Decision Support for Fever Diagnosis</p>
        </header>

        <div className="flex items-center justify-between w-full max-w-3xl mx-auto mb-6">
            <StepIndicator step={0} title="Patient Data" />
            <div className={`flex-1 h-0.5 mx-2 ${currentStep > 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <StepIndicator step={1} title="Assessment" />
            <div className={`flex-1 h-0.5 mx-2 ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <StepIndicator step={2} title="Lab Results" />
            <div className={`flex-1 h-0.5 mx-2 ${currentStep > 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <StepIndicator step={3} title="Calculation" />
            <div className={`flex-1 h-0.5 mx-2 ${currentStep > 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <StepIndicator step={4} title="Results" />
        </div>

        <Card className="w-full">
            {renderStepContent()}
        </Card>
        
        <footer className="mt-8 text-center text-gray-500 text-sm">
            <p>Freever - Clinical Decision Support Tool</p>
        </footer>
    </div>
  );
}