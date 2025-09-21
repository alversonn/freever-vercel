"use client";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Stethoscope, User, Thermometer, TestTube2 } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";

export default function HomePage() {
  // State untuk data diri pasien
  const [patientData, setPatientData] = useState({ 
    name: "", 
    age: "", 
    gender: "",
    dateOfBirth: "", // <-- Tambahkan ini
    address: ""      // <-- Tambahkan ini
  });

  // State untuk asesmen darurat
  const [pulseWeak, setPulseWeak] = useState<boolean | null>(null);
  const [consciousnessPoor, setConsciousnessPoor] = useState<boolean | null>(null);
  const [oxygenSaturation, setOxygenSaturation] = useState("");
  const [warningSigns, setWarningSigns] = useState({ nausea: false, vomiting: false, lossOfAppetite: false, severeBleeding: false, respiratoryProblems: false, seizure: false, severeDehydration: false, shockSign: false });

  // State untuk hasil tes darah
  const [leukocyteCount, setLeukocyteCount] = useState("");
  const [neutrophilCount, setNeutrophilCount] = useState("");
  const [lymphocyteCount, setLymphocyteCount] = useState("");
  const [crpLevel, setCrpLevel] = useState("");

  // State untuk durasi demam dan hasil
  const [feverDuration, setFeverDuration] = useState("");
  const [nlcrResult, setNlcrResult] = useState<number | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [stats, setStats] = useState<{ sensitivity: number; specificity: number } | null>(null);

  // Langkah saat ini dimulai dari 0 (Data Pasien)
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const calculateNLCR = (): number | null => {
    const neutrophil = parseFloat(neutrophilCount);
    const lymphocyte = parseFloat(lymphocyteCount);
    if (!isNaN(neutrophil) && !isNaN(lymphocyte) && lymphocyte !== 0) {
      const nlcr = neutrophil / lymphocyte;
      const roundedNlcr = parseFloat(nlcr.toFixed(2));
      setNlcrResult(roundedNlcr);
      return roundedNlcr;
    }
    return null;
  };

  const handleSaveData = async (resultData: { diagnosis: string, recommendation: string }) => {
    setIsLoading(true);
    // Panggil kalkulasi di sini untuk memastikan nilainya ada sebelum menyimpan
    const calculatedNlcr = calculateNLCR() ?? 0;

    const fullPatientData = {
      ...patientData,
      age: parseInt(patientData.age) || 0,
      dateOfBirth: new Date(patientData.dateOfBirth),
      pulseWeak: pulseWeak ?? false,
      consciousnessPoor: consciousnessPoor ?? false,
      oxygenSaturation: parseFloat(oxygenSaturation) || 0,
      leukocyteCount: parseFloat(leukocyteCount) || 0,
      neutrophilCount: parseFloat(neutrophilCount) || 0,
      lymphocyteCount: parseFloat(lymphocyteCount) || 0,
      crpLevel: parseFloat(crpLevel) || 0,
      feverDuration: parseInt(feverDuration) || 0,
      nlcrResult: calculatedNlcr,
      ...resultData,
    };

    try {
      await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPatientData),
      });
    } catch (error) {
      console.error("Failed to save data:", error);
      alert("Error: Could not save patient data.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmergencyReferral = async () => {
    const oxygenLevel = parseFloat(oxygenSaturation);
    const hasAnyWarningSign = Object.values(warningSigns).some((v) => v === true);
    const isEmergency = pulseWeak === true || consciousnessPoor === true || (!isNaN(oxygenLevel) && oxygenLevel <= 94) || hasAnyWarningSign;

    if (isEmergency) {
      const result = {
        diagnosis: "Emergency Referral",
        recommendation: "Patient shows signs requiring immediate hospital care.",
      };
      setDiagnosis(result.diagnosis);
      setRecommendation(result.recommendation);
      await handleSaveData(result);
      setCurrentStep(3);
    } else {
      setCurrentStep(2);
    }
  };
  
  const determineDiagnosis = async () => {
    const leukocyte = parseFloat(leukocyteCount);
    const crp = parseFloat(crpLevel);
    const duration = parseInt(feverDuration);
    const nlcr = calculateNLCR();

    if (isNaN(leukocyte) || isNaN(crp) || nlcr === null || isNaN(duration)) return;

    if (duration <= 5) setStats({ sensitivity: 94.3, specificity: 76.9 });
    else setStats({ sensitivity: 96.6, specificity: 89.2 });
    
    let result;
    if (leukocyte > 10000 || nlcr > 3.53 || crp > 40) {
      result = {
        diagnosis: "Bacterial Infection",
        recommendation: "Consider antibiotic treatment with appropriate dosage based on patient weight and condition.",
      };
    } else {
      result = {
        diagnosis: "Viral Infection",
        recommendation: "Recommend symptomatic treatment (paracetamol, etc.) and supplements. Avoid antibiotics.",
      };
    }
    setDiagnosis(result.diagnosis);
    setRecommendation(result.recommendation);
    await handleSaveData(result);
    setCurrentStep(4);
  };
  
  const resetForm = () => {
    setPatientData({ 
      name: "", 
      age: "", 
      gender: "",
      dateOfBirth: "", // <-- TAMBAHKAN INI
      address: ""      // <-- TAMBAHKAN INI
    });
    setPulseWeak(null);
    setConsciousnessPoor(null);
    setOxygenSaturation("");
    setWarningSigns({ nausea: false, vomiting: false, lossOfAppetite: false, severeBleeding: false, respiratoryProblems: false, seizure: false, severeDehydration: false, shockSign: false });
    setLeukocyteCount("");
    setNeutrophilCount("");
    setLymphocyteCount("");
    setCrpLevel("");
    setFeverDuration("");
    setNlcrResult(null);
    setDiagnosis("");
    setRecommendation("");
    setStats(null);
    setCurrentStep(0);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-0">
      <Card className="mb-8 bg-white shadow-md">
        <CardHeader className="text-center p-6">
          <CardTitle className="text-4xl text-blue-500 font-bold flex items-center justify-center gap-3">
            Freever
            <Stethoscope size={32} strokeWidth={2.5} />
          </CardTitle>
          <CardDescription>Clinical Decision Support for Fever Diagnosis</CardDescription>
        </CardHeader>
      </Card>

      {currentStep === 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold text-xl"><User size={24} />Step 0: Patient Information</CardTitle>
              <CardDescription>Enter the patient's personal data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Patient Name</Label>
                <Input id="name" value={patientData.name} onChange={(e) => setPatientData({...patientData, name: e.target.value})} className="mt-2" placeholder="e.g., Sabrina" />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input 
                  id="dateOfBirth" 
                  type="date" 
                  className="mt-2" 
                  value={patientData.dateOfBirth} 
                  onChange={(e) => setPatientData({...patientData, dateOfBirth: e.target.value})} 
                />
               </div>
      
              <div>
                <Label htmlFor="age">Age (years)</Label>
                <Input id="age" type="number" value={patientData.age} onChange={(e) => setPatientData({...patientData, age: e.target.value})} className="mt-2" placeholder="e.g., 35" />
              </div>
              <div>
                <Label>Gender</Label>
                <RadioGroup value={patientData.gender} onValueChange={(value) => setPatientData({...patientData, gender: value})} className="flex space-x-4 mt-2">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><Label htmlFor="male">Male</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><Label htmlFor="female">Female</Label></div>
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea // <-- Gunakan Textarea di sini
                  id="address" 
                  className="mt-2" 
                  value={patientData.address} 
                  onChange={(e) => setPatientData({...patientData, address: e.target.value})} 
                  placeholder="Enter patient's full address" 
                />
              </div>
              <div className="flex justify-end pt-4">
              <Button 
                onClick={() => setCurrentStep(1)} 
                disabled={
                  !patientData.name || 
                  !patientData.age || 
                  !patientData.gender || 
                  !patientData.dateOfBirth || // <-- TAMBAHKAN INI
                  !patientData.address         // <-- TAMBAHKAN INI
                }
              >
                Next
              </Button>
              </div>
            </CardContent>
          </Card>
      )}

      {currentStep === 1 && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2 font-bold text-xl"><Thermometer size={24} />Step 1: Emergency Assessment</CardTitle>
                <CardDescription>Evaluate patient for emergency signs requiring hospital referral</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                  <Label>Is the patient's pulse weak?</Label>
                  <RadioGroup value={pulseWeak === null ? "" : pulseWeak ? "yes" : "no"} onValueChange={(value) => setPulseWeak(value === "yes")} className="flex space-x-4 mt-2">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="pulse-yes" /><Label htmlFor="pulse-yes">Yes</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="pulse-no" /><Label htmlFor="pulse-no">No</Label></div>
                  </RadioGroup>
                </div>
                <div>
                  <Label>Is the patient's consciousness poor?</Label>
                  <RadioGroup value={consciousnessPoor === null ? "" : consciousnessPoor ? "yes" : "no"} onValueChange={(value) => setConsciousnessPoor(value === "yes")} className="flex space-x-4 mt-2">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="consciousness-yes" /><Label htmlFor="consciousness-yes">Yes</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="consciousness-no" /><Label htmlFor="consciousness-no">No</Label></div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="oxygen">Oxygen Saturation (%)</Label>
                  <Input id="oxygen" type="number" value={oxygenSaturation} onChange={(e) => setOxygenSaturation(e.target.value)} placeholder="Enter value" className="mt-2"/>
                </div>
                <div className="space-y-2">
                  <Label className="text-red-600 font-medium">Does the patient have warning signs? (Check all that apply)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {Object.entries(warningSigns).map(([key, value]) => {
                      const labels: { [key: string]: string } = {
                        nausea: "Nausea", vomiting: "Vomiting", lossOfAppetite: "Loss of Appetite", severeBleeding: "Severe Bleeding",
                        respiratoryProblems: "Severe Respiratory Problems", seizure: "Seizure", severeDehydration: "Severe Dehydration", shockSign: "Shock Sign",
                      };
                      return (
                        <div key={key} className="flex items-center space-x-2">
                          <input type="checkbox" id={key} checked={value} onChange={(e) => setWarningSigns({ ...warningSigns, [key]: e.target.checked })} className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"/>
                          <Label htmlFor={key} className="text-sm font-normal">{labels[key]}</Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(0)}>Back</Button>
                    <Button onClick={checkEmergencyReferral} disabled={pulseWeak === null || consciousnessPoor === null || oxygenSaturation === "" || isLoading}>
                        {isLoading ? 'Processing...' : 'Next'}
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-bold text-xl"><TestTube2 size={24} />Step 2: Blood Test Results</CardTitle>
                <CardDescription>Enter complete blood count and CRP results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="leukocyte">Leukocyte Count (cells/μL)</Label>
                    <Input id="leukocyte" type="number" value={leukocyteCount} onChange={(e) => setLeukocyteCount(e.target.value)} placeholder="e.g., 8500" className="mt-2"/>
                  </div>
                  <div>
                    <Label htmlFor="crp">CRP Level (mg/L)</Label>
                    <Input id="crp" type="number" value={crpLevel} onChange={(e) => setCrpLevel(e.target.value)} placeholder="e.g., 25" className="mt-2"/>
                  </div>
                  <div>
                    <Label htmlFor="neutrophil">Neutrophil Count (cells/μL)</Label>
                    <Input id="neutrophil" type="number" value={neutrophilCount} onChange={(e) => setNeutrophilCount(e.target.value)} placeholder="e.g., 5500" className="mt-2"/>
                  </div>
                  <div>
                    <Label htmlFor="lymphocyte">Lymphocyte Count (cells/μL)</Label>
                    <Input id="lymphocyte" type="number" value={lymphocyteCount} onChange={(e) => setLymphocyteCount(e.target.value)} placeholder="e.g., 2000" className="mt-2"/>
                  </div>
                </div>
                <div>
                  <Label htmlFor="duration">Fever Duration (days)</Label>
                  <Input id="duration" type="number" value={feverDuration} onChange={(e) => setFeverDuration(e.target.value)} placeholder="Enter number of days" className="mt-2"/>
                </div>
                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                    <Button onClick={determineDiagnosis} disabled={!leukocyteCount || !neutrophilCount || !lymphocyteCount || !crpLevel || !feverDuration || isLoading}>
                        {isLoading ? 'Processing...' : 'Determine Diagnosis'}
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card className="border-red-800 overflow-hidden p-0"> {/* <--- ADD p-0 */}
          <CardHeader className="bg-red-800 text-white p-0">
            <div className="px-6 py-4">
              <CardTitle className="text-2xl font-bold">Emergency Referral Required</CardTitle>
              <CardDescription className="text-white">
                Patient shows signs requiring immediate hospital care
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="p-4 bg-red-100 rounded-lg text-red-900">
              <p className="font-medium">Refer patient to the nearest hospital immediately.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                  {pulseWeak && <li>Weak pulse detected</li>}
                  {consciousnessPoor && <li>Poor consciousness level</li>}
                  {oxygenSaturation && parseFloat(oxygenSaturation) <= 94 && 
                    <li>Low oxygen saturation: {oxygenSaturation}% (≤94%)</li>}
                  {Object.values(warningSigns).some(value => value === true) && 
                    <li>
                      Presence of warning signs: {Object.entries(warningSigns)
                        .filter(([_, value]) => value)
                        .map(([key]) => {
                          const labels = {
                            nausea: 'Nausea',
                            vomiting: 'Vomiting',
                            lossOfAppetite: 'Loss of Appetite',
                            severeBleeding: 'Severe Bleeding',
                            respiratoryProblems: 'Severe Respiratory Problems',
                            seizure: 'Seizure',
                            severeDehydration: 'Severe Dehydration'
                          };
                          return labels[key as keyof typeof labels];
                        })
                        .join(', ')}
                    </li>}
                </ul>
              

              <p className="text-sm mt-2">All patient data has been saved to the records.</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={resetForm}>Start New Assessment</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card
          className={`${
            diagnosis === "Bacterial Infection" ? "border-red-800" : "border-blue-600"
          } overflow-hidden p-0`}
        >
          <CardHeader
            className={`${
              diagnosis === "Bacterial Infection" ? "bg-red-800 text-white" : "bg-blue-600 text-white"
            } p-0`}
          >
            <div className="px-6 py-4">
              <CardTitle className="text-2xl font-bold">Diagnosis Results</CardTitle>
              <CardDescription className="text-white">
                Based on clinical assessment and lab results
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Diagnosis: {diagnosis}</h3>
              <p>{recommendation}</p>
              {stats && (
                <div className="text-sm text-gray-600 mt-2">
                  <p>Statistical reliability for a fever of {parseInt(feverDuration) <= 5 ? "≤5 days" : ">5 days"}:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Sensitivity: {stats.sensitivity}%</li>
                    <li>Specificity: {stats.specificity}%</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">Blood Test Results:</p>
                  <ul className="mt-1 space-y-1">
                    <li>Leukocyte: {leukocyteCount} cells/μL</li>
                    <li>Neutrophil: {neutrophilCount} cells/μL</li>
                    <li>Lymphocyte: {lymphocyteCount} cells/μL</li>
                    <li>NLCR: {nlcrResult}</li>
                    <li>CRP: {crpLevel} mg/L</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">Clinical Information:</p>
                  <ul className="mt-1 space-y-1">
                    <li>Fever Duration: {feverDuration} days</li>
                    <li>Pulse: {pulseWeak ? 'Weak' : 'Normal'}</li>
                    <li>Consciousness: {consciousnessPoor ? 'Poor' : 'Normal'}</li>
                    <li>Oxygen Saturation: {oxygenSaturation}%</li>
                    <li>
                      Warning Signs: {Object.values(warningSigns).some(value => value) ? 
                        Object.entries(warningSigns)
                          .filter(([_, value]) => value)
                          .map(([key]) => {
                            const labels = {
                              nausea: 'Nausea',
                              vomiting: 'Vomiting',
                              lossOfAppetite: 'Loss of Appetite',
                              severeBleeding: 'Severe Bleeding',
                              respiratoryProblems: 'Respiratory Problems',
                              seizure: 'Seizure',
                              severeDehydration: 'Severe Dehydration'
                            };
                            return labels[key as keyof typeof labels];
                          })
                          .join(', ') 
                        : 'Absent'}
                    </li>
                  </ul>
                </div>
              </div>

             <p className="text-sm text-center text-gray-500">All patient data has been saved to the records.</p>
            <div className="flex justify-end">
              <Button onClick={resetForm}>Start New Assessment</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
