"use client";
import React, { useEffect, useState, useCallback, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Save, Trash2, Edit, X, ChevronLeft } from 'lucide-react';

// Tipe Data lengkap untuk mencakup semua field
interface PatientRecord {
  id: number;
  name: string;
  age: number;
  gender: string;
  dateOfBirth: string;

  pulseWeak: boolean;
  consciousnessPoor: boolean;
  oxygenSaturation: number;
  leukocyteCount: number;
  neutrophilCount: number;
  lymphocyteCount: number;
  crpLevel: number;
  feverDuration: number;
  nlcrResult: number;
  diagnosis: string;
  recommendation: string;
}

const initialWarningSigns = {
    nausea: false, vomiting: false, lossOfAppeite: false, severeBleeding: false,
    respiratoryProblems: false, seizure: false, severeDehydration: false, shockSign: false,
};

// Komponen DetailField yang sudah di-memoized untuk performa
const DetailField = memo(function DetailField({ label, name, value, type = 'text', isEditing, formData, handleInputChange }: {
  label: string;
  name: keyof PatientRecord;
  value: any;
  type?: string;
  isEditing: boolean;
  formData: Partial<PatientRecord>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div>
      <Label htmlFor={name} className="text-sm font-semibold">{label}</Label>
      {isEditing ? (
        type === 'textarea' ? (
          <Textarea id={name} name={name} defaultValue={formData[name as keyof typeof formData] as string || ''} onChange={handleInputChange} className="mt-1" />
        ) : (
          <Input id={name} name={name} type={type} defaultValue={formData[name as keyof typeof formData] as any || ''} onChange={handleInputChange} className="mt-1" />
        )
      ) : (
        <p className="mt-1 p-2 bg-gray-100 rounded-md min-h-[40px]">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</p>
      )}
    </div>
  );
});
DetailField.displayName = 'DetailField'; // Nama untuk debugging

export default function RecordDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [record, setRecord] = useState<PatientRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<PatientRecord>>({});
  const [warningSigns, setWarningSigns] = useState(initialWarningSigns);
  const [isEmergencyCase, setIsEmergencyCase] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const oxygenLevel = Number(formData.oxygenSaturation);
      const hasAnyWarningSign = Object.values(warningSigns).some(v => v === true);
      const isEmergency = 
        formData.pulseWeak === true || 
        formData.consciousnessPoor === true || 
        (!isNaN(oxygenLevel) && oxygenLevel <= 94) ||
        hasAnyWarningSign;
      setIsEmergencyCase(isEmergency);
    }
  }, [formData.pulseWeak, formData.consciousnessPoor, formData.oxygenSaturation, isEditing, warningSigns]);

  useEffect(() => {
    if (id) {
      const fetchRecord = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/patients/${id}`);
          if (!res.ok) throw new Error('Failed to fetch record');
          const data = await res.json();
          setRecord(data);
          setFormData(data);
          setIsEmergencyCase(data.diagnosis === 'Emergency Referral');
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRecord();
    }
  }, [id]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: type === 'number' ? Number(value) : value }));
  }, []);

  const handleRadioChange = useCallback((name: keyof PatientRecord, value: string) => {
    setFormData(prevData => ({ ...prevData, [name]: value === 'yes' }));
  }, []);

  const handleUpdate = async () => {
    if (!id) return;
    const finalFormData = { ...formData };

    const oxygenLevel = Number(finalFormData.oxygenSaturation);
    const hasAnyWarningSign = Object.values(warningSigns).some(v => v === true);
    const isEmergency = 
        finalFormData.pulseWeak === true || 
        finalFormData.consciousnessPoor === true || 
        (!isNaN(oxygenLevel) && oxygenLevel <= 94) ||
        hasAnyWarningSign;

    if (isEmergency) {
        finalFormData.diagnosis = "Emergency Referral";
        finalFormData.recommendation = "Patient shows signs requiring immediate hospital care.";
        finalFormData.leukocyteCount = 0;
        finalFormData.neutrophilCount = 0;
        finalFormData.lymphocyteCount = 0;
        finalFormData.crpLevel = 0;
        finalFormData.feverDuration = 0;
        finalFormData.nlcrResult = 0;
    } else {
        const leukocyte = Number(finalFormData.leukocyteCount);
        const neutrophil = Number(finalFormData.neutrophilCount);
        const lymphocyte = Number(finalFormData.lymphocyteCount);
        const crp = Number(finalFormData.crpLevel);
        let nlcr = 0;
        if (lymphocyte !== 0) {
            nlcr = parseFloat((neutrophil / lymphocyte).toFixed(2));
            finalFormData.nlcrResult = nlcr;
        }

        if (leukocyte > 10000 || nlcr > 3.53 || crp > 40) {
            finalFormData.diagnosis = "Bacterial Infection";
            finalFormData.recommendation = "Consider antibiotic treatment with appropriate dosage based on patient weight and condition.";
        } else {
            finalFormData.diagnosis = "Viral Infection";
            finalFormData.recommendation = "Recommend symptomatic treatment (paracetamol, etc.) and supplements. Avoid antibiotics.";
        }
    }

    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...finalFormData,
          dateOfBirth: finalFormData.dateOfBirth ? new Date(finalFormData.dateOfBirth) : undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to update record');
      const updatedRecord = await res.json();
      setRecord(updatedRecord);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert('Failed to update record.');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this record permanently?')) return;
    try {
      await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      router.push('/records');
    } catch (error) {
      console.error(error);
      alert('Failed to delete record.');
    }
  };
  
  if (isLoading) return <p>Loading record...</p>;
  if (!record) return <p>Record not found.</p>;

  return (
    <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
            <Link href="/records">
              <Button variant="outline" size="sm">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Records
              </Button>
            </Link>
            <div className="flex gap-2">
            {isEditing ? (
                <>
                <Button onClick={handleUpdate} size="sm"><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                <Button onClick={() => { setIsEditing(false); setFormData(record); }} size="sm" variant="outline"><X className="mr-2 h-4 w-4" /> Cancel</Button>
                </>
            ) : (
                <Button onClick={() => setIsEditing(true)} size="sm"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
            )}
            </div>
        </div>
      
        <Card>
            <CardHeader>
                <CardTitle>Patient Record Details</CardTitle>
                <CardDescription>View and edit patient data for: {record.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <section>
                    <h3 className="font-bold text-lg mb-4 border-b pb-2">Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <DetailField label="Patient Name" name="name" value={record.name} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} />
                        <DetailField label="Age" name="age" value={record.age} type="number" isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} />
                        <DetailField label="Date of Birth" name="dateOfBirth" value={new Date(record.dateOfBirth).toISOString().split('T')[0]} type="date" isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} />
                        <div>
                            <Label className="text-sm font-semibold">Gender</Label>
                            {isEditing ? (
                            <RadioGroup value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})} className="flex space-x-4 mt-2">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><Label htmlFor="male">Male</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><Label htmlFor="female">Female</Label></div>
                            </RadioGroup>
                            ) : <p className="mt-1 p-2 bg-gray-100 rounded-md">{record.gender}</p> }
                        </div>
                        
                    </div>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-4 border-b pb-2">Clinical Assessment</h3>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <Label className="text-sm font-semibold">Weak Pulse?</Label>
                            {isEditing ? (
                            <RadioGroup value={formData.pulseWeak ? 'yes' : 'no'} onValueChange={(v) => handleRadioChange('pulseWeak', v)} className="flex space-x-4 mt-2">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="pulse-yes" /><Label htmlFor="pulse-yes">Yes</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="pulse-no" /><Label htmlFor="pulse-no">No</Label></div>
                            </RadioGroup>
                            ) : <p className="mt-1 p-2 bg-gray-100 rounded-md">{record.pulseWeak ? 'Yes' : 'No'}</p>}
                        </div>
                        <div>
                            <Label className="text-sm font-semibold">Poor Consciousness?</Label>
                            {isEditing ? (
                            <RadioGroup value={formData.consciousnessPoor ? 'yes' : 'no'} onValueChange={(v) => handleRadioChange('consciousnessPoor', v)} className="flex space-x-4 mt-2">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="con-yes" /><Label htmlFor="con-yes">Yes</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="con-no" /><Label htmlFor="con-no">No</Label></div>
                            </RadioGroup>
                            ) : <p className="mt-1 p-2 bg-gray-100 rounded-md">{record.consciousnessPoor ? 'Yes' : 'No'}</p>}
                        </div>
                        <DetailField label="Oxygen Saturation (%)" name="oxygenSaturation" value={record.oxygenSaturation} type="number" isEditing={isEditing} formData={formData} handleInputChange={handleInputChange}/>
                    </div>

                    <div className="space-y-2 mb-6">
                        <Label className="text-sm font-semibold text-red-600">Warning Signs</Label>
                        {isEditing ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-2">
                                {Object.keys(warningSigns).map((key) => {
                                    const labels: { [key: string]: string } = {
                                        nausea: "Nausea", vomiting: "Vomiting", lossOfAppeite: "Loss of Appetite", severeBleeding: "Severe Bleeding",
                                        respiratoryProblems: "Resp. Problems", seizure: "Seizure", severeDehydration: "Dehydration", shockSign: "Shock Sign",
                                    };
                                    return (
                                        <div key={key} className="flex items-center space-x-2">
                                            <input type="checkbox" id={`edit-${key}`} checked={warningSigns[key as keyof typeof warningSigns]} onChange={(e) => setWarningSigns({ ...warningSigns, [key]: e.target.checked })} className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"/>
                                            <Label htmlFor={`edit-${key}`} className="text-sm font-normal">{labels[key]}</Label>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="mt-1 p-2 bg-gray-100 rounded-md text-sm">No warning signs were recorded for this diagnosis.</p>
                        )}
                    </div>
                    
                    <fieldset disabled={isEditing && isEmergencyCase} className="transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        <h4 className="font-semibold mb-2 text-gray-800">Blood Test Results</h4>
                        {isEditing && isEmergencyCase && (
                            <p className="text-sm text-red-600 mb-2">Blood test data cannot be edited for emergency referral cases.</p>
                        )}
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <DetailField label="Leukocyte" name="leukocyteCount" value={record.leukocyteCount} type="number" isEditing={isEditing} formData={formData} handleInputChange={handleInputChange}/>
                            <DetailField label="Neutrophil" name="neutrophilCount" value={record.neutrophilCount} type="number" isEditing={isEditing} formData={formData} handleInputChange={handleInputChange}/>
                            <DetailField label="Lymphocyte" name="lymphocyteCount" value={record.lymphocyteCount} type="number" isEditing={isEditing} formData={formData} handleInputChange={handleInputChange}/>
                            <DetailField label="NLCR" name="nlcrResult" value={record.nlcrResult} type="number" isEditing={isEditing} formData={formData} handleInputChange={handleInputChange}/>
                            <DetailField label="CRP Level" name="crpLevel" value={record.crpLevel} type="number" isEditing={isEditing} formData={formData} handleInputChange={handleInputChange}/>
                            <DetailField label="Fever Duration (days)" name="feverDuration" value={record.feverDuration} type="number" isEditing={isEditing} formData={formData} handleInputChange={handleInputChange}/>
                        </div>
                    </fieldset>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 border-b pb-2">Diagnosis Result</h3>
                    <div className={`p-4 rounded-lg ${record.diagnosis === 'Emergency Referral' ? 'bg-red-100' : 'bg-blue-100'}`}>
                        <h4 className="font-bold">Diagnosis: {record.diagnosis}</h4>
                        <p>Recommendation: {record.recommendation}</p>
                    </div>
                </section>
                
                <section className="pt-4 border-t">
                    <div className="flex justify-end">
                        <Button onClick={handleDelete} variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete This Record
                        </Button>
                    </div>
                </section>
            </CardContent>
        </Card>
    </div>
  );
}