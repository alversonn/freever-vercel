// src/app/signup/page.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    birthPlace: "",
    dateOfBirth: "",
    gender: "Male",
    institution: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  // Semua required: email & phone wajib dua-duanya, password wajib & harus sama.
  const canSubmit =
    form.name.trim() &&
    form.username.trim() &&
    form.email.trim() &&                 // wajib
    form.phone.trim() &&                 // wajib
    form.birthPlace.trim() &&            // wajib
    form.institution.trim() &&           // wajib
    form.dateOfBirth &&
    form.password !== "" &&              // wajib
    form.password === form.confirmPassword;

  const onSubmit = async () => {
    setErr(null);
    if (!canSubmit) {
      setErr(
        "Please fill all required fields. Email and phone are both required. Passwords must match."
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          birthPlace: form.birthPlace.trim(),
          dateOfBirth: form.dateOfBirth, // kirim string yyyy-mm-dd
          gender: form.gender,
          institution: form.institution.trim(),
          password: form.password,                // wajib
          confirmPassword: form.confirmPassword,  // wajib & harus sama
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sign up");
      }
      // Setelah signup sukses -> balik ke halaman login
      router.replace("/login");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            {/* Pastikan file logo ada di /public/freever-logo.png */}
            <Image
              src="/freever-logo.png"
              alt="Freever"
              width={180}
              height={180}
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-700">
            Create your account
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {err && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {err}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" value={form.name} onChange={onChange} required />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" value={form.username} onChange={onChange} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={onChange} required />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" value={form.phone} onChange={onChange} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="birthPlace">Birth place</Label>
                <Input id="birthPlace" name="birthPlace" value={form.birthPlace} onChange={onChange} required />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of birth</Label>
                <Input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={onChange} required />
              </div>
            </div>

            <div>
              <Label>Gender</Label>
              <div className="flex gap-4 mt-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={form.gender === "Male"}
                    onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                  />
                  Male
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={form.gender === "Female"}
                    onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                  />
                  Female
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="institution">Institution</Label>
              <Input id="institution" name="institution" value={form.institution} onChange={onChange} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" value={form.password} onChange={onChange} required />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={onChange}
                  required
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!canSubmit || submitting}
            onClick={onSubmit}
          >
            {submitting ? "Creating..." : "Sign up"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-700 underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
